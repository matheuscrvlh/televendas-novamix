import { useMemo } from 'react'
import Modal from './Modal'
import Spinner from './Spinner'
import ItensCompraLista from './ItensCompraLista'
import { useTelevendas } from '../hooks/useTelevendas'
import { formatCurrency, formatDate } from '../lib/format'
import type { ItemCompradoCliente } from '../types/televendas'

type ClienteItensModalProps = {
    cliente: { IDCLIFOR: number; CLIENTE: string } | null
    inicio: string
    fim: string
    onClose: () => void
}

type Compra = {
    chave: string
    data: string
    total: number
    itens: ItemCompradoCliente[]
}

/** Separa as linhas por compra (empresa + planilha), mantendo a ordem do servidor: mais recente primeiro. */
function agruparPorCompra(itens: ItemCompradoCliente[]): Compra[] {
    const compras = new Map<string, Compra>()
    for (const item of itens) {
        const chave = `${item.IDEMPRESA}-${item.IDPLANILHA}-${item.DTMOVIMENTO}`
        let compra = compras.get(chave)
        if (!compra) {
            compra = { chave, data: item.DTMOVIMENTO, total: 0, itens: [] }
            compras.set(chave, compra)
        }
        compra.total += item.TOTAL
        compra.itens.push(item)
    }
    return [...compras.values()]
}

/** Modal do Top 10: o que o cliente comprou dentro do período escolhido no filtro de datas. */
export default function ClienteItensModal({ cliente, inicio, fim, onClose }: ClienteItensModalProps) {
    const { data, loading, erro } = useTelevendas<ItemCompradoCliente[]>(
        `/televendas/clientes/${cliente?.IDCLIFOR ?? 0}/itens`,
        { inicio, fim },
        cliente !== null
    )

    const compras = useMemo(() => agruparPorCompra(data ?? []), [data])
    const totalPeriodo = compras.reduce((soma, c) => soma + c.total, 0)
    const periodo = inicio === fim ? `em ${formatDate(inicio)}` : `de ${formatDate(inicio)} a ${formatDate(fim)}`

    return (
        <Modal
            isOpen={cliente !== null}
            onClose={onClose}
            titulo={cliente?.CLIENTE}
            subtitulo={`Itens comprados ${periodo}`}
            tamanho='xl'
        >
            {loading && (
                <div className='flex justify-center py-8'>
                    <Spinner className='h-6 w-6' />
                </div>
            )}

            {!loading && erro && <p className='text-sm font-medium text-red-base'>{erro}</p>}

            {!loading && !erro && compras.length === 0 && (
                <p className='text-sm text-gray-dark dark:text-dark-text-muted'>Nenhum item comprado nesse período.</p>
            )}

            {!loading && !erro && compras.length > 0 && (
                <>
                    <p className='text-sm text-gray-dark dark:text-dark-text-muted'>
                        <span className='font-semibold text-gray-text dark:text-dark-text'>
                            {formatCurrency(totalPeriodo)}
                        </span>{' '}
                        em {compras.length} compra{compras.length === 1 ? '' : 's'}
                    </p>

                    <div className='mt-4 flex flex-col gap-4'>
                        {compras.map((compra) => (
                            <section
                                key={compra.chave}
                                className='rounded-lg border border-gray-base/30 px-4 py-1 dark:border-dark-border'
                            >
                                <header className='flex items-baseline justify-between gap-3 border-b border-gray-base/20 py-2.5 dark:border-dark-border'>
                                    <span className='text-sm font-semibold text-gray-text dark:text-dark-text'>
                                        {formatDate(compra.data)}
                                        <span className='ml-2 font-normal text-gray-dark dark:text-dark-text-muted'>
                                            {compra.itens.length} ite{compra.itens.length === 1 ? 'm' : 'ns'}
                                        </span>
                                    </span>
                                    <span className='text-sm font-semibold tabular-nums text-orange-base'>
                                        {formatCurrency(compra.total)}
                                    </span>
                                </header>
                                <ItensCompraLista itens={compra.itens} />
                            </section>
                        ))}
                    </div>
                </>
            )}
        </Modal>
    )
}
