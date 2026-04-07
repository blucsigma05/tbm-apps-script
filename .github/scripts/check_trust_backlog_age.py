#!/usr/bin/env python3
"""check_trust_backlog_age.py
Purpose:   Read Notion Trust Backlog DB, flag active sprint items with last_verified > STALE_DAYS.
Called by: .github/workflows/hyg-11-trust-backlog-age.yml
Env vars:  NOTION_API_KEY          Notion integration token (required)
           NOTION_TRUST_BACKLOG_DB Notion database ID (required)
           STALE_DAYS              Days since last_verified before flagged (default: 7)
           GITHUB_OUTPUT           Set by Actions runner; used to pass step outputs

Expects the Notion DB to have:
  - A 'Status' select/status property (filters for 'Active Sprint' or 'In Progress')
  - A 'last_verified' date property
  - A title property (item name)
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

NOTION_API_KEY = os.environ.get('NOTION_API_KEY', '')
DB_ID = os.environ.get('NOTION_TRUST_BACKLOG_DB', '')
STALE_DAYS = int(os.environ.get('STALE_DAYS', '7'))
GITHUB_OUTPUT = os.environ.get('GITHUB_OUTPUT', '')

ACTIVE_STATUSES = {'Active Sprint', 'In Progress', 'In Review', 'Active'}


def set_output(key, value):
    if GITHUB_OUTPUT:
        with open(GITHUB_OUTPUT, 'a') as fh:
            fh.write(key + '=' + value + '\n')
    else:
        print('[output] ' + key + '=' + value)


def notion_post(path, body=None):
    url = 'https://api.notion.com' + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers={
        'Authorization': 'Bearer ' + NOTION_API_KEY,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def query_all_pages():
    pages = []
    cursor = None
    while True:
        body = {'page_size': 100}
        if cursor:
            body['start_cursor'] = cursor
        result = notion_post('/v1/databases/' + DB_ID + '/query', body)
        pages.extend(result.get('results', []))
        if not result.get('has_more', False):
            break
        cursor = result.get('next_cursor')
    return pages


def get_prop_title(page):
    props = page.get('properties', {})
    for prop in props.values():
        if prop.get('type') == 'title':
            parts = prop.get('title', [])
            return ''.join(p.get('plain_text', '') for p in parts)
    return '(untitled)'


def get_prop_status(page):
    props = page.get('properties', {})
    for name in ('Status', 'status'):
        prop = props.get(name, {})
        ptype = prop.get('type', '')
        if ptype == 'status' and prop.get('status'):
            return prop['status'].get('name', '')
        if ptype == 'select' and prop.get('select'):
            return prop['select'].get('name', '')
    return ''


def get_prop_date(page, prop_name):
    props = page.get('properties', {})
    prop = props.get(prop_name, {})
    if prop.get('type') == 'date' and prop.get('date'):
        return prop['date'].get('start', '')
    return ''


def main():
    if not NOTION_API_KEY:
        print('ERROR: NOTION_API_KEY not set')
        return 1
    if not DB_ID:
        print('ERROR: NOTION_TRUST_BACKLOG_DB not set')
        return 1

    pages = query_all_pages()

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=STALE_DAYS)

    stale = []
    for page in pages:
        status = get_prop_status(page)
        if status not in ACTIVE_STATUSES:
            continue

        title = get_prop_title(page)
        date_str = get_prop_date(page, 'last_verified')

        if not date_str:
            stale.append({'name': title, 'status': status, 'age_days': 'never', 'last_verified': 'never'})
            continue

        verified = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        if verified.tzinfo is None:
            verified = verified.replace(tzinfo=timezone.utc)
        if verified < cutoff:
            age = (now - verified).days
            stale.append({'name': title, 'status': status, 'age_days': age, 'last_verified': date_str})

    stale.sort(key=lambda x: 9999 if x['age_days'] == 'never' else x['age_days'], reverse=True)

    has_findings = len(stale) > 0
    set_output('has_findings', 'true' if has_findings else 'false')
    set_output('stale_count', str(len(stale)))

    print(json.dumps({'stale_days_threshold': STALE_DAYS, 'stale_count': len(stale),
                      'stale_items': stale}, indent=2))

    if has_findings:
        parts = []
        for s in stale[:5]:
            age = str(s['age_days']) + 'd' if s['age_days'] != 'never' else 'never verified'
            parts.append('`' + s['name'][:40] + '` (' + age + ')')
        msg = str(len(stale)) + ' active item(s) stale (last_verified >' + str(STALE_DAYS) + 'd): '
        msg += ', '.join(parts)
        if len(stale) > 5:
            msg += ' (+' + str(len(stale) - 5) + ' more)'
        with open('hyg11-message.txt', 'w') as fh:
            fh.write(msg)
        print('Findings: ' + msg)
    else:
        print('PASS: All active sprint items verified within ' + str(STALE_DAYS) + 'd.')

    return 0


if __name__ == '__main__':
    sys.exit(main())
