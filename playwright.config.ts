import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.E2E_BASE_URL;
const baseURL = externalBaseUrl ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  use: { baseURL, trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "pnpm dev --port 3000",
        url: "http://127.0.0.1:3000/login",
        reuseExistingServer: true,
        timeout: 120_000,
        env: { AUTH_SECRET: "playwright-local-secret-for-xiangkeban" },
      },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
});
