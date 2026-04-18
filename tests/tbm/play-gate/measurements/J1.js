/**
 * J1 — theme-integrity (JJ / Sparkle Kingdom)
 * Sparkle Kingdom background + palette present. Not a generic worksheet.
 */

module.exports = async function J1(ctx) {
  if (ctx.child !== 'jj') {
    return { id: 'J1', status: 'skip', measurement: 'not JJ route' };
  }
  var bodyBg = await ctx.page.evaluate(function() {
    var body = document.querySelector('body');
    if (!body) return null;
    var cs = getComputedStyle(body);
    return {
      bg: cs.backgroundColor,
      color: cs.color,
      classes: body.className || ''
    };
  });
  if (!bodyBg) {
    return { id: 'J1', status: 'fail', measurement: 'body element not found' };
  }
  var hasThemeClass = /sparkle/i.test(bodyBg.classes);
  // Deep purple per ops/themes/palettes.md Sparkle Kingdom set.
  // rgb(45, 27, 105) = #2D1B69 (canonical); also accept variants near deep purple.
  var m = bodyBg.bg.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  var isDeepPurple = false;
  if (m) {
    var r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
    isDeepPurple = r < 120 && b > r && b >= 90 && g < 100;
  }
  if (hasThemeClass || isDeepPurple) {
    return {
      id: 'J1',
      status: 'pass',
      measurement: 'bg=' + bodyBg.bg + ' classes=' + bodyBg.classes.slice(0, 60),
      expected: 'sparkle-body class OR deep-purple bg per palettes.md'
    };
  }
  return {
    id: 'J1',
    status: 'fail',
    measurement: 'bg=' + bodyBg.bg + ' classes=' + bodyBg.classes.slice(0, 60),
    expected: 'sparkle-body class OR deep-purple bg per palettes.md'
  };
};
