import { useEffect, useState, type FormEvent } from 'react'
import PageShell from '../../components/PageShell'
import Spinner from '../../components/Spinner'
import ProdutoThumbnail from '../../components/ProdutoThumbnail'
import { CloseIcon } from '../../components/icons'
import { useMe } from '../../hooks/useMe'
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import type { Categoria, ProdutoBusca, ProdutoRegistrado } from '../../types/categoria'

export default function CategoriasAdmin() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const autorizado = me?.isAdmin ?? false

    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loadingCategorias, setLoadingCategorias] = useState(true)
    const [erroCategorias, setErroCategorias] = useState<string | null>(null)
    const [novaCategoria, setNovaCategoria] = useState('')
    const [criandoCategoria, setCriandoCategoria] = useState(false)

    const [produtos, setProdutos] = useState<ProdutoRegistrado[]>([])
    const [loadingProdutos, setLoadingProdutos] = useState(true)
    const [erroProdutos, setErroProdutos] = useState<string | null>(null)

    const [termoBusca, setTermoBusca] = useState('')
    const [resultadosBusca, setResultadosBusca] = useState<ProdutoBusca[]>([])
    const [buscando, setBuscando] = useState(false)
    const [erroBusca, setErroBusca] = useState<string | null>(null)

    const [produtoParaAdicionar, setProdutoParaAdicionar] = useState<ProdutoBusca | null>(null)
    const [categoriasEscolhidas, setCategoriasEscolhidas] = useState<Set<string>>(new Set())
    const [precoPromoNovo, setPrecoPromoNovo] = useState('')
    const [salvandoNovo, setSalvandoNovo] = useState(false)

    const [precosEmEdicao, setPrecosEmEdicao] = useState<Record<number, string>>({})
    const [salvandoCodigo, setSalvandoCodigo] = useState<number | null>(null)

    function carregarCategorias() {
        if (!autorizado) return
        setLoadingCategorias(true)
        apiGet<Categoria[]>('/categorias')
            .then(setCategorias)
            .catch((err) => setErroCategorias(err.message))
            .finally(() => setLoadingCategorias(false))
    }

    function carregarProdutos() {
        if (!autorizado) return
        setLoadingProdutos(true)
        apiGet<ProdutoRegistrado[]>('/produtos')
            .then(setProdutos)
            .catch((err) => setErroProdutos(err.message))
            .finally(() => setLoadingProdutos(false))
    }

    useEffect(carregarCategorias, [autorizado])
    useEffect(carregarProdutos, [autorizado])

    async function criarCategoria(e: FormEvent) {
        e.preventDefault()
        if (!novaCategoria.trim()) return

        setCriandoCategoria(true)
        try {
            const categoria = await apiPost<Categoria>('/categorias', { nome: novaCategoria.trim() })
            setCategorias((prev) => [...prev, categoria].sort((a, b) => a.nome.localeCompare(b.nome)))
            setNovaCategoria('')
        } catch (err) {
            setErroCategorias(err instanceof ApiError ? err.message : 'Erro ao criar categoria.')
        } finally {
            setCriandoCategoria(false)
        }
    }

    async function removerCategoria(id: string) {
        await apiDelete(`/categorias/${id}`)
        setCategorias((prev) => prev.filter((c) => c.id !== id))
        carregarProdutos()
    }

    async function buscarProdutos(e: FormEvent) {
        e.preventDefault()
        if (!termoBusca.trim()) return

        setBuscando(true)
        setErroBusca(null)
        try {
            const resultados = await apiGet<ProdutoBusca[]>('/produtos/busca', { q: termoBusca.trim() })
            setResultadosBusca(resultados)
        } catch (err) {
            setErroBusca(err instanceof ApiError ? err.message : 'Erro ao buscar produtos.')
        } finally {
            setBuscando(false)
        }
    }

    function selecionarParaAdicionar(produto: ProdutoBusca) {
        setProdutoParaAdicionar(produto)
        setCategoriasEscolhidas(new Set())
        setPrecoPromoNovo('')
    }

    function alternarCategoriaEscolhida(id: string) {
        setCategoriasEscolhidas((prev) => {
            const proximo = new Set(prev)
            if (proximo.has(id)) proximo.delete(id)
            else proximo.add(id)
            return proximo
        })
    }

    async function confirmarNovoProduto() {
        if (!produtoParaAdicionar) return

        setSalvandoNovo(true)
        try {
            await apiPost('/produtos', {
                codigoProduto: produtoParaAdicionar.CODIGO_PRODUTO,
                categoriaIds: [...categoriasEscolhidas],
                precoPromocional: precoPromoNovo.trim() ? Number(precoPromoNovo) : null,
            })
            setResultadosBusca((prev) => prev.filter((p) => p.CODIGO_PRODUTO !== produtoParaAdicionar.CODIGO_PRODUTO))
            setProdutoParaAdicionar(null)
            carregarProdutos()
        } catch (err) {
            setErroBusca(err instanceof ApiError ? err.message : 'Erro ao adicionar produto.')
        } finally {
            setSalvandoNovo(false)
        }
    }

    async function removerCategoriaDoProduto(produto: ProdutoRegistrado, categoriaId: string) {
        const categoriaIds = produto.categorias.filter((c) => c.id !== categoriaId).map((c) => c.id)
        await apiPatch(`/produtos/${produto.codigo_produto_ciss}`, { categoriaIds })
        carregarProdutos()
    }

    async function adicionarCategoriaAoProduto(produto: ProdutoRegistrado, categoriaId: string) {
        if (!categoriaId) return
        const categoriaIds = [...new Set([...produto.categorias.map((c) => c.id), categoriaId])]
        await apiPatch(`/produtos/${produto.codigo_produto_ciss}`, { categoriaIds })
        carregarProdutos()
    }

    async function salvarPrecoPromocional(codigo: number) {
        const valor = precosEmEdicao[codigo]
        setSalvandoCodigo(codigo)
        try {
            await apiPatch(`/produtos/${codigo}`, {
                precoPromocional: valor.trim() ? Number(valor) : null,
            })
            carregarProdutos()
        } catch (err) {
            setErroProdutos(err instanceof ApiError ? err.message : 'Erro ao salvar preço promocional.')
        } finally {
            setSalvandoCodigo(null)
        }
    }

    async function removerProduto(codigo: number) {
        setSalvandoCodigo(codigo)
        try {
            await apiDelete(`/produtos/${codigo}`)
            setProdutos((prev) => prev.filter((p) => p.codigo_produto_ciss !== codigo))
        } catch (err) {
            setErroProdutos(err instanceof ApiError ? err.message : 'Erro ao remover produto.')
        } finally {
            setSalvandoCodigo(null)
        }
    }

    return (
        <PageShell
            isAdmin={autorizado}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={autorizado}
            tituloAcessoRestrito='Categorias é uma área restrita a administradores.'
            titulo='Categorias'
            subtitulo='Cadastre produtos e diga em quais categorias eles aparecem na loja - um produto pode estar em mais de uma.'
        >
            <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>Categorias</span>

                {erroCategorias && <p className='mt-2 text-sm text-red-base'>{erroCategorias}</p>}

                {loadingCategorias ? (
                    <div className='mt-4 flex justify-center py-2'>
                        <Spinner className='h-5 w-5' />
                    </div>
                ) : (
                    <div className='mt-3 flex flex-wrap gap-2'>
                        {categorias.length === 0 && (
                            <span className='text-sm text-gray-dark dark:text-dark-text-muted'>
                                Nenhuma categoria criada ainda.
                            </span>
                        )}
                        {categorias.map((categoria) => (
                            <span
                                key={categoria.id}
                                className='flex items-center gap-1.5 rounded-full bg-orange-base/10 py-1 pl-3 pr-1.5 text-sm font-medium text-orange-base'
                            >
                                {categoria.nome}
                                <button
                                    type='button'
                                    onClick={() => removerCategoria(categoria.id)}
                                    className='rounded-full p-0.5 transition hover:bg-orange-base/20'
                                    aria-label={`Remover categoria ${categoria.nome}`}
                                >
                                    <CloseIcon className='h-3 w-3' />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                <form onSubmit={criarCategoria} className='mt-4 flex gap-2'>
                    <input
                        type='text'
                        value={novaCategoria}
                        onChange={(e) => setNovaCategoria(e.target.value)}
                        placeholder='Nova categoria (ex.: Padaria)'
                        className='min-w-0 flex-1 rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                    />
                    <button
                        type='submit'
                        disabled={criandoCategoria || !novaCategoria.trim()}
                        className='shrink-0 rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                    >
                        {criandoCategoria ? <Spinner className='h-4 w-4' /> : 'Criar'}
                    </button>
                </form>
            </div>

            <div className='mt-6 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>Adicionar produto</span>

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
                            <li key={produto.CODIGO_PRODUTO} className='py-2'>
                                <div className='flex items-center justify-between gap-3'>
                                    <div className='flex min-w-0 items-center gap-3'>
                                        <ProdutoThumbnail codigoProduto={produto.CODIGO_PRODUTO} descricao={produto.DESCRICAO} />
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
                                        onClick={() => selecionarParaAdicionar(produto)}
                                        className='shrink-0 rounded-lg border border-orange-base px-3 py-1.5 text-xs font-semibold text-orange-base transition hover:bg-orange-base hover:text-white'
                                    >
                                        Adicionar
                                    </button>
                                </div>

                                {produtoParaAdicionar?.CODIGO_PRODUTO === produto.CODIGO_PRODUTO && (
                                    <div className='mt-3 rounded-lg bg-gray p-4 dark:bg-dark-surface-2'>
                                        <p className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                            Categorias
                                        </p>
                                        <div className='mt-2 flex flex-wrap gap-3'>
                                            {categorias.length === 0 && (
                                                <span className='text-sm text-gray-dark dark:text-dark-text-muted'>
                                                    Crie uma categoria acima primeiro.
                                                </span>
                                            )}
                                            {categorias.map((categoria) => (
                                                <label key={categoria.id} className='flex items-center gap-1.5 text-sm text-gray-text dark:text-dark-text'>
                                                    <input
                                                        type='checkbox'
                                                        checked={categoriasEscolhidas.has(categoria.id)}
                                                        onChange={() => alternarCategoriaEscolhida(categoria.id)}
                                                        className='accent-orange-base'
                                                    />
                                                    {categoria.nome}
                                                </label>
                                            ))}
                                        </div>

                                        <div className='mt-3 flex flex-wrap items-end gap-2'>
                                            <div>
                                                <label className='block text-xs text-gray-dark dark:text-dark-text-muted'>
                                                    Preço promocional (opcional)
                                                </label>
                                                <input
                                                    type='number'
                                                    min={0}
                                                    step='0.01'
                                                    value={precoPromoNovo}
                                                    onChange={(e) => setPrecoPromoNovo(e.target.value)}
                                                    className='mt-1 w-32 rounded-lg border border-gray-base/30 bg-white px-2 py-1.5 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                                                />
                                            </div>
                                            <button
                                                type='button'
                                                disabled={salvandoNovo || categoriasEscolhidas.size === 0}
                                                onClick={confirmarNovoProduto}
                                                className='rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                                            >
                                                {salvandoNovo ? <Spinner className='h-4 w-4' /> : 'Salvar'}
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => setProdutoParaAdicionar(null)}
                                                className='rounded-lg px-3 py-2 text-sm font-semibold text-gray-dark transition hover:bg-gray-base/10 dark:text-dark-text-muted'
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className='mt-6 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>Produtos cadastrados</span>

                {erroProdutos && <p className='mt-3 text-sm text-red-base'>{erroProdutos}</p>}

                {loadingProdutos ? (
                    <div className='mt-4 flex justify-center py-6'>
                        <Spinner className='h-5 w-5' />
                    </div>
                ) : produtos.length === 0 ? (
                    <p className='mt-3 text-sm text-gray-dark dark:text-dark-text-muted'>Nenhum produto cadastrado ainda.</p>
                ) : (
                    <ul className='mt-4 flex flex-col divide-y divide-gray-base/20 dark:divide-dark-border'>
                        {produtos.map((produto) => {
                            const ciss = produto.ciss
                            const categoriaIdsDoProduto = new Set(produto.categorias.map((c) => c.id))
                            const categoriasDisponiveis = categorias.filter((c) => !categoriaIdsDoProduto.has(c.id))
                            const temPromo = produto.preco_promocional != null

                            return (
                                <li key={produto.codigo_produto_ciss} className='flex flex-wrap items-start gap-3 py-3'>
                                    <ProdutoThumbnail
                                        codigoProduto={produto.codigo_produto_ciss}
                                        descricao={ciss?.DESCRICAO ?? ''}
                                    />

                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate text-sm text-gray-text dark:text-dark-text'>
                                            {ciss?.DESCRICAO ?? `Código ${produto.codigo_produto_ciss}`}
                                        </p>
                                        <p className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                            Código {produto.codigo_produto_ciss}
                                            {ciss?.SECAO ? ` · ${ciss.SECAO}` : ''}
                                        </p>

                                        <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                                            {produto.categorias.map((categoria) => (
                                                <span
                                                    key={categoria.id}
                                                    className='flex items-center gap-1 rounded-full bg-orange-base/10 py-0.5 pl-2 pr-1 text-xs font-medium text-orange-base'
                                                >
                                                    {categoria.nome}
                                                    <button
                                                        type='button'
                                                        onClick={() => removerCategoriaDoProduto(produto, categoria.id)}
                                                        className='rounded-full p-0.5 transition hover:bg-orange-base/20'
                                                        aria-label={`Remover categoria ${categoria.nome} do produto`}
                                                    >
                                                        <CloseIcon className='h-2.5 w-2.5' />
                                                    </button>
                                                </span>
                                            ))}
                                            {categoriasDisponiveis.length > 0 && (
                                                <select
                                                    value=''
                                                    onChange={(e) => adicionarCategoriaAoProduto(produto, e.target.value)}
                                                    className='rounded-full border border-dashed border-gray-base/40 bg-transparent px-2 py-0.5 text-xs text-gray-dark dark:text-dark-text-muted'
                                                >
                                                    <option value=''>+ categoria</option>
                                                    {categoriasDisponiveis.map((categoria) => (
                                                        <option key={categoria.id} value={categoria.id}>
                                                            {categoria.nome}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    <div className='flex shrink-0 flex-col items-end gap-1'>
                                        {ciss && (
                                            <span
                                                className={`text-sm ${temPromo ? 'text-gray-dark line-through dark:text-dark-text-muted' : 'font-semibold text-gray-text dark:text-dark-text'}`}
                                            >
                                                {formatCurrency(ciss.PRECO_ORIGINAL ?? 0)}
                                            </span>
                                        )}
                                        {temPromo && (
                                            <span className='text-sm font-semibold text-orange-base'>
                                                {formatCurrency(produto.preco_promocional!)}
                                            </span>
                                        )}
                                    </div>

                                    <div className='flex shrink-0 items-center gap-2'>
                                        <input
                                            type='number'
                                            min={0}
                                            step='0.01'
                                            placeholder='Promocional'
                                            value={precosEmEdicao[produto.codigo_produto_ciss] ?? produto.preco_promocional ?? ''}
                                            onChange={(e) =>
                                                setPrecosEmEdicao((prev) => ({
                                                    ...prev,
                                                    [produto.codigo_produto_ciss]: e.target.value,
                                                }))
                                            }
                                            className='w-28 rounded-lg border border-gray-base/30 bg-white px-2 py-1.5 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                                        />
                                        <button
                                            type='button'
                                            disabled={salvandoCodigo === produto.codigo_produto_ciss}
                                            onClick={() => salvarPrecoPromocional(produto.codigo_produto_ciss)}
                                            className='rounded-lg border border-orange-base px-2 py-1.5 text-xs font-semibold text-orange-base transition hover:bg-orange-base hover:text-white disabled:opacity-40'
                                        >
                                            Salvar
                                        </button>
                                        <button
                                            type='button'
                                            disabled={salvandoCodigo === produto.codigo_produto_ciss}
                                            onClick={() => removerProduto(produto.codigo_produto_ciss)}
                                            className='rounded-lg px-2 py-1 text-xs font-semibold text-red-base transition hover:bg-red-light/10 disabled:opacity-40'
                                        >
                                            Remover
                                        </button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </PageShell>
    )
}
