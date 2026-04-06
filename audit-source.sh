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

# ── withFailureHandler() WIRING ──────────────────────────────
echo "--- google.script.run Failure Handler Wiring ---"

# NOTE: google.script.run appears multiple times per chain (comments, multi-line)
# so raw grep count is unreliable. withSuccessHandler count = actual call chains.
# Compare withFailureHandler to withSuccessHandler for accurate wiring check.

FH_FAIL=0
for htmlfile in *.html; do
  SUCCESS_COUNT=$(grep -c "withSuccessHandler" "$htmlfile" 2>/dev/null || true)
  HANDLER_COUNT=$(grep -c "withFailureHandler" "$htmlfile" 2>/dev/null || true)

  SUCCESS_COUNT=${SUCCESS_COUNT:-0}
  HANDLER_COUNT=${HANDLER_COUNT:-0}

  if [ "$SUCCESS_COUNT" -gt 0 ] && [ "$HANDLER_COUNT" -lt "$SUCCESS_COUNT" ]; then
    GAP=$((SUCCESS_COUNT - HANDLER_COUNT))
    echo "  X $htmlfile: $SUCCESS_COUNT chains, $HANDLER_COUNT failure handlers ($GAP missing)"
    FH_FAIL=1
  fi
done

if [ $FH_FAIL -eq 1 ]; then
  echo "  FAIL -- withFailureHandler() wiring FAILED"
  echo "  (Every google.script.run call MUST have withFailureHandler — CLAUDE.md Tier 1, #10)"
  FAIL=1
else
  echo "  OK -- withFailureHandler() wiring PASSED"
fi

echo ""

# ── ROUTE INTEGRITY (Worker ↔ GAS Router ↔ HTML files) ───────
echo "--- Route Integrity ---"

ROUTE_FAIL=0

# Extract worker clean routes — get the page= value for each worker route
WORKER_PAGES=$(grep -o "page: *'[a-z-]*'" cloudflare-worker.js 2>/dev/null | sed "s/page: *'//;s/'//" | sort -u)

# Extract GAS route keys from servePage() routes object
GAS_ROUTES=$(grep -o "'[a-z-]*' *: *{" Code.js 2>/dev/null | sed "s/' *: *{//;s/'//" | sort -u)

# Extract GAS route file mappings from htmlSource handler in serveData (action=htmlSource path)
GAS_HTMLSOURCE=$(awk "/if .action === 'htmlSource'./,/^[[:space:]]*\};/" Code.js 2>/dev/null | grep -o "'[a-z-]*':" | tr -d "':" | sort -u)

# Extract GAS route file mappings (route → file name)
GAS_FILES=$(grep -o "file: *'[^']*'" Code.js 2>/dev/null | sed "s/file: *'//;s/'//" | sort -u)

# Guard: fail if extraction returned nothing (regex/formatting change would silently pass)
if [ -z "$WORKER_PAGES" ]; then
  echo "  X Route extraction returned empty WORKER_PAGES — check cloudflare-worker.js format"
  ROUTE_FAIL=1
fi
if [ -z "$GAS_ROUTES" ]; then
  echo "  X Route extraction returned empty GAS_ROUTES — check Code.js servePage format"
  ROUTE_FAIL=1
fi
if [ -z "$GAS_FILES" ]; then
  echo "  X Route extraction returned empty GAS_FILES — check Code.js file: mappings"
  ROUTE_FAIL=1
fi
if [ -z "$GAS_HTMLSOURCE" ]; then
  echo "  X Route extraction returned empty GAS_HTMLSOURCE — check Code.js serveData htmlSource block format"
  ROUTE_FAIL=1
fi

# Check 1: Every worker page= target has a GAS route entry
for page in $WORKER_PAGES; do
  if ! echo "$GAS_ROUTES" | grep -q "^${page}$"; then
    echo "  X Worker targets page=${page} but no GAS route entry found in servePage()"
    ROUTE_FAIL=1
  fi
done

# Check 1b: Every worker page= target also has an htmlSource mapping (serveData path)
for page in $WORKER_PAGES; do
  if ! echo "$GAS_HTMLSOURCE" | grep -q "^${page}$"; then
    echo "  X Worker page=${page} missing from htmlSource handler in serveData()"
    ROUTE_FAIL=1
  fi
done

# Check 2: Every GAS route file has a backing .html file
for htmlname in $GAS_FILES; do
  if [ ! -f "${htmlname}.html" ]; then
    echo "  X GAS route references ${htmlname}.html but file does not exist"
    ROUTE_FAIL=1
  fi
done

if [ $ROUTE_FAIL -eq 1 ]; then
  echo "  FAIL -- Route integrity FAILED"
  FAIL=1
else
  echo "  OK -- Route integrity PASSED ($(echo "$WORKER_PAGES" | wc -w) worker pages, $(echo "$GAS_HTMLSOURCE" | wc -w) htmlSource mappings, $(echo "$GAS_FILES" | wc -w) backing files)"
fi

echo ""

# ── WORKFLOW YAML LINT (conditional on changed files) ────────
echo "--- Workflow YAML Lint ---"

# Only run if workflow files were changed in this commit
WF_CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep "^\.github/workflows/" || true)
if [ -z "$WF_CHANGED" ]; then
  WF_CHANGED=$(git diff --cached --name-only 2>/dev/null | grep "^\.github/workflows/" || true)
fi

if [ -n "$WF_CHANGED" ]; then
  if command -v actionlint >/dev/null 2>&1; then
    WF_FAIL=0
    for wffile in .github/workflows/*.yml; do
      if [ -f "$wffile" ]; then
        LINT_OUT=$(actionlint "$wffile" 2>&1)
        if [ $? -ne 0 ]; then
          echo "  X $wffile:"
          echo "$LINT_OUT" | sed 's/^/      /'
          WF_FAIL=1
        fi
      fi
    done

    if [ $WF_FAIL -eq 1 ]; then
      echo "  FAIL -- Workflow YAML lint FAILED"
      FAIL=1
    else
      echo "  OK -- Workflow YAML lint PASSED"
    fi
  else
    echo "  FAIL -- actionlint not installed (required when workflow files changed)"
    echo "  Install:"
    echo "    Mac:     brew install actionlint"
    echo "    Windows: scoop install actionlint  OR  choco install actionlint"
    echo "    Linux:   Download from https://github.com/rhysd/actionlint/releases"
    FAIL=1
  fi
else
  echo "  SKIP -- no workflow files changed"
fi

echo ""

# ── PYTHON SCRIPT COMPILE CHECK (conditional on changed files) ──
echo "--- Python Script Compile Check ---"

SCRIPT_CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep "^\.github/scripts/" || true)
if [ -z "$SCRIPT_CHANGED" ]; then
  SCRIPT_CHANGED=$(git diff --cached --name-only 2>/dev/null | grep "^\.github/scripts/" || true)
fi

if [ -n "$SCRIPT_CHANGED" ]; then
  PY_FAIL=0
  for pyfile in .github/scripts/*.py; do
    if [ -f "$pyfile" ]; then
      if python3 -m py_compile "$pyfile" 2>/dev/null; then
        true
      else
        echo "  X $pyfile: compile error"
        PY_FAIL=1
      fi
    fi
  done

  if [ $PY_FAIL -eq 1 ]; then
    echo "  FAIL -- Python script compile FAILED"
    FAIL=1
  else
    echo "  OK -- Python script compile PASSED"
  fi
else
  echo "  SKIP -- no script files changed"
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
