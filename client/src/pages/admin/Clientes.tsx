import { useEffect, useMemo, useState } from 'react'
import PageShell from '../../components/PageShell'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import { MessageCircleIcon } from '../../components/icons'
import { useMe } from '../../hooks/useMe'
import { apiGet } from '../../lib/api'
import { formatCurrency, formatDate, formatNumber } from '../../lib/format'
import { pedidoStatusLabel, pedidoStatusCor } from '../../lib/pedidoStatus'
import type { ClienteAdmin, PedidoResumoCliente } from '../../types/clienteAdmin'

type Filtro = 'todos' | 'com_pedidos' | 'sem_pedidos'

const FILTROS: { id: Filtro; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'com_pedidos', label: 'Com pedidos' },
    { id: 'sem_pedidos', label: 'Sem pedidos' },
]

type UltimasComprasModalProps = {
    cliente: ClienteAdmin | null
    onClose: () => void
}

function UltimasComprasModal({ cliente, onClose }: UltimasComprasModalProps) {
    const [pedidos, setPedidos] = useState<PedidoResumoCliente[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    useEffect(() => {
        if (!cliente) return

        setLoading(true)
        setErro(null)
        apiGet<PedidoResumoCliente[]>(`/clientes/${cliente.id}/pedidos`)
            .then(setPedidos)
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }, [cliente])

    return (
        <Modal isOpen={cliente != null} onClose={onClose} titulo={cliente ? `Últimas compras — ${cliente.razao_social}` : undefined}>
            {erro && <p className='text-sm text-red-base'>{erro}</p>}

            {!erro && loading && (
                <div className='flex justify-center py-6'>
                    <Spinner className='h-6 w-6' />
                </div>
            )}

            {!erro && !loading && pedidos.length === 0 && (
                <p className='text-sm text-gray-dark dark:text-dark-text-muted'>Esse cliente ainda não fez pedidos.</p>
            )}

            {!erro && !loading && pedidos.length > 0 && (
                <ul className='flex flex-col divide-y divide-gray-base/20 dark:divide-dark-border'>
                    {pedidos.map((pedido) => (
                        <li key={pedido.id} className='flex items-center justify-between gap-3 py-2.5'>
                            <div>
                                <p className='text-sm text-gray-text dark:text-dark-text'>
                                    {formatDate(pedido.criado_em.slice(0, 10))}
                                </p>
                                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${pedidoStatusCor(pedido.status)}`}>
                                    {pedidoStatusLabel(pedido.status)}
                                </span>
                            </div>
                            <span className='text-sm font-semibold text-gray-text dark:text-dark-text'>
                                {formatCurrency(pedido.valor_total)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </Modal>
    )
}

export default function ClientesAdmin() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const autorizado = me?.isAdmin ?? false

    const [busca, setBusca] = useState('')
    const [filtro, setFiltro] = useState<Filtro>('todos')
    const [clientes, setClientes] = useState<ClienteAdmin[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const [clienteSelecionado, setClienteSelecionado] = useState<ClienteAdmin | null>(null)

    useEffect(() => {
        if (!autorizado) return

        setLoading(true)
        setErro(null)

        apiGet<ClienteAdmin[]>('/clientes')
            .then(setClientes)
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }, [autorizado])

    const clientesFiltrados = useMemo(() => {
        let lista = clientes

        if (filtro === 'com_pedidos') lista = lista.filter((c) => c.pedidos_total > 0)
        else if (filtro === 'sem_pedidos') lista = lista.filter((c) => c.pedidos_total === 0)

        const termo = busca.trim().toLowerCase()
        if (!termo) return lista

        return lista.filter(
            (c) =>
                c.razao_social.toLowerCase().includes(termo) ||
                c.email.toLowerCase().includes(termo) ||
                (c.telefone ?? '').toLowerCase().includes(termo) ||
                (c.cpf_cnpj ?? '').toLowerCase().includes(termo)
        )
    }, [clientes, busca, filtro])

    return (
        <PageShell
            isAdmin={autorizado}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={autorizado}
            tituloAcessoRestrito='Clientes é uma área restrita a administradores.'
            titulo='Clientes'
            subtitulo='Clientes cadastrados na loja online.'
        >
            <div className='mb-4 flex flex-wrap items-center gap-3'>
                <input
                    type='text'
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder='Buscar por nome, e-mail, telefone ou CPF/CNPJ...'
                    className='w-full max-w-sm rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text focus:border-orange-base focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                />

                <div className='flex flex-wrap gap-1.5'>
                    {FILTROS.map((f) => (
                        <button
                            key={f.id}
                            type='button'
                            onClick={() => setFiltro(f.id)}
                            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                                filtro === f.id
                                    ? 'bg-orange-base text-white'
                                    : 'border border-gray-base/30 text-gray-text hover:border-orange-base dark:border-dark-border dark:text-dark-text'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className='rounded-xl border border-gray-base/30 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                {erro && <p className='p-6 text-sm text-red-base'>{erro}</p>}

                {!erro && loading && (
                    <div className='flex justify-center py-10'>
                        <Spinner className='h-6 w-6' />
                    </div>
                )}

                {!erro && !loading && clientesFiltrados.length === 0 && (
                    <p className='p-6 text-sm text-gray-dark dark:text-dark-text-muted'>Nenhum cliente encontrado.</p>
                )}

                {!erro && !loading && clientesFiltrados.length > 0 && (
                    <div className='overflow-x-auto'>
                        <table className='w-full min-w-max border-collapse text-sm'>
                            <thead>
                                <tr className='border-b border-gray-base/30 dark:border-dark-border'>
                                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Cliente
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Telefone
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        CPF/CNPJ
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Código CISS
                                    </th>
                                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Cadastro
                                    </th>
                                    <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Pedidos
                                    </th>
                                    <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Total comprado
                                    </th>
                                    <th className='px-4 py-3' />
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-base/20 dark:divide-dark-border'>
                                {clientesFiltrados.map((cliente) => (
                                    <tr key={cliente.id} className='hover:bg-gray/50 dark:hover:bg-dark-surface-2/50'>
                                        <td className='px-4 py-3'>
                                            <p className='font-medium text-gray-text dark:text-dark-text'>
                                                {cliente.razao_social}
                                            </p>
                                            <p className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                                {cliente.email}
                                            </p>
                                        </td>
                                        <td className='px-4 py-3 text-gray-text dark:text-dark-text'>
                                            {cliente.telefone ?? '—'}
                                        </td>
                                        <td className='px-4 py-3 text-gray-text dark:text-dark-text'>
                                            {cliente.cpf_cnpj ?? '—'}
                                        </td>
                                        <td className='px-4 py-3 text-gray-text dark:text-dark-text'>
                                            {cliente.codigo_cliente_ciss}
                                        </td>
                                        <td className='px-4 py-3 text-gray-text dark:text-dark-text'>
                                            {formatDate(cliente.criado_em.slice(0, 10))}
                                        </td>
                                        <td className='px-4 py-3 text-right tabular-nums text-gray-text dark:text-dark-text'>
                                            {formatNumber(cliente.pedidos_total)}
                                        </td>
                                        <td className='px-4 py-3 text-right tabular-nums font-medium text-gray-text dark:text-dark-text'>
                                            {formatCurrency(cliente.valor_total_pedidos)}
                                        </td>
                                        <td className='px-4 py-3 text-right'>
                                            <button
                                                type='button'
                                                onClick={() => setClienteSelecionado(cliente)}
                                                title='Ver últimas compras'
                                                aria-label={`Ver últimas compras de ${cliente.razao_social}`}
                                                className='rounded-lg p-1.5 text-gray-dark transition hover:bg-orange-base/10 hover:text-orange-base dark:text-dark-text-muted'
                                            >
                                                <MessageCircleIcon className='h-4 w-4' />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <UltimasComprasModal cliente={clienteSelecionado} onClose={() => setClienteSelecionado(null)} />
        </PageShell>
    )
}
