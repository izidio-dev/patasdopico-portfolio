# Patas do Pico — sistema de balcão para pet shop

Sistema completo (backend em **Java + Spring Boot** e frontend em **React**) para a equipe de um
pet shop fictício organizar tutores, pets e a agenda de banho, tosa, vacina e consulta.
Projeto de portfólio com dados fictícios.

**Ver ao vivo:** https://patasdopico-portfolio.brmizidio.workers.dev
(use "Entrar como dono", "como funcionário" ou "como cliente" — o servidor gratuito pode levar até 1 minuto para acordar)

**Documentação da API (Swagger):** https://patasdopico-portfolio.onrender.com/swagger-ui.html

## Funcionalidades

Três painéis, cada um vendo só o que pode — o bloqueio é feito na **API** (403), não só escondido na tela.

**Cliente**
- Cria a própria conta (com aceite da Política de Privacidade) e cadastra os pets.
- Agenda online em horário livre, com o preço da tabela; acompanha e cancela os pedidos.
- LGPD: baixa os próprios dados e exclui a conta.

**Funcionário**
- **Hoje** e **Agenda**: confirma pedidos dos clientes, agenda, conclui e cancela atendimentos.
- **Tutores e pets** com busca sem diferenciar acento, histórico e exclusão LGPD do tutor.
- **Serviços**: consulta preços e duração (não altera).

**Dono** (tudo do funcionário, mais)
- **Financeiro**: entradas e saídas, saldo do mês, gastos por categoria e gráfico dos últimos 6 meses.
  Atendimento concluído vira entrada automaticamente.
- **Equipe**: cria funcionários, desativa/reativa acesso e redefine senhas.
- **Serviços**: altera preço e duração.

## Tecnologias

| Parte | Tecnologias |
|---|---|
| `api/` | Java 21, Spring Boot 4 (Web MVC, Data JPA, Validation, Security/JWT), PostgreSQL, Flyway, Swagger, JUnit 5 + MockMvc |
| `web/` | React 19, TypeScript, Vite, Tailwind CSS, React Router, Playwright |
| Publicação | Render (API, Docker), Neon (PostgreSQL), Cloudflare Workers (telas) |

## Testes

```bash
cd api && mvn test                # 44 testes de integração em PostgreSQL embutido
cd web && npm run test:tela       # 14 testes de tela (três painéis) com a API simulada
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
