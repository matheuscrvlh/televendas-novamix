import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ClienteShell from '../../components/cliente/ClienteShell'
import Spinner from '../../components/Spinner'
import { clienteApiGet } from '../../lib/clienteApi'
import { formatCurrency, formatDate } from '../../lib/format'
import { pedidoStatusLabel } from '../../lib/pedidoStatus'
import type { PedidoDetalhe as PedidoDetalheType } from '../../types/cliente'

export default function PedidoDetalhe() {
    const { pedidoId } = useParams<{ pedidoId: string }>()
    const [pedido, setPedido] = useState<PedidoDetalheType | null>(null)
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    useEffect(() => {
        if (!pedidoId) return

        clienteApiGet<PedidoDetalheType>(`/cliente/pedidos/${pedidoId}`)
            .then(setPedido)
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }, [pedidoId])

    return (
        <ClienteShell>
            <h1 className='text-2xl font-semibold text-gray-text dark:text-dark-text'>
                Pedido {pedido ? `#${pedido.id.slice(0, 8).toUpperCase()}` : ''}
            </h1>

            {loading && (
                <div className='mt-8 flex justify-center'>
                    <Spinner className='h-6 w-6' />
                </div>
            )}

            {erro && <p className='mt-6 text-sm text-red-base'>{erro}</p>}

            {pedido && (
                <div className='mt-6 flex flex-col gap-6'>
                    <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                        <div className='flex flex-wrap items-center justify-between gap-3'>
                            <span className='rounded-full bg-orange-base/10 px-3 py-1 text-sm font-semibold text-orange-base'>
                                {pedidoStatusLabel(pedido.status)}
                            </span>
                            <span className='text-lg font-semibold text-gray-text dark:text-dark-text'>
                                {formatCurrency(pedido.valor_total)}
                            </span>
                        </div>
                        {pedido.observacao && (
                            <p className='mt-3 text-sm text-gray-dark dark:text-dark-text-muted'>{pedido.observacao}</p>
                        )}
                    </div>

                    <div className='overflow-x-auto rounded-xl border border-gray-base/30 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                        <table className='w-full min-w-max border-collapse text-sm'>
                            <thead>
                                <tr className='border-b border-gray-base/30 dark:border-dark-border'>
                                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Produto
                                    </th>
                                    <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Qtd.
                                    </th>
                                    <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Preço
                                    </th>
                                    <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-base/20 dark:divide-dark-border'>
                                {pedido.itens.map((item) => (
                                    <tr key={item.codigo_produto}>
                                        <td className='px-4 py-3 text-gray-text dark:text-dark-text'>
                                            {item.descricao_produto}
                                        </td>
                                        <td className='px-4 py-3 text-right tabular-nums text-gray-text dark:text-dark-text'>
                                            {item.quantidade}
                                        </td>
                                        <td className='px-4 py-3 text-right tabular-nums text-gray-text dark:text-dark-text'>
                                            {formatCurrency(item.preco_unitario)}
                                        </td>
                                        <td className='px-4 py-3 text-right tabular-nums font-medium text-gray-text dark:text-dark-text'>
                                            {formatCurrency(item.preco_unitario * item.quantidade)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                        <span className='text-sm font-medium text-gray-text dark:text-dark-text'>
                            Acompanhamento
                        </span>
                        <ul className='mt-4 flex flex-col gap-3 border-l-2 border-orange-base/30 pl-4'>
                            {pedido.historico.map((h, i) => (
                                <li key={i} className='text-sm'>
                                    <p className='font-medium text-gray-text dark:text-dark-text'>
                                        {pedidoStatusLabel(h.status)}
                                    </p>
                                    <p className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                        {formatDate(h.criado_em.slice(0, 10))}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </ClienteShell>
    )
}
