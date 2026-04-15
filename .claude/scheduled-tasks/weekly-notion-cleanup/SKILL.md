---
name: weekly-notion-cleanup
description: Friday 6am Notion hygiene scan. Finds stale handoffs (>14d), duplicate/overlapping pages, empty placeholder pages, and aged Parking Lot items. Notion drifts; this catches it before it becomes 4 pages for the same thing.
---

Scan Notion under TBM Project Memory (`2c8cea3cd9e8818eaf53df73cb5c2eee`) for hygiene issues. Read-only — report findings, do not modify.

## Scans

1. **Stale handoffs:** Thread Handoff Archive (`322cea3cd9e881bb8afcd560fe772481`) — any page older than 14 days that's still flagged active.
2. **Duplicate/overlapping pages:** Use Notion search with related queries to find pages with substantially overlapping titles or content. Specifically check for spec/handoff pages on the same surface created within 7 days of each other.
3. **Empty / placeholder pages:** Pages with no content beyond title, or content that's just `(TBD)`, `(WIP)`, `(placeholder)`, lorem ipsum, etc.
4. **Aged Parking Lot items:** Parking Lot (`32ccea3cd9e881809257fd5e7973c6d7`):
   - Idea Pad bullets older than 14 days (move-or-drop time)
   - Code Queue items in `AWAITING CODEX REVIEW` for >7 days (Codex queue stuck?)
   - Code Queue items in `READY FOR CODE` for >5 days (Code queue stuck?)
   - Code Queue items in `BLOCKED` (always flag, regardless of age)
5. **Trust Backlog age:** Trust Backlog DB (`338cea3cd9e8814a8cd6e1e04ecb4748`) — items older than 30 days that haven't moved.

## Output

- **Notion update:** Append a new dated section to a "Weekly Cleanup Reports" page under TBM PM (create the page on first run). Format:
  ```
  ## YYYY-MM-DD Cleanup
  Stale handoffs: N (links)
  Duplicates: N (page1 ≈ page2)
  Empty pages: N (links)
  Aged Parking Lot: N idea, M queue
  Stuck Codex review: N items
  Stuck READY FOR CODE: N items
  Blocked items: N (always list)
  Trust Backlog stale: N
  ```
- **Pushover** priority `HYGIENE_REPORT_LOW` (-1) one-line summary: `Notion cleanup: N stale, M duplicates, K aged, P blocked`.
- Escalate to `BACKLOG_STALE` (0) if total findings > 15.
