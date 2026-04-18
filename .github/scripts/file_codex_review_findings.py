#!/usr/bin/env python3
"""file_codex_review_findings.py
Purpose:   Convert automated Codex PR review findings into durable claude:inbox
           Issues. Parses the structured JSON block embedded in the bot's review
           comment (<!-- codex-review-report -->) and shells out to
           file_hygiene_issue.py for each actionable finding.

           Phase 1 of the Codex-to-Claude event router. Complements (does not
           replace) the manual-audit path in parse_finding_comment.py which
           handles human-authored finding markers via a separate trust domain
           and separate dedup mechanism (_finding_dedup.py comment-ID markers).

Called by: .github/workflows/codex-review-filer.yml
Trust:     github-actions[bot] author only. Human-authored findings are NOT
           handled here — they stay on the manual listener path.

Env vars:
  Required:
    GITHUB_TOKEN / GH_TOKEN           auth (auto in Actions)
    GITHUB_REPOSITORY                 owner/repo (auto in Actions)
    REPO                              owner/repo (workflow-supplied mirror)
    COMMENT_BODY                      full bot comment body (contains the JSON block)
    COMMENT_AUTHOR                    expected: 'github-actions[bot]'
    COMMENT_ID                        the bot comment ID (used for source URL)
    PR_NUMBER                         the PR the comment is on
  Kill switches (our own):
    AUTOMATION_ENABLED                'false' short-circuits (default true)
    CODEX_REVIEW_FILER_ENABLED        'false' short-circuits this filer only (default true)
    CLAUDE_INBOX_MAJOR_ENABLED        'true' opts severity:major into inbox (default false)
  Forwarded to file_hygiene_issue.py subprocess (per its contract):
    STATUS_ISSUE_NUMBER               pinned filer-status Issue
    AUTOMATION_MAX_DAILY_ISSUES       integer cap (default 5 on helper side)
  Intentionally NOT forwarded:
    HYGIENE_ISSUE_CREATION_ENABLED    belongs to the paused hygiene-filer.yml
                                      wrapper. This filer is adjacent, not
                                      identical — it bypasses that wrapper.

Behavior:
  1. Gate on AUTOMATION_ENABLED AND CODEX_REVIEW_FILER_ENABLED. Silent exit on false.
  2. Gate on COMMENT_AUTHOR == 'github-actions[bot]'. Silent exit otherwise.
  3. Locate <!-- codex-review-report --> ... <!-- /codex-review-report --> block.
     Extract JSON. Silent exit if absent or unparseable.
  4. Gate on verdict == 'FAIL'. PASS and INCONCLUSIVE exit silently —
     INCONCLUSIVE is handled by review-watcher.js as PR-check state, not a
     work-queue item.
  5. For each finding in findings[]:
       - severity in {'blocker','critical'}: always file
       - severity == 'major': file iff CLAUDE_INBOX_MAJOR_ENABLED=true
       - severity == 'minor': skip
  6. Build identity dict via build_identity(): evidence_hash primary,
     title_hash fallback when evidence is empty.
  7. Derive area:* label via AREA_PREFIX_MAP (first match wins; JJ/Buggsy
     before generic area:education).
  8. Derive model:* label: model:sonnet by default (fix work per
     ops/WORKFLOW.md:65). model:codex when finding.file matches a
     review-pipeline path.
  9. Invoke file_hygiene_issue.py per finding with the constructed finding-JSON.
 10. Structured JSON-line logging to stdout.

Exit: 0 success (one or more findings processed, or intentional skip).
      1 validation error (bad input, unexpected shape).
      2 unexpected error (subprocess failure).
"""

import hashlib
import json
import os
import re
import subprocess
import sys

AUTHOR_REQUIRED = 'github-actions[bot]'
PR_COMMENT_MARKER = '<!-- codex-pr-review -->'
REPORT_START = '<!-- codex-review-report -->'
REPORT_END = '<!-- /codex-review-report -->'

DEFAULT_SEVERITIES = {'blocker', 'critical'}
OPTIONAL_SEVERITIES = {'major'}  # gated by CLAUDE_INBOX_MAJOR_ENABLED

# finding.type -> repo label (pre-existing repo labels only)
TYPE_LABEL_MAP = {
    'wiring': 'type:wiring',
    'persistence': 'type:persistence',
    'schema': 'type:schema',
    'ui': 'type:ui',
    'logic': 'type:logic',
    'deploy': 'type:deploy',
}

# file-path prefix -> area:* label. ORDER MATTERS. First match wins.
# JJ/Buggsy specific before generic area:education, so SparkleLearning.html
# routes to area:jj and HomeworkModule.html routes to area:buggsy.
# Finance surfaces (ThePulse/Vein/Spine/Soul/DataEngine) before shared GAS infra.
# Code.gs lives in shared (router/Safe-wrappers/CacheService per CLAUDE.md).
AREA_PREFIX_MAP = [
    # Infra / QA
    ('.github/', 'area:infra'),
    ('tests/', 'area:qa'),
    ('playwright', 'area:qa'),
    # JJ-specific
    ('SparkleLearning', 'area:jj'),
    ('JJHome', 'area:jj'),
    ('sparkle-kingdom', 'area:jj'),
    ('jj-', 'area:jj'),
    # Buggsy-specific
    ('HomeworkModule', 'area:buggsy'),
    ('Wolfkid', 'area:buggsy'),
    ('wolfkid-', 'area:buggsy'),
    ('wolfdome', 'area:buggsy'),
    # Shared education (after JJ/Buggsy so child-specific wins)
    ('reading-module', 'area:education'),
    ('writing-module', 'area:education'),
    ('fact-sprint', 'area:education'),
    ('investigation-module', 'area:education'),
    ('daily-missions', 'area:education'),
    ('BaselineDiagnostic', 'area:education'),
    ('ComicStudio', 'area:education'),
    ('StoryLibrary', 'area:education'),
    ('StoryReader', 'area:education'),
    ('ProgressReport', 'area:education'),
    ('executive-skills', 'area:education'),
    # Finance
    ('ThePulse', 'area:finance'),
    ('TheVein', 'area:finance'),
    ('TheSpine', 'area:finance'),
    ('TheSoul', 'area:finance'),
    ('DataEngine', 'area:finance'),
    # Shared GAS infra (includes Code.gs — router, NOT finance)
    ('Code.gs', 'area:shared'),
    ('GASHardening', 'area:shared'),
    ('MonitorEngine', 'area:shared'),
    ('AlertEngine', 'area:shared'),
    ('Utility', 'area:shared'),
]
AREA_DEFAULT = 'area:infra'

# Review-pipeline code — findings in these paths route to model:codex
# (the review lane owns its own infrastructure) per ops/WORKFLOW.md:66.
REVIEW_PIPELINE_PREFIXES = (
    '.github/workflows/codex-',
    '.github/scripts/codex_review',
    '.github/scripts/triage_review',
    '.github/scripts/review-fixer',
    '.github/scripts/review-watcher',
    '.github/scripts/parse_finding_comment',
    '.github/scripts/_finding_dedup',
    '.github/scripts/file_hygiene_issue',
    '.github/scripts/file_codex_review_findings',
)


def log(event, **fields):
    """Structured JSON-line logging to stdout (grep-able in workflow logs)."""
    fields['event'] = event
    sys.stdout.write(json.dumps(fields, sort_keys=True) + '\n')
    sys.stdout.flush()


def env_flag(name, default=True):
    raw = os.environ.get(name, '').strip().lower()
    if raw == '':
        return default
    return raw not in ('false', '0', 'no', 'off')


def normalize(text):
    """Lowercase + collapse whitespace + strip trailing punctuation."""
    if not text:
        return ''
    s = str(text).lower()
    s = re.sub(r'\s+', ' ', s).strip()
    s = s.rstrip('.,;:!?')
    return s


def short_hash(text):
    """First 12 hex chars of SHA256 over normalized text."""
    return hashlib.sha256(normalize(text).encode('utf-8')).hexdigest()[:12]


def build_identity(pr_number, finding):
    """Identity dict for file_hygiene_issue.py signature computation.

    Primary anchor: evidence_hash (code snippet — stable across reruns).
    Fallback: title_hash (model prose — drifts; used only when evidence empty).

    Excludes finding.id (model ordinal F001/F002, unstable), line (shifts when
    surrounding code edits), and commit_sha (re-reviews should dedup to same
    Issue, not stack new ones).
    """
    evidence = (finding.get('evidence') or '').strip()
    if evidence:
        anchor_key = 'evidence_hash'
        anchor_val = short_hash(evidence)
    else:
        anchor_key = 'title_hash'
        anchor_val = short_hash(finding.get('title') or '')
    return {
        'check': 'codex-review-finding',
        'pr_number': str(pr_number),
        'rule': (finding.get('rule') or '').strip(),
        'file': (finding.get('file') or '').strip(),
        anchor_key: anchor_val,
    }


def derive_area_label(file_path):
    """First-match-wins prefix/substring lookup. Defaults to area:infra."""
    if not file_path:
        return AREA_DEFAULT
    for prefix, label in AREA_PREFIX_MAP:
        if prefix in file_path:
            return label
    return AREA_DEFAULT


def derive_model_label(file_path):
    """model:codex when the finding is in review-pipeline code (the review
    lane's own infrastructure). model:sonnet otherwise (implementation/fixes).
    """
    if not file_path:
        return 'model:sonnet'
    for p in REVIEW_PIPELINE_PREFIXES:
        if file_path.startswith(p):
            return 'model:codex'
    return 'model:sonnet'


def derive_type_label(finding_type):
    """Map finding.type to an existing repo label. Returns None if unmapped
    (caller will skip rather than creating a new label)."""
    if not finding_type:
        return None
    return TYPE_LABEL_MAP.get(finding_type.strip().lower())


def extract_json_block(body):
    """Find the embedded JSON between <!-- codex-review-report --> markers.
    Returns parsed dict, or None if absent / unparseable.
    """
    if PR_COMMENT_MARKER not in body:
        return None
    start = body.find(REPORT_START)
    end = body.find(REPORT_END)
    if start < 0 or end < 0 or end <= start:
        return None
    block = body[start + len(REPORT_START):end]
    # The helper in review-watcher.js handles the same block shape: find the
    # first { and last } inside. That's robust against a surrounding markdown
    # ```json fence.
    j_start = block.find('{')
    j_end = block.rfind('}')
    if j_start < 0 or j_end < 0 or j_end <= j_start:
        return None
    try:
        return json.loads(block[j_start:j_end + 1])
    except (json.JSONDecodeError, ValueError):
        return None


def should_file(severity, major_enabled):
    """Severity+verdict policy. verdict is already gated to FAIL before this."""
    sev = (severity or '').strip().lower()
    if sev in DEFAULT_SEVERITIES:
        return True
    if sev in OPTIONAL_SEVERITIES and major_enabled:
        return True
    return False


def render_issue_details(finding, pr_number, repo, comment_id, confidence):
    """The 'details' field goes verbatim into the Issue body (after the filer's
    auto-generated Check/Evidence prefix). Includes source comment URL and the
    mandatory ## Build Skills section per CLAUDE.md workflow rules.
    """
    file_path = finding.get('file') or 'unknown'
    line = finding.get('line') or '?'
    snippet = (finding.get('evidence') or '(no snippet)').strip()
    fix_hint = (finding.get('fix_hint') or '(none provided)').strip()
    comment_url = 'https://github.com/{0}/pull/{1}#issuecomment-{2}'.format(
        repo, pr_number, comment_id
    )
    pr_url = 'https://github.com/{0}/pull/{1}'.format(repo, pr_number)
    return (
        '### From Codex PR Review\n\n'
        '- **PR:** [#{pr}]({pr_url})\n'
        '- **Source comment:** [Codex review on #{pr}]({comment_url})\n'
        '- **File:** `{file}` (line {line})\n'
        '- **Verdict:** FAIL (confidence: {conf})\n\n'
        '### Snippet\n\n'
        '```\n{snippet}\n```\n\n'
        '### Fix hint\n\n'
        '{fix}\n\n'
        '### Build Skills\n\n'
        '- `thompson-engineer` — auto-filed Codex findings typically need '
        'repo-wide architecture + GAS pattern awareness to resolve.\n'
        '- `deploy-pipeline` — any fix landing via PR must pass audit-source.sh '
        '+ CI before deploy.\n\n'
        '(Minimum skills per `CLAUDE.md § Workflow — Build Skills (MANDATORY '
        'on every Issue)`. The picking Claude session may add more skills '
        'based on the specific file / module involved.)'
    ).format(
        pr=pr_number, pr_url=pr_url, comment_url=comment_url,
        file=file_path, line=line, conf=(confidence or 'unknown'),
        snippet=snippet, fix=fix_hint,
    )


def build_finding_payload(finding, pr_number, repo, comment_id, confidence):
    """Construct the finding JSON to pipe into file_hygiene_issue.py stdin."""
    severity = (finding.get('severity') or '').strip().lower()
    ftype = (finding.get('type') or '').strip().lower()
    file_path = (finding.get('file') or '').strip()

    title = (finding.get('title') or 'Codex finding').strip()
    identity = build_identity(pr_number, finding)
    area_label = derive_area_label(file_path)
    model_label = derive_model_label(file_path)
    type_label = derive_type_label(ftype)

    extra_labels = [
        'claude:inbox',
        'kind:bug',
        model_label,
        'severity:' + severity,
    ]
    if type_label:
        extra_labels.append(type_label)
    extra_labels.append(area_label)

    return {
        'check': 'codex-review-finding',
        'check_title': 'Codex',
        'title': '{0} (PR #{1})'.format(title, pr_number),
        'identity': identity,
        'evidence': {
            'severity': severity,
            'type': ftype,
            'file': file_path,
            'line': str(finding.get('line') or '?'),
            'rule': (finding.get('rule') or '').strip(),
            'confidence': confidence or 'unknown',
        },
        'details': render_issue_details(finding, pr_number, repo, comment_id, confidence),
        'extra_labels': extra_labels,
    }


def invoke_filer(payload):
    """Pipe payload JSON into file_hygiene_issue.py. Returns (exit_code, stdout, stderr)."""
    here = os.path.dirname(os.path.abspath(__file__))
    script = os.path.join(here, 'file_hygiene_issue.py')
    proc = subprocess.run(
        ['python3', script],
        input=json.dumps(payload),
        capture_output=True,
        text=True,
        encoding='utf-8',
    )
    return proc.returncode, proc.stdout, proc.stderr


def main():
    # 1. Master kill switches.
    if not env_flag('AUTOMATION_ENABLED', default=True):
        log('skip', reason='AUTOMATION_ENABLED=false')
        return 0
    if not env_flag('CODEX_REVIEW_FILER_ENABLED', default=True):
        log('skip', reason='CODEX_REVIEW_FILER_ENABLED=false')
        return 0

    # 2. Author gate — bot-only trust domain.
    author = os.environ.get('COMMENT_AUTHOR', '').strip()
    if author != AUTHOR_REQUIRED:
        log('skip', reason='author-not-bot', author=author)
        return 0

    # 3. Parse the JSON block.
    body = os.environ.get('COMMENT_BODY', '')
    report = extract_json_block(body)
    if report is None:
        log('skip', reason='no-report-block')
        return 0

    # 4. Verdict gate.
    verdict = str(report.get('verdict') or '').strip().upper()
    if verdict != 'FAIL':
        log('skip', reason='verdict-not-fail', verdict=verdict)
        return 0

    findings = report.get('findings') or []
    if not isinstance(findings, list) or not findings:
        log('skip', reason='no-findings', verdict=verdict)
        return 0

    # Required inputs for constructing payloads.
    repo = os.environ.get('REPO') or os.environ.get('GITHUB_REPOSITORY') or ''
    pr_number = os.environ.get('PR_NUMBER', '').strip()
    comment_id = os.environ.get('COMMENT_ID', '').strip() or '0'
    confidence = str(report.get('confidence') or '').strip().lower() or None

    if not repo or not pr_number:
        log('error', reason='missing-required-env', repo=bool(repo), pr=bool(pr_number))
        return 1

    # 5. Severity policy + per-finding file.
    major_enabled = env_flag('CLAUDE_INBOX_MAJOR_ENABLED', default=False)
    filed = 0
    skipped = 0
    errors = 0

    for idx, finding in enumerate(findings):
        if not isinstance(finding, dict):
            log('skip-finding', reason='non-dict', index=idx)
            skipped += 1
            continue

        severity = (finding.get('severity') or '').strip().lower()
        if not should_file(severity, major_enabled):
            log('skip-finding', reason='severity-policy', index=idx,
                severity=severity, major_enabled=major_enabled)
            skipped += 1
            continue

        payload = build_finding_payload(
            finding, pr_number, repo, comment_id, confidence,
        )
        code, stdout, stderr = invoke_filer(payload)
        if code == 0:
            filed += 1
            log('filed', index=idx, severity=severity,
                rule=payload['identity'].get('rule'),
                file=payload['identity'].get('file'),
                labels=payload['extra_labels'])
        else:
            errors += 1
            log('filer-error', index=idx, code=code,
                stderr=(stderr or '').strip()[:500])

    log('done', pr=pr_number, verdict=verdict,
        findings_total=len(findings), filed=filed, skipped=skipped, errors=errors,
        major_enabled=major_enabled)
    return 2 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
