import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connCiss } from '../database/ciss.database'
import { querySupabase, withTransaction } from '../database/supabase.database'
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

const TIPOS_META = ['faturamento', 'faturamento_super', 'clientes'] as const
type TipoMeta = (typeof TIPOS_META)[number]
type Metas = Record<TipoMeta, number | null>

function montarMetas(linhas: { tipo: string; valor: string }[]): Metas {
    const metas: Metas = { faturamento: null, faturamento_super: null, clientes: null }
    for (const linha of linhas) {
        if ((TIPOS_META as readonly string[]).includes(linha.tipo)) metas[linha.tipo as TipoMeta] = Number(linha.valor)
    }
    return metas
}

class MetaInvalida extends Error {}

// Metas do mês (Supabase) + o realizado no mês inteiro (CISS): faturamento e clientes que compraram.
export async function getMeta(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { mes } = req.query as { mes?: string }
    if (!mes || !MES_REGEX.test(mes)) {
        res.code(400).send({ error: 'Informe o mês no formato YYYY-MM.' })
        return
    }

    const { inicio, fim } = limitesDoMes(mes)
    const [kpisSql, ativosSql] = await Promise.all([
        sqlComVendedores('kpis_periodo.sql'),
        sqlComVendedores('clientes_ativos_total.sql'),
    ])

    const buscarRealizado = async () => {
        const conn = await connCiss()
        try {
            const [kpis, ativos] = await Promise.all([
                conn.query(kpisSql, [inicio, fim]),
                conn.query(ativosSql, [inicio, fim]),
            ])
            return {
                faturamento: Number(kpis[0]?.FATURAMENTO_TOTAL ?? 0),
                clientes: Number(ativos[0]?.CLIENTES_ATIVOS ?? 0),
            }
        } finally {
            await conn.close()
        }
    }

    const [linhas, realizado] = await Promise.all([
        querySupabase<{ tipo: string; valor: string }>(
            'SELECT tipo, valor FROM televendas.metas_mensais WHERE mes = $1',
            [inicio]
        ),
        buscarRealizado(),
    ])

    res.send({ mes, metas: montarMetas(linhas), realizado })
}

// Salva uma ou mais metas do mês de uma vez. Valor null apaga a meta daquele tipo.
// Qualquer usuária com acesso ao televendas pode definir (não só admin).
export async function putMeta(req: FastifyRequest, res: FastifyReply) {
    const permission = await checkPermission(req, res)
    if (!permission) return

    const { mes, metas } = req.body as { mes?: string; metas?: Record<string, unknown> }
    if (!mes || !MES_REGEX.test(mes)) {
        res.code(400).send({ error: 'Informe o mês no formato YYYY-MM.' })
        return
    }
    if (!metas || typeof metas !== 'object' || Object.keys(metas).length === 0) {
        res.code(400).send({ error: 'Informe ao menos uma meta.' })
        return
    }

    const alteracoes: [TipoMeta, number | null][] = []
    for (const [tipo, valor] of Object.entries(metas)) {
        if (!(TIPOS_META as readonly string[]).includes(tipo)) {
            res.code(400).send({ error: `Tipo de meta desconhecido: ${tipo}.` })
            return
        }
        if (valor !== null && (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0 || valor >= 1e13)) {
            res.code(400).send({ error: 'A meta precisa ser um valor maior que zero.' })
            return
        }
        if (tipo === 'clientes' && valor !== null && !Number.isInteger(valor)) {
            res.code(400).send({ error: 'A meta de clientes precisa ser um número inteiro.' })
            return
        }
        alteracoes.push([tipo as TipoMeta, valor === null ? null : Math.round(valor * 100) / 100])
    }

    const { inicio } = limitesDoMes(mes)
    try {
        const resultado = await withTransaction(async (query) => {
            for (const [tipo, valor] of alteracoes) {
                if (valor === null) {
                    await query('DELETE FROM televendas.metas_mensais WHERE mes = $1 AND tipo = $2', [inicio, tipo])
                } else {
                    await query(
                        `INSERT INTO televendas.metas_mensais (mes, tipo, valor)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (mes, tipo) DO UPDATE SET valor = $3, atualizado_em = now()`,
                        [inicio, tipo, valor]
                    )
                }
            }

            const final = montarMetas(
                await query<{ tipo: string; valor: string }>(
                    'SELECT tipo, valor FROM televendas.metas_mensais WHERE mes = $1',
                    [inicio]
                )
            )
            if (final.faturamento_super !== null && final.faturamento === null) {
                throw new MetaInvalida('Defina a meta de faturamento antes da supermeta.')
            }
            if (
                final.faturamento_super !== null &&
                final.faturamento !== null &&
                final.faturamento_super <= final.faturamento
            ) {
                throw new MetaInvalida('A supermeta precisa ser maior que a meta.')
            }
            return final
        })

        res.send({ mes, metas: resultado })
    } catch (err) {
        if (err instanceof MetaInvalida) {
            res.code(400).send({ error: err.message })
            return
        }
        throw err
    }
}
