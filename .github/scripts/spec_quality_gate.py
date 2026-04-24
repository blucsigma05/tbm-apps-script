#!/usr/bin/env python3
"""spec_quality_gate.py

Purpose:   Daily quality gate for Gitea Issues labeled `kind:spec`. Verifies
           each has substantive Problem / Why / What changes / Acceptance
           test / Build Skills sections. Ports the spec-quality-gate SKILL.md
           routine under the Gitea-native strategy (Gitea #72).

           Originally the SKILL.md targeted Notion Parking Lot READY FOR CODE
           items; ported to Gitea Issues per the Issue=Spec rule in CLAUDE.md
           ("Specs are Issues now, NOT Notion pages").

Called by: .gitea/workflows/spec-quality-gate.yml (scheduled + manual)

Env vars:
  ANTHROPIC_API_KEY   Required. Claude API key.
  GITEA_TOKEN         Required. For listing issues.
  GITEA_HOST          Default: https://git.thompsonfams.com
  REPO                Default: blucsigma05/tbm-apps-script
  SPEC_LABEL          Default: kind:spec
  MODEL               Default: claude-sonnet-4-6
  OUTPUT_FILE         Default: review_comment.md
  POST_ON_ZERO        Default: false. When true, post a "0 specs" stub instead
                      of suppressing output.
  GITEA_OUTPUT / GITHUB_OUTPUT  Step-output file.

Outputs (to step-output file):
  spec_count          Number of kind:spec Issues reviewed
  findings_count      Number of Issues with any FAIL/WARN verdict
  has_comment         true|false — whether OUTPUT_FILE was written
                      (workflow's post step guards on this)

Exit codes:
  0  success (regardless of findings)
  1  missing inputs / API failure

Gotcha: Gitea's `?labels=X` filter silently returns ALL issues when X does
not exist. Client-side exact-match filtering is mandatory — do not rely on
the server filter. See memory: feedback_gitea_label_filter_quirk.md.
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone


API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
GITEA_TOKEN = os.environ.get('GITEA_TOKEN', '')
GITEA_HOST = os.environ.get('GITEA_HOST', 'https://git.thompsonfams.com').rstrip('/')
REPO = os.environ.get('REPO', 'blucsigma05/tbm-apps-script')
SPEC_LABEL = os.environ.get('SPEC_LABEL', 'kind:spec')
MODEL = os.environ.get('MODEL', 'claude-sonnet-4-6')
OUTPUT_FILE = os.environ.get('OUTPUT_FILE', 'review_comment.md')
POST_ON_ZERO = os.environ.get('POST_ON_ZERO', 'false').lower() == 'true'
STEP_OUTPUT = os.environ.get('GITEA_OUTPUT') or os.environ.get('GITHUB_OUTPUT') or ''

REQUIRED_SECTIONS = ['Problem', 'Why', 'What changes', 'Acceptance test', 'Build Skills']

SYSTEM_PROMPT = """You are auditing a Gitea Issue body that claims to be a specification (label: kind:spec).

A spec is the design contract before code. It must answer these five questions before implementation starts. Evaluate each:

1. **Problem** — Is the concrete problem stated? Not "improve X" — what's actually broken or missing.
2. **Why** — Is the motivation / blast radius / cost-of-not-doing stated? Why now, not later?
3. **What changes** — Is the scope explicit? What files, surfaces, or contracts change. Both "in scope" and "out of scope" where ambiguous.
4. **Acceptance test** — Is there a verifiable definition of done? Not "looks good" — specific, measurable criteria (grep pattern, HTTP response, visual state).
5. **Build Skills** — Per TBM CLAUDE.md, every Issue MUST list the skills an implementer needs. Is this section present with at least one skill name?

For each criterion, verdict:
- **PASS** — section is present AND substantive (not "TBD" / "tbd" / empty / one-line hand-wave).
- **WARN** — present but thin (short, vague, or placeholder).
- **FAIL** — section is missing, empty, or so thin it would waste implementation time.

Overall verdict for the spec:
- **PASS** if all 5 PASS.
- **WARN** if any WARN and no FAIL.
- **FAIL** if any FAIL.

Output ONLY a JSON object (no surrounding prose, no code fence) with this shape:

{
  "issue_number": <int>,
  "overall": "PASS" | "WARN" | "FAIL",
  "sections": {
    "Problem": {"verdict": "PASS|WARN|FAIL", "note": "<one short sentence>"},
    "Why": {"verdict": "PASS|WARN|FAIL", "note": "<one short sentence>"},
    "What changes": {"verdict": "PASS|WARN|FAIL", "note": "<one short sentence>"},
    "Acceptance test": {"verdict": "PASS|WARN|FAIL", "note": "<one short sentence>"},
    "Build Skills": {"verdict": "PASS|WARN|FAIL", "note": "<one short sentence>"}
  }
}
"""


def emit_step_output(key, value):
    if not STEP_OUTPUT:
        return
    with open(STEP_OUTPUT, 'a', encoding='utf-8') as fh:
        fh.write(f'{key}={value}\n')


def gitea_get(path: str):
    req = urllib.request.Request(
        GITEA_HOST + path,
        headers={'Authorization': f'token {GITEA_TOKEN}'},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def fetch_spec_issues():
    """Fetch all open issues and client-side filter for SPEC_LABEL.

    Gitea's `?labels=X` filter silently returns unfiltered results when X
    doesn't exist. Always filter client-side.
    """
    results = []
    page = 1
    while True:
        batch = gitea_get(
            f'/api/v1/repos/{REPO}/issues?state=open&type=issues&limit=50&page={page}'
        )
        if not isinstance(batch, list) or not batch:
            break
        for issue in batch:
            names = [l.get('name', '') for l in issue.get('labels', [])]
            if SPEC_LABEL in names:
                results.append(issue)
        if len(batch) < 50:
            break
        page += 1
        if page > 20:
            print('WARN: pagination hit 20-page safety cap', file=sys.stderr)
            break
    return results


def call_anthropic(issue_number: int, title: str, body: str) -> dict:
    user_content = (
        f'Gitea Issue #{issue_number}\n'
        f'Title: {title}\n\n'
        f'-----BEGIN ISSUE BODY-----\n'
        f'{body or "(empty body)"}\n'
        f'-----END ISSUE BODY-----\n'
    )
    payload = json.dumps({
        'model': MODEL,
        'max_tokens': 1024,
        'system': SYSTEM_PROMPT,
        'messages': [{'role': 'user', 'content': user_content}],
    }).encode('utf-8')
    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=payload,
        headers={
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            body_json = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8', errors='replace')
        print(f'Anthropic API HTTP {e.code} for #{issue_number}: {err}', file=sys.stderr)
        raise
    parts = body_json.get('content', [])
    text = ''.join(p.get('text', '') for p in parts if p.get('type') == 'text').strip()
    if text.startswith('```'):
        first_nl = text.find('\n')
        if first_nl != -1:
            text = text[first_nl + 1:]
        if text.rstrip().endswith('```'):
            text = text.rstrip()[:-3].rstrip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f'Bad JSON from model for #{issue_number}: {e}\n  raw: {text[:300]}', file=sys.stderr)
        return {
            'issue_number': issue_number,
            'overall': 'WARN',
            'sections': {s: {'verdict': 'WARN', 'note': 'model response unparseable'}
                         for s in REQUIRED_SECTIONS},
        }


def format_report(verdicts, zero_mode=False) -> str:
    iso_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    lines = [
        f'# spec-quality-gate — {iso_date}',
        '',
        f'**Label audited:** `{SPEC_LABEL}`',
        f'**Specs reviewed:** {len(verdicts)}',
        f'**Model:** {MODEL}',
        '',
    ]
    if zero_mode:
        lines.append(f'No open Issues with label `{SPEC_LABEL}` — nothing to gate.')
        lines.append('')
        lines.append('<!-- spec-quality-gate:run -->')
        return '\n'.join(lines) + '\n'

    summary = {'PASS': 0, 'WARN': 0, 'FAIL': 0}
    for v in verdicts:
        summary[v.get('overall', 'WARN')] = summary.get(v.get('overall', 'WARN'), 0) + 1
    lines.append(f'**Overall:** PASS {summary["PASS"]} · WARN {summary["WARN"]} · FAIL {summary["FAIL"]}')
    lines.append('')

    lines.append('## Per-spec verdicts')
    lines.append('')
    lines.append('| Issue | Overall | Problem | Why | What changes | Acceptance test | Build Skills |')
    lines.append('|-------|---------|---------|-----|--------------|-----------------|--------------|')
    for v in verdicts:
        num = v.get('issue_number', '?')
        overall = v.get('overall', '?')
        s = v.get('sections', {})

        def cell(name):
            sec = s.get(name, {})
            return sec.get('verdict', '?')

        lines.append(f'| #{num} | **{overall}** | '
                     f'{cell("Problem")} | {cell("Why")} | {cell("What changes")} | '
                     f'{cell("Acceptance test")} | {cell("Build Skills")} |')

    # Notes for any non-PASS verdict
    detail_lines = []
    for v in verdicts:
        if v.get('overall') == 'PASS':
            continue
        num = v.get('issue_number', '?')
        s = v.get('sections', {})
        issue_findings = []
        for name in REQUIRED_SECTIONS:
            sec = s.get(name, {})
            verdict = sec.get('verdict', '?')
            note = sec.get('note', '')
            if verdict != 'PASS':
                issue_findings.append(f'  - **{name}** ({verdict}): {note}')
        if issue_findings:
            detail_lines.append(f'### #{num} — {v.get("overall", "?")}')
            detail_lines.extend(issue_findings)
            detail_lines.append('')
    if detail_lines:
        lines.append('')
        lines.append('## Findings')
        lines.append('')
        lines.extend(detail_lines)

    lines.append('---')
    lines.append('<!-- spec-quality-gate:run -->')
    return '\n'.join(lines) + '\n'


def main() -> int:
    if not GITEA_TOKEN:
        print('ERROR: GITEA_TOKEN not set', file=sys.stderr)
        return 1

    try:
        specs = fetch_spec_issues()
    except Exception as e:
        print(f'Failed to fetch issues: {e}', file=sys.stderr)
        return 1
    print(f'Found {len(specs)} open Issue(s) labeled "{SPEC_LABEL}"')

    if not specs:
        emit_step_output('spec_count', 0)
        emit_step_output('findings_count', 0)
        if POST_ON_ZERO:
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as fh:
                fh.write(format_report([], zero_mode=True))
            emit_step_output('has_comment', 'true')
            print(f'Wrote zero-mode stub to {OUTPUT_FILE}')
        else:
            emit_step_output('has_comment', 'false')
            print('Silent exit (POST_ON_ZERO=false).')
        return 0

    if not API_KEY:
        print('ERROR: ANTHROPIC_API_KEY not set (required when specs exist)', file=sys.stderr)
        return 1

    verdicts = []
    for issue in specs:
        v = call_anthropic(issue['number'], issue.get('title', ''), issue.get('body', ''))
        v['issue_number'] = issue['number']
        verdicts.append(v)
        print(f'  #{issue["number"]}: {v.get("overall", "?")}')

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as fh:
        fh.write(format_report(verdicts))
    print(f'Wrote report to {OUTPUT_FILE}')

    findings = sum(1 for v in verdicts if v.get('overall') != 'PASS')
    emit_step_output('spec_count', len(verdicts))
    emit_step_output('findings_count', findings)
    emit_step_output('has_comment', 'true')
    return 0


if __name__ == '__main__':
    sys.exit(main())
