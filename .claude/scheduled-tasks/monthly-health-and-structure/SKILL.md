---
name: monthly-health-and-structure
description: 1st-of-month 6am consolidated health + structure audit. Architecture review (function counts, dead code), dependency/quota check (GAS limits, sheet sizes), Notion structure review (PM tree, Active Versions DB).
---

Monthly system health audit. Three parts, runs first day of month.

## PART A — Architecture Review

1. Count functions per `.gs` file (`grep -c '^function ' *.gs`). Flag any file with >50 functions (refactor candidate).
2. Find duplicate function names across files (cross-file collisions). All `.gs` files share global scope, so collisions silently break.
3. Verify module ownership boundaries — each `.gs` should write to its own tabs only (per File Map in CLAUDE.md). Cross-write violations = bad.
4. Find dead code: private functions (`_` suffix) with zero callers in pushed code.

## PART B — Dependency + Quota Check

1. GAS execution quotas: query daily/weekly minute usage via Apps Script Dashboard or `getQuotaUsage_()`. Report % consumed.
2. Trigger count + headroom (limit 20).
3. Sheet row counts per major tab — flag any approaching 50K rows (GAS slowness threshold).
4. CacheService usage estimate (key count, total bytes).

## PART C — Notion Structure Review

1. Audit PM page tree under TBM Project Memory (`2c8cea3cd9e8818eaf53df73cb5c2eee`).
2. Verify Thread Handoff Archive (`322cea3cd9e881bb8afcd560fe772481`) is ordered chronologically.
3. Verify Active Versions DB (`collection://158238c5-9a78-4fa5-9ef8-203f8e0e00a9`) matches deployed versions (cross-reference Part A of `morning-health-check`).
4. Find orphaned child pages (pages with no inbound links from any other page).
5. Compare Scheduled Tasks page (`334cea3cd9e8812a95bdcea2786b50d6`) entries to actually-scheduled tasks in `~/.claude/scheduled-tasks/`. Flag mismatches.
6. Check Integration Map DB (`33acea3cd9e881888295e3ab98be3fc4`) for entries past their review date.

## Output

- **Notion:** Append findings as a new dated child page under TBM PM titled "Monthly Audit YYYY-MM".
- **Pushover** priority `CHORE_APPROVAL` (0) with one-line summary per part:
  ```
  MONTHLY AUDIT
  A: N >50-fn files, M collisions, K cross-writes, P dead funcs
  B: quota X%, triggers N/20, biggest tab Y rows
  C: N orphan pages, M scheduled-task drift, K integration map stale
  ```
- Escalate to `SYSTEM_ERROR` (1) if quota > 80% OR trigger headroom < 3 OR any tab > 50K rows.
