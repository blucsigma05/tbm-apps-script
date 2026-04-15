#!/usr/bin/env python3
"""file_hygiene_issue.py
Purpose:   Dedup'd GitHub Issue filer for hygiene findings.
           Reads a finding JSON from stdin, computes an identity signature,
           searches for existing Issues, and either no-ops, reopens, or creates.
Called by: .github/workflows/hygiene-filer.yml
Input:     Finding JSON on stdin. Schema:
             {
               "check":        "version-drift",      required, check-id
               "check_title":  "HYG-06",             required, title prefix
               "title":        "Version drift: ...", required, human title
               "identity":     {...},                required, fields used for sig
               "evidence":     {"Deployed":"42",...},optional, shown in body, D5-updated
               "details":      "Optional prose",     optional, shown in body
               "extra_labels": ["area:infra", ...],  optional
             }
Env vars:  GITHUB_TOKEN / GH_TOKEN           auth (auto in Actions)
           GITHUB_REPOSITORY                 owner/repo (auto in Actions)
           AUTOMATION_ENABLED                "false" short-circuits (default true)
           HYGIENE_ISSUE_CREATION_ENABLED    "false" short-circuits (default true)
           AUTOMATION_MAX_DAILY_ISSUES       integer cap (default 5)
           STATUS_ISSUE_NUMBER               pinned filer-status Issue (optional)
Args:      --dry-run  print rendered body; no GitHub API calls
Exit:      0 success (created, reopened, dedup no-op, or rate-limited no-op)
           1 validation error
           2 unexpected error (GitHub API failure)
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

SIG_LENGTH = 16  # DECISION 2 = (b): 16 hex chars
REOPEN_WINDOW_DAYS = 7  # DECISION 3 = (a)
SUPPRESSED_WINDOW_DAYS = 90
MARKER_PREFIX = '<!-- auto-finding v=1 '
MARKER_RE = re.compile(
    r'<!--\s*auto-finding\s+v=1\s+check=([^\s]+)\s+sig=([0-9a-f]+)\s*-->'
)

FOOTER = (
    '---\n'
    'Filed by hygiene automation. I dedup by the hidden marker below — '
    'editing this title is safe. If you close this Issue without adding the '
    '`auto:suppressed` label, I WILL REOPEN it on the next run if the finding '
    'still exists (within {days} days). Apply `auto:suppressed` to permanently '
    'dismiss.'
).format(days=REOPEN_WINDOW_DAYS)


def log(msg):
    sys.stderr.write('[filer] ' + msg + '\n')


def env_flag(name, default=True):
    raw = os.environ.get(name, '').strip().lower()
    if raw == '':
        return default
    return raw not in ('false', '0', 'no', 'off')


def env_int(name, default):
    raw = os.environ.get(name, '').strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def compute_sig(identity):
    """sha256 of identity dict. Keys and string values are stripped + lowercased
    before hashing. sort_keys enforced. First SIG_LENGTH hex chars returned.
    Raises ValueError on empty, non-dict, missing 'check' field, or unsupported value types.
    """
    if not isinstance(identity, dict) or not identity:
        raise ValueError('identity must be a non-empty dict')
    normalized = {}
    for k, v in identity.items():
        key = str(k).strip().lower()
        if isinstance(v, str):
            normalized[key] = v.strip().lower()
        elif isinstance(v, bool) or isinstance(v, (int, float)) or v is None:
            normalized[key] = v
        else:
            raise ValueError('identity field ' + repr(k) + ' has unsupported type ' + type(v).__name__)
    if 'check' not in normalized:
        raise ValueError('identity missing required field: check')
    payload = json.dumps(normalized, sort_keys=True, ensure_ascii=True).encode('utf-8')
    return hashlib.sha256(payload).hexdigest()[:SIG_LENGTH]


def render_body(finding, sig):
    """Assemble Issue body with marker, evidence, details, footer."""
    lines = []
    lines.append('**Check:** ' + finding['check_title'] + ' ' + finding.get('check', ''))
    lines.append('')
    evidence = finding.get('evidence') or {}
    if evidence:
        lines.append('**Evidence:**')
        for key, val in evidence.items():
            lines.append('- ' + str(key) + ': ' + str(val))
        lines.append('')
    details = finding.get('details')
    if details:
        lines.append('**Details:**')
        lines.append(str(details))
        lines.append('')
    lines.append(FOOTER)
    lines.append('')
    marker = MARKER_PREFIX + 'check=' + finding['check'] + ' sig=' + sig + ' -->'
    lines.append(marker)
    return '\n'.join(lines)


def render_title(finding):
    return '[' + finding['check_title'] + '] ' + finding['title']


def validate_finding(finding):
    required = ['check', 'check_title', 'title', 'identity']
    missing = [k for k in required if k not in finding]
    if missing:
        raise ValueError('finding missing required fields: ' + ', '.join(missing))
    if not isinstance(finding['identity'], dict):
        raise ValueError('identity must be a dict')


def gh_run(args, check=True):
    """Run `gh` CLI and return parsed JSON stdout."""
    proc = subprocess.run(
        ['gh'] + args,
        capture_output=True,
        text=True,
        encoding='utf-8',
    )
    if check and proc.returncode != 0:
        log('gh command failed: ' + ' '.join(args))
        log('stderr: ' + (proc.stderr or '').strip())
        raise RuntimeError('gh exit ' + str(proc.returncode))
    return proc


def gh_graphql_search(query, repo):
    """Search issues matching a query. Returns list of {number, state, labels}."""
    q = 'repo:' + repo + ' ' + query
    proc = gh_run([
        'api', 'graphql',
        '-f', 'query=query($q:String!){search(query:$q,type:ISSUE,first:25){'
              'nodes{...on Issue{number state labels(first:20){nodes{name}}}}}}',
        '-f', 'q=' + q,
    ])
    data = json.loads(proc.stdout)
    nodes = data.get('data', {}).get('search', {}).get('nodes', []) or []
    out = []
    for n in nodes:
        if not n:
            continue
        labels = [L['name'] for L in (n.get('labels') or {}).get('nodes', []) or []]
        out.append({'number': n['number'], 'state': n['state'], 'labels': labels})
    return out


def daily_issue_count(repo):
    """Count Issues created with label auto:filed in the last 24h."""
    cutoff = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    q = 'is:issue label:auto:filed created:>=' + cutoff
    try:
        results = gh_graphql_search(q, repo)
        return len(results)
    except Exception as e:
        log('daily count failed (not blocking): ' + str(e))
        return 0


def post_status(repo, message, status_issue):
    if not status_issue:
        log('no STATUS_ISSUE_NUMBER set; skipping status comment')
        return
    stamp = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    body = '[' + stamp + '] ' + message
    try:
        gh_run(['issue', 'comment', str(status_issue), '-R', repo, '-b', body])
    except Exception as e:
        log('status post failed (not blocking): ' + str(e))


def find_open_match(repo, check_id, sig):
    q = 'is:issue is:open in:body "sig=' + sig + '" "check=' + check_id + '"'
    return gh_graphql_search(q, repo)


def find_suppressed(repo, check_id, sig):
    q = ('is:issue is:closed label:auto:suppressed in:body '
         '"sig=' + sig + '" "check=' + check_id + '"')
    return gh_graphql_search(q, repo)


def find_recent_closed(repo, check_id, sig, days):
    cutoff = (datetime.now(timezone.utc).timestamp() - days * 86400)
    cutoff_iso = datetime.fromtimestamp(cutoff, tz=timezone.utc).strftime('%Y-%m-%d')
    q = ('is:issue is:closed -label:auto:suppressed in:body '
         '"sig=' + sig + '" "check=' + check_id + '" closed:>=' + cutoff_iso)
    return gh_graphql_search(q, repo)


def create_issue(repo, title, body, labels):
    args = ['issue', 'create', '-R', repo, '-t', title, '-b', body]
    for lab in labels:
        args.extend(['-l', lab])
    proc = gh_run(args)
    url = (proc.stdout or '').strip().split('\n')[-1]
    num = url.rsplit('/', 1)[-1]
    return num, url


def reopen_issue(repo, number):
    gh_run(['issue', 'reopen', str(number), '-R', repo])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    try:
        finding = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        log('invalid JSON on stdin: ' + str(e))
        return 1

    try:
        validate_finding(finding)
        sig = compute_sig(finding['identity'])
    except ValueError as e:
        log('validation error: ' + str(e))
        return 1

    title = render_title(finding)
    body = render_body(finding, sig)

    if args.dry_run:
        sys.stdout.write('=== DRY RUN ===\n')
        sys.stdout.write('Title: ' + title + '\n')
        sys.stdout.write('Sig: ' + sig + '\n')
        sys.stdout.write('--- Body ---\n')
        sys.stdout.write(body + '\n')
        return 0

    if not env_flag('AUTOMATION_ENABLED', True):
        log('AUTOMATION_ENABLED=false — no-op')
        return 0
    if not env_flag('HYGIENE_ISSUE_CREATION_ENABLED', True):
        log('HYGIENE_ISSUE_CREATION_ENABLED=false — no-op')
        return 0

    repo = os.environ.get('GITHUB_REPOSITORY', '').strip()
    if not repo:
        log('GITHUB_REPOSITORY not set')
        return 1

    status_issue = os.environ.get('STATUS_ISSUE_NUMBER', '').strip()
    check_id = finding['check']

    # Step 1: open match → no-op
    try:
        open_hits = find_open_match(repo, check_id, sig)
    except Exception as e:
        log('open-match search failed: ' + str(e))
        return 2
    if open_hits:
        log('dedup: open match #' + str(open_hits[0]['number']))
        return 0

    # Step 2: suppressed closed → no-op forever
    try:
        suppressed = find_suppressed(repo, check_id, sig)
    except Exception as e:
        log('suppressed search failed: ' + str(e))
        return 2
    if suppressed:
        log('dedup: suppressed #' + str(suppressed[0]['number']) + ' — never re-file')
        return 0

    # Step 3: recent closed (<=7d) without suppress → reopen
    try:
        recent = find_recent_closed(repo, check_id, sig, REOPEN_WINDOW_DAYS)
    except Exception as e:
        log('recent-closed search failed: ' + str(e))
        return 2
    if recent:
        num = recent[0]['number']
        log('dedup: reopening #' + str(num))
        try:
            reopen_issue(repo, num)
            post_status(repo, 'Reopened #' + str(num) + ' (' + check_id + ' sig=' + sig + ')', status_issue)
        except Exception as e:
            log('reopen failed: ' + str(e))
            return 2
        return 0

    # Step 4: rate limit check BEFORE create
    cap = env_int('AUTOMATION_MAX_DAILY_ISSUES', 5)
    count = daily_issue_count(repo)
    if count >= cap:
        log('daily cap reached (' + str(count) + '/' + str(cap) + ') — dropping finding')
        post_status(
            repo,
            'DROPPED: daily cap ' + str(cap) + ' hit. check=' + check_id + ' sig=' + sig + '. '
            'Re-fires tomorrow unless source fix lands.',
            status_issue,
        )
        return 0

    # Step 5: create new
    labels = ['auto:filed']
    extra = finding.get('extra_labels') or []
    labels.extend([str(L) for L in extra])
    try:
        num, url = create_issue(repo, title, body, labels)
    except Exception as e:
        log('create failed: ' + str(e))
        return 2
    log('created #' + num + ' (' + check_id + ' sig=' + sig + ')')
    post_status(repo, 'Created #' + num + ' (' + check_id + ' sig=' + sig + ')', status_issue)
    return 0


if __name__ == '__main__':
    sys.exit(main())
