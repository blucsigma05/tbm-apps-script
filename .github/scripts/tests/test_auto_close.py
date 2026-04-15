#!/usr/bin/env python3
"""test_auto_close.py
Purpose: Verify pure helpers in auto_close_issues.py (marker + evidence parsing).
         Run with:  python3 -m pytest .github/scripts/tests/ -v
"""

import pathlib
import sys

import pytest

SCRIPT_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPT_DIR))

import file_hygiene_issue as filer  # noqa: E402
import auto_close_issues as closer  # noqa: E402


# ---------- parse_marker ----------

def test_parse_marker_finds_check_and_sig():
    body = 'prose\n<!-- auto-finding v=1 check=version-drift sig=abc123def4567890 -->'
    check, sig = closer.parse_marker(body)
    assert check == 'version-drift'
    assert sig == 'abc123def4567890'


def test_parse_marker_missing_returns_none():
    check, sig = closer.parse_marker('body with no marker')
    assert check is None and sig is None


def test_parse_marker_empty_body():
    check, sig = closer.parse_marker('')
    assert check is None and sig is None


def test_parse_marker_v2_rejected():
    body = '<!-- auto-finding v=2 check=x sig=y -->'
    check, sig = closer.parse_marker(body)
    # v=2 marker should NOT match v=1 regex
    assert check is None and sig is None


# ---------- parse_evidence_from_body ----------

def test_parse_evidence_basic():
    body = (
        '**Check:** HYG-06\n\n'
        '**Evidence:**\n'
        '- Deployed: 42\n'
        '- Source: 43\n'
        '\n'
        '**Details:**\n'
        'more stuff\n'
    )
    ev = closer.parse_evidence_from_body(body)
    assert ev == {'Deployed': '42', 'Source': '43'}


def test_parse_evidence_missing_returns_empty():
    ev = closer.parse_evidence_from_body('no evidence section')
    assert ev == {}


def test_parse_evidence_stops_at_blank_line():
    body = (
        '**Evidence:**\n'
        '- Deployed: 42\n'
        '\n'
        '- Source: 43\n'   # after blank line, should not be included
    )
    ev = closer.parse_evidence_from_body(body)
    assert ev == {'Deployed': '42'}


def test_parse_evidence_round_trip_with_render_body():
    # Render body via filer, then parse evidence — must recover original dict
    finding = {
        'check': 'version-drift',
        'check_title': 'HYG-06',
        'title': 'Version drift: foo.js',
        'identity': {'check': 'version-drift', 'file': 'foo.js'},
        'evidence': {'Deployed': '42', 'Source': '43'},
    }
    body = filer.render_body(finding, filer.compute_sig(finding['identity']))
    parsed = closer.parse_evidence_from_body(body)
    assert parsed == {'Deployed': '42', 'Source': '43'}


# ---------- registry ----------

def test_register_and_lookup_detector():
    called = {'count': 0}

    def fake_detector():
        called['count'] += 1
        return {'abc123': {'evidence': {'k': 'v'}, 'title': 't', 'details': 'd'}}

    closer.register_detector('fake-check', fake_detector)
    assert 'fake-check' in closer.DETECTOR_REGISTRY
    assert closer.DETECTOR_REGISTRY['fake-check']() == {
        'abc123': {'evidence': {'k': 'v'}, 'title': 't', 'details': 'd'}
    }
    # Cleanup so other tests aren't polluted
    del closer.DETECTOR_REGISTRY['fake-check']
