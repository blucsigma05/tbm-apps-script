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
  firestick: { width: 1920, height: 1080 },
  omnibook: { width: 1920, height: 1200 }
};

var SURFACES = [
  { path: '/parent', device: 's25', label: 'parent-s25' },
  { path: '/buggsy', device: 'a9', label: 'buggsy-a9' },
  { path: '/jj', device: 'a7', label: 'jj-a7' },
  { path: '/soul', device: 'firestick', label: 'soul-firestick' },
  { path: '/spine', device: 'firestick', label: 'spine-firestick' },
  { path: '/pulse', device: 's25', label: 'pulse-s25', requiresPin: true },
  { path: '/vein', device: 'omnibook', label: 'vein-omnibook', requiresPin: true }
];

test.beforeAll(function() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.beforeEach(function() {
  test.skip(!BASE_URL, 'Set TBM_BASE_URL before running screenshot capture.');
});

async function waitForGAS(page) {
  await page.waitForTimeout(6000);
}

async function handlePIN(page, requiresPin) {
  if (!requiresPin || !FINANCE_PIN) return;
  var pinInput = page.locator('input[type="password"], input[type="text"][placeholder*="PIN"], input[id*="pin"]');
  var hasPinGate = await pinInput.first().isVisible({ timeout: 3000 }).catch(function() { return false; });
  if (hasPinGate) {
    await pinInput.first().fill(FINANCE_PIN);
    var submitBtn = page.locator('button[type="submit"], button:has-text("Enter"), button:has-text("Go")');
    await submitBtn.first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  }
}

SURFACES.forEach(function(surface) {
  test('screenshot: ' + surface.label, async function({ page }) {
    if (surface.requiresPin && !FINANCE_PIN) {
      test.skip(true, 'Set TBM_PIN to capture finance surfaces.');
    }

    await page.setViewportSize(DEVICES[surface.device]);
    await page.goto(BASE_URL + surface.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await handlePIN(page, surface.requiresPin);
    await waitForGAS(page);

    var body = await page.locator('body').textContent();
    expect(body.length).toBeGreaterThan(50);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, surface.label + '.png'),
      fullPage: false
    });
  });
});
