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

// Sentinel selectors: each proves the page loaded real data, not just the loader.
var SURFACES = [
  { path: '/parent', device: 's25', label: 'parent-s25',
    sentinel: '#app:not(:empty)' },
  { path: '/buggsy', device: 'surfacePro5', label: 'buggsy-surfacePro5',
    sentinel: '#app:not(:empty)' },
  { path: '/jj', device: 'a7', label: 'jj-a7',
    sentinel: '#app:not(:empty)' },
  { path: '/soul', device: 'firestick', label: 'soul-firestick',
    sentinel: '#soulPage' },
  { path: '/spine', device: 'firestick', label: 'spine-firestick',
    sentinel: '#loader.hidden' },
  { path: '/pulse', device: 's25', label: 'pulse-s25',
    requiresPin: true, sentinel: '#loading-overlay' },
  { path: '/vein', device: 'omnibook', label: 'vein-omnibook',
    requiresPin: true, sentinel: '#loader.hidden' }
];

test.beforeAll(function() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.beforeEach(function() {
  test.skip(!BASE_URL, 'Set TBM_BASE_URL before running screenshot capture.');
});

/**
 * Wait for a sentinel element that proves real data loaded.
 * Falls back to 8s timeout if sentinel never appears.
 */
function waitForSentinel(page, surface) {
  var sel = surface.sentinel;
  if (!sel) {
    return page.waitForTimeout(8000);
  }

  // For #loader.hidden and #loading-overlay, we wait for the element state
  if (sel === '#loader.hidden') {
    return page.waitForSelector('#loader.hidden', { timeout: 30000 })
      .catch(function() {
        return page.waitForTimeout(8000);
      });
  }
  if (sel === '#loading-overlay') {
    // Wait for overlay to be hidden (display:none)
    return page.waitForFunction(
      'document.getElementById("loading-overlay") && ' +
      'document.getElementById("loading-overlay").style.display === "none"',
      { timeout: 30000 }
    ).catch(function() {
      return page.waitForTimeout(8000);
    });
  }
  // For #soulPage, wait until it has grid display
  if (sel === '#soulPage') {
    return page.waitForFunction(
      'document.getElementById("soulPage") && ' +
      'document.getElementById("soulPage").style.display === "grid"',
      { timeout: 30000 }
    ).catch(function() {
      return page.waitForTimeout(8000);
    });
  }
  // Default: wait for element to be visible and non-empty
  return page.waitForSelector(sel, { state: 'visible', timeout: 30000 })
    .catch(function() {
      return page.waitForTimeout(8000);
    });
}

function handlePIN(page, requiresPin) {
  if (!requiresPin || !FINANCE_PIN) return Promise.resolve();
  return page.locator('input[type="password"], input[type="text"][placeholder*="PIN"], input[id*="pin"]')
    .first().isVisible({ timeout: 5000 })
    .then(function(hasPinGate) {
      if (!hasPinGate) return;
      return page.locator('input[type="password"], input[type="text"][placeholder*="PIN"], input[id*="pin"]')
        .first().fill(FINANCE_PIN)
        .then(function() {
          return page.locator('button[type="submit"], button:has-text("Enter"), button:has-text("Go")')
            .first().click();
        })
        .then(function() {
          return page.waitForLoadState('domcontentloaded', { timeout: 15000 });
        });
    })
    .catch(function() { /* no PIN gate found — continue */ });
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

    var body = await page.locator('body').textContent();
    expect(body.length).toBeGreaterThan(50);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, surface.label + '.png'),
      fullPage: false
    });
  });
});
