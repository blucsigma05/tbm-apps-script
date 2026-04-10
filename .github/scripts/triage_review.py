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
CODE_EXTENSIONS = set([
    ".py", ".js", ".ts", ".yml", ".yaml", ".gs", ".html", ".sh", ".json"
])


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
    """Return True if the file is generated (by name, header comment, or skip-list).

    Extension-agnostic: vocab.generated.js qualifies even though .js is a code extension.
    HOT-path handling is the caller's responsibility — this function does not check paths.
    """
    basename = os.path.basename(filepath)
    # (a) Filename pattern: *.generated.* — 'generated' in any dot-delimited segment
    parts = basename.split(".")
    if len(parts) >= 3 and "generated" in [p.lower() for p in parts]:
        return True
    # (b) Explicit skip-list match (extension-agnostic glob patterns)
    norm = filepath.replace("\\", "/")
    for pattern in skip_patterns:
        if fnmatch.fnmatch(norm, pattern) or fnmatch.fnmatch(basename, pattern):
            return True
    # (c) Content check: first 20 lines — any DO NOT EDIT BY HAND variant
    DO_NOT_EDIT_MARKERS = [
        "// DO NOT EDIT BY HAND",
        "# DO NOT EDIT BY HAND",
        "/* DO NOT EDIT BY HAND */",
        "DO NOT EDIT BY HAND",  # catch bare variant in XML/HTML comments
    ]
    if os.path.isfile(filepath):
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                for i, line in enumerate(f):
                    if i >= 20:
                        break
                    for marker in DO_NOT_EDIT_MARKERS:
                        if marker in line:
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

    # Identify generated files that are NOT in a HOT path — those qualify for skip.
    # Generated files inside HOT paths (e.g. .github/scripts/generated_config.py)
    # are trust-sensitive infrastructure and always trigger FULL review.
    generated_non_hot = [
        fp for fp in generated_files
        if not is_hot_file(fp, always_full_patterns)
    ]
    generated_in_hot = [
        fp for fp in generated_files
        if is_hot_file(fp, always_full_patterns)
    ]

    # Docs-only skip: every file is a docs/spec file AND no code extensions present
    all_non_code = len(code_files_present) == 0
    non_docs_files = [fp for fp in files if not is_docs_file(fp)]

    zero_diff = diff_bytes == 0

    # skip: zero-byte diff (binary-only)
    if zero_diff and len(files) > 0:
        mode = "skip"
        reason = "binary-only PR: zero-byte diff with %d changed file(s)" % len(files)

    # full: any HOT file touched — checked BEFORE docs-only and generated-only skip
    # paths so that CLAUDE.md, audit-source.sh, and workflow files always get full
    # review even if the rest of the PR looks like docs or generated content.
    elif hot_files_touched:
        mode = "full"
        reason = "HOT file touched: %s" % ", ".join(hot_files_touched[:3])
        if len(hot_files_touched) > 3:
            reason += " (+%d more)" % (len(hot_files_touched) - 3)

    # skip (docs-only path): all files are docs/specs AND no code extensions present
    elif len(non_docs_files) == 0 and all_non_code and len(files) > 0:
        mode = "skip"
        reason = "all changed files are docs/specs (no code files touched)"

    # skip (generated path): all files are generated AND none are in HOT paths
    # NOTE: extension-agnostic — vocab.generated.js qualifies. HOT-path carve-out
    # means a generated file in .github/ still triggers full, not skip.
    elif (len(files) > 0
          and len(generated_non_hot) == len(files)
          and len(generated_in_hot) == 0):
        mode = "skip"
        reason = "all changed files are generated (outside HOT paths): %s" % (
            ", ".join(generated_non_hot[:3])
            + (" (+%d more)" % (len(generated_non_hot) - 3) if len(generated_non_hot) > 3 else "")
        )

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
