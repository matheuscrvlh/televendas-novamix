import { authenticate } from '../middlewares/auth.middlewares'
import { getConfigLoja, updateConfigLoja } from '../controllers/configLoja.controller'

export function configLojaRoutes(fastify) {
    // Pública — o header da loja (sem login) precisa ler o texto do topo.
    fastify.get('/cliente/config', getConfigLoja)
    fastify.patch('/configuracoes/loja', { preHandler: [authenticate] }, updateConfigLoja)
}
