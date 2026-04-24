/**
 * J2 — audio-consistency (JJ / Sparkle Kingdom)
 * Instruction and celebration audio remain consistent within a session.
 * No confusing voice switching.
 *
 * Fixture-mode surrogate: confirm the surface only references audio paths
 * mapped to JJ's canonical voice (Nia voice ID A2YMjtICNQnO93UAZ8l6 per
 * ops/play-gate-profiles.json). Cross-voice leak (Marco voice ID present in
 * a JJ surface) is a fail. Behavioral runtime audio inspection is PR-3.
 */

var helpers = require('./_helpers');

module.exports = async function J2(ctx) {
  if (ctx.child !== 'jj') {
    return { id: 'J2', status: 'skip', measurement: 'not JJ route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'J2', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  var voice = helpers.getCanonicalVoice(ctx);
  if (!voice) {
    return { id: 'J2', status: 'skip', measurement: 'no canonical voice for child=jj in profiles' };
  }
  // Marco's voice ID (Buggsy) appearing in a JJ surface = cross-voice leak.
  var marcoId = ctx.profiles.voices.marco && ctx.profiles.voices.marco.elevenLabsVoiceId;
  if (marcoId && surface.src.indexOf(marcoId) !== -1) {
    return {
      id: 'J2',
      status: 'fail',
      measurement: 'Marco voice ID ' + marcoId + ' referenced in JJ surface ' + surface.file,
      expected: 'only Nia voice ID (' + voice.elevenLabsVoiceId + ') in JJ surfaces'
    };
  }
  // Look for any audio play call sites — if there are none, the criterion
  // is moot for this surface but we should note it.
  var audioCallCount = (surface.src.match(/playAudioCached|new Audio\(|\.play\(\)/g) || []).length;
  if (audioCallCount === 0) {
    return {
      id: 'J2',
      status: 'skip',
      measurement: surface.file + ' has no audio call sites',
      expected: 'audio consistency (no audio used)'
    };
  }
  return {
    id: 'J2',
    status: 'surrogate',
    surrogateNote: 'static check — no cross-voice leak detected; runtime audio play-event log assertion deferred to PR-3',
    measurement: audioCallCount + ' audio call sites in ' + surface.file + '; no Marco voice ID present',
    expected: 'all audio routes through Nia voice (' + voice.elevenLabsVoiceId + ')'
  };
};
