#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

echo "== SCHEMA / STATE HOTSPOTS =="
patterns=(
  'getSheetByName\('
  'getRange\('
  'getLastRow\('
  'getLastColumn\('
  'appendRow\('
  'setValue\('
  'setValues\('
  'getValues\('
  'PropertiesService'
  'CacheService'
  'LockService'
  'ScriptProperties'
  'UserProperties'
  'DocumentProperties'
)

for pattern in "${patterns[@]}"; do
  echo
  echo "-- $pattern --"
  grep -RniE --include='*.gs' --include='*.js' --include='*.html' "$pattern" . || true
done
