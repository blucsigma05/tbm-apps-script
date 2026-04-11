/**
 * education-workflows.spec.js — Playwright workflow tests for TBM education surfaces.
 *
 * Uses the gas-shim fixture module to intercept /api calls so tests run
 * deterministically against sandbox data without hitting the real GAS backend.
 *
 * ES5-compatible Node.js syntax throughout.
 */

var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;
var gasShim = require('./fixtures/gas-shim');

var shimGAS = gasShim.shimGAS;
var clockOverride = gasShim.clockOverride;
var FIXTURES = gasShim.EDUCATION_FIXTURES;

var BASE_URL = process.env.TBM_BASE_URL || '';

var DEVICES = {
  s25: { width: 390, height: 844 },
  a9: { width: 800, height: 1280 },
  surface_pro: { width: 1368, height: 912 },
  s10fe: { width: 1920, height: 1200 }
};

test.beforeEach(function() {
  test.skip(!BASE_URL, 'Set TBM_BASE_URL to a staging or local deployment before running education workflow tests.');
});

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

// ---------------------------------------------------------------------------
// Homework Module
// ---------------------------------------------------------------------------

test.describe('Homework: Plan Your Attack → answer flow → completion', function() {
  test('loads plan-attack screen, starts session, answers a question', async function({ page }) {
    test.setTimeout(60000);
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.a9);
    await shimGAS(page, FIXTURES);

    await page.goto(BASE_URL + '/homework', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    // Plan Your Attack screen should be visible
    await expect(page.locator('.es-plan-attack')).toBeVisible({ timeout: 15000 });

    // Click ready button to start session
    await page.locator('.es-ready-btn').click();
    await page.waitForTimeout(2000);

    // Session timer should appear
    await expect(page.locator('.es-session-timer')).toBeVisible({ timeout: 10000 });

    // Module opens on Overview tab — navigate into Science questions
    await page.locator('#tab-science').click();
    await page.waitForTimeout(1000);

    // Answer the first question by clicking the correct option
    var firstOption = page.locator('.q-option').first();
    await expect(firstOption).toBeVisible({ timeout: 10000 });
    await firstOption.click();
    await page.waitForTimeout(1500);

    // Feedback should be visible after answering
    var feedback = page.locator('.feedback-box').first();
    await expect(feedback).toBeVisible({ timeout: 5000 });

    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});

test.describe('Homework: wrong answer shows purple not red', function() {
  test('incorrect answer option uses purple (#a855f7), never red', async function({ page }) {
    test.setTimeout(60000);
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.a9);
    await shimGAS(page, FIXTURES);

    await page.goto(BASE_URL + '/homework', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    // Start the session
    await page.locator('.es-ready-btn').click();
    await page.waitForTimeout(2000);

    // Navigate into Science question section
    await page.locator('#tab-science').click();
    await page.waitForTimeout(1000);

    // Find all options and click a wrong one.
    // The fixture q1 correct index is 1 (second option), so click the first option (index 0).
    var options = page.locator('.q-option');
    await expect(options.first()).toBeVisible({ timeout: 10000 });
    await options.nth(0).click();
    await page.waitForTimeout(1500);

    // Check the wrong-answer element's background color
    var wrongOption = page.locator('.q-option.wrong-answer').first();
    await expect(wrongOption).toBeVisible({ timeout: 5000 });

    var bgColor = await wrongOption.evaluate(function(el) {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Must contain purple (168, 85, 247) — NOT red (239, 68, 68)
    expect(bgColor).toContain('168, 85, 247');
    expect(bgColor).not.toContain('239, 68, 68');

    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});

test.describe('Homework: brain break fires after 4 answers', function() {
  test('brain-break overlay appears after answering 4 questions', async function({ page }) {
    test.setTimeout(90000);
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.a9);
    await shimGAS(page, FIXTURES);

    await page.goto(BASE_URL + '/homework', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    await page.locator('.es-ready-btn').click();
    await page.waitForTimeout(2000);

    // Navigate into Science question section
    await page.locator('#tab-science').click();
    await page.waitForTimeout(1000);

    // Answer 4 questions in sequence
    for (var i = 0; i < 4; i++) {
      var option = page.locator('.q-option').first();
      await expect(option).toBeVisible({ timeout: 10000 });
      await option.click();
      await page.waitForTimeout(2000);

      // If there is a next-question button, click it
      var nextBtn = page.locator('.es-next-btn, .q-next, [class*="next"]').first();
      var hasNext = await nextBtn.isVisible({ timeout: 2000 }).catch(function() { return false; });
      if (hasNext) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    // Brain break overlay should appear
    await expect(page.locator('#brain-break-overlay')).toBeVisible({ timeout: 10000 });

    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});

test.describe('Homework: Monday Error Journal appears', function() {
  test('error journal renders when clock is set to Monday', async function({ page }) {
    test.setTimeout(90000);
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.a9);

    // Set clock to Monday 2026-04-06 08:00 CT
    await clockOverride(page, '2026-04-06T08:00:00');
    await shimGAS(page, FIXTURES);

    await page.goto(BASE_URL + '/homework', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    // Start and complete the module (answer all 6 questions quickly)
    await page.locator('.es-ready-btn').click();
    await page.waitForTimeout(2000);

    // Navigate through Science then Math to complete all questions
    for (var tab of ['science', 'math']) {
      await page.locator('#tab-' + tab).click();
      await page.waitForTimeout(1000);

      for (var i = 0; i < 6; i++) {
        var option = page.locator('#section-' + tab + ' .q-option').first();
        var optionVisible = await option.isVisible({ timeout: 5000 }).catch(function() { return false; });
        if (!optionVisible) break;
        await option.click();
        await page.waitForTimeout(1500);

        var nextBtn = page.locator('.es-next-btn, .q-next, [class*="next"]').first();
        var hasNext = await nextBtn.isVisible({ timeout: 2000 }).catch(function() { return false; });
        if (hasNext) {
          await nextBtn.click();
          await page.waitForTimeout(1500);
        }
      }
    }

    // Monday Error Journal should appear after completion
    await expect(page.locator('.es-error-journal')).toBeVisible({ timeout: 15000 });

    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});

test.describe('Homework: Friday Reflection appears', function() {
  test('reflection panel renders when clock is set to Friday', async function({ page }) {
    test.setTimeout(90000);
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.a9);

    // Set clock to Friday 2026-04-10 08:00 CT
    await clockOverride(page, '2026-04-10T08:00:00');
    await shimGAS(page, FIXTURES);

    await page.goto(BASE_URL + '/homework', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    await page.locator('.es-ready-btn').click();
    await page.waitForTimeout(2000);

    // Navigate through Science then Math to complete all questions
    for (var tab of ['science', 'math']) {
      await page.locator('#tab-' + tab).click();
      await page.waitForTimeout(1000);

      for (var i = 0; i < 6; i++) {
        var option = page.locator('#section-' + tab + ' .q-option').first();
        var optionVisible = await option.isVisible({ timeout: 5000 }).catch(function() { return false; });
        if (!optionVisible) break;
        await option.click();
        await page.waitForTimeout(1500);

        var nextBtn = page.locator('.es-next-btn, .q-next, [class*="next"]').first();
        var hasNext = await nextBtn.isVisible({ timeout: 2000 }).catch(function() { return false; });
        if (hasNext) {
          await nextBtn.click();
          await page.waitForTimeout(1500);
        }
      }
    }

    // Friday Reflection should appear after completion
    await expect(page.locator('.es-reflection')).toBeVisible({ timeout: 15000 });

    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Sparkle Module
// ---------------------------------------------------------------------------

test.describe('Sparkle: session loads with star counter', function() {
  test('star counter and activity content are visible on load', async function({ page }) {
    test.setTimeout(60000);
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.a9);
    await shimGAS(page, FIXTURES);

    await page.goto(BASE_URL + '/sparkle', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    // Star counter should be visible
    var starCounter = page.locator('[class*="star-count"], [class*="starCount"], .star-counter, [id*="star"]').first();
    await expect(starCounter).toBeVisible({ timeout: 10000 });

    // Some activity content should have loaded
    var body = await page.locator('body').textContent();
    expect(body.length).toBeGreaterThan(100);

    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});

test.describe('Sparkle: reload preserves star count', function() {
  test('star count persists across page reload', async function({ page }) {
    test.setTimeout(90000);
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.a9);
    await shimGAS(page, FIXTURES);

    await page.goto(BASE_URL + '/sparkle', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    // Grab current star count text
    var starCounter = page.locator('[class*="star-count"], [class*="starCount"], .star-counter, [id*="star"]').first();
    await expect(starCounter).toBeVisible({ timeout: 10000 });
    var starsBefore = await starCounter.textContent();

    // Reload page (shim is still active on the route)
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    var starCounterAfter = page.locator('[class*="star-count"], [class*="starCount"], .star-counter, [id*="star"]').first();
    await expect(starCounterAfter).toBeVisible({ timeout: 10000 });
    var starsAfter = await starCounterAfter.textContent();

    expect(starsAfter).toBe(starsBefore);

    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Daily Missions / Adventures
// ---------------------------------------------------------------------------

test.describe('Daily Missions: JJ gets Sparkle theme', function() {
  test('/daily-adventures shows Sparkle Kingdom purple gradient', async function({ page }) {
    test.setTimeout(60000);
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.a9);
    await shimGAS(page, FIXTURES);

    await page.goto(BASE_URL + '/daily-adventures', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    // Verify purple gradient background (Sparkle Kingdom theming)
    var body = page.locator('body');
    var bgStyle = await body.evaluate(function(el) {
      var cs = window.getComputedStyle(el);
      return (cs.background || '') + ' ' + (cs.backgroundImage || '') + ' ' + (cs.backgroundColor || '');
    });

    // Also check a wrapper/container for the gradient
    var container = page.locator('[class*="sparkle"], [class*="kingdom"], [class*="adventure"], main, .container').first();
    var containerBg = '';
    var containerVisible = await container.isVisible({ timeout: 3000 }).catch(function() { return false; });
    if (containerVisible) {
      containerBg = await container.evaluate(function(el) {
        var cs = window.getComputedStyle(el);
        return (cs.background || '') + ' ' + (cs.backgroundImage || '') + ' ' + (cs.backgroundColor || '');
      });
    }

    var allBg = bgStyle + ' ' + containerBg;

    // Should have purple tones, not dark/grid Wolfdome theme
    var hasPurple = /purple|#[89a-f][0-9a-f]?[0-9a-f]?[5-9a-f][0-9a-f]?[fF]|128|168.*85.*247|147.*51.*234|rgba?\(\s*1[2-6]\d/i.test(allBg) ||
                    allBg.indexOf('gradient') !== -1;
    expect(hasPurple).toBe(true);

    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});

test.describe('Daily Missions: Buggsy gets Wolfdome theme', function() {
  test('/daily-missions shows dark Wolfdome theme elements', async function({ page }) {
    test.setTimeout(60000);
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.a9);
    await shimGAS(page, FIXTURES);

    await page.goto(BASE_URL + '/daily-missions', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    // Look for dark theme indicators (dark background, Wolfdome text, grid patterns)
    var body = page.locator('body');
    var bodyBg = await body.evaluate(function(el) {
      var cs = window.getComputedStyle(el);
      return cs.backgroundColor || '';
    });

    var bodyText = await body.textContent();

    // Should have dark theme elements — dark bg or Wolfdome references
    var hasDark = /rgb\(\s*[0-3]\d\s*,\s*[0-3]\d\s*,\s*[0-5]\d\s*\)/i.test(bodyBg) ||
                  /wolfdome|wolf|mission/i.test(bodyText.toLowerCase()) ||
                  bodyBg.indexOf('rgb(0') !== -1;
    expect(hasDark).toBe(true);

    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Fact Sprint
// ---------------------------------------------------------------------------

test.describe('Fact Sprint: timer counts UP not down', function() {
  test('timer starts at 0:00 and increments upward', async function({ page }) {
    test.setTimeout(60000);
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.a9);
    await shimGAS(page, FIXTURES);

    await page.goto(BASE_URL + '/facts', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);

    // Start the sprint
    var startBtn = page.locator('button:has-text("Start"), button:has-text("Go"), .es-ready-btn, .start-btn, [class*="start"]').first();
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();
    await page.waitForTimeout(2500);

    // Read the timer value
    var timer = page.locator('[class*="timer"], [class*="stopwatch"], [id*="timer"], .es-session-timer').first();
    await expect(timer).toBeVisible({ timeout: 5000 });

    var timerText = await timer.textContent();

    // Timer should show 0:0X format (counting up from 0), e.g. 0:02 or 0:03
    // It should NOT show a high number counting down (e.g. 4:58, 9:57)
    var match = timerText.match(/(\d+):(\d+)/);
    expect(match).not.toBeNull();

    var minutes = parseInt(match[1], 10);
    var seconds = parseInt(match[2], 10);

    // After ~2.5s the timer should be between 0:01 and 0:10 if counting up
    expect(minutes).toBe(0);
    expect(seconds).toBeGreaterThan(0);
    expect(seconds).toBeLessThan(15);

    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});
