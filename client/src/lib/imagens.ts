const API_URL = import.meta.env.VITE_API_URL

export function produtoImagemUrl(codigoProduto: number) {
    return `${API_URL}/produtos/${codigoProduto}/imagem`
}

/** Resolve um path público salvo no banco (ex.: /uploads/categorias/xxx.png) pra URL completa. */
export function uploadImagemUrl(path: string) {
    return `${API_URL}${path}`
}
