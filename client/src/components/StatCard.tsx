import Spinner from './Spinner'

type StatCardProps = {
    titulo: string
    valor: string
    subtitulo?: string
    loading?: boolean
    erro?: string | null
}

export default function StatCard({ titulo, valor, subtitulo, loading, erro }: StatCardProps) {
    return (
        <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
            <span className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                {titulo}
            </span>

            {erro ? (
                <div className='mt-3 rounded-lg bg-red-light/10 px-3 py-2 text-sm font-medium text-red-base'>{erro}</div>
            ) : (
                <div className='mt-2 text-2xl font-semibold text-gray-text dark:text-dark-text'>
                    {loading ? <Spinner className='h-5 w-5' /> : valor}
                </div>
            )}

            {subtitulo && !erro && (
                <p className='mt-1 text-xs text-gray-dark dark:text-dark-text-muted'>{subtitulo}</p>
            )}
        </div>
    )
}
