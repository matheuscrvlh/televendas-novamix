import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../Logo'
import SiteFooter from './SiteFooter'
import WhatsAppFloatButton from './WhatsAppFloatButton'
import CarrinhoDrawer from './CarrinhoDrawer'
import Spinner from '../Spinner'
import BannerCarousel from '../BannerCarousel'
import { CartIcon, CloseIcon, HeadsetIcon, HeartIcon, LogOutIcon, MenuIcon, SearchIcon, UserIcon } from '../icons'
import { useClienteMe } from '../../hooks/useClienteMe'
import { useCarrinho } from '../../contexts/CarrinhoContext'
import { useFavoritos } from '../../contexts/FavoritosContext'
import { clienteApiGet, clienteApiPost } from '../../lib/clienteApi'
import { WHATSAPP_LINK } from '../../lib/contato'
import { formatCurrency } from '../../lib/format'
import type { CategoriaNav } from '../../types/categoria'

type ClienteShellProps = {
    children: ReactNode
    /** Quando false, a página funciona sem login (tipo vitrine de e-commerce) — só algumas ações exigem conta. */
    requireAuth?: boolean
    /** Desliga o carrossel de banners — usado em telas sem contexto de vitrine, tipo login/cadastro. */
    showBanner?: boolean
}

const linkBaseClass = 'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors'
const linkActiveClass = 'bg-orange-base text-white'
const linkInactiveClass =
    'text-gray-text hover:bg-orange-base/10 hover:text-orange-base dark:text-dark-text dark:hover:bg-orange-base/10 dark:hover:text-orange-light'

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
    const [termoBusca, setTermoBusca] = useState(searchParams.get('busca') ?? '')
    const [categorias, setCategorias] = useState<CategoriaNav[]>([])

    useEffect(() => {
        clienteApiGet<CategoriaNav[]>('/cliente/categorias')
            .then(setCategorias)
            .catch(() => setCategorias([]))
    }, [])

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
            <div className='bg-gray-text py-1.5 text-center text-xs font-medium text-white dark:bg-dark-surface-2'>
                Venda exclusiva para clientes cadastrados Novamix
            </div>

            <header className='sticky top-0 z-40 border-b border-gray-base/30 bg-white dark:border-dark-border dark:bg-dark-surface'>
                <div className='mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-3'>
                    <Logo compact />

                    <form onSubmit={buscar} className='order-3 w-full sm:order-0 sm:flex-1'>
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

                    <nav className='hidden items-center gap-1 md:flex'>
                        <a
                            href={WHATSAPP_LINK}
                            target='_blank'
                            rel='noopener noreferrer'
                            className={`${linkBaseClass} ${linkInactiveClass}`}
                        >
                            <HeadsetIcon className='h-4 w-4' />
                            Atendimento
                        </a>

                        <NavLink
                            to='/favoritos'
                            className={({ isActive }) => `relative ${linkBaseClass} ${isActive ? linkActiveClass : linkInactiveClass}`}
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
                            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${linkInactiveClass}`}
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

                    <div className='hidden items-center gap-2 md:flex'>
                        <Link
                            to={cliente ? '/conta' : '/entrar'}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${linkInactiveClass}`}
                        >
                            <UserIcon className='h-5 w-5 shrink-0' />
                            <span className='flex flex-col leading-tight'>
                                <span className='text-xs font-normal text-gray-dark dark:text-dark-text-muted'>
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

                    <button
                        type='button'
                        onClick={() => setMenuAberto((v) => !v)}
                        className='relative rounded-lg p-2 text-gray-text transition hover:bg-orange-base/10 hover:text-orange-base dark:text-dark-text md:hidden'
                        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
                    >
                        <MenuIcon className='h-6 w-6' />
                        {(qtdCarrinho > 0 || favoritos.length > 0) && (
                            <span className='absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-base' />
                        )}
                    </button>
                </div>

                {categorias.length > 0 && (
                    <div className='hidden border-t border-gray-base/20 md:block dark:border-dark-border'>
                        <div className='mx-auto flex max-w-6xl flex-wrap gap-1 px-6 py-2'>
                            {categorias.map((categoria) => (
                                <Link
                                    key={categoria.id}
                                    to={`/?categoria=${categoria.id}`}
                                    className='rounded-lg px-2.5 py-1 text-sm font-medium text-gray-text transition hover:bg-orange-base/10 hover:text-orange-base dark:text-dark-text dark:hover:bg-orange-base/10 dark:hover:text-orange-light'
                                >
                                    {categoria.nome}
                                </Link>
                            ))}
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
                className={`fixed top-0 right-0 z-40 flex h-dvh w-72 flex-col border-l border-gray-base/30 bg-white shadow-lg transition-transform duration-300 ease-in-out dark:border-dark-border dark:bg-dark-surface md:hidden ${
                    menuAberto ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className='flex items-center justify-between border-b border-gray-base/30 p-4 dark:border-dark-border'>
                    <Logo compact />
                    <button
                        type='button'
                        onClick={fecharMenu}
                        className='rounded-md p-1 text-gray-dark hover:text-orange-base dark:text-dark-text-muted dark:hover:text-orange-light'
                        aria-label='Fechar menu'
                    >
                        <CloseIcon className='h-5 w-5' />
                    </button>
                </div>

                <nav className='mt-4 flex flex-1 flex-col gap-2 overflow-y-auto px-4'>
                    <NavLink
                        to='/'
                        end
                        onClick={fecharMenu}
                        className={({ isActive }) => `${linkBaseClass} ${isActive ? linkActiveClass : linkInactiveClass}`}
                    >
                        Catálogo
                    </NavLink>
                    <a
                        href={WHATSAPP_LINK}
                        target='_blank'
                        rel='noopener noreferrer'
                        onClick={fecharMenu}
                        className={`${linkBaseClass} ${linkInactiveClass}`}
                    >
                        <HeadsetIcon className='h-4 w-4' />
                        Atendimento
                    </a>
                    <NavLink
                        to='/favoritos'
                        onClick={fecharMenu}
                        className={({ isActive }) => `${linkBaseClass} ${isActive ? linkActiveClass : linkInactiveClass}`}
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
                        onClick={() => {
                            fecharMenu()
                            abrirCarrinho()
                        }}
                        className={`${linkBaseClass} ${linkInactiveClass}`}
                    >
                        <CartIcon className='h-4 w-4' />
                        <span className='flex flex-1 items-center justify-between'>
                            <span>Meu carrinho</span>
                            <span className='text-xs font-normal opacity-80'>{formatCurrency(total)}</span>
                        </span>
                        {qtdCarrinho > 0 && (
                            <span className='rounded-full bg-red-base px-1.5 py-0.5 text-xs text-white'>
                                {qtdCarrinho}
                            </span>
                        )}
                    </button>
                    {cliente && (
                        <NavLink
                            to='/conta'
                            onClick={fecharMenu}
                            className={({ isActive }) => `${linkBaseClass} ${isActive ? linkActiveClass : linkInactiveClass}`}
                        >
                            <UserIcon className='h-4 w-4' />
                            Minha conta
                        </NavLink>
                    )}

                    {categorias.length > 0 && (
                        <div className='mt-2 border-t border-gray-base/20 pt-2 dark:border-dark-border'>
                            <p className='px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                Categorias
                            </p>
                            {categorias.map((categoria) => (
                                <Link
                                    key={categoria.id}
                                    to={`/?categoria=${categoria.id}`}
                                    onClick={fecharMenu}
                                    className={`${linkBaseClass} ${linkInactiveClass}`}
                                >
                                    {categoria.nome}
                                </Link>
                            ))}
                        </div>
                    )}
                </nav>

                <div className='flex flex-col gap-3 p-4'>
                    <p className='text-sm text-gray-dark dark:text-dark-text-muted'>
                        Olá, <span className='font-semibold text-gray-text dark:text-dark-text'>{cliente ? primeiroNome(cliente.razaoSocial) : 'Visitante'}</span>
                    </p>

                    {cliente ? (
                        <button
                            type='button'
                            onClick={() => {
                                fecharMenu()
                                sair()
                            }}
                            className='flex w-full items-center justify-center gap-2 rounded-lg bg-red-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-base'
                        >
                            <LogOutIcon className='h-4 w-4' />
                            Sair
                        </button>
                    ) : (
                        !loading && (
                            <Link
                                to='/entrar'
                                onClick={fecharMenu}
                                className='flex w-full items-center justify-center rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-light'
                            >
                                Fazer login
                            </Link>
                        )
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
