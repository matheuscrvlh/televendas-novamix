export interface Catalogo {
    id: string
    nome: string
}

export interface ProdutoBusca {
    CODIGO_PRODUTO: number
    DESCRICAO: string
    SECAO: string | null
}

export interface ProdutoCatalogo extends ProdutoBusca {
    INATIVO: string
    PRECO: number | null
    ESTOQUE: number
}
