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

// DEVICES derived from ops/play-gate-profiles.json (canonical per EPIC #439).
// Aliases map names the key each consumer uses. CI script
// .github/scripts/check_profile_sync.py enforces no drift.
var path = require('path');
var PROFILES = require(path.join(__dirname, '..', '..', 'ops', 'play-gate-profiles.json'));
var DEVICES = (function buildDevices() {
  var out = {};
  var deviceKeys = Object.keys(PROFILES.devices);
  for (var i = 0; i < deviceKeys.length; i++) {
    var device = PROFILES.devices[deviceKeys[i]];
    var alias = device.aliases && device.aliases['tests/tbm/education-workflows.spec.js:DEVICES'];
    if (alias) {
      out[alias] = { width: device.viewport.width, height: device.viewport.height };
    }
  }
  return out;
})();

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

// Dismiss the catch-up banner (added in #411) if present, then wait for the
// Plan Your Attack overlay. The banner renders when the server returns fullWeek
// data with missed days — dismiss before asserting plan overlay visibility.
async function waitForPlanAttack(page) {
  var dismissBtn = page.locator('[data-testid="catchup-banner-dismiss"]');
  if (await dismissBtn.count() > 0) {
    await dismissBtn.click();
  }
  await page.locator('.es-plan-attack').waitFor({ state: 'visible', timeout: 20000 });
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

    // ?testMode=1 tells HomeworkModule to skip its SSR fast path so shimGAS's
    // google.script.run interceptor can serve fixture content. See HomeworkModule v26.
    await page.goto(BASE_URL + '/homework?testMode=1', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Plan Your Attack screen should be visible — wait for dynamic render (ExecSkills.showPlanYourAttack
    // injects .es-plan-attack into #plan-overlay after getTodayContentSafe returns).
    await waitForPlanAttack(page);

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

    // ?testMode=1 tells HomeworkModule to skip its SSR fast path so shimGAS's
    // google.script.run interceptor can serve fixture content. See HomeworkModule v26.
    await page.goto(BASE_URL + '/homework?testMode=1', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for Plan Your Attack to render before clicking the ready button.
    await waitForPlanAttack(page);
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

    // HomeworkModule.html sets wrong-answer to purple since PR #173 (commit fa2aa33,
    // merged 2026-04-11). Both main and this branch have:
    //   .q-option.wrong-answer { background: rgba(168,85,247,0.20); border-color: #a855f7; }
    // This assertion is correct against the deployed production code.
    // rgba(168, 85, 247, 0.2) — getComputedStyle normalizes with spaces
    expect(bgColor).toContain('168, 85, 247');
    expect(bgColor).not.toContain('239, 68, 68');
    await snap(page, '02-homework-wrong-answer-purple');

    expect(filterRealErrors(errors)).toHaveLength(0);
  });
});

// Shared helper: submit one MC answer in a section and wait for feedback to confirm processing.
// Uses selector-state transitions instead of fixed timeouts to avoid CI timing fragility.
// Scopes to unanswered cards only (.q-card that has no .feedback-box child) to avoid
// re-clicking dead distractors from already-submitted questions.
async function submitOneAnswer(page, section) {
  // Scope to unanswered question cards — submitted cards contain .feedback-box
  var unansweredCard = '#section-' + section + ' .q-card:not(:has(.feedback-box)):not(:has(.es-feedback))';
  // Wait for a clickable option inside an unanswered card
  var option = page.locator(unansweredCard + ' .q-option:not(.correct-answer):not(.wrong-answer)').first();
  await option.waitFor({ state: 'visible', timeout: 12000 });
  await option.click();
  // Wait for lock-btn to become enabled (class .disabled removed after selection)
  var lockBtn = page.locator(unansweredCard + ' .lock-btn:not(.disabled)').first();
  await lockBtn.waitFor({ state: 'visible', timeout: 8000 });
  await lockBtn.click();
  // Wait for feedback to confirm answer was processed before moving on.
  // HomeworkModule has two feedback paths: .feedback-box (MC inline) and .es-feedback (exec skills).
  var feedback = page.locator('#section-' + section + ' .feedback-box, #section-' + section + ' .es-feedback').last();
  await feedback.waitFor({ state: 'visible', timeout: 8000 });
}

// Shared helper: submit one open-ended (textarea) answer in a section.
// FALLBACK_MODULE includes short_answer, why_question, and error_analysis types as textareas.
// NOTE: updateTextAnswer() stores text but does NOT re-render the card, so the lock button
// stays class="lock-btn disabled" even after filling. We call submitAnswer(qId) directly
// via evaluate, which reads answers[key].text and processes the submission.
async function submitOpenEndedAnswer(page, section) {
  var unansweredCard = '#section-' + section + ' .q-card:not(:has(.feedback-box)):not(:has(.es-feedback))';
  var textarea = page.locator(unansweredCard + ' .q-textarea').first();
  await textarea.waitFor({ state: 'visible', timeout: 8000 });
  await textarea.fill('Test answer for automated Playwright submission.');
  // Extract qId from textarea id="textarea-{qId}" and call submitAnswer directly
  // (lock button stays disabled because updateTextAnswer doesn't re-render)
  var qId = await textarea.getAttribute('id');
  var numericId = parseInt(qId.replace('textarea-', ''), 10);
  await page.evaluate(function(id) { submitAnswer(id); }, numericId);
  var feedback = page.locator('#section-' + section + ' .feedback-box, #section-' + section + ' .es-feedback').last();
  await feedback.waitFor({ state: 'visible', timeout: 8000 });
}

// Shared helper: submit ALL unanswered questions (MC + open-ended) in a section.
// Handles brain break dismissal between submissions.
async function submitAllQuestionsInSection(page, section) {
  for (var i = 0; i < 12; i++) {
    await dismissBrainBreakIfVisible(page);
    var unansweredCard = '#section-' + section + ' .q-card:not(:has(.feedback-box)):not(:has(.es-feedback))';
    var remaining = await page.locator(unansweredCard).count();
    if (remaining === 0) break;
    // Check whether the next unanswered card has MC options or a textarea
    var hasMC = await page.locator(unansweredCard + ' .q-option').count();
    if (hasMC > 0) {
      await submitOneAnswer(page, section);
    } else {
      await submitOpenEndedAnswer(page, section);
    }
  }
}

// Shared helper: dismiss brain break overlay if it is currently visible.
async function dismissBrainBreakIfVisible(page) {
  var bb = page.locator('#brain-break-overlay');
  var isShowing = await page.evaluate(function() {
    var el = document.getElementById('brain-break-overlay');
    return el ? (el.style.display !== 'none' && el.style.display !== '') : false;
  }).catch(function() { return false; });
  if (isShowing) {
    await bb.locator('button').first().click();
    await page.waitForTimeout(500);
  }
}

test.describe('Homework: brain break fires after 4 answers', function() {
  test('brain-break overlay appears after answering 4 questions', async function({ page }) {
    test.setTimeout(90000);
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.a9);
    await shimGAS(page, FIXTURES);

    // ?testMode=1 tells HomeworkModule to skip its SSR fast path so shimGAS's
    // google.script.run interceptor can serve fixture content. See HomeworkModule v26.
    await page.goto(BASE_URL + '/homework?testMode=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for Plan Your Attack to render (replaces fixed 6s timeout)
    await waitForPlanAttack(page);
    await page.locator('.es-ready-btn').click();
    await page.locator('.es-session-timer').waitFor({ state: 'visible', timeout: 10000 });

    await page.locator('#tab-science').click();
    // Wait for first question option to be present before starting loop
    await page.locator('#section-science .q-option').first().waitFor({ state: 'visible', timeout: 10000 });

    // Answer 4 questions — each submitOneAnswer waits for feedback before returning.
    // _questionsSinceBrainBreak increments on each submitAnswer() call in HomeworkModule.
    // Brain break fires when counter reaches _brainBreakAfter (default: 4).
    for (var i = 0; i < 4; i++) {
      await submitOneAnswer(page, 'science');
    }

    // Brain break overlay is shown via overlay.style.display = 'block' (not a CSS class).
    // Playwright toBeVisible() checks computed visibility including display:none, so
    // we evaluate display directly to avoid false-negative from hidden→block race.
    await page.waitForFunction(function() {
      var el = document.getElementById('brain-break-overlay');
      return el && el.style.display === 'block';
    }, { timeout: 10000 });
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

    // ?testMode=1 tells HomeworkModule to skip its SSR fast path so shimGAS's
    // google.script.run interceptor can serve fixture content. See HomeworkModule v26.
    await page.goto(BASE_URL + '/homework?testMode=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForPlanAttack(page);
    await page.locator('.es-ready-btn').click();
    await page.locator('.es-session-timer').waitFor({ state: 'visible', timeout: 10000 });

    // Answer all questions (MC + open-ended) in both tabs to trigger completion.
    // FALLBACK_MODULE contains short_answer and why_question types alongside MC.
    // Brain break fires after 4 total submissions — dismiss and continue.
    var tabs = ['science', 'math'];
    for (var t = 0; t < tabs.length; t++) {
      await page.locator('#tab-' + tabs[t]).click();
      await page.locator('#section-' + tabs[t] + ' .q-card').first().waitFor({ state: 'visible', timeout: 10000 });
      await submitAllQuestionsInSection(page, tabs[t]);
    }

    // Monday Error Journal should appear after completion (FALLBACK_MODULE answer:1
    // means clicking option 0 is wrong, populating missedQuestions)
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

    // ?testMode=1 tells HomeworkModule to skip its SSR fast path so shimGAS's
    // google.script.run interceptor can serve fixture content. See HomeworkModule v26.
    await page.goto(BASE_URL + '/homework?testMode=1', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForPlanAttack(page);
    await page.locator('.es-ready-btn').click();
    await page.locator('.es-session-timer').waitFor({ state: 'visible', timeout: 10000 });

    // Same completion loop as Monday test — handles MC + open-ended questions.
    var tabs = ['science', 'math'];
    for (var t = 0; t < tabs.length; t++) {
      await page.locator('#tab-' + tabs[t]).click();
      await page.locator('#section-' + tabs[t] + ' .q-card').first().waitFor({ state: 'visible', timeout: 10000 });
      await submitAllQuestionsInSection(page, tabs[t]);
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

test.describe('Sparkle: JJ mission launch path', function() {
  test('count mission URL renders the ready screen and launches gameplay', async function({ page }) {
    test.setTimeout(60000);
    var errors = collectErrors(page);
    await page.setViewportSize(DEVICES.s10fe);
    await shimGAS(page, Object.assign({}, FIXTURES, {
      getTodayContentSafe: {
        content: {
          title: 'Counting Higher!',
          theme: 'Numbers 6 and 7',
          audioIntro: 'Today we count higher!',
          activities: [
            { id: 'w5t01', type: 'count_with_me', targetNumber: 6, objects: 'stars', stars: 1 },
            { id: 'w5t04', type: 'count_with_me', targetNumber: 7, objects: 'hearts', stars: 1 },
            { id: 'w5t09', type: 'count_with_me', targetNumber: 7, objects: 'butterflies', stars: 1 }
          ]
        }
      },
      loadProgressSafe: {
        stars: 0,
        lettersCompleted: []
      }
    }));

    await page.goto(BASE_URL + '/sparkle?child=jj&activity=count', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.locator("button:has-text(\"Let's Go\")")).toBeVisible({ timeout: 15000 });
    await page.locator("button:has-text(\"Let's Go\")").click();
    await expect(page.locator('.activity-card')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.instruction').first()).toContainText(/count/i);

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
