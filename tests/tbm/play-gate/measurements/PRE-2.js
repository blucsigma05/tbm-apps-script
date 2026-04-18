/**
 * PRE-2 — failure-handler-coverage
 * Every google.script.run.<fn>Safe() call must have a matching non-empty .withFailureHandler().
 *
 * Static grep against surface HTML (runs before page load — this is a precondition).
 */

var fs = require('fs');
var path = require('path');

var ROUTE_TO_HTML = {
  '/sparkle': 'SparkleLearning.html',
  '/homework': 'HomeworkModule.html'
};

module.exports = async function PRE_2(ctx) {
  var htmlFile = ROUTE_TO_HTML[ctx.route];
  if (!htmlFile) {
    return {
      id: 'PRE-2',
      status: 'skip',
      measurement: 'no HTML mapping for route ' + ctx.route
    };
  }
  var abs = path.join(ctx.repoRoot, htmlFile);
  if (!fs.existsSync(abs)) {
    return { id: 'PRE-2', status: 'fail', measurement: 'html file not found: ' + htmlFile };
  }
  var src = fs.readFileSync(abs, 'utf8');
  var empty1 = src.match(/withFailureHandler\(function\(\)\s*\{\s*\}\)/g);
  var empty2 = src.match(/withFailureHandler\(\(\)\s*=>\s*\{\s*\}\)/g);
  var emptyCount = (empty1 ? empty1.length : 0) + (empty2 ? empty2.length : 0);
  if (emptyCount > 0) {
    return {
      id: 'PRE-2',
      status: 'fail',
      measurement: emptyCount + ' empty withFailureHandler in ' + htmlFile,
      expected: '0 empty handlers'
    };
  }
  var withHandlerCount = (src.match(/withFailureHandler/g) || []).length;
  return {
    id: 'PRE-2',
    status: 'pass',
    measurement: withHandlerCount + ' non-empty withFailureHandler calls in ' + htmlFile,
    expected: 'no empty handlers'
  };
};
