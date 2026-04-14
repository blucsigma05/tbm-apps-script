# F09 EPIC: Candidate GAS Architecture — PR Validation Lane

**Issue:** #263
**Status:** Draft
**Phase:** 4 — Rebuild Validation Lanes

---

## Summary

PR validation currently hits live production endpoints (`GAS_DEPLOY_URL?action=runTests`, `thompsonfams.com` for Playwright). This means CI proves production health, not candidate correctness. A bad production state fails unrelated PRs; a passing PR doesn't prove its own code works.

This spec defines a candidate validation lane: a separate Apps Script project backed by a non-prod spreadsheet, used exclusively for PR checks.

---

## Current State

### ci.yml
- Runs `curl $GAS_DEPLOY_URL?action=runTests` on every PR
- `GAS_DEPLOY_URL` points to production `/exec` endpoint
- Parses results via `parse_test_results.py`
- A production outage fails every open PR

### playwright-regression.yml
- PR runs target `https://thompsonfams.com` (production Cloudflare)
- Screenshots taken at production device viewports
- A CF outage or bad deploy blocks all PR checks

### No candidate/staging concept exists today
- One GAS project, one spreadsheet, one deployment
- No way to test candidate code without deploying to production

---

## Proposed Architecture

### Two-project model

| Component | Production | Candidate |
|---|---|---|
| Apps Script project | existing (SSID: `1_jn-I4I...`) | new project (separate script ID) |
| Spreadsheet | TBM production workbook | clone with seed data |
| Deployment URL | `GAS_DEPLOY_URL` | `CANDIDATE_GAS_DEPLOY_URL` |
| Cloudflare | `thompsonfams.com` | `staging.thompsonfams.com` or localhost proxy |
| Updated by | `clasp push` from main | `clasp push` from PR branch (CI step) |

### Data shape sync

The candidate spreadsheet must have the same tab names, column headers, and TAB_MAP-resolvable structure as production. It does NOT need real financial data — it needs structurally valid seed data.

**Approach:** Create a `seedCandidateData_()` function that:
1. Creates all TAB_MAP tabs with correct headers
2. Populates with deterministic fixture rows (known amounts, dates, categories)
3. Runs once during candidate project setup, re-runnable for reset

This reuses the golden-month fixture concept from the regression suite — the same seed data that proves math correctness also populates the candidate workbook.

### Fixture seeding strategy

| Sheet | Seed approach |
|---|---|
| Transactions | 20-30 rows covering each category type, known amounts |
| Balance History | 1 row per account, known balances |
| Categories | Copy from production (Tiller-managed, stable) |
| Budget_Data | Copy from production |
| Debt_Export | 5-6 representative debt accounts |
| DebtModel | Matching debt accounts |
| Close History | 1-2 closed months with known values |
| KH_* tabs | Minimal seed from existing `seedKHHistory_()` pattern |

### Property configuration

The candidate project needs its own Script Properties:
- `SSID` → candidate spreadsheet ID
- `SNAPSHOT_FOLDER_ID` → candidate Drive folder (or skip snapshots)
- `NOTION_TOKEN` / `NOTION_HEALTH_DB` → skip or use test DB
- `PUSHOVER_*` → skip (no alerts from candidate)

**Key constraint:** The candidate project shares the same codebase (same `.gs` files) but different Script Properties. `SSID` is read from properties, not hardcoded, so this works naturally.

---

## CI Integration

### PR workflow (ci.yml changes)

```
1. clasp push to candidate project (using candidate .clasp.json)
2. clasp deploy -i CANDIDATE_DEPLOY_ID
3. curl CANDIDATE_GAS_DEPLOY_URL?action=runTests
4. Parse results (same parse_test_results.py)
```

### Playwright PR workflow

**Option A (simpler):** Point Playwright at candidate `/exec?page=X` URLs directly (no CF proxy). GAS web app serves HTML without CF.

**Option B (full fidelity):** Stand up a staging CF worker that proxies to candidate GAS. More accurate but more infrastructure.

Recommendation: **Option A** for Phase 1. CF proxy testing stays on post-deploy production checks.

### Post-deploy workflow (unchanged)

Production checks (`GAS_DEPLOY_URL`, `thompsonfams.com`) remain as post-deploy verification. These prove the deploy worked, not that the PR is correct.

---

## Open Questions

### Q1: How does `clasp push` target the candidate project from CI?
`clasp` uses `.clasp.json` for project ID. CI would need a second `.clasp.json` (e.g., `.clasp.candidate.json`) and swap it before push. Or use `clasp --project` flag if available.

### Q2: Does the candidate project need its own GAS triggers?
No. Triggers (daily reset, health checks) are production-only. The candidate project only runs on-demand via CI.

### Q3: How often does the candidate spreadsheet need refreshing?
Only when production schema changes (new tabs, renamed columns). A `seedCandidateData_()` function handles this. Could be triggered manually or as a CI step.

### Q4: Secret management for candidate URLs?
Add `CANDIDATE_GAS_DEPLOY_URL` and `CANDIDATE_CLASP_TOKEN` as GitHub secrets. The candidate project's Script ID goes in `.clasp.candidate.json` (committed, not secret — it's a separate project).

---

## Implementation Plan (sub-PRs)

1. **Create candidate project + spreadsheet** — manual GAS console setup, document IDs in CLAUDE.md
2. **`seedCandidateData_()`** — function to populate candidate workbook with fixture data
3. **`.clasp.candidate.json`** + CI clasp push step — push PR code to candidate before testing
4. **`ci.yml` update** — use `CANDIDATE_GAS_DEPLOY_URL` for PR runs
5. **`playwright-regression.yml` update** — point PR runs at candidate `/exec` URLs
6. **Consolidate WARN policy** — single pass/warn/fail standard across both lanes

## Build Skills
- `deploy-pipeline` — full build pipeline, clasp push patterns
- `thompson-engineer` — GAS architecture, Script Properties, TAB_MAP
- `data-contracts` — sheet schemas for seed data
