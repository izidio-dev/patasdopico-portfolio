import { test, expect, type Page } from "@playwright/test";
import { apiFalsa } from "./api-falsa";

async function entrarDemo(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar como demonstração" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Hoje" })).toBeVisible();
}

test("servidor dormindo mostra 'acordando' e depois o login", async ({ page }) => {
  await apiFalsa(page, { saudeFalhaVezes: 2 });
  await page.goto("/");
  await expect(page.getByText("Acordando o servidor")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar como demonstração" })).toBeVisible({ timeout: 15000 });
});

test("login errado mostra a mensagem da API", async ({ page }) => {
  await apiFalsa(page);
  await page.goto("/");
  await page.getByLabel("Usuário").fill("rafael");
  await page.getByLabel("Senha").fill("errada");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Usuário ou senha incorretos.");
});

test("tela Hoje mostra números e permite concluir atendimento", async ({ page }) => {
  await apiFalsa(page);
  await entrarDemo(page);
  await expect(page.getByTestId("faturamento")).toHaveText("R$ 4.820,00");
  const linha = page.getByRole("listitem").filter({ hasText: "Paçoca" }).first();
  await linha.getByRole("button", { name: "Concluir" }).click();
  await expect(linha).toContainText("Concluído");
});

test("buscar tutor sem acento", async ({ page }) => {
  await apiFalsa(page);
  await entrarDemo(page);
  await page.getByRole("link", { name: "Tutores" }).first().click();
  await page.getByLabel("Buscar por nome ou telefone").fill("bruno henrique");
  await expect(page.getByRole("link", { name: /Bruno Henrique Lopes/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Ana Beatriz/ })).toHaveCount(0);
});

test("novo tutor com telefone inválido mostra erro no campo", async ({ page }) => {
  await apiFalsa(page);
  await entrarDemo(page);
  await page.getByRole("link", { name: "Tutores" }).first().click();
  await page.getByRole("button", { name: "Novo tutor" }).click();
  const form = page.getByRole("dialog", { name: "Novo tutor" });
  await form.getByLabel("Nome").fill("Carla");
  await form.getByLabel("Telefone").fill("123");
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(form.getByText("Telefone precisa ter DDD + número")).toBeVisible();
  await form.getByLabel("Telefone").fill("(11) 98888-7777");
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Carla" })).toBeVisible();
});

test("cadastrar pet no tutor", async ({ page }) => {
  await apiFalsa(page);
  await entrarDemo(page);
  await page.goto("/tutores/2");
  await page.getByRole("button", { name: "Adicionar pet" }).click();
  const form = page.getByRole("dialog", { name: "Novo pet" });
  await form.getByLabel("Nome do pet").fill("Fubá");
  await form.getByLabel("Espécie").selectOption("CAO");
  await form.getByLabel("Porte").selectOption("PEQUENO");
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("region", { name: "Pets" })).toContainText("Fubá");
});

test("excluir tutor explica a LGPD e pede confirmação", async ({ page }) => {
  await apiFalsa(page);
  await entrarDemo(page);
  await page.goto("/tutores/2");
  await page.getByRole("button", { name: "Excluir tutor" }).click();
  await expect(page.getByText("registro financeiro anônimo")).toBeVisible();
  await page.getByRole("button", { name: "Sim, excluir dados" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Tutores" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Bruno Henrique Lopes/ })).toHaveCount(0);
});

test("exportar dados do tutor baixa um arquivo", async ({ page }) => {
  await apiFalsa(page);
  await entrarDemo(page);
  await page.goto("/tutores/1");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exportar dados (LGPD)" }).click()]);
  expect(download.suggestedFilename()).toMatch(/tutor-1.*\.json/);
});

test("agendar atendimento pela agenda", async ({ page }) => {
  await apiFalsa(page);
  await entrarDemo(page);
  await page.getByRole("link", { name: "Agenda" }).first().click();
  await page.getByRole("button", { name: "Novo atendimento" }).click();
  const form = page.getByRole("dialog", { name: "Novo atendimento" });
  await form.getByLabel("Buscar tutor").fill("ana");
  await form.getByRole("button", { name: /Paçoca/ }).click();
  await form.getByLabel("Serviço").selectOption("TOSA");
  await form.getByLabel("Horário").fill("16:00");
  await form.getByLabel("Valor (R$)").fill("70,00");
  await form.getByRole("button", { name: "Agendar" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "Tosa" })).toContainText("Paçoca");
});

test("sessão expirada volta para o login com aviso", async ({ page }) => {
  await apiFalsa(page, { tokenExpirado: true });
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar como demonstração" }).click();
  await expect(page.getByRole("alert")).toContainText("Sua sessão expirou");
});

test("celular 360px sem rolagem lateral", async ({ page }) => {
  await apiFalsa(page);
  await page.setViewportSize({ width: 360, height: 740 });
  await entrarDemo(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
