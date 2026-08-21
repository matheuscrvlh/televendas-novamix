import { authenticate } from '../middlewares/auth.middlewares'
import { listBanners, listBannersAdmin, createBanner, updateBanner, deleteBanner } from '../controllers/banner.controller'

export function bannerRoutes(fastify) {
    fastify.get('/banners', listBanners)
    fastify.get('/marketing/banners', { preHandler: [authenticate] }, listBannersAdmin)
    fastify.post('/marketing/banners', { preHandler: [authenticate] }, createBanner)
    fastify.patch('/marketing/banners/:id', { preHandler: [authenticate] }, updateBanner)
    fastify.delete('/marketing/banners/:id', { preHandler: [authenticate] }, deleteBanner)
}
