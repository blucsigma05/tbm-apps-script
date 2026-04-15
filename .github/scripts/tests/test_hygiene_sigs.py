#!/usr/bin/env python3
"""test_hygiene_sigs.py
Purpose: Verify signature stability and body rendering for file_hygiene_issue.py.
         Run with:  python3 -m pytest .github/scripts/tests/ -v
Covers:
  - Sig stability across 10 runs (identity in = identity out)
  - Key-order invariance (sort_keys enforcement)
  - Whitespace/case handling (normalization at compute time)
  - Direction-field enforcement (different directions = different sigs)
  - Missing-field raises (no silent hashing)
  - Body rendering includes marker + footer + evidence
"""

import json
import os
import pathlib
import sys

import pytest

SCRIPT_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPT_DIR))

import file_hygiene_issue as filer  # noqa: E402


# ---------- sig stability ----------

def test_sig_stable_across_10_runs():
    identity = {
        'check': 'version-drift',
        'file': 'dataengine.js',
        'direction': 'source-ahead',
    }
    sigs = {filer.compute_sig(dict(identity)) for _ in range(10)}
    assert len(sigs) == 1, 'sig must be stable across runs; got: ' + str(sigs)


def test_sig_is_16_hex_chars():
    sig = filer.compute_sig({'check': 'x', 'file': 'a'})
    assert len(sig) == 16
    assert all(c in '0123456789abcdef' for c in sig)


# ---------- key order invariance ----------

def test_sig_invariant_to_key_order():
    a = {'check': 'version-drift', 'file': 'dataengine.js', 'direction': 'source-ahead'}
    b = {'direction': 'source-ahead', 'check': 'version-drift', 'file': 'dataengine.js'}
    c = {'file': 'dataengine.js', 'check': 'version-drift', 'direction': 'source-ahead'}
    assert filer.compute_sig(a) == filer.compute_sig(b) == filer.compute_sig(c)


# ---------- whitespace + case normalization ----------

def test_sig_normalizes_whitespace():
    bare = {'check': 'version-drift', 'file': 'dataengine.js'}
    padded = {'check': '  version-drift  ', 'file': '\tdataengine.js\n'}
    assert filer.compute_sig(bare) == filer.compute_sig(padded)


def test_sig_normalizes_case():
    lower = {'check': 'version-drift', 'file': 'dataengine.js'}
    mixed = {'check': 'Version-Drift', 'file': 'DataEngine.js'}
    upper = {'check': 'VERSION-DRIFT', 'file': 'DATAENGINE.JS'}
    assert filer.compute_sig(lower) == filer.compute_sig(mixed) == filer.compute_sig(upper)


def test_sig_normalizes_key_case_and_whitespace():
    a = {'check': 'x', 'file': 'a'}
    b = {' CHECK ': 'x', 'File': 'a'}
    assert filer.compute_sig(a) == filer.compute_sig(b)


# ---------- direction field enforcement ----------

def test_direction_distinguishes_sigs():
    source_ahead = {
        'check': 'version-drift',
        'file': 'dataengine.js',
        'direction': 'source-ahead',
    }
    deployed_ahead = {
        'check': 'version-drift',
        'file': 'dataengine.js',
        'direction': 'deployed-ahead',
    }
    assert filer.compute_sig(source_ahead) != filer.compute_sig(deployed_ahead)


def test_file_distinguishes_sigs():
    a = {'check': 'version-drift', 'file': 'dataengine.js', 'direction': 'source-ahead'}
    b = {'check': 'version-drift', 'file': 'kidshub.js', 'direction': 'source-ahead'}
    assert filer.compute_sig(a) != filer.compute_sig(b)


def test_check_distinguishes_sigs():
    a = {'check': 'version-drift', 'file': 'dataengine.js'}
    b = {'check': 'stale-branch', 'file': 'dataengine.js'}
    assert filer.compute_sig(a) != filer.compute_sig(b)


# ---------- missing-field + malformed input raises ----------

def test_empty_identity_raises():
    with pytest.raises(ValueError, match='non-empty'):
        filer.compute_sig({})


def test_missing_check_raises():
    with pytest.raises(ValueError, match='check'):
        filer.compute_sig({'file': 'dataengine.js'})


def test_non_dict_identity_raises():
    with pytest.raises(ValueError):
        filer.compute_sig('not a dict')
    with pytest.raises(ValueError):
        filer.compute_sig(None)
    with pytest.raises(ValueError):
        filer.compute_sig(['check', 'value'])


def test_unsupported_field_type_raises():
    # Lists, dicts, sets as field values are not allowed — prevents ambiguous hashing
    with pytest.raises(ValueError, match='unsupported type'):
        filer.compute_sig({'check': 'x', 'tags': ['a', 'b']})
    with pytest.raises(ValueError, match='unsupported type'):
        filer.compute_sig({'check': 'x', 'nested': {'k': 'v'}})


# ---------- numeric identity values are stable ----------

def test_int_field_stable():
    a = {'check': 'orphaned-pr', 'pr': 157}
    b = {'check': 'orphaned-pr', 'pr': 157}
    assert filer.compute_sig(a) == filer.compute_sig(b)


def test_int_vs_string_differ():
    # We intentionally do NOT coerce; 157 and "157" produce different sigs.
    # Emitters are responsible for consistent types.
    a = {'check': 'orphaned-pr', 'pr': 157}
    b = {'check': 'orphaned-pr', 'pr': '157'}
    assert filer.compute_sig(a) != filer.compute_sig(b)


# ---------- validate_finding schema gate ----------

def test_validate_finding_missing_fields():
    with pytest.raises(ValueError, match='missing required'):
        filer.validate_finding({'check': 'x'})


def test_validate_finding_identity_type():
    with pytest.raises(ValueError, match='identity must be'):
        filer.validate_finding({
            'check': 'x',
            'check_title': 'HYG-X',
            'title': 't',
            'identity': 'not a dict',
        })


def test_validate_finding_accepts_complete():
    finding = {
        'check': 'version-drift',
        'check_title': 'HYG-06',
        'title': 'Version drift: foo.js',
        'identity': {'check': 'version-drift', 'file': 'foo.js', 'direction': 'source-ahead'},
    }
    filer.validate_finding(finding)  # no raise


# ---------- body rendering ----------

def test_body_contains_marker():
    finding = {
        'check': 'version-drift',
        'check_title': 'HYG-06',
        'title': 'Version drift: foo.js',
        'identity': {'check': 'version-drift', 'file': 'foo.js', 'direction': 'source-ahead'},
    }
    sig = filer.compute_sig(finding['identity'])
    body = filer.render_body(finding, sig)
    assert '<!-- auto-finding v=1 check=version-drift sig=' + sig + ' -->' in body


def test_body_contains_footer():
    finding = {
        'check': 'version-drift',
        'check_title': 'HYG-06',
        'title': 'foo',
        'identity': {'check': 'x'},
    }
    body = filer.render_body(finding, filer.compute_sig(finding['identity']))
    assert 'auto:suppressed' in body
    assert 'REOPEN' in body
    assert '7 days' in body


def test_body_contains_evidence():
    finding = {
        'check': 'version-drift',
        'check_title': 'HYG-06',
        'title': 'drift',
        'identity': {'check': 'x'},
        'evidence': {'Deployed': '42', 'Source': '43'},
    }
    body = filer.render_body(finding, 'abc123')
    assert 'Deployed: 42' in body
    assert 'Source: 43' in body


def test_marker_regex_matches_rendered_body():
    finding = {
        'check': 'version-drift',
        'check_title': 'HYG-06',
        'title': 'foo',
        'identity': {'check': 'x', 'file': 'y'},
    }
    sig = filer.compute_sig(finding['identity'])
    body = filer.render_body(finding, sig)
    m = filer.MARKER_RE.search(body)
    assert m is not None
    assert m.group(1) == 'version-drift'
    assert m.group(2) == sig


# ---------- title rendering ----------

def test_title_prefix():
    finding = {
        'check': 'version-drift',
        'check_title': 'HYG-06',
        'title': 'Version drift: DataEngine.js',
        'identity': {'check': 'x'},
    }
    assert filer.render_title(finding) == '[HYG-06] Version drift: DataEngine.js'
