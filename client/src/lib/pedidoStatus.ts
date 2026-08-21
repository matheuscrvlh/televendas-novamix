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
