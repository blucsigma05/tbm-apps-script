/**
 * gas-shim.js — Reusable GAS API shim for Playwright education workflow tests.
 *
 * Intercepts /api?fn=FUNCTION_NAME calls and returns fixture data
 * so tests run deterministically without hitting the real GAS backend.
 *
 * ES5-compatible Node.js syntax throughout.
 */

var EDUCATION_FIXTURES = {
  getTodayContentSafe: {
    questions: [
      {
        id: 'q1',
        subject: 'math',
        teks: '4.4A',
        stem: 'What is 3/4 + 1/4?',
        options: ['1/2', '1', '3/8', '2/4'],
        correctIndex: 1
      },
      {
        id: 'q2',
        subject: 'math',
        teks: '4.4B',
        stem: 'Which fraction is equivalent to 2/6?',
        options: ['1/3', '1/2', '2/3', '3/6'],
        correctIndex: 0
      },
      {
        id: 'q3',
        subject: 'science',
        teks: '4.8A',
        stem: 'What causes day and night on Earth?',
        options: [
          'Earth orbiting the Sun',
          'Earth rotating on its axis',
          'The Moon blocking the Sun',
          'Clouds covering the sky'
        ],
        correctIndex: 1
      },
      {
        id: 'q4',
        subject: 'math',
        teks: '4.5A',
        stem: 'What is 7 x 8?',
        options: ['54', '56', '48', '64'],
        correctIndex: 1
      },
      {
        id: 'q5',
        subject: 'science',
        teks: '4.9A',
        stem: 'Which of these is a producer in a food chain?',
        options: ['Hawk', 'Grass', 'Rabbit', 'Fox'],
        correctIndex: 1
      },
      {
        id: 'q6',
        subject: 'math',
        teks: '4.6A',
        stem: 'What is the perimeter of a rectangle with length 5 and width 3?',
        options: ['8', '15', '16', '30'],
        correctIndex: 2
      }
    ]
  },

  logHomeworkCompletionSafe: { success: true },

  awardRingsSafe: { success: true, newTotal: 42 },

  getChildScheduleSafe: {
    child: 'buggsy',
    day: 'Monday',
    missions: [
      { id: 'm1', title: 'Homework Sprint', type: 'homework', order: 1, completed: false },
      { id: 'm2', title: 'Fact Sprint', type: 'facts', order: 2, completed: false },
      { id: 'm3', title: 'Reading Log', type: 'reading', order: 3, completed: false },
      { id: 'm4', title: 'Wolfdome Builder', type: 'wolfdome', order: 4, locked: true },
      { id: 'm5', title: 'Free Choice', type: 'free', order: 5, completed: false }
    ]
  },

  getSparkleProgressSafe: {
    stars: 12,
    lettersCompleted: ['K', 'I', 'N', 'D']
  },

  logSparkleProgressSafe: { success: true }
};

/**
 * Intercept /api calls and return fixture data based on the `fn` query parameter.
 *
 * @param {import('@playwright/test').Page} page  Playwright page object
 * @param {Object} fixtures  Map of function names to response payloads
 */
async function shimGAS(page, fixtures) {
  await page.route('**/api**', function(route) {
    var url = route.request().url();
    var match = url.match(/[?&]fn=([^&]+)/);
    if (!match) {
      route.continue();
      return;
    }

    var fnName = match[1];
    if (fixtures.hasOwnProperty(fnName)) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixtures[fnName])
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Override Date.now() inside the page context so day-specific logic
 * (Monday Error Journal, Friday Reflection, etc.) triggers deterministically.
 *
 * @param {import('@playwright/test').Page} page     Playwright page object
 * @param {string}                          isoDate  ISO-8601 date string, e.g. '2026-04-06T08:00:00'
 */
async function clockOverride(page, isoDate) {
  var timestamp = new Date(isoDate).getTime();
  await page.addInitScript(function(ts) {
    var _OrigDate = Date;
    var _now = ts;
    // Override Date.now
    Date.now = function() { return _now; };
    // Override new Date() with no args
    var OriginalDate = _OrigDate;
    /* eslint-disable no-global-assign */
    Date = function DateShim(a, b, c, d, e, f, g) {
      if (arguments.length === 0) {
        return new OriginalDate(_now);
      }
      switch (arguments.length) {
        case 1: return new OriginalDate(a);
        case 2: return new OriginalDate(a, b);
        case 3: return new OriginalDate(a, b, c);
        case 4: return new OriginalDate(a, b, c, d);
        case 5: return new OriginalDate(a, b, c, d, e);
        case 6: return new OriginalDate(a, b, c, d, e, f);
        default: return new OriginalDate(a, b, c, d, e, f, g);
      }
    };
    Date.now = function() { return _now; };
    Date.parse = OriginalDate.parse;
    Date.UTC = OriginalDate.UTC;
    Date.prototype = OriginalDate.prototype;
    /* eslint-enable no-global-assign */
  }, timestamp);
}

module.exports = {
  shimGAS: shimGAS,
  clockOverride: clockOverride,
  EDUCATION_FIXTURES: EDUCATION_FIXTURES
};
