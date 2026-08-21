-- Banners de destaque exibidos no topo do site do cliente (posição única, tipo hero).
-- Imagem física fica em disco (server/uploads/banners), aqui só guardamos o path público.
create table televendas.banners (
    id uuid primary key default gen_random_uuid (),
    imagem text not null,
    imagem_mobile text,
    link text,
    ordem integer not null default 0,
    ativo boolean not null default true,
    criado_em timestamptz not null default now()
);

alter table televendas.banners enable row level security;
