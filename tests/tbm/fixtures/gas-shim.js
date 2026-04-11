/**
 * gas-shim.js — Reusable GAS API shim for Playwright education workflow tests.
 *
 * Intercepts /api?fn=FUNCTION_NAME calls and returns fixture data
 * so tests run deterministically without hitting the real GAS backend.
 *
 * ES5-compatible Node.js syntax throughout.
 */

var EDUCATION_FIXTURES = {
  // HomeworkModule expects { content: { module: { science: {...}, math: {...} } } }.
  // All questions are MC (no open-ended) so the test loop can complete the module.
  // answer: 1 (second option) means clicking option 0 (first) is always WRONG,
  // ensuring missedQuestions is populated for the Monday Error Journal test.
  getTodayContentSafe: {
    content: {
      module: {
        date: 'Test Module',
        science: {
          strand: 'Force and Motion',
          teks: '4.7A',
          title: 'Forces Briefing',
          questions: [
            {
              id: 1,
              type: 'multiple_choice',
              teks: '4.7A',
              difficulty: 'Easy',
              question: 'Which force pulls objects toward Earth?',
              options: ['Friction', 'Gravity', 'Magnetism', 'Air resistance'],
              answer: 1,
              explanation: 'Gravity pulls all objects toward Earth.'
            },
            {
              id: 2,
              type: 'multiple_choice',
              teks: '4.7A',
              difficulty: 'Easy',
              question: 'What force resists motion between surfaces?',
              options: ['Gravity', 'Friction', 'Magnetism', 'Inertia'],
              answer: 1,
              explanation: 'Friction resists motion when surfaces rub together.'
            },
            {
              id: 3,
              type: 'multiple_choice',
              teks: '4.7A',
              difficulty: 'Medium',
              question: 'Which is a non-contact force?',
              options: ['Friction', 'Push', 'Magnetism', 'Normal force'],
              answer: 2,
              explanation: 'Magnetism acts at a distance without direct contact.'
            },
            {
              id: 4,
              type: 'multiple_choice',
              teks: '4.7A',
              difficulty: 'Medium',
              question: 'A ball dropped from a height accelerates because of:',
              options: ['Air resistance', 'Gravity', 'Friction', 'Magnetism'],
              answer: 1,
              explanation: 'Gravity accelerates the ball toward the ground.'
            }
          ]
        },
        math: {
          strand: 'Fractions',
          teks: '4.3C',
          title: 'Fraction Code',
          questions: [
            {
              id: 7,
              type: 'computation',
              teks: '4.3C',
              difficulty: 'Easy',
              question: 'Which fraction equals 2/4?',
              options: ['1/3', '1/2', '3/4', '2/8'],
              answer: 1,
              explanation: '2/4 simplifies to 1/2 by dividing numerator and denominator by 2.'
            },
            {
              id: 8,
              type: 'computation',
              teks: '4.3E',
              difficulty: 'Easy',
              question: 'What is 1/4 + 1/4?',
              options: ['1/8', '2/4', '1/2', '2/8'],
              answer: 1,
              explanation: '1/4 + 1/4 = 2/4, which equals 1/2.'
            },
            {
              id: 9,
              type: 'computation',
              teks: '4.3D',
              difficulty: 'Easy',
              question: 'Which fraction is greater: 1/3 or 1/2?',
              options: ['1/3', '1/2', 'They are equal', 'Cannot compare'],
              answer: 1,
              explanation: '1/2 > 1/3 because halves are larger pieces than thirds.'
            }
          ]
        }
      }
    }
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

  // getDailyMissionsInitSafe — used by daily-missions.html on load
  getDailyMissionsInitSafe: {
    isDay1: false,
    missionState: {},
    designUnlocked: true,
    dateKey: 'missions_2026-04-11',
    schedule: {
      blocks: [
        { id: 'm1', title: 'Homework Sprint', type: 'homework', order: 1, completed: false, url: '?page=homework' },
        { id: 'm2', title: 'Fact Sprint', type: 'facts', order: 2, completed: false, url: '?page=facts' },
        { id: 'm3', title: 'Reading Log', type: 'reading', order: 3, completed: false, url: '?page=reading' }
      ]
    }
  },

  // getDailyScheduleSafe — used by daily-missions.html for curriculum-driven schedule
  getDailyScheduleSafe: {
    blocks: [
      { id: 'm1', title: 'Homework Sprint', type: 'homework', order: 1, completed: false, url: '?page=homework' },
      { id: 'm2', title: 'Fact Sprint', type: 'facts', order: 2, completed: false, url: '?page=facts' },
      { id: 'm3', title: 'Reading Log', type: 'reading', order: 3, completed: false, url: '?page=reading' }
    ]
  },

  // SparkleLearning.html calls loadProgressSafe (not getSparkleProgressSafe)
  loadProgressSafe: {
    stars: 12,
    lettersCompleted: ['K', 'I', 'N', 'D']
  },

  logSparkleProgressSafe: { success: true },
  saveProgressSafe: { success: true },

  // Stubs for calls that don't need real data but must not hit the backend
  submitHomeworkSafe: { status: 'ok' },
  logScaffoldEventSafe: { success: true },
  getAudioBatchSafe: {},

  // getAssetRegistrySafe: not yet in Cloudflare FNS list — shimGAS injects it
  // so SparkleLearning.html doesn't throw "is not a function".
  getAssetRegistrySafe: {}
};

/**
 * Intercept /api calls and return fixture data based on the `fn` query parameter.
 * Also patches window.google as soon as the Cloudflare shim defines it, adding
 * any fixture functions that aren't in the deployed Cloudflare FNS list (e.g.
 * getAssetRegistrySafe). This prevents "is not a function" errors on those calls.
 *
 * @param {import('@playwright/test').Page} page  Playwright page object
 * @param {Object} fixtures  Map of function names to response payloads
 */
async function shimGAS(page, fixtures) {
  // Inject a setter on window.google so we can add missing functions to
  // google.script.run the moment the Cloudflare shim assigns it.
  var fnNames = Object.keys(fixtures);
  await page.addInitScript(function(names) {
    var _googleVal = undefined;
    Object.defineProperty(window, 'google', {
      configurable: true,
      enumerable: true,
      get: function() { return _googleVal; },
      set: function(g) {
        _googleVal = g;
        if (!g || !g.script) return;
        // Get the run instance via the existing (non-configurable) getter.
        // We must NOT call Object.defineProperty on 'run' — the Cloudflare shim
        // defines it without configurable:true, so attempting to redefine it
        // throws "Cannot redefine property: run". Instead we patch the prototype
        // of whatever R class the getter returns, so every future call inherits
        // the missing functions automatically.
        try {
          var runDesc = Object.getOwnPropertyDescriptor(g.script, 'run');
          if (!runDesc || !runDesc.get) return;
          var rInstance = runDesc.get();
          if (!rInstance) return;
          var proto = Object.getPrototypeOf(rInstance);
          // Patch the prototype once — idempotent guard prevents double-injection.
          if (proto.__shimPatched) return;
          proto.__shimPatched = true;
          for (var i = 0; i < names.length; i++) {
            (function(fn) {
              // Only add if not already provided by the deployed Cloudflare FNS.
              if (typeof proto[fn] === 'function') return;
              proto[fn] = function() {
                var self = this;
                var args = [];
                for (var j = 0; j < arguments.length; j++) args.push(arguments[j]);
                fetch('/api?fn=' + encodeURIComponent(fn), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ args: args })
                })
                .then(function(resp) { return resp.text(); })
                .then(function(text) {
                  var parsed;
                  try { parsed = JSON.parse(text); } catch(e) { parsed = text; }
                  try { self._ok && self._ok(parsed); } catch(e) {}
                })
                .catch(function(err) {
                  try { self._err && self._err({ message: String(err) }); } catch(e) {}
                });
                return self;
              };
            })(names[i]);
          }
        } catch(e) {
          // Swallow — if patching fails the /api route intercept still handles
          // requests for functions that ARE in the Cloudflare FNS list.
        }
      }
    });
  }, fnNames);

  await page.route('**/api**', function(route) {
    var url = route.request().url();
    var match = url.match(/[?&]fn=([^&]+)/);
    if (!match) {
      route.continue();
      return;
    }

    var fnName = decodeURIComponent(match[1]);
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
