#!/usr/bin/env python3
"""claude_md_review.py

Purpose:   Periodic qualitative review of CLAUDE.md via the Anthropic API.
           Restores the ~/.claude/scheduled-tasks/claude-md-review SKILL.md
           routine for TBM under the Gitea-native port strategy (Gitea #72).

           Complements HYG-04 (.github/scripts/check_claude_md.py), which is a
           mechanical per-PR bloat check. This script is the weekly qualitative
           review: structure, redundancy, staleness, ordering, completeness,
           bloat — scored 1-10 with restructure plan when below threshold.

Called by: .gitea/workflows/claude-md-review.yml (scheduled + manual)

Env vars:
  ANTHROPIC_API_KEY    Required. Claude API key.
  CLAUDE_MD_PATH       Default: CLAUDE.md
  MODEL                Default: claude-sonnet-4-6
  RESTRUCTURE_THRESHOLD  Default: 8. Below this, model must propose a plan.
  OUTPUT_FILE          Default: review_comment.md (workflow posts this to Gitea)
  GITEA_OUTPUT / GITHUB_OUTPUT  Runner-provided. Used for step outputs.

Outputs (to GITEA_OUTPUT):
  overall_score        Integer 1-10, or -1 if parse failed
  below_threshold      true|false
  bytes                Byte size of CLAUDE.md reviewed

Exit codes:
  0  review complete (regardless of score)
  1  missing inputs / API failure
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone


API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')
CLAUDE_MD_PATH = os.environ.get('CLAUDE_MD_PATH', 'CLAUDE.md')
MODEL = os.environ.get('MODEL', 'claude-sonnet-4-6')
RESTRUCTURE_THRESHOLD = int(os.environ.get('RESTRUCTURE_THRESHOLD', '8'))
OUTPUT_FILE = os.environ.get('OUTPUT_FILE', 'review_comment.md')
STEP_OUTPUT = os.environ.get('GITEA_OUTPUT') or os.environ.get('GITHUB_OUTPUT') or ''

SYSTEM_PROMPT = """You are reviewing a project's CLAUDE.md file — the instructions Claude Code reads at the start of every session.

Score on these six criteria, 1-10 each (10 = excellent, 1 = needs total rewrite):

1. **Structure** — are related topics grouped together or scattered?
2. **Redundancy** — is anything stated in multiple places?
3. **Staleness** — are there references to files, patterns, or tools that no longer exist? (You cannot verify file existence directly; flag anything that reads like it may be outdated — "TODO", "pending", dated references, "legacy", etc.)
4. **Ordering** — does the file read top-to-bottom in a logical flow?
5. **Completeness** — are there project patterns that seem referenced but not documented? (e.g., a section says "see X" but X isn't defined)
6. **Bloat** — is there content that could be removed without losing information?

Produce your output in this EXACT markdown format. Do not add preamble before or after.

```
# claude-md-review — {ISO_DATE}

**Overall score:** N/10
**File size:** N,NNN lines / NN,NNN chars
**Model:** claude-sonnet-4-6

## Per-criterion scores

| # | Criterion | Score | One-line finding |
|---|-----------|-------|------------------|
| 1 | Structure | N/10 | ... |
| 2 | Redundancy | N/10 | ... |
| 3 | Staleness | N/10 | ... |
| 4 | Ordering | N/10 | ... |
| 5 | Completeness | N/10 | ... |
| 6 | Bloat | N/10 | ... |

## Top findings

1. **[Criterion — severity]** Specific finding with line numbers or section names.
2. ...
3. ...
(3-5 findings total, ordered by severity)

## Restructure plan

{Include this section ONLY if overall score is below 8. If score >= 8, write a single line: "Not required — overall score is N/10."}

- Step 1: ...
- Step 2: ...
- Step 3: ...

---
<!-- claude-md-review:run -->
```

Constraints:
- Cite line numbers or section names for every finding. Don't hand-wave.
- Overall score = rounded mean of the six sub-scores.
- "Top findings" must be specific and actionable; no generic advice like "consider simplifying".
- If the file has obvious emergency-level problems (e.g., contradictions, broken references), flag in findings with **[CRITICAL]** tag regardless of sub-score.
"""


def load_file(path: str) -> str:
    with open(path, 'r', encoding='utf-8') as fh:
        return fh.read()


def emit_step_output(key: str, value) -> None:
    if not STEP_OUTPUT:
        return
    with open(STEP_OUTPUT, 'a', encoding='utf-8') as fh:
        fh.write(f'{key}={value}\n')


def parse_overall_score(markdown: str) -> int:
    """Extract 'Overall score: N/10' from the markdown. Returns -1 on parse failure."""
    import re
    m = re.search(r'\*\*Overall score:\*\*\s*(\d+)\s*/\s*10', markdown)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return -1
    return -1


def call_anthropic(file_contents: str, file_path: str, line_count: int, char_count: int) -> str:
    iso_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    user_content = (
        f'Project: TBM (TillerBudgetMaster)\n'
        f'File: {file_path}\n'
        f'Lines: {line_count:,}\n'
        f'Chars: {char_count:,}\n'
        f'Review date: {iso_date}\n\n'
        f'-----BEGIN FILE-----\n'
        f'{file_contents}\n'
        f'-----END FILE-----\n'
    )

    # Substitute ISO_DATE into system prompt so model knows the right date to put
    # in the output header.
    system = SYSTEM_PROMPT.replace('{ISO_DATE}', iso_date)

    payload = json.dumps({
        'model': MODEL,
        'max_tokens': 4096,
        'system': system,
        'messages': [
            {'role': 'user', 'content': user_content},
        ],
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
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace')
        print(f'Anthropic API HTTP {e.code}: {err_body}', file=sys.stderr)
        raise
    except urllib.error.URLError as e:
        print(f'Anthropic API URLError: {e}', file=sys.stderr)
        raise

    # Anthropic Messages API response: body["content"] is list of content blocks
    parts = body.get('content', [])
    text = ''
    for p in parts:
        if p.get('type') == 'text':
            text += p.get('text', '')
    if not text:
        print(f'Anthropic API returned no text content. Full body: {json.dumps(body)[:500]}', file=sys.stderr)
        raise RuntimeError('empty model response')
    return text.strip()


def strip_code_fence(text: str) -> str:
    """The prompt asks the model to wrap its output in a ``` block. Strip it if present."""
    t = text.strip()
    if t.startswith('```'):
        # drop first line (``` or ```markdown) and trailing ```
        first_nl = t.find('\n')
        if first_nl == -1:
            return t
        t = t[first_nl + 1:]
        if t.rstrip().endswith('```'):
            t = t.rstrip()[:-3].rstrip()
    return t


def main() -> int:
    if not API_KEY:
        print('ERROR: ANTHROPIC_API_KEY not set', file=sys.stderr)
        return 1

    if not os.path.isfile(CLAUDE_MD_PATH):
        print(f'ERROR: {CLAUDE_MD_PATH} not found', file=sys.stderr)
        return 1

    contents = load_file(CLAUDE_MD_PATH)
    line_count = contents.count('\n') + 1
    char_count = len(contents)
    print(f'Reviewing {CLAUDE_MD_PATH}: {line_count:,} lines, {char_count:,} chars')
    print(f'Model: {MODEL}')

    try:
        raw = call_anthropic(contents, CLAUDE_MD_PATH, line_count, char_count)
    except Exception as e:
        print(f'API call failed: {e}', file=sys.stderr)
        return 1

    review_md = strip_code_fence(raw)
    overall = parse_overall_score(review_md)
    below = overall != -1 and overall < RESTRUCTURE_THRESHOLD

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as fh:
        fh.write(review_md)
        if not review_md.endswith('\n'):
            fh.write('\n')

    emit_step_output('overall_score', overall)
    emit_step_output('below_threshold', 'true' if below else 'false')
    emit_step_output('bytes', char_count)

    print(f'Wrote review to {OUTPUT_FILE}')
    print(f'Overall score: {overall}/10 (threshold: {RESTRUCTURE_THRESHOLD})')
    return 0


if __name__ == '__main__':
    sys.exit(main())
