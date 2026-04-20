#!/usr/bin/env python3
"""post_tbm_handoff_marker.py
Purpose:   Phase 3 of the Codex <-> Claude event router (#468). Post a
           <!-- tbm-handoff --> marker comment on a PR that references one
           or more open `claude:inbox` Issues via "Closes #N" / "Fixes #N" /
           "Resolves #N" patterns in the PR body or any commit message.
           Documents the Claude -> Codex handoff visibly on the PR so LT
           and future automation can see which inbox findings a PR claims
           to close. Does NOT trigger Codex re-review (that already fires
           on `pull_request_target: synchronize`) and does NOT close any
           Issues (Phase 2 does that when Codex re-reviews).

Called by: .gitea/workflows/codex-rereview-handoff.yml (pull_request_target
           opened/reopened/synchronize + workflow_dispatch).

Trust:     Low-trust. This script only POSTS a single PR comment; it does
           not close Issues, file new ones, or otherwise mutate state
           beyond one idempotent upsert. Safe to run on fork PRs under
           pull_request_target (base-branch YAML is authoritative).

Env vars:
  Required:
    GITEA_TOKEN / GITHUB_TOKEN / GH_TOKEN  auth (auto in Gitea Actions)
    GITEA_API_URL                          base (defaults to ${GITHUB_SERVER_URL}/api/v1)
    GITHUB_REPOSITORY                      owner/repo (auto in Actions)
    REPO                                   owner/repo (workflow-supplied mirror)
    PR_NUMBER                              the PR number
  Kill switches (both default ON):
    AUTOMATION_ENABLED                master off for all automation
    TBM_HANDOFF_ROUTER_ENABLED        off for this router only

Behavior:
  1. Gate on AUTOMATION_ENABLED AND TBM_HANDOFF_ROUTER_ENABLED. Silent exit
     on either false.
  2. Fetch PR body via /repos/{repo}/pulls/{n} + commit messages via
     /repos/{repo}/pulls/{n}/commits.
  3. Parse `Close[sd]? | Fix(e[sd])? | Resolve[sd]? #N` patterns (case
     insensitive). GitHub's closing-keyword set, not every mention.
  4. For each unique referenced issue, query /repos/{repo}/issues/{n}.
     Silently skip issues that do not exist or that return an error.
  5. Keep only issues carrying the `claude:inbox` label AND state=open.
  6. If the filtered set is non-empty, build the canonical comment body and
     upsert: search existing PR comments for the marker, PATCH if present,
     POST if not.
  7. If the filtered set is empty, no-op (do not post, do not delete existing
     marker -- a past marker may still be valid even if the current push
     removed the closing keyword temporarily).
  8. Structured JSON-line logging to stdout for every decision.

Exit: 0 success (posted / updated / no-op all count as success).
      1 validation error (missing required env var).
      2 unexpected error (API failure that prevents completion).

Ported 2026-04-20 from gh CLI subprocess to Gitea REST stdlib urllib
(PORT wave Batch 4f, Refs #7). Transport-only; logic preserved. Gitea
state values are lowercase ("open") where gh returned uppercase ("OPEN") —
updated comparison accordingly.
"""

import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone


MARKER = '<!-- tbm-handoff -->'
INBOX_LABEL = 'claude:inbox'

# GitHub's canonical closing-keyword grammar. Deliberately narrow -- only
# references that will trigger Issue closure on merge count. Plain "#N"
# mentions or "Related to #N" do NOT trigger a handoff marker.
ISSUE_REF_RE = re.compile(
    r'\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b',
    re.IGNORECASE,
)


def log(event, **fields):
    """Structured JSON-line logging."""
    fields['event'] = event
    sys.stdout.write(json.dumps(fields, sort_keys=True) + '\n')
    sys.stdout.flush()


def env_flag(name, default=True):
    raw = os.environ.get(name, '').strip().lower()
    if raw == '':
        return default
    return raw not in ('false', '0', 'no', 'off')


def env_required(name):
    value = os.environ.get(name, '').strip()
    if not value:
        log('error', reason='missing-env', name=name)
        sys.exit(1)
    return value


def gitea_base_url():
    explicit = os.environ.get('GITEA_API_URL', '').strip().rstrip('/')
    if explicit:
        return explicit
    server = os.environ.get('GITHUB_SERVER_URL', '').strip().rstrip('/')
    if server:
        return server + '/api/v1'
    return 'https://git.thompsonfams.com/api/v1'


def gitea_token():
    return (os.environ.get('GITEA_TOKEN')
            or os.environ.get('GITHUB_TOKEN')
            or os.environ.get('GH_TOKEN')
            or '').strip()


def gitea_api(method, path, body=None, query=None, timeout=15):
    """Gitea REST call. Returns parsed JSON (or None on 204). Raises on non-2xx."""
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
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        text = resp.read()
        if not text:
            return None
        return json.loads(text)


def fetch_pr_text(repo, pr_number):
    """Return PR body + all commit messages concatenated for regex scan.

    Uses two Gitea endpoints:
      GET /repos/{repo}/pulls/{n}           -> body
      GET /repos/{repo}/pulls/{n}/commits   -> list of commits with commit.message
    """
    pr = gitea_api('GET', '/repos/' + repo + '/pulls/' + str(pr_number)) or {}
    parts = [pr.get('body') or '']
    try:
        commits = gitea_api('GET', '/repos/' + repo + '/pulls/' + str(pr_number) + '/commits',
                            query={'limit': '50'}) or []
    except urllib.error.HTTPError as exc:
        log('pr-commits-fetch-error', code=exc.code)
        commits = []
    for commit in commits:
        inner = commit.get('commit') or {}
        # Gitea returns a single `message` field (GitHub split it into
        # messageHeadline/messageBody). Scan the whole thing.
        parts.append(inner.get('message') or commit.get('message') or '')
    return '\n'.join(parts)


def extract_closing_refs(text):
    nums = set()
    for match in ISSUE_REF_RE.finditer(text or ''):
        try:
            nums.add(int(match.group(1)))
        except (TypeError, ValueError):
            continue
    return sorted(nums)


def lookup_inbox_issue(repo, issue_number):
    """Return (True, title) if the issue has claude:inbox AND is open,
    else (False, None). Returns (False, None) on any lookup error.
    """
    try:
        data = gitea_api('GET', '/repos/' + repo + '/issues/' + str(issue_number))
    except urllib.error.HTTPError as exc:
        log('issue-lookup-skip', issue=issue_number, code=exc.code)
        return (False, None)
    except (urllib.error.URLError, json.JSONDecodeError) as exc:
        log('issue-lookup-error', issue=issue_number, error=str(exc)[:200])
        return (False, None)

    if not data:
        return (False, None)

    labels = [lbl.get('name', '') for lbl in (data.get('labels') or [])]
    # Gitea states are lowercase ("open"/"closed"). GitHub via gh CLI
    # returned uppercase ("OPEN"/"CLOSED"). Normalize before compare.
    state = (data.get('state') or '').lower()
    if INBOX_LABEL in labels and state == 'open':
        return (True, data.get('title') or '')
    return (False, None)


def build_comment_body(inbox_refs):
    """inbox_refs: list of (issue_number:int, title:str)."""
    lines = [MARKER, '', '## Claude to Codex Handoff', '']
    plural = len(inbox_refs) != 1
    claim = (
        'This PR claims to close the following `claude:inbox` '
        + ('Issues' if plural else 'Issue')
        + ' (filed by a prior Codex review):'
    )
    lines.append(claim)
    lines.append('')
    for num, title in inbox_refs:
        title_safe = (title or '').replace('\n', ' ').strip() or '(no title)'
        lines.append('- #{0} - {1}'.format(num, title_safe))
    lines.extend([
        '',
        '**Codex:** on next review, please verify the original finding is '
        'resolved. If verdict is PASS, Phase 2 auto-close will fire on the '
        'linked ' + ('Issues' if plural else 'Issue') + '. If FAIL, the '
        + ('Issues remain' if plural else 'Issue remains') + ' open.',
        '',
        '_Generated by Phase 3 reverse-direction handoff router (#468)._',
        '_Last updated: '
        + datetime.now(timezone.utc).isoformat(timespec='seconds')
        + '_',
    ])
    return '\n'.join(lines)


def find_existing_marker_comment(repo, pr_number):
    """Return comment id for an existing tbm-handoff comment, or None.

    Paginates through /repos/{repo}/issues/{n}/comments until an empty page.
    Gitea's comments list is a flat array per page (no "slurp" wrapper like
    gh --paginate --slurp). We walk pages manually.
    """
    page = 1
    while True:
        try:
            data = gitea_api(
                'GET',
                '/repos/' + repo + '/issues/' + str(pr_number) + '/comments',
                query={'limit': '50', 'page': str(page)},
            ) or []
        except urllib.error.HTTPError as exc:
            log('comments-fetch-error', page=page, code=exc.code)
            return None
        if not data:
            return None
        for comment in data:
            if MARKER in (comment.get('body') or ''):
                return comment.get('id')
        if len(data) < 50:
            return None
        page += 1


def upsert_marker_comment(repo, pr_number, body):
    """Update existing tbm-handoff comment or create a new one."""
    existing_id = find_existing_marker_comment(repo, pr_number)
    if existing_id:
        try:
            gitea_api(
                'PATCH',
                '/repos/' + repo + '/issues/comments/' + str(existing_id),
                body={'body': body},
            )
        except urllib.error.HTTPError as exc:
            log('comment-update-error', code=exc.code)
            raise RuntimeError('failed to update handoff comment')
        log('comment-updated', pr=pr_number, comment_id=existing_id)
        return
    try:
        gitea_api(
            'POST',
            '/repos/' + repo + '/issues/' + str(pr_number) + '/comments',
            body={'body': body},
        )
    except urllib.error.HTTPError as exc:
        log('comment-create-error', code=exc.code)
        raise RuntimeError('failed to create handoff comment')
    log('comment-created', pr=pr_number)


def main():
    # 1. Kill switches.
    if not env_flag('AUTOMATION_ENABLED', True):
        log('skip', reason='AUTOMATION_ENABLED=false')
        return 0
    if not env_flag('TBM_HANDOFF_ROUTER_ENABLED', True):
        log('skip', reason='TBM_HANDOFF_ROUTER_ENABLED=false')
        return 0

    repo = os.environ.get('REPO', '').strip() or env_required('GITHUB_REPOSITORY')
    pr_number = env_required('PR_NUMBER')

    if not gitea_token():
        log('error', reason='missing-token')
        return 1

    # 2. Fetch PR body + commits.
    try:
        pr_text = fetch_pr_text(repo, pr_number)
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError) as exc:
        log('pr-fetch-failed', error=str(exc)[:200])
        return 2

    # 3. Extract closing refs.
    refs = extract_closing_refs(pr_text)
    log('closing-refs-found', count=len(refs), refs=refs)
    if not refs:
        log('no-op', reason='no-closing-refs')
        return 0

    # 4-5. Filter to claude:inbox.
    inbox_refs = []
    for num in refs:
        has_inbox, title = lookup_inbox_issue(repo, num)
        if has_inbox:
            inbox_refs.append((num, title))
    log('inbox-refs-matched',
        count=len(inbox_refs),
        refs=[r[0] for r in inbox_refs])
    if not inbox_refs:
        log('no-op', reason='no-inbox-refs')
        return 0

    # 6. Upsert marker comment.
    body = build_comment_body(inbox_refs)
    try:
        upsert_marker_comment(repo, pr_number, body)
    except RuntimeError as exc:
        log('upsert-failed', error=str(exc)[:200])
        return 2

    return 0


if __name__ == '__main__':
    sys.exit(main())
