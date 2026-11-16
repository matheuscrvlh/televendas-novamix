export type DatePreset = 'hoje' | 'ontem' | 'semana' | 'mes'

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
    { id: 'hoje', label: 'Hoje' },
    { id: 'ontem', label: 'Ontem' },
    { id: 'semana', label: 'Essa semana' },
    { id: 'mes', label: 'Esse mês' },
]

function toISODate(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function startOfWeek(date: Date) {
    const result = new Date(date)
    const diffToMonday = result.getDay() === 0 ? 6 : result.getDay() - 1
    result.setDate(result.getDate() - diffToMonday)
    return result
}

function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function getPresetRange(preset: DatePreset): { inicio: string; fim: string } {
    const hoje = new Date()

    switch (preset) {
        case 'hoje':
            return { inicio: toISODate(hoje), fim: toISODate(hoje) }
        case 'ontem': {
            const ontem = new Date(hoje)
            ontem.setDate(hoje.getDate() - 1)
            return { inicio: toISODate(ontem), fim: toISODate(ontem) }
        }
        case 'semana':
            return { inicio: toISODate(startOfWeek(hoje)), fim: toISODate(hoje) }
        case 'mes':
            return { inicio: toISODate(startOfMonth(hoje)), fim: toISODate(hoje) }
    }
}

/** "2026-11" -> "novembro" (ou "novembro/2025" se não for o ano atual). */
export function nomeDoMes(mes: string) {
    const [ano, numeroMes] = mes.split('-').map(Number)
    const nome = new Date(ano, numeroMes - 1, 1).toLocaleString('pt-BR', { month: 'long' })
    return ano === new Date().getFullYear() ? nome : `${nome}/${ano}`
}
