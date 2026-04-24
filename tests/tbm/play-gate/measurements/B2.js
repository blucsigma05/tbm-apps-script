/**
 * B2 — progress-reward-clarity (Buggsy)
 * XP, rings, completion, progress, or unlock state is visible and believable.
 * Reward indicator changes state visibly on task completion.
 *
 * DOM check: at least one ring/progress indicator is visible in the rendered
 * surface. Static-grep surrogate when DOM hasn't loaded a content payload yet
 * (ring count exists in source but isn't rendered without an active session).
 */

var helpers = require('./_helpers');

var REWARD_SOURCE_MARKERS = [
  /comp-rings/,
  /completion-ring/i,
  /ring-award/i,
  /results-rings/i,
  /completion-rings/i,
  /\bxp[-_]/i,
  /\bring[-_]?count/i,
  /ringBank/i,
  /\bunlock/i
];

module.exports = async function B2(ctx) {
  if (ctx.child !== 'buggsy') {
    return { id: 'B2', status: 'skip', measurement: 'not Buggsy route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'B2', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }

  // First try DOM — does any ring/reward element render?
  var domHit = await ctx.page.evaluate(function() {
    var selectors = ['#comp-rings', '.ring-award', '.completion-rings',
                     '.results-rings', '[class*="ring"]', '[id*="ring"]',
                     '.xp-display', '.progress-bar', '[role="progressbar"]'];
    for (var i = 0; i < selectors.length; i++) {
      var n = document.querySelector(selectors[i]);
      if (n) {
        var r = n.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          return { selector: selectors[i], text: (n.innerText || '').slice(0, 40) };
        }
      }
    }
    return null;
  });

  if (domHit) {
    return {
      id: 'B2',
      status: 'pass',
      measurement: 'reward element rendered: ' + domHit.selector + ' "' + domHit.text + '"',
      expected: 'visible ring / progress / xp indicator'
    };
  }

  // Source fallback — present in code but not rendered (likely pre-content state)
  var matched = [];
  for (var i = 0; i < REWARD_SOURCE_MARKERS.length; i++) {
    if (REWARD_SOURCE_MARKERS[i].test(surface.src)) {
      matched.push(REWARD_SOURCE_MARKERS[i].toString().slice(0, 40));
    }
  }
  if (matched.length === 0) {
    return {
      id: 'B2',
      status: 'fail',
      measurement: 'no reward/progress marker in DOM or source for ' + surface.file,
      expected: 'ring / xp / progress indicator visible or in source'
    };
  }
  return {
    id: 'B2',
    status: 'surrogate',
    surrogateNote: 'static grep — reward markers in source but not rendered; needs active session to assert visible state change (PR-3)',
    measurement: matched.length + ' reward marker(s) in source: ' + matched.slice(0, 2).join(' | '),
    expected: 'reward indicator visible during/after task completion (PR-3 behavioral)'
  };
};
