#!/usr/bin/env bash
# verify-cwd.sh — Session pre-flight for Sonnet build threads (#420)
#
# MUST be sourced to actually change the parent shell's cwd:
#   source .claude/verify-cwd.sh
#
# Running as `bash .claude/verify-cwd.sh` only affects a child shell.
# The script detects this and prints the cd command to run manually.

# Derive repo root from this script's own location, not from cwd.
# Works even when invoked from outside the git worktree.
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_PATH")"

# Detect if sourced (runs in parent shell) or executed (child shell only)
_SOURCED=0
if [ "${BASH_SOURCE[0]}" != "${0}" ]; then
  _SOURCED=1
fi

if [ "$(pwd)" = "$REPO_ROOT" ]; then
  echo "✓ Already in repo root: $REPO_ROOT"
else
  if [ "$_SOURCED" = "1" ]; then
    cd "$REPO_ROOT" || exit 1
    echo "✓ Changed to repo root: $REPO_ROOT"
  else
    echo "✗ Not in repo root. Run this to fix (sourcing is required to affect your shell):"
    echo "    source .claude/verify-cwd.sh"
    echo "  Or cd manually: cd \"$REPO_ROOT\""
    exit 1
  fi
fi

SETTINGS="$REPO_ROOT/.claude/settings.local.json"
if [ -f "$SETTINGS" ]; then
  echo "✓ .claude/settings.local.json present — repo-scoped permissions active."
else
  echo "✗ .claude/settings.local.json missing — MCP tools will prompt."
  exit 1
fi
