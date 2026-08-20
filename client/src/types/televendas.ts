export interface VisaoGeral {
    FATURAMENTO_TOTAL: number
    PRODUTOS_VENDIDOS: number
    DEVOLUCOES_VALOR: number
    DEVOLUCOES_PERCENTUAL: number
    CLIENTES_ATIVOS: number
}

export interface ClienteResumo {
    IDCLIFOR: number
    CLIENTE: string
    FLAGINATIVO: string
    TOTAL_COMPRADO: number
    PEDIDOS: number
    TICKET_MEDIO: number
    ULTIMA_COMPRA: string
    DIAS_SEM_COMPRAR: number
}

export interface ClienteSemComprar {
    IDCLIFOR: number
    CLIENTE: string
    TOTAL_COMPRADO: number
    ULTIMA_COMPRA: string
    DIAS_SEM_COMPRAR: number
}

export interface TopCliente {
    CLIENTE: string
    TOTAL: number
    PEDIDOS: number
    TICKET_MEDIO: number
}

export interface TopProduto {
    IDPRODUTO: number
    PRODUTO: string
    TOTAL: number
}
