import { useEffect, useState } from 'react'
import PageShell from '../../components/PageShell'
import Spinner from '../../components/Spinner'
import ProdutoThumbnail from '../../components/ProdutoThumbnail'
import { useMe } from '../../hooks/useMe'
import { apiGet, apiPost, apiDelete, ApiError } from '../../lib/api'
import { formatCurrency, formatNumber } from '../../lib/format'
import type { Catalogo, ProdutoBusca, ProdutoCatalogo } from '../../types/catalogo'

export default function CatalogoAdmin() {
    const { me, loading: loadingMe, error: meError } = useMe()

    const [catalogos, setCatalogos] = useState<Catalogo[]>([])
    const [loadingCatalogos, setLoadingCatalogos] = useState(true)
    const [erroCatalogos, setErroCatalogos] = useState<string | null>(null)

    const [novoNome, setNovoNome] = useState('')
    const [criando, setCriando] = useState(false)

    const [catalogoSelecionado, setCatalogoSelecionado] = useState<Catalogo | null>(null)

    const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([])
    const [loadingProdutos, setLoadingProdutos] = useState(false)
    const [erroProdutos, setErroProdutos] = useState<string | null>(null)

    const [termoBusca, setTermoBusca] = useState('')
    const [resultadosBusca, setResultadosBusca] = useState<ProdutoBusca[]>([])
    const [buscando, setBuscando] = useState(false)
    const [erroBusca, setErroBusca] = useState<string | null>(null)

    const autorizado = me?.isAdmin ?? false

    useEffect(() => {
        if (!autorizado) return

        apiGet<Catalogo[]>('/catalogo')
            .then(setCatalogos)
            .catch((err) => setErroCatalogos(err.message))
            .finally(() => setLoadingCatalogos(false))
    }, [autorizado])

    function carregarProdutos(catalogo: Catalogo) {
        setCatalogoSelecionado(catalogo)
        setLoadingProdutos(true)
        setErroProdutos(null)
        setTermoBusca('')
        setResultadosBusca([])

        apiGet<ProdutoCatalogo[]>(`/catalogo/${catalogo.id}/produtos`)
            .then(setProdutos)
            .catch((err) => setErroProdutos(err.message))
            .finally(() => setLoadingProdutos(false))
    }

    async function criarCatalogo(e: React.FormEvent) {
        e.preventDefault()
        if (!novoNome.trim()) return

        setCriando(true)
        try {
            const catalogo = await apiPost<Catalogo>('/catalogo', { nome: novoNome.trim() })
            setCatalogos((prev) => [...prev, catalogo].sort((a, b) => a.nome.localeCompare(b.nome)))
            setNovoNome('')
        } catch (err) {
            setErroCatalogos(err instanceof ApiError ? err.message : 'Erro ao criar catálogo.')
        } finally {
            setCriando(false)
        }
    }

    async function buscarProdutos(e: React.FormEvent) {
        e.preventDefault()
        if (!termoBusca.trim()) return

        setBuscando(true)
        setErroBusca(null)
        try {
            const resultados = await apiGet<ProdutoBusca[]>('/catalogo/produtos/busca', { q: termoBusca.trim() })
            setResultadosBusca(resultados)
        } catch (err) {
            setErroBusca(err instanceof ApiError ? err.message : 'Erro ao buscar produtos.')
        } finally {
            setBuscando(false)
        }
    }

    async function adicionarProduto(produto: ProdutoBusca) {
        if (!catalogoSelecionado) return

        await apiPost(`/catalogo/${catalogoSelecionado.id}/produtos`, { codigoProduto: produto.CODIGO_PRODUTO })
        setResultadosBusca((prev) => prev.filter((p) => p.CODIGO_PRODUTO !== produto.CODIGO_PRODUTO))
        carregarProdutos(catalogoSelecionado)
    }

    async function removerProduto(codigoProduto: number) {
        if (!catalogoSelecionado) return

        await apiDelete(`/catalogo/${catalogoSelecionado.id}/produtos/${codigoProduto}`)
        setProdutos((prev) => prev.filter((p) => p.CODIGO_PRODUTO !== codigoProduto))
    }

    return (
        <PageShell
            isAdmin={autorizado}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={autorizado}
            tituloAcessoRestrito='Catálogo é uma área restrita a administradores.'
            titulo='Catálogo'
            subtitulo='Crie os catálogos por segmento e escolha quais produtos do CISS aparecem em cada um.'
        >
            <div className='flex flex-col gap-6 lg:flex-row lg:items-start'>
                <div className='w-full shrink-0 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface lg:w-72'>
                    <span className='text-sm font-medium text-gray-text dark:text-dark-text'>Catálogos</span>

                    <form onSubmit={criarCatalogo} className='mt-4 flex gap-2'>
                        <input
                            type='text'
                            value={novoNome}
                            onChange={(e) => setNovoNome(e.target.value)}
                            placeholder='Ex.: Açaí'
                            className='min-w-0 flex-1 rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                        <button
                            type='submit'
                            disabled={criando || !novoNome.trim()}
                            className='shrink-0 rounded-lg bg-orange-base px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                        >
                            {criando ? <Spinner className='h-4 w-4' /> : 'Criar'}
                        </button>
                    </form>

                    {erroCatalogos && <p className='mt-3 text-sm text-red-base'>{erroCatalogos}</p>}

                    {loadingCatalogos ? (
                        <div className='mt-4 flex justify-center py-4'>
                            <Spinner className='h-5 w-5' />
                        </div>
                    ) : (
                        <ul className='mt-4 flex flex-col gap-1'>
                            {catalogos.length === 0 && (
                                <li className='text-sm text-gray-dark dark:text-dark-text-muted'>
                                    Nenhum catálogo criado ainda.
                                </li>
                            )}
                            {catalogos.map((catalogo) => (
                                <li key={catalogo.id}>
                                    <button
                                        type='button'
                                        onClick={() => carregarProdutos(catalogo)}
                                        className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                                            catalogoSelecionado?.id === catalogo.id
                                                ? 'bg-orange-base text-white'
                                                : 'text-gray-text hover:bg-orange-base/10 hover:text-orange-base dark:text-dark-text dark:hover:bg-orange-base/10 dark:hover:text-orange-light'
                                        }`}
                                    >
                                        {catalogo.nome}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className='min-w-0 flex-1'>
                    {!catalogoSelecionado ? (
                        <div className='rounded-xl border border-gray-base/30 bg-white p-6 text-sm text-gray-dark shadow-sm dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-muted'>
                            Selecione um catálogo à esquerda (ou crie um novo) pra gerenciar os produtos dele.
                        </div>
                    ) : (
                        <div className='flex flex-col gap-6'>
                            <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>
                                    Adicionar produto ao catálogo "{catalogoSelecionado.nome}"
                                </span>

                                <form onSubmit={buscarProdutos} className='mt-4 flex gap-2'>
                                    <input
                                        type='text'
                                        value={termoBusca}
                                        onChange={(e) => setTermoBusca(e.target.value)}
                                        placeholder='Nome ou código do produto no CISS'
                                        className='min-w-0 flex-1 rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                                    />
                                    <button
                                        type='submit'
                                        disabled={buscando || !termoBusca.trim()}
                                        className='shrink-0 rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                                    >
                                        {buscando ? <Spinner className='h-4 w-4' /> : 'Buscar'}
                                    </button>
                                </form>

                                {erroBusca && <p className='mt-3 text-sm text-red-base'>{erroBusca}</p>}

                                {resultadosBusca.length > 0 && (
                                    <ul className='mt-4 flex flex-col divide-y divide-gray-base/20 dark:divide-dark-border'>
                                        {resultadosBusca.map((produto) => (
                                            <li
                                                key={produto.CODIGO_PRODUTO}
                                                className='flex items-center justify-between gap-3 py-2'
                                            >
                                                <div className='flex min-w-0 items-center gap-3'>
                                                    <ProdutoThumbnail
                                                        codigoProduto={produto.CODIGO_PRODUTO}
                                                        descricao={produto.DESCRICAO}
                                                    />
                                                    <div className='min-w-0'>
                                                        <p className='truncate text-sm text-gray-text dark:text-dark-text'>
                                                            {produto.DESCRICAO}
                                                        </p>
                                                        <p className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                                            Código {produto.CODIGO_PRODUTO}
                                                            {produto.SECAO ? ` · ${produto.SECAO}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type='button'
                                                    onClick={() => adicionarProduto(produto)}
                                                    className='shrink-0 rounded-lg border border-orange-base px-3 py-1.5 text-xs font-semibold text-orange-base transition hover:bg-orange-base hover:text-white'
                                                >
                                                    Adicionar
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className='min-w-0 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>
                                    Produtos no catálogo
                                </span>

                                {erroProdutos && <p className='mt-3 text-sm text-red-base'>{erroProdutos}</p>}

                                {!erroProdutos && loadingProdutos && (
                                    <div className='mt-4 flex justify-center py-6'>
                                        <Spinner className='h-5 w-5' />
                                    </div>
                                )}

                                {!erroProdutos && !loadingProdutos && produtos.length === 0 && (
                                    <p className='mt-3 text-sm text-gray-dark dark:text-dark-text-muted'>
                                        Nenhum produto neste catálogo ainda.
                                    </p>
                                )}

                                {!erroProdutos && !loadingProdutos && produtos.length > 0 && (
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
                                                        Estoque
                                                    </th>
                                                    <th className='px-3 py-2' />
                                                </tr>
                                            </thead>
                                            <tbody className='divide-y divide-gray-base/20 dark:divide-dark-border'>
                                                {produtos.map((produto) => (
                                                    <tr key={produto.CODIGO_PRODUTO} className='hover:bg-gray/50 dark:hover:bg-dark-surface-2/50'>
                                                        <td className='px-3 py-2 text-gray-text dark:text-dark-text'>
                                                            <div className='flex items-center gap-3'>
                                                                <ProdutoThumbnail
                                                                    codigoProduto={produto.CODIGO_PRODUTO}
                                                                    descricao={produto.DESCRICAO}
                                                                />
                                                                <div>
                                                                    <p>{produto.DESCRICAO}</p>
                                                                    <p className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                                                        Código {produto.CODIGO_PRODUTO}
                                                                        {produto.SECAO ? ` · ${produto.SECAO}` : ''}
                                                                        {produto.INATIVO === 'T' ? ' · inativo no CISS' : ''}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className='px-3 py-2 text-right tabular-nums text-gray-text dark:text-dark-text'>
                                                            {produto.PRECO != null ? formatCurrency(produto.PRECO) : '—'}
                                                        </td>
                                                        <td
                                                            className={`px-3 py-2 text-right tabular-nums ${
                                                                produto.ESTOQUE <= 0
                                                                    ? 'font-semibold text-red-base'
                                                                    : 'text-gray-text dark:text-dark-text'
                                                            }`}
                                                        >
                                                            {formatNumber(produto.ESTOQUE)}
                                                        </td>
                                                        <td className='px-3 py-2 text-right'>
                                                            <button
                                                                type='button'
                                                                onClick={() => removerProduto(produto.CODIGO_PRODUTO)}
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
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PageShell>
    )
}
