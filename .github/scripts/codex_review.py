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
  GITHUB_OUTPUT: verdict=PASS|FAIL|SKIP|ERROR
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
    "**Verdict:** PASS or FAIL"
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
        trunc_note = "\n\n> Warning: Diff truncated at 12 000 chars — large PR, review may be partial."

    if "error" in data:
        err = data["error"]
        if err == "auth_expired":
            return (
                COMMENT_MARKER + "\n"
                "## Warning Codex PR Review: AUTH ERROR\n\n"
                "`OPENAI_API_KEY` secret has expired or is invalid. "
                "Update it in repo Settings > Secrets." + trunc_note
            )
        return (
            COMMENT_MARKER + "\n"
            "## Warning Codex PR Review: API ERROR\n\n"
            "Could not reach OpenAI: `%s`\n\nCheck workflow logs." % err + trunc_note
        )

    content = data["choices"][0]["message"]["content"]
    verdict = "FAIL" if "**Verdict:** FAIL" in content else "PASS"
    icon = "PASS" if verdict == "PASS" else "FAIL"
    return "%s\n## %s Codex PR Review: %s%s\n\n%s" % (COMMENT_MARKER, icon, verdict, trunc_note, content)


def extract_verdict(data):
    """Return PASS, FAIL, or ERROR from the API response."""
    if "error" in data:
        return "ERROR"
    content = data["choices"][0]["message"]["content"]
    return "FAIL" if "**Verdict:** FAIL" in content else "PASS"


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

    # No API key — skip gracefully
    if not api_key:
        write_github_output("verdict", "SKIP")
        with open("review_comment.md", "w") as f:
            f.write(
                COMMENT_MARKER + "\n"
                "## Warning Codex PR Review: SKIPPED\n\n"
                "**Missing secret:** `OPENAI_API_KEY` — configure it in repo Settings > Secrets.\n"
            )
        return

    # Read diff
    try:
        with open(diff_file) as f:
            diff_text = f.read()
    except FileNotFoundError:
        print("Diff file not found: %s" % diff_file, file=sys.stderr)
        write_github_output("verdict", "ERROR")
        with open("review_comment.md", "w") as f:
            f.write(COMMENT_MARKER + "\n## Warning Codex PR Review: ERROR\n\nDiff file `%s` not found.\n" % diff_file)
        return

    # Send to OpenAI
    data = send_to_openai(diff_text, truncated, api_key)

    # Save raw response for debugging
    with open("codex_response.json", "w") as f:
        json.dump(data, f)

    # Format comment
    comment = format_comment(data, truncated)
    with open("review_comment.md", "w") as f:
        f.write(comment)

    # Write verdict
    verdict = extract_verdict(data)
    write_github_output("verdict", verdict)
    print("Codex verdict: %s" % verdict)


if __name__ == "__main__":
    main()
