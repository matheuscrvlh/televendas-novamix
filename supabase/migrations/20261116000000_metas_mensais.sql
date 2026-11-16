-- Meta de faturamento do televendas por mês. Uma linha por mês (sempre o dia 1),
-- cadastrada pela própria usuária do televendas no card "Faturamento total" do Dashboard.
create table televendas.metas_mensais (
    mes date primary key check (extract(day from mes) = 1),
    valor numeric(15, 2) not null check (valor > 0),
    atualizado_em timestamptz not null default now()
);

alter table televendas.metas_mensais enable row level security;
