#!/usr/bin/env python3
"""morning_health_check.py

Purpose:   Daily morning TBM system health digest. Ports the
           morning-health-check SKILL.md routine (Gitea #72, routine 4 of 10).

Checks:
  1. audit-source.sh — pre-push gate, already on the runner
  2. ?action=runTests — smoke + regression overall
  3. Version drift — deployed (from runTests.versions) vs source constants
  4. ErrorLog scan — DEFERRED for MVP (no public endpoint; needs separate
     Issue to add a GAS route like `?action=recentErrors&sinceHours=24`)

Called by: .gitea/workflows/morning-health-check.yml (scheduled + manual)

Env vars:
  GAS_DEPLOY_URL     Required. GAS web app /exec URL.
  REPO_ROOT          Default: current working directory.
  AUDIT_SCRIPT       Default: audit-source.sh
  OUTPUT_FILE        Default: review_comment.md
  POST_ON_CLEAN      Default: true. Daily digest — LT sees one-line clean
                     OR findings list every morning.
  GITEA_OUTPUT / GITHUB_OUTPUT  Step-output file.

Outputs (to step-output file):
  overall_state       CLEAN | FINDINGS | DEGRADED | ENDPOINT_ERROR
  audit_fail          0 | N
  audit_warn          0 | N
  tests_overall       PASS | WARN | FAIL | ? | ERROR
  version_drift       0 | N
  has_comment         true|false

Exit codes:
  0  success regardless of finding state
  1  catastrophic error (script misuse, IO failure)
"""

import json
import os
import re
import subprocess
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone


GAS_DEPLOY_URL = os.environ.get('GAS_DEPLOY_URL', '').rstrip('/')
REPO_ROOT = os.environ.get('REPO_ROOT', '.')
AUDIT_SCRIPT = os.environ.get('AUDIT_SCRIPT', 'audit-source.sh')
OUTPUT_FILE = os.environ.get('OUTPUT_FILE', 'review_comment.md')
POST_ON_CLEAN = os.environ.get('POST_ON_CLEAN', 'true').lower() == 'true'
STEP_OUTPUT = os.environ.get('GITEA_OUTPUT') or os.environ.get('GITHUB_OUTPUT') or ''


def emit(key, value):
    if not STEP_OUTPUT:
        return
    with open(STEP_OUTPUT, 'a', encoding='utf-8') as fh:
        fh.write(f'{key}={value}\n')


def run_audit():
    """Run audit-source.sh, capture stdout + exit code."""
    path = os.path.join(REPO_ROOT, AUDIT_SCRIPT)
    if not os.path.isfile(path):
        return {'available': False, 'stdout': '', 'fail': -1, 'warn': -1, 'exit': -1}
    try:
        proc = subprocess.run(
            ['bash', path],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=120,
        )
    except Exception as e:
        return {'available': True, 'stdout': f'audit-source invocation failed: {e}',
                'fail': -1, 'warn': -1, 'exit': -1}

    out = proc.stdout + ('\n' + proc.stderr if proc.stderr else '')
    # Parse "Failures:  N" and "Warnings: N" from the summary
    fail_m = re.search(r'Failures:\s*(\d+)', out)
    warn_m = re.search(r'Warnings:\s*(\d+)', out)
    fail = int(fail_m.group(1)) if fail_m else -1
    warn = int(warn_m.group(1)) if warn_m else -1
    return {'available': True, 'stdout': out, 'fail': fail, 'warn': warn, 'exit': proc.returncode}


def fetch_tests():
    if not GAS_DEPLOY_URL:
        return None, 'GAS_DEPLOY_URL not set'
    try:
        req = urllib.request.Request(f'{GAS_DEPLOY_URL}?action=runTests')
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read().decode('utf-8')), None
    except Exception as e:
        return None, f'{type(e).__name__}: {e}'


SOURCE_VERSION_FILES = {
    'codeGs': ('Code.js', r'function\s+getCodeVersion\s*\(\)\s*\{\s*return\s+(\d+)'),
    'dataEngine': ('DataEngine.js', r'function\s+getDataEngineVersion\s*\(\)\s*\{\s*return\s+(\d+)'),
    'smokeTest': ('Tbmsmoketest.js', r'function\s+getSmokeTestVersion\s*\(\)\s*\{\s*return\s+(\d+)'),
    'regressionSuite': ('TBMRegressionsuite.gs.js', r'function\s+getRegressionSuiteVersion\s*\(\)\s*\{\s*return\s+(\d+)'),
}


def read_source_versions():
    out = {}
    for key, (filename, pattern) in SOURCE_VERSION_FILES.items():
        path = os.path.join(REPO_ROOT, filename)
        if not os.path.isfile(path):
            out[key] = {'value': None, 'error': f'file not found: {filename}'}
            continue
        try:
            with open(path, 'r', encoding='utf-8') as fh:
                content = fh.read()
        except Exception as e:
            out[key] = {'value': None, 'error': str(e)}
            continue
        m = re.search(pattern, content)
        if m:
            out[key] = {'value': 'v' + m.group(1), 'error': None}
        else:
            out[key] = {'value': None, 'error': 'version getter not found'}
    return out


def compare_versions(deployed, source):
    """Return list of drift entries [{key, source, deployed}]."""
    drift = []
    for key, src in source.items():
        if src['value'] is None:
            drift.append({'key': key, 'source': f'(error: {src["error"]})', 'deployed': deployed.get(key, '?')})
            continue
        deployed_val = deployed.get(key)
        if not deployed_val:
            drift.append({'key': key, 'source': src['value'], 'deployed': '(missing)'})
            continue
        if deployed_val != src['value']:
            drift.append({'key': key, 'source': src['value'], 'deployed': deployed_val})
    return drift


def build_report(audit, tests, tests_err, version_drift):
    iso_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    lines = [f'# morning-health-check — {iso_date}', '']

    findings = []

    # Audit
    if not audit['available']:
        findings.append(f'- `{AUDIT_SCRIPT}` not found on runner — audit lane not available')
        audit_line = f'**Audit:** `{AUDIT_SCRIPT}` missing'
    elif audit['fail'] > 0:
        findings.append(f'- `audit-source.sh` FAILED ({audit["fail"]} failure(s), {audit["warn"]} warning(s))')
        audit_line = f'**Audit:** FAIL ({audit["fail"]} fail / {audit["warn"]} warn)'
    elif audit['warn'] > 0:
        # The ambient 1-warning state is expected (deploy-freeze SKIP without jq/clasp)
        if audit['warn'] > 1:
            findings.append(f'- `audit-source.sh` warned ({audit["warn"]} warnings — above baseline)')
        audit_line = f'**Audit:** PASS ({audit["warn"]} warning(s))'
    elif audit['exit'] == 0 or audit['exit'] == 2:
        audit_line = '**Audit:** PASS'
    else:
        audit_line = f'**Audit:** exit={audit["exit"]} (unknown state)'
        findings.append(f'- `audit-source.sh` exited non-zero ({audit["exit"]})')
    lines.append(audit_line)

    # Tests
    if tests_err:
        lines.append(f'**Tests:** ENDPOINT ERROR — {tests_err}')
        findings.append(f'- GAS `?action=runTests` unreachable: {tests_err}')
        tests_overall = 'ERROR'
    else:
        tests_overall = tests.get('overall', '?')
        smoke_overall = (tests.get('smoke') or {}).get('overall', '?')
        reg_overall = (tests.get('regression') or {}).get('overall', '?')
        lines.append(f'**Tests:** overall={tests_overall} (smoke={smoke_overall}, regression={reg_overall})')
        if tests_overall != 'PASS':
            findings.append(f'- runTests overall={tests_overall} (smoke={smoke_overall}, regression={reg_overall})')

    # Version drift
    if version_drift:
        lines.append(f'**Version drift:** {len(version_drift)} module(s) out of sync')
        findings.append(f'- Version drift on {len(version_drift)} module(s) — deploy pipeline may have stalled')
    else:
        lines.append('**Version drift:** none')

    # ErrorLog step — explicit MVP note
    lines.append('**ErrorLog scan:** deferred — no public endpoint yet '
                 '(will need `?action=recentErrors&sinceHours=24` in a follow-up)')

    lines.append('')

    if findings:
        lines.append('## Findings')
        lines.append('')
        lines.extend(findings)
        lines.append('')

    if version_drift:
        lines.append('## Version drift detail')
        lines.append('')
        lines.append('| Module | Source | Deployed |')
        lines.append('|--------|--------|----------|')
        for d in version_drift:
            lines.append(f'| `{d["key"]}` | {d["source"]} | {d["deployed"]} |')
        lines.append('')

    # Audit tail on FAIL only — noisy otherwise
    if audit['available'] and audit['fail'] > 0:
        tail = '\n'.join(audit['stdout'].splitlines()[-40:])
        lines.append('## audit-source.sh tail (last 40 lines)')
        lines.append('')
        lines.append('```')
        lines.append(tail)
        lines.append('```')
        lines.append('')

    lines.append('---')
    lines.append('<!-- morning-health-check:run -->')
    return '\n'.join(lines) + '\n', findings, tests_overall


def main() -> int:
    audit = run_audit()
    tests, tests_err = fetch_tests()

    source_v = read_source_versions()
    if tests and isinstance(tests.get('versions'), dict):
        drift = compare_versions(tests['versions'], source_v)
    else:
        drift = []

    report, findings, tests_overall = build_report(audit, tests, tests_err, drift)

    audit_fail = max(audit['fail'], 0) if audit['available'] else 0
    audit_warn_count = max(audit['warn'], 0) if audit['available'] else 0

    if tests_err:
        state = 'ENDPOINT_ERROR'
    elif findings:
        state = 'DEGRADED' if audit_fail > 0 or tests_overall == 'FAIL' else 'FINDINGS'
    else:
        state = 'CLEAN'

    print(f'state={state} audit_fail={audit_fail} audit_warn={audit_warn_count} '
          f'tests_overall={tests_overall} version_drift={len(drift)}')

    emit('overall_state', state)
    emit('audit_fail', audit_fail)
    emit('audit_warn', audit_warn_count)
    emit('tests_overall', tests_overall)
    emit('version_drift', len(drift))

    if state == 'CLEAN' and not POST_ON_CLEAN:
        emit('has_comment', 'false')
        return 0

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as fh:
        fh.write(report)
    emit('has_comment', 'true')
    print(f'Wrote report to {OUTPUT_FILE}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
