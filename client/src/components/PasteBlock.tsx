import { parseTable } from '../lib/parseTable'

type PasteBlockProps = {
    titulo: string
    colunasEsperadas: string
    obrigatorio?: boolean
    valor: string
    onChange: (value: string) => void
}

export default function PasteBlock({ titulo, colunasEsperadas, obrigatorio, valor, onChange }: PasteBlockProps) {
    const { colunas, linhas } = parseTable(valor)

    return (
        <div>
            <div className='mb-1 flex items-center gap-2'>
                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>{titulo}</span>
                <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        obrigatorio
                            ? 'bg-red-light/10 text-red-base'
                            : 'bg-gray-base/20 text-gray-dark dark:bg-dark-surface-2 dark:text-dark-text-muted'
                    }`}
                >
                    {obrigatorio ? 'obrigatório' : 'opcional'}
                </span>
            </div>
            <p className='mb-2 text-xs text-gray-dark dark:text-dark-text-muted'>Colunas esperadas: {colunasEsperadas}</p>
            <textarea
                value={valor}
                onChange={(event) => onChange(event.target.value)}
                placeholder='Cole aqui o resultado do grid (com cabeçalho de coluna)'
                rows={4}
                className='w-full rounded-lg border border-gray-base/30 bg-white p-3 font-mono text-xs text-gray-text transition focus:border-orange-base focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
            />
            {valor.trim().length > 0 && (
                <p className='mt-1 text-xs text-gray-dark dark:text-dark-text-muted'>
                    {linhas.length} linha(s) reconhecida(s) · colunas: {colunas.join(', ') || '—'}
                </p>
            )}
        </div>
    )
}
