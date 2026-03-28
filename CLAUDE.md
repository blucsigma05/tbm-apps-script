# TBM (TillerBudgetMaster) — Claude Code Rules

## What this is
A Google Apps Script + HtmlService system for household finance tracking and family dashboards. Built by a CPA (not a developer). 20+ .gs/.html files. Google Sheets is the data layer, Tiller Money syncs bank data, 5 HTML dashboards served via GAS web app.

## Critical constraints

### ES5 ONLY — non-negotiable
Fire Stick tablets run Fully Kiosk Browser (old Android WebView). Any ES6+ syntax silently breaks the entire dashboard.
- NO arrow functions: `function(x) { return x; }` not `x => x`
- NO template literals: `'hello ' + name` not `` `hello ${name}` ``
- NO `let`/`const`: use `var` everywhere
- NO `??`, `?.`, destructuring, `async/await`, `Array.includes()`, `for...of`
- NO `backdrop-filter` (Fire TV WebView incompatible)
- Run ESLint before every push

### Deploy Flow (MANDATORY — never skip steps)
1. Make changes locally in `C:\Dev\tbm-apps-script`
2. Static checks: grep for ES5 violations, banned patterns
3. `clasp push` — deploy to GAS
4. Run `tbmSmokeTest()` in GAS editor — verify wiring + schema
5. Run `tbmRegressionSuite()` in GAS editor — verify no regressions
6. If both pass: `git add <files> && git commit -m "<description>" && git push`
7. Then in GAS web editor: Manage Deployments → Edit → New Version → Deploy

**GAS is live truth. GitHub is version history. Both must stay in sync.**

### Post-Build Checklist (MANDATORY)
After completing any file changes:
1. `clasp push` — deploy to GAS
2. Prompt user: "Push complete. Run smoke test?"
3. If smoke passes: `git add <files> && git commit -m "<description>" && git push`
4. Prompt user: "All deployed and backed up. Anything else?"

Never skip step 3. Never use `git add .` blindly — stage specific files to avoid committing secrets or spec docs.

### After Completing Work
Always offer next steps:
```
"✅ [Component] v[X] deployed. Smoke test passed. GitHub synced.

What's next?
a) Run regression suite
b) Start next task
c) Generate code snapshot for Drive
d) Write thread handoff to Notion"
```

### Git Rules
- Commit messages: lead with what changed, list versions at the end
- Use Git Bash (NOT PowerShell — credential conflict)
- Never skip `git push` after `clasp push` — they stay in sync
- Co-author line: `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`

## File structure

### Server-side (.gs)
| File | Role | Owns writes to |
|------|------|----------------|
| DataEngine.gs | Core computation, TAB_MAP owner, all KPIs | DebtModel, CFF, Dashboard_Export, Debt_Export |
| Code.gs | Router + safe wrappers, CacheService | — (routing only) |
| KidsHub.gs | Chore/reward server logic | KH_Rewards, KH_History, KH_Requests, KH_ScreenTime, KH_StoryProgress, KH_Ask |
| CascadeEngine.gs | Debt cascade simulation | — (read-only) |
| MonitorEngine.gs | MER gates + stampCloseMonth() | Close History, Month-End Review |
| CalendarSync.gs | Google Calendar sync | — |
| GASHardening.gs | Error logging, perf monitoring, version reporting | ErrorLog, PerfLog |
| AlertEngine.gs | Pushover push notifications (approvals, asks, errors) | — |
| StoryFactory.gs | Kid story generation via Gemini | KH_StoryProgress |
| CodeSnapshot.gs | Snapshot code to Google Drive (backup/sharing) | — (Drive only) |
| tbmSmokeTest.gs | Pre-deploy health checks | — |
| tbmRegressionSuite.gs | Regression tests | — |

### Client-side (.html)
| File | Surface | Viewport |
|------|---------|----------|
| ThePulse.html | JT+LT dashboard (browser) | Responsive |
| TheVein.html | LT command center (browser) | Responsive |
| KidsHub.html | Kid tablets + Parent Dashboard | Responsive |
| TheSpine.html | Office ambient (48" Sony TV) | 980×551 CSS px @ dpr=2 |
| TheSoul.html | Kitchen ambient (32" RCA TV) | 980×551 CSS px @ dpr=2 |

## Architecture rules

### Data flow (one direction)
Tiller → Google Sheets → DataEngine.gs → Safe wrappers → HTML dashboards via `google.script.run`

### Zero client-side financial calculations
All HTML dashboards are display-only. ONE exception: ThePulse `simulate()` for the debt slider (client-only, not persisted).

### TAB_MAP
DataEngine.gs owns TAB_MAP. All sheet references go through it. Never hardcode sheet names with emoji prefixes in code — only in TAB_MAP definitions.

### Sheet tab icons
- 🔒 = Tiller-owned (read-only)
- 💻🧮 = Computed/control (scripts read/write)
- 🧹📅 = KidsHub tabs
- ⌚📦 = Vault/collections
- ❌ = Deprecated

### Workbook access
Always use `SpreadsheetApp.openById(SSID)`, never `getActiveSpreadsheet()`. The SSID constant is defined in DataEngine.gs.

### KH_ tabs
KidsHub tabs live inside the main TBM workbook (not a separate spreadsheet). The old RING_QUEST_SSID is dead — never reference it.

### Shared global scope
All .gs files share one global scope. Constants and TAB_MAP defined in DataEngine.gs are available everywhere. Never redeclare them.

### Pattern Registry
| Pattern | Canonical file |
|---------|---------------|
| Error logging | GASHardening.gs → `logError_()` |
| Perf monitoring | GASHardening.gs → `logPerf_()`, `withMonitor_()` |
| Tab name lookup | DataEngine.gs → `TAB_MAP` |
| Version reporting | GASHardening.gs → `getDeployedVersions()` |
| Cache read/write | Code.gs → `getCachedPayload_()`, `setCachedPayload_()` |
| Workbook reference | DataEngine.gs → `SSID` + `getDESS_()` |
| Lock acquisition | `waitLock(30000)` per GAS Standards §11.2 |
| Push notifications | AlertEngine.gs → `sendPush_()` (recipients: LT, JT, BOTH) |
| KH heartbeat | KidsHub.gs → `stampKHHeartbeat_()` after every write |
| Code snapshots | CodeSnapshot.gs → `snapshotCodeToGDrive()`, `snapshotToSingleDoc()` |

## Version rules
- Every edit increments the file version by 1. No exceptions.
- Version function: `function getDataEngineVersion() { return 75; }`
- Never add version headers or changelogs inside files. Notion deploy pages track changes.
- Files get ONE placeholder comment: `<!-- Version history tracked in Notion deploy page. -->`

## Code style
- Private functions end with underscore: `readSheet_()`
- Safe wrappers: `functionNameSafe()` — wraps server function in try/catch + `withMonitor_()`
- All Safe wrappers must be wrapped in `withMonitor_()` (except 4 documented exceptions)
- Use `readDESheet_()` (DataEngine) or `readSheet_()` (KidsHub) caching pattern for sheet reads
- Income categories: `INCOME_CATS` array in DataEngine.gs (5 categories)
- Transfer categories: 10 categories + Debt Offset — excluded from cash flow

## Key accounts
- TBM workbook SSID: `1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c`
- GitHub: `https://github.com/blucsigma05/tbm-apps-script`
- Google Drive sync: `C:\Users\BluCs\My Drive` (thompson090916@gmail.com)

## Notion integration
- Project Memory: `notion.so/2c8cea3cd9e8818eaf53df73cb5c2eee`
- Thread Handoff Archive: `notion.so/322cea3cd9e881bb8afcd560fe772481`
- Parking Lot (temp scripts): `notion.so/32ccea3cd9e881809257fd5e7973c6d7`
- Deploy pages exist per component — update title with new version on deploy

## Common mistakes to avoid
1. Using arrow functions or template literals (breaks Fire Stick)
2. Hardcoding sheet names instead of using TAB_MAP
3. Using `getActiveSpreadsheet()` instead of `openById(SSID)`
4. Duplicating constants across files
5. Writing to a sheet tab owned by another module
6. Using `tryLock()` instead of `waitLock(30000)`
7. Forgetting to increment version number
8. Adding version comments inside files (they go on Notion)
9. Creating a new GAS deployment instead of updating the existing one
10. Using `backdrop-filter` CSS (invisible on Fire TV)
