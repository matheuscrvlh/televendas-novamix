import { CheckIcon } from './icons'
import { formatPercent } from '../lib/format'
import { META_MARGEM } from '../lib/televendas'

type MetaMargemBlocoProps = {
    /** Margem atual do período (-0.129 = -12,9%). null quando não houve faturamento. */
    margem: number | null
}

function pontos(valor: number) {
    const texto = valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return `${texto} ponto${texto === '1,0' ? '' : 's'}`
}

/** Meta de margem no rodapé do card "Margem de lucro": mostra a meta e se a margem atual está dentro dela. */
export default function MetaMargemBloco({ margem }: MetaMargemBlocoProps) {
    // Diferença em pontos percentuais: margem -12,9% com meta -5% = 7,9 pontos abaixo.
    const diferenca = margem === null ? null : (margem - META_MARGEM) * 100
    const dentro = diferenca !== null && diferenca >= 0

    return (
        <div className='mt-3 border-t border-gray-dark/10 pt-3 dark:border-dark-border'>
            <span className='text-xs text-gray-dark/50 dark:text-dark-text-muted'>Meta da margem</span>

            <p className='text-sm font-semibold tabular-nums text-gray-text dark:text-dark-text'>
                {formatPercent(META_MARGEM)}
            </p>

            {diferenca !== null && (
                <div className='mt-1.5 text-xs' title='Diferença em pontos percentuais'>
                    <p
                        className={`flex items-center gap-1 font-semibold ${dentro ? 'text-green-base' : 'text-red-base'}`}
                    >
                        {dentro && <CheckIcon className='h-3 w-3 shrink-0' />}
                        {dentro ? 'Dentro da meta' : 'Abaixo da meta'}
                    </p>
                    <p className='text-gray-dark/70 dark:text-dark-text-muted'>
                        {dentro ? `${pontos(diferenca)} acima` : `faltam ${pontos(-diferenca)}`}
                    </p>
                </div>
            )}
        </div>
    )
}
