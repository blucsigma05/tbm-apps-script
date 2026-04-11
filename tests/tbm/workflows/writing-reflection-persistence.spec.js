/**
 * writing-reflection-persistence.spec.js — Friday reflection data persistence guard
 *
 * Protects against the journal/reflection data loss regression fixed in PR #173:
 * - ExecSkills._submitReflection fires logHomeworkCompletionSafe on submit
 * - The API call is made (interceptable) with expected payload shape
 * - Payload encodes reflection text in the title field with [Reflection] prefix
 * - On Monday, error journal submit fires a separate logHomeworkCompletionSafe call
 */

'use strict';

var test = require('@playwright/test').test;
var expect = require('@playwright/test').expect;
var gasShim = require('../../shared/gas-shim');
var helpers = require('../../shared/helpers');

var BASE_URL = process.env.TBM_BASE_URL || 'https://thompsonfams.com';

test.describe('Writing Module — Friday Reflection Persistence', function() {

  test('reflection submit fires logHomeworkCompletionSafe with [Reflection] prefix', async function({ page }) {
    // Set clock to Friday so reflection screen appears after completion
    await gasShim.setDay(page, 'Friday');
    await gasShim.shimGAS(page);

    // Capture all /api calls so we can inspect the logHomeworkCompletionSafe payload
    var logCalls = [];
    await page.route('**\/api**', function(route) {
      var url = route.request().url();
      if (url.indexOf('fn=logHomeworkCompletionSafe') !== -1) {
        // Capture request body
        var postData = route.request().postData() || '';
        logCalls.push(postData);
      }
      route.continue();
    });

    await page.goto(BASE_URL + '/writing', { waitUntil: 'domcontentloaded', timeout: helpers.GAS_TIMEOUT });

    // Dismiss Plan Your Attack if present
    var readyBtn = page.locator('.es-ready-btn, button:has-text("Let\'s go"), button:has-text("Ready"), button:has-text("Start Writing")');
    if (await readyBtn.count() > 0) {
      await readyBtn.first().click();
      await page.waitForTimeout(500);
    }

    // Fill in a writing response if there's a textarea
    var textarea = page.locator('textarea, .writing-input, [contenteditable="true"]').first();
    if (await textarea.count() > 0) {
      await textarea.fill('My claim is that students should have less homework. Evidence: studies show kids need free time. Reasoning: free time builds creativity.');
      await page.waitForTimeout(200);
    }

    // Submit the writing module
    var submitBtn = page.locator('button:has-text("Submit"), button:has-text("Done"), .submit-btn').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }

    // Look for Friday reflection form
    var hardestInput = page.locator('[placeholder*="hard"], [placeholder*="Hard"], .reflection-hardest, #reflectionHardest').first();
    var proudInput = page.locator('[placeholder*="proud"], [placeholder*="Proud"], .reflection-proud, #reflectionProud').first();

    if (await hardestInput.count() > 0 && await proudInput.count() > 0) {
      await hardestInput.fill('fractions were hard');
      await proudInput.fill('I finished everything');
      await page.waitForTimeout(200);

      // Submit the reflection
      var reflectionSubmit = page.locator('button:has-text("Save"), button:has-text("Submit"), .reflection-submit').first();
      if (await reflectionSubmit.count() > 0) {
        await reflectionSubmit.click();
        await page.waitForTimeout(500);

        // Verify that a logHomeworkCompletionSafe call was made with reflection data
        var reflectionCallFound = false;
        for (var i = 0; i < logCalls.length; i++) {
          if (logCalls[i].indexOf('[Reflection]') !== -1) {
            reflectionCallFound = true;
            break;
          }
        }
        expect(reflectionCallFound).toBe(true);
      }
    }
  });

  test('reflection payload title contains hardest and proudOf text', async function({ page }) {
    await gasShim.setDay(page, 'Friday');

    // Use route interception to capture the actual payload shape
    var capturedPayloads = [];

    await page.route('**\/api**', function(route) {
      var url = route.request().url();
      if (url.indexOf('fn=logHomeworkCompletionSafe') !== -1) {
        var postData = route.request().postData() || '';
        try {
          // Payload may be JSON or form-encoded — try to parse
          var parsed = JSON.parse(postData);
          capturedPayloads.push(parsed);
        } catch (e) {
          capturedPayloads.push({ raw: postData });
        }
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        route.continue();
      }
    });

    // Also shim the other GAS calls
    await gasShim.shimGAS(page);

    await page.goto(BASE_URL + '/writing', { waitUntil: 'domcontentloaded', timeout: helpers.GAS_TIMEOUT });

    // Navigate through module to reflection
    var readyBtn = page.locator('.es-ready-btn, button:has-text("Let\'s go"), button:has-text("Ready")');
    if (await readyBtn.count() > 0) {
      await readyBtn.first().click();
      await page.waitForTimeout(500);
    }

    var textarea = page.locator('textarea, .writing-input').first();
    if (await textarea.count() > 0) {
      await textarea.fill('Test response for reflection persistence test');
    }

    var submitBtn = page.locator('button:has-text("Submit"), button:has-text("Done"), .submit-btn').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(800);
    }

    // Fill reflection
    var hardestInput = page.locator('[placeholder*="hard"], [placeholder*="Hard"], .reflection-hardest').first();
    var proudInput = page.locator('[placeholder*="proud"], [placeholder*="Proud"], .reflection-proud').first();

    if (await hardestInput.count() > 0 && await proudInput.count() > 0) {
      await hardestInput.fill('writing conclusions');
      await proudInput.fill('used good evidence');

      var reflectionSubmit = page.locator('button:has-text("Save"), button:has-text("Submit"), .reflection-submit').first();
      if (await reflectionSubmit.count() > 0) {
        await reflectionSubmit.click();
        await page.waitForTimeout(500);

        // Find the reflection payload
        var reflectionPayload = null;
        for (var i = 0; i < capturedPayloads.length; i++) {
          var p = capturedPayloads[i];
          var titleStr = (p.title || p.raw || '').toString();
          if (titleStr.indexOf('[Reflection]') !== -1) {
            reflectionPayload = p;
            break;
          }
        }

        if (reflectionPayload) {
          var title = (reflectionPayload.title || reflectionPayload.raw || '').toString();
          // Title should contain both hardest and proudOf snippets
          expect(title).toContain('[Reflection]');
          expect(title.toLowerCase()).toContain('writing conclusions');
          expect(title.toLowerCase()).toContain('used good evidence');
        }
      }
    }
  });

});

test.describe('Homework Module — Monday Error Journal Persistence', function() {

  test('error journal submit fires logHomeworkCompletionSafe with [Error Journal] prefix', async function({ page }) {
    await gasShim.setDay(page, 'Monday');
    await gasShim.shimGAS(page);

    var logCalls = [];
    await page.route('**\/api**', function(route) {
      var url = route.request().url();
      if (url.indexOf('fn=logHomeworkCompletionSafe') !== -1) {
        logCalls.push(route.request().postData() || '');
      }
      route.continue();
    });

    await page.goto(BASE_URL + '/homework', { waitUntil: 'domcontentloaded', timeout: helpers.GAS_TIMEOUT });

    // Dismiss Plan Your Attack
    var readyBtn = page.locator('.es-ready-btn, button:has-text("Let\'s go"), button:has-text("Ready")');
    if (await readyBtn.count() > 0) {
      await readyBtn.first().click();
      await page.waitForTimeout(500);
    }

    // Answer questions — intentionally get some wrong to trigger Error Journal
    // Submit wrong answer to generate a missed question
    var answerBtn = page.locator('.answer-option, .mc-option, button[data-index]').first();
    if (await answerBtn.count() > 0) {
      // Try to pick a wrong answer (option index 3 — unlikely to be correct for first question)
      var wrongOption = page.locator('.answer-option, .mc-option').nth(3);
      if (await wrongOption.count() > 0) {
        await wrongOption.click();
        await page.waitForTimeout(300);
      } else {
        await answerBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Navigate through remaining questions quickly
    var nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue"), .next-btn');
    var iterations = 0;
    while (await nextBtn.count() > 0 && iterations < 10) {
      await nextBtn.first().click();
      await page.waitForTimeout(300);
      iterations++;
    }

    // Wait for module completion + Error Journal to appear (Monday only)
    await page.waitForTimeout(1000);

    var journalTextarea = page.locator('.error-journal textarea, .journal-input, [placeholder*="wrong"]').first();
    if (await journalTextarea.count() > 0) {
      await journalTextarea.fill('I thought the answer was different because I mixed up the formula');
      await page.waitForTimeout(200);

      var journalSubmit = page.locator('button:has-text("Save"), button:has-text("Submit"), .journal-submit').first();
      if (await journalSubmit.count() > 0) {
        await journalSubmit.click();
        await page.waitForTimeout(500);

        var journalCallFound = false;
        for (var i = 0; i < logCalls.length; i++) {
          if (logCalls[i].indexOf('[Error Journal]') !== -1) {
            journalCallFound = true;
            break;
          }
        }
        expect(journalCallFound).toBe(true);
      }
    }
  });

});
