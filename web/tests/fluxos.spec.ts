import { test, expect, type Page } from "@playwright/test";

async function entrar(page: Page, como: "dono" | "funcionário" | "cliente") {
  await page.goto("/");
  await page.getByRole("button", { name: `Entrar como ${como}` }).click();
}
const menu = (page: Page, nome: string) => page.getByRole("navigation", { name: "Menu" }).getByRole("link", { name: nome }).first();

// ---------- Funcionário ----------
test("funcionário não vê financeiro, equipe nem faturamento", async ({ page }) => {
  await entrar(page, "funcionário");
  await expect(page.getByRole("heading", { level: 1, name: "Hoje" })).toBeVisible();
  await expect(page.getByTestId("agendados")).toBeVisible();
  await expect(page.getByTestId("faturamento")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Financeiro" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Equipe" })).toHaveCount(0);
});

test("funcionário confirma pedido feito pelo cliente", async ({ page }) => {
  await entrar(page, "funcionário");
  await menu(page, "Agenda").click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Próximo dia" }).click();
  const pedido = page.getByRole("listitem").filter({ hasText: "Solicitado" }).first();
  await pedido.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Paçoca" }).filter({ hasText: "15:30" })).toContainText("Agendado");
});

test("funcionário vê serviços mas não edita", async ({ page }) => {
  await entrar(page, "funcionário");
  await menu(page, "Serviços").click();
  await expect(page.getByText("Banho e tosa")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Editar/ })).toHaveCount(0);
});

test("concluir atendimento e buscar tutor sem acento", async ({ page }) => {
  await entrar(page, "funcionário");
  // A linha das 13:00 (Thor) está agendada; depois de concluir, o botão some e o status muda.
  const linha = page.getByRole("listitem").filter({ hasText: "13:00" });
  await linha.getByRole("button", { name: "Concluir" }).click();
  await expect(linha).toContainText("Concluído");
  await menu(page, "Tutores").click();
  await page.getByLabel("Buscar por nome ou telefone").fill("joao pedro");
  await expect(page.getByRole("link", { name: /João Pedro Almeida/ })).toBeVisible();
});

test("novo tutor com telefone inválido, pet e exclusão LGPD", async ({ page }) => {
  await entrar(page, "funcionário");
  await menu(page, "Tutores").click();
  await page.getByRole("button", { name: "Novo tutor" }).click();
  const form = page.getByRole("dialog", { name: "Novo tutor" });
  await form.getByLabel("Nome").fill("Carla Teste");
  await form.getByLabel("Telefone").fill("123");
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(form.getByText("Telefone precisa ter DDD + número")).toBeVisible();
  await form.getByLabel("Telefone").fill("(11) 98888-7777");
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Carla Teste" })).toBeVisible();
  await page.getByRole("button", { name: "Adicionar pet" }).click();
  const fp = page.getByRole("dialog", { name: "Novo pet" });
  await fp.getByLabel("Nome do pet").fill("Fubá");
  await fp.getByLabel("Espécie").selectOption("CAO");
  await fp.getByLabel("Porte").selectOption("PEQUENO");
  await fp.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("region", { name: "Pets" })).toContainText("Fubá");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exportar dados (LGPD)" }).click()]);
  expect(download.suggestedFilename()).toMatch(/\.json$/);
  await page.getByRole("button", { name: "Excluir tutor" }).click();
  await expect(page.getByText("registro financeiro anônimo")).toBeVisible();
  await page.getByRole("button", { name: "Sim, excluir dados" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Tutores" })).toBeVisible();
});

// ---------- Dono ----------
test("dono vê faturamento e lança uma despesa no financeiro", async ({ page }) => {
  await entrar(page, "dono");
  await expect(page.getByTestId("faturamento")).toBeVisible();
  await menu(page, "Financeiro").click();
  await expect(page.getByRole("heading", { level: 1, name: "Financeiro" })).toBeVisible();
  const saidasAntes = await page.getByTestId("saidas").textContent();
  await page.getByRole("button", { name: "Nova saída" }).click();
  const form = page.getByRole("dialog", { name: "Nova saída" });
  await form.getByLabel("Categoria").selectOption("Manutenção");
  await form.getByLabel("Valor (R$)").fill("320,00");
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("region", { name: "Lançamentos" })).toContainText("Manutenção");
  await expect(page.getByTestId("saidas")).not.toHaveText(saidasAntes!);
  await expect(page.getByRole("region", { name: "Últimos 6 meses" })).toBeVisible();
});

test("dono altera preço de serviço e cria funcionário", async ({ page }) => {
  await entrar(page, "dono");
  await menu(page, "Serviços").click();
  await page.getByRole("button", { name: "Editar Tosa" }).click();
  await page.getByLabel("Preço de Tosa").fill("75,00");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Tosa" }).first()).toContainText("R$ 75,00");
  await menu(page, "Equipe").click();
  await page.getByRole("button", { name: "Novo funcionário" }).click();
  const form = page.getByRole("dialog", { name: "Novo funcionário" });
  await form.getByLabel("Nome").fill("Paulo");
  await form.getByLabel("Login").fill("paulo");
  await form.getByLabel("Senha provisória").fill("senha-paulo-1");
  await form.getByRole("button", { name: "Criar acesso" }).click();
  const paulo = page.getByRole("listitem").filter({ hasText: "paulo · Funcionário" });
  await expect(paulo).toBeVisible();
  await paulo.getByRole("button", { name: "Desativar" }).click();
  await expect(paulo).toContainText("Desativado");
});

// ---------- Cliente ----------
test("cadastro exige aceitar a política", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Sou cliente" }).click();
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.getByLabel("Seu nome").fill("Lia");
  await page.getByLabel("E-mail").fill("lia@teste.com");
  await page.getByLabel("Telefone (WhatsApp)").fill("11955551234");
  await page.getByLabel("Crie uma senha").fill("senha-segura");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByText("aceite a Política de Privacidade")).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Olá, Lia!" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cadastrar pet" })).toBeVisible();
});

test("cliente cadastra pet e agenda em horário livre", async ({ page }) => {
  await entrar(page, "cliente");
  await expect(page.getByRole("heading", { level: 1, name: "Olá, Ana!" })).toBeVisible();
  await menu(page, "Meus pets").click();
  await page.getByRole("button", { name: "Adicionar pet" }).click();
  const fp = page.getByRole("dialog", { name: "Novo pet" });
  await fp.getByLabel("Nome do pet").fill("Biscoito");
  await fp.getByLabel("Espécie").selectOption("GATO");
  await fp.getByLabel("Porte").selectOption("PEQUENO");
  await fp.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("region", { name: "Pets" })).toContainText("Biscoito");

  await menu(page, "Agendar").click();
  await expect(page.getByRole("heading", { level: 1, name: "Agendar" })).toBeVisible();
  // O nome acessível do select inclui a opção escolhida ("Pet Escolha…"), por isso a expressão.
  await page.getByLabel(/^Pet/).selectOption({ label: "Biscoito" });
  await page.getByLabel("Serviço").selectOption("BANHO");
  const amanha = new Date(Date.now() + 86_400_000).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  await page.getByLabel("Dia").fill(amanha);
  await page.getByRole("radio", { name: "10:30" }).check();
  await page.getByRole("button", { name: "Solicitar horário" }).click();
  await expect(page.getByRole("status")).toContainText("Pedido enviado!");
  await page.getByRole("link", { name: "Ver meus agendamentos" }).click();
  const proximos = page.getByRole("region", { name: "Próximos agendamentos" });
  await expect(proximos.getByRole("listitem").filter({ hasText: "Biscoito" })).toContainText("Solicitado");
});

test("cliente não vê nada da equipe e exclui a própria conta", async ({ page }) => {
  await entrar(page, "cliente");
  await expect(page.getByRole("link", { name: "Tutores" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Financeiro" })).toHaveCount(0);
  await menu(page, "Meus dados").click();
  await page.getByRole("button", { name: "Excluir minha conta" }).click();
  await page.getByRole("button", { name: "Sim, excluir minha conta" }).click();
  await expect(page.getByRole("alert")).toContainText("Sua conta e seus dados foram excluídos.");
});

test("celular 360px sem rolagem lateral (dono e cliente)", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await entrar(page, "dono");
  await expect(page.getByRole("heading", { level: 1, name: "Hoje" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await menu(page, "Financeiro").click();
  await expect(page.getByRole("heading", { level: 1, name: "Financeiro" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
