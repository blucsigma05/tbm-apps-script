#!/usr/bin/env python3
"""check_stale_branches.py
Purpose:   Find branches older than STALE_DAYS that have no open PR. Sends Pushover.
Called by: .gitea/workflows/hyg-01-stale-branches.yml
Env vars:  GITEA_TOKEN       Gitea token (preferred)
           GITHUB_TOKEN      Fallback (Gitea Actions auto-provides this as compat alias)
           GH_TOKEN          Legacy alias, still accepted
           GITEA_API_URL     e.g. https://git.thompsonfams.com/api/v1 (optional;
                             defaults to ${GITHUB_SERVER_URL}/api/v1 which Gitea
                             Actions sets to the Gitea host)
           GITHUB_REPOSITORY owner/repo (set by Gitea Actions runner)
           STALE_DAYS        Days without commit before stale (default: 7)
           GITHUB_OUTPUT     Set by Actions runner; used to pass step outputs

Ported from GitHub REST to Gitea REST 2026-04-20 (PORT wave Batch 4b, Refs #7).
Behavior preserved: same SKIP_BRANCHES/SKIP_PREFIXES, same cutoff logic, same
output keys. Gitea's /branches endpoint returns commit timestamp inline, so
we skip the per-branch /commits lookup the GitHub version needed.
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta

TOKEN = (os.environ.get('GITEA_TOKEN')
         or os.environ.get('GITHUB_TOKEN')
         or os.environ.get('GH_TOKEN')
         or '').strip()
REPO = os.environ.get('GITHUB_REPOSITORY', '').strip()
STALE_DAYS = int(os.environ.get('STALE_DAYS', '7'))
GITHUB_OUTPUT = os.environ.get('GITHUB_OUTPUT', '')

SKIP_BRANCHES = {'main', 'gh-pages'}
SKIP_PREFIXES = ('claude/', 'dependabot/')


def gitea_base_url():
    explicit = os.environ.get('GITEA_API_URL', '').strip().rstrip('/')
    if explicit:
        return explicit
    server = os.environ.get('GITHUB_SERVER_URL', '').strip().rstrip('/')
    if server:
        return server + '/api/v1'
    return 'https://git.thompsonfams.com/api/v1'


def set_output(key, value):
    if GITHUB_OUTPUT:
        with open(GITHUB_OUTPUT, 'a') as fh:
            fh.write(key + '=' + value + '\n')
    else:
        print('[output] ' + key + '=' + value)


def gitea_get_all(path, limit=50):
    """Paginated GET against Gitea REST. Path may include query string.
    Returns concatenated array from all pages (stops on empty or short page).
    """
    results = []
    page = 1
    base = gitea_base_url()
    while True:
        sep = '&' if '?' in path else '?'
        url = base + path + sep + 'limit=' + str(limit) + '&page=' + str(page)
        req = urllib.request.Request(url)
        if TOKEN:
            req.add_header('Authorization', 'token ' + TOKEN)
        req.add_header('Accept', 'application/json')
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read() or b'[]')
        if not data:
            break
        results.extend(data)
        if len(data) < limit:
            break
        page += 1
    return results


def main():
    if not TOKEN:
        print('ERROR: no token set (GITEA_TOKEN / GITHUB_TOKEN / GH_TOKEN)')
        return 1
    if not REPO:
        print('ERROR: GITHUB_REPOSITORY not set')
        return 1

    # Active branches = head refs of any open PR
    prs = gitea_get_all('/repos/' + REPO + '/pulls?state=open')
    active = set((pr.get('head') or {}).get('ref', '') for pr in prs)

    branches = gitea_get_all('/repos/' + REPO + '/branches')

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=STALE_DAYS)

    stale = []
    for branch in branches:
        name = branch.get('name', '')
        if not name:
            continue
        if name in SKIP_BRANCHES:
            continue
        if any(name.startswith(p) for p in SKIP_PREFIXES):
            continue
        if name in active:
            continue
        if branch.get('protected', False):
            continue

        # Gitea returns commit info inline: branch.commit.timestamp
        commit = branch.get('commit') or {}
        date_str = commit.get('timestamp') or ''
        if not date_str:
            continue
        try:
            commit_dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except ValueError:
            continue
        if commit_dt.tzinfo is None:
            commit_dt = commit_dt.replace(tzinfo=timezone.utc)
        if commit_dt < cutoff:
            age = (now - commit_dt).days
            stale.append({'name': name, 'age_days': age})

    stale.sort(key=lambda x: x['age_days'], reverse=True)

    has_findings = len(stale) > 0
    set_output('has_findings', 'true' if has_findings else 'false')
    set_output('stale_count', str(len(stale)))

    print(json.dumps({'stale_days_threshold': STALE_DAYS, 'stale_count': len(stale),
                      'stale_branches': stale}, indent=2))

    if has_findings:
        parts = ['`' + b['name'] + '` (' + str(b['age_days']) + 'd)' for b in stale[:5]]
        msg = str(len(stale)) + ' stale branch(es) (>' + str(STALE_DAYS) + 'd, no PR): '
        msg += ', '.join(parts)
        if len(stale) > 5:
            msg += ' (+' + str(len(stale) - 5) + ' more)'
        with open('hyg01-message.txt', 'w') as fh:
            fh.write(msg)
        print('Findings: ' + msg)
    else:
        print('PASS: No stale branches (>' + str(STALE_DAYS) + 'd without PR).')

    return 0


if __name__ == '__main__':
    sys.exit(main())
