import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClienteMe } from '../hooks/useClienteMe'
import { clienteApiGet, clienteApiPost } from '../lib/clienteApi'
import type { ProdutoCatalogo } from '../types/categoria'

interface FavoritosContextValue {
    produtos: ProdutoCatalogo[]
    loading: boolean
    isFavorito: (codigoProduto: number) => boolean
    alternar: (produto: ProdutoCatalogo) => void
}

const FavoritosContext = createContext<FavoritosContextValue | null>(null)

export function FavoritosProvider({ children }: { children: ReactNode }) {
    const { cliente } = useClienteMe()
    const navigate = useNavigate()

    const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([])
    const [loading, setLoading] = useState(false)

    const carregar = useCallback(() => {
        if (!cliente) {
            setProdutos([])
            return
        }
        setLoading(true)
        clienteApiGet<ProdutoCatalogo[]>('/cliente/favoritos')
            .then(setProdutos)
            .catch(() => setProdutos([]))
            .finally(() => setLoading(false))
    }, [cliente])

    useEffect(carregar, [carregar])

    const codigos = useMemo(() => new Set(produtos.map((p) => p.CODIGO_PRODUTO)), [produtos])

    function isFavorito(codigoProduto: number) {
        return codigos.has(codigoProduto)
    }

    async function alternar(produto: ProdutoCatalogo) {
        if (!cliente) {
            navigate('/entrar')
            return
        }

        const jaFavorito = codigos.has(produto.CODIGO_PRODUTO)
        // Otimista: reflete na hora, e desfaz se o servidor discordar.
        setProdutos((prev) =>
            jaFavorito ? prev.filter((p) => p.CODIGO_PRODUTO !== produto.CODIGO_PRODUTO) : [produto, ...prev]
        )

        try {
            await clienteApiPost<{ favorito: boolean }>(`/cliente/favoritos/${produto.CODIGO_PRODUTO}`)
        } catch {
            carregar()
        }
    }

    return (
        <FavoritosContext.Provider value={{ produtos, loading, isFavorito, alternar }}>
            {children}
        </FavoritosContext.Provider>
    )
}

export function useFavoritos() {
    const ctx = useContext(FavoritosContext)
    if (!ctx) throw new Error('useFavoritos precisa estar dentro de um FavoritosProvider')
    return ctx
}
