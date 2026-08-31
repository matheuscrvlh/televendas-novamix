import { Link } from 'react-router-dom'
import logoCliente from '../assets/logos/logo-nm.png'
import logoAdmin from '../assets/logos/logo-nm2.jpeg'

type LogoProps = {
    compact?: boolean
    /** Quando informado, a logo vira link (ex.: '/' na loja, '/dashboard' no painel). */
    to?: string
    /** 'cliente' = wordmark branco, usado no header laranja da loja. 'admin' = ícone colorido em chapa branca, usado no painel. */
    variant?: 'cliente' | 'admin'
    /** Classes extras pro container (ex.: espaçamento específico de um layout). */
    className?: string
}

export default function Logo({ compact = false, to, variant = 'cliente', className = '' }: LogoProps) {
    const imagem =
        variant === 'admin' ? (
            <img
                src={logoAdmin}
                alt='Logo Novamix'
                className={`aspect-square rounded-lg bg-white object-contain dark:p-1.5 ${compact ? 'w-20' : 'w-28'}`}
            />
        ) : (
            <img src={logoCliente} alt='Logo Novamix' className={compact ? 'h-6 w-auto md:h-9' : 'h-10 w-auto'} />
        )

    return (
        <div className={`flex items-center justify-center ${compact ? 'py-1.5' : 'px-6 py-6'} ${className}`}>
            {to ? <Link to={to}>{imagem}</Link> : imagem}
        </div>
    )
}
