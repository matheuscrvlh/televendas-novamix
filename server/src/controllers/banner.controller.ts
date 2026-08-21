import type { FastifyRequest, FastifyReply } from 'fastify'
import { requireAdmin } from '../middlewares/auth.middlewares'
import { querySupabase } from '../database/supabase.database'
import { salvarArquivo, removerArquivo } from '../services/upload.service'

interface BannerParams {
    id: string
}

export async function listBanners(_req: FastifyRequest, res: FastifyReply) {
    const banners = await querySupabase(
        'SELECT id, imagem, imagem_mobile, link, ordem, ativo FROM televendas.banners WHERE ativo = true ORDER BY ordem'
    )
    res.send(banners)
}

export async function listBannersAdmin(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const banners = await querySupabase(
        'SELECT id, imagem, imagem_mobile, link, ordem, ativo FROM televendas.banners ORDER BY ordem'
    )
    res.send(banners)
}

export async function createBanner(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    let imagem: string | null = null
    let imagemMobile: string | null = null
    let link: string | null = null

    try {
        for await (const part of req.parts()) {
            if (part.type === 'file' && part.fieldname === 'imagem') {
                imagem = await salvarArquivo('banners', part)
            } else if (part.type === 'file' && part.fieldname === 'imagem_mobile') {
                imagemMobile = await salvarArquivo('banners', part)
            } else if (part.type === 'field' && part.fieldname === 'link') {
                link = String(part.value ?? '').trim() || null
            }
        }
    } catch (err) {
        res.code(413).send({ error: err instanceof Error ? err.message : 'Erro ao processar o upload.' })
        return
    }

    if (!imagem) {
        res.code(400).send({ error: 'Envie a imagem do banner.' })
        return
    }

    const [{ proximaOrdem }] = await querySupabase<{ proximaOrdem: number }>(
        'SELECT COALESCE(MAX(ordem), -1) + 1 AS "proximaOrdem" FROM televendas.banners'
    )

    const [banner] = await querySupabase(
        `INSERT INTO televendas.banners (imagem, imagem_mobile, link, ordem)
         VALUES ($1, $2, $3, $4)
         RETURNING id, imagem, imagem_mobile, link, ordem, ativo`,
        [imagem, imagemMobile, link, proximaOrdem]
    )
    res.code(201).send(banner)
}

export async function updateBanner(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { id } = req.params as BannerParams
    const { link, ordem, ativo } = req.body as { link?: string | null; ordem?: number; ativo?: boolean }

    const [banner] = await querySupabase(
        `UPDATE televendas.banners
         SET link = COALESCE($1, link),
             ordem = COALESCE($2, ordem),
             ativo = COALESCE($3, ativo)
         WHERE id = $4
         RETURNING id, imagem, imagem_mobile, link, ordem, ativo`,
        [link, ordem, ativo, id]
    )

    if (!banner) {
        res.code(404).send({ error: 'Banner não encontrado.' })
        return
    }

    res.send(banner)
}

export async function deleteBanner(req: FastifyRequest, res: FastifyReply) {
    if (!(await requireAdmin(req, res))) return

    const { id } = req.params as BannerParams

    const [banner] = await querySupabase<{ imagem: string; imagem_mobile: string | null }>(
        'DELETE FROM televendas.banners WHERE id = $1 RETURNING imagem, imagem_mobile',
        [id]
    )

    if (!banner) {
        res.code(404).send({ error: 'Banner não encontrado.' })
        return
    }

    removerArquivo(banner.imagem)
    if (banner.imagem_mobile) removerArquivo(banner.imagem_mobile)

    res.code(204).send()
}
