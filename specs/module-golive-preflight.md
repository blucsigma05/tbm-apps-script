# Module Go-Live Preflight + Trigger-to-Role Lookup
**Status:** Shipped — Code.gs v91, April 15 2026
**Branch:** claude/module-golive-preflight-NKe2W
**Notion spec:** https://www.notion.so/343cea3cd9e881109218d061416446e5
**Source doctrine:** Pipeline Operating Mode → Module Go-Live Preflight (Readiness Rule)

---

## What shipped

### Deliverable 1 — `modulePreflight(moduleId, kid, date)` (Preflight.js)
GAS function that runs 7 readiness checks before a kid-facing module goes live.
Returns structured `{ module, kid, date, ready, checks[], failures[], duration_ms }`.

**Seven checks:**
1. `seed_exists` — curriculum row exists in Curriculum sheet for kid+date
2. `wired_to_source` — module HTML calls `.getTodayContentSafe(kid)` with correct kid
3. `kid_routing_resolves` — module is registered in PREFLIGHT_MODULE_MAP for this kid
4. `day_state_resolves` — getTodayContent_ returns non-null with valid content shape for this moduleId
5. `assets_present` — all audio/image URLs in payload return HTTP 200
6. `surface_renders_clean` — server-side simulation: content passes each module's success handler guard without triggering fallback
7. `payload_matches_render` — server payload has identity fields; data-tbm-source-row instrumentation present in HTML

**Module registry (PREFLIGHT_MODULE_MAP):**
- `homework-module` → HomeworkModule.html, kid=buggsy
- `reading-module` → reading-module.html, kid=buggsy
- `writing-module` → writing-module.html, kid=buggsy
- `fact-sprint` → fact-sprint.html, kid=buggsy
- `sparkle` → SparkleLearning.html, kid=jj
- `daily-missions` → daily-missions.html, kid=any
- `investigation` → investigation-module.html, kid=buggsy
- `baseline` → BaselineDiagnostic.html, kid=any

**24h escalation:** `pf_trackFailures_` logs to `Preflight_Status` sheet. If same check fails >24h, fires Pushover to LT at `SYSTEM_ERROR` priority.

**Safe wrapper:** `modulePreflightSafe(moduleId, kid, date)` in Code.gs v91, registered in API whitelist.

### Deliverable 2 — `audit-trigger-map.json` (repo root)
Machine-readable trigger-to-audit-role lookup. Human-readable canonical: Audit Roles Notion page.
Key: `preflight_failure` → explicitly NOT an audit role. Fix readiness; don't file as audit finding.

---

## Gate 5b (added to CLAUDE.md)
For every kid-facing module touched in a PR, run `modulePreflight` for both kids and today's date before deploy. `ready: false` blocks the live notification. Pushover fires `blocked_check_chat`.

---

## DOM instrumentation (check #7)
Each module HTML now has:
```html
<span id="tbm-source-row" data-tbm-source-row="" style="display:none;"></span>
```
Populated in the success handler with `week-day-child` composite key.
Files patched: HomeworkModule.html, reading-module.html, writing-module.html, fact-sprint.html.

---

## Acceptance tests (per spec)
1. `modulePreflight('homework-module', 'buggsy', '2026-04-15')` → `ready: false` (current production state — fallback firing)
2. Same call against known-good staged state → `ready: true`, all 7 checks pass
3. Force pre-fetch failure → `ready: false`, first failure is prefetch error
4. Module with missing audio asset → `ready: false` on `assets_present` with failing URL in evidence

---

## Out of scope (separate work)
- Fixing the fallback patterns in HomeworkModule / ReadingModule / WritingModule
- Audit-execution glue (Phase 1 plumbing — event-driven audit firing)
- Audit Log auto-population
