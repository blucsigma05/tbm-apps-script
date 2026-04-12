# TBM Production-Readiness Process v1

> Every change that reaches GAS must be correct, contractually sound,
> honestly reported, and user-ready. This document defines how.

---

## 0. Canonical Rules

- Canonical repo: `C:\Dev\tbm-apps-script`.
- Repo-local skills: `.claude/skills/`.
- Every audit starts by reading `CLAUDE.md`.
- Every review is against current `head` or current `main`, never stale summaries.
- GitHub labels, unresolved threads, and red checks are leads to verify, not truth.
- A lane is only allowed to be red if it is red for a real reason.
- A lane is only allowed to be green if it is green for a real reason.
- Production-readiness = code correctness + contract correctness + deploy correctness + user correctness, all at once.

---

## 1. Intake (Phase 0)

Before writing code:

- [ ] Define exact scope: user-visible behavior, persistence contract, route/query contract, workflow/CI contract, rollback shape.
- [ ] Name the golden journey that must survive the change.
- [ ] Identify touched risk surfaces: workflow, persistence, routing, fixtures, StoryFactory, UI, Notion, Drive, tests.

---

## 2. Skill Loading (Phase 1)

Always load the matching repo-local skill before trusting memory.

| Skill | Use when |
|-------|----------|
| `tbm-pr-audit` | PRs and merge readiness |
| `tbm-review-reconciliation` | Stale thread/finding truth |
| `tbm-pipeline-audit` | Workflows, reruns, labels, releases, notifications |
| `tbm-playwright-triage` | Playwright failures and user-flow drift |
| `tbm-storyfactory-audit` | Queue/state-machine/retry/recovery |
| `tbm-fixture-contract-audit` | UI/fixture/shim drift |
| `tbm-notion-persistence-audit` | Notion schema/write/retry/cleanup |
| `tbm-education-audit` | Child-facing education surfaces |

---

## 3. Implementation Discipline (Phase 2)

- Read adjacent call sites, not just the diff.
- Verify every referenced function name, field name, route param, and property name from source.
- For UI changes: verify actual interaction truth, not assumed UX.
- For workflow changes: trace trigger, rerun, stale-state, failure, notification, and artifact paths.
- For persistence changes: trace create, read, retry, reread, cleanup, and failure recovery.
- For every new `google.script.run` call: verify server function, safe wrapper, smoke coverage, and fixture coverage.
- For every route/query change: verify what the browser URL actually contains.
- For every "warning" state: decide advisory vs blocking and enforce honestly.

---

## 4. Local Checks Before PR (Phase 3)

- [ ] `bash audit-source.sh` passes
- [ ] Touched-surface verification script or smoke check passes
- [ ] Focused tests for the changed area pass (not just broad suite theater)
- [ ] Tests reconciled to real product behavior
- [ ] Fixtures reconciled to real page behavior
- [ ] Changed region re-read after edits
- [ ] Versions and deploy metadata coherent
- [ ] No silent no-op paths introduced

---

## 5. PR Readiness Standard (Phase 4)

A PR is not "ready" because it looks small. It is ready only when the
changed surface and its adjacent contracts were audited.

**Required evidence for any finding:**
- Tight file and line range
- Exact job/step if workflow-related
- Exact log or artifact proof if CI-related
- Exact contract mismatch if fixture/routing/persistence-related

**Required classifications:**
- `active` | `stale-to-code` | `stale-to-ci` | `non-finding` | `open-question`

No stale finding may be restated as active without re-proof on current head.

**Merge status must be one of:**
- `code-ready` | `waiting on CI/approval` | `fix-needed`
- With explicit evidence, not vibe.

---

## 6. Pre-Merge Gates (Phase 5)

| Gate | What |
|------|------|
| A | Source + contract audit passed |
| B | Tests reflect real current behavior |
| C | Workflows tell the truth |
| D | Golden journey for touched surface explicitly verified |
| E | High-value visual sanity verified for changed screens |
| F | CI is trustworthy, not merely green |
| G | No chronic-red lane is being ignored |
| H | Release/deploy metadata points at intended SHA |

---

## 7. Golden Journeys

These stay small, stable, and sacred. Each must have Playwright coverage.

| Journey | Surfaces | Key assertions | Playwright status |
|---------|----------|---------------|-------------------|
| Homework completion | HomeworkModule | MC + open-ended submit, brain break, Monday Error Journal, Friday Reflection | **Covered** (education-workflows.spec.js) |
| JJ Sparkle completion | SparkleLearning | Activity load, progress save/load, star award | Partial (load + basic nav only) |
| Daily Missions routing | daily-missions | Buggsy default, JJ `?child=jj` theme, launch links | **Covered** (education-workflows.spec.js) |
| StoryFactory queue | Notion + Drive | Idea -> Written -> Illustrated -> Ready, no starvation, backoff works | **Not covered** (server-side only, no browser test) |
| Parent review | KidsHub parent | Pending review appears, approval persists, no early corruption | **Not covered** (needs E2E test) |
| Finance surfaces | ThePulse, TheVein | PIN gate, data loads | Partial (route/load checks, no data validation) |

---

## 8. Playwright Standard

- Playwright is for user truth, not coverage count.
- Each test maps to a real user journey.
- Tests match actual interaction model: click, lock-in, submit, reload, resume, overlay dismissal, query params.
- Fixtures match exact function names and payload shapes the page actually calls.
- Screenshots on a curated set of critical screens only.
- Traces, screenshots, and parsed results preserved automatically on failure.
- A failing Playwright assertion is not a product bug until reconciled against real page behavior.

---

## 9. Workflow and CI Standard

- Separate pre-deploy validation from post-deploy verification.
- Never claim "blocked" if production already changed.
- Never treat advisory WARN as blocking unless the contract says it is blocking.
- Every deploy run preserves: SHA, GAS version, deployment ID, run URL, smoke outcome, category breakdown.
- Every red lane must be one of: real blocker, advisory-but-labeled, stale-and-being-fixed.

---

## 10. `main` Branch Standard

- `main` needs its own truth lane, not only PR truth.
- **Target state:** Post-merge or nightly golden-path Playwright pack on main. _(Not yet implemented — current Playwright workflow triggers on `pull_request` and `workflow_dispatch` only.)_
- Audit recent merges by risk, not by volume.
- Verify current main against: live CI state, latest merges, touched workflows, touched persistence, touched fixtures, touched UI.
- Reclassify chronic-red lanes so they stop poisoning trust.

---

## 11. Post-Deploy Standard

- Verify deployed route behavior against the actual deployed artifact.
- Capture smoke response body and parsed summary as artifacts.
- Preserve any failure evidence automatically.
- Confirm live state matches what notifications and release proof claim.
- If deploy succeeded but verification failed, say exactly that.
- If deploy did not happen, say exactly that.

---

## 12. StoryFactory-Specific Standard

Audit as a state machine, never as isolated helpers.

- [ ] Claim recovery works
- [ ] Retry safety verified
- [ ] Queue fairness verified (no head-of-line starvation)
- [ ] Global breakers don't punish unrelated healthy work
- [ ] Notion property shape and Drive URL contract verified
- [ ] Successful terminal paths leave no accidental residue

---

## 13. QA Operator Mode Standard

**What's built today:**
- QA workbook exists (separate from production data).
- `TBM_ENV=qa` gates all QA operations (currently requires manual Script Property toggle).
- Snapshot/restore saves and restores tab-level data via Script Properties (with sheet fallback for large payloads). Does not capture formulas, formatting, or cross-sheet references.
- Clock override (`qaSetClockSafe`) enables day-dependent testing.
- 5 pre-built scenarios: Fresh Morning, Pending Approvals, All Clear, Week Rollover, Education Pending Review.
- Persistence test suite validates chore, approval, dinner, education, and reset flows.

**Target state (not yet implemented):**
- Automated QA route switching via `/qa/*` URL namespace (PIN-gated, no manual toggle). Requires: signed QA token, QA-aware API shim, env-scoped CacheService keys, prefix-preserving navigation.
- Per-child persona simulation with automated journey orchestration.
- Scenario library expanded to cover concurrent access and failure recovery.
- Full A-to-Z user journey testing without touching production data.

---

## 14. Non-Negotiable Failure Policy

1. No silent no-ops.
2. No false green.
3. No false red.
4. No stale finding presented as active.
5. No human recovery step documented unless it actually retriggers the right behavior.
6. No deploy message may misdescribe live state.
7. No queue may let one poison row block all others.
8. No fixture may drift from product code without being treated as a blocker.

---

## 15. Definition of Done

A change is production-ready only when:

- The code does the right thing.
- The tests check the right thing.
- The fixtures model the right thing.
- The workflow reports the right thing.
- The deploy points at the right thing.
- The live app behaves the right way.
- The user experience still feels intentional, stable, and production-ready.
