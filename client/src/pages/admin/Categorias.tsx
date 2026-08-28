import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import PageShell from '../../components/PageShell'
import Spinner from '../../components/Spinner'
import ProdutoThumbnail from '../../components/ProdutoThumbnail'
import { CloseIcon, ImageIcon, TrashIcon } from '../../components/icons'
import { useMe } from '../../hooks/useMe'
import { apiGet, apiPost, apiPatch, apiPatchForm, apiDelete, ApiError } from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import { uploadImagemUrl } from '../../lib/imagens'
import type { Categoria, ProdutoBusca, ProdutoRegistrado } from '../../types/categoria'

type CategoriaRowProps = {
    categoria: Categoria
    enviandoImagem: boolean
    onEnviarImagem: (e: ChangeEvent<HTMLInputElement>) => void
    onRenomear: (nome: string) => void
    onAlternarAtivo: () => void
    onRemover: () => void
}

function CategoriaRow({
    categoria,
    enviandoImagem,
    onEnviarImagem,
    onRenomear,
    onAlternarAtivo,
    onRemover,
}: CategoriaRowProps) {
    const [editando, setEditando] = useState(false)
    const [nome, setNome] = useState(categoria.nome)

    function salvar() {
        if (!nome.trim()) return
        onRenomear(nome.trim())
        setEditando(false)
    }

    return (
        <div className='flex flex-wrap items-center gap-3 rounded-xl border border-gray-base/20 bg-white p-3 shadow-sm dark:border-dark-border dark:bg-dark-surface-2'>
            <label
                className='relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray ring-1 ring-gray-base/30 dark:bg-dark-surface'
                title='Trocar imagem da categoria'
            >
                {enviandoImagem ? (
                    <Spinner className='h-4 w-4' />
                ) : categoria.imagem ? (
                    <img src={uploadImagemUrl(categoria.imagem)} alt='' className='h-full w-full object-cover' />
                ) : (
                    <ImageIcon className='h-4 w-4 text-gray-dark/50 dark:text-dark-text-muted/50' />
                )}
                <input type='file' accept='image/*' className='hidden' onChange={onEnviarImagem} />
            </label>

            <div className='min-w-0 flex-1'>
                {editando ? (
                    <div className='flex items-center gap-2'>
                        <input
                            type='text'
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            autoFocus
                            className='min-w-0 flex-1 rounded-md border border-gray-base/30 px-2 py-1 text-sm text-gray-text outline-none focus:border-orange-base dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                        <button
                            type='button'
                            onClick={salvar}
                            className='shrink-0 rounded-md bg-orange-base px-2 py-1 text-xs font-semibold text-white transition hover:bg-orange-light'
                        >
                            Salvar
                        </button>
                        <button
                            type='button'
                            onClick={() => {
                                setNome(categoria.nome)
                                setEditando(false)
                            }}
                            className='shrink-0 text-xs text-gray-dark transition hover:text-gray-text dark:text-dark-text-muted'
                        >
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <button type='button' onClick={() => setEditando(true)} className='text-left'>
                        <span className='text-sm font-medium text-gray-text transition hover:text-orange-base dark:text-dark-text'>
                            {categoria.nome}
                        </span>
                    </button>
                )}
            </div>

            <button
                type='button'
                onClick={onAlternarAtivo}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
                    categoria.ativo
                        ? 'bg-green-base/10 text-green-base hover:bg-green-base/20'
                        : 'bg-gray-base/10 text-gray-dark hover:bg-gray-base/20 dark:text-dark-text-muted'
                }`}
            >
                {categoria.ativo ? 'Ativo' : 'Inativo'}
            </button>

            <button
                type='button'
                onClick={onRemover}
                className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-base/10 text-red-base transition hover:bg-red-base hover:text-white'
                aria-label={`Excluir categoria ${categoria.nome}`}
            >
                <TrashIcon className='h-4 w-4' />
            </button>
        </div>
    )
}

export default function CategoriasAdmin() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const autorizado = me?.isAdmin ?? false

    const [aba, setAba] = useState<'produtos' | 'categorias'>('produtos')

    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loadingCategorias, setLoadingCategorias] = useState(true)
    const [erroCategorias, setErroCategorias] = useState<string | null>(null)
    const [novaCategoria, setNovaCategoria] = useState('')
    const [criandoCategoria, setCriandoCategoria] = useState(false)
    const [enviandoImagemId, setEnviandoImagemId] = useState<string | null>(null)

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

    const [filtroNomeCategoria, setFiltroNomeCategoria] = useState('')
    const [filtroStatusCategoria, setFiltroStatusCategoria] = useState<'todos' | 'ativo' | 'inativo'>('todos')

    const [filtroBuscaProduto, setFiltroBuscaProduto] = useState('')
    const [filtroCategoriaProduto, setFiltroCategoriaProduto] = useState('')
    const [filtroStatusProduto, setFiltroStatusProduto] = useState<'todos' | 'ativo' | 'inativo'>('todos')

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

    async function renomearCategoria(id: string, nome: string) {
        try {
            const categoria = await apiPatch<Categoria>(`/categorias/${id}`, { nome })
            setCategorias((prev) =>
                prev.map((c) => (c.id === id ? categoria : c)).sort((a, b) => a.nome.localeCompare(b.nome))
            )
        } catch (err) {
            setErroCategorias(err instanceof ApiError ? err.message : 'Erro ao renomear categoria.')
        }
    }

    async function alternarAtivoCategoria(categoria: Categoria) {
        try {
            const atualizada = await apiPatch<Categoria>(`/categorias/${categoria.id}`, { ativo: !categoria.ativo })
            setCategorias((prev) => prev.map((c) => (c.id === categoria.id ? atualizada : c)))
        } catch (err) {
            setErroCategorias(err instanceof ApiError ? err.message : 'Erro ao atualizar categoria.')
        }
    }

    async function enviarImagemCategoria(id: string, e: ChangeEvent<HTMLInputElement>) {
        const arquivo = e.target.files?.[0]
        e.target.value = ''
        if (!arquivo) return

        setEnviandoImagemId(id)
        try {
            const fd = new FormData()
            fd.append('imagem', arquivo)
            const categoria = await apiPatchForm<Categoria>(`/categorias/${id}/imagem`, fd)
            setCategorias((prev) => prev.map((c) => (c.id === id ? categoria : c)))
        } catch (err) {
            setErroCategorias(err instanceof ApiError ? err.message : 'Erro ao enviar imagem da categoria.')
        } finally {
            setEnviandoImagemId(null)
        }
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

    async function alternarAtivoProduto(produto: ProdutoRegistrado) {
        setSalvandoCodigo(produto.codigo_produto_ciss)
        try {
            await apiPatch(`/produtos/${produto.codigo_produto_ciss}`, { ativo: !produto.ativo })
            carregarProdutos()
        } catch (err) {
            setErroProdutos(err instanceof ApiError ? err.message : 'Erro ao atualizar produto.')
        } finally {
            setSalvandoCodigo(null)
        }
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

    const categoriasFiltradas = categorias.filter((categoria) => {
        if (filtroStatusCategoria === 'ativo' && !categoria.ativo) return false
        if (filtroStatusCategoria === 'inativo' && categoria.ativo) return false
        if (filtroNomeCategoria.trim() && !categoria.nome.toLowerCase().includes(filtroNomeCategoria.trim().toLowerCase())) {
            return false
        }
        return true
    })

    const produtosFiltrados = produtos.filter((produto) => {
        if (filtroStatusProduto === 'ativo' && !produto.ativo) return false
        if (filtroStatusProduto === 'inativo' && produto.ativo) return false
        if (filtroCategoriaProduto && !produto.categorias.some((c) => c.id === filtroCategoriaProduto)) return false
        if (filtroBuscaProduto.trim()) {
            const termo = filtroBuscaProduto.trim().toLowerCase()
            const descricao = produto.ciss?.DESCRICAO?.toLowerCase() ?? ''
            const codigo = String(produto.codigo_produto_ciss)
            if (!descricao.includes(termo) && !codigo.includes(termo)) return false
        }
        return true
    })

    return (
        <PageShell
            isAdmin={autorizado}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={autorizado}
            tituloAcessoRestrito='Categorias e Produtos é uma área restrita a administradores.'
            titulo='Categorias e Produtos'
            subtitulo='Cadastre categorias e produtos, e diga em quais categorias cada produto aparece na loja.'
        >
            <div className='flex gap-2'>
                <button
                    type='button'
                    onClick={() => setAba('produtos')}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        aba === 'produtos'
                            ? 'bg-orange-base text-white'
                            : 'bg-white text-gray-text hover:bg-orange-base/10 dark:bg-dark-surface dark:text-dark-text'
                    }`}
                >
                    Produtos
                </button>
                <button
                    type='button'
                    onClick={() => setAba('categorias')}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        aba === 'categorias'
                            ? 'bg-orange-base text-white'
                            : 'bg-white text-gray-text hover:bg-orange-base/10 dark:bg-dark-surface dark:text-dark-text'
                    }`}
                >
                    Categorias
                </button>
            </div>

            {aba === 'categorias' && (
            <div className='mt-6 flex flex-col gap-6'>
            <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>Categorias</span>

                <div className='mt-3 flex flex-wrap items-center gap-2'>
                    <input
                        type='text'
                        value={filtroNomeCategoria}
                        onChange={(e) => setFiltroNomeCategoria(e.target.value)}
                        placeholder='Filtrar por nome'
                        className='min-w-0 flex-1 rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                    />
                    {(['todos', 'ativo', 'inativo'] as const).map((valor) => (
                        <button
                            key={valor}
                            type='button'
                            onClick={() => setFiltroStatusCategoria(valor)}
                            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                filtroStatusCategoria === valor
                                    ? 'bg-orange-base text-white'
                                    : 'border border-gray-base/30 text-gray-text hover:border-orange-base dark:border-dark-border dark:text-dark-text'
                            }`}
                        >
                            {valor === 'todos' ? 'Todos' : valor === 'ativo' ? 'Ativo' : 'Inativo'}
                        </button>
                    ))}
                </div>

                {erroCategorias && <p className='mt-2 text-sm text-red-base'>{erroCategorias}</p>}

                {loadingCategorias ? (
                    <div className='mt-4 flex justify-center py-2'>
                        <Spinner className='h-5 w-5' />
                    </div>
                ) : (
                    <div className='mt-3 flex flex-col gap-2'>
                        {categoriasFiltradas.length === 0 && (
                            <span className='text-sm text-gray-dark dark:text-dark-text-muted'>
                                {categorias.length === 0 ? 'Nenhuma categoria criada ainda.' : 'Nenhuma categoria encontrada com esses filtros.'}
                            </span>
                        )}
                        {categoriasFiltradas.map((categoria) => (
                            <CategoriaRow
                                key={categoria.id}
                                categoria={categoria}
                                enviandoImagem={enviandoImagemId === categoria.id}
                                onEnviarImagem={(e) => enviarImagemCategoria(categoria.id, e)}
                                onRenomear={(nome) => renomearCategoria(categoria.id, nome)}
                                onAlternarAtivo={() => alternarAtivoCategoria(categoria)}
                                onRemover={() => removerCategoria(categoria.id)}
                            />
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
            </div>
            )}

            {aba === 'produtos' && (
            <div className='mt-6 flex flex-col gap-6'>
            <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
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

            <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>Produtos cadastrados</span>

                <div className='mt-3 flex flex-wrap items-center gap-2'>
                    <input
                        type='text'
                        value={filtroBuscaProduto}
                        onChange={(e) => setFiltroBuscaProduto(e.target.value)}
                        placeholder='Filtrar por nome ou código'
                        className='min-w-0 flex-1 rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                    />
                    <select
                        value={filtroCategoriaProduto}
                        onChange={(e) => setFiltroCategoriaProduto(e.target.value)}
                        className='shrink-0 rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                    >
                        <option value=''>Todas as categorias</option>
                        {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id}>
                                {categoria.nome}
                            </option>
                        ))}
                    </select>
                    {(['todos', 'ativo', 'inativo'] as const).map((valor) => (
                        <button
                            key={valor}
                            type='button'
                            onClick={() => setFiltroStatusProduto(valor)}
                            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                filtroStatusProduto === valor
                                    ? 'bg-orange-base text-white'
                                    : 'border border-gray-base/30 text-gray-text hover:border-orange-base dark:border-dark-border dark:text-dark-text'
                            }`}
                        >
                            {valor === 'todos' ? 'Todos' : valor === 'ativo' ? 'Ativo' : 'Inativo'}
                        </button>
                    ))}
                </div>

                {erroProdutos && <p className='mt-3 text-sm text-red-base'>{erroProdutos}</p>}

                {loadingProdutos ? (
                    <div className='mt-4 flex justify-center py-6'>
                        <Spinner className='h-5 w-5' />
                    </div>
                ) : produtos.length === 0 ? (
                    <p className='mt-3 text-sm text-gray-dark dark:text-dark-text-muted'>Nenhum produto cadastrado ainda.</p>
                ) : produtosFiltrados.length === 0 ? (
                    <p className='mt-3 text-sm text-gray-dark dark:text-dark-text-muted'>Nenhum produto encontrado com esses filtros.</p>
                ) : (
                    <ul className='mt-4 flex flex-col divide-y divide-gray-base/20 dark:divide-dark-border'>
                        {produtosFiltrados.map((produto) => {
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
                                        <button
                                            type='button'
                                            disabled={salvandoCodigo === produto.codigo_produto_ciss}
                                            onClick={() => alternarAtivoProduto(produto)}
                                            className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${
                                                produto.ativo
                                                    ? 'bg-green-base/10 text-green-base hover:bg-green-base/20'
                                                    : 'bg-gray-base/10 text-gray-dark hover:bg-gray-base/20 dark:text-dark-text-muted'
                                            }`}
                                        >
                                            {produto.ativo ? 'Ativo' : 'Inativo'}
                                        </button>
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
            </div>
            )}
        </PageShell>
    )
}
