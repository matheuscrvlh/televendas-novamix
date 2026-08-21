import { authenticate } from '../middlewares/auth.middlewares'
import {
    listPedidosAdmin,
    getPedidoAdmin,
    atualizarStatusPedido,
    atualizarItemPedido,
    removerItemPedido,
} from '../controllers/pedidoAdmin.controller'

export function pedidoAdminRoutes(fastify) {
    fastify.get('/pedidos', { preHandler: [authenticate] }, listPedidosAdmin)
    fastify.get('/pedidos/:pedidoId', { preHandler: [authenticate] }, getPedidoAdmin)
    fastify.patch('/pedidos/:pedidoId/status', { preHandler: [authenticate] }, atualizarStatusPedido)
    fastify.patch('/pedidos/:pedidoId/itens/:codigoProduto', { preHandler: [authenticate] }, atualizarItemPedido)
    fastify.delete('/pedidos/:pedidoId/itens/:codigoProduto', { preHandler: [authenticate] }, removerItemPedido)
}
