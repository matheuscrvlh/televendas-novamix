export interface Categoria {
    id: string
    nome: string
    imagem: string | null
    ativo: boolean
    destaque_home: boolean
    ordem_home: number
}

/** Formato enxuto de /cliente/categorias — usado pra navegação (nav do header, links). */
export interface CategoriaNav {
    id: string
    nome: string
    imagem: string | null
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

export interface CategoriaComProdutos extends CategoriaNav {
    destaqueHome: boolean
    ordemHome: number
    produtos: ProdutoCatalogo[]
}

export interface ProdutoRegistrado {
    codigo_produto_ciss: number
    preco_promocional: number | null
    ativo: boolean
    categorias: Categoria[]
    ciss: ProdutoCatalogo | null
}
