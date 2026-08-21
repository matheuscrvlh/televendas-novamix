import type { FastifyRequest, FastifyReply } from 'fastify'
import { requireAdmin } from '../middlewares/auth.middlewares'
import { connCiss } from '../database/ciss.database'
import { querySupabase } from '../database/supabase.database'
import { loadQuery } from '../services/query.service'
import { getProdutosDoCatalogo } from '../services/catalogo.service'

interface Catalogo {
    id: string
    nome: string
}

interface CatalogoParams {
    catalogoId: string
}

interface ProdutoParams extends CatalogoParams {
    codigoProduto: string
}

export async function listCatalogos(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const catalogos = await querySupabase<Catalogo>(
        'SELECT id, nome FROM televendas.catalogos ORDER BY nome'
    )
    res.send(catalogos)
}

export async function createCatalogo(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { nome } = req.body as { nome?: string }
    if (!nome || !nome.trim()) {
        res.code(400).send({ error: 'Informe o nome do catálogo.' })
        return
    }

    const [catalogo] = await querySupabase<Catalogo>(
        'INSERT INTO televendas.catalogos (nome) VALUES ($1) RETURNING id, nome',
        [nome.trim()]
    )
    res.code(201).send(catalogo)
}

export async function buscarProdutosCiss(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { q } = req.query as { q?: string }
    if (!q || !q.trim()) {
        res.code(400).send({ error: 'Informe um termo de busca (nome ou código do produto).' })
        return
    }

    const termo = q.trim()
    const sql = loadQuery('catalogo', 'buscar_produtos.sql')

    const conn = await connCiss()
    try {
        const data = await conn.query(sql, [`%${termo}%`, termo])
        res.send(data)
    } finally {
        await conn.close()
    }
}

export async function listProdutosCatalogo(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { catalogoId } = req.params as CatalogoParams
    res.send(await getProdutosDoCatalogo(catalogoId))
}

export async function addProdutoCatalogo(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { catalogoId } = req.params as CatalogoParams
    const { codigoProduto } = req.body as { codigoProduto?: number }

    if (!Number.isInteger(codigoProduto)) {
        res.code(400).send({ error: 'Informe o código do produto.' })
        return
    }

    await querySupabase(
        `INSERT INTO televendas.catalogo_produtos (catalogo_id, codigo_produto_ciss)
         VALUES ($1, $2)
         ON CONFLICT (catalogo_id, codigo_produto_ciss) DO NOTHING`,
        [catalogoId, codigoProduto]
    )
    res.code(201).send({ ok: true })
}

export async function removeProdutoCatalogo(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { catalogoId, codigoProduto } = req.params as ProdutoParams

    await querySupabase(
        'DELETE FROM televendas.catalogo_produtos WHERE catalogo_id = $1 AND codigo_produto_ciss = $2',
        [catalogoId, Number(codigoProduto)]
    )
    res.code(204).send()
}

export async function getImagemProduto(req: FastifyRequest, res: FastifyReply) {
    const { codigoProduto } = req.params as { codigoProduto: string }
    const codigo = Number(codigoProduto)

    if (!Number.isInteger(codigo)) {
        res.code(400).send({ error: 'Código de produto inválido.' })
        return
    }

    const sql = loadQuery('catalogo', 'imagem_produto.sql')

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
