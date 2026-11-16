// Chaves para ligar/desligar telas inteiras sem apagar o código.

/**
 * Aba "Pedidos" do painel admin (/dashboard/pedidos e o detalhe de cada pedido).
 * Desligada por enquanto porque não está sendo usada: some do menu e o endereço volta pro Dashboard.
 * Para religar, troque para true.
 */
export const PEDIDOS_ADMIN_ATIVO = false

/**
 * Aba "Clientes" do painel admin (/dashboard/clientes: clientes cadastrados na loja online).
 * Desligada por enquanto: some do menu e o endereço volta pro Dashboard. Para religar, troque para true.
 * Não afeta o painel de clientes do Dashboard de televendas.
 */
export const CLIENTES_ADMIN_ATIVO = false
