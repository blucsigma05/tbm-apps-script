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

| Category | Score | Why |
|---|---:|---|
| Architecture Fit | 8.0 | Real platform structure: shared backend, CF routing, multi-surface system. No `getActiveSpreadsheet()` violations in active code. |
| Automation Maturity | 7.0 | Playwright, smoke habits, codex review. All 145 google.script.run chains have withFailureHandler(). audit-source.sh now includes automated wiring gate. |
| Monitoring / Observability | 6.5 | ErrorLog, PerfLog, `withMonitor_()`, version collectors. Gap: no single live ops scorecard. |
| Data Integrity Controls | 6.0 | Strong wrapper discipline. Gap: some education save paths and reward/completion semantics still drift. |
| Sustainability / Maintainability | 6.0 | Growing fast. Gap: 5 undocumented CF routes, CLAUDE.md route table out of date. |
| Security / Secrets Hygiene | 7.0 | No secrets in source. Credentials via Script Properties. `.clasp.json` contains only public identifiers. Upgraded from 6.0 after verified clean. |
| Optimization / Performance Discipline | 5.5 | Improving (Sparkle lazy audio, predictive preload). Gap: heavy animated backgrounds (7-13 layer SVG) on kid tablets need perf guardrails. |
| Documentation Truthfulness | 5.5 | Better after audit. Gap: Notion, GitHub, and runtime still diverge. Route table missing 13 paths. |

### Weighted Read

- Overall maturity: `6.5 / 10`
- Operating verdict: `Strong real platform with meaningful process, approaching controlled system`

### 10/10 Definition

TBM reaches `10/10` when:
- every live route has a tested contract
- every `google.script.run` call has a `withFailureHandler()`
- every critical module has a real end-to-end verification path
- the household ops state is visible in one scorecard
- docs and runtime agree closely enough to trust without cross-checking
- deploys are gated by current, not historical, assumptions
- CLAUDE.md route table matches cloudflare-worker.js exactly

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
| Files with handler gaps | 0 | All 20 HTML files compliant |
| Code.gs version | 67 | Consistent across header/getter/EOF |
| Smoke test categories | 9 | 6 runtime + 3 source-level |
| Regression test assertions | 15+ | BUG, ENV, PERF categories |
| audit-source.sh checks | 4 | ES5, versions, getActiveSpreadsheet, eval |
| audit-source.sh checks | 5 | ES5, versions, getActiveSpreadsheet, eval, failure handler wiring |
| Missing audit checks | 1 | TAB_MAP hardcoding |

---

## 90-Day Targets

| Category | Current | 90-Day Target |
|---|---:|---:|
| Architecture Fit | 8.0 | 9.0 |
| Automation Maturity | 6.5 | 8.0 |
| Monitoring / Observability | 6.5 | 8.5 |
| Data Integrity Controls | 6.0 | 8.0 |
| Sustainability / Maintainability | 6.0 | 8.0 |
| Security / Secrets Hygiene | 7.0 | 8.5 |
| Optimization / Performance Discipline | 5.5 | 7.5 |
| Documentation Truthfulness | 5.5 | 8.5 |

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
