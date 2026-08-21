-- Substitui o modelo "catálogo contém produtos" por "produto tem categorias" (o produto é a
-- entidade primária; categoria é só uma etiqueta que se atribui a ele, podendo ter mais de uma).

create table televendas.categorias (
    id uuid primary key default gen_random_uuid (),
    nome text not null unique,
    criado_em timestamptz not null default now()
);

-- Produto "ativado" na loja de televendas. Preço/descrição/estoque continuam vindo ao vivo do CISS —
-- aqui só guardamos o que é próprio do televendas: o preço promocional (override), quando existir.
create table televendas.produtos (
    codigo_produto_ciss integer primary key,
    preco_promocional numeric(15, 2),
    criado_em timestamptz not null default now()
);

create table televendas.produto_categorias (
    produto_codigo integer not null references televendas.produtos (codigo_produto_ciss) on delete cascade,
    categoria_id uuid not null references televendas.categorias (id) on delete cascade,
    primary key (produto_codigo, categoria_id)
);

create index produto_categorias_categoria_idx on televendas.produto_categorias (categoria_id);

alter table televendas.categorias enable row level security;

alter table televendas.produtos enable row level security;

alter table televendas.produto_categorias enable row level security;

-- Migra o que já existia (catálogo "Padaria" com produtos 264 e 25766) antes de derrubar as tabelas antigas.
insert into televendas.categorias (nome)
select nome
from televendas.catalogos;

insert into televendas.produtos (codigo_produto_ciss)
select distinct codigo_produto_ciss
from televendas.catalogo_produtos
on conflict do nothing;

insert into televendas.produto_categorias (produto_codigo, categoria_id)
select cp.codigo_produto_ciss, c.id
from televendas.catalogo_produtos cp
join televendas.catalogos co on co.id = cp.catalogo_id
join televendas.categorias c on c.nome = co.nome;

drop table televendas.catalogo_produtos;

drop table televendas.catalogos;

alter table televendas.config_vendedores
add column desconto_percentual numeric(5, 2) not null default 0;
