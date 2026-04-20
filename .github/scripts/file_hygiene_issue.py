#!/usr/bin/env python3
"""file_hygiene_issue.py
Purpose:   Dedup'd Gitea Issue filer for hygiene findings.
           Reads a finding JSON from stdin, computes an identity signature,
           searches for existing Issues, and either no-ops, reopens, or creates.
Called by: .gitea/workflows/hygiene-filer.yml
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
Env vars:  GITEA_TOKEN (preferred) or GITHUB_TOKEN  auth (auto in Gitea Actions)
           GITEA_API_URL                            e.g. https://git.thompsonfams.com/api/v1
                                                    (defaults to ${GITHUB_SERVER_URL}/api/v1
                                                    which Gitea sets to its own base)
           GITHUB_REPOSITORY                        owner/repo (auto in Gitea Actions)
           AUTOMATION_ENABLED                       "false" short-circuits (default true)
           HYGIENE_ISSUE_CREATION_ENABLED           "false" short-circuits (default true)
           AUTOMATION_MAX_DAILY_ISSUES              integer cap (default 5)
           STATUS_ISSUE_NUMBER                      pinned filer-status Issue (optional)
Args:      --dry-run  print rendered body; no Gitea API calls
Exit:      0 success (created, reopened, dedup no-op, or rate-limited no-op)
           1 validation error
           2 unexpected error (Gitea API failure)

Ported from GitHub gh-CLI implementation 2026-04-20 (PORT wave Batch 4a, Refs #7).
Behavior preserved: marker-based dedup, 7-day reopen window, suppress label,
daily rate cap, pre-create recheck. Only the transport (gh -> Gitea REST) changed.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

SIG_LENGTH = 16
REOPEN_WINDOW_DAYS = 7
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


def gitea_base_url():
    explicit = os.environ.get('GITEA_API_URL', '').strip().rstrip('/')
    if explicit:
        return explicit
    server = os.environ.get('GITHUB_SERVER_URL', '').strip().rstrip('/')
    if server:
        return server + '/api/v1'
    return 'https://git.thompsonfams.com/api/v1'


def gitea_token():
    return (os.environ.get('GITEA_TOKEN') or os.environ.get('GITHUB_TOKEN') or '').strip()


def gitea_api(method, path, body=None, query=None, timeout=30):
    """Gitea REST call. Returns parsed JSON (None on 204). Raises on non-2xx."""
    url = gitea_base_url() + path
    if query:
        url = url + '?' + urllib.parse.urlencode(query, doseq=True)
    data = None
    if body is not None:
        data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, method=method)
    token = gitea_token()
    if token:
        req.add_header('Authorization', 'token ' + token)
    req.add_header('Accept', 'application/json')
    if body is not None:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.getcode()
            text = resp.read().decode('utf-8') if resp.length != 0 else ''
            if not text:
                return None
            try:
                return json.loads(text)
            except ValueError:
                return text
    except urllib.error.HTTPError as e:
        err_body = ''
        try:
            err_body = e.read().decode('utf-8', errors='replace')[:500]
        except Exception:
            pass
        log('gitea API ' + method + ' ' + path + ' -> HTTP ' + str(e.code) + ': ' + err_body)
        raise
    except urllib.error.URLError as e:
        log('gitea API ' + method + ' ' + path + ' -> network error: ' + str(e.reason))
        raise


def list_issues(repo, state, labels=None, limit=200):
    """List Issues via Gitea REST. Returns list of dicts: number, body, closedAt, labels, createdAt.
    Replaces `gh issue list ... --json number,body,closedAt,labels`.
    Gitea `/repos/{repo}/issues` returns both issues and PRs — filter with type=issues.
    Labels are AND-joined on the server when passed as comma-separated names.
    """
    query = {
        'state': state,
        'type': 'issues',
        'limit': str(limit),
        'page': '1',
    }
    if labels:
        query['labels'] = ','.join(labels)
    items = gitea_api('GET', '/repos/' + repo + '/issues', query=query) or []
    out = []
    for it in items:
        out.append({
            'number': it.get('number'),
            'body': it.get('body') or '',
            'closedAt': it.get('closed_at'),
            'createdAt': it.get('created_at'),
            'labels': [L.get('name', '') for L in (it.get('labels') or [])],
        })
    return out


def issue_marker_matches(issue, check_id, sig):
    m = MARKER_RE.search(issue['body'] or '')
    return bool(m and m.group(1) == check_id and m.group(2) == sig)


def daily_issue_count(repo):
    """Count Issues created with label auto:filed in the last 24h (UTC date match).
    Gitea list-issues is paginated; we take the first 200 most-recent matches.
    """
    cutoff = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    try:
        items = list_issues(repo, 'all', labels=['auto:filed'], limit=200)
        return sum(1 for it in items if (it.get('createdAt') or '').startswith(cutoff))
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
        gitea_api('POST', '/repos/' + repo + '/issues/' + str(status_issue) + '/comments',
                  body={'body': body})
    except Exception as e:
        log('status post failed (not blocking): ' + str(e))


def find_open_match(repo, check_id, sig):
    issues = list_issues(repo, 'open', labels=['auto:filed'])
    return [it for it in issues if issue_marker_matches(it, check_id, sig)]


def find_suppressed(repo, check_id, sig):
    """Closed Issues with BOTH auto:filed AND auto:suppressed labels whose marker matches."""
    issues = list_issues(repo, 'closed', labels=['auto:filed', 'auto:suppressed'])
    return [it for it in issues if issue_marker_matches(it, check_id, sig)]


def find_recent_closed(repo, check_id, sig, days):
    """Closed Issues with auto:filed (NOT auto:suppressed) whose marker matches
    AND closedAt is within `days` of now. Suppressed exclusion is client-side.
    """
    cutoff_ts = datetime.now(timezone.utc).timestamp() - (days * 86400)
    issues = list_issues(repo, 'closed', labels=['auto:filed'])
    out = []
    for it in issues:
        if 'auto:suppressed' in it['labels']:
            continue
        if not issue_marker_matches(it, check_id, sig):
            continue
        closed_at = it.get('closedAt')
        if not closed_at:
            continue
        # Gitea returns ISO 8601 with offset (e.g. "2026-04-20T19:12:58Z" or "...+00:00").
        # Normalize for fromisoformat.
        normalized = closed_at.replace('Z', '+00:00')
        try:
            closed_dt = datetime.fromisoformat(normalized)
            if closed_dt.tzinfo is None:
                closed_dt = closed_dt.replace(tzinfo=timezone.utc)
            closed_ts = closed_dt.timestamp()
        except ValueError:
            continue
        if closed_ts >= cutoff_ts:
            out.append(it)
    return out


def resolve_label_ids(repo, names):
    """Resolve label names to IDs, creating any that don't exist (with a default color).
    Returns a list of int IDs in the order given.
    Gitea's POST /issues requires label IDs (int) in the body, not names.
    """
    existing = gitea_api('GET', '/repos/' + repo + '/labels', query={'limit': '200'}) or []
    by_name = {L.get('name', ''): L.get('id') for L in existing}
    ids = []
    for name in names:
        if name in by_name:
            ids.append(by_name[name])
            continue
        # Create missing label with neutral gray color.
        created = gitea_api('POST', '/repos/' + repo + '/labels',
                            body={'name': name, 'color': '#cccccc',
                                  'description': 'auto-created by hygiene filer'})
        if created and 'id' in created:
            by_name[name] = created['id']
            ids.append(created['id'])
    return ids


def create_issue(repo, title, body, labels):
    label_ids = resolve_label_ids(repo, labels)
    payload = {'title': title, 'body': body, 'labels': label_ids}
    created = gitea_api('POST', '/repos/' + repo + '/issues', body=payload)
    if not created:
        raise RuntimeError('Gitea returned empty response on issue create')
    num = str(created.get('number', ''))
    url = created.get('html_url', '')
    return num, url


def reopen_issue(repo, number):
    gitea_api('PATCH', '/repos/' + repo + '/issues/' + str(number),
              body={'state': 'open'})


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

    if not gitea_token():
        log('GITEA_TOKEN (or GITHUB_TOKEN fallback) not set')
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

    # Step 4.5: defensive recheck before create.
    # Gitea list-issues can have brief indexing lag between write and read. Sleep + recheck
    # closes the duplicate window cheaply (one create-path penalty).
    recheck_seconds = env_int('FILER_PRECREATE_RECHECK_SECONDS', 4)
    if recheck_seconds > 0:
        import time
        time.sleep(recheck_seconds)
        try:
            recheck = find_open_match(repo, check_id, sig)
        except Exception as e:
            log('recheck failed (proceeding to create): ' + str(e))
            recheck = []
        if recheck:
            log('dedup: open match #' + str(recheck[0]['number']) + ' (caught on recheck)')
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
