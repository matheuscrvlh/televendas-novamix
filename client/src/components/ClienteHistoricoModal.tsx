import { useMemo, useState, type ReactNode } from 'react'
import Modal from './Modal'
import Spinner from './Spinner'
import ProdutoThumbnail from './ProdutoThumbnail'
import ItensCompraLista from './ItensCompraLista'
import { ChevronDownIcon } from './icons'
import { useTelevendas } from '../hooks/useTelevendas'
import { formatCurrency, formatDate, formatQuantidade } from '../lib/format'
import type {
    ClienteResumo,
    HistoricoCliente,
    ItemCompradoCliente,
    PedidoHistoricoCliente,
    ProdutoHistoricoCliente,
} from '../types/televendas'

type Aba = 'produtos' | 'compras'

type ClienteHistoricoModalProps = {
    cliente: ClienteResumo | null
    onClose: () => void
}

/**
 * Histórico completo do cliente com o time de televendas (sem filtro de datas):
 * resumo, produtos que ele mais compra e todas as compras com os itens de cada uma.
 */
export default function ClienteHistoricoModal({ cliente, onClose }: ClienteHistoricoModalProps) {
    const [aba, setAba] = useState<Aba>('produtos')

    const { data, loading, erro } = useTelevendas<HistoricoCliente>(
        `/televendas/clientes/${cliente?.IDCLIFOR ?? 0}/historico`,
        {},
        cliente !== null
    )

    const produtos = data?.produtos ?? []
    const pedidos = data?.pedidos ?? []
    const primeiraCompra = pedidos.length > 0 ? pedidos[pedidos.length - 1].DTMOVIMENTO : null

    const subtitulo =
        !loading && primeiraCompra && cliente
            ? `Cliente desde ${formatDate(primeiraCompra)} · última compra ${textoDias(cliente.DIAS_SEM_COMPRAR)}`
            : 'Histórico de compras'

    return (
        <Modal isOpen={cliente !== null} onClose={onClose} titulo={cliente?.CLIENTE} subtitulo={subtitulo} tamanho='xl'>
            {loading && (
                <div className='flex justify-center py-8'>
                    <Spinner className='h-6 w-6' />
                </div>
            )}

            {!loading && erro && <p className='text-sm font-medium text-red-base'>{erro}</p>}

            {!loading && !erro && pedidos.length === 0 && (
                <p className='text-sm text-gray-dark dark:text-dark-text-muted'>
                    Nenhuma compra com o time de televendas.
                </p>
            )}

            {!loading && !erro && cliente && pedidos.length > 0 && (
                <>
                    <Resumo pedidos={pedidos} />

                    <div className='sticky top-0 z-10 mt-5 flex gap-1.5 bg-white pb-3 dark:bg-dark-surface'>
                        <AbaBotao ativa={aba === 'produtos'} onClick={() => setAba('produtos')}>
                            Mais comprados ({produtos.length})
                        </AbaBotao>
                        <AbaBotao ativa={aba === 'compras'} onClick={() => setAba('compras')}>
                            Compras ({pedidos.length})
                        </AbaBotao>
                    </div>

                    {aba === 'produtos' ? (
                        <ProdutosMaisComprados produtos={produtos} totalCompras={pedidos.length} />
                    ) : (
                        <ListaCompras idclifor={cliente.IDCLIFOR} pedidos={pedidos} />
                    )}
                </>
            )}
        </Modal>
    )
}

function textoDias(dias: number) {
    if (dias <= 0) return 'hoje'
    if (dias === 1) return 'ontem'
    return `há ${dias} dias`
}

function Resumo({ pedidos }: { pedidos: PedidoHistoricoCliente[] }) {
    const total = pedidos.reduce((soma, p) => soma + p.TOTAL, 0)
    const ticket = total / pedidos.length

    const blocos = [
        { titulo: 'Total comprado', valor: formatCurrency(total) },
        { titulo: 'Compras', valor: String(pedidos.length) },
        { titulo: 'Ticket médio', valor: formatCurrency(ticket) },
        { titulo: 'Última compra', valor: formatDate(pedidos[0].DTMOVIMENTO) },
    ]

    return (
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
            {blocos.map((b) => (
                <div key={b.titulo} className='rounded-lg bg-gray px-3 py-2.5 dark:bg-dark-surface-2'>
                    <p className='text-[11px] font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                        {b.titulo}
                    </p>
                    <p className='mt-0.5 text-base font-semibold tabular-nums text-gray-text dark:text-dark-text'>
                        {b.valor}
                    </p>
                </div>
            ))}
        </div>
    )
}

function AbaBotao({ ativa, onClick, children }: { ativa: boolean; onClick: () => void; children: ReactNode }) {
    return (
        <button
            type='button'
            onClick={onClick}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                ativa
                    ? 'bg-orange-base text-white'
                    : 'bg-gray text-gray-dark hover:bg-orange-base/10 hover:text-orange-base dark:bg-dark-surface-2 dark:text-dark-text-muted'
            }`}
        >
            {children}
        </button>
    )
}

function ProdutosMaisComprados({
    produtos,
    totalCompras,
}: {
    produtos: ProdutoHistoricoCliente[]
    totalCompras: number
}) {
    const [busca, setBusca] = useState('')

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase()
        if (!termo) return produtos
        return produtos.filter((p) => p.PRODUTO.toLowerCase().includes(termo))
    }, [produtos, busca])

    return (
        <>
            {produtos.length > 8 && (
                <input
                    type='text'
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder='Buscar produto...'
                    className='mb-2 w-full rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text focus:border-orange-base focus:outline-none dark:border-dark-border dark:bg-dark-surface-2 dark:text-dark-text'
                />
            )}

            {filtrados.length === 0 && (
                <p className='py-4 text-sm text-gray-dark dark:text-dark-text-muted'>Nenhum produto encontrado.</p>
            )}

            <ul className='divide-y divide-gray-base/20 dark:divide-dark-border'>
                {filtrados.map((p) => {
                    const frequencia = Math.min(100, (p.VEZES / totalCompras) * 100)
                    return (
                        <li key={p.IDSUBPRODUTO} className='flex items-center gap-3 py-3'>
                            <ProdutoThumbnail codigoProduto={p.IDSUBPRODUTO} descricao={p.PRODUTO} className='h-11 w-11' />

                            <div className='min-w-0 flex-1'>
                                <p className='wrap-break-word text-sm font-medium leading-snug text-gray-text dark:text-dark-text'>
                                    {p.PRODUTO}
                                </p>
                                <div className='mt-1.5 flex items-center gap-2'>
                                    <div className='h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-gray dark:bg-dark-surface-2'>
                                        <div className='h-full rounded-full bg-orange-base' style={{ width: `${frequencia}%` }} />
                                    </div>
                                    <span className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                        em {p.VEZES} de {totalCompras} compra{totalCompras === 1 ? '' : 's'} · última em{' '}
                                        {formatDate(p.ULTIMA_COMPRA)}
                                    </span>
                                </div>
                            </div>

                            <div className='shrink-0 text-right'>
                                <p className='text-sm font-semibold tabular-nums text-gray-text dark:text-dark-text'>
                                    {formatCurrency(p.TOTAL)}
                                </p>
                                <p className='text-xs tabular-nums text-gray-dark dark:text-dark-text-muted'>
                                    qtd {formatQuantidade(p.QUANTIDADE)}
                                </p>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </>
    )
}

function chaveCompra(p: { IDEMPRESA: number; IDPLANILHA: number; DTMOVIMENTO: string }) {
    return `${p.IDEMPRESA}-${p.IDPLANILHA}-${p.DTMOVIMENTO}`
}

function ListaCompras({ idclifor, pedidos }: { idclifor: number; pedidos: PedidoHistoricoCliente[] }) {
    const [abertas, setAbertas] = useState<Set<string>>(() => new Set())

    function alternar(chave: string) {
        setAbertas((atual) => {
            const proximo = new Set(atual)
            if (proximo.has(chave)) proximo.delete(chave)
            else proximo.add(chave)
            return proximo
        })
    }

    return (
        <ul className='divide-y divide-gray-base/20 dark:divide-dark-border'>
            {pedidos.map((p) => {
                const chave = chaveCompra(p)
                const aberta = abertas.has(chave)
                return (
                    <li key={chave}>
                        <button
                            type='button'
                            onClick={() => alternar(chave)}
                            aria-expanded={aberta}
                            className='flex w-full items-center gap-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-orange-base/5'
                        >
                            <ChevronDownIcon
                                className={`h-4 w-4 shrink-0 text-gray-dark transition-transform dark:text-dark-text-muted ${
                                    aberta ? 'rotate-180' : ''
                                }`}
                            />
                            <span className='flex-1 text-sm text-gray-text dark:text-dark-text'>
                                <span className='font-medium'>{formatDate(p.DTMOVIMENTO)}</span>
                                <span className='ml-2 text-gray-dark dark:text-dark-text-muted'>
                                    {p.ITENS} ite{p.ITENS === 1 ? 'm' : 'ns'}
                                </span>
                            </span>
                            <span className='shrink-0 text-sm font-semibold tabular-nums text-gray-text dark:text-dark-text'>
                                {formatCurrency(p.TOTAL)}
                            </span>
                        </button>

                        {aberta && <ItensDaCompra idclifor={idclifor} pedido={p} />}
                    </li>
                )
            })}
        </ul>
    )
}

/** Busca os itens do dia da compra e mostra só os desta compra (o mesmo cliente pode ter 2 compras no dia). */
function ItensDaCompra({ idclifor, pedido }: { idclifor: number; pedido: PedidoHistoricoCliente }) {
    const { data, loading, erro } = useTelevendas<ItemCompradoCliente[]>(
        `/televendas/clientes/${idclifor}/itens`,
        { inicio: pedido.DTMOVIMENTO, fim: pedido.DTMOVIMENTO },
        true
    )

    const itens = useMemo(
        () =>
            (data ?? []).filter((i) => i.IDEMPRESA === pedido.IDEMPRESA && i.IDPLANILHA === pedido.IDPLANILHA),
        [data, pedido.IDEMPRESA, pedido.IDPLANILHA]
    )

    return (
        <div className='mb-3 ml-9 rounded-lg bg-gray/60 px-3 dark:bg-dark-surface-2/60'>
            {loading && (
                <div className='flex justify-center py-4'>
                    <Spinner className='h-5 w-5' />
                </div>
            )}
            {!loading && erro && <p className='py-3 text-sm font-medium text-red-base'>{erro}</p>}
            {!loading && !erro && <ItensCompraLista itens={itens} />}
        </div>
    )
}
