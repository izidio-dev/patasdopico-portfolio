# Patas do Pico — API do sistema de pet shop

API REST em **Java 21 + Spring Boot** para o balcão de um pet shop fictício (projeto de portfólio).

**Documentação interativa (Swagger):** https://patasdopico-portfolio.onrender.com/swagger-ui.html
— chame `POST /api/auth/demo?papel=DONO` (ou `FUNCIONARIO`, `CLIENTE`), copie o token e clique em **Authorize**.

## O que faz

- **Login com papéis** (JWT): `DONO`, `FUNCIONARIO` e `CLIENTE`, com regras de acesso no Spring Security.
- **Cadastro do cliente**, área do cliente (pets, horários livres, pedidos, cancelamento, LGPD).
- **Financeiro** (só dono): entradas e saídas, saldo, categorias, últimos 6 meses; atendimento concluído gera entrada.
- **Equipe** (só dono) e **tabela de serviços** (preço editável só pelo dono).
- **Tutores**: cadastro, edição e busca por nome (sem diferenciar acento) ou telefone, com paginação.
- **Pets** de cada tutor: espécie, raça, porte, nascimento e observações.
- **Atendimentos**: banho, tosa, banho e tosa, vacina e consulta, com status
  (agendado → concluído | cancelado) e regras de transição.
- **Resumo**: atendimentos do dia, faturamento do mês e próximos agendamentos.
- **LGPD**: exportar os dados de um tutor e excluir o tutor — os atendimentos ficam como
  registro financeiro anônimo.

## Tecnologias

Java 21 · Spring Boot 4 (Web MVC, Data JPA, Validation, Security, OAuth2 Resource Server/JWT) ·
PostgreSQL · Flyway · springdoc-openapi (Swagger) · JUnit 5 + MockMvc · Docker.

## Como rodar

Precisa de Java 21, Maven e um PostgreSQL.

```bash
export DATABASE_URL=jdbc:postgresql://localhost:5432/petshop
export DATABASE_USER=petshop
export DATABASE_PASSWORD=petshop
export JWT_SEGREDO=troque-por-um-texto-aleatorio-com-32-caracteres
export DEMO_RESET=true
mvn spring-boot:run
```

## Testes

```bash
mvn test
```

Os testes sobem um **PostgreSQL de verdade embutido** (sem Docker) e rodam as migrações do Flyway.

## Variáveis de ambiente

| Variável | Para que serve |
|---|---|
| `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD` | Conexão com o PostgreSQL |
| `JWT_SEGREDO` | Segredo que assina os tokens (32+ caracteres) |
| `FRONTEND_URL` | Endereço da tela autorizado a chamar a API (CORS) |
| `DEMO_RESET` | `true` recria os dados fictícios a cada inicialização |
| `ADMIN_LOGIN`, `ADMIN_SENHA` | Opcional: cria/atualiza o login do dono |
| `CADASTRO_CLIENTE_ATIVO` | `false` desliga o cadastro de clientes pelo site (padrão `true`) |

## Organização

```
src/main/java/br/com/patasdopico/
  auth/         login, cadastro, papéis, token JWT e configuração de segurança
  cliente/      área do cliente (pets, horários livres, pedidos, LGPD)
  financeiro/   entradas, saídas e resumo do mês (só dono)
  equipe/       funcionários (só dono)
  servico/      tabela de preços e duração
  tutor/        cadastro, busca, exportação e exclusão (LGPD)
  pet/          pets de cada tutor
  atendimento/  agenda e status dos atendimentos
  resumo/       números do dia e do mês
  demo/         dados fictícios da demonstração
  comum/        erros em JSON, paginação, fuso horário, Swagger
src/main/resources/db/migration/   versões do banco (Flyway)
```
