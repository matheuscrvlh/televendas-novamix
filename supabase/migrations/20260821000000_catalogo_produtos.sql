alter table televendas.clientes
add column telefone text;

-- Tipos de catálogo (ex.: "Açaí", "Farinha") — cada um agrupa os produtos que
-- fazem sentido pro perfil de cliente daquele segmento.
create table televendas.catalogos (
    id uuid primary key default gen_random_uuid (),
    nome text not null unique,
    criado_em timestamptz not null default now()
);

-- Não guardamos preço/descrição do produto aqui: só a referência ao código no CISS.
-- Toda exibição (preço, estoque, descrição) é buscada ao vivo na hora de listar.
create table televendas.catalogo_produtos (
    id uuid primary key default gen_random_uuid (),
    catalogo_id uuid not null references televendas.catalogos (id) on delete cascade,
    codigo_produto_ciss integer not null,
    criado_em timestamptz not null default now(),
    unique (catalogo_id, codigo_produto_ciss)
);

create index catalogo_produtos_catalogo_id_idx on televendas.catalogo_produtos (catalogo_id);

alter table televendas.catalogos enable row level security;

alter table televendas.catalogo_produtos enable row level security;
