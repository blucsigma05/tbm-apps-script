/**
 * C4 — canvas-freeform (Comic Studio)
 * Freeform drawing AND image import work as panel layer actions.
 *
 * Source check: <canvas> element rendered for panels + image-import wiring
 * (input type=file accept=image, FileReader, or img/dataURL handling).
 * Verified 2026-04-21: ComicStudio.html has `<canvas id="canvas-N">` per
 * panel and `toDataURL` save calls.
 *
 * Self-skips on routes other than /comic-studio.
 */

var helpers = require('./_helpers');

var CANVAS_MARKERS = [
  /<canvas\b/,
  /getContext\(['"]2d/,
  /strokeStyle|lineWidth|moveTo|lineTo/,
  /toDataURL/,
  /panelCanvases/
];

var IMPORT_MARKERS = [
  /input.*type=['"]file/i,
  /accept=['"]image/i,
  /FileReader/,
  /readAsDataURL/,
  /onPasteImage|importImage|loadImageFromFile|drawImage/i
];

module.exports = async function C4(ctx) {
  if (ctx.route !== '/comic-studio') {
    return { id: 'C4', status: 'skip', measurement: 'not /comic-studio route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'C4', status: 'fail', measurement: 'ComicStudio.html missing' };
  }
  var canvasHits = 0;
  for (var i = 0; i < CANVAS_MARKERS.length; i++) {
    if (CANVAS_MARKERS[i].test(surface.src)) canvasHits++;
  }
  var importHits = 0;
  for (var j = 0; j < IMPORT_MARKERS.length; j++) {
    if (IMPORT_MARKERS[j].test(surface.src)) importHits++;
  }
  if (canvasHits === 0) {
    return {
      id: 'C4',
      status: 'fail',
      measurement: 'no canvas markers in ComicStudio.html',
      expected: '<canvas> + drawing context wiring'
    };
  }
  if (importHits === 0) {
    return {
      id: 'C4',
      status: 'fail',
      measurement: canvasHits + ' canvas marker(s) but 0 image-import markers',
      expected: 'image import via FileReader / input[type=file]'
    };
  }
  return {
    id: 'C4',
    status: 'surrogate',
    surrogateNote: 'static check — canvas + image-import wiring present; behavioral draw-stroke + import-image test deferred to PR-3',
    measurement: canvasHits + ' canvas + ' + importHits + ' import marker(s)',
    expected: 'stroke visible on canvas + imported image as panel layer (PR-3 behavioral)'
  };
};
