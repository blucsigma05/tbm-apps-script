/**
 * U5 — core-loop-completes
 * One real task, mission, lesson, or draft can be completed end-to-end.
 *
 * Fixture-mode surrogate: static grep confirms a primary submit/save/complete
 * action exists in source (buttons wired to submitHomeworkSafe / saveComicDraftSafe
 * / logSparkleProgressSafe / completion-ring render / etc.). Full end-to-end
 * completion assertion requires behavioral interaction against live fixtures
 * (deferred to PR-3 live-mode).
 */

var helpers = require('./_helpers');

var COMPLETION_MARKERS = [
  /submitHomeworkSafe/,
  /saveComicDraftSafe/,
  /logSparkleProgressSafe/,
  /logHomeworkCompletionSafe/,
  /completion-ring/i,
  /results-ring/i,
  /celebration-wrap/i,
  /submitCER/i
];

module.exports = async function U5(ctx) {
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'U5', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  var matched = [];
  for (var i = 0; i < COMPLETION_MARKERS.length; i++) {
    if (COMPLETION_MARKERS[i].test(surface.src)) {
      matched.push(COMPLETION_MARKERS[i].toString());
    }
  }
  if (matched.length === 0) {
    return {
      id: 'U5',
      status: 'fail',
      measurement: 'no completion-action marker found in ' + surface.file,
      expected: 'at least one submit/save/log-completion call site'
    };
  }
  return {
    id: 'U5',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — completion action present in source; end-to-end cycle assertion deferred to PR-3 live-mode',
    measurement: matched.length + ' completion marker(s) in ' + surface.file + ': ' + matched.slice(0, 2).join(', '),
    expected: 'one full task cycle completes without error (PR-3 behavioral test)'
  };
};
