import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from '../Logo'
import Footer from '../Footer'
import Spinner from '../Spinner'
import BannerCarousel from '../BannerCarousel'
import { CartIcon, CloseIcon, LogOutIcon, MenuIcon, UserIcon } from '../icons'
import { useClienteMe } from '../../hooks/useClienteMe'
import { useCarrinho } from '../../contexts/CarrinhoContext'
import { clienteApiPost } from '../../lib/clienteApi'

type ClienteShellProps = {
    children: ReactNode
    /** Quando false, a página funciona sem login (tipo vitrine de e-commerce) — só algumas ações exigem conta. */
    requireAuth?: boolean
}

const linkBaseClass = 'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors'
const linkActiveClass = 'bg-orange-base text-white'
const linkInactiveClass =
    'text-gray-text hover:bg-orange-base/10 hover:text-orange-base dark:text-dark-text dark:hover:bg-orange-base/10 dark:hover:text-orange-light'

export default function ClienteShell({ children, requireAuth = true }: ClienteShellProps) {
    const { cliente, loading } = useClienteMe()
    const { itens } = useCarrinho()
    const navigate = useNavigate()

    const [menuAberto, setMenuAberto] = useState(false)

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
            <header className='sticky top-0 z-40 border-b border-gray-base/30 bg-white dark:border-dark-border dark:bg-dark-surface'>
                <div className='mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3'>
                    <Logo compact />

                    <nav className='hidden items-center gap-2 md:flex'>
                        <NavLink
                            to='/'
                            end
                            className={({ isActive }) => `${linkBaseClass} ${isActive ? linkActiveClass : linkInactiveClass}`}
                        >
                            Catálogo
                        </NavLink>
                        <NavLink
                            to='/carrinho'
                            className={({ isActive }) => `relative ${linkBaseClass} ${isActive ? linkActiveClass : linkInactiveClass}`}
                        >
                            <CartIcon className='h-4 w-4' />
                            Carrinho
                            {qtdCarrinho > 0 && (
                                <span className='rounded-full bg-red-base px-1.5 py-0.5 text-xs text-white'>
                                    {qtdCarrinho}
                                </span>
                            )}
                        </NavLink>
                        {cliente && (
                            <NavLink
                                to='/conta'
                                className={({ isActive }) => `${linkBaseClass} ${isActive ? linkActiveClass : linkInactiveClass}`}
                            >
                                <UserIcon className='h-4 w-4' />
                                Minha conta
                            </NavLink>
                        )}
                    </nav>

                    <div className='hidden items-center gap-3 md:flex'>
                        {cliente ? (
                            <button
                                type='button'
                                onClick={sair}
                                className='rounded-lg bg-red-light px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-base'
                            >
                                Sair
                            </button>
                        ) : (
                            !loading && (
                                <Link
                                    to='/entrar'
                                    className='rounded-lg bg-orange-base px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-light'
                                >
                                    Entrar
                                </Link>
                            )
                        )}
                    </div>

                    <button
                        type='button'
                        onClick={() => setMenuAberto((v) => !v)}
                        className='relative rounded-lg p-2 text-gray-text transition hover:bg-orange-base/10 hover:text-orange-base dark:text-dark-text md:hidden'
                        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
                    >
                        <MenuIcon className='h-6 w-6' />
                        {qtdCarrinho > 0 && (
                            <span className='absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-base' />
                        )}
                    </button>
                </div>
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
                    <NavLink
                        to='/carrinho'
                        onClick={fecharMenu}
                        className={({ isActive }) => `${linkBaseClass} ${isActive ? linkActiveClass : linkInactiveClass}`}
                    >
                        <CartIcon className='h-4 w-4' />
                        Carrinho
                        {qtdCarrinho > 0 && (
                            <span className='rounded-full bg-red-base px-1.5 py-0.5 text-xs text-white'>
                                {qtdCarrinho}
                            </span>
                        )}
                    </NavLink>
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
                </nav>

                <div className='p-4'>
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
                                Entrar
                            </Link>
                        )
                    )}
                </div>
            </aside>

            <BannerCarousel />

            <main className='mx-auto max-w-6xl px-6 py-8'>{children}</main>

            <div className='pb-6'>
                <Footer />
            </div>
        </div>
    )
}
