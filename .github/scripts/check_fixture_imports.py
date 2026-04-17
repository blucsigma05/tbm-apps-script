#!/usr/bin/env python3
"""check_fixture_imports.py
Purpose:   Block new imports from the superseded tests/shared/gas-shim.js.
           Authoritative fixture source is tests/tbm/fixtures/gas-shim.js.
           This script maintains an explicit allowlist of the 3 current
           consumers; any other file importing from tests/shared/gas-shim.js
           fails CI. PR 2 migrates the 3 consumers and removes the allowlist.
Called by: .github/workflows/hygiene.yml (to be wired in PR 1) and locally
           via: python3 .github/scripts/check_fixture_imports.py
Env vars:  REPO_ROOT   Repo root (default: repo root relative to this file)
Exit:      0 = no unallowlisted imports (all usage is in allowlist)
           1 = new import outside allowlist detected
           2 = tooling error
"""

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.environ.get('REPO_ROOT', os.path.abspath(os.path.join(HERE, '..', '..')))

# PR-1 snapshot: the 3 confirmed production consumers of tests/shared/gas-shim.js.
# These are allowed to remain until PR 2 migrates them to tests/tbm/fixtures/gas-shim.js.
# PR 2 removes this allowlist (empty it; CI becomes strict).
# Paths are POSIX-style (forward slashes), relative to repo root.
SUPERSEDED_IMPORT_ALLOWLIST = {
    'tests/tbm/workflows/writing-reflection-persistence.spec.js',
    'tests/tbm/workflows/facts-timer.spec.js',
    'tests/tbm/workflows/homework-plan-through-complete.spec.js',
}

# Directories skipped entirely during the scan.
SKIP_DIRS = {
    '.git',
    'node_modules',
    '.claude/worktrees',  # dev-only duplicates, not production consumers
    '.claude/tmp',
    'test-results',
    'playwright-report',
}

# Files we care about (production test/spec + shared source).
SCAN_EXTENSIONS = ('.js', '.mjs', '.cjs', '.ts')

# Matches require('...shared/gas-shim...') or import ... from '...shared/gas-shim...'
IMPORT_RE = re.compile(
    r"""(require\s*\(\s*['"][^'"]*shared/gas-shim[^'"]*['"]\s*\)|from\s+['"][^'"]*shared/gas-shim[^'"]*['"])"""
)


def die(code, msg):
    sys.stderr.write('check_fixture_imports: ' + msg + '\n')
    sys.exit(code)


def should_skip(rel_dir):
    posix = rel_dir.replace(os.sep, '/')
    for skip in SKIP_DIRS:
        if posix == skip or posix.startswith(skip + '/'):
            return True
    return False


def scan_repo():
    findings = []
    for dirpath, dirnames, filenames in os.walk(REPO_ROOT):
        rel_dir = os.path.relpath(dirpath, REPO_ROOT)
        if rel_dir == '.':
            rel_dir = ''
        if should_skip(rel_dir):
            dirnames[:] = []
            continue
        dirnames[:] = [d for d in dirnames if not should_skip(os.path.join(rel_dir, d).replace(os.sep, '/'))]
        for name in filenames:
            if not name.endswith(SCAN_EXTENSIONS):
                continue
            abs_path = os.path.join(dirpath, name)
            rel_path = os.path.relpath(abs_path, REPO_ROOT).replace(os.sep, '/')
            if rel_path == 'tests/shared/gas-shim.js':
                continue
            try:
                with open(abs_path, 'r', encoding='utf-8') as fh:
                    src = fh.read()
            except (OSError, UnicodeDecodeError):
                continue
            for m in IMPORT_RE.finditer(src):
                line_no = src.count('\n', 0, m.start()) + 1
                findings.append({
                    'file': rel_path,
                    'line': line_no,
                    'snippet': m.group(0).strip(),
                })
    return findings


def main():
    findings = scan_repo()
    consumers_in_use = set(f['file'] for f in findings)
    unallowed = [f for f in findings if f['file'] not in SUPERSEDED_IMPORT_ALLOWLIST]
    stale_allowlist = [p for p in SUPERSEDED_IMPORT_ALLOWLIST if p not in consumers_in_use]

    report_lines = []
    report_lines.append('== check_fixture_imports ==')
    report_lines.append('canonical fixture: tests/tbm/fixtures/gas-shim.js')
    report_lines.append('superseded path:   tests/shared/gas-shim.js')
    report_lines.append('')
    report_lines.append('Allowlist (PR-1 snapshot; PR 2 removes these entries):')
    for p in sorted(SUPERSEDED_IMPORT_ALLOWLIST):
        status = 'active' if p in consumers_in_use else 'stale (no matching import — drop on next pass)'
        report_lines.append('  - ' + p + '  [' + status + ']')
    report_lines.append('')
    report_lines.append('Findings (' + str(len(findings)) + '):')
    for f in findings:
        tag = '[ALLOWED]' if f['file'] in SUPERSEDED_IMPORT_ALLOWLIST else '[BLOCKED]'
        report_lines.append('  ' + tag + ' ' + f['file'] + ':' + str(f['line']) + ' -> ' + f['snippet'])
    report_lines.append('')
    report_lines.append('Unallowed imports: ' + str(len(unallowed)))
    report_lines.append('Stale allowlist entries: ' + str(len(stale_allowlist)))

    print('\n'.join(report_lines))

    if unallowed:
        sys.stderr.write('\n' + str(len(unallowed)) + ' unallowed import(s) detected.\n')
        sys.exit(1)
    if stale_allowlist:
        sys.stderr.write('\nNOTE: ' + str(len(stale_allowlist)) + ' stale allowlist entr(ies) — drop them from SUPERSEDED_IMPORT_ALLOWLIST.\n')
    sys.exit(0)


if __name__ == '__main__':
    main()
