import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connCiss } from '../database/ciss.database'
import { querySupabase } from '../database/supabase.database'
import { sqlComVendedores as sqlComVendedoresBase } from '../services/vendedores.service'

interface PeriodoQuery {
    inicio?: string
    fim?: string
}

function sqlComVendedores(arquivo: string) {
    return sqlComVendedoresBase('televendas', arquivo)
}

function resolvePeriodo(req: FastifyRequest, res: FastifyReply) {
    const { inicio, fim } = req.query as PeriodoQuery

    if (!inicio || !fim) {
        res.code(400).send({ error: 'Informe os parâmetros inicio e fim (YYYY-MM-DD).' })
        return null
    }

    return { inicio, fim }
}

function resolveCliente(req: FastifyRequest, res: FastifyReply) {
    const { idclifor } = req.params as { idclifor: string }
    const id = Number(idclifor)

    if (!Number.isInteger(id) || id <= 0) {
        res.code(400).send({ error: 'Código de cliente inválido.' })
        return null
    }

    return id
}

export async function getVisaoGeral(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const periodo = resolvePeriodo(req, res)
    if (!periodo) return

    const kpisSql = await sqlComVendedores('kpis_periodo.sql')
    const ativosSql = await sqlComVendedores('clientes_ativos_total.sql')

    const conn = await connCiss()
    try {
        const [kpis, ativos] = await Promise.all([
            conn.query(kpisSql, [periodo.inicio, periodo.fim]),
            conn.query(ativosSql, [periodo.inicio, periodo.fim]),
        ])
        res.send({ ...kpis[0], ...ativos[0] })
    } finally {
        await conn.close()
    }
}

export async function getClientes(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const periodo = resolvePeriodo(req, res)
    if (!periodo) return

    const sql = await sqlComVendedores('clientes_resumo.sql')

    const conn = await connCiss()
    try {
        const data = await conn.query(sql, [periodo.inicio, periodo.fim])
        res.send(data)
    } finally {
        await conn.close()
    }
}

export async function getClientesSemComprar(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const periodo = resolvePeriodo(req, res)
    if (!periodo) return

    const sql = await sqlComVendedores('clientes_sem_comprar.sql')

    const conn = await connCiss()
    try {
        const data = await conn.query(sql, [periodo.inicio, periodo.fim])
        res.send(data)
    } finally {
        await conn.close()
    }
}

export async function getTopClientes(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const periodo = resolvePeriodo(req, res)
    if (!periodo) return

    const sql = await sqlComVendedores('top_clientes.sql')

    const conn = await connCiss()
    try {
        const data = await conn.query(sql, [periodo.inicio, periodo.fim])
        res.send(data)
    } finally {
        await conn.close()
    }
}

export async function getTopProdutos(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const periodo = resolvePeriodo(req, res)
    if (!periodo) return

    const sql = await sqlComVendedores('top_produtos.sql')

    const conn = await connCiss()
    try {
        const data = await conn.query(sql, [periodo.inicio, periodo.fim])
        res.send(data)
    } finally {
        await conn.close()
    }
}

// Itens que o cliente comprou no período escolhido no filtro de datas.
export async function getClienteItens(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const idclifor = resolveCliente(req, res)
    if (idclifor === null) return

    const periodo = resolvePeriodo(req, res)
    if (!periodo) return

    const sql = await sqlComVendedores('cliente_itens_periodo.sql')

    const conn = await connCiss()
    try {
        const data = await conn.query(sql, [idclifor, periodo.inicio, periodo.fim])
        res.send(data)
    } finally {
        await conn.close()
    }
}

// Histórico completo do cliente com o time de televendas: produtos que mais compra e todas as compras.
export async function getClienteHistorico(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const idclifor = resolveCliente(req, res)
    if (idclifor === null) return

    const [produtosSql, pedidosSql] = await Promise.all([
        sqlComVendedores('cliente_produtos_historico.sql'),
        sqlComVendedores('cliente_pedidos_historico.sql'),
    ])

    const conn = await connCiss()
    try {
        const [produtos, pedidos] = await Promise.all([
            conn.query(produtosSql, [idclifor]),
            conn.query(pedidosSql, [idclifor]),
        ])
        res.send({ produtos, pedidos })
    } finally {
        await conn.close()
    }
}

const MES_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

/** '2026-11' -> { inicio: '2026-11-01', fim: '2026-11-30' } */
function limitesDoMes(mes: string) {
    const [ano, numeroMes] = mes.split('-').map(Number)
    const ultimoDia = new Date(Date.UTC(ano, numeroMes, 0)).getUTCDate()
    return { inicio: `${mes}-01`, fim: `${mes}-${String(ultimoDia).padStart(2, '0')}` }
}

// Meta do mês (Supabase) + quanto já foi faturado no mês inteiro (CISS), para o card de faturamento.
export async function getMeta(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { mes } = req.query as { mes?: string }
    if (!mes || !MES_REGEX.test(mes)) {
        res.code(400).send({ error: 'Informe o mês no formato YYYY-MM.' })
        return
    }

    const { inicio, fim } = limitesDoMes(mes)
    const kpisSql = await sqlComVendedores('kpis_periodo.sql')

    const buscarRealizado = async () => {
        const conn = await connCiss()
        try {
            const [kpis] = await conn.query(kpisSql, [inicio, fim])
            return Number(kpis?.FATURAMENTO_TOTAL ?? 0)
        } finally {
            await conn.close()
        }
    }

    const [metas, realizado] = await Promise.all([
        querySupabase<{ valor: string }>('SELECT valor FROM televendas.metas_mensais WHERE mes = $1', [inicio]),
        buscarRealizado(),
    ])

    res.send({ mes, meta: metas[0] ? Number(metas[0].valor) : null, realizado })
}

// Qualquer usuária com acesso ao televendas pode definir a meta (não só admin).
export async function putMeta(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { mes, valor } = req.body as { mes?: string; valor?: number }
    if (!mes || !MES_REGEX.test(mes)) {
        res.code(400).send({ error: 'Informe o mês no formato YYYY-MM.' })
        return
    }
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0 || valor >= 1e13) {
        res.code(400).send({ error: 'Informe um valor de meta maior que zero.' })
        return
    }

    const { inicio } = limitesDoMes(mes)
    const [meta] = await querySupabase<{ valor: string }>(
        `INSERT INTO televendas.metas_mensais (mes, valor)
         VALUES ($1, $2)
         ON CONFLICT (mes) DO UPDATE SET valor = $2, atualizado_em = now()
         RETURNING valor`,
        [inicio, Math.round(valor * 100) / 100]
    )

    res.send({ mes, meta: Number(meta.valor) })
}
