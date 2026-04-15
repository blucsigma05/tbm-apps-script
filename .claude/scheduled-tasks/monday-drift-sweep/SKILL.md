---
name: monday-drift-sweep
description: Weekly Monday 6am sweep. Consolidates Full Codebase Audit + Sheet Growth Monitor + Trigger Audit into one report. Catches drift that individual deploys miss.
---

Weekly drift sweep across TBM. Three parts, single consolidated report.

## PART A — Full Codebase Audit

1. Pull latest main from blucsigma05/tbm-apps-script.
2. Scan ALL `.html` files for ES5 violations (arrow fns, `let`/`const`, template literals, `??`, `?.`, `async`/`await`, `.includes()`, `for...of`, `backdrop-filter`).
3. Scan all `google.script.run.<fn>Safe()` calls — each must have a matching `withFailureHandler()` within 5 lines.
4. Verify all terminal Safe wrappers exist in `Code.gs` router (or equivalent API_WHITELIST). No orphan calls.

## PART B — Sheet Growth Monitor

1. Hit `?action=runTests` and extract growth metrics from the response.
2. Track week-over-week growth rate for each `KH_*` tab and DataEngine output tabs.
3. Flag any tab growing >2x the prior week's rate (runaway growth).
4. Flag any tab approaching 50K rows (GAS slowness threshold).

## PART C — Trigger Audit

1. Query GAS triggers via `getTriggerCountSafe()` (or equivalent — if missing, file an Issue to add it).
2. Report total + remaining headroom (GAS limit is 20).
3. Alert if remaining < 3.

## Output

- Single consolidated Pushover summary, format:
  ```
  MONDAY DRIFT SWEEP
  A: N ES5, M wiring, K orphan calls
  B: N runaway tabs, M near-limit
  C: trigger headroom = K
  ```
- Pushover priority `HYGIENE_REPORT_LOW` (-1) baseline.
- Escalate to `SYSTEM_ERROR` (1) if Part A finds blocking violations OR Part C headroom < 3.
- Escalate to `GATE_BREACH` (2) if any tab > 50K rows or trigger count = 20 (saturated).

## Notion update

Append findings to a "Monday Drift Reports" child page under TBM Project Memory (`2c8cea3cd9e8818eaf53df73cb5c2eee`). Create the page if it doesn't exist.
