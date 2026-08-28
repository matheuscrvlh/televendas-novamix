-- Configurações gerais da loja (hoje só o texto da faixa no topo do header).
-- Uma linha só, editável pelo admin em Configurações — sem precisar de deploy pra mudar o texto.
create table televendas.config_loja (
    id uuid primary key default gen_random_uuid (),
    texto_topo text not null default 'Venda exclusiva para clientes cadastrados Novamix',
    atualizado_em timestamptz not null default now()
);

insert into televendas.config_loja (texto_topo) values ('Venda exclusiva para clientes cadastrados Novamix');

alter table televendas.config_loja enable row level security;
