import { defineConfig } from "@playwright/test";

// Dois conjuntos de testes de tela:
// - rede: build normal com a API simulada pela rede (tests/api-falsa.ts) — servidor acordando, erros, sessão;
// - fluxos: build de prévia, com a API simulada dentro da página (src/lib/apiPrevia.ts) — os três painéis.
const chromium = { launchOptions: { executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" } };

export default defineConfig({
  testDir: "./tests",
  projects: [
    { name: "rede", testMatch: /rede\.spec\.ts/, use: { ...chromium, baseURL: "http://localhost:4176" } },
    { name: "fluxos", testMatch: /fluxos\.spec\.ts/, use: { ...chromium, baseURL: "http://localhost:4178" } },
  ],
  webServer: [
    { command: "npx serve dist -s -l 4176 --no-clipboard", url: "http://localhost:4176", reuseExistingServer: true },
    { command: "npx serve dist-previa -s -l 4178 --no-clipboard", url: "http://localhost:4178", reuseExistingServer: true },
  ],
});
