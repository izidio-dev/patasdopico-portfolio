# Patas do Pico — sistema de balcão para pet shop

Sistema completo (backend em **Java + Spring Boot** e frontend em **React**) para a equipe de um
pet shop fictício organizar tutores, pets e a agenda de banho, tosa, vacina e consulta.
Projeto de portfólio com dados fictícios.

**Ver ao vivo:** https://patasdopico-portfolio.brmizidio.workers.dev
(use "Entrar como demonstração" — o servidor gratuito pode levar até 1 minuto para acordar)

**Documentação da API (Swagger):** https://ENDERECO-DA-API/swagger-ui.html

## Funcionalidades

- Login da equipe com token JWT e modo demonstração.
- **Hoje:** atendimentos do dia, concluídos e faturamento do mês; concluir ou cancelar com um clique.
- **Agenda:** navegação por dia e novo atendimento (busca do tutor e escolha do pet).
- **Tutores:** busca por nome sem diferenciar acento ou por telefone, cadastro e edição.
- **Pets:** espécie, porte, raça, idade e observações (alergias, cuidados), com histórico de atendimentos.
- **LGPD:** exportar os dados do tutor (JSON) e excluir o tutor — os atendimentos ficam como
  registro financeiro anônimo.

## Tecnologias

| Parte | Tecnologias |
|---|---|
| `api/` | Java 21, Spring Boot 4 (Web MVC, Data JPA, Validation, Security/JWT), PostgreSQL, Flyway, Swagger, JUnit 5 + MockMvc |
| `web/` | React 19, TypeScript, Vite, Tailwind CSS, React Router, Playwright |
| Publicação | Render (API, Docker), Neon (PostgreSQL), Cloudflare Workers (telas) |

## Testes

```bash
cd api && mvn test                # 25 testes de integração em PostgreSQL embutido
cd web && npm run test:tela       # 11 testes de tela com a API simulada
```

## Rodar no computador

```bash
# API com banco embutido e dados de demonstração (não precisa instalar PostgreSQL)
cd api
mvn -q test-compile exec:java -Dexec.mainClass=br.com.patasdopico.RodarLocal -Dexec.classpathScope=test
```

```bash
# Telas (em outro terminal)
cd web
npm install
npm run dev        # http://localhost:5173
```

Detalhes da API e das variáveis de ambiente em [`api/README.md`](api/README.md).
