// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * TBM + MLS Playwright Configuration (Q3 Harness)
 *
 * Usage:
 *   TBM_BASE_URL=https://thompsonfams.com npx playwright test --project=tbm-routes
 *   MLS_BASE_URL=https://... npx playwright test --project=mls-routes
 */
export default defineConfig({
  testDir: './tests',
  testIgnore: ['tests/tbm-e2e.spec.js'],
  timeout: 60000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.TBM_BASE_URL || 'https://thompsonfams.com',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },

  projects: [
    // ── TBM Projects ──
    {
      name: 'tbm-routes',
      testDir: './tests/tbm',
      testMatch: 'route-load.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tbm-screenshots',
      testDir: './tests/tbm',
      testMatch: 'screenshots.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'tbm-workflows',
      testDir: './tests/tbm',
      testMatch: 'tbm-e2e-safe.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },

    // ── MLS Projects ──
    {
      name: 'mls-routes',
      testDir: './tests/mls',
      testMatch: 'route-load.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.MLS_BASE_URL || '',
      },
    },

    // ── Full browser matrix ──
    {
      name: 'chromium',
      testDir: './tests/tbm',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testDir: './tests/tbm',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testDir: './tests/tbm',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
