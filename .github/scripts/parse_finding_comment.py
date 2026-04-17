#!/usr/bin/env python3
"""
Codex Finding Comment Listener — parse PR comment for finding markers and apply labels.
Extended (#384): auto-file GitHub Issues for severity:blocker findings.

Called by: .github/workflows/codex-finding-listener.yml
Env vars expected:
  GITHUB_TOKEN      — GitHub token with issues:write and pull-requests:write (required)
  REPO              — owner/repo slug, e.g. blucsigma05/tbm-apps-script (required)
  GITHUB_EVENT_NAME — 'issue_comment', 'pull_request_review_comment', or 'pull_request_review' (required)
  COMMENT_AUTHOR    — login of the comment author (required)
  COMMENT_BODY      — full body of the comment (required)
  COMMENT_ID        — numeric ID of the comment (for blocker dedup key) (optional)
  ISSUE_NUMBER      — issue/PR number from issue_comment event (may be empty)
  PR_NUMBER         — PR number from pull_request_review_comment event (may be empty)

Kill switches (repo vars):
  AUTOMATION_ENABLED             — set 'false' to disable all automation
  CODEX_BLOCKER_AUTOFILE_ENABLED — set 'false' to disable blocker Issue auto-filing only

Behavior:
  - For issue_comment events: verifies via API that the issue is actually a PR; skips plain Issues.
  - Skips bot's own comments (loop prevention).
  - Rejects authors not in AUTHOR_WHITELIST; silent exit.
  - Scans body for visible-text OR HTML-comment finding markers.
  - If found: adds pipeline:fix-needed (created if absent) + type-specific label (created if absent).
  - If severity:blocker detected: auto-files a durable Issue via _finding_dedup.py.
  - Prevents duplicate replies via COMMENT_MARKER check.
  - If no marker: silent exit (no labels, no reply).
"""

import json
import os
import re
import sys
import urllib.request
import urllib.error

# Whitelisted comment authors. Only these logins can trigger finding actions.
AUTHOR_WHITELIST = {'blucsigma05', 'chatgpt-codex-connector'}

# These logins are the bot's own identity — skip to prevent infinite loops.
BOT_LOGINS = {'github-actions[bot]', 'github-actions'}

# HTML marker appended to confirmation replies; used to detect existing replies.
COMMENT_MARKER = '<!-- codex-finding-listener -->'

# Visible text marker: "Codex finding: HOLD" / "Codex manual audit: **FIX**" (case-insensitive)
# \*{0,2} handles optional markdown bold markers around the type word.
VISIBLE_PATTERN = re.compile(
    r'^codex\s+(?:manual\s+audit|finding)\s*:\s*\*{0,2}(HOLD|FIX|FYI|BLOCK)\*{0,2}',
    re.IGNORECASE | re.MULTILINE
)

# HTML comment marker: <!-- codex-finding:HOLD --> or <!-- codex-finding:FIX finding-id=X -->
HTML_PATTERN = re.compile(
    r'<!--\s*codex-finding:(HOLD|FIX|FYI|BLOCK)(?:[:\s][^>]*)?\s*-->',
    re.IGNORECASE
)

# Map finding types to existing repo labels only — never auto-create labels.
# Uses pipeline:* labels that already exist in the repo.
TYPE_LABELS = {
    'HOLD':  'pipeline:stalled',
    'FIX':   'pipeline:fix-needed',
    'FYI':   None,
    'BLOCK': 'pipeline:stalled',
}

# Detect severity:blocker from Codex badge format: ![P1 Badge](...) or <!-- severity:blocker -->
BLOCKER_BADGE_PATTERN = re.compile(
    r'!\[P1[^\]]*Badge\]|<!--\s*severity:blocker\s*-->',
    re.IGNORECASE
)

# Kill switch env vars (set by GitHub repo vars via workflow env)
AUTOMATION_ENABLED = os.environ.get('AUTOMATION_ENABLED', 'true').lower() != 'false'
BLOCKER_AUTOFILE_ENABLED = os.environ.get('CODEX_BLOCKER_AUTOFILE_ENABLED', 'true').lower() != 'false'


def gh_api(path, method='GET', body=None, token=None):
    """Call GitHub REST API. Returns parsed JSON or None on error."""
    url = 'https://api.github.com' + path
    headers = {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
    }
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print('API %s %s -> %d' % (method, path, e.code), file=sys.stderr)
        try:
            print(e.read().decode(), file=sys.stderr)
        except Exception:
            pass
        return None


def add_label_(repo, pr_number, label_name, token):
    """Apply a label to the issue/PR. Returns True only if the API call succeeds."""
    path = '/repos/%s/issues/%s/labels' % (repo, pr_number)
    result = gh_api(path, method='POST', body={'labels': [label_name]}, token=token)
    if result is not None:
        print('Label applied: %s' % label_name)
        return True
    print('Failed to apply label: %s' % label_name, file=sys.stderr)
    return False


def create_issue_if_blocker_(repo, pr_number, comment_id, comment_body, token):
    """Auto-file a durable Issue for a severity:blocker finding.

    Dedup key: <!-- codex-blocker-ref: PR#<N>-comment#<cid> --> in Issue body.
    Returns new Issue number, existing Issue number, or None on skip/error.
    """
    if not AUTOMATION_ENABLED or not BLOCKER_AUTOFILE_ENABLED:
        print('Blocker auto-file disabled by kill switch — skipping')
        return None

    sys.path.insert(0, os.path.dirname(__file__))
    try:
        from _finding_dedup import finding_issue_exists
    except ImportError as exc:
        print('WARNING: _finding_dedup import failed: %s — skipping blocker auto-file' % exc,
              file=sys.stderr)
        return None

    existing = finding_issue_exists(repo, pr_number, comment_id, token)
    if existing is not None:
        # -1 = suppressed, >0 = already filed
        return existing if existing > 0 else None

    # Extract a short title from the first non-empty line of the comment body
    first_line = ''
    for line in comment_body.splitlines():
        stripped = re.sub(r'[*_`#\[\]<>]', '', line).strip()
        stripped = re.sub(r'!\[.*?\]\(.*?\)', '', stripped).strip()
        if stripped:
            first_line = stripped[:80]
            break

    dedup_marker = '<!-- codex-blocker-ref: PR#%s-comment#%s -->' % (pr_number, comment_id)
    issue_body = (
        '%s\n\n'
        '**Auto-filed by codex-finding-listener** — severity:blocker finding on PR #%s.\n\n'
        '**Original finding:**\n\n%s\n\n'
        '**Source:** PR #%s comment #%s\n\n'
        'If this is a false positive, close with `false-positive` reason and add label `auto:suppressed`.'
    ) % (dedup_marker, pr_number, comment_body[:2000], pr_number, comment_id)

    result = gh_api('/repos/%s/issues' % repo, method='POST', body={
        'title': 'blocker: %s (from PR #%s)' % (first_line or 'Codex blocker finding', pr_number),
        'body': issue_body,
        'labels': ['kind:bug', 'severity:blocker', 'auto-filed', 'codex-finding'],
    }, token=token)

    if result:
        issue_num = result['number']
        print('Auto-filed blocker as Issue #%d' % issue_num)
        return issue_num
    else:
        print('ERROR: failed to create blocker Issue', file=sys.stderr)
        return None


def main():
    token = os.environ.get('GITHUB_TOKEN', '')
    repo = os.environ.get('REPO', '')
    event_name = os.environ.get('GITHUB_EVENT_NAME', '')
    author = os.environ.get('COMMENT_AUTHOR', '')
    body = os.environ.get('COMMENT_BODY', '')
    comment_id = os.environ.get('COMMENT_ID', '0').strip()
    issue_number = os.environ.get('ISSUE_NUMBER', '').strip()
    pr_number_raw = os.environ.get('PR_NUMBER', '').strip()

    if not all([token, repo, author, event_name]):
        print('ERROR: missing required env vars', file=sys.stderr)
        sys.exit(1)

    # Resolve the PR number depending on event type
    if event_name == 'issue_comment':
        # issue_comment fires on both Issues and PRs — verify via API
        if not issue_number:
            print('No issue number — skipping')
            return
        issue = gh_api('/repos/%s/issues/%s' % (repo, issue_number), token=token)
        if issue is None or 'pull_request' not in issue:
            print('issue_comment on plain issue #%s — skipping' % issue_number)
            return
        pr_number = issue_number
    elif event_name == 'pull_request_review':
        # pull_request_review is always on a PR — no API verification needed
        pr_number = pr_number_raw
    else:
        # pull_request_review_comment — PR number from workflow env
        pr_number = pr_number_raw

    if not pr_number:
        print('No PR number resolved — skipping')
        return

    # Loop prevention: skip comments posted by the bot itself
    if author in BOT_LOGINS:
        print('Skipping bot comment from %s' % author)
        return

    # Author whitelist check
    if author not in AUTHOR_WHITELIST:
        print('Author %r not in whitelist — skipping' % author)
        return

    # Detect finding marker (visible text takes precedence over HTML comment)
    finding_type = None
    m = VISIBLE_PATTERN.search(body)
    if m:
        finding_type = m.group(1).upper()
    else:
        m = HTML_PATTERN.search(body)
        if m:
            finding_type = m.group(1).upper()

    if finding_type is None:
        print('No finding marker detected — silent exit')
        return

    print('Finding detected: %s on PR #%s by %s' % (finding_type, pr_number, author))

    # Apply pipeline:fix-needed label
    label_ok = add_label_(repo, pr_number, 'pipeline:fix-needed', token)

    # Apply type-specific label if one is mapped
    type_label = TYPE_LABELS.get(finding_type)
    if type_label and type_label != 'pipeline:fix-needed':
        type_ok = add_label_(repo, pr_number, type_label, token)
        label_ok = label_ok or type_ok

    # Only post confirmation reply if at least one label was applied
    if not label_ok:
        print('No labels applied — skipping confirmation reply', file=sys.stderr)
        return

    # (#384) Auto-file blocker Issue if severity:blocker detected in comment
    blocker_issue_num = None
    is_blocker = bool(BLOCKER_BADGE_PATTERN.search(body))
    if is_blocker:
        print('severity:blocker detected — attempting Issue auto-file')
        blocker_issue_num = create_issue_if_blocker_(repo, pr_number, comment_id, body, token)

    # Check for existing confirmation to prevent duplicates
    comments_path = '/repos/%s/issues/%s/comments' % (repo, pr_number)
    existing = gh_api(comments_path, token=token) or []
    for c in existing:
        if COMMENT_MARKER in (c.get('body') or ''):
            print('Confirmation reply already exists — skipping duplicate')
            return

    labels_applied = ['`pipeline:fix-needed`']
    if type_label and type_label != 'pipeline:fix-needed':
        labels_applied.append('`%s`' % type_label)

    blocker_note = ''
    if blocker_issue_num and blocker_issue_num > 0:
        blocker_note = ' Auto-filed as Issue #%d for durability.' % blocker_issue_num

    reply = (
        COMMENT_MARKER + '\n'
        '\U0001f916 Finding detected (type: **%s**). '
        '%s label(s) applied.%s'
    ) % (finding_type, ' + '.join(labels_applied), blocker_note)
    gh_api(comments_path, method='POST', body={'body': reply}, token=token)
    print('Confirmation reply posted.')


if __name__ == '__main__':
    main()
