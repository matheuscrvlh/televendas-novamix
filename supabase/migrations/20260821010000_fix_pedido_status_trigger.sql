-- O trigger original disparava BEFORE INSERT e tentava inserir em pedido_status_historico
-- referenciando NEW.id — mas nesse momento a linha ainda não existe em pedidos, então a FK
-- estourava. Separado em dois: um BEFORE (só ajusta atualizado_em) e um AFTER (grava o histórico,
-- quando a linha já existe de fato).
drop trigger if exists pedidos_status_historico on televendas.pedidos;

drop function if exists televendas.registrar_status_pedido ();

create function televendas.ajustar_atualizado_em () returns trigger as $$
begin
    new.atualizado_em = now();
    return new;
end;
$$ language plpgsql;

create function televendas.registrar_status_pedido () returns trigger as $$
begin
    if tg_op = 'INSERT' or new.status is distinct from old.status then
        insert into televendas.pedido_status_historico (pedido_id, status)
        values (new.id, new.status);
    end if;

    return new;
end;
$$ language plpgsql;

create trigger pedidos_atualizado_em
    before insert or update on televendas.pedidos
    for each row execute function televendas.ajustar_atualizado_em ();

create trigger pedidos_status_historico
    after insert or update on televendas.pedidos
    for each row execute function televendas.registrar_status_pedido ();
