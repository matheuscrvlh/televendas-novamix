export type ClienteStatus = 'ativo' | 'atencao' | 'inativo'

const LIMITE_ATIVO_DIAS = 30
const LIMITE_ATENCAO_DIAS = 90

/**
 * Classificação por recência de compra. Limiares (30/90 dias) são um ponto de partida
 * razoável, não uma regra vinda do CISS - ajuste aqui quando o time de televendas
 * definir a régua oficial.
 */
export function classificarCliente(diasSemComprar: number, flagInativo: string): ClienteStatus {
    if (flagInativo === 'T') return 'inativo'
    if (diasSemComprar <= LIMITE_ATIVO_DIAS) return 'ativo'
    if (diasSemComprar <= LIMITE_ATENCAO_DIAS) return 'atencao'
    return 'inativo'
}
