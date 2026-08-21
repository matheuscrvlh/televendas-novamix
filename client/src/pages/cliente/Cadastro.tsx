import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../../components/Logo'
import Footer from '../../components/Footer'
import Spinner from '../../components/Spinner'
import { clienteApiPost } from '../../lib/clienteApi'
import { ApiError } from '../../lib/api'

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
        <div className='flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-gray px-4 py-8 dark:bg-dark-bg'>
            <div className='w-full max-w-sm rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                <Logo />
                <h1 className='mb-1 text-center text-lg font-semibold text-gray-text dark:text-dark-text'>
                    Criar sua conta
                </h1>
                <p className='mb-6 text-center text-xs text-gray-dark dark:text-dark-text-muted'>
                    Use o CNPJ ou CPF já cadastrado com seu vendedor Novamix.
                </p>

                <form onSubmit={cadastrar} className='flex flex-col gap-3'>
                    <input
                        type='text'
                        required
                        placeholder='CNPJ ou CPF'
                        value={cnpjCpf}
                        onChange={(e) => setCnpjCpf(e.target.value)}
                        className={inputClass}
                    />
                    <input
                        type='email'
                        required
                        placeholder='E-mail'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                    />
                    <input
                        type='text'
                        placeholder='Telefone (opcional)'
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className={inputClass}
                    />
                    <input
                        type='password'
                        required
                        minLength={6}
                        placeholder='Senha (mín. 6 caracteres)'
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className={inputClass}
                    />
                    <input
                        type='password'
                        required
                        placeholder='Confirmar senha'
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        className={inputClass}
                    />

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

            <Footer />
        </div>
    )
}
