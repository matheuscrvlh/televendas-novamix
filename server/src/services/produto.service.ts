import { connCiss } from '../database/ciss.database'
import { querySupabase } from '../database/supabase.database'
import { loadQuery } from './query.service'

export interface ProdutoCatalogo {
    CODIGO_PRODUTO: number
    DESCRICAO: string
    SECAO: string | null
    INATIVO: string
    PRECO: number | null
    PRECO_ORIGINAL: number | null
    ESTOQUE: number
}

function codigosProdutoValidos(codigos: number[]) {
    return codigos.filter((codigo) => Number.isInteger(codigo) && codigo > 0)
}

/**
 * Preço final = preço promocional do produto (se tiver) > preço CISS com desconto geral aplicado
 * (se houver % configurado) > preço CISS puro. É a mesma regra usada pra exibir na loja e pra cobrar
 * no pedido - nunca diverge, porque os dois passam por aqui.
 */
async function calcularPrecoFinal(produtos: ProdutoCatalogo[]) {
    const codigos = produtos.map((p) => p.CODIGO_PRODUTO)
    if (codigos.length === 0) return produtos

    const precosPromocionais = await querySupabase<{ codigo_produto_ciss: number; preco_promocional: string }>(
        `SELECT codigo_produto_ciss, preco_promocional
         FROM televendas.produtos
         WHERE codigo_produto_ciss = ANY($1) AND preco_promocional IS NOT NULL`,
        [codigos]
    )
    const promocionalPorCodigo = new Map(precosPromocionais.map((p) => [p.codigo_produto_ciss, Number(p.preco_promocional)]))

    const [config] = await querySupabase<{ desconto_percentual: string }>(
        'SELECT desconto_percentual FROM televendas.config_vendedores LIMIT 1'
    )
    const descontoPercentual = Number(config?.desconto_percentual ?? 0)

    return produtos.map((produto) => {
        const precoOriginal = produto.PRECO
        const promocional = promocionalPorCodigo.get(produto.CODIGO_PRODUTO)

        let precoFinal = precoOriginal
        if (promocional != null) {
            precoFinal = promocional
        } else if (precoOriginal != null && descontoPercentual > 0) {
            precoFinal = Number((precoOriginal * (1 - descontoPercentual / 100)).toFixed(2))
        }

        return { ...produto, PRECO: precoFinal, PRECO_ORIGINAL: precoOriginal }
    })
}

export async function getProdutosPorCodigo(codigos: number[]): Promise<ProdutoCatalogo[]> {
    const validos = codigosProdutoValidos(codigos)
    if (validos.length === 0) return []

    const sql = loadQuery('produto', 'produtos_por_codigo.sql').replaceAll('{{CODIGOS}}', validos.join(','))

    const conn = await connCiss()
    let produtos: ProdutoCatalogo[]
    try {
        produtos = await conn.query(sql)
    } finally {
        await conn.close()
    }

    return calcularPrecoFinal(produtos)
}

export async function getProdutosDaCategoria(categoriaId: string): Promise<ProdutoCatalogo[]> {
    const referencias = await querySupabase<{ produto_codigo: number }>(
        'SELECT produto_codigo FROM televendas.produto_categorias WHERE categoria_id = $1',
        [categoriaId]
    )

    return getProdutosPorCodigo(referencias.map((r) => r.produto_codigo))
}
