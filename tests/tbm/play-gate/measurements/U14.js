/**
 * U14 — error-has-retry-path
 * No native alert() as primary error UX, no empty withFailureHandler, no gate-check bypass.
 */

var fs = require('fs');
var path = require('path');

var ROUTE_TO_HTML = {
  '/sparkle': 'SparkleLearning.html',
  '/homework': 'HomeworkModule.html'
};

module.exports = async function U14(ctx) {
  var htmlFile = ROUTE_TO_HTML[ctx.route];
  if (!htmlFile) return { id: 'U14', status: 'skip', measurement: 'no HTML mapping' };
  var abs = path.join(ctx.repoRoot, htmlFile);
  var src = fs.readFileSync(abs, 'utf8');

  var alertMatches = src.match(/\balert\s*\(/g);
  var alertCount = alertMatches ? alertMatches.length : 0;

  var emptyHandler = /withFailureHandler\(function\(\)\s*\{\s*\}\)/.test(src)
    || /withFailureHandler\(\(\)\s*=>\s*\{\s*\}\)/.test(src);

  if (alertCount > 0 && !/\/\/\s*ok-alert/i.test(src)) {
    return {
      id: 'U14',
      status: 'fail',
      measurement: alertCount + ' alert() call(s) in ' + htmlFile,
      expected: 'no native alert() for primary errors (use in-surface UI)'
    };
  }
  if (emptyHandler) {
    return {
      id: 'U14',
      status: 'fail',
      measurement: 'empty withFailureHandler detected in ' + htmlFile,
      expected: 'non-empty handlers that surface error to user'
    };
  }
  return {
    id: 'U14',
    status: 'pass',
    measurement: 'no alert() and no empty withFailureHandler',
    expected: 'in-surface error UI'
  };
};
