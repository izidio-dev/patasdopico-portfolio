import { test, expect } from "@playwright/test";
import { apiFalsa } from "./api-falsa";

test("servidor dormindo mostra 'acordando' e depois o login", async ({ page }) => {
  await apiFalsa(page, { saudeFalhaVezes: 2 });
  await page.goto("/");
  await expect(page.getByText("Acordando o servidor")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar como funcionário" })).toBeVisible({ timeout: 15000 });
});

test("login errado mostra a mensagem da API", async ({ page }) => {
  await apiFalsa(page);
  await page.goto("/");
  await page.getByLabel("Usuário").fill("rafael");
  await page.getByLabel("Senha").fill("errada");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Usuário ou senha incorretos.");
});

test("sessão expirada volta para o login com aviso", async ({ page }) => {
  await apiFalsa(page, { tokenExpirado: true });
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar como funcionário" }).click();
  await expect(page.getByRole("alert")).toContainText("Sua sessão expirou");
});
