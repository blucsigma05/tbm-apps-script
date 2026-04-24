#!/usr/bin/env python3
"""stale_pr_check.py

Purpose:   Daily 8am — list open PRs older than STALE_HOURS (default 24) and
           name the blocker for each based on labels + CI state. Ports the
           stale-pr-check SKILL.md routine (Gitea #72, routine 5 of 10).

           Complements HYG-02 (orphaned PRs, 5-day threshold for long-forgotten
           PRs). This routine is the shorter-horizon daily triage: "what did I
           leave open yesterday that's not moving?"

Called by: .gitea/workflows/stale-pr-check.yml

Env vars:
  GITEA_TOKEN      Required.
  GITEA_HOST       Default: https://git.thompsonfams.com
  REPO             Default: blucsigma05/tbm-apps-script
  STALE_HOURS      Default: 24
  OUTPUT_FILE      Default: review_comment.md
  POST_ON_CLEAN    Default: false

Outputs:
  stale_count      Integer
  has_comment      true|false

Exit codes:
  0 success
  1 auth / network failure
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta


GITEA_TOKEN = os.environ.get('GITEA_TOKEN', '')
GITEA_HOST = os.environ.get('GITEA_HOST', 'https://git.thompsonfams.com').rstrip('/')
REPO = os.environ.get('REPO', 'blucsigma05/tbm-apps-script')
STALE_HOURS = int(os.environ.get('STALE_HOURS', '24'))
OUTPUT_FILE = os.environ.get('OUTPUT_FILE', 'review_comment.md')
POST_ON_CLEAN = os.environ.get('POST_ON_CLEAN', 'false').lower() == 'true'
STEP_OUTPUT = os.environ.get('GITEA_OUTPUT') or os.environ.get('GITHUB_OUTPUT') or ''


def emit(key, value):
    if not STEP_OUTPUT:
        return
    with open(STEP_OUTPUT, 'a', encoding='utf-8') as fh:
        fh.write(f'{key}={value}\n')


def fetch_open_prs():
    req = urllib.request.Request(
        f'{GITEA_HOST}/api/v1/repos/{REPO}/pulls?state=open&limit=50',
        headers={'Authorization': f'token {GITEA_TOKEN}'},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def infer_blocker(labels):
    """Label-driven triage. Returns (blocker, recommended_action)."""
    for l in labels:
        if l == 'pipeline:codex-review':
            return 'Codex review pending', 'Wait for Codex; re-run if stuck'
        if l == 'pipeline:awaiting-fix':
            return 'Author / build lane', 'Address review findings, push fix commit'
        if l == 'needs:lt-decision':
            return 'LT decision', 'LT to comment with answer on the linked Issue'
        if l == 'pipeline:passed':
            return 'Ready to merge', 'Merge (or auto-merge if enabled)'
        if l == 'pipeline:blocked':
            return 'Explicitly blocked', 'Resolve the blocker noted on the PR'
    return 'Unlabeled — CI may not have started', 'Check workflow run status; re-kick if missing'


def main() -> int:
    if not GITEA_TOKEN:
        print('ERROR: GITEA_TOKEN not set', file=sys.stderr)
        return 1

    try:
        prs = fetch_open_prs()
    except Exception as e:
        print(f'ERROR: fetch open PRs failed: {e}', file=sys.stderr)
        return 1

    now = datetime.now(timezone.utc)
    threshold = timedelta(hours=STALE_HOURS)

    stale = []
    for pr in prs:
        # Use updated_at (last activity), not created_at — a recently-updated
        # PR isn't stale even if old.
        updated = pr.get('updated_at', '')
        if not updated:
            continue
        try:
            u_dt = datetime.fromisoformat(updated.replace('Z', '+00:00'))
        except ValueError:
            continue
        age = now - u_dt
        if age >= threshold:
            labels = [l.get('name', '') for l in pr.get('labels', [])]
            blocker, action = infer_blocker(labels)
            stale.append({
                'number': pr['number'],
                'title': pr.get('title', ''),
                'hours': int(age.total_seconds() // 3600),
                'url': pr.get('html_url', ''),
                'labels': labels,
                'blocker': blocker,
                'action': action,
            })

    # Sort oldest first
    stale.sort(key=lambda s: -s['hours'])
    print(f'{len(stale)} stale PR(s) (> {STALE_HOURS}h since last update)')
    emit('stale_count', len(stale))

    if not stale and not POST_ON_CLEAN:
        emit('has_comment', 'false')
        return 0

    iso_date = now.strftime('%Y-%m-%d')
    lines = [
        f'# stale-pr-check — {iso_date}',
        '',
        f'**Threshold:** {STALE_HOURS}h since last update',
        f'**Open PRs total:** {len(prs)}',
        f'**Stale:** {len(stale)}',
        '',
    ]
    if stale:
        lines.append('| PR | Age (h) | Blocker | Recommended action |')
        lines.append('|----|---------|---------|--------------------|')
        for s in stale:
            title_short = s['title'][:60] + ('…' if len(s['title']) > 60 else '')
            lines.append(f'| [#{s["number"]}]({s["url"]}) `{title_short}` | '
                         f'{s["hours"]} | {s["blocker"]} | {s["action"]} |')
        lines.append('')
    else:
        lines.append('All open PRs active within the last threshold window.')
        lines.append('')
    lines.append('---')
    lines.append('<!-- stale-pr-check:run -->')

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines) + '\n')
    emit('has_comment', 'true')
    print(f'Wrote report to {OUTPUT_FILE}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
