#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

echo "== GIT STATUS =="
git status --short || true

echo
echo "== DIFF STAT =="
git diff --stat || true

echo
echo "== CHANGED FILES =="
git diff --name-only || true

echo
echo "== TODO / FIXME =="
grep -RniE --include='*.gs' --include='*.html' --include='*.js' --include='*.md' 'TODO|FIXME|HACK|XXX' . || true
