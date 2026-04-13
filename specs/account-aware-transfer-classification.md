# Account-Aware Transfer Classification

**Issue:** #248
**Kind:** `kind:decision`
**Status:** Draft — awaiting LT decision on approach

---

## Summary

DataEngine classifies transactions as transfers, investments, and debt payments using only the Tiller category name. The system has no awareness of which accounts are involved. This means a checking-to-brokerage transfer (real cash leaving liquid accounts) is indistinguishable from a brokerage-to-brokerage internal move (no cash impact). The same ambiguity applies to credit card payments versus balance transfers between cards.

This spec proposes adding account-class awareness to the classification logic so that cash flow metrics reflect actual cash movement, not just category labels.

---

## Current State

### TRANSFER_CATS (DataEngine.gs, line 315)

The main financial engine excludes these categories from operating expenses:

```
Transfer: Internal, Transfer: LOC Draw, Balance Transfers,
CC Payment, LOC Payment, Loan Payment, Investment, Payroll Deduction,
Duplicate - Exclude, Debt Offset,
SoFi Loan, Auto Loan, Student Loans, Solar Panel
```

### TRANSFER_CATS_SIM (DataEngine.gs, line 2079)

The simulation engine has an identical copy of this list.

### ME_TRANSFER_CATS (MonitorEngine.js, line 19)

MonitorEngine has its own version with two additions (`Transfer: External`, `Loan Proceeds`):

```
Transfer: Internal, Transfer: External, Transfer: LOC Draw,
Balance Transfers, CC Payment, LOC Payment, Loan Payment,
Loan Proceeds, Investment, Payroll Deduction, Duplicate - Exclude,
Debt Offset, SoFi Loan, Auto Loan, Student Loans, Solar Panel
```

### monthClosePreflight (GASHardening.gs, line 487)

Uses a much shorter list for transfer-net-to-zero validation:

```
transfer, transfers, account transfer, internal transfer
```

This only checks lowercase generic transfer labels and misses the specific categories that the main engine excludes.

### Debt payment tracking (DataEngine.gs, line 340)

A separate `DEBT_PAY_CATS_MAIN` list tracks actual debt payments for the `totalCashFlow` metric:

```
CC Payment, LOC Payment, Loan Payment, SoFi Loan, Auto Loan, Student Loans, Solar Panel
```

### MER Gate 3 (MonitorEngine.js, line 277)

Transfer net threshold is $500 (PASS if under, WARN if over). Known baseline is ~$272/month.

### Key cash flow formula (DataEngine.gs, line 657)

```
totalCashFlow = totalMoneyIn - operatingExpenses - debtPaymentsMTD
```

This is the metric most affected by classification accuracy.

### Transaction column layout (Transactions sheet)

| Index | Column | Field |
|-------|--------|-------|
| 0 | A | (row ID) |
| 1 | B | Date |
| 2 | C | Description |
| 3 | D | Category |
| 4 | E | Amount |
| 5 | F | Account |

The Account column (F, index 5) is already read in at least one function (`getCategoryDetail`, line 2813) but is NOT used by the main `getDashboardPayload` loop (lines 343-377).

### Balance History column layout

| Index | Column | Field |
|-------|--------|-------|
| 3 | D | Account |
| 8 | I | Balance |
| 11 | L | Type |
| 12 | M | Class |

DataEngine already reads Type and Class from Balance History (line 470-471) to compute `totalAssets` and `totalLiabilities`. The Class field contains `Asset` or `Liability`.

---

## Problem Examples

| Transaction | Category | Current treatment | Actual cash impact |
|-------------|----------|-------------------|--------------------|
| Checking to Fidelity brokerage | Investment | Excluded from expenses | Real cash out of liquid accounts |
| Fidelity to Fidelity (rebalance) | Investment | Excluded from expenses | No cash movement |
| Checking to Visa payment | CC Payment | Debt payment (cash out) | Real cash out |
| Visa to Chase balance transfer | Balance Transfers | Excluded from expenses | No cash movement |
| Checking to checking (same bank) | Transfer: Internal | Excluded from expenses | No cash movement |
| Checking to external savings | Transfer: Internal | Excluded from expenses | Could be real cash repositioning |

The first two rows share a category but have opposite cash flow implications. The system cannot distinguish them today.

---

## Proposed Design

### Step 1: Build ACCOUNT_CLASS map

At the start of `getDashboardPayload`, after reading Balance History (line 460-484), build a lookup:

```javascript
var ACCOUNT_CLASS = {};
for (var acct in latestBal) {
  var e = latestBal[acct];
  ACCOUNT_CLASS[acct] = {
    class: e.cls,       // 'Asset' or 'Liability'
    type: e.type,       // e.g., 'checking', 'brokerage', 'credit card'
    liquid: e.type !== 'brokerage' && e.type !== '401k' && e.type !== 'hsa'
  };
}
```

The `liquid` flag distinguishes checking/savings (liquid assets) from investment accounts. The exact `type` values need to be verified against actual Balance History data (see Open Questions).

### Step 2: Read source account in transaction loop

In the main transaction loop (line 343), add:

```javascript
var txAcct = String(txData[t][5] || '').trim();  // Col F — Account
```

### Step 3: Classify by account class pair

For transactions currently matching `TRANSFER_CATS`, apply a secondary classification:

| Source class | Destination class | Classification | Cash flow treatment |
|--------------|-------------------|----------------|---------------------|
| liquid asset | liquid asset | Internal transfer | Exclude (nets to $0) |
| liquid asset | investment asset | Cash out to investment | Include in cash out |
| liquid asset | liability | Debt payment | Include in cash out (already does via DEBT_PAY_CATS) |
| investment | investment | Internal investment move | Exclude |
| liability | liability | Balance transfer | Exclude |
| liability | liquid asset | Refund / overpayment credit | Include in cash in |

**Problem:** Tiller Transactions only have ONE account column per row. A transfer appears as two rows: one debit from the source account, one credit to the destination account. There is no explicit link between the pair.

### Step 3a: Pair-matching approach

Instead of classifying individual rows, match transfer pairs:

1. For each transaction in a transfer category, record `{account, amount, date, description}`.
2. Look for a matching opposite-sign transaction within +/- 3 days with the same absolute amount.
3. When a pair is found, classify based on the account classes of both sides.
4. Unmatched transactions fall back to category-only classification.

This is the harder but more accurate approach.

### Step 3b: Single-account approach (simpler)

Classify based only on the source account of each transfer-category transaction:

- Negative amount from a liquid asset account = cash out (include)
- Negative amount from an investment account = internal move (exclude)
- Negative amount from a liability account = balance transfer (exclude)
- Positive amount from any account = the receiving side (handled by the matching debit)

This is simpler but less precise -- it cannot distinguish "checking to brokerage" from "checking to checking" on the debit side alone. However, the credit side of a brokerage deposit would be classified differently from a checking deposit.

### Step 4: Update consumers

All three transfer category lists must be updated or replaced:

1. `TRANSFER_CATS` in `getDashboardPayload` (DataEngine.gs)
2. `TRANSFER_CATS_SIM` in simulation engine (DataEngine.gs)
3. `ME_TRANSFER_CATS` in MonitorEngine.js
4. `transferCats` in `monthClosePreflight` (GASHardening.gs)
5. `DEBT_PAY_CATS_MAIN` / `DEBT_PAY_CATS_SIM` debt payment lists

### Step 5: Update MER Gate 3

The $500 transfer net threshold should tighten once classification is more accurate. True internal transfers (liquid-to-liquid, same class) should net closer to $0. The known ~$272/month baseline may drop significantly.

---

## Open Questions

### Q1: What are the actual `Type` values in Balance History column L?

The code reads `bhType` but only uses `bhClass` (Asset/Liability) for balance calculations. Need to enumerate the distinct Type values to build the `liquid` flag correctly. Run:

```javascript
// Diagnostic: enumerate Balance History Type + Class combos
var bh = SpreadsheetApp.openById(SSID).getSheetByName(TAB_MAP['Balance History']);
var data = bh.getDataRange().getValues();
var seen = {};
for (var i = 1; i < data.length; i++) {
  var key = data[i][11] + ' | ' + data[i][12]; // Type | Class
  if (!seen[key]) { seen[key] = data[i][3]; } // first account name
}
Logger.log(JSON.stringify(seen, null, 2));
```

### Q2: Does Tiller always produce paired transactions for transfers?

If a transfer from checking to brokerage creates two rows (one debit, one credit), the pair-matching approach works. If Tiller only tracks the side visible to the linked account, unmatched transactions need a fallback. Verify with actual transaction data.

### Q3: Gradual migration or hard switch?

**Option A — Gradual (recommended):** Keep category-based classification as the primary path. Add account-aware classification as a secondary signal. When both are available and agree, use the more specific classification. When they disagree, log the discrepancy for review. After one month of discrepancy logging, switch to account-aware as primary.

**Option B — Hard switch:** Replace category-based logic immediately. Faster but riskier if account data has gaps.

### Q4: Should the Investment category be split?

Currently "Investment" covers both employer payroll deductions (no liquid cash movement) and manual transfers to brokerage (real cash out). Payroll deductions never touch checking -- they go directly from employer to 401k. These should probably remain excluded from cash flow regardless of account class, since they were never liquid cash.

### Q5: What about accounts not tracked by Tiller?

If a transaction references an account that Tiller tracks but the destination is external (e.g., a wire to a non-Tiller account), Balance History will not have the destination. The single-account approach (Step 3b) handles this naturally. The pair-matching approach (Step 3a) would leave these unmatched and fall back to category-based.

---

## Implementation Plan

### Phase 1: Data discovery (no code changes)

1. Run diagnostic to enumerate Balance History Type/Class values
2. Run diagnostic to check transfer pair matching rates for last 3 months
3. Document which accounts are liquid vs. investment vs. liability
4. Verify Tiller produces paired rows for all transfer types

### Phase 2: ACCOUNT_CLASS map + logging

1. Build `ACCOUNT_CLASS` map in `getDashboardPayload`
2. In the transaction loop, for each transfer-category transaction, log the account class
3. Add a `_transferClassification` diagnostic array to the payload (dev only)
4. Run for one month to validate classification accuracy

### Phase 3: Reclassification

1. Replace category-only exclusion with account-aware classification
2. Update `totalCashFlow` formula to reflect new classifications
3. Update MER Gate 3 threshold based on new baseline
4. Align all four transfer category lists (or replace with unified logic)

### Phase 4: Cleanup

1. Remove diagnostic logging
2. Update `monthClosePreflight` to use the same classification
3. Update any smoke/regression tests that assert transfer behavior
4. Document the new classification rules in CLAUDE.md or a data-contracts skill

---

## Build Skills

- `thompson-engineer` -- GAS architecture, DataEngine patterns, shared global scope
- `data-contracts` -- Balance History schema (Type, Class columns), Transactions schema (Account column)

---

## Deploy Manifest

```
grep -n "ACCOUNT_CLASS" DataEngine.js           -> expected: map declaration + population loop
grep -n "txAcct" DataEngine.js                  -> expected: Account column read in main tx loop
grep -n "TRANSFER_CATS" DataEngine.js           -> expected: still present (Phase 2) or replaced (Phase 3)
grep -n "ME_TRANSFER_CATS" MonitorEngine.js     -> expected: aligned with DataEngine classification
```

## Feature Verification Checklist

- [ ] `ACCOUNT_CLASS` map populated for every account in Balance History
- [ ] Every Balance History account has a `class` value of 'Asset' or 'Liability'
- [ ] `liquid` flag correctly distinguishes checking/savings from brokerage/401k/HSA
- [ ] Transfer-category transactions include account name in diagnostic output
- [ ] `totalCashFlow` value matches manual calculation for a known test month
- [ ] MER Gate 3 transfer net value changes (or stays the same) as expected
- [ ] No regression in `operatingExpenses` -- same value before and after for a known month
- [ ] `monthClosePreflight` CHECK 3 covers the same transfer categories as the main engine
