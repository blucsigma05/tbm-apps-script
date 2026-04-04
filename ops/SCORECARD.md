# TBM System Scorecard

Date: April 3, 2026
Anchor: `fadf8fd` (current `main`)
Purpose: Plain-English operating scorecard for repo quality, sustainability, and deploy readiness.
Rule: `10/10` does not mean "perfect" or "zero bugs." It means the system is well-controlled, observable, testable, and safe to evolve.

## How To Use This

Score each category from `1` to `10`.

- `1-3`: fragile / ad hoc / largely ungoverned
- `4-5`: works, but major blind spots
- `6-7`: solid and usable, but still missing discipline
- `8-9`: strong operating system with a few known gaps
- `10`: production-grade control plane, clear contracts, mature operations

Recommended cadence:

- Before major deploys: quick review of the scorecard
- Weekly (Friday): update changes in scores
- Monthly: review roadmap progress and re-score

---

## Category Definitions

### 1. Architecture Fit
Does the codebase match the intended system design?

`10/10` means:
- boundaries between frontend/backend/data layers are clear
- routes and surfaces map cleanly to their backing logic
- shared utilities are truly shared
- there is minimal duplicate or conflicting logic

### 2. Automation Maturity
How much of quality control is enforced automatically?

`10/10` means:
- smoke tests run before deploy
- regression tests cover known failure modes
- UI smoke/visual checks exist where needed
- PR review and release checks are part of workflow, not memory

### 3. Monitoring / Observability
Can you tell what is healthy, broken, slow, stale, or drifting?

`10/10` means:
- logs exist for critical workflows
- slow/erroring functions are visible
- system health is summarized in one place
- failures are easy to locate by module and time

### 4. Data Integrity Controls
How protected is the data from corruption, silent loss, or misleading writes?

`10/10` means:
- critical syncs use staging or rollback patterns
- state-changing flows are explicit and auditable
- UI messages match actual backend state
- save paths are consistent and validated

### 5. Sustainability / Maintainability
How easy is the system to safely extend six months from now?

`10/10` means:
- naming and contracts are consistent
- versioning discipline is real
- docs match the current runtime
- new work naturally plugs into existing patterns

### 6. Security / Secrets Hygiene
How safe is the repo from accidental exposure or unsafe access patterns?

`10/10` means:
- no secrets in source
- credentials live in proper secret/property stores only
- setup functions never normalize unsafe secret handling

### 7. Optimization / Performance Discipline
How intentionally does the code handle speed, device limits, and cost?

`10/10` means:
- batching beats row-by-row writes
- routes and surfaces avoid unnecessary work
- heavier visuals have guardrails
- comments about performance are backed by real code

### 8. Documentation Truthfulness
Do docs, audits, handoffs, and tests describe the system that actually exists?

`10/10` means:
- current docs match current runtime
- deploy notes map to code reality
- stale pages are marked or archived
- the operating manual can be trusted

---

## Current Scorecard

Repo: `blucsigma05/tbm-apps-script`
Current head: `fadf8fd`

| Category | Score | Why | Path to 10 |
|---|---:|---|---|
| Architecture Fit | 7.5 | Real platform. Clean backend/frontend boundaries. CF routing. Zero getActiveSpreadsheet() violations. **Deductions:** Duplicate Sparkle Kingdom background (KidsHub.html + SparkleLearning.html = two independent 13-layer copies). Default route was regressed then restored (fragile). No shared component extraction pattern for cross-surface visuals. | Extract shared visual components into include-able partials or builder functions in one place. Establish a "shared visual registry" so cross-surface elements have one source. Add a default-route contract test. |
| Automation Maturity | 7.0 | Playwright, codex review, audit-source.sh (5 gates). All 145 call chains have withFailureHandler(). **Deductions:** Smoke/regression tests don't cover real E2E business flows (kid completes task → parent reviews → reward awarded). No automated contract tests for server payload shapes. Categories 6-8 in smoke test are NOT_VERIFIED (source-level only). Soft passes still count as green. | Add E2E contract tests for critical flows (education submit → review → award). Convert soft passes to real pass/skip/fail. Automate categories 6-8 or replace with static analysis. Add Playwright coverage for all primary routes (not just screenshots). |
| Monitoring / Observability | 6.0 | ErrorLog, PerfLog, withMonitor_(), version collectors exist. **Deductions:** No single ops health endpoint. No alerting when education modules silently fall to fallback. No dashboard showing "is the family system healthy right now." PerfLog data exists but isn't surfaced anywhere actionable. No heartbeat monitoring for ambient displays (Soul/Spine). | Build `?action=opsHealth` endpoint returning system-wide status JSON. Add fallback-detection alerting (kid in degraded mode = push notification). Surface PerfLog data in ops scorecard. Add Soul/Spine heartbeat or content-ready signals. |
| Data Integrity Controls | 5.5 | Strong wrapper discipline on write paths. **Deductions:** Clear-task modal offers full/half/no-points but server ignores the choice (UI lies). Education completion semantics inconsistent across modules (fallback vs real vs reward). No staging/validation pattern for curriculum seed operations. Parent education review flow not E2E verified. `expectedTaskID` not passed through override path. | Fix clear-task scoring to honor UI choice. Standardize education completion contract (one interface: fallback/real/reward/submission). Add seed validation. E2E test the parent review flow. Pass expectedTaskID through the full chain. |
| Sustainability / Maintainability | 6.0 | Version discipline works (3-location, automated check). TAB_MAP pattern enforced. **Deductions:** Duplicate Sparkle Kingdom implementations will drift independently. Notion and GitHub runtime descriptions diverge. New modules get added without updating version collector, smoke coverage, or route docs. No "new module onboarding" gate that catches all these. | Consolidate Sparkle Kingdom to one implementation. Create a "new module checklist" gate that blocks merge if version collector/smoke/route docs aren't updated. Establish Notion as memory-only (not runtime truth). Archive stale Notion pages. |
| Security / Secrets Hygiene | 6.5 | Zero secrets in source (verified). Credentials via Script Properties. **Deductions:** No .gitignore file — any accidental file drop (node_modules, .env, credential export) goes straight to Git. No pre-commit hook blocking secret patterns. clasp.json tracks script ID (safe but no policy doc explaining why). No dependency audit (phrases.json references ElevenLabs voice IDs — not secrets, but no classification standard). | Add .gitignore (node_modules, .env*, credentials*, *.pem, local overrides). Add pre-commit secret scan (grep for API key patterns, bearer tokens, base64 blocks). Document the "what is a secret vs what is a public identifier" classification. |
| Optimization / Performance Discipline | 5.0 | Sparkle lazy audio and predictive preload are genuinely good. **Deductions:** 7-13 layer SVG backgrounds with 100+ animated elements running on Galaxy A9 tablets and Fire Sticks (low-end hardware). No reduced-motion path. No device-tier detection. No frame budget measurement. No performance regression gate. Soul/Spine screenshots fire before content loads (no content-ready signal). Comments about caching in some modules not backed by actual cache code. | Add device-tier detection (reduce particle count on low-end). Measure frame rate on target devices. Add content-ready signals for screenshot automation. Audit caching comments vs actual cache implementation. Add a performance budget gate (e.g., first contentful paint < X seconds on A9). |
| Documentation Truthfulness | 6.0 | CLAUDE.md route table now matches CF worker (fixed this session). ops/ framework creates a living truth system. **Deductions:** Notion deploy pages stopped being updated around v23-30. Architecture page still describes the pre-education-platform system. Multiple QA round pages contain findings that are now stale against current code. No process for marking Notion pages as "historical" vs "current." PM Operator Console "Last Session" field is a wall of text that's hard to parse. | Archive or stamp stale Notion pages. Create a "current vs historical" tagging system in Notion. Simplify PM Operator Console to structured fields, not prose. Ensure every deploy updates the PM page. Make ops/DRIFT-LEDGER.md the single feature truth table and reference it from Notion. |

### Weighted Read

- Overall maturity: `6.2 / 10`
- Operating verdict: `Real platform with real process, but control gaps in data integrity, observability, and performance discipline keep it from production-grade`

### 10/10 Definition

TBM reaches `10/10` when:
- every live route has a tested contract (not just "loads," but "returns correct shape")
- every critical business flow has an E2E verification path (kid → parent → reward)
- the household ops state is visible in one endpoint call
- education modules share one completion contract (fallback/real/reward/submission)
- UI never promises an outcome the backend doesn't honor
- docs and runtime agree closely enough to trust without cross-checking
- new modules cannot merge without passing the onboarding gate
- performance is measured on target devices, not assumed
- Notion is explicitly memory/history, GitHub is explicitly runtime truth
- a .gitignore and secret scan prevent accidental exposure

---

## Quantitative Baseline (April 3, 2026)

| Metric | Count | Notes |
|--------|-------|-------|
| .js server files | 21 | Code, routers, engines, tests, utilities |
| .html surface files | 21 | Dashboards, education, kids, utilities |
| CF worker routes | 35 | Includes variants and API endpoints |
| CLAUDE.md documented routes | 22 | Missing 13 (vault, power-scan, variants, APIs) |
| google.script.run chains | 145 | Verified by semantic analysis (grep overcounts) |
| withFailureHandler calls | 145 | 100% coverage — zero gaps |
| .gitignore | missing | No protection against accidental file tracking |
| Code.gs version | 67 | Consistent across header/getter/EOF |
| Smoke test categories | 9 | 6 runtime + 3 source-level |
| Regression test assertions | 15+ | BUG, ENV, PERF categories |
| audit-source.sh checks | 4 | ES5, versions, getActiveSpreadsheet, eval |
| audit-source.sh checks | 5 | ES5, versions, getActiveSpreadsheet, eval, failure handler wiring |
| Missing audit checks | 1 | TAB_MAP hardcoding |

---

## 90-Day Targets

| Category | Current | 90-Day Target | What gets you there |
|---|---:|---:|---|
| Architecture Fit | 7.5 | 9.0 | Consolidate Sparkle Kingdom to one source. Default route contract test. Shared visual registry. |
| Automation Maturity | 7.0 | 8.5 | E2E contract tests for education flow. Convert soft passes. Automate remaining smoke categories. |
| Monitoring / Observability | 6.0 | 8.0 | `?action=opsHealth` endpoint. Fallback-detection alerting. PerfLog surfaced. Soul/Spine heartbeat. |
| Data Integrity Controls | 5.5 | 8.0 | Fix clear-task scoring. Standardize education completion contract. E2E parent review. Seed validation. |
| Sustainability / Maintainability | 6.0 | 8.0 | New module onboarding gate. Notion archive pass. Consolidate duplicates. |
| Security / Secrets Hygiene | 6.5 | 9.0 | .gitignore. Pre-commit secret scan. Classification doc for IDs vs secrets. |
| Optimization / Performance Discipline | 5.0 | 7.5 | Device-tier detection. Frame rate measurement on A9. Content-ready signals. Audit caching claims. |
| Documentation Truthfulness | 6.0 | 8.5 | Archive stale Notion pages. Current/historical tagging. Simplify PM Operator Console. Drift ledger weekly. |

---

## Weekly Update Template

Copy and refresh this section every Friday:

```text
Week ending:
Current head:
Overall system status:

Architecture Fit:
Automation Maturity:
Monitoring / Observability:
Data Integrity Controls:
Sustainability / Maintainability:
Security / Secrets Hygiene:
Optimization / Performance Discipline:
Documentation Truthfulness:

What improved:
What regressed:
What still feels uncertain:
Top priority next week:
```
