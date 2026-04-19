#!/usr/bin/env python3
"""grinder_select_issue.py
Purpose:   Pick exactly ONE eligible open Issue for the nightly Claude Code
           grinder to implement, or return 0 if the queue is idle. Deterministic
           filter + sort — same inputs produce the same pick.

Called by: ops/grinder-runbook.md (the prompt fired by the scheduled task).
           Also runnable standalone for dry-run inspection:
               python3 .github/scripts/grinder_select_issue.py
           Shells out to `gh` for issue + PR listing; exit 2 if gh missing.

Eligibility (Issue #454 acceptance criteria):
  MUST have:
    - state:open
    - label:model:opus AND label:needs:implementation
      (override via GRINDER_LABEL_FILTER — see env vars)
    - body OR first comment contains a '## Build Skills' section
      (filed issues without skills anywhere are silently ignored —
      enforces the per-Issue skill-tagging rule from CLAUDE.md)
  MUST NOT have:
    - label:needs:lt-decision
    - label:status:draft
    - label:status:broken
    - label:kind:decision
    - an open PR closing the issue (gh pr list --search "closes #N")

Sort order: severity priority DESC (blocker > critical > major > minor),
            then created_at ASC (oldest first). First match wins.

Env vars:
  Required:
    GITHUB_TOKEN / GH_TOKEN       auth for gh CLI
    REPO                          owner/repo (e.g. blucsigma05/tbm-apps-script)
  Optional:
    GRINDER_LABEL_FILTER          comma-separated required labels. Default:
                                    'model:opus,needs:implementation'
                                    Narrow to 'grinder-canary' during canary.
    GRINDER_EXCLUDE_LABELS        comma-separated excluded labels. Default:
                                    'needs:lt-decision,status:draft,status:broken,kind:decision'
    GRINDER_REQUIRE_BUILD_SKILLS  'false' to disable the body skill-check.
                                    Default 'true'. Do not disable in prod —
                                    it's load-bearing for agent handoff.

Output:
  stdout: exactly one line, either the selected issue number or '0'.
          The runbook parses this literally (int(line.strip())).
  stderr: one JSON-line log per major step. Fields: ts, level, event,
          issue (optional), reason (optional), count (optional).

Exit codes:
  0  success (including idle = no eligible issues — stdout is '0')
  1  validation error (missing REPO, unparseable gh output, etc.)
  2  gh CLI not installed / not on PATH
"""

from __future__ import annotations

import datetime as _dt
import json
import os
import re
import shutil
import subprocess
import sys
from typing import Iterable

SEVERITY_PRIORITY = {
    'severity:blocker': 0,
    'severity:critical': 1,
    'severity:major': 2,
    'severity:minor': 3,
}
DEFAULT_SEVERITY_RANK = 99  # unlabeled goes last

DEFAULT_LABEL_FILTER = ('model:opus', 'needs:implementation')
DEFAULT_EXCLUDE_LABELS = (
    'needs:lt-decision',
    'status:draft',
    'status:broken',
    'kind:decision',
)

BUILD_SKILLS_RE = re.compile(r'(?mi)^##\s*build\s*skills\s*$')


def log(event: str, level: str = 'info', **fields) -> None:
    rec = {
        'ts': _dt.datetime.now(_dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'level': level,
        'event': event,
    }
    rec.update(fields)
    sys.stderr.write(json.dumps(rec, sort_keys=True) + '\n')
    sys.stderr.flush()


def _split_csv(raw: str | None, default: Iterable[str]) -> tuple[str, ...]:
    if raw is None or raw.strip() == '':
        return tuple(default)
    return tuple(p.strip() for p in raw.split(',') if p.strip())


def _gh(args: list[str]) -> str:
    """Run gh with the given args, return stdout. Raises on nonzero."""
    proc = subprocess.run(
        ['gh', *args],
        capture_output=True, text=True, encoding='utf-8',
    )
    if proc.returncode != 0:
        raise RuntimeError(
            'gh failed (rc={rc}): {cmd}\nstderr: {err}'.format(
                rc=proc.returncode, cmd=' '.join(args), err=proc.stderr.strip(),
            )
        )
    return proc.stdout


def list_candidate_issues(repo: str, required_labels: tuple[str, ...]) -> list[dict]:
    """Fetch ALL open issues matching ALL required labels via REST pagination.

    Uses `gh api --paginate /repos/{repo}/issues` instead of `gh issue list
    --limit N` so the queue depth has no silent ceiling. The REST endpoint
    returns issues + PRs combined; we drop entries with a `pull_request` key.
    Output is normalized to the same shape `gh issue list --json` produces:
        {number, title, body, labels:[{name}], createdAt}
    """
    label_param = ','.join(required_labels)
    args = [
        'api', '--paginate', '-X', 'GET',
        '/repos/' + repo + '/issues',
        '-f', 'state=open',
        '-f', 'labels=' + label_param,
        '-f', 'per_page=100',
    ]
    raw = _gh(args)
    # --paginate concatenates JSON arrays back-to-back as `][` between pages.
    # Normalize into a single list by splitting on the join seam.
    try:
        if not raw.strip():
            data: list = []
        else:
            normalized = '[' + raw.strip().lstrip('[').rstrip(']').replace('][', ',') + ']'
            data = json.loads(normalized)
    except json.JSONDecodeError as exc:
        raise RuntimeError('gh api --paginate returned non-JSON: ' + str(exc))
    if not isinstance(data, list):
        raise RuntimeError('gh api returned non-list payload')
    out = []
    for item in data:
        # REST `/issues` includes PRs; filter them out.
        if 'pull_request' in item:
            continue
        out.append({
            'number': item.get('number'),
            'title': item.get('title'),
            'body': item.get('body'),
            'labels': item.get('labels') or [],
            'createdAt': item.get('created_at'),
        })
    return out


def fetch_first_comment_body(repo: str, issue_number: int) -> str | None:
    """Return the body of the first comment on the Issue (oldest), or None."""
    raw = _gh([
        'api', '-X', 'GET',
        '/repos/' + repo + '/issues/' + str(issue_number) + '/comments',
        '-f', 'per_page=1',
        '-f', 'sort=created',
        '-f', 'direction=asc',
    ])
    try:
        comments = json.loads(raw or '[]')
    except json.JSONDecodeError:
        return None
    if not isinstance(comments, list) or not comments:
        return None
    return comments[0].get('body')


def has_open_closing_pr(repo: str, issue_number: int) -> bool:
    """True if any open PR already closes this issue. Uses gh pr list with a
    `closes #N` search; we then verify the body / closingIssuesReferences to
    avoid matching PRs that merely mention the number in prose."""
    raw = _gh([
        'pr', 'list',
        '-R', repo,
        '--state', 'open',
        '--search', 'closes #{n} in:body'.format(n=issue_number),
        '--json', 'number,body,closingIssuesReferences',
        '--limit', '50',
    ])
    try:
        prs = json.loads(raw or '[]')
    except json.JSONDecodeError:
        return False
    for pr in prs:
        refs = pr.get('closingIssuesReferences') or []
        for ref in refs:
            if ref.get('number') == issue_number:
                return True
        # Fallback: body contains "closes #N" (case-insensitive, word-boundary)
        body = (pr.get('body') or '').lower()
        if re.search(r'\bcloses\s+#' + str(issue_number) + r'\b', body):
            return True
    return False


def severity_rank(labels: list[dict]) -> int:
    best = DEFAULT_SEVERITY_RANK
    for lbl in labels:
        name = (lbl.get('name') or '').lower()
        rank = SEVERITY_PRIORITY.get(name)
        if rank is not None and rank < best:
            best = rank
    return best


def has_build_skills_section(body: str | None) -> bool:
    if not body:
        return False
    return bool(BUILD_SKILLS_RE.search(body))


def is_excluded(labels: list[dict], excludes: tuple[str, ...]) -> str | None:
    """Return the first exclusion label hit, or None."""
    names = {(lbl.get('name') or '').lower() for lbl in labels}
    for ex in excludes:
        if ex.lower() in names:
            return ex
    return None


def select(repo: str,
           required_labels: tuple[str, ...],
           excluded_labels: tuple[str, ...],
           require_build_skills: bool = True) -> int:
    candidates = list_candidate_issues(repo, required_labels)
    log('candidates_listed', count=len(candidates))
    eligible: list[dict] = []
    for issue in candidates:
        number = issue.get('number')
        if not isinstance(number, int):
            continue
        labels = issue.get('labels') or []
        hit = is_excluded(labels, excluded_labels)
        if hit:
            log('skip_excluded', issue=number, reason=hit)
            continue
        if require_build_skills and not has_build_skills_section(issue.get('body')):
            # Per CLAUDE.md: section may live in body OR first comment.
            first_comment = fetch_first_comment_body(repo, number)
            if not has_build_skills_section(first_comment):
                log('skip_no_build_skills', issue=number)
                continue
            log('build_skills_in_first_comment', issue=number)
        if has_open_closing_pr(repo, number):
            log('skip_has_closing_pr', issue=number)
            continue
        eligible.append(issue)
    if not eligible:
        log('idle_no_eligible')
        return 0
    # Sort: severity asc (lower rank = higher priority), then createdAt asc.
    eligible.sort(key=lambda i: (severity_rank(i.get('labels') or []),
                                  i.get('createdAt') or ''))
    pick = eligible[0]
    log('picked',
        issue=pick['number'],
        severity_rank=severity_rank(pick.get('labels') or []),
        created_at=pick.get('createdAt'))
    return int(pick['number'])


def main(argv: list[str]) -> int:
    if shutil.which('gh') is None:
        log('gh_missing', level='error')
        return 2
    repo = os.environ.get('REPO') or os.environ.get('GITHUB_REPOSITORY')
    if not repo:
        log('missing_repo', level='error')
        return 1
    required = _split_csv(os.environ.get('GRINDER_LABEL_FILTER'),
                         DEFAULT_LABEL_FILTER)
    excluded = _split_csv(os.environ.get('GRINDER_EXCLUDE_LABELS'),
                         DEFAULT_EXCLUDE_LABELS)
    require_skills = os.environ.get('GRINDER_REQUIRE_BUILD_SKILLS',
                                    'true').lower() != 'false'
    log('start',
        repo=repo,
        required=list(required),
        excluded=list(excluded),
        require_build_skills=require_skills)
    try:
        picked = select(repo, required, excluded, require_skills)
    except RuntimeError as exc:
        log('runtime_error', level='error', reason=str(exc))
        return 1
    sys.stdout.write(str(picked) + '\n')
    sys.stdout.flush()
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv))
