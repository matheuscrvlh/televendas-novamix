import { useEffect, useState } from 'react'
import ClienteShell from '../../components/cliente/ClienteShell'
import Spinner from '../../components/Spinner'
import { ImageIcon } from '../../components/icons'
import { useCarrinho } from '../../contexts/CarrinhoContext'
import { clienteApiGet } from '../../lib/clienteApi'
import { formatCurrency, formatNumber } from '../../lib/format'
import { produtoImagemUrl } from '../../lib/imagens'
import type { Catalogo, ProdutoCatalogo } from '../../types/catalogo'

export default function Loja() {
    const { adicionar } = useCarrinho()

    const [catalogos, setCatalogos] = useState<Catalogo[]>([])
    const [catalogoId, setCatalogoId] = useState<string>('')
    const [loadingCatalogos, setLoadingCatalogos] = useState(true)

    const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([])
    const [loadingProdutos, setLoadingProdutos] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const [quantidades, setQuantidades] = useState<Record<number, number>>({})
    const [adicionados, setAdicionados] = useState<Record<number, boolean>>({})
    const [semFoto, setSemFoto] = useState<Record<number, boolean>>({})

    useEffect(() => {
        clienteApiGet<Catalogo[]>('/cliente/catalogos')
            .then((lista) => {
                setCatalogos(lista)
                if (lista.length > 0) setCatalogoId(lista[0].id)
            })
            .catch((err) => setErro(err.message))
            .finally(() => setLoadingCatalogos(false))
    }, [])

    useEffect(() => {
        if (!catalogoId) return

        setLoadingProdutos(true)
        setErro(null)

        clienteApiGet<ProdutoCatalogo[]>(`/cliente/catalogos/${catalogoId}/produtos`)
            .then(setProdutos)
            .catch((err) => setErro(err.message))
            .finally(() => setLoadingProdutos(false))
    }, [catalogoId])

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

    return (
        <ClienteShell requireAuth={false}>
            <div className='flex flex-wrap items-center justify-between gap-4'>
                <h1 className='text-2xl font-semibold text-gray-text dark:text-dark-text'>Catálogo</h1>

                {!loadingCatalogos && catalogos.length > 0 && (
                    <select
                        value={catalogoId}
                        onChange={(e) => setCatalogoId(e.target.value)}
                        className='rounded-lg border border-gray-base/30 bg-white px-3 py-2 text-sm text-gray-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                    >
                        {catalogos.map((catalogo) => (
                            <option key={catalogo.id} value={catalogo.id}>
                                {catalogo.nome}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {loadingCatalogos && (
                <div className='mt-8 flex justify-center'>
                    <Spinner className='h-6 w-6' />
                </div>
            )}

            {!loadingCatalogos && catalogos.length === 0 && (
                <p className='mt-6 text-sm text-gray-dark dark:text-dark-text-muted'>
                    Ainda não há catálogos disponíveis. Fale com seu vendedor.
                </p>
            )}

            {erro && <p className='mt-6 text-sm text-red-base'>{erro}</p>}

            {loadingProdutos && (
                <div className='mt-8 flex justify-center'>
                    <Spinner className='h-6 w-6' />
                </div>
            )}

            {!loadingProdutos && !erro && catalogoId && produtos.length === 0 && (
                <p className='mt-6 text-sm text-gray-dark dark:text-dark-text-muted'>
                    Nenhum produto neste catálogo ainda.
                </p>
            )}

            {!loadingProdutos && produtos.length > 0 && (
                <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {produtos.map((produto) => {
                        const semEstoque = produto.ESTOQUE <= 0
                        const semPreco = produto.PRECO == null

                        return (
                            <div
                                key={produto.CODIGO_PRODUTO}
                                className='flex flex-col rounded-xl border border-gray-base/30 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-surface'
                            >
                                <div className='relative mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray dark:bg-dark-surface-2'>
                                    {semEstoque && (
                                        <span className='absolute left-2 top-2 rounded-full bg-red-base px-2 py-1 text-xs font-semibold text-white'>
                                            Esgotado
                                        </span>
                                    )}
                                    {semFoto[produto.CODIGO_PRODUTO] ? (
                                        <ImageIcon className='h-8 w-8 text-gray-dark/40 dark:text-dark-text-muted/40' />
                                    ) : (
                                        <img
                                            src={produtoImagemUrl(produto.CODIGO_PRODUTO)}
                                            alt={produto.DESCRICAO}
                                            loading='lazy'
                                            className={`h-full w-full object-contain ${semEstoque ? 'opacity-50' : ''}`}
                                            onError={() =>
                                                setSemFoto((prev) => ({ ...prev, [produto.CODIGO_PRODUTO]: true }))
                                            }
                                        />
                                    )}
                                </div>

                                <p className='text-sm font-medium text-gray-text dark:text-dark-text'>
                                    {produto.DESCRICAO}
                                </p>
                                <p className='mt-1 text-xs text-gray-dark dark:text-dark-text-muted'>
                                    {produto.SECAO ?? 'Sem seção'}
                                </p>

                                <div className='mt-3 flex items-center justify-between'>
                                    <span className='text-lg font-semibold text-gray-text dark:text-dark-text'>
                                        {semPreco ? '—' : formatCurrency(produto.PRECO!)}
                                    </span>
                                    {!semEstoque && (
                                        <span className='text-xs font-medium text-green-base'>
                                            {formatNumber(produto.ESTOQUE)} em estoque
                                        </span>
                                    )}
                                </div>

                                <div className='mt-3 flex items-center gap-2'>
                                    <input
                                        type='number'
                                        min={1}
                                        disabled={semEstoque}
                                        value={quantidades[produto.CODIGO_PRODUTO] || 1}
                                        onChange={(e) =>
                                            setQuantidades((prev) => ({
                                                ...prev,
                                                [produto.CODIGO_PRODUTO]: Math.max(1, Number(e.target.value)),
                                            }))
                                        }
                                        className='w-16 rounded-lg border border-gray-base/30 bg-white px-2 py-1.5 text-sm text-gray-text disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text'
                                    />
                                    <button
                                        type='button'
                                        disabled={semPreco || semEstoque}
                                        onClick={() => handleAdicionar(produto)}
                                        className='flex-1 rounded-lg bg-orange-base px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-light disabled:opacity-50'
                                    >
                                        {semEstoque
                                            ? 'Esgotado'
                                            : adicionados[produto.CODIGO_PRODUTO]
                                              ? 'Adicionado ✓'
                                              : 'Adicionar'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </ClienteShell>
    )
}
