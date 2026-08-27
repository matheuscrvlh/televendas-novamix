import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../Spinner'
import { CartIcon, CloseIcon, TrashIcon } from '../icons'
import { useCarrinho } from '../../contexts/CarrinhoContext'
import { useClienteMe } from '../../hooks/useClienteMe'
import { clienteApiPost } from '../../lib/clienteApi'
import { ApiError } from '../../lib/api'
import { formatCurrency } from '../../lib/format'

export default function CarrinhoDrawer() {
    const { itens, atualizarQuantidade, remover, limpar, total, aberto, fechar } = useCarrinho()
    const { cliente, loading: loadingCliente } = useClienteMe()
    const navigate = useNavigate()

    const [observacao, setObservacao] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    useEffect(() => {
        if (!aberto) return
        const originalHtml = document.documentElement.style.overflow
        const originalBody = document.body.style.overflow
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
        return () => {
            document.documentElement.style.overflow = originalHtml
            document.body.style.overflow = originalBody
        }
    }, [aberto])

    async function enviarPedido() {
        if (!cliente) {
            navigate('/entrar?redirect=' + encodeURIComponent('/?carrinho=aberto'))
            fechar()
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
            fechar()
            navigate(`/pedidos/${pedido.id}`)
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar o pedido.')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <>
            <div
                className={`fixed inset-0 z-50 bg-black transition-opacity duration-300 ${
                    aberto ? 'pointer-events-auto opacity-50' : 'pointer-events-none opacity-0'
                }`}
                onClick={fechar}
            />

            <aside
                className={`fixed top-0 right-0 z-50 flex h-dvh w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-dark-surface ${
                    aberto ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className='flex items-center justify-between border-b border-gray-base/30 p-4 dark:border-dark-border'>
                    <h2 className='flex items-center gap-2 text-base font-semibold text-gray-text dark:text-dark-text'>
                        <CartIcon className='h-5 w-5' />
                        Meu carrinho
                    </h2>
                    <button
                        type='button'
                        onClick={fechar}
                        className='rounded-md p-1 text-gray-dark hover:text-orange-base dark:text-dark-text-muted dark:hover:text-orange-light'
                        aria-label='Fechar carrinho'
                    >
                        <CloseIcon className='h-5 w-5' />
                    </button>
                </div>

                {itens.length === 0 ? (
                    <div className='flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center'>
                        <CartIcon className='h-10 w-10 text-gray-dark/30 dark:text-dark-text-muted/30' />
                        <div>
                            <p className='font-semibold text-gray-text dark:text-dark-text'>Seu carrinho está vazio</p>
                            <p className='mt-1 text-sm text-gray-dark dark:text-dark-text-muted'>
                                Continue navegando pra descobrir promoções e os melhores produtos.
                            </p>
                        </div>
                        <button
                            type='button'
                            onClick={fechar}
                            className='rounded-lg bg-orange-base px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-light'
                        >
                            Continuar comprando
                        </button>
                    </div>
                ) : (
                    <>
                        <div className='flex-1 overflow-y-auto p-4'>
                            <div className='flex flex-col gap-3'>
                                {itens.map((item) => (
                                    <div
                                        key={item.codigoProduto}
                                        className='rounded-xl border border-gray-base/30 p-3 dark:border-dark-border'
                                    >
                                        <p className='text-sm font-medium text-gray-text dark:text-dark-text'>
                                            {item.descricao}
                                        </p>
                                        <p className='mt-0.5 text-xs text-gray-dark dark:text-dark-text-muted'>
                                            {formatCurrency(item.precoUnitario)} cada
                                        </p>
                                        <div className='mt-2 flex items-center justify-between gap-3'>
                                            <input
                                                type='number'
                                                min={1}
                                                value={item.quantidade}
                                                onChange={(e) =>
                                                    atualizarQuantidade(item.codigoProduto, Number(e.target.value))
                                                }
                                                className='w-16 rounded-lg border border-gray-base/30 bg-white px-2 py-1 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                                            />
                                            <div className='flex items-center gap-2'>
                                                <span className='text-sm font-semibold tabular-nums text-gray-text dark:text-dark-text'>
                                                    {formatCurrency(item.precoUnitario * item.quantidade)}
                                                </span>
                                                <button
                                                    type='button'
                                                    onClick={() => remover(item.codigoProduto)}
                                                    aria-label='Remover item'
                                                    className='shrink-0 rounded-lg p-1.5 text-red-base transition hover:bg-red-light/10'
                                                >
                                                    <TrashIcon className='h-4 w-4' />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <label className='mt-4 block text-sm font-medium text-gray-text dark:text-dark-text'>
                                Observação (opcional)
                            </label>
                            <textarea
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                                rows={2}
                                className='mt-2 w-full rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                            />
                        </div>

                        <div className='border-t border-gray-base/30 p-4 dark:border-dark-border'>
                            <div className='flex items-center justify-between'>
                                <span className='text-sm text-gray-dark dark:text-dark-text-muted'>Total</span>
                                <span className='text-lg font-semibold text-gray-text dark:text-dark-text'>
                                    {formatCurrency(total)}
                                </span>
                            </div>

                            {erro && <p className='mt-2 text-sm text-red-base'>{erro}</p>}

                            <button
                                type='button'
                                onClick={enviarPedido}
                                disabled={enviando || loadingCliente}
                                className='mt-3 flex w-full items-center justify-center rounded-lg bg-orange-base px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                            >
                                {enviando ? (
                                    <Spinner className='h-4 w-4' />
                                ) : cliente ? (
                                    'Enviar pedido'
                                ) : (
                                    'Entrar para enviar o pedido'
                                )}
                            </button>
                        </div>
                    </>
                )}
            </aside>
        </>
    )
}
