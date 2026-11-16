import ProdutoThumbnail from './ProdutoThumbnail'
import { formatCurrency, formatQuantidade } from '../lib/format'
import type { ItemCompradoCliente } from '../types/televendas'

type ItensCompraListaProps = {
    itens: ItemCompradoCliente[]
}

/** Produtos de uma compra: foto, nome, quantidade × preço unitário e total da linha. */
export default function ItensCompraLista({ itens }: ItensCompraListaProps) {
    return (
        <ul className='divide-y divide-gray-base/20 dark:divide-dark-border'>
            {itens.map((item) => {
                const unitario = item.QUANTIDADE > 0 ? item.TOTAL / item.QUANTIDADE : 0
                return (
                    <li key={item.IDSUBPRODUTO} className='flex items-center gap-3 py-2.5'>
                        <ProdutoThumbnail
                            codigoProduto={item.IDSUBPRODUTO}
                            descricao={item.PRODUTO}
                            className='h-10 w-10'
                        />
                        <div className='min-w-0 flex-1'>
                            <p className='wrap-break-word text-sm leading-snug text-gray-text dark:text-dark-text'>
                                {item.PRODUTO}
                            </p>
                            <p className='mt-0.5 text-xs tabular-nums text-gray-dark dark:text-dark-text-muted'>
                                {formatQuantidade(item.QUANTIDADE)} × {formatCurrency(unitario)}
                            </p>
                        </div>
                        <span className='shrink-0 text-sm font-semibold tabular-nums text-gray-text dark:text-dark-text'>
                            {formatCurrency(item.TOTAL)}
                        </span>
                    </li>
                )
            })}
        </ul>
    )
}
