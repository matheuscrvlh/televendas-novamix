import { authenticate } from '../middlewares/auth.middlewares'
import {
    listConfigVendedores,
    createConfigVendedor,
    updateConfigVendedor,
    deleteConfigVendedor,
} from '../controllers/configuracoes.controller'

export function configuracoesRoutes(fastify) {
    fastify.get('/configuracoes/vendedores', { preHandler: [authenticate] }, listConfigVendedores)
    fastify.post('/configuracoes/vendedores', { preHandler: [authenticate] }, createConfigVendedor)
    fastify.patch('/configuracoes/vendedores/:codigoVendedor', { preHandler: [authenticate] }, updateConfigVendedor)
    fastify.delete('/configuracoes/vendedores/:codigoVendedor', { preHandler: [authenticate] }, deleteConfigVendedor)
}
