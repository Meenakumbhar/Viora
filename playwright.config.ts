import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000, // dev-mode cold compiles under sequential load can eat into the default 30s budget
  fullyParallel: false, // e2e tests seed/clean up shared DB state — keep sequential to avoid cross-test interference
  forbidOnly: !!process.env.CI,
  // One retry absorbs flakiness from tests that touch real third-party
  // scripts (PayPal's SDK) inside a sandboxed/offline test environment.
  retries: 1,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  // Next.js dev mode compiles each route on first hit — generous enough that
  // a cold compile under sequential multi-file test load doesn't read as a bug.
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
