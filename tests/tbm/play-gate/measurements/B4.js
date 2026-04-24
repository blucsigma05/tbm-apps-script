/**
 * B4 — resume-integrity (Buggsy)
 * Drafts, submissions, or completion states resume correctly when the
 * surface promises resume.
 *
 * Same shape as U6 but child-gated to Buggsy. Many Buggsy surfaces have
 * draft persistence (HomeworkModule, ComicStudio, WolfkidCER, writing).
 * fact-sprint and power-scan are ephemeral.
 */

var helpers = require('./_helpers');

var EPHEMERAL_ROUTES = {
  '/facts': true,
  '/power-scan': true,
  '/baseline': true
};

var RESUME_MARKERS = [
  /saveDraft/i,
  /applyDraftState/,
  /restoreDraft/i,
  /pendingDraft/i,
  /saveComicDraftSafe/,
  /KH_StoryProgress/,
  /KH_Education/,
  /clearDraft_/,
  /draftKey/i,
  /localStorage\.(set|get)Item.*draft/i
];

module.exports = async function B4(ctx) {
  if (ctx.child !== 'buggsy') {
    return { id: 'B4', status: 'skip', measurement: 'not Buggsy route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'B4', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  if (EPHEMERAL_ROUTES[ctx.route]) {
    return {
      id: 'B4',
      status: 'skip',
      measurement: 'route ' + ctx.route + ' is ephemeral (no persistence contract)',
      expected: 'skip per persistence_contract'
    };
  }
  var matched = [];
  for (var i = 0; i < RESUME_MARKERS.length; i++) {
    if (RESUME_MARKERS[i].test(surface.src)) {
      matched.push(RESUME_MARKERS[i].toString().slice(0, 40));
    }
  }
  if (matched.length === 0) {
    return {
      id: 'B4',
      status: 'fail',
      measurement: 'no draft/resume marker in ' + surface.file,
      expected: 'saveDraft / applyDraftState / KH_StoryProgress write site'
    };
  }
  return {
    id: 'B4',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — resume wiring present; navigate-away-and-return behavioral check deferred to PR-3',
    measurement: matched.length + ' resume marker(s): ' + matched.slice(0, 2).join(' | '),
    expected: 'state restored after navigation (PR-3 behavioral)'
  };
};
