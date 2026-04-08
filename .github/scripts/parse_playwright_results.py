#!/usr/bin/env python3
"""
Parse Playwright JSON reporter output into a Markdown PR comment.

Called by: .github/workflows/playwright-regression.yml
Env vars expected:
  PW_EXIT          — Playwright exit code (default: "1")
  PW_OUTPUT_FILE   — path to raw Playwright stdout capture (default: playwright-output.txt)
  GITHUB_OUTPUT    — GitHub Actions output file path

Outputs:
  playwright-comment.md — formatted PR comment
  GITHUB_OUTPUT: verdict=PASS|FAIL|SKIP
"""

import json
import os
import sys


def write_github_output(key, value):
    """Write a key=value pair to GITHUB_OUTPUT."""
    output_file = os.environ.get("GITHUB_OUTPUT", "")
    if output_file:
        with open(output_file, "a") as f:
            f.write("%s=%s\n" % (key, value))


def parse_json_from_output(output_text):
    """Try to find JSON reporter data in Playwright stdout.

    Playwright's JSON reporter outputs multi-line JSON. Try parsing the
    full output first, then fall back to scanning for a single-line JSON
    blob (older Playwright versions or piped output).
    """
    # Try parsing the entire output as JSON (multi-line reporter output)
    stripped = output_text.strip()
    if stripped.startswith("{"):
        try:
            data = json.loads(stripped)
            if "stats" in data:
                return data
        except Exception:
            pass

    # Try finding JSON embedded after non-JSON preamble (e.g. console output)
    brace_start = stripped.find("\n{")
    if brace_start != -1:
        try:
            data = json.loads(stripped[brace_start + 1:])
            if "stats" in data:
                return data
        except Exception:
            pass

    # Legacy fallback: single-line JSON blob
    for line in output_text.splitlines():
        line = line.strip()
        if line.startswith("{") and '"stats"' in line:
            try:
                return json.loads(line)
            except Exception:
                pass
    return None


def format_comment(json_data, pw_exit, output_text):
    """Format Playwright results into Markdown."""
    if json_data:
        stats = json_data.get("stats", {})
        passed = stats.get("expected", 0)
        failed = stats.get("unexpected", 0)
        skipped = stats.get("skipped", 0)
        duration_ms = stats.get("duration", 0)
        verdict = "PASS" if failed == 0 else "FAIL"
        icon = "PASS" if verdict == "PASS" else "FAIL"

        lines = [
            "## %s Playwright Regression: %s" % (icon, verdict),
            "",
            "**%d passed - %d failed - %d skipped** (%dms)" % (passed, failed, skipped, duration_ms),
            "",
            "_Tested against: https://thompsonfams.com_",
        ]

        if failed > 0:
            lines.append("")
            lines.append("### Failures")
            for suite in json_data.get("suites", []):
                for spec in suite.get("specs", []):
                    for test in spec.get("tests", []):
                        if test.get("status") != "expected":
                            title = spec.get("title", "?")
                            status = test.get("status", "?")
                            lines.append("- **%s**: %s" % (title, status))
                            for result in test.get("results", []):
                                err = result.get("error", {})
                                msg = err.get("message", "")
                                if msg:
                                    lines.append("  `%s`" % msg[:200])

        return "\n".join(lines), verdict
    else:
        verdict = "PASS" if pw_exit == 0 else "FAIL"
        icon = "PASS" if verdict == "PASS" else "FAIL"
        snippet = output_text[-800:] if output_text else "(no output)"
        comment = (
            "## %s Playwright Regression: %s\n\n"
            "Could not parse JSON results.\n\n```\n%s\n```" % (icon, verdict, snippet)
        )
        return comment, verdict


def main():
    pw_exit = int(os.environ.get("PW_EXIT", "1"))
    output_file = os.environ.get("PW_OUTPUT_FILE", "playwright-output.txt")

    output_text = ""
    try:
        with open(output_file) as f:
            output_text = f.read()
    except Exception:
        pass

    json_data = parse_json_from_output(output_text)
    comment, verdict = format_comment(json_data, pw_exit, output_text)

    with open("playwright-comment.md", "w") as f:
        f.write(comment)

    write_github_output("verdict", verdict)
    print(comment)


if __name__ == "__main__":
    main()
