#!/usr/bin/env python3
"""
Parse TBM smoke + regression test results from the GAS ?action=runTests endpoint.

Called by: .github/workflows/ci.yml
Env vars expected:
  TEST_RESPONSE    — raw JSON response string from the GAS endpoint
  GITHUB_OUTPUT    — GitHub Actions output file path

Outputs:
  test_summary.md  — formatted PR comment
  GITHUB_OUTPUT: overall=PASS|FAIL|UNKNOWN
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


def parse_overall(response_text):
    """Extract the overall result from the JSON response."""
    try:
        data = json.loads(response_text)
        return data.get("overall", "UNKNOWN")
    except Exception:
        return "ERROR"


def format_summary(response_text):
    """Format the test response into a Markdown summary."""
    try:
        data = json.loads(response_text)
        smoke = data.get("smoke", {})
        reg = data.get("regression", {})
        versions = data.get("versions", {})

        overall = data.get("overall", "UNKNOWN")
        icon = "PASS" if overall == "PASS" else "FAIL"

        lines = []
        lines.append("## %s TBM Test Results: %s" % (icon, overall))
        lines.append("")
        lines.append(
            "**Smoke Test:** %s (%sms)"
            % (smoke.get("overall", "?"), smoke.get("runtime_ms", "?"))
        )
        lines.append(
            "**Regression:** %s — %s/%s passed"
            % (reg.get("overall", "?"), reg.get("passed", "?"), reg.get("total", "?"))
        )
        lines.append("")

        # Show failures if any
        if reg.get("failed", 0) > 0:
            lines.append("### Failures:")
            for assertion in reg.get("assertions", []):
                if assertion.get("status") == "FAIL":
                    lines.append(
                        "- **%s**: %s"
                        % (assertion.get("id", "?"), assertion.get("description", ""))
                    )
                    lines.append("  %s" % assertion.get("details", ""))
            lines.append("")

        version_parts = []
        for k, v in versions.items():
            version_parts.append("%s %s" % (k, v))
        lines.append("**Versions:** %s" % ", ".join(version_parts))
        lines.append("**Timestamp:** %s" % data.get("timestamp", "?"))

        return "\n".join(lines)
    except Exception as exc:
        return "Warning: Could not parse test results: %s" % exc


def main():
    response_text = os.environ.get("TEST_RESPONSE", "")

    if not response_text:
        # Try reading from stdin as fallback
        response_text = sys.stdin.read()

    overall = parse_overall(response_text)
    write_github_output("overall", overall)

    summary = format_summary(response_text)
    with open("test_summary.md", "w") as f:
        f.write(summary)

    print(summary)
    print("")
    if overall == "PASS":
        print("All tests passed")
    else:
        print("Tests failed — merge blocked")
        sys.exit(1)


if __name__ == "__main__":
    main()
