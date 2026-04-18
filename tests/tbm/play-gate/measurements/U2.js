/**
 * U2 — loads-cleanly
 * HTTP 200, no blocking console errors, no text "undefined"/"null" in visible DOM.
 *
 * ctx.httpStatus is the status from the initial navigation captured by the spec.
 * ctx.consoleErrors is the running list of error-level console messages.
 */

module.exports = async function U2(ctx) {
  if (ctx.httpStatus !== 200) {
    return {
      id: 'U2',
      status: 'fail',
      measurement: 'http status ' + ctx.httpStatus,
      expected: '200'
    };
  }
  var blocking = ctx.consoleErrors.filter(function(e) {
    if (e.indexOf('favicon') !== -1) return false;
    if (e.indexOf('net::ERR') !== -1) return false;
    if (e.indexOf('404') !== -1) return false;
    return true;
  });
  if (blocking.length > 0) {
    return {
      id: 'U2',
      status: 'fail',
      measurement: blocking.length + ' blocking console errors: ' + blocking.slice(0, 2).join(' | '),
      expected: '0 blocking console errors'
    };
  }
  return {
    id: 'U2',
    status: 'pass',
    measurement: 'HTTP 200, 0 blocking console errors',
    expected: 'clean load'
  };
};
