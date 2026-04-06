var fs = require('fs');
var path = require('path');
var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;

var BASE_URL = process.env.TBM_BASE_URL || '';
var FINANCE_PIN = process.env.TBM_PIN || '';
var SCREENSHOT_DIR = path.join(process.cwd(), 'test-results', 'screenshots');

var DEVICES = {
  s25: { width: 390, height: 844 },
  a9: { width: 800, height: 1280 },
  a7: { width: 800, height: 1280 },
  surfacePro5: { width: 1368, height: 912 },
  firestick: { width: 1920, height: 1080 },
  omnibook: { width: 1920, height: 1200 }
};

// Data-proving sentinels: each selector ONLY matches when real server data
// has been injected into the DOM. Timeout/error paths cannot satisfy these.
var SURFACES = [
  { path: '/parent', device: 's25', label: 'parent-s25',
    sentinel: '#app:not(:empty)' },
  { path: '/buggsy', device: 'surfacePro5', label: 'buggsy-surfacePro5',
    sentinel: '#app:not(:empty)' },
  { path: '/jj', device: 'a7', label: 'jj-a7',
    sentinel: '#app:not(:empty)' },
  { path: '/soul', device: 'firestick', label: 'soul-firestick',
    sentinel: '.kid-stat-val' },
  { path: '/spine', device: 'firestick', label: 'spine-firestick',
    sentinel: '#waterfallRows .wf-val' },
  { path: '/pulse', device: 's25', label: 'pulse-s25',
    requiresPin: true, sentinel: '#app .footer' },
  { path: '/vein', device: 'omnibook', label: 'vein-omnibook',
    requiresPin: true, sentinel: '#debtRows .d-bal' }
];

var SENTINEL_TIMEOUT = 45000;

test.beforeAll(function() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.beforeEach(function() {
  test.skip(!BASE_URL, 'Set TBM_BASE_URL before running screenshot capture.');
});

/**
 * Wait for a data-proving sentinel. NO fallback — if the sentinel
 * never appears, the test fails. That's the point.
 */
async function waitForSentinel(page, surface) {
  var sel = surface.sentinel;

  // Wait for data-injected element to exist in DOM
  await page.waitForSelector(sel, { state: 'attached', timeout: SENTINEL_TIMEOUT });

  // Verify the sentinel has real content (not just an empty shell)
  var text = await page.locator(sel).first().textContent();
  expect(text.trim().length).toBeGreaterThan(0);
}

async function handlePIN(page, requiresPin) {
  if (!requiresPin || !FINANCE_PIN) return;
  try {
    var pinInput = page.locator('input[type="password"], input[type="text"][placeholder*="PIN"], input[id*="pin"]');
    var hasPinGate = await pinInput.first().isVisible({ timeout: 5000 });
    if (!hasPinGate) return;
    await pinInput.first().fill(FINANCE_PIN);
    await page.locator('button[type="submit"], button:has-text("Enter"), button:has-text("Go")')
      .first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  } catch (_) { /* no PIN gate found — continue */ }
}

SURFACES.forEach(function(surface) {
  test('screenshot: ' + surface.label, async function({ page }) {
    if (surface.requiresPin && !FINANCE_PIN) {
      test.skip(true, 'Set TBM_PIN to capture finance surfaces.');
    }

    await page.setViewportSize(DEVICES[surface.device]);
    await page.goto(BASE_URL + surface.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await handlePIN(page, surface.requiresPin);
    await waitForSentinel(page, surface);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, surface.label + '.png'),
      fullPage: false
    });
  });
});
