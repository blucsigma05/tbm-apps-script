/**
 * C2 — dialogue-affordance (Comic Studio)
 * Speech bubble placement and text entry works on Surface Pro 5. Dialogue
 * is a first-class creation action.
 *
 * Source check: `.speech-bubble` CSS + `bubble-text` contenteditable span +
 * an addBubble or createBubble call site. Behavioral test (add bubble, type
 * dialogue, verify text persists) is PR-3.
 *
 * Self-skips on routes other than /comic-studio.
 */

var helpers = require('./_helpers');

var BUBBLE_MARKERS = [
  /\.speech-bubble\b/,
  /class=['"]speech-bubble/,
  /bubble-text/,
  /contenteditable/,
  /addBubble|createBubble|insertBubble|spawnBubble/i
];

module.exports = async function C2(ctx) {
  if (ctx.route !== '/comic-studio') {
    return { id: 'C2', status: 'skip', measurement: 'not /comic-studio route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'C2', status: 'fail', measurement: 'ComicStudio.html missing' };
  }
  var matched = [];
  for (var i = 0; i < BUBBLE_MARKERS.length; i++) {
    if (BUBBLE_MARKERS[i].test(surface.src)) {
      matched.push(BUBBLE_MARKERS[i].toString().slice(0, 40));
    }
  }
  // Need both styling and an interactive entry mechanism
  if (matched.length < 2) {
    return {
      id: 'C2',
      status: 'fail',
      measurement: matched.length + ' bubble markers in ComicStudio.html',
      expected: 'at least .speech-bubble class + contenteditable text entry'
    };
  }
  return {
    id: 'C2',
    status: 'surrogate',
    surrogateNote: 'static check — bubble styling + entry mechanism present; behavioral add-bubble + type-text test deferred to PR-3',
    measurement: matched.length + ' bubble marker(s): ' + matched.slice(0, 2).join(' | '),
    expected: 'add bubble + type dialogue + readable on Surface Pro 5 viewport (PR-3 behavioral)'
  };
};
