#!/usr/bin/env bash
# verify-cwd.sh — Session pre-flight for Sonnet build threads (#420)
# Run at session start to ensure the shell is in the repo root so that
# .claude/settings.local.json is loaded and MCP tools don't re-prompt.
#
# Usage: bash .claude/verify-cwd.sh
# Or inline: source .claude/verify-cwd.sh

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"

if [ -z "$REPO_ROOT" ]; then
  echo "✗ Not inside a git repository. Navigate to C:/Dev/tbm-apps-script first."
  exit 1
fi

if [ "$(pwd)" != "$REPO_ROOT" ]; then
  cd "$REPO_ROOT" || exit 1
  echo "✓ Changed to repo root: $REPO_ROOT"
else
  echo "✓ Already in repo root: $REPO_ROOT"
fi

SETTINGS="$REPO_ROOT/.claude/settings.local.json"
if [ -f "$SETTINGS" ]; then
  echo "✓ .claude/settings.local.json present — repo-scoped permissions active."
else
  echo "✗ .claude/settings.local.json missing — MCP tools will prompt."
  exit 1
fi
