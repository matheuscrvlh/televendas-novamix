-- Ícone circular da categoria na vitrine ("Compre por categoria"), estilo e-commerce.
alter table televendas.categorias
add column imagem text;

-- Lista de desejos do cliente. Igual carrinho de compra, mas persistida no servidor
-- (não em localStorage) porque faz sentido acompanhar o cliente entre dispositivos.
create table televendas.favoritos (
    id uuid primary key default gen_random_uuid (),
    cliente_id uuid not null references televendas.clientes (id) on delete cascade,
    codigo_produto integer not null,
    criado_em timestamptz not null default now(),
    unique (cliente_id, codigo_produto)
);

create index favoritos_cliente_id_idx on televendas.favoritos (cliente_id);

alter table televendas.favoritos enable row level security;
