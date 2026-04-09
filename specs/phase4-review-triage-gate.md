# Phase 4: Review Triage Gate

**Owner:** Opus (spec), Code (build), Codex (audit), LT (gate)
**Priority:** P2 — Quality-of-life for CI; does not block any user feature
**Status:** Draft — Pending LT gate
**Scope:** `.github/scripts/triage_review.py` (new), `.github/workflows/codex-pr-review.yml` (edits), `.github/scripts/codex_review.py` (edits)
**Epic:** #107 — PR Orchestration Loop
**Risk:** Low — triage is pre-Codex; medium/full modes are identical to current behavior; skip/light are additive

---

## Problem Statement

Every PR today pays the full Codex review tax: a synchronous OpenAI `gpt-4o` call that
costs ~$0.10–0.30, takes 30–90 seconds, and blocks merge on any FAIL or INCONCLUSIVE
verdict. This is the right trade for risky code changes. It is not the right trade for:

1. **Spec-only PRs.** PR #139 (2026-04-09) was 770 lines of `specs/*.md` — pure
   Markdown, no code. The `gpt-4o` review added zero signal. Spec files go through LT
   gate approval; the Codex review duplicated a gate that already existed.

2. **Generated-file PRs.** Files like `SpellingCatalog.js` are auto-generated and carry
   a `// DO NOT EDIT BY HAND` header. Reviewing them for ES5 compliance or TAB_MAP usage
   is meaningless — the generator controls their content.

3. **Tiny code fixes.** A 10-line typo fix or constant update is structurally low risk.
   Sending 80K chars of context for a 10-line diff wastes tokens and model time.

4. **429 rate-limit blocks on mergeable PRs.** PR #141 (2026-04-09) hit an OpenAI
   HTTP 429 → INCONCLUSIVE verdict → merge blocked. The PR was correct and mergeable.
   The block was a billing artifact of running every PR through the same heavy model.
   Fewer calls to `gpt-4o` reduces the probability of hitting rate limits on critical PRs.

**Impact estimate:** Spec PRs, docs PRs, and generated-file PRs account for approximately
20–30% of all PR volume in this repo. Skipping those saves proportional API costs and
eliminates 429 contention during burst periods (e.g., multi-PR spec sessions).

---

## Source Verification

Grep results run 2026-04-09 on `origin/main`:

```
# codex_review.py constants (lines 51-57):
MAX_DIFF_CHARS = 30000
PER_FILE_CAP = 15000
MAX_CONTEXT_CHARS = 80000
RELATED_CONTEXT_CAP = 30000
MODEL = "gpt-4o"

# codex-pr-review.yml structure:
line 7:  name: Codex PR Review
line 29: lint-gate: (job)
line 51: review: (job, needs: lint-gate)
line 53: name: Codex PR Review

# No triage logic exists today:
grep "pipeline:triage" codex-pr-review.yml  → 0 matches
grep "triage" codex_review.py              → 0 matches

# Scripts directory:
.github/scripts/codex_review.py     ← target for REVIEW_MODE edits
.github/scripts/triage_review.py    ← does not exist yet (new file)
review-fixer.js                     ← uses pipeline:fix-needed (no changes needed)
review-watcher.js                   ← no changes needed

# PR #129 context caps:
PR #129 proposes widening MAX_DIFF_CHARS, MAX_CONTEXT_CHARS etc.
Phase 4 spec assumes #129 is merged before Phase 4 implementation.
If #129 is not merged, medium/full mode caps default to the pre-#129 values above.
```

No divergences from the context provided by the main thread.

---

## Design: Rules-Based Pre-Gate (Design A)

A 100–200 line Python stdlib script (`triage_review.py`) runs **after** the existing
"Build PR diff and file list" step and **before** the "Send to OpenAI gpt-4o" step.
It reads `pr_diff.txt` and `changed_files.txt`, classifies the PR into one of four
modes, and writes the mode to `GITHUB_OUTPUT`. The workflow branches on the mode.

No LLM call, no external dependencies, no pip installs. Pure Python 3 stdlib.

### The Four Modes

| Mode | Trigger conditions | Codex behavior |
|------|--------------------|---------------|
| `skip` | ALL changed files match docs/spec/generated patterns (see below), OR zero-byte diff (binary-only) | No OpenAI call. Workflow posts a skip comment. Label: `pipeline:triage-skipped` |
| `light` | Diff ≤ 30 net lines AND 0 HOT files touched AND ≥ 1 code file touched | Codex runs with `REVIEW_MODE=light`: `gpt-4o-mini`, 1500 max tokens, narrow context caps, short system prompt. Label: `pipeline:triage-light` |
| `medium` | Default — everything not matched by skip/light/full | Codex runs at current defaults. Label: `pipeline:triage-medium` |
| `full` | ANY HOT file touched (see HOT file list below) | Codex runs with `REVIEW_MODE=full`: current defaults + expanded context (same as #129 post-merge caps). Label: `pipeline:triage-full` |

### Skip Conditions (all three must be true together — OR logic across subconditions)

A PR is `skip` if it satisfies **any one** of:

- (a) Every changed file matches one of: `specs/**/*.md`, `docs/**/*.md`, `*.md` (repo
  root only), `*.txt` (repo root only), and no code file (`*.py`, `*.js`, `*.yml`,
  `*.yaml`, `*.gs`, `*.html`, `*.sh`) is present among changed files.
- (b) Every changed file matches `*.generated.*` OR is listed in `.codex-review-skip`
  (repo root, one glob pattern per line, comments with `#`).
- (c) Zero-byte diff (diff file is empty, even if file list is non-empty — binary-only
  PR, e.g., an added PNG or audio file).

If ANY code file is touched alongside a spec/docs file, the PR does NOT get `skip` —
it falls through to `light`/`medium`/`full` depending on size and HOT file presence.

### HOT File List

```python
# triage_review.py — canonical constant. ALSO update .codex-review-always-full if used.
HOT_FILES = [
    "KidsHub.js",
    "KidsHub.gs",
    "DataEngine.js",
    "DataEngine.gs",
    "Code.js",
    "Code.gs",
    "audit-source.sh",
    "CLAUDE.md",
    "tbmSmokeTest.js",
    "tbmSmokeTest.gs",
    "Tbmsmoketest.js",
]

HOT_PATTERNS = [
    ".github/workflows/",
    ".github/scripts/",
]
```

A file is HOT if its basename matches any entry in `HOT_FILES` (case-insensitive) OR
if the file path starts with any prefix in `HOT_PATTERNS`.

**Note:** An optional `.codex-review-always-full` file at repo root (one glob per line)
can extend the HOT list without editing the script. This file is checked at runtime.
If absent, only the constants above apply.

### Precedence

`skip` > `full` > `light` > `medium`

Rationale for each override:
- `skip > full`: A HOT file that also appears in `.codex-review-skip` was explicitly
  allowlisted by LT. Trust the allowlist.
- `full > light`: A HOT-file edit that is also < 30 lines (e.g., a one-liner in
  `audit-source.sh`) is exactly the class of change that has caused incidents. Hot file
  overrides the size shortcut.
- `light > medium`: Small non-hot code changes get the fast path.

### Mode Flow (text diagram)

```
PR opens
  │
  ▼
[lint-gate job: actionlint + py_compile]
  │
  ▼
[Build PR diff and file list]  — pr_diff.txt + changed_files.txt written
  │
  ▼
[Triage review scope]  — triage_review.py reads both files
  │
  ├── mode=skip  ──► Post skip comment, apply pipeline:triage-skipped, exit 0
  │
  ├── mode=full  ──► [Send to OpenAI gpt-4o]  REVIEW_MODE=full
  │                     │
  ├── mode=light ──►    │  (same step, different env)
  │                     │
  └── mode=medium──►    │
                        ▼
               [Post review comment]
               [Apply finding labels]
               [Apply pipeline:triage-* label]
               [Integrity check]
               [Fail on INCONCLUSIVE / FAIL]
```

---

## The Triage Script

### File

`.github/scripts/triage_review.py`

**Header comment** (required per CLAUDE.md workflow safety rules):
```python
# triage_review.py
# Purpose: Classify a PR into skip/light/medium/full before the Codex review call.
# Called by: .github/workflows/codex-pr-review.yml (after "Build PR diff and file list")
# Env vars expected:
#   DIFF_FILE          path to pr_diff.txt (default: pr_diff.txt)
#   CHANGED_FILES_FILE path to changed_files.txt (default: changed_files.txt)
#   SKIP_LIST_FILE     path to .codex-review-skip (default: .codex-review-skip)
#   ALWAYS_FULL_FILE   path to .codex-review-always-full (default: .codex-review-always-full)
#   GITHUB_OUTPUT      path for GitHub Actions output (set by runner)
# Output:
#   Writes mode=skip|light|medium|full and reason=<one-liner> to GITHUB_OUTPUT
#   Writes triage_output.json with full classification details
#   Exit 0 on success (including skip). Exit 1 only on script error.
```

### Inputs

| Input | Source | Notes |
|-------|--------|-------|
| `pr_diff.txt` | Written by "Build PR diff" step | Raw `git diff origin/main...HEAD` output |
| `changed_files.txt` | Written by "Build PR diff" step | One file path per line from `git diff --name-only` |
| `.codex-review-skip` | Repo root (optional) | Glob patterns — files to always skip Codex for |
| `.codex-review-always-full` | Repo root (optional) | Glob patterns — files to always review in full mode |

### Outputs

| Output | Format | Written to |
|--------|--------|-----------|
| `mode` | `skip\|light\|medium\|full` | `$GITHUB_OUTPUT` |
| `reason` | One-line string | `$GITHUB_OUTPUT` |
| `triage_output.json` | JSON object (see below) | Working directory |

`triage_output.json` shape:
```json
{
  "mode": "full",
  "reason": "HOT file touched: .github/workflows/codex-pr-review.yml",
  "hot_files_touched": [".github/workflows/codex-pr-review.yml"],
  "diff_lines_added": 12,
  "diff_lines_removed": 3,
  "diff_net_lines": 15,
  "diff_bytes": 4096,
  "files": ["specs/foo.md", ".github/workflows/codex-pr-review.yml"],
  "skip_list_patterns": [],
  "always_full_patterns": [],
  "generated_files": []
}
```

### Diff Line Counting

Diff size is counted as `added_lines + removed_lines` from the diff file directly
(count lines starting with `+` that are not `+++`, plus lines starting with `-` that
are not `---`). This is consistent with what `git diff --numstat` would produce and
does not require a subprocess call.

The `light` threshold applies to net diff lines: `added + removed <= 30`.

### Generated File Detection

A file is considered "generated" if EITHER:
- Its filename matches `*.generated.*` (e.g., `vocab.generated.js`)
- Its first 20 lines (read from the diff `+++ b/` block headers, then checked in the
  repo) contain `// DO NOT EDIT BY HAND` or `# DO NOT EDIT BY HAND`

For the workflow context, the script reads up to the first 20 lines of each changed
file from the filesystem (the checkout is available). If the file is new (not in the
working tree), skip the content check and rely only on the filename pattern.

### Full Python Implementation

```python
#!/usr/bin/env python3
# triage_review.py
# Purpose: Classify a PR into skip/light/medium/full before the Codex review call.
# Called by: .github/workflows/codex-pr-review.yml (after "Build PR diff and file list")
# Env vars expected:
#   DIFF_FILE          path to pr_diff.txt (default: pr_diff.txt)
#   CHANGED_FILES_FILE path to changed_files.txt (default: changed_files.txt)
#   SKIP_LIST_FILE     path to .codex-review-skip (default: .codex-review-skip)
#   ALWAYS_FULL_FILE   path to .codex-review-always-full (default: .codex-review-always-full)
#   GITHUB_OUTPUT      path for GitHub Actions output (set by runner)
# Output:
#   Writes mode=skip|light|medium|full and reason=<one-liner> to GITHUB_OUTPUT
#   Writes triage_output.json with full classification details
#   Exit 0 on success (including skip). Exit 1 only on script error.

import os
import sys
import json
import fnmatch

# ---------------------------------------------------------------------------
# HOT file constants — ALSO document in CLAUDE.md "Hot file lock" section (Phase 4.1)
# ---------------------------------------------------------------------------
HOT_FILES = [
    "kidshub.js",
    "kidshub.gs",
    "dataengine.js",
    "dataengine.gs",
    "code.js",
    "code.gs",
    "audit-source.sh",
    "claude.md",
    "tbmsmoke.js",     # covers tbmSmokeTest.js, Tbmsmoketest.js etc.
    "tbmsmoketest.js",
    "tbmsmoketest.gs",
]

HOT_PATTERNS = [
    ".github/workflows/",
    ".github/scripts/",
]

# Docs/spec patterns that qualify a file for skip mode
DOCS_PATTERNS = [
    "specs/*.md",
    "specs/**/*.md",
    "docs/*.md",
    "docs/**/*.md",
    "*.md",
    "*.txt",
]

# Code file extensions — if any changed file has one of these, skip mode is blocked
CODE_EXTENSIONS = {
    ".py", ".js", ".ts", ".yml", ".yaml", ".gs", ".html", ".sh", ".json"
}


def load_pattern_file(path):
    """Read a pattern file (one glob per line, # comments). Returns list of patterns."""
    if not os.path.isfile(path):
        return []
    patterns = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                patterns.append(line)
    return patterns


def is_hot_file(filepath, extra_full_patterns):
    """Return True if filepath matches HOT_FILES, HOT_PATTERNS, or extra_full_patterns."""
    basename = os.path.basename(filepath).lower()
    # Basename match against HOT_FILES
    for hot in HOT_FILES:
        if basename == hot.lower():
            return True
    # Prefix match against HOT_PATTERNS
    norm = filepath.replace("\\", "/")
    for pattern in HOT_PATTERNS:
        if norm.startswith(pattern) or ("/" + pattern.lstrip("/")) in norm:
            return True
    # Extra always-full patterns
    for pattern in extra_full_patterns:
        if fnmatch.fnmatch(norm, pattern) or fnmatch.fnmatch(basename, pattern):
            return True
    return False


def is_docs_file(filepath):
    """Return True if filepath matches docs/spec/text patterns."""
    norm = filepath.replace("\\", "/")
    basename = os.path.basename(norm)
    for pattern in DOCS_PATTERNS:
        if fnmatch.fnmatch(norm, pattern) or fnmatch.fnmatch(basename, pattern):
            return True
    return False


def is_code_file(filepath):
    """Return True if the file has a code extension."""
    ext = os.path.splitext(filepath)[1].lower()
    return ext in CODE_EXTENSIONS


def is_generated_file(filepath, skip_patterns):
    """Return True if the file is generated (by name or header comment)."""
    basename = os.path.basename(filepath)
    # Filename pattern: *.generated.*
    parts = basename.split(".")
    if len(parts) >= 3 and "generated" in [p.lower() for p in parts]:
        return True
    # Explicit skip-list match
    norm = filepath.replace("\\", "/")
    for pattern in skip_patterns:
        if fnmatch.fnmatch(norm, pattern) or fnmatch.fnmatch(basename, pattern):
            return True
    # Content check: first 20 lines of the file
    if os.path.isfile(filepath):
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                for i, line in enumerate(f):
                    if i >= 20:
                        break
                    if "DO NOT EDIT BY HAND" in line:
                        return True
        except OSError:
            pass
    return False


def count_diff_lines(diff_path):
    """Count added and removed lines from a unified diff file."""
    added = 0
    removed = 0
    if not os.path.isfile(diff_path):
        return 0, 0
    with open(diff_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if line.startswith("+") and not line.startswith("+++"):
                added += 1
            elif line.startswith("-") and not line.startswith("---"):
                removed += 1
    return added, removed


def write_github_output(key, value):
    """Write a key=value pair to GITHUB_OUTPUT."""
    output_path = os.environ.get("GITHUB_OUTPUT", "")
    if output_path:
        with open(output_path, "a", encoding="utf-8") as f:
            f.write("%s=%s\n" % (key, value))
    else:
        # Local testing fallback
        print("OUTPUT: %s=%s" % (key, value))


def main():
    diff_file = os.environ.get("DIFF_FILE", "pr_diff.txt")
    changed_files_file = os.environ.get("CHANGED_FILES_FILE", "changed_files.txt")
    skip_list_file = os.environ.get("SKIP_LIST_FILE", ".codex-review-skip")
    always_full_file = os.environ.get("ALWAYS_FULL_FILE", ".codex-review-always-full")

    # Load optional pattern files
    skip_patterns = load_pattern_file(skip_list_file)
    always_full_patterns = load_pattern_file(always_full_file)

    # Read changed files
    if not os.path.isfile(changed_files_file):
        print("ERROR: changed_files.txt not found", file=sys.stderr)
        sys.exit(1)
    with open(changed_files_file, "r", encoding="utf-8") as f:
        files = [line.strip() for line in f if line.strip()]

    # Read diff metadata
    diff_bytes = os.path.getsize(diff_file) if os.path.isfile(diff_file) else 0
    added_lines, removed_lines = count_diff_lines(diff_file)
    net_lines = added_lines + removed_lines

    # Classify each file
    hot_files_touched = []
    generated_files = []
    docs_files = []
    code_files_present = []

    for fp in files:
        if is_hot_file(fp, always_full_patterns):
            hot_files_touched.append(fp)
        if is_generated_file(fp, skip_patterns):
            generated_files.append(fp)
        if is_docs_file(fp):
            docs_files.append(fp)
        if is_code_file(fp):
            code_files_present.append(fp)

    # ---------------------------------------------------------------------------
    # Mode classification — precedence: skip > full > light > medium
    # ---------------------------------------------------------------------------
    mode = "medium"
    reason = "default: no specific condition matched"

    # Determine if all files are docs/spec/generated (skip candidates)
    non_skip_files = [
        fp for fp in files
        if not is_docs_file(fp) and not is_generated_file(fp, skip_patterns)
    ]
    all_non_code = len(code_files_present) == 0
    zero_diff = diff_bytes == 0

    # skip: zero-byte diff (binary-only)
    if zero_diff and len(files) > 0:
        mode = "skip"
        reason = "binary-only PR: zero-byte diff with %d changed file(s)" % len(files)

    # skip: all files are docs/spec/generated AND no code files
    elif len(non_skip_files) == 0 and all_non_code and len(files) > 0:
        if generated_files:
            reason = "all changed files are generated or in skip list"
        else:
            reason = "all changed files are docs/specs (no code files touched)"
        mode = "skip"

    # full: any HOT file touched (overrides light)
    elif hot_files_touched:
        mode = "full"
        reason = "HOT file touched: %s" % ", ".join(hot_files_touched[:3])
        if len(hot_files_touched) > 3:
            reason += " (+%d more)" % (len(hot_files_touched) - 3)

    # light: small diff, no hot files, at least one code file
    elif net_lines <= 30 and len(hot_files_touched) == 0 and len(code_files_present) >= 1:
        mode = "light"
        reason = "small diff (%d net lines), no HOT files, code files present" % net_lines

    # medium: everything else
    else:
        mode = "medium"
        reason = "default: %d net lines, %d code files, 0 HOT files" % (
            net_lines, len(code_files_present)
        )

    # ---------------------------------------------------------------------------
    # Write outputs
    # ---------------------------------------------------------------------------
    triage_output = {
        "mode": mode,
        "reason": reason,
        "hot_files_touched": hot_files_touched,
        "diff_lines_added": added_lines,
        "diff_lines_removed": removed_lines,
        "diff_net_lines": net_lines,
        "diff_bytes": diff_bytes,
        "files": files,
        "skip_list_patterns": skip_patterns,
        "always_full_patterns": always_full_patterns,
        "generated_files": generated_files,
    }

    with open("triage_output.json", "w", encoding="utf-8") as f:
        json.dump(triage_output, f, indent=2)

    write_github_output("mode", mode)
    write_github_output("reason", reason)

    print("Triage result: mode=%s | %s" % (mode, reason))
    print("  files=%d, hot=%d, net_lines=%d, diff_bytes=%d" % (
        len(files), len(hot_files_touched), net_lines, diff_bytes
    ))
    sys.exit(0)


if __name__ == "__main__":
    main()
```

---

## Workflow Edits

### `.github/workflows/codex-pr-review.yml`

#### Step 1: Add triage step after "Build PR diff and file list"

**Insert** after the existing `diff` step (line ~98), before "Send to OpenAI gpt-4o":

```yaml
      - name: Triage review scope
        if: steps.override.outputs.overridden != 'true'
        id: triage
        env:
          DIFF_FILE: pr_diff.txt
          CHANGED_FILES_FILE: changed_files.txt
        run: python3 .github/scripts/triage_review.py

      - name: Upload triage artifact
        if: always() && steps.override.outputs.overridden != 'true'
        uses: actions/upload-artifact@v4
        with:
          name: triage-output
          path: triage_output.json
          retention-days: 30
          if-no-files-found: ignore
```

#### Step 2: Add skip-mode comment step

**Insert** after the triage step:

```yaml
      - name: Post skip comment
        if: steps.triage.outputs.mode == 'skip' && github.event_name == 'pull_request' && steps.override.outputs.overridden != 'true'
        uses: actions/github-script@v7
        with:
          script: |
            const reason = '${{ steps.triage.outputs.reason }}';
            const body = [
              '<!-- codex-pr-review -->',
              '## Codex PR Review — Skipped',
              '',
              '**Verdict:** SKIPPED',
              '',
              'Codex review was skipped because: ' + reason + '.',
              '',
              'No OpenAI API call was made. This PR does not contain code changes',
              'that require automated code review.',
              '',
              '**Files Reviewed:** (none — triage-skipped)',
              '',
              '_If this skip is incorrect, add a code file to trigger a real review,',
              'or remove the file from `.codex-review-skip`._',
            ].join('\n');

            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              per_page: 100,
            });
            const existing = comments.find(c =>
              c.user.type === 'Bot' && c.body.includes('<!-- codex-pr-review -->')
            );
            if (existing) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: existing.id,
                body,
              });
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body,
              });
            }
```

#### Step 3: Add triage label step

**Insert** after the skip comment step (runs for all modes including skip):

```yaml
      - name: Apply triage label
        if: github.event_name == 'pull_request' && steps.override.outputs.overridden != 'true' && steps.triage.outputs.mode != ''
        uses: actions/github-script@v7
        with:
          script: |
            const mode = '${{ steps.triage.outputs.mode }}';
            const labelMap = {
              'skip':   'pipeline:triage-skipped',
              'light':  'pipeline:triage-light',
              'medium': 'pipeline:triage-medium',
              'full':   'pipeline:triage-full',
            };
            const newLabel = labelMap[mode];
            if (!newLabel) return;

            // Remove any existing pipeline:triage-* label
            const { data: currentLabels } = await github.rest.issues.listLabelsOnIssue({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });
            for (const label of currentLabels) {
              if (label.name.startsWith('pipeline:triage-')) {
                try {
                  await github.rest.issues.removeLabel({
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    issue_number: context.issue.number,
                    name: label.name,
                  });
                } catch (e) {}
              }
            }

            // Add the new triage label
            try {
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                labels: [newLabel],
              });
            } catch (e) {
              core.warning('Could not apply triage label: ' + e.message);
            }
```

#### Step 4: Gate OpenAI call on mode

**Modify** the "Send to OpenAI gpt-4o" step to:
1. Skip when `mode == 'skip'`
2. Pass `REVIEW_MODE` to `codex_review.py`

```yaml
      - name: Send to OpenAI gpt-4o
        if: steps.override.outputs.overridden != 'true' && steps.triage.outputs.mode != 'skip'
        id: review
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          DIFF_FILE: pr_diff.txt
          CHANGED_FILES_FILE: changed_files.txt
          EMPTY_DIFF: ${{ steps.diff.outputs.empty_diff }}
          REVIEW_MODE: ${{ steps.triage.outputs.mode }}
        run: python3 .github/scripts/codex_review.py
```

#### Step 5: Update downstream steps to skip on `skip` mode

All existing steps that post the review comment, apply finding labels, and run the
integrity check already have `if: always() && ...` guards. Add the additional
condition `&& steps.triage.outputs.mode != 'skip'` to each. The skip-mode comment
step (Step 2 above) handles the comment for `skip` PRs — the existing comment step
must not double-post.

The `Fail check on INCONCLUSIVE verdict` and `Fail check on critical violations` steps
are already gated on `steps.review.outputs.verdict` — if the review step was skipped,
these steps won't fire (skipped step outputs are empty strings, not 'INCONCLUSIVE').
No change needed.

---

## `codex_review.py` Edits

### Mode-Based Configuration

At the top of `codex_review.py`, after the existing constants (around line 55), add:

```python
# ---------------------------------------------------------------------------
# Review mode — set by triage_review.py via REVIEW_MODE env var
# ---------------------------------------------------------------------------
REVIEW_MODE = os.environ.get("REVIEW_MODE", "medium")

MODE_CONFIG = {
    "light": {
        "model":            "gpt-4o-mini",
        "max_tokens":       1500,
        "max_diff_chars":   5000,
        "per_file_cap":     3000,
        "max_context_chars": 15000,
        "include_related":  False,
        "system_prompt_override": (
            "You are a code reviewer for a Google Apps Script project. "
            "Review this small diff for correctness, ES5 compliance (no arrow functions, "
            "let/const, template literals, or other ES6+ syntax in .html files), and "
            "correct TAB_MAP usage (no hardcoded sheet names). "
            "Be concise. Only flag actual problems."
        ),
    },
    "medium": {
        "model":            MODEL,           # gpt-4o (or post-#129 default)
        "max_tokens":       4096,
        "max_diff_chars":   MAX_DIFF_CHARS,
        "per_file_cap":     PER_FILE_CAP,
        "max_context_chars": MAX_CONTEXT_CHARS,
        "include_related":  True,
        "system_prompt_override": None,      # use existing system prompt
    },
    "full": {
        "model":            MODEL,
        "max_tokens":       4096,
        "max_diff_chars":   MAX_DIFF_CHARS,
        "per_file_cap":     PER_FILE_CAP,
        "max_context_chars": MAX_CONTEXT_CHARS,
        "include_related":  True,
        "system_prompt_override": None,      # same as medium; reserved for Phase 5
    },
}

def get_mode_config():
    """Return the config dict for the current REVIEW_MODE."""
    return MODE_CONFIG.get(REVIEW_MODE, MODE_CONFIG["medium"])
```

### Branch Points

1. **Model selection** — where the `openai.chat.completions.create()` call is made
   (currently passes `MODEL`): replace with `cfg["model"]` where `cfg = get_mode_config()`.

2. **Context caps** — replace the module-level constant references inside the
   `build_review_context()` function:
   - `MAX_DIFF_CHARS` → `cfg["max_diff_chars"]`
   - `PER_FILE_CAP` → `cfg["per_file_cap"]`
   - `MAX_CONTEXT_CHARS` → `cfg["max_context_chars"]`

3. **Related files** — the related-caller/consumer context block (around line 290):
   wrap with `if cfg["include_related"]:`.

4. **System prompt** — if `cfg["system_prompt_override"]` is not None, use it instead
   of the existing system prompt string.

5. **max_tokens** — pass `cfg["max_tokens"]` to the OpenAI call.

All output formats (`review_comment.md`, `review-report.json`, `verdict=`) remain
identical across all modes. Downstream watcher/fixer logic is unchanged.

---

## New Labels

Create these labels in the GitHub repo (Settings > Labels or via `gh label create`):

| Label | Color | Description |
|-------|-------|-------------|
| `pipeline:triage-skipped` | `#E5E7EB` | Codex review skipped — docs-only or generated file |
| `pipeline:triage-light` | `#DBEAFE` | Codex review ran in light mode — small diff, low risk |
| `pipeline:triage-medium` | `#FEF3C7` | Codex review ran in normal mode — default |
| `pipeline:triage-full` | `#FEE2E2` | Codex review ran in full mode — HOT file touched |

```bash
# LT runs these after the spec PR merges:
gh label create "pipeline:triage-skipped" --color "E5E7EB" --description "Codex review skipped — docs-only or generated file"
gh label create "pipeline:triage-light"   --color "DBEAFE" --description "Codex review ran in light mode — small diff, low risk"
gh label create "pipeline:triage-medium"  --color "FEF3C7" --description "Codex review ran in normal mode — default"
gh label create "pipeline:triage-full"    --color "FEE2E2" --description "Codex review ran in full mode — HOT file touched"
```

---

## Test Plan

### Test Case 1: PR #139 — should be `skip`

PR #139 is 770 lines of `specs/jj-completion-contract.md` (a spec file). No code files.

Expected triage:
- `files`: `["specs/jj-completion-contract.md"]`
- `is_docs_file()` → True for all files
- `code_files_present`: empty
- `non_skip_files`: empty
- `mode` → `skip`
- `reason`: `"all changed files are docs/specs (no code files touched)"`

Verification: Run `python3 .github/scripts/triage_review.py` locally with
`changed_files.txt` containing `specs/jj-completion-contract.md` and an empty diff.
Assert `triage_output.json` has `mode: "skip"`.

### Test Case 2: PR #141 — should be `full`

PR #141 touched `.github/workflows/codex-pr-review.yml` (a HOT pattern match).

Expected triage:
- `.github/workflows/` prefix → HOT match
- `mode` → `full`
- `reason`: `"HOT file touched: .github/workflows/codex-pr-review.yml"`

Verification: Run triage locally with `changed_files.txt` containing
`.github/workflows/codex-pr-review.yml`. Assert `mode: "full"` in output.

### Test Case 3: Hypothetical 10-line bug fix — should be `light`

A hypothetical PR modifying `AlertEngine.gs`: 6 lines added, 4 lines removed.
No HOT files touched.

Expected triage:
- `is_code_file("AlertEngine.gs")` → True (`.gs` extension)
- `is_hot_file("AlertEngine.gs", [])` → False (not in HOT_FILES)
- `net_lines = 10 ≤ 30`
- `mode` → `light`
- `reason`: `"small diff (10 net lines), no HOT files, code files present"`

Verification: Run triage locally with a synthetic `pr_diff.txt` of 10 lines and
`changed_files.txt` containing `AlertEngine.gs`. Assert `mode: "light"`.

### Test Case 4: Small edit to `Code.gs` — should be `full` (HOT override)

Even if the diff is 5 lines, `Code.gs` is in `HOT_FILES`.

Expected triage:
- `is_hot_file("Code.gs", [])` → True
- `mode` → `full` (HOT overrides light)

Verification: Synthetic `pr_diff.txt` with 5 lines, `changed_files.txt` with `Code.gs`.
Assert `mode: "full"`.

### Test Case 5: Mixed spec + code PR — should NOT be `skip`

A PR that touches both `specs/foo.md` and `AlertEngine.gs`.

Expected triage:
- `code_files_present`: `["AlertEngine.gs"]` (non-empty)
- `mode` is NOT `skip` (code file present blocks skip)
- `net_lines` determines `light` vs `medium`

Verification: `changed_files.txt` with both files. Assert `mode != "skip"`.

### Integration: verify skip mode posts comment without calling OpenAI

On a real spec-only PR (e.g., this spec's own PR), observe:
1. Triage step in CI: mode=skip in logs
2. "Send to OpenAI gpt-4o" step: skipped (gray in GitHub Actions UI)
3. PR comment: contains `<!-- codex-pr-review -->` and `Verdict: SKIPPED`
4. Label: `pipeline:triage-skipped` applied
5. No OpenAI usage appears in billing dashboard for that run

### Integration: verify light mode uses gpt-4o-mini

On a small non-hot code PR (< 30 net lines):
1. Triage step: mode=light
2. `codex_review.py` logs: model=`gpt-4o-mini` (add a `print("Using model:", cfg["model"])`
   statement in the implementation)
3. Review comment posts with `Verdict: PASS|FAIL|INCONCLUSIVE`

---

## Gate 4 Manifest

```bash
# triage_review.py exists
grep -n "def main" .github/scripts/triage_review.py
# → expected: function definition

# HOT_FILES constant present
grep -n "HOT_FILES" .github/scripts/triage_review.py
# → expected: list constant with KidsHub.js, Code.js, etc.

# HOT_PATTERNS constant present
grep -n "HOT_PATTERNS" .github/scripts/triage_review.py
# → expected: list with .github/workflows/, .github/scripts/

# REVIEW_MODE read in codex_review.py
grep -n "REVIEW_MODE" .github/scripts/codex_review.py
# → expected: os.environ.get("REVIEW_MODE", "medium")

# MODE_CONFIG dict present in codex_review.py
grep -n "MODE_CONFIG\|get_mode_config" .github/scripts/codex_review.py
# → expected: dict definition and getter function

# Triage step present in workflow
grep -n "Triage review scope\|triage_review.py" .github/workflows/codex-pr-review.yml
# → expected: step name and script call

# Skip condition on OpenAI step
grep -n "triage.outputs.mode != 'skip'" .github/workflows/codex-pr-review.yml
# → expected: if condition on "Send to OpenAI" step

# REVIEW_MODE passed to codex_review.py in workflow
grep -n "REVIEW_MODE:" .github/workflows/codex-pr-review.yml
# → expected: env var referencing steps.triage.outputs.mode

# Skip comment step present
grep -n "Post skip comment" .github/workflows/codex-pr-review.yml
# → expected: step name

# Apply triage label step present
grep -n "Apply triage label\|pipeline:triage" .github/workflows/codex-pr-review.yml
# → expected: label step and label name references

# triage_output.json written by script
grep -n "triage_output.json" .github/scripts/triage_review.py
# → expected: json.dump call

# gpt-4o-mini in MODE_CONFIG
grep -n "gpt-4o-mini" .github/scripts/codex_review.py
# → expected: in "light" mode config

# Python compile check passes (no syntax errors)
python3 -m py_compile .github/scripts/triage_review.py
# → expected: exit 0, no output
```

---

## Gate 5 Feature Verification Checklist

| # | Check | Pass condition |
|---|-------|----------------|
| 1 | Triage script exists and compiles | `python3 -m py_compile .github/scripts/triage_review.py` exits 0 |
| 2 | Skip mode: docs-only PR | Running triage with `changed_files.txt = specs/foo.md` → `mode: skip` in `triage_output.json` |
| 3 | Skip mode: zero-byte diff | Running triage with empty `pr_diff.txt` and non-empty `changed_files.txt` → `mode: skip` |
| 4 | Skip mode: generated file | File named `vocab.generated.js` in `changed_files.txt` (no other code files) → `mode: skip` |
| 5 | Full mode: HOT file basename | `Code.gs` in `changed_files.txt` → `mode: full` regardless of diff size |
| 6 | Full mode: HOT pattern prefix | `.github/workflows/anything.yml` in `changed_files.txt` → `mode: full` |
| 7 | Full overrides light | 5-line diff + `Code.gs` → `mode: full` (not `light`) |
| 8 | Light mode: small code diff | `AlertEngine.gs` + 10 net lines → `mode: light` |
| 9 | Medium mode: default | `SparkleLearning.html` + 50 net lines + no HOT files → `mode: medium` |
| 10 | Mixed PR: not skip | `specs/foo.md` + `AlertEngine.gs` → `mode != skip` |
| 11 | Skip mode: no OpenAI call | On a real CI run for a docs-only PR: "Send to OpenAI" step shows as skipped in GitHub Actions UI; no usage in billing |
| 12 | Skip mode: comment posts | PR comment appears with `<!-- codex-pr-review -->` marker and `Verdict: SKIPPED` |
| 13 | Light mode: uses gpt-4o-mini | Review log confirms `model=gpt-4o-mini` for a < 30-line non-HOT code PR |
| 14 | Triage label applied | After triage step, exactly one `pipeline:triage-*` label on the PR matching the classified mode |
| 15 | Existing PASS/FAIL flow unchanged | A medium-mode PR still gets full gpt-4o review, posts PASS/FAIL comment, and blocks merge on FAIL |

---

## Rollout Plan

### Phase 4.0 — Implementation (this spec)

Depends on PR #129 merging first (same hot files: `codex_review.py`,
`codex-pr-review.yml`). Implementation PR opens only after #129 closes.

Changes:
- New file: `.github/scripts/triage_review.py`
- Edit: `.github/workflows/codex-pr-review.yml` (triage step, skip step, label step, mode gate)
- Edit: `.github/scripts/codex_review.py` (`REVIEW_MODE`, `MODE_CONFIG`, branch points)

### Phase 4.1 — CLAUDE.md Update (docs)

After Phase 4.0 ships, a small follow-up PR updates CLAUDE.md:
- Add the HOT file list to the "Hot file lock" section so it's documented in two places
  (the script and the CLAUDE.md) and is findable by future engineers during onboarding.
- Note that `.codex-review-skip` and `.codex-review-always-full` are optional repo-root
  files for extending the triage rules without editing the script.

### Phase 4.2 — Triage mode feeds Phase 5 auto-merge gate (future)

Phase 5 (new epic, not yet specced) may implement an auto-merge gate. A natural input
is the triage mode: auto-merge could require `pipeline:triage-full` + `Verdict: PASS`
for any PR touching HOT files. The `pipeline:triage-*` labels created here provide
that signal without any additional API calls.

---

## Trade-offs Considered

### Design A — Rules-based pre-gate (ADOPTED)

100–200 line Python stdlib script. Runs in < 1 second. No API calls, no pip installs.
Rules are explicit, auditable, and fast.

**Pros:** Zero added latency, zero added cost, zero added failure modes. The triage
script cannot cause a 429. If the script crashes (exit 1), the workflow fails fast
before wasting an OpenAI call.

**Cons:** Rules are blunt. A 35-line change to `AlertEngine.gs` gets `medium` even
if it's actually low-risk. No semantic understanding of what was changed.

### Design B — LLM pre-triage (REJECTED)

Send a mini-prompt to `gpt-4o-mini` first to decide whether to run the full review.

**Rejected because:** This adds a second API call. Every PR now makes at least one
OpenAI call, which partially defeats the purpose. The 429 problem is reduced, not
eliminated. The triage LLM can also be wrong about whether a PR needs full review.
For a CI gate, false negatives (skipping a review that should have run) are worse
than false positives (running a review that wasn't needed). Rules-based triage is
conservative and predictable.

### Design C — Scoped review (file-region targeting, REJECTED for Phase 4)

Modify `codex_review.py` to send only the changed functions/methods to the LLM
rather than the full file context. Would reduce token usage on medium/full PRs.

**Rejected for Phase 4 because:** Parsing function boundaries from a unified diff is
non-trivial. It belongs in a dedicated phase (Phase 4.5 or Phase 5) after the triage
gate has run for a few weeks and we can measure where the remaining token spend is
concentrated. Phase 4 is specifically about the "do we call OpenAI at all" decision;
Design C is about "how much context do we send once we decide yes."

---

## Open Questions for LT

### Q1: HOT file list — script constant vs shared config file

**The question:** Should the HOT file list live only inside `triage_review.py`, or
should it be a shared config file (e.g., `.github/hot-files.txt`) that both
`triage_review.py` and `audit-source.sh` can read?

**The tension:** Single source of truth (one `.txt` file) vs two small files that are
easy to audit independently. Today, `audit-source.sh` has its own internal list of
files to check for version consistency. If that list and the HOT file list drift, a
file could be considered a HOT file by the triage script but not get version-checked
by the audit.

**Recommendation:** Start with the constant in `triage_review.py` for Phase 4.0 (simpler,
easier to review). Phase 4.1 adds the CLAUDE.md documentation. A future hygiene task
unifies the lists if the drift problem actually materializes. Mark as tech debt.

### Q2: `light` mode model choice — `gpt-4o-mini` universally, or `gpt-4o` for HTML?

**The question:** The spec assigns `gpt-4o-mini` to all `light` mode PRs. But
`gpt-4o-mini` may have lower accuracy on ES5 compliance checks for HTML files (the
Fire Stick concern is high-stakes — a missed arrow function silently breaks the tablet
surface). Should HTML-only small PRs use `gpt-4o` instead?

**Recommendation:** Use `gpt-4o-mini` universally for light mode in Phase 4.0. After
2 weeks of data, check the rate of `light`-mode PRs that had ES5 violations caught
by a subsequent `medium`/`full` review or by the smoke test. If the false-negative
rate on ES5 is > 0, escalate HTML files to `medium` mode regardless of diff size.
Track this in the Trust Backlog.

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| PR #129 (context cap widening) | In flight | Phase 4.0 implementation waits for #129 to merge. Same hot files. |
| Epic #107 Phase 3 (loop ceiling) | Not built | Independent of Phase 4. Both can ship in either order. |
| Labels `pipeline:triage-*` | Not yet created | LT creates via `gh label create` after spec PR merges. |
| `.codex-review-skip` file | Optional | Create only if generated-file skip is needed before implementation. |

---

*Spec authored 2026-04-09. Implementation tracking: see linked Issue.*
