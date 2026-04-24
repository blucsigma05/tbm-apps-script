/**
 * U15 — loading-has-max-time
 * Loading state resolves within 10s OR shows a fallback message
 * ("Taking too long — try again"). No endless spinner.
 *
 * Fixture-mode surrogate: static grep for a loading-timeout handler
 * (setTimeout with loading/spinner/fallback keywords, or an explicit
 * timeout fallback element). Full behavioral test (intercept API to
 * delay 12s, assert fallback appears) is PR-3 work.
 */

var helpers = require('./_helpers');

// A timeout handler for loading can appear several ways. We count any that
// match; missing all = fail. Every marker here must specifically indicate a
// bounded wait on a loading/spinner/fallback state — a generic GAS async
// handler chain (withSuccessHandler.withFailureHandler) does NOT qualify,
// because it only proves errors are caught, not that loading is capped.
var TIMEOUT_MARKERS = [
  /setTimeout\s*\([^)]*loading/i,
  /setTimeout\s*\([^)]*spinner/i,
  /setTimeout\s*\([^)]*fallback/i,
  /setTimeout\s*\([^)]*tooLong/i,
  /setTimeout\s*\([^)]*timeout/i,
  /loadingTimeout/,
  /takingTooLong/i,
  /clearTimeout\s*\(\s*(?:loading|spinner|fallback)/i
];

module.exports = async function U15(ctx) {
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'U15', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  var matched = [];
  for (var i = 0; i < TIMEOUT_MARKERS.length; i++) {
    if (TIMEOUT_MARKERS[i].test(surface.src)) {
      matched.push(TIMEOUT_MARKERS[i].toString().slice(0, 40));
    }
  }
  if (matched.length === 0) {
    return {
      id: 'U15',
      status: 'fail',
      measurement: 'no timeout-bounded loading marker in ' + surface.file,
      expected: 'setTimeout with loading/spinner/fallback keyword OR loadingTimeout/takingTooLong OR clearTimeout on a loading handle'
    };
  }
  return {
    id: 'U15',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — loading timeout marker present; 12s-delay behavioral test deferred to PR-3',
    measurement: matched.length + ' timeout marker(s): ' + matched.slice(0, 2).join(' | '),
    expected: 'fallback message appears before 12s (PR-3 behavioral)'
  };
};
