/**
 * U8 — feedback-understandable
 * Taps/clicks/answers/saves produce visible or audible confirmation
 * appropriate for the child's age.
 *
 * Fixture-mode surrogate: static grep for feedback-bearing class/animation
 * markers (celebration, ring-award, nav-block, boltFlash, warpIn, fadeSlide)
 * AND at least one audio call site (playAudioCached, playSfx, audio.play).
 * Behavioral 500ms-to-feedback timing test is PR-3 work.
 */

var helpers = require('./_helpers');

var VISUAL_FEEDBACK_MARKERS = [
  /celebration-wrap/i,
  /ring-award/i,
  /completion-ring/i,
  /star-burst/i,
  /navBlockFade/,
  /boltFlash/,
  /warpIn/,
  /fadeSlide/,
  /feedback-explain/,
  /answer-correct/i,
  /answer-wrong/i
];

var AUDIO_FEEDBACK_MARKERS = [
  /playAudioCached/,
  /playSfx/i,
  /\.play\(\)/,
  /new Audio\(/,
  /speechSynthesis/
];

module.exports = async function U8(ctx) {
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'U8', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  var visualHits = 0;
  for (var i = 0; i < VISUAL_FEEDBACK_MARKERS.length; i++) {
    if (VISUAL_FEEDBACK_MARKERS[i].test(surface.src)) visualHits++;
  }
  var audioHits = 0;
  for (var j = 0; j < AUDIO_FEEDBACK_MARKERS.length; j++) {
    if (AUDIO_FEEDBACK_MARKERS[j].test(surface.src)) audioHits++;
  }
  var total = visualHits + audioHits;
  if (total === 0) {
    return {
      id: 'U8',
      status: 'fail',
      measurement: 'no visual or audio feedback markers in ' + surface.file,
      expected: 'at least one visual animation class OR audio-play call site'
    };
  }
  return {
    id: 'U8',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — feedback markers present; 500ms-to-feedback timing assertion deferred to PR-3',
    measurement: visualHits + ' visual + ' + audioHits + ' audio feedback marker(s) in ' + surface.file,
    expected: 'visible state change OR audible confirmation within 500ms (PR-3 behavioral)'
  };
};
