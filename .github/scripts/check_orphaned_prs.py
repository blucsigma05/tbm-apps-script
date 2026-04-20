#!/usr/bin/env python3
"""check_orphaned_prs.py
Purpose:   Find open PRs with no activity for ORPHAN_DAYS. Sends Pushover.
Called by: .gitea/workflows/hyg-02-orphaned-prs.yml
Env vars:  GITEA_TOKEN       Gitea token (preferred)
           GITHUB_TOKEN      Fallback (Gitea Actions auto-provides this as compat alias)
           GH_TOKEN          Legacy alias, still accepted
           GITEA_API_URL     e.g. https://git.thompsonfams.com/api/v1 (optional;
                             defaults to ${GITHUB_SERVER_URL}/api/v1)
           GITHUB_REPOSITORY owner/repo (set by Gitea Actions runner)
           ORPHAN_DAYS       Days without update before orphaned (default: 5)
           GITHUB_OUTPUT     Set by Actions runner; used to pass step outputs

Ported from GitHub REST to Gitea REST 2026-04-20 (PORT wave Batch 4b, Refs #7).
Gitea's /pulls endpoint returns the same shape we consume: number, title,
html_url, updated_at. No schema differences beyond the transport.
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
ORPHAN_DAYS = int(os.environ.get('ORPHAN_DAYS', '5'))
GITHUB_OUTPUT = os.environ.get('GITHUB_OUTPUT', '')


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

    prs = gitea_get_all('/repos/' + REPO + '/pulls?state=open')

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=ORPHAN_DAYS)

    orphaned = []
    for pr in prs:
        updated_str = pr.get('updated_at', '')
        if not updated_str:
            continue
        try:
            updated = datetime.fromisoformat(updated_str.replace('Z', '+00:00'))
        except ValueError:
            continue
        if updated.tzinfo is None:
            updated = updated.replace(tzinfo=timezone.utc)
        if updated < cutoff:
            age = (now - updated).days
            orphaned.append({
                'number': pr.get('number'),
                'title': pr.get('title', ''),
                'age_days': age,
                'url': pr.get('html_url', ''),
            })

    orphaned.sort(key=lambda x: x['age_days'], reverse=True)

    has_findings = len(orphaned) > 0
    set_output('has_findings', 'true' if has_findings else 'false')
    set_output('orphan_count', str(len(orphaned)))

    print(json.dumps({'orphan_days_threshold': ORPHAN_DAYS, 'orphan_count': len(orphaned),
                      'orphaned_prs': orphaned}, indent=2))

    if has_findings:
        parts = ['#' + str(p['number']) + ' ' + p['title'][:40] +
                 ' (' + str(p['age_days']) + 'd)' for p in orphaned[:5]]
        msg = str(len(orphaned)) + ' orphaned PR(s) (no activity >' + str(ORPHAN_DAYS) + 'd): '
        msg += ' | '.join(parts)
        if len(orphaned) > 5:
            msg += ' (+' + str(len(orphaned) - 5) + ' more)'
        with open('hyg02-message.txt', 'w') as fh:
            fh.write(msg)
        print('Findings: ' + msg)
    else:
        print('PASS: No orphaned PRs (all updated within ' + str(ORPHAN_DAYS) + 'd).')

    return 0


if __name__ == '__main__':
    sys.exit(main())
