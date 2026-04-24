#!/usr/bin/env python3
"""sheet_schema_drift.py

Purpose:   Daily check for schema drift between KH_SCHEMAS / TAB_MAP (source
           of truth in DataEngine.js + KidsHub.js) and actual Google Sheets
           headers. Ports the sheet-schema-drift SKILL.md routine (Gitea #72,
           routine 3 of 10). Pure data check — no LLM.

How:       GAS endpoint `?action=runTests` already exposes schema_checks via
           Tbmsmoketest.checkSchemas_() (category '2_schema'). This script
           just fetches the JSON, inspects smoke.categories['2_schema'], and
           reports any WARN/FAIL.

Called by: .gitea/workflows/sheet-schema-drift.yml (scheduled + manual)

Env vars:
  GAS_DEPLOY_URL    Required. GAS web app `/exec` URL.
  GITEA_OUTPUT / GITHUB_OUTPUT  Step-output file.
  OUTPUT_FILE       Default: review_comment.md
  POST_ON_CLEAN     Default: false. When true, post a clean-state stub
                    instead of silent exit.

Outputs (to step-output file):
  schema_status     PASS | WARN | FAIL | ENDPOINT_ERROR
  drift_count       Number of per-tab schema_checks not in PASS
  tabmap_missing    Number of TAB_MAP entries pointing to missing tabs
  has_comment       true|false — whether OUTPUT_FILE was written

Exit codes:
  0  success regardless of finding state
  1  endpoint unreachable / JSON parse failure
"""

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone


GAS_DEPLOY_URL = os.environ.get('GAS_DEPLOY_URL', '').rstrip('/')
OUTPUT_FILE = os.environ.get('OUTPUT_FILE', 'review_comment.md')
POST_ON_CLEAN = os.environ.get('POST_ON_CLEAN', 'false').lower() == 'true'
STEP_OUTPUT = os.environ.get('GITEA_OUTPUT') or os.environ.get('GITHUB_OUTPUT') or ''


def emit(key, value):
    if not STEP_OUTPUT:
        return
    with open(STEP_OUTPUT, 'a', encoding='utf-8') as fh:
        fh.write(f'{key}={value}\n')


def fetch_tests():
    url = f'{GAS_DEPLOY_URL}?action=runTests'
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode('utf-8'))


def format_report(schema, overall, tabmap_missing_list):
    iso_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    status = schema.get('status', '?')
    checks = schema.get('schema_checks', [])
    tabmap = schema.get('tab_map_checks', {})

    lines = [
        f'# sheet-schema-drift — {iso_date}',
        '',
        f'**Schema status:** {status}',
        f'**Overall runTests:** {overall}',
        f'**Schemas checked:** {len(checks)}',
        f'**TAB_MAP resolved:** {tabmap.get("resolved", "?")}/{tabmap.get("total", "?")}',
        '',
    ]

    non_pass = [c for c in checks if c.get('status') != 'PASS']
    if non_pass:
        lines.append('## Schema mismatches')
        lines.append('')
        lines.append('| Tab | Resolved name | Status | Detail |')
        lines.append('|-----|---------------|--------|--------|')
        for c in non_pass:
            lines.append(f'| `{c.get("tab","?")}` | `{c.get("resolvedName","?")}` | '
                         f'**{c.get("status","?")}** | {c.get("details","")} |')
        lines.append('')

    if tabmap_missing_list:
        lines.append('## TAB_MAP pointing to missing tabs')
        lines.append('')
        for m in tabmap_missing_list:
            lines.append(f'- `{m}`')
        lines.append('')

    if not non_pass and not tabmap_missing_list:
        lines.append(f'All {len(checks)} schemas match. No drift.')
        lines.append('')

    lines.append('---')
    lines.append('<!-- sheet-schema-drift:run -->')
    return '\n'.join(lines) + '\n'


def main() -> int:
    if not GAS_DEPLOY_URL:
        print('ERROR: GAS_DEPLOY_URL not set', file=sys.stderr)
        emit('schema_status', 'CONFIG_ERROR')
        emit('has_comment', 'false')
        return 1

    try:
        data = fetch_tests()
    except Exception as e:
        print(f'ERROR: failed to fetch runTests: {e}', file=sys.stderr)
        emit('schema_status', 'ENDPOINT_ERROR')
        emit('has_comment', 'false')
        return 1

    smoke = data.get('smoke') or {}
    categories = smoke.get('categories') or {}
    schema = categories.get('2_schema') or {}
    if not schema:
        print('ERROR: smoke.categories.2_schema missing from runTests response', file=sys.stderr)
        emit('schema_status', 'ENDPOINT_ERROR')
        emit('has_comment', 'false')
        return 1

    status = schema.get('status', 'UNKNOWN')
    checks = schema.get('schema_checks', [])
    drift = [c for c in checks if c.get('status') != 'PASS']
    tabmap_missing_list = (schema.get('tab_map_checks') or {}).get('missing', [])

    overall = data.get('overall', '?')
    print(f'schema status: {status} | drift: {len(drift)} | tabmap missing: {len(tabmap_missing_list)}')

    emit('schema_status', status)
    emit('drift_count', len(drift))
    emit('tabmap_missing', len(tabmap_missing_list))

    is_clean = status == 'PASS' and not drift and not tabmap_missing_list
    if is_clean and not POST_ON_CLEAN:
        emit('has_comment', 'false')
        print('Clean — no comment posted (POST_ON_CLEAN=false).')
        return 0

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as fh:
        fh.write(format_report(schema, overall, tabmap_missing_list))
    emit('has_comment', 'true')
    print(f'Wrote report to {OUTPUT_FILE}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
