import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  globalSetup: "./global-setup.ts",
  timeout: 60_000,
  retries: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    trace: "on-first-retry",
    ignoreHTTPSErrors: true,
    navigationTimeout: 45_000,
    actionTimeout: 30_000,
  },
  projects: [
    {
      name: "api",
      testMatch: "api/**/*.test.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "ui",
      testMatch: "ui/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
      workers: 1,
    },
    {
      name: "e2e",
      testMatch: "e2e/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
      workers: 1,
    },
  ],
});
