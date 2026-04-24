/**
 * B5 — challenge-fit (Buggsy)
 * Tasks feel age-appropriate — not babyish, not needlessly frustrating.
 * Aligned with Buggsy's curriculum level (TEKS-tagged).
 *
 * Fixture-mode surrogate: confirm the surface references TEKS-aligned content
 * (TEKS string / curriculum-engine call / grade-level marker). The fixture
 * data in tests/tbm/fixtures/gas-shim.js EDUCATION_FIXTURES uses TEKS 4.7A
 * (4th grade) which IS Buggsy-aligned. Behavioral check (LT/parent reads
 * 3 questions and confirms grade-fit) is PR-3.
 */

var helpers = require('./_helpers');

var CURRICULUM_MARKERS = [
  /\bteks\b/i,
  /TEKS/,
  /4th[-\s]grade/i,
  /grade.*4/i,
  /Curriculum/,
  /CurriculumSeed/,
  /strand/i
];

module.exports = async function B5(ctx) {
  if (ctx.child !== 'buggsy') {
    return { id: 'B5', status: 'skip', measurement: 'not Buggsy route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'B5', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }

  // Source check: any curriculum/grade-level marker?
  var sourceHits = [];
  for (var i = 0; i < CURRICULUM_MARKERS.length; i++) {
    if (CURRICULUM_MARKERS[i].test(surface.src)) {
      sourceHits.push(CURRICULUM_MARKERS[i].toString().slice(0, 30));
    }
  }

  // DOM check: are any TEKS / curriculum markers visible in rendered content?
  var domHit = await ctx.page.evaluate(function() {
    var bodyText = (document.body && document.body.innerText) || '';
    var teksMatch = bodyText.match(/\b(?:TEKS\s+)?\d\.\d\w?\b/);
    return teksMatch ? teksMatch[0] : null;
  });

  if (sourceHits.length === 0 && !domHit) {
    return {
      id: 'B5',
      status: 'surrogate',
      surrogateNote: 'no curriculum markers found — challenge-fit cannot be auto-asserted; LT review required',
      measurement: 'no TEKS/curriculum marker in source or DOM',
      expected: 'TEKS reference or grade-4 alignment marker'
    };
  }
  return {
    id: 'B5',
    status: 'surrogate',
    surrogateNote: 'static check — curriculum markers present; LT/parent grade-fit review remains the authoritative gate (PR-3 framework)',
    measurement: sourceHits.length + ' source marker(s)' + (domHit ? ', DOM TEKS: ' + domHit : ''),
    expected: '4th-grade TEKS-aligned content per Curriculum tab (PR-3 LT review)'
  };
};
