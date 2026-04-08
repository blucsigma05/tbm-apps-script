#!/usr/bin/env python3
"""
Codex PR Review v2 — structured review with full file context.

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
import sys
import time
import urllib.request
import urllib.error

# ── markers ──────────────────────────────────────────────────────────
COMMENT_MARKER = "<!-- codex-pr-review -->"
REPORT_JSON_START = "<!-- codex-review-report -->"
REPORT_JSON_END = "<!-- /codex-review-report -->"

# ── context limits ───────────────────────────────────────────────────
MAX_DIFF_CHARS = 30000       # cap raw diff
PER_FILE_CAP = 15000         # cap per changed file
MAX_CONTEXT_CHARS = 80000    # cap changed-file context
RELATED_CONTEXT_CAP = 30000  # additional budget for caller/consumer context

# ── model config ─────────────────────────────────────────────────────
MODEL = "gpt-4o"
MAX_TOKENS = 4000
TEMPERATURE = 0

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

    "DATA FLOW TRACING (critical — this catches real bugs):\n"
    "- Trace values through function calls. If a variable is set in one place and\n"
    "  consumed in another, verify the value is valid at both sites.\n"
    "- When objects are created with placeholder/empty fields (e.g. {id: ''}),\n"
    "  trace where those fields are later read and whether empty/null will crash.\n"
    "- When new code paths add items to arrays or maps, check if downstream\n"
    "  consumers (loops, API calls, mutations) handle the new item shape.\n"
    "- When error handling catches and suppresses exceptions, verify the caller\n"
    "  still gets a valid result or fails safely.\n"
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

def build_context(diff_text, changed_files, related_files=None):
    """Build review context from diff, changed files, and related files.

    Returns (context_string, truncation_notes_list).
    truncation_notes only covers changed content (affects verdict).
    Related-file truncation is informational and does NOT force INCONCLUSIVE.
    """
    parts = []
    truncation_notes = []

    # ---- diff ----
    parts.append("=== PR DIFF ===\n")
    if len(diff_text) > MAX_DIFF_CHARS:
        parts.append(diff_text[:MAX_DIFF_CHARS])
        parts.append("\n[... diff truncated at %d chars ...]\n" % MAX_DIFF_CHARS)
        truncation_notes.append("diff truncated at %d chars" % MAX_DIFF_CHARS)
    else:
        parts.append(diff_text)

    # ---- changed files ----
    current_len = sum(len(p) for p in parts)
    remaining = MAX_CONTEXT_CHARS - current_len
    file_count = len(changed_files) if changed_files else 1
    per_file = max(5000, remaining // file_count)

    for fname in changed_files:
        if not os.path.isfile(fname):
            continue
        try:
            with open(fname, encoding="utf-8", errors="replace") as fh:
                content = fh.read()
        except Exception:
            continue

        header = "\n=== FULL FILE: %s (%d chars) ===\n" % (fname, len(content))
        if len(content) > per_file:
            content = content[:per_file] + "\n[... file truncated at %d chars ...]\n" % per_file
            truncation_notes.append("%s truncated" % fname)

        parts.append(header)
        parts.append(content)

    changed_context = "".join(parts)
    if len(changed_context) > MAX_CONTEXT_CHARS:
        changed_context = changed_context[:MAX_CONTEXT_CHARS]
        truncation_notes.append("total context capped at %d chars" % MAX_CONTEXT_CHARS)

    # ---- related files (callers / consumers / siblings) ----
    # Truncation here is informational only — does NOT affect verdict.
    related_parts = []
    if related_files:
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
            if len(content) > per_related:
                content = content[:per_related] + "\n[... related file truncated ...]\n"

            related_parts.append(header)
            related_parts.append(content)

        related_text = "".join(related_parts)
        if len(related_text) > RELATED_CONTEXT_CAP:
            related_text = related_text[:RELATED_CONTEXT_CAP]

    context = changed_context + "".join(related_parts)
    return context, truncation_notes


# ── OpenAI call ──────────────────────────────────────────────────────

def send_to_openai(context_text, api_key):
    """Send context to OpenAI gpt-4o with JSON mode. Returns parsed response dict."""
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": context_text},
        ],
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + api_key,
    }

    last_error = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=json.dumps(payload).encode(),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=90) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code == 429 and attempt < 3:
                wait = 2 ** (attempt + 1)
                print("Rate limited (429), retrying in %ds..." % wait, file=sys.stderr)
                time.sleep(wait)
            elif exc.code == 401:
                print("OpenAI auth failed — check OPENAI_API_KEY.", file=sys.stderr)
                return {"error": "auth_expired"}
            else:
                print("OpenAI API error %d: %s" % (exc.code, exc), file=sys.stderr)
                return {"error": str(exc)}
        except Exception as exc:
            last_error = exc
            if attempt < 3:
                time.sleep(2 ** (attempt + 1))

    return {"error": str(last_error)}


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


# ── comment generation ───────────────────────────────────────────────

SEVERITY_ICONS = {"blocker": "\U0001f534", "critical": "\U0001f7e0", "major": "\U0001f7e1", "minor": "\u26aa"}


def format_comment(report, truncation_notes, error_info=None, effective_verdict=None):
    """Generate human-readable PR comment with embedded JSON report.

    effective_verdict overrides report["verdict"] when truncation or other
    safety guards force INCONCLUSIVE. The comment header, icon, and embedded
    JSON all reflect the effective verdict, not the raw model output.
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

    # findings list
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

    # ---- discover related files ----
    related_files = get_related_files(changed_files)
    if related_files:
        print("Related files for cross-reference: %s" % ", ".join(related_files))

    # ---- build context ----
    context, truncation_notes = build_context(diff_text, changed_files, related_files)

    # ---- send to OpenAI ----
    data = send_to_openai(context, api_key)

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
    comment = format_comment(report, truncation_notes, error_info, effective_verdict=verdict)
    with open("review_comment.md", "w") as fh:
        fh.write(comment)

    write_github_output("verdict", verdict)
    print("Codex verdict: %s" % verdict)


if __name__ == "__main__":
    main()
