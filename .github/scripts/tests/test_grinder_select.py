#!/usr/bin/env python3
"""test_grinder_select.py
Purpose: Unit tests for grinder_select_issue.py — eligibility, sort order,
         build-skills gate, exclusion labels, and idle output shape.
         Run with:  python3 -m pytest .github/scripts/tests/ -v
"""

import pathlib
import sys

import pytest

SCRIPT_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPT_DIR))

import grinder_select_issue as gsi  # noqa: E402


def _issue(number, labels=(), body='## Build Skills\n- x', created='2026-04-01T00:00:00Z'):
    return {
        'number': number,
        'title': 'issue ' + str(number),
        'body': body,
        'labels': [{'name': n} for n in labels],
        'createdAt': created,
    }


# ---------- build skills section ----------

def test_build_skills_accepts_standard_heading():
    assert gsi.has_build_skills_section('# Top\n\n## Build Skills\n- x')


def test_build_skills_case_insensitive():
    assert gsi.has_build_skills_section('## build skills')
    assert gsi.has_build_skills_section('## BUILD SKILLS')


def test_build_skills_requires_h2_heading():
    # bare text mention doesn't count — must be a heading
    assert not gsi.has_build_skills_section('we should add Build Skills here')


def test_build_skills_empty_body():
    assert not gsi.has_build_skills_section('')
    assert not gsi.has_build_skills_section(None)


# ---------- severity ranking ----------

def test_severity_blocker_wins():
    rank = gsi.severity_rank([{'name': 'severity:blocker'}, {'name': 'severity:major'}])
    assert rank == 0


def test_severity_case_insensitive():
    assert gsi.severity_rank([{'name': 'SEVERITY:CRITICAL'}]) == 1


def test_severity_unlabeled_goes_last():
    assert gsi.severity_rank([{'name': 'area:infra'}]) == gsi.DEFAULT_SEVERITY_RANK


# ---------- exclusion labels ----------

def test_excluded_by_lt_decision():
    hit = gsi.is_excluded(
        [{'name': 'needs:lt-decision'}, {'name': 'kind:task'}],
        ('needs:lt-decision',),
    )
    assert hit == 'needs:lt-decision'


def test_not_excluded_when_no_overlap():
    assert gsi.is_excluded([{'name': 'kind:task'}], ('status:draft',)) is None


# ---------- select() — integration with stubbed gh ----------

@pytest.fixture
def fake_gh(monkeypatch):
    state = {'issues': [], 'prs': {}, 'first_comments': {}}

    def _fake_list(repo, required_labels):
        # Return issues that carry ALL required labels (case-insensitive)
        required_lower = {r.lower() for r in required_labels}
        out = []
        for i in state['issues']:
            names = {(lbl.get('name') or '').lower() for lbl in i.get('labels', [])}
            if required_lower.issubset(names):
                out.append(i)
        return out

    def _fake_has_pr(repo, n):
        return state['prs'].get(n, False)

    def _fake_first_comment(repo, n):
        return state['first_comments'].get(n)

    monkeypatch.setattr(gsi, 'list_candidate_issues', _fake_list)
    monkeypatch.setattr(gsi, 'has_open_closing_pr', _fake_has_pr)
    monkeypatch.setattr(gsi, 'fetch_first_comment_body', _fake_first_comment)
    return state


def test_select_idle_when_no_candidates(fake_gh):
    assert gsi.select('owner/repo',
                      ('model:opus', 'needs:implementation'),
                      gsi.DEFAULT_EXCLUDE_LABELS) == 0


def test_select_prefers_blocker_over_major(fake_gh):
    fake_gh['issues'] = [
        _issue(101, ['model:opus', 'needs:implementation', 'severity:major'],
               created='2026-04-01T00:00:00Z'),
        _issue(102, ['model:opus', 'needs:implementation', 'severity:blocker'],
               created='2026-04-10T00:00:00Z'),  # newer, but higher priority
    ]
    assert gsi.select('owner/repo',
                      ('model:opus', 'needs:implementation'),
                      gsi.DEFAULT_EXCLUDE_LABELS) == 102


def test_select_ties_broken_by_oldest(fake_gh):
    fake_gh['issues'] = [
        _issue(201, ['model:opus', 'needs:implementation', 'severity:major'],
               created='2026-04-10T00:00:00Z'),
        _issue(202, ['model:opus', 'needs:implementation', 'severity:major'],
               created='2026-04-01T00:00:00Z'),
    ]
    assert gsi.select('owner/repo',
                      ('model:opus', 'needs:implementation'),
                      gsi.DEFAULT_EXCLUDE_LABELS) == 202


def test_select_skips_excluded_label(fake_gh):
    fake_gh['issues'] = [
        _issue(301, ['model:opus', 'needs:implementation',
                     'needs:lt-decision', 'severity:blocker']),
        _issue(302, ['model:opus', 'needs:implementation', 'severity:major']),
    ]
    assert gsi.select('owner/repo',
                      ('model:opus', 'needs:implementation'),
                      gsi.DEFAULT_EXCLUDE_LABELS) == 302


def test_select_skips_missing_build_skills(fake_gh):
    fake_gh['issues'] = [
        _issue(401, ['model:opus', 'needs:implementation', 'severity:blocker'],
               body='No skills section here.'),
        _issue(402, ['model:opus', 'needs:implementation', 'severity:minor']),
    ]
    assert gsi.select('owner/repo',
                      ('model:opus', 'needs:implementation'),
                      gsi.DEFAULT_EXCLUDE_LABELS) == 402


def test_select_skips_issue_with_open_closing_pr(fake_gh):
    fake_gh['issues'] = [
        _issue(501, ['model:opus', 'needs:implementation', 'severity:blocker']),
        _issue(502, ['model:opus', 'needs:implementation', 'severity:major']),
    ]
    fake_gh['prs'][501] = True
    assert gsi.select('owner/repo',
                      ('model:opus', 'needs:implementation'),
                      gsi.DEFAULT_EXCLUDE_LABELS) == 502


def test_select_require_build_skills_false_bypasses_body_check(fake_gh):
    fake_gh['issues'] = [
        _issue(601, ['model:opus', 'needs:implementation', 'severity:major'],
               body='no skills'),
    ]
    assert gsi.select('owner/repo',
                      ('model:opus', 'needs:implementation'),
                      gsi.DEFAULT_EXCLUDE_LABELS,
                      require_build_skills=False) == 601


# ---------- Codex P1: Build Skills in first comment ----------

def test_select_accepts_build_skills_in_first_comment(fake_gh):
    """CLAUDE.md: section may live in body OR first comment."""
    fake_gh['issues'] = [
        _issue(701, ['model:opus', 'needs:implementation', 'severity:major'],
               body='Body has no skills section.'),
    ]
    fake_gh['first_comments'][701] = '## Build Skills\n- thompson-engineer'
    assert gsi.select('owner/repo',
                      ('model:opus', 'needs:implementation'),
                      gsi.DEFAULT_EXCLUDE_LABELS) == 701


def test_select_skips_when_neither_body_nor_first_comment_has_skills(fake_gh):
    fake_gh['issues'] = [
        _issue(801, ['model:opus', 'needs:implementation', 'severity:blocker'],
               body='no skills here'),
        _issue(802, ['model:opus', 'needs:implementation', 'severity:minor']),
    ]
    fake_gh['first_comments'][801] = 'just a follow-up comment, no skills'
    # 801 fails both checks; 802 has skills in body (default _issue body)
    assert gsi.select('owner/repo',
                      ('model:opus', 'needs:implementation'),
                      gsi.DEFAULT_EXCLUDE_LABELS) == 802


def test_select_body_skills_short_circuits_no_comment_fetch(fake_gh, monkeypatch):
    """If body already has the section, the first-comment fetch must not
    be called — keeps the API budget tight when the common case wins."""
    fake_gh['issues'] = [
        _issue(901, ['model:opus', 'needs:implementation', 'severity:major']),
    ]
    calls = []
    monkeypatch.setattr(gsi, 'fetch_first_comment_body',
                        lambda r, n: calls.append(n) or None)
    assert gsi.select('owner/repo',
                      ('model:opus', 'needs:implementation'),
                      gsi.DEFAULT_EXCLUDE_LABELS) == 901
    assert calls == [], 'must not fetch comments when body already has skills'
