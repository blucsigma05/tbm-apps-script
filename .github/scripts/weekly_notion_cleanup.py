#!/usr/bin/env python3
"""weekly_notion_cleanup.py

Purpose:   Weekly Friday 6am — Notion hygiene sweep. Ports weekly-notion-cleanup
           SKILL.md (Gitea #72, routine 7 of 10). Read-only — flags findings
           but does not modify any Notion pages.

SKILL.md scoped 5 checks. This port covers the 3 NOT already handled:
  1. ✓ Stale handoffs in Thread Handoff Archive > HANDOFF_DAYS (default 14)
  2. ✗ DEFERRED — duplicate / overlapping titles within 7 days (fuzzy match
       threshold-tuning risks noise; follow-up Issue filed).
  3. ✓ Empty placeholder pages among PM direct children (< MIN_BLOCKS of content)
  4. — already covered by HYG-05 (Parking Lot age)
  5. — already covered by HYG-11 (Trust Backlog age)

Called by: .gitea/workflows/weekly-notion-cleanup.yml

Env vars:
  NOTION_API_KEY             Required.
  HANDOFF_ARCHIVE_ID         Default: 322cea3cd9e881bb8afcd560fe772481
  PM_PAGE_ID                 Default: 2c8cea3cd9e8818eaf53df73cb5c2eee
  HANDOFF_DAYS               Default: 14
  MIN_BLOCKS                 Default: 3 (pages with fewer = empty placeholder)
  OUTPUT_FILE                Default: review_comment.md
  POST_ON_CLEAN              Default: false

Outputs:
  stale_handoffs_count
  empty_pages_count
  has_comment
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta


NOTION_API_KEY = os.environ.get('NOTION_API_KEY', '')
HANDOFF_ARCHIVE_ID = os.environ.get('HANDOFF_ARCHIVE_ID', '322cea3cd9e881bb8afcd560fe772481')
PM_PAGE_ID = os.environ.get('PM_PAGE_ID', '2c8cea3cd9e8818eaf53df73cb5c2eee')
HANDOFF_DAYS = int(os.environ.get('HANDOFF_DAYS', '14'))
MIN_BLOCKS = int(os.environ.get('MIN_BLOCKS', '3'))
OUTPUT_FILE = os.environ.get('OUTPUT_FILE', 'review_comment.md')
POST_ON_CLEAN = os.environ.get('POST_ON_CLEAN', 'false').lower() == 'true'
STEP_OUTPUT = os.environ.get('GITEA_OUTPUT') or os.environ.get('GITHUB_OUTPUT') or ''


def emit(key, value):
    if not STEP_OUTPUT:
        return
    with open(STEP_OUTPUT, 'a', encoding='utf-8') as fh:
        fh.write(f'{key}={value}\n')


def notion(method, path, body=None):
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        'https://api.notion.com' + path,
        data=data, method=method,
        headers={
            'Authorization': f'Bearer {NOTION_API_KEY}',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
        })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def list_children(page_id):
    """Return all child block objects for a page, paginated."""
    children = []
    cursor = None
    for _ in range(20):  # safety cap
        path = f'/v1/blocks/{page_id}/children?page_size=100'
        if cursor:
            path += f'&start_cursor={cursor}'
        data = notion('GET', path)
        children.extend(data.get('results', []))
        cursor = data.get('next_cursor')
        if not data.get('has_more') or not cursor:
            break
    return children


def get_page_title(block_or_page):
    """Extract title from either a page object or a child_page block."""
    if block_or_page.get('type') == 'child_page':
        return block_or_page.get('child_page', {}).get('title', '(untitled)')
    if block_or_page.get('object') == 'page':
        props = block_or_page.get('properties', {})
        # Title property can be named anything; find the title-typed one
        for p in props.values():
            if p.get('type') == 'title':
                segs = p.get('title', [])
                return ''.join(s.get('plain_text', '') for s in segs) or '(untitled)'
    return '(untitled)'


def get_page_last_edited(page_obj):
    return page_obj.get('last_edited_time', '')


def check_stale_handoffs():
    """Children of handoff archive where last_edited_time > HANDOFF_DAYS."""
    now = datetime.now(timezone.utc)
    threshold = timedelta(days=HANDOFF_DAYS)
    stale = []
    try:
        children = list_children(HANDOFF_ARCHIVE_ID)
    except Exception as e:
        return stale, f'fetch error: {e}'

    for block in children:
        if block.get('type') != 'child_page':
            continue
        page_id = block['id']
        try:
            page_obj = notion('GET', f'/v1/pages/{page_id}')
        except Exception:
            continue
        edited = page_obj.get('last_edited_time', '')
        if not edited:
            continue
        try:
            e_dt = datetime.fromisoformat(edited.replace('Z', '+00:00'))
        except ValueError:
            continue
        age = now - e_dt
        if age >= threshold:
            stale.append({
                'id': page_id,
                'title': get_page_title(block),
                'days': int(age.total_seconds() // 86400),
                'url': page_obj.get('url', ''),
            })
    stale.sort(key=lambda s: -s['days'])
    return stale, None


def check_empty_pages():
    """Direct children of PM with block-content count < MIN_BLOCKS."""
    empty = []
    try:
        children = list_children(PM_PAGE_ID)
    except Exception as e:
        return empty, f'fetch error: {e}'

    for block in children:
        if block.get('type') != 'child_page':
            continue
        page_id = block['id']
        try:
            sub_blocks = list_children(page_id)
        except Exception:
            continue
        # Count meaningful content blocks (skip empty paragraph blocks)
        content_count = 0
        for sb in sub_blocks:
            t = sb.get('type', '')
            if t == 'child_page':
                continue  # sub-pages don't count as the parent's content
            # Minimal empty-paragraph detection
            if t == 'paragraph':
                rich = sb.get('paragraph', {}).get('rich_text', [])
                if not rich or all(not r.get('plain_text', '').strip() for r in rich):
                    continue
            content_count += 1
        if content_count < MIN_BLOCKS:
            try:
                page_obj = notion('GET', f'/v1/pages/{page_id}')
                url = page_obj.get('url', '')
            except Exception:
                url = ''
            empty.append({
                'id': page_id,
                'title': get_page_title(block),
                'blocks': content_count,
                'url': url,
            })
    empty.sort(key=lambda e: e['blocks'])
    return empty, None


def build_report(stale_handoffs, empty_pages, handoff_err, empty_err):
    iso_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    lines = [f'# weekly-notion-cleanup — {iso_date}', '']
    lines.append(f'**Handoff threshold:** {HANDOFF_DAYS}d | **Empty-page threshold:** < {MIN_BLOCKS} content block(s)')
    lines.append('')
    lines.append(f'**Stale handoffs:** {len(stale_handoffs)} | **Empty PM pages:** {len(empty_pages)}')
    lines.append('')

    if handoff_err:
        lines.append(f'> Handoff check error: {handoff_err}')
        lines.append('')
    if empty_err:
        lines.append(f'> Empty-pages check error: {empty_err}')
        lines.append('')

    if stale_handoffs:
        lines.append(f'## Stale handoffs (> {HANDOFF_DAYS}d since last edit)')
        lines.append('')
        lines.append('| Title | Age (days) | URL |')
        lines.append('|-------|------------|-----|')
        for s in stale_handoffs[:20]:
            title = s['title'][:80]
            lines.append(f'| {title} | {s["days"]} | [{s["id"][:8]}]({s["url"]}) |')
        if len(stale_handoffs) > 20:
            lines.append(f'| … | … | +{len(stale_handoffs) - 20} more |')
        lines.append('')

    if empty_pages:
        lines.append(f'## Empty PM pages (< {MIN_BLOCKS} content blocks)')
        lines.append('')
        lines.append('| Title | Blocks | URL |')
        lines.append('|-------|--------|-----|')
        for e in empty_pages[:20]:
            lines.append(f'| {e["title"][:80]} | {e["blocks"]} | [{e["id"][:8]}]({e["url"]}) |')
        if len(empty_pages) > 20:
            lines.append(f'| … | … | +{len(empty_pages) - 20} more |')
        lines.append('')

    if not stale_handoffs and not empty_pages:
        lines.append('No findings. Notion hygiene clean.')
        lines.append('')

    lines.append('---')
    lines.append('<!-- weekly-notion-cleanup:run -->')
    return '\n'.join(lines) + '\n'


def main() -> int:
    if not NOTION_API_KEY:
        print('ERROR: NOTION_API_KEY not set', file=sys.stderr)
        emit('has_comment', 'false')
        return 1

    stale_handoffs, h_err = check_stale_handoffs()
    empty_pages, e_err = check_empty_pages()

    print(f'stale_handoffs={len(stale_handoffs)} empty_pages={len(empty_pages)} '
          f'handoff_err={bool(h_err)} empty_err={bool(e_err)}')

    emit('stale_handoffs_count', len(stale_handoffs))
    emit('empty_pages_count', len(empty_pages))

    is_clean = not stale_handoffs and not empty_pages and not h_err and not e_err
    if is_clean and not POST_ON_CLEAN:
        emit('has_comment', 'false')
        return 0

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as fh:
        fh.write(build_report(stale_handoffs, empty_pages, h_err, e_err))
    emit('has_comment', 'true')
    print(f'Wrote report to {OUTPUT_FILE}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
