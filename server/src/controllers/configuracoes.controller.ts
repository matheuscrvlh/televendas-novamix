import type { FastifyRequest, FastifyReply } from 'fastify'
import { requireAdmin } from '../middlewares/auth.middlewares'
import { querySupabase } from '../database/supabase.database'

interface ConfigVendedorParams {
    codigoVendedor: string
}

export async function listConfigVendedores(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const config = await querySupabase(
        'SELECT codigo_vendedor, valor_minimo_pedido FROM televendas.config_vendedores ORDER BY codigo_vendedor'
    )
    res.send(config)
}

export async function createConfigVendedor(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { codigoVendedor, valorMinimoPedido } = req.body as {
        codigoVendedor?: number
        valorMinimoPedido?: number
    }

    if (!Number.isInteger(codigoVendedor)) {
        res.code(400).send({ error: 'Informe o código do vendedor.' })
        return
    }
    if (!Number.isFinite(valorMinimoPedido) || valorMinimoPedido! < 0) {
        res.code(400).send({ error: 'Informe um valor mínimo válido.' })
        return
    }

    const [config] = await querySupabase(
        `INSERT INTO televendas.config_vendedores (codigo_vendedor, valor_minimo_pedido)
         VALUES ($1, $2)
         ON CONFLICT (codigo_vendedor) DO UPDATE SET valor_minimo_pedido = $2, atualizado_em = now()
         RETURNING codigo_vendedor, valor_minimo_pedido`,
        [codigoVendedor, valorMinimoPedido]
    )
    res.code(201).send(config)
}

export async function updateConfigVendedor(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { codigoVendedor } = req.params as ConfigVendedorParams
    const { valorMinimoPedido } = req.body as { valorMinimoPedido?: number }

    if (!Number.isFinite(valorMinimoPedido) || valorMinimoPedido! < 0) {
        res.code(400).send({ error: 'Informe um valor mínimo válido.' })
        return
    }

    const [config] = await querySupabase(
        `UPDATE televendas.config_vendedores
         SET valor_minimo_pedido = $1, atualizado_em = now()
         WHERE codigo_vendedor = $2
         RETURNING codigo_vendedor, valor_minimo_pedido`,
        [valorMinimoPedido, Number(codigoVendedor)]
    )

    if (!config) {
        res.code(404).send({ error: 'Vendedor não encontrado nas configurações.' })
        return
    }

    res.send(config)
}

export async function deleteConfigVendedor(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { codigoVendedor } = req.params as ConfigVendedorParams

    await querySupabase('DELETE FROM televendas.config_vendedores WHERE codigo_vendedor = $1', [
        Number(codigoVendedor),
    ])
    res.code(204).send()
}
