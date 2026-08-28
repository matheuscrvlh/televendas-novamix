import { MinusIcon, PlusIcon } from '../icons'

type QuantidadeInputProps = {
    value: number
    onChange: (value: number) => void
    min?: number
    disabled?: boolean
    className?: string
}

export default function QuantidadeInput({ value, onChange, min = 1, disabled, className }: QuantidadeInputProps) {
    return (
        <div
            className={`flex items-center rounded-lg border border-gray-base/30 dark:border-dark-border ${
                disabled ? 'opacity-50' : ''
            } ${className ?? ''}`}
        >
            <button
                type='button'
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={disabled || value <= min}
                aria-label='Diminuir quantidade'
                className='flex items-center justify-center px-2 py-1.5 text-gray-text transition hover:bg-orange-base/10 hover:text-orange-base disabled:pointer-events-none disabled:opacity-40 dark:text-dark-text'
            >
                <MinusIcon className='h-3.5 w-3.5' />
            </button>
            <span className='min-w-6 flex-1 text-center text-sm font-semibold tabular-nums text-gray-text dark:text-dark-text'>
                {value}
            </span>
            <button
                type='button'
                onClick={() => onChange(value + 1)}
                disabled={disabled}
                aria-label='Aumentar quantidade'
                className='flex items-center justify-center px-2 py-1.5 text-gray-text transition hover:bg-orange-base/10 hover:text-orange-base disabled:pointer-events-none disabled:opacity-40 dark:text-dark-text'
            >
                <PlusIcon className='h-3.5 w-3.5' />
            </button>
        </div>
    )
}
