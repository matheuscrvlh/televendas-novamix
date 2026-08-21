import { useState } from 'react'
import { ImageIcon } from './icons'
import { produtoImagemUrl } from '../lib/imagens'

type ProdutoThumbnailProps = {
    codigoProduto: number
    descricao: string
    className?: string
}

export default function ProdutoThumbnail({ codigoProduto, descricao, className = 'h-10 w-10' }: ProdutoThumbnailProps) {
    const [semFoto, setSemFoto] = useState(false)

    return (
        <div
            className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray dark:bg-dark-surface-2 ${className}`}
        >
            {semFoto ? (
                <ImageIcon className='h-4 w-4 text-gray-dark/40 dark:text-dark-text-muted/40' />
            ) : (
                <img
                    src={produtoImagemUrl(codigoProduto)}
                    alt={descricao}
                    loading='lazy'
                    className='h-full w-full object-contain'
                    onError={() => setSemFoto(true)}
                />
            )}
        </div>
    )
}
