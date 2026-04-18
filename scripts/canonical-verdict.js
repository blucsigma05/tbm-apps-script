#!/usr/bin/env node
/**
 * canonical-verdict.js — Deterministic verdict normalizer for Play-Gate determinism tests.
 *
 * Reads a verdict.json (path arg or stdin) and prints a canonicalized form to stdout:
 *   - Volatile fields (timestamp, evidence paths that embed timestamps) replaced with sentinels
 *   - All object keys sorted recursively
 *   - Numbers normalized to JSON default representation (avoids locale differences)
 *
 * Two runs of play-gate.js against the same commit should produce canonical outputs that
 * diff to zero bytes. That is the D-family determinism regression guard.
 *
 * Usage:
 *   node scripts/canonical-verdict.js path/to/verdict.json > canonical.json
 *   cat verdict.json | node scripts/canonical-verdict.js > canonical.json
 *   node scripts/canonical-verdict.js a.json b.json  # diff mode — exits 0 if canonical forms match
 *
 * Exit codes:
 *   0 — ok (or diff mode match)
 *   1 — usage / read error
 *   2 — parse error
 *   3 — diff mode mismatch (two-file mode only)
 */

'use strict';

var fs = require('fs');

var VOLATILE_STRING_FIELDS = {
  'timestamp': '<TIMESTAMP>',
  'traceZip': '<EVIDENCE_PATH>',
  'consoleLog': '<EVIDENCE_PATH>',
  'networkLog': '<EVIDENCE_PATH>'
};

// Evidence path fields that may embed dated directories (e.g. 2026-04-17/screenshot.png).
var EVIDENCE_PATH_KEYS = { 'screenshots': true, 'evidence': true };

function normalize(value, keyName) {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    if (VOLATILE_STRING_FIELDS.hasOwnProperty(keyName)) {
      return VOLATILE_STRING_FIELDS[keyName];
    }
    if (EVIDENCE_PATH_KEYS[keyName]) {
      // A string-valued evidence path (checkResult.evidence).
      return stripDatedSegment(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(function(item) { return normalize(item, keyName); });
  }

  if (typeof value === 'object') {
    var out = {};
    var keys = Object.keys(value).sort();
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      out[k] = normalize(value[k], k);
    }
    return out;
  }

  return value;
}

function stripDatedSegment(path) {
  // Replace YYYY-MM-DD directory segments with <DATE>; leaves the rest intact
  // so structural drift (missing file, wrong route name) still surfaces in diff.
  return path.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '<DATE>');
}

function readInput(path) {
  var raw;
  try {
    if (path === '-' || path === undefined) {
      raw = fs.readFileSync(0, 'utf8');
    } else {
      raw = fs.readFileSync(path, 'utf8');
    }
  } catch (err) {
    process.stderr.write('canonical-verdict: read failed: ' + err.message + '\n');
    process.exit(1);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    process.stderr.write('canonical-verdict: parse failed: ' + err.message + '\n');
    process.exit(2);
  }
}

function main(argv) {
  var args = argv.slice(2);

  if (args.length === 2) {
    // Diff mode.
    var a = JSON.stringify(normalize(readInput(args[0])));
    var b = JSON.stringify(normalize(readInput(args[1])));
    if (a === b) {
      process.stdout.write('canonical-verdict: MATCH\n');
      process.exit(0);
    }
    process.stderr.write('canonical-verdict: MISMATCH\n');
    process.stderr.write('--- ' + args[0] + '\n');
    process.stderr.write('+++ ' + args[1] + '\n');
    process.stderr.write('A: ' + a + '\n');
    process.stderr.write('B: ' + b + '\n');
    process.exit(3);
  }

  if (args.length > 2) {
    process.stderr.write('usage: canonical-verdict.js [path] | [a.json b.json]\n');
    process.exit(1);
  }

  var normalized = normalize(readInput(args[0]));
  process.stdout.write(JSON.stringify(normalized, null, 2) + '\n');
}

main(process.argv);
