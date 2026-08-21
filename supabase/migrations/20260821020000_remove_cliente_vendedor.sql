-- Só existe 1 vendedor de televendas hoje, então o vínculo cliente -> vendedor
-- era complexidade sem uso. config_vendedores continua existindo (é a config
-- de valor mínimo de pedido, agora só não depende mais do cadastro do cliente).
alter table televendas.clientes
drop column codigo_vendedor;
