import type { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { connCiss } from '../database/ciss.database'
import { querySupabase, withTransaction } from '../database/supabase.database'
import { loadQuery } from '../services/query.service'
import { getProdutosPorCodigo } from '../services/produto.service'
import { sqlComVendedores } from '../services/vendedores.service'
import { signClienteToken } from '../utils/jwt'
import { encrypt, decryptNullable } from '../utils/crypto'

const QTD_MAIS_VENDIDOS = 12

const COOKIE_OPTIONS = {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
}

interface Cliente {
    id: string
    codigo_cliente_ciss: number
    razao_social: string
    email: string
    telefone: string | null
}

interface ClienteComSenha extends Cliente {
    senha_hash: string
}

function apenasDigitos(valor: string) {
    return valor.replace(/\D/g, '')
}

function clienteResumo(cliente: Cliente) {
    return {
        id: cliente.id,
        razaoSocial: cliente.razao_social,
        email: cliente.email,
        telefone: decryptNullable(cliente.telefone),
    }
}

export async function cadastrarCliente(req: FastifyRequest, res: FastifyReply) {
    const { cnpjCpf, email, senha, telefone } = req.body as {
        cnpjCpf?: string
        email?: string
        senha?: string
        telefone?: string
    }

    if (!cnpjCpf || !email || !senha) {
        res.code(400).send({ error: 'Informe CNPJ/CPF, e-mail e senha.' })
        return
    }

    if (senha.length < 6) {
        res.code(400).send({ error: 'A senha precisa ter pelo menos 6 caracteres.' })
        return
    }

    const documento = apenasDigitos(cnpjCpf)

    const [emailExistente] = await querySupabase<{ id: string }>(
        'SELECT id FROM televendas.clientes WHERE email = $1',
        [email.toLowerCase().trim()]
    )
    if (emailExistente) {
        res.code(409).send({ error: 'Já existe um cadastro com esse e-mail.' })
        return
    }

    const conn = await connCiss()
    let clienteCiss: { IDCLIFOR: number; NOME: string; FLAGINATIVO: string } | undefined
    try {
        const sql = loadQuery('cliente', 'buscar_por_documento.sql')
        ;[clienteCiss] = await conn.query(sql, [documento])
    } finally {
        await conn.close()
    }

    if (!clienteCiss) {
        res.code(404).send({ error: 'CNPJ/CPF não encontrado. Fale com seu vendedor Novamix.' })
        return
    }

    if (clienteCiss.FLAGINATIVO === 'T') {
        res.code(403).send({ error: 'Esse cadastro está inativo. Fale com seu vendedor Novamix.' })
        return
    }

    const [jaCadastrado] = await querySupabase<{ id: string }>(
        'SELECT id FROM televendas.clientes WHERE codigo_cliente_ciss = $1',
        [clienteCiss.IDCLIFOR]
    )
    if (jaCadastrado) {
        res.code(409).send({ error: 'Esse CNPJ/CPF já tem cadastro. Faça login.' })
        return
    }

    const senhaHash = await bcrypt.hash(senha, 10)

    const cliente = await withTransaction((query) =>
        query<Cliente>(
            `INSERT INTO televendas.clientes (codigo_cliente_ciss, razao_social, email, senha_hash, telefone, cpf_cnpj)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, codigo_cliente_ciss, razao_social, email, telefone`,
            [
                clienteCiss.IDCLIFOR,
                clienteCiss.NOME,
                email.toLowerCase().trim(),
                senhaHash,
                telefone ? encrypt(telefone) : null,
                encrypt(documento),
            ]
        ).then(([novoCliente]) => novoCliente)
    )

    const token = signClienteToken({ tipo: 'cliente', clienteId: cliente.id })
    res.setCookie('cliente_token', token, COOKIE_OPTIONS)
    res.code(201).send(clienteResumo(cliente))
}

export async function loginCliente(req: FastifyRequest, res: FastifyReply) {
    const { email, senha } = req.body as { email?: string; senha?: string }

    if (!email || !senha) {
        res.code(400).send({ error: 'Informe e-mail e senha.' })
        return
    }

    const [cliente] = await querySupabase<ClienteComSenha>(
        'SELECT id, codigo_cliente_ciss, razao_social, email, telefone, senha_hash FROM televendas.clientes WHERE email = $1',
        [email.toLowerCase().trim()]
    )

    if (!cliente || !(await bcrypt.compare(senha, cliente.senha_hash))) {
        res.code(401).send({ error: 'E-mail ou senha inválidos.' })
        return
    }

    const token = signClienteToken({ tipo: 'cliente', clienteId: cliente.id })
    res.setCookie('cliente_token', token, COOKIE_OPTIONS)
    res.send(clienteResumo(cliente))
}

export async function logoutCliente(_req: FastifyRequest, res: FastifyReply) {
    res.clearCookie('cliente_token', { path: '/' })
    res.code(204).send()
}

export async function meCliente(req: FastifyRequest, res: FastifyReply) {
    const [cliente] = await querySupabase<Cliente>(
        'SELECT id, codigo_cliente_ciss, razao_social, email, telefone FROM televendas.clientes WHERE id = $1',
        [req.cliente.clienteId]
    )

    if (!cliente) {
        res.code(401).send({ error: 'Sessão inválida.' })
        return
    }

    res.send(clienteResumo(cliente))
}

export async function listCategoriasCliente(_req: FastifyRequest, res: FastifyReply) {
    const categorias = await querySupabase<{
        id: string
        nome: string
        imagem: string | null
        destaque_home: boolean
        ordem_home: number
    }>(
        'SELECT id, nome, imagem, destaque_home, ordem_home FROM televendas.categorias WHERE ativo = true ORDER BY nome'
    )

    // Só entra na vitrine o vínculo cujo produto está marcado como ativo em televendas.produtos
    // (inativar não apaga a categorização, só esconde da loja).
    const referencias = await querySupabase<{ produto_codigo: number; categoria_id: string }>(
        `SELECT pc.produto_codigo, pc.categoria_id
         FROM televendas.produto_categorias pc
         JOIN televendas.produtos p ON p.codigo_produto_ciss = pc.produto_codigo
         WHERE p.ativo = true`
    )

    const produtos = await getProdutosPorCodigo(referencias.map((r) => r.produto_codigo))
    const produtosPorCodigo = new Map(produtos.map((p) => [p.CODIGO_PRODUTO, p]))

    const categoriasComProdutos = categorias.map((categoria) => ({
        id: categoria.id,
        nome: categoria.nome,
        imagem: categoria.imagem,
        destaqueHome: categoria.destaque_home,
        ordemHome: categoria.ordem_home,
        produtos: referencias
            .filter((r) => r.categoria_id === categoria.id)
            .map((r) => produtosPorCodigo.get(r.produto_codigo))
            .filter((p): p is (typeof produtos)[number] => p != null && p.INATIVO !== 'T'),
    }))

    res.send(categoriasComProdutos)
}

export async function listOfertasCliente(_req: FastifyRequest, res: FastifyReply) {
    const registros = await querySupabase<{ codigo_produto_ciss: number }>(
        'SELECT codigo_produto_ciss FROM televendas.produtos WHERE preco_promocional IS NOT NULL AND ativo = true'
    )

    const produtos = await getProdutosPorCodigo(registros.map((r) => r.codigo_produto_ciss))
    const ofertas = produtos
        .filter((p) => p.INATIVO !== 'T' && p.PRECO != null && p.ESTOQUE > 0)
        .slice(0, QTD_MAIS_VENDIDOS)

    res.send(ofertas)
}

export async function listFavoritosCliente(req: FastifyRequest, res: FastifyReply) {
    const favoritos = await querySupabase<{ codigo_produto: number }>(
        'SELECT codigo_produto FROM televendas.favoritos WHERE cliente_id = $1 ORDER BY criado_em DESC',
        [req.cliente.clienteId]
    )

    const produtos = await getProdutosPorCodigo(favoritos.map((f) => f.codigo_produto))
    const produtosPorCodigo = new Map(produtos.map((p) => [p.CODIGO_PRODUTO, p]))

    // Mantém a ordem de "favoritado mais recente primeiro" e não esconde esgotado/promo vencida —
    // o cliente favoritou de propósito, só produto excluído do CISS mesmo é que some da lista.
    const favoritosResolvidos = favoritos
        .map((f) => produtosPorCodigo.get(f.codigo_produto))
        .filter((p): p is (typeof produtos)[number] => p != null)

    res.send(favoritosResolvidos)
}

export async function alternarFavoritoCliente(req: FastifyRequest, res: FastifyReply) {
    const { codigoProduto } = req.params as { codigoProduto: string }
    const codigo = Number(codigoProduto)

    if (!Number.isInteger(codigo)) {
        res.code(400).send({ error: 'Código de produto inválido.' })
        return
    }

    const [existente] = await querySupabase<{ id: string }>(
        'SELECT id FROM televendas.favoritos WHERE cliente_id = $1 AND codigo_produto = $2',
        [req.cliente.clienteId, codigo]
    )

    if (existente) {
        await querySupabase('DELETE FROM televendas.favoritos WHERE id = $1', [existente.id])
        res.send({ favorito: false })
        return
    }

    await querySupabase(
        'INSERT INTO televendas.favoritos (cliente_id, codigo_produto) VALUES ($1, $2)',
        [req.cliente.clienteId, codigo]
    )
    res.send({ favorito: true })
}

export async function listMaisVendidosCliente(_req: FastifyRequest, res: FastifyReply) {
    const sql = await sqlComVendedores('produto', 'mais_vendidos.sql')

    const conn = await connCiss()
    let ranking: { CODIGO_PRODUTO: number }[]
    try {
        ranking = await conn.query(sql)
    } finally {
        await conn.close()
    }

    // A query CISS já vem ordenada por venda — o WHERE IN do getProdutosPorCodigo não
    // preserva ordem, então a gente reaplica pelo array de ranking.
    const produtos = await getProdutosPorCodigo(ranking.map((r) => r.CODIGO_PRODUTO))
    const produtosPorCodigo = new Map(produtos.map((p) => [p.CODIGO_PRODUTO, p]))

    const maisVendidos = ranking
        .map((r) => produtosPorCodigo.get(r.CODIGO_PRODUTO))
        .filter((p): p is (typeof produtos)[number] => p != null && p.INATIVO !== 'T' && p.PRECO != null && p.ESTOQUE > 0)
        .slice(0, QTD_MAIS_VENDIDOS)

    res.send(maisVendidos)
}

export async function criarPedido(req: FastifyRequest, res: FastifyReply) {
    const { itens, observacao } = req.body as {
        itens?: { codigoProduto: number; quantidade: number }[]
        observacao?: string
    }

    if (!itens || itens.length === 0) {
        res.code(400).send({ error: 'O pedido precisa ter pelo menos um item.' })
        return
    }

    const quantidadesPorCodigo = new Map(itens.map((item) => [item.codigoProduto, item.quantidade]))
    if ([...quantidadesPorCodigo.values()].some((qtd) => !Number.isFinite(qtd) || qtd <= 0)) {
        res.code(400).send({ error: 'Quantidade inválida em algum item.' })
        return
    }

    const [cliente] = await querySupabase<Cliente>(
        'SELECT id, codigo_cliente_ciss, razao_social, email, telefone FROM televendas.clientes WHERE id = $1',
        [req.cliente.clienteId]
    )
    if (!cliente) {
        res.code(401).send({ error: 'Sessão inválida.' })
        return
    }

    // Preço e estoque sempre revalidados ao vivo no CISS — nunca confia no que o cliente mandou
    // (o botão de adicionar já fica desabilitado no catálogo pra item esgotado, mas isso aqui
    // é o que realmente impede o pedido, caso alguém chame a API direto).
    const produtosCiss = await getProdutosPorCodigo([...quantidadesPorCodigo.keys()])
    const produtosValidos = produtosCiss.filter((p) => p.INATIVO !== 'T' && p.PRECO != null && p.ESTOQUE > 0)

    if (produtosValidos.length !== quantidadesPorCodigo.size) {
        res.code(400).send({ error: 'Algum item do pedido não está mais disponível ou está esgotado.' })
        return
    }

    const itensPedido = produtosValidos.map((produto) => ({
        codigo_produto: produto.CODIGO_PRODUTO,
        descricao_produto: produto.DESCRICAO,
        quantidade: quantidadesPorCodigo.get(produto.CODIGO_PRODUTO)!,
        preco_unitario: produto.PRECO!,
    }))

    const valorTotal = itensPedido.reduce((soma, item) => soma + item.quantidade * item.preco_unitario, 0)

    // Só existe 1 vendedor de televendas hoje, então o valor mínimo não é mais por cliente/vendedor —
    // é uma config única (linha única em config_vendedores).
    const [config] = await querySupabase<{ valor_minimo_pedido: string }>(
        'SELECT valor_minimo_pedido FROM televendas.config_vendedores LIMIT 1'
    )
    const valorMinimo = Number(config?.valor_minimo_pedido ?? 0)

    if (valorTotal < valorMinimo) {
        res.code(400).send({
            error: `O pedido mínimo é de ${valorMinimo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
        })
        return
    }

    const pedido = await withTransaction(async (query) => {
        const [novoPedido] = await query<{ id: string; status: string }>(
            `INSERT INTO televendas.pedidos (cliente_id, valor_total, observacao)
             VALUES ($1, $2, $3)
             RETURNING id, status`,
            [cliente.id, valorTotal, observacao ?? null]
        )

        for (const item of itensPedido) {
            await query(
                `INSERT INTO televendas.pedido_itens (pedido_id, codigo_produto, descricao_produto, quantidade, preco_unitario)
                 VALUES ($1, $2, $3, $4, $5)`,
                [novoPedido.id, item.codigo_produto, item.descricao_produto, item.quantidade, item.preco_unitario]
            )
        }

        return novoPedido
    })

    res.code(201).send(pedido)
}

export async function listPedidosCliente(req: FastifyRequest, res: FastifyReply) {
    const pedidos = await querySupabase(
        `SELECT id, status, valor_total, criado_em, atualizado_em
         FROM televendas.pedidos
         WHERE cliente_id = $1
         ORDER BY criado_em DESC`,
        [req.cliente.clienteId]
    )
    res.send(pedidos)
}

export async function getPedidoCliente(req: FastifyRequest, res: FastifyReply) {
    const { pedidoId } = req.params as { pedidoId: string }

    const [pedido] = await querySupabase(
        `SELECT id, status, valor_total, observacao, criado_em, atualizado_em
         FROM televendas.pedidos
         WHERE id = $1 AND cliente_id = $2`,
        [pedidoId, req.cliente.clienteId]
    )

    if (!pedido) {
        res.code(404).send({ error: 'Pedido não encontrado.' })
        return
    }

    const itens = await querySupabase(
        `SELECT codigo_produto, descricao_produto, quantidade, preco_unitario
         FROM televendas.pedido_itens
         WHERE pedido_id = $1`,
        [pedidoId]
    )

    const historico = await querySupabase(
        `SELECT status, criado_em
         FROM televendas.pedido_status_historico
         WHERE pedido_id = $1
         ORDER BY criado_em ASC`,
        [pedidoId]
    )

    res.send({ ...pedido, itens, historico })
}
