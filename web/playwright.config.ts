import { defineConfig } from "@playwright/test";

// Testes de tela com a API simulada (tests/api-falsa.ts): não dependem do servidor Java.
export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "http://localhost:4176",
    launchOptions: { executablePath: process.env.PW_CHROMIUM ?? "/opt/pw-browsers/chromium" },
  },
  webServer: {
    command: "npx serve dist -s -l 4176 --no-clipboard",
    url: "http://localhost:4176",
    reuseExistingServer: true,
  },
});
