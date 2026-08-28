-- CPF/CNPJ do cliente, coletado no cadastro (antes só era usado pra localizar o
-- cadastro no CISS e descartado). Guardado criptografado (AES-256-GCM, app-level),
-- igual telefone — por isso não dá pra ter UNIQUE aqui (o ciphertext muda a cada gravação).
alter table televendas.clientes
add column cpf_cnpj text;
