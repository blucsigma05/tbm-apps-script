var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;

test.describe.configure({ mode: 'serial' });

var BASE_URL = process.env.TBM_BASE_URL || '';
var FINANCE_PIN = process.env.TBM_PIN || '';
var ALLOW_MUTATIONS = process.env.TBM_ALLOW_MUTATIONS === '1';

var DEVICES = {
  s25: { width: 390, height: 844 },
  a9: { width: 800, height: 1280 },
  a7: { width: 800, height: 1280 }
};

test.beforeEach(function() {
  test.skip(!BASE_URL, 'Set TBM_BASE_URL to a staging or local deployment before running E2E tests.');
});

async function waitForGAS(page) {
  await page.waitForTimeout(6000);
}

async function gotoPath(page, path) {
  await page.goto(BASE_URL + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await handlePIN(page);
  await waitForGAS(page);
}

async function handlePIN(page) {
  if (!FINANCE_PIN) return;
  var pinInput = page.locator('input[type="password"], input[type="text"][placeholder*="PIN"], input[id*="pin"]');
  var hasPinGate = await pinInput.first().isVisible({ timeout: 3000 }).catch(function() { return false; });
  if (hasPinGate) {
    await pinInput.first().fill(FINANCE_PIN);
    var submitBtn = page.locator('button[type="submit"], button:has-text("Enter"), button:has-text("Go")');
    await submitBtn.first().click();
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  }
}

function collectErrors(page) {
  var errors = [];
  page.on('console', function(msg) {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', function(err) {
    errors.push(err.message);
  });
  return errors;
}

function filterRealErrors(errors) {
  return errors.filter(function(e) {
    return e.indexOf('favicon') === -1 && e.indexOf('net::ERR') === -1;
  });
}

test.describe('P1-2: Dinner Log', function() {
  test('logging dinner on Parent Dashboard does not return an error', async function({ page }) {
    test.skip(!ALLOW_MUTATIONS, 'Set TBM_ALLOW_MUTATIONS=1 to run state-changing E2E flows.');

    collectErrors(page);
    await page.setViewportSize(DEVICES.s25);
    await gotoPath(page, '/parent');

    var dinnerInput = page.getByPlaceholder("What's for dinner?");
    var logBtn = page.getByRole('button', { name: /log dinner/i });

    await expect(dinnerInput).toBeVisible();
    await expect(logBtn).toBeVisible();

    await dinnerInput.fill('Test Pizza');
    await logBtn.click();
    await page.waitForTimeout(3000);

    var pageText = await page.locator('body').textContent();
    var hasError = pageText.toLowerCase().indexOf('error: true') !== -1 ||
      pageText.toLowerCase().indexOf('error:true') !== -1;
    expect(hasError).toBe(false);
  });
});

test.describe('P1-4: Chore Approval Flow', function() {
  test('approving a chore on Parent Dashboard does not throw errors', async function({ page }) {
    test.skip(!ALLOW_MUTATIONS, 'Set TBM_ALLOW_MUTATIONS=1 to run state-changing E2E flows.');

    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.s25);
    await gotoPath(page, '/parent');

    var approveBtn = page.getByRole('button', { name: /approve/i }).first();
    var canApprove = await approveBtn.isVisible({ timeout: 5000 }).catch(function() { return false; });
    test.skip(!canApprove, 'No pending approvals on the target environment.');

    await approveBtn.click();
    await page.waitForTimeout(3000);
    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});

test.describe('P1-5: Task Counter', function() {
  test('Buggsy must-do summary badge renders with valid X / Y format', async function({ page }) {
    test.setTimeout(90000);
    await page.setViewportSize(DEVICES.a9);
    await gotoPath(page, '/buggsy');

    var summary = page.getByText(/\d+\s*\/\s*\d+\s*clear/i).first();
    await expect(summary).toBeVisible({ timeout: 20000 });

    var summaryText = await summary.textContent();
    var summaryMatch = summaryText.match(/(\d+)\s*\/\s*(\d+)\s*clear/i);
    expect(summaryMatch).not.toBeNull();
    var done = parseInt(summaryMatch[1], 10);
    var total = parseInt(summaryMatch[2], 10);
    expect(total).toBeGreaterThan(0);
    expect(done).toBeGreaterThanOrEqual(0);
    expect(done).toBeLessThanOrEqual(total);
  });
});

test.describe('P1-6: WOLFDOME Unlock Gate', function() {
  test('WOLFDOME BUILDER card renders on a Day 1 schedule when present', async function({ page }) {
    await page.setViewportSize(DEVICES.a9);
    await gotoPath(page, '/daily-missions?child=buggsy');

    var wolfdomeCard = page.getByText(/WOLFDOME BUILDER/i).first();
    var visible = await wolfdomeCard.isVisible({ timeout: 5000 }).catch(function() { return false; });
    test.skip(!visible, 'Not a Day 1 schedule on the target environment.');

    var bodyText = await page.locator('body').textContent();
    var hasLockedText = /Unlocks after today.?s homework/i.test(bodyText);
    var hasLaunchText = /ENTER/i.test(bodyText);
    expect(hasLockedText || hasLaunchText).toBe(true);
  });
});

test.describe('P2-1: Education Review Flow', function() {
  test('Parent Dashboard shows education review UI', async function({ page }) {
    await page.setViewportSize(DEVICES.s25);
    await gotoPath(page, '/parent');

    await expect(page.getByText(/EDUCATION/i).first()).toBeVisible();
    await expect(page.getByText(/TODAY'S HOMEWORK/i)).toBeVisible();
    await expect(page.getByText(/Daily Missions/i)).toBeVisible();
    await expect(page.getByText(/Baseline/i)).toBeVisible();
  });
});

test.describe('P2-6: Auto-Refresh Behavior', function() {
  test('Parent Dashboard does not refresh while modal/input is active', async function({ page }) {
    test.setTimeout(95000);

    await page.setViewportSize(DEVICES.s25);
    await gotoPath(page, '/parent');

    var dinnerInput = page.getByPlaceholder("What's for dinner?");
    await expect(dinnerInput).toBeVisible({ timeout: 30000 });

    await dinnerInput.focus();
    await dinnerInput.fill('test-refresh-guard');
    await page.waitForTimeout(70000);

    var currentValue = await dinnerInput.inputValue();
    expect(currentValue).toBe('test-refresh-guard');
  });
});

test.describe('P1-1: Clear-Task Modal', function() {
  test('clear-task modal shows three outcome options', async function({ page }) {
    test.skip(!ALLOW_MUTATIONS, 'Set TBM_ALLOW_MUTATIONS=1 to run state-changing E2E flows.');

    await page.setViewportSize(DEVICES.s25);
    await gotoPath(page, '/parent');

    var clearBtn = page.getByRole('button', { name: /clear/i }).first();
    await expect(clearBtn).toBeVisible();
    await clearBtn.scrollIntoViewIfNeeded();
    await clearBtn.click({ force: true });

    var modal = page.locator('[class*="modal"], [class*="dialog"], [role="dialog"]').first();
    await expect(modal).toBeVisible();

    var modalText = await modal.textContent();
    expect(/full|100%/i.test(modalText)).toBe(true);
    expect(/half|50%/i.test(modalText)).toBe(true);
    expect(/no point|0%|0 point/i.test(modalText)).toBe(true);
  });
});

test.describe('Sparkle Free Play', function() {
  test('/sparkle-free loads JJ free play mode', async function({ page }) {
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.a7);
    await gotoPath(page, '/sparkle-free');

    var body = await page.locator('body').textContent();
    expect(body.length).toBeGreaterThan(50);
    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});

test.describe('Story Factory', function() {
  test('Story Factory UI loads on Parent Dashboard', async function({ page }) {
    await page.setViewportSize(DEVICES.s25);
    await gotoPath(page, '/parent');

    await expect(page.getByText(/STORY FACTORY/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Bedtime Story/i })).toBeVisible();
  });
});
