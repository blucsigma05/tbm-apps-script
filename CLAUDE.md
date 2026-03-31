# TBM (TillerBudgetMaster) — Project Rules

## The Cardinal Rule
> Read source before writing assertions. Never claim a feature is missing, a value is correct, or a version is deployed without verifying. Confidence without verification is a hallucination.

## Verify-Before-Assert Rule (MANDATORY)

Before writing ANY code that references a payload field, grep the source file for the exact field name. If grep returns 0 matches, the field doesn't exist — do not use it. If grep returns matches, read the surrounding 5 lines to understand the shape.

Before writing ANY assertion or diagnostic, run the function being tested from the editor FIRST, read the actual Logger output, then write assertions against what you saw — not what you think the output looks like.

Before declaring ANY build item complete, grep for the function name in the pushed code. If grep returns 0 matches, it wasn't built. Run the function and read Logger output before marking done.

**The test:** "Can I point to grep output or Logger output proving this field/function exists?" If no, stop and verify. If yes, proceed.

**Subagent summaries are leads, not facts.** A subagent summary tells you WHERE to look. You still read the actual source line before writing code. Field names, object shapes, and function signatures from summaries must be verified against the construction site (the `var result = {}` or `return {}` block where the value is built).

## Common Mistakes (NEVER do these)

1. Hardcoding sheet names instead of TAB_MAP
2. Using `getActiveSpreadsheet()` instead of `openById(SSID)`
3. Using `tryLock()` instead of `waitLock(30000)`
4. Duplicating constants across files (shared global scope)
5. Writing to a sheet tab owned by another module
6. Creating a new GAS deployment instead of updating existing
7. Using ES6 in any .html file
8. Skipping smoke test before deploy
9. Pushing to GAS without git commit+push after
10. Updating Notion deploy page icon+title together (double-emoji bug)
11. Guessing at versions — read the actual file header
12. Stopping at clasp push without completing steps 5-10
13. Pushing to GAS without running audit-source.sh first
14. Adding a google.script.run call without adding the Safe function to smoke test wiring check
15. Writing code against assumed field names without grep verification (see Verify-Before-Assert Rule)
16. Replacing an HTML file without first grepping the CURRENT file for all interactive elements (buttons, forms, modals, onclick handlers) and verifying they exist in the new file. If any are missing, STOP and report.

---

## What This Is
Google Apps Script + HtmlService system for household finance, kid chore management, and education dashboards. Google Sheets is the data layer, Tiller Money syncs bank data, 5+ HTML dashboards served via GAS web app, Cloudflare proxy at thompsonfams.com.

## TBM Workbook SSID
`1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c`

## Deployment ID (EXISTING — never create new)
Use `clasp deploy -i <ID>` with the existing deployment. Run `clasp deployments` to find it. Creating a new deployment breaks all URLs.

---

## File Structure

### Server-side (.gs pushed via clasp as .js)

| File | Role | Owns writes to |
|------|------|----------------|
| DataEngine.gs | Core computation, TAB_MAP owner, all KPIs | DebtModel, CFF, Dashboard_Export, Debt_Export |
| Code.gs | Router + safe wrappers, CacheService, `?action=runTests` | — (routing only) |
| KidsHub.gs | Chore/reward/grade server logic | KH_ tabs (Chores, History, Rewards, Requests, ScreenTime, Grades) |
| CascadeEngine.gs | Debt cascade simulation | — (read-only) |
| MonitorEngine.gs | MER gates + stampCloseMonth() | Close History, Month-End Review |
| CalendarSync.gs | Google Calendar sync | — |
| GASHardening.gs | Error logging, perf monitoring, version reporting | ErrorLog, PerfLog |
| AlertEngine.gs | Pushover push notifications | — |
| StoryFactory.gs | Kid story generation via Gemini | KH_StoryProgress |
| CodeSnapshot.gs | Snapshot code to Google Drive | — (Drive only) |
| tbmSmokeTest.gs | Pre-deploy health checks | — |
| tbmRegressionSuite.gs | Regression tests | — |

### Client-side (.html)

| File | Surface | Viewport | Route |
|------|---------|----------|-------|
| ThePulse.html | JT+LT dashboard | Responsive (S25 mobile-first) | `?page=pulse` or default |
| TheVein.html | LT command center | Responsive | `?page=vein` |
| KidsHub.html | Kid tablets + Parent Dashboard | Responsive | `?page=kidshub` |
| TheSpine.html | Office ambient (48" Sony TV) | 980x551 CSS px @ dpr=2 | `?page=spine` |
| TheSoul.html | Kitchen ambient (32" RCA TV) | 980x551 CSS px @ dpr=2 | `?page=soul` |
| SparkleLearn.html | JJ learning games (S10 tablet) | Responsive | `?page=sparkle` |

### Utility files (NOT pushed to GAS)

| File | Purpose |
|------|---------|
| phrases.json | Audio clip definitions (203 clips, source of truth) |
| generate-audio.js | ElevenLabs batch audio generator (Node.js) |
| CLAUDE.md | This file — project rules for Claude Code |

---

## Architecture

### Data flow (one direction)
Tiller → Google Sheets → DataEngine.gs → Safe wrappers → HTML dashboards via `google.script.run`

### Zero client-side financial calculations
All dashboards are display-only. ONE exception: ThePulse `simulate()` for the debt slider.

### TAB_MAP
DataEngine.gs owns TAB_MAP. All sheet references go through it. Never hardcode sheet names with emoji prefixes.

### KH_ tabs
KidsHub tabs live inside the main TBM workbook (NOT a separate spreadsheet). RING_QUEST_SSID is dead — never reference it.

### Shared global scope
All .gs files share one scope. Constants and TAB_MAP from DataEngine.gs are available everywhere. Never redeclare.

### Surfaces and financial data rules
- TheSoul (kitchen) and KidsHub (kid tablets): NO financial data. Kids can see these.
- TheSpine (office): Has financial data but no interaction — display only.
- ThePulse and TheVein: Full financial data, interactive.

---

## Deploy Workflow (MANDATORY — every time)

```
1. EDIT      → Make changes locally in C:\Dev\tbm-apps-script
2. VERSION   → Bump version in ALL 3 locations per changed .gs file:
                 - Line 3 header comment
                 - get*Version() return value
                 - Last line END OF FILE comment
               All three MUST match. Check with grep before pushing.
3. AUDIT     → Run: bash audit-source.sh
                 FAIL = stop, fix, re-run. Do NOT push.
                 WARN = review each warning. Fix or document why it's acceptable.
4. PUSH      → clasp push
5. PRE-QA    → Run diagPreQA() from Apps Script editor (GASHardening.gs)
                 Must show ALL categories PASS (0 FAIL, 0 WARN)
                 If ANY category FAIL: stop, fix, re-push, re-run until PASS
                 diagPreQA runs smoke + regression internally — no separate test step needed
6. DEPLOY    → clasp deploy -i <deploymentId>
                 NEVER use clasp deploy without -i (creates new URL)
7. VERIFY    → Hit ?action=runTests on PRODUCTION /exec URL (public, no auth needed)
                 Check ErrorLog sheet for new errors in last 5 minutes
                 NOTE: Dev /dev URLs require Google auth — curl/fetch cannot reach them.
                 All pre-deploy testing happens via diagPreQA() in step 5, not via URL.
8. GIT       → Use Git Bash (NOT PowerShell — credential helper conflict):
                 git checkout -b <branch-name>
                 git add .
                 git commit -m "<description>"
                 git push origin <branch-name>
                 Open PR against main
9. NOTION    → Update PM Active Versions table:
                 Page ID: 2c8cea3cd9e8818eaf53df73cb5c2eee
                 Update the version number for each changed component
10. HANDOFF  → Write thread handoff summary to Notion Thread Handoff Archive:
                 Page ID: 322cea3cd9e881bb8afcd560fe772481
                 Include: what changed, what was tested, what's next
```

**Never stop at step 4.** Push without pre-QA+deploy+git+Notion is incomplete work.

---

## Deploy Manifest (MANDATORY before declaring QA ready)

Every build spec produces a manifest — one grep per feature. The manifest is written WHEN THE SPEC IS CREATED, not after the build. The builder does not check their own work — the manifest was defined before code was written.

Before declaring "QA ready" or "deploy ready," run every manifest line. If ANY grep returns zero or shows a feature hidden/stubbed (e.g., display:none), that item is NOT DONE.

### Manifest format:
```
# [Build Spec Name] — Deploy Manifest
grep -n "[unique identifier]" [file]    → expected: [what should be there]
grep -n "[unique identifier]" [file]    → expected: [what should be there]
```

### Example (Session 75):
```
grep -n "family-crest" TheSoul.html               → must exist, NO display:none
grep -n "tbmNav" KidsHub.html                     → must exist (parent nav bar)
grep -n "tbm-version" ThePulse.html TheVein.html  → must exist (version meta)
grep -n "approve.*btn" ThePulse.html              → must exist (inline approve)
grep -n "padding" TheSoul.html                    → must be symmetric
```

### Why this exists:
Automated gates (smoke test, regression, diagPreQA) answer "is what's deployed healthy?" They do NOT answer "did we build everything we said we would?" A feature with display:none passes every health check. A missing nav bar has zero broken wiring. The manifest catches what health checks can't — features that were specced but never shipped.

---

## Audit Tools (run from C:\Dev\tbm-apps-script in Git Bash)

| Tool | When | Command |
|------|------|---------|
| Static source audit | Before every clasp push | `bash audit-source.sh` |
| Wiring audit (detailed) | After adding new google.script.run calls | `bash audit-wiring.sh` |
| Runtime tests | After every clasp push AND deploy | Hit `?action=runTests` |
| Pre-QA verification | Before every deploy | Run `diagPreQA()` from GASHardening.gs |

### Permissions
Claude Code permissions are configured in `~/.claude/settings.json` under `"permissions": {"allow": [...]}`. If Code prompts for permission on every tool call, check that file.

---

## ES5 Enforcement (ALL .html files)

Android WebView and Fully Kiosk Browser do NOT support ES6+. Every HTML file must be ES5 only.

### BANNED (will silently break on Fire Sticks and tablets):
- `let` / `const` → use `var`
- Arrow functions `=>` → use `function(){}`
- Template literals `` `${}` `` → use string concatenation
- `async` / `await` → use callbacks or Promises with `.then()`
- Nullish coalescing `??` → use `|| ` or ternary
- Optional chaining `?.` → use explicit null checks
- `Array.includes()` → use `indexOf() !== -1`
- `Array.find()` → use a for loop
- `URLSearchParams` → parse manually
- `Object.entries()` / `Object.values()` → use `Object.keys()` + loop
- Spread `...` → use `Array.prototype.slice.call()` or manual copy
- Destructuring `{a, b} = obj` → use `var a = obj.a`

### BANNED CSS:
- `backdrop-filter` → Fire TV WebView doesn't support it

### Pre-push check:
```bash
grep -rn "=>" *.html | grep -v "http" | grep -v "<!--"
grep -rn "\blet \b\|\bconst \b" *.html
grep -rn '`' *.html | grep -v "<!--"
grep -rn '??' *.html
grep -rn '?\.' *.html
grep -rn "\.includes(" *.html
grep -rn "backdrop-filter" *.html
```
If any match: fix before pushing.

---

## Pattern Registry

| Pattern | Canonical file |
|---------|----------------|
| Error logging | GASHardening.gs → `logError_()` |
| Perf monitoring | GASHardening.gs → `logPerf_()`, `withMonitor_()` |
| Tab name lookup | DataEngine.gs → `TAB_MAP` |
| Version reporting | GASHardening.gs → `getDeployedVersions()` |
| Cache read/write | Code.gs → `getCachedPayload_()`, `setCachedPayload_()` |
| Workbook reference | `openById(SSID)` — NEVER `getActiveSpreadsheet()` |
| Push notifications | AlertEngine.gs → `sendPush_()` (recipients: LT, JT, BOTH) |
| KH heartbeat | KidsHub.gs → `stampKHHeartbeat_()` after every write |
| Lock acquisition | `waitLock(30000)` — NEVER `tryLock()` |
| Smoke + regression | Code.gs → `?action=runTests` returns combined JSON |

---

## Notion Integration

### Page IDs (for MCP tools)
| Page | ID |
|------|----|
| Project Memory (PM) | `2c8cea3cd9e8818eaf53df73cb5c2eee` |
| Thread Handoff Archive | `322cea3cd9e881bb8afcd560fe772481` |
| Audio Clip Queue DB | `f4fee7eb444f45a5ad80e19e39ce1780` |
| Audio Clip Queue Data Source | `d1c3e770-177b-4fcb-b308-015809210845` |
| Deploy Confidence Protocol | `32fcea3cd9e8810ab69df1543768dba5` |
| QA Test Plan | `32ccea3cd9e8818f9e30f317dea0fed7` |
| Education Platform | `331cea3cd9e8816aa07feec250328cf8` |
| Parking Lot | `32ccea3cd9e881809257fd5e7973c6d7` |

### After every deploy:
1. Update PM Active Versions table with new version numbers
2. Write thread handoff to Archive page
3. Update deploy page title (just the version number, NOT the icon)
4. Code owns this step — it has real visibility into what shipped. Never skip.

### Notion update rules:
- `notion-update-page` with `old_str`/`new_str` requires EXACT whitespace matching
- Table cell updates via MCP fail consistently — flag for manual edit
- Re-fetch before updating if another thread may have modified the page
- NEVER set icon and title separately — causes double-emoji bug

---

## GAS Trigger Budget & Automation

**Budget: 20 triggers max. Run `auditTriggers()` from GASHardening.gs for current count.**

### Required daily triggers (add these):
| Trigger | Time | Function | Purpose |
|---------|------|----------|---------|
| Daily task reset | 5:00 AM CST | `resetDailyTasksAuto()` | Reset daily chores for both kids |
| Daily health check | 6:00 AM CST | `dailyHealthCheck()` | Smoke test + error scan + device heartbeat + row cap |
| Daily snapshot | 6:30 AM CST | `runSnapshot()` | Code snapshot to Drive for chat thread consumption |

### Alert rules (AlertEngine.gs):
| Condition | Alert to | Priority |
|-----------|----------|----------|
| Smoke test FAIL | LT | High |
| New ErrorLog entries (last 24h) | LT | Normal |
| Device heartbeat stale >2 hours | LT | Normal |
| Transactions row count >80% of cap | LT | Normal |
| Balance History approaching 20K rows | LT | Normal |
| Promo cliff in 7 / 3 / 1 days | LT + JT | High |
| Tiller latest transaction >48h old | LT | High |

---

## Audio Pipeline

### Source of truth: `phrases.json` (in repo root)
### Clip generation: `node generate-audio.js` (local, not GAS)
### Notion queue: Audio Clip Queue DB (data source `d1c3e770-177b-4fcb-b308-015809210845`)
### Voice IDs: JJ (Nia) = `A2YMjtICNQnO93UAZ8l6`, Buggsy (Marco) = `RYPzpPBmugfktRI79EC9`
### Models: `eleven_v3` for speech, `eleven_flash_v2_5` for IPA phonemes

### To add clips:
1. Add entry to Notion Audio Clip Queue with Status = "Not started"
2. Run `node generate-audio.js` — generates only new clips, skips existing
3. Mark Notion entry Status = "Done"

---

## Future-Proofing Hooks

### Row archival (when Transactions > 15K)
Auto-archive older months to Archive_Transactions tab. Update formulas to reference current rows only.

### Device replacement
FK config export per device stored in Drive. New device: import config, set URL, done.

### School year rollover
TEKS references stored in `.claude/commands/references/`. When grade changes, update reference files. Education skill auto-picks correct standards.

### Data portability
Monthly CSV export trigger: Transactions + Balances + DebtModel → Drive folder. Data survives if Tiller or GAS disappears.

### JT independence
ThePulse should expose all daily admin (reset, debit, approve) without needing TheVein or Parent Dashboard URLs.
