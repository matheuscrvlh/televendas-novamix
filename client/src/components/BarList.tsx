import Spinner from './Spinner'

type BarListItem = {
    label: string
    valor: number
    sublabel?: string
}

type BarListProps = {
    titulo: string
    items: BarListItem[]
    formatValor: (value: number) => string
    loading?: boolean
    erro?: string | null
    cor?: string
}

export default function BarList({ titulo, items, formatValor, loading, erro, cor = '#0d366b' }: BarListProps) {
    const maior = Math.max(...items.map((item) => Math.abs(item.valor)), 1)

    return (
        <div className='rounded-xl border border-gray-base/30 bg-white dark:bg-dark-surface dark:border-dark-border p-6 shadow-sm'>
            <span className='text-sm font-medium text-gray-text dark:text-dark-text'>{titulo}</span>

            {erro && (
                <div className='mt-3 rounded-lg px-4 py-3 text-sm font-medium bg-red-light/10 text-red-base'>
                    {erro}
                </div>
            )}

            {!erro && loading && (
                <div className='mt-4 flex items-center justify-center py-6'>
                    <Spinner className='h-5 w-5' />
                </div>
            )}

            {!erro && !loading && items.length === 0 && (
                <div className='mt-3 text-sm text-gray-dark dark:text-dark-text-muted'>Sem dados no período.</div>
            )}

            {!erro && !loading && items.length > 0 && (
                <ul className='mt-4 flex flex-col gap-3'>
                    {items.map((item) => {
                        const largura = Math.max((Math.abs(item.valor) / maior) * 100, 2)
                        return (
                            <li key={item.label}>
                                <div className='mb-1 flex items-baseline justify-between gap-2 text-xs'>
                                    <span className='truncate font-medium text-gray-text dark:text-dark-text'>
                                        {item.label}
                                        {item.sublabel && (
                                            <span className='ml-2 font-normal text-gray-dark dark:text-dark-text-muted'>
                                                {item.sublabel}
                                            </span>
                                        )}
                                    </span>
                                    <span className='shrink-0 font-semibold tabular-nums text-gray-text dark:text-dark-text'>
                                        {formatValor(item.valor)}
                                    </span>
                                </div>
                                <div className='h-2 w-full overflow-hidden rounded-full bg-gray dark:bg-dark-surface-2'>
                                    <div
                                        className='h-full rounded-full transition-all duration-300'
                                        style={{ width: `${largura}%`, backgroundColor: cor }}
                                    />
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
