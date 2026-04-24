/**
 * J6 — adult-confidence-signal (JJ)
 * Parent or teacher can infer progress from saved state, star count, or
 * logged completion even if the child is playing independently.
 *
 * Fixture-mode surrogate: confirm the surface logs progress via a known
 * Safe wrapper that writes parent-visible data (logSparkleProgressSafe →
 * KH_SparkleProgress, star count visible in DOM, or progress shape exists).
 */

var helpers = require('./_helpers');

var PARENT_VISIBLE_LOGGERS = [
  /logSparkleProgressSafe/,
  /logHomeworkCompletionSafe/,
  /KH_SparkleProgress/,
  /KH_Education/,
  /starCount/,
  /star-counter/,
  /completionLog/,
  /writeProgress/i,
  /recordSession/i
];

module.exports = async function J6(ctx) {
  if (ctx.child !== 'jj') {
    return { id: 'J6', status: 'skip', measurement: 'not JJ route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'J6', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  var matched = [];
  for (var i = 0; i < PARENT_VISIBLE_LOGGERS.length; i++) {
    if (PARENT_VISIBLE_LOGGERS[i].test(surface.src)) {
      matched.push(PARENT_VISIBLE_LOGGERS[i].toString().slice(0, 40));
    }
  }
  if (matched.length === 0) {
    return {
      id: 'J6',
      status: 'fail',
      measurement: 'no parent-visible logger marker in ' + surface.file,
      expected: 'logSparkleProgressSafe / starCount / KH_SparkleProgress write site'
    };
  }
  return {
    id: 'J6',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — parent-visible logging present; ProgressReport visibility behavioral check deferred to PR-3',
    measurement: matched.length + ' parent-visible marker(s): ' + matched.slice(0, 2).join(' | '),
    expected: 'parent dashboard / ProgressReport shows session record (PR-3 behavioral)'
  };
};
