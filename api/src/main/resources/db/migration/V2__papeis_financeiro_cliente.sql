-- Papéis de acesso, conta do cliente, tabela de preços e financeiro.

-- Usuários: papel (DONO, FUNCIONARIO, CLIENTE), ativo e, para clientes, o tutor ligado à conta.
ALTER TABLE usuario ADD COLUMN papel VARCHAR(12) NOT NULL DEFAULT 'FUNCIONARIO';
ALTER TABLE usuario ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE usuario ADD COLUMN tutor_id BIGINT UNIQUE REFERENCES tutor (id) ON DELETE CASCADE;
ALTER TABLE usuario ALTER COLUMN login TYPE VARCHAR(120);

-- Preço e duração de cada serviço (o dono altera; clientes veem ao agendar).
CREATE TABLE servico_preco (
    servico         VARCHAR(20) PRIMARY KEY,
    preco_centavos  BIGINT NOT NULL CHECK (preco_centavos >= 0),
    duracao_min     INT    NOT NULL DEFAULT 60
);
INSERT INTO servico_preco (servico, preco_centavos, duracao_min) VALUES
    ('BANHO', 6000, 60), ('TOSA', 7000, 60), ('BANHO_E_TOSA', 11000, 90), ('VACINA', 9000, 30), ('CONSULTA', 15000, 30);

-- Financeiro: entradas e saídas. Atendimento concluído gera entrada automática (atendimento_id).
CREATE TABLE lancamento (
    id              BIGSERIAL PRIMARY KEY,
    tipo            VARCHAR(7)   NOT NULL,
    categoria       VARCHAR(40)  NOT NULL,
    descricao       VARCHAR(200),
    valor_centavos  BIGINT       NOT NULL CHECK (valor_centavos > 0),
    data            DATE         NOT NULL,
    atendimento_id  BIGINT UNIQUE REFERENCES atendimento (id) ON DELETE SET NULL
);
CREATE INDEX idx_lancamento_data ON lancamento (data);

-- Entradas dos atendimentos já concluídos antes desta versão.
INSERT INTO lancamento (tipo, categoria, descricao, valor_centavos, data, atendimento_id)
SELECT 'ENTRADA', 'Serviços', servico, valor_centavos, CAST(data_hora AS DATE), id
FROM atendimento WHERE status = 'CONCLUIDO' AND valor_centavos > 0;
