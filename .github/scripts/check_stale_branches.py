#!/usr/bin/env python3
"""check_stale_branches.py
Purpose:   Find branches older than STALE_DAYS that have no open PR. Sends Pushover.
Called by: .github/workflows/hyg-01-stale-branches.yml
Env vars:  GH_TOKEN          GitHub token (required)
           GITHUB_REPOSITORY owner/repo (set by Actions runner)
           STALE_DAYS        Days without commit before stale (default: 7)
           GITHUB_OUTPUT     Set by Actions runner; used to pass step outputs
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

GH_TOKEN = os.environ.get('GH_TOKEN', '')
REPO = os.environ.get('GITHUB_REPOSITORY', '')
STALE_DAYS = int(os.environ.get('STALE_DAYS', '7'))
GITHUB_OUTPUT = os.environ.get('GITHUB_OUTPUT', '')

SKIP_BRANCHES = {'main', 'gh-pages'}
SKIP_PREFIXES = ('claude/', 'dependabot/')


def set_output(key, value):
    if GITHUB_OUTPUT:
        with open(GITHUB_OUTPUT, 'a') as fh:
            fh.write(key + '=' + value + '\n')
    else:
        print('[output] ' + key + '=' + value)


def gh_get(path):
    url = 'https://api.github.com' + path
    req = urllib.request.Request(url, headers={
        'Authorization': 'Bearer ' + GH_TOKEN,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def gh_get_all(path):
    results = []
    page = 1
    sep = '&' if '?' in path else '?'
    while True:
        data = gh_get(path + sep + 'per_page=100&page=' + str(page))
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

    # Active branches = heads of any open PR
    prs = gh_get_all('/repos/' + REPO + '/pulls?state=open')
    active = set(pr['head']['ref'] for pr in prs)

    branches = gh_get_all('/repos/' + REPO + '/branches')

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=STALE_DAYS)

    stale = []
    for branch in branches:
        name = branch['name']
        if name in SKIP_BRANCHES:
            continue
        if any(name.startswith(p) for p in SKIP_PREFIXES):
            continue
        if name in active:
            continue
        if branch.get('protected', False):
            continue

        commits = gh_get('/repos/' + REPO + '/commits?sha=' + name + '&per_page=1')
        if not commits:
            continue
        date_str = commits[0]['commit']['author']['date']
        commit_dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
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
