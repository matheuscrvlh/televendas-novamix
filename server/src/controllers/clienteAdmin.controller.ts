import type { FastifyRequest, FastifyReply } from 'fastify'
import { requireAdmin } from '../middlewares/auth.middlewares'
import { querySupabase } from '../database/supabase.database'
import { decryptNullable } from '../utils/crypto'

interface ClienteAdminRow {
    id: string
    codigo_cliente_ciss: number
    razao_social: string
    email: string
    telefone: string | null
    cpf_cnpj: string | null
    criado_em: string
    pedidos_total: string
    valor_total_pedidos: string
}

export async function listClientesAdmin(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const clientes = await querySupabase<ClienteAdminRow>(
        `SELECT c.id, c.codigo_cliente_ciss, c.razao_social, c.email, c.telefone, c.cpf_cnpj, c.criado_em,
                COUNT(p.id) AS pedidos_total,
                COALESCE(SUM(p.valor_total), 0) AS valor_total_pedidos
         FROM televendas.clientes c
         LEFT JOIN televendas.pedidos p ON p.cliente_id = c.id
         GROUP BY c.id
         ORDER BY c.criado_em DESC`
    )

    // COUNT/SUM voltam como string do pg (numeric/bigint) — convertidos aqui pra não
    // depender do front lembrar de fazer Number() em cada consumo desses campos.
    res.send(
        clientes.map((c) => ({
            ...c,
            telefone: decryptNullable(c.telefone),
            cpf_cnpj: decryptNullable(c.cpf_cnpj),
            pedidos_total: Number(c.pedidos_total),
            valor_total_pedidos: Number(c.valor_total_pedidos),
        }))
    )
}

const ULTIMAS_COMPRAS_LIMITE = 10

export async function listUltimasComprasCliente(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { clienteId } = req.params as { clienteId: string }

    const pedidos = await querySupabase(
        `SELECT id, status, valor_total, criado_em
         FROM televendas.pedidos
         WHERE cliente_id = $1
         ORDER BY criado_em DESC
         LIMIT $2`,
        [clienteId, ULTIMAS_COMPRAS_LIMITE]
    )

    res.send(pedidos)
}
