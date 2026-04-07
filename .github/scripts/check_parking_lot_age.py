#!/usr/bin/env python3
"""check_parking_lot_age.py
Purpose:   Read Notion Parking Lot page, flag child items older than STALE_DAYS.
Called by: .github/workflows/hyg-05-parking-lot-age.yml
Env vars:  NOTION_API_KEY         Notion integration token (required)
           NOTION_PARKING_LOT_ID  Notion page ID for Parking Lot (required)
           STALE_DAYS             Days before an item is flagged (default: 14)
           GITHUB_OUTPUT          Set by Actions runner; used to pass step outputs
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

NOTION_API_KEY = os.environ.get('NOTION_API_KEY', '')
PAGE_ID = os.environ.get('NOTION_PARKING_LOT_ID', '')
STALE_DAYS = int(os.environ.get('STALE_DAYS', '14'))
GITHUB_OUTPUT = os.environ.get('GITHUB_OUTPUT', '')


def set_output(key, value):
    if GITHUB_OUTPUT:
        with open(GITHUB_OUTPUT, 'a') as fh:
            fh.write(key + '=' + value + '\n')
    else:
        print('[output] ' + key + '=' + value)


def notion_request(method, path, body=None):
    url = 'https://api.notion.com' + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        'Authorization': 'Bearer ' + NOTION_API_KEY,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def get_child_blocks():
    blocks = []
    cursor = None
    while True:
        path = '/v1/blocks/' + PAGE_ID + '/children?page_size=100'
        if cursor:
            path += '&start_cursor=' + cursor
        result = notion_request('GET', path)
        blocks.extend(result.get('results', []))
        if not result.get('has_more', False):
            break
        cursor = result.get('next_cursor')
    return blocks


def extract_text(block):
    btype = block.get('type', '')
    content = block.get(btype, {})
    rich_text = content.get('rich_text', [])
    return ''.join(rt.get('plain_text', '') for rt in rich_text)


def main():
    if not NOTION_API_KEY:
        print('ERROR: NOTION_API_KEY not set')
        return 1
    if not PAGE_ID:
        print('ERROR: NOTION_PARKING_LOT_ID not set')
        return 1

    blocks = get_child_blocks()

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=STALE_DAYS)

    stale = []
    for block in blocks:
        created = block.get('created_time', '')
        last_edited = block.get('last_edited_time', '')
        text = extract_text(block)
        if not text.strip():
            continue

        ref_time = last_edited or created
        if not ref_time:
            continue

        edited_dt = datetime.fromisoformat(ref_time.replace('Z', '+00:00'))
        if edited_dt < cutoff:
            age = (now - edited_dt).days
            stale.append({
                'text': text[:80],
                'age_days': age,
                'last_edited': ref_time,
                'block_id': block.get('id', ''),
            })

    stale.sort(key=lambda x: x['age_days'], reverse=True)

    has_findings = len(stale) > 0
    set_output('has_findings', 'true' if has_findings else 'false')
    set_output('stale_count', str(len(stale)))

    print(json.dumps({'stale_days_threshold': STALE_DAYS, 'stale_count': len(stale),
                      'stale_items': stale}, indent=2))

    if has_findings:
        parts = []
        for s in stale[:5]:
            label = s['text'][:40]
            parts.append('`' + label + '` (' + str(s['age_days']) + 'd)')
        msg = str(len(stale)) + ' parking lot item(s) stale (>' + str(STALE_DAYS) + 'd): '
        msg += ', '.join(parts)
        if len(stale) > 5:
            msg += ' (+' + str(len(stale) - 5) + ' more)'
        with open('hyg05-message.txt', 'w') as fh:
            fh.write(msg)
        print('Findings: ' + msg)
    else:
        print('PASS: No parking lot items older than ' + str(STALE_DAYS) + 'd.')

    return 0


if __name__ == '__main__':
    sys.exit(main())
