import { useState, type ReactNode } from 'react'
import PageShell from '../components/PageShell'
import PasteBlock from '../components/PasteBlock'
import DataTable from '../components/DataTable'
import { useMe } from '../hooks/useMe'
import { parseTable, numero } from '../lib/parseTable'
import { formatCurrency, formatPercent } from '../lib/format'
import { ChevronDownIcon } from '../components/icons'

type BlocoId =
    | 'c01'
    | 'c02'
    | 'c03'
    | 'c04'
    | 'c05'
    | 'c06'
    | 'c07'
    | 'c08a'
    | 'c08b'
    | 'c09'
    | 'c10'
    | 'c11'
    | 'c12'
    | 'c13'
    | 'c14'
    | 'c15'

const BLOCO_VAZIO: Record<BlocoId, string> = {
    c01: '',
    c02: '',
    c03: '',
    c04: '',
    c05: '',
    c06: '',
    c07: '',
    c08a: '',
    c08b: '',
    c09: '',
    c10: '',
    c11: '',
    c12: '',
    c13: '',
    c14: '',
    c15: '',
}

const AVISO_LIMITACAO_PADRAO =
    "Não há coluna de saldo do título em CONTAS_RECEBER/CONTAS_PAGAR. Um título com baixa PARCIAL continua com " +
    "FLAGBAIXADA='F' e entra pelo valor cheio, inflando o subrazão. Diferenças positivas pequenas contra o " +
    'balancete são esperadas e não indicam erro.'

function Secao({
    titulo,
    aberto,
    onToggle,
    children,
}: {
    titulo: string
    aberto: boolean
    onToggle: () => void
    children: ReactNode
}) {
    return (
        <div className='rounded-xl border border-gray-base/30 bg-white dark:bg-dark-surface dark:border-dark-border shadow-sm'>
            <button
                type='button'
                onClick={onToggle}
                className='flex w-full items-center justify-between px-6 py-4 text-left'
            >
                <span className='text-sm font-semibold text-gray-text dark:text-dark-text'>{titulo}</span>
                <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-gray-dark transition-transform dark:text-dark-text-muted ${aberto ? 'rotate-180' : ''}`}
                />
            </button>
            {aberto && <div className='flex flex-col gap-5 px-6 pb-6'>{children}</div>}
        </div>
    )
}

export default function Conciliacoes() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const habilitado = me !== null && me.isAdmin

    const [dataExtracao, setDataExtracao] = useState(() => new Date().toISOString().slice(0, 10))
    const [escopoInicio, setEscopoInicio] = useState('2025-01-01')
    const [blocoRecenteMes, setBlocoRecenteMes] = useState(() => new Date().toISOString().slice(0, 7))
    const [empresasEscopo, setEmpresasEscopo] = useState('Empresas 1 (Prado), 2 (Centro), 3 (Olaria), 4 (Teresópolis)')
    const [fonte, setFonte] = useState('ERP CISS / Novamix')
    const [estoqueContabil, setEstoqueContabil] = useState('')
    const [observacao, setObservacao] = useState('')
    const [avisoLimitacao, setAvisoLimitacao] = useState(AVISO_LIMITACAO_PADRAO)

    const [blocos, setBlocos] = useState<Record<BlocoId, string>>(BLOCO_VAZIO)
    const [abertos, setAbertos] = useState({ b1: true, b2: false, b3: false, b4: false, b5: false, b6: false })
    const [processado, setProcessado] = useState(false)

    function set(id: BlocoId, valor: string) {
        setBlocos((atual) => ({ ...atual, [id]: valor }))
    }

    function limparTudo() {
        setBlocos(BLOCO_VAZIO)
        setProcessado(false)
    }

    const totalRow = parseTable(blocos.c01).linhas[0]
    const total = numero(totalRow?.TOTAL)
    const conciliado = numero(totalRow?.CONCILIADO)
    const naoConciliado = numero(totalRow?.NAO_CONCILIADO)
    const percConciliado = total !== 0 ? conciliado / total : 0

    const naoConciliadoPorMes = parseTable(blocos.c02).linhas
    const naoConciliadoPorConta = parseTable(blocos.c03).linhas
    const velocidadeConciliacao = parseTable(blocos.c04).linhas

    const outrosBlocos: { id: BlocoId; label: string }[] = [
        { id: 'c05', label: 'Consulta 05' },
        { id: 'c06', label: 'Consulta 06' },
        { id: 'c07', label: 'Consulta 07' },
        { id: 'c08a', label: 'Consulta 08a' },
        { id: 'c08b', label: 'Consulta 08b' },
        { id: 'c09', label: 'Consulta 09' },
        { id: 'c10', label: 'Consulta 10' },
        { id: 'c11', label: 'Consulta 11' },
        { id: 'c12', label: 'Consulta 12' },
        { id: 'c13', label: 'Consulta 13' },
        { id: 'c14', label: 'Consulta 14' },
        { id: 'c15', label: 'Consulta 15' },
    ]

    return (
        <PageShell
            isAdmin={me?.isAdmin ?? false}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={habilitado}
            titulo='Painel de Conciliações'
            subtitulo='Conferência bancária, cartão e contábil — dados colados manualmente do DBeaver (sem conector automático para o banco atrás da VPN).'
        >
            <div className='mb-6 rounded-lg border border-orange-base/30 bg-orange-base/5 px-4 py-3 text-sm text-gray-text dark:text-dark-text'>
                Não existe conexão automática deste painel com o banco DB2 do ERP. Rode o script SQL no DBeaver, selecione o
                resultado no grid (Ctrl+A), copie (Ctrl+C) e cole no campo correspondente abaixo. O cabeçalho de coluna
                precisa vir junto — é ele que identifica cada campo, não a ordem.
            </div>

            <div className='rounded-xl border border-gray-base/30 bg-white dark:bg-dark-surface dark:border-dark-border p-6 shadow-sm'>
                <span className='text-sm font-semibold text-gray-text dark:text-dark-text'>Metadados da extração</span>
                <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <label className='flex flex-col gap-1 text-xs font-medium text-gray-dark dark:text-dark-text-muted'>
                        Data desta extração
                        <input
                            type='date'
                            value={dataExtracao}
                            onChange={(event) => setDataExtracao(event.target.value)}
                            className='rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                    </label>
                    <label className='flex flex-col gap-1 text-xs font-medium text-gray-dark dark:text-dark-text-muted'>
                        Escopo — data de início (consultas 01-04)
                        <input
                            type='date'
                            value={escopoInicio}
                            onChange={(event) => setEscopoInicio(event.target.value)}
                            className='rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                    </label>
                    <label className='flex flex-col gap-1 text-xs font-medium text-gray-dark dark:text-dark-text-muted'>
                        Início do "bloco recente" (AAAA-MM)
                        <input
                            type='month'
                            value={blocoRecenteMes}
                            onChange={(event) => setBlocoRecenteMes(event.target.value)}
                            className='rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                    </label>
                    <label className='flex flex-col gap-1 text-xs font-medium text-gray-dark dark:text-dark-text-muted'>
                        Empresas no escopo
                        <input
                            type='text'
                            value={empresasEscopo}
                            onChange={(event) => setEmpresasEscopo(event.target.value)}
                            className='rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                    </label>
                    <label className='flex flex-col gap-1 text-xs font-medium text-gray-dark dark:text-dark-text-muted'>
                        Fonte
                        <input
                            type='text'
                            value={fonte}
                            onChange={(event) => setFonte(event.target.value)}
                            className='rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                    </label>
                    <label className='flex flex-col gap-1 text-xs font-medium text-gray-dark dark:text-dark-text-muted'>
                        Estoque contábil (R$) — opcional
                        <input
                            type='text'
                            value={estoqueContabil}
                            onChange={(event) => setEstoqueContabil(event.target.value)}
                            placeholder='deixe em branco se ainda não localizada'
                            className='rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                    </label>
                </div>
                <label className='mt-4 flex flex-col gap-1 text-xs font-medium text-gray-dark dark:text-dark-text-muted'>
                    Observação desta extração — opcional
                    <textarea
                        value={observacao}
                        onChange={(event) => setObservacao(event.target.value)}
                        rows={2}
                        placeholder='ex.: reprocessamento de saldos concluído em dd/mm'
                        className='rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                    />
                </label>
                <label className='mt-4 flex flex-col gap-1 text-xs font-medium text-gray-dark dark:text-dark-text-muted'>
                    Aviso de limitação — subrazão x razão (editável)
                    <textarea
                        value={avisoLimitacao}
                        onChange={(event) => setAvisoLimitacao(event.target.value)}
                        rows={3}
                        className='rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                    />
                </label>
            </div>

            <div className='mt-6 flex flex-col gap-4'>
                <Secao titulo='Bloco 1 — Conciliação bancária (consultas 01 a 04)' aberto={abertos.b1} onToggle={() => setAbertos((a) => ({ ...a, b1: !a.b1 }))}>
                    <PasteBlock
                        titulo='Consulta 01 — total x conciliado'
                        colunasEsperadas='TOTAL, CONCILIADO, NAO_CONCILIADO (1 linha)'
                        obrigatorio
                        valor={blocos.c01}
                        onChange={(v) => set('c01', v)}
                    />
                    <PasteBlock
                        titulo='Consulta 02 — não conciliado por mês'
                        colunasEsperadas='MES, REG, CRED, DEB'
                        obrigatorio
                        valor={blocos.c02}
                        onChange={(v) => set('c02', v)}
                    />
                    <PasteBlock
                        titulo='Consulta 03 — não conciliado por conta bancária'
                        colunasEsperadas='CTA, NOME, REG, CRED, DEB'
                        obrigatorio
                        valor={blocos.c03}
                        onChange={(v) => set('c03', v)}
                    />
                    <PasteBlock
                        titulo='Consulta 04 — velocidade de conciliação (lag)'
                        colunasEsperadas='ANO, CONCILIADOS, SEM_DATA, ATE2D, D3_30, ACIMA30, ANTES_MOV'
                        obrigatorio
                        valor={blocos.c04}
                        onChange={(v) => set('c04', v)}
                    />
                </Secao>

                <Secao titulo='Bloco 2 — Conciliação de cartão (consultas 05 a 07)' aberto={abertos.b2} onToggle={() => setAbertos((a) => ({ ...a, b2: !a.b2 }))}>
                    {(['c05', 'c06', 'c07'] as BlocoId[]).map((id) => (
                        <PasteBlock key={id} titulo={id.toUpperCase()} colunasEsperadas='conforme grid do DBeaver' valor={blocos[id]} onChange={(v) => set(id, v)} />
                    ))}
                </Secao>

                <Secao titulo='Bloco 3 — Conciliação contábil (consultas 08a, 08b, 09, 10)' aberto={abertos.b3} onToggle={() => setAbertos((a) => ({ ...a, b3: !a.b3 }))}>
                    {(['c08a', 'c08b', 'c09', 'c10'] as BlocoId[]).map((id) => (
                        <PasteBlock key={id} titulo={id.toUpperCase()} colunasEsperadas='conforme grid do DBeaver' valor={blocos[id]} onChange={(v) => set(id, v)} />
                    ))}
                </Secao>

                <Secao titulo='Bloco 4 — Teste de premissa: taxa da adquirente (consultas 11 e 12)' aberto={abertos.b4} onToggle={() => setAbertos((a) => ({ ...a, b4: !a.b4 }))}>
                    {(['c11', 'c12'] as BlocoId[]).map((id) => (
                        <PasteBlock key={id} titulo={id.toUpperCase()} colunasEsperadas='conforme grid do DBeaver' valor={blocos[id]} onChange={(v) => set(id, v)} />
                    ))}
                </Secao>

                <Secao titulo='Bloco 5 — Subrazão x razão (consultas 13 e 14)' aberto={abertos.b5} onToggle={() => setAbertos((a) => ({ ...a, b5: !a.b5 }))}>
                    {(['c13', 'c14'] as BlocoId[]).map((id) => (
                        <PasteBlock key={id} titulo={id.toUpperCase()} colunasEsperadas='conforme grid do DBeaver' valor={blocos[id]} onChange={(v) => set(id, v)} />
                    ))}
                </Secao>

                <Secao titulo='Bloco 6 — Estoque (consulta 15)' aberto={abertos.b6} onToggle={() => setAbertos((a) => ({ ...a, b6: !a.b6 }))}>
                    <PasteBlock titulo='C15' colunasEsperadas='conforme grid do DBeaver' valor={blocos.c15} onChange={(v) => set('c15', v)} />
                </Secao>
            </div>

            <div className='mt-6 flex flex-wrap items-center gap-3'>
                <button
                    type='button'
                    onClick={() => setProcessado(true)}
                    className='rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-light'
                >
                    Processar e atualizar painel
                </button>
                <button
                    type='button'
                    onClick={limparTudo}
                    className='rounded-lg border border-red-light px-4 py-2 text-sm font-semibold text-red-base transition hover:bg-red-light/10'
                >
                    Limpar tudo
                </button>
            </div>

            {processado && (
                <div className='mt-8 flex flex-col gap-6'>
                    <h2 className='text-lg font-semibold text-gray-text dark:text-dark-text'>
                        Painel processado — {empresasEscopo}
                    </h2>

                    {avisoLimitacao && (
                        <div className='rounded-lg border border-orange-base/30 bg-orange-base/5 px-4 py-3 text-xs text-gray-text dark:text-dark-text'>
                            {avisoLimitacao}
                        </div>
                    )}

                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                        <div className='rounded-xl border border-gray-base/30 bg-white dark:bg-dark-surface dark:border-dark-border p-6 shadow-sm'>
                            <span className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                Total de registros
                            </span>
                            <div className='mt-2 text-xl font-semibold text-gray-text dark:text-dark-text'>
                                {total > 0 ? total.toLocaleString('pt-BR') : '—'}
                            </div>
                        </div>
                        <div className='rounded-xl border border-gray-base/30 bg-white dark:bg-dark-surface dark:border-dark-border p-6 shadow-sm'>
                            <span className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                % conciliado
                            </span>
                            <div className='mt-2 text-xl font-semibold text-gray-text dark:text-dark-text'>
                                {total > 0 ? formatPercent(percConciliado) : '—'}
                            </div>
                        </div>
                        <div className='rounded-xl border border-red-base/30 bg-white dark:bg-dark-surface dark:border-dark-border p-6 shadow-sm'>
                            <span className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                Não conciliado
                            </span>
                            <div className='mt-2 text-xl font-semibold text-red-base'>
                                {naoConciliado > 0 ? naoConciliado.toLocaleString('pt-BR') : '—'}
                            </div>
                        </div>
                    </div>

                    <DataTable
                        titulo='Não conciliado por mês'
                        rows={naoConciliadoPorMes}
                        columns={[
                            { key: 'mes', label: 'Mês', render: (row) => row.MES ?? '' },
                            { key: 'reg', label: 'Registros', align: 'right', render: (row) => row.REG ?? '' },
                            { key: 'cred', label: 'Créditos', align: 'right', render: (row) => formatCurrency(numero(row.CRED)) },
                            { key: 'deb', label: 'Débitos', align: 'right', render: (row) => formatCurrency(numero(row.DEB)) },
                        ]}
                    />

                    <DataTable
                        titulo='Não conciliado por conta bancária'
                        rows={naoConciliadoPorConta}
                        columns={[
                            { key: 'cta', label: 'Conta', render: (row) => row.CTA ?? '' },
                            { key: 'nome', label: 'Nome', render: (row) => row.NOME ?? '' },
                            { key: 'reg', label: 'Registros', align: 'right', render: (row) => row.REG ?? '' },
                            { key: 'cred', label: 'Créditos', align: 'right', render: (row) => formatCurrency(numero(row.CRED)) },
                            { key: 'deb', label: 'Débitos', align: 'right', render: (row) => formatCurrency(numero(row.DEB)) },
                        ]}
                    />

                    <DataTable
                        titulo='Velocidade de conciliação (lag)'
                        rows={velocidadeConciliacao}
                        columns={[
                            { key: 'ano', label: 'Ano', render: (row) => row.ANO ?? '' },
                            { key: 'conciliados', label: 'Conciliados', align: 'right', render: (row) => row.CONCILIADOS ?? '' },
                            { key: 'semdata', label: 'Sem data', align: 'right', render: (row) => row.SEM_DATA ?? '' },
                            { key: 'ate2d', label: 'Até 2d', align: 'right', render: (row) => row.ATE2D ?? '' },
                            { key: 'd3_30', label: '3-30d', align: 'right', render: (row) => row.D3_30 ?? '' },
                            { key: 'acima30', label: 'Acima 30d', align: 'right', render: (row) => row.ACIMA30 ?? '' },
                            { key: 'antesmov', label: 'Antes do mov.', align: 'right', render: (row) => row.ANTES_MOV ?? '' },
                        ]}
                    />

                    {outrosBlocos.map(({ id, label }) => {
                        const tabela = parseTable(blocos[id])
                        if (tabela.linhas.length === 0) return null
                        return (
                            <DataTable
                                key={id}
                                titulo={`${label} — dados colados`}
                                rows={tabela.linhas}
                                columns={tabela.colunas.map((coluna) => ({
                                    key: coluna,
                                    label: coluna,
                                    render: (row: Record<string, string>) => row[coluna] ?? '',
                                }))}
                            />
                        )
                    })}
                </div>
            )}
        </PageShell>
    )
}
