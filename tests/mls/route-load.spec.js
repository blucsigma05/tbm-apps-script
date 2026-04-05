// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * MLS Route-Load Suite (Q3)
 *
 * Verifies TheBooth loads without fatal JS errors.
 * Requires MLS_BASE_URL env var (MLS is access:MYSELF, not public).
 *
 * Run: MLS_BASE_URL=https://... npx playwright test --project=mls-routes
 */

test('TheBooth loads without errors', async ({ page }) => {
  const baseUrl = process.env.MLS_BASE_URL;
  test.skip(!baseUrl, 'MLS_BASE_URL not configured — skipping MLS tests');

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
  expect(response.status()).toBe(200);

  const body = await page.locator('body').textContent();
  expect(body.trim().length).toBeGreaterThan(0);

  const fatal = errors.filter((e) => {
    return e.indexOf('favicon') === -1 && e.indexOf('404') === -1;
  });
  expect(fatal).toEqual([]);
});
