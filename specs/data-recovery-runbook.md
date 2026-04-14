# Data Recovery Runbook — TBM Production Spreadsheet

**Issue:** #266 (F12)
**Created:** 2026-04-13

---

## Before Any Repair

1. Export the affected tab as CSV to Drive (timestamped folder).
2. Log the repair action to ErrorLog: tab name, rows affected, repair method, timestamp.
3. Take a screenshot or snapshot of the affected range before touching anything.

---

## Per-Table Recovery

### KH_Chores
**Can rebuild:** Yes
**Method:** Re-run `seedKHData_()` to restore the task roster. Daily task state (Completed, Completed_Date) is reset to defaults — acceptable if the bad write mutated those columns.

### KH_History
**Type:** Append-only
**Method:** Trim bad rows by timestamp. Identify the first bad row by timestamp, delete from that row to end of bad block. Do not delete earlier rows — they are the authoritative completion record.

### KH_Redemptions
**Type:** Append-only
**Method:** Same as KH_History. Trim bad rows by timestamp. KH_Allowance balances are derived from KH_History minus KH_Redemptions, so trimming bad redemption rows will restore correct balances.

### KH_Allowance
**Type:** Derived
**Method:** Recompute from KH_History minus KH_Redemptions. Run `recalcAllowanceFromHistory_()` if available, or manually sum the delta for each child.

### Close History
**Type:** Partial rebuild
**Method:** Re-run `stampCloseMonth()` for the affected month. The function is idempotent-guarded — it checks for existing entries before writing. Clear the bad row first, then re-run.

### Cascade tabs (Month-by-Month, Payoff Schedule, Cascade Proof)
**Type:** Fully recomputed
**Method:** Run `refreshCascadeTabs()`. These tabs are 100% derived from Transactions and Debt_Export — no manual data, always safe to regenerate.

### Dashboard_Export
**Type:** Fully recomputed
**Method:** Run `getData()` or trigger a full refresh. Derived from all source tabs.

### Debt_Export
**Type:** Fully recomputed
**Method:** Re-run `parseDebtExport()` write path. Sourced from Tiller's debt data.

### ErrorLog / PerfLog
**Type:** Append-only, no business impact
**Method:** Trim bad rows by timestamp. These logs are diagnostic only — trimming does not affect any computed values.

### Board_Config
**Type:** Small config table, manually maintained
**Method:** Restore from the most recent code snapshot or CLAUDE.md reference. This table changes rarely and is small enough to restore by hand.

---

## Staged Write Failure

If `writeStaged_()` blocked a write:
1. The `_STAGING_<tab>` hidden tab will contain the rejected rows.
2. Check `ErrorLog` for the validation failure reason.
3. Inspect the staging tab to understand what was wrong with the data.
4. Clear the staging tab manually via the GAS editor or `clearStagingTab_(key)` helper once investigation is complete.

---

## Controlled Bad-Write Simulation (Non-Prod)

Once the F09 candidate workbook exists:
1. Deploy to candidate project.
2. Call a write function with intentionally malformed data (e.g., empty Task_ID).
3. Confirm `writeStaged_()` blocks the write and populates the staging tab.
4. Check ErrorLog in candidate workbook for the validation failure.
5. Verify production workbook is unaffected.
