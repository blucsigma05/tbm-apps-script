# F12 EPIC: Staged-Write Pattern + Data Recovery

**Issue:** #266
**Status:** Draft
**Phase:** 5 — Recovery for Code and Data

---

## Summary

Code rollback and data rollback are different. A bad deploy can write corrupt rows to the live spreadsheet. Rolling back the code doesn't repair already-written data. This spec defines a staged-write pattern (prevention) and a per-table recovery runbook (response).

---

## Current State

### Write paths in the codebase

Production writes go directly to live tabs via `setValue`, `setValues`, `appendRow`:

| Function | File | Tab(s) written | Risk |
|---|---|---|---|
| `stampCloseMonth()` | MonitorEngine.js | Close History | Medium — writes debt + status to specific row |
| `khCompleteTask()` + related | KidsHub.js | KH_Chores, KH_History | High — multiple tabs in sequence, no atomicity |
| `khRedeemReward()` | KidsHub.js | KH_Redemptions, KH_Allowance | Medium — balance mutation |
| `saveComicDraft_()` | KidsHub.js | Drive (not sheets) | Low — file-based, trashable |
| `logError_()` | GASHardening.js | ErrorLog | Low — append-only |
| `logPerf_()` | GASHardening.js | PerfLog | Low — append-only |
| `refreshCascadeTabs()` | CascadeEngine.js | Cascade Proof, Month-by-Month, Payoff Schedule | Medium — full tab rewrite |
| `depositScreenTime_()` | KidsHub.js | KH_ScreenTime | Low — single append |
| `resetDailyTasksAuto()` | KidsHub.js | KH_Chores | Medium — bulk status reset |

### No staged-write pattern exists
- All writes go directly to production tabs
- `LockService.waitLock(30000)` prevents concurrent writes but not bad data
- No validation between compute and write
- No rollback mechanism for sheet state

### Existing safety
- `waitLock(30000)` on all write paths (good)
- Idempotence guard in `stampCloseMonth()` (good)
- `appendRow` for log-style writes (low risk)

---

## Proposed Design

### Tier 1: Staged-write pattern (prevention)

For high-risk write paths, write to a staging area first, validate, then promote:

```
function writeStaged_(tabName, rows, validator) {
  1. Write rows to hidden staging tab (e.g., "_STAGING_" + tabName)
  2. Run validator function against staged rows
  3. If valid: copy to production tab within same lock scope
  4. If invalid: log error, leave staging for inspection, do NOT promote
  5. Clear staging tab after successful promotion
}
```

**Validator examples:**
- Row count matches expected
- Required columns are non-empty
- Numeric columns are within sane bounds
- No duplicate IDs in identity columns

### Tier 2: Per-table recovery strategy

| Tab | Can rebuild? | Recovery method |
|---|---|---|
| KH_Chores | Yes | Re-run `seedKHData_()` or restore from KH_History |
| KH_History | Append-only | Trim bad rows by timestamp |
| KH_Redemptions | Append-only | Trim bad rows by timestamp |
| KH_Allowance | Derived | Recompute from KH_History - KH_Redemptions |
| Close History | Partial | Re-run `stampCloseMonth()` for affected months |
| Cascade tabs | Yes | Re-run `refreshCascadeTabs()` — fully recomputed |
| ErrorLog / PerfLog | Append-only | Trim bad rows; no business impact |
| Dashboard_Export | Yes | Re-run `getData()` — fully recomputed |
| Debt_Export | Yes | Re-run `parseDebtExport()` write path |
| Board_Config | Manual | Small tab, manually restorable |

### Tier 3: Evidence capture before repair

Before any data repair:
1. Export current tab state as CSV to Drive (timestamped)
2. Log the repair action to ErrorLog with: tab name, rows affected, repair method, timestamp
3. Take a snapshot of the affected tab range

---

## Implementation Priority

### Must-have (Phase 1)
1. `writeStaged_()` helper with validation hook
2. Migrate `khCompleteTask` chain (highest risk: multi-tab, balance mutation)
3. Data recovery runbook as `specs/data-recovery-runbook.md`

### Should-have (Phase 2)
4. Migrate `stampCloseMonth()` to staged pattern
5. Migrate `resetDailyTasksAuto()` to staged pattern
6. Add pre-repair CSV export to Drive

### Nice-to-have (Phase 3)
7. Migrate remaining write paths
8. Automated bad-write simulation in non-prod (requires F09 candidate workbook)

---

## Open Questions

### Q1: Where does the staging tab live?
**Option A:** Hidden tabs in the same workbook (e.g., `_STAGING_KH_Chores`). Simple but clutters the workbook.
**Option B:** Separate staging workbook. Cleaner but adds complexity for promotion.
Recommendation: **Option A** — same workbook, hidden tabs. GAS can hide tabs via `hideSheet()`.

### Q2: Should the validator run inside or outside the lock?
Inside the lock. The entire stage→validate→promote sequence must be atomic. The lock timeout (30s) should be sufficient since validation is just row scanning, not sheet reads.

### Q3: Relationship to F09 candidate workbook?
The F09 candidate workbook is for CI testing. The staged-write pattern is for production safety. They're independent but complementary — F09 provides a place to test staged writes, F12 provides the write-safety pattern.

---

## Deploy Manifest

```
grep -n "writeStaged_" Kidshub.js → expected: called from khCompleteTask chain
grep -n "_STAGING_" Kidshub.js → expected: staging tab references
grep -n "writeStaged_" GASHardening.js → expected: helper definition (or DataEngine.js)
```

## Build Skills
- `thompson-engineer` — GAS architecture, lock patterns, sheet write safety
- `data-contracts` — tab ownership, column schemas
- `incident-response` — recovery procedures
