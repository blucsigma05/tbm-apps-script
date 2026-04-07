#!/usr/bin/env python3
"""check_dead_workflows.py
Purpose:   List all repo workflows, flag any with no run in DEAD_DAYS.
Called by: .github/workflows/hyg-08-dead-workflows.yml
Env vars:  GH_TOKEN          GitHub token (required)
           GITHUB_REPOSITORY owner/repo (set by Actions runner)
           DEAD_DAYS         Days without a run before flagged (default: 30)
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
DEAD_DAYS = int(os.environ.get('DEAD_DAYS', '30'))
GITHUB_OUTPUT = os.environ.get('GITHUB_OUTPUT', '')


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


def list_workflows():
    result = gh_get('/repos/' + REPO + '/actions/workflows?per_page=100')
    return result.get('workflows', [])


def get_latest_run(workflow_id):
    result = gh_get('/repos/' + REPO + '/actions/workflows/' + str(workflow_id) +
                    '/runs?per_page=1&status=completed')
    runs = result.get('workflow_runs', [])
    return runs[0] if runs else None


def main():
    if not GH_TOKEN:
        print('ERROR: GH_TOKEN not set')
        return 1
    if not REPO:
        print('ERROR: GITHUB_REPOSITORY not set')
        return 1

    workflows = list_workflows()

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=DEAD_DAYS)

    dead = []
    for wf in workflows:
        if wf.get('state') != 'active':
            continue

        name = wf.get('name', wf.get('path', ''))
        wf_id = wf['id']

        latest = get_latest_run(wf_id)
        if latest is None:
            dead.append({'name': name, 'last_run': 'never', 'age_days': 'never'})
            continue

        run_date_str = latest.get('updated_at', latest.get('created_at', ''))
        if not run_date_str:
            continue

        run_dt = datetime.fromisoformat(run_date_str.replace('Z', '+00:00'))
        if run_dt < cutoff:
            age = (now - run_dt).days
            dead.append({'name': name, 'last_run': run_date_str, 'age_days': age})

    dead.sort(key=lambda x: 9999 if x['age_days'] == 'never' else x['age_days'], reverse=True)

    has_findings = len(dead) > 0
    set_output('has_findings', 'true' if has_findings else 'false')
    set_output('dead_count', str(len(dead)))

    print(json.dumps({
        'dead_days_threshold': DEAD_DAYS,
        'total_workflows': len(workflows),
        'dead_count': len(dead),
        'dead_workflows': dead,
    }, indent=2))

    if has_findings:
        parts = []
        for d in dead[:5]:
            age = str(d['age_days']) + 'd' if d['age_days'] != 'never' else 'never run'
            parts.append('`' + d['name'] + '` (' + age + ')')
        msg = str(len(dead)) + ' dead workflow(s) (no run >' + str(DEAD_DAYS) + 'd): '
        msg += ', '.join(parts)
        if len(dead) > 5:
            msg += ' (+' + str(len(dead) - 5) + ' more)'
        with open('hyg08-message.txt', 'w') as fh:
            fh.write(msg)
        print('Findings: ' + msg)
    else:
        print('PASS: All ' + str(len(workflows)) + ' active workflows ran within ' + str(DEAD_DAYS) + 'd.')

    return 0


if __name__ == '__main__':
    sys.exit(main())
