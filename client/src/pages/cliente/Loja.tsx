import { useEffect, useMemo, useState } from 'react'
import ClienteShell from '../../components/cliente/ClienteShell'
import Spinner from '../../components/Spinner'
import { ChevronDownIcon, ImageIcon } from '../../components/icons'
import { useCarrinho } from '../../contexts/CarrinhoContext'
import { clienteApiGet } from '../../lib/clienteApi'
import { formatCurrency, formatNumber } from '../../lib/format'
import { produtoImagemUrl } from '../../lib/imagens'
import type { CategoriaComProdutos, ProdutoCatalogo } from '../../types/categoria'

type ProdutoCardProps = {
    produto: ProdutoCatalogo
    quantidade: number
    adicionado: boolean
    semFoto: boolean
    onQuantidadeChange: (valor: number) => void
    onAdicionar: () => void
    onErroFoto: () => void
}

function ProdutoCard({ produto, quantidade, adicionado, semFoto, onQuantidadeChange, onAdicionar, onErroFoto }: ProdutoCardProps) {
    const semEstoque = produto.ESTOQUE <= 0
    const semPreco = produto.PRECO == null
    const emPromocao = produto.PRECO_ORIGINAL != null && produto.PRECO != null && produto.PRECO < produto.PRECO_ORIGINAL

    return (
        <div className='flex flex-col rounded-xl border border-gray-base/30 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-base/50 hover:shadow-md dark:border-dark-border dark:bg-dark-surface'>
            <div className='relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray dark:bg-dark-surface-2'>
                {semEstoque && (
                    <span className='absolute left-2 top-2 rounded-full bg-red-base px-2 py-1 text-xs font-semibold text-white'>
                        Esgotado
                    </span>
                )}
                {emPromocao && !semEstoque && (
                    <span className='absolute right-2 top-2 rounded-full bg-orange-base px-2 py-1 text-xs font-semibold text-white'>
                        Promoção
                    </span>
                )}
                {semFoto ? (
                    <ImageIcon className='h-8 w-8 text-gray-dark/40 dark:text-dark-text-muted/40' />
                ) : (
                    <img
                        src={produtoImagemUrl(produto.CODIGO_PRODUTO)}
                        alt={produto.DESCRICAO}
                        loading='lazy'
                        className={`h-full w-full object-contain ${semEstoque ? 'opacity-50' : ''}`}
                        onError={onErroFoto}
                    />
                )}
            </div>

            <p className='text-sm font-medium text-gray-text dark:text-dark-text'>{produto.DESCRICAO}</p>
            <p className='mt-1 text-xs text-gray-dark dark:text-dark-text-muted'>{produto.SECAO ?? 'Sem seção'}</p>

            <div className='mt-3 flex items-center justify-between'>
                <div className='flex items-baseline gap-2'>
                    <span className='text-lg font-semibold text-gray-text dark:text-dark-text'>
                        {semPreco ? '—' : formatCurrency(produto.PRECO!)}
                    </span>
                    {emPromocao && (
                        <span className='text-xs text-gray-dark line-through dark:text-dark-text-muted'>
                            {formatCurrency(produto.PRECO_ORIGINAL!)}
                        </span>
                    )}
                </div>
                {!semEstoque && (
                    <span className='text-xs font-medium text-green-base'>{formatNumber(produto.ESTOQUE)} em estoque</span>
                )}
            </div>

            <div className='mt-3 flex items-center gap-2'>
                <input
                    type='number'
                    min={1}
                    disabled={semEstoque}
                    value={quantidade || 1}
                    onChange={(e) => onQuantidadeChange(Math.max(1, Number(e.target.value)))}
                    className='w-16 rounded-lg border border-gray-base/30 bg-white px-2 py-1.5 text-sm text-gray-text disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                />
                <button
                    type='button'
                    disabled={semPreco || semEstoque}
                    onClick={onAdicionar}
                    className='flex-1 rounded-lg bg-orange-base px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                >
                    {semEstoque ? 'Esgotado' : adicionado ? 'Adicionado ✓' : 'Adicionar'}
                </button>
            </div>
        </div>
    )
}

export default function Loja() {
    const { adicionar } = useCarrinho()

    const [categorias, setCategorias] = useState<CategoriaComProdutos[]>([])
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    const [expandidas, setExpandidas] = useState<Record<string, boolean>>({})
    const [busca, setBusca] = useState('')

    const [quantidades, setQuantidades] = useState<Record<number, number>>({})
    const [adicionados, setAdicionados] = useState<Record<number, boolean>>({})
    const [semFoto, setSemFoto] = useState<Record<number, boolean>>({})

    useEffect(() => {
        clienteApiGet<CategoriaComProdutos[]>('/cliente/categorias')
            .then((lista) => {
                setCategorias(lista)
                if (lista.length > 0) setExpandidas({ [lista[0].id]: true })
            })
            .catch((err) => setErro(err.message))
            .finally(() => setLoading(false))
    }, [])

    function alternarCategoria(id: string) {
        setExpandidas((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    function handleAdicionar(produto: ProdutoCatalogo) {
        if (produto.PRECO == null) return

        const quantidade = quantidades[produto.CODIGO_PRODUTO] || 1
        adicionar(
            { codigoProduto: produto.CODIGO_PRODUTO, descricao: produto.DESCRICAO, precoUnitario: produto.PRECO },
            quantidade
        )

        setAdicionados((prev) => ({ ...prev, [produto.CODIGO_PRODUTO]: true }))
        setTimeout(() => setAdicionados((prev) => ({ ...prev, [produto.CODIGO_PRODUTO]: false })), 1500)
    }

    const resultadosBusca = useMemo(() => {
        const termo = busca.trim().toLowerCase()
        if (!termo) return null

        const vistos = new Set<number>()
        const resultado: ProdutoCatalogo[] = []

        for (const categoria of categorias) {
            for (const produto of categoria.produtos) {
                if (vistos.has(produto.CODIGO_PRODUTO)) continue
                if (!produto.DESCRICAO.toLowerCase().includes(termo)) continue
                vistos.add(produto.CODIGO_PRODUTO)
                resultado.push(produto)
            }
        }

        return resultado
    }, [busca, categorias])

    function renderCard(produto: ProdutoCatalogo) {
        return (
            <ProdutoCard
                key={produto.CODIGO_PRODUTO}
                produto={produto}
                quantidade={quantidades[produto.CODIGO_PRODUTO] || 1}
                adicionado={adicionados[produto.CODIGO_PRODUTO] ?? false}
                semFoto={semFoto[produto.CODIGO_PRODUTO] ?? false}
                onQuantidadeChange={(valor) =>
                    setQuantidades((prev) => ({ ...prev, [produto.CODIGO_PRODUTO]: valor }))
                }
                onAdicionar={() => handleAdicionar(produto)}
                onErroFoto={() => setSemFoto((prev) => ({ ...prev, [produto.CODIGO_PRODUTO]: true }))}
            />
        )
    }

    return (
        <ClienteShell requireAuth={false}>
            <div className='flex flex-wrap items-center justify-between gap-4'>
                <h1 className='text-2xl font-semibold text-gray-text dark:text-dark-text'>Catálogo</h1>
            </div>

            <input
                type='text'
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder='Buscar produto...'
                className='mt-4 w-full rounded-lg border border-gray-base/30 bg-white px-4 py-2.5 text-sm text-gray-text focus:border-orange-base focus:outline-none dark:border-dark-border dark:bg-dark-surface dark:text-dark-text sm:max-w-sm'
            />

            {loading && (
                <div className='mt-8 flex justify-center'>
                    <Spinner className='h-6 w-6' />
                </div>
            )}

            {erro && <p className='mt-6 text-sm text-red-base'>{erro}</p>}

            {!loading && !erro && categorias.length === 0 && (
                <p className='mt-6 text-sm text-gray-dark dark:text-dark-text-muted'>
                    Ainda não há produtos disponíveis. Fale com seu vendedor.
                </p>
            )}

            {!loading && !erro && resultadosBusca && (
                <div className='mt-6'>
                    <h2 className='mb-4 text-lg font-semibold text-gray-text dark:text-dark-text'>
                        Resultados para "{busca}"
                    </h2>
                    {resultadosBusca.length === 0 ? (
                        <p className='text-sm text-gray-dark dark:text-dark-text-muted'>Nenhum produto encontrado.</p>
                    ) : (
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                            {resultadosBusca.map(renderCard)}
                        </div>
                    )}
                </div>
            )}

            {!loading && !erro && !resultadosBusca && categorias.length > 0 && (
                <div className='mt-6 flex flex-col gap-4'>
                    {categorias.map((categoria) => {
                        const aberta = expandidas[categoria.id] ?? false

                        return (
                            <div
                                key={categoria.id}
                                className='rounded-xl border border-gray-base/30 bg-white shadow-sm dark:border-dark-border dark:bg-dark-surface'
                            >
                                <button
                                    type='button'
                                    onClick={() => alternarCategoria(categoria.id)}
                                    className='flex w-full items-center justify-between gap-3 px-6 py-4 text-left'
                                >
                                    <span className='text-base font-semibold text-gray-text dark:text-dark-text'>
                                        {categoria.nome}
                                        <span className='ml-2 text-sm font-normal text-gray-dark dark:text-dark-text-muted'>
                                            ({categoria.produtos.length})
                                        </span>
                                    </span>
                                    <ChevronDownIcon
                                        className={`h-5 w-5 shrink-0 text-gray-dark transition-transform dark:text-dark-text-muted ${aberta ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {aberta && (
                                    <div className='border-t border-gray-base/30 p-6 dark:border-dark-border'>
                                        {categoria.produtos.length === 0 ? (
                                            <p className='text-sm text-gray-dark dark:text-dark-text-muted'>
                                                Nenhum produto nessa categoria ainda.
                                            </p>
                                        ) : (
                                            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                                {categoria.produtos.map(renderCard)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </ClienteShell>
    )
}
