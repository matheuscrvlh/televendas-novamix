export interface VisaoGeral {
    FATURAMENTO_TOTAL: number
    PRODUTOS_VENDIDOS: number
    DEVOLUCOES_VALOR: number
    DEVOLUCOES_PERCENTUAL: number
    CLIENTES_ATIVOS: number
    /** Lucro das vendas menos o das devoluções (VALLUCRO do CISS). */
    LUCRO_LIQUIDO: number
    /** Lucro líquido ÷ (faturamento - devoluções). null se não houve faturamento. -0.05 = -5%. */
    MARGEM_PERCENTUAL: number | null
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
    IDCLIFOR: number
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

/** Um produto dentro de uma compra do cliente (já somado se apareceu em mais de uma linha). */
export interface ItemCompradoCliente {
    IDEMPRESA: number
    IDPLANILHA: number
    DTMOVIMENTO: string
    IDSUBPRODUTO: number
    PRODUTO: string
    QUANTIDADE: number
    TOTAL: number
}

export interface ProdutoHistoricoCliente {
    IDSUBPRODUTO: number
    PRODUTO: string
    /** Em quantas compras diferentes o produto apareceu. */
    VEZES: number
    QUANTIDADE: number
    TOTAL: number
    ULTIMA_COMPRA: string
}

export interface PedidoHistoricoCliente {
    IDEMPRESA: number
    IDPLANILHA: number
    DTMOVIMENTO: string
    ITENS: number
    TOTAL: number
}

export interface HistoricoCliente {
    produtos: ProdutoHistoricoCliente[]
    pedidos: PedidoHistoricoCliente[]
}

/** faturamento = meta, faturamento_super = supermeta (vale depois que a meta é batida), clientes = clientes ativos no mês. */
export type TipoMeta = 'faturamento' | 'faturamento_super' | 'clientes'

export type Metas = Record<TipoMeta, number | null>

/** Metas do mês e o realizado no mês inteiro (não depende do filtro de datas). */
export interface MetasMes {
    mes: string
    metas: Metas
    realizado: { faturamento: number; clientes: number }
}
