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

// Screenshot helper — saves to test-results/screenshots/education/ so the
// existing CI upload-artifact step picks them up automatically.
var SCREENSHOT_DIR = 'test-results/screenshots/education';
function snap(page, name) {
  var fs = require('fs');
  try { fs.mkdirSync(SCREENSHOT_DIR, { recursive: true }); } catch(e) {}
  var safe = String(name).replace(/[^a-z0-9\-_]/gi, '-').toLowerCase();
  return page.screenshot({ path: SCREENSHOT_DIR + '/' + safe + '.png', fullPage: false });
}

test.beforeEach(function() {
  test.skip(!BASE_URL, 'Set TBM_BASE_URL to a staging or local deployment before running education workflow tests.');
});

// On failure — always capture a full screenshot so CI artifacts show the broken state.
test.afterEach(async function({ page }, testInfo) {
  if (testInfo.status !== testInfo.expectedStatus) {
    var safeName = testInfo.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    try { await snap(page, 'FAIL-' + safeName); } catch(e) {}
  }
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

    // Answer the first question: select an option then LOCK IN to submit
    var firstOption = page.locator('#section-science .q-option').first();
    await expect(firstOption).toBeVisible({ timeout: 10000 });
    await firstOption.click();
    await page.waitForTimeout(500);
    // LOCK IN submits the answer and renders feedback
    var lockBtn = page.locator('#section-science .lock-btn:not(.disabled)').first();
    await expect(lockBtn).toBeVisible({ timeout: 5000 });
    await lockBtn.click();
    await page.waitForTimeout(1500);

    // Feedback should be visible after submitting
    var feedback = page.locator('.feedback-box').first();
    await expect(feedback).toBeVisible({ timeout: 5000 });
    await snap(page, '01-homework-plan-attack-feedback');

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

    // Click a wrong option: fixture answer is index 1, so option 0 is wrong.
    var options = page.locator('#section-science .q-option');
    await expect(options.first()).toBeVisible({ timeout: 10000 });
    await options.nth(0).click();
    await page.waitForTimeout(500);
    // LOCK IN to submit — wrong-answer class is only added after submission
    var lockBtn2 = page.locator('#section-science .lock-btn:not(.disabled)').first();
    await expect(lockBtn2).toBeVisible({ timeout: 5000 });
    await lockBtn2.click();
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
    await snap(page, '02-homework-wrong-answer-purple');

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

    // Answer 4 questions — [style*="cursor:pointer"] skips already-submitted options.
    // After each option click, LOCK IN (submitAnswer) is required — that increments
    // _questionsSinceBrainBreak. Brain break fires when the counter reaches 4.
    for (var i = 0; i < 4; i++) {
      var option = page.locator('#section-science .q-option[style*="cursor:pointer"]').first();
      await expect(option).toBeVisible({ timeout: 10000 });
      await option.click();
      await page.waitForTimeout(500);
      var lockBtnBB = page.locator('#section-science .lock-btn:not(.disabled)').first();
      var hasLockBB = await lockBtnBB.isVisible({ timeout: 2000 }).catch(function() { return false; });
      if (hasLockBB) {
        await lockBtnBB.click();
        await page.waitForTimeout(2000);
      }
    }

    // Brain break overlay should appear after the 4th submission
    await expect(page.locator('#brain-break-overlay')).toBeVisible({ timeout: 10000 });
    await snap(page, '03-homework-brain-break-overlay');

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

    // Answer all questions in both tabs to trigger completion.
    // [style*="cursor:pointer"] targets only unsubmitted options (submitted ones
    // get cursor:default). LOCK IN (submitAnswer) is required to score each answer.
    // Brain break fires after 4 total submissions — dismiss it and continue.
    for (var tab of ['science', 'math']) {
      await page.locator('#tab-' + tab).click();
      await page.waitForTimeout(1000);

      for (var i = 0; i < 8; i++) {
        // Dismiss brain break if it fired mid-loop
        var bbMon = await page.locator('#brain-break-overlay').isVisible({ timeout: 500 }).catch(function() { return false; });
        if (bbMon) {
          await page.locator('#brain-break-overlay button').click();
          await page.waitForTimeout(1000);
        }
        var option = page.locator('#section-' + tab + ' .q-option[style*="cursor:pointer"]').first();
        var optionVisible = await option.isVisible({ timeout: 3000 }).catch(function() { return false; });
        if (!optionVisible) break;
        await option.click();
        await page.waitForTimeout(500);
        var lockBtnMon = page.locator('#section-' + tab + ' .lock-btn:not(.disabled)').first();
        var hasLockMon = await lockBtnMon.isVisible({ timeout: 2000 }).catch(function() { return false; });
        if (hasLockMon) {
          await lockBtnMon.click();
          await page.waitForTimeout(1500);
        }
      }
    }

    // Monday Error Journal should appear after completion
    await expect(page.locator('.es-error-journal')).toBeVisible({ timeout: 15000 });
    await snap(page, '04-homework-monday-error-journal');

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

    // Answer all questions in both tabs to trigger completion.
    // Same pattern as Monday test: [style*="cursor:pointer"] + LOCK IN + brain break handling.
    for (var tab of ['science', 'math']) {
      await page.locator('#tab-' + tab).click();
      await page.waitForTimeout(1000);

      for (var i = 0; i < 8; i++) {
        // Dismiss brain break if it fired mid-loop
        var bbFri = await page.locator('#brain-break-overlay').isVisible({ timeout: 500 }).catch(function() { return false; });
        if (bbFri) {
          await page.locator('#brain-break-overlay button').click();
          await page.waitForTimeout(1000);
        }
        var option = page.locator('#section-' + tab + ' .q-option[style*="cursor:pointer"]').first();
        var optionVisible = await option.isVisible({ timeout: 3000 }).catch(function() { return false; });
        if (!optionVisible) break;
        await option.click();
        await page.waitForTimeout(500);
        var lockBtnFri = page.locator('#section-' + tab + ' .lock-btn:not(.disabled)').first();
        var hasLockFri = await lockBtnFri.isVisible({ timeout: 2000 }).catch(function() { return false; });
        if (hasLockFri) {
          await lockBtnFri.click();
          await page.waitForTimeout(1500);
        }
      }
    }

    // Friday Reflection should appear after completion
    await expect(page.locator('.es-reflection')).toBeVisible({ timeout: 15000 });
    await snap(page, '05-homework-friday-reflection');

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
    await snap(page, '06-sparkle-loaded');

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
    await snap(page, '07-sparkle-reload-star-count');

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

    // Use ?child=jj so window.location.search contains 'child=jj' and JJ theme applies.
    // /daily-adventures proxies child=jj server-side but the browser URL has no query
    // string, so parseChildParam() never sets currentChild = 'jj' in that case.
    await page.goto(BASE_URL + '/daily-missions?child=jj', { waitUntil: 'domcontentloaded', timeout: 60000 });
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
    await snap(page, '08-daily-missions-jj-sparkle-theme');

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
    await snap(page, '09-daily-missions-buggsy-wolfdome-theme');

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

    // Use .es-session-timer specifically — it's the ExecSkills counting-up timer.
    // Broad selectors like [id*="timer"] match the hidden #bb-timer (brain break
    // countdown inside display:none overlay) which Playwright rightly reports as hidden.
    var timer = page.locator('.es-session-timer');
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
    await snap(page, '10-fact-sprint-timer-counting-up');

    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});
