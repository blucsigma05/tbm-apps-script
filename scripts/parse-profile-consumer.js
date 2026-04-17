#!/usr/bin/env node
/**
 * parse-profile-consumer.js — Extract a named constant or JSON path from a
 * source file and print the value as JSON to stdout.
 *
 * Used by .github/scripts/check_profile_sync.py to verify each inline device
 * map in the repo still matches ops/play-gate-profiles.json.
 *
 * Usage:
 *   node scripts/parse-profile-consumer.js <file> <target>
 *
 * For .js / .mjs / .cjs files: <target> is a top-level variable name
 *   (handles `var/let/const`, `export const`, and `export default`).
 * For .json files: <target> is a dot-path (e.g. "playwright.devices").
 *
 * Exit codes:
 *   0 = success, JSON printed to stdout
 *   1 = bad usage / read error
 *   2 = parse error
 *   3 = target not found
 *   4 = unsupported AST node during ObjectExpression flattening
 */

var fs = require('fs');
var path = require('path');
var parser = require('@babel/parser');

function die(code, msg) {
  process.stderr.write('parse-profile-consumer: ' + msg + '\n');
  process.exit(code);
}

function main(argv) {
  if (argv.length < 4) {
    die(1, 'usage: parse-profile-consumer.js <file> <target>');
  }
  var file = argv[2];
  var target = argv[3];
  var src;
  try {
    src = fs.readFileSync(file, 'utf8');
  } catch (e) {
    die(1, 'cannot read ' + file + ': ' + e.message);
  }

  var ext = path.extname(file).toLowerCase();
  var result;
  if (ext === '.json') {
    result = extractJsonPath(src, target, file);
  } else if (ext === '.js' || ext === '.mjs' || ext === '.cjs') {
    result = extractJsConstant(src, target, file);
  } else {
    die(1, 'unsupported extension: ' + ext);
  }

  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}

function extractJsonPath(src, target, file) {
  var obj;
  try {
    obj = JSON.parse(src);
  } catch (e) {
    die(2, 'invalid JSON in ' + file + ': ' + e.message);
  }
  var segments = target.split('.');
  var cur = obj;
  for (var i = 0; i < segments.length; i++) {
    var key = segments[i];
    if (cur == null || typeof cur !== 'object' || !(key in cur)) {
      die(3, 'target path "' + target + '" not found at segment "' + key + '" in ' + file);
    }
    cur = cur[key];
  }
  return { file: file, target: target, source: 'json', data: cur };
}

function extractJsConstant(src, target, file) {
  var ast;
  try {
    ast = parser.parse(src, {
      sourceType: 'unambiguous',
      plugins: ['jsx']
    });
  } catch (e) {
    die(2, 'cannot parse ' + file + ': ' + e.message);
  }
  var body = ast.program.body;
  for (var i = 0; i < body.length; i++) {
    var node = body[i];
    if (node.type === 'VariableDeclaration') {
      var found = tryExtractFromDeclarations(node.declarations, target);
      if (found !== null) {
        if (found && found.__dynamic) return wrap(file, target, 'js:migrated-callexpr', found);
        return wrap(file, target, 'js:variable', found);
      }
    }
    if (node.type === 'ExportNamedDeclaration' && node.declaration && node.declaration.type === 'VariableDeclaration') {
      var found2 = tryExtractFromDeclarations(node.declaration.declarations, target);
      if (found2 !== null) {
        if (found2 && found2.__dynamic) return wrap(file, target, 'js:migrated-callexpr', found2);
        return wrap(file, target, 'js:export-variable', found2);
      }
    }
    if (target === 'default' && node.type === 'ExportDefaultDeclaration') {
      if (node.declaration && node.declaration.type === 'ObjectExpression') {
        return wrap(file, target, 'js:export-default', astToJs(node.declaration));
      }
      if (node.declaration && node.declaration.type === 'CallExpression') {
        var first = node.declaration.arguments[0];
        if (first && first.type === 'ObjectExpression') {
          return wrap(file, target, 'js:export-default-call', astToJs(first));
        }
      }
    }
  }
  die(3, 'target constant "' + target + '" not found in ' + file);
}

function tryExtractFromDeclarations(declarations, target) {
  for (var i = 0; i < declarations.length; i++) {
    var decl = declarations[i];
    if (decl.id && decl.id.type === 'Identifier' && decl.id.name === target) {
      if (!decl.init) return null;
      // Dynamically-derived (migrated) consumer: the target is built from a
      // function call, not a literal. Return a sentinel instead of crashing —
      // the Python driver will verify the file imports profiles.json and
      // treat it as in-sync by construction.
      if (decl.init.type === 'CallExpression' || decl.init.type === 'NewExpression') {
        return { __dynamic: true, reason: 'init is ' + decl.init.type + ' — consumer derives from runtime source' };
      }
      return astToJs(decl.init);
    }
  }
  return null;
}

function wrap(file, target, source, data) {
  return { file: file, target: target, source: source, data: data };
}

function astToJs(node) {
  if (!node) return null;
  switch (node.type) {
    case 'ObjectExpression':
      var obj = {};
      for (var i = 0; i < node.properties.length; i++) {
        var prop = node.properties[i];
        if (prop.type === 'ObjectProperty' || prop.type === 'Property') {
          if (prop.computed) die(4, 'computed property keys not supported');
          var key;
          if (prop.key.type === 'Identifier') key = prop.key.name;
          else if (prop.key.type === 'StringLiteral') key = prop.key.value;
          else if (prop.key.type === 'NumericLiteral') key = String(prop.key.value);
          else die(4, 'unsupported key type: ' + prop.key.type);
          obj[key] = astToJs(prop.value);
        } else if (prop.type === 'SpreadElement') {
          die(4, 'spread elements (...foo) not supported in profile source');
        } else {
          die(4, 'unsupported object property node: ' + prop.type);
        }
      }
      return obj;
    case 'ArrayExpression':
      var arr = [];
      for (var j = 0; j < node.elements.length; j++) {
        arr.push(node.elements[j] == null ? null : astToJs(node.elements[j]));
      }
      return arr;
    case 'StringLiteral':
      return node.value;
    case 'NumericLiteral':
      return node.value;
    case 'BooleanLiteral':
      return node.value;
    case 'NullLiteral':
      return null;
    case 'UnaryExpression':
      if (node.operator === '-' || node.operator === '+') {
        var inner = astToJs(node.argument);
        if (typeof inner !== 'number') die(4, 'unary ' + node.operator + ' on non-number');
        return node.operator === '-' ? -inner : +inner;
      }
      die(4, 'unsupported unary operator: ' + node.operator);
      return undefined;
    case 'TemplateLiteral':
      if (node.expressions.length > 0) die(4, 'template literal with expressions not supported');
      var cooked = '';
      for (var k = 0; k < node.quasis.length; k++) cooked += node.quasis[k].value.cooked;
      return cooked;
    case 'Identifier':
      die(4, 'identifier reference "' + node.name + '" cannot be statically resolved');
      return undefined;
    case 'SpreadElement':
      die(4, 'spread element not supported');
      return undefined;
    default:
      die(4, 'unsupported AST node type: ' + node.type);
      return undefined;
  }
}

main(process.argv);
