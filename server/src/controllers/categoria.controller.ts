import type { FastifyRequest, FastifyReply } from 'fastify'
import { requireAdmin } from '../middlewares/auth.middlewares'
import { connCiss } from '../database/ciss.database'
import { querySupabase } from '../database/supabase.database'
import { loadQuery } from '../services/query.service'
import { getProdutosPorCodigo } from '../services/produto.service'

interface Categoria {
    id: string
    nome: string
}

interface CategoriaParams {
    id: string
}

interface ProdutoParams {
    codigo: string
}

export async function listCategorias(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const categorias = await querySupabase<Categoria>('SELECT id, nome FROM televendas.categorias ORDER BY nome')
    res.send(categorias)
}

export async function createCategoria(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { nome } = req.body as { nome?: string }
    if (!nome || !nome.trim()) {
        res.code(400).send({ error: 'Informe o nome da categoria.' })
        return
    }

    const [categoria] = await querySupabase<Categoria>(
        'INSERT INTO televendas.categorias (nome) VALUES ($1) RETURNING id, nome',
        [nome.trim()]
    )
    res.code(201).send(categoria)
}

export async function deleteCategoria(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { id } = req.params as CategoriaParams
    await querySupabase('DELETE FROM televendas.categorias WHERE id = $1', [id])
    res.code(204).send()
}

export async function buscarProdutosCiss(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { q } = req.query as { q?: string }
    if (!q || !q.trim()) {
        res.code(400).send({ error: 'Informe um termo de busca (nome ou código do produto).' })
        return
    }

    const termo = q.trim()
    const sql = loadQuery('produto', 'buscar_produtos.sql')

    const conn = await connCiss()
    try {
        const data = await conn.query(sql, [`%${termo}%`, termo])
        res.send(data)
    } finally {
        await conn.close()
    }
}

export async function listProdutos(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const registros = await querySupabase<{ codigo_produto_ciss: number; preco_promocional: string | null }>(
        'SELECT codigo_produto_ciss, preco_promocional FROM televendas.produtos ORDER BY criado_em DESC'
    )

    const categoriasPorProduto = await querySupabase<{ produto_codigo: number; id: string; nome: string }>(
        `SELECT pc.produto_codigo, c.id, c.nome
         FROM televendas.produto_categorias pc
         JOIN televendas.categorias c ON c.id = pc.categoria_id
         ORDER BY c.nome`
    )

    const produtosCiss = await getProdutosPorCodigo(registros.map((r) => r.codigo_produto_ciss))
    const produtosPorCodigo = new Map(produtosCiss.map((p) => [p.CODIGO_PRODUTO, p]))

    const produtos = registros.map((registro) => ({
        codigo_produto_ciss: registro.codigo_produto_ciss,
        preco_promocional: registro.preco_promocional != null ? Number(registro.preco_promocional) : null,
        categorias: categoriasPorProduto
            .filter((c) => c.produto_codigo === registro.codigo_produto_ciss)
            .map((c) => ({ id: c.id, nome: c.nome })),
        ciss: produtosPorCodigo.get(registro.codigo_produto_ciss) ?? null,
    }))

    res.send(produtos)
}

export async function createProduto(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { codigoProduto, categoriaIds, precoPromocional } = req.body as {
        codigoProduto?: number
        categoriaIds?: string[]
        precoPromocional?: number | null
    }

    if (!Number.isInteger(codigoProduto)) {
        res.code(400).send({ error: 'Informe o código do produto.' })
        return
    }

    await querySupabase(
        `INSERT INTO televendas.produtos (codigo_produto_ciss, preco_promocional)
         VALUES ($1, $2)
         ON CONFLICT (codigo_produto_ciss) DO UPDATE SET preco_promocional = $2`,
        [codigoProduto, precoPromocional ?? null]
    )

    for (const categoriaId of categoriaIds ?? []) {
        await querySupabase(
            `INSERT INTO televendas.produto_categorias (produto_codigo, categoria_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [codigoProduto, categoriaId]
        )
    }

    res.code(201).send({ ok: true })
}

export async function updateProduto(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { codigo } = req.params as ProdutoParams
    const codigoProduto = Number(codigo)
    const { categoriaIds, precoPromocional } = req.body as {
        categoriaIds?: string[]
        precoPromocional?: number | null
    }

    if (precoPromocional !== undefined) {
        await querySupabase('UPDATE televendas.produtos SET preco_promocional = $1 WHERE codigo_produto_ciss = $2', [
            precoPromocional,
            codigoProduto,
        ])
    }

    if (categoriaIds !== undefined) {
        await querySupabase('DELETE FROM televendas.produto_categorias WHERE produto_codigo = $1', [codigoProduto])

        for (const categoriaId of categoriaIds) {
            await querySupabase(
                'INSERT INTO televendas.produto_categorias (produto_codigo, categoria_id) VALUES ($1, $2)',
                [codigoProduto, categoriaId]
            )
        }
    }

    res.send({ ok: true })
}

export async function deleteProduto(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { codigo } = req.params as ProdutoParams
    await querySupabase('DELETE FROM televendas.produtos WHERE codigo_produto_ciss = $1', [Number(codigo)])
    res.code(204).send()
}

export async function getImagemProduto(req: FastifyRequest, res: FastifyReply) {
    const { codigoProduto } = req.params as { codigoProduto: string }
    const codigo = Number(codigoProduto)

    if (!Number.isInteger(codigo)) {
        res.code(400).send({ error: 'Código de produto inválido.' })
        return
    }

    const sql = loadQuery('produto', 'imagem_produto.sql')

    const conn = await connCiss()
    let foto: Buffer | undefined
    try {
        const [linha] = (await conn.query(sql, [codigo, codigo])) as { FOTO: Buffer | null }[]
        foto = linha?.FOTO ?? undefined
    } finally {
        await conn.close()
    }

    if (!foto || foto.length === 0) {
        res.code(404).send()
        return
    }

    const isPng = foto[0] === 0x89 && foto[1] === 0x50
    res.header('Cache-Control', 'public, max-age=86400')
    res.type(isPng ? 'image/png' : 'image/jpeg')
    res.send(foto)
}
