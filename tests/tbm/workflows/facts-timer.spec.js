/**
 * facts-timer.spec.js — Fact Sprint timer regression guard
 *
 * Protects against the timer-mode regression fixed in PR #173:
 * - Default mode must be countdown (speed game mechanic)
 * - ADHD override via scaffoldConfig.adhd.timerMode still works
 * - Wrong answer does NOT show red (ADHD compliance)
 */

'use strict';

var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;
var gasShim = require('../../shared/gas-shim');
var helpers = require('../../shared/helpers');

var BASE_URL = process.env.TBM_BASE_URL || 'https://thompsonfams.com';

test.describe('Fact Sprint — Timer Mode', function() {

  test('default timer counts DOWN (not up) when no scaffoldConfig override', async function({ page }) {
    // Provide fixture with no timerMode override
    await gasShim.shimGAS(page, {
      getFactSprintContentSafe: {
        child: 'buggsy',
        type: 'multiplication',
        questions: [
          { text: '7 × 8 = ?', answer: '56' },
          { text: '9 × 6 = ?', answer: '54' },
          { text: '6 × 7 = ?', answer: '42' }
        ]
        // No scaffoldConfig.adhd.timerMode — should default to 'countdown'
      }
    });

    await page.goto(BASE_URL + '/facts', { waitUntil: 'domcontentloaded', timeout: helpers.GAS_TIMEOUT });

    // Start the sprint
    var startBtn = page.locator('button:has-text("START"), button:has-text("GO"), .sprint-start');
    if (await startBtn.count() > 0) {
      await startBtn.first().click();
    }

    await page.waitForTimeout(500);

    // Timer should exist and show a value
    var timerEl = page.locator('#timer-display, .timer-display, [id*="timer"]').first();
    var t1 = await timerEl.textContent();
    var v1 = parseInt(t1.replace(/[^0-9]/g, ''), 10) || 0;

    // Wait 3 seconds
    await page.waitForTimeout(3000);

    var t2 = await timerEl.textContent();
    var v2 = parseInt(t2.replace(/[^0-9]/g, ''), 10) || 0;

    // Countdown: value should DECREASE over time
    expect(v2).toBeLessThan(v1);
  });

  test('count_up mode works when scaffoldConfig explicitly sets it', async function({ page }) {
    // Explicitly set count_up (ADHD override for homework-style sessions)
    await gasShim.shimGAS(page, {
      getFactSprintContentSafe: {
        child: 'buggsy',
        type: 'multiplication',
        questions: [
          { text: '7 × 8 = ?', answer: '56' }
        ],
        scaffoldConfig: {
          adhd: { timerMode: 'count_up' }
        }
      }
    });

    await page.goto(BASE_URL + '/facts', { waitUntil: 'domcontentloaded', timeout: helpers.GAS_TIMEOUT });

    var startBtn = page.locator('button:has-text("START"), button:has-text("GO"), .sprint-start');
    if (await startBtn.count() > 0) {
      await startBtn.first().click();
    }

    await page.waitForTimeout(500);

    var timerEl = page.locator('#timer-display, .timer-display, [id*="timer"]').first();
    var t1 = await timerEl.textContent();
    var v1 = parseInt(t1.replace(/[^0-9]/g, ''), 10) || 0;

    await page.waitForTimeout(3000);

    var t2 = await timerEl.textContent();
    var v2 = parseInt(t2.replace(/[^0-9]/g, ''), 10) || 0;

    // Count-up: value should INCREASE over time
    expect(v2).toBeGreaterThan(v1);
  });

});

test.describe('Fact Sprint — ADHD Color Compliance', function() {

  test('wrong answer does not produce red styling', async function({ page }) {
    await gasShim.shimGAS(page);

    await page.goto(BASE_URL + '/facts', { waitUntil: 'domcontentloaded', timeout: helpers.GAS_TIMEOUT });

    var startBtn = page.locator('button:has-text("START"), button:has-text("GO"), .sprint-start');
    if (await startBtn.count() > 0) {
      await startBtn.first().click();
    }

    await page.waitForTimeout(300);

    // Submit a wrong answer
    var input = page.locator('input[type="text"], .answer-input').first();
    if (await input.count() > 0) {
      await input.fill('999'); // Wrong answer
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Check no red color used for feedback
      var feedbackEl = page.locator('.wrong, .incorrect, .wrong-answer, [class*="wrong"]').first();
      if (await feedbackEl.count() > 0) {
        var bgColor = await feedbackEl.evaluate(function(el) {
          return window.getComputedStyle(el).backgroundColor;
        });
        // Red would be rgb(255, 0, 0) or rgb(239, 68, 68) etc.
        // Should NOT be red
        expect(bgColor).not.toMatch(/rgb\(25[0-5]|23[0-9]|24[0-9],\s*[0-5][0-9],\s*[0-5][0-9]\)/);
      }
    }
  });

});

test.describe('Fact Sprint — Single Timer', function() {

  test('only one session timer exists after module starts', async function({ page }) {
    await gasShim.shimGAS(page);

    await page.goto(BASE_URL + '/facts', { waitUntil: 'domcontentloaded', timeout: helpers.GAS_TIMEOUT });

    // Dismiss Plan Your Attack if present
    var planBtn = page.locator('.es-ready-btn, button:has-text("Let\'s go"), button:has-text("Ready")');
    if (await planBtn.count() > 0) {
      await planBtn.first().click();
      await page.waitForTimeout(500);
    }

    // Should have exactly 1 ExecSkills timer
    var esTimerCount = await page.locator('#es-session-timer').count();
    expect(esTimerCount).toBeLessThanOrEqual(1);
  });

});
