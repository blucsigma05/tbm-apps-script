/**
 * PRE-4 — safe-wrapper-chain-intact
 * Every google.script.run.<fn>() call must use a Safe wrapper (name ends in "Safe").
 *
 * Parsing strategy: locate each `google.script.run` anchor, then walk the chain
 * `.methodName(args)` using balanced-paren argument scanning (so method calls
 * inside handler callbacks like `withFailureHandler(function(e){ console.log(e); })`
 * don't leak into the chain walk). Handler method names (withSuccessHandler,
 * withFailureHandler, withUserObject) are filtered out — the remaining method
 * names in the chain are the server callees that must end in "Safe".
 */

var fs = require('fs');
var path = require('path');

var ROUTE_TO_HTML = {
  '/sparkle': 'SparkleLearning.html',
  '/homework': 'HomeworkModule.html'
};

var HANDLER_METHODS = { withSuccessHandler: 1, withFailureHandler: 1, withUserObject: 1 };

function extractChainMethods(src, startIdx) {
  var methods = [];
  var i = startIdx;
  var n = src.length;

  function skipWs() { while (i < n && /\s/.test(src[i])) i++; }

  while (i < n) {
    skipWs();
    if (src[i] !== '.') break;
    i++;
    skipWs();
    var nameStart = i;
    while (i < n && /[A-Za-z0-9_$]/.test(src[i])) i++;
    if (i === nameStart) break;
    var name = src.slice(nameStart, i);
    skipWs();
    if (src[i] !== '(') break;
    // Consume balanced parens (respect string / line-comment content)
    var depth = 1;
    i++;
    while (i < n && depth > 0) {
      var c = src[i];
      if (c === '"' || c === "'" || c === '`') {
        var quote = c;
        i++;
        while (i < n && src[i] !== quote) {
          if (src[i] === '\\' && i + 1 < n) i++;
          i++;
        }
        if (i < n) i++;
        continue;
      }
      if (c === '/' && src[i + 1] === '/') {
        while (i < n && src[i] !== '\n') i++;
        continue;
      }
      if (c === '/' && src[i + 1] === '*') {
        i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
        if (i < n) i += 2;
        continue;
      }
      if (c === '(') depth++;
      else if (c === ')') depth--;
      i++;
    }
    methods.push(name);
  }
  return methods;
}

module.exports = async function PRE_4(ctx) {
  var htmlFile = ROUTE_TO_HTML[ctx.route];
  if (!htmlFile) {
    return { id: 'PRE-4', status: 'skip', measurement: 'no HTML mapping for route ' + ctx.route };
  }
  var abs = path.join(ctx.repoRoot, htmlFile);
  if (!fs.existsSync(abs)) {
    return { id: 'PRE-4', status: 'fail', measurement: 'html file not found: ' + htmlFile };
  }
  var src = fs.readFileSync(abs, 'utf8');
  var anchor = 'google.script.run';
  var searchFrom = 0;
  var nonSafe = [];
  var total = 0;
  while (true) {
    var idx = src.indexOf(anchor, searchFrom);
    if (idx < 0) break;
    var methods = extractChainMethods(src, idx + anchor.length);
    for (var k = 0; k < methods.length; k++) {
      var name = methods[k];
      if (HANDLER_METHODS[name]) continue;
      total++;
      if (name.slice(-4) !== 'Safe') nonSafe.push(name);
    }
    searchFrom = idx + anchor.length;
  }
  if (nonSafe.length > 0) {
    return {
      id: 'PRE-4',
      status: 'fail',
      measurement: nonSafe.length + ' non-Safe callees: ' + nonSafe.slice(0, 5).join(', '),
      expected: 'all google.script.run callees end in "Safe"'
    };
  }
  return {
    id: 'PRE-4',
    status: 'pass',
    measurement: total + ' google.script.run callees — all end in "Safe"',
    expected: 'all Safe-wrapped'
  };
};
