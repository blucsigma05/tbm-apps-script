/**
 * J3 — delighted-success (JJ)
 * Correct actions produce friendly delight — sparkle, star, celebration,
 * or clear positive feedback within 500ms.
 *
 * Fixture-mode surrogate: assert celebration/star/sparkle markers exist in
 * source AND there's an audio celebration call (celebration.mp3 / playAudioCached).
 * Behavioral 500ms-to-celebration timing test is PR-3.
 */

var helpers = require('./_helpers');

var DELIGHT_MARKERS = [
  /celebration-wrap/i,
  /celebration-stars/i,
  /star-counter/i,
  /star-burst/i,
  /sparkle-celebration/i,
  /renderCelebration/,
  /playAudioCached\(['"]celebration/,
  /\.starBurst/
];

module.exports = async function J3(ctx) {
  if (ctx.child !== 'jj') {
    return { id: 'J3', status: 'skip', measurement: 'not JJ route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'J3', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  var matched = [];
  for (var i = 0; i < DELIGHT_MARKERS.length; i++) {
    if (DELIGHT_MARKERS[i].test(surface.src)) {
      matched.push(DELIGHT_MARKERS[i].toString().slice(0, 40));
    }
  }
  if (matched.length === 0) {
    return {
      id: 'J3',
      status: 'fail',
      measurement: 'no delight/celebration marker in ' + surface.file,
      expected: 'celebration / star-counter / sparkle-celebration class OR celebration audio'
    };
  }
  return {
    id: 'J3',
    status: 'surrogate',
    surrogateNote: 'static grep proxy — celebration markers present; 500ms-to-render timing test deferred to PR-3',
    measurement: matched.length + ' delight marker(s): ' + matched.slice(0, 2).join(' | '),
    expected: 'celebration animation visible within 500ms of correct action (PR-3 behavioral)'
  };
};
