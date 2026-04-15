#!/usr/bin/env python3
"""auto_close_issues.py
Purpose:   Daily cron that re-verifies every open auto-filed Issue.
           - If the finding sig is no longer detected, close the Issue with label auto-close:resolved.
           - If the finding still exists but evidence values differ, update the body in place
             (DECISION 5 = (a): live-updated evidence fields).
           - Issues with no registered detector are left alone (logged).
Called by: .github/workflows/auto-close-issues.yml
Env vars:  GITHUB_TOKEN / GH_TOKEN         auth
           GITHUB_REPOSITORY               owner/repo
           AUTOMATION_ENABLED              "false" short-circuits (default true)
           STATUS_ISSUE_NUMBER             pinned filer-status Issue (optional)
Args:      --dry-run  report actions; do not modify Issues
Exit:      0 success; 1 validation error; 2 unexpected GitHub API error

Detector registry:
  Each check-id maps to a detector() callable returning a dict: {sig: {evidence, details, title}}.
  Phase 0 registry is empty; Phase 1 wires version-drift here.
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

import file_hygiene_issue as filer  # noqa: E402

# ---- Detector registry -----------------------------------------------------
# Maps check-id -> callable returning {sig: {"evidence": {...}, "title": str, "details": str}}.
# Populated by Phase 1+ integrations. Empty in Phase 0: no detectors registered,
# helper runs cleanly but does nothing.

DETECTOR_REGISTRY = {}


def register_detector(check_id, fn):
    """Register a detector. Phase 1 calls this to wire version-drift."""
    DETECTOR_REGISTRY[check_id] = fn


def log(msg):
    sys.stderr.write('[auto-close] ' + msg + '\n')


def env_flag(name, default=True):
    raw = os.environ.get(name, '').strip().lower()
    if raw == '':
        return default
    return raw not in ('false', '0', 'no', 'off')


def gh_run(args, check=True):
    proc = subprocess.run(
        ['gh'] + args,
        capture_output=True,
        text=True,
        encoding='utf-8',
    )
    if check and proc.returncode != 0:
        log('gh failed: ' + ' '.join(args))
        log('stderr: ' + (proc.stderr or '').strip())
        raise RuntimeError('gh exit ' + str(proc.returncode))
    return proc


def list_filed_issues(repo):
    """Return list of open Issues labeled auto:filed, with body + number."""
    proc = gh_run([
        'issue', 'list', '-R', repo,
        '--state', 'open',
        '--label', 'auto:filed',
        '--limit', '100',
        '--json', 'number,title,body,labels',
    ])
    return json.loads(proc.stdout or '[]')


def parse_marker(body):
    """Return (check_id, sig) or (None, None) if no marker."""
    if not body:
        return None, None
    m = filer.MARKER_RE.search(body)
    if not m:
        return None, None
    return m.group(1), m.group(2)


def parse_evidence_from_body(body):
    """Extract evidence key-value pairs from rendered body.
    Skips blank lines immediately after '**Evidence:**', collects '- key: val' lines,
    and stops at the first line that is neither blank nor a bullet (e.g. next section)
    OR at a blank line that follows at least one bullet.
    """
    if '**Evidence:**' not in body:
        return {}
    after = body.split('**Evidence:**', 1)[1]
    out = {}
    started = False
    for line in after.split('\n'):
        stripped = line.strip()
        if not started:
            if not stripped:
                continue
            if stripped.startswith('- '):
                started = True
            else:
                break  # non-blank, non-bullet immediately after header
        else:
            if not stripped:
                break  # blank line after bullets ends the list
            if not stripped.startswith('- '):
                break  # non-bullet ends the list
        if stripped.startswith('- '):
            pair = stripped[2:]
            if ': ' not in pair:
                continue
            k, v = pair.split(': ', 1)
            out[k.strip()] = v.strip()
    return out


def close_issue(repo, number, reason_label, comment):
    gh_run(['issue', 'comment', str(number), '-R', repo, '-b', comment])
    gh_run(['issue', 'edit', str(number), '-R', repo, '--add-label', reason_label])
    gh_run(['issue', 'close', str(number), '-R', repo])


def update_body(repo, number, new_body):
    gh_run(['issue', 'edit', str(number), '-R', repo, '--body', new_body])


def reconcile_one_issue(issue, repo, dry_run, status_issue):
    number = issue['number']
    body = issue.get('body') or ''
    check_id, sig = parse_marker(body)
    if not check_id:
        log('#' + str(number) + ': no marker found — skipping (not one of ours)')
        return

    detector = DETECTOR_REGISTRY.get(check_id)
    if not detector:
        log('#' + str(number) + ': no detector for check=' + check_id + ' — skipping')
        return

    try:
        current = detector()  # returns {sig: {evidence, details, title}}
    except Exception as e:
        log('#' + str(number) + ': detector ' + check_id + ' failed: ' + str(e))
        return

    if sig not in current:
        log('#' + str(number) + ': sig ' + sig + ' RESOLVED — closing')
        if dry_run:
            sys.stdout.write('[dry-run] would close #' + str(number) + '\n')
            return
        comment = (
            'Auto-closing: next run of ' + check_id + ' no longer detects this finding.\n\n'
            'If this was closed in error, reopen and the filer will track it again.'
        )
        try:
            close_issue(repo, number, 'auto-close:resolved', comment)
            filer.post_status(
                repo,
                'Auto-closed #' + str(number) + ' (' + check_id + ' sig=' + sig + ')',
                status_issue,
            )
        except Exception as e:
            log('close failed for #' + str(number) + ': ' + str(e))
        return

    # Sig still present — check if evidence changed (DECISION 5 = (a))
    new_snap = current[sig]
    old_evidence = parse_evidence_from_body(body)
    new_evidence = new_snap.get('evidence') or {}
    if old_evidence == new_evidence:
        log('#' + str(number) + ': still present, evidence unchanged')
        return

    log('#' + str(number) + ': evidence changed ' + repr(old_evidence) + ' -> ' + repr(new_evidence))
    if dry_run:
        sys.stdout.write('[dry-run] would update body of #' + str(number) + '\n')
        return

    # Rebuild body using filer.render_body
    finding = {
        'check': check_id,
        'check_title': issue.get('title', '[?]').split(']')[0].lstrip('[') if ']' in issue.get('title', '') else '[?]',
        'title': new_snap.get('title') or '',
        'identity': {'check': check_id},  # placeholder — not used by render_body
        'evidence': new_evidence,
        'details': new_snap.get('details'),
    }
    new_body = filer.render_body(finding, sig)
    try:
        update_body(repo, number, new_body)
        log('#' + str(number) + ': body updated')
    except Exception as e:
        log('body update failed for #' + str(number) + ': ' + str(e))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    if not env_flag('AUTOMATION_ENABLED', True):
        log('AUTOMATION_ENABLED=false — no-op')
        return 0

    repo = os.environ.get('GITHUB_REPOSITORY', '').strip()
    if not repo:
        log('GITHUB_REPOSITORY not set')
        return 1

    status_issue = os.environ.get('STATUS_ISSUE_NUMBER', '').strip()

    if not DETECTOR_REGISTRY:
        log('no detectors registered (Phase 0 state) — nothing to reconcile')
        return 0

    try:
        issues = list_filed_issues(repo)
    except Exception as e:
        log('list failed: ' + str(e))
        return 2

    log('reconciling ' + str(len(issues)) + ' open auto:filed Issues')
    for issue in issues:
        reconcile_one_issue(issue, repo, args.dry_run, status_issue)
    return 0


if __name__ == '__main__':
    sys.exit(main())
