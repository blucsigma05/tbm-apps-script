---
name: spec-quality-gate
description: Daily 8:30am check that all "READY FOR CODE" items in Parking Lot have a complete Pipeline Operating Mode spec. Catches malformed specs BEFORE Code picks them up and wastes time.
---

Quality gate for spec readiness. Closes the "should have been caught" gap at the spec→code boundary.

## Steps

1. Fetch the Parking Lot Code Queue page (`32ccea3cd9e881809257fd5e7973c6d7`) and all child pages.
2. For each child page where the title or first section header indicates `READY FOR CODE` status (look for `## ⚠️ PIPELINE STATUS: READY FOR CODE`):
3. Verify the page has all four required Pipeline Operating Mode fields:
   - **Problem** (or "Verified On") — what specifically is broken or missing
   - **Why** — motivation, why this matters now
   - **What changes** — concrete deltas (files, behaviors, contracts)
   - **Acceptance test** — measurable pass condition
4. Verify required header structure:
   - **Title format:** `YYYY-MM-DD | TYPE | Surface or Change`
   - **Status header:** `## ⚠️ PIPELINE STATUS: [STATUS]` as first H2
   - **Artifact source:** declared (file path or commit SHA)
   - **What Code does next:** explicit instruction
5. Build a list of items missing one or more required fields.

## Output

- **0 incomplete:** silent.
- **1+ incomplete:** Pushover priority `BACKLOG_STALE` (0) with one line per item:
  ```
  [page title] - missing: [field1, field2, ...]
  ```
- **In Notion:** for each incomplete item, append a callout block at the top of the page:
  ```
  ## ⚠️ MISSING SPEC FIELDS
  Spec Quality Gate flagged this item on YYYY-MM-DD.
  Missing: [field1, field2, ...]
  Status reverted from READY FOR CODE to AWAITING CODEX REVIEW.
  ```
  Then change the status header to `AWAITING CODEX REVIEW` to prevent Code from picking it up.

## Why this matters

A spec that's incomplete but marked `READY FOR CODE` will get picked up by Code, who'll either build the wrong thing or stop and ask. Both waste a build cycle. Catching at the spec gate, before Code touches it, is cheaper.
