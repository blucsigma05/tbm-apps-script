# TBM-HARDEN-Q14 v2 — GAS Modular Split (All Files)

**Owner:** Code (build), Codex (audit), LT (gate)
**Priority:** P1 (Hardening Sprint Zero)
**Status:** Spec Ready — Awaiting Gate 1 Approval
**Codex v1 Verdict:** HOLD (5 findings accepted, all patched below)

---

## Problem

Five GAS files exceed 1,500 lines. GAS runtime doesn't care, but every agent
in the pipeline (Code, Codex, Gemini CI) reads worse against large files:
context window pressure degrades edit accuracy, PR reviews produce noisier
feedback, and context compaction fires mid-task on files >3K lines.

### Files in Scope (clasp-deployed only)

| File | Lines | Functions | Domain |
|------|-------|-----------|--------|
| Kidshub.js | 3,899 | 85 | Kid chores, education, curriculum |
| Dataengine.js | 3,406 | 43 | Financial KPIs, debt, board data |
| Code.js | 1,941 | 80 | Router, API whitelist, Safe wrappers, cache, Notion bridge, reconciliation, ops health |
| GASHardening.js | 1,896 | 26 | Error/perf logging, diagnostics, system health, triggers |
| StoryFactory.js | 1,639 | 40 | Gemini story generation, PDF, Notion catalogue |

**Priority order:** Kidshub.js → Dataengine.js → Code.js → GASHardening.js → StoryFactory.js
(Biggest context pressure first.)

### Inventory Scope Rule (Codex P2 patch)
Only files uploaded by `clasp push` are in scope. Filter through `.claspignore`.
Excluded: `.github/`, `tests/`, `cloudflare-worker.js`, `uptime-worker.js`,
`generate-audio.js`, `playwright.config.js`, `node_modules/`, `*.md`.

---

## Baseline Duplicate Functions (Codex P1 patch)

These duplicates exist on `origin/main` today and must be cleaned up in a
**separate preflight PR** before any split work begins:

| Function | File A | File B | Resolution |
|----------|--------|--------|------------|
| `auditTriggers()` | AuditTrigger.js:1 | GASHardening.js:207 | Delete AuditTrigger.js (12 lines, entire file is the duplicate) |
| `seedStaarRlaSprintSafe()` | Code.js:973 | Kidshub.js:2685 | Delete from Kidshub.js (Code.js version calls `seedStaarRlaSprint()` correctly) |
| `testNotionConnection()` | Code.js:1653 | NotionBridge.js:497 | Delete from Code.js (belongs in NotionBridge) |

**Acceptance:** Preflight PR merges clean. Smoke test passes. No new duplicates.
This PR must merge before any Phase 2 work begins.

---

## Code.js Decomposition (Codex P2 patch)

Code.js is not just `servePage`. Full classification of all 1,941 lines:

| Concern | Lines | Functions | Target File |
|---------|-------|-----------|-------------|
| Cache layer | 24–195 | `getCachedPayload_`, `setCachedPayload_`, `bustCache`, `getCachedKHPayload_`, `setCachedKHPayload_`, `getKHLastModified` | `CacheService.js` (new, ~170 lines) |
| Router (doGet + servePage) | 197–277 | `doGet`, `servePage` | **Code.js** (stays) |
| API Router (doPost + serveData) | 280–520 | `doPost`, `serveData` (htmlSource proxy, API_WHITELIST, action branches) | **Code.js** (stays) |
| Finance Safe wrappers | 524–610 | `getDataSafe`, `getMonthsSafe`, `getSimulatorDataSafe`, `getWeeklyTrackerDataSafe`, `getCashFlowForecastSafe`, `getScriptUrlSafe` | `SafeFinance.js` (new, ~90 lines) |
| KidsHub Safe wrappers | 630–950 | All `kh*Safe` + `getKidsHubDataSafe`, `getKidsHubWidgetDataSafe`, `_khDiag_` | `SafeKidsHub.js` (new, ~320 lines) |
| Education/Story Safe wrappers | 952–1110 | `runStoryFactorySafe`, `seedWeek1CurriculumSafe`, `submitFeedbackSafe`, `logHomeworkCompletionSafe`, `logSparkleProgressSafe`, `awardRingsSafe` | `SafeEducation.js` (new, ~160 lines) |
| Monitor Safe wrappers | 611–628 | `runMERGatesSafe`, `stampCloseMonthSafe`, `updateFamilyNoteSafe` | `SafeMonitor.js` (new, ~20 lines) |
| Version/Test wrappers | 1112–1148 | `getKHLastModifiedSafe`, `getDeployedVersionsSafe`, `runTestsSafe` | `SafeSystem.js` (new, ~40 lines) |
| Board/Vault/Health | 1150–1436 | `getAppUrls`, `getBoardDataSafe`, `getMERGateStatus*`, `getAllVaultData`, `readVaultSheet`, `getVaultDataSafe`, `healthCheck` | `BoardVault.js` (new, ~290 lines) |
| Gate Alerting | 1440–1473 | `runDailyGateCheck`, `installDailyGateAlert`, `removeDailyGateAlert` | `GateAlerts.js` (new, ~35 lines) |
| Notion Bridge (QA + Pipeline) | 1479–1670 | `notionApi_`, `pushQAResult`, `pushPipelineEvent_`, `pipelineRelaySafe`, `normalizePipelinePayload_`, `isPipelineUrl_`, `pipelineStatusForType_` | Move to existing `NotionBridge.js` (~190 lines) |
| Reconciliation | 1673–1769 | `resolveNestedKey_`, `reconcileVeinPulse*`, `writeReconcileStatus_`, `getReconcileStatusSafe`, trigger functions | `Reconciliation.js` (new, ~100 lines) |
| Ops Health | 1770–1940 | `getOpsHealth_`, `getOpsHealthSafe` | `OpsHealth.js` (new, ~170 lines) |
| Utilities | 14–18 | `leftPad2_`, `getCodeVersion` | **Code.js** (stays) |

**⚠️ Known gap:** This table is a point-in-time snapshot and is not exhaustive.
Functions added after the initial audit (e.g. `getScriptUrl()`, `getStoryApiStatsSafe()`,
`updateMealPlanSafe()`, `getStoredStorySafe()`, `setupFeedbackSheet()`) are not listed.
**Gate 1 requirement:** regenerate the manifest from current source before approval.

**Result:** Code.js shrinks from 1,941 → ~310 lines (router + API dispatcher + utilities).

---

## Phase 0 — Preflight (separate PR)

1. Delete duplicate functions (see Baseline Duplicates table above).
2. Run `bash audit-source.sh` — must pass.
3. Run smoke test — must pass.
4. Merge preflight PR before any Phase 1/2 work.

## Phase 1 — Inventory & Plan (Code, no edits)

1. Run line counts on all clasp-deployed `.js` files.
2. For each file >1,500 lines, list every top-level function with:
   - Name, line range, one-line purpose, domain tag
3. Produce a **before/after function manifest**:
   - Function name | source file before | source file after | body hash
4. Post the manifest to Notion under Parking Lot.
5. **STOP. Do not move any code.**

## Gate 1 — LT + Codex Review

LT approves the layout. Codex reviews for:
- Missed functions
- Domain misclassification
- Circular dependency risk
- No new duplicates vs baseline manifest

**No moves happen until both pass.**

## Phase 2 — Execute (one file at a time)

For each new file in the approved plan:
1. Create new `.js` file with target functions (copy, not refactor).
2. Remove from origin file.
3. Run `bash audit-source.sh` — must pass.
4. Clasp push to **test deployment** (not production).
5. Run `?action=runTests` against test deployment URL — must return `overall: PASS`.
6. Commit with message: `refactor(Q14): move <functions> from <origin> to <target>`.
7. Push branch, open PR.
8. PR body includes **mechanical before/after manifest**:
   - Function name | source file before | source file after | body hash unchanged (Y/N)
9. Gemini CI must pass against test deployment.
10. Merge, then move to next file.

**Each PR contains exactly one logical move. No batching.**

### CI Gap Fix (Codex P1 patch)

Current CI hits `GAS_DEPLOY_URL?action=runTests` which tests the **deployed**
code, not the PR branch. For split PRs this is meaningless.

**Required before Phase 2:**
- Add a `GAS_TEST_DEPLOY_URL` secret pointing to a dedicated test deployment.
- **CI must deploy the current PR head** — the workflow itself runs `clasp push` +
  `clasp deploy -i <test-deployment-id>` using a service account credential, with
  `concurrency: group` serialization to prevent parallel deploys. A manually
  maintained test deployment can still point at old code or another branch.
- CI workflow runs tests against `GAS_TEST_DEPLOY_URL` for PRs on `harden-*` branches.
- Production deployment unchanged (only on merge to main).

## Phase 3 — Verify

1. `bash audit-source.sh` passes on final state.
2. `?action=runTests` returns `overall: PASS` on production.
3. All surfaces load and render unchanged (manual smoke walk).
4. `servePage` routes all dispatch correctly.
5. No function dropped, no function duplicated vs baseline manifest.
6. Active Versions DB updated.

## Acceptance Criteria

- Zero behavioral diff (smoke + manual surface walk).
- All files <1,500 lines.
- Code.js is router-only (~300 lines).
- No new duplicate functions (verified against frozen baseline manifest).
- Baseline duplicates resolved in preflight PR.
- Documented in Notion under Project Memory.

## Rollback

Each Phase 2 PR is independently revertable via git revert. No schema changes,
no data changes, nothing destructive.

## Non-Goals (do NOT let scope creep here)

- No refactoring inside functions.
- No renaming functions.
- No new tests beyond smoke.
- No ES5/ES6 changes.
- No comment cleanup.
- No changes to function signatures or return types.
