#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TBM Static Source Audit — runs BEFORE clasp push
# Exit code 0 = PASS, 1 = FAIL
# ═══════════════════════════════════════════════════════════════

FAIL=0
WARN=0

echo "=== TBM STATIC SOURCE AUDIT ==="
echo ""

# ── ES5 COMPLIANCE (all .html files) ──────────────────────────
echo "--- ES5 Compliance ---"

ES5_FAIL=0

# Only scan <script> blocks — skip HTML content, comments, CSS
# Each check uses targeted grep to minimize false positives

# let/const as variable declarations (not inside strings or comments)
LC=$(grep -rn "^\s*\(var\|if\|for\|else\|}\)\?" *.html 2>/dev/null | grep -v "<!--" | grep "\blet \b\|\bconst \b" | grep -v "//.*\blet \|\bconst " | head -10)
if [ -n "$LC" ]; then
  echo "  X BANNED: let/const declarations"
  echo "$LC" | sed 's/^/      /'
  ES5_FAIL=1
fi

# Arrow functions: => preceded by ) or identifier (not => in HTML attributes or URLs)
AR=$(grep -rn "=>" *.html 2>/dev/null | grep -v "<!--" | grep -v "http" | grep -v "\.css" | grep -v "placeholder=" | grep -v "textContent=" | grep -v "innerHTML=" | grep -v "'.*=>.*'" | grep -v '".*=>.*"' | head -10)
if [ -n "$AR" ]; then
  # Further filter: only flag lines that look like JS arrow functions
  AR2=$(echo "$AR" | grep "[)a-zA-Z_] *=>" | head -10)
  if [ -n "$AR2" ]; then
    echo "  X BANNED: arrow functions (=>)"
    echo "$AR2" | sed 's/^/      /'
    ES5_FAIL=1
  fi
fi

# Template literals (backtick)
TL=$(grep -rn '`' *.html 2>/dev/null | grep -v "<!--" | head -10)
if [ -n "$TL" ]; then
  echo "  X BANNED: template literals (backtick)"
  echo "$TL" | sed 's/^/      /'
  ES5_FAIL=1
fi

# Nullish coalescing (??) — use fixed-string grep to avoid regex issues
NC=$(grep -rn -F '??' *.html 2>/dev/null | grep -v "<!--" | grep -v "http" | head -10)
if [ -n "$NC" ]; then
  echo "  X BANNED: nullish coalescing (??)"
  echo "$NC" | sed 's/^/      /'
  ES5_FAIL=1
fi

# Optional chaining (?.) — use fixed string then filter
OC=$(grep -rn -F '?.' *.html 2>/dev/null | grep -v "<!--" | grep -v "http" | grep -v "<meta" | grep -v "\.css" | grep -v "content=" | head -10)
if [ -n "$OC" ]; then
  # Only flag lines where ?. appears after an identifier (JS optional chaining pattern)
  OC2=$(echo "$OC" | grep '[a-zA-Z_\])\?]\?\.' | grep -v "style=" | grep -v "class=" | head -10)
  if [ -n "$OC2" ]; then
    echo "  X BANNED: optional chaining (?.)"
    echo "$OC2" | sed 's/^/      /'
    ES5_FAIL=1
  fi
fi

# .includes( on arrays/strings in JS context
INC=$(grep -rn "\.includes(" *.html 2>/dev/null | grep -v "<!--" | grep -v "\.css" | head -10)
if [ -n "$INC" ]; then
  echo "  X BANNED: .includes()"
  echo "$INC" | sed 's/^/      /'
  ES5_FAIL=1
fi

# URLSearchParams
USP=$(grep -rn "new URLSearchParams\|URLSearchParams(" *.html 2>/dev/null | grep -v "<!--" | grep -v "//" | head -10)
if [ -n "$USP" ]; then
  echo "  X BANNED: URLSearchParams"
  echo "$USP" | sed 's/^/      /'
  ES5_FAIL=1
fi

# Object.entries/Object.values
OBJ=$(grep -rn "Object\.entries(\|Object\.values(" *.html 2>/dev/null | grep -v "<!--" | head -10)
if [ -n "$OBJ" ]; then
  echo "  X BANNED: Object.entries/Object.values"
  echo "$OBJ" | sed 's/^/      /'
  ES5_FAIL=1
fi

# async/await as keywords (not in strings or comments)
AW=$(grep -rn "\basync function\b\|\bawait \b" *.html 2>/dev/null | grep -v "<!--" | grep -v "//" | grep -v "'[^']*async[^']*'" | grep -v '"[^"]*async[^"]*"' | head -10)
if [ -n "$AW" ]; then
  echo "  X BANNED: async/await"
  echo "$AW" | sed 's/^/      /'
  ES5_FAIL=1
fi

# Spread operator (...) as JS syntax (not in strings)
# Look for ...identifier or ...[  but not inside quotes
SPR=$(grep -rn '\.\.\.[a-zA-Z_\[]' *.html 2>/dev/null | grep -v "<!--" | grep -v "placeholder" | grep -v "textContent" | grep -v "innerHTML" | grep -v "'[^']*\.\.\.[^']*'" | grep -v '"[^"]*\.\.\.[^"]*"' | head -10)
if [ -n "$SPR" ]; then
  echo "  X BANNED: spread operator (...)"
  echo "$SPR" | sed 's/^/      /'
  ES5_FAIL=1
fi

# backdrop-filter CSS check
BF=$(grep -rn "backdrop-filter" *.html 2>/dev/null | head -5)
if [ -n "$BF" ]; then
  echo "  X BANNED CSS: backdrop-filter"
  echo "$BF" | sed 's/^/      /'
  ES5_FAIL=1
fi

if [ $ES5_FAIL -eq 1 ]; then
  echo "  FAIL -- ES5 compliance FAILED"
  FAIL=1
else
  echo "  OK -- ES5 compliance PASSED"
fi

echo ""

# ── getActiveSpreadsheet() USAGE ──────────────────────────────
echo "--- Trigger-Safe Spreadsheet Access ---"

# Count occurrences, report as warning (many are legacy/doGet-context, known tech debt)
GAS_COUNT=$(grep -rn "getActiveSpreadsheet" *.js 2>/dev/null | grep -v "//.*getActive" | grep -v "NEVER" | grep -v "never" | wc -l)
if [ "$GAS_COUNT" -gt 0 ]; then
  echo "  INFO -- $GAS_COUNT getActiveSpreadsheet() calls in server code"
  echo "  (Known tech debt — doGet context + legacy. New code must use openById.)"
  WARN=$((WARN + 1))
else
  echo "  OK -- No getActiveSpreadsheet() in server code"
fi

echo ""

# ── VERSION CONSISTENCY ───────────────────────────────────────
echo "--- Version Consistency ---"

VER_FAIL=0
for jsfile in *.js; do
  case "$jsfile" in
    generate-audio.js|node_modules*) continue ;;
  esac

  VER_FN=$(grep -o "return [0-9]*;" "$jsfile" | head -1 | grep -o "[0-9]*")
  VER_HDR=$(head -3 "$jsfile" | grep -oi "v[0-9]*" | head -1 | grep -o "[0-9]*")
  VER_EOF=$(tail -1 "$jsfile" | grep -oi "v[0-9]*" | head -1 | grep -o "[0-9]*")

  if [ -n "$VER_FN" ] && [ -n "$VER_HDR" ] && [ -n "$VER_EOF" ]; then
    if [ "$VER_FN" != "$VER_HDR" ] || [ "$VER_FN" != "$VER_EOF" ]; then
      echo "  X $jsfile: header=v$VER_HDR function=v$VER_FN eof=v$VER_EOF"
      VER_FAIL=1
    fi
  fi
done

if [ $VER_FAIL -eq 1 ]; then
  echo "  FAIL -- Version consistency FAILED"
  FAIL=1
else
  echo "  OK -- Version consistency PASSED"
fi

echo ""

# ── eval() USAGE ──────────────────────────────────────────────
echo "--- eval() Usage ---"

EVAL_MATCHES=$(grep -rn "eval(" *.js 2>/dev/null | grep -v "//.*eval" | grep -v "test" | grep -v "Test" | head -10)
if [ -n "$EVAL_MATCHES" ]; then
  echo "  WARN -- eval() found (prefer this[fn]() pattern):"
  echo "$EVAL_MATCHES" | sed 's/^/      /'
  WARN=$((WARN + 1))
else
  echo "  OK -- No eval() in server code"
fi

echo ""

# ── SUMMARY ───────────────────────────────────────────────────
echo "=== SUMMARY ==="
echo "Failures:  $FAIL"
echo "Warnings:  $WARN"
echo ""

if [ $FAIL -gt 0 ]; then
  echo "FAIL -- STATIC AUDIT FAILED -- do NOT push to GAS"
  exit 1
elif [ $WARN -gt 0 ]; then
  echo "WARN -- STATIC AUDIT PASSED WITH WARNINGS -- review before pushing"
  exit 0
else
  echo "PASS -- STATIC AUDIT PASSED -- safe to push"
  exit 0
fi
