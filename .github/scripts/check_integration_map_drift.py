#!/usr/bin/env python3
"""check_integration_map_drift.py
Purpose:   Read Notion Integration Map DB, flag entries with last_reviewed > DRIFT_DAYS.
Called by: .github/workflows/hyg-03-integration-map-drift.yml
Env vars:  NOTION_API_KEY              Notion integration token (required)
           NOTION_INTEGRATION_MAP_DB   Notion database ID (required)
           DRIFT_DAYS                  Days since last review before flagged (default: 30)
           GITHUB_OUTPUT               Set by Actions runner; used to pass step outputs
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

NOTION_API_KEY = os.environ.get('NOTION_API_KEY', '')
DB_ID = os.environ.get('NOTION_INTEGRATION_MAP_DB', '')
DRIFT_DAYS = int(os.environ.get('DRIFT_DAYS', '30'))
GITHUB_OUTPUT = os.environ.get('GITHUB_OUTPUT', '')


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


def get_prop_date(page, prop_name):
    props = page.get('properties', {})
    prop = props.get(prop_name, {})
    if prop.get('type') == 'date' and prop.get('date'):
        return prop['date'].get('start', '')
    return ''


def get_prop_title(page):
    props = page.get('properties', {})
    for prop in props.values():
        if prop.get('type') == 'title':
            parts = prop.get('title', [])
            return ''.join(p.get('plain_text', '') for p in parts)
    return '(untitled)'


def main():
    if not NOTION_API_KEY:
        print('ERROR: NOTION_API_KEY not set')
        return 1
    if not DB_ID:
        print('ERROR: NOTION_INTEGRATION_MAP_DB not set')
        return 1

    pages = query_all_pages()

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=DRIFT_DAYS)

    drifted = []
    for page in pages:
        title = get_prop_title(page)
        date_str = get_prop_date(page, 'last_reviewed')
        if not date_str:
            drifted.append({'name': title, 'age_days': 'never', 'last_reviewed': 'never'})
            continue
        reviewed = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        if reviewed.tzinfo is None:
            reviewed = reviewed.replace(tzinfo=timezone.utc)
        if reviewed < cutoff:
            age = (now - reviewed).days
            drifted.append({'name': title, 'age_days': age, 'last_reviewed': date_str})

    drifted.sort(key=lambda x: 9999 if x['age_days'] == 'never' else x['age_days'], reverse=True)

    has_findings = len(drifted) > 0
    set_output('has_findings', 'true' if has_findings else 'false')
    set_output('drift_count', str(len(drifted)))

    print(json.dumps({'drift_days_threshold': DRIFT_DAYS, 'drift_count': len(drifted),
                      'drifted_entries': drifted}, indent=2))

    if has_findings:
        parts = []
        for d in drifted[:5]:
            age = str(d['age_days']) + 'd' if d['age_days'] != 'never' else 'never reviewed'
            parts.append('`' + d['name'] + '` (' + age + ')')
        msg = str(len(drifted)) + ' integration(s) drifted (>' + str(DRIFT_DAYS) + 'd): '
        msg += ', '.join(parts)
        if len(drifted) > 5:
            msg += ' (+' + str(len(drifted) - 5) + ' more)'
        with open('hyg03-message.txt', 'w') as fh:
            fh.write(msg)
        print('Findings: ' + msg)
    else:
        print('PASS: All integrations reviewed within ' + str(DRIFT_DAYS) + 'd.')

    return 0


if __name__ == '__main__':
    sys.exit(main())
