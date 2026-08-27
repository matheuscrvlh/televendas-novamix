import { useState } from 'react'
import { HeartIcon, ImageIcon } from '../icons'
import { useCarrinho } from '../../contexts/CarrinhoContext'
import { useFavoritos } from '../../contexts/FavoritosContext'
import { formatCurrency, formatNumber } from '../../lib/format'
import { produtoImagemUrl } from '../../lib/imagens'
import type { ProdutoCatalogo } from '../../types/categoria'

type ProdutoCardProps = {
    produto: ProdutoCatalogo
    className?: string
}

export default function ProdutoCard({ produto, className }: ProdutoCardProps) {
    const { adicionar } = useCarrinho()
    const { isFavorito, alternar } = useFavoritos()

    const [quantidade, setQuantidade] = useState(1)
    const [adicionado, setAdicionado] = useState(false)
    const [semFoto, setSemFoto] = useState(false)

    const semEstoque = produto.ESTOQUE <= 0
    const semPreco = produto.PRECO == null
    const emPromocao = produto.PRECO_ORIGINAL != null && produto.PRECO != null && produto.PRECO < produto.PRECO_ORIGINAL
    const favorito = isFavorito(produto.CODIGO_PRODUTO)

    function handleAdicionar() {
        if (produto.PRECO == null) return

        adicionar(
            { codigoProduto: produto.CODIGO_PRODUTO, descricao: produto.DESCRICAO, precoUnitario: produto.PRECO },
            quantidade
        )

        setAdicionado(true)
        setTimeout(() => setAdicionado(false), 1500)
    }

    return (
        <div
            className={`flex flex-col rounded-xl border border-gray-base/30 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-base/50 hover:shadow-md dark:border-dark-border dark:bg-dark-surface ${className ?? ''}`}
        >
            <div className='relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray dark:bg-dark-surface-2'>
                <button
                    type='button'
                    onClick={() => alternar(produto)}
                    aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    aria-pressed={favorito}
                    className={`absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 shadow-sm transition hover:scale-105 dark:bg-dark-surface/90 ${
                        favorito ? 'text-red-base' : 'text-gray-dark dark:text-dark-text-muted'
                    }`}
                >
                    <HeartIcon className='h-4 w-4' filled={favorito} />
                </button>

                {semEstoque && (
                    <span className='absolute left-2 top-2 rounded-full bg-red-base px-2 py-1 text-xs font-semibold text-white'>
                        Esgotado
                    </span>
                )}
                {emPromocao && !semEstoque && (
                    <span className='absolute bottom-2 left-2 rounded-full bg-orange-base px-2 py-1 text-xs font-semibold text-white'>
                        Promoção
                    </span>
                )}
                {semFoto ? (
                    <ImageIcon className='h-8 w-8 text-gray-dark/40 dark:text-dark-text-muted/40' />
                ) : (
                    <img
                        src={produtoImagemUrl(produto.CODIGO_PRODUTO)}
                        alt={produto.DESCRICAO}
                        loading='lazy'
                        className={`h-full w-full object-contain ${semEstoque ? 'opacity-50' : ''}`}
                        onError={() => setSemFoto(true)}
                    />
                )}
            </div>

            <p className='text-sm font-medium text-gray-text dark:text-dark-text'>{produto.DESCRICAO}</p>
            <p className='mt-1 text-xs text-gray-dark dark:text-dark-text-muted'>{produto.SECAO ?? 'Sem seção'}</p>

            <div className='mt-3 flex items-center justify-between'>
                <div className='flex items-baseline gap-2'>
                    <span className='text-lg font-semibold text-gray-text dark:text-dark-text'>
                        {semPreco ? '—' : formatCurrency(produto.PRECO!)}
                    </span>
                    {emPromocao && (
                        <span className='text-xs text-gray-dark line-through dark:text-dark-text-muted'>
                            {formatCurrency(produto.PRECO_ORIGINAL!)}
                        </span>
                    )}
                </div>
                {!semEstoque && (
                    <span className='text-xs font-medium text-green-base'>{formatNumber(produto.ESTOQUE)} em estoque</span>
                )}
            </div>

            <div className='mt-3 flex items-center gap-2'>
                <input
                    type='number'
                    min={1}
                    disabled={semEstoque}
                    value={quantidade || 1}
                    onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
                    className='w-16 rounded-lg border border-gray-base/30 bg-white px-2 py-1.5 text-sm text-gray-text disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                />
                <button
                    type='button'
                    disabled={semPreco || semEstoque}
                    onClick={handleAdicionar}
                    className='flex-1 rounded-lg bg-orange-base px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                >
                    {semEstoque ? 'Esgotado' : adicionado ? 'Adicionado ✓' : 'Adicionar'}
                </button>
            </div>
        </div>
    )
}
