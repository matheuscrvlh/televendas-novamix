import { useState, type FormEvent } from 'react'
import Spinner from './Spinner'
import { PencilIcon, PlusIcon } from './icons'
import { useTelevendas } from '../hooks/useTelevendas'
import { apiPut } from '../lib/api'
import { formatCurrency, formatPercent } from '../lib/format'
import { formatValorBR, parseValorBR } from '../lib/mask'
import type { MetaMes } from '../types/televendas'

type MetaMesBlocoProps = {
    /** Mês da meta no formato YYYY-MM. */
    mes: string
    habilitado: boolean
}

/** "2026-11" -> "novembro" (ou "novembro/2025" se não for o ano atual). */
function nomeDoMes(mes: string) {
    const [ano, numeroMes] = mes.split('-').map(Number)
    const nome = new Date(ano, numeroMes - 1, 1).toLocaleString('pt-BR', { month: 'long' })
    return ano === new Date().getFullYear() ? nome : `${nome}/${ano}`
}

const rotuloClass = 'text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'

/**
 * Meta de faturamento do mês, mostrada no rodapé do card "Faturamento total".
 * A própria usuária do televendas cadastra e edita. O progresso usa o faturamento do mês inteiro,
 * não o período do filtro (com "Hoje" selecionado, o card mostra o dia e a meta continua sendo do mês).
 */
export default function MetaMesBloco({ mes, habilitado }: MetaMesBlocoProps) {
    const { data, loading, erro } = useTelevendas<MetaMes>('/televendas/meta', { mes }, habilitado)

    const [metaSalva, setMetaSalva] = useState<number | null>(null)
    const [editando, setEditando] = useState(false)
    const [texto, setTexto] = useState('')
    const [salvando, setSalvando] = useState(false)
    const [erroSalvar, setErroSalvar] = useState<string | null>(null)

    const meta = metaSalva ?? data?.meta ?? null
    const realizado = data?.realizado ?? 0
    const nome = nomeDoMes(mes)

    function abrirEdicao() {
        setTexto(meta !== null ? formatValorBR(meta) : '')
        setErroSalvar(null)
        setEditando(true)
    }

    function cancelar() {
        setEditando(false)
        setErroSalvar(null)
    }

    async function salvar(e: FormEvent) {
        e.preventDefault()
        const valor = parseValorBR(texto)
        if (!Number.isFinite(valor) || valor <= 0) {
            setErroSalvar('Digite um valor maior que zero.')
            return
        }

        setSalvando(true)
        setErroSalvar(null)
        try {
            const resposta = await apiPut<{ mes: string; meta: number }>('/televendas/meta', { mes, valor })
            setMetaSalva(resposta.meta)
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
            <form onSubmit={salvar}>
                <label htmlFor={`meta-${mes}`} className={rotuloClass}>
                    Meta de {nome}
                </label>
                <div className='relative mt-1.5'>
                    <span className='pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-gray-dark dark:text-dark-text-muted'>
                        R$
                    </span>
                    <input
                        id={`meta-${mes}`}
                        type='text'
                        inputMode='decimal'
                        autoFocus
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        onBlur={() => {
                            const valor = parseValorBR(texto)
                            if (Number.isFinite(valor) && valor > 0) setTexto(formatValorBR(valor))
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') cancelar()
                        }}
                        placeholder='0,00'
                        className='w-full rounded-lg border border-gray-base/30 bg-white py-1.5 pr-2 pl-8 text-sm tabular-nums text-gray-text focus:border-orange-base focus:outline-none dark:border-dark-border dark:bg-dark-surface-2 dark:text-dark-text'
                    />
                </div>
                <div className='mt-2 flex gap-1.5'>
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
                {erroSalvar && <p className='mt-1.5 text-xs text-red-base'>{erroSalvar}</p>}
            </form>
        )
    } else if (meta === null) {
        conteudo = (
            <button
                type='button'
                onClick={abrirEdicao}
                className='flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-base/60 px-3 py-2 text-xs font-semibold text-gray-dark transition-colors hover:border-orange-base hover:text-orange-base dark:border-dark-border dark:text-dark-text-muted dark:hover:text-orange-light'
            >
                <PlusIcon className='h-3.5 w-3.5' />
                Definir meta de {nome}
            </button>
        )
    } else {
        const progresso = realizado / meta
        const bateu = progresso >= 1
        conteudo = (
            <>
                <div className='flex items-center justify-between gap-2'>
                    <span className={rotuloClass}>Meta de {nome}</span>
                    <button
                        type='button'
                        onClick={abrirEdicao}
                        aria-label={`Editar meta de ${nome}`}
                        title='Editar meta'
                        className='-mr-1 rounded-md p-1 text-gray-dark transition-colors hover:text-orange-base dark:text-dark-text-muted dark:hover:text-orange-light'
                    >
                        <PencilIcon className='h-3.5 w-3.5' />
                    </button>
                </div>
                <p className='text-sm font-semibold tabular-nums text-gray-text dark:text-dark-text'>
                    {formatCurrency(meta)}
                </p>
                <div
                    role='progressbar'
                    aria-label={`Progresso da meta de ${nome}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(Math.min(progresso, 1) * 100)}
                    title={`Faturado em ${nome}: ${formatCurrency(realizado)}`}
                    className='mt-2 h-2 overflow-hidden rounded-full bg-gray dark:bg-dark-surface-2'
                >
                    <div
                        className={`h-full rounded-full ${bateu ? 'bg-green-base' : 'bg-orange-base'}`}
                        style={{ width: `${Math.min(progresso, 1) * 100}%` }}
                    />
                </div>
                <p className='mt-1.5 text-xs text-gray-dark dark:text-dark-text-muted'>
                    {bateu ? (
                        <span className='font-semibold text-green-base'>Meta batida! {formatPercent(progresso)}</span>
                    ) : (
                        <>
                            <span className='font-semibold text-gray-text dark:text-dark-text'>
                                {formatPercent(progresso)}
                            </span>{' '}
                            · faltam {formatCurrency(meta - realizado)}
                        </>
                    )}
                </p>
            </>
        )
    }

    return <div className='mt-4 border-t border-gray-base/30 pt-3 dark:border-dark-border'>{conteudo}</div>
}
