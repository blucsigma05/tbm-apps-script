# TBM (TillerBudgetMaster) — Project Rules

## Session Start
1. Read this file fully
2. Run `clasp deployments` to confirm deployment ID
3. Fetch PM Active Versions (Notion `2c8cea3cd9e8818eaf53df73cb5c2eee`) for current state
4. Check the TBM Operations Project board and the "Needs Decision" column for anything blocked on LT input
5. Do NOT begin work until steps 1–4 are complete

## Workflow — Issues, PRs, and the Project Board

**The hierarchy:** Epic → Issue → PR. Every Issue has exactly one reason to exist. Every PR closes at least one Issue via `Closes #NNN`. Chat is transient. If it needs to survive the conversation, it becomes an Issue.

**Object types — pick one when creating work:**

| Type | Use when | GitHub form | Primary label |
|------|----------|-------------|---------------|
| Spec | A design decision that needs alignment before code | Issue + `specs/*.md` file | `kind:spec` |
| Bug | Something is broken | Issue | `kind:bug` |
| Task | Actionable work that isn't a spec or bug | Issue | `kind:task` |
| Decision | A question requiring LT input | Issue | `kind:decision` + `needs:lt-decision` |
| Epic | Long-running initiative spanning multiple issues | Issue | `kind:epic` |
| Code change | Anything that modifies files | PR | inherits from the Issue it closes |

**The rule that kills "where are we":** if an Issue/PR exists on the Project board, its status tells you where it is. Do not ask for status in chat — check the board. If the board is wrong, fix the labels.

**Label families (six):**

- `kind:` spec, bug, task, decision, epic — what the work IS
- `severity:` blocker, critical, major, minor — how urgent (existing Codex label scheme)
- `model:` opus, sonnet, codex, lt — who is working on it
- `needs:` lt-decision, implementation, review, qa, spec — what's blocking progress
- `area:` jj, buggsy, finance, infra, qa, education, shared — which part of the system
- `status:` draft, approved, implementing, shipped — spec lifecycle (specs only)

**Standard flow for any change:**

1. Open an Issue with labels `kind:*`, `severity:*`, `area:*`, and `model:*` (or `needs:lt-decision` if blocked on LT). Card lands in Backlog.
2. If it needs a spec first: open a `kind:spec` Issue first, spec PR lands, spec Issue closes with `status:approved`, implementation Issue opens linking to the approved spec.
3. Implementation: open a branch, push code, open PR with `Closes #NNN` in the description. Card moves to In Progress.
4. CI + Codex review. Card moves to In Review.
5. PR merges. Issue auto-closes. Card moves to Done. Pushover notification fires.

**Specs specifically:**

- Spec text lives as `specs/<name>.md` in the repo (permanent reference)
- The spec PR merges into main so the file is canonical
- Decisions from spec review are recorded as PR comments before merge AND in the spec file under "Open questions — resolved"
- A separate implementation Issue opens after the spec PR merges, linking to the spec file path
- Implementation PRs close the implementation Issue, not the spec Issue

**Decisions specifically:**

- Never let an open question live as a bullet in chat. If LT needs to answer it, it is an Issue with `kind:decision` + `needs:lt-decision`.
- LT's answer is the comment that closes the Issue.
- If a decision is blocking 3 specs, the Issue has back-links in all 3 specs. The Issue is the single source of truth for why the decision was made.

**Codex findings:**

- In-PR review comments stay in the PR (that's the evidence)
- For any blocking finding, Claude (or LT, during audit) **manually opens** a dedicated Issue with `kind:bug` + `severity:blocker` + a link to the PR comment. This is a process rule, NOT an automation — the Codex pipeline does NOT auto-create Issues today (it posts comments and applies `pipeline:*` labels only). The manual Issue exists so the finding survives PR close/merge. Future automation (Orchestration Loop Phase 3+, issue #111) may promote this to an automatic step; until then, if nobody files the Issue, the finding only lives in the PR thread and can be lost.

**When LT says "PR" but means "Issue" (or vice versa):**

- Claude MUST redirect and confirm: "You said PR — did you mean the Issue, or is this actually a code change?"
- Do not silently create the wrong object.
- One sentence, no back-and-forth. If it's ambiguous after one confirmation, default to Issue.

**Forbidden patterns:**

- Answering "where are we on X?" with a chat summary. Correct answer: "Check Issue #NNN" or "Check the Project board."
- Opening a PR without a linked Issue (exception: trivial one-line fixes).
- Handing Sonnet a prompt via chat copy-paste instead of an Issue body.
- Letting a decision live in PR comments when it should be an Issue.
- Using `needs:lt-decision` on a PR — those belong on Issues, then the PR picks up the decided answer.

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
11. Stopping at `clasp push` without completing the full pipeline
12. Creating a new GAS deployment instead of updating existing
13. Version mismatches across the 3 required locations (header, getter, EOF)
14. Pushing to GAS without `git commit` + `git push` after
15. Pushing without running `audit-source.sh` first
16. Adding a `google.script.run` call without adding the Safe function to smoke test wiring check
17. Using `clasp deploy` without `-i` flag
18. Pushing a branch that is behind `origin/main` (staleness gate catches this)
19. Embedding Python/bash heredocs in workflow YAML instead of using `.github/scripts/`

### Tier 3 — Causes Drift
20. Duplicating constants across files (shared global scope — they're already available)
21. Writing to a sheet tab owned by another module
22. Skipping Notion deploy page update after deploy
23. Updating Notion page icon+title together (double-emoji bug — update title only)
24. Guessing at versions — read the actual file header
25. Starting a big refactor without a Step 0 cleanup commit
26. Trusting a grep that returned suspiciously few results without re-running narrower
27. Running multiple PRs that touch hot files (workflows, CLAUDE.md, audit-source.sh) in parallel

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
| ActivityStoryPacks.gs | Pre-authored story packs for SparkleLearning | — (read-only) |
| AssetRegistry.gs | Shared asset catalog for SparkleLearning + validators | — (read-only) |
| AuditTrigger.gs | Scheduled audit trigger coordinator | — |
| ContentEngine.gs | Gemini-powered grading + content generation | — |
| CurriculumSeed.gs | Curriculum seed data for JJ (8 wk) + Buggsy (16 wk) | Curriculum |
| DeployGate.gs | Pre-deploy schema + function validation | — (read-only) |
| EducationAlerts.gs | Education-specific Pushover alerts | — |
| FormulaAudit.gs | Workbook formula forensics | — (read-only) |
| NotionBridge.gs | Push TBM health data to Notion for agents | — |
| NotionEngine.gs | Notion API wrapper for education modules | — |
| QAOperatorSafe.gs | Safe wrappers for QA Operator Mode | QA_Snapshots |
| Resettesting.gs | QA sandbox reset + seed tooling | — |
| SpellingCatalog.gs | 450-word spelling catalog (generated) | — (read-only) |
| Utility.gs | Run-once utility functions | — |

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
| DesignDashboard.html | Ring Quest dashboard designer | `wolfdome` / `dashboard` |
| ProgressReport.html | Weekly progress report (parent) | `progress` |
| StoryLibrary.html | Family story library | `story-library` |
| StoryReader.html | Bedtime story reader | `story` |
| Vault.html | LT watch collection vault | `vault` |
| JJHome.html | JJ Sparkle Kingdom hub | `sparkle-kingdom` |
| wolfkid-power-scan.html | Wolfkid power scan assessment | `power-scan` |
| executive-skills-components.html | Shared exec skills component (inlined) | — (not routed) |

### Utility files (NOT pushed to GAS)
| File | Purpose |
|------|---------|
| phrases.json | Audio clip definitions (source of truth) |
| generate-audio.js | ElevenLabs batch audio generator (Node.js) |
| generate-spelling-catalog.js | Reads spelling-catalog.json → writes SpellingCatalog.js |
| audit-source.sh | Static source audit (pre-push gate) |
| audit-wiring.sh | Wiring verification (post-new-call gate) |
| cloudflare-worker.js | CF Worker: smart proxy, PIN gate, Tiller freshness |
| uptime-worker.js | CF Worker: uptime monitoring |
| playwright.config.js | Playwright test configuration |
| CLAUDE.md | This file |

### CI/CD scripts (.github/scripts/)
| Script | Called by | Purpose |
|--------|-----------|---------|
| `codex_review.py` | codex-pr-review.yml | Send PR diff to OpenAI gpt-4o, format review comment |
| `parse_test_results.py` | ci.yml | Parse GAS smoke+regression JSON into PR comment |
| `parse_playwright_results.py` | playwright-regression.yml | Parse Playwright JSON into PR comment |
| `parse_finding_comment.py` | codex-pr-review.yml | Parse PR comment for finding markers, apply labels |
| `triage_review.py` | codex-pr-review.yml | Classify PR into skip/light/medium/full before review |
| `check_version_drift.py` | hygiene.yml | Compare deployed GAS versions against source constants |
| `check_claude_md.py` | hygiene.yml | Detect CLAUDE.md bloat, dead refs, duplicate phrases |
| `check_dead_workflows.py` | hygiene.yml | Flag workflows with no recent runs |
| `check_integration_map_drift.py` | hygiene.yml | Flag Notion Integration Map entries past review date |
| `check_knowledge_graph_diff.py` | hygiene.yml | Diff knowledge files across push range |
| `check_orphaned_prs.py` | hygiene.yml | Find open PRs with no activity past threshold |
| `check_parking_lot_age.py` | hygiene.yml | Flag stale Notion Parking Lot items |
| `check_secrets_audit.py` | hygiene.yml | List GH secrets, flag orphaned or stale |
| `check_stale_branches.py` | hygiene.yml | Find branches with no open PR past threshold |
| `check_trust_backlog_age.py` | hygiene.yml | Flag stale Trust Backlog sprint items |
| `review-fixer.js` | review-fixer.yml | Auto-apply deterministic fixes from PR review threads |
| `review-watcher.js` | review-watcher.yml | Watch PR review status and update pipeline markers |

Each script is runnable standalone for local testing. Each reads env vars — no positional args.

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
thompsonfams.com/wolfdome         → ?page=wolfdome        (Buggsy dashboard)
thompsonfams.com/sparkle-kingdom  → ?page=sparkle-kingdom (JJ dashboard)
thompsonfams.com/dashboard        → ?page=wolfdome        (alias)
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

### Device Viewport Map (for Playwright screenshots)
| Route | Viewport | Device |
|-------|----------|--------|
| `/spine` | 980x551 | Office Fire Stick |
| `/soul` | 980x551 | Kitchen Fire Stick |
| `/parent` | 412x915 | JT S25 |
| `/pulse` | 412x915 | JT S25 |
| `/vein` | 1920x1080 | LT Desktop |
| `/buggsy` | 800x1340 | A9 Tablet (portrait) |
| `/jj` | 800x1340 | A7 Tablet (portrait) |
| `/daily-missions` | 1368x912 | Surface Pro |
| `/daily-missions?child=jj` | 1200x1920 | S10 FE (portrait) |

---

## Deploy Pipeline (MANDATORY — every deploy)
Run steps 1–13 autonomously. Report results at end. LT's only action: review PR and approve.
**EXCEPTION: If any step returns unexpected output, STOP and report before continuing.**

1. **EDIT** → Make changes locally in `C:\Dev\tbm-apps-script`
2. **VERSION** → Bump version in ALL 3 locations per changed `.gs` file: line 3 header, `get*Version()` return, EOF comment. All three MUST match. Grep to verify.
3. **AUDIT** → `bash audit-source.sh` — FAIL = stop. WARN = review each, fix or document. Includes: ES5 compliance, version consistency, wiring check, route integrity, branch staleness, workflow lint (if changed), script compile (if changed).
4. **ES5 CHECK** → Run banned-pattern greps on changed `.html` files. Any match = fix.
5. **PRE-PUSH GATES** → Gate 1 (wiring — now in audit-source.sh), Gate 3 (version consistency — now in audit-source.sh). Any FAIL = stop.
6. **PUSH** → `clasp push`
7. **PRE-QA** → Run `diagPreQA()` from GASHardening.gs. Must show ALL categories PASS. Any FAIL = stop, fix, re-push, re-run.
8. **DEPLOY** → `clasp deploy -i <deploymentId>`
9. **VERIFY** → Hit `?action=runTests` on PRODUCTION `/exec` URL. Assert structured JSON: `overall == "PASS"` AND `smoke.overall == "PASS"`. Check ErrorLog for new errors (last 5 min). NOTE: `/dev` URLs require Google auth — curl/fetch cannot reach them.
10. **GIT** → Git Bash only (NOT PowerShell): `git checkout -b <branch>` → `git add <specific files>` → `git commit` → `git push origin <branch>` → Open PR
11. **NOTION** → Update PM Active Versions DB. Write thread handoff to Archive. Update deploy page title (version only, NOT icon).
12. **CF VERIFY** → curl all CF proxy endpoints from route list above, expect 200.
13. **RELEASE** → `gh release create v<version> --notes "<summary>"`

**Never stop at step 6.**

### Deploy Proof
Deploy success is proven, not inferred:
- **Deploy success = HTTP 200 from `?action=runTests` AND structured JSON assertion of `overall == "PASS"` AND `smoke.overall == "PASS"`.** NOT just "workflow completed."
- **The deploy Pushover MUST include:** deployment ID, version, smoke result, commit SHA, timestamp.
- **If any proof field can't be captured,** the workflow fails and sends BLOCKED Pushover. Don't ship a deploy proof that can be silently truncated.

---

## QA Gates

### Gate 4: Deploy Manifest
Every build spec produces a grep manifest WHEN THE SPEC IS CREATED — not after the build. Before declaring "QA ready," run every manifest line. Zero matches or `display:none` = NOT DONE.

Format:
```
# [Build Spec Name] — Deploy Manifest
grep -n "[unique identifier]" [file]    → expected: [what should be there]
```

### Gate 5: Feature Verification Checklist

Every build spec must include BOTH a Deploy Manifest (Gate 4) AND a Feature Verification Checklist (Gate 5).

- Deploy Manifest answers: "Does this feature EXIST?"
- Feature Verification answers: "Is this feature CORRECT?"

**Rules:**
1. Checklist is created AT SPEC TIME by Chat. Code does NOT define its own checklist.
2. Each item has a specific, measurable pass condition — not "looks good" but "background is #2D1B69" or "avatar is 120px" or "streak shows consecutive days."
3. The checklist is CUMULATIVE. Prior verified items carry forward to every future build of that surface. When fixing audit findings, re-verify ALL cumulative items plus new ones.
4. Before declaring "QA ready" or writing a handoff that says "complete," verify every checklist item by grep or by running the function and reading output.
5. Items verified only by reading source don't count. Run it, read Logger output, confirm the value.

**What goes on the checklist:** specific hex colors, pixel dimensions, math/formula outputs, conditional logic, text content, state transitions, interaction behavior.

### Gate 7: Post-Deploy Check

After deploy, verify production is stable — not just at deploy time but an hour later.

1. MonitorEngine log: zero errors since deploy timestamp
2. KidsHub heartbeat cache: age < 120 seconds
3. No Pushover error alerts fired since deploy
4. Hit each surface URL once, confirm no 500/error screen

For evening deploys, next-morning check is acceptable.

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

### ES5 Allowed Methods
These ES5.1 methods ARE allowed — they work in all target WebViews (Fully Kiosk 4.x+, Fire TV Silk, Samsung Internet 4+):
`Object.keys()`, `Array.isArray()`, `JSON.parse()`/`JSON.stringify()`, `indexOf()`, `forEach()`, `map()`, `filter()`, `trim()`

---

## API Proxy Contract
HTML modules served via Cloudflare use the `google.script.run` shim which POSTs to `/api?fn=FUNCTION_NAME`. When accessed directly via GAS (not Cloudflare), the XHR fallback uses `?action=api&fn=FUNCTION_NAME&args=[]` — this is handled by the same `serveData()` router branch in Code.gs. Both paths resolve to the same function execution.

## Pattern Registry
| Pattern | Canonical location |
|---------|--------------------|
| Error logging | GASHardening.gs → `logError_()` |
| Perf monitoring | GASHardening.gs → `logPerf_()`, `withMonitor_()` |
| Tab name lookup | DataEngine.gs → `TAB_MAP` |
| Version reporting | GASHardening.gs → `getDeployedVersions()` |
| Cache read/write | Code.gs → `getCachedPayload_()`, `setCachedPayload_()` |
| Workbook reference | `openById(SSID)` — NEVER `getActiveSpreadsheet()` |
| Push notifications | AlertEngine.gs → `sendPush_()` (recipients: LT, JT, BOTH) — use `PUSHOVER_PRIORITY.*` constants, never bare integers |
| KH heartbeat | KidsHub.gs → `stampKHHeartbeat_()` after every write |
| Lock acquisition | `waitLock(30000)` — NEVER `tryLock()` |
| Smoke + regression | Code.gs → `?action=runTests` returns combined JSON |
| New `google.script.run` call | Must have `withFailureHandler()`. Must add Safe wrapper to smoke test check. Must run audit-source.sh. |

---

## Alert Tiers (HYG-12)
All `sendPush_()` calls must use a named constant from `PUSHOVER_PRIORITY` in AlertEngine.gs. No bare integers.

| Constant | Value | Behavior | Use for |
|----------|-------|----------|---------|
| `DEPLOY_OK` | -2 | Silent | Successful deploys (CI PR comments confirm) |
| `HYGIENE_REPORT_LOW` | -1 | Quiet delivery | Weekly stale sweeps, diagnostics |
| `CHORE_APPROVAL` | 0 | Normal sound | Chore/ask/approval notifications |
| `BACKLOG_STALE` | 0 | Normal sound | Backlog age warnings |
| `CLAUDE_MD_BLOAT` | 0 | Normal sound | CLAUDE.md growth trigger (HYG-04) |
| `TILLER_STALE` | 1 | Vibrate (high) | Tiller freshness breach |
| `CLOSE_OVERDUE` | 1 | Vibrate (high) | Month-close gate day 6–20 (escalates to 2 on day 21+) |
| `SECRET_EXPIRING` | 1 | Vibrate (high) | Secrets audit |
| `SYSTEM_ERROR` | 1 | Vibrate (high) | GAS ErrorLog new entries |
| `PROD_DOWN` | 2 | Emergency + ack | Production outage |
| `DEPLOY_FAIL` | 2 | Emergency + ack | Deploy pipeline blocked |
| `GATE_BREACH` | 2 | Emergency + ack | Hard gate violation |

---

## CI/CD Pipeline

### Automated Checks (audit-source.sh — runs before every push)
| Check | Behavior |
|-------|----------|
| Branch staleness | Fails if branch is behind `origin/main`. Run `git rebase origin/main` first. |
| ES5 compliance | Scans all `.html` files for banned ES6+ patterns. |
| Version consistency | Verifies 3-location match (header, getter, EOF) in all `.gs` files. |
| eval() usage | Warns on eval() in server code. |
| Failure handler wiring | Verifies every `withSuccessHandler` has a matching `withFailureHandler`. |
| Route integrity | Verifies CF worker routes → GAS routes → backing HTML files all align. |
| Workflow YAML lint | Runs actionlint on workflow files (only when `.github/workflows/` files changed). |
| Python script compile | Runs py_compile on scripts (only when `.github/scripts/` files changed). |

### CI Checks (GitHub Actions — runs on every PR)
| Order | Check | Workflow | Purpose |
|-------|-------|----------|---------|
| 1 | Workflow Lint | `workflow-lint.yml` | actionlint + py_compile + shellcheck — runs first |
| 2 | TBM Smoke + Regression | `ci.yml` | GAS smoke + regression tests |
| 2 | Playwright Regression | `playwright-regression.yml` | E2E + viewport screenshots |
| 2 | Codex PR Review | `codex-pr-review.yml` | gpt-4o code review — has `needs: lint-gate` |

LT applies branch protection in GitHub Settings > Branches > Branch protection rules (UI action).

**Auto-merge policy:** Auto-merge can be enabled once the pipeline has run cleanly on 5 consecutive PRs without false negatives.

### Workflow Safety Rules
1. **Workflow YAML should orchestrate only.** Real logic (Python, bash) belongs in `.github/scripts/`. No embedded heredocs. Each script gets a header comment: purpose, calling workflow, env vars expected.
2. **New workflow files CANNOT review their own introduction** — they require manual lint plus one sacrificial test PR before becoming a required check.
3. **Codex bot comment updates use an HTML marker** (`<!-- codex-pr-review -->`) for deterministic matching.
4. **workflow-lint runs before all other PR checks.** codex-pr-review has `needs: lint-gate` — broken YAML fails fast without wasting an OpenAI API call.
5. **CI tool versions are pinned.** actionlint v1.7.7, shellcheck from ubuntu-latest. Deterministic CI.
6. **Local lint is conditional on changed files.** audit-source.sh only runs actionlint/py_compile when those files changed. CI runs unconditionally.

### Codex PR Audit Lane

When Codex is asked to audit PRs:
1. Prefer GitHub connector tools for posting PR comments/reviews.
2. Use `gh`/`git` for PR diff, PR metadata, and local grep as needed.
3. At the start of any review session, request reusable permission for the full audit lane — one batch, not per-command:
   - `gh pr view`
   - `gh pr diff`
   - `gh pr comment`
   - `gh api repos/blucsigma05/tbm-apps-script/pulls`
   - `git fetch origin`
4. Post findings directly to the PR thread via GitHub connector.
5. Return only a short summary in chat with links to the posted comments.

**Pass/fail standard (enforced by `codex-pr-review.yml`):**
- **PASS** requires: explicit `**Verdict:** PASS` + `**Files Reviewed:**` section listing files seen. No P1 violations.
- **FAIL** — explicit findings or `**Verdict:** FAIL`.
- **INCONCLUSIVE** — anything else: usage-limit hit, truncated diff, missing diff, no verdict, `**Files Reviewed:**` absent, rubber-stamp phrases detected. INCONCLUSIVE blocks merge, same as FAIL.
- "Looks good" / no explicit verdict / reviewer asks a question = INCONCLUSIVE. Not a pass.

### Branch Hygiene
1. **Sync before push.** Mandatory `git fetch origin main` and rebase before any push. The staleness gate in audit-source.sh enforces this.
2. **Branch from latest.** New branches must be created from `origin/main` after a fresh fetch.
3. **No merge if behind.** Rebase on current main, then rerun checks before requesting merge.
4. **No broad "take ours" on shared files.** During conflict resolution on workflow YAML, CLAUDE.md, audit-source.sh, or UI files, rebuild each conflicted file from intent. Inspect the final diff.
5. **Hot file lock.** When a PR touches `.github/workflows/**`, `.github/scripts/**`, `CLAUDE.md`, or `audit-source.sh`, only ONE such PR may be in flight. Others wait, then rebase.
6. **Pre-flight conflict check.** Run `git merge-tree origin/main HEAD` before opening a PR. Resolve conflicts locally.

### Merge Order
When multiple PRs touch the same files, they merge sequentially. After each merge, other PRs touching those files rebase on new main and re-run checks.

### Visual Regression
Playwright captures viewport screenshots at each route's real device viewport plus a 1920x1080 desktop check. Uploaded as artifacts on every PR.

**Phase 2 (future):** Pixel-diff comparison against baselines in `.github/visual-baselines/`. Build once we've collected stable baselines from 3-5 clean deploys.

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
| Integration Map DB | `33acea3cd9e881888295e3ab98be3fc4` |
| Trust Backlog DB | `338cea3cd9e8814a8cd6e1e04ecb4748` |

**Notion update rules:**
- `old_str`/`new_str` requires EXACT whitespace matching — fetch page first
- Table cell updates via MCP fail — flag for manual edit
- NEVER set icon and title together (double-emoji bug)

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
