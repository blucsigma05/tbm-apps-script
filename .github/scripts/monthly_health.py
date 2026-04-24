#!/usr/bin/env python3
"""monthly_health.py

Purpose:   Monthly 1st-of-month 6am — long-form system health audit. Ports
           monthly-health-and-structure SKILL.md (Gitea #72, routine 10 of 10).

Three parts:
  A. Architecture scan (LOCAL grep on .js files) — functions per file,
     duplicate function names, dead private functions with zero callers.
  B. Quotas — DEFERRED (needs `?action=triggerAudit` + `?action=sheetGrowth`
     endpoints from #83).
  C. Notion structure audit — DEFERRED (needs PM Active Versions DB schema
     contract; filing follow-up Issue when this routine first runs).

MVP ships Part A; Part B and C render with DEFERRED notes pointing at
follow-up Issues.

Called by: .gitea/workflows/monthly-health.yml

Env vars:
  REPO_ROOT           Default: .
  MAX_FUNCS_PER_FILE  Default: 50 (flag threshold)
  OUTPUT_FILE         Default: review_comment.md
  POST_ON_CLEAN       Default: true (monthly — LT should see the heartbeat)
"""

import os
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone


REPO_ROOT = os.environ.get('REPO_ROOT', '.')
MAX_FUNCS_PER_FILE = int(os.environ.get('MAX_FUNCS_PER_FILE', '50'))
OUTPUT_FILE = os.environ.get('OUTPUT_FILE', 'review_comment.md')
POST_ON_CLEAN = os.environ.get('POST_ON_CLEAN', 'true').lower() == 'true'
STEP_OUTPUT = os.environ.get('GITEA_OUTPUT') or os.environ.get('GITHUB_OUTPUT') or ''

# Match top-level function declarations (not method definitions inside objects).
FN_DECL = re.compile(r'^function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(', re.MULTILINE)
# Ignore files under these paths
IGNORE_PREFIXES = ('.claude/', '.git/', '.github/', '.gitea/', 'node_modules/',
                   'ops/', 'specs/', 'tests/')


def emit(key, value):
    if not STEP_OUTPUT:
        return
    with open(STEP_OUTPUT, 'a', encoding='utf-8') as fh:
        fh.write(f'{key}={value}\n')


def collect_js_files():
    files = []
    for root, dirs, fnames in os.walk(REPO_ROOT):
        # Prune ignored directories
        rel_root = os.path.relpath(root, REPO_ROOT).replace('\\', '/')
        if rel_root == '.':
            rel_root = ''
        if any(rel_root.startswith(p.rstrip('/')) for p in IGNORE_PREFIXES):
            continue
        # Also skip nested hidden dirs
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules',)]
        for fn in fnames:
            if fn.endswith('.js') and not fn.endswith('.test.js'):
                rel = os.path.join(rel_root, fn) if rel_root else fn
                files.append(rel.replace('\\', '/'))
    return sorted(files)


def scan_architecture():
    """Part A — returns {'counts': {file: n}, 'dupes': {name: [files...]},
                         'dead_privates': [(file, name)], 'total': N}."""
    files = collect_js_files()
    counts = {}
    fn_to_files = defaultdict(list)
    all_bodies = {}  # filename -> content, so we can search callsites

    for f in files:
        path = os.path.join(REPO_ROOT, f)
        try:
            with open(path, 'r', encoding='utf-8') as fh:
                content = fh.read()
        except Exception:
            continue
        all_bodies[f] = content
        names = FN_DECL.findall(content)
        counts[f] = len(names)
        for name in names:
            fn_to_files[name].append(f)

    dupes = {name: files for name, files in fn_to_files.items() if len(files) > 1}

    # Dead private functions (end with underscore, zero call-sites across all bodies)
    dead = []
    private_re = re.compile(r'^function\s+([A-Za-z_][A-Za-z0-9_]*_)\s*\(', re.MULTILINE)
    for f, body in all_bodies.items():
        for name in private_re.findall(body):
            # Count references: how often "<name>" appears as identifier in ALL bodies
            refs = 0
            pat = re.compile(r'\b' + re.escape(name) + r'\b')
            for other in all_bodies.values():
                refs += len(pat.findall(other))
            # refs includes the declaration itself, so dead = exactly 1 match
            if refs <= 1:
                dead.append((f, name))

    return {
        'counts': counts,
        'dupes': dupes,
        'dead_privates': dead,
        'total_files': len(files),
    }


def build_report(arch):
    iso_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    lines = [f'# monthly-health — {iso_date}', '']

    over_threshold = [(f, n) for f, n in arch['counts'].items() if n > MAX_FUNCS_PER_FILE]
    over_threshold.sort(key=lambda x: -x[1])

    part_a_clean = not over_threshold and not arch['dupes'] and not arch['dead_privates']

    lines.append(f'**Part A (architecture):** {"clean" if part_a_clean else "findings below"}')
    lines.append('**Part B (quotas):** DEFERRED — needs `?action=triggerAudit` + `?action=sheetGrowth` (#83)')
    lines.append('**Part C (Notion structure):** DEFERRED — follow-up Issue after first real monthly run')
    lines.append('')
    lines.append(f'**Scan:** {arch["total_files"]} .js file(s) | {sum(arch["counts"].values())} top-level functions')
    lines.append('')

    if over_threshold:
        lines.append(f'## Files with > {MAX_FUNCS_PER_FILE} top-level functions')
        lines.append('')
        lines.append('| File | Functions |')
        lines.append('|------|-----------|')
        for f, n in over_threshold:
            lines.append(f'| `{f}` | {n} |')
        lines.append('')

    if arch['dupes']:
        lines.append('## Duplicate function names across files')
        lines.append('')
        lines.append('| Function | Files |')
        lines.append('|----------|-------|')
        for name, files in sorted(arch['dupes'].items())[:30]:
            lines.append(f'| `{name}` | {", ".join(f"`{f}`" for f in files)} |')
        if len(arch['dupes']) > 30:
            lines.append(f'| … | +{len(arch["dupes"]) - 30} more |')
        lines.append('')

    if arch['dead_privates']:
        lines.append(f'## Dead private functions (zero call-sites, name ends in _)')
        lines.append('')
        lines.append('| File | Function |')
        lines.append('|------|----------|')
        for f, name in sorted(arch['dead_privates'])[:50]:
            lines.append(f'| `{f}` | `{name}` |')
        if len(arch['dead_privates']) > 50:
            lines.append(f'| … | +{len(arch["dead_privates"]) - 50} more |')
        lines.append('')

    if part_a_clean:
        lines.append('No Part A findings.')
        lines.append('')

    lines.append('---')
    lines.append('<!-- monthly-health:run -->')
    return '\n'.join(lines) + '\n', part_a_clean, over_threshold, len(arch['dupes']), len(arch['dead_privates'])


def main() -> int:
    arch = scan_architecture()
    report, part_a_clean, over_threshold, dupe_count, dead_count = build_report(arch)
    print(f'total_files={arch["total_files"]} funcs={sum(arch["counts"].values())} '
          f'over_threshold={len(over_threshold)} dupes={dupe_count} dead={dead_count}')
    emit('over_threshold', len(over_threshold))
    emit('duplicate_fns', dupe_count)
    emit('dead_private_fns', dead_count)

    if part_a_clean and not POST_ON_CLEAN:
        emit('has_comment', 'false')
        return 0

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as fh:
        fh.write(report)
    emit('has_comment', 'true')
    print(f'Wrote report to {OUTPUT_FILE}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
