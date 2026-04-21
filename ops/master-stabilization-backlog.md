# TBM Master Stabilization Backlog — CP-5
<!-- control-plane v1 — originally 105 items from expressive-bubbling-diffie.md plan -->
<!-- Reconciled 2026-04-21: +6 items folded in from open Gitea issues (see reconciliation note) -->
<!-- P0 items 1-27 + Codex additions 101-105 are explicitly spec'd in the plan -->
<!-- P1-P8 items are derived from band descriptions in the plan; expand each band before executing -->
<!-- Status values: Open / In Progress / Done / Blocked / [awaiting-device-verify] -->

> **THIS IS THE CANONICAL STABILIZATION LIST.** Any open Gitea issue that describes stabilization work is reflected here. Percent-complete reporting uses this file's denominator (originally 105; post-reconciliation 111).

## 2026-04-21 reconciliation note (post-Gitea migration)

- **Forge canon:** Gitea (`git.thompsonfams.com/blucsigma05/tbm-apps-script`) has been canonical since 2026-04-19. GitHub is archive-only (account suspended). **Any `#NNN` reference in this file refers to the GitHub archive unless explicitly prefixed `Gitea #`.** Items 1-11 in particular reference pre-migration `gh` commands + PR #351; re-plan when executing, the intent survives but the toolchain changed.
- **Infra debt ≠ stabilization progress.** The PORT wave (17 PRs), Phase C merges (7 PRs), Phase D deep-audit build (Gitea #2), and cf-events-worker cleanup do NOT move this backlog's count. They are tracked separately. This file measures P0-P8 stabilization work only.
- **New items folded in from open Gitea issues:** items 22a (Gitea #26 KidsHub write-verify — renumbered from 22 to avoid collision), 27a (Gitea #25 CalendarSync), 34a (Gitea #34 letter-E audio), 58 absorbs Gitea #35 (JJ audio coverage audit), 81a (Gitea #37 Claude Design pilot), 88a (Gitea #23 rail watchdog). **Six new items. Total denominator: 111.**
- **Honest completion as of 2026-04-21 (post-reconciliation + status sweep + item 26 audit):** Done **11** / 111 = **9.9%**. In-motion (Done + In Progress + awaiting-device-verify) = **13** / 111 = **11.7%**.
  - Items newly marked Done 2026-04-21 after verify-before-assert audit: **21, 22, 24, 25, 26** (code was live before migration for 21/22/24; 25 shipped today via PR #50; 26 completed via issue-by-issue audit today).
  - Item 22 renumbered to **22a** to eliminate the duplicate-number collision introduced during the 2026-04-21 reconciliation (original 22 is deploy-freeze audit-source check; 22a is Gitea #26 KidsHub write-verify).

## Summary

| Band | Items | Theme | Blocks Stable Use? |
|---|---|---|---|
| P0 | 1-27 + 101, 102, 103, 105 | Education fix + Play gates + JT ops + Freeze + Truth discipline + Quality bars + Fallback | Yes |
| P1 | 28-50 | Binary surface sweep + fix all critical/major | Yes |
| P2 | 51-62c | Skill extensions (education-qa, curriculum-planner, thompson-engineer, incident-response) | No |
| P3 | 63-68 | Security skill build + run | Critical findings only |
| P4 | 69-73 | Phantom/branch/drift cleanup | Items 72-73 only |
| P5 | 74-81 | Audit/role/skill architecture cleanup | No |
| P6 | 82-88 | Automation calibration | No |
| P7 | 89-95 + 104 | Operational stability proof | Yes |
| P8 | 96-100 | Finance stability + March close | Items 96-98 only |

---

## Full Backlog

| # | Priority | Do | Verify | Done When | Status |
|---|---|---|---|---|---|
| 1 | P0 | Confirm PR #351 merged (fix: normalize per-question fields — issue #350) | `gh pr view 351` → `state: MERGED` | PR shows merged | Open |
| 2 | P0 | Run deploy pipeline step 1: confirm local changes correct (Kidshub.js v70→v71) | Read Kidshub.js header confirms v71 | File is v71 on branch | Open |
| 3 | P0 | Run deploy pipeline step 2: version bump verified in all 3 locations (header, getter, EOF) | Grep confirms 3-location match | audit-source.sh version gate PASS | Open |
| 4 | P0 | Run deploy pipeline step 3: `bash audit-source.sh` PASS | Exits 0, no FAIL lines | All gates green | Open |
| 5 | P0 | Run deploy pipeline step 4: `clasp push` | clasp output shows success | GAS editor shows updated file | Open |
| 6 | P0 | Run deploy pipeline step 5: `diagPreQA()` — all categories PASS | Logger output: all PASS | Zero FAIL categories | Open |
| 7 | P0 | Run deploy pipeline step 6: `clasp deploy -i <deploymentId>` | clasp output shows version deployed | Deployment ID unchanged | Open |
| 8 | P0 | Run deploy pipeline step 7: `?action=runTests` → `overall == "PASS"` AND `smoke.overall == "PASS"` | Hit prod /exec URL, parse JSON | overall + smoke.overall both PASS | Open |
| 9 | P0 | Run deploy pipeline step 8: git branch → add specific files → commit `#350` → push → open PR with `Closes #350` | `gh pr view` shows PR open | PR created with Closes #350 | Open |
| 10 | P0 | Run deploy pipeline step 9: Update Notion PM Active Versions DB; write Thread Handoff | Notion DB shows new version; Handoff page updated | Both Notion updates confirmed | Open |
| 11 | P0 | Run deploy pipeline step 10-11: CF verify all routes 200; `gh release create` | curl CF routes: /homework /reading /writing 200; release visible on GitHub | CF routes 200 + release created | Open |
| ~~101~~ | ~~P0 (before #14)~~ | ~~Define minimum viable standard for JJ surfaces — what does "working" look like for SparkleLearning, daily-adventures, sparkle-kingdom? Written as Issue, not chat~~ | ~~Issue created with explicit pass conditions~~ | ~~MVSS v1 spec shipped in PR #354; rubric IDs J1-J6 cover JJ bar~~ | ~~Open~~ **Closed #354** |
| ~~102~~ | ~~P0 (before #15)~~ | ~~Define minimum viable standard for Buggsy surfaces — HomeworkModule, reading, writing, wolfkid, comic-studio, wolfdome~~ | ~~Issue created with explicit pass conditions~~ | ~~MVSS v1 spec shipped in PR #354; rubric IDs B1-B6 cover Buggsy bar~~ | ~~Open~~ **Closed #354** |
| 12 | P0 | Build `/play` skill for JJ surfaces (SparkleLearning, daily-adventures, sparkle-kingdom, JJHome) using Opus model | Skill file created; references verified against actual files; no hallucinated function names | Skill runs on JJ surface, produces actionable findings | Open |
| 13 | P0 | Build `/play` skill for Buggsy surfaces (HomeworkModule, reading, writing, wolfkid, comic-studio, wolfdome) using Opus model | Skill file created; references verified | Skill runs on Buggsy surface, produces actionable findings | Open |
| 14 | P0 (after #101) | Run Play gate for JJ — execute skill against JJ surfaces; produce ship / do-not-ship judgment with evidence | Opus model; findings logged as Issues with `kind:bug` + `severity:*` | Written judgment: ship or do-not-ship per surface; all findings filed as Issues | Open |
| 15 | P0 (after #102) | Run Play gate for Buggsy — execute skill against Buggsy surfaces; produce judgment | Opus model; findings filed as Issues | Written judgment per surface; all findings filed | Open |
| 16 | P0 | Fix all Play findings rated critical or major from items 14-15 [verified-device] | Sonnet; each fix closes its Issue; re-run Play skill after fixes | All critical/major findings closed; re-run gate PASS | Open |
| 17 | P0 | Audit JT alert routing — which alerts fire to JT? which should? Review all sendPush_ calls with recipient=JT or BOTH | Grep all sendPush_ in AlertEngine callers; log findings | Finding list: alerts that should reach JT vs. alerts that don't | Open |
| 18 | P0 | Update alert routing to ensure JT receives the correct operational alerts | Test push fires to JT; Logger confirms correct recipient | JT phone receives test alert | Open |
| 19 | P0 | Create/update JT ops card — what JT needs to operate TBM without LT | Ops card Issue created; covers: what each surface does, how to approve chores, how to access ThePulse | Ops card exists as Issue + Notion page; JT can find it independently | Open |
| 20 | P0 | Verify JT can operate end-to-end: approve chore, access ThePulse, handle a reward redemption | JT walks through flow on S25 without LT guidance | JT completes all 3 operations [device-verified] | Open |
| ~~103~~ | ~~P0 (before #21)~~ | ~~Inventory every path that can modify production state: scheduled triggers, manual editor runs, clasp push, webhook, direct sheet edits~~ | ~~Grep GASHardening, AuditTrigger, Code.js, triggers list; produce explicit list of mutation paths~~ | ~~DONE — ops/mutation-paths.md shipped in PR #363 (closes #362) [verified-main]~~ | ~~Open~~ **Closed #362** |
| ~~21~~ | ~~P0~~ | ~~Implement deploy freeze: Script Property gate `DEPLOY_FREEZE=1` blocks all mutation paths not on allowlist~~ | ~~audit-source.sh checks property; gate logs Pushover if blocked~~ | ~~DONE — `assertNotFrozen_('freeze-critical', <fn>)` calls exist in Code.js mutation paths (verified 2026-04-21: Code.js:1012 logHomeworkCompletionSafe, :1066 logSparkleProgressSafe); Script Property gate + allowlist live~~ | ~~In Progress~~ **Done [verified-main]** |
| ~~22~~ | ~~P0~~ | ~~Add DEPLOY_FREEZE check to audit-source.sh pre-push gate~~ | ~~audit-source.sh fails fast when freeze is active + deploy attempted~~ | ~~DONE — audit-source.sh Check 6 (lines 421+) reads freeze via `clasp run getFreezeState_`, fail-closed on clasp/jq error or non-JSON output, emits clear FAIL with reason+expiry; EMERGENCY=1 bypass wired~~ | ~~In Progress~~ **Done [verified-main]** |
| 23 | P0 | Test freeze: attempt deploy while freeze active → confirm gate fires and blocks | EMERGENCY=1 bypass works correctly; normal deploy blocked | Freeze blocks normal deploy; EMERGENCY=1 passes | **Open [needs-runtime-verify]** — code path exists; runtime evidence not captured post-migration |
| ~~24~~ | ~~P0~~ | ~~Document freeze policy in CLAUDE.md and ops/ — when to set, how to lift, who can override~~ | ~~CLAUDE.md has freeze section; work-doctrine.md references it~~ | ~~DONE — CLAUDE.md has full freeze section (line 192+, references `ops/deploy-freeze.md`); `ops/deploy-freeze.md` exists (13.6k, last touched 2026-04-16)~~ | ~~In Progress~~ **Done [verified-main]** |
| ~~25~~ | ~~P0~~ | ~~Truth discipline — create verify-before-assert template for any claim about deployed state~~ | ~~Template Issue created with format: claim → grep evidence → Logger evidence → source verified~~ | ~~DONE — Gitea Issue #49 filed 2026-04-21 + `ops/templates/verify-before-assert.md` canonical file landed in PR #50; CLAUDE.md Verify-Before-Assert section links to it~~ | ~~Open~~ **Done (PR #50)** |
| ~~26~~ | ~~P0~~ | ~~Apply truth discipline retroactively: audit all open Issues for unverified claims; grep-verify each; update or close~~ | ~~All open Issues checked; unverified claims flagged with `needs:verification`~~ | ~~DONE 2026-04-21 — audited all 8 open Gitea issues (#2, #23, #25, #26, #34, #35, #37, #49); audit comments posted with verify-before-assert template blocks. 3 had verifiable current-state claims, all ✅ verified against source (Issue #25 CalendarSync.js:946, Issue #34 phrases.json + SparkleLearning.html:2306, Issue #35 SparkleLearning.html:1325-1340). 4 were forward-looking / meta with no current-state claims. 1 (#26) was already verified via concurrent PR #51. Zero issues required `needs:verification` flag.~~ | ~~Open~~ **Done [verified-main]** |
| 27 | P0 | Verify truth discipline is stable: next 3 PRs include grep evidence for every function/file claim | PR comments show grep output for each claim | 3 PRs with verified claims merged | Open |
| 27a | P0 (truth-discipline) | **Gitea #25 — CalendarSync hardcoded school calendar bypasses canonical sheet-backed model.** `loadNanceSchoolCalendar()` in `CalendarSync.js:946-957` hardcodes 3 school years of dates and writes directly to Google Calendar, creating a second source of truth with no reconciliation. Move calendar data into the canonical sheet model; make CalendarSync read from the sheet, not from an inline literal. | Grep `loadNanceSchoolCalendar`; confirm no literal date arrays remain; diff against canonical sheet | CalendarSync reads from sheet; no inline date literals; reconciliation path exists | Open |
| 22a | P0 | **Gitea #26 — KidsHub approval/override write-verify is incomplete.** `Kidshub.js:1525-1545` `khApproveTask()` only reads-back `Parent_Approved` after a multi-field `setValues()`; partial failures leave rows in inconsistent state while the function returns success. Audit + fix all KH write paths to verify every field written. (Renumbered from 22 → 22a on 2026-04-21 to avoid collision with original item 22 which is now Done.) | Grep `setValues` in Kidshub.js; each call site must have matching full read-back + assertion | All KH_ write paths verify every mutated field; partial-failure path fires ErrorLog + no-success return | **In Progress (PR #51)** |
| ~~105~~ | ~~P0~~ | ~~Define fallback behavior policy per critical surface: what happens when getTodayContent returns null/empty? When KH data fails to load? When DE payload is stale?~~ | ~~One policy per surface in verification-matrix or dedicated Issue~~ | ~~DONE — ops/fallback-policy.md shipped in PR #365 (closes #364) [verified-main]~~ | ~~Open~~ **Closed #364** |
| 28 | P1 | Binary check: /buggsy — loads, chore board renders, task completion fires | `/buggsy` 200; chore list visible; complete button works | PASS or FAIL with specific finding filed as Issue | Open |
| 29 | P1 | Binary check: /jj — loads, sparkle stars render, task completion fires | `/jj` 200; star board visible; complete button works | PASS or FAIL with finding | Open |
| 30 | P1 | Binary check: /parent — loads, approval queue renders, approve/reject fires | `/parent` 200; queue visible; approve button writes KH_History | PASS or FAIL with finding | Open |
| 31 | P1 | Binary check: /homework — loads, question renders with options, answer submits | `/homework` 200; question text visible; options clickable; submit records to KH_Education | PASS or FAIL with finding | Open |
| 32 | P1 | Binary check: /sparkle — loads, first activity renders, answer records | `/sparkle` 200; activity visible; correct answer awards rings | PASS or FAIL with finding | Open |
| 33 | P1 | Binary check: /sparkle-free — loads, freeplay mode active, no homework gate | `/sparkle-free` 200; freeplay badge visible; no gate prompt | PASS or FAIL with finding | Open |
| 34 | P1 | Binary check: /reading — loads, passage renders, question displays | `/reading` 200; passage text visible; question renders | PASS or FAIL with finding | Open |
| 34a | P1 (content) | **Gitea #34 — `jj_letter_phrase_E.mp3` plays wrong text** ("Excellent" instead of "E is for Elephant"). `phrases.json` spec is correct; either the ElevenLabs generation used the wrong text or the MP3 on Drive is stale. Regenerate or re-upload the clip. | Play clip; confirm audio matches `text` field in phrases.json | Clip audio matches phrases.json spec | Open |
| 35 | P1 | Binary check: /writing — loads, prompt renders, submit works | `/writing` 200; writing prompt visible; submission recorded | PASS or FAIL with finding | Open |
| 36 | P1 | Binary check: /wolfkid — loads, CER writing surface renders | `/wolfkid` 200; writing surface visible | PASS or FAIL with finding | Open |
| 37 | P1 | Binary check: /facts — loads, drill renders, answer records | `/facts` 200; math fact displays; answer input works | PASS or FAIL with finding | Open |
| 38 | P1 | Binary check: /investigation — loads, science investigation renders | `/investigation` 200; content visible | PASS or FAIL with finding | Open |
| 39 | P1 | Binary check: /daily-missions — loads, mission list renders, state saves | `/daily-missions` 200; missions visible; state persists | PASS or FAIL with finding | Open |
| 40 | P1 | Binary check: /daily-adventures (JJ alias) — loads at JJ viewport, correct child context | `/daily-adventures` 200; JJ context rendered | PASS or FAIL with finding | Open |
| 41 | P1 | Binary check: /baseline — loads, diagnostic renders | `/baseline` 200; content visible | PASS or FAIL with finding | Open |
| 42 | P1 | Binary check: /comic-studio — loads, studio renders, draft saves | `/comic-studio` 200; studio visible; saveComicDraftSafe writes | PASS or FAIL with finding | Open |
| 43 | P1 | Binary check: /wolfdome — loads, Buggsy dashboard renders, design data loads | `/wolfdome` 200; dashboard visible; design choices load | PASS or FAIL with finding | Open |
| 44 | P1 | Binary check: /sparkle-kingdom — loads, JJ home renders | `/sparkle-kingdom` 200; content visible | PASS or FAIL with finding | Open |
| 45 | P1 | Binary check: /pulse — loads behind PIN gate, finance data renders | `/pulse` 200 after PIN; KPIs visible; no NaN/undefined | PASS or FAIL with finding | Open |
| 46 | P1 | Binary check: /vein — loads behind PIN gate, full command center renders | `/vein` 200 after PIN; all panels visible | PASS or FAIL with finding | Open |
| 47 | P1 | Binary check: /spine — loads on Fire Stick viewport, ambient display renders | `/spine` 200; display renders at 980×551 | PASS or FAIL with finding | Open |
| 48 | P1 | Binary check: /soul — loads on Fire Stick viewport, kitchen display renders | `/soul` 200; display renders at 980×551 | PASS or FAIL with finding | Open |
| 49 | P1 | Binary check: /progress — loads, weekly progress report renders | `/progress` 200; report data visible | PASS or FAIL with finding | Open |
| 50 | P1 | Fix all critical/major findings from items 28-49 [verified-device] | Each fix closes its Issue; re-run binary check after fix | All critical/major P1 findings closed; surfaces verified on device | Open |
| 51 | P2 | Extend education-qa skill: add passes for question shape validation, audio wiring, ring-award flow | Skill diff reviewed; no hallucinated references | Extended skill runs clean on HomeworkModule | Open |
| 52 | P2 | Extend curriculum-planner skill: add spiral review coverage check, TEKS gap detection | Skill diff reviewed | Extended skill produces curriculum gap report | Open |
| 53 | P2 | Extend thompson-engineer skill: add GAS anti-pattern detection (tryLock, getActiveSpreadsheet, missing withFailureHandler) | Skill diff reviewed; grep confirms patterns are real | Extended skill flags actual violations in repo | Open |
| 54 | P2 | Extend incident-response skill: add runbook for getTodayContent null return, KH cache miss, DE payload stale | Skill diff reviewed | Extended skill produces runbook with real function names verified | Open |
| 55 | P2 | Extend adhd-accommodations skill: add Buggsy-specific accommodation checks | Skill diff reviewed | Extended skill runs on HomeworkModule | Open |
| 56 | P2 | Extend grading-review-pipeline skill: add step for Gemini first-pass quality gate | Skill diff reviewed | Extended skill produces grading pipeline audit | Open |
| 57 | P2 | Extend parent-reporting skill: add ProgressReport verification pass | Skill diff reviewed | Extended skill runs on /progress | Open |
| 58 | P2 | Extend audio-pipeline skill: add ElevenLabs batch verify step — covers **Gitea #35 JJ SparkleLearning audio coverage audit** (reduce Web Speech TTS fallback / 'robo voice'). Identify call sites that leak to the fallback path; confirm every audioKey used by SparkleLearning has a cached Nia clip. | Skill diff reviewed; grep audioKey references across SparkleLearning.html | Extended skill produces per-call-site audio coverage report; fallback-leak call sites flagged | Open |
| 59 | P2 | Extend game-design skill: add FireOS compatibility check (no backdrop-filter, ES5) | Skill diff reviewed | Extended skill flags FireOS incompatibilities | Open |
| 60 | P2 | Extend qa-walkthrough skill: add device viewport matrix check | Skill diff reviewed | Extended skill produces viewport checklist | Open |
| 61 | P2 | Extend route-contracts skill: add QA route parity check | Skill diff reviewed | Extended skill validates QA_ROUTES mirrors PATH_ROUTES | Open |
| 62a | P2 | Run all extended skills (51-61) against their target surfaces | Opus model for first run; skill output logged | Each skill produces output with specific findings | Open |
| 62b | P2 | File all findings from skill runs as Issues with `kind:bug` + `severity:*` + `area:*` labels | Each finding is a distinct Issue; no findings buried in chat | All findings exist as open Issues on project board | Open |
| 62c | P2 | Fix critical/major findings from skill runs [verified-device] | Each fix closes its Issue; re-run skill pass after fix | All critical/major P2 findings closed | Open |
| 63 | P3 | Build security-review skill: auth surface checks (PIN gate, cookie validation, HMAC, rate limiting) | Opus model; skill references verified against cloudflare-worker.js actual code | Skill produces security checklist for auth surfaces | Open |
| 64 | P3 | Build security-review skill: client-side checks (XSS vectors, input validation, no sensitive data in HTML) | Opus model; skill references verified | Skill produces client-side security checklist | Open |
| 65 | P3 | Run security review on auth surfaces (cloudflare-worker.js PIN gate, QA HMAC, isValidFinanceCookie) | Opus model; grep evidence for every finding | Written security assessment with evidence; findings filed as Issues | Open |
| 66 | P3 | Run security review on education surfaces (getTodayContent inputs, KH write paths, ComicStudio draft storage) | Opus model | Written assessment; findings filed | Open |
| 67 | P3 | Run security review on finance surfaces (ThePulse, TheVein, DataEngine, serveData) | Opus model | Written assessment; findings filed | Open |
| 68 | P3 | Fix all critical security findings from 65-67 [verified-device] | Each fix closes its Issue; Codex re-review after fix | All critical security findings closed | Open |
| 69 | P4 | Identify phantom routes: CF PATH_ROUTES entries with no matching HTML file in repo | Grep PATH_ROUTES vs. file list; produce mismatch list | Mismatch list confirmed; phantoms filed as Issues or explained | Open |
| 70 | P4 | Identify and close stale branches: branches with no open PR past 30 days | `gh api` branch list; filter by date; list to LT for confirm-delete | Stale branches list confirmed by LT; branches deleted | Open |
| 71 | P4 | Identify code/spec drift: open Issues with `status:approved` but no linked PR | gh issue list filtered; produce drift list | Drift Issues have `needs:implementation` label added | Open |
| 72 | P4 (truth-critical) | Verify all function existence claims in CLAUDE.md Pattern Registry: grep for each function name, confirm it exists in the file claimed | Grep output for each Pattern Registry entry | All Pattern Registry entries verified; dead entries removed | Open |
| 73 | P4 (truth-critical) | Verify all route claims in CLAUDE.md Cloudflare Worker Routes section match cloudflare-worker.js PATH_ROUTES | Diff CLAUDE.md routes vs. cloudflare-worker.js; produce delta | CLAUDE.md routes section updated to match actual worker | Open |
| 74 | P5 | Audit skill role assignments: confirm each skill lists the correct model assignment per expressive-bubbling-diffie.md model table | Review model table in plan; grep each skill for model references | All skills have correct model annotation | Open |
| 75 | P5 | Audit all open Issues for correct model label (`model:opus`, `model:sonnet`, etc.) | gh issue list; filter unlabeled issues | All Issues have model label | Open |
| 76 | P5 | Classify all open Issues by `area:` label (jj, buggsy, finance, infra, qa, education, shared) | gh issue list; batch label updates | All Issues have area label | Open |
| 77 | P5 | Classify all open Issues by `severity:` label | gh issue list; filter unlabeled | All Issues have severity label | Open |
| 78 | P5 | Update Project board: confirm all Issues in correct column (Backlog/In Progress/In Review/Done) | Project board review | Board reflects actual state | Open |
| 79 | P5 | Update Integration Map DB (Notion 33acea3cd9e881888295e3ab98be3fc4): flag entries past review date | Notion fetch; identify stale entries | Stale entries flagged; updated or archived | Open |
| 80 | P5 | Archive stale Notion items: Parking Lot items > 30 days with no action | Notion Parking Lot fetch; items to LT for confirm | Stale items archived or converted to Issues | Open |
| 81 | P5 | Add pointer to `ops/` control plane files in CLAUDE.md File Map section | CLAUDE.md edit; posttool-write.sh PASS | CLAUDE.md references ops/ surface-map, dependency-map, verification-matrix, work-doctrine | Open |
| 81a | P5 (tooling) | **Gitea #37 — pilot Claude Design for TBM wireframe lane.** Global Memory mandates "wireframe before code" but the process is manual. Evaluate whether Claude Design (Opus 4.7) can formalize the wireframe lane for TBM education surfaces. Non-goal: production HTML (ES5 + Fire Stick rules that out). | Run pilot on 1 education surface rework; produce write-up | Pilot report: adopt / adapt / reject, with evidence | Open |
| 82 | P6 | Inventory all GAS scheduled triggers: function name, schedule, purpose, owner | GAS editor Triggers list + AuditTrigger.gs + CLAUDE.md GAS Triggers section | Complete trigger inventory document | Open |
| 83 | P6 | Classify each trigger: is this signal (actionable output) or theater (fires but output ignored)? | Opus model; check each trigger's actual output usage | Each trigger classified; theater triggers flagged for removal or repurpose | Open |
| 84 | P6 | Audit hygiene-filer.yml (HYG-06 version drift check): false positive rate over last 30 runs | gh workflow run list; count false positives | False positive rate documented; threshold decision made | Open |
| 85 | P6 | Audit all other HYG checks for false positive rate and signal quality | Same methodology as #84 | Each HYG check assessed; low-signal checks disabled or retuned | Open |
| 86 | P6 | Calibrate alert priority constants: verify every sendPush_ caller uses correct PUSHOVER_PRIORITY value | Grep all sendPush_ calls; compare to PUSHOVER_PRIORITY table in CLAUDE.md | All priorities correct; no bare integer args remain | Open |
| 87 | P6 | Verify Tiller freshness cron (HYG-09) fires correctly — check wrangler.toml cron schedule and execution log | wrangler.toml cron entry verified; CF Worker scheduled event log shows recent fire | HYG-09 fired within expected window | Open |
| 88 | P6 | Document automation health state: which automations are signal, which are theater, which are retired | Summary document or Notion page | Automation inventory document exists | Open |
| 88a | P6 (automation) | **Gitea #23 — rail watchdog redesign for Gitea.** `.github/workflows/rail-watchdog.yml` was deleted during the PORT wave (Batch 7) rather than ported — inline Python was too tightly coupled to GitHub's Actions API schema. Redesign fresh as a Gitea-native watchdog (rail list, heuristic, window, notification channel). Interim coverage from `hyg-08-dead-workflows` is acceptable; rail-watchdog catches intermittent-broken, not just silent. | Fresh spec written; implementation PRed | `.gitea/workflows/rail-watchdog.yml` + supporting script land on main with spec artifact | Open |
| 89 | P7 | Deploy without LT present — JT operates the system for one full day independently | JT can access ThePulse, Parent Hub, approve chores; LT not contacted | JT confirms 1-day independent operation [device-verified] | Open |
| 90 | P7 | JT completes end-to-end chore approval flow: child completes → JT approves → ring balance updates | Parent Hub approval recorded; KH_History row written; ring balance correct | JT device-verified | Open |
| 91 | P7 | JT accesses ThePulse on S25 without LT help: PIN entry, data loads, no undefined values | ThePulse 200 behind PIN; KPIs visible; JT can read the dashboard | JT device-verified | Open |
| 92 | P7 | Verify ambient displays self-recover after network interruption: TheSpine + TheSoul reconnect and refresh | Simulate network blip; observe 60s auto-refresh cycle; displays recover without reboot | Recovery observed on device | Open |
| 93 | P7 | Begin 4-day observation period: zero code changes to surfaces under observation | Observation start date logged; no PRs touching observed surfaces during window | Day 1 observation log entry created | Open |
| 94 | P7 | Verify zero interventions on day 4 of observation | Check ErrorLog, Pushover history, git log for the observation window | Clean 4-day log confirmed | Open |
| 104 | P7 (Codex addition) | Observation-period no-change rule: surfaces under observation must not receive any code changes; PRs that touch them require LT override during window | Work Doctrine updated; observation window is flagged in Issues | Rule documented; first observation cycle enforces it | Open |
| 95 | P7 | Declare "stable for unattended use" if all Blocks-Stable-Use items complete and 4-day observation clean | All P0, P1, P7, finance-stability P8 items Done; observation log clean | LT signs off: "stable for unattended use" | Open |
| 96 | P8 (finance-stability) | Verify DataEngine KPIs against manual calculation: pick one closed month; run getDataSafe and compare to LT's manual numbers | Logger output vs. LT's spreadsheet | KPI values match within rounding; any delta explained | Open |
| 97 | P8 (finance-stability) | Verify DataEngine Debt_Export parsing: all active debts present, balances correct, excluded debts correctly excluded | diagBalanceSheet() Logger output reviewed; compare to Debt_Export tab | Debt parsing verified correct | Open |
| 98 | P8 (finance-stability) | Run MER gates for month-end stability check: all MER gates evaluate without error | getMERGateStatusSafe returns gate statuses; no ErrorLog entries | MER gates PASS or findings filed | Open |
| 99 | P8 | Execute March close: stampCloseMonth, verify Close History row written | stampCloseMonthSafe executes; Logger confirms row; TheVein shows new close entry | March close entry visible in TheVein | Open |
| 100 | P8 | Verify March close history complete: all required months closed through March 2026 | Close History tab reviewed; all months through March 2026 present | Close history complete through March 2026 | Open |

---

## Execution Order

```
2026-04-21 rearrangement (post-migration, post-reconciliation):

BLOCKED pre-migration items (items 1-11 referenced GitHub PR #351 deploy):
  → Re-plan when picked up. Intent survives, gh/clasp chain changed.
  → Do NOT re-open PR #351; it lives in GitHub archive only.
  → The actual deploy-pipeline work now uses Gitea Actions
    (.gitea/workflows/deploy-and-notify.yml) — toolchain shift, same goal.

CURRENT HIGH-SIGNAL P0 (pull from here next, as of 2026-04-21 status sweep):
  ├── 22a (Gitea #26 KidsHub write-verify)     — In Progress (PR #51); fix: signoff pending
  ├── 23   (deploy freeze runtime test)        — code live, needs one device-verify run
  ├── 26   (truth-discipline retroactive sweep)— now unblocked (template merged via #50)
  ├── 27   (truth-discipline next-3-PR gate)   — rolling — counts adoption; #50/#51 are first 2
  └── 27a  (Gitea #25 CalendarSync hardcoded)  — canonical sheet violation, not acutely broken

THEN (P0 Play gates):
  P0 101, 102 MVSS → 12-16 (Play skills, Opus) → 34a (Gitea #34 letter-E audio as first finding)
  P0 17-20 (JT alerts + ops card)
  P0 103 + 21-24 (freeze + mutation inventory) — 103 already Done
  P0 105 fallback (Done)

THEN P1 binary sweep (items 28-50):
  Execute in surface-map.md order; items 34a (letter-E audio) folds into /sparkle findings.

THEN P2-P8 in priority order:
  P2 skill extensions (51-62c) — 58 absorbs Gitea #35 audio coverage audit
  P3 security (63-68)
  P4 drift/phantom (69-73)
  P5 architecture (74-81) + 81a (Gitea #37 Claude Design pilot)
  P6 automation (82-88) + 88a (Gitea #23 rail watchdog redesign)
  P7 operational stability (89-95 + 104)
  P8 finance stability + March close (96-100)
```

## Legend
- **[awaiting-device-verify]**: Done at code/deploy layer; requires LT or JT on real hardware to close
- **[verified-device]**: Closed only after device verification confirmed
- **Blocks Stable Use**: Item must be Done before "stable unattended use" can be declared
- **(derived from band description)**: Item detail inferred from plan band description — verify with mastermind before executing
- **Gitea #N prefix**: References open Gitea issue (canonical since 2026-04-19)
- **Bare #N (no prefix)**: References GitHub archive PR/issue. Do not re-open; re-plan if resuming the work.

## Infra work explicitly NOT in this backlog

These are tracked as separate Gitea issues because they are forge/infra, not TBM product stabilization:
- **Gitea #2** — Phase D auto-escalate INCONCLUSIVE Codex verdicts to deep-audit lane
- **Umbrella #7** (closed) — PORT wave, 17 PRs (completed 2026-04-21)
- **Phase C feature merges** — adapter-interface + cf-events-worker (completed 2026-04-21)

These infra items matter — they're the plumbing that makes the stabilization backlog movable — but they do NOT count against the 111 denominator here. Report their progress separately.
