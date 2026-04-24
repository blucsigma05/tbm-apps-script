/**
 * U9 — controls-fit-device
 * Buttons, input fields, and drawing areas are reachable and usable on the
 * target device. Touch targets ≥44px (standard); ≥60px on JJ tablet per
 * prek-milestones.md:93.
 *
 * This is a BEHAVIORAL measurement (not a static grep surrogate) — it measures
 * bounding boxes at the current viewport and asserts minimum dimensions.
 *
 * Rubric enforcement: every non-decoratively-hidden interactive element must
 * pass the threshold. Elements that are positioned off-viewport but remain
 * visible (clipped / unreachable at the current viewport) count as violations —
 * the rubric is about reachability on the target device, so a 44px button that
 * lives at y=2000px on a 912px viewport still fails. Only aria-hidden / CSS-
 * hidden nodes are skipped (those are design-intended-hidden modals/toasts).
 */

module.exports = async function U9(ctx) {
  // JJ surfaces have a stricter threshold for early-learner fine motor skills.
  var minPx = ctx.child === 'jj' ? 60 : 44;

  var sampled = await ctx.page.evaluate(function() {
    // Rubric names "drawing areas" alongside buttons + input fields, so
    // canvas and svg are measured too. Comic Studio and WolfkidCER have
    // canvas drawing surfaces whose size fit would otherwise go unchecked.
    var selectors = ['button', '[role="button"]', 'input[type="text"]', 'input[type="number"]',
                     'input[type="email"]', 'input[type="password"]', 'textarea',
                     '[onclick]', '.btn', '.starter-pill', '.option',
                     'canvas', 'svg'];
    var seen = {};
    var out = [];
    for (var s = 0; s < selectors.length; s++) {
      var nodes = document.querySelectorAll(selectors[s]);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (seen[n.__pgId]) continue;
        n.__pgId = 'pg-' + s + '-' + i;
        seen[n.__pgId] = true;

        // Skip design-intended-hidden nodes (aria-hidden subtree, display:none,
        // visibility:hidden). These are not reachable to the user and are
        // correctly excluded from the touch-target count.
        var cs = window.getComputedStyle(n);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (n.closest && n.closest('[aria-hidden="true"]')) continue;

        var r = n.getBoundingClientRect();
        // Skip truly zero-dimension nodes (CSS-collapsed, not rendered yet).
        if (r.width === 0 && r.height === 0) continue;

        // Record even when off-viewport — the rubric treats off-viewport-but-
        // visible controls as unreachable at the current device viewport.
        var offscreen = (r.bottom < 0 || r.top > window.innerHeight ||
                         r.right < 0 || r.left > window.innerWidth);
        out.push({
          selector: selectors[s],
          w: Math.round(r.width),
          h: Math.round(r.height),
          offscreen: offscreen,
          text: (n.innerText || n.value || '').slice(0, 30).replace(/\s+/g, ' ').trim()
        });
      }
    }
    return out;
  });

  if (!sampled || sampled.length === 0) {
    return {
      id: 'U9',
      status: 'surrogate',
      surrogateNote: 'no interactive elements rendered — surface may be pre-start or loading',
      measurement: '0 interactive elements sampled at ' + ctx.device.viewport.width + 'x' + ctx.device.viewport.height,
      expected: 'at least 1 interactive element ≥' + minPx + 'px'
    };
  }

  var undersized = sampled.filter(function(el) {
    // Min-dimension check matches WCAG 2.5.8.
    return Math.min(el.w, el.h) < minPx;
  });
  var offViewport = sampled.filter(function(el) { return el.offscreen; });
  var violations = undersized.concat(offViewport.filter(function(el) {
    return undersized.indexOf(el) < 0;
  }));

  if (violations.length > 0) {
    var sample = violations.slice(0, 3).map(function(v) {
      var tag = v.offscreen && Math.min(v.w, v.h) >= minPx ? 'off-viewport' : (v.w + 'x' + v.h);
      return tag + ' "' + v.text + '"';
    }).join(' | ');
    return {
      id: 'U9',
      status: 'fail',
      measurement: violations.length + '/' + sampled.length + ' elements violate threshold: ' +
                   undersized.length + ' undersized, ' + offViewport.length + ' off-viewport. ' + sample,
      expected: 'all touch targets ≥' + minPx + 'px AND in viewport (WCAG 2.5.8' +
                (ctx.child === 'jj' ? ' + prek-milestones.md:93' : '') + ')'
    };
  }
  return {
    id: 'U9',
    status: 'pass',
    measurement: sampled.length + ' interactive elements ≥' + minPx + 'px and in viewport at ' +
                 ctx.device.viewport.width + 'x' + ctx.device.viewport.height,
    expected: 'all touch targets ≥' + minPx + 'px'
  };
};
