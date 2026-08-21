import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClienteShell from '../../components/cliente/ClienteShell'
import Spinner from '../../components/Spinner'
import { useCarrinho } from '../../contexts/CarrinhoContext'
import { useClienteMe } from '../../hooks/useClienteMe'
import { clienteApiPost } from '../../lib/clienteApi'
import { ApiError } from '../../lib/api'
import { formatCurrency } from '../../lib/format'

export default function Carrinho() {
    const { itens, atualizarQuantidade, remover, limpar, total } = useCarrinho()
    const { cliente, loading: loadingCliente } = useClienteMe()
    const navigate = useNavigate()

    const [observacao, setObservacao] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function enviarPedido() {
        if (!cliente) {
            navigate('/entrar?redirect=/carrinho')
            return
        }

        setEnviando(true)
        setErro(null)
        try {
            const pedido = await clienteApiPost<{ id: string }>('/cliente/pedidos', {
                itens: itens.map((item) => ({ codigoProduto: item.codigoProduto, quantidade: item.quantidade })),
                observacao: observacao.trim() || undefined,
            })
            limpar()
            navigate(`/pedidos/${pedido.id}`)
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar o pedido.')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <ClienteShell requireAuth={false}>
            <h1 className='text-2xl font-semibold text-gray-text dark:text-dark-text'>Carrinho</h1>

            {itens.length === 0 ? (
                <p className='mt-6 text-sm text-gray-dark dark:text-dark-text-muted'>
                    Seu carrinho está vazio. Volte ao catálogo pra adicionar produtos.
                </p>
            ) : (
                <div className='mt-6 flex flex-col gap-6'>
                    <div className='overflow-x-auto rounded-xl border border-gray-base/30 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                        <table className='w-full min-w-max border-collapse text-sm'>
                            <thead>
                                <tr className='border-b border-gray-base/30 dark:border-dark-border'>
                                    <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Produto
                                    </th>
                                    <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Preço
                                    </th>
                                    <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Qtd.
                                    </th>
                                    <th className='px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Subtotal
                                    </th>
                                    <th className='px-4 py-3' />
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-base/20 dark:divide-dark-border'>
                                {itens.map((item) => (
                                    <tr key={item.codigoProduto}>
                                        <td className='px-4 py-3 text-gray-text dark:text-dark-text'>{item.descricao}</td>
                                        <td className='px-4 py-3 text-right tabular-nums text-gray-text dark:text-dark-text'>
                                            {formatCurrency(item.precoUnitario)}
                                        </td>
                                        <td className='px-4 py-3 text-right'>
                                            <input
                                                type='number'
                                                min={1}
                                                value={item.quantidade}
                                                onChange={(e) =>
                                                    atualizarQuantidade(item.codigoProduto, Number(e.target.value))
                                                }
                                                className='w-16 rounded-lg border border-gray-base/30 bg-white px-2 py-1 text-right text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                                            />
                                        </td>
                                        <td className='px-4 py-3 text-right tabular-nums font-medium text-gray-text dark:text-dark-text'>
                                            {formatCurrency(item.precoUnitario * item.quantidade)}
                                        </td>
                                        <td className='px-4 py-3 text-right'>
                                            <button
                                                type='button'
                                                onClick={() => remover(item.codigoProduto)}
                                                className='rounded-lg px-2 py-1 text-xs font-semibold text-red-base transition hover:bg-red-light/10'
                                            >
                                                Remover
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                        <label className='text-sm font-medium text-gray-text dark:text-dark-text'>
                            Observação (opcional)
                        </label>
                        <textarea
                            value={observacao}
                            onChange={(e) => setObservacao(e.target.value)}
                            rows={3}
                            className='mt-2 w-full rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />

                        <div className='mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-base/30 pt-4 dark:border-dark-border'>
                            <span className='text-lg font-semibold text-gray-text dark:text-dark-text'>
                                Total: {formatCurrency(total)}
                            </span>
                            <button
                                type='button'
                                onClick={enviarPedido}
                                disabled={enviando || loadingCliente}
                                className='flex items-center justify-center rounded-lg bg-orange-base px-6 py-2 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                            >
                                {enviando ? <Spinner className='h-4 w-4' /> : cliente ? 'Enviar pedido' : 'Entrar para enviar o pedido'}
                            </button>
                        </div>

                        {erro && <p className='mt-3 text-sm text-red-base'>{erro}</p>}
                    </div>
                </div>
            )}
        </ClienteShell>
    )
}
