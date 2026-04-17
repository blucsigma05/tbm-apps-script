#!/usr/bin/env node
/**
 * play-gate.js — CLI entry point for the Play-Gate architecture spike.
 *
 * Usage:
 *   node scripts/play-gate.js --route /sparkle --child jj --mode fixture
 *   node scripts/play-gate.js --route /homework --child buggsy --mode fixture
 *
 * Spawns Playwright against tests/tbm/play-gate/play-gate.spec.js with env
 * PLAY_GATE_ROUTE / PLAY_GATE_CHILD / PLAY_GATE_MODE and PLAY_GATE_OUT.
 * The spec runs the 12 PR-1 criteria measurements, synthesizes a verdict
 * per ops/play-gate-verdict.schema.json, and writes it to:
 *
 *   ops/evidence/play-gate/<route>/<child>/<yyyy-mm-dd>/verdict.json
 *
 * Exit codes:
 *   0 = verdict emitted (any ship_decision — even do-not-ship is a "run success")
 *   1 = usage error
 *   2 = tooling error (Playwright crash, verdict not written, etc.)
 */

var fs = require('fs');
var path = require('path');
var spawnSync = require('child_process').spawnSync;

var REPO_ROOT = path.resolve(__dirname, '..');
var RUBRIC_PATH = path.join(REPO_ROOT, 'ops', 'play-gate-rubric.v1.json');

function die(code, msg) {
  process.stderr.write('play-gate: ' + msg + '\n');
  process.exit(code);
}

function parseArgs(argv) {
  var out = { route: null, child: null, mode: 'fixture' };
  for (var i = 2; i < argv.length; i++) {
    var arg = argv[i];
    if (arg === '--route' && argv[i + 1]) { out.route = argv[++i]; continue; }
    if (arg === '--child' && argv[i + 1]) { out.child = argv[++i]; continue; }
    if (arg === '--mode' && argv[i + 1]) { out.mode = argv[++i]; continue; }
    if (arg === '-h' || arg === '--help') {
      process.stdout.write('Usage: play-gate.js --route <path> --child <jj|buggsy> --mode <fixture|live>\n');
      process.exit(0);
    }
  }
  return out;
}

function validateArgs(args) {
  if (!args.route) die(1, 'missing --route');
  if (!args.child) die(1, 'missing --child');
  if (args.child !== 'jj' && args.child !== 'buggsy') die(1, 'invalid --child (must be jj or buggsy)');
  if (args.mode !== 'fixture' && args.mode !== 'live') die(1, 'invalid --mode (must be fixture or live)');
  if (args.mode === 'live') die(1, 'live mode not available in PR 1 (PR 3 dependency per v8 plan)');
  if (args.route.charAt(0) !== '/') die(1, 'route must start with /');
}

function resolveDevice(route, child) {
  var profiles = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'ops', 'play-gate-profiles.json'), 'utf8'));
  var routeVp = profiles.routeViewports[route];
  if (routeVp) {
    return { viewport: { width: routeVp.width, height: routeVp.height }, label: routeVp.device };
  }
  // Fallback by child — JJ uses S10 FE, Buggsy uses Surface Pro 5
  if (child === 'jj') return { viewport: profiles.devices['samsung-s10-fe'].viewport, label: 'S10 FE (portrait)' };
  return { viewport: profiles.devices['surface-pro-5'].viewport, label: 'Surface Pro 5' };
}

function todayIso() {
  var d = new Date();
  var mm = String(d.getMonth() + 1);
  if (mm.length < 2) mm = '0' + mm;
  var dd = String(d.getDate());
  if (dd.length < 2) dd = '0' + dd;
  return d.getFullYear() + '-' + mm + '-' + dd;
}

function sanitizeRouteForPath(route) {
  // /daily-missions?child=jj → daily-missions__child-jj
  return route.replace(/^\//, '').replace(/\?/g, '__').replace(/=/g, '-').replace(/&/g, '__');
}

function main() {
  var args = parseArgs(process.argv);
  validateArgs(args);

  var evidenceDir = path.join(
    REPO_ROOT,
    'ops', 'evidence', 'play-gate',
    sanitizeRouteForPath(args.route),
    args.child,
    todayIso()
  );
  fs.mkdirSync(evidenceDir, { recursive: true });

  var outPath = path.join(evidenceDir, 'verdict.json');

  var playwrightEnv = Object.assign({}, process.env, {
    PLAY_GATE_ROUTE: args.route,
    PLAY_GATE_CHILD: args.child,
    PLAY_GATE_MODE: args.mode,
    PLAY_GATE_OUT: outPath,
    PLAY_GATE_RUBRIC: RUBRIC_PATH,
    PLAY_GATE_EVIDENCE_DIR: evidenceDir
  });

  // Pin --project=chromium so the spec runs once, not across the full browser matrix.
  // Play-gate.spec.js lives under tests/tbm/, which the chromium/firefox/webkit projects
  // all pick up by default. Playwright uses forward slashes in its path regexes, so
  // force forward slashes on Windows (spawn otherwise passes \\ which doesn't match).
  var specPath = 'tests/tbm/play-gate/play-gate.spec.js';
  var playwrightArgs = [
    'playwright', 'test',
    specPath,
    '--project=chromium',
    '--reporter=line'
  ];

  process.stdout.write('play-gate: running ' + args.route + ' for ' + args.child + ' (mode=' + args.mode + ')\n');
  process.stdout.write('play-gate: evidence dir = ' + path.relative(REPO_ROOT, evidenceDir) + '\n');

  var result = spawnSync('npx', playwrightArgs, {
    cwd: REPO_ROOT,
    env: playwrightEnv,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.error) die(2, 'failed to spawn Playwright: ' + result.error.message);

  if (!fs.existsSync(outPath)) {
    die(2, 'Playwright finished but verdict.json was not written at ' + outPath);
  }

  var verdict;
  try {
    verdict = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  } catch (e) {
    die(2, 'verdict.json is not valid JSON: ' + e.message);
  }

  process.stdout.write('\nplay-gate: ship_decision = ' + verdict.ship_decision + '\n');
  process.stdout.write('play-gate: verdict written to ' + path.relative(REPO_ROOT, outPath) + '\n');

  // Exit 0 regardless of ship_decision — emitting a verdict IS the success signal.
  // Failure_state preconditions_not_met / config_drift are still exit 0 because
  // the run produced a structured judgment. Callers inspect ship_decision for gating.
  process.exit(0);
}

main();
