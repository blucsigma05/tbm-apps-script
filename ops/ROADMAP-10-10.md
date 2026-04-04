# TBM 10/10 Roadmap

Date: April 3, 2026
Goal: Move TBM toward production-grade operating maturity.
Definition: `10/10` means controlled, observable, sustainable, and safe to evolve.

---

## North Star

- one stable contract per live surface
- one truthful source of runtime documentation
- one deploy gate that reflects current reality
- one scorecard that shows whether the system is healthy

---

## Phase 1 — Stop The Biggest Risk

Priority: `P0`

### 1.1 Fix failure handler gap (Automation +1.0)

45 of 190 `google.script.run` calls lack `withFailureHandler()`. This is a Tier 1 CLAUDE.md violation.

Files with 3+ missing handlers:
- fact-sprint.html (6 missing)
- SparkleLearning.html (6 missing)
- daily-missions.html (5 missing)
- writing-module.html (5 missing)
- investigation-module.html (5 missing)
- reading-module.html (3 missing)
- HomeworkModule.html (3 missing)
- WolfkidCER.html (3 missing)

Outcome: every `google.script.run` call has a paired `withFailureHandler()`.

### 1.2 Extend audit-source.sh (Automation +0.5)

Add failure handler wiring check to audit-source.sh so this class of bug is caught before push.

Outcome: `bash audit-source.sh` fails if any HTML file has unmatched `google.script.run` calls.

### 1.3 Update CLAUDE.md route table (Documentation +1.0)

Current table has 22 routes. cloudflare-worker.js has 35 paths. Add:
- `/vault` (planned, not yet built)
- `/power-scan` (live education surface)
- `/sparkle-free` (free-play mode variant)
- `/daily-adventures` (JJ alias for daily-missions)
- `/api` and `/api/verify-pin` (API proxy endpoints)

Outcome: CLAUDE.md route table matches cloudflare-worker.js exactly.

### 1.4 Standardize education completion semantics (Data Integrity +1.0)

Every education completion path must clearly distinguish:
- fallback/practice (not counted)
- real completion (counted, logged)
- reward awarded (backend confirmed)
- submission logged (parent-reviewable)

Outcome: consistent contract across all education modules.

### 1.5 Add route-level truth checks (Monitoring +1.0)

Every surfaced page needs:
- route exists (CF worker)
- backing file exists (.html)
- load smoke exists (Playwright or ?action=runTests)

Outcome: one backend function returns route health for all 35 paths.

---

## Phase 2 — Build The Control Plane

### 2.1 Create ops scorecard backend endpoint

Returns:
- deployed versions (all modules)
- stale modules (version collector gaps)
- last sync/seed timestamp
- recent error count by module
- slowest recent functions
- active warnings

### 2.2 Create release checklist gate for every new surface

Required before merge:
- route registered in CF worker
- Safe wrapper exists in Code.gs
- response shape documented
- smoke check added
- version collector updated
- monitoring/logging decision made

### 2.3 Track documentation truthfulness actively

Required:
- runtime-canon page maintained in GitHub (this ops/ directory)
- stale Notion pages marked as historical
- deploy notes linked to actual commit/PR

---

## Phase 3 — Raise Automation Maturity

### 3.1 Expand Playwright coverage

Add stable tests for:
- loading screen dismiss (all boards)
- major route loads (all 12+ primary routes)
- kid board clickability (safe mode)
- one parent dashboard review action (safe mode)
- screenshot capture with late-load waiters for Soul/Spine

### 3.2 Convert soft passes to real pass/skip/fail

No more tests that log uncertainty and count as green.

### 3.3 Add curated P0 regression suite

Only true must-not-break items. Current suite has 15+ BUG/ENV/PERF assertions — verify each is still load-bearing.

---

## Phase 4 — Improve Sustainability

### 4.1 Consolidate runtime canon

- GitHub = runtime truth
- Notion = architecture memory, QA, handoffs, decision logs
- ops/ directory = operating framework

### 4.2 Feature drift ledger update cadence

Weekly or per deploy:
- shipped
- still live
- partially live
- regressed
- lost
- undocumented

### 4.3 Normalize module quality gates

Every education module shares:
- fallback handling standard
- validation standard
- completion/reward standard
- failure handler standard

---

## Phase 5 — Optimization And Cost Control

### 5.1 Performance guardrails for animated backgrounds

PRs #37/#38 added 7-13 layer SVG backgrounds with 100+ animated elements. Kid tablets (Galaxy A9, Fire Stick) need:
- animation frame budget checks
- reduced particle counts on low-end devices
- CSS `will-change` discipline

### 5.2 Page-specific load waiters for screenshot automation

Soul/Spine screenshots fire too early. Add explicit content-ready signals.

### 5.3 Identify high-cost server calls

Log duration outliers to one view. Current `withMonitor_()` captures this — surface it in ops scorecard.

---

## 10/10 Milestones

TBM must achieve ALL of these:
- [ ] all google.script.run calls have withFailureHandler()
- [ ] audit-source.sh checks failure handler wiring
- [ ] CLAUDE.md route table matches CF worker exactly
- [ ] all live core routes smoke-tested
- [ ] one unified ops scorecard exists
- [ ] documentation drift actively managed
- [ ] major education flows have consistent completion semantics
- [ ] screenshot + review workflow is stable and repeatable
- [ ] feature drift ledger is maintained weekly
- [ ] no module save path implies success the backend doesn't guarantee

---

## What 10/10 Does Not Mean

- no bugs ever
- no manual testing ever
- no design changes
- no velocity tradeoffs

It means:
- breakage gets caught faster
- system state is easier to trust
- changes compound instead of creating confusion
- TBM becomes manageable like a real operating system, not just a pile of code
