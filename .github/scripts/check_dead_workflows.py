#!/usr/bin/env python3
"""check_dead_workflows.py
Purpose:   List all repo workflows, flag any with no run in DEAD_DAYS.
Called by: .gitea/workflows/hyg-08-dead-workflows.yml
Env vars:  GITEA_TOKEN       Gitea token (preferred)
           GITHUB_TOKEN      Fallback (Gitea Actions compat alias)
           GH_TOKEN          Legacy alias, still accepted
           GITEA_API_URL     e.g. https://git.thompsonfams.com/api/v1 (optional;
                             defaults to ${GITHUB_SERVER_URL}/api/v1)
           GITHUB_REPOSITORY owner/repo (set by Gitea Actions runner)
           DEAD_DAYS         Days without a run before flagged (default: 30)
           GITHUB_OUTPUT     Set by Actions runner; used to pass step outputs

Ported from GitHub Actions API to Gitea Actions API 2026-04-20 (PORT wave
Batch 4d, Refs #7).

Gitea Actions API shape (compat with GitHub for these endpoints):
  GET /repos/{repo}/actions/workflows           -> {"workflows":[{id,name,path,state}]}
  GET /repos/{repo}/actions/workflows/{id}/runs -> {"workflow_runs":[{updated_at,created_at,status}]}

Gitea returns workflow id as a filename-ish string in some versions and an
integer in others. The endpoint accepts whatever comes out of the list
endpoint's `id` field unchanged, so we just pass it through.
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
DEAD_DAYS = int(os.environ.get('DEAD_DAYS', '30'))
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


def gitea_get(path, query=None):
    url = gitea_base_url() + path
    if query:
        sep = '&' if '?' in url else '?'
        url = url + sep + urllib.parse.urlencode(query)
    req = urllib.request.Request(url)
    if TOKEN:
        req.add_header('Authorization', 'token ' + TOKEN)
    req.add_header('Accept', 'application/json')
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read() or b'{}')


def list_workflows():
    result = gitea_get('/repos/' + REPO + '/actions/workflows', {'limit': '100'})
    return result.get('workflows', [])


def get_latest_run(workflow_id):
    try:
        result = gitea_get(
            '/repos/' + REPO + '/actions/workflows/' + str(workflow_id) + '/runs',
            {'limit': '1'},
        )
    except urllib.error.HTTPError as e:
        # Gitea returns 404 for workflows that have never run
        if e.code == 404:
            return None
        raise
    runs = result.get('workflow_runs', []) or []
    return runs[0] if runs else None


def main():
    if not TOKEN:
        print('ERROR: no token set (GITEA_TOKEN / GITHUB_TOKEN / GH_TOKEN)')
        return 1
    if not REPO:
        print('ERROR: GITHUB_REPOSITORY not set')
        return 1

    workflows = list_workflows()

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=DEAD_DAYS)

    dead = []
    for wf in workflows:
        state = wf.get('state') or 'active'
        if state != 'active':
            continue

        name = wf.get('name') or wf.get('path') or ''
        wf_id = wf.get('id')
        if wf_id is None:
            continue

        latest = get_latest_run(wf_id)
        if latest is None:
            dead.append({'name': name, 'last_run': 'never', 'age_days': 'never'})
            continue

        run_date_str = latest.get('updated_at') or latest.get('created_at') or ''
        if not run_date_str:
            continue

        try:
            run_dt = datetime.fromisoformat(run_date_str.replace('Z', '+00:00'))
        except ValueError:
            continue
        if run_dt.tzinfo is None:
            run_dt = run_dt.replace(tzinfo=timezone.utc)
        if run_dt < cutoff:
            age = (now - run_dt).days
            dead.append({'name': name, 'last_run': run_date_str, 'age_days': age})

    def sort_key(x):
        return 9999 if x['age_days'] == 'never' else x['age_days']
    dead.sort(key=sort_key, reverse=True)

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
