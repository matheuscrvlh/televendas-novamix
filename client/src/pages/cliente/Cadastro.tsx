import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ClienteShell from '../../components/cliente/ClienteShell'
import Spinner from '../../components/Spinner'
import { MailIcon, LockIcon } from '../../components/icons'
import { clienteApiPost } from '../../lib/clienteApi'
import { ApiError } from '../../lib/api'
import { maskCpfCnpj, maskTelefone } from '../../lib/mask'

export default function ClienteCadastro() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const redirect = searchParams.get('redirect') || '/'
    const [cnpjCpf, setCnpjCpf] = useState('')
    const [email, setEmail] = useState('')
    const [telefone, setTelefone] = useState('')
    const [senha, setSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function cadastrar(e: FormEvent) {
        e.preventDefault()

        if (senha !== confirmarSenha) {
            setErro('As senhas não conferem.')
            return
        }

        setEnviando(true)
        setErro(null)
        try {
            await clienteApiPost('/cliente/cadastro', {
                cnpjCpf: cnpjCpf.trim(),
                email: email.trim(),
                senha,
                telefone: telefone.trim() || undefined,
            })
            navigate(redirect)
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Não foi possível concluir o cadastro.')
        } finally {
            setEnviando(false)
        }
    }

    const inputClass =
        'rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'

    return (
        <ClienteShell requireAuth={false} showBanner={false}>
            <div className='flex min-h-[60vh] items-center justify-center py-8'>
                <div className='w-full max-w-sm rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                    <h1 className='mb-1 text-center text-lg font-semibold text-gray-text dark:text-dark-text'>
                        Criar sua conta
                    </h1>
                    <p className='mb-6 text-center text-xs text-gray-dark dark:text-dark-text-muted'>
                        Use o CNPJ ou CPF já cadastrado com seu vendedor Novamix.
                    </p>

                    <form onSubmit={cadastrar} className='flex flex-col gap-3'>
                        <input
                            type='text'
                            inputMode='numeric'
                            required
                            placeholder='CNPJ ou CPF'
                            value={cnpjCpf}
                            onChange={(e) => setCnpjCpf(maskCpfCnpj(e.target.value))}
                            className={inputClass}
                        />
                        <div className='relative'>
                            <MailIcon className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-dark dark:text-dark-text-muted' />
                            <input
                                type='email'
                                required
                                placeholder='E-mail'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`${inputClass} w-full pl-9`}
                            />
                        </div>
                        <input
                            type='text'
                            inputMode='numeric'
                            placeholder='Telefone (opcional)'
                            value={telefone}
                            onChange={(e) => setTelefone(maskTelefone(e.target.value))}
                            className={inputClass}
                        />
                        <div className='relative'>
                            <LockIcon className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-dark dark:text-dark-text-muted' />
                            <input
                                type='password'
                                required
                                minLength={6}
                                placeholder='Senha (mín. 6 caracteres)'
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className={`${inputClass} w-full pl-9`}
                            />
                        </div>
                        <div className='relative'>
                            <LockIcon className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-dark dark:text-dark-text-muted' />
                            <input
                                type='password'
                                required
                                placeholder='Confirmar senha'
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                className={`${inputClass} w-full pl-9`}
                            />
                        </div>

                        {erro && <p className='text-sm text-red-base'>{erro}</p>}

                        <button
                            type='submit'
                            disabled={enviando}
                            className='mt-2 flex items-center justify-center rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                        >
                            {enviando ? <Spinner className='h-4 w-4' /> : 'Cadastrar'}
                        </button>
                    </form>

                    <p className='mt-4 text-center text-sm text-gray-dark dark:text-dark-text-muted'>
                        Já tem conta?{' '}
                        <Link to='/entrar' className='font-semibold text-orange-base hover:underline'>
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </ClienteShell>
    )
}
