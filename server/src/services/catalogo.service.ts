import { connCiss } from '../database/ciss.database'
import { querySupabase } from '../database/supabase.database'
import { loadQuery } from './query.service'

export interface ProdutoCatalogo {
    CODIGO_PRODUTO: number
    DESCRICAO: string
    SECAO: string | null
    INATIVO: string
    PRECO: number | null
    ESTOQUE: number
}

function codigosProdutoValidos(codigos: number[]) {
    return codigos.filter((codigo) => Number.isInteger(codigo) && codigo > 0)
}

export async function getProdutosPorCodigo(codigos: number[]): Promise<ProdutoCatalogo[]> {
    const validos = codigosProdutoValidos(codigos)
    if (validos.length === 0) return []

    const sql = loadQuery('catalogo', 'produtos_por_codigo.sql').replaceAll('{{CODIGOS}}', validos.join(','))

    const conn = await connCiss()
    try {
        return await conn.query(sql)
    } finally {
        await conn.close()
    }
}

export async function getProdutosDoCatalogo(catalogoId: string): Promise<ProdutoCatalogo[]> {
    const referencias = await querySupabase<{ codigo_produto_ciss: number }>(
        'SELECT codigo_produto_ciss FROM televendas.catalogo_produtos WHERE catalogo_id = $1',
        [catalogoId]
    )

    return getProdutosPorCodigo(referencias.map((r) => r.codigo_produto_ciss))
}
