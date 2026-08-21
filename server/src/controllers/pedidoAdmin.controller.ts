import type { FastifyRequest, FastifyReply } from 'fastify'
import { requireAdmin } from '../middlewares/auth.middlewares'
import { querySupabase, withTransaction } from '../database/supabase.database'

const STATUS_VALIDOS = [
    'enviado',
    'em_analise',
    'aguardando_confirmacao_cliente',
    'confirmado',
    'separando',
    'faturado',
    'saiu_para_entrega',
    'entregue',
    'cancelado',
]

const STATUS_FINAIS = ['cancelado', 'entregue']

interface PedidoParams {
    pedidoId: string
}

interface ItemParams extends PedidoParams {
    codigoProduto: string
}

export async function listPedidosAdmin(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { status } = req.query as { status?: string }

    const params: unknown[] = []
    let where = ''
    if (status) {
        params.push(status)
        where = 'WHERE p.status = $1'
    }

    const pedidos = await querySupabase(
        `SELECT p.id, p.status, p.valor_total, p.criado_em, p.atualizado_em,
                c.razao_social, c.email, c.telefone
         FROM televendas.pedidos p
         INNER JOIN televendas.clientes c ON c.id = p.cliente_id
         ${where}
         ORDER BY p.criado_em DESC
         LIMIT 200`,
        params
    )
    res.send(pedidos)
}

export async function getPedidoAdmin(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { pedidoId } = req.params as PedidoParams

    const [pedido] = await querySupabase(
        `SELECT p.id, p.status, p.valor_total, p.observacao, p.criado_em, p.atualizado_em,
                c.id AS cliente_id, c.razao_social, c.email, c.telefone, c.codigo_cliente_ciss
         FROM televendas.pedidos p
         INNER JOIN televendas.clientes c ON c.id = p.cliente_id
         WHERE p.id = $1`,
        [pedidoId]
    )

    if (!pedido) {
        res.code(404).send({ error: 'Pedido não encontrado.' })
        return
    }

    const itens = await querySupabase(
        `SELECT codigo_produto, descricao_produto, quantidade, preco_unitario
         FROM televendas.pedido_itens
         WHERE pedido_id = $1
         ORDER BY descricao_produto`,
        [pedidoId]
    )

    const historico = await querySupabase(
        `SELECT status, criado_em
         FROM televendas.pedido_status_historico
         WHERE pedido_id = $1
         ORDER BY criado_em ASC`,
        [pedidoId]
    )

    const alteracoes = await querySupabase(
        `SELECT autor, tipo, valor_anterior, valor_novo, motivo, criado_em
         FROM televendas.pedido_alteracoes
         WHERE pedido_id = $1
         ORDER BY criado_em DESC`,
        [pedidoId]
    )

    res.send({ ...pedido, itens, historico, alteracoes })
}

export async function atualizarStatusPedido(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { pedidoId } = req.params as PedidoParams
    const { status, motivo } = req.body as { status?: string; motivo?: string }

    if (!status || !STATUS_VALIDOS.includes(status)) {
        res.code(400).send({ error: 'Status inválido.' })
        return
    }

    const [pedidoAtual] = await querySupabase<{ status: string }>(
        'SELECT status FROM televendas.pedidos WHERE id = $1',
        [pedidoId]
    )
    if (!pedidoAtual) {
        res.code(404).send({ error: 'Pedido não encontrado.' })
        return
    }

    await withTransaction(async (query) => {
        await query('UPDATE televendas.pedidos SET status = $1 WHERE id = $2', [status, pedidoId])
        await query(
            `INSERT INTO televendas.pedido_alteracoes (pedido_id, autor, tipo, valor_anterior, valor_novo, motivo)
             VALUES ($1, 'painel', 'status', $2, $3, $4)`,
            [pedidoId, pedidoAtual.status, status, motivo ?? null]
        )
    })

    res.send({ ok: true })
}

async function recalcularValorTotal(query: typeof querySupabase, pedidoId: string) {
    const [{ total }] = await query<{ total: string }>(
        `SELECT COALESCE(SUM(quantidade * preco_unitario), 0) AS total
         FROM televendas.pedido_itens
         WHERE pedido_id = $1`,
        [pedidoId]
    )
    await query('UPDATE televendas.pedidos SET valor_total = $1 WHERE id = $2', [total, pedidoId])
}

async function marcarAguardandoConfirmacao(query: typeof querySupabase, pedidoId: string) {
    const [pedido] = await query<{ status: string }>('SELECT status FROM televendas.pedidos WHERE id = $1', [
        pedidoId,
    ])
    if (pedido && !STATUS_FINAIS.includes(pedido.status) && pedido.status !== 'aguardando_confirmacao_cliente') {
        await query('UPDATE televendas.pedidos SET status = $1 WHERE id = $2', [
            'aguardando_confirmacao_cliente',
            pedidoId,
        ])
    }
}

export async function atualizarItemPedido(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { pedidoId, codigoProduto } = req.params as ItemParams
    const { quantidade, motivo } = req.body as { quantidade?: number; motivo?: string }
    const codigo = Number(codigoProduto)

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
        res.code(400).send({ error: 'Quantidade inválida.' })
        return
    }

    const [itemAtual] = await querySupabase<{ quantidade: string }>(
        'SELECT quantidade FROM televendas.pedido_itens WHERE pedido_id = $1 AND codigo_produto = $2',
        [pedidoId, codigo]
    )
    if (!itemAtual) {
        res.code(404).send({ error: 'Item não encontrado no pedido.' })
        return
    }

    await withTransaction(async (query) => {
        await query(
            'UPDATE televendas.pedido_itens SET quantidade = $1 WHERE pedido_id = $2 AND codigo_produto = $3',
            [quantidade, pedidoId, codigo]
        )
        await recalcularValorTotal(query, pedidoId)
        await query(
            `INSERT INTO televendas.pedido_alteracoes (pedido_id, pedido_item_id, autor, tipo, valor_anterior, valor_novo, motivo)
             VALUES ($1, NULL, 'painel', 'quantidade_alterada', $2, $3, $4)`,
            [pedidoId, itemAtual.quantidade, String(quantidade), motivo ?? null]
        )
        await marcarAguardandoConfirmacao(query, pedidoId)
    })

    res.send({ ok: true })
}

export async function removerItemPedido(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { pedidoId, codigoProduto } = req.params as ItemParams
    const { motivo } = (req.body as { motivo?: string } | undefined) ?? {}
    const codigo = Number(codigoProduto)

    const [itemAtual] = await querySupabase<{ descricao_produto: string }>(
        'SELECT descricao_produto FROM televendas.pedido_itens WHERE pedido_id = $1 AND codigo_produto = $2',
        [pedidoId, codigo]
    )
    if (!itemAtual) {
        res.code(404).send({ error: 'Item não encontrado no pedido.' })
        return
    }

    await withTransaction(async (query) => {
        await query('DELETE FROM televendas.pedido_itens WHERE pedido_id = $1 AND codigo_produto = $2', [
            pedidoId,
            codigo,
        ])
        await recalcularValorTotal(query, pedidoId)
        await query(
            `INSERT INTO televendas.pedido_alteracoes (pedido_id, autor, tipo, valor_anterior, valor_novo, motivo)
             VALUES ($1, 'painel', 'item_removido', $2, NULL, $3)`,
            [pedidoId, itemAtual.descricao_produto, motivo ?? null]
        )
        await marcarAguardandoConfirmacao(query, pedidoId)
    })

    res.code(204).send()
}
