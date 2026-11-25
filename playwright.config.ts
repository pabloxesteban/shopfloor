import { defineConfig, devices } from "@playwright/test";

const PORT = 3200;

/**
 * E2E runs against the production build (`pnpm build` first). The in-memory
 * data is shared by all tests in a run, so tests run one at a time and each
 * one picks the orders it needs instead of assuming fixed ids.
 */
export default defineConfig({
  testDir: "./e2e",
  testIgnore: "**/screenshots.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}/orders`,
    reuseExistingServer: false,
    timeout: 60_000,
    // Always demo mode in tests: no key, no network calls to the model.
    env: { GEMINI_API_KEY: "" },
  },
});
