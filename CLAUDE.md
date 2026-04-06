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

- **QA Framework:** 7 Gates + 2 Audits. See Notion: https://www.notion.so/336cea3cd9e881798061e9032cee48c3
- Gates 1-3: automated (audit-source, diagPreQA, runTests)
- Gate 4: Deploy Manifest (feature exists?)
- Gate 5: Feature Verification Checklist (feature correct?)
- Gate 6: QA Round (real device testing)
- Gate 7: Post-deploy check (still working?)
- Audit A: Code Quality Lab (periodic architecture/security)
- Audit B: Cross-surface consistency (periodic skeleton parity)

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
| Vault.html | LT watch collection vault | `vault` |
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

#### Core Surfaces
```
thompsonfams.com/pulse            → ?page=pulse
thompsonfams.com/vein             → ?page=vein
thompsonfams.com/parent           → ?page=kidshub&view=parent
thompsonfams.com/buggsy           → ?page=kidshub&child=buggsy
thompsonfams.com/jj               → ?page=kidshub&child=jj
thompsonfams.com/soul             → ?page=soul
thompsonfams.com/spine            → ?page=spine
```

#### Education Surfaces
```
thompsonfams.com/daily-missions   → ?page=daily-missions
thompsonfams.com/daily-adventures → ?page=daily-missions&child=jj  (JJ alias)
thompsonfams.com/homework         → ?page=homework
thompsonfams.com/sparkle          → ?page=sparkle
thompsonfams.com/sparkle-free     → ?page=sparkle&mode=freeplay
thompsonfams.com/wolfkid          → ?page=wolfkid
thompsonfams.com/reading          → ?page=reading
thompsonfams.com/writing          → ?page=writing
thompsonfams.com/facts            → ?page=facts
thompsonfams.com/investigation    → ?page=investigation
thompsonfams.com/baseline         → ?page=baseline
thompsonfams.com/power-scan       → ?page=power-scan
```

#### Tools & Dashboards
```
thompsonfams.com/dashboard        → ?page=dashboard
thompsonfams.com/progress         → ?page=progress
thompsonfams.com/comic-studio     → ?page=comic-studio
thompsonfams.com/story-library    → ?page=story-library
thompsonfams.com/story            → ?page=story
thompsonfams.com/vault            → ?page=vault
```

#### API Endpoints
```
thompsonfams.com/api              → POST proxy to google.script.run
thompsonfams.com/api/verify-pin   → PIN verification for finance surfaces
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

## Deploy Manifest (Gate 4)
Every build spec produces a grep manifest WHEN THE SPEC IS CREATED — not after the build. Before declaring "QA ready," run every manifest line. Zero matches or `display:none` = NOT DONE.

Format:
```
# [Build Spec Name] — Deploy Manifest
grep -n "[unique identifier]" [file]    → expected: [what should be there]
```

---

## Feature Verification Checklist (Gate 5)

Every build spec must include BOTH a Deploy Manifest (Gate 4) AND a Feature Verification Checklist (Gate 5).

- Deploy Manifest answers: "Does this feature EXIST?"
- Feature Verification answers: "Is this feature CORRECT?"

### Rules:
1. Checklist is created AT SPEC TIME by Chat. Code does NOT define its own checklist.
2. Each item has a specific, measurable pass condition — not "looks good" but "background is #2D1B69" or "avatar is 120px" or "streak shows consecutive days."
3. The checklist is CUMULATIVE. Prior verified items carry forward to every future build of that surface. When fixing audit findings, re-verify ALL cumulative items plus new ones.
4. Before declaring "QA ready" or writing a handoff that says "complete," verify every checklist item by grep or by running the function and reading output.
5. Items verified only by reading source don't count. Run it, read Logger output, confirm the value.

### What goes on the checklist:
- Specific hex colors ("background must be #2D1B69")
- Pixel dimensions ("avatar must be 120px", "watermark must fill ~85vw")
- Math/formula outputs ("streak counter shows consecutive days")
- Conditional logic ("if streak=0 show X, if streak>0 show Y")
- Text content ("header says 'Buggsy's Quest Board'")
- State transitions ("clicking DONE moves task to completed")
- Interaction behavior ("PIN modal appears on parent actions only")

### Checklist format (produced by Chat, verified by Code):
```
# [Surface] Feature Verification Checklist
# Spec: [source spec name]
# Created: [date]
# Cumulative items: [count]
# New items: [count]

## Cumulative (from prior verified builds)
- [ ] [item]: [expected value] (verified [version], spec: [source])

## New (this build)
- [ ] [item]: [expected value]
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

## API Proxy Contract
HTML modules served via Cloudflare use the `google.script.run` shim which
POSTs to `/api?fn=FUNCTION_NAME`. When accessed directly via GAS (not
Cloudflare), the XHR fallback in StoryLibrary.html uses
`?action=api&fn=FUNCTION_NAME&args=[]` — this is handled by the same
`serveData()` router branch in Code.gs. Both paths resolve to the same
function execution.

## ES5 Allowed Methods
The following ES5.1 methods ARE allowed despite edge-case compatibility
concerns, because they work in all target WebViews (Fully Kiosk 4.x+,
Fire TV Silk, Samsung Internet 4+):
- `Object.keys()`
- `Array.isArray()`
- `JSON.parse()` / `JSON.stringify()`
- `Array.prototype.indexOf()`
- `Array.prototype.forEach()`
- `Array.prototype.map()`
- `Array.prototype.filter()`
- `String.prototype.trim()`

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

## Post-Deploy Check (Gate 7)

After deploy, verify production is stable — not just at deploy time but an hour later.

### Check:
1. MonitorEngine log: zero errors since deploy timestamp
2. KidsHub heartbeat cache: age < 120 seconds
3. No Pushover error alerts fired since deploy
4. Hit each surface URL once, confirm no 500/error screen

For evening deploys, next-morning check is acceptable.

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
| Branch staleness | Before every push | `git merge-base --is-ancestor origin/main HEAD` (via audit-source.sh) |
| Workflow lint | Before every push (if workflow files changed) | `actionlint .github/workflows/*.yml` (via audit-source.sh) |
| Python compile | Before every push (if script files changed) | `python3 -m py_compile .github/scripts/*.py` (via audit-source.sh) |
| Viewport screenshots | Every PR (Playwright) | `tests/tbm/screenshots.spec.js` — real device viewports + desktop |

---

## Workflow Safety Policy

Workflow files (.github/workflows/*.yml) are a special class of change. Broken YAML in a workflow can silently disable CI gates, letting regressions reach main undetected. These rules exist because PR #67 shipped a broken workflow that was never caught.

### Rules

1. **Local lint gate is conditional on changed files.** `audit-source.sh` only runs actionlint when `.github/workflows/` files changed, and py_compile when `.github/scripts/` files changed. Unrelated pushes skip these checks. If workflow files DID change and actionlint isn't installed, the gate fails with install instructions. CI (`workflow-lint.yml`) still runs unconditionally across all files.
2. **New workflow files CANNOT review their own introduction** — they require manual lint plus one sacrificial test PR before being added as a required check.
3. **Workflow YAML should orchestrate only.** Real logic (Python, bash) belongs in versioned scripts under `.github/scripts/`. No big embedded heredocs in workflow YAML. Each script gets a header comment: purpose, called by which workflow, env vars expected.
4. **Deploy proof uses structured JSON assertions, not string matching.** The `deploy-and-notify.yml` smoke step parses the `runTests` response as JSON and asserts `overall == "PASS"` and `smoke.overall == "PASS"` as structured fields. If JSON parse fails or fields aren't PASS, the workflow fails and sends BLOCKED Pushover with debug info.
5. **Codex bot comment updates use an HTML marker** (`<!-- codex-pr-review -->`) for deterministic matching — no fuzzy text search that could match unrelated comments.
6. **workflow-lint runs before all other PR checks.** `codex-pr-review.yml` has `needs: lint-gate` — if YAML is broken, it fails fast without wasting an OpenAI API call. Branch protection enforces that workflow-lint must pass before merge.
7. **CI tool versions are pinned.** actionlint v1.7.7, shellcheck from ubuntu-latest runner. Deterministic CI — no surprise failures from upstream tool updates.

### Scripts Directory

`.github/scripts/` is the canonical home for all real logic that workflows orchestrate:

| Script | Called by | Purpose |
|--------|-----------|---------|
| `codex_review.py` | codex-pr-review.yml | Send PR diff to OpenAI gpt-4o, format review comment |
| `parse_test_results.py` | ci.yml | Parse GAS smoke+regression JSON into PR comment |
| `parse_playwright_results.py` | playwright-regression.yml | Parse Playwright JSON into PR comment |

Each script is runnable standalone for local testing. Each reads env vars — no positional args.

---

## Branch Protection (main)

Required status checks before merge (execution order matters):

| Order | Check | Workflow | Purpose |
|-------|-------|----------|---------|
| 1 | Workflow Lint | `workflow-lint.yml` | actionlint + py_compile + shellcheck — runs first, blocks downstream on failure |
| 2 | TBM Smoke + Regression | `ci.yml` | GAS smoke + regression tests |
| 2 | Playwright Regression | `playwright-regression.yml` | E2E browser tests against thompsonfams.com |
| 2 | Codex PR Review | `codex-pr-review.yml` | gpt-4o code review — has internal `needs: lint-gate` so it won't call OpenAI if YAML is broken |

**LT applies these in GitHub Settings > Branches > Branch protection rules** (UI action, not code).

**Auto-merge policy:** Auto-merge can be enabled once the new pipeline has run cleanly on 5 consecutive PRs without false negatives.

---

## Branch Hygiene — Staleness Is a Bug

These rules exist because PR #74 was silently blocked by merge conflicts from a stale branch. The pre-push gate (`audit-source.sh`) enforces the staleness check automatically.

1. **Sync before push.** Mandatory `git fetch origin main` and rebase (or merge) before any push, on any branch. If the rebase produces conflicts, resolve them locally and re-verify before pushing — never push a conflicted branch to GitHub.
2. **Branch from latest.** New branches must be created from `origin/main` after a fresh fetch. Never branch from a local main that may be hours behind.
3. **No merge if behind.** A PR cannot merge if its branch is behind main or has unresolved conflicts. Rebase/merge current main, then rerun checks before requesting merge.
4. **No broad "take ours" on shared files.** During conflict resolution on workflow YAML, CLAUDE.md, audit-source.sh, or any UI files, do NOT bulk-accept one side. Rebuild each conflicted file from intent, then inspect the final diff before committing.
5. **Hot file lock.** When a PR touches `.github/workflows/**`, `.github/scripts/**`, `CLAUDE.md`, `audit-source.sh`, or any other shared infrastructure file, only ONE such PR may be in flight at a time. Other PRs touching those files must wait until the in-flight PR merges, then rebase on the new main before continuing.
6. **Pre-flight conflict check.** Before opening a PR, run `git merge-tree origin/main HEAD` to detect conflicts. If conflicts exist, resolve locally first — don't push and let GitHub block.

---

## Deploy Proof — HTTP, Not Inference

Deploy success is proven, not inferred:

1. **Deploy success = HTTP 200 from `?action=runTests` AND structured JSON assertion of `overall == "PASS"` AND `smoke.overall == "PASS"`.** NOT just "workflow completed."
2. **The deploy Pushover MUST include:** deployment ID, version, smoke result, commit SHA, timestamp.
3. **If any proof field can't be captured,** the workflow fails and sends BLOCKED Pushover. Don't ship a deploy proof that can be silently truncated.

---

## Merge Order — Sequential, Not Parallel

When multiple PRs are in flight that touch the same files, they must merge sequentially, not in parallel. After each merge, all other open PRs touching the same files must rebase on the new main and re-run checks before they can merge.

The hardening PR (#74) is the canonical example: it touched workflow YAML, CLAUDE.md, and audit-source.sh — all hot files. Any PR opened during its lifetime that touched the same files had to wait or rebase.

---

## Visual Regression — Playwright Screenshots

Any UI-affecting PR requires Playwright viewport screenshots for the touched routes. The `playwright-regression.yml` workflow captures screenshots at each route's real device viewport and uploads them as artifacts on every PR.

### Route Viewport Map

| Route | Viewport | Device |
|-------|----------|--------|
| `/spine` | 980x551 | Office Fire Stick |
| `/soul` | 980x551 | Kitchen Fire Stick |
| `/parent` | 412x915 | JT S25 |
| `/pulse` | 412x915 | JT S25 |
| `/vein` | 1920x1080 | LT Desktop |
| `/buggsy` | 1340x800 | A9 Tablet |
| `/jj` | 1340x800 | A7 Tablet |
| `/daily-missions` | 1368x912 | Surface Pro |
| `/daily-missions?child=jj` | 1920x1200 | S10 FE |

Each route gets two screenshots: one at its real device viewport, one at 1920x1080 desktop. Artifacts are uploaded on every PR for reviewer inspection.

**Phase 2 (future):** Pixel-diff comparison against baseline screenshots stored in `.github/visual-baselines/`. Failing diffs block merge. Build this once we've collected stable baselines from 3-5 clean deploys.

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
