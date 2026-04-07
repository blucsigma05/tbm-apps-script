#!/usr/bin/env python3
"""
Codex PR Review — sends PR diff to OpenAI gpt-4o for TBM-specific code review.

Called by: .github/workflows/codex-pr-review.yml
Env vars expected:
  OPENAI_API_KEY   — OpenAI API key (required)
  DIFF_FILE        — path to the truncated diff file (default: pr_diff_send.txt)
  TRUNCATED        — "true" if diff was truncated (default: "false")
  GITHUB_OUTPUT    — GitHub Actions output file path

Outputs:
  review_comment.md — formatted PR comment
  codex_response.json — raw API response (for debugging)
  GITHUB_OUTPUT: verdict=PASS|FAIL|INCONCLUSIVE

Verdict rules (INCONCLUSIVE = CI blocks, manual review required):
  - OPENAI_API_KEY missing          → INCONCLUSIVE
  - TRUNCATED=true                  → INCONCLUSIVE (partial diff cannot be trusted)
  - API / auth / rate-limit error   → INCONCLUSIVE
  - Response malformed              → INCONCLUSIVE
  - Content lacks explicit Verdict  → INCONCLUSIVE
  - Explicit "**Verdict:** FAIL"    → FAIL
  - Explicit "**Verdict:** PASS"    → PASS
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

# HTML marker for deterministic comment matching in the workflow.
# The workflow finds/updates existing comments by this marker, not by fuzzy text.
COMMENT_MARKER = "<!-- codex-pr-review -->"

SYSTEM_PROMPT = (
    "You are a senior code reviewer for TBM (TillerBudgetMaster), a Google Apps Script "
    "+ HtmlService household finance and kids-chore system. Review the PR diff against these rules:\n"
    "\n"
    "P1 — CRITICAL (fail the check):\n"
    "1. No hardcoded sheet names with emoji prefixes — must use TAB_MAP from DataEngine.gs\n"
    "2. No SpreadsheetApp.getActiveSpreadsheet() — must use openById(SSID)\n"
    "3. No lock.tryLock() — must use waitLock(30000)\n"
    "4. No ES6 syntax in .html files (no let/const, no => arrows, no template literals ``, "
    "no ??, no ?., no async/await, no destructuring, no .includes(), no .find())\n"
    "5. Every google.script.run call must have a .withFailureHandler() chained\n"
    "6. Version must be bumped in all 3 locations: line-3 header comment, getter function, EOF comment\n"
    "\n"
    "P2 — WARNINGS (note but do not fail):\n"
    "7. No duplicate constants — global GAS scope is shared; never redeclare SSID, TAB_MAP, etc.\n"
    "8. New google.script.run calls must also be added to smoke test wiring check\n"
    "9. logError_() pattern used for error logging (not console.error or Logger.log for errors)\n"
    "\n"
    "Respond in this exact format:\n"
    "**Critical Violations (P1):** [list each with file and line if visible, or \"None\"]\n"
    "**Warnings (P2):** [list each or \"None\"]\n"
    "**Verdict:** PASS or FAIL\n"
    "**Files Reviewed:** [comma-separated list of filenames from the diff, e.g. \"Code.js, TheSpine.html\" — or \"none visible in diff\" if the diff was empty]"
)


def send_to_openai(diff_text, truncated, api_key):
    """Send diff to OpenAI and return the parsed JSON response."""
    user_content = "PR diff to review"
    if truncated:
        user_content += " (truncated at 12000 chars)"
    user_content += ":\n\n" + diff_text

    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        "max_tokens": 1200,
        "temperature": 0,
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
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as exc:
            last_error = exc
            if exc.code == 429 and attempt < 3:
                wait = 2 ** (attempt + 1)
                print("Rate limited (429), retrying in %ds..." % wait, file=sys.stderr)
                time.sleep(wait)
            elif exc.code == 401:
                print("OpenAI auth failed — check OPENAI_API_KEY secret.", file=sys.stderr)
                return {"error": "auth_expired"}
            else:
                print("OpenAI API error %d: %s" % (exc.code, exc), file=sys.stderr)
                return {"error": str(exc)}
        except Exception as exc:
            last_error = exc
            if attempt < 3:
                time.sleep(2 ** (attempt + 1))

    return {"error": str(last_error)}


def format_comment(data, truncated):
    """Format the API response into a Markdown PR comment.

    Every comment starts with COMMENT_MARKER so the workflow can find and
    update it deterministically without fuzzy text matching.
    """
    trunc_note = ""
    if truncated:
        trunc_note = "\n\n> ⚠️ Diff truncated at 12 000 chars — review is partial. Verdict is INCONCLUSIVE regardless of findings."

    if "error" in data:
        err = data["error"]
        if err == "auth_expired":
            return (
                COMMENT_MARKER + "\n"
                "## ⚠️ Codex PR Review: INCONCLUSIVE — Auth Error\n\n"
                "`OPENAI_API_KEY` secret has expired or is invalid. "
                "Update it in repo Settings > Secrets. Manual Codex audit required." + trunc_note
            )
        return (
            COMMENT_MARKER + "\n"
            "## ⚠️ Codex PR Review: INCONCLUSIVE — API Error\n\n"
            "Could not reach OpenAI: `%s`\n\nCheck workflow logs. Manual Codex audit required." % err + trunc_note
        )

    # Validate response shape
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return (
            COMMENT_MARKER + "\n"
            "## ⚠️ Codex PR Review: INCONCLUSIVE — Malformed Response\n\n"
            "OpenAI response did not contain expected choices/message/content. "
            "Check `codex_response.json` in workflow artifacts. Manual Codex audit required." + trunc_note
        )

    has_pass = "**Verdict:** PASS" in content
    has_fail = "**Verdict:** FAIL" in content

    if truncated:
        verdict_label = "INCONCLUSIVE"
        icon = "⚠️"
    elif has_fail:
        verdict_label = "FAIL"
        icon = "❌"
    elif has_pass:
        verdict_label = "PASS"
        icon = "✅"
    else:
        verdict_label = "INCONCLUSIVE"
        icon = "⚠️"

    # When effective verdict is INCONCLUSIVE, strip any model PASS/FAIL verdict
    # to avoid contradicting the header verdict with a raw model verdict below.
    display_content = content
    if verdict_label == "INCONCLUSIVE":
        display_content = display_content.replace("**Verdict:** PASS", "**Verdict:** ~~PASS~~ INCONCLUSIVE (overridden — see header)")
        display_content = display_content.replace("**Verdict:** FAIL", "**Verdict:** ~~FAIL~~ INCONCLUSIVE (overridden — see header)")

    return "%s\n## %s Codex PR Review: %s%s\n\n%s" % (
        COMMENT_MARKER, icon, verdict_label, trunc_note, display_content
    )


def extract_verdict(data, truncated=False):
    """Return PASS, FAIL, or INCONCLUSIVE from the API response.

    INCONCLUSIVE blocks the CI check and requires manual review. It is
    returned for any situation where the review cannot be fully trusted:
    truncated diff, API error, malformed response, or no explicit verdict.
    """
    if truncated:
        return "INCONCLUSIVE"
    if "error" in data:
        return "INCONCLUSIVE"
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return "INCONCLUSIVE"
    if "**Verdict:** FAIL" in content:
        return "FAIL"
    if "**Verdict:** PASS" in content:
        # PASS also requires the reviewer to confirm which files were reviewed.
        # A missing Files Reviewed section means the reviewer may not have seen the diff.
        if "**Files Reviewed:**" not in content:
            return "INCONCLUSIVE"
        return "PASS"
    # Response arrived but contained no explicit verdict — rubber-stamp guard
    return "INCONCLUSIVE"


def write_github_output(key, value):
    """Write a key=value pair to GITHUB_OUTPUT."""
    output_file = os.environ.get("GITHUB_OUTPUT", "")
    if output_file:
        with open(output_file, "a") as f:
            f.write("%s=%s\n" % (key, value))


def main():
    api_key = os.environ.get("OPENAI_API_KEY", "")
    diff_file = os.environ.get("DIFF_FILE", "pr_diff_send.txt")
    truncated = os.environ.get("TRUNCATED", "false") == "true"
    empty_diff = os.environ.get("EMPTY_DIFF", "false") == "true"

    # Files changed but diff is empty (e.g. binary-only PR) — INCONCLUSIVE
    if empty_diff:
        write_github_output("verdict", "INCONCLUSIVE")
        with open("review_comment.md", "w") as f:
            f.write(
                COMMENT_MARKER + "\n"
                "## ⚠️ Codex PR Review: INCONCLUSIVE — Empty Diff\n\n"
                "PR has changed files but the text diff is empty (binary-only or "
                "all changes in non-diffable files). Manual Codex audit required.\n"
            )
        return

    # No API key — INCONCLUSIVE, not a silent skip
    if not api_key:
        write_github_output("verdict", "INCONCLUSIVE")
        with open("review_comment.md", "w") as f:
            f.write(
                COMMENT_MARKER + "\n"
                "## ⚠️ Codex PR Review: INCONCLUSIVE — Missing API Key\n\n"
                "**Missing secret:** `OPENAI_API_KEY` — configure it in repo Settings > Secrets. "
                "Manual Codex audit required.\n"
            )
        return

    # Read diff
    try:
        with open(diff_file) as f:
            diff_text = f.read()
    except FileNotFoundError:
        print("Diff file not found: %s" % diff_file, file=sys.stderr)
        write_github_output("verdict", "INCONCLUSIVE")
        with open("review_comment.md", "w") as f:
            f.write(
                COMMENT_MARKER + "\n"
                "## ⚠️ Codex PR Review: INCONCLUSIVE — Diff File Missing\n\n"
                "Diff file `%s` not found. Manual Codex audit required.\n" % diff_file
            )
        return

    # Send to OpenAI (even for truncated diffs — partial review is better than none)
    data = send_to_openai(diff_text, truncated, api_key)

    # Save raw response for debugging
    with open("codex_response.json", "w") as f:
        json.dump(data, f)

    # Format comment and extract verdict
    comment = format_comment(data, truncated)
    with open("review_comment.md", "w") as f:
        f.write(comment)

    verdict = extract_verdict(data, truncated)
    write_github_output("verdict", verdict)
    print("Codex verdict: %s" % verdict)


if __name__ == "__main__":
    main()
