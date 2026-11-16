import { authenticate } from '../middlewares/auth.middlewares'
import {
    getVisaoGeral,
    getClientes,
    getClientesSemComprar,
    getTopClientes,
    getTopProdutos,
    getClienteItens,
    getClienteHistorico,
    getMeta,
    putMeta,
} from '../controllers/televendas.controller'

export function televendasRoutes(fastify) {
    fastify.get('/televendas/visao-geral', { preHandler: [authenticate] }, getVisaoGeral)
    fastify.get('/televendas/clientes', { preHandler: [authenticate] }, getClientes)
    fastify.get('/televendas/clientes-sem-comprar', { preHandler: [authenticate] }, getClientesSemComprar)
    fastify.get('/televendas/top-clientes', { preHandler: [authenticate] }, getTopClientes)
    fastify.get('/televendas/top-produtos', { preHandler: [authenticate] }, getTopProdutos)
    fastify.get('/televendas/clientes/:idclifor/itens', { preHandler: [authenticate] }, getClienteItens)
    fastify.get('/televendas/clientes/:idclifor/historico', { preHandler: [authenticate] }, getClienteHistorico)
    fastify.get('/televendas/meta', { preHandler: [authenticate] }, getMeta)
    fastify.put('/televendas/meta', { preHandler: [authenticate] }, putMeta)
}
