export interface Categoria {
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
    PRECO_ORIGINAL: number | null
    ESTOQUE: number
}

export interface CategoriaComProdutos extends Categoria {
    produtos: ProdutoCatalogo[]
}

export interface ProdutoRegistrado {
    codigo_produto_ciss: number
    preco_promocional: number | null
    categorias: Categoria[]
    ciss: ProdutoCatalogo | null
}
