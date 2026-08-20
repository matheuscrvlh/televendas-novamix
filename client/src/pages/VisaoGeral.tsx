import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Spinner from '../components/Spinner'
import FiltersMenu from '../components/FiltersMenu'
import FilialMultiFilter from '../components/FilialMultiFilter'
import DateRangeFilter from '../components/DateRangeFilter'
import { useMe } from '../hooks/useMe'
import { useRelatorio } from '../hooks/useRelatorio'
import { useRelatorioAtual } from '../hooks/useRelatorioAtual'
import { useFinanceiro } from '../hooks/useFinanceiro'
import { formatCurrency, formatPercent, formatRatio } from '../lib/format'
import { comFiltroEcommerce } from '../constants/filiais'
import { getPresetRange } from '../lib/date'
import type {
    ContasPagarDetalheResponse,
    ContasReceberDetalheResponse,
    DespesasResponse,
    EstoqueRow,
    LiquidezCorrenteRow,
    ResultadoDreRow,
    VendaBrutaRow,
} from '../types/financeiro'

const TOTAL_FILIAIS = 100

const SECOES = [
    { to: '/resultado', titulo: 'Resultado (DRE)', descricao: 'Receita, CMV, despesas e resultado do exercício.' },
    { to: '/balanco', titulo: 'Balanço', descricao: 'Ativo, passivo, PL e indicadores de liquidez.' },
    { to: '/contas-a-pagar', titulo: 'Contas a Pagar', descricao: 'Posição em aberto, aging e maiores fornecedores.' },
    { to: '/contas-a-receber', titulo: 'Contas a Receber', descricao: 'Carteira em aberto, aging, top clientes e recorrência.' },
    { to: '/despesas', titulo: 'Despesas', descricao: 'Detalhamento contábil por natureza, loja e mês.' },
    { to: '/conciliacoes', titulo: 'Conciliações', descricao: 'Conferência bancária, cartão e contábil (dados colados).' },
]

function inicioDoAno() {
    return `${new Date().getFullYear()}-01-01`
}

export default function VisaoGeral() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const [inicio, setInicio] = useState(inicioDoAno)
    const [fim, setFim] = useState(() => getPresetRange('hoje').fim)
    const [selecionadas, setSelecionadas] = useState<number[]>([])

    const branchesDisponiveis = me ? comFiltroEcommerce(me.branches) : []
    const filiaisAtivas = selecionadas.length > 0 ? selecionadas : branchesDisponiveis

    const habilitado = me !== null && me.isAdmin

    const vendaBruta = useRelatorio<VendaBrutaRow>('/financeiro/venda-bruta', inicio, fim, filiaisAtivas, habilitado)
    const estoque = useRelatorioAtual<EstoqueRow>('/financeiro/valor-estoque', filiaisAtivas, habilitado)
    const liquidez = useRelatorioAtual<LiquidezCorrenteRow>('/financeiro/liquidez-corrente', filiaisAtivas, habilitado)

    const resultado = useFinanceiro<ResultadoDreRow[]>(
        '/financeiro/resultado-dre',
        { inicio, fim, filiais: filiaisAtivas.join(',') },
        habilitado
    )
    const despesas = useFinanceiro<DespesasResponse>(
        '/financeiro/despesas',
        { inicio, fim, filiais: filiaisAtivas.join(',') },
        habilitado
    )
    const contasPagar = useFinanceiro<ContasPagarDetalheResponse>(
        '/financeiro/contas-pagar-detalhe',
        { filiais: filiaisAtivas.join(',') },
        habilitado
    )
    const contasReceber = useFinanceiro<ContasReceberDetalheResponse>(
        '/financeiro/contas-receber-detalhe',
        { filiais: filiaisAtivas.join(',') },
        habilitado
    )

    const faturamento = Number(vendaBruta.rows.find((row) => row.IDEMPRESA === TOTAL_FILIAIS)?.VALOR_VENDA_BRUTA ?? 0)
    const valorEstoque = Number(estoque.rows.find((row) => row.IDEMPRESA === TOTAL_FILIAIS)?.VALOR_ESTOQUE ?? 0)
    const liquidezCorrente = Number(
        liquidez.rows.find((row) => row.IDEMPRESA === TOTAL_FILIAIS)?.LIQUIDEZ_CORRENTE ?? 0
    )

    const dreConsolidado = resultado.data?.find((row) => row.IDEMPRESA === TOTAL_FILIAIS)
    const receitaLiquida = dreConsolidado ? Number(dreConsolidado.RECEITA_BRUTA) + Number(dreConsolidado.DEDUCOES) : 0
    const lucroBruto = dreConsolidado ? receitaLiquida - Number(dreConsolidado.CMV) : 0
    const margemBruta = receitaLiquida !== 0 ? lucroBruto / receitaLiquida : 0
    const resultadoLiquido = dreConsolidado
        ? lucroBruto -
          Number(dreConsolidado.DESPESAS_OPERACIONAIS) +
          Number(dreConsolidado.RECEITAS_FINANCEIRAS) -
          Number(dreConsolidado.DESPESAS_FINANCEIRAS)
        : 0

    const despesaTotal = despesas.data?.porNatureza.reduce((soma, row) => soma + Number(row.VALOR_DESPESA), 0) ?? 0

    const pagarEmAberto = contasPagar.data?.situacao.filter((row) => row.ESTADO === 'Em aberto') ?? []
    const totalPagar = pagarEmAberto.reduce((soma, row) => soma + Number(row.SALDO), 0)
    const pagarVencido = pagarEmAberto.find((row) => row.SITUACAO === 'Vencido')?.SALDO ?? 0

    const receberEmAberto = contasReceber.data?.situacao.filter((row) => row.ESTADO === 'Em aberto') ?? []
    const totalReceber = receberEmAberto.reduce((soma, row) => soma + Number(row.SALDO), 0)
    const receberVencido = receberEmAberto.find((row) => row.SITUACAO === 'Vencido')?.SALDO ?? 0

    const kpis = [
        { titulo: 'Faturamento (período)', valor: formatCurrency(faturamento), loading: vendaBruta.loading },
        { titulo: 'Margem bruta (DRE)', valor: formatPercent(margemBruta), loading: resultado.loading },
        {
            titulo: 'Resultado líquido (DRE)',
            valor: formatCurrency(resultadoLiquido),
            loading: resultado.loading,
            negativo: resultadoLiquido < 0,
        },
        { titulo: 'Despesa operacional', valor: formatCurrency(despesaTotal), loading: despesas.loading },
        { titulo: 'Valor em estoque', valor: formatCurrency(valorEstoque), loading: estoque.loading },
        { titulo: 'Liquidez corrente', valor: `${formatRatio(liquidezCorrente)}x`, loading: liquidez.loading },
        {
            titulo: 'A receber em aberto',
            valor: formatCurrency(totalReceber),
            sub: `Vencido: ${formatCurrency(receberVencido)}`,
            loading: contasReceber.loading,
        },
        {
            titulo: 'A pagar em aberto',
            valor: formatCurrency(totalPagar),
            sub: `Vencido: ${formatCurrency(pagarVencido)}`,
            loading: contasPagar.loading,
        },
    ]

    return (
        <PageShell
            isAdmin={me?.isAdmin ?? false}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={habilitado}
            titulo='Visão Geral'
            subtitulo='Painel executivo — visão consolidada de todas as seções.'
            filtros={
                <FiltersMenu>
                    <div className='flex flex-col gap-2'>
                        <span className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                            Filiais
                        </span>
                        <FilialMultiFilter branches={branchesDisponiveis} selected={filiaisAtivas} onChange={setSelecionadas} />
                    </div>
                    <div className='flex flex-col gap-2'>
                        <span className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                            Período
                        </span>
                        <DateRangeFilter inicio={inicio} fim={fim} onChangeInicio={setInicio} onChangeFim={setFim} />
                    </div>
                </FiltersMenu>
            }
        >
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                {kpis.map((kpi) => (
                    <div
                        key={kpi.titulo}
                        className='rounded-xl border border-gray-base/30 bg-white dark:bg-dark-surface dark:border-dark-border p-6 shadow-sm'
                    >
                        <span className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                            {kpi.titulo}
                        </span>
                        <div
                            className={`mt-2 text-xl font-semibold ${
                                kpi.negativo ? 'text-red-base' : 'text-gray-text dark:text-dark-text'
                            }`}
                        >
                            {kpi.loading ? <Spinner className='h-5 w-5' /> : kpi.valor}
                        </div>
                        {kpi.sub && <span className='text-xs text-gray-dark dark:text-dark-text-muted'>{kpi.sub}</span>}
                    </div>
                ))}
            </div>

            <h2 className='text-lg font-semibold text-gray-text dark:text-dark-text mt-8 mb-4'>Seções do painel</h2>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {SECOES.map((secao) => (
                    <NavLink
                        key={secao.to}
                        to={secao.to}
                        className='rounded-xl border border-gray-base/30 bg-white dark:bg-dark-surface dark:border-dark-border p-6 shadow-sm transition hover:border-orange-base'
                    >
                        <span className='text-sm font-semibold text-gray-text dark:text-dark-text'>{secao.titulo}</span>
                        <p className='mt-1 text-xs text-gray-dark dark:text-dark-text-muted'>{secao.descricao}</p>
                    </NavLink>
                ))}
            </div>
        </PageShell>
    )
}
