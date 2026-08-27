import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ClienteShell from '../../components/cliente/ClienteShell'
import Spinner from '../../components/Spinner'
import { useClienteMe } from '../../hooks/useClienteMe'
import { clienteApiGet } from '../../lib/clienteApi'
import { formatCurrency, formatDate } from '../../lib/format'
import { pedidoStatusCor, pedidoStatusLabel } from '../../lib/pedidoStatus'
import type { PedidoResumo } from '../../types/cliente'

export default function MinhaConta() {
    const { cliente } = useClienteMe()

    const [pedidos, setPedidos] = useState<PedidoResumo[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    useEffect(() => {
        clienteApiGet<PedidoResumo[]>('/cliente/pedidos')
            .then(setPedidos)
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }, [])

    return (
        <ClienteShell>
            <h1 className='text-2xl font-semibold text-gray-text dark:text-dark-text'>Minha conta</h1>

            {cliente && (
                <div className='mt-6 min-w-0 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                    <p className='wrap-break-word text-sm font-medium text-gray-text dark:text-dark-text'>{cliente.razaoSocial}</p>
                    <p className='mt-1 break-all text-sm text-gray-dark dark:text-dark-text-muted'>{cliente.email}</p>
                    {cliente.telefone && (
                        <p className='text-sm text-gray-dark dark:text-dark-text-muted'>{cliente.telefone}</p>
                    )}
                </div>
            )}

            <h2 className='mt-8 text-lg font-semibold text-gray-text dark:text-dark-text'>Meus pedidos</h2>

            {loading && (
                <div className='mt-6 flex justify-center'>
                    <Spinner className='h-6 w-6' />
                </div>
            )}

            {erro && <p className='mt-6 text-sm text-red-base'>{erro}</p>}

            {!loading && !erro && pedidos.length === 0 && (
                <p className='mt-4 text-sm text-gray-dark dark:text-dark-text-muted'>
                    Você ainda não fez nenhum pedido.
                </p>
            )}

            {!loading && pedidos.length > 0 && (
                <div className='mt-4 flex flex-col gap-3'>
                    {pedidos.map((pedido) => (
                        <Link
                            key={pedido.id}
                            to={`/pedidos/${pedido.id}`}
                            className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-base/30 bg-white p-4 shadow-sm transition hover:border-orange-base hover:shadow-md dark:border-dark-border dark:bg-dark-surface'
                        >
                            <div>
                                <p className='text-sm font-medium text-gray-text dark:text-dark-text'>
                                    Pedido #{pedido.id.slice(0, 8).toUpperCase()} · {formatDate(pedido.criado_em.slice(0, 10))}
                                </p>
                                <span
                                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${pedidoStatusCor(pedido.status)}`}
                                >
                                    {pedidoStatusLabel(pedido.status)}
                                </span>
                            </div>
                            <span className='text-sm font-semibold text-gray-text dark:text-dark-text'>
                                {formatCurrency(pedido.valor_total)}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </ClienteShell>
    )
}
