// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * TBM Route-Load Suite (Q3)
 *
 * Verifies every CF worker route loads without fatal errors.
 * Derived from cloudflare-worker.js PATH_ROUTES.
 *
 * Run: TBM_BASE_URL=https://thompsonfams.com npx playwright test --project=tbm-routes
 */

// All clean routes from cloudflare-worker.js
const ROUTES = [
  { path: '/', name: 'Front Door' },
  { path: '/buggsy', name: 'Buggsy Board' },
  { path: '/jj', name: 'JJ Board' },
  { path: '/parent', name: 'Parent Dashboard' },
  { path: '/pulse', name: 'ThePulse', pin: true },
  { path: '/vein', name: 'TheVein', pin: true },
  { path: '/spine', name: 'TheSpine' },
  { path: '/soul', name: 'TheSoul' },
  { path: '/vault', name: 'Vault' },
  { path: '/homework', name: 'Homework Module' },
  { path: '/sparkle', name: 'SparkleLearn' },
  { path: '/sparkle-free', name: 'Sparkle Free Play' },
  { path: '/wolfkid', name: 'Wolfkid CER' },
  { path: '/wolfdome', name: 'Wolfdome Home' },
  { path: '/sparkle-kingdom', name: 'Sparkle Kingdom Home' },
  { path: '/facts', name: 'Fact Sprint' },
  { path: '/reading', name: 'Reading Module' },
  { path: '/writing', name: 'Writing Module' },
  { path: '/story-library', name: 'Story Library' },
  { path: '/comic-studio', name: 'Comic Studio' },
  { path: '/progress', name: 'Progress Report' },
  { path: '/story', name: 'Story Reader' },
  { path: '/investigation', name: 'Investigation Module' },
  { path: '/daily-missions', name: 'Daily Missions' },
  { path: '/daily-adventures', name: 'Daily Adventures (JJ alias)' },
  { path: '/baseline', name: 'Baseline Diagnostic' },
  { path: '/power-scan', name: 'Power Scan' },
];

const PIN_ROUTES = ROUTES.filter(function(r) { return r.pin; });
const OPEN_ROUTES = ROUTES.filter(function(r) { return !r.pin; });

// ── OPEN ROUTES: should load with content, no fatal JS errors ──

for (const route of OPEN_ROUTES) {
  test(route.name + ' (' + route.path + ') loads without errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Page should return 200
    expect(response.status(), route.name + ' returned ' + response.status()).toBe(200);

    // Page should not be blank
    const body = await page.locator('body').textContent();
    expect(body.trim().length, route.name + ' body is empty').toBeGreaterThan(0);

    // No fatal JS errors (filter noise)
    const fatal = errors.filter((e) => {
      return e.indexOf('favicon') === -1
        && e.indexOf('404') === -1
        && e.indexOf('net::ERR') === -1;
    });
    if (fatal.length > 0) {
      console.log('JS errors on ' + route.path + ':', fatal);
    }
    expect(fatal, route.name + ' had JS errors').toEqual([]);
  });
}

// ── PIN ROUTES: should show PIN gate or redirect, not crash ──

for (const route of PIN_ROUTES) {
  test(route.name + ' (' + route.path + ') shows PIN gate or redirects', async ({ page }) => {
    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Should either:
    // - Return 200 with PIN input visible
    // - Redirect (302) to a gate page
    const status = response.status();
    expect(status === 200 || status === 302, route.name + ' returned unexpected ' + status).toBeTruthy();

    if (status === 200) {
      // Check for PIN-like input or gate UI
      const hasPinInput = await page.locator('input[type="password"], input[inputmode="numeric"], .pin-input, #pin').count();
      const hasGateText = await page.locator('text=/pin|access|verify/i').count();
      expect(hasPinInput > 0 || hasGateText > 0, route.name + ' loaded but no PIN gate found').toBeTruthy();
    }
  });
}
