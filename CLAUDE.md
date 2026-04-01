# TBM (TillerBudgetMaster) — Project Rules

## Session Start
1. Read this file fully
2. Run `clasp deployments` to confirm deployment ID
3. Fetch PM Active Versions (Notion `2c8cea3cd9e8818eaf53df73cb5c2eee`) for current state
4. Do NOT begin work until steps 1–3 are complete

## The Cardinal Rule
Read source before writing assertions. Never claim a feature is missing, a value is correct, or a version is deployed without verifying. Confidence without verification is a hallucination.

## Verify-Before-Assert (MANDATORY)
- Before writing code that references a payload field → grep the source for the exact field name. 0 matches = doesn't exist. If matches found, read surrounding 5 lines for shape.
- Before writing any assertion → run the function from the editor FIRST, read Logger output, write assertions against what you saw.
- Before declaring any build item complete → grep for the function name in pushed code. 0 matches = wasn't built. Run the function and read Logger output.
- Subagent summaries are leads, not facts. Verify field names, object shapes, and signatures against the actual construction site (`var result = {}` or `return {}` block).
- **The test:** "Can I point to grep output or Logger output proving this?" If no → stop and verify. If yes → proceed.

## Context Management
- **Step 0 cleanup:** Before any refactor on a file >300 LOC, do a cleanup-only pass first (dead functions, unused variables, stale comments, debug logs). Commit separately. Then start real work. This prevents context compaction from firing mid-task.
- **2,000-line read cap:** File reads truncate silently at ~2,000 lines. DataEngine.gs is ~4,000 lines. Always read in chunks using offset/limit. Never assume a single read captured the full file. See Large Files list below.
- **Grep truncation:** Tool results >50K chars are silently truncated. Suspiciously few results (e.g., 3 refs for a function used across 12 files) = re-run with narrower scope. State when truncation is suspected.
- **Output self-review (MANDATORY):** After every file modification, re-read the changed region. Verify: (1) edit applied correctly, (2) no side effects in surrounding code, (3) versions updated. "Done" = verified correct, not "write operation completed."
- **Context decay:** After 10+ messages in a session, re-read any file before editing it. Do not trust memory of file contents from earlier in the conversation.

### Large Files (always chunk-read)
| File | ~Lines | Notes |
|------|--------|-------|
| DataEngine.gs | ~4,000 | Read in 1,500-line chunks. TAB_MAP is near top. |
| KidsHub.html | ~3,000+ | Single-file multi-surface (Buggsy board, JJ board, Parent Dashboard) |
| ThePulse.html | ~2,500+ | Full financial dashboard |
| TheVein.html | ~2,500+ | LT command center |
| Code.gs | ~1,500+ | Router + all Safe wrappers. Grows with every new route. |

## Never Do This

### Tier 1 — Causes Regressions
1. Hardcoding sheet names instead of TAB_MAP
2. Using `getActiveSpreadsheet()` instead of `openById(SSID)`
3. Using `tryLock()` instead of `waitLock(30000)`
4. Using ES6 in any `.html` file (see ES5 section)
5. Writing code against assumed field names without grep verification
6. Replacing an HTML file without grepping the CURRENT file for all interactive elements (buttons, forms, modals, onclick handlers) and verifying every one exists in the new file
7. Reading DataEngine.gs or any large file in a single read
8. Claiming "done" without re-reading the modified file to verify
9. Skipping smoke test before deploy
10. Adding a `google.script.run` call without a matching `withFailureHandler()`

### Tier 2 — Causes Deploy Problems
11. Stopping at `clasp push` without completing the full pipeline (steps 1–13)
12. Creating a new GAS deployment instead of updating existing
13. Version mismatches across the 3 required locations (header, getter, EOF)
14. Pushing to GAS without `git commit` + `git push` after
15. Pushing without running `audit-source.sh` first
16. Adding a `google.script.run` call without adding the Safe function to smoke test wiring check
17. Using `clasp deploy` without `-i` flag

### Tier 3 — Causes Drift
18. Duplicating constants across files (shared global scope — they're already available)
19. Writing to a sheet tab owned by another module
20. Skipping Notion deploy page update after deploy
21. Updating Notion page icon+title together (double-emoji bug — update title only)
22. Guessing at versions — read the actual file header
23. Starting a big refactor without a Step 0 cleanup commit
24. Trusting a grep that returned suspiciously few results without re-running narrower

---

## Identity
Google Apps Script + HtmlService system for household finance, kid chore management, and education dashboards. Google Sheets is the data layer, Tiller Money syncs bank data, HTML dashboards served via GAS web app, Cloudflare proxy at thompsonfams.com.

- **SSID:** `1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c`
- **Deployment ID:** Run `clasp deployments` to find it. Always use `clasp deploy -i <ID>`. Never create new.

## Architecture

**Data flow (one direction only):**
Tiller → Google Sheets → DataEngine.gs → Safe wrappers → HTML dashboards via `google.script.run`

**Core rules:**
- Zero client-side financial calculations. All dashboards display-only. ONE exception: ThePulse `simulate()` for debt slider.
- TAB_MAP lives in DataEngine.gs. All sheet references go through it. Never hardcode sheet names with emoji prefixes.
- KH_ tabs live inside the main TBM workbook (NOT a separate spreadsheet). RING_QUEST_SSID is dead.
- All `.gs` files share one global scope. Constants and TAB_MAP from DataEngine.gs are available everywhere. Never redeclare.

**Financial data visibility:**
- TheSoul (kitchen) + KidsHub (kid tablets) → NO financial data. Kids can see these.
- TheSpine (office) → Financial data, display-only.
- ThePulse + TheVein → Full financial data, interactive.

---

## File Map

### Server-side (.gs pushed via clasp as .js)
| File | Role | Owns writes to |
|------|------|---------------|
| DataEngine.gs | Core computation, TAB_MAP owner, all KPIs | DebtModel, CFF, Dashboard_Export, Debt_Export |
| Code.gs | Router + safe wrappers, CacheService, `?action=runTests` | — (routing only) |
| KidsHub.gs | Chore/reward/grade server logic | KH_ tabs |
| CascadeEngine.gs | Debt cascade simulation | — (read-only) |
| MonitorEngine.gs | MER gates + `stampCloseMonth()` | Close History, Month-End Review |
| CalendarSync.gs | Google Calendar sync | — |
| GASHardening.gs | Error logging, perf monitoring, version reporting | ErrorLog, PerfLog |
| AlertEngine.gs | Pushover push notifications | — |
| StoryFactory.gs | Kid story generation via Gemini | KH_StoryProgress |
| CodeSnapshot.gs | Snapshot code to Google Drive | — (Drive only) |
| tbmSmokeTest.gs | Pre-deploy health checks | — |
| tbmRegressionSuite.gs | Regression tests | — |

### Client-side (.html)
| File | Surface | Route (`?page=`) |
|------|---------|------------------|
| ThePulse.html | JT+LT finance dashboard | `pulse` (default) |
| TheVein.html | LT command center | `vein` |
| KidsHub.html | Kid tablets + Parent Dashboard | `kidshub` |
| TheSpine.html | Office ambient (48" Sony TV) | `spine` |
| TheSoul.html | Kitchen ambient (32" RCA TV) | `soul` |
| SparkleLearning.html | JJ learning games (S10 FE) | `sparkle` |
| HomeworkModule.html | Buggsy math/science homework | `homework` |
| WolfkidCER.html | Wolfkid CER writing | `wolfkid` |
| reading-module.html | Cold reading practice | `reading` |
| writing-module.html | Writing practice | `writing` |
| fact-sprint.html | Timed fact drills | `facts` |
| investigation-module.html | Science investigation | `investigation` |
| daily-missions.html | Daily mission rotation | `daily-missions` |
| BaselineDiagnostic.html | Baseline diagnostic assessment | `baseline` |
| ComicStudio.html | Comic creation tool | `comic-studio` |
| DesignDashboard.html | Ring Quest dashboard designer | `dashboard` |
| ProgressReport.html | Weekly progress report (parent) | `progress` |
| StoryLibrary.html | Family story library | `story-library` |
| StoryReader.html | Bedtime story reader | `story` |
| executive-skills-components.html | Shared exec skills component (inlined) | — (not routed) |

### Utility files (NOT pushed to GAS)
| File | Purpose |
|------|---------|
| phrases.json | Audio clip definitions (source of truth) |
| generate-audio.js | ElevenLabs batch audio generator (Node.js) |
| audit-source.sh | Static source audit (pre-push gate) |
| audit-wiring.sh | Wiring verification (post-new-call gate) |
| CLAUDE.md | This file |

### Cloudflare Worker Routes
All routes proxy to GAS `?page=` equivalents. Verify all return 200 after deploy.
```
thompsonfams.com/pulse          → ?page=pulse
thompsonfams.com/vein           → ?page=vein
thompsonfams.com/parent         → ?page=kidshub&view=parent
thompsonfams.com/buggsy         → ?page=kidshub&child=buggsy
thompsonfams.com/jj             → ?page=kidshub&child=jj
thompsonfams.com/soul           → ?page=soul
thompsonfams.com/spine          → ?page=spine
thompsonfams.com/homework       → ?page=homework
thompsonfams.com/sparkle        → ?page=sparkle
thompsonfams.com/wolfkid        → ?page=wolfkid
thompsonfams.com/reading        → ?page=reading
thompsonfams.com/writing        → ?page=writing
thompsonfams.com/facts          → ?page=facts
thompsonfams.com/dashboard      → ?page=dashboard
thompsonfams.com/progress       → ?page=progress
thompsonfams.com/comic-studio   → ?page=comic-studio
thompsonfams.com/story-library  → ?page=story-library
thompsonfams.com/story          → ?page=story
thompsonfams.com/investigation  → ?page=investigation
thompsonfams.com/daily-missions → ?page=daily-missions
thompsonfams.com/baseline       → ?page=baseline
```

---

## Deploy Pipeline (MANDATORY — every deploy)
Run steps 1–13 autonomously. Report results at end. LT's only action: review PR and approve.
**EXCEPTION: If any step returns unexpected output, STOP and report before continuing.**

1. **EDIT** → Make changes locally in `C:\Dev\tbm-apps-script`
2. **VERSION** → Bump version in ALL 3 locations per changed `.gs` file: line 3 header, `get*Version()` return, EOF comment. All three MUST match. Grep to verify.
3. **AUDIT** → `bash audit-source.sh` — FAIL = stop. WARN = review each, fix or document.
4. **ES5 CHECK** → Run banned-pattern greps on changed `.html` files. Any match = fix.
5. **PRE-PUSH GATES** → Gate 1 (wiring), Gate 2 (visual, if KidsHub touched), Gate 3 (version consistency). Any FAIL = stop.
6. **PUSH** → `clasp push`
7. **PRE-QA** → Run `diagPreQA()` from GASHardening.gs. Must show ALL categories PASS. Any FAIL = stop, fix, re-push, re-run.
8. **DEPLOY** → `clasp deploy -i <deploymentId>`
9. **VERIFY** → Hit `?action=runTests` on PRODUCTION `/exec` URL. Check ErrorLog for new errors (last 5 min). NOTE: `/dev` URLs require Google auth — curl/fetch cannot reach them.
10. **GIT** → Git Bash only (NOT PowerShell): `git checkout -b <branch>` → `git add .` → `git commit` → `git push origin <branch>` → Open PR
11. **NOTION** → Update PM Active Versions DB. Write thread handoff to Archive. Update deploy page title (version only, NOT icon).
12. **CF VERIFY** → curl all CF proxy endpoints from route list above, expect 200.
13. **RELEASE** → `gh release create v<version> --notes "<summary>"`

**Never stop at step 6.**

## Deploy Manifest
Every build spec produces a grep manifest WHEN THE SPEC IS CREATED — not after the build. Before declaring "QA ready," run every manifest line. Zero matches or `display:none` = NOT DONE.

Format:
```
# [Build Spec Name] — Deploy Manifest
grep -n "[unique identifier]" [file]    → expected: [what should be there]
```

---

## Pre-Push Gates

### Gate 1: Wiring Verification
Every `google.script.run.XXX` in HTML must have a matching function in `.js`:
```powershell
$htmlCalls = Get-ChildItem -Path "C:\Dev\tbm-apps-script\*.html" |
  Select-String -Pattern '\.(\w+Safe\w*)\(' -AllMatches |
  ForEach-Object { $_.Matches } |
  ForEach-Object { $_.Groups[1].Value } |
  Sort-Object -Unique
$missing = @()
foreach ($fn in $htmlCalls) {
  $found = Get-ChildItem -Path "C:\Dev\tbm-apps-script\*.js" |
    Select-String -Pattern "function $fn\b" -Quiet
  if (-not $found) { $missing += $fn }
}
if ($missing.Count -gt 0) {
  Write-Host "WIRING FAIL" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  MISSING: $_" -ForegroundColor Red }
} else {
  Write-Host "WIRING PASS — all $($htmlCalls.Count) calls verified" -ForegroundColor Green
}
```

### Gate 2: Visual Regression (KidsHub.html only)
Run when KidsHub.html is touched:
```powershell
$file = "C:\Dev\tbm-apps-script\KidsHub.html"
$fails = @()
if (-not (Select-String -Path $file -Pattern "\.char-avatar" -Context 0,2 | Select-String -Pattern "48px" -Quiet)) { $fails += "char-avatar not 48px" }
if (-not (Select-String -Path $file -Pattern "\.char-stat-img" -Context 0,2 | Select-String -Pattern "48px" -Quiet)) { $fails += "char-stat-img not 48px" }
if (-not (Select-String -Path $file -Pattern "\.char-flavor" -Context 0,2 | Select-String -Pattern "140px" -Quiet)) { $fails += "char-flavor not 140px" }
if (-not (Select-String -Path $file -Pattern "Wolfkid celebrating" | Select-String -Pattern "180px" -Quiet)) { $fails += "ALL CLEAR Wolfkid not 180px" }
if (-not (Select-String -Path $file -Pattern "JJ celebrating" | Select-String -Pattern "180px" -Quiet)) { $fails += "ALL CLEAR JJ not 180px" }
if ($fails.Count -gt 0) { $fails | ForEach-Object { Write-Host "FAIL: $_" -ForegroundColor Red } }
else { Write-Host "VISUAL PASS" -ForegroundColor Green }
```

### Gate 3: Version Consistency
Every changed `.gs` file must have matching versions in 3 locations: line 3 header, `get*Version()` return, EOF comment. Grep all three before pushing.

---

## ES5 Enforcement (ALL .html files)
Android WebView and Fully Kiosk Browser do NOT support ES6+.

| Banned | Use Instead |
|--------|------------|
| `let` / `const` | `var` |
| `=>` arrow functions | `function(){}` |
| Template literals `` ` `` | String concatenation |
| `async` / `await` | Callbacks or `.then()` |
| `??` nullish coalescing | `\|\|` or ternary |
| `?.` optional chaining | Explicit null checks |
| `.includes()` | `indexOf() !== -1` |
| `.find()` | `for` loop |
| `URLSearchParams` | Parse manually |
| `Object.entries()` / `.values()` | `Object.keys()` + loop |
| `...` spread | `Array.prototype.slice.call()` |
| Destructuring `{a, b} = obj` | `var a = obj.a` |
| `backdrop-filter` CSS | Not supported on Fire TV |

Pre-push check:
```bash
grep -rn "=>" *.html | grep -v "http" | grep -v "<!--"
grep -rn "\blet \b\|\bconst \b" *.html
grep -rn '`' *.html | grep -v "<!--"
grep -rn '??' *.html
grep -rn '?\.' *.html
grep -rn "\.includes(" *.html
grep -rn "backdrop-filter" *.html
```

---

## Pattern Registry
| Pattern | Canonical location |
|---------|--------------------|
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
| New `google.script.run` call | Must have `withFailureHandler()`. Must add Safe wrapper to smoke test check. Must run Gate 1. |

---

## Notion IDs
| Page | ID |
|------|-----|
| Project Memory (PM) | `2c8cea3cd9e8818eaf53df73cb5c2eee` |
| Thread Handoff Archive | `322cea3cd9e881bb8afcd560fe772481` |
| Active Versions DB (data source) | `collection://158238c5-9a78-4fa5-9ef8-203f8e0e00a9` |
| Audio Clip Queue DB | `f4fee7eb444f45a5ad80e19e39ce1780` |
| Audio Clip Queue Data Source | `d1c3e770-177b-4fcb-b308-015809210845` |
| QA Test Plan | `32ccea3cd9e8818f9e30f317dea0fed7` |
| Education Platform | `331cea3cd9e8816aa07feec250328cf8` |
| Parking Lot | `32ccea3cd9e881809257fd5e7973c6d7` |

**Notion update rules:**
- `old_str`/`new_str` requires EXACT whitespace matching — fetch page first
- Table cell updates via MCP fail — flag for manual edit
- NEVER set icon and title together (double-emoji bug)

---

## Audit Tools
| Tool | When | Command |
|------|------|---------|
| Static source audit | Before every `clasp push` | `bash audit-source.sh` |
| Wiring audit | After adding `google.script.run` calls | `bash audit-wiring.sh` |
| Runtime tests | After every push AND deploy | Hit `?action=runTests` |
| Pre-QA diagnostic | Before every deploy | `diagPreQA()` in GASHardening.gs |
| Gate 1 (wiring) | Before every push | PowerShell script above |
| Gate 2 (visual) | When KidsHub.html touched | PowerShell script above |
| Gate 3 (version) | Before every push | Grep 3 locations per file |

---

## Audio Pipeline
- **Source of truth:** `phrases.json` (repo root)
- **Generation:** `node generate-audio.js` (local)
- **Voice IDs:** JJ/Nia = `A2YMjtICNQnO93UAZ8l6` | Buggsy/Marco = `RYPzpPBmugfktRI79EC9`
- **Models:** `eleven_v3` for speech, `eleven_flash_v2_5` for IPA phonemes

## GAS Triggers (reference — LT installs these)
| Time | Function | Purpose |
|------|----------|---------|
| 5:00 AM CST | `resetDailyTasksAuto()` | Reset daily chores |
| 6:00 AM CST | `dailyHealthCheck()` | Smoke + error scan + heartbeat |
| 6:30 AM CST | `runSnapshot()` | Code snapshot to Drive |
