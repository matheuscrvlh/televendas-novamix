import { useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'
import ProdutoCard from './ProdutoCard'
import type { ProdutoCatalogo } from '../../types/categoria'

type ProdutoCarouselProps = {
    titulo: string
    icone?: ReactNode
    produtos: ProdutoCatalogo[]
    /** Quando informado, o título vira link (ex.: leva pra vitrine da categoria). */
    to?: string
}

export default function ProdutoCarousel({ titulo, icone, produtos, to }: ProdutoCarouselProps) {
    const trilhaRef = useRef<HTMLDivElement>(null)

    function rolar(direcao: 1 | -1) {
        const trilha = trilhaRef.current
        if (!trilha) return
        trilha.scrollBy({ left: direcao * trilha.clientWidth * 0.9, behavior: 'smooth' })
    }

    if (produtos.length === 0) return null

    const conteudoTitulo = (
        <>
            {icone}
            {titulo}
        </>
    )

    return (
        <div className='mt-8'>
            <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-lg font-semibold text-gray-text dark:text-dark-text'>
                    {to ? (
                        <Link to={to} className='flex items-center gap-2 transition hover:text-orange-base dark:hover:text-orange-light'>
                            {conteudoTitulo}
                        </Link>
                    ) : (
                        <span className='flex items-center gap-2'>{conteudoTitulo}</span>
                    )}
                </h2>
                <div className='hidden gap-2 sm:flex'>
                    <button
                        type='button'
                        onClick={() => rolar(-1)}
                        aria-label='Ver anteriores'
                        className='rounded-full border border-gray-base/30 p-1.5 text-gray-text transition hover:bg-orange-base/10 hover:text-orange-base dark:border-dark-border dark:text-dark-text'
                    >
                        <ChevronLeftIcon className='h-4 w-4' />
                    </button>
                    <button
                        type='button'
                        onClick={() => rolar(1)}
                        aria-label='Ver próximos'
                        className='rounded-full border border-gray-base/30 p-1.5 text-gray-text transition hover:bg-orange-base/10 hover:text-orange-base dark:border-dark-border dark:text-dark-text'
                    >
                        <ChevronRightIcon className='h-4 w-4' />
                    </button>
                </div>
            </div>

            <div ref={trilhaRef} className='flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                {produtos.map((produto) => (
                    <ProdutoCard key={produto.CODIGO_PRODUTO} produto={produto} className='w-60 shrink-0' />
                ))}
            </div>
        </div>
    )
}
