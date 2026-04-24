/**
 * C3 — character-placement (Comic Studio)
 * Drag-drop character or image onto a panel works. No character rigging
 * required.
 *
 * Source check: character-tray / asset-picker mechanism present, OR drag-drop
 * pointer-event handlers wired (pointerdown/dragstart on a draggable asset).
 *
 * Note: 2026-04-21 source inspection of ComicStudio.html found no character
 * tray or asset-picker selectors. Image-as-panel-layer (canvas drawing) is
 * present but the character-placement criterion specifically targets
 * pre-built character assets. This will likely return `fail`, which IS the
 * correct verdict — the rubric criterion exposes a real gap to backlog.
 *
 * Self-skips on routes other than /comic-studio.
 */

var helpers = require('./_helpers');

var CHARACTER_MARKERS = [
  /character[-_]?tray/i,
  /character[-_]?picker/i,
  /asset[-_]?picker/i,
  /asset[-_]?grid/i,
  /loadCharacters/,
  /placeCharacter/i,
  /\bdragover\b/,
  /\bdrop\b.*character/i,
  /draggable=['"]true/
];

module.exports = async function C3(ctx) {
  if (ctx.route !== '/comic-studio') {
    return { id: 'C3', status: 'skip', measurement: 'not /comic-studio route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'C3', status: 'fail', measurement: 'ComicStudio.html missing' };
  }
  var matched = [];
  for (var i = 0; i < CHARACTER_MARKERS.length; i++) {
    if (CHARACTER_MARKERS[i].test(surface.src)) {
      matched.push(CHARACTER_MARKERS[i].toString().slice(0, 40));
    }
  }
  if (matched.length === 0) {
    return {
      id: 'C3',
      status: 'fail',
      measurement: 'no character-placement marker in ComicStudio.html — character tray / asset picker / drag-drop wiring absent',
      expected: 'character or image asset placeable on a panel via drag-drop or tap-to-place'
    };
  }
  return {
    id: 'C3',
    status: 'surrogate',
    surrogateNote: 'static check — character/drag-drop markers present; behavioral place-character test deferred to PR-3',
    measurement: matched.length + ' character marker(s): ' + matched.slice(0, 2).join(' | '),
    expected: 'character visible on panel after drag-drop (PR-3 behavioral)'
  };
};
