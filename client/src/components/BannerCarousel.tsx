import { useEffect, useState, type CSSProperties } from 'react'
import { apiGet } from '../lib/api'
import type { Banner } from '../types/marketing'

const API_URL = import.meta.env.VITE_API_URL
const INTERVALO_MS = 5000

function bannerImagemUrl(path: string) {
    return `${API_URL}${path}`
}

export default function BannerCarousel() {
    const [banners, setBanners] = useState<Banner[]>([])
    const [indice, setIndice] = useState(0)

    useEffect(() => {
        apiGet<Banner[]>('/banners')
            .then(setBanners)
            .catch(() => setBanners([]))
    }, [])

    useEffect(() => {
        if (banners.length <= 1) return
        const timer = setInterval(() => setIndice((i) => (i + 1) % banners.length), INTERVALO_MS)
        return () => clearInterval(timer)
    }, [banners.length])

    if (banners.length === 0) return null

    return (
        <div className='relative w-full overflow-hidden bg-orange-base aspect-[425/495] md:aspect-1920/650'>
            {banners.map((banner, i) => {
                const visivel = i === indice
                const estilo: CSSProperties = {
                    position: 'absolute',
                    inset: 0,
                    opacity: visivel ? 1 : 0,
                    transition: 'opacity 0.7s',
                    pointerEvents: visivel ? 'auto' : 'none',
                }

                const imagens = (
                    <>
                        <img src={bannerImagemUrl(banner.imagem)} alt='' className='hidden h-full w-full object-cover md:block' />
                        <img
                            src={bannerImagemUrl(banner.imagem_mobile ?? banner.imagem)}
                            alt=''
                            className='h-full w-full object-cover md:hidden'
                        />
                    </>
                )

                return banner.link ? (
                    <a key={banner.id} href={banner.link} target='_blank' rel='noopener noreferrer' style={estilo}>
                        {imagens}
                    </a>
                ) : (
                    <div key={banner.id} style={estilo}>
                        {imagens}
                    </div>
                )
            })}

            {banners.length > 1 && (
                <div className='absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5'>
                    {banners.map((banner, i) => (
                        <button
                            key={banner.id}
                            type='button'
                            onClick={() => setIndice(i)}
                            aria-label={`Ver banner ${i + 1}`}
                            className={`h-2 rounded-full transition-all ${i === indice ? 'w-4 bg-white' : 'w-2 bg-white/50'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
