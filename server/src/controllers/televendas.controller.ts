import type { FastifyRequest, FastifyReply } from 'fastify'
import { checkPermission } from '../middlewares/auth.middlewares'
import { connCiss } from '../database/ciss.database'
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
            conn.query(ativosSql),
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
