-- As metas do mês passam a ter tipo:
--   faturamento       -> meta de faturamento
--   faturamento_super -> supermeta de faturamento (vale depois que a meta é batida)
--   clientes          -> meta de clientes ativos (clientes que compraram no mês)
-- A meta de faturamento já cadastrada vira tipo 'faturamento'.
alter table televendas.metas_mensais
    add column tipo text not null default 'faturamento'
    check (tipo in ('faturamento', 'faturamento_super', 'clientes'));

alter table televendas.metas_mensais drop constraint metas_mensais_pkey;
alter table televendas.metas_mensais add primary key (mes, tipo);
alter table televendas.metas_mensais alter column tipo drop default;
