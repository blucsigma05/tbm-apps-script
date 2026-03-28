# TBM (TillerBudgetMaster) — Project Rules

## What this is
A Google Apps Script + HtmlService system for household finance tracking and family dashboards. 25+ .gs/.html files. Google Sheets is the data layer, Tiller Money syncs bank data, 5 HTML dashboards served via GAS web app.

## File structure

### Server-side (.gs)
| File | Role | Owns writes to |
|------|------|----------------|
| DataEngine.gs | Core computation, TAB_MAP owner, all KPIs | DebtModel, CFF, Dashboard_Export, Debt_Export |
| Code.gs | Router + safe wrappers, CacheService | — (routing only) |
| KidsHub.gs | Chore/reward/grade server logic | KH_ tabs (Chores, History, Rewards, Requests, ScreenTime, Grades) |
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
| ThePulse.html | JT+LT dashboard (browser) | Responsive (mobile-first for S25) |
| TheVein.html | LT command center (browser) | Responsive |
| KidsHub.html | Kid tablets + Parent Dashboard | Responsive |
| TheSpine.html | Office ambient (48" Sony TV) | 980x551 CSS px @ dpr=2 |
| TheSoul.html | Kitchen ambient (32" RCA TV) | 980x551 CSS px @ dpr=2 |

## Architecture rules

### Data flow (one direction)
Tiller -> Google Sheets -> DataEngine.gs -> Safe wrappers -> HTML dashboards via `google.script.run`

### Zero client-side financial calculations
All HTML dashboards are display-only. ONE exception: ThePulse `simulate()` for the debt slider (client-only, not persisted).

### TAB_MAP
DataEngine.gs owns TAB_MAP. All sheet references go through it. Never hardcode sheet names with emoji prefixes in code — only in TAB_MAP definitions.

### Sheet tab icons
- Locked = Tiller-owned (read-only)
- Computed = Computed/control (scripts read/write)
- KH_ = KidsHub tabs
- Vault = Vault/collections
- X = Deprecated

### Workbook access
Always use `SpreadsheetApp.openById(SSID)`, never `getActiveSpreadsheet()`. The SSID constant is defined in DataEngine.gs.

### KH_ tabs
KidsHub tabs live inside the main TBM workbook (not a separate spreadsheet). The old RING_QUEST_SSID is dead — never reference it.

### Shared global scope
All .gs files share one global scope. Constants and TAB_MAP defined in DataEngine.gs are available everywhere. Never redeclare them.

### Pattern Registry
| Pattern | Canonical file |
|---------|---------------|
| Error logging | GASHardening.gs -> `logError_()` |
| Perf monitoring | GASHardening.gs -> `logPerf_()`, `withMonitor_()` |
| Tab name lookup | DataEngine.gs -> `TAB_MAP` |
| Version reporting | GASHardening.gs -> `getDeployedVersions()` |
| Cache read/write | Code.gs -> `getCachedPayload_()`, `setCachedPayload_()` |
| Workbook reference | DataEngine.gs -> `SSID` + `getDESS_()` |
| Lock acquisition | `waitLock(30000)` per GAS Standards |
| Push notifications | AlertEngine.gs -> `sendPush_()` (recipients: LT, JT, BOTH) |
| KH heartbeat | KidsHub.gs -> `stampKHHeartbeat_()` after every write |
| Code snapshots | CodeSnapshot.gs -> `snapshotCodeToGDrive()`, `snapshotToSingleDoc()` |

## TBM-specific conventions
- Income categories: `INCOME_CATS` array in DataEngine.gs (5 categories)
- Transfer categories: 10 categories + Debt Offset — excluded from cash flow
- `readDESheet_()` (DataEngine) or `readSheet_()` (KidsHub) for cached sheet reads
- KidsHub grade rewards: `KH_GRADE_REWARDS` in KidsHub.gs
- Due_Day column on KH_Chores controls which day weekly required tasks gate

## Key accounts
- TBM workbook SSID: `1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c`

## Common mistakes to avoid
1. Using arrow functions or template literals in HTML (breaks Fire Stick)
2. Hardcoding sheet names instead of using TAB_MAP
3. Using `getActiveSpreadsheet()` instead of `openById(SSID)`
4. Duplicating constants across files
5. Writing to a sheet tab owned by another module
6. Using `tryLock()` instead of `waitLock(30000)`
7. Forgetting to increment version number
8. Adding version comments inside files (they go on Notion)
9. Creating a new GAS deployment instead of updating the existing one
10. Using `backdrop-filter` CSS (invisible on Fire TV)
11. Skipping git push after clasp push
