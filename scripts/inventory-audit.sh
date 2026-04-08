#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

echo "== REPO ROOT =="
pwd

echo
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "== GIT STATUS =="
  git status --short || true
  echo
  echo "== CURRENT BRANCH =="
  git branch --show-current || true
  echo
  echo "== DIFF STAT =="
  git diff --stat || true
fi

echo
if command -v find >/dev/null 2>&1; then
  echo "== KEY FILES =="
  find . \
    -type f \( -name "*.gs" -o -name "*.html" -o -name "*.js" -o -name "*.json" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" \) \
    | sort
fi

echo
for dir in .github docs scripts tests; do
  if [ -d "$dir" ]; then
    echo "== DIR: $dir =="
    find "$dir" -maxdepth 2 -type f | sort
    echo
  fi
done
