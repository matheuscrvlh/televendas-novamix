import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ClienteShell from '../../components/cliente/ClienteShell'
import ProdutoCard from '../../components/cliente/ProdutoCard'
import ProdutoCarousel from '../../components/cliente/ProdutoCarousel'
import Spinner from '../../components/Spinner'
import { ChevronLeftIcon, ChevronRightIcon, TagIcon } from '../../components/icons'
import { clienteApiGet } from '../../lib/clienteApi'
import { uploadImagemUrl } from '../../lib/imagens'
import type { CategoriaComProdutos, ProdutoCatalogo } from '../../types/categoria'
import type { Banner } from '../../types/marketing'

const TODOS_ID = 'todos'
const ITENS_POR_PAGINA = 25

export default function Loja() {
    const [searchParams, setSearchParams] = useSearchParams()

    const [categorias, setCategorias] = useState<CategoriaComProdutos[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    const [ofertas, setOfertas] = useState<ProdutoCatalogo[]>([])
    const [bannerSecao, setBannerSecao] = useState<Banner | null>(null)

    const categoriaId = searchParams.get('categoria') ?? TODOS_ID
    const busca = searchParams.get('busca') ?? ''

    useEffect(() => {
        clienteApiGet<CategoriaComProdutos[]>('/cliente/categorias')
            .then(setCategorias)
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))

        clienteApiGet<ProdutoCatalogo[]>('/cliente/produtos/ofertas')
            .then(setOfertas)
            .catch(() => setOfertas([]))

        // Só o primeiro banner de seção ativo é exibido — não é carrossel.
        clienteApiGet<Banner[]>('/banners?posicao=secao')
            .then((banners) => setBannerSecao(banners[0] ?? null))
            .catch(() => setBannerSecao(null))
    }, [])

    function selecionarCategoria(id: string) {
        setSearchParams(id === TODOS_ID ? {} : { categoria: id })
    }

    // Todos os produtos do catálogo, sem repetir quando o mesmo produto está em mais de uma categoria.
    const todosProdutos = useMemo(() => {
        const vistos = new Set<number>()
        const resultado: ProdutoCatalogo[] = []

        for (const categoria of categorias) {
            for (const produto of categoria.produtos) {
                if (vistos.has(produto.CODIGO_PRODUTO)) continue
                vistos.add(produto.CODIGO_PRODUTO)
                resultado.push(produto)
            }
        }

        return resultado
    }, [categorias])

    // Filtro por seção restringe a base; a busca sempre atua dentro dela — ou seja,
    // buscar com uma seção selecionada procura só ali dentro.
    const baseFiltrada = useMemo(() => {
        if (categoriaId === TODOS_ID) return todosProdutos
        return categorias.find((c) => c.id === categoriaId)?.produtos ?? []
    }, [categoriaId, categorias, todosProdutos])

    const produtosExibidos = useMemo(() => {
        const termo = busca.trim().toLowerCase()
        if (!termo) return baseFiltrada
        return baseFiltrada.filter((produto) => produto.DESCRICAO.toLowerCase().includes(termo))
    }, [baseFiltrada, busca])

    const categoriaAtual = categorias.find((c) => c.id === categoriaId)
    const vitrineInicial = categoriaId === TODOS_ID && !busca.trim()

    // Seções com carrossel próprio na home — só as categorias marcadas "Na home" no admin,
    // e só se tiverem produto (senão o carrossel fica vazio à toa).
    const categoriasDestaque = useMemo(
        () =>
            categorias
                .filter((c) => c.destaqueHome && c.produtos.length > 0)
                .sort((a, b) => a.ordemHome - b.ordemHome),
        [categorias]
    )

    // Sem categoria em destaque configurada, cai de volta pro grid geral pra home não ficar vazia.
    const mostrarGridPlano = !vitrineInicial || categoriasDestaque.length === 0

    const tituloGrid = busca.trim()
        ? `Resultados para "${busca}"`
        : categoriaAtual
          ? categoriaAtual.nome
          : 'Todos os produtos'

    const totalPaginas = Math.max(1, Math.ceil(produtosExibidos.length / ITENS_POR_PAGINA))
    const paginaAtual = Math.min(Math.max(1, Number(searchParams.get('pagina')) || 1), totalPaginas)
    const produtosPaginados = produtosExibidos.slice(
        (paginaAtual - 1) * ITENS_POR_PAGINA,
        paginaAtual * ITENS_POR_PAGINA
    )

    function irParaPagina(pagina: number) {
        const proximo = new URLSearchParams(searchParams)
        if (pagina <= 1) proximo.delete('pagina')
        else proximo.set('pagina', String(pagina))
        setSearchParams(proximo)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <ClienteShell requireAuth={false}>
            {loading && (
                <div className='mt-8 flex justify-center'>
                    <Spinner className='h-6 w-6' />
                </div>
            )}

            {erro && <p className='mt-6 text-sm text-red-base'>{erro}</p>}

            {!loading && !erro && categorias.length === 0 && (
                <p className='mt-6 text-sm text-gray-dark dark:text-dark-text-muted'>
                    Ainda não há produtos disponíveis. Fale com seu vendedor.
                </p>
            )}

            {!loading && !erro && vitrineInicial && (
                <>
                    <ProdutoCarousel
                        titulo='Ofertas imperdíveis'
                        icone={<TagIcon className='h-5 w-5 text-orange-base' />}
                        produtos={ofertas}
                    />

                    {categoriasDestaque.length > 0 && (
                        <div className='mt-10'>
                            <h2 className='mb-6 text-xl font-bold uppercase tracking-wide text-gray-text dark:text-dark-text'>
                                Compre por categoria
                            </h2>
                            <div className='flex flex-wrap justify-center gap-x-8 gap-y-8 sm:justify-start'>
                                {categoriasDestaque.slice(0, 4).map((categoria) => (
                                    <button
                                        key={categoria.id}
                                        type='button'
                                        onClick={() => selecionarCategoria(categoria.id)}
                                        className='group flex flex-col items-center gap-3 text-center'
                                    >
                                        <span className='flex h-[139px] w-[150px] items-center justify-center transition duration-200 group-hover:-translate-y-1 sm:h-[193px] sm:w-[209px]'>
                                            {categoria.imagem ? (
                                                <img
                                                    src={uploadImagemUrl(categoria.imagem)}
                                                    alt=''
                                                    className='h-full w-full object-contain'
                                                />
                                            ) : (
                                                <span className='flex h-24 w-24 items-center justify-center rounded-full bg-orange-base/10 text-2xl font-bold text-orange-base sm:h-36 sm:w-36 sm:text-3xl'>
                                                    {categoria.nome.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </span>
                                        <span className='text-sm font-semibold text-gray-text transition group-hover:text-orange-base dark:text-dark-text'>
                                            {categoria.nome}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {bannerSecao && (
                        <div className='mt-8 overflow-hidden rounded-xl bg-gray dark:bg-dark-surface-2'>
                            {bannerSecao.link ? (
                                <a href={bannerSecao.link} target='_blank' rel='noopener noreferrer'>
                                    <img
                                        src={uploadImagemUrl(bannerSecao.imagem)}
                                        alt=''
                                        className='aspect-1358/351 w-full object-cover'
                                    />
                                </a>
                            ) : (
                                <img
                                    src={uploadImagemUrl(bannerSecao.imagem)}
                                    alt=''
                                    className='aspect-1358/351 w-full object-cover'
                                />
                            )}
                        </div>
                    )}

                    {categoriasDestaque.map((categoria) => (
                        <ProdutoCarousel
                            key={categoria.id}
                            titulo={categoria.nome}
                            produtos={categoria.produtos}
                            to={`/?categoria=${categoria.id}`}
                        />
                    ))}
                </>
            )}

            {!loading && !erro && mostrarGridPlano && categorias.length > 0 && (
                <div className='mt-8'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                        <h2 className='text-lg font-semibold text-gray-text dark:text-dark-text'>
                            {tituloGrid}
                            <span className='ml-2 text-sm font-normal text-gray-dark dark:text-dark-text-muted'>
                                ({produtosExibidos.length})
                            </span>
                        </h2>
                        {categoriaId !== TODOS_ID && (
                            <button
                                type='button'
                                onClick={() => selecionarCategoria(TODOS_ID)}
                                className='text-sm font-semibold text-orange-base hover:underline'
                            >
                                Ver todos os produtos
                            </button>
                        )}
                    </div>

                    {produtosExibidos.length === 0 ? (
                        <p className='mt-4 text-sm text-gray-dark dark:text-dark-text-muted'>Nenhum produto encontrado.</p>
                    ) : (
                        <>
                            <div className='mt-4 grid grid-cols-[repeat(auto-fill,15rem)] justify-center gap-4 sm:justify-start'>
                                {produtosPaginados.map((produto) => (
                                    <ProdutoCard key={produto.CODIGO_PRODUTO} produto={produto} />
                                ))}
                            </div>

                            {totalPaginas > 1 && (
                                <div className='mt-6 flex items-center justify-center gap-4'>
                                    <button
                                        type='button'
                                        onClick={() => irParaPagina(paginaAtual - 1)}
                                        disabled={paginaAtual === 1}
                                        aria-label='Página anterior'
                                        className='rounded-full border border-gray-base/30 p-2 text-gray-text transition hover:bg-orange-base/10 hover:text-orange-base disabled:pointer-events-none disabled:opacity-40 dark:border-dark-border dark:text-dark-text'
                                    >
                                        <ChevronLeftIcon className='h-4 w-4' />
                                    </button>
                                    <span className='text-sm text-gray-dark dark:text-dark-text-muted'>
                                        Página {paginaAtual} de {totalPaginas}
                                    </span>
                                    <button
                                        type='button'
                                        onClick={() => irParaPagina(paginaAtual + 1)}
                                        disabled={paginaAtual === totalPaginas}
                                        aria-label='Próxima página'
                                        className='rounded-full border border-gray-base/30 p-2 text-gray-text transition hover:bg-orange-base/10 hover:text-orange-base disabled:pointer-events-none disabled:opacity-40 dark:border-dark-border dark:text-dark-text'
                                    >
                                        <ChevronRightIcon className='h-4 w-4' />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </ClienteShell>
    )
}
