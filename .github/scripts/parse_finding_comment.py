#!/usr/bin/env python3
"""
Codex Finding Comment Listener — parse PR comment for finding markers and apply labels.

Called by: .github/workflows/codex-finding-listener.yml
Env vars expected:
  GITHUB_TOKEN      — GitHub token with issues:write and pull-requests:write (required)
  REPO              — owner/repo slug, e.g. blucsigma05/tbm-apps-script (required)
  GITHUB_EVENT_NAME — 'issue_comment', 'pull_request_review_comment', or 'pull_request_review' (required)
  COMMENT_AUTHOR    — login of the comment author (required)
  COMMENT_BODY      — full body of the comment (required)
  ISSUE_NUMBER      — issue/PR number from issue_comment event (may be empty)
  PR_NUMBER         — PR number from pull_request_review_comment event (may be empty)

Behavior:
  - For issue_comment events: verifies via API that the issue is actually a PR; skips plain Issues.
  - Skips bot's own comments (loop prevention).
  - Rejects authors not in AUTHOR_WHITELIST; silent exit.
  - Scans body for visible-text OR HTML-comment finding markers.
  - If found: adds pipeline:fix-needed (created if absent) + type-specific label (created if absent).
  - Prevents duplicate replies via COMMENT_MARKER check.
  - If no marker: silent exit (no labels, no reply).
"""

import json
import os
import re
import sys
import urllib.parse
import urllib.request
import urllib.error

# Whitelisted comment authors. Only these logins can trigger finding actions.
AUTHOR_WHITELIST = {'blucsigma05', 'chatgpt-codex-connector'}

# These logins are the bot's own identity — skip to prevent infinite loops.
BOT_LOGINS = {'github-actions[bot]', 'github-actions'}

# HTML marker appended to confirmation replies; used to detect existing replies.
COMMENT_MARKER = '<!-- codex-finding-listener -->'

# Visible text marker: "Codex finding: HOLD" / "Codex manual audit: FIX" (case-insensitive)
VISIBLE_PATTERN = re.compile(
    r'^codex\s+(?:manual\s+audit|finding)\s*:\s*(HOLD|FIX|FYI|BLOCK)',
    re.IGNORECASE | re.MULTILINE
)

# HTML comment marker: <!-- codex-finding:HOLD --> or <!-- codex-finding:FIX finding-id=X -->
HTML_PATTERN = re.compile(
    r'<!--\s*codex-finding:(HOLD|FIX|FYI|BLOCK)(?:[:\s][^>]*)?\s*-->',
    re.IGNORECASE
)

TYPE_LABELS = {
    'HOLD':  'finding:hold',
    'FIX':   'finding:fix',
    'FYI':   'finding:fyi',
    'BLOCK': 'finding:block',
}

# Default colors when auto-creating labels that don't exist in the repo yet.
LABEL_COLORS = {
    'pipeline:fix-needed': 'e4e669',
    'finding:hold':        'd73a4a',
    'finding:fix':         '0075ca',
    'finding:fyi':         'cfd3d7',
    'finding:block':       'b60205',
}


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


def ensure_label_(repo, name, token):
    """Create the label in the repo if it does not exist. Returns True if ready."""
    encoded = urllib.parse.quote(name, safe='')
    existing = gh_api('/repos/%s/labels/%s' % (repo, encoded), token=token)
    if existing is not None:
        return True  # already exists
    color = LABEL_COLORS.get(name, 'ededed')
    result = gh_api('/repos/%s/labels' % repo, method='POST',
                    body={'name': name, 'color': color}, token=token)
    if result is not None:
        print('Created missing label: %s' % name)
    return result is not None


def add_label_(repo, pr_number, label_name, token):
    """Ensure label exists in repo, then apply it to the issue/PR."""
    ensure_label_(repo, label_name, token)
    path = '/repos/%s/issues/%s/labels' % (repo, pr_number)
    result = gh_api(path, method='POST', body={'labels': [label_name]}, token=token)
    if result is not None:
        print('Label applied: %s' % label_name)
    return result is not None


def main():
    token = os.environ.get('GITHUB_TOKEN', '')
    repo = os.environ.get('REPO', '')
    event_name = os.environ.get('GITHUB_EVENT_NAME', '')
    author = os.environ.get('COMMENT_AUTHOR', '')
    body = os.environ.get('COMMENT_BODY', '')
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

    # Apply pipeline:fix-needed first — independently, so it always lands
    add_label_(repo, pr_number, 'pipeline:fix-needed', token)

    # Apply type-specific label independently (create in repo if absent)
    type_label = TYPE_LABELS.get(finding_type)
    if type_label:
        add_label_(repo, pr_number, type_label, token)

    # Post confirmation reply — check for existing to prevent duplicates
    comments_path = '/repos/%s/issues/%s/comments' % (repo, pr_number)
    existing = gh_api(comments_path, token=token) or []
    for c in existing:
        if COMMENT_MARKER in (c.get('body') or ''):
            print('Confirmation reply already exists — skipping duplicate')
            return

    reply = (
        COMMENT_MARKER + '\n'
        '\U0001f916 Finding detected (type: **%s**). '
        '`pipeline:fix-needed` label added. Pipeline Review Fixer will pick this up.'
    ) % finding_type
    gh_api(comments_path, method='POST', body={'body': reply}, token=token)
    print('Confirmation reply posted.')


if __name__ == '__main__':
    main()
