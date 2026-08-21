import { authenticateCliente } from '../middlewares/cliente.middlewares'
import {
    cadastrarCliente,
    loginCliente,
    logoutCliente,
    meCliente,
    listCatalogosCliente,
    listProdutosCatalogoCliente,
    criarPedido,
    listPedidosCliente,
    getPedidoCliente,
} from '../controllers/cliente.controller'

export function clienteRoutes(fastify) {
    fastify.post('/cliente/cadastro', cadastrarCliente)
    fastify.post('/cliente/login', loginCliente)
    fastify.post('/cliente/logout', logoutCliente)

    fastify.get('/cliente/me', { preHandler: [authenticateCliente] }, meCliente)

    // Catálogo é público, tipo vitrine de e-commerce — só o checkout exige login.
    fastify.get('/cliente/catalogos', listCatalogosCliente)
    fastify.get('/cliente/catalogos/:catalogoId/produtos', listProdutosCatalogoCliente)

    fastify.post('/cliente/pedidos', { preHandler: [authenticateCliente] }, criarPedido)
    fastify.get('/cliente/pedidos', { preHandler: [authenticateCliente] }, listPedidosCliente)
    fastify.get('/cliente/pedidos/:pedidoId', { preHandler: [authenticateCliente] }, getPedidoCliente)
}
