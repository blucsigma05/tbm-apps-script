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

Called by: .github/workflows/codex-rereview-handoff.yml (pull_request_target
           opened/reopened/synchronize + workflow_dispatch).

Trust:     Low-trust. This script only POSTS a single PR comment; it does
           not close Issues, file new ones, or otherwise mutate state
           beyond one idempotent upsert. Safe to run on fork PRs under
           pull_request_target (base-branch YAML is authoritative).

Env vars:
  Required:
    GITHUB_TOKEN / GH_TOKEN           auth (auto in Actions)
    GITHUB_REPOSITORY                 owner/repo (auto in Actions)
    REPO                              owner/repo (workflow-supplied mirror)
    PR_NUMBER                         the PR number
  Kill switches (both default ON):
    AUTOMATION_ENABLED                master off for all automation
    TBM_HANDOFF_ROUTER_ENABLED        off for this router only

Behavior:
  1. Gate on AUTOMATION_ENABLED AND TBM_HANDOFF_ROUTER_ENABLED. Silent exit
     on either false.
  2. Fetch PR body + all commit messages via `gh pr view --json body,commits`.
  3. Parse `Close[sd]? | Fix(e[sd])? | Resolve[sd]? #N` patterns (case
     insensitive). GitHub's closing-keyword set, not every mention.
  4. For each unique referenced issue, query `gh issue view --json labels,title`.
     Silently skip issues that do not exist or that return an error.
  5. Keep only issues carrying the `claude:inbox` label.
  6. If the filtered set is non-empty, build the canonical comment body and
     upsert: search existing PR comments for the marker, PATCH if present,
     POST if not.
  7. If the filtered set is empty, no-op (do not post, do not delete existing
     marker -- a past marker may still be valid even if the current push
     removed the closing keyword temporarily).
  8. Structured JSON-line logging to stdout for every decision.

Exit: 0 success (posted / updated / no-op all count as success).
      1 validation error (missing required env var).
      2 unexpected error (API / subprocess failure that prevents completion).
"""

import json
import os
import re
import subprocess
import sys
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
    """Structured JSON-line logging. Mirrors file_codex_review_findings.py."""
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


def gh(args, check=True):
    """Run gh CLI. Return (stdout, returncode). Raise on check=True failure."""
    proc = subprocess.run(
        ['gh'] + list(args),
        capture_output=True,
        text=True,
    )
    if check and proc.returncode != 0:
        log('gh-error', args=list(args), rc=proc.returncode,
            stderr=proc.stderr.strip()[:500])
        raise RuntimeError('gh ' + args[0] + ' failed rc=' + str(proc.returncode))
    return proc.stdout, proc.returncode


def fetch_pr_text(repo, pr_number):
    """Return PR body + all commit headlines/bodies concatenated for regex scan."""
    stdout, _ = gh([
        'pr', 'view', str(pr_number),
        '--repo', repo,
        '--json', 'body,commits',
    ])
    data = json.loads(stdout)
    parts = [data.get('body') or '']
    for commit in data.get('commits') or []:
        parts.append(commit.get('messageHeadline') or '')
        parts.append(commit.get('messageBody') or '')
    return '\n'.join(parts)


def extract_closing_refs(text):
    """Return sorted unique issue numbers from closing-keyword patterns."""
    nums = set()
    for match in ISSUE_REF_RE.finditer(text or ''):
        try:
            nums.add(int(match.group(1)))
        except (TypeError, ValueError):
            continue
    return sorted(nums)


def lookup_inbox_issue(repo, issue_number):
    """Return (True, title) if the issue has claude:inbox, else (False, None).
    Returns (False, None) on any lookup error (nonexistent, API failure, etc.)."""
    try:
        stdout, rc = gh([
            'issue', 'view', str(issue_number),
            '--repo', repo,
            '--json', 'labels,title,state',
        ], check=False)
        if rc != 0:
            log('issue-lookup-skip', issue=issue_number, rc=rc)
            return (False, None)
        data = json.loads(stdout)
        labels = [lbl.get('name', '') for lbl in data.get('labels') or []]
        # Require OPEN state. A closed claude:inbox Issue referenced in
        # older commit history should not surface as a live handoff target
        # and retrigger Codex re-review of an already-resolved finding.
        # (Caught by Codex review on PR #469 -- P2 finding.)
        state = (data.get('state') or '').upper()
        if INBOX_LABEL in labels and state == 'OPEN':
            return (True, data.get('title') or '')
        return (False, None)
    except (json.JSONDecodeError, RuntimeError) as exc:
        log('issue-lookup-error', issue=issue_number, error=str(exc)[:200])
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

    Uses `gh api --paginate --slurp` so all pages arrive as a single JSON
    array of arrays. Without --slurp, `gh api --paginate` emits each page
    as its own top-level JSON document; `json.loads` fails on the
    concatenated stream for any PR with >100 comments, the function
    silently returns None, and the upsert path creates a NEW comment on
    every run (duplicate tbm-handoff markers on busy PRs).
    (Caught by Codex review on PR #469 -- P1 finding.)
    """
    stdout, _ = gh([
        'api', 'repos/{0}/issues/{1}/comments'.format(repo, pr_number),
        '--paginate', '--slurp',
    ])
    try:
        pages = json.loads(stdout)
    except json.JSONDecodeError:
        log('comments-parse-error')
        return None
    # --slurp produces [[page1_comments], [page2_comments], ...]; flatten.
    for page in pages or []:
        for comment in page or []:
            if MARKER in (comment.get('body') or ''):
                return comment.get('id')
    return None


def upsert_marker_comment(repo, pr_number, body):
    """Update existing tbm-handoff comment or create a new one."""
    existing_id = find_existing_marker_comment(repo, pr_number)
    if existing_id:
        # PATCH via gh api. Pass body via stdin to avoid shell escaping.
        proc = subprocess.run(
            ['gh', 'api',
             'repos/{0}/issues/comments/{1}'.format(repo, existing_id),
             '--method', 'PATCH',
             '--input', '-'],
            input=json.dumps({'body': body}),
            text=True,
            capture_output=True,
        )
        if proc.returncode != 0:
            log('comment-update-error', rc=proc.returncode,
                stderr=proc.stderr.strip()[:500])
            raise RuntimeError('failed to update handoff comment')
        log('comment-updated', pr=pr_number, comment_id=existing_id)
        return
    # Create. `gh issue comment` handles the PR case too (PRs are issues).
    proc = subprocess.run(
        ['gh', 'issue', 'comment', str(pr_number),
         '--repo', repo,
         '--body-file', '-'],
        input=body,
        text=True,
        capture_output=True,
    )
    if proc.returncode != 0:
        log('comment-create-error', rc=proc.returncode,
            stderr=proc.stderr.strip()[:500])
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

    # 2. Fetch PR body + commits.
    try:
        pr_text = fetch_pr_text(repo, pr_number)
    except (json.JSONDecodeError, RuntimeError) as exc:
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
