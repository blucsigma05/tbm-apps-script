# TBM Code Review Rules — Gemini Audit Instructions

You are reviewing code for TBM (TillerBudgetMaster), a Google Apps Script + HtmlService household management platform. Apply these rules to every PR.

## Critical — Fail the review if any of these are violated:

### ES5 enforcement (ALL .html files)
These constructs will SILENTLY BREAK on Fire Stick / Fully Kiosk / Android WebView:
- `let` or `const` → must use `var`
- Arrow functions `=>` → must use `function(){}`
- Template literals with backticks → must use string concatenation
- `async` / `await` → must use callbacks or `.then()`
- Nullish coalescing `??` → must use `||` or ternary
- Optional chaining `?.` → must use explicit null checks
- `Array.includes()` → must use `indexOf() !== -1`
- `Array.find()` → must use a for loop
- `URLSearchParams` → must parse manually
- `Object.entries()` / `Object.values()` → must use `Object.keys()` + loop
- Spread `...` → must use `Array.prototype.slice.call()`
- Destructuring `{a, b} = obj` → must use `var a = obj.a`
- CSS `backdrop-filter` → Fire TV WebView doesn't support it

### Version consistency (.gs files)
Every .gs file version bump must update EXACTLY 3 locations simultaneously:
1. Line 3 header comment (e.g., `// DataEngine.gs — v75`)
2. `get*Version()` return value (e.g., `return 75;`)
3. Last line END OF FILE comment (e.g., `// END OF DataEngine.gs v75`)
All three MUST show the same version number. Flag if any disagree.

### Spreadsheet access
- NEVER use `getActiveSpreadsheet()` — must use `SpreadsheetApp.openById(SSID)`
- SSID constant: `1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c`

### Lock acquisition
- NEVER use `tryLock()` — must use `waitLock(30000)` on all write paths

### Tab references
- NEVER hardcode sheet names with emoji prefixes
- All sheet references must go through `TAB_MAP` (owned by DataEngine.gs)

## Warnings — Flag but don't fail:

### Architecture rules
- DataEngine.gs owns TAB_MAP — no other file should declare tab name constants
- All .gs files share one global scope — never redeclare constants across files
- KidsHub tabs (KH_ prefix) live inside the main TBM workbook, NOT a separate spreadsheet
- HTML surfaces are display-only — zero client-side financial calculations (one exception: ThePulse `simulate()` for debt slider)
- TheSoul (kitchen) and KidsHub (kid tablets) must contain NO financial data

### Naming conventions
- Private functions: trailing underscore (e.g., `readSheet_()`)
- Safe wrappers: `*Safe` suffix (e.g., `getDataSafe`)
- Module prefixes preferred: `kh_` for KidsHub, `de_` for DataEngine, `ce_` for CascadeEngine

### Post-push verification
Every PR description should include the specific grep commands that verify
the claimed changes actually landed in the committed files.

### Code patterns
- Error logging: use `logError_()` from GASHardening.gs
- Performance monitoring: use `withMonitor_()` wrapper
- Cache reads: use `getCachedPayload_()` / `setCachedPayload_()` from Code.gs
- Push notifications: use `sendPush_()` from AlertEngine.gs

## Context
- Server files (.gs) run in Google Apps Script (V8 runtime, ES6+ is fine)
- Client files (.html) run in Android WebView via Fully Kiosk Browser (ES5 ONLY)
- 5 HTML surfaces: ThePulse, TheVein, KidsHub, TheSpine, TheSoul + SparkleLearn
- Tiller Money syncs bank data to Google Sheets — sheets are source of truth
- Cloudflare proxy at thompsonfams.com routes to GAS web app
