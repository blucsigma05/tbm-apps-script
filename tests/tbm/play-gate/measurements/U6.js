/**
 * U6 — save-reload-holds
 * Progress, draft, submission, or completion state survives reload/resume
 * for surfaces with persistence_contract = 'submitted' or 'draft'.
 *
 * Fixture-mode surrogate: assert draft/persistence wiring is present in source
 * (saveDraft_, applyDraftState, restoreDraft, getSavedComic, etc.). Ephemeral
 * surfaces (fact-sprint, celebration-only flows) are exempt — they return
 * `skip` since persistence doesn't apply.
 */

var helpers = require('./_helpers');

// Routes whose surface explicitly does not persist (ephemeral timed drills).
// fact-sprint is a live timed drill — results are logged but intermediate
// state is not resumable by design.
var EPHEMERAL_ROUTES = {
  '/facts': true,
  '/power-scan': true,
  '/baseline': true
};

var PERSISTENCE_MARKERS = [
  /saveDraft/i,
  /applyDraft/i,
  /restoreDraft/i,
  /saveComicDraft/i,
  /pendingDraft/i,
  /getSavedComic/i,
  /loadSavedState/i,
  /localStorage\.setItem/,
  /localStorage\.getItem/,
  /KH_StoryProgress/,
  /submitHomeworkSafe/
];

module.exports = async function U6(ctx) {
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'U6', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  if (EPHEMERAL_ROUTES[ctx.route]) {
    return {
      id: 'U6',
      status: 'skip',
      measurement: 'route ' + ctx.route + ' is ephemeral (no persistence contract)',
      expected: 'skip per persistence_contract'
    };
  }
  var matched = [];
  for (var i = 0; i < PERSISTENCE_MARKERS.length; i++) {
    if (PERSISTENCE_MARKERS[i].test(surface.src)) {
      matched.push(PERSISTENCE_MARKERS[i].toString());
    }
  }
  if (matched.length === 0) {
    return {
      id: 'U6',
      status: 'fail',
      measurement: 'no draft/persistence marker in ' + surface.file,
      expected: 'saveDraft/applyDraft/restoreDraft or submit wiring present'
    };
  }
  return {
    id: 'U6',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — persistence wiring present; reload-then-restore behavioral assertion deferred to PR-3',
    measurement: matched.length + ' persistence marker(s): ' + matched.slice(0, 2).join(', '),
    expected: 'state restored after reload (PR-3 behavioral test)'
  };
};
