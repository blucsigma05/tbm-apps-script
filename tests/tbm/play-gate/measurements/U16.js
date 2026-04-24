/**
 * U16 — offline-behavior-declared
 * Surface declares offline behavior: queue, read-only, or refuse-clearly.
 * Silent broken state is not allowed.
 *
 * Fixture-mode surrogate: static grep for offline-SPECIFIC markers only —
 * navigator.onLine, visible offline/no-internet/connection-lost copy, or an
 * explicit offline queue. A generic non-empty withFailureHandler body does
 * NOT qualify: it proves some async failure path exists, not that the surface
 * renders an offline-aware state. The offline rubric requires a recognizable
 * offline mode (queue, read-only, or refuse-clearly), not merely "errors
 * caught somewhere."
 * Behavioral test (block all network, assert visible offline state) is PR-3.
 */

var helpers = require('./_helpers');

var OFFLINE_MARKERS = [
  /navigator\.onLine/,
  /offline/i,
  /no[-\s]internet/i,
  /connection.*lost/i,
  /check.*connection/i,
  /try.*again.*later/i,
  /queue[-_]?offline/i,
  /network.*error/i,
  /failed to fetch/i
];

module.exports = async function U16(ctx) {
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'U16', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  var matched = [];
  for (var i = 0; i < OFFLINE_MARKERS.length; i++) {
    if (OFFLINE_MARKERS[i].test(surface.src)) {
      matched.push(OFFLINE_MARKERS[i].toString().slice(0, 40));
    }
  }
  if (matched.length === 0) {
    return {
      id: 'U16',
      status: 'fail',
      measurement: 'no offline/network-error marker in ' + surface.file,
      expected: 'offline message/banner, navigator.onLine check, or explicit offline queue marker'
    };
  }
  return {
    id: 'U16',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — offline handling marker present; network-blocked behavioral test deferred to PR-3',
    measurement: matched.length + ' offline marker(s): ' + matched.slice(0, 2).join(' | '),
    expected: 'surface renders recognizable offline state when network blocked (PR-3 behavioral)'
  };
};
