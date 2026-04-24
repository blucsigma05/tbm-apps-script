/**
 * C5 — artifact-export (Comic Studio)
 * Saves and exports a single comic. Exported artifact is restorable.
 *
 * Source check: saveComicDraftSafe call site (verified 2026-04-21 at
 * ComicStudio.html:2497) + an export mechanism (toDataURL on panelCanvases,
 * verified at ComicStudio.html:1499 and 2320).
 */

var helpers = require('./_helpers');

var SAVE_MARKERS = [
  /saveComicDraftSafe/,
  /KH_StoryProgress/,
  /applyDraftState/
];

var EXPORT_MARKERS = [
  /toDataURL\(['"]image\/png/,
  /toDataURL\(['"]image\/jpeg/,
  /downloadAsPng|downloadAsPdf|exportComic|exportPanel/i,
  /\.toBlob\(/
];

module.exports = async function C5(ctx) {
  if (ctx.route !== '/comic-studio') {
    return { id: 'C5', status: 'skip', measurement: 'not /comic-studio route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'C5', status: 'fail', measurement: 'ComicStudio.html missing' };
  }
  var saveHits = 0;
  for (var i = 0; i < SAVE_MARKERS.length; i++) {
    if (SAVE_MARKERS[i].test(surface.src)) saveHits++;
  }
  var exportHits = 0;
  for (var j = 0; j < EXPORT_MARKERS.length; j++) {
    if (EXPORT_MARKERS[j].test(surface.src)) exportHits++;
  }
  if (saveHits === 0) {
    return {
      id: 'C5',
      status: 'fail',
      measurement: 'no save mechanism — saveComicDraftSafe / KH_StoryProgress absent',
      expected: 'durable save call site'
    };
  }
  if (exportHits === 0) {
    return {
      id: 'C5',
      status: 'fail',
      measurement: saveHits + ' save marker(s) but 0 export markers',
      expected: 'PNG/PDF export via toDataURL or toBlob'
    };
  }
  return {
    id: 'C5',
    status: 'surrogate',
    surrogateNote: 'static check — save + export wiring present; round-trip save→export→reopen test deferred to PR-3',
    measurement: saveHits + ' save + ' + exportHits + ' export marker(s)',
    expected: 'comic saves to KH_StoryProgress + exports PNG/PDF (PR-3 behavioral)'
  };
};
