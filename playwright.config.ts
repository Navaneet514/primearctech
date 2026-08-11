import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node node_modules/vinext/dist/cli.js start --port 4173",
    url: "http://127.0.0.1:4173",
    env: {
      ...process.env,
      DEMO_SESSION_SECRET: "playwright-demo-session-secret-not-for-production",
      DEMO_PROVIDER: "sandbox",
      PITCH_ACCESS_SECRET: "playwright-pitch-access-secret",
    },
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
});
