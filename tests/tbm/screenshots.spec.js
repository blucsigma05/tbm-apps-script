var fs = require('fs');
var path = require('path');
var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;

var BASE_URL = process.env.TBM_BASE_URL || '';
var FINANCE_PIN = process.env.TBM_PIN || '';
var SCREENSHOT_DIR = path.join(process.cwd(), 'test-results', 'screenshots');

// ── FILE → ROUTE MAP ────────────────────────────────────────────
// Single source of truth: which source files affect which routes.
// When adding a new surface: add the HTML file + route here, add the
// viewport to ROUTE_VIEWPORTS, add the sentinel to SURFACES.
// The workflow feeds CHANGED_FILES env var; this spec filters accordingly.
var FILE_ROUTE_MAP = {
  'TheSpine.html':              ['/spine'],
  'TheSoul.html':               ['/soul'],
  'KidsHub.html':               ['/buggsy', '/jj', '/parent'],
  'ThePulse.html':              ['/pulse'],
  'TheVein.html':               ['/vein'],
  'daily-missions.html':        ['/daily-missions', '/daily-missions?child=jj'],
  'SparkleLearning.html':       [],
  'HomeworkModule.html':        [],
  'WolfkidCER.html':            [],
  'reading-module.html':        [],
  'writing-module.html':        [],
  'fact-sprint.html':           [],
  'investigation-module.html':  [],
  'BaselineDiagnostic.html':    [],
  'ComicStudio.html':           [],
  'DesignDashboard.html':       ['/wolfdome'],
  'JJHome.html':                ['/sparkle-kingdom'],
  'ProgressReport.html':        [],
  'StoryLibrary.html':          [],
  'StoryReader.html':           [],
  'Vault.html':                 []
};

// Changes to these files affect ALL routes — screenshot everything.
var GLOBAL_FILES = [
  'Code.js', 'Code.gs',
  'DataEngine.js', 'DataEngine.gs',
  'cloudflare-worker.js',
  'KidsHub.js', 'KidsHub.gs'
];

// ── VIEWPORT MAP ────────────────────────────────────────────────
// Each route tested at the device it actually runs on.
var ROUTE_VIEWPORTS = {
  '/spine':                    { width: 980,  height: 551,  device: 'Office Fire Stick' },
  '/soul':                     { width: 980,  height: 551,  device: 'Kitchen Fire Stick' },
  '/parent':                   { width: 412,  height: 915,  device: 'JT S25' },
  '/pulse':                    { width: 412,  height: 915,  device: 'JT S25' },
  '/vein':                     { width: 1920, height: 1080, device: 'LT Desktop' },
  '/buggsy':                   { width: 1340, height: 800,  device: 'A9 Tablet' },
  '/jj':                       { width: 1340, height: 800,  device: 'A7 Tablet' },
  '/daily-missions':           { width: 1368, height: 912,  device: 'Surface Pro' },
  '/daily-missions?child=jj':  { width: 1920, height: 1200, device: 'S10 FE' },
  '/wolfdome':                 { width: 1340, height: 800,  device: 'A9 Tablet' },
  '/sparkle-kingdom':          { width: 1340, height: 800,  device: 'A7 Tablet' }
};

var DESKTOP = { width: 1920, height: 1080, device: 'Desktop' };

// ── SURFACE DEFINITIONS ─────────────────────────────────────────
var SURFACES = [
  { path: '/parent',    requiresPin: false, sentinel: '#app:not(:empty)' },
  { path: '/buggsy',    requiresPin: false, sentinel: '#app:not(:empty)' },
  { path: '/jj',        requiresPin: false, sentinel: '#app:not(:empty)' },
  { path: '/soul',      requiresPin: false, sentinel: '.kid-stat-val' },
  { path: '/spine',     requiresPin: false, sentinel: '#waterfallRows .wf-val' },
  { path: '/pulse',     requiresPin: true,  sentinel: '#app .footer' },
  { path: '/vein',      requiresPin: true,  sentinel: '#debtRows .d-bal' },
  { path: '/daily-missions',          requiresPin: false, sentinel: '.mission-card' },
  { path: '/daily-missions?child=jj', requiresPin: false, sentinel: '.mission-card' },
  { path: '/wolfdome',                requiresPin: false, sentinel: '#home-view:not(:empty)' },
  { path: '/sparkle-kingdom',         requiresPin: false, sentinel: '#home-view:not(:empty)' }
];

var SENTINEL_TIMEOUT = 45000;

// ── DIFF-AWARE FILTERING ────────────────────────────────────────
// SCREENSHOT_ROUTES env var: explicit route list for on-demand dispatch runs.
//   Comma-separated route paths (e.g. "/pulse,/buggsy") or "all".
//   Takes precedence over CHANGED_FILES when set.
// CHANGED_FILES env var: comma-separated list of changed filenames from git diff.
//   Set by the workflow step. If empty/unset, capture ALL routes (local QA mode).
function getActiveRoutes() {
  // On-demand mode: explicit route list overrides file-diff logic
  var requestedRoutes = process.env.SCREENSHOT_ROUTES || '';
  if (requestedRoutes) {
    if (requestedRoutes === 'all') {
      return null; // all routes
    }
    return requestedRoutes.split(',').map(function(r) { return r.trim(); });
  }

  var changedFiles = process.env.CHANGED_FILES || '';
  if (!changedFiles) {
    // No filter — local run or explicit "capture all"
    return null;
  }

  var files = changedFiles.split(',').map(function(f) { return f.trim(); });

  // If any global file changed, screenshot everything
  for (var i = 0; i < files.length; i++) {
    var basename = path.basename(files[i]);
    if (GLOBAL_FILES.indexOf(basename) !== -1) {
      return null; // all routes
    }
  }

  // Map changed files to affected routes
  var routes = {};
  for (var j = 0; j < files.length; j++) {
    var name = path.basename(files[j]);
    var mapped = FILE_ROUTE_MAP[name];
    if (mapped) {
      for (var k = 0; k < mapped.length; k++) {
        routes[mapped[k]] = true;
      }
    }
  }

  var result = Object.keys(routes);
  return result.length > 0 ? result : 'none';
}

var ACTIVE_ROUTES = getActiveRoutes();

function shouldCapture(routePath) {
  if (ACTIVE_ROUTES === null) return true;       // all routes
  if (ACTIVE_ROUTES === 'none') return false;     // no UI files changed
  return ACTIVE_ROUTES.indexOf(routePath) !== -1; // specific routes
}

// ── HELPERS ─────────────────────────────────────────────────────

test.beforeAll(function() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  var requestedRoutes = process.env.SCREENSHOT_ROUTES || '';
  if (ACTIVE_ROUTES === 'none') {
    console.log('No UI files changed — skipping all screenshots.');
  } else if (ACTIVE_ROUTES === null) {
    if (requestedRoutes === 'all') {
      console.log('On-demand run — capturing all routes.');
    } else {
      console.log('Capturing all routes (local run or global file changed).');
    }
  } else {
    if (requestedRoutes) {
      console.log('On-demand run — capturing routes: ' + ACTIVE_ROUTES.join(', '));
    } else {
      console.log('Capturing routes for changed files: ' + ACTIVE_ROUTES.join(', '));
    }
  }
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

// ── PRIMARY: each route at its real device viewport ─────────────
SURFACES.forEach(function(surface) {
  var vp = ROUTE_VIEWPORTS[surface.path];
  if (!vp) return;

  var label = slugify(surface.path) + '-' + slugify(vp.device);

  test('screenshot: ' + label, async function({ page }) {
    test.skip(!shouldCapture(surface.path), 'Route not affected by this PR.');

    if (surface.requiresPin && !FINANCE_PIN) {
      test.skip(true, 'Set TBM_PIN to capture finance surfaces.');
    }

    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(BASE_URL + surface.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await handlePIN(page, surface.requiresPin);
    await waitForSentinel(page, surface);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, label + '.png'),
      fullPage: false
    });
  });
});

// ── DESKTOP: sanity check at 1920x1080 ─────────────────────────
SURFACES.forEach(function(surface) {
  var label = slugify(surface.path) + '-desktop';

  test('screenshot: ' + label, async function({ page }) {
    test.skip(!shouldCapture(surface.path), 'Route not affected by this PR.');

    if (surface.requiresPin && !FINANCE_PIN) {
      test.skip(true, 'Set TBM_PIN to capture finance surfaces.');
    }

    await page.setViewportSize({ width: DESKTOP.width, height: DESKTOP.height });
    await page.goto(BASE_URL + surface.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await handlePIN(page, surface.requiresPin);
    await waitForSentinel(page, surface);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, label + '.png'),
      fullPage: false
    });
  });
});
