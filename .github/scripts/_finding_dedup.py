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
"""

import json
import re
import urllib.request
import urllib.error
import sys


DEDUP_MARKER_PATTERN = re.compile(r'<!--\s*codex-blocker-ref:\s*(PR#\d+-comment#\d+)\s*-->')


def _gh_search(query, token):
    """Search Issues via GitHub REST search API. Returns list of items."""
    import urllib.parse
    url = 'https://api.github.com/search/issues?q=' + urllib.parse.quote(query) + '&per_page=5'
    headers = {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read()).get('items', [])
    except Exception as exc:
        print('Search error: %s' % exc, file=sys.stderr)
        return []


def finding_issue_exists(repo, pr_number, comment_id, token):
    """Return existing Issue number if dedup marker already filed, else None.

    Also returns None if suppressed (auto:suppressed label) — caller should not refile.
    Returns -1 specifically to signal 'suppressed, skip'.
    """
    marker = 'PR#%s-comment#%s' % (pr_number, comment_id)
    marker_text = '<!-- codex-blocker-ref: %s -->' % marker

    query = 'repo:%s is:issue in:body "%s"' % (repo, marker_text)
    items = _gh_search(query, token)

    for item in items:
        body = item.get('body', '') or ''
        if marker_text in body:
            labels = [l['name'] for l in item.get('labels', [])]
            issue_num = item['number']
            if 'auto:suppressed' in labels:
                print('Finding %s suppressed via auto:suppressed on Issue #%d — skip' % (
                    marker, issue_num))
                return -1  # suppressed
            print('Finding %s already filed as Issue #%d — skip duplicate' % (marker, issue_num))
            return issue_num

    return None  # safe to create
