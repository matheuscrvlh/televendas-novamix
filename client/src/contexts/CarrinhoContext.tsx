import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface ItemCarrinho {
    codigoProduto: number
    descricao: string
    precoUnitario: number
    quantidade: number
}

interface CarrinhoContextValue {
    itens: ItemCarrinho[]
    adicionar: (item: Omit<ItemCarrinho, 'quantidade'>, quantidade?: number) => void
    atualizarQuantidade: (codigoProduto: number, quantidade: number) => void
    remover: (codigoProduto: number) => void
    limpar: () => void
    total: number
}

const CarrinhoContext = createContext<CarrinhoContextValue | null>(null)

const STORAGE_KEY = 'televendas_carrinho'

function carregarInicial(): ItemCarrinho[] {
    try {
        const salvo = localStorage.getItem(STORAGE_KEY)
        return salvo ? JSON.parse(salvo) : []
    } catch {
        return []
    }
}

export function CarrinhoProvider({ children }: { children: ReactNode }) {
    const [itens, setItens] = useState<ItemCarrinho[]>(carregarInicial)

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(itens))
    }, [itens])

    function adicionar(item: Omit<ItemCarrinho, 'quantidade'>, quantidade = 1) {
        setItens((prev) => {
            const existente = prev.find((i) => i.codigoProduto === item.codigoProduto)
            if (existente) {
                return prev.map((i) =>
                    i.codigoProduto === item.codigoProduto ? { ...i, quantidade: i.quantidade + quantidade } : i
                )
            }
            return [...prev, { ...item, quantidade }]
        })
    }

    function atualizarQuantidade(codigoProduto: number, quantidade: number) {
        if (quantidade <= 0) {
            remover(codigoProduto)
            return
        }
        setItens((prev) => prev.map((i) => (i.codigoProduto === codigoProduto ? { ...i, quantidade } : i)))
    }

    function remover(codigoProduto: number) {
        setItens((prev) => prev.filter((i) => i.codigoProduto !== codigoProduto))
    }

    function limpar() {
        setItens([])
    }

    const total = itens.reduce((soma, item) => soma + item.precoUnitario * item.quantidade, 0)

    return (
        <CarrinhoContext.Provider value={{ itens, adicionar, atualizarQuantidade, remover, limpar, total }}>
            {children}
        </CarrinhoContext.Provider>
    )
}

export function useCarrinho() {
    const ctx = useContext(CarrinhoContext)
    if (!ctx) throw new Error('useCarrinho precisa estar dentro de um CarrinhoProvider')
    return ctx
}
