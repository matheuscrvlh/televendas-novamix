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
