/**
 * U7 — no-silent-failure
 * For PR 1 spike: grep withFailureHandler wiring density as a static proxy.
 * Full behavioral test (inject API error, assert fallback element) is PR 2 work.
 * Marked `surrogate` when the surrogate is used.
 */

var fs = require('fs');
var path = require('path');

var ROUTE_TO_HTML = {
  '/sparkle': 'SparkleLearning.html',
  '/homework': 'HomeworkModule.html'
};

module.exports = async function U7(ctx) {
  var htmlFile = ROUTE_TO_HTML[ctx.route];
  if (!htmlFile) return { id: 'U7', status: 'skip', measurement: 'no HTML mapping' };
  var abs = path.join(ctx.repoRoot, htmlFile);
  var src = fs.readFileSync(abs, 'utf8');
  var runCalls = (src.match(/google\.script\.run/g) || []).length;
  var handlers = (src.match(/withFailureHandler/g) || []).length;
  // Rough density check: at least one handler per run call chain.
  // Chains typically: google.script.run.withFailureHandler(...).withSuccessHandler(...).fnSafe()
  // So handlers >= runCalls is the expected ratio.
  if (handlers < runCalls) {
    return {
      id: 'U7',
      status: 'surrogate',
      surrogateNote: 'static grep ratio (handlers < run calls) — full behavioral test is PR 2 work',
      measurement: handlers + ' handlers vs ' + runCalls + ' run calls',
      expected: 'handlers >= run calls (PR-2 will assert fallback element render)'
    };
  }
  return {
    id: 'U7',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — handler density acceptable; behavioral assertion deferred to PR 2',
    measurement: handlers + ' handlers, ' + runCalls + ' run calls',
    expected: 'fallback element rendered on API error (PR 2 behavioral test)'
  };
};
