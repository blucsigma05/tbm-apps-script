#!/usr/bin/env python3
"""
Shared dedup helper for codex-finding-listener — prevents duplicate Issue creation.

Usage:
    from _finding_dedup import finding_issue_exists

Dedup key: HTML comment marker embedded in Issue body:
    <!-- codex-blocker-ref: PR#<N>-comment#<cid> -->

Logic mirrors hygiene-filer dedup pattern:
  - If open Issue with marker exists → no-op (return existing Issue number)
  - If closed Issue with marker AND labeled 'auto:suppressed' → no-op forever
  - Otherwise → safe to create (return None)

Ported 2026-04-20 from GitHub search API to Gitea list+client-scan
(PORT wave Batch 4e, Refs #7). Gitea's text-search is weaker than GitHub's,
so we iterate issues filtered by the auto-filed/codex-finding labels and
match the marker client-side — same pattern as file_hygiene_issue.py.
"""

import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


DEDUP_MARKER_PATTERN = re.compile(r'<!--\s*codex-blocker-ref:\s*(PR#\d+-comment#\d+)\s*-->')

# Labels we use to narrow the candidate-issue list. Must match what
# parse_finding_comment.py attaches when filing a blocker Issue.
FILER_LABELS = ['codex-finding', 'auto-filed']


def _gitea_base_url():
    explicit = os.environ.get('GITEA_API_URL', '').strip().rstrip('/')
    if explicit:
        return explicit
    server = os.environ.get('GITHUB_SERVER_URL', '').strip().rstrip('/')
    if server:
        return server + '/api/v1'
    return 'https://git.thompsonfams.com/api/v1'


def _gitea_list_issues(repo, state, labels, token, limit=50):
    """List issues filtered by labels (AND-joined). Returns parsed JSON list."""
    base = _gitea_base_url()
    results = []
    page = 1
    while True:
        query = {
            'state': state,
            'type': 'issues',
            'labels': ','.join(labels),
            'limit': str(limit),
            'page': str(page),
        }
        url = base + '/repos/' + repo + '/issues?' + urllib.parse.urlencode(query)
        req = urllib.request.Request(url)
        if token:
            req.add_header('Authorization', 'token ' + token)
        req.add_header('Accept', 'application/json')
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read() or b'[]')
        except Exception as exc:
            print('Dedup list error (%s): %s' % (state, exc), file=sys.stderr)
            return results
        if not data:
            break
        results.extend(data)
        if len(data) < limit:
            break
        page += 1
    return results


def finding_issue_exists(repo, pr_number, comment_id, token):
    """Return existing Issue number if dedup marker already filed, else None.

    Also returns None if suppressed (auto:suppressed label) — caller should not refile.
    Returns -1 specifically to signal 'suppressed, skip'.
    """
    marker = 'PR#%s-comment#%s' % (pr_number, comment_id)
    marker_text = '<!-- codex-blocker-ref: %s -->' % marker

    # Check open issues first — if marker matches, dedup on that
    for state in ('open', 'closed'):
        items = _gitea_list_issues(repo, state, FILER_LABELS, token)
        for item in items:
            body = item.get('body') or ''
            if marker_text not in body:
                continue
            labels = [L.get('name', '') for L in (item.get('labels') or [])]
            issue_num = item.get('number')
            if 'auto:suppressed' in labels:
                print('Finding %s suppressed via auto:suppressed on Issue #%d — skip' % (
                    marker, issue_num))
                return -1  # suppressed
            print('Finding %s already filed as Issue #%d — skip duplicate' % (marker, issue_num))
            return issue_num

    return None  # safe to create
