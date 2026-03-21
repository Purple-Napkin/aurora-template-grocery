import { defineConfig, devices } from "@playwright/test";

/**
 * Demo scenario E2E tests for Holmes adaptive storefront.
 * Requires: aurora-hippo-grocery running (pnpm dev) and NEXT_PUBLIC_AURORA_API_URL pointing to a running Aurora API.
 *
 * Run: pnpm test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3001",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
