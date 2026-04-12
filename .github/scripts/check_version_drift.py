#!/usr/bin/env python3
"""check_version_drift.py
Purpose:   Compare deployed GAS version numbers against source-controlled constants.
           Flags any file where deployed version < source version (clasp push w/o deploy).
Called by: .github/workflows/hyg-06-version-drift.yml
Env vars:  GAS_DEPLOY_URL  Full GAS exec URL (required)
           REPO_ROOT       Repo root for source file reads (default: .)
           GITHUB_OUTPUT   Set by Actions runner; used to pass step outputs
"""

import json
import os
import re
import sys
import urllib.request
import urllib.error

GAS_DEPLOY_URL = os.environ.get('GAS_DEPLOY_URL', '')
REPO_ROOT = os.environ.get('REPO_ROOT', '.')
GITHUB_OUTPUT = os.environ.get('GITHUB_OUTPUT', '')

# Maps getDeployedVersions() key → (source_filename, version_function_name)
FILE_VERSION_MAP = {
    'DataEngine':    ('Dataengine.js',    'getDataEngineVersion'),
    'Code':          ('Code.js',          'getCodeVersion'),
    'CascadeEngine': ('CascadeEngine.js', 'getCascadeEngineVersion'),
    'KidsHub':       ('Kidshub.js',       'getKidsHubVersion'),
    'GASHardening':  ('GASHardening.js',  'getGASHardeningVersion'),
    'MonitorEngine': ('MonitorEngine.js', 'getMonitorEngineVersion'),
    'CalendarSync':  ('CalendarSync.js',  'getCalendarSyncVersion'),
    'AlertEngine':   ('Alertenginev1.js', 'getAlertEngineVersion'),
    'StoryFactory':  ('StoryFactory.js',  'getStoryFactoryVersion'),
    'CurriculumSeed': ('CurriculumSeed.js', 'getCurriculumSeedVersion'),
}


def set_output(key, value):
    if GITHUB_OUTPUT:
        with open(GITHUB_OUTPUT, 'a') as fh:
            fh.write(key + '=' + value + '\n')
    else:
        print('[output] ' + key + '=' + value)


def get_deployed_versions():
    url = GAS_DEPLOY_URL + '?action=allVersions'
    req = urllib.request.Request(url, headers={'User-Agent': 'TBM-HYG-06/1.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def get_source_version(filename, fn_name):
    path = os.path.join(REPO_ROOT, filename)
    try:
        with open(path) as fh:
            content = fh.read()
    except FileNotFoundError:
        return None
    # Match: function getFooVersion() { return N; } — supports int (42) or decimal (15.1)
    pattern = r'function\s+' + re.escape(fn_name) + r'\s*\(\s*\)\s*\{\s*return\s+([\d.]+)\s*;\s*\}'
    m = re.search(pattern, content)
    return float(m.group(1)) if m else None


def main():
    if not GAS_DEPLOY_URL:
        print('ERROR: GAS_DEPLOY_URL not set')
        return 1

    print('Fetching deployed versions from GAS...')
    try:
        deployed = get_deployed_versions()
    except Exception as e:
        print('ERROR fetching deployed versions: ' + str(e))
        return 1

    print('Deployed: ' + json.dumps({k: v for k, v in deployed.items() if k != '_timestamp'}, indent=2))

    drifted = []
    for key, (filename, fn_name) in FILE_VERSION_MAP.items():
        deployed_ver = deployed.get(key)
        if deployed_ver is None or deployed_ver == '?':
            print('SKIP ' + key + ': not in deployed response')
            continue
        try:
            deployed_num = float(deployed_ver)
        except (ValueError, TypeError):
            print('SKIP ' + key + ': deployed value "' + str(deployed_ver) + '" not a number')
            continue
        source_ver = get_source_version(filename, fn_name)
        if source_ver is None:
            print('SKIP ' + key + ': could not parse source version from ' + filename)
            continue
        if source_ver > deployed_num:
            drifted.append({
                'key': key,
                'file': filename,
                'source': source_ver,
                'deployed': deployed_num,
                'delta': source_ver - deployed_num,
            })
            print('DRIFT ' + key + ': source=v' + str(source_ver) + ' deployed=v' + str(deployed_num))
        else:
            print('OK    ' + key + ': v' + str(deployed_num))

    has_findings = len(drifted) > 0
    set_output('has_findings', 'true' if has_findings else 'false')
    set_output('drift_count', str(len(drifted)))

    print(json.dumps({'drift_count': len(drifted), 'drifted': drifted}, indent=2))

    if has_findings:
        parts = [d['key'] + ' (src=v' + str(d['source']) + ' live=v' + str(d['deployed']) + ')'
                 for d in drifted]
        msg = str(len(drifted)) + ' version drift(s): ' + ', '.join(parts)
        msg += ' — run clasp deploy -i <ID>'
        with open('hyg06-message.txt', 'w') as fh:
            fh.write(msg)
        print('Findings: ' + msg)
    else:
        print('PASS: All deployed versions match source.')

    return 0


if __name__ == '__main__':
    sys.exit(main())
