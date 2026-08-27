-- Categoria pode ser marcada pro admin destacar como seção própria (com carrossel)
-- na home da loja, com ordem controlável — não é toda categoria que vira seção,
-- só as escolhidas (o resto continua acessível via "compre por categoria"/filtro).
alter table televendas.categorias
add column destaque_home boolean not null default false,
add column ordem_home integer not null default 0;

-- Banners agora têm posição: 'hero' é o carrossel do topo (1920x650, já existia),
-- 'secao' é o banner único exibido entre a área de topo e as seções de categoria
-- em destaque na home (1358x351).
alter table televendas.banners
add column posicao text not null default 'hero'
check (posicao in ('hero', 'secao'));
