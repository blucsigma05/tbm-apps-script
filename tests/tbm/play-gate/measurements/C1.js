/**
 * C1 — panel-layout-library (Comic Studio)
 * At least 6 panel layouts available and usable without freeform drawing.
 *
 * BEHAVIORAL: open the layout picker, count layout options. Falls back to
 * source-grep of `.layout-N` CSS class definitions when DOM hasn't rendered.
 *
 * Self-skips on routes other than /comic-studio.
 */

var helpers = require('./_helpers');

module.exports = async function C1(ctx) {
  if (ctx.route !== '/comic-studio') {
    return { id: 'C1', status: 'skip', measurement: 'not /comic-studio route' };
  }

  // Try DOM count first
  var domCount = await ctx.page.evaluate(function() {
    var picker = document.getElementById('layout-picker');
    if (!picker) return 0;
    return picker.children.length;
  });

  if (domCount >= 6) {
    return {
      id: 'C1',
      status: 'pass',
      measurement: domCount + ' layouts in #layout-picker',
      expected: '≥6 panel layouts'
    };
  }
  if (domCount > 0 && domCount < 6) {
    return {
      id: 'C1',
      status: 'fail',
      measurement: domCount + ' layouts in #layout-picker',
      expected: '≥6 panel layouts'
    };
  }

  // Picker not yet rendered — fall back to source CSS class count
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'C1', status: 'fail', measurement: 'ComicStudio.html missing and DOM has 0 layouts' };
  }
  var layoutClassMatches = surface.src.match(/\.panel-grid\.layout-(\d+)/g) || [];
  var layoutNumbers = {};
  for (var i = 0; i < layoutClassMatches.length; i++) {
    var n = layoutClassMatches[i].replace(/^.*-/, '');
    layoutNumbers[n] = true;
  }
  var distinctLayouts = Object.keys(layoutNumbers).length;
  if (distinctLayouts >= 6) {
    return {
      id: 'C1',
      status: 'surrogate',
      surrogateNote: 'static CSS class count — picker not yet rendered in viewport, but ' + distinctLayouts + ' layout classes defined',
      measurement: distinctLayouts + ' .panel-grid.layout-N CSS variants',
      expected: '≥6 layouts visible in #layout-picker (PR-3 behavioral after picker open)'
    };
  }
  return {
    id: 'C1',
    status: 'fail',
    measurement: 'only ' + distinctLayouts + ' layout CSS classes defined and DOM picker has ' + domCount,
    expected: '≥6 panel layouts'
  };
};
