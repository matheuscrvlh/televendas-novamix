export const PEDIDO_STATUS_LABEL: Record<string, string> = {
    enviado: 'Enviado',
    em_analise: 'Em análise',
    aguardando_confirmacao_cliente: 'Aguardando sua confirmação',
    confirmado: 'Confirmado',
    separando: 'Separando',
    faturado: 'Faturado',
    saiu_para_entrega: 'Saiu para entrega',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
}

export function pedidoStatusLabel(status: string) {
    return PEDIDO_STATUS_LABEL[status] ?? status
}

const PEDIDO_STATUS_COR: Record<string, string> = {
    enviado: 'bg-blue-base/10 text-blue-base',
    em_analise: 'bg-gold/10 text-gold',
    aguardando_confirmacao_cliente: 'bg-orange-base/10 text-orange-base',
    confirmado: 'bg-green-base/10 text-green-base',
    separando: 'bg-blue-base/10 text-blue-base',
    faturado: 'bg-green-base/10 text-green-base',
    saiu_para_entrega: 'bg-orange-base/10 text-orange-base',
    entregue: 'bg-green-base/10 text-green-base',
    cancelado: 'bg-red-base/10 text-red-base',
}

export function pedidoStatusCor(status: string) {
    return PEDIDO_STATUS_COR[status] ?? 'bg-gray-base/10 text-gray-dark'
}

const PEDIDO_STATUS_DOT_COR: Record<string, string> = {
    enviado: 'bg-blue-base',
    em_analise: 'bg-gold',
    aguardando_confirmacao_cliente: 'bg-orange-base',
    confirmado: 'bg-green-base',
    separando: 'bg-blue-base',
    faturado: 'bg-green-base',
    saiu_para_entrega: 'bg-orange-base',
    entregue: 'bg-green-base',
    cancelado: 'bg-red-base',
}

export function pedidoStatusDotCor(status: string) {
    return PEDIDO_STATUS_DOT_COR[status] ?? 'bg-gray-dark'
}
