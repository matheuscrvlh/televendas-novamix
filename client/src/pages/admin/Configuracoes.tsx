import { useEffect, useState, type FormEvent } from 'react'
import PageShell from '../../components/PageShell'
import Spinner from '../../components/Spinner'
import { useMe } from '../../hooks/useMe'
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import { uploadImagemUrl } from '../../lib/imagens'
import type { ConfigVendedor } from '../../types/pedidoAdmin'
import type { ConfigLoja } from '../../types/configLoja'
import type { Categoria } from '../../types/categoria'
import type { Banner } from '../../types/marketing'

type PosicaoBanner = 'hero' | 'secao'

function CategoriasLayoutSection() {
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    function carregar() {
        setLoading(true)
        setErro(null)
        apiGet<Categoria[]>('/categorias')
            .then(setCategorias)
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(carregar, [])

    async function alternarDestaque(categoria: Categoria) {
        try {
            const novoValor = !categoria.destaque_home
            const proximaOrdem = novoValor
                ? Math.max(0, ...categorias.filter((c) => c.destaque_home).map((c) => c.ordem_home)) + 1
                : categoria.ordem_home

            const atualizada = await apiPatch<Categoria>(`/categorias/${categoria.id}`, {
                destaqueHome: novoValor,
                ordemHome: proximaOrdem,
            })
            setCategorias((prev) => prev.map((c) => (c.id === categoria.id ? atualizada : c)))
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Erro ao atualizar categoria.')
        }
    }

    async function mover(index: number, direcao: -1 | 1) {
        const destaque = categorias.filter((c) => c.destaque_home).sort((a, b) => a.ordem_home - b.ordem_home)
        const alvo = index + direcao
        if (alvo < 0 || alvo >= destaque.length) return

        const anterior = categorias
        const proximos = [...destaque]
        ;[proximos[index], proximos[alvo]] = [proximos[alvo], proximos[index]]
        const atualizados = proximos.map((c, i) => ({ ...c, ordem_home: i }))
        setCategorias((prev) => prev.map((c) => atualizados.find((a) => a.id === c.id) ?? c))

        try {
            await Promise.all([
                apiPatch(`/categorias/${atualizados[index].id}`, { ordemHome: atualizados[index].ordem_home }),
                apiPatch(`/categorias/${atualizados[alvo].id}`, { ordemHome: atualizados[alvo].ordem_home }),
            ])
        } catch {
            setCategorias(anterior)
            setErro('Erro ao reordenar seções em destaque.')
        }
    }

    const destaque = categorias.filter((c) => c.destaque_home).sort((a, b) => a.ordem_home - b.ordem_home)

    return (
        <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
            <span className='text-sm font-medium text-gray-text dark:text-dark-text'>Categorias na home</span>
            <p className='mt-1 text-xs text-gray-dark dark:text-dark-text-muted'>
                Escolha quais categorias viram um carrossel de produtos na home da loja, e em que ordem.
            </p>

            {erro && <p className='mt-3 text-sm text-red-base'>{erro}</p>}

            {loading ? (
                <div className='mt-4 flex justify-center py-2'>
                    <Spinner className='h-5 w-5' />
                </div>
            ) : categorias.length === 0 ? (
                <p className='mt-3 text-sm text-gray-dark dark:text-dark-text-muted'>Nenhuma categoria criada ainda.</p>
            ) : (
                <>
                    {destaque.length > 0 && (
                        <div className='mt-4 flex flex-col gap-2'>
                            <p className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                Ordem na home
                            </p>
                            {destaque.map((categoria, i) => (
                                <div
                                    key={categoria.id}
                                    className='flex items-center gap-3 rounded-lg border border-gray-base/20 px-3 py-2 dark:border-dark-border'
                                >
                                    <span className='flex-1 text-sm text-gray-text dark:text-dark-text'>{categoria.nome}</span>
                                    <div className='flex gap-1'>
                                        <button
                                            type='button'
                                            disabled={i === 0}
                                            onClick={() => mover(i, -1)}
                                            className='flex h-7 w-7 items-center justify-center rounded-md text-gray-text transition hover:bg-gray disabled:opacity-25 dark:text-dark-text dark:hover:bg-dark-surface-2'
                                            aria-label='Mover pra cima'
                                        >
                                            ↑
                                        </button>
                                        <button
                                            type='button'
                                            disabled={i === destaque.length - 1}
                                            onClick={() => mover(i, 1)}
                                            className='flex h-7 w-7 items-center justify-center rounded-md text-gray-text transition hover:bg-gray disabled:opacity-25 dark:text-dark-text dark:hover:bg-dark-surface-2'
                                            aria-label='Mover pra baixo'
                                        >
                                            ↓
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className='mt-4 flex flex-wrap gap-2'>
                        {categorias.map((categoria) => (
                            <button
                                key={categoria.id}
                                type='button'
                                onClick={() => alternarDestaque(categoria)}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                    categoria.destaque_home
                                        ? 'bg-blue-base/10 text-blue-base hover:bg-blue-base/20'
                                        : 'bg-gray-base/10 text-gray-dark hover:bg-gray-base/20 dark:text-dark-text-muted'
                                }`}
                            >
                                {categoria.nome} · {categoria.destaque_home ? 'Na home' : 'Fora da home'}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

type BannerPosicaoLayoutProps = {
    posicao: PosicaoBanner
    titulo: string
}

function BannerPosicaoLayout({ posicao, titulo }: BannerPosicaoLayoutProps) {
    const [banners, setBanners] = useState<Banner[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const [salvando, setSalvando] = useState<string | null>(null)

    function carregar() {
        setLoading(true)
        setErro(null)
        apiGet<Banner[]>('/marketing/banners', { posicao })
            .then(setBanners)
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(carregar, [posicao])

    async function alternarAtivo(banner: Banner) {
        setSalvando(banner.id)
        try {
            await apiPatch(`/marketing/banners/${banner.id}`, { ativo: !banner.ativo })
            carregar()
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Erro ao atualizar.')
        } finally {
            setSalvando(null)
        }
    }

    async function mover(index: number, direcao: -1 | 1) {
        const alvo = index + direcao
        if (alvo < 0 || alvo >= banners.length) return

        const anterior = banners
        const proximos = [...banners]
        ;[proximos[index], proximos[alvo]] = [proximos[alvo], proximos[index]]
        const atualizados = proximos.map((b, i) => ({ ...b, ordem: i }))
        setBanners(atualizados)

        try {
            await Promise.all([
                apiPatch(`/marketing/banners/${atualizados[index].id}`, { ordem: atualizados[index].ordem }),
                apiPatch(`/marketing/banners/${atualizados[alvo].id}`, { ordem: atualizados[alvo].ordem }),
            ])
        } catch {
            setBanners(anterior)
            setErro('Erro ao reordenar banners.')
        }
    }

    return (
        <div>
            <p className='text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                {titulo}
            </p>

            {erro && <p className='mt-2 text-sm text-red-base'>{erro}</p>}

            {loading ? (
                <div className='mt-3 flex justify-center py-2'>
                    <Spinner className='h-5 w-5' />
                </div>
            ) : banners.length === 0 ? (
                <p className='mt-2 text-sm text-gray-dark dark:text-dark-text-muted'>Nenhum banner cadastrado.</p>
            ) : (
                <div className='mt-2 flex flex-col gap-2'>
                    {banners.map((banner, i) => (
                        <div
                            key={banner.id}
                            className='flex flex-wrap items-center gap-3 rounded-lg border border-gray-base/20 px-3 py-2 dark:border-dark-border'
                        >
                            <div className='h-8 w-16 shrink-0 overflow-hidden rounded bg-gray dark:bg-dark-surface-2'>
                                <img src={uploadImagemUrl(banner.imagem)} alt='' className='h-full w-full object-cover' />
                            </div>

                            <span className='min-w-0 flex-1 truncate text-xs text-gray-dark dark:text-dark-text-muted'>
                                {banner.link || 'Sem link'}
                            </span>

                            <button
                                type='button'
                                disabled={salvando === banner.id}
                                onClick={() => alternarAtivo(banner)}
                                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${
                                    banner.ativo
                                        ? 'bg-green-base/10 text-green-base hover:bg-green-base/20'
                                        : 'bg-gray-base/10 text-gray-dark hover:bg-gray-base/20 dark:text-dark-text-muted'
                                }`}
                            >
                                {banner.ativo ? 'Ativo' : 'Inativo'}
                            </button>

                            <div className='flex shrink-0 gap-1'>
                                <button
                                    type='button'
                                    disabled={i === 0}
                                    onClick={() => mover(i, -1)}
                                    className='flex h-7 w-7 items-center justify-center rounded-md text-gray-text transition hover:bg-gray disabled:opacity-25 dark:text-dark-text dark:hover:bg-dark-surface-2'
                                    aria-label='Mover pra cima'
                                >
                                    ↑
                                </button>
                                <button
                                    type='button'
                                    disabled={i === banners.length - 1}
                                    onClick={() => mover(i, 1)}
                                    className='flex h-7 w-7 items-center justify-center rounded-md text-gray-text transition hover:bg-gray disabled:opacity-25 dark:text-dark-text dark:hover:bg-dark-surface-2'
                                    aria-label='Mover pra baixo'
                                >
                                    ↓
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function BannersLayoutSection() {
    return (
        <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
            <span className='text-sm font-medium text-gray-text dark:text-dark-text'>Banners</span>
            <p className='mt-1 text-xs text-gray-dark dark:text-dark-text-muted'>
                Ative, desative e reordene os banners cadastrados em Marketing.
            </p>

            <div className='mt-4 flex flex-col gap-6'>
                <BannerPosicaoLayout posicao='hero' titulo='Banner principal' />
                <BannerPosicaoLayout posicao='secao' titulo='Banner de seção' />
            </div>
        </div>
    )
}

export default function ConfiguracoesAdmin() {
    const { me, loading: loadingMe, error: meError } = useMe()
    const autorizado = me?.isAdmin ?? false

    const [config, setConfig] = useState<ConfigVendedor[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    const [valores, setValores] = useState<Record<number, string>>({})
    const [descontos, setDescontos] = useState<Record<number, string>>({})
    const [salvando, setSalvando] = useState<number | null>(null)

    const [novoCodigo, setNovoCodigo] = useState('')
    const [novoValor, setNovoValor] = useState('')
    const [criando, setCriando] = useState(false)
    const [erroForm, setErroForm] = useState<string | null>(null)

    const [textoTopo, setTextoTopo] = useState('')
    const [loadingTextoTopo, setLoadingTextoTopo] = useState(true)
    const [salvandoTextoTopo, setSalvandoTextoTopo] = useState(false)
    const [erroTextoTopo, setErroTextoTopo] = useState<string | null>(null)

    function carregarTextoTopo() {
        if (!autorizado) return
        setLoadingTextoTopo(true)
        apiGet<ConfigLoja>('/cliente/config')
            .then((c) => setTextoTopo(c.textoTopo))
            .catch((err) => setErroTextoTopo(err.message))
            .finally(() => setLoadingTextoTopo(false))
    }

    useEffect(carregarTextoTopo, [autorizado])

    async function salvarTextoTopo(e: FormEvent) {
        e.preventDefault()
        if (!textoTopo.trim()) return

        setSalvandoTextoTopo(true)
        setErroTextoTopo(null)
        try {
            const atualizado = await apiPatch<ConfigLoja>('/configuracoes/loja', { textoTopo: textoTopo.trim() })
            setTextoTopo(atualizado.textoTopo)
        } catch (err) {
            setErroTextoTopo(err instanceof ApiError ? err.message : 'Erro ao salvar o texto.')
        } finally {
            setSalvandoTextoTopo(false)
        }
    }

    function carregar() {
        if (!autorizado) return
        setLoading(true)
        setErro(null)
        apiGet<ConfigVendedor[]>('/configuracoes/vendedores')
            .then((lista) => {
                setConfig(lista)
                setValores(Object.fromEntries(lista.map((c) => [c.codigo_vendedor, String(c.valor_minimo_pedido)])))
                setDescontos(Object.fromEntries(lista.map((c) => [c.codigo_vendedor, String(c.desconto_percentual)])))
            })
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }

    useEffect(carregar, [autorizado])

    async function salvar(codigoVendedor: number) {
        const valor = Number(valores[codigoVendedor])
        const desconto = Number(descontos[codigoVendedor])
        if (!Number.isFinite(valor) || valor < 0) return
        if (!Number.isFinite(desconto) || desconto < 0 || desconto > 100) return

        setSalvando(codigoVendedor)
        try {
            await apiPatch(`/configuracoes/vendedores/${codigoVendedor}`, {
                valorMinimoPedido: valor,
                descontoPercentual: desconto,
            })
            carregar()
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Erro ao salvar.')
        } finally {
            setSalvando(null)
        }
    }

    async function remover(codigoVendedor: number) {
        setSalvando(codigoVendedor)
        try {
            await apiDelete(`/configuracoes/vendedores/${codigoVendedor}`)
            carregar()
        } catch (err) {
            setErro(err instanceof ApiError ? err.message : 'Erro ao remover.')
        } finally {
            setSalvando(null)
        }
    }

    async function criarVendedor(e: FormEvent) {
        e.preventDefault()
        setErroForm(null)

        const codigoVendedor = Number(novoCodigo)
        const valorMinimoPedido = Number(novoValor || '0')

        if (!Number.isInteger(codigoVendedor)) {
            setErroForm('Informe um código de vendedor válido.')
            return
        }

        setCriando(true)
        try {
            await apiPost('/configuracoes/vendedores', { codigoVendedor, valorMinimoPedido })
            setNovoCodigo('')
            setNovoValor('')
            carregar()
        } catch (err) {
            setErroForm(err instanceof ApiError ? err.message : 'Erro ao criar.')
        } finally {
            setCriando(false)
        }
    }

    return (
        <PageShell
            isAdmin={autorizado}
            loadingMe={loadingMe}
            meError={meError}
            autorizado={autorizado}
            tituloAcessoRestrito='Configurações é uma área restrita a administradores.'
            titulo='Configurações'
            subtitulo='Layout da loja, texto do topo e valor mínimo/desconto por vendedor de televendas.'
        >
            <div className='mb-6 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>
                    Texto do topo da loja
                </span>
                <p className='mt-1 text-xs text-gray-dark dark:text-dark-text-muted'>
                    Faixa exibida no topo do site da loja, acima do menu.
                </p>

                {loadingTextoTopo ? (
                    <div className='mt-4 flex justify-center py-2'>
                        <Spinner className='h-5 w-5' />
                    </div>
                ) : (
                    <form onSubmit={salvarTextoTopo} className='mt-4 flex flex-wrap gap-2'>
                        <input
                            type='text'
                            value={textoTopo}
                            onChange={(e) => setTextoTopo(e.target.value)}
                            className='min-w-0 flex-1 rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                        <button
                            type='submit'
                            disabled={salvandoTextoTopo || !textoTopo.trim()}
                            className='shrink-0 rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                        >
                            {salvandoTextoTopo ? <Spinner className='h-4 w-4' /> : 'Salvar'}
                        </button>
                    </form>
                )}

                {erroTextoTopo && <p className='mt-3 text-sm text-red-base'>{erroTextoTopo}</p>}
            </div>

            <h2 className='mb-3 text-base font-semibold text-gray-text dark:text-dark-text'>Layout da loja</h2>
            <div className='mb-6 flex flex-col gap-6'>
                <CategoriasLayoutSection />
                <BannersLayoutSection />
            </div>

            <div className='rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                {erro && <p className='mb-4 text-sm text-red-base'>{erro}</p>}

                {loading ? (
                    <div className='flex justify-center py-6'>
                        <Spinner className='h-6 w-6' />
                    </div>
                ) : config.length === 0 ? (
                    <p className='text-sm text-gray-dark dark:text-dark-text-muted'>
                        Nenhum vendedor configurado ainda.
                    </p>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full min-w-max border-collapse text-sm'>
                            <thead>
                                <tr className='border-b border-gray-base/30 dark:border-dark-border'>
                                    <th className='px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Código do vendedor
                                    </th>
                                    <th className='px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Valor mínimo de pedido
                                    </th>
                                    <th className='px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-dark dark:text-dark-text-muted'>
                                        Desconto geral (%)
                                    </th>
                                    <th className='px-3 py-2' />
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-base/20 dark:divide-dark-border'>
                                {config.map((c) => (
                                    <tr key={c.codigo_vendedor}>
                                        <td className='px-3 py-2 text-gray-text dark:text-dark-text'>
                                            {c.codigo_vendedor}
                                        </td>
                                        <td className='px-3 py-2 text-right'>
                                            <div className='flex items-center justify-end gap-2'>
                                                <span className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                                    {formatCurrency(c.valor_minimo_pedido)} atual
                                                </span>
                                                <input
                                                    type='number'
                                                    min={0}
                                                    step='0.01'
                                                    value={valores[c.codigo_vendedor] ?? ''}
                                                    onChange={(e) =>
                                                        setValores((prev) => ({
                                                            ...prev,
                                                            [c.codigo_vendedor]: e.target.value,
                                                        }))
                                                    }
                                                    className='w-28 rounded-lg border border-gray-base/30 bg-white px-2 py-1.5 text-right text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                                                />
                                            </div>
                                        </td>
                                        <td className='px-3 py-2 text-right'>
                                            <div className='flex items-center justify-end gap-2'>
                                                <span className='text-xs text-gray-dark dark:text-dark-text-muted'>
                                                    {c.desconto_percentual}% atual
                                                </span>
                                                <input
                                                    type='number'
                                                    min={0}
                                                    max={100}
                                                    step='0.1'
                                                    value={descontos[c.codigo_vendedor] ?? ''}
                                                    onChange={(e) =>
                                                        setDescontos((prev) => ({
                                                            ...prev,
                                                            [c.codigo_vendedor]: e.target.value,
                                                        }))
                                                    }
                                                    className='w-20 rounded-lg border border-gray-base/30 bg-white px-2 py-1.5 text-right text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                                                />
                                            </div>
                                        </td>
                                        <td className='px-3 py-2 text-right'>
                                            <div className='flex justify-end gap-2'>
                                                <button
                                                    type='button'
                                                    disabled={
                                                        salvando === c.codigo_vendedor ||
                                                        (Number(valores[c.codigo_vendedor]) === c.valor_minimo_pedido &&
                                                            Number(descontos[c.codigo_vendedor]) === c.desconto_percentual)
                                                    }
                                                    onClick={() => salvar(c.codigo_vendedor)}
                                                    className='rounded-lg border border-orange-base px-2 py-1 text-xs font-semibold text-orange-base transition hover:bg-orange-base hover:text-white disabled:opacity-40'
                                                >
                                                    Salvar
                                                </button>
                                                <button
                                                    type='button'
                                                    disabled={salvando === c.codigo_vendedor}
                                                    onClick={() => remover(c.codigo_vendedor)}
                                                    className='rounded-lg px-2 py-1 text-xs font-semibold text-red-base transition hover:bg-red-light/10'
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className='mt-6 rounded-xl border border-gray-base/30 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface'>
                <span className='text-sm font-medium text-gray-text dark:text-dark-text'>
                    Adicionar vendedor
                </span>

                <form onSubmit={criarVendedor} className='mt-4 flex flex-wrap items-end gap-2'>
                    <div>
                        <label className='block text-xs text-gray-dark dark:text-dark-text-muted'>
                            Código do vendedor
                        </label>
                        <input
                            type='number'
                            value={novoCodigo}
                            onChange={(e) => setNovoCodigo(e.target.value)}
                            className='mt-1 rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                    </div>
                    <div>
                        <label className='block text-xs text-gray-dark dark:text-dark-text-muted'>
                            Valor mínimo de pedido
                        </label>
                        <input
                            type='number'
                            min={0}
                            step='0.01'
                            value={novoValor}
                            onChange={(e) => setNovoValor(e.target.value)}
                            className='mt-1 rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                        />
                    </div>
                    <button
                        type='submit'
                        disabled={criando || !novoCodigo}
                        className='flex items-center justify-center rounded-lg bg-orange-base px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                    >
                        {criando ? <Spinner className='h-4 w-4' /> : 'Adicionar'}
                    </button>
                </form>

                {erroForm && <p className='mt-3 text-sm text-red-base'>{erroForm}</p>}
            </div>
        </PageShell>
    )
}
