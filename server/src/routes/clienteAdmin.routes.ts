import { authenticate } from '../middlewares/auth.middlewares'
import { listClientesAdmin, listUltimasComprasCliente } from '../controllers/clienteAdmin.controller'

export function clienteAdminRoutes(fastify) {
    fastify.get('/clientes', { preHandler: [authenticate] }, listClientesAdmin)
    fastify.get('/clientes/:clienteId/pedidos', { preHandler: [authenticate] }, listUltimasComprasCliente)
}
