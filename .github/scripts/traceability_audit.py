#!/usr/bin/env python3
"""traceability_audit.py

Purpose:   Saturday 6am — Issue → PR → Release traceability audit.
           Ports issue-pr-deploy-traceability SKILL.md (Gitea #72, routine 6 of 10).

Three parts (each read-only):
  A. Merged PRs from last WINDOW_DAYS (default 7) missing `Closes/Fixes/Refs #N`
     in title OR body.
  B. Open Issues older than AGED_DAYS (default 14) with no linked PR. Skip
     epics + needs:lt-decision + draft markers.
  C. Merged PRs in last RELEASE_WINDOW_DAYS (default 14) without a corresponding
     Gitea release tag (SKILL originally said "GitHub release"; ported to
     Gitea releases).

Called by: .gitea/workflows/traceability-audit.yml

Env vars:
  GITEA_TOKEN       Required. Auto-provided.
  GITEA_HOST        Default: https://git.thompsonfams.com
  REPO              Default: blucsigma05/tbm-apps-script
  WINDOW_DAYS       Default: 7
  AGED_DAYS         Default: 14
  RELEASE_WINDOW_DAYS  Default: 14
  OUTPUT_FILE       Default: review_comment.md
  POST_ON_CLEAN     Default: false
"""

import json
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta


GITEA_TOKEN = os.environ.get('GITEA_TOKEN', '')
GITEA_HOST = os.environ.get('GITEA_HOST', 'https://git.thompsonfams.com').rstrip('/')
REPO = os.environ.get('REPO', 'blucsigma05/tbm-apps-script')
WINDOW_DAYS = int(os.environ.get('WINDOW_DAYS', '7'))
AGED_DAYS = int(os.environ.get('AGED_DAYS', '14'))
RELEASE_WINDOW_DAYS = int(os.environ.get('RELEASE_WINDOW_DAYS', '14'))
OUTPUT_FILE = os.environ.get('OUTPUT_FILE', 'review_comment.md')
POST_ON_CLEAN = os.environ.get('POST_ON_CLEAN', 'false').lower() == 'true'
STEP_OUTPUT = os.environ.get('GITEA_OUTPUT') or os.environ.get('GITHUB_OUTPUT') or ''

# Match Closes #N, Fixes #N, Refs #N, also "Closes: #N" and long refs like "Refs: #N".
CLOSE_PATTERN = re.compile(r'\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|refs?)[:\s]*#(\d+)\b', re.IGNORECASE)
SKIP_ISSUE_LABELS = {'kind:epic', 'needs:lt-decision'}


def emit(key, value):
    if not STEP_OUTPUT:
        return
    with open(STEP_OUTPUT, 'a', encoding='utf-8') as fh:
        fh.write(f'{key}={value}\n')


def gitea(path):
    """Paginated fetch — returns full list of results."""
    all_items = []
    page = 1
    while page < 20:
        sep = '&' if '?' in path else '?'
        req = urllib.request.Request(
            f'{GITEA_HOST}/api/v1/repos/{REPO}{path}{sep}page={page}&limit=50',
            headers={'Authorization': f'token {GITEA_TOKEN}'},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.loads(r.read())
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return []
            raise
        if not isinstance(data, list) or not data:
            break
        all_items.extend(data)
        if len(data) < 50:
            break
        page += 1
    return all_items


def parse_dt(s):
    try:
        return datetime.fromisoformat(s.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return None


def check_unlinked_merged_prs(now):
    """Part A — merged in last WINDOW_DAYS without Closes/Fixes/Refs #N."""
    threshold = now - timedelta(days=WINDOW_DAYS)
    prs = gitea('/pulls?state=closed&sort=recentupdate')
    findings = []
    for pr in prs:
        if not pr.get('merged'):
            continue
        merged_at = parse_dt(pr.get('merged_at', ''))
        if not merged_at or merged_at < threshold:
            continue
        combined = (pr.get('title') or '') + '\n' + (pr.get('body') or '')
        if CLOSE_PATTERN.search(combined):
            continue
        findings.append({
            'number': pr['number'],
            'title': (pr.get('title') or '')[:80],
            'url': pr.get('html_url', ''),
            'merged': pr.get('merged_at', ''),
        })
    return findings


def check_aged_unlinked_issues(now):
    """Part B — open issues older than AGED_DAYS with no linked PR."""
    threshold = now - timedelta(days=AGED_DAYS)
    # Gitea returns PRs in the issues endpoint by default; filter by type
    issues = gitea('/issues?state=open&type=issues&sort=oldest')
    findings = []
    for issue in issues:
        created = parse_dt(issue.get('created_at', ''))
        if not created or created > threshold:
            continue
        labels = {l.get('name', '') for l in issue.get('labels', [])}
        if labels & SKIP_ISSUE_LABELS:
            continue
        # An Issue with a linked PR has .pull_request set only when it IS a PR.
        # For real Issues we have to look at references in PR bodies — expensive
        # to query per Issue. Proxy: check `comments` count against a heuristic.
        # Better: use the backlink endpoint if available.
        # MVP: skip if the Issue body itself references an already-merged PR.
        body = issue.get('body') or ''
        if re.search(r'\bPR\s*#\d+\b', body, re.IGNORECASE):
            continue
        findings.append({
            'number': issue['number'],
            'title': (issue.get('title') or '')[:80],
            'url': issue.get('html_url', ''),
            'age_days': int((now - created).total_seconds() // 86400),
            'labels': sorted(labels),
        })
    findings.sort(key=lambda f: -f['age_days'])
    return findings


def check_merges_without_release(now):
    """Part C — merged PRs in last RELEASE_WINDOW_DAYS without a Gitea release tag.

    Heuristic: a PR is "released" if a Gitea release was created after the PR's
    merged_at. This is a loose check — it doesn't verify the release INCLUDES
    the PR's commits, only that a release exists on the timeline after.
    """
    threshold = now - timedelta(days=RELEASE_WINDOW_DAYS)
    prs = gitea('/pulls?state=closed&sort=recentupdate')
    releases = gitea('/releases')
    release_times = []
    for r in releases:
        t = parse_dt(r.get('created_at', ''))
        if t:
            release_times.append(t)
    release_times.sort()

    findings = []
    for pr in prs:
        if not pr.get('merged'):
            continue
        merged_at = parse_dt(pr.get('merged_at', ''))
        if not merged_at or merged_at < threshold:
            continue
        # Find any release after merged_at
        later_release = any(rt > merged_at for rt in release_times)
        if later_release:
            continue
        findings.append({
            'number': pr['number'],
            'title': (pr.get('title') or '')[:80],
            'url': pr.get('html_url', ''),
            'merged': pr.get('merged_at', ''),
        })
    return findings


def build_report(now, unlinked, aged, no_release, release_count):
    iso_date = now.strftime('%Y-%m-%d')
    lines = [f'# traceability-audit — {iso_date}', '']
    lines.append(f'**Window (PRs):** {WINDOW_DAYS}d | **Aged-Issue threshold:** {AGED_DAYS}d | '
                 f'**Release window:** {RELEASE_WINDOW_DAYS}d')
    lines.append(f'**Releases on file:** {release_count}')
    lines.append('')
    lines.append(f'**Part A (PRs missing Closes/Fixes/Refs):** {len(unlinked)}')
    lines.append(f'**Part B (aged open issues with no linked PR):** {len(aged)}')
    lines.append(f'**Part C (merged PRs with no later release):** {len(no_release)}')
    lines.append('')

    if unlinked:
        lines.append(f'## Part A — merged PRs (last {WINDOW_DAYS}d) missing `Closes #N`')
        lines.append('')
        lines.append('| PR | Title | Merged |')
        lines.append('|----|-------|--------|')
        for u in unlinked:
            lines.append(f'| [#{u["number"]}]({u["url"]}) | {u["title"]} | {u["merged"][:10]} |')
        lines.append('')

    if aged:
        lines.append(f'## Part B — open Issues older than {AGED_DAYS}d with no linked PR')
        lines.append('')
        lines.append('| Issue | Age (d) | Labels | Title |')
        lines.append('|-------|---------|--------|-------|')
        for a in aged[:30]:
            lines.append(f'| [#{a["number"]}]({a["url"]}) | {a["age_days"]} | '
                         f'{", ".join(a["labels"][:3])} | {a["title"]} |')
        if len(aged) > 30:
            lines.append(f'| … | … | … | +{len(aged) - 30} more |')
        lines.append('')

    if no_release:
        lines.append(f'## Part C — merged PRs (last {RELEASE_WINDOW_DAYS}d) with no release tag after merge')
        lines.append('')
        lines.append('| PR | Title | Merged |')
        lines.append('|----|-------|--------|')
        for n in no_release:
            lines.append(f'| [#{n["number"]}]({n["url"]}) | {n["title"]} | {n["merged"][:10]} |')
        lines.append('')

    if not unlinked and not aged and not no_release:
        lines.append('No findings. Traceability clean.')
        lines.append('')

    lines.append('---')
    lines.append('<!-- traceability-audit:run -->')
    return '\n'.join(lines) + '\n'


def main() -> int:
    if not GITEA_TOKEN:
        print('ERROR: GITEA_TOKEN not set', file=sys.stderr)
        return 1

    now = datetime.now(timezone.utc)
    try:
        unlinked = check_unlinked_merged_prs(now)
        aged = check_aged_unlinked_issues(now)
        no_release = check_merges_without_release(now)
        releases = gitea('/releases')
    except Exception as e:
        print(f'ERROR: {e}', file=sys.stderr)
        return 1

    print(f'unlinked={len(unlinked)} aged={len(aged)} no_release={len(no_release)} '
          f'releases={len(releases)}')
    emit('unlinked_prs_count', len(unlinked))
    emit('aged_issues_count', len(aged))
    emit('no_release_count', len(no_release))

    is_clean = not unlinked and not aged and not no_release
    if is_clean and not POST_ON_CLEAN:
        emit('has_comment', 'false')
        return 0

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as fh:
        fh.write(build_report(now, unlinked, aged, no_release, len(releases)))
    emit('has_comment', 'true')
    print(f'Wrote report to {OUTPUT_FILE}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
