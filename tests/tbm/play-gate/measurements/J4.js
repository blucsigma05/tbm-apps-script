/**
 * J4 — gentle-failure (JJ)
 * Wrong answers redirect gently — no punishing copy, no harsh red flash,
 * no silent dead state.
 *
 * Fixture-mode surrogate (banned-pattern + required-pattern):
 *   - BANNED: harsh negative copy ("Wrong!", "No.", "Incorrect."), aggressive
 *     red on background (#FF0000, #F00, red flash class).
 *   - REQUIRED: a soft-redirect mechanism (try-again prompt, gentle-failure
 *     class, retry call site, or wrong-answer audio that's age-appropriate).
 * Behavioral test (submit wrong answer → screenshot at T+500ms → assert
 * gentle copy and no harsh flash) is PR-3.
 */

var helpers = require('./_helpers');

var BANNED_HARSH = [
  /\bWrong!\B/,            // "Wrong!" with exclamation
  /\bNo\.[^a-z]/,           // "No." standalone
  /\bIncorrect!/,
  /background[-:\s]*#?(FF0000|F00)\b/i,
  /class="[^"]*harsh[-_]?red/i,
  /class="[^"]*flash[-_]?red/i
];

var GENTLE_MARKERS = [
  /try.*again/i,
  /tryAgain/,
  /soft[-_]?fail/i,
  /gentle/i,
  /redirect/i,
  /almost.*there/i,
  /not.*quite/i,
  /wrong[-_]?answer/i,
  /\.wrong\b/
];

module.exports = async function J4(ctx) {
  if (ctx.child !== 'jj') {
    return { id: 'J4', status: 'skip', measurement: 'not JJ route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'J4', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  var harshHits = [];
  for (var i = 0; i < BANNED_HARSH.length; i++) {
    if (BANNED_HARSH[i].test(surface.src)) {
      harshHits.push(BANNED_HARSH[i].toString().slice(0, 40));
    }
  }
  if (harshHits.length > 0) {
    return {
      id: 'J4',
      status: 'fail',
      measurement: 'harsh-failure pattern in ' + surface.file + ': ' + harshHits.slice(0, 2).join(' | '),
      expected: 'no Wrong!/No./harsh-red — use gentle redirect copy'
    };
  }
  var gentleHits = [];
  for (var j = 0; j < GENTLE_MARKERS.length; j++) {
    if (GENTLE_MARKERS[j].test(surface.src)) {
      gentleHits.push(GENTLE_MARKERS[j].toString().slice(0, 40));
    }
  }
  if (gentleHits.length === 0) {
    return {
      id: 'J4',
      status: 'fail',
      measurement: 'no gentle-failure marker in ' + surface.file,
      expected: 'try-again/soft-fail/wrong-answer redirect copy or class'
    };
  }
  return {
    id: 'J4',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — no harsh patterns + gentle markers present; T+500ms behavioral inspection deferred to PR-3',
    measurement: '0 harsh + ' + gentleHits.length + ' gentle marker(s): ' + gentleHits.slice(0, 2).join(' | '),
    expected: 'gentle redirect visible at T+500ms (PR-3 behavioral)'
  };
};
