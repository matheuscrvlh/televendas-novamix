import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import Spinner from '../../components/Spinner'
import { useMe } from '../../hooks/useMe'
import { apiGet } from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/format'
import { pedidoStatusLabel, PEDIDO_STATUS_LABEL } from '../../lib/pedidoStatus'
import type { PedidoAdminResumo } from '../../types/pedidoAdmin'

const STATUS_BADGE_CLASS: Record<string, string> = {
    enviado: 'bg-blue-base/10 text-blue-base',
    em_analise: 'bg-orange-base/10 text-orange-base',
    aguardando_confirmacao_cliente: 'bg-yellow-base/20 text-gray-text dark:text-dark-text',
    confirmado: 'bg-green-base/10 text-green-base',
    separando: 'bg-orange-base/10 text-orange-base',
    faturado: 'bg-blue-base/10 text-blue-base',
    saiu_para_entrega: 'bg-orange-base/10 text-orange-base',
    entregue: 'bg-green-base/10 text-green-base',
    cancelado: 'bg-red-light/10 text-red-base',
}

export default function PedidosAdmin() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const autorizado = me?.isAdmin ?? false

    const [status, setStatus] = useState('')
    const [pedidos, setPedidos] = useState<PedidoAdminResumo[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    useEffect(() => {
        if (!autorizado) return

        setLoading(true)
        setErro(null)

        apiGet<PedidoAdminResumo[]>('/pedidos', status ? { status } : undefined)
            .then(setPedidos)
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }, [autorizado, status])

    return (
        <PageShell
            isAdmin={autorizado}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={autorizado}
            tituloAcessoRestrito='Pedidos é uma área restrita a administradores.'
            titulo='Pedidos'
            subtitulo='Acompanhe e gerencie os pedidos feitos pelos clientes.'
        >
            <div className='mb-4 flex flex-wrap items-center gap-2'>
                <button
                    type='button'
                    onClick={() => setStatus('')}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        status === ''
                            ? 'bg-orange-base text-white'
                            : 'border border-gray-base/30 text-gray-text hover:border-orange-base dark:border-dark-border dark:text-dark-text'
                    }`}
                >
                    Todos
                </button>
                {Object.entries(PEDIDO_STATUS_LABEL).map(([valor, label]) => (
                    <button
                        key={valor}
                        type='button'
                        onClick={() => setStatus(valor)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                            status === valor
                                ? 'bg-orange-base text-white'
                                : 'border border-gray-base/30 text-gray-text hover:border-orange-base dark:border-dark-border dark:text-dark-text'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className='rounded-xl border border-gray-base/30 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                {erro && <p className='p-6 text-sm text-red-base'>{erro}</p>}

                {!erro && loading && (
                    <div className='flex justify-center py-10'>
                        <Spinner className='h-6 w-6' />
                    </div>
                )}

                {!erro && !loading && pedidos.length === 0 && (
                    <p className='p-6 text-sm text-gray-dark dark:text-dark-text-muted'>Nenhum pedido encontrado.</p>
                )}

                {!erro && !loading && pedidos.length > 0 && (
                    <div className='overflow-x-auto'>
                        <table className='w-full min-w-max border-collapse text-sm'>
                            <thead>
                                <tr className='border-b border-gray-base/30 dark:border-dark-border'>
                                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Pedido
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Cliente
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Status
                                    </th>
                                    <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Valor
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-base/20 dark:divide-dark-border'>
                                {pedidos.map((pedido) => (
                                    <tr key={pedido.id} className='hover:bg-gray/50 dark:hover:bg-dark-surface-2/50'>
                                        <td className='px-4 py-3'>
                                            <Link
                                                to={`/dashboard/pedidos/${pedido.id}`}
                                                className='font-medium text-gray-text hover:text-orange-base dark:text-dark-text dark:hover:text-orange-light'
                                            >
                                                #{pedido.id.slice(0, 8).toUpperCase()}
                                            </Link>
                                            <p className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                                {formatDate(pedido.criado_em.slice(0, 10))}
                                            </p>
                                        </td>
                                        <td className='px-4 py-3 text-gray-text dark:text-dark-text'>
                                            <p>{pedido.razao_social}</p>
                                            <p className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                                {pedido.email}
                                            </p>
                                        </td>
                                        <td className='px-4 py-3'>
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    STATUS_BADGE_CLASS[pedido.status] ?? 'bg-gray text-gray-text'
                                                }`}
                                            >
                                                {pedidoStatusLabel(pedido.status)}
                                            </span>
                                        </td>
                                        <td className='px-4 py-3 text-right tabular-nums font-medium text-gray-text dark:text-dark-text'>
                                            {formatCurrency(pedido.valor_total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </PageShell>
    )
}
