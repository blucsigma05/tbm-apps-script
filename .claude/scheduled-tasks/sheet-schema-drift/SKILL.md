---
name: sheet-schema-drift
description: Daily 6:30am compare TAB_MAP entries in DataEngine.gs against actual Google Sheet column headers. Catches the "data shape doesn't match" silent breakage (the MLS Codex pain pattern).
---

Detect schema drift between code's TAB_MAP and live sheet headers. Schema mismatches break code silently — TAB_MAP says column 5 is "Score" but sheet shifted columns and now col 5 is "Date". Read returns wrong type, write corrupts data.

## Steps

1. Pull `DataEngine.gs` from main branch HEAD. Parse `TAB_MAP` constant — extract tab name + expected column headers (per inline comments, schema constants, or `KH_EDU_HEADERS`-style adjacent constants).
2. For each tab in TAB_MAP:
   - Hit `https://thompsonfams.com/pulse?action=getSheetHeaders&tab=<TABNAME>` (GAS endpoint). Returns `{ headers: ["col1", "col2", ...] }`.
   - **If endpoint doesn't exist (404 or unknown action):** STOP. File a GitHub Issue:
     ```
     gh issue create --title "Add ?action=getSheetHeaders endpoint for sheet-schema-drift" \
       --label "kind:task,severity:major,area:infra,model:opus" \
       --body "## Build Skills\n- thompson-engineer\n\nsheet-schema-drift scheduled task needs a GET endpoint that returns sheet headers for a given tab name. Add to Code.gs router."
     ```
     Then exit silently this run.
3. Compare expected vs actual:
   - **Missing columns** — in TAB_MAP, not in sheet (code will read undefined)
   - **Extra columns** — in sheet, not in TAB_MAP (data may be lost on writes)
   - **Reordered columns** — same set, different order (silent corruption — worst case)

## Output

- **0 drift:** silent.
- **1–4 drift:** Pushover priority `SYSTEM_ERROR` (1). Format:
  ```
  SHEET SCHEMA DRIFT
  Tab: KH_Education
    Missing in sheet: GeminiFeedback (col 12)
    Extra in sheet: ParentRubric (col 13, unmapped)
  ```
- **5+ tabs drifted at once:** priority `GATE_BREACH` (2) — likely a schema migration that didn't sync. Manual review urgent.
- **Reordered (any):** always `GATE_BREACH` (2) regardless of count — silent data corruption risk is highest here.

## Notion update

Append findings to a "Schema Drift Log" page under TBM PM. Each run gets a dated section.
