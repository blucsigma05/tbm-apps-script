// @ts-check
import { defineConfig, devices } from '@playwright/test';

// Device profiles for perf projects — kept in sync with .claude/launch.json playwright.devices.
// Inlined here to avoid dynamic loading at config-parse time; createRequire/readFileSync in an
// ESM config triggers "exports is not defined" in Playwright's esbuild vm context.
const PERF_DEVICES = {
  'surface-pro-5': {
    viewport: { width: 1368, height: 912 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  },
  'samsung-s10-fe': {
    viewport: { width: 1200, height: 1920 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G770F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  },
};

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

    // ── Perf / frame-budget projects (Issue #360) ──
    {
      name: 'perf-surface-pro5',
      testDir: './tests/tbm',
      testMatch: 'perf-frame-budget.spec.js',
      use: {
        ...PERF_DEVICES['surface-pro-5'],
        trace: 'on',
        video: 'off',
        baseURL: process.env.TBM_BASE_URL || 'https://thompsonfams.com',
      },
    },
    {
      name: 'perf-s10-fe',
      testDir: './tests/tbm',
      testMatch: 'perf-frame-budget.spec.js',
      use: {
        ...PERF_DEVICES['samsung-s10-fe'],
        trace: 'on',
        video: 'off',
        baseURL: process.env.TBM_BASE_URL || 'https://thompsonfams.com',
      },
    },
  ],
});
