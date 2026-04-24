#!/usr/bin/env python3
"""parse_wrangler_output.py
Purpose:   Classify Wrangler dry-run output into fail-on-warning/fail-on-error
           buckets backed by captured fixtures.
Called by: Planned audit-source.sh schema gate and any future worker preview
           probe workflow that runs `wrangler deploy --dry-run`.
Usage:     python3 .github/scripts/parse_wrangler_output.py --stdout out.txt --stderr err.txt [--json]
Exit:      0 = clean (no matched warning/error class)
           1 = matched warning/error class
           2 = usage/tooling error
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from typing import Dict, List, Optional


ANSI_RE = re.compile(r"\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")


@dataclass(frozen=True)
class PatternSpec:
    name: str
    regex: re.Pattern[str]


@dataclass(frozen=True)
class RuleSpec:
    name: str
    severity: str
    patterns: List[PatternSpec]


RULES = [
    RuleSpec(
        name="npm_layer_error",
        severity="error",
        patterns=[
            PatternSpec(
                name="no_matching_version",
                regex=re.compile(r"No matching version found for wrangler@\S+"),
            )
        ],
    ),
    RuleSpec(
        name="missing_entry_point",
        severity="error",
        patterns=[
            PatternSpec(
                name="missing_entry_point",
                regex=re.compile(r"Missing entry-point to Worker script or to assets directory"),
            )
        ],
    ),
    RuleSpec(
        name="missing_config",
        severity="error",
        patterns=[
            PatternSpec(
                name="could_not_read_file",
                regex=re.compile(r"Could not read file:\s*(?P<path>.+)$"),
            ),
            PatternSpec(
                name="enoent",
                regex=re.compile(r"ENOENT: no such file or directory"),
            ),
        ],
    ),
    RuleSpec(
        name="unknown_top_level_key",
        severity="warning",
        patterns=[
            PatternSpec(
                name="unexpected_top_level_field",
                regex=re.compile(r'Unexpected fields found in top-level field:\s*"(?P<field>[^"]+)"'),
            )
        ],
    ),
]

RULES_BY_NAME = {rule.name: rule for rule in RULES}


def strip_ansi(text: str) -> str:
    return ANSI_RE.sub("", text)


def load_text(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="replace") as handle:
        return handle.read()


def normalize_channel(text: str) -> List[str]:
    return [strip_ansi(line.rstrip("\n")) for line in text.splitlines()]


def build_channels(stdout_text: str, stderr_text: str) -> Dict[str, List[str]]:
    return {
        "stdout": normalize_channel(stdout_text),
        "stderr": normalize_channel(stderr_text),
    }


def find_pattern_match(pattern: PatternSpec, channels: Dict[str, List[str]]) -> Optional[Dict[str, object]]:
    for channel_name in ("stdout", "stderr"):
        for line_number, line in enumerate(channels[channel_name], start=1):
            match = pattern.regex.search(line)
            if match:
                return {
                    "pattern": pattern.name,
                    "regex": pattern.regex.pattern,
                    "channel": channel_name,
                    "line": line_number,
                    "text": line,
                    "groups": match.groupdict(),
                }
    return None


def find_rule_matches(rule: RuleSpec, stdout_text: str, stderr_text: str) -> Optional[List[Dict[str, object]]]:
    channels = build_channels(stdout_text, stderr_text)
    matches = []
    for pattern in rule.patterns:
        match = find_pattern_match(pattern, channels)
        if not match:
            return None
        matches.append(match)
    return matches


def classify_output(stdout_text: str, stderr_text: str) -> Dict[str, object]:
    for rule in RULES:
        matches = find_rule_matches(rule, stdout_text, stderr_text)
        if matches:
            return {
                "classification": rule.name,
                "severity": rule.severity,
                "matches": matches,
            }
    return {
        "classification": "clean",
        "severity": "ok",
        "matches": [],
    }


def parse_args(argv: List[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Classify Wrangler stdout/stderr fixtures.")
    parser.add_argument("--stdout", required=True, help="Path to captured stdout file")
    parser.add_argument("--stderr", required=True, help="Path to captured stderr file")
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of plain text")
    return parser.parse_args(argv)


def render_text(result: Dict[str, object]) -> str:
    lines = [
        "classification=" + str(result["classification"]),
        "severity=" + str(result["severity"]),
    ]
    for match in result["matches"]:
        lines.append(
            "match="
            + str(match["pattern"])
            + " channel="
            + str(match["channel"])
            + " line="
            + str(match["line"])
            + " text="
            + str(match["text"])
        )
    return "\n".join(lines)


def main(argv: List[str]) -> int:
    try:
        args = parse_args(argv)
        stdout_text = load_text(args.stdout)
        stderr_text = load_text(args.stderr)
        result = classify_output(stdout_text, stderr_text)
    except (OSError, ValueError) as exc:
        sys.stderr.write("parse_wrangler_output: " + str(exc) + "\n")
        return 2

    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print(render_text(result))
    return 0 if result["classification"] == "clean" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
