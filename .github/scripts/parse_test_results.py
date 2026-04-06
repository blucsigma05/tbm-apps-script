#!/usr/bin/env python3
"""
Parse TBM smoke + regression test results from the GAS ?action=runTests endpoint.

Called by: .github/workflows/ci.yml
Env vars expected:
  TEST_RESPONSE_FILE — path to JSON response file (default: test_response.json)
  GITHUB_OUTPUT      — GitHub Actions output file path

Outputs:
  test_summary.md  — formatted PR comment
  GITHUB_OUTPUT: overall=PASS|FAIL|WARN|UNKNOWN|ERROR
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


def parse_overall(data):
    """Extract the overall result from the parsed JSON."""
    return data.get("overall", "UNKNOWN")


def format_summary(data):
    """Format the test data dict into a Markdown summary."""
    smoke = data.get("smoke", {})
    reg = data.get("regression", {})
    versions = data.get("versions", {})

    overall = data.get("overall", "UNKNOWN")
    # WARN is treated as passing (known tech debt, not a regression)
    icon = "PASS" if overall in ("PASS", "WARN") else "FAIL"

    lines = []
    lines.append("## %s TBM Test Results: %s" % (icon, overall))
    lines.append("")
    lines.append(
        "**Smoke Test:** %s (%sms)"
        % (smoke.get("overall", "?"), smoke.get("runtime_ms", "?"))
    )
    lines.append(
        "**Regression:** %s - %s/%s passed"
        % (reg.get("overall", "?"), reg.get("passed", "?"), reg.get("total", "?"))
    )
    lines.append("")

    # Show failures if any
    if reg.get("failed", 0) > 0:
        lines.append("### Failures")
        for assertion in reg.get("assertions", []):
            if assertion.get("status") == "FAIL":
                lines.append(
                    "- **%s**: %s"
                    % (assertion.get("id", "?"), assertion.get("description", ""))
                )
                details = assertion.get("details", "")
                if details:
                    lines.append("  %s" % details)
        lines.append("")

    if versions:
        version_parts = []
        for k, v in versions.items():
            version_parts.append("%s %s" % (k, v))
        lines.append("**Versions:** %s" % ", ".join(version_parts))
    lines.append("**Timestamp:** %s" % data.get("timestamp", "?"))

    return "\n".join(lines)


def main():
    response_file = os.environ.get("TEST_RESPONSE_FILE", "test_response.json")

    # Read from file (preferred) or env var fallback
    response_text = ""
    try:
        with open(response_file, "r", encoding="utf-8") as f:
            response_text = f.read()
    except FileNotFoundError:
        response_text = os.environ.get("TEST_RESPONSE", "")

    if not response_text:
        # Last resort: stdin
        response_text = sys.stdin.read()

    # Parse JSON
    try:
        data = json.loads(response_text)
    except Exception as exc:
        write_github_output("overall", "ERROR")
        with open("test_summary.md", "w") as f:
            f.write("Could not parse test results: %s" % exc)
        print("Could not parse test results: %s" % exc)
        sys.exit(1)

    overall = parse_overall(data)
    write_github_output("overall", overall)

    summary = format_summary(data)
    with open("test_summary.md", "w") as f:
        f.write(summary)

    print(summary)
    print("")

    # WARN is treated as passing (known tech debt, not a regression)
    if overall in ("PASS", "WARN"):
        print("Tests passed (overall: %s)" % overall)
        sys.exit(0)
    else:
        print("Tests failed (overall: %s) - merge blocked" % overall)
        sys.exit(1)


if __name__ == "__main__":
    main()
