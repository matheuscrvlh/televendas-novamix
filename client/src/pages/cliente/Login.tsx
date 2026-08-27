import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ClienteShell from '../../components/cliente/ClienteShell'
import Spinner from '../../components/Spinner'
import { MailIcon, LockIcon } from '../../components/icons'
import { clienteApiPost } from '../../lib/clienteApi'
import { ApiError } from '../../lib/api'

export default function ClienteLogin() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const redirect = searchParams.get('redirect') || '/'
    const [email, setEmail] = useState('')
    const [senha, setSenha] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function entrar(e: FormEvent) {
        e.preventDefault()
        setEnviando(true)
        setErro(null)
        try {
            await clienteApiPost('/cliente/login', { email: email.trim(), senha })
            navigate(redirect)
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Não foi possível entrar.')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <ClienteShell requireAuth={false} showBanner={false}>
            <div className='flex min-h-[60vh] items-center justify-center'>
                <div className='w-full max-w-sm rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                    <h1 className='mb-6 text-center text-lg font-semibold text-gray-text dark:text-dark-text'>
                        Entrar na sua conta
                    </h1>

                    <form onSubmit={entrar} className='flex flex-col gap-3'>
                        <div className='relative'>
                            <MailIcon className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-dark dark:text-dark-text-muted' />
                            <input
                                type='email'
                                required
                                placeholder='E-mail'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className='w-full rounded-lg border border-gray-base/30 bg-white py-2 pl-9 pr-3 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                            />
                        </div>
                        <div className='relative'>
                            <LockIcon className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-dark dark:text-dark-text-muted' />
                            <input
                                type='password'
                                required
                                placeholder='Senha'
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className='w-full rounded-lg border border-gray-base/30 bg-white py-2 pl-9 pr-3 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                            />
                        </div>

                        {erro && <p className='text-sm text-red-base'>{erro}</p>}

                        <button
                            type='submit'
                            disabled={enviando}
                            className='mt-2 flex items-center justify-center rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                        >
                            {enviando ? <Spinner className='h-4 w-4' /> : 'Entrar'}
                        </button>
                    </form>

                    <p className='mt-4 text-center text-sm text-gray-dark dark:text-dark-text-muted'>
                        Ainda não tem conta?{' '}
                        <Link to='/cadastro' className='font-semibold text-orange-base hover:underline'>
                            Cadastre-se
                        </Link>
                    </p>
                </div>
            </div>
        </ClienteShell>
    )
}
