#!/usr/bin/env python3
"""check_knowledge_graph_diff.py
Purpose:   Compute diff of knowledge files between HEAD~1 and HEAD, post summary to Notion.
Called by: .github/workflows/hyg-13-knowledge-graph-diff.yml
Env vars:  NOTION_API_KEY              Notion integration token (optional — skips post if missing)
           NOTION_THREAD_ARCHIVE_ID    Notion page ID for Thread Handoff Archive
           GITHUB_REPOSITORY           owner/repo (set by Actions runner)
           GITHUB_SHA                  commit SHA (set by Actions runner)
           GITHUB_OUTPUT               Set by Actions runner; used to pass step outputs

Knowledge files: CLAUDE.md, ops/*, specs/*, *.json, .claude/CLAUDE.md
"""

import json
import os
import subprocess
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

NOTION_API_KEY = os.environ.get('NOTION_API_KEY', '')
ARCHIVE_ID = os.environ.get('NOTION_THREAD_ARCHIVE_ID', '')
REPO = os.environ.get('GITHUB_REPOSITORY', '')
SHA = os.environ.get('GITHUB_SHA', '')[:8]
GITHUB_OUTPUT = os.environ.get('GITHUB_OUTPUT', '')

KNOWLEDGE_PATTERNS = [
    'CLAUDE.md',
    'ops/',
    'specs/',
    '.claude/CLAUDE.md',
]

JSON_PATTERNS = ['.json']


def set_output(key, value):
    if GITHUB_OUTPUT:
        with open(GITHUB_OUTPUT, 'a') as fh:
            fh.write(key + '=' + value + '\n')
    else:
        print('[output] ' + key + '=' + value)


def run_git(args):
    result = subprocess.run(['git'] + args, capture_output=True, text=True, timeout=30)
    return result.stdout.strip()


def is_knowledge_file(path):
    for pat in KNOWLEDGE_PATTERNS:
        if pat.endswith('/'):
            if path.startswith(pat):
                return True
        elif path == pat:
            return True
    for ext in JSON_PATTERNS:
        if path.endswith(ext):
            return True
    return False


def get_diff_stat(filepath):
    stat = run_git(['diff', '--stat', 'HEAD~1', 'HEAD', '--', filepath])
    return stat


def notion_post(path, body):
    url = 'https://api.notion.com' + path
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers={
        'Authorization': 'Bearer ' + NOTION_API_KEY,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def post_to_notion(summary):
    if not NOTION_API_KEY or not ARCHIVE_ID:
        print('Notion credentials not set — skipping changelog post.')
        return

    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    blocks = [
        {
            'object': 'block',
            'type': 'heading_3',
            'heading_3': {
                'rich_text': [{'type': 'text', 'text': {'content': 'Knowledge Diff — ' + now + ' (' + SHA + ')'}}]
            }
        },
        {
            'object': 'block',
            'type': 'paragraph',
            'paragraph': {
                'rich_text': [{'type': 'text', 'text': {'content': summary[:1900]}}]
            }
        },
    ]

    try:
        notion_post('/v1/blocks/' + ARCHIVE_ID + '/children', {'children': blocks})
        print('Posted changelog to Notion.')
    except urllib.error.HTTPError as e:
        print('WARNING: Notion post failed: ' + str(e.code) + ' ' + str(e.reason))


def main():
    changed_files = run_git(['diff', '--name-only', 'HEAD~1', 'HEAD'])
    if not changed_files:
        print('No changed files between HEAD~1 and HEAD.')
        set_output('has_findings', 'false')
        return 0

    knowledge_files = []
    for f in changed_files.splitlines():
        if is_knowledge_file(f):
            knowledge_files.append(f)

    if not knowledge_files:
        print('No knowledge files changed.')
        set_output('has_findings', 'false')
        return 0

    has_findings = len(knowledge_files) > 0
    set_output('has_findings', 'true' if has_findings else 'false')
    set_output('changed_count', str(len(knowledge_files)))

    diff_details = []
    for f in knowledge_files:
        stat = get_diff_stat(f)
        additions = run_git(['diff', '--numstat', 'HEAD~1', 'HEAD', '--', f])
        diff_details.append({'file': f, 'stat': stat, 'numstat': additions})

    print(json.dumps({
        'changed_count': len(knowledge_files),
        'files': [d['file'] for d in diff_details],
    }, indent=2))

    # Build summary
    lines = [str(len(knowledge_files)) + ' knowledge file(s) changed in ' + SHA + ':']
    for d in diff_details:
        nums = d['numstat'].split('\t') if d['numstat'] else []
        if len(nums) >= 2:
            lines.append('  ' + d['file'] + ' (+' + nums[0] + '/-' + nums[1] + ')')
        else:
            lines.append('  ' + d['file'])
    summary = '\n'.join(lines)

    # Post to Notion
    post_to_notion(summary)

    # Build Pushover message
    parts = []
    for d in diff_details[:5]:
        parts.append(d['file'])
    msg = str(len(knowledge_files)) + ' knowledge file(s) changed: ' + ', '.join(parts)
    if len(knowledge_files) > 5:
        msg += ' (+' + str(len(knowledge_files) - 5) + ' more)'
    with open('hyg13-message.txt', 'w') as fh:
        fh.write(msg)
    print('Findings: ' + msg)

    return 0


if __name__ == '__main__':
    sys.exit(main())
