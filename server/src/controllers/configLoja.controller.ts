import type { FastifyRequest, FastifyReply } from 'fastify'
import { requireAdmin } from '../middlewares/auth.middlewares'
import { querySupabase } from '../database/supabase.database'

const TEXTO_TOPO_PADRAO = 'Venda exclusiva para clientes cadastrados Novamix'

export async function getConfigLoja(_req: FastifyRequest, res: FastifyReply) {
    const [config] = await querySupabase<{ texto_topo: string }>(
        'SELECT texto_topo FROM televendas.config_loja LIMIT 1'
    )
    res.send({ textoTopo: config?.texto_topo ?? TEXTO_TOPO_PADRAO })
}

export async function updateConfigLoja(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { textoTopo } = req.body as { textoTopo?: string }
    if (!textoTopo || !textoTopo.trim()) {
        res.code(400).send({ error: 'Informe o texto do topo.' })
        return
    }

    const [existente] = await querySupabase<{ id: string }>('SELECT id FROM televendas.config_loja LIMIT 1')

    const [config] = existente
        ? await querySupabase<{ texto_topo: string }>(
              `UPDATE televendas.config_loja SET texto_topo = $1, atualizado_em = now()
               WHERE id = $2 RETURNING texto_topo`,
              [textoTopo.trim(), existente.id]
          )
        : await querySupabase<{ texto_topo: string }>(
              'INSERT INTO televendas.config_loja (texto_topo) VALUES ($1) RETURNING texto_topo',
              [textoTopo.trim()]
          )

    res.send({ textoTopo: config.texto_topo })
}
