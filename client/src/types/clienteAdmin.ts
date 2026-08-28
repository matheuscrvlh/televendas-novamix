export interface ClienteAdmin {
    id: string
    codigo_cliente_ciss: number
    razao_social: string
    email: string
    telefone: string | null
    cpf_cnpj: string | null
    criado_em: string
    pedidos_total: number
    valor_total_pedidos: number
}

export interface PedidoResumoCliente {
    id: string
    status: string
    valor_total: number
    criado_em: string
}
