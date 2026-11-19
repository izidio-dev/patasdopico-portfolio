-- Esquema inicial do Patas do Pico.
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE usuario (
    id          BIGSERIAL PRIMARY KEY,
    nome        VARCHAR(80)  NOT NULL,
    login       VARCHAR(40)  NOT NULL UNIQUE,
    senha_hash  VARCHAR(100) NOT NULL
);

CREATE TABLE tutor (
    id           BIGSERIAL PRIMARY KEY,
    nome         VARCHAR(100) NOT NULL,
    telefone     VARCHAR(11)  NOT NULL,
    email        VARCHAR(120),
    observacoes  VARCHAR(500),
    criado_em    TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE INDEX idx_tutor_telefone ON tutor (telefone);

CREATE TABLE pet (
    id           BIGSERIAL PRIMARY KEY,
    tutor_id     BIGINT       NOT NULL REFERENCES tutor (id) ON DELETE CASCADE,
    nome         VARCHAR(60)  NOT NULL,
    especie      VARCHAR(10)  NOT NULL,
    raca         VARCHAR(60),
    porte        VARCHAR(10)  NOT NULL,
    nascimento   DATE,
    observacoes  VARCHAR(500)
);
CREATE INDEX idx_pet_tutor ON pet (tutor_id);

-- pet_id fica NULL quando o tutor é excluído (LGPD): o atendimento vira registro anônimo.
CREATE TABLE atendimento (
    id               BIGSERIAL PRIMARY KEY,
    pet_id           BIGINT REFERENCES pet (id) ON DELETE SET NULL,
    servico          VARCHAR(20)  NOT NULL,
    data_hora        TIMESTAMP    NOT NULL,
    valor_centavos   BIGINT       NOT NULL CHECK (valor_centavos >= 0),
    status           VARCHAR(12)  NOT NULL,
    observacoes      VARCHAR(500)
);
CREATE INDEX idx_atendimento_data ON atendimento (data_hora);
