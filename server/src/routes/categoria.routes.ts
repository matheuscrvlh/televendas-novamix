import { authenticate } from '../middlewares/auth.middlewares'
import {
    listCategorias,
    createCategoria,
    updateCategoria,
    updateCategoriaImagem,
    deleteCategoria,
    buscarProdutosCiss,
    listProdutos,
    createProduto,
    updateProduto,
    deleteProduto,
    getImagemProduto,
} from '../controllers/categoria.controller'

export function categoriaRoutes(fastify) {
    fastify.get('/categorias', { preHandler: [authenticate] }, listCategorias)
    fastify.post('/categorias', { preHandler: [authenticate] }, createCategoria)
    fastify.patch('/categorias/:id', { preHandler: [authenticate] }, updateCategoria)
    fastify.patch('/categorias/:id/imagem', { preHandler: [authenticate] }, updateCategoriaImagem)
    fastify.delete('/categorias/:id', { preHandler: [authenticate] }, deleteCategoria)

    fastify.get('/produtos', { preHandler: [authenticate] }, listProdutos)
    fastify.get('/produtos/busca', { preHandler: [authenticate] }, buscarProdutosCiss)
    fastify.post('/produtos', { preHandler: [authenticate] }, createProduto)
    fastify.patch('/produtos/:codigo', { preHandler: [authenticate] }, updateProduto)
    fastify.delete('/produtos/:codigo', { preHandler: [authenticate] }, deleteProduto)

    // Foto do produto é pública (vitrine), usada tanto no painel quanto na loja do cliente.
    fastify.get('/produtos/:codigoProduto/imagem', getImagemProduto)
}
