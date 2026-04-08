#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# TBM Deep Audit — runs before merge / during formal audit
# Checks patterns that audit-source.sh does NOT cover.
# Exit code 0 = PASS, 1 = FAIL
#
# Called by: manual, Codex Actions, Claude Code skills
# Env vars: none required
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

# CD to repo root (handles being called from scripts/ or repo root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

FAIL=0
WARN=0

echo "=== TBM DEEP AUDIT ==="
echo "Root: $ROOT"
echo ""

# ── Helper: skip worktree copies ─────────────────────────────
# All greps exclude .claude/worktrees/ to avoid false positives
EXCLUDE="--exclude-dir=.claude --exclude-dir=node_modules --exclude-dir=.wrangler"

# ═══════════════════════════════════════════════════════════════
# CHECK 1: TAB_MAP BYPASS
# Find getSheetByName() calls with string literals that contain
# emoji (Unicode) instead of going through TAB_MAP.
# Legitimate: getSheetByName(TAB_MAP['ErrorLog'])
# Blocker:    getSheetByName('💻 ErrorLog')
# ═══════════════════════════════════════════════════════════════
echo "--- TAB_MAP Bypass Detection ---"

# Match getSheetByName with a string literal containing common emoji prefixes
# Unicode ranges: emoji are generally U+1F000+ but sheet prefixes use specific ones
# Simpler: flag any getSheetByName('...') where the string is NOT a plain ASCII name
# that would be a TAB_MAP key
TABMAP_BYPASS=$(grep -rn $EXCLUDE --include='*.js' "getSheetByName(" . 2>/dev/null \
  | grep -v "TAB_MAP" \
  | grep -v "//.*getSheetByName" \
  | grep -v "tabName\|sheetName\|name\|tab)" \
  | grep "getSheetByName('[^']*')" \
  || true)

if [ -n "$TABMAP_BYPASS" ]; then
  COUNT=$(echo "$TABMAP_BYPASS" | wc -l)
  echo "  X FAIL -- $COUNT getSheetByName() calls bypass TAB_MAP:"
  echo "$TABMAP_BYPASS" | sed 's/^/      /'
  FAIL=1
else
  echo "  OK -- All getSheetByName() calls use TAB_MAP or variables"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 2: SSID HARDCODING
# Find openById() with the literal SSID string outside TBMConfig.
# TBMConfig.js is the ONE legitimate location.
# ═══════════════════════════════════════════════════════════════
echo "--- SSID Hardcoding ---"

SSID_PATTERN="1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c"
SSID_HITS=$(grep -rn $EXCLUDE --include='*.js' -F "$SSID_PATTERN" . 2>/dev/null \
  | grep -v "TBMConfig" \
  | grep -v "CLAUDE\|README\|\.md" \
  | grep -v "//.*$SSID_PATTERN" \
  || true)

if [ -n "$SSID_HITS" ]; then
  COUNT=$(echo "$SSID_HITS" | wc -l)
  echo "  X FAIL -- $COUNT hardcoded SSID references outside TBMConfig:"
  echo "$SSID_HITS" | sed 's/^/      /'
  FAIL=1
else
  echo "  OK -- SSID only appears in TBMConfig"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 3: NOTION TOKEN CONSISTENCY
# All getProperty('NOTION_...') calls for the API token must use
# the same key name. Mixed NOTION_API_KEY / NOTION_TOKEN = B-06.
# ═══════════════════════════════════════════════════════════════
echo "--- Notion Token Consistency ---"

NOTION_KEYS=$(grep -rn $EXCLUDE --include='*.js' "getProperty('NOTION_" . 2>/dev/null \
  | grep -v "//.*getProperty" \
  | grep -o "NOTION_[A-Z_]*" \
  | sort -u \
  || true)

# Filter to just token-like keys (not DB IDs)
TOKEN_KEYS=$(echo "$NOTION_KEYS" | grep -v "_DB\|_DB_ID\|_HEALTH" || true)

TOKEN_COUNT=$(echo "$TOKEN_KEYS" | grep -c "." 2>/dev/null || true)

if [ "$TOKEN_COUNT" -gt 1 ]; then
  echo "  X FAIL -- Multiple Notion token property names found:"
  echo "$TOKEN_KEYS" | sed 's/^/      /'
  echo "    Files:"
  for key in $TOKEN_KEYS; do
    grep -rn $EXCLUDE --include='*.js' "getProperty('$key')" . 2>/dev/null | sed 's/^/      /' || true
  done
  FAIL=1
elif [ "$TOKEN_COUNT" -eq 1 ]; then
  echo "  OK -- Single Notion token key: $TOKEN_KEYS"
else
  echo "  OK -- No Notion token properties found (skip)"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 4: LOCK COVERAGE ON WRITE PATHS
# Find functions that call appendRow/setValue/setValues without
# LockService in the same function. Advisory — some single-user
# functions legitimately skip locks.
# ═══════════════════════════════════════════════════════════════
echo "--- Lock Coverage (Advisory) ---"

# Strategy: find .js files with write calls, check if they also have LockService
WRITE_FILES=$(grep -rl $EXCLUDE --include='*.js' -E "appendRow\(|\.setValue\(|\.setValues\(" . 2>/dev/null || true)
LOCK_WARN=0

for f in $WRITE_FILES; do
  BASENAME=$(basename "$f")
  HAS_LOCK=$(grep -c "LockService\|waitLock" "$f" 2>/dev/null || true)
  HAS_WRITES=$(grep -c "appendRow\|\.setValue\|\.setValues" "$f" 2>/dev/null || true)

  if [ "$HAS_WRITES" -gt 0 ] && [ "$HAS_LOCK" -eq 0 ]; then
    echo "  WARN -- $BASENAME: $HAS_WRITES write calls, 0 lock usage"
    LOCK_WARN=$((LOCK_WARN + 1))
  fi
done

if [ "$LOCK_WARN" -gt 0 ]; then
  echo "  ($LOCK_WARN files write without any LockService — review for concurrency risk)"
  WARN=$((WARN + 1))
else
  echo "  OK -- All files with write calls also use LockService"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 5: BARE PRIORITY IN sendPush_
# All sendPush_() calls must use PUSHOVER_PRIORITY.CONSTANT,
# not bare integers (0, 1, 2, -1, -2).
# ═══════════════════════════════════════════════════════════════
echo "--- Pushover Priority Constants ---"

# Find sendPush_ calls and check 4th argument for bare numbers
BARE_PRIORITY=$(grep -rn $EXCLUDE --include='*.js' "sendPush_(" . 2>/dev/null \
  | grep -v "//.*sendPush_" \
  | grep -v "function sendPush_" \
  | grep -v "PUSHOVER_PRIORITY\." \
  | grep -vi "testPushover\|function test" \
  || true)

if [ -n "$BARE_PRIORITY" ]; then
  COUNT=$(echo "$BARE_PRIORITY" | wc -l)
  echo "  X FAIL -- $COUNT sendPush_() calls without PUSHOVER_PRIORITY constant:"
  echo "$BARE_PRIORITY" | sed 's/^/      /'
  FAIL=1
else
  echo "  OK -- All sendPush_() calls use PUSHOVER_PRIORITY constants"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 6: HARDCODED NOTION DB IDs
# Notion database IDs (32-char hex with dashes) should be in
# Script Properties, not inline in code.
# ═══════════════════════════════════════════════════════════════
echo "--- Hardcoded Notion DB IDs ---"

# Match 32-char Notion ID pattern (with or without dashes)
NOTION_IDS=$(grep -rn $EXCLUDE --include='*.js' -E "['\"][0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}['\"]" . 2>/dev/null \
  | grep -v "//.*[0-9a-f]" \
  | grep -v "SSID\|openById\|SNAPSHOT\|SCRIPT_ID" \
  | grep -v "test\|Test\|spec\|Spec" \
  || true)

if [ -n "$NOTION_IDS" ]; then
  COUNT=$(echo "$NOTION_IDS" | wc -l)
  echo "  WARN -- $COUNT possible hardcoded Notion/external IDs:"
  echo "$NOTION_IDS" | sed 's/^/      /'
  WARN=$((WARN + 1))
else
  echo "  OK -- No hardcoded external IDs found"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 7: getActiveSpreadsheet IN NON-LEGACY CODE
# New code must use openById(SSID). Flag any getActiveSpreadsheet
# that isn't in a comment or known legacy location.
# ═══════════════════════════════════════════════════════════════
echo "--- getActiveSpreadsheet Usage ---"

ACTIVE_SS=$(grep -rn $EXCLUDE --include='*.js' "getActiveSpreadsheet()" . 2>/dev/null \
  | grep -v "//.*getActive" \
  | grep -v "NEVER\|never\|TODO\|FIXME" \
  || true)

if [ -n "$ACTIVE_SS" ]; then
  COUNT=$(echo "$ACTIVE_SS" | wc -l)
  echo "  WARN -- $COUNT getActiveSpreadsheet() calls (should use openById):"
  echo "$ACTIVE_SS" | sed 's/^/      /'
  WARN=$((WARN + 1))
else
  echo "  OK -- No getActiveSpreadsheet() calls"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# CHECK 8: tryLock USAGE
# Must use waitLock(30000), never tryLock().
# ═══════════════════════════════════════════════════════════════
echo "--- tryLock Usage ---"

TRYLOCK=$(grep -rn $EXCLUDE --include='*.js' "tryLock(" . 2>/dev/null \
  | grep -v "//.*tryLock" \
  | grep -vi "test\|regression\|spec\|details:" \
  || true)

if [ -n "$TRYLOCK" ]; then
  COUNT=$(echo "$TRYLOCK" | wc -l)
  echo "  X FAIL -- $COUNT tryLock() calls (must use waitLock):"
  echo "$TRYLOCK" | sed 's/^/      /'
  FAIL=1
else
  echo "  OK -- No tryLock() calls"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════
echo "=== DEEP AUDIT SUMMARY ==="
echo "Failures:  $FAIL"
echo "Warnings:  $WARN"
echo ""

if [ $FAIL -gt 0 ]; then
  echo "FAIL -- DEEP AUDIT FAILED -- resolve before merge"
  exit 1
elif [ $WARN -gt 0 ]; then
  echo "WARN -- DEEP AUDIT PASSED WITH WARNINGS -- review before merge"
  exit 0
else
  echo "PASS -- DEEP AUDIT PASSED"
  exit 0
fi
