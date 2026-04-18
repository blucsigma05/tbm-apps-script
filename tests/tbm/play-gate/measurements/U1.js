/**
 * U1 — correct-device
 * Playwright viewport matches the device profile from ops/play-gate-profiles.json.
 */

module.exports = async function U1(ctx) {
  var actual = ctx.page.viewportSize();
  var expected = ctx.device.viewport;
  var match = actual && actual.width === expected.width && actual.height === expected.height;
  return {
    id: 'U1',
    status: match ? 'pass' : 'fail',
    measurement: 'viewport ' + (actual ? actual.width + 'x' + actual.height : 'null'),
    expected: expected.width + 'x' + expected.height + ' (' + ctx.device.label + ')'
  };
};
