/**
 * B6 — artifact-or-accomplishment (Buggsy)
 * Child leaves with a saved artifact, submitted answer, completed mission,
 * or explicit earned progress that produces a durable record.
 *
 * Fixture-mode surrogate: confirm the surface invokes a Safe wrapper that
 * writes to a KH_* tab (KH_Education, KH_StoryProgress, KH_MissionState,
 * KH_Rewards) per CLAUDE.md File Map ownership.
 */

var helpers = require('./_helpers');

var DURABLE_WRITERS = [
  /submitHomeworkSafe/,
  /logHomeworkCompletionSafe/,
  /saveComicDraftSafe/,
  /KH_Education/,
  /KH_StoryProgress/,
  /KH_MissionState/,
  /KH_Rewards/,
  /missionComplete/i,
  /awardRingsSafe/i,
  /completeMissionSafe/i
];

module.exports = async function B6(ctx) {
  if (ctx.child !== 'buggsy') {
    return { id: 'B6', status: 'skip', measurement: 'not Buggsy route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'B6', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  var matched = [];
  for (var i = 0; i < DURABLE_WRITERS.length; i++) {
    if (DURABLE_WRITERS[i].test(surface.src)) {
      matched.push(DURABLE_WRITERS[i].toString().slice(0, 40));
    }
  }
  if (matched.length === 0) {
    return {
      id: 'B6',
      status: 'fail',
      measurement: 'no durable-write Safe wrapper marker in ' + surface.file,
      expected: 'submitHomeworkSafe / saveComicDraftSafe / KH_* write site'
    };
  }
  return {
    id: 'B6',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — durable writer present; backend record verification deferred to PR-3 live-mode',
    measurement: matched.length + ' durable writer(s): ' + matched.slice(0, 2).join(' | '),
    expected: 'KH_* row created on session completion (PR-3 live-mode verification)'
  };
};
