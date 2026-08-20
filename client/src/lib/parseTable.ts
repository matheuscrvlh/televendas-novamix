export type ParsedTable = {
    colunas: string[]
    linhas: Record<string, string>[]
}

/**
 * Cola vinda do grid do DBeaver (Ctrl+A, Ctrl+C) costuma vir separada por tab;
 * cola vinda de CSV exportado vem por vírgula ou ponto-e-vírgula. Detecta pelo
 * cabeçalho para não depender do usuário escolher o formato certo.
 */
export function parseTable(texto: string): ParsedTable {
    const linhasTexto = texto
        .split(/\r?\n/)
        .map((linha) => linha.trim())
        .filter((linha) => linha.length > 0)

    if (linhasTexto.length === 0) return { colunas: [], linhas: [] }

    const cabecalho = linhasTexto[0]
    const separador = cabecalho.includes('\t') ? '\t' : cabecalho.includes(';') ? ';' : ','

    const colunas = cabecalho.split(separador).map((col) => col.trim())
    const linhas = linhasTexto.slice(1).map((linha) => {
        const valores = linha.split(separador).map((valor) => valor.trim())
        const registro: Record<string, string> = {}
        colunas.forEach((coluna, indice) => {
            registro[coluna] = valores[indice] ?? ''
        })
        return registro
    })

    return { colunas, linhas }
}

export function numero(valor: string | undefined) {
    if (!valor) return 0
    const limpo = valor.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
    const num = parseFloat(limpo)
    return Number.isNaN(num) ? 0 : num
}
