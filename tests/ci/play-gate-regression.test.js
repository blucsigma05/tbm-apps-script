#!/usr/bin/env node
/**
 * play-gate-regression.test.js — PR-1 drift regression suite for Play-Gate.
 *
 * Runs outside Playwright (plain Node) because these assertions are about the
 * static shape of the skill/schema/registry, not runtime page behavior.
 *
 * Covers:
 *   D1 — ship_decision is the decision field; legacy `verdict` field rejected by schema
 *   D3 — stub skills (play-jj, play-buggsy) both delegate to the same play-gate CLI
 *   D5 — SKILL.md files contain no line-anchored cross-references (file:line → file)
 *   Registry coverage — every PR-1 criterion (12) has a matching measurements/<ID>.js
 *   Determinism    — canonical-verdict.js in diff mode yields MATCH on two copies of one verdict
 *
 * D2 (profile sync) and D6 (fixture imports) are Python CI scripts and run separately.
 * D4 (rubric measurement_method append-only) and D7 (post-PR-2 inline map) are PR-2 scope.
 *
 * Usage:
 *   node tests/ci/play-gate-regression.test.js
 *
 * Exit codes:
 *   0 — all checks pass
 *   1 — at least one check failed (details on stderr)
 */

'use strict';

var fs = require('fs');
var path = require('path');
var spawnSync = require('child_process').spawnSync;
var os = require('os');

var REPO_ROOT = path.resolve(__dirname, '..', '..');
var SCHEMA_PATH = path.join(REPO_ROOT, 'ops', 'play-gate-verdict.schema.json');
var CANONICAL_JS = path.join(REPO_ROOT, 'scripts', 'canonical-verdict.js');
var REGISTRY_JS = path.join(REPO_ROOT, 'tests', 'tbm', 'play-gate', 'measurements', 'index.js');
var SKILL_PLAY_GATE = path.join(REPO_ROOT, '.claude', 'skills', 'play-gate', 'SKILL.md');
var SKILL_PLAY_JJ = path.join(REPO_ROOT, '.claude', 'skills', 'play-jj', 'SKILL.md');
var SKILL_PLAY_BUGGSY = path.join(REPO_ROOT, '.claude', 'skills', 'play-buggsy', 'SKILL.md');

var PR1_CRITERIA = ['PRE-2', 'PRE-4', 'U1', 'U2', 'U3', 'U7', 'U11', 'U12', 'U13', 'U14', 'J1', 'B1'];

var results = [];

function pass(name) { results.push({ name: name, ok: true }); process.stdout.write('  ✓ ' + name + '\n'); }
function fail(name, msg) { results.push({ name: name, ok: false, msg: msg }); process.stderr.write('  ✗ ' + name + '\n    ' + msg + '\n'); }

function sampleVerdict(overrides) {
  var base = {
    schemaVersion: 1,
    rubricVersion: '2026-04-15-play-gate-v1',
    ship_decision: 'ship',
    route: '/sparkle',
    child: 'jj',
    profile: 'S10 FE (portrait)',
    mode: 'fixture',
    timestamp: '2026-04-17T12:00:00Z',
    commitSha: 'deadbeefcafe',
    preconditions: [
      { id: 'PRE-2', status: 'pass' },
      { id: 'PRE-4', status: 'pass' }
    ],
    criteria: [
      { id: 'U1', status: 'pass' }
    ],
    failure_state: null,
    evidence: { screenshots: [], consoleLog: 'console.txt' },
    notes: ['fixture']
  };
  if (overrides) {
    for (var k in overrides) { if (overrides.hasOwnProperty(k)) base[k] = overrides[k]; }
  }
  return base;
}

// ── Minimal JSON Schema checker ──────────────────────────────────────────────
// This covers the draft-07 subset actually used in play-gate-verdict.schema.json:
// type, required, enum, const, pattern, additionalProperties:false, items, $ref
// via #/definitions. Full ajv dep isn't pulled in for this — it's scoped to the
// one schema we own. If the schema grows beyond this subset, swap to ajv.
function loadSchema() {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
}

function validate(instance, schema, defs, path) {
  path = path || '$';
  defs = defs || schema.definitions || {};
  var errors = [];

  if (schema.$ref) {
    var m = schema.$ref.match(/^#\/definitions\/(.+)$/);
    if (!m || !defs[m[1]]) return [{ path: path, msg: 'unresolved $ref ' + schema.$ref }];
    return validate(instance, defs[m[1]], defs, path);
  }

  if (schema.type) {
    var types = Array.isArray(schema.type) ? schema.type : [schema.type];
    var actual = instance === null ? 'null' : (Array.isArray(instance) ? 'array' : typeof instance);
    if (actual === 'number' && Math.floor(instance) === instance && types.indexOf('integer') !== -1) actual = 'integer';
    var ok = types.some(function(t) {
      if (t === 'integer') return typeof instance === 'number' && Math.floor(instance) === instance;
      return actual === t || (t === 'number' && actual === 'integer');
    });
    if (!ok) errors.push({ path: path, msg: 'expected type ' + types.join('|') + ', got ' + actual });
  }

  if (schema.const !== undefined && instance !== schema.const) {
    errors.push({ path: path, msg: 'expected const ' + JSON.stringify(schema.const) + ', got ' + JSON.stringify(instance) });
  }

  if (schema.enum && schema.enum.indexOf(instance) === -1) {
    errors.push({ path: path, msg: 'expected one of ' + JSON.stringify(schema.enum) + ', got ' + JSON.stringify(instance) });
  }

  if (schema.pattern && typeof instance === 'string' && !new RegExp(schema.pattern).test(instance)) {
    errors.push({ path: path, msg: 'pattern mismatch: ' + schema.pattern + ' vs ' + JSON.stringify(instance) });
  }

  if (schema.type === 'object' && instance && typeof instance === 'object' && !Array.isArray(instance)) {
    if (schema.required) {
      for (var i = 0; i < schema.required.length; i++) {
        if (!instance.hasOwnProperty(schema.required[i])) {
          errors.push({ path: path, msg: 'missing required ' + schema.required[i] });
        }
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      var allowed = schema.properties;
      Object.keys(instance).forEach(function(k) {
        if (!allowed.hasOwnProperty(k)) {
          errors.push({ path: path + '.' + k, msg: 'additional property not allowed' });
        }
      });
    }
    if (schema.properties) {
      Object.keys(schema.properties).forEach(function(k) {
        if (instance.hasOwnProperty(k)) {
          errors = errors.concat(validate(instance[k], schema.properties[k], defs, path + '.' + k));
        }
      });
    }
  }

  if (schema.type === 'array' && Array.isArray(instance) && schema.items) {
    for (var j = 0; j < instance.length; j++) {
      errors = errors.concat(validate(instance[j], schema.items, defs, path + '[' + j + ']'));
    }
  }

  return errors;
}

// ── D1 ───────────────────────────────────────────────────────────────────────
function testD1() {
  process.stdout.write('[D1] ship_decision is the decision field\n');
  var schema = loadSchema();

  var good = sampleVerdict();
  var goodErrs = validate(good, schema);
  if (goodErrs.length === 0) pass('D1a: canonical verdict with ship_decision validates');
  else fail('D1a: canonical verdict with ship_decision validates', 'errors: ' + JSON.stringify(goodErrs));

  var legacy = sampleVerdict();
  delete legacy.ship_decision;
  legacy.verdict = 'ship';
  var legacyErrs = validate(legacy, schema);
  var rejected = legacyErrs.some(function(e) { return /missing required ship_decision/.test(e.msg); })
              && legacyErrs.some(function(e) { return /additional property/.test(e.msg) && /\.verdict$/.test(e.path); });
  if (rejected) pass('D1b: legacy verdict field rejected (missing ship_decision + additional property)');
  else fail('D1b: legacy verdict field rejected', 'validator did not catch verdict field: ' + JSON.stringify(legacyErrs));

  var both = sampleVerdict();
  both.verdict = 'ship';
  var bothErrs = validate(both, schema);
  var caught = bothErrs.some(function(e) { return /additional property/.test(e.msg) && /\.verdict$/.test(e.path); });
  if (caught) pass('D1c: adding verdict alongside ship_decision still rejected');
  else fail('D1c: adding verdict alongside ship_decision still rejected', 'validator allowed both: ' + JSON.stringify(bothErrs));
}

// ── D3 ───────────────────────────────────────────────────────────────────────
function testD3() {
  process.stdout.write('[D3] stub skills delegate to the play-gate CLI\n');

  var jj = fs.readFileSync(SKILL_PLAY_JJ, 'utf8');
  var buggsy = fs.readFileSync(SKILL_PLAY_BUGGSY, 'utf8');

  var cliRef = /node\s+scripts\/play-gate\.js/;
  if (cliRef.test(jj)) pass('D3a: play-jj stub invokes scripts/play-gate.js');
  else fail('D3a: play-jj stub invokes scripts/play-gate.js', 'no scripts/play-gate.js reference found');

  if (cliRef.test(buggsy)) pass('D3b: play-buggsy stub invokes scripts/play-gate.js');
  else fail('D3b: play-buggsy stub invokes scripts/play-gate.js', 'no scripts/play-gate.js reference found');

  if (/--child\s+jj/.test(jj)) pass('D3c: play-jj stub pins --child jj');
  else fail('D3c: play-jj stub pins --child jj', 'no --child jj in play-jj stub');

  if (/--child\s+buggsy/.test(buggsy)) pass('D3d: play-buggsy stub pins --child buggsy');
  else fail('D3d: play-buggsy stub pins --child buggsy', 'no --child buggsy in play-buggsy stub');

  // Both stubs must point to the same verdict-producing pipeline — i.e. the main
  // skill file must exist and contain the same CLI invocation so callers see one
  // source of truth. (This is the schema-identical claim.)
  var gate = fs.readFileSync(SKILL_PLAY_GATE, 'utf8');
  if (cliRef.test(gate)) pass('D3e: play-gate authoritative skill invokes scripts/play-gate.js');
  else fail('D3e: play-gate authoritative skill invokes scripts/play-gate.js', 'authoritative skill missing CLI reference');
}

// ── D5 ───────────────────────────────────────────────────────────────────────
function testD5() {
  process.stdout.write('[D5] SKILL.md files contain no line-anchored cross-references\n');

  // Line anchors are patterns like `foo.js:123` — they rot when source files
  // grow. Skill docs reference files by path only.
  var files = [SKILL_PLAY_GATE, SKILL_PLAY_JJ, SKILL_PLAY_BUGGSY];
  // Permit "Issue #N" and markdown link :N suffixes inside parens; block
  // `<file>.<ext>:<digit>` in plain prose.
  var anchorPattern = /[A-Za-z0-9_\-./]+\.(js|ts|html|gs|py|md|json|yml|yaml|sh)\s*:\s*\d+/;

  files.forEach(function(fp) {
    var text = fs.readFileSync(fp, 'utf8');
    // Strip fenced code blocks — CLI examples inside ``` may legitimately contain
    // file.js invocations that look similar. Only check prose.
    var prose = text.replace(/```[\s\S]*?```/g, '');
    var m = prose.match(anchorPattern);
    var rel = path.relative(REPO_ROOT, fp).replace(/\\/g, '/');
    if (m) fail('D5: ' + rel + ' is anchor-free', 'found line anchor: ' + m[0]);
    else pass('D5: ' + rel + ' is anchor-free');
  });
}

// ── Registry coverage ────────────────────────────────────────────────────────
function testRegistryCoverage() {
  process.stdout.write('[Registry] each PR-1 criterion has a matching measurements/<ID>.js\n');

  // Sanity: the registry module exports an ordered list covering all 12.
  var registry = require(REGISTRY_JS);
  var registered = {};
  registry.REGISTRY.forEach(function(entry) { registered[entry.id] = true; });

  PR1_CRITERIA.forEach(function(id) {
    if (!registered[id]) fail('Registry covers ' + id, 'not present in REGISTRY array');
    else pass('Registry covers ' + id);
    var implPath = path.join(REPO_ROOT, 'tests', 'tbm', 'play-gate', 'measurements', id + '.js');
    if (!fs.existsSync(implPath)) fail('Impl file exists for ' + id, 'missing ' + path.relative(REPO_ROOT, implPath));
    else pass('Impl file exists for ' + id);
  });

  // Registry length matches PR-1 scope — catches accidental drop of a criterion.
  if (registry.REGISTRY.length === PR1_CRITERIA.length) pass('Registry length = ' + PR1_CRITERIA.length);
  else fail('Registry length = ' + PR1_CRITERIA.length, 'got ' + registry.REGISTRY.length);
}

// ── Determinism ──────────────────────────────────────────────────────────────
function testDeterminism() {
  process.stdout.write('[Determinism] canonical-verdict.js diff mode matches two identical verdicts\n');

  var v = sampleVerdict();
  var tmp = os.tmpdir();
  var a = path.join(tmp, 'play-gate-determinism-a.json');
  var b = path.join(tmp, 'play-gate-determinism-b.json');
  // Write both with DIFFERENT key ordering to prove the canonicalizer sorts.
  fs.writeFileSync(a, JSON.stringify(v, null, 2));
  var reordered = {};
  Object.keys(v).reverse().forEach(function(k) { reordered[k] = v[k]; });
  fs.writeFileSync(b, JSON.stringify(reordered, null, 2));

  var r = spawnSync(process.execPath, [CANONICAL_JS, a, b], { encoding: 'utf8' });
  if (r.status === 0) pass('canonical-verdict MATCH on key-reordered copy');
  else fail('canonical-verdict MATCH on key-reordered copy', 'exit ' + r.status + ' stderr: ' + r.stderr + (r.error ? ' spawn-error: ' + r.error.message : ''));

  // Also prove the canonicalizer strips volatile fields (timestamp).
  var v2 = sampleVerdict();
  v2.timestamp = '2026-04-17T23:59:59Z';  // different time
  var c = path.join(tmp, 'play-gate-determinism-c.json');
  fs.writeFileSync(c, JSON.stringify(v2, null, 2));
  var r2 = spawnSync(process.execPath, [CANONICAL_JS, a, c], { encoding: 'utf8' });
  if (r2.status === 0) pass('canonical-verdict MATCH despite different timestamp');
  else fail('canonical-verdict MATCH despite different timestamp', 'exit ' + r2.status + ' stderr: ' + r2.stderr + (r2.error ? ' spawn-error: ' + r2.error.message : ''));

  // And the canonicalizer rejects actually-divergent verdicts (fence check so
  // the determinism test doesn't silently pass on a broken normalizer).
  var v3 = sampleVerdict({ ship_decision: 'do-not-ship' });
  var d = path.join(tmp, 'play-gate-determinism-d.json');
  fs.writeFileSync(d, JSON.stringify(v3, null, 2));
  var r3 = spawnSync(process.execPath, [CANONICAL_JS, a, d], { encoding: 'utf8' });
  if (r3.status === 3) pass('canonical-verdict MISMATCH detected on ship_decision drift');
  else fail('canonical-verdict MISMATCH detected on ship_decision drift', 'expected exit 3, got ' + r3.status + (r3.error ? ' spawn-error: ' + r3.error.message : ''));

  // Clean up
  [a, b, c, d].forEach(function(p) { try { fs.unlinkSync(p); } catch (e) {} });
}

// ── main ─────────────────────────────────────────────────────────────────────
function main() {
  process.stdout.write('Play-Gate regression suite (PR-1 scope)\n');
  process.stdout.write('=======================================\n\n');

  testD1();
  process.stdout.write('\n');
  testD3();
  process.stdout.write('\n');
  testD5();
  process.stdout.write('\n');
  testRegistryCoverage();
  process.stdout.write('\n');
  testDeterminism();
  process.stdout.write('\n');

  var failed = results.filter(function(r) { return !r.ok; });
  process.stdout.write('---\n');
  process.stdout.write('Total: ' + results.length + ', passed: ' + (results.length - failed.length) + ', failed: ' + failed.length + '\n');
  process.exit(failed.length === 0 ? 0 : 1);
}

main();
