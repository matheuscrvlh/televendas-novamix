-- Permite inativar uma categoria (some da vitrine e do "compre por categoria")
-- sem precisar excluir o cadastro nem os produtos vinculados a ela.
alter table televendas.categorias
add column ativo boolean not null default true;
