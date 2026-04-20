#!/usr/bin/env python3
"""check_claude_md.py
Purpose:   Analyze CLAUDE.md for line bloat, new sections, duplicate phrases,
           and dead file references. Posts findings to PR comment + Pushover
           when thresholds are breached.
Called by: .gitea/workflows/hyg-04-claude-md-bloat.yml
Env vars:  CLAUDE_MD_PATH        Path to CLAUDE.md (default: CLAUDE.md)
           BASELINE_PATH         Path to claude-md-baseline.json
           LINE_DELTA_THRESHOLD  Max line growth before alerting (default: 30)
           REPO_ROOT             Repo root for file existence checks (default: .)
           GITHUB_OUTPUT         Set by Actions runner; used to pass step outputs
"""

import json
import os
import re
import sys

CLAUDE_MD_PATH = os.environ.get('CLAUDE_MD_PATH', 'CLAUDE.md')
BASELINE_PATH = os.environ.get('BASELINE_PATH', 'claude-md-baseline.json')
LINE_DELTA_THRESHOLD = int(os.environ.get('LINE_DELTA_THRESHOLD', '30'))
REPO_ROOT = os.environ.get('REPO_ROOT', '.')
GITHUB_OUTPUT = os.environ.get('GITHUB_OUTPUT', '')


def set_output(key, value):
    if GITHUB_OUTPUT:
        with open(GITHUB_OUTPUT, 'a') as fh:
            fh.write(key + '=' + value + '\n')
    else:
        print('[output] ' + key + '=' + value)


def load_baseline():
    try:
        with open(BASELINE_PATH) as fh:
            return json.load(fh)
    except FileNotFoundError:
        print('WARNING: Baseline not found at ' + BASELINE_PATH + ' — using zeros')
        return {'lines': 0, 'sections': 0}


def collect_repo_files():
    """Return set of file basenames reachable from REPO_ROOT (2 levels deep, skip noise dirs)."""
    skip_dirs = {'.git', 'node_modules', 'playwright-report', 'ops', '.claude'}
    files = set()
    for entry in os.scandir(REPO_ROOT):
        if entry.is_file():
            files.add(entry.name)
        elif entry.is_dir() and entry.name not in skip_dirs:
            try:
                for sub in os.scandir(entry.path):
                    if sub.is_file():
                        files.add(sub.name)
            except PermissionError:
                pass
    return files


def analyze(content):
    lines = content.splitlines()
    line_count = len(lines)
    section_count = sum(1 for ln in lines if ln.startswith('## '))

    # Duplicate phrase detection — skip fenced code blocks and table rows
    text_lines = []
    in_fence = False
    for ln in lines:
        if ln.startswith('```'):
            in_fence = not in_fence
            continue
        if in_fence or ln.startswith('|') or ln.startswith('    '):
            continue
        text_lines.append(ln)

    clean = re.sub(r'[`*_#\[\]()\-]', ' ', ' '.join(text_lines).lower())
    words = clean.split()

    phrase_len = 6
    counts = {}
    for i in range(len(words) - phrase_len + 1):
        phrase = ' '.join(words[i:i + phrase_len])
        if len(phrase) < 24:
            continue
        if re.search(r'http|notion|github|\.com|v\d+|2026', phrase):
            continue
        counts[phrase] = counts.get(phrase, 0) + 1

    duplicates = sorted([p for p, c in counts.items() if c >= 2])[:5]

    # Dead reference detection — backtick-wrapped filenames with known code extensions
    ref_pattern = re.compile(r'`([A-Za-z][A-Za-z0-9_\-]*\.(gs|html|py|sh|js))`')
    referenced = sorted(set(m.group(1) for m in ref_pattern.finditer(content)))

    repo_files = collect_repo_files()
    dead_refs = [r for r in referenced if r not in repo_files]

    return {
        'line_count': line_count,
        'section_count': section_count,
        'duplicates': duplicates,
        'dead_refs': dead_refs,
    }


def main():
    baseline = load_baseline()

    with open(CLAUDE_MD_PATH) as fh:
        content = fh.read()

    result = analyze(content)

    line_delta = result['line_count'] - baseline.get('lines', 0)
    section_delta = result['section_count'] - baseline.get('sections', 0)

    findings = []
    severe = False

    if line_delta > LINE_DELTA_THRESHOLD:
        findings.append(
            '**Line count:** ' + str(result['line_count']) + ' lines (+' + str(line_delta) +
            ' from baseline of ' + str(baseline.get('lines', 0)) + '). ' +
            'Threshold: +' + str(LINE_DELTA_THRESHOLD) + '.'
        )
        severe = True

    if section_delta > 0:
        findings.append(
            '**New section added:** ' + str(result['section_count']) + ' sections ' +
            '(was ' + str(baseline.get('sections', 0)) + '). ' +
            'Verify the addition is intentional and an old section was not left behind.'
        )

    if result['duplicates']:
        dup_lines = ['  - `' + p + '`' for p in result['duplicates']]
        findings.append('**Duplicate 6-word phrases:**\n' + '\n'.join(dup_lines))

    if result['dead_refs']:
        ref_lines = ['  - `' + r + '`' for r in result['dead_refs']]
        findings.append('**Dead file references (not found in repo):**\n' + '\n'.join(ref_lines))
        severe = True

    has_findings = len(findings) > 0
    set_output('has_findings', 'true' if has_findings else 'false')
    set_output('severe', 'true' if severe else 'false')

    summary = {
        'line_count': result['line_count'],
        'line_delta': line_delta,
        'section_count': result['section_count'],
        'section_delta': section_delta,
        'duplicate_count': len(result['duplicates']),
        'dead_ref_count': len(result['dead_refs']),
        'severe': severe,
    }
    print(json.dumps(summary, indent=2))

    if has_findings:
        comment = '## HYG-04: CLAUDE.md Bloat Check\n\n'
        comment += '\n\n'.join(findings)
        comment += (
            '\n\n---\n*Recommend manual review. '
            'See [Hygiene Spec](https://www.notion.so/33acea3cd9e88198944cd945336d6d46).*'
        )
        with open('hyg04-comment.md', 'w') as fh:
            fh.write(comment)
        print('Findings written to hyg04-comment.md')
    else:
        print('PASS: CLAUDE.md within baseline thresholds.')

    return 0


if __name__ == '__main__':
    sys.exit(main())
