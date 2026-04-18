#!/usr/bin/env python3
"""check_profile_sync.py
Purpose:   Verify every inline device/viewport map in the repo matches the
           canonical source at ops/play-gate-profiles.json. Invokes
           scripts/parse-profile-consumer.js as a subprocess to extract
           structured data from each consumer, then compares per-field.
Called by: .github/workflows/hygiene.yml (to be wired in PR 1) and locally
           via: python3 .github/scripts/check_profile_sync.py
Env vars:  REPO_ROOT   Repo root (default: repo root relative to this file)
           VERBOSE     "1" to print extracted data alongside drift report
Exit:      0 = all consumers in sync
           1 = drift detected (report printed to stderr)
           2 = tooling error (missing profiles.json, parser crash, etc.)
"""

import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.environ.get('REPO_ROOT', os.path.abspath(os.path.join(HERE, '..', '..')))
VERBOSE = os.environ.get('VERBOSE', '0') == '1'

PROFILES_PATH = os.path.join(REPO_ROOT, 'ops', 'play-gate-profiles.json')
PARSER_PATH = os.path.join(REPO_ROOT, 'scripts', 'parse-profile-consumer.js')

# Substring that migrated consumers must contain to prove they derive their
# device data from the canonical source. Kept as a substring match so consumers
# can format the require path however makes sense in their own code style
# (path.join(), direct string, etc.).
PROFILES_IMPORT_MARKER = 'play-gate-profiles.json'

# Sync manifest: each entry maps one consumer to its kind + alias->canonical mapping.
# kind=perf_devices  — compare all rich fields (viewport, dSF, isMobile, hasTouch, UA)
# kind=basic_devices — compare viewport.width/height only (consumer has {width, height})
# kind=route_viewports — compare routeViewports entries identity (consumer keys = route names)
SYNC_MANIFEST = [
    {
        'file': 'playwright.config.js',
        'target': 'PERF_DEVICES',
        'kind': 'perf_devices',
        'mapping': {
            'surface-pro-5': 'surface-pro-5',
            'samsung-s10-fe': 'samsung-s10-fe',
        },
    },
    {
        'file': '.claude/launch.json',
        'target': 'playwright.devices',
        'kind': 'perf_devices',
        'mapping': {
            'surface-pro-5': 'surface-pro-5',
            'samsung-s10-fe': 'samsung-s10-fe',
        },
    },
    {
        'file': 'tests/shared/helpers.js',
        'target': 'DEVICES',
        'kind': 'basic_devices',
        'mapping': {
            'SurfacePro': 'surface-pro-5',
            'S10FE': 'samsung-s10-fe',
            'S25': 'galaxy-s25',
            'iPadAir': 'ipad-air',
            'FireStick': 'fire-stick-full',
            'Omnibook': 'omnibook',
        },
    },
    {
        'file': 'tests/tbm/education-workflows.spec.js',
        'target': 'DEVICES',
        'kind': 'basic_devices',
        'mapping': {
            'surface_pro': 'surface-pro-5',
            's10fe': 'samsung-s10-fe',
            's25': 'galaxy-s25',
            'a9': 'ipad-air',
        },
    },
    {
        'file': 'tests/tbm/screenshots.spec.js',
        'target': 'ROUTE_VIEWPORTS',
        'kind': 'route_viewports',
        'mapping': {},
    },
]

PERF_FIELDS = ('deviceScaleFactor', 'isMobile', 'hasTouch', 'userAgent')


def load_profiles():
    if not os.path.isfile(PROFILES_PATH):
        die(2, 'canonical profiles not found: ' + PROFILES_PATH)
    with open(PROFILES_PATH, 'r', encoding='utf-8') as fh:
        return json.load(fh)


def parse_consumer(file_rel, target):
    abs_path = os.path.join(REPO_ROOT, file_rel)
    if not os.path.isfile(abs_path):
        return None, 'file not found: ' + file_rel
    try:
        proc = subprocess.run(
            ['node', PARSER_PATH, abs_path, target],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError as exc:
        return None, 'node not on PATH: ' + str(exc)
    if proc.returncode != 0:
        return None, 'parser exit=' + str(proc.returncode) + ' stderr=' + proc.stderr.strip()
    try:
        return json.loads(proc.stdout), None
    except json.JSONDecodeError as exc:
        return None, 'parser stdout not JSON: ' + str(exc)


def check_perf_devices(entry, consumer_data, profiles, drifts):
    devices = profiles.get('devices', {})
    for alias, canonical_key in entry['mapping'].items():
        canonical = devices.get(canonical_key)
        if canonical is None:
            drifts.append({
                'file': entry['file'],
                'alias': alias,
                'problem': 'canonical device "' + canonical_key + '" missing from profiles.json',
            })
            continue
        consumer = consumer_data.get(alias)
        if consumer is None:
            drifts.append({
                'file': entry['file'],
                'alias': alias,
                'problem': 'alias absent from consumer',
            })
            continue
        expected_vp = canonical.get('viewport', {})
        actual_vp = consumer.get('viewport', {})
        if actual_vp.get('width') != expected_vp.get('width') or actual_vp.get('height') != expected_vp.get('height'):
            drifts.append({
                'file': entry['file'],
                'alias': alias,
                'problem': 'viewport mismatch',
                'expected': expected_vp,
                'actual': actual_vp,
            })
        for field in PERF_FIELDS:
            if consumer.get(field) != canonical.get(field):
                drifts.append({
                    'file': entry['file'],
                    'alias': alias,
                    'problem': 'field "' + field + '" mismatch',
                    'expected': canonical.get(field),
                    'actual': consumer.get(field),
                })


def check_basic_devices(entry, consumer_data, profiles, drifts):
    devices = profiles.get('devices', {})
    for alias, canonical_key in entry['mapping'].items():
        canonical = devices.get(canonical_key)
        if canonical is None:
            drifts.append({
                'file': entry['file'],
                'alias': alias,
                'problem': 'canonical device "' + canonical_key + '" missing from profiles.json',
            })
            continue
        consumer = consumer_data.get(alias)
        if consumer is None:
            drifts.append({
                'file': entry['file'],
                'alias': alias,
                'problem': 'alias absent from consumer',
            })
            continue
        expected_vp = canonical.get('viewport', {})
        if consumer.get('width') != expected_vp.get('width') or consumer.get('height') != expected_vp.get('height'):
            drifts.append({
                'file': entry['file'],
                'alias': alias,
                'problem': 'viewport mismatch (canonical -> consumer)',
                'canonical': canonical_key,
                'expected': {'width': expected_vp.get('width'), 'height': expected_vp.get('height')},
                'actual': {'width': consumer.get('width'), 'height': consumer.get('height')},
            })


def check_route_viewports(entry, consumer_data, profiles, drifts):
    canonical_routes = profiles.get('routeViewports', {})
    for route, canonical in canonical_routes.items():
        consumer = consumer_data.get(route)
        if consumer is None:
            drifts.append({
                'file': entry['file'],
                'route': route,
                'problem': 'route absent from consumer',
            })
            continue
        if consumer.get('width') != canonical.get('width') or consumer.get('height') != canonical.get('height'):
            drifts.append({
                'file': entry['file'],
                'route': route,
                'problem': 'viewport mismatch',
                'expected': {'width': canonical.get('width'), 'height': canonical.get('height')},
                'actual': {'width': consumer.get('width'), 'height': consumer.get('height')},
            })
        if consumer.get('device') != canonical.get('device'):
            drifts.append({
                'file': entry['file'],
                'route': route,
                'problem': 'device label mismatch',
                'expected': canonical.get('device'),
                'actual': consumer.get('device'),
            })
    for route in consumer_data:
        if route not in canonical_routes:
            drifts.append({
                'file': entry['file'],
                'route': route,
                'problem': 'extra route in consumer (not in profiles.routeViewports)',
            })


def die(code, msg):
    sys.stderr.write('check_profile_sync: ' + msg + '\n')
    sys.exit(code)


def main():
    profiles = load_profiles()
    drifts = []
    parsed_consumers = {}

    migrated = []
    for entry in SYNC_MANIFEST:
        parsed, err = parse_consumer(entry['file'], entry['target'])
        if err:
            drifts.append({'file': entry['file'], 'problem': 'parser error', 'detail': err})
            continue

        # Migrated consumer path: parser identified the target as dynamically
        # derived (CallExpression). Confirm (a) the file imports profiles.json,
        # (b) the file references its own alias-lookup key, and (c) profiles.json
        # actually contains that alias key with the expected local-alias value
        # for every canonical device in the consumer's mapping. Catches typos
        # in the JS alias string and missing/renamed entries in profiles.json
        # that would otherwise silently produce an empty DEVICES map at runtime.
        if parsed.get('source') == 'js:migrated-callexpr':
            abs_path = os.path.join(REPO_ROOT, entry['file'])
            with open(abs_path, 'r', encoding='utf-8') as fh:
                src = fh.read()
            if PROFILES_IMPORT_MARKER not in src:
                drifts.append({
                    'file': entry['file'],
                    'problem': 'consumer uses dynamic init but does not import play-gate-profiles.json',
                    'detail': 'Either add the import or revert to a static map the parser can validate.',
                })
                continue

            alias_key = entry['file'] + ':' + entry['target']
            if alias_key not in src:
                drifts.append({
                    'file': entry['file'],
                    'problem': 'migrated consumer does not reference its alias-lookup key',
                    'detail': "source must contain the literal string '" + alias_key + "' so the buildDevices() lookup matches profiles.json aliases",
                })
                continue

            mismatches = []
            for local_alias, canonical_device in entry.get('mapping', {}).items():
                device = profiles.get('devices', {}).get(canonical_device, {})
                aliases = device.get('aliases', {}) or {}
                actual = aliases.get(alias_key)
                if actual != local_alias:
                    mismatches.append({
                        'canonical_device': canonical_device,
                        'expected_alias': local_alias,
                        'actual_alias': actual,
                    })
            if mismatches:
                drifts.append({
                    'file': entry['file'],
                    'problem': 'migrated consumer alias mapping drift in profiles.json',
                    'detail': mismatches,
                })
                continue

            migrated.append(entry['file'])
            parsed_consumers[entry['file']] = {'__migrated': True, 'alias_key': alias_key}
            continue

        consumer_data = parsed.get('data', {})
        parsed_consumers[entry['file']] = consumer_data

        if entry['kind'] == 'perf_devices':
            check_perf_devices(entry, consumer_data, profiles, drifts)
        elif entry['kind'] == 'basic_devices':
            check_basic_devices(entry, consumer_data, profiles, drifts)
        elif entry['kind'] == 'route_viewports':
            check_route_viewports(entry, consumer_data, profiles, drifts)
        else:
            drifts.append({'file': entry['file'], 'problem': 'unknown kind: ' + entry['kind']})

    report = {
        'canonical': os.path.relpath(PROFILES_PATH, REPO_ROOT).replace(os.sep, '/'),
        'consumers_checked': [e['file'] for e in SYNC_MANIFEST],
        'migrated_consumers': migrated,
        'drift_count': len(drifts),
        'drifts': drifts,
    }
    if VERBOSE:
        report['parsed_consumers'] = parsed_consumers

    print(json.dumps(report, indent=2))

    if drifts:
        sys.stderr.write('\n' + str(len(drifts)) + ' drift(s) detected — see report above.\n')
        sys.exit(1)
    sys.exit(0)


if __name__ == '__main__':
    main()
