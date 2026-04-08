#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

echo "== FLOW HOTSPOTS =="
patterns=(
  'google\.script\.run'
  'appendRow\('
  'setValue\('
  'setValues\('
  'doGet\('
  'doPost\('
  'LockService'
  'CacheService'
  'PropertiesService'
  'approve'
  'reject'
  'save'
  'submit'
  'render'
)

for pattern in "${patterns[@]}"; do
  echo
  echo "-- $pattern --"
  grep -RniE --include='*.gs' --include='*.html' --include='*.js' "$pattern" . || true
done
