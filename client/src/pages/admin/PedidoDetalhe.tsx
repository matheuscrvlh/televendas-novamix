import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import Spinner from '../../components/Spinner'
import ProdutoThumbnail from '../../components/ProdutoThumbnail'
import { useMe } from '../../hooks/useMe'
import { apiGet, apiPatch, apiDelete, ApiError } from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/format'
import { pedidoStatusLabel, PEDIDO_STATUS_LABEL } from '../../lib/pedidoStatus'
import type { PedidoAdminDetalhe } from '../../types/pedidoAdmin'

export default function PedidoDetalheAdmin() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const autorizado = me?.isAdmin ?? false

    const { pedidoId } = useParams<{ pedidoId: string }>()
    const [pedido, setPedido] = useState<PedidoAdminDetalhe | null>(null)
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    const [novoStatus, setNovoStatus] = useState('')
    const [motivo, setMotivo] = useState('')
    const [salvandoStatus, setSalvandoStatus] = useState(false)

    const [quantidades, setQuantidades] = useState<Record<number, number>>({})
    const [salvandoItem, setSalvandoItem] = useState<number | null>(null)
    const [acaoErro, setAcaoErro] = useState<string | null>(null)

    function carregar() {
        if (!pedidoId) return
        setLoading(true)
        setErro(null)
        apiGet<PedidoAdminDetalhe>(`/pedidos/${pedidoId}`)
            .then((p) => {
                setPedido(p)
                setNovoStatus(p.status)
                setQuantidades(Object.fromEntries(p.itens.map((i) => [i.codigo_produto, i.quantidade])))
            })
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(carregar, [pedidoId])

    async function salvarStatus() {
        if (!pedidoId || !pedido) return
        setSalvandoStatus(true)
        setAcaoErro(null)
        try {
            await apiPatch(`/pedidos/${pedidoId}/status`, { status: novoStatus, motivo: motivo.trim() || undefined })
            setMotivo('')
            carregar()
        } catch (err) {
            setAcaoErro(err instanceof ApiError ? err.message : 'Erro ao atualizar status.')
        } finally {
            setSalvandoStatus(false)
        }
    }

    async function salvarQuantidade(codigoProduto: number) {
        if (!pedidoId) return
        setSalvandoItem(codigoProduto)
        setAcaoErro(null)
        try {
            await apiPatch(`/pedidos/${pedidoId}/itens/${codigoProduto}`, {
                quantidade: quantidades[codigoProduto],
                motivo: motivo.trim() || undefined,
            })
            carregar()
        } catch (err) {
            setAcaoErro(err instanceof ApiError ? err.message : 'Erro ao alterar item.')
        } finally {
            setSalvandoItem(null)
        }
    }

    async function removerItem(codigoProduto: number) {
        if (!pedidoId) return
        setSalvandoItem(codigoProduto)
        setAcaoErro(null)
        try {
            await apiDelete(`/pedidos/${pedidoId}/itens/${codigoProduto}`, { motivo: motivo.trim() || undefined })
            carregar()
        } catch (err) {
            setAcaoErro(err instanceof ApiError ? err.message : 'Erro ao remover item.')
        } finally {
            setSalvandoItem(null)
        }
    }

    return (
        <PageShell
            isAdmin={autorizado}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={autorizado}
            tituloAcessoRestrito='Pedidos é uma área restrita a administradores.'
            titulo={pedido ? `Pedido #${pedido.id.slice(0, 8).toUpperCase()}` : 'Pedido'}
            subtitulo='Revise, ajuste itens e atualize o status do pedido.'
        >
            {loading && (
                <div className='flex justify-center py-10'>
                    <Spinner className='h-6 w-6' />
                </div>
            )}

            {erro && <p className='text-sm text-red-base'>{erro}</p>}

            {pedido && (
                <div className='flex flex-col gap-6'>
                    <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                        <span className='text-sm font-medium text-gray-text dark:text-dark-text'>Cliente</span>
                        <p className='mt-2 text-sm text-gray-text dark:text-dark-text'>{pedido.razao_social}</p>
                        <p className='text-sm text-gray-dark dark:text-dark-text-muted'>{pedido.email}</p>
                        {pedido.telefone && (
                            <p className='text-sm text-gray-dark dark:text-dark-text-muted'>{pedido.telefone}</p>
                        )}
                        {pedido.observacao && (
                            <p className='mt-3 rounded-lg bg-gray px-3 py-2 text-sm text-gray-text dark:bg-dark-surface-2 dark:text-dark-text'>
                                <span className='font-medium'>Observação do cliente:</span> {pedido.observacao}
                            </p>
                        )}
                    </div>

                    {acaoErro && (
                        <p className='rounded-lg bg-red-light/10 px-4 py-3 text-sm font-medium text-red-base'>
                            {acaoErro}
                        </p>
                    )}

                    <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                        <span className='text-sm font-medium text-gray-text dark:text-dark-text'>
                            Motivo da alteração
                        </span>
                        <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            rows={2}
                            placeholder='Opcional — usado tanto ao mudar o status quanto ao alterar/remover itens.'
                            className='mt-2 w-full rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />

                        <div className='mt-4 flex flex-wrap items-center gap-2'>
                            <select
                                value={novoStatus}
                                onChange={(e) => setNovoStatus(e.target.value)}
                                className='rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                            >
                                {Object.entries(PEDIDO_STATUS_LABEL).map(([valor, label]) => (
                                    <option key={valor} value={valor}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type='button'
                                onClick={salvarStatus}
                                disabled={salvandoStatus || novoStatus === pedido.status}
                                className='flex items-center justify-center rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                            >
                                {salvandoStatus ? <Spinner className='h-4 w-4' /> : 'Atualizar status'}
                            </button>
                            <span className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                Status atual: <span className='font-medium'>{pedidoStatusLabel(pedido.status)}</span>
                            </span>
                        </div>
                    </div>

                    <div className='min-w-0 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                        <span className='text-sm font-medium text-gray-text dark:text-dark-text'>Itens</span>

                        <div className='mt-4 overflow-x-auto'>
                            <table className='w-full min-w-max border-collapse text-sm'>
                                <thead>
                                    <tr className='border-b border-gray-base/30 dark:border-dark-border'>
                                        <th className='px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                            Produto
                                        </th>
                                        <th className='px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                            Preço
                                        </th>
                                        <th className='px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                            Qtd.
                                        </th>
                                        <th className='px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                            Subtotal
                                        </th>
                                        <th className='px-3 py-2' />
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-base/20 dark:divide-dark-border'>
                                    {pedido.itens.map((item) => (
                                        <tr key={item.codigo_produto}>
                                            <td className='px-3 py-2'>
                                                <div className='flex items-center gap-3'>
                                                    <ProdutoThumbnail
                                                        codigoProduto={item.codigo_produto}
                                                        descricao={item.descricao_produto}
                                                        className='h-9 w-9'
                                                    />
                                                    <div>
                                                        <p className='text-gray-text dark:text-dark-text'>
                                                            {item.descricao_produto}
                                                        </p>
                                                        <p className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                                            Código {item.codigo_produto}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-3 py-2 text-right tabular-nums text-gray-text dark:text-dark-text'>
                                                {formatCurrency(item.preco_unitario)}
                                            </td>
                                            <td className='px-3 py-2 text-right'>
                                                <input
                                                    type='number'
                                                    min={1}
                                                    value={quantidades[item.codigo_produto] ?? item.quantidade}
                                                    onChange={(e) =>
                                                        setQuantidades((prev) => ({
                                                            ...prev,
                                                            [item.codigo_produto]: Number(e.target.value),
                                                        }))
                                                    }
                                                    className='w-16 rounded-lg border border-gray-base/30 bg-white px-2 py-1 text-right text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                                                />
                                            </td>
                                            <td className='px-3 py-2 text-right tabular-nums font-medium text-gray-text dark:text-dark-text'>
                                                {formatCurrency(item.preco_unitario * item.quantidade)}
                                            </td>
                                            <td className='px-3 py-2 text-right'>
                                                <div className='flex justify-end gap-2'>
                                                    <button
                                                        type='button'
                                                        disabled={
                                                            salvandoItem === item.codigo_produto ||
                                                            quantidades[item.codigo_produto] === item.quantidade
                                                        }
                                                        onClick={() => salvarQuantidade(item.codigo_produto)}
                                                        className='rounded-lg border border-orange-base px-2 py-1 text-xs font-semibold text-orange-base transition hover:bg-orange-base hover:text-white disabled:opacity-40'
                                                    >
                                                        Salvar
                                                    </button>
                                                    <button
                                                        type='button'
                                                        disabled={salvandoItem === item.codigo_produto}
                                                        onClick={() => removerItem(item.codigo_produto)}
                                                        className='rounded-lg px-2 py-1 text-xs font-semibold text-red-base transition hover:bg-red-light/10'
                                                    >
                                                        Remover
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className='mt-4 flex justify-end border-t border-gray-base/30 pt-4 dark:border-dark-border'>
                            <span className='text-lg font-semibold text-gray-text dark:text-dark-text'>
                                Total: {formatCurrency(pedido.valor_total)}
                            </span>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                        <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                            <span className='text-sm font-medium text-gray-text dark:text-dark-text'>
                                Linha do tempo
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

                        <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                            <span className='text-sm font-medium text-gray-text dark:text-dark-text'>
                                Alterações registradas
                            </span>
                            {pedido.alteracoes.length === 0 ? (
                                <p className='mt-3 text-sm text-gray-dark dark:text-dark-text-muted'>
                                    Nenhuma alteração feita ainda.
                                </p>
                            ) : (
                                <ul className='mt-4 flex flex-col gap-3'>
                                    {pedido.alteracoes.map((a, i) => (
                                        <li
                                            key={i}
                                            className='rounded-lg bg-gray px-3 py-2 text-xs text-gray-text dark:bg-dark-surface-2 dark:text-dark-text'
                                        >
                                            <p>
                                                <span className='font-semibold'>
                                                    {a.autor === 'painel' ? 'Painel' : 'Cliente'}
                                                </span>{' '}
                                                · {a.tipo.replaceAll('_', ' ')}
                                                {a.valor_anterior && a.valor_novo
                                                    ? ` — de "${a.valor_anterior}" para "${a.valor_novo}"`
                                                    : a.valor_anterior
                                                      ? ` — removido "${a.valor_anterior}"`
                                                      : ''}
                                            </p>
                                            {a.motivo && <p className='mt-1 italic'>"{a.motivo}"</p>}
                                            <p className='mt-1 text-gray-dark dark:text-dark-text-muted'>
                                                {formatDate(a.criado_em.slice(0, 10))}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    )
}
