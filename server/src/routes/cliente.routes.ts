import { authenticateCliente } from '../middlewares/cliente.middlewares'
import {
    cadastrarCliente,
    loginCliente,
    logoutCliente,
    meCliente,
    listCategoriasCliente,
    criarPedido,
    listPedidosCliente,
    getPedidoCliente,
} from '../controllers/cliente.controller'

export function clienteRoutes(fastify) {
    fastify.post('/cliente/cadastro', cadastrarCliente)
    fastify.post('/cliente/login', loginCliente)
    fastify.post('/cliente/logout', logoutCliente)

    fastify.get('/cliente/me', { preHandler: [authenticateCliente] }, meCliente)

    // Vitrine é pública, tipo e-commerce — só o checkout exige login.
    fastify.get('/cliente/categorias', listCategoriasCliente)

    fastify.post('/cliente/pedidos', { preHandler: [authenticateCliente] }, criarPedido)
    fastify.get('/cliente/pedidos', { preHandler: [authenticateCliente] }, listPedidosCliente)
    fastify.get('/cliente/pedidos/:pedidoId', { preHandler: [authenticateCliente] }, getPedidoCliente)
}
