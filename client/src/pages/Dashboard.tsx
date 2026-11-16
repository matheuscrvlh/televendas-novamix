import { useState } from 'react'
import PageShell from '../components/PageShell'
import StatCard from '../components/StatCard'
import ClientesPanel from '../components/ClientesPanel'
import DataTable from '../components/DataTable'
import DateRangeFilter from '../components/DateRangeFilter'
import ProdutoThumbnail from '../components/ProdutoThumbnail'
import ClienteItensModal from '../components/ClienteItensModal'
import ClienteHistoricoModal from '../components/ClienteHistoricoModal'
import MetaBloco from '../components/MetaBloco'
import MetaMargemBloco from '../components/MetaMargemBloco'
import { useMe } from '../hooks/useMe'
import { useTelevendas } from '../hooks/useTelevendas'
import { useMetasMes } from '../hooks/useMetasMes'
import { formatCurrency, formatNumber, formatPercent, formatDate } from '../lib/format'
import { getPresetRange, nomeDoMes } from '../lib/date'
import type { VisaoGeral, ClienteResumo, ClienteSemComprar, TopCliente, TopProduto } from '../types/televendas'

// Quadro "Clientes que mais compraram no período não estão sendo vistos há tempo": desligado por enquanto.
// Para voltar, troque para true (a rota e a consulta continuam no servidor).
const MOSTRAR_CLIENTES_SEM_COMPRAR = false

export default function Dashboard() {
    const { me, loading: loadingMe, error: meError } = useMe()

    const [inicio, setInicio] = useState(() => getPresetRange('mes').inicio)
    const [fim, setFim] = useState(() => getPresetRange('mes').fim)
    const [clienteItens, setClienteItens] = useState<TopCliente | null>(null)
    const [clienteHistorico, setClienteHistorico] = useState<ClienteResumo | null>(null)

    const habilitado = me !== null
    const params = { inicio, fim }

    const visaoGeral = useTelevendas<VisaoGeral>('/televendas/visao-geral', params, habilitado)
    const clientes = useTelevendas<ClienteResumo[]>('/televendas/clientes', params, habilitado)
    const semComprar = useTelevendas<ClienteSemComprar[]>(
        '/televendas/clientes-sem-comprar',
        params,
        habilitado && MOSTRAR_CLIENTES_SEM_COMPRAR
    )
    const topClientes = useTelevendas<TopCliente[]>('/televendas/top-clientes', params, habilitado)
    const topProdutos = useTelevendas<TopProduto[]>('/televendas/top-produtos', params, habilitado)

    // Metas são sempre do mês da data final do filtro e o progresso usa o mês inteiro.
    const mesMeta = fim.slice(0, 7)
    const nomeMes = nomeDoMes(mesMeta)
    const metasMes = useMetasMes(mesMeta, habilitado)

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
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
                <StatCard
                    titulo='Faturamento total'
                    valor={formatCurrency(visaoGeral.data?.FATURAMENTO_TOTAL ?? 0)}
                    subtitulo={`${formatDate(inicio)} – ${formatDate(fim)}`}
                    loading={visaoGeral.loading}
                    erro={visaoGeral.erro}
                >
                    <MetaBloco
                        key={`faturamento-${mesMeta}`}
                        nomeMes={nomeMes}
                        formato='moeda'
                        meta={metasMes.metas?.faturamento ?? null}
                        supermeta={metasMes.metas?.faturamento_super ?? null}
                        realizado={metasMes.realizado?.faturamento ?? 0}
                        loading={metasMes.loading}
                        erro={metasMes.erro}
                        onSalvar={({ meta, supermeta }) =>
                            metasMes.salvar({ faturamento: meta, faturamento_super: supermeta })
                        }
                    />
                </StatCard>
                <StatCard
                    titulo='Clientes ativos'
                    valor={formatNumber(visaoGeral.data?.CLIENTES_ATIVOS ?? 0)}
                    subtitulo='compraram no período'
                    loading={visaoGeral.loading}
                    erro={visaoGeral.erro}
                >
                    <MetaBloco
                        key={`clientes-${mesMeta}`}
                        nomeMes={nomeMes}
                        formato='clientes'
                        meta={metasMes.metas?.clientes ?? null}
                        realizado={metasMes.realizado?.clientes ?? 0}
                        loading={metasMes.loading}
                        erro={metasMes.erro}
                        onSalvar={({ meta }) => metasMes.salvar({ clientes: meta })}
                    />
                </StatCard>
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
                <StatCard
                    titulo='Margem de lucro'
                    valor={
                        visaoGeral.data?.MARGEM_PERCENTUAL == null ? '—' : formatPercent(visaoGeral.data.MARGEM_PERCENTUAL)
                    }
                    subtitulo={`resultado de ${formatCurrency(visaoGeral.data?.LUCRO_LIQUIDO ?? 0)}`}
                    loading={visaoGeral.loading}
                    erro={visaoGeral.erro}
                >
                    {!visaoGeral.loading && <MetaMargemBloco margem={visaoGeral.data?.MARGEM_PERCENTUAL ?? null} />}
                </StatCard>
            </div>

            <div className='mt-6 flex flex-col gap-6 lg:flex-row lg:items-start'>
                <ClientesPanel
                    clientes={clientes.data ?? []}
                    loading={clientes.loading}
                    erro={clientes.erro}
                    onSelecionar={setClienteHistorico}
                />

                <div className='flex min-w-0 flex-1 flex-col gap-6'>
                    {MOSTRAR_CLIENTES_SEM_COMPRAR && (
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
                                    label: 'Sem comprar',
                                    align: 'right',
                                    render: (r) => `${r.DIAS_SEM_COMPRAR}d`,
                                    destaque: (r) => r.DIAS_SEM_COMPRAR > 90,
                                },
                            ]}
                        />
                    )}

                    <div className='flex flex-col gap-6'>
                        <DataTable
                            titulo='Top 10 clientes'
                            rodape='Maiores faturamentos no período.'
                            loading={topClientes.loading}
                            erro={topClientes.erro}
                            rows={(topClientes.data ?? []).map((r, i) => ({ ...r, POSICAO: i + 1 }))}
                            columns={[
                                { key: 'pos', label: '#', render: (r) => String(r.POSICAO) },
                                {
                                    key: 'cliente',
                                    label: 'Cliente',
                                    render: (r) => (
                                        <button
                                            type='button'
                                            onClick={() => setClienteItens(r)}
                                            title='Ver itens comprados no período'
                                            className='text-left font-medium text-gray-text underline-offset-2 hover:text-orange-base hover:underline dark:text-dark-text dark:hover:text-orange-light'
                                        >
                                            {r.CLIENTE}
                                        </button>
                                    ),
                                },
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
                                {
                                    key: 'produto',
                                    label: 'Produto',
                                    render: (r) => (
                                        <div className='flex items-center gap-2'>
                                            <ProdutoThumbnail
                                                codigoProduto={r.IDPRODUTO}
                                                descricao={r.PRODUTO}
                                                className='h-8 w-8'
                                            />
                                            <span>{r.PRODUTO}</span>
                                        </div>
                                    ),
                                },
                                { key: 'total', label: 'Total', align: 'right', render: (r) => formatCurrency(r.TOTAL) },
                            ]}
                        />
                    </div>
                </div>
            </div>

            <ClienteItensModal cliente={clienteItens} inicio={inicio} fim={fim} onClose={() => setClienteItens(null)} />
            {/* key: cada cliente abre o histórico do zero (aba, busca e compras abertas). */}
            <ClienteHistoricoModal
                key={clienteHistorico?.IDCLIFOR ?? 'nenhum'}
                cliente={clienteHistorico}
                onClose={() => setClienteHistorico(null)}
            />
        </PageShell>
    )
}
