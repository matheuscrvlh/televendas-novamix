export interface ClienteInfo {
    id: string
    razaoSocial: string
    email: string
    telefone: string | null
}

export interface PedidoResumo {
    id: string
    status: string
    valor_total: number
    criado_em: string
    atualizado_em: string
}

export interface PedidoItem {
    codigo_produto: number
    descricao_produto: string
    quantidade: number
    preco_unitario: number
}

export interface PedidoStatusHistorico {
    status: string
    criado_em: string
}

export interface PedidoDetalhe extends PedidoResumo {
    observacao: string | null
    itens: PedidoItem[]
    historico: PedidoStatusHistorico[]
}
