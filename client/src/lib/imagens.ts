const API_URL = import.meta.env.VITE_API_URL

export function produtoImagemUrl(codigoProduto: number) {
    return `${API_URL}/catalogo/produtos/${codigoProduto}/imagem`
}
