import { useEffect, useState, type FormEvent } from 'react'
import PageShell from '../../components/PageShell'
import Spinner from '../../components/Spinner'
import { useMe } from '../../hooks/useMe'
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import type { ConfigVendedor } from '../../types/pedidoAdmin'

export default function ConfiguracoesAdmin() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const autorizado = me?.isAdmin ?? false

    const [config, setConfig] = useState<ConfigVendedor[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    const [valores, setValores] = useState<Record<number, string>>({})
    const [descontos, setDescontos] = useState<Record<number, string>>({})
    const [salvando, setSalvando] = useState<number | null>(null)

    const [novoCodigo, setNovoCodigo] = useState('')
    const [novoValor, setNovoValor] = useState('')
    const [criando, setCriando] = useState(false)
    const [erroForm, setErroForm] = useState<string | null>(null)

    function carregar() {
        if (!autorizado) return
        setLoading(true)
        setErro(null)
        apiGet<ConfigVendedor[]>('/configuracoes/vendedores')
            .then((lista) => {
                setConfig(lista)
                setValores(Object.fromEntries(lista.map((c) => [c.codigo_vendedor, String(c.valor_minimo_pedido)])))
                setDescontos(Object.fromEntries(lista.map((c) => [c.codigo_vendedor, String(c.desconto_percentual)])))
            })
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(carregar, [autorizado])

    async function salvar(codigoVendedor: number) {
        const valor = Number(valores[codigoVendedor])
        const desconto = Number(descontos[codigoVendedor])
        if (!Number.isFinite(valor) || valor < 0) return
        if (!Number.isFinite(desconto) || desconto < 0 || desconto > 100) return

        setSalvando(codigoVendedor)
        try {
            await apiPatch(`/configuracoes/vendedores/${codigoVendedor}`, {
                valorMinimoPedido: valor,
                descontoPercentual: desconto,
            })
            carregar()
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Erro ao salvar.')
        } finally {
            setSalvando(null)
        }
    }

    async function remover(codigoVendedor: number) {
        setSalvando(codigoVendedor)
        try {
            await apiDelete(`/configuracoes/vendedores/${codigoVendedor}`)
            carregar()
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Erro ao remover.')
        } finally {
            setSalvando(null)
        }
    }

    async function criarVendedor(e: FormEvent) {
        e.preventDefault()
        setErroForm(null)

        const codigoVendedor = Number(novoCodigo)
        const valorMinimoPedido = Number(novoValor || '0')

        if (!Number.isInteger(codigoVendedor)) {
            setErroForm('Informe um código de vendedor válido.')
            return
        }

        setCriando(true)
        try {
            await apiPost('/configuracoes/vendedores', { codigoVendedor, valorMinimoPedido })
            setNovoCodigo('')
            setNovoValor('')
            carregar()
        } catch (err) {
            setErroForm(err instanceof ApiError ? err.message : 'Erro ao criar.')
        } finally {
            setCriando(false)
        }
    }

    return (
        <PageShell
            isAdmin={autorizado}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={autorizado}
            tituloAcessoRestrito='Configurações é uma área restrita a administradores.'
            titulo='Configurações'
            subtitulo='Valor mínimo de pedido e desconto geral por vendedor de televendas.'
        >
            <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                {erro && <p className='mb-4 text-sm text-red-base'>{erro}</p>}

                {loading ? (
                    <div className='flex justify-center py-6'>
                        <Spinner className='h-6 w-6' />
                    </div>
                ) : config.length === 0 ? (
                    <p className='text-sm text-gray-dark dark:text-dark-text-muted'>
                        Nenhum vendedor configurado ainda.
                    </p>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full min-w-max border-collapse text-sm'>
                            <thead>
                                <tr className='border-b border-gray-base/30 dark:border-dark-border'>
                                    <th className='px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Código do vendedor
                                    </th>
                                    <th className='px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Valor mínimo de pedido
                                    </th>
                                    <th className='px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Desconto geral (%)
                                    </th>
                                    <th className='px-3 py-2' />
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-base/20 dark:divide-dark-border'>
                                {config.map((c) => (
                                    <tr key={c.codigo_vendedor}>
                                        <td className='px-3 py-2 text-gray-text dark:text-dark-text'>
                                            {c.codigo_vendedor}
                                        </td>
                                        <td className='px-3 py-2 text-right'>
                                            <div className='flex items-center justify-end gap-2'>
                                                <span className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                                    {formatCurrency(c.valor_minimo_pedido)} atual
                                                </span>
                                                <input
                                                    type='number'
                                                    min={0}
                                                    step='0.01'
                                                    value={valores[c.codigo_vendedor] ?? ''}
                                                    onChange={(e) =>
                                                        setValores((prev) => ({
                                                            ...prev,
                                                            [c.codigo_vendedor]: e.target.value,
                                                        }))
                                                    }
                                                    className='w-28 rounded-lg border border-gray-base/30 bg-white px-2 py-1.5 text-right text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                                                />
                                            </div>
                                        </td>
                                        <td className='px-3 py-2 text-right'>
                                            <div className='flex items-center justify-end gap-2'>
                                                <span className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                                    {c.desconto_percentual}% atual
                                                </span>
                                                <input
                                                    type='number'
                                                    min={0}
                                                    max={100}
                                                    step='0.1'
                                                    value={descontos[c.codigo_vendedor] ?? ''}
                                                    onChange={(e) =>
                                                        setDescontos((prev) => ({
                                                            ...prev,
                                                            [c.codigo_vendedor]: e.target.value,
                                                        }))
                                                    }
                                                    className='w-20 rounded-lg border border-gray-base/30 bg-white px-2 py-1.5 text-right text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                                                />
                                            </div>
                                        </td>
                                        <td className='px-3 py-2 text-right'>
                                            <div className='flex justify-end gap-2'>
                                                <button
                                                    type='button'
                                                    disabled={
                                                        salvando === c.codigo_vendedor ||
                                                        (Number(valores[c.codigo_vendedor]) === c.valor_minimo_pedido &&
                                                            Number(descontos[c.codigo_vendedor]) === c.desconto_percentual)
                                                    }
                                                    onClick={() => salvar(c.codigo_vendedor)}
                                                    className='rounded-lg border border-orange-base px-2 py-1 text-xs font-semibold text-orange-base transition hover:bg-orange-base hover:text-white disabled:opacity-40'
                                                >
                                                    Salvar
                                                </button>
                                                <button
                                                    type='button'
                                                    disabled={salvando === c.codigo_vendedor}
                                                    onClick={() => remover(c.codigo_vendedor)}
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
                )}
            </div>

            <div className='mt-6 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>
                    Adicionar vendedor
                </span>

                <form onSubmit={criarVendedor} className='mt-4 flex flex-wrap items-end gap-2'>
                    <div>
                        <label className='block text-xs text-gray-dark dark:text-dark-text-muted'>
                            Código do vendedor
                        </label>
                        <input
                            type='number'
                            value={novoCodigo}
                            onChange={(e) => setNovoCodigo(e.target.value)}
                            className='mt-1 rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                    </div>
                    <div>
                        <label className='block text-xs text-gray-dark dark:text-dark-text-muted'>
                            Valor mínimo de pedido
                        </label>
                        <input
                            type='number'
                            min={0}
                            step='0.01'
                            value={novoValor}
                            onChange={(e) => setNovoValor(e.target.value)}
                            className='mt-1 rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                    </div>
                    <button
                        type='submit'
                        disabled={criando || !novoCodigo}
                        className='flex items-center justify-center rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                    >
                        {criando ? <Spinner className='h-4 w-4' /> : 'Adicionar'}
                    </button>
                </form>

                {erroForm && <p className='mt-3 text-sm text-red-base'>{erroForm}</p>}
            </div>
        </PageShell>
    )
}
