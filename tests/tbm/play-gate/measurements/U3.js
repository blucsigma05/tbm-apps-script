/**
 * U3 — correct-child-context
 * Asserts child-specific CSS class is present in DOM: sparkle-body for JJ, or
 * wolfdome-body / wolfdome-bg for Buggsy. Fall-back: child name text visible.
 */

var CHILD_SELECTORS = {
  jj: ['.sparkle-body', '[data-child="jj"]', '.sparkle-bg', '.sparkle-kingdom'],
  buggsy: ['.wolfdome-body', '[data-child="buggsy"]', '.wolfdome-bg', '.wolfdome']
};

module.exports = async function U3(ctx) {
  var selectors = CHILD_SELECTORS[ctx.child];
  var foundSelector = null;
  for (var i = 0; i < selectors.length; i++) {
    var n = await ctx.page.locator(selectors[i]).count();
    if (n > 0) { foundSelector = selectors[i]; break; }
  }
  if (foundSelector) {
    return {
      id: 'U3',
      status: 'pass',
      measurement: 'child theme selector present: ' + foundSelector,
      expected: 'child-specific CSS class on body or descendant'
    };
  }
  // Fallback: look for the child name in the rendered DOM text
  var bodyText = await ctx.page.locator('body').innerText().catch(function() { return ''; });
  var nameLower = ctx.child === 'jj' ? 'jj' : 'buggsy';
  if (bodyText.toLowerCase().indexOf(nameLower) !== -1) {
    return {
      id: 'U3',
      status: 'pass',
      measurement: 'child name "' + nameLower + '" present in body text (selector fallback)',
      expected: 'child context visible'
    };
  }
  return {
    id: 'U3',
    status: 'fail',
    measurement: 'no child theme selector or name text found',
    expected: 'sparkle-body / wolfdome-body class OR child name in DOM'
  };
};
