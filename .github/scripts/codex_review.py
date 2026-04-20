#!/usr/bin/env python3
"""
Codex PR Review v3 — structured review with hunk-context strategy.

Changes from v2:
  - Hunk-context: sends diff hunks + ±50 lines instead of full files
  - Truncation suppresses findings entirely (no false positives)
  - Pre-publish validator cross-checks syntax findings against actual files

Changes from v1:
  - Sends full diff + full changed file contents (not truncated 12k diff)
  - Returns structured JSON findings (not freeform markdown)
  - Machine-readable review-report.json for fix agent consumption
  - Human-readable review_comment.md with embedded JSON report

Called by: .github/workflows/codex-pr-review.yml
Env vars expected:
  OPENAI_API_KEY        — OpenAI API key (required)
  DIFF_FILE             — path to full PR diff (default: pr_diff.txt)
  CHANGED_FILES_FILE    — path to newline-delimited list of changed files (default: changed_files.txt)
  EMPTY_DIFF            — "true" if diff is empty but files changed (default: "false")
  GITHUB_OUTPUT         — GitHub Actions output file path

Outputs:
  review_comment.md     — formatted PR comment with embedded JSON report
  review-report.json    — structured findings (uploaded as artifact)
  codex_response.json   — raw API response (debugging)
  GITHUB_OUTPUT: verdict=PASS|FAIL|INCONCLUSIVE

Verdict rules:
  - OPENAI_API_KEY missing          -> INCONCLUSIVE
  - EMPTY_DIFF=true                 -> INCONCLUSIVE
  - API / auth / rate-limit error   -> INCONCLUSIVE
  - Response not valid JSON         -> INCONCLUSIVE
  - Missing required fields         -> INCONCLUSIVE
  - Rubber-stamp phrases detected   -> INCONCLUSIVE
  - Explicit verdict FAIL + P1 findings -> FAIL
  - Explicit verdict PASS + files_reviewed -> PASS
"""

import glob as _glob
import json
import os
import re as _re
import subprocess
import sys
import time
import urllib.request
import urllib.error

# ── markers ──────────────────────────────────────────────────────────
COMMENT_MARKER = "<!-- codex-pr-review -->"
REPORT_JSON_START = "<!-- codex-review-report -->"
REPORT_JSON_END = "<!-- /codex-review-report -->"

# ── context limits ───────────────────────────────────────────────────
MAX_DIFF_CHARS = 80000       # cap raw diff (2026-04-20: bumped from 40000 to reduce truncation-triggered INCONCLUSIVEs on doc-heavy and multi-file PRs; stays safely within gpt-4o 128K context budget given other sub-caps below)
PER_FILE_CAP = 30000         # cap per changed file
MAX_CONTEXT_CHARS = 140000   # cap changed-file context
RELATED_CONTEXT_CAP = 40000  # additional budget for caller/consumer context

# ── model config ─────────────────────────────────────────────────────
MODEL = "gpt-4o"
MAX_TOKENS = 4000
TEMPERATURE = 0

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

# ── system prompt ────────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "You are a senior code reviewer for TBM (TillerBudgetMaster), a Google Apps Script "
    "+ HtmlService household finance and kids-chore system.\n\n"
    "You receive the full PR diff AND the full content of each changed file.\n\n"

    "ARCHITECTURE:\n"
    "- .gs/.js files run on GAS V8 runtime — modern JS is OK in these files\n"
    "- .html files run in Fully Kiosk Browser on Fire Stick tablets (Android WebView) — ES5 ONLY\n"
    "- TAB_MAP in DataEngine.gs maps logical names to sheet tabs (which may have emoji prefixes)\n"
    "- All .gs files share one global scope — SSID, TAB_MAP, etc. are available everywhere\n"
    "- google.script.run is the client-to-server bridge used in HTML files\n"
    "- SSID is the spreadsheet ID constant; sheets are opened via SpreadsheetApp.openById(SSID)\n\n"

    "RELATED FILES:\n"
    "You may also receive RELATED FILES that were NOT changed but are callers,\n"
    "consumers, or siblings of the changed files. Use these to verify WIRING:\n"
    "- Does a script match its workflow caller's expectations?\n"
    "- Do HTML files properly call Safe functions defined in changed server files?\n"
    "- Do pipeline scripts (watcher, fixer, codex_review) consume each other's output?\n"
    "- Are new routes registered in Code.js for new HTML files?\n"
    "- When a script writes structured output, does the consumer parse it correctly?\n\n"

    "P1 — CRITICAL (verdict MUST be FAIL if any found):\n"
    "1. Hardcoded sheet names with emoji prefixes — must use TAB_MAP from DataEngine.gs\n"
    "2. SpreadsheetApp.getActiveSpreadsheet() — must use openById(SSID)\n"
    "3. lock.tryLock() — must use waitLock(30000)\n"
    "4. ES6+ syntax in .html files: let, const, =>, template literals with backticks, "
    "??, ?., async/await, destructuring, .includes(), .find(), for...of, "
    "Object.entries(), Object.values(), URLSearchParams, spread (...), backdrop-filter CSS\n"
    "   ALLOWED in .html: var, function(){}, Object.keys(), Array.isArray(), "
    "JSON.parse/stringify, indexOf(), forEach(), map(), filter(), trim()\n"
    "5. google.script.run with .withSuccessHandler() but missing .withFailureHandler()\n"
    "6. Version not bumped in all 3 locations (line-3 header comment, getter function, EOF comment) "
    "when the file was modified\n\n"

    "P2 — WARNINGS (note but do NOT set verdict to FAIL):\n"
    "7. Duplicate constants already available in global scope\n"
    "8. New google.script.run calls not mentioned in smoke test wiring\n"
    "9. Error logging not using logError_() pattern\n"
    "10. Sheet-writing functions missing waitLock()\n\n"

    "EDUCATION MODULE RULES (apply when .html education files are changed):\n"
    "11. ExecSkills wiring: education modules must call ExecSkills.showPlanYourAttack() "
    "before questions start, ExecSkills.showCompletion() at end. Check for presence.\n"
    "12. Wrong-answer color: must use soft purple (#a855f7) or amber (#fbbf24), "
    "NEVER red (#EF4444, #ff4444, rgb(239,68,68)). Flag any red in wrong-answer CSS.\n"
    "13. Timer direction: homework/education timers must count UP (elapsed time), "
    "not countdown, unless it is explicitly a speed game (fact-sprint).\n"
    "14. TEKS tagging: generated questions should include TEKS code tags like [TEKS 4.3D]. "
    "Flag education content without TEKS references if the module is TEKS-aligned.\n"
    "15. Ring/Star award: verify awardRings/awardStars calls have a withFailureHandler. "
    "Award calls without error handling silently lose earned rewards.\n\n"

    "DATA FLOW TRACING (critical — this catches real bugs):\n"
    "- Trace newly introduced values from source to sink. If a variable is set\n"
    "  in one place and consumed in another, verify the value is valid at both.\n"
    "- Flag empty/null/default sentinel values passed into mutations, GraphQL\n"
    "  calls, route loaders, thread resolvers, or external API calls.\n"
    "- If a new/changed collection mixes thread-backed items and synthetic items,\n"
    "  verify downstream consumers (loops, replies, resolvers) handle both shapes.\n"
    "- If a workflow or test converts a failure into logging-only, treat that as\n"
    "  a likely P1 blocker unless another failing signal still surfaces the error.\n"
    "- A value that is valid at creation but invalid at consumption is a P1 bug.\n\n"

    "IMPORTANT RULES:\n"
    "- Only report findings you can SEE in the code. Include exact evidence.\n"
    "- Do not guess or infer. If you cannot point to a line, do not create a finding.\n"
    "- P1 violations -> severity 'blocker'. P2 -> severity 'major'. Style -> 'minor'.\n"
    "- Potential runtime bugs -> severity 'critical'.\n"
    "- If a fix is mechanical (search-replace), set requires_human_decision to false.\n"
    "- If a fix requires understanding intent/UX, set requires_human_decision to true.\n"
    "- If no issues found, verdict is PASS with an empty findings array.\n\n"

    "Respond with a JSON object matching this schema exactly:\n"
    "{\n"
    '  "verdict": "PASS" or "FAIL",\n'
    '  "confidence": "high" or "medium" or "low",\n'
    '  "findings": [\n'
    "    {\n"
    '      "id": "F001",\n'
    '      "severity": "blocker" | "critical" | "major" | "minor",\n'
    '      "type": "wiring" | "persistence" | "schema" | "ui" | "logic" | "deploy",\n'
    '      "rule": "P1.4",\n'
    '      "title": "Short description of the issue",\n'
    '      "file": "filename.ext",\n'
    '      "line": 123,\n'
    '      "evidence": "exact code snippet from the file or diff",\n'
    '      "fix_hint": "what needs to change",\n'
    '      "requires_human_decision": false\n'
    "    }\n"
    "  ],\n"
    '  "files_reviewed": ["file1.ext", "file2.ext"],\n'
    '  "summary": "One-paragraph summary of review findings"\n'
    "}\n\n"
    "Type mapping:\n"
    "- wiring: google.script.run calls, handler chains, route registration\n"
    "- persistence: sheet writes, cache, state management, lock usage\n"
    "- schema: TAB_MAP references, field names, data shape, constants\n"
    "- ui: visual, layout, CSS, ES5 compliance in HTML files\n"
    "- logic: business logic, calculations, conditional branches\n"
    "- deploy: version bumps, deployment configuration, file naming"
)


# ── related-file discovery ───────────────────────────────────────────

# Pipeline siblings — when one changes, the reviewer should see the others.
_PIPELINE_SIBLINGS = {
    "codex_review.py": ["review-watcher.js", "review-fixer.js"],
    "review-watcher.js": ["review-fixer.js", "codex_review.py"],
    "review-fixer.js": ["review-watcher.js", "codex_review.py"],
    "parse_test_results.py": ["codex_review.py"],
}


def get_related_files(changed_files):
    """Discover callers, consumers, and siblings of changed files.

    Returns a sorted list of file paths that should be included as
    cross-reference context for the reviewer.  Only changed-file
    truncation affects the verdict; related-file truncation is
    informational only.
    """
    related = set()

    for raw_fname in changed_files:
        fname = raw_fname.replace("\\", "/")
        basename = os.path.basename(fname)

        # ---- CI/CD scripts → their workflow callers ----
        if fname.startswith(".github/scripts/"):
            for wf_path in _glob.glob(".github/workflows/*.yml"):
                try:
                    with open(wf_path, encoding="utf-8") as fh:
                        if basename in fh.read():
                            related.add(wf_path.replace("\\", "/"))
                except Exception:
                    pass

        # ---- Workflows → their scripts ----
        if fname.startswith(".github/workflows/"):
            try:
                with open(fname, encoding="utf-8") as fh:
                    content = fh.read()
                for script_path in _glob.glob(".github/scripts/*"):
                    if os.path.basename(script_path) in content:
                        related.add(script_path.replace("\\", "/"))
            except Exception:
                pass

        # ---- Pipeline siblings ----
        if basename in _PIPELINE_SIBLINGS:
            for sibling in _PIPELINE_SIBLINGS[basename]:
                sibling_path = ".github/scripts/" + sibling
                if os.path.isfile(sibling_path):
                    related.add(sibling_path)

        # ---- HTML files → Code.js (router + Safe wrappers) ----
        if fname.endswith(".html") and not fname.startswith(".github"):
            if os.path.isfile("Code.js"):
                related.add("Code.js")

        # ---- Server .js → HTML files that call their Safe functions ----
        if fname.endswith(".js") and not fname.startswith(".github"):
            try:
                with open(fname, encoding="utf-8", errors="replace") as fh:
                    server_content = fh.read()
                safe_funcs = _re.findall(r"function\s+(\w+Safe)\s*\(", server_content)
                if safe_funcs:
                    for html_path in _glob.glob("*.html"):
                        try:
                            with open(html_path, encoding="utf-8", errors="replace") as hf:
                                html_content = hf.read()
                            for func in safe_funcs:
                                if func in html_content:
                                    related.add(html_path.replace("\\", "/"))
                                    break
                        except Exception:
                            pass
            except Exception:
                pass

    # Remove files that are already changed or don't exist
    related -= set(f.replace("\\", "/") for f in changed_files)
    related = {f for f in related if os.path.isfile(f)}
    return sorted(related)


# ── context builder ──────────────────────────────────────────────────

def truncate_preserving_edges(text, limit, label):
    """Preserve both the start and end of large blobs."""
    if limit <= 0:
        return "", False
    if len(text) <= limit:
        return text, False

    marker = "\n[... %s truncated at %d chars ...]\n" % (label, limit)
    if limit <= len(marker) + 40:
        head = max(0, limit - len(marker))
        return text[:head] + marker, True

    remaining = limit - len(marker)
    head = int(remaining * 0.7)
    tail = remaining - head
    return text[:head] + marker + text[-tail:], True


def read_changed_file_content(fname):
    """Prefer PR-head content via git show. Fall back to the working tree ONLY in local runs.

    In CI under pull_request_target, the working tree is the base branch, so
    falling back to disk for a file git-show can't find means we'd read the
    base-branch copy of a deleted file and send it as PR context. Return None
    instead so the review sees the file as gone (which it is, in the PR).
    """
    git_path = fname.replace("\\", "/")

    try:
        return subprocess.check_output(
            ["git", "show", "pr-head:" + git_path],
            stderr=subprocess.DEVNULL,
        ).decode("utf-8", errors="replace")
    except Exception:
        pass

    # In CI, the working tree is the base branch. Don't read base content for
    # files that don't exist in pr-head — they were deleted or renamed in the PR.
    if os.environ.get("GITHUB_ACTIONS") == "true" or os.environ.get("CI") == "true":
        return None

    # Local dev: fall back to disk so running the script outside CI still works.
    if not os.path.isfile(fname):
        return None

    try:
        with open(fname, encoding="utf-8", errors="replace") as fh:
            return fh.read()
    except Exception:
        return None

def extract_hunk_context(fname, diff_text, window=50):
    """Extract changed-line regions from a file with surrounding context.

    Parses the unified diff to find which lines changed in `fname`, then
    reads those regions plus `window` lines above/below from the actual file.
    Returns a string with labeled context windows, or None if no hunks found.

    This replaces the old "send full file" strategy to keep context under
    limits even for 3000+ line files.
    """
    content = read_changed_file_content(fname)
    if content is None:
        return None

    lines = content.splitlines(True)  # keep line endings
    total_lines = len(lines)

    # Parse diff to find hunk ranges for this file
    # Look for: --- a/fname or +++ b/fname followed by @@ -N,M +N,M @@
    diff_fname = fname.replace("\\", "/")
    changed_ranges = []
    in_file = False

    for diff_line in diff_text.splitlines():
        if diff_line.startswith("+++ b/"):
            in_file = diff_line[6:].strip() == diff_fname
        elif diff_line.startswith("diff --git"):
            in_file = False  # reset for next file
        elif in_file and diff_line.startswith("@@"):
            # Parse @@ -old_start,old_count +new_start,new_count @@
            match = _re.search(r"\+(\d+)(?:,(\d+))?", diff_line)
            if match:
                start = int(match.group(1))
                count = int(match.group(2)) if match.group(2) else 1
                changed_ranges.append((start, start + count - 1))

    if not changed_ranges:
        # No hunks found — fall back to full file (small files only)
        if total_lines <= 200:
            return content
        return None

    # Merge overlapping/adjacent ranges with window expansion
    expanded = []
    for start, end in changed_ranges:
        exp_start = max(1, start - window)
        exp_end = min(total_lines, end + window)
        expanded.append((exp_start, exp_end))

    # Merge overlapping expanded ranges
    expanded.sort()
    merged = [expanded[0]]
    for s, e in expanded[1:]:
        if s <= merged[-1][1] + 1:
            merged[-1] = (merged[-1][0], max(merged[-1][1], e))
        else:
            merged.append((s, e))

    # Build context string with line numbers
    parts = []
    parts.append("(%d total lines, showing %d region(s) around changes)\n" % (total_lines, len(merged)))
    for region_start, region_end in merged:
        if region_start > 1:
            parts.append("[... lines 1-%d omitted ...]\n" % (region_start - 1))
        for i in range(region_start - 1, min(region_end, total_lines)):
            parts.append("%d\t%s" % (i + 1, lines[i] if lines[i].endswith("\n") else lines[i] + "\n"))
    if merged[-1][1] < total_lines:
        parts.append("[... lines %d-%d omitted ...]\n" % (merged[-1][1] + 1, total_lines))

    return "".join(parts)


def build_context(diff_text, changed_files, related_files=None, cfg=None):
    """Build review context from diff, changed files, and related files.

    Returns (context_string, truncation_notes_list).
    truncation_notes only covers changed content (affects verdict).
    Related-file truncation is informational and does NOT force INCONCLUSIVE.

    For changed files, uses hunk-context strategy: instead of sending the
    full file, extracts only the regions around changed lines (±50 lines).
    This keeps context well under limits even for 3000+ line files.
    Falls back to full file for small files (≤200 lines).

    cfg: mode config dict from get_mode_config(). Defaults to medium constants.
    """
    if cfg is None:
        cfg = MODE_CONFIG["medium"]

    diff_chars_cap = cfg["max_diff_chars"]
    context_chars_cap = cfg["max_context_chars"]
    per_file_cap = cfg["per_file_cap"]
    include_related = cfg["include_related"]

    parts = []
    truncation_notes = []

    # ---- diff ----
    parts.append("=== PR DIFF ===\n")
    diff_text_capped, diff_truncated = truncate_preserving_edges(diff_text, diff_chars_cap, "diff")
    if diff_truncated:
        truncation_notes.append("diff truncated at %d chars" % diff_chars_cap)
    parts.append(diff_text_capped)

    # ---- changed files (hunk-context strategy) ----
    current_len = sum(len(p) for p in parts)
    remaining = max(0, context_chars_cap - current_len)
    file_count = len(changed_files) if changed_files else 1
    per_file = max(1000, min(per_file_cap, remaining // file_count if file_count else per_file_cap))

    for fname in changed_files:
        # Try hunk-context first (efficient for large files)
        hunk_ctx = extract_hunk_context(fname, diff_text, window=50)
        if hunk_ctx is not None:
            header = "\n=== FILE CONTEXT: %s " % fname
            content = hunk_ctx
        else:
            # Fall back to full file read (file not in diff or read failed)
            content = read_changed_file_content(fname)
            if content is None:
                continue
            header = "\n=== FULL FILE: %s (%d chars) " % (fname, len(content))

        header += "===\n"
        content, file_truncated = truncate_preserving_edges(content, per_file, "file")
        if file_truncated:
            truncation_notes.append("%s truncated" % fname)

        parts.append(header)
        parts.append(content)

    changed_context = "".join(parts)
    changed_context, context_truncated = truncate_preserving_edges(
        changed_context,
        context_chars_cap,
        "total context",
    )
    if context_truncated:
        truncation_notes.append("total context capped at %d chars" % context_chars_cap)

    # ---- related files (callers / consumers / siblings) ----
    # Truncation here is informational only — does NOT affect verdict.
    # In light mode, related files are skipped entirely (include_related=False).
    related_parts = []
    related_text = ""
    if include_related and related_files:
        related_parts.append(
            "\n=== RELATED FILES (not changed — callers/consumers/siblings for cross-reference) ===\n"
        )
        rel_count = len(related_files) if related_files else 1
        per_related = max(3000, RELATED_CONTEXT_CAP // rel_count)

        for fname in related_files:
            if not os.path.isfile(fname):
                continue
            try:
                with open(fname, encoding="utf-8", errors="replace") as fh:
                    content = fh.read()
            except Exception:
                continue

            header = "\n=== RELATED: %s (%d chars) ===\n" % (fname, len(content))
            content, _ = truncate_preserving_edges(content, per_related, "related file")

            related_parts.append(header)
            related_parts.append(content)

        related_text = "".join(related_parts)
        related_text, _ = truncate_preserving_edges(
            related_text,
            RELATED_CONTEXT_CAP,
            "related context",
        )

    context = changed_context + related_text
    return context, truncation_notes


# ── OpenAI call ──────────────────────────────────────────────────────

def send_to_openai(context_text, api_key, cfg=None):
    """Send context to OpenAI with JSON mode. Returns parsed response dict.

    cfg: mode config dict from get_mode_config(). Controls model, max_tokens,
    and system prompt. Defaults to medium (gpt-4o, 4096 tokens, full prompt).
    """
    if cfg is None:
        cfg = MODE_CONFIG["medium"]

    model_to_use = cfg["model"]
    max_tokens_to_use = cfg["max_tokens"]
    system_prompt_to_use = cfg.get("system_prompt_override") or SYSTEM_PROMPT

    print("Using model: %s (mode=%s, max_tokens=%d)" % (model_to_use, REVIEW_MODE, max_tokens_to_use))

    payload = {
        "model": model_to_use,
        "messages": [
            {"role": "system", "content": system_prompt_to_use},
            {"role": "user", "content": context_text},
        ],
        "max_tokens": max_tokens_to_use,
        "temperature": TEMPERATURE,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + api_key,
    }

    # Retry strategy for 429 rate limits:
    #
    # Phase 1 (attempts 1-2): Use the requested model (gpt-4o) with 15/30s backoff.
    #   This handles transient spikes where a short wait is enough.
    #
    # Phase 2 (attempts 3-5): Fall back to gpt-4o-mini with 20/40/60s backoff.
    #   gpt-4o-mini has higher rate limits and 10x lower cost. A degraded review
    #   (less nuanced findings) is better than INCONCLUSIVE blocking the PR.
    #
    # Total max wait: 15+30+20+40+60 = 165s (~2.75 min), well within 10-min timeout.
    RETRY_SCHEDULE = [
        # (delay_seconds, model_override)
        (15, None),          # attempt 2: same model, 15s wait
        (30, None),          # attempt 3: same model, 30s wait
        (20, "gpt-4o-mini"), # attempt 4: fallback model, 20s wait
        (40, "gpt-4o-mini"), # attempt 5: fallback model, 40s wait
        (60, "gpt-4o-mini"), # attempt 6: fallback model, 60s wait
    ]
    MAX_ATTEMPTS = len(RETRY_SCHEDULE) + 1  # 6 total

    last_error = None
    fell_back = False
    for attempt in range(MAX_ATTEMPTS):
        # On fallback attempts, swap the model in the payload
        if attempt > 0 and attempt - 1 < len(RETRY_SCHEDULE):
            _, model_override = RETRY_SCHEDULE[attempt - 1]
            if model_override and model_override != payload["model"]:
                print("429 fallback: switching from %s to %s" % (payload["model"], model_override))
                payload["model"] = model_override
                fell_back = True

        try:
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=json.dumps(payload).encode(),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=90) as resp:
                result = json.load(resp)
                if fell_back:
                    # Tag the response so the caller knows the model was degraded
                    result["_fallback_model"] = payload["model"]
                    print("Review completed on fallback model: %s" % payload["model"])
                return result
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code == 429 and attempt < len(RETRY_SCHEDULE):
                wait, _ = RETRY_SCHEDULE[attempt]
                print("Rate limited (429), retrying in %ds... (attempt %d/%d)" % (
                    wait, attempt + 1, MAX_ATTEMPTS - 1), file=sys.stderr)
                time.sleep(wait)
            elif exc.code == 401:
                print("OpenAI auth failed — check OPENAI_API_KEY.", file=sys.stderr)
                return {"error": "auth_expired"}
            else:
                print("OpenAI API error %d: %s" % (exc.code, exc), file=sys.stderr)
                return {"error": str(exc)}
        except Exception as exc:
            last_error = exc
            if attempt < MAX_ATTEMPTS - 1:
                time.sleep(2 ** (attempt + 1))

    # If we exhausted all retries due to 429, tag the error so the workflow
    # can distinguish rate-limit INCONCLUSIVE from other failures.
    error_str = str(last_error)
    if "429" in error_str:
        return {"error": error_str, "_rate_limited": True}
    return {"error": error_str}


# ── response parser ──────────────────────────────────────────────────

def parse_report(data):
    """Parse structured review report from API response. Returns dict or None."""
    if "error" in data:
        return None

    try:
        content = data["choices"][0]["message"]["content"]
        report = json.loads(content)
    except (KeyError, IndexError, TypeError, json.JSONDecodeError):
        return None

    # required fields
    for field in ("verdict", "findings", "files_reviewed"):
        if field not in report:
            return None

    # normalise verdict
    report["verdict"] = str(report["verdict"]).upper()
    if report["verdict"] not in ("PASS", "FAIL"):
        return None

    if not isinstance(report["findings"], list):
        return None

    if not isinstance(report["files_reviewed"], list) or len(report["files_reviewed"]) == 0:
        return None

    # normalise each finding
    for i, finding in enumerate(report["findings"]):
        if not isinstance(finding, dict):
            continue
        if "id" not in finding:
            finding["id"] = "F%03d" % (i + 1)
        for key, default in (("severity", "minor"), ("type", "logic"), ("requires_human_decision", False)):
            if key not in finding:
                finding[key] = default

    return report


# ── verdict extraction ───────────────────────────────────────────────

RUBBER_STAMP_PHRASES = [
    "usage limits",
    "please provide",
    "could not review",
    "cannot review",
    "no diff provided",
    "no code to review",
    "please share",
    "could you provide",
]


def extract_verdict(report, has_api_error=False, truncation_notes=None):
    """Return PASS, FAIL, or INCONCLUSIVE.

    Any truncation forces INCONCLUSIVE — a partial review must not produce
    a trusted PASS. This preserves the safety property from v1.
    """
    if has_api_error or report is None:
        return "INCONCLUSIVE"

    # truncation guard: partial context cannot produce a trusted verdict
    if truncation_notes:
        return "INCONCLUSIVE"

    # rubber-stamp guard: must have files_reviewed with actual files
    files = report.get("files_reviewed", [])
    if not files or (len(files) == 1 and "none" in str(files[0]).lower()):
        return "INCONCLUSIVE"

    # check summary for rubber-stamp phrases
    summary = str(report.get("summary", "")).lower()
    for phrase in RUBBER_STAMP_PHRASES:
        if phrase in summary:
            return "INCONCLUSIVE"

    return report["verdict"]


# ── finding validator ────────────────────────────────────────────────

# Patterns whose presence in a finding title/evidence implies a syntax claim
# that can be cross-checked against the actual file contents.
_SYNTAX_CHECKS = [
    # (keyword in finding title/evidence, regex that MUST match in file for finding to be valid)
    ("arrow function",  r"=>"),
    ("template literal", r"`"),
    ("let ",            r"\blet\s"),
    ("const ",          r"\bconst\s"),
    ("async ",          r"\basync\s"),
    ("await ",          r"\bawait\s"),
    ("optional chaining", r"\?\.\w"),
    ("nullish coalescing", r"\?\?"),
    (".includes(",      r"\.includes\s*\("),
]


def validate_findings(findings, changed_files):
    """Drop findings whose flagged pattern cannot exist in the actual file.

    For each finding that makes a syntax claim (e.g. "ES6 arrow function"),
    check whether the pattern actually appears in the file. If the file passes
    the check, the finding is a false positive from model hallucination or
    incomplete context — drop it silently.

    Only applies to .html files (where ES5 enforcement matters).
    """
    if not findings or not changed_files:
        return findings

    # Cache file contents for repeated lookups
    file_cache = {}
    for fname in changed_files:
        content = read_changed_file_content(fname)
        if content is not None:
            file_cache[fname.replace("\\", "/")] = content

    validated = []
    for f in findings:
        title = str(f.get("title", "")).lower()
        evidence = str(f.get("evidence", "")).lower()
        finding_file = str(f.get("file", "")).replace("\\", "/")
        search_text = title + " " + evidence

        # Only cross-check syntax claims on .html files
        if not finding_file.endswith(".html"):
            validated.append(f)
            continue

        content = file_cache.get(finding_file)
        if content is None:
            # Can't verify — keep the finding (conservative)
            validated.append(f)
            continue

        dropped = False
        for keyword, pattern in _SYNTAX_CHECKS:
            if keyword in search_text:
                if not _re.search(pattern, content):
                    # Pattern does NOT exist in file — false positive
                    print("Validator: dropped finding '%s' on %s — pattern '%s' not found in file"
                          % (f.get("title", "?"), finding_file, keyword.strip()))
                    dropped = True
                    break

        if not dropped:
            validated.append(f)

    if len(validated) < len(findings):
        print("Validator: %d of %d findings dropped as false positives"
              % (len(findings) - len(validated), len(findings)))

    return validated


# ── comment generation ───────────────────────────────────────────────

SEVERITY_ICONS = {"blocker": "\U0001f534", "critical": "\U0001f7e0", "major": "\U0001f7e1", "minor": "\u26aa"}


def format_comment(report, truncation_notes, error_info=None, effective_verdict=None,
                    changed_files_list=None):
    """Generate human-readable PR comment with embedded JSON report.

    effective_verdict overrides report["verdict"] when truncation or other
    safety guards force INCONCLUSIVE. The comment header, icon, and embedded
    JSON all reflect the effective verdict, not the raw model output.

    When truncation_notes is non-empty, findings are suppressed entirely to
    prevent false positives from partial context.

    changed_files_list is used by validate_findings() to cross-check that
    flagged patterns actually exist in the file.
    """

    if error_info:
        if error_info == "auth_expired":
            return (
                COMMENT_MARKER + "\n"
                "## \u26a0\ufe0f Codex PR Review: INCONCLUSIVE \u2014 Auth Error\n\n"
                "`OPENAI_API_KEY` secret has expired or is invalid. "
                "Update it in repo Settings > Secrets.\n"
            )
        return (
            COMMENT_MARKER + "\n"
            "## \u26a0\ufe0f Codex PR Review: INCONCLUSIVE \u2014 API Error\n\n"
            "Error: `%s`\n" % error_info
        )

    if report is None:
        return (
            COMMENT_MARKER + "\n"
            "## \u26a0\ufe0f Codex PR Review: INCONCLUSIVE \u2014 Malformed Response\n\n"
            "Response could not be parsed as a structured review report. "
            "Check `codex_response.json` in workflow artifacts.\n"
        )

    # Use effective verdict (accounts for truncation/safety guards),
    # NOT the raw model verdict which may say PASS on partial context.
    verdict = effective_verdict if effective_verdict else report["verdict"]
    findings = report["findings"]

    if verdict == "INCONCLUSIVE":
        icon = "\u26a0\ufe0f"
    elif verdict == "FAIL":
        icon = "\u274c"
    else:
        icon = "\u2705"

    lines = [COMMENT_MARKER]
    lines.append("## %s Codex PR Review: %s\n" % (icon, verdict))

    if truncation_notes:
        lines.append("> \u26a0\ufe0f **Review is INCONCLUSIVE due to truncation.** Manual audit required.")
        lines.append("> Context: %s\n" % "; ".join(truncation_notes))
        # Truncated context produces unreliable findings — suppress everything
        # except the file list so reviewers know what was attempted.
        lines.append("Findings from partial context are **suppressed** to prevent false positives.")
        lines.append("")
        lines.append("**Files in PR:** %s" % ", ".join(report.get("files_reviewed", [])))
        lines.append("")
        # Emit a minimal embedded report with no findings for fix-agent consumption
        suppressed_report = {
            "verdict": verdict,
            "findings": [],
            "files_reviewed": report.get("files_reviewed", []),
            "confidence": "none",
            "suppressed_reason": "context_truncated",
        }
        lines.append("<details>")
        lines.append("<summary>\U0001f4cb Structured report (for fix agent)</summary>")
        lines.append("")
        lines.append(REPORT_JSON_START)
        lines.append("")
        lines.append("```json")
        lines.append(json.dumps(suppressed_report, indent=2))
        lines.append("```")
        lines.append("")
        lines.append(REPORT_JSON_END)
        lines.append("")
        lines.append("</details>")
        return "\n".join(lines)

    if report.get("summary"):
        lines.append(report["summary"])
        lines.append("")

    # severity stats bar
    sev_counts = {}
    for f in findings:
        sev = f.get("severity", "unknown")
        sev_counts[sev] = sev_counts.get(sev, 0) + 1

    if sev_counts:
        stats = []
        for sev in ("blocker", "critical", "major", "minor"):
            if sev in sev_counts:
                stats.append("%s %s: %d" % (SEVERITY_ICONS.get(sev, "\u26ab"), sev, sev_counts[sev]))
        lines.append("| " + " | ".join(stats) + " |")
        lines.append("")

    # findings list — validated before display
    findings = validate_findings(findings, changed_files_list) if changed_files_list else findings
    if findings:
        lines.append("### Findings\n")
        for f in findings:
            sev_icon = SEVERITY_ICONS.get(f.get("severity", ""), "\u26ab")
            human_tag = " \U0001f464" if f.get("requires_human_decision") else ""
            lines.append("%s **[%s]** %s \u2014 `%s`%s" % (
                sev_icon,
                str(f.get("severity", "unknown")).upper(),
                f.get("title", "No title"),
                f.get("file", "?"),
                human_tag,
            ))
            if f.get("line"):
                lines.append("  Line %s" % f["line"])
            if f.get("evidence"):
                ev = str(f["evidence"])[:200]
                lines.append("  > `%s`" % ev)
            if f.get("fix_hint"):
                lines.append("  \U0001f4a1 %s" % f["fix_hint"])
            lines.append("")
    else:
        lines.append("No findings.\n")

    lines.append("**Files Reviewed:** %s" % ", ".join(report.get("files_reviewed", [])))
    lines.append("**Confidence:** %s" % report.get("confidence", "unknown"))
    lines.append("")

    # embed machine-readable JSON for fix agent consumption
    # Use effective verdict in the embedded report, not the raw model output.
    embedded_report = dict(report)
    embedded_report["verdict"] = verdict
    embedded_report["findings"] = findings  # use validated findings
    lines.append("<details>")
    lines.append("<summary>\U0001f4cb Structured report (for fix agent)</summary>")
    lines.append("")
    lines.append(REPORT_JSON_START)
    lines.append("")
    lines.append("```json")
    lines.append(json.dumps(embedded_report, indent=2))
    lines.append("```")
    lines.append("")
    lines.append(REPORT_JSON_END)
    lines.append("")
    lines.append("</details>")

    return "\n".join(lines)


# ── helpers ──────────────────────────────────────────────────────────

def write_github_output(key, value):
    output_file = os.environ.get("GITHUB_OUTPUT", "")
    if output_file:
        with open(output_file, "a") as fh:
            fh.write("%s=%s\n" % (key, value))


def write_inconclusive(reason_code, message):
    """Write INCONCLUSIVE outputs for early-exit edge cases."""
    write_github_output("verdict", "INCONCLUSIVE")
    with open("review_comment.md", "w") as fh:
        fh.write(
            COMMENT_MARKER + "\n"
            "## \u26a0\ufe0f Codex PR Review: INCONCLUSIVE \u2014 %s\n\n%s\n" % (reason_code, message)
        )
    with open("review-report.json", "w") as fh:
        json.dump({
            "verdict": "INCONCLUSIVE",
            "findings": [],
            "files_reviewed": [],
            "error": reason_code,
        }, fh, indent=2)


# ── main ─────────────────────────────────────────────────────────────

def main():
    api_key = os.environ.get("OPENAI_API_KEY", "")
    diff_file = os.environ.get("DIFF_FILE", "pr_diff.txt")
    changed_files_file = os.environ.get("CHANGED_FILES_FILE", "changed_files.txt")
    empty_diff = os.environ.get("EMPTY_DIFF", "false") == "true"

    # ---- edge cases ----
    if empty_diff:
        write_inconclusive("Empty Diff", "PR has changed files but the text diff is empty.")
        return

    if not api_key:
        write_inconclusive("Missing API Key", "`OPENAI_API_KEY` not configured in repo secrets.")
        return

    # ---- read diff ----
    try:
        with open(diff_file, encoding="utf-8", errors="replace") as fh:
            diff_text = fh.read()
    except FileNotFoundError:
        write_inconclusive("Diff File Missing", "Diff file `%s` not found." % diff_file)
        return

    # ---- read changed-file list ----
    changed_files = []
    try:
        with open(changed_files_file, encoding="utf-8") as fh:
            changed_files = [line.strip() for line in fh if line.strip()]
    except FileNotFoundError:
        pass  # no file list — just use the diff

    # ---- get mode config ----
    cfg = get_mode_config()
    print("Review mode: %s (model=%s)" % (REVIEW_MODE, cfg["model"]))

    # ---- discover related files ----
    related_files = get_related_files(changed_files)
    if related_files and cfg["include_related"]:
        print("Related files for cross-reference: %s" % ", ".join(related_files))
    elif related_files and not cfg["include_related"]:
        print("Related files skipped in %s mode." % REVIEW_MODE)

    # ---- build context ----
    context, truncation_notes = build_context(diff_text, changed_files, related_files, cfg=cfg)

    # ---- send to OpenAI ----
    data = send_to_openai(context, api_key, cfg=cfg)

    # save raw response for debugging
    with open("codex_response.json", "w") as fh:
        json.dump(data, fh)

    # ---- parse ----
    has_error = "error" in data
    error_info = data.get("error") if has_error else None
    report = parse_report(data) if not has_error else None

    # ---- verdict ----
    verdict = extract_verdict(report, has_error, truncation_notes)

    # ---- write review-report.json ----
    # Use the effective verdict in the artifact, not the raw model verdict.
    if report:
        report_out = dict(report)
        report_out["verdict"] = verdict
    else:
        report_out = {
            "verdict": "INCONCLUSIVE",
            "findings": [],
            "files_reviewed": [],
            "confidence": "none",
            "error": error_info or "parse_failed",
        }
    with open("review-report.json", "w") as fh:
        json.dump(report_out, fh, indent=2)

    # ---- write human comment ----
    comment = format_comment(report, truncation_notes, error_info, effective_verdict=verdict,
                             changed_files_list=changed_files)
    with open("review_comment.md", "w") as fh:
        fh.write(comment)

    write_github_output("verdict", verdict)

    # Signal rate-limiting to the workflow so it can trigger a delayed requeue
    rate_limited = data.get("_rate_limited", False)
    write_github_output("rate_limited", "true" if rate_limited else "false")

    # Signal fallback model usage for transparency
    fallback_model = data.get("_fallback_model", "")
    if fallback_model:
        write_github_output("fallback_model", fallback_model)
        print("Codex verdict: %s (via fallback model %s)" % (verdict, fallback_model))
    else:
        print("Codex verdict: %s" % verdict)


if __name__ == "__main__":
    main()
