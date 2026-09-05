import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL, E2E_PORT, TEST_DB_URL } from "./e2e/test-db";

const BASE_URL = E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // Production server on a dedicated port — never collides with the
    // developer's `next dev` on :3000. Rebuild so workspace dist/ is fresh.
    // @cog/db is excluded (unquoted filter — cmd-safe) because its
    // `prisma generate` hits a Windows file lock while `next dev` runs; db
    // dist comes from the regular `pnpm build`.
    command:
      "pnpm --filter @cog/web... --filter !@cog/db build && pnpm --filter @cog/web start",
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      DATABASE_URL: TEST_DB_URL,
      JWT_SECRET: process.env.JWT_SECRET ?? "test-secret-for-e2e-only-32chars!!",
      NODE_ENV: "production",
      PORT: String(E2E_PORT),
    },
  },
});
