var fs = require('fs');
var path = require('path');
var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;

var BASE_URL = process.env.TBM_BASE_URL || '';
var FINANCE_PIN = process.env.TBM_PIN || '';
var SCREENSHOT_DIR = path.join(process.cwd(), 'test-results', 'screenshots');

// Real device viewports — each route tested at the device it actually runs on.
var ROUTE_VIEWPORTS = {
  '/spine':                    { width: 980,  height: 551,  device: 'Office Fire Stick' },
  '/soul':                     { width: 980,  height: 551,  device: 'Kitchen Fire Stick' },
  '/parent':                   { width: 412,  height: 915,  device: 'JT S25' },
  '/pulse':                    { width: 412,  height: 915,  device: 'JT S25' },
  '/vein':                     { width: 1920, height: 1080, device: 'LT Desktop' },
  '/buggsy':                   { width: 1340, height: 800,  device: 'A9 Tablet' },
  '/jj':                       { width: 1340, height: 800,  device: 'A7 Tablet' },
  '/daily-missions':           { width: 1368, height: 912,  device: 'Surface Pro' },
  '/daily-missions?child=jj':  { width: 1920, height: 1200, device: 'S10 FE' }
};

// Desktop sanity check viewport — applied to every route as a second screenshot
var DESKTOP = { width: 1920, height: 1080, device: 'Desktop' };

// Data-proving sentinels: each selector ONLY matches when real server data
// has been injected into the DOM. Timeout/error paths cannot satisfy these.
var SURFACES = [
  { path: '/parent',    requiresPin: false, sentinel: '#app:not(:empty)' },
  { path: '/buggsy',    requiresPin: false, sentinel: '#app:not(:empty)' },
  { path: '/jj',        requiresPin: false, sentinel: '#app:not(:empty)' },
  { path: '/soul',      requiresPin: false, sentinel: '.kid-stat-val' },
  { path: '/spine',     requiresPin: false, sentinel: '#waterfallRows .wf-val' },
  { path: '/pulse',     requiresPin: true,  sentinel: '#app .footer' },
  { path: '/vein',      requiresPin: true,  sentinel: '#debtRows .d-bal' },
  { path: '/daily-missions',          requiresPin: false, sentinel: '#app:not(:empty)' },
  { path: '/daily-missions?child=jj', requiresPin: false, sentinel: '#app:not(:empty)' }
];

var SENTINEL_TIMEOUT = 45000;

test.beforeAll(function() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.beforeEach(function() {
  test.skip(!BASE_URL, 'Set TBM_BASE_URL before running screenshot capture.');
});

async function waitForSentinel(page, surface) {
  var sel = surface.sentinel;
  await page.waitForSelector(sel, { state: 'attached', timeout: SENTINEL_TIMEOUT });
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
  } catch (_) { /* no PIN gate found */ }
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Primary screenshots: each route at its real device viewport
SURFACES.forEach(function(surface) {
  var vp = ROUTE_VIEWPORTS[surface.path];
  if (!vp) return;

  var label = slugify(surface.path) + '-' + slugify(vp.device);

  test('screenshot: ' + label, async function({ page }) {
    if (surface.requiresPin && !FINANCE_PIN) {
      test.skip(true, 'Set TBM_PIN to capture finance surfaces.');
    }

    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(BASE_URL + surface.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await handlePIN(page, surface.requiresPin);
    await waitForSentinel(page, surface);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, label + '.png'),
      fullPage: false
    });
  });
});

// Desktop sanity check: every route at 1920x1080
SURFACES.forEach(function(surface) {
  var label = slugify(surface.path) + '-desktop';

  test('screenshot: ' + label, async function({ page }) {
    if (surface.requiresPin && !FINANCE_PIN) {
      test.skip(true, 'Set TBM_PIN to capture finance surfaces.');
    }

    await page.setViewportSize({ width: DESKTOP.width, height: DESKTOP.height });
    await page.goto(BASE_URL + surface.path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await handlePIN(page, surface.requiresPin);
    await waitForSentinel(page, surface);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, label + '.png'),
      fullPage: false
    });
  });
});
