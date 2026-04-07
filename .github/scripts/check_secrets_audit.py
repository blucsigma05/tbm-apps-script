#!/usr/bin/env python3
"""check_secrets_audit.py
Purpose:   List GH repo secrets, flag orphaned (no workflow reference) or stale (>90 days).
Called by: .github/workflows/hyg-07-secrets-audit.yml
Env vars:  GH_TOKEN          GitHub token (required)
           GITHUB_REPOSITORY owner/repo (set by Actions runner)
           GITHUB_OUTPUT     Set by Actions runner; used to pass step outputs

Note: GitHub API returns secret names and updated_at but not values.
      'Orphaned' means the secret name doesn't appear in any .yml workflow file.
      'Stale' means updated_at > 90 days ago.
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

GH_TOKEN = os.environ.get('GH_TOKEN', '')
REPO = os.environ.get('GITHUB_REPOSITORY', '')
GITHUB_OUTPUT = os.environ.get('GITHUB_OUTPUT', '')
STALE_DAYS = 90

# Secrets that are always expected (never flag as orphaned)
KNOWN_INFRA = {'GITHUB_TOKEN'}


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


def list_secrets():
    result = gh_get('/repos/' + REPO + '/actions/secrets?per_page=100')
    return result.get('secrets', [])


def scan_workflow_files():
    """Read all workflow YAML files and return their combined content."""
    workflows_dir = '.github/workflows'
    combined = ''
    if os.path.isdir(workflows_dir):
        for fname in os.listdir(workflows_dir):
            if fname.endswith('.yml') or fname.endswith('.yaml'):
                fpath = os.path.join(workflows_dir, fname)
                with open(fpath, 'r') as fh:
                    combined += fh.read() + '\n'
    return combined


def main():
    if not GH_TOKEN:
        print('ERROR: GH_TOKEN not set')
        return 1
    if not REPO:
        print('ERROR: GITHUB_REPOSITORY not set')
        return 1

    secrets = list_secrets()
    workflow_content = scan_workflow_files()

    now = datetime.now(timezone.utc)
    stale_cutoff = now - timedelta(days=STALE_DAYS)

    findings = []
    for secret in secrets:
        name = secret['name']
        updated_str = secret.get('updated_at', '')
        issues = []

        # Check orphaned
        if name not in KNOWN_INFRA:
            ref_pattern = 'secrets.' + name
            if ref_pattern not in workflow_content:
                issues.append('orphaned')

        # Check stale
        if updated_str:
            updated = datetime.fromisoformat(updated_str.replace('Z', '+00:00'))
            age = (now - updated).days
            if updated < stale_cutoff:
                issues.append('stale (' + str(age) + 'd)')
        else:
            age = None

        if issues:
            findings.append({
                'name': name,
                'issues': issues,
                'updated_at': updated_str,
                'age_days': age,
            })

    findings.sort(key=lambda x: len(x['issues']), reverse=True)

    has_findings = len(findings) > 0
    set_output('has_findings', 'true' if has_findings else 'false')
    set_output('finding_count', str(len(findings)))

    print(json.dumps({
        'total_secrets': len(secrets),
        'finding_count': len(findings),
        'stale_threshold_days': STALE_DAYS,
        'findings': findings,
    }, indent=2))

    if has_findings:
        parts = []
        for f in findings[:5]:
            parts.append('`' + f['name'] + '` [' + ', '.join(f['issues']) + ']')
        msg = str(len(findings)) + ' secret(s) need attention: '
        msg += ', '.join(parts)
        if len(findings) > 5:
            msg += ' (+' + str(len(findings) - 5) + ' more)'
        with open('hyg07-message.txt', 'w') as fh:
            fh.write(msg)
        print('Findings: ' + msg)
    else:
        print('PASS: All ' + str(len(secrets)) + ' secrets are referenced and fresh.')

    return 0


if __name__ == '__main__':
    sys.exit(main())
