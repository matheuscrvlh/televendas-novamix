import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from '../Logo'
import Footer from '../Footer'
import Spinner from '../Spinner'
import { useClienteMe } from '../../hooks/useClienteMe'
import { useCarrinho } from '../../contexts/CarrinhoContext'
import { clienteApiPost } from '../../lib/clienteApi'

type ClienteShellProps = {
    children: ReactNode
    /** Quando false, a página funciona sem login (tipo vitrine de e-commerce) — só algumas ações exigem conta. */
    requireAuth?: boolean
}

const linkBaseClass = 'rounded-lg px-3 py-2 text-sm font-semibold transition-colors'
const linkActiveClass = 'bg-orange-base text-white'
const linkInactiveClass =
    'text-gray-text hover:bg-orange-base/10 hover:text-orange-base dark:text-dark-text dark:hover:bg-orange-base/10 dark:hover:text-orange-light'

export default function ClienteShell({ children, requireAuth = true }: ClienteShellProps) {
    const { cliente, loading } = useClienteMe()
    const { itens } = useCarrinho()
    const navigate = useNavigate()

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

    return (
        <div className='min-h-screen w-full bg-gray dark:bg-dark-bg'>
            <header className='border-b border-gray-base/30 bg-white dark:border-dark-border dark:bg-dark-surface'>
                <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3'>
                    <Logo compact />

                    <nav className='flex flex-wrap items-center gap-2'>
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
                            Carrinho
                            {qtdCarrinho > 0 && (
                                <span className='ml-1 rounded-full bg-red-base px-1.5 py-0.5 text-xs text-white'>
                                    {qtdCarrinho}
                                </span>
                            )}
                        </NavLink>
                        {cliente && (
                            <NavLink
                                to='/conta'
                                className={({ isActive }) => `${linkBaseClass} ${isActive ? linkActiveClass : linkInactiveClass}`}
                            >
                                Minha conta
                            </NavLink>
                        )}
                    </nav>

                    <div className='flex items-center gap-3'>
                        {cliente ? (
                            <>
                                <button
                                    type='button'
                                    onClick={sair}
                                    className='rounded-lg bg-red-light px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-base'
                                >
                                    Sair
                                </button>
                            </>
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
                </div>
            </header>

            <main className='mx-auto max-w-6xl px-6 py-8'>{children}</main>

            <div className='pb-6'>
                <Footer />
            </div>
        </div>
    )
}
