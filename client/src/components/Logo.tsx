import { Link } from 'react-router-dom'
import logoNm from '../assets/logos/logo-nm.jpeg'

type LogoProps = {
    compact?: boolean
    /** Quando informado, a logo vira link (ex.: '/' na loja, '/dashboard' no painel). */
    to?: string
}

export default function Logo({ compact = false, to }: LogoProps) {
    const imagem = (
        <img
            src={logoNm}
            alt='Logo Novamix'
            className={`rounded-lg bg-white dark:p-1.5 ${compact ? 'w-[55%] max-w-32' : 'w-[70%] max-w-48'}`}
        />
    )

    return (
        <div className={`flex items-center justify-center ${compact ? 'py-4' : 'px-6 py-6'}`}>
            {to ? <Link to={to}>{imagem}</Link> : imagem}
        </div>
    )
}
