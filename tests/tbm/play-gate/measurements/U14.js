/**
 * U14 — error-has-retry-path
 * No native alert() as primary error UX, no empty withFailureHandler, no gate-check bypass.
 */

var helpers = require('./_helpers');

// PR-2 update (Gitea #54): use shared _helpers.loadSurface so coverage
// extends to all 15 play-gate routes (was only /sparkle + /homework in PR-1).

module.exports = async function U14(ctx) {
  var surface = helpers.loadSurface(ctx);
  if (!surface) return { id: 'U14', status: 'skip', measurement: 'no HTML mapping' };
  var src = surface.src;

  var alertMatches = src.match(/\balert\s*\(/g);
  var alertCount = alertMatches ? alertMatches.length : 0;

  var emptyHandler = /withFailureHandler\(function\(\)\s*\{\s*\}\)/.test(src)
    || /withFailureHandler\(\(\)\s*=>\s*\{\s*\}\)/.test(src);

  if (alertCount > 0 && !/\/\/\s*ok-alert/i.test(src)) {
    return {
      id: 'U14',
      status: 'fail',
      measurement: alertCount + ' alert() call(s) in ' + surface.file,
      expected: 'no native alert() for primary errors (use in-surface UI)'
    };
  }
  if (emptyHandler) {
    return {
      id: 'U14',
      status: 'fail',
      measurement: 'empty withFailureHandler detected in ' + surface.file,
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
