export interface PedidoAdminResumo {
    id: string
    status: string
    valor_total: number
    criado_em: string
    atualizado_em: string
    razao_social: string
    email: string
    telefone: string | null
}

export interface PedidoAdminItem {
    codigo_produto: number
    descricao_produto: string
    quantidade: number
    preco_unitario: number
}

export interface PedidoAdminHistorico {
    status: string
    criado_em: string
}

export interface PedidoAdminAlteracao {
    autor: 'cliente' | 'painel'
    tipo: string
    valor_anterior: string | null
    valor_novo: string | null
    motivo: string | null
    criado_em: string
}

export interface PedidoAdminDetalhe {
    id: string
    status: string
    valor_total: number
    observacao: string | null
    criado_em: string
    atualizado_em: string
    cliente_id: string
    razao_social: string
    email: string
    telefone: string | null
    codigo_cliente_ciss: number
    itens: PedidoAdminItem[]
    historico: PedidoAdminHistorico[]
    alteracoes: PedidoAdminAlteracao[]
}

export interface ConfigVendedor {
    codigo_vendedor: number
    valor_minimo_pedido: number
}
