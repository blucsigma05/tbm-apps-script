#!/usr/bin/env python3
"""monday_drift_sweep.py

Purpose:   Weekly Monday 6am — broad drift sweep across TBM. Ports
           monday-drift-sweep SKILL.md (Gitea #72, routine 9 of 10).

Three parts:
  A. Codebase audit — runs audit-source.sh, reports FAIL/WARN summary
  B. Sheet growth — DEFERRED until `?action=sheetGrowth` endpoint lands (#83)
  C. Trigger audit — DEFERRED until `?action=triggerAudit` endpoint lands (#83)

MVP ships Part A fully + transparent DEFERRED notes for B and C.

Called by: .gitea/workflows/monday-drift-sweep.yml

Env vars:
  REPO_ROOT          Default: .
  AUDIT_SCRIPT       Default: audit-source.sh
  OUTPUT_FILE        Default: review_comment.md
  POST_ON_CLEAN      Default: true (weekly — LT expects the heartbeat)
"""

import os
import re
import subprocess
import sys
from datetime import datetime, timezone


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
    path = os.path.join(REPO_ROOT, AUDIT_SCRIPT)
    if not os.path.isfile(path):
        return {'available': False, 'stdout': '', 'fail': -1, 'warn': -1, 'exit': -1}
    try:
        proc = subprocess.run(['bash', path], cwd=REPO_ROOT,
                              capture_output=True, text=True, timeout=300)
    except Exception as e:
        return {'available': True, 'stdout': str(e), 'fail': -1, 'warn': -1, 'exit': -1}
    out = proc.stdout + ('\n' + proc.stderr if proc.stderr else '')
    fail_m = re.search(r'Failures:\s*(\d+)', out)
    warn_m = re.search(r'Warnings:\s*(\d+)', out)
    fail = int(fail_m.group(1)) if fail_m else -1
    warn = int(warn_m.group(1)) if warn_m else -1
    return {'available': True, 'stdout': out, 'fail': fail, 'warn': warn, 'exit': proc.returncode}


def main() -> int:
    audit = run_audit()
    iso_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    lines = [f'# monday-drift-sweep — {iso_date}', '']

    # Part A
    if not audit['available']:
        lines.append(f'**Part A (codebase audit):** `{AUDIT_SCRIPT}` not found on runner')
        part_a_clean = False
    elif audit['fail'] > 0:
        lines.append(f'**Part A (codebase audit):** FAIL — {audit["fail"]} failure(s), {audit["warn"]} warning(s)')
        part_a_clean = False
    else:
        extra = f' ({audit["warn"]} warn)' if audit['warn'] and audit['warn'] > 1 else ''
        lines.append(f'**Part A (codebase audit):** PASS{extra}')
        part_a_clean = True

    # Part B — deferred
    lines.append('**Part B (sheet growth):** DEFERRED — needs `?action=sheetGrowth` endpoint (#83)')
    # Part C — deferred
    lines.append('**Part C (trigger audit):** DEFERRED — needs `?action=triggerAudit` endpoint (#83)')
    lines.append('')

    if not part_a_clean:
        lines.append('## Part A — audit-source.sh tail (last 60 lines)')
        lines.append('')
        lines.append('```')
        lines.append('\n'.join(audit['stdout'].splitlines()[-60:]))
        lines.append('```')
        lines.append('')

    lines.append('---')
    lines.append('<!-- monday-drift-sweep:run -->')

    audit_fail = max(audit['fail'], 0) if audit['available'] else 0
    audit_warn = max(audit['warn'], 0) if audit['available'] else 0
    emit('audit_fail', audit_fail)
    emit('audit_warn', audit_warn)

    is_clean = part_a_clean
    if is_clean and not POST_ON_CLEAN:
        emit('has_comment', 'false')
        return 0

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines) + '\n')
    emit('has_comment', 'true')
    print(f'Wrote report to {OUTPUT_FILE}  audit_fail={audit_fail} audit_warn={audit_warn}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
