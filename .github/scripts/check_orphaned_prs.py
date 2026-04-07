#!/usr/bin/env python3
"""check_orphaned_prs.py
Purpose:   Find open PRs with no activity for ORPHAN_DAYS. Sends Pushover.
Called by: .github/workflows/hyg-02-orphaned-prs.yml
Env vars:  GH_TOKEN          GitHub token (required)
           GITHUB_REPOSITORY owner/repo (set by Actions runner)
           ORPHAN_DAYS       Days without update before orphaned (default: 5)
           GITHUB_OUTPUT     Set by Actions runner; used to pass step outputs
"""

import json
import os
import sys
import urllib.request
from datetime import datetime, timezone, timedelta

GH_TOKEN = os.environ.get('GH_TOKEN', '')
REPO = os.environ.get('GITHUB_REPOSITORY', '')
ORPHAN_DAYS = int(os.environ.get('ORPHAN_DAYS', '5'))
GITHUB_OUTPUT = os.environ.get('GITHUB_OUTPUT', '')


def set_output(key, value):
    if GITHUB_OUTPUT:
        with open(GITHUB_OUTPUT, 'a') as fh:
            fh.write(key + '=' + value + '\n')
    else:
        print('[output] ' + key + '=' + value)


def gh_get_all(path):
    results = []
    page = 1
    sep = '&' if '?' in path else '?'
    while True:
        url = 'https://api.github.com' + path + sep + 'per_page=100&page=' + str(page)
        req = urllib.request.Request(url, headers={
            'Authorization': 'Bearer ' + GH_TOKEN,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        })
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
        if not data:
            break
        results.extend(data)
        if len(data) < 100:
            break
        page += 1
    return results


def main():
    if not GH_TOKEN:
        print('ERROR: GH_TOKEN not set')
        return 1
    if not REPO:
        print('ERROR: GITHUB_REPOSITORY not set')
        return 1

    prs = gh_get_all('/repos/' + REPO + '/pulls?state=open')

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=ORPHAN_DAYS)

    orphaned = []
    for pr in prs:
        updated_str = pr.get('updated_at', '')
        if not updated_str:
            continue
        updated = datetime.fromisoformat(updated_str.replace('Z', '+00:00'))
        if updated < cutoff:
            age = (now - updated).days
            orphaned.append({
                'number': pr['number'],
                'title': pr['title'],
                'age_days': age,
                'url': pr['html_url'],
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
