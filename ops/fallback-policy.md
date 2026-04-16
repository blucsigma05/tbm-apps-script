# TBM Fallback Behavior Policy

<!-- per-surface rules for what happens when real data can't load -->
<!-- precedent: PR #349 killed 'PRACTICE MODE' fake-content fallback -->
<!-- must satisfy MVSS v1 U7 (no-silent-failure), U13 (empty-state), U14 (error-has-retry), U15 (loading-max-time), U16 (offline-declared) -->

## Prime directive (from PR #349, LT)

**"Either real data loads, or the surface errors explicitly. Fake content is the problem, not the symptom."**

No canned lessons. No synthetic chores. No "practice mode" sticker. No stub objects pretending to be today's content. If the backend can't supply truth, the surface says so in words the audience can act on.

## Failure taxonomy

Every fallback decision depends on two axes:

**Failure type:**
- `backend-unreachable` — GAS call fails, times out, 500s
- `data-missing-unexpected` — curriculum not seeded, chores tab empty when schedule says it shouldn't be, auth DB row missing
- `data-empty-legitimate` — no chores today (valid), no homework scheduled (valid), library empty (new user)
- `external-api-down` — Gemini, Notion, Pushover, Tiller unreachable
- `auth-fail` — PIN wrong, session expired

**Audience:**
- `kid-unsupervised` — child alone on device
- `kid-supervised` — used with parent present
- `parent` — JT or LT interactive
- `ambient` — always-on display, no active user

## Canonical fallback patterns

Five patterns cover every surface. Every row in the per-surface table below picks one.

| Pattern | Behavior | Use when |
|---|---|---|
| `refuse-clearly` | Surface refuses to enter. Explicit error + retry button. No cached data shown. | Truth is load-bearing and stale would mislead (finance, parent approvals) |
| `read-only-cached` | Show last cached snapshot with "Last updated: `<time>`" banner. Disable interactions that would mutate. | Non-interactive kid/parent views where stale is better than empty |
| `read-only-cached-long` | Same as above but stale tolerance is hours (not minutes). Escalates to loud warning past a threshold. | Ambient 24/7 displays (TheSpine, TheSoul) |
| `queue` | Allow local interaction. Persist actions in localStorage. Retry/sync on reconnect. | Creation surfaces (ComicStudio) + chore completions (ChoreBoards) |
| `redirect-with-notice` | Explicit error (age-appropriate), then auto-redirect to a safe hub after N seconds. | Pre-reading kid surfaces where user can't act on error text (JJ surfaces) |

## Audience-appropriate error copy

### Buggsy + parent + ambient
Amber "TRY AGAIN" button + "Tell Mom or Dad. They'll fix it." (PR #349 pattern). Parent variants drop the "Tell Mom or Dad" line.

### JJ (pre-reader, age 4)
Visual + audio + redirect. Per LT decision 2026-04-16:
- Sparkle-themed "oops!" visual (sad-sparkle animation, no text)
- Nia voice via ElevenLabs: "Let's try again in a minute!"
- Auto-redirect to `/sparkle-kingdom` after 10 seconds
- Sparkle Kingdom always has `sparkle-free` (free-play) available as a working surface
- JJ never sees a dead screen she can't navigate

## Per-surface policy

### Buggsy curriculum modules

| Surface | Pattern | Notes |
|---|---|---|
| `/homework` | `refuse-clearly` | Per PR #349 — established |
| `/reading` | `refuse-clearly` | Per PR #349 — established |
| `/writing` | `refuse-clearly` | Per PR #349 — established |
| `/wolfkid` | `refuse-clearly` | NEW — apply same pattern from #349 |
| `/facts` | `refuse-clearly` | NEW — apply same pattern from #349 |
| `/investigation` | `refuse-clearly` | NEW — apply same pattern from #349 |

Empty-legitimate state for all six: "Nothing assigned today — free time!" with link to free-play or dashboard.

Preventive: 6AM validator (per PR #349 server changes) pages LT if any curriculum shape is broken before kids touch devices.

### JJ learning surfaces

| Surface | Pattern | Notes |
|---|---|---|
| `/sparkle` | `redirect-with-notice` | 10s to `/sparkle-kingdom` |
| `/daily-adventures` | `redirect-with-notice` | 10s to `/sparkle-kingdom` |
| `/sparkle-free` | `read-only-cached` | Free-play has local assets — usually works offline |
| `/sparkle-kingdom` (JJHome) | `read-only-cached` | Always has something to offer (free-play, yesterday's progress) |

### Hubs (Buggsy)

| Surface | Pattern | Notes |
|---|---|---|
| `/daily-missions` (Buggsy) | `read-only-cached` | Show cached plan + "Last: `<time>`" banner |
| `/wolfdome` (DesignDashboard) | `read-only-cached` | Rings/XP from cached snapshot; tolerates minutes-stale |

Empty-legitimate: "No missions today — awesome! Free time."

### Creation surface

| Surface | Pattern | Notes |
|---|---|---|
| `/comic-studio` | `queue` | LT decision 2026-04-16: drafts save to localStorage offline, sync on reconnect. Past-comic library shows cached + "Can't load past comics" banner with retry. |

Empty-legitimate: "Start your first comic!" CTA.

### Diagnostics

| Surface | Pattern | Notes |
|---|---|---|
| `/baseline` | `queue` (mid-assessment) / `refuse-clearly` (at-start) | If backend fails mid-assessment, save progress locally, retry submit on reconnect. If data can't load at start, error — kid can abandon safely |
| `/power-scan` | Same as `/baseline` | |

Empty-legitimate: N/A (diagnostics are one-shot, never legitimately empty).

### ChoreBoards (kid A9/A7)

| Surface | Pattern | Notes |
|---|---|---|
| `/buggsy` (KidsHub Buggsy) | `queue` | Cached chore list + stale banner. Completions queue to localStorage; retry on reconnect |
| `/jj` (KidsHub JJ) | `queue` | Same pattern; for JJ, errors use `redirect-with-notice` style visual+audio |

Empty-legitimate: "All done for today!" with star/celebration.

### Parent dashboards

| Surface | Pattern | Notes |
|---|---|---|
| `/parent` (KidsHub Parent) | `refuse-clearly` | No cached fallback — stale approvals = bad UX for JT |
| `/progress` (ProgressReport) | `read-only-cached` (stale <2h) / `refuse-clearly` (stale >2h) | Parents understand cache banners; don't silently show week-old data |

Empty-legitimate: `/parent` → "No chores waiting for approval." `/progress` → "No activity yet this week."

### Interactive finance

| Surface | Pattern | Notes |
|---|---|---|
| `/pulse` (ThePulse) | `refuse-clearly` | Stale finance could mislead JT on available funds |
| `/vein` (TheVein) | `refuse-clearly` | Same for LT command center |

Tiller-stale is already surfaced via CF Worker freshness banner — this policy complements that, doesn't replace it.

### Ambient finance

| Surface | Pattern | Notes |
|---|---|---|
| `/spine` (TheSpine) | `read-only-cached-long` | Cached + watermark "Data: `<time>`". Escalates to loud stale indicator when stale >4 hours (LT decision 2026-04-16). |
| `/soul` (TheSoul) | `read-only-cached-long` | Same rule. No finance data visible per TBM visibility rules; cache is for calendar/plan widgets. |

Stale indicator design: red bar across top of display, visible from across the room. Paired with Pushover notification to LT + JT when threshold trips.

### Other surfaces

| Surface | Pattern | Notes |
|---|---|---|
| `/story-library` | `read-only-cached` | Show cached list with stale banner; allow reading cached stories; queue new-story requests |
| `/story` (StoryReader) | `queue` (mid-read) / `refuse-clearly` (load-fail) | Mid-read: save position, retry. Never loads: error |
| `/vault` | `refuse-clearly` | LT collection — error with retry is fine |
| `/qa/operator` | `refuse-clearly` | Admin surface |

## Implementation contract per pattern

### `refuse-clearly`
- Display: explicit error message + retry button, sized per MVSS v1 D (touch target ≥24px / ≥60px on JJ tablet)
- Copy: audience-appropriate (see "Audience-appropriate error copy" above)
- Retry: calls the same server function with fresh cache bust (`Date.now()` in request)
- Banned: `alert()`, empty `withFailureHandler(function(){})`, blank-screen, "silent reload"
- MVSS v1 coverage: U7, U14

### `read-only-cached`
- Read cache at load
- If cache >10 min stale: show "Last updated: `<time>`" banner
- Mutation controls disabled while in fallback mode (greyed + tooltip "Waiting for connection")
- Auto-retry every 30s; on success, banner clears and controls re-enable
- MVSS v1 coverage: U7, U14, U16

### `read-only-cached-long` (ambient)
- Same as `read-only-cached` but thresholds are hours not minutes
- Subtle watermark at all times; loud indicator past 4h
- Pushover alert to LT + JT when loud indicator trips (once, debounced)
- MVSS v1 coverage: U7, U16

### `queue`
- Mutations write to localStorage under key `tbm:queue:<surface>:<iso-timestamp>`
- Background retry loop (30s interval, exponential backoff to 5min max)
- Visible "Saving…" indicator while queue non-empty; "Saved" when queue clears
- On reconnect: flush queue in FIFO order, show success count
- On sustained failure (>1 hour in queue): banner "Changes not syncing — tell Mom or Dad"
- MVSS v1 coverage: U7, U14, U16

### `redirect-with-notice` (JJ)
- Visual + audio per "Audience-appropriate error copy"
- 10-second display before auto-redirect
- Target: `/sparkle-kingdom` (always has free-play available)
- No retry button on the error screen — kid gets redirected to a working surface
- Parent catches the failure via: error logged to ErrorLog, 6AM preflight for curriculum surfaces, push alert tied to sustained Nia fallback events
- MVSS v1 coverage: U7, U14 (the retry path is via redirect, not button)

## Empty-legitimate copy registry

Per `ops/copy-patterns.md` (to be created alongside MVSS v1 per plan section F): empty-legitimate language is drawn from an allowed token set. Examples locked:

| Surface | Empty-legitimate copy |
|---|---|
| Buggsy curriculum | "Nothing assigned today — free time!" |
| JJ hub | "Nothing here right now — let's play!" |
| ChoreBoards | "All done for today!" + star animation |
| Parent approvals | "No chores waiting for approval." |
| ProgressReport | "No activity yet this week." |
| StoryLibrary | "No stories yet — check back tomorrow!" |

## MVSS v1 alignment

Every pattern maps to MVSS v1 universal must-pass rules:

| Pattern | U7 no-silent-failure | U13 empty-state | U14 error-has-retry | U15 loading-max-time | U16 offline-declared |
|---|---|---|---|---|---|
| `refuse-clearly` | ✓ | ✓ | ✓ | ✓ (via timeout → error) | `refuse-clearly` |
| `read-only-cached` | ✓ | ✓ | ✓ | ✓ | `read-only` |
| `read-only-cached-long` | ✓ | ✓ | ✓ (via reload) | ✓ | `read-only` |
| `queue` | ✓ | ✓ | ✓ (via queue retry) | ✓ | `queue` |
| `redirect-with-notice` | ✓ | N/A (redirects) | ✓ (via redirect to working surface) | ✓ (10s timeout) | `redirect-to-hub` |

## Preventive guardrails (upstream of fallback)

Fallback is the last line of defense. Upstream checks prevent getting there:

1. **6AM curriculum preflight** (PR #349) — pages LT if any of `/homework`, `/reading`, `/writing` would fail on shape. Extends in P0-105 implementation to `/wolfkid`, `/facts`, `/investigation`.
2. **Cache heartbeat** (KH_CACHE_KEY + heartbeat in Helpers:Z1) — surfaces detect stale cache and refresh proactively before user sees stale.
3. **Tiller freshness gate** (CF Worker) — interactive finance surfaces get a freshness banner before the page even loads if Tiller is stale.

Fallback policy activates only when these upstream checks have been bypassed or a novel failure mode occurs.

## Update rule

Any PR that adds a new surface or changes an existing surface's failure-handling must update the per-surface table in the same PR. Enforced by `hyg-14-rubric-drift.yml` (per MVSS v1 section K — same workflow covers this policy since both consume `ops/surface-map.md` tracked_files).

## Change log

| Date | Version | Change |
|---|---|---|
| 2026-04-16 | 1.0 | Initial policy. 5 patterns, 23 surfaces covered. LT decisions locked for JJ redirect (10s), ComicStudio offline queue, ambient stale 4h threshold. |
