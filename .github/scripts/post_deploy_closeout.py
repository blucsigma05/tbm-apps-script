#!/usr/bin/env python3
"""
Post-deploy closeout — runs after deploy-and-notify.yml on every main merge.

Steps:
  1. Pull deployed versions from /api?fn=getDeployedVersionsSafe
  2. Update Notion PM Active Versions DB rows with new version numbers
  3. Sweep all CF routes (ops/routes.json); fire Pushover on any non-200
  4. Append thread handoff block to Notion Thread Handoff Archive

Required env vars:
  NOTION_API_KEY         — token for Notion integration
  PM_VERSIONS_DB_ID      — Notion database ID for PM Active Versions DB
  DEPLOY_PAGE_ID         — Notion page ID for the deploy page (title update)
  THREAD_ARCHIVE_ID      — Notion page ID for Thread Handoff Archive
  PUSHOVER_APP_TOKEN     — Pushover application token
  PUSHOVER_USER_KEY      — Pushover user key
  TBM_BASE_URL           — base URL, e.g. https://thompsonfams.com
  GITHUB_SHA             — commit SHA (auto-set by Actions)
  GITHUB_REF_NAME        — branch name (auto-set by Actions)
  PR_NUMBER              — optional; pulled from workflow context
  PR_TITLE               — optional; pulled from workflow context

Optional:
  ROUTES_JSON_PATH       — path to ops/routes.json (default: ops/routes.json)
  DRY_RUN                — if 'true', print actions without writing to Notion
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.error

# ── Config ────────────────────────────────────────────────────────────────────

NOTION_VERSION = '2022-06-28'
ROUTES_JSON_PATH = os.environ.get('ROUTES_JSON_PATH', 'ops/routes.json')
DRY_RUN = os.environ.get('DRY_RUN', 'false').lower() == 'true'

# ── Helpers ───────────────────────────────────────────────────────────────────

def notion_req(path, method='GET', body=None, token=None):
    url = 'https://api.notion.com/v1' + path
    headers = {
        'Authorization': 'Bearer ' + token,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
    }
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body_text = ''
        try:
            body_text = e.read().decode()
        except Exception:
            pass
        print('Notion %s %s -> %d: %s' % (method, path, e.code, body_text), file=sys.stderr)
        return None


def http_get(url, timeout=15):
    req = urllib.request.Request(url, headers={'User-Agent': 'tbm-closeout/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode()[:200]
    except urllib.error.HTTPError as e:
        return e.code, ''
    except Exception as exc:
        return 0, str(exc)


def pushover(app_token, user_key, message, priority=0):
    if DRY_RUN:
        print('[DRY_RUN] Pushover: %s' % message)
        return
    url = 'https://api.pushover.net/1/messages.json'
    payload = json.dumps({
        'token': app_token,
        'user': user_key,
        'message': message,
        'priority': priority,
    }).encode()
    req = urllib.request.Request(url, data=payload,
                                  headers={'Content-Type': 'application/json'},
                                  method='POST')
    try:
        with urllib.request.urlopen(req, timeout=10):
            pass
    except Exception as exc:
        print('Pushover send failed: %s' % exc, file=sys.stderr)


# ── Step 1: Pull deployed versions ────────────────────────────────────────────

def pull_versions(base_url):
    url = base_url.rstrip('/') + '/api?fn=getDeployedVersionsSafe&args=%5B%5D'
    print('Pulling versions from %s ...' % url)
    code, body = http_get(url)
    if code != 200:
        print('ERROR: version probe returned HTTP %d' % code, file=sys.stderr)
        return None
    try:
        data = json.loads(body if len(body) >= 200 else
                          _full_get(base_url.rstrip('/') + '/api?fn=getDeployedVersionsSafe&args=%5B%5D'))
        return data
    except Exception as exc:
        print('ERROR parsing version response: %s' % exc, file=sys.stderr)
        return None


def _full_get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'tbm-closeout/1.0'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode()


# ── Step 2: Update Notion PM Active Versions DB ───────────────────────────────

def update_versions_db(db_id, versions, token):
    """For each version entry, find the existing row and update the version number.
    Row match: 'Component' property (title) equals the key.
    Version property name: 'Version' (number or rich_text — we write both safely).
    """
    if not db_id or not versions:
        print('SKIP: no db_id or no versions — skipping Notion DB update')
        return

    print('Querying PM Active Versions DB %s ...' % db_id)
    result = notion_req('/databases/%s/query' % db_id, method='POST', body={}, token=token)
    if result is None:
        print('ERROR: could not query PM Active Versions DB', file=sys.stderr)
        return

    existing_rows = {_extract_title(r): r['id'] for r in result.get('results', [])}
    print('Found %d existing rows' % len(existing_rows))

    timestamp = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    for component, version in versions.items():
        if component.startswith('_'):
            continue
        ver_str = str(version)
        page_id = existing_rows.get(component)

        if DRY_RUN:
            print('[DRY_RUN] Would update %s -> v%s (page: %s)' % (component, ver_str, page_id or 'NEW'))
            continue

        props = {
            'Version': {'rich_text': [{'text': {'content': ver_str}}]},
            'Last Updated': {'date': {'start': timestamp}},
        }

        if page_id:
            notion_req('/pages/%s' % page_id, method='PATCH', body={'properties': props}, token=token)
            print('Updated %s -> v%s' % (component, ver_str))
        else:
            # Create new row
            notion_req('/pages', method='POST', body={
                'parent': {'database_id': db_id},
                'properties': dict(list({'Component': {'title': [{'text': {'content': component}}]}}.items()) +
                                   list(props.items())),
            }, token=token)
            print('Created row for %s v%s' % (component, ver_str))


def _extract_title(page):
    for prop in page.get('properties', {}).values():
        if prop.get('type') == 'title':
            parts = prop.get('title', [])
            if parts:
                return parts[0].get('plain_text', '')
    return ''


# ── Step 3: CF route sweep ────────────────────────────────────────────────────

def sweep_routes(routes_path, base_url, app_token, user_key):
    with open(routes_path) as f:
        config = json.load(f)

    routes = config.get('routes', [])
    base = config.get('base', base_url).rstrip('/')
    failures = []

    print('Sweeping %d routes against %s ...' % (len(routes), base))
    for route in routes:
        url = base + route
        code, _ = http_get(url, timeout=20)
        status = 'OK' if code == 200 else 'FAIL(%d)' % code
        print('  %s %s' % (status, url))
        if code != 200:
            failures.append('%s -> HTTP %d' % (route, code))

    if failures:
        msg = 'CF sweep FAILED (%d/%d routes): %s' % (
            len(failures), len(routes), ', '.join(failures))
        print('ERROR: ' + msg, file=sys.stderr)
        pushover(app_token, user_key, msg, priority=1)
        return False
    else:
        print('CF sweep PASSED — all %d routes returned 200' % len(routes))
        return True


# ── Step 4: Append thread handoff to Notion archive ──────────────────────────

def write_thread_handoff(archive_page_id, sha, ref, pr_number, pr_title,
                          versions, sweep_ok, token):
    if not archive_page_id:
        print('SKIP: no THREAD_ARCHIVE_ID — skipping handoff write')
        return

    sha_short = sha[:7] if sha else '?'
    version_summary = ', '.join(
        '%s v%s' % (k, v) for k, v in sorted(versions.items())
        if not k.startswith('_')
    ) if versions else 'unknown'
    sweep_line = 'CF sweep: PASS — all routes 200' if sweep_ok else 'CF sweep: FAIL — see workflow log'
    pr_line = ('PR #%s — %s' % (pr_number, pr_title)) if pr_number else ref

    content = (
        '**Deploy %s** | %s\n'
        'Branch: %s | %s\n'
        'Versions: %s\n'
        'Auto-filed by post-deploy-closeout workflow.'
    ) % (sha_short, time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime()),
         ref, pr_line, version_summary)

    blocks = [
        {'object': 'block', 'type': 'divider', 'divider': {}},
        {
            'object': 'block',
            'type': 'paragraph',
            'paragraph': {
                'rich_text': [{'type': 'text', 'text': {'content': content}}]
            }
        },
        {
            'object': 'block',
            'type': 'paragraph',
            'paragraph': {
                'rich_text': [{'type': 'text', 'text': {'content': sweep_line}}]
            }
        },
    ]

    if DRY_RUN:
        print('[DRY_RUN] Would append handoff to page %s:\n%s' % (archive_page_id, content))
        return

    result = notion_req('/blocks/%s/children' % archive_page_id,
                        method='PATCH', body={'children': blocks}, token=token)
    if result:
        print('Thread handoff appended to archive page %s' % archive_page_id)
    else:
        print('ERROR: failed to append thread handoff', file=sys.stderr)


# ── Main ──────────────────────────────────────────────────────────────────────

def check_secrets():
    required = ['NOTION_API_KEY', 'PUSHOVER_APP_TOKEN', 'PUSHOVER_USER_KEY', 'TBM_BASE_URL']
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        print('DEPLOY_BLOCKED: missing secrets: %s' % ', '.join(missing), file=sys.stderr)
        return False
    return True


def main():
    if not check_secrets():
        app_token = os.environ.get('PUSHOVER_APP_TOKEN', '')
        user_key = os.environ.get('PUSHOVER_USER_KEY', '')
        if app_token and user_key:
            pushover(app_token, user_key,
                     'post-deploy-closeout BLOCKED: missing secrets — check workflow config',
                     priority=1)
        sys.exit(1)

    notion_token = os.environ['NOTION_API_KEY']
    app_token = os.environ['PUSHOVER_APP_TOKEN']
    user_key = os.environ['PUSHOVER_USER_KEY']
    base_url = os.environ['TBM_BASE_URL']
    db_id = os.environ.get('PM_VERSIONS_DB_ID', '')
    deploy_page_id = os.environ.get('DEPLOY_PAGE_ID', '')
    archive_page_id = os.environ.get('THREAD_ARCHIVE_ID', '322cea3cd9e881bb8afcd560fe772481')
    sha = os.environ.get('GITHUB_SHA', '')
    ref = os.environ.get('GITHUB_REF_NAME', 'main')
    pr_number = os.environ.get('PR_NUMBER', '')
    pr_title = os.environ.get('PR_TITLE', '')

    exit_code = 0

    # Step 1
    versions = pull_versions(base_url)
    if not versions:
        print('WARNING: could not pull versions — continuing with limited data', file=sys.stderr)
        versions = {}

    # Step 2
    if db_id:
        update_versions_db(db_id, versions, notion_token)
    else:
        print('SKIP step 2: PM_VERSIONS_DB_ID not set')

    # Step 3
    sweep_ok = True
    if os.path.exists(ROUTES_JSON_PATH):
        sweep_ok = sweep_routes(ROUTES_JSON_PATH, base_url, app_token, user_key)
        if not sweep_ok:
            exit_code = 1
    else:
        print('WARNING: %s not found — skipping route sweep' % ROUTES_JSON_PATH, file=sys.stderr)

    # Step 4
    write_thread_handoff(archive_page_id, sha, ref, pr_number, pr_title,
                         versions, sweep_ok, notion_token)

    sys.exit(exit_code)


if __name__ == '__main__':
    main()
