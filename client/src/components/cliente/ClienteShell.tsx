import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../Logo'
import SiteFooter from './SiteFooter'
import WhatsAppFloatButton from './WhatsAppFloatButton'
import CarrinhoDrawer from './CarrinhoDrawer'
import Spinner from '../Spinner'
import BannerCarousel from '../BannerCarousel'
import {
    CartIcon,
    ChevronRightIcon,
    CloseIcon,
    HeadsetIcon,
    HeartIcon,
    LogOutIcon,
    MenuIcon,
    SearchIcon,
    UserIcon,
} from '../icons'
import { useClienteMe } from '../../hooks/useClienteMe'
import { useCarrinho } from '../../contexts/CarrinhoContext'
import { useFavoritos } from '../../contexts/FavoritosContext'
import { clienteApiGet, clienteApiPost } from '../../lib/clienteApi'
import { WHATSAPP_LINK } from '../../lib/contato'
import { formatCurrency } from '../../lib/format'
import type { CategoriaComProdutos } from '../../types/categoria'
import type { ConfigLoja } from '../../types/configLoja'

const TEXTO_TOPO_PADRAO = 'Venda exclusiva para clientes cadastrados Novamix'

type ClienteShellProps = {
    children: ReactNode
    /** Quando false, a página funciona sem login (tipo vitrine de e-commerce) — só algumas ações exigem conta. */
    requireAuth?: boolean
    /** Desliga o carrossel de banners — usado em telas sem contexto de vitrine, tipo login/cadastro. */
    showBanner?: boolean
}

const linkBaseClass = 'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors'

// Variante dos links usada dentro do header, que agora tem fundo laranja — precisa de texto claro.
const headerLinkActiveClass = 'bg-white text-orange-base'
const headerLinkInactiveClass = 'text-white hover:bg-white/15 hover:text-white'

// Itens do menu hambúrguer (fundo navy) — pills claras sobre fundo escuro.
const drawerPillClass = 'flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20'

function primeiroNome(razaoSocial: string) {
    return razaoSocial.trim().split(/\s+/)[0]
}

export default function ClienteShell({ children, requireAuth = true, showBanner = true }: ClienteShellProps) {
    const { cliente, loading } = useClienteMe()
    const { itens, total, abrir: abrirCarrinho } = useCarrinho()
    const { produtos: favoritos } = useFavoritos()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const [menuAberto, setMenuAberto] = useState(false)
    const [categoriaMenuAberto, setCategoriaMenuAberto] = useState(false)
    const [termoBusca, setTermoBusca] = useState(searchParams.get('busca') ?? '')
    const [categorias, setCategorias] = useState<CategoriaComProdutos[]>([])
    const [textoTopo, setTextoTopo] = useState(TEXTO_TOPO_PADRAO)

    useEffect(() => {
        clienteApiGet<CategoriaComProdutos[]>('/cliente/categorias')
            .then(setCategorias)
            .catch(() => setCategorias([]))

        clienteApiGet<ConfigLoja>('/cliente/config')
            .then((config) => setTextoTopo(config.textoTopo))
            .catch(() => {})
    }, [])

    // No menu de categorias do header, só as marcadas "Na home" aparecem soltas — as demais
    // ficam dentro do dropdown "Categorias", que sempre lista todas.
    const categoriasDestaque = useMemo(
        () => categorias.filter((c) => c.destaqueHome).sort((a, b) => a.ordemHome - b.ordemHome),
        [categorias]
    )

    // Depois do login (redirect=/?carrinho=aberto), reabre o carrinho automaticamente
    // e limpa o parâmetro da URL.
    useEffect(() => {
        if (searchParams.get('carrinho') !== 'aberto') return
        abrirCarrinho()
        const proximo = new URLSearchParams(searchParams)
        proximo.delete('carrinho')
        setSearchParams(proximo, { replace: true })
    }, [searchParams, abrirCarrinho, setSearchParams])

    useEffect(() => {
        if (!menuAberto) return
        const originalHtml = document.documentElement.style.overflow
        const originalBody = document.body.style.overflow
        document.documentElement.style.overflow = 'hidden'
        document.body.style.overflow = 'hidden'
        return () => {
            document.documentElement.style.overflow = originalHtml
            document.body.style.overflow = originalBody
        }
    }, [menuAberto])

    async function sair() {
        await clienteApiPost('/cliente/logout')
        navigate('/')
    }

    useEffect(() => {
        if (requireAuth && !loading && !cliente) navigate('/entrar')
    }, [requireAuth, loading, cliente, navigate])

    function buscar(e: FormEvent) {
        e.preventDefault()
        const termo = termoBusca.trim()
        navigate(termo ? `/?busca=${encodeURIComponent(termo)}` : '/')
    }

    if (requireAuth && (loading || !cliente)) {
        return (
            <div className='flex min-h-screen w-full items-center justify-center bg-gray dark:bg-dark-bg'>
                <Spinner className='h-6 w-6' />
            </div>
        )
    }

    const qtdCarrinho = itens.reduce((soma, item) => soma + item.quantidade, 0)

    function fecharMenu() {
        setMenuAberto(false)
    }

    return (
        <div className='min-h-screen w-full bg-gray dark:bg-dark-bg'>
            <header className='sticky top-0 z-40 border-b border-orange-light/40 bg-orange-base'>
                <div className='bg-white py-1 text-center text-[11px] font-medium text-gray-text dark:bg-dark-surface-2 dark:text-dark-text md:py-1.5 md:text-xs'>
                    {textoTopo}
                </div>

                <div className='mx-auto max-w-6xl px-4 py-2 md:px-6 md:py-3'>
                    {/* Mobile: hamburger + logo colados à esquerda — favoritos/carrinho à direita, busca numa linha abaixo */}
                    <div className='flex items-center justify-between gap-2 md:hidden'>
                        <div className='flex items-center gap-1'>
                            <button
                                type='button'
                                onClick={() => setMenuAberto((v) => !v)}
                                className='rounded-lg p-1.5 text-white transition hover:bg-white/15'
                                aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
                            >
                                <MenuIcon className='h-5 w-5' />
                            </button>

                            <Logo compact to='/' />
                        </div>

                        <div className='flex items-center gap-1'>
                            <NavLink
                                to='/favoritos'
                                className='relative rounded-lg p-1.5 text-white transition hover:bg-white/15'
                                aria-label='Favoritos'
                            >
                                <HeartIcon className='h-5 w-5' />
                                {favoritos.length > 0 && (
                                    <span className='absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-base px-1 text-[10px] font-semibold text-white'>
                                        {favoritos.length}
                                    </span>
                                )}
                            </NavLink>

                            <button
                                type='button'
                                onClick={abrirCarrinho}
                                className='relative rounded-lg p-1.5 text-white transition hover:bg-white/15'
                                aria-label='Meu carrinho'
                            >
                                <CartIcon className='h-5 w-5' />
                                {qtdCarrinho > 0 && (
                                    <span className='absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-base px-1 text-[10px] font-semibold text-white'>
                                        {qtdCarrinho}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={buscar} className='mt-2 md:hidden'>
                        <div className='relative'>
                            <input
                                type='text'
                                value={termoBusca}
                                onChange={(e) => setTermoBusca(e.target.value)}
                                placeholder='O que você procura?'
                                className='w-full rounded-lg border border-gray-base/30 bg-gray px-4 py-2 pr-10 text-sm text-gray-text focus:border-orange-base focus:outline-none dark:border-dark-border dark:bg-dark-surface-2 dark:text-dark-text'
                            />
                            <button
                                type='submit'
                                aria-label='Buscar'
                                className='absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-dark transition hover:text-orange-base dark:text-dark-text-muted'
                            >
                                <SearchIcon className='h-4 w-4' />
                            </button>
                        </div>
                    </form>

                    {/* Desktop: logo — busca — nav — conta */}
                    <div className='hidden items-center gap-4 md:flex'>
                        <Logo compact to='/' className='md:mr-3' />

                        <form onSubmit={buscar} className='flex-1'>
                            <div className='relative'>
                                <input
                                    type='text'
                                    value={termoBusca}
                                    onChange={(e) => setTermoBusca(e.target.value)}
                                    placeholder='O que você procura?'
                                    className='w-full rounded-lg border border-gray-base/30 bg-gray px-4 py-2.5 pr-10 text-sm text-gray-text focus:border-orange-base focus:outline-none dark:border-dark-border dark:bg-dark-surface-2 dark:text-dark-text'
                                />
                                <button
                                    type='submit'
                                    aria-label='Buscar'
                                    className='absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-dark transition hover:text-orange-base dark:text-dark-text-muted'
                                >
                                    <SearchIcon className='h-4 w-4' />
                                </button>
                            </div>
                        </form>

                        <nav className='flex items-center gap-1'>
                            <a
                                href={WHATSAPP_LINK}
                                target='_blank'
                                rel='noopener noreferrer'
                                className={`${linkBaseClass} ${headerLinkInactiveClass}`}
                            >
                                <HeadsetIcon className='h-4 w-4' />
                                Atendimento
                            </a>

                            <NavLink
                                to='/favoritos'
                                className={({ isActive }) => `relative ${linkBaseClass} ${isActive ? headerLinkActiveClass : headerLinkInactiveClass}`}
                            >
                                <HeartIcon className='h-4 w-4' />
                                Favoritos
                                {favoritos.length > 0 && (
                                    <span className='rounded-full bg-red-base px-1.5 py-0.5 text-xs text-white'>
                                        {favoritos.length}
                                    </span>
                                )}
                            </NavLink>

                            <button
                                type='button'
                                onClick={abrirCarrinho}
                                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${headerLinkInactiveClass}`}
                            >
                                <CartIcon className='h-4 w-4' />
                                <span className='flex flex-col leading-tight'>
                                    <span className='text-sm font-semibold'>Meu carrinho</span>
                                    <span className='text-xs font-normal opacity-80'>{formatCurrency(total)}</span>
                                </span>
                                {qtdCarrinho > 0 && (
                                    <span className='rounded-full bg-red-base px-1.5 py-0.5 text-xs font-semibold text-white'>
                                        {qtdCarrinho}
                                    </span>
                                )}
                            </button>
                        </nav>

                        <div className='flex items-center gap-2'>
                            <Link
                                to={cliente ? '/conta' : '/entrar'}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${headerLinkInactiveClass}`}
                            >
                                <UserIcon className='h-5 w-5 shrink-0' />
                                <span className='flex flex-col leading-tight'>
                                    <span className='text-xs font-normal text-white/80'>
                                        Olá, {cliente ? primeiroNome(cliente.razaoSocial) : 'Visitante'}
                                    </span>
                                    <span className='text-sm font-semibold'>{cliente ? 'Minha conta' : 'Fazer login'}</span>
                                </span>
                            </Link>

                            {cliente && (
                                <button
                                    type='button'
                                    onClick={sair}
                                    className='rounded-lg bg-red-light px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-base'
                                >
                                    Sair
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {categorias.length > 0 && (
                    <div className='hidden border-t border-orange-light/40 md:block'>
                        <div className='mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-6 py-2'>
                            <div className='relative'>
                                <button
                                    type='button'
                                    onClick={() => setCategoriaMenuAberto((v) => !v)}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                                        categoriaMenuAberto ? 'bg-white text-orange-base' : 'bg-white/15 text-white hover:bg-white/25'
                                    }`}
                                >
                                    <MenuIcon className='h-4 w-4' />
                                    Categorias
                                </button>

                                {categoriaMenuAberto && (
                                    <>
                                        <div className='fixed inset-0 z-40' onClick={() => setCategoriaMenuAberto(false)} />
                                        <div className='absolute left-0 top-full z-50 mt-1 max-h-96 w-64 overflow-y-auto rounded-lg border border-gray-base/30 bg-white py-2 shadow-lg dark:border-dark-border dark:bg-dark-surface'>
                                            {categorias.map((categoria) => (
                                                <Link
                                                    key={categoria.id}
                                                    to={`/?categoria=${categoria.id}`}
                                                    onClick={() => setCategoriaMenuAberto(false)}
                                                    className='block px-4 py-2 text-sm text-gray-text transition hover:bg-orange-base/10 hover:text-orange-base dark:text-dark-text dark:hover:bg-orange-base/10 dark:hover:text-orange-light'
                                                >
                                                    {categoria.nome}
                                                </Link>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className='flex flex-wrap gap-1'>
                                {categoriasDestaque.map((categoria) => (
                                    <Link
                                        key={categoria.id}
                                        to={`/?categoria=${categoria.id}`}
                                        className='rounded-lg px-2.5 py-1 text-sm font-medium text-white transition hover:bg-white/15'
                                    >
                                        {categoria.nome}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <div
                className={`fixed inset-0 z-30 bg-black transition-opacity duration-300 md:hidden ${
                    menuAberto ? 'pointer-events-auto opacity-50' : 'pointer-events-none opacity-0'
                }`}
                onClick={fecharMenu}
            />

            <aside
                className={`fixed top-0 left-0 z-40 flex h-dvh w-80 max-w-[85vw] flex-col bg-orange-base shadow-lg transition-transform duration-300 ease-in-out md:hidden ${
                    menuAberto ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className='flex items-center justify-between gap-3 p-4'>
                    <Link to={cliente ? '/conta' : '/entrar'} onClick={fecharMenu} className='flex items-center gap-2 text-white'>
                        <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15'>
                            <UserIcon className='h-5 w-5' />
                        </span>
                        <span className='flex flex-col leading-tight'>
                            <span className='text-xs font-normal text-white/70'>
                                Olá, {cliente ? primeiroNome(cliente.razaoSocial) : 'Visitante'}
                            </span>
                            <span className='text-sm font-semibold'>{cliente ? 'Minha conta' : 'Fazer login'}</span>
                        </span>
                    </Link>

                    <button
                        type='button'
                        onClick={fecharMenu}
                        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-orange-base transition hover:bg-white/90'
                        aria-label='Fechar menu'
                    >
                        <CloseIcon className='h-5 w-5' />
                    </button>
                </div>

                <nav className='mt-2 flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4'>
                    <NavLink to='/' end onClick={fecharMenu} className={drawerPillClass}>
                        <span className='flex-1'>Catálogo</span>
                        <ChevronRightIcon className='h-4 w-4 text-white/60' />
                    </NavLink>

                    {categorias.map((categoria) => (
                        <Link
                            key={categoria.id}
                            to={`/?categoria=${categoria.id}`}
                            onClick={fecharMenu}
                            className={drawerPillClass}
                        >
                            <span className='flex-1'>{categoria.nome}</span>
                            <ChevronRightIcon className='h-4 w-4 text-white/60' />
                        </Link>
                    ))}
                </nav>

                <div className='flex items-center justify-around gap-2 border-t border-white/10 p-4'>
                    <a
                        href={WHATSAPP_LINK}
                        target='_blank'
                        rel='noopener noreferrer'
                        onClick={fecharMenu}
                        className='flex flex-col items-center gap-1 text-xs font-semibold text-white/80 transition hover:text-white'
                    >
                        <HeadsetIcon className='h-5 w-5' />
                        Atendimento
                    </a>

                    <Link
                        to={cliente ? '/conta' : '/entrar'}
                        onClick={fecharMenu}
                        className='flex flex-col items-center gap-1 text-xs font-semibold text-white/80 transition hover:text-white'
                    >
                        <UserIcon className='h-5 w-5' />
                        Meus pedidos
                    </Link>

                    {cliente && (
                        <button
                            type='button'
                            onClick={() => {
                                fecharMenu()
                                sair()
                            }}
                            className='flex flex-col items-center gap-1 text-xs font-semibold text-white/80 transition hover:text-white'
                        >
                            <LogOutIcon className='h-5 w-5' />
                            Sair
                        </button>
                    )}
                </div>
            </aside>

            {showBanner && <BannerCarousel />}

            <main className='mx-auto max-w-6xl px-6 py-8'>{children}</main>

            <SiteFooter />
            <WhatsAppFloatButton />
            <CarrinhoDrawer />
        </div>
    )
}
