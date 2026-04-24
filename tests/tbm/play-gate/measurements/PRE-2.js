/**
 * PRE-2 — failure-handler-coverage
 * Every google.script.run.<fn>Safe() call must have a matching non-empty .withFailureHandler().
 *
 * Static grep against surface HTML (runs before page load — this is a precondition).
 *
 * PR-2 update (Gitea #54): use shared _helpers.loadSurface so coverage extends
 * to all 15 play-gate routes, not just /sparkle + /homework.
 */

var helpers = require('./_helpers');

module.exports = async function PRE_2(ctx) {
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return {
      id: 'PRE-2',
      status: 'skip',
      measurement: 'no HTML mapping for route ' + ctx.route
    };
  }
  var src = surface.src;
  var empty1 = src.match(/withFailureHandler\(function\(\)\s*\{\s*\}\)/g);
  var empty2 = src.match(/withFailureHandler\(\(\)\s*=>\s*\{\s*\}\)/g);
  var emptyCount = (empty1 ? empty1.length : 0) + (empty2 ? empty2.length : 0);
  if (emptyCount > 0) {
    return {
      id: 'PRE-2',
      status: 'fail',
      measurement: emptyCount + ' empty withFailureHandler in ' + surface.file,
      expected: '0 empty handlers'
    };
  }
  var withHandlerCount = (src.match(/withFailureHandler/g) || []).length;
  return {
    id: 'PRE-2',
    status: 'pass',
    measurement: withHandlerCount + ' non-empty withFailureHandler calls in ' + surface.file,
    expected: 'no empty handlers'
  };
};
