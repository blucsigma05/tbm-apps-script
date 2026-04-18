/**
 * B1 — mission-clarity (Buggsy)
 * Primary mission/task instruction ≤30 words.
 */

module.exports = async function B1(ctx) {
  if (ctx.child !== 'buggsy') {
    return { id: 'B1', status: 'skip', measurement: 'not Buggsy route' };
  }
  var candidates = [
    '#hw-lcp-skeleton',
    '.mission-title',
    '.task-title',
    '.today-title',
    '.module-title',
    'h1',
    'h2'
  ];
  for (var i = 0; i < candidates.length; i++) {
    var sel = candidates[i];
    var count = await ctx.page.locator(sel).count();
    if (count > 0) {
      var text = await ctx.page.locator(sel).first().innerText().catch(function() { return ''; });
      var trimmed = text.replace(/\s+/g, ' ').trim();
      if (trimmed.length === 0) continue;
      var words = trimmed.split(' ').filter(function(w) { return w.length > 0; });
      if (words.length <= 30) {
        return {
          id: 'B1',
          status: 'pass',
          measurement: sel + ' text (' + words.length + ' words): "' + trimmed.slice(0, 60) + '"',
          expected: '≤30 words for initial goal statement'
        };
      }
      return {
        id: 'B1',
        status: 'fail',
        measurement: sel + ' text has ' + words.length + ' words (>30)',
        expected: '≤30 words'
      };
    }
  }
  return {
    id: 'B1',
    status: 'fail',
    measurement: 'no mission-title-like element found on ' + ctx.route,
    expected: 'visible mission/task title ≤30 words'
  };
};
