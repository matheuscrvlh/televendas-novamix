-- Permite inativar um produto cadastrado (some da vitrine) sem perder o vínculo
-- com categorias nem o preço promocional configurado.
alter table televendas.produtos
add column ativo boolean not null default true;
