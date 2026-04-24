/**
 * U13 — empty-state-defined
 * Surface declares a specific empty state with a CTA (no blank screen, no bare error).
 *
 * PR-1 spike: static grep of surface HTML for empty-state markers
 * ("no-content", "all-done", "empty-state", "come back", "no homework").
 * Full behavioral test (inject empty payload via shim, assert empty-state
 * element renders) is PR 2 work.
 */

var helpers = require('./_helpers');

// PR-2 update (Gitea #54): use shared _helpers.loadSurface so coverage
// extends to all 15 play-gate routes (was only /sparkle + /homework in PR-1).

var EMPTY_STATE_MARKERS = [
  /empty-state/i,
  /no-content/i,
  /all-done/i,
  /come\s+back/i,
  /no\s+homework/i,
  /nothing\s+to\s+do/i,
  /all\s+caught\s+up/i
];

module.exports = async function U13(ctx) {
  var surface = helpers.loadSurface(ctx);
  if (!surface) return { id: 'U13', status: 'skip', measurement: 'no HTML mapping' };
  var src = surface.src;
  var matched = [];
  for (var i = 0; i < EMPTY_STATE_MARKERS.length; i++) {
    if (EMPTY_STATE_MARKERS[i].test(src)) matched.push(EMPTY_STATE_MARKERS[i].toString());
  }
  if (matched.length === 0) {
    return {
      id: 'U13',
      status: 'fail',
      measurement: 'no empty-state marker found in ' + surface.file,
      expected: 'at least one of: empty-state / no-content / all-done / come back / no homework'
    };
  }
  return {
    id: 'U13',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — behavioral assertion (inject empty payload, render empty-state) deferred to PR 2',
    measurement: matched.length + ' empty-state marker(s) found',
    expected: 'empty-state element renders when primary data empty (PR 2 behavioral test)'
  };
};
