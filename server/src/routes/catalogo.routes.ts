import { authenticate } from '../middlewares/auth.middlewares'
import {
    listCatalogos,
    createCatalogo,
    buscarProdutosCiss,
    listProdutosCatalogo,
    addProdutoCatalogo,
    removeProdutoCatalogo,
    getImagemProduto,
} from '../controllers/catalogo.controller'

export function catalogoRoutes(fastify) {
    fastify.get('/catalogo', { preHandler: [authenticate] }, listCatalogos)
    fastify.post('/catalogo', { preHandler: [authenticate] }, createCatalogo)
    fastify.get('/catalogo/produtos/busca', { preHandler: [authenticate] }, buscarProdutosCiss)
    fastify.get('/catalogo/:catalogoId/produtos', { preHandler: [authenticate] }, listProdutosCatalogo)
    fastify.post('/catalogo/:catalogoId/produtos', { preHandler: [authenticate] }, addProdutoCatalogo)
    fastify.delete('/catalogo/:catalogoId/produtos/:codigoProduto', { preHandler: [authenticate] }, removeProdutoCatalogo)

    // Foto do produto é pública (vitrine), usada tanto no painel quanto na loja do cliente.
    fastify.get('/catalogo/produtos/:codigoProduto/imagem', getImagemProduto)
}
