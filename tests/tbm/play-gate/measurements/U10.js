/**
 * U10 — no-dead-ends
 * The child can recover from an error, back out, continue, or finish
 * without adult intervention.
 *
 * Fixture-mode surrogate: static grep for a navigation escape pattern
 * (back/home/exit button, window.location.href navigation, close action).
 * Behavioral dead-end discovery is PR-3 work (navigate to error state,
 * assert recovery path reachable).
 */

var helpers = require('./_helpers');

var RECOVERY_MARKERS = [
  /window\.location\.href\s*=/,
  /location\.assign/,
  /history\.back/,
  /class="[^"]*back[^"]*"/i,
  /class="[^"]*exit[^"]*"/i,
  /class="[^"]*close[^"]*"/i,
  /class="[^"]*home[^"]*"/i,
  /onclick="[^"]*(goHome|goBack|exit|close|cancel)/i,
  /id="[^"]*backBtn/i,
  /retry[A-Z]/,
  /tryAgain/i
];

module.exports = async function U10(ctx) {
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'U10', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  var matched = [];
  for (var i = 0; i < RECOVERY_MARKERS.length; i++) {
    if (RECOVERY_MARKERS[i].test(surface.src)) {
      matched.push(RECOVERY_MARKERS[i].toString().slice(0, 40));
    }
  }
  if (matched.length === 0) {
    return {
      id: 'U10',
      status: 'fail',
      measurement: 'no recovery/escape marker in ' + surface.file,
      expected: 'at least one back/home/exit/close/retry path'
    };
  }
  return {
    id: 'U10',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — recovery marker present; dead-end discovery behavioral test deferred to PR-3',
    measurement: matched.length + ' recovery marker(s): ' + matched.slice(0, 2).join(' | '),
    expected: 'recovery path reachable from any error state (PR-3 behavioral)'
  };
};
