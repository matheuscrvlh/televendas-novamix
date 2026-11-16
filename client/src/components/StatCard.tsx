import type { ReactNode } from 'react'
import Spinner from './Spinner'

type StatCardProps = {
    titulo: string
    valor: string
    subtitulo?: string
    loading?: boolean
    erro?: string | null
    /** Conteúdo extra no rodapé do card (ex.: a meta do mês). */
    children?: ReactNode
}

/**
 * Card de indicador no mesmo visual do painel de Avaliações (MetricCard): fundo branco translúcido,
 * sombra, e ao passar o mouse cresce um pouco, sobe e ganha sombra maior com um brilho suave.
 * Diferenças de propósito (skill turbo-marlon-fluido): sem backdrop-blur (o fundo da página é liso,
 * o desfoque não muda nada na tela e custa GPU), transição só de transform/sombra (não "all") e
 * sem animação para quem pede "reduzir movimento".
 */
export default function StatCard({ titulo, valor, subtitulo, loading, erro, children }: StatCardProps) {
    return (
        <div
            className={[
                'relative rounded-xl bg-white/80 p-4 shadow-md dark:bg-dark-surface/80',
                'transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                'hover:-translate-y-1 hover:scale-[1.04] hover:shadow-2xl',
                'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100',
                'before:pointer-events-none before:absolute before:inset-0 before:rounded-xl',
                'before:bg-linear-to-br before:from-white/40 before:to-transparent',
                'before:opacity-0 before:transition-opacity before:duration-500 hover:before:opacity-100',
            ].join(' ')}
        >
            <p className='mb-1 text-xs text-gray-dark/50 dark:text-dark-text-muted'>{titulo}</p>

            {erro ? (
                <div className='mt-2 rounded-lg bg-red-light/10 px-3 py-2 text-sm font-medium text-red-base'>{erro}</div>
            ) : (
                <div className='text-2xl font-semibold text-black dark:text-dark-text'>
                    {loading ? <Spinner className='h-5 w-5' /> : valor}
                </div>
            )}

            {subtitulo && !erro && (
                <p className='mt-0.5 text-xs text-gray-dark/70 dark:text-dark-text-muted'>{subtitulo}</p>
            )}

            {children}
        </div>
    )
}
