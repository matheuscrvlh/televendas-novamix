create schema if not exists televendas;

-- Config por vendedor: valor mínimo de pedido (tela de configuração do painel).
create table televendas.config_vendedores (
    codigo_vendedor integer primary key,
    valor_minimo_pedido numeric(12, 2) not null default 0,
    criado_em timestamptz not null default now(),
    atualizado_em timestamptz not null default now()
);

-- Conta do cliente na loja. Cadastro próprio (sem Supabase Auth), vinculada ao
-- cadastro de cliente no CISS (é de lá que vem preço, tabela e histórico de compras).
create table televendas.clientes (
    id uuid primary key default gen_random_uuid (),
    codigo_cliente_ciss integer not null unique,
    codigo_vendedor integer not null references televendas.config_vendedores (codigo_vendedor),
    razao_social text not null,
    email text not null unique,
    senha_hash text not null,
    criado_em timestamptz not null default now()
);

create table televendas.pedidos (
    id uuid primary key default gen_random_uuid (),
    cliente_id uuid not null references televendas.clientes (id),
    status text not null default 'enviado' check (
        status in (
            'enviado', -- cliente montou e enviou; ainda editável/cancelável por ele
            'em_analise', -- painel abriu o pedido; edição do cliente trava aqui
            'aguardando_confirmacao_cliente', -- painel alterou algo e propôs mudança
            'confirmado', -- cliente confirmou (ou não houve alteração); segue pro fluxo interno
            'separando',
            'faturado',
            'saiu_para_entrega',
            'entregue',
            'cancelado'
        )
    ),
    valor_total numeric(12, 2) not null default 0,
    observacao text,
    criado_em timestamptz not null default now(),
    atualizado_em timestamptz not null default now()
);

create table televendas.pedido_itens (
    id uuid primary key default gen_random_uuid (),
    pedido_id uuid not null references televendas.pedidos (id) on delete cascade,
    codigo_produto integer not null,
    descricao_produto text not null,
    quantidade numeric(12, 3) not null check (quantidade > 0),
    preco_unitario numeric(12, 2) not null,
    criado_em timestamptz not null default now()
);

-- Timeline de status pro cliente acompanhar a entrega (preenchida automaticamente, ver trigger abaixo).
create table televendas.pedido_status_historico (
    id uuid primary key default gen_random_uuid (),
    pedido_id uuid not null references televendas.pedidos (id) on delete cascade,
    status text not null,
    criado_em timestamptz not null default now()
);

-- Motivo de cada alteração feita no pedido (item removido/alterado, preço ajustado etc.),
-- pra não depender de ninguém lembrar de anotar isso no WhatsApp.
create table televendas.pedido_alteracoes (
    id uuid primary key default gen_random_uuid (),
    pedido_id uuid not null references televendas.pedidos (id) on delete cascade,
    pedido_item_id uuid references televendas.pedido_itens (id) on delete set null,
    autor text not null check (autor in ('cliente', 'painel')),
    tipo text not null,
    valor_anterior text,
    valor_novo text,
    motivo text,
    criado_em timestamptz not null default now()
);

create index pedidos_cliente_id_idx on televendas.pedidos (cliente_id);

create index pedido_itens_pedido_id_idx on televendas.pedido_itens (pedido_id);

create index pedido_status_historico_pedido_id_idx on televendas.pedido_status_historico (pedido_id);

create index pedido_alteracoes_pedido_id_idx on televendas.pedido_alteracoes (pedido_id);

-- Mantém pedidos.atualizado_em em dia e registra toda mudança de status na timeline.
create function televendas.registrar_status_pedido () returns trigger as $$
begin
    new.atualizado_em = now();

    if tg_op = 'INSERT' or new.status is distinct from old.status then
        insert into televendas.pedido_status_historico (pedido_id, status)
        values (new.id, new.status);
    end if;

    return new;
end;
$$ language plpgsql;

create trigger pedidos_status_historico
    before insert or update on televendas.pedidos
    for each row execute function televendas.registrar_status_pedido ();

-- RLS ligado em tudo, sem policy: por enquanto só a service role (usada pelo server Fastify)
-- acessa essas tabelas. Se um dia o client falar direto com o Supabase, criar policies aqui.
alter table televendas.config_vendedores enable row level security;

alter table televendas.clientes enable row level security;

alter table televendas.pedidos enable row level security;

alter table televendas.pedido_itens enable row level security;

alter table televendas.pedido_status_historico enable row level security;

alter table televendas.pedido_alteracoes enable row level security;
