import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  // Produção (não `next dev`): o servidor de dev com Turbopack falha o handshake
  // do WebSocket de HMR contra o Chromium do Playwright e cai num loop de reload
  // de página que corrompe o teste no meio do fluxo de login. Build+start evita
  // isso por completo e também é mais fiel ao ambiente real.
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
