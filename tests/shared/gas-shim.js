/**
 * gas-shim.js — Playwright interceptor for google.script.run API calls
 *
 * Purpose: Allow Playwright workflow tests to run without a live GAS backend.
 * Usage:   Call shimGAS(page, fixtures) before page.goto() in your test.
 * Called by: tests/tbm/workflows/*.spec.js
 *
 * The Cloudflare worker proxies google.script.run calls to /api?fn=FUNCTION_NAME.
 * This shim intercepts those requests and returns fixture data, making
 * education module tests deterministic and backend-independent.
 */

'use strict';

// ─── DEFAULT FIXTURES ────────────────────────────────────────────────────────
// Override any key in shimGAS() to supply test-specific data.

var DEFAULT_FIXTURES = {

  // ── HomeworkModule / reading-module / daily-missions ──
  getTodayContentSafe: {
    child: 'buggsy',
    day: 'Monday',
    content: {
      science: {
        title: 'Forces and Motion',
        teks: '4.7A',
        questions: [
          {
            text: 'What happens to an object when a net force acts on it?',
            type: 'mc',
            options: ['It stays still', 'It accelerates', 'It disappears', 'It reverses'],
            correct: 1,
            explanation: 'A net force causes acceleration in the direction of the force (Newton\'s 2nd Law).',
            difficulty: 'easy'
          },
          {
            text: 'Two students push a box from opposite sides with equal force. What happens?',
            type: 'mc',
            options: ['Box moves right', 'Box moves left', 'Box stays still', 'Box spins'],
            correct: 2,
            explanation: 'Equal and opposite forces cancel out — the net force is zero.',
            difficulty: 'medium'
          },
          {
            text: 'A student claims: "Heavier objects always fall faster than lighter ones." Is this correct?',
            type: 'mc',
            options: ['Yes, always', 'No, in a vacuum they fall at the same rate', 'Only on Earth', 'Depends on color'],
            correct: 1,
            explanation: 'In a vacuum, gravity accelerates all objects equally. Air resistance causes the difference we observe.',
            difficulty: 'hard'
          }
        ]
      },
      math: {
        strand: 'Fractions',
        teks: '4.3B',
        questions: [
          {
            text: 'Which fraction is equivalent to 2/4?',
            type: 'mc',
            options: ['1/4', '1/2', '3/4', '2/8'],
            correct: 1,
            explanation: '2/4 simplifies to 1/2 by dividing numerator and denominator by 2.',
            difficulty: 'easy'
          },
          {
            text: 'Order from least to greatest: 3/4, 1/2, 2/3',
            type: 'mc',
            options: ['3/4, 2/3, 1/2', '1/2, 2/3, 3/4', '2/3, 1/2, 3/4', '1/2, 3/4, 2/3'],
            correct: 1,
            explanation: '1/2 = 0.5, 2/3 ≈ 0.667, 3/4 = 0.75.',
            difficulty: 'medium'
          }
        ]
      }
    },
    scaffoldConfig: {
      rings: 5,
      adhd: {
        brainBreakAfter: 4,
        brainBreakPrompt: 'Stand up and do 10 jumping jacks!',
        timerMode: 'count_up'
      }
    }
  },

  // ── Fact Sprint ──
  getFactSprintContentSafe: {
    child: 'buggsy',
    type: 'multiplication',
    questions: [
      { text: '7 × 8 = ?', answer: '56' },
      { text: '9 × 6 = ?', answer: '54' },
      { text: '12 × 4 = ?', answer: '48' },
      { text: '7 × 7 = ?', answer: '49' },
      { text: '8 × 9 = ?', answer: '72' },
      { text: '6 × 6 = ?', answer: '36' },
      { text: '11 × 8 = ?', answer: '88' },
      { text: '4 × 9 = ?', answer: '36' },
      { text: '5 × 7 = ?', answer: '35' },
      { text: '3 × 8 = ?', answer: '24' }
    ],
    scaffoldConfig: {
      adhd: { timerMode: 'countdown' }
    }
  },

  // ── Writing Module ──
  getWritingPromptSafe: {
    child: 'buggsy',
    format: 'cer',
    prompt: 'Should students have homework every night? Use evidence to support your claim.',
    guidance: 'State your claim, provide 2-3 pieces of evidence, and explain your reasoning.',
    teks: '4.9A'
  },

  // ── KidsHub Payload ──
  getKHPayload: {
    child: 'buggsy',
    rings: 127,
    streak: 5,
    chores: [
      { id: 1, title: 'Make Bed', done: false, points: 5 },
      { id: 2, title: 'Feed Pets', done: true, points: 10 }
    ],
    pendingReview: 0,
    heartbeatAge: 30
  },

  // ── Ring Awards (always succeed in tests) ──
  awardRingsSafe: { success: true, newTotal: 132 },
  submitHomeworkSafe: { status: 'auto_approved', ringsAwarded: 5 },
  logHomeworkCompletionSafe: { success: true },
  logSparkleProgressSafe: { success: true },

  // ── Daily Missions ──
  getDailyMissionsSafe: {
    child: 'buggsy',
    day: 'Monday',
    missions: [
      { id: 1, title: 'Math Module', subject: 'Math', module: 'homework', done: false, locked: false },
      { id: 2, title: 'Reading Passage', subject: 'RLA', module: 'reading', done: false, locked: false },
      { id: 3, title: 'Fact Sprint', subject: 'Math', module: 'facts', done: false, locked: true }
    ]
  }
};

// ─── SHIM SETUP ──────────────────────────────────────────────────────────────

/**
 * Intercepts all /api calls and returns fixture data.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object} [overrides] - Partial fixture overrides. Merged with DEFAULT_FIXTURES.
 * @returns {Promise<void>}
 *
 * @example
 * test('homework loads with fixture data', async ({ page }) => {
 *   await shimGAS(page, {
 *     getTodayContentSafe: { ...DEFAULT_FIXTURES.getTodayContentSafe, day: 'Friday' }
 *   });
 *   await page.goto('/homework');
 *   // ... test interactions
 * });
 */
async function shimGAS(page, overrides) {
  var fixtures = Object.assign({}, DEFAULT_FIXTURES, overrides || {});

  await page.route('**\/api**', function(route) {
    var url = route.request().url();
    var match = url.match(/[?&]fn=([^&]+)/);
    var fnName = match ? decodeURIComponent(match[1]) : null;

    if (fnName && fixtures[fnName] !== undefined) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixtures[fnName])
      });
    } else {
      // Pass through unknown functions (auth checks, etc.)
      route.continue();
    }
  });
}

/**
 * Set page clock to a specific day of week for day-sensitive tests.
 * Uses Playwright's built-in clock API.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} day - 'Monday', 'Tuesday', etc.
 *
 * @example
 * await setDay(page, 'Monday'); // Test Error Journal
 * await setDay(page, 'Friday'); // Test Friday Reflection
 */
async function setDay(page, day) {
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var targetDay = DAYS.indexOf(day);
  if (targetDay === -1) throw new Error('setDay: unknown day "' + day + '"');

  // Find next occurrence of that day from a known base date
  var base = new Date('2026-04-12T08:00:00'); // Sunday April 12 2026
  var daysUntil = (targetDay - base.getDay() + 7) % 7;
  var target = new Date(base.getTime() + daysUntil * 24 * 60 * 60 * 1000);

  await page.clock.setFixedTime(target);
}

module.exports = { shimGAS: shimGAS, setDay: setDay, DEFAULT_FIXTURES: DEFAULT_FIXTURES };
