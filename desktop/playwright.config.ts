import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./__tests__/e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3456",
    headless: true,
  },
  webServer: {
    command: "npm run dev:web",
    port: 3456,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
