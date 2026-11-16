/** Aplica a máscara progressivamente enquanto o usuário digita — CPF (11 dígitos) ou CNPJ (14). */
export function maskCpfCnpj(value: string) {
    const digitos = value.replace(/\D/g, '').slice(0, 14)

    if (digitos.length <= 11) {
        return digitos
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }

    return digitos
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/** Aplica a máscara progressivamente enquanto o usuário digita — fixo (10 dígitos) ou celular (11). */
export function maskTelefone(value: string) {
    const digitos = value.replace(/\D/g, '').slice(0, 11)

    if (digitos.length <= 10) {
        return digitos.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2')
    }

    return digitos.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

/**
 * Lê um valor em reais digitado do jeito brasileiro: "200000", "200.000", "200.000,50" ou "R$ 1.234,5".
 * Ponto é separador de milhar e vírgula é decimal. Devolve NaN se não tiver número.
 */
export function parseValorBR(texto: string) {
    const limpo = texto.replace(/[^\d,.]/g, '')
    if (!/\d/.test(limpo)) return NaN
    return Number(limpo.replace(/\./g, '').replace(',', '.'))
}

/** 200000 -> "200.000,00" (sem o "R$", para usar dentro de um campo que já mostra o prefixo). */
export function formatValorBR(valor: number) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
