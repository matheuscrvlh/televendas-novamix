import { useMemo, useState } from 'react'
import type { ClienteResumo } from '../types/televendas'
import { classificarCliente, type ClienteStatus } from '../lib/televendas'
import { formatCurrency } from '../lib/format'
import Spinner from './Spinner'

type Tab = 'todos' | 'top20' | 'ativos' | 'atencao' | 'inativos'

const TABS: { id: Tab; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'top20', label: 'Top 20' },
    { id: 'ativos', label: 'Ativos' },
    { id: 'atencao', label: 'Atenção' },
    { id: 'inativos', label: 'Inativos' },
]

const STATUS_COR: Record<ClienteStatus, string> = {
    ativo: 'bg-green-base',
    atencao: 'bg-gold',
    inativo: 'bg-red-base',
}

type ClientesPanelProps = {
    clientes: ClienteResumo[]
    loading: boolean
    erro: string | null
}

export default function ClientesPanel({ clientes, loading, erro }: ClientesPanelProps) {
    const [busca, setBusca] = useState('')
    const [tab, setTab] = useState<Tab>('todos')

    const filtrados = useMemo(() => {
        let lista = clientes

        if (busca.trim()) {
            const termo = busca.trim().toLowerCase()
            lista = lista.filter((c) => c.CLIENTE.toLowerCase().includes(termo))
        }

        if (tab === 'top20') {
            return [...lista].sort((a, b) => b.TOTAL_COMPRADO - a.TOTAL_COMPRADO).slice(0, 20)
        }

        if (tab === 'ativos' || tab === 'atencao' || tab === 'inativos') {
            const alvo: ClienteStatus = tab === 'ativos' ? 'ativo' : tab === 'inativos' ? 'inativo' : 'atencao'
            return lista.filter((c) => classificarCliente(c.DIAS_SEM_COMPRAR, c.FLAGINATIVO) === alvo)
        }

        return lista
    }, [clientes, busca, tab])

    return (
        <aside className='flex h-fit max-h-[calc(100vh-6rem)] w-full flex-col rounded-xl border border-gray-base/30 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface lg:sticky lg:top-6 lg:w-80 lg:shrink-0'>
            <div className='border-b border-gray-base/30 p-4 dark:border-dark-border'>
                <input
                    type='text'
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder='Buscar cliente...'
                    className='w-full rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text focus:border-orange-base focus:outline-none dark:border-dark-border dark:bg-dark-surface-2 dark:text-dark-text'
                />

                <div className='mt-3 flex flex-wrap gap-1.5'>
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            type='button'
                            onClick={() => setTab(t.id)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                tab === t.id
                                    ? 'bg-orange-base text-white'
                                    : 'bg-gray text-gray-dark hover:bg-orange-base/10 hover:text-orange-base dark:bg-dark-surface-2 dark:text-dark-text-muted'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className='flex-1 overflow-y-auto'>
                {erro && <div className='p-4 text-sm font-medium text-red-base'>{erro}</div>}

                {!erro && loading && (
                    <div className='flex items-center justify-center py-8'>
                        <Spinner className='h-5 w-5' />
                    </div>
                )}

                {!erro && !loading && filtrados.length === 0 && (
                    <div className='p-4 text-sm text-gray-dark dark:text-dark-text-muted'>Nenhum cliente encontrado.</div>
                )}

                {!erro && !loading && filtrados.length > 0 && (
                    <ul className='divide-y divide-gray-base/20 dark:divide-dark-border'>
                        {filtrados.map((c) => {
                            const status = classificarCliente(c.DIAS_SEM_COMPRAR, c.FLAGINATIVO)
                            return (
                                <li key={c.IDCLIFOR} className='flex items-start gap-2 px-4 py-3'>
                                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_COR[status]}`} />
                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate text-sm font-medium text-gray-text dark:text-dark-text'>
                                            {c.CLIENTE}
                                        </p>
                                        <p className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                            {c.PEDIDOS} pedido{c.PEDIDOS === 1 ? '' : 's'} · {c.DIAS_SEM_COMPRAR}d s/comprar
                                        </p>
                                    </div>
                                    <span className='shrink-0 text-sm font-semibold tabular-nums text-gray-text dark:text-dark-text'>
                                        {formatCurrency(c.TOTAL_COMPRADO)}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>

            <div className='border-t border-gray-base/30 px-4 py-2 text-xs text-gray-dark dark:border-dark-border dark:text-dark-text-muted'>
                {filtrados.length} cliente{filtrados.length === 1 ? '' : 's'}
            </div>
        </aside>
    )
}
