import { useState } from 'react'
import PageShell from '../components/PageShell'
import StatCard from '../components/StatCard'
import ClientesPanel from '../components/ClientesPanel'
import DataTable from '../components/DataTable'
import DateRangeFilter from '../components/DateRangeFilter'
import { useMe } from '../hooks/useMe'
import { useTelevendas } from '../hooks/useTelevendas'
import { formatCurrency, formatNumber, formatPercent, formatDate } from '../lib/format'
import { getPresetRange } from '../lib/date'
import type { VisaoGeral, ClienteResumo, ClienteSemComprar, TopCliente, TopProduto } from '../types/televendas'

export default function Home() {
    const { me, loading: loadingMe, error: meError } = useMe()

    const [inicio, setInicio] = useState(() => getPresetRange('mes').inicio)
    const [fim, setFim] = useState(() => getPresetRange('mes').fim)

    const habilitado = me !== null
    const params = { inicio, fim }

    const visaoGeral = useTelevendas<VisaoGeral>('/televendas/visao-geral', params, habilitado)
    const clientes = useTelevendas<ClienteResumo[]>('/televendas/clientes', params, habilitado)
    const semComprar = useTelevendas<ClienteSemComprar[]>('/televendas/clientes-sem-comprar', params, habilitado)
    const topClientes = useTelevendas<TopCliente[]>('/televendas/top-clientes', params, habilitado)
    const topProdutos = useTelevendas<TopProduto[]>('/televendas/top-produtos', params, habilitado)

    return (
        <PageShell
            isAdmin={me?.isAdmin ?? false}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={me !== null}
            titulo='Televendas Novamix'
            subtitulo='Histórico de vendas e oportunidades por cliente.'
            filtros={<DateRangeFilter inicio={inicio} fim={fim} onChangeInicio={setInicio} onChangeFim={setFim} />}
        >
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <StatCard
                    titulo='Faturamento total'
                    valor={formatCurrency(visaoGeral.data?.FATURAMENTO_TOTAL ?? 0)}
                    subtitulo={`${formatDate(inicio)} – ${formatDate(fim)}`}
                    loading={visaoGeral.loading}
                    erro={visaoGeral.erro}
                />
                <StatCard
                    titulo='Clientes ativos'
                    valor={formatNumber(visaoGeral.data?.CLIENTES_ATIVOS ?? 0)}
                    subtitulo='na base de televendas'
                    loading={visaoGeral.loading}
                    erro={visaoGeral.erro}
                />
                <StatCard
                    titulo='Produtos vendidos'
                    valor={formatNumber(visaoGeral.data?.PRODUTOS_VENDIDOS ?? 0)}
                    subtitulo='itens distintos'
                    loading={visaoGeral.loading}
                    erro={visaoGeral.erro}
                />
                <StatCard
                    titulo='Devoluções'
                    valor={formatCurrency(visaoGeral.data?.DEVOLUCOES_VALOR ?? 0)}
                    subtitulo={`${formatPercent(visaoGeral.data?.DEVOLUCOES_PERCENTUAL ?? 0)} do faturamento`}
                    loading={visaoGeral.loading}
                    erro={visaoGeral.erro}
                />
            </div>

            <div className='mt-6 flex flex-col gap-6 lg:flex-row lg:items-start'>
                <ClientesPanel clientes={clientes.data ?? []} loading={clientes.loading} erro={clientes.erro} />

                <div className='flex min-w-0 flex-1 flex-col gap-6'>
                    <DataTable
                        titulo='Clientes que mais compraram no período não estão sendo vistos há tempo'
                        rodape='Clientes relevantes (faturamento acima de R$ 5.000) sem compra recente — priorize a ligação.'
                        loading={semComprar.loading}
                        erro={semComprar.erro}
                        rows={semComprar.data ?? []}
                        columns={[
                            { key: 'cliente', label: 'Cliente', render: (r) => r.CLIENTE },
                            {
                                key: 'total',
                                label: 'Total comprado',
                                align: 'right',
                                render: (r) => formatCurrency(r.TOTAL_COMPRADO),
                            },
                            {
                                key: 'ultima',
                                label: 'Última compra',
                                align: 'right',
                                render: (r) => formatDate(r.ULTIMA_COMPRA),
                            },
                            {
                                key: 'dias',
                                label: 'Dias sem comprar',
                                align: 'right',
                                render: (r) => `${r.DIAS_SEM_COMPRAR}d`,
                                destaque: (r) => r.DIAS_SEM_COMPRAR > 90,
                            },
                        ]}
                    />

                    <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
                        <DataTable
                            titulo='Top 10 clientes'
                            rodape='Maiores faturamentos no período.'
                            loading={topClientes.loading}
                            erro={topClientes.erro}
                            rows={(topClientes.data ?? []).map((r, i) => ({ ...r, POSICAO: i + 1 }))}
                            columns={[
                                { key: 'pos', label: '#', render: (r) => String(r.POSICAO) },
                                { key: 'cliente', label: 'Cliente', render: (r) => r.CLIENTE },
                                { key: 'total', label: 'Total', align: 'right', render: (r) => formatCurrency(r.TOTAL) },
                                { key: 'pedidos', label: 'Pedidos', align: 'right', render: (r) => formatNumber(r.PEDIDOS) },
                                {
                                    key: 'ticket',
                                    label: 'Ticket médio',
                                    align: 'right',
                                    render: (r) => formatCurrency(r.TICKET_MEDIO),
                                },
                            ]}
                        />

                        <DataTable
                            titulo='Top 10 produtos'
                            rodape='Maior faturamento acumulado, todos os clientes.'
                            loading={topProdutos.loading}
                            erro={topProdutos.erro}
                            rows={(topProdutos.data ?? []).map((r, i) => ({ ...r, POSICAO: i + 1 }))}
                            columns={[
                                { key: 'pos', label: '#', render: (r) => String(r.POSICAO) },
                                { key: 'produto', label: 'Produto', render: (r) => r.PRODUTO },
                                { key: 'total', label: 'Total', align: 'right', render: (r) => formatCurrency(r.TOTAL) },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </PageShell>
    )
}
