import { useState, type FormEvent } from 'react'
import Spinner from './Spinner'
import { CheckIcon, PencilIcon, PlusIcon } from './icons'
import { formatCurrency, formatNumber, formatPercent } from '../lib/format'
import { formatValorBR, parseValorBR } from '../lib/mask'

type Formato = 'moeda' | 'clientes'

type MetaBlocoProps = {
    /** "novembro" */
    nomeMes: string
    formato: Formato
    meta: number | null
    /** Só o faturamento tem supermeta. undefined = este bloco não mostra o campo de supermeta. */
    supermeta?: number | null
    /** Realizado no mês inteiro (não segue o filtro de datas). */
    realizado: number
    loading: boolean
    erro: string | null
    onSalvar: (valores: { meta: number; supermeta: number | null }) => Promise<void>
}

const rotuloClass = 'text-xs text-gray-dark/50 dark:text-dark-text-muted'
const inputClass =
    'w-full rounded-lg border border-gray-dark/15 bg-white py-1.5 pr-2 text-sm tabular-nums text-gray-text focus:border-orange-base focus:outline-none dark:border-dark-border dark:bg-dark-surface-2 dark:text-dark-text'

function formatar(valor: number, formato: Formato) {
    return formato === 'moeda' ? formatCurrency(valor) : formatNumber(valor)
}

function textoCampo(valor: number | null | undefined, formato: Formato) {
    if (valor === null || valor === undefined) return ''
    return formato === 'moeda' ? formatValorBR(valor) : String(valor)
}

/**
 * Meta do mês no rodapé de um card do Dashboard. A própria usuária do televendas cadastra e edita.
 * Com supermeta: enquanto a meta não é batida, mostra o progresso da meta; depois de batida,
 * passa a mostrar o progresso da supermeta.
 */
export default function MetaBloco({
    nomeMes,
    formato,
    meta,
    supermeta,
    realizado,
    loading,
    erro,
    onSalvar,
}: MetaBlocoProps) {
    const temSupermeta = supermeta !== undefined
    const [editando, setEditando] = useState(false)
    const [textoMeta, setTextoMeta] = useState('')
    const [textoSuper, setTextoSuper] = useState('')
    const [salvando, setSalvando] = useState(false)
    const [erroSalvar, setErroSalvar] = useState<string | null>(null)

    function abrirEdicao() {
        setTextoMeta(textoCampo(meta, formato))
        setTextoSuper(textoCampo(supermeta, formato))
        setErroSalvar(null)
        setEditando(true)
    }

    function cancelar() {
        setEditando(false)
        setErroSalvar(null)
    }

    function lerCampo(texto: string) {
        const valor = parseValorBR(texto)
        return formato === 'clientes' ? Math.round(valor) : valor
    }

    async function salvar(e: FormEvent) {
        e.preventDefault()
        const novaMeta = lerCampo(textoMeta)
        if (!Number.isFinite(novaMeta) || novaMeta <= 0) {
            setErroSalvar('Digite uma meta maior que zero.')
            return
        }

        let novaSuper: number | null = null
        if (temSupermeta && textoSuper.trim()) {
            novaSuper = lerCampo(textoSuper)
            if (!Number.isFinite(novaSuper) || novaSuper <= novaMeta) {
                setErroSalvar('A supermeta precisa ser maior que a meta.')
                return
            }
        }

        setSalvando(true)
        setErroSalvar(null)
        try {
            await onSalvar({ meta: novaMeta, supermeta: novaSuper })
            setEditando(false)
        } catch (err) {
            setErroSalvar(err instanceof Error ? err.message : 'Não foi possível salvar a meta.')
        } finally {
            setSalvando(false)
        }
    }

    let conteudo
    if (loading) {
        conteudo = <Spinner className='h-4 w-4' />
    } else if (erro) {
        conteudo = <p className='text-xs text-red-base'>Meta indisponível: {erro}</p>
    } else if (editando) {
        conteudo = (
            <form onSubmit={salvar} className='flex flex-col gap-2'>
                <CampoValor
                    id={`meta-${formato}`}
                    rotulo={`Meta de ${nomeMes}`}
                    formato={formato}
                    valor={textoMeta}
                    onChange={setTextoMeta}
                    onCancelar={cancelar}
                    autoFocus
                />
                {temSupermeta && (
                    <CampoValor
                        id={`supermeta-${formato}`}
                        rotulo='Supermeta (opcional)'
                        formato={formato}
                        valor={textoSuper}
                        onChange={setTextoSuper}
                        onCancelar={cancelar}
                    />
                )}
                <div className='flex gap-1.5'>
                    <button
                        type='submit'
                        disabled={salvando}
                        className='rounded-lg bg-orange-base px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-light disabled:opacity-60'
                    >
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                        type='button'
                        onClick={cancelar}
                        disabled={salvando}
                        className='rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-dark transition-colors hover:bg-gray dark:text-dark-text-muted dark:hover:bg-dark-surface-2'
                    >
                        Cancelar
                    </button>
                </div>
                {erroSalvar && <p className='text-xs text-red-base'>{erroSalvar}</p>}
            </form>
        )
    } else if (meta === null) {
        conteudo = (
            <button
                type='button'
                onClick={abrirEdicao}
                className='flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-dark/20 px-3 py-2 text-xs font-semibold text-gray-dark/70 transition-colors hover:border-orange-base hover:text-orange-base dark:border-dark-border dark:text-dark-text-muted dark:hover:text-orange-light'
            >
                <PlusIcon className='h-3.5 w-3.5' />
                Definir meta de {nomeMes}
            </button>
        )
    } else {
        conteudo = (
            <Progresso
                nomeMes={nomeMes}
                formato={formato}
                meta={meta}
                supermeta={supermeta ?? null}
                realizado={realizado}
                onEditar={abrirEdicao}
            />
        )
    }

    return <div className='mt-3 border-t border-gray-dark/10 pt-3 dark:border-dark-border'>{conteudo}</div>
}

function CampoValor({
    id,
    rotulo,
    formato,
    valor,
    onChange,
    onCancelar,
    autoFocus,
}: {
    id: string
    rotulo: string
    formato: Formato
    valor: string
    onChange: (texto: string) => void
    onCancelar: () => void
    autoFocus?: boolean
}) {
    return (
        <div>
            <label htmlFor={id} className={rotuloClass}>
                {rotulo}
            </label>
            <div className='relative mt-1'>
                {formato === 'moeda' && (
                    <span className='pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-gray-dark/60 dark:text-dark-text-muted'>
                        R$
                    </span>
                )}
                <input
                    id={id}
                    type='text'
                    inputMode={formato === 'moeda' ? 'decimal' : 'numeric'}
                    autoFocus={autoFocus}
                    value={valor}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={() => {
                        const numero = parseValorBR(valor)
                        if (formato === 'moeda' && Number.isFinite(numero) && numero > 0) onChange(formatValorBR(numero))
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') onCancelar()
                    }}
                    placeholder={formato === 'moeda' ? '0,00' : 'Ex.: 50'}
                    className={`${inputClass} ${formato === 'moeda' ? 'pl-8' : 'pl-2.5'}`}
                />
            </div>
        </div>
    )
}

function Progresso({
    nomeMes,
    formato,
    meta,
    supermeta,
    realizado,
    onEditar,
}: {
    nomeMes: string
    formato: Formato
    meta: number
    supermeta: number | null
    realizado: number
    onEditar: () => void
}) {
    const bateuMeta = realizado >= meta
    // Depois de bater a meta, o alvo passa a ser a supermeta (se houver).
    const naSupermeta = bateuMeta && supermeta !== null
    const alvo = naSupermeta ? supermeta : meta
    const progresso = realizado / alvo
    const bateuAlvo = progresso >= 1

    const corBarra = bateuAlvo ? 'bg-green-base' : naSupermeta ? 'bg-gold' : 'bg-orange-base'
    const titulo = naSupermeta ? `Supermeta de ${nomeMes}` : `Meta de ${nomeMes}`
    const faltam = alvo - realizado

    return (
        <>
            <div className='flex items-start justify-between gap-2'>
                <span className={`${rotuloClass} min-w-0`}>{titulo}</span>
                <button
                    type='button'
                    onClick={onEditar}
                    aria-label={`Editar meta de ${nomeMes}`}
                    title='Editar meta'
                    className='-mr-1 shrink-0 rounded-md p-1 text-gray-dark/60 transition-colors hover:text-orange-base dark:text-dark-text-muted dark:hover:text-orange-light'
                >
                    <PencilIcon className='h-3.5 w-3.5' />
                </button>
            </div>

            <p className='text-sm font-semibold tabular-nums text-gray-text dark:text-dark-text'>
                {formatar(alvo, formato)}
                {formato === 'clientes' && <span className='font-normal text-gray-dark/70'> clientes</span>}
            </p>

            <div
                role='progressbar'
                aria-label={`Progresso: ${titulo}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(Math.min(progresso, 1) * 100)}
                title={`Realizado em ${nomeMes}: ${formatar(realizado, formato)}`}
                className='mt-2 h-2 overflow-hidden rounded-full bg-gray-dark/10 dark:bg-dark-surface-2'
            >
                <div className={`h-full rounded-full ${corBarra}`} style={{ width: `${Math.min(progresso, 1) * 100}%` }} />
            </div>

            <p className='mt-1.5 text-xs text-gray-dark/70 dark:text-dark-text-muted'>
                {bateuAlvo ? (
                    <span className='font-semibold text-green-base'>
                        {naSupermeta ? 'Supermeta batida!' : 'Meta batida!'}{' '}
                        {formato === 'clientes'
                            ? `${formatNumber(realizado)} de ${formatNumber(alvo)}`
                            : formatPercent(progresso)}
                    </span>
                ) : formato === 'clientes' ? (
                    <>
                        <span className='font-semibold text-gray-text dark:text-dark-text'>
                            {formatNumber(realizado)} de {formatNumber(alvo)}
                        </span>{' '}
                        · faltam {formatNumber(faltam)} cliente{faltam === 1 ? '' : 's'}
                    </>
                ) : (
                    <>
                        <span className='font-semibold text-gray-text dark:text-dark-text'>{formatPercent(progresso)}</span>{' '}
                        · faltam {formatCurrency(faltam)}
                    </>
                )}
            </p>

            {naSupermeta && (
                <p
                    title={`Meta de ${formatar(meta, formato)} batida`}
                    className='mt-0.5 flex items-center gap-1 text-xs font-semibold text-green-base'
                >
                    <CheckIcon className='h-3 w-3 shrink-0' />
                    Meta batida
                </p>
            )}

            {!bateuMeta && supermeta !== null && (
                <p className='mt-0.5 text-xs text-gray-dark/50 dark:text-dark-text-muted'>
                    Supermeta: {formatar(supermeta, formato)}
                </p>
            )}
        </>
    )
}
