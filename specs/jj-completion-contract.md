# JJ Completion Contract — Lesson Run Data Model

**Owner:** Opus (spec), Code (build), Codex (audit), LT (gate)
**Priority:** P1 — Blocks parent reporting de-stub (Task 5)
**Status:** Draft — Architecture Review
**Scope:** JJ SparkleLearning first; extends to Buggsy homework modules in a follow-up
**Risk:** Medium — touches write path for education modules; requires flag-gated rollout

---

## Problem

JJ task completion lives in client-side state only. Walking away mid-lesson throws away
everything she did. "Play Again" resets the current run. There is no authoritative record
of what JJ finished, no autosave, no resume-on-disconnect, and no real metric for parent
reporting beyond "how many rings did she earn today."

Concretely, JJ's work today writes to **five different places**, none of which represent
a lesson as a unit of work:

1. `KH_History` via `kh_awardEducationPoints_` (Kidshub.js:2756) — one row per
   kid/source/day, deduped by UID `'EDU_' + kid + '_' + source + '_' + today`. Records
   the ring grant, not the work.
2. `KH_History` via `saveProgress_` (Kidshub.js:3292) — one row per kid/day with
   `event_type='education_progress'`, aggregated stars, and a comma-separated letters
   string in the Task column. UID `'PROGRESS_' + child + '_' + today` — last write wins.
3. `KH_Education` via `submitHomework_` (Kidshub.js:3571) — Buggsy homework only.
   Columns `['Timestamp','Child','Module','Subject','Score','AutoGraded','ResponseText',
   'Status','ParentNotes','RingsAwarded','ReviewTimestamp','GeminiFeedback']`. JJ never
   writes here.
4. `KH_MissionState` via `saveMissionState_` (Kidshub.js:3436) — one row per kid/date,
   value is a JSON blob keyed by missionId (`page_index`) with boolean `true`. Tracks
   which daily-missions tiles have been tapped off; says nothing about what happened
   inside the module that mission launched.
5. Notion Sparkle DB via `logSparkleProgressSafe` (Code.js:1110) — one Notion page per
   `showSessionComplete` call with only `{Name, Child, Subject, Score, Date}`. No activity
   breakdown.

Client-side state in `SparkleLearning.html`:

- `currentActivityIndex` — current activity in session (line 591)
- `completedActivities = []` — array of `{index, starsEarned}` (line 592)
- `totalStars` — session running total
- `lettersCompleted` — list of letters touched this session
- `replaySession()` (line 2837) resets `currentActivityIndex = 0` and
  `completedActivities = []`, wiping the session from memory. The previous session's
  aggregated stars stay saved (to `KH_History`) but per-activity progress is gone.
- No autosave anywhere during the session — only at `showSessionComplete` (line 2766)
  does the client ping `saveProgressSafe` + `awardRingsSafe` + `logSparkleProgressSafe`.
- If the tablet sleeps, Wi-Fi drops, or JJ taps back: everything after the last
  `showSessionComplete` is lost.

Parent reporting that consumes this (`getWeekProgress_`, Kidshub.js:3393) counts
_distinct days_ with any `education` or `education_progress` row. Even with perfect data
it can't say "JJ finished lesson X activities y/z."

## Design

### Data model: what IS a "lesson run"?

A **lesson run** is one attempt at a curriculum module by one child. It has a client-
generated UUID, a start time, an in-progress body, and a terminal state. It does NOT
include the daily-missions tile state or the ring award — those stay as they are and
correlate back to the run by `runId`.

New sheet tab: **`KH_LessonRuns`** in the KH workbook (same workbook as KH_History,
KH_MissionState, etc. — this is the TBM main workbook per CLAUDE.md, not a separate
spreadsheet). Added to `TAB_MAP` in Dataengine.js.

Columns:

| # | Column | Type | Notes |
|---|--------|------|-------|
| 1 | `RunId` | string (UUID v4) | Client-generated. Primary key. |
| 2 | `Child` | string | `'jj'` or `'buggsy'` (lowercased) |
| 3 | `Module` | string | `'sparkle-learn'`, `'homework-module'`, etc. |
| 4 | `Subject` | string | `'Letters'`, `'Numbers'`, `'Math'`, etc. (for reporting) |
| 5 | `Source` | string | Mirrors `kh_awardEducationPoints_` source param. For dedupe correlation. |
| 6 | `DateKey` | string | `YYYY-MM-DD`, in local time (matches KH_MissionState `DateKey`) |
| 7 | `StartedAt` | ISO string | UTC, client clock (trusted; server clock in `LastSavedAt`) |
| 8 | `LastSavedAt` | ISO string | UTC, set by server on every save |
| 9 | `CompletedAt` | ISO string or `''` | Set on terminal state. Empty while in progress. |
| 10 | `Status` | string | `in_progress`, `completed`, `abandoned` |
| 11 | `ActivityIndex` | int | Resume point — the next un-rendered activity. `0` at start. |
| 12 | `ActivityCount` | int | Total activities in this run (set at start from curriculum) |
| 13 | `SessionStars` | int | Running sum of stars earned in this run |
| 14 | `ActivitiesJSON` | string | JSON array, one entry per completed activity (see below) |
| 15 | `ClientMeta` | string | JSON blob for client-side diagnostics (user agent, viewport, app version) |
| 16 | `CompletionReason` | string | `finished`, `play_again_replaced`, `abandoned_timeout`, `explicit_exit` |

`ActivitiesJSON` shape (one entry per completed activity):

```json
[
  {
    "idx": 0,
    "type": "letter_intro",
    "activityId": "letter_k_intro",
    "startedAt": "2026-04-09T14:03:12Z",
    "finishedAt": "2026-04-09T14:04:05Z",
    "starsEarned": 2,
    "attempts": 1,
    "correct": true
  }
]
```

Fields beyond `idx`/`starsEarned` are additive. The existing SparkleLearning client
already knows the `activity.type` from `renderActivity()` (line 1601) — passing through
is free.

**Why one row per run, not one per activity:** JJ's average run is 4–10 activities,
10–15 minutes total. Writing a row per activity means 5–10 sheet writes per lesson
under a 30s lock budget. One row per run, atomic upserts, keeps us within the current
lock envelope and under the 6-minute execution cap. Per-activity history lives inside
the JSON blob — structured but written once per save.

### Autosave cadence

Three triggers, all fire `completeLessonRun_` in idempotent-upsert mode (it doesn't
distinguish "start", "save", "complete" at the Sheet level — it writes the whole row):

1. **On `advanceActivity()`** (SparkleLearning.html:1625) — right after the client
   pushes to `completedActivities` and before the 600ms `setTimeout` that renders the
   next activity. This catches every answer.
2. **Before `beforeunload`** — window listener sends a synchronous beacon.
   `google.script.run` is not beacon-safe from the CF Pages surface, so use
   `navigator.sendBeacon('/api', JSON.stringify({fn:'saveLessonRunStateSafe', args:[...]}))`.
   On the GAS surface, fall back to a best-effort `google.script.run` without a success
   handler (fire-and-forget). Document that the beacon can be dropped by the kernel —
   the periodic timer is the safety net.
3. **Periodic timer, every 20 seconds, while idle on the same activity** — catches
   tablet sleep, finger-still-on-screen, and lost focus. Cancelled as soon as
   `advanceActivity()` fires (which already saves).

Throttle: minimum 5 seconds between saves of the same runId from the client. Server
accepts any frequency (idempotent).

**No save is triggered on "correct" or "wrong" answer feedback screens**; the save
fires when the activity completes (`advanceActivity` or equivalent). Partial-answer
state inside an activity (e.g., "JJ got the first of three letter taps right") is
intentionally NOT persisted — the next run restarts the activity from zero. The unit
of resume is the activity, not the answer.

### Resume behavior

On SparkleLearning load:

1. Generate a fresh `runId` client-side (UUID v4).
2. Call `getLessonRunResumeSafe('jj', 'sparkle-learn')` → returns the most recent
   `in_progress` run for that child/module with `DateKey === today` OR `null`.
3. If a run exists AND `(now - LastSavedAt) < 6 hours`: show a resume screen (see UX
   below). If LT taps Continue, adopt that run's `runId` and seek
   `currentActivityIndex = ActivityIndex`. If LT taps Start Over, mark the old run
   `abandoned`/`explicit_exit` and continue with the freshly-generated `runId`.
4. If no run exists OR the stale threshold is exceeded: start fresh. Any stale
   `in_progress` run older than 6 hours is silently marked `abandoned`/`abandoned_timeout`
   on first read (server-side sweep on `getLessonRunResume_`).

**UX for the resume screen (JJ can't read):**

- Giant illustration (mascot) + audio prompt: "Want to keep going, or start over?"
  Pre-recorded ElevenLabs clip, cached with the other JJ clips (see
  `getAudioBatchSafe` pattern, Kidshub.js:2838).
- Two 80×80px buttons side by side: a glowing green "▶" (continue) and a pink "🔄"
  (start over). No text.
- Default selection is Continue — if JJ taps anywhere off the buttons for 8 seconds,
  auto-continue. Matches the pre-K design spec's "8-12 minute attention span, 80x80
  touch targets" guidance.
- If the resume would drop JJ back into an activity she already fully completed
  (server saw `finishedAt` but client crashed before advancing), adopt the run and
  re-render at `ActivityIndex + 1` so she doesn't repeat the same screen.

### "Play Again" semantics

Current behavior: `replaySession()` (SparkleLearning.html:2837) wipes
`completedActivities` and re-renders activity 0. The previous session's stars stay
saved to KH_History, but everything activity-level is lost.

New semantics: Play Again = **start a new run, do not resume.**

- `replaySession()` calls `completeLessonRunSafe(oldRunId, {status: 'completed',
  completionReason: 'play_again_replaced'})` on the current run. This freezes it.
- Immediately generates a new `runId` and starts a fresh run with
  `startLessonRunSafe`.
- Both runs are visible in the data — the old one has
  `completionReason: 'play_again_replaced'`, the new one starts at 0.
- Rings on the replay run: the existing per-kid/source/day dedupe in
  `kh_awardEducationPoints_` stays. Second run earns 0 rings. Intentional — prevents
  farming. LT can adjust later by switching `kh_awardEducationPoints_` to dedupe by
  `runId` instead of source/day if desired (documented as an Open Question).

### Idempotency

- `runId` is generated client-side. If the client crashes before the first save, the
  run never existed — no rollback needed.
- `startLessonRun_` is an **upsert** on `RunId`: if a row already exists for that runId,
  return the existing one unchanged. Prevents duplicate rows on double-init.
- `saveLessonRunState_` is an **atomic upsert** on `RunId`: it always overwrites the
  whole row for that runId. The client sends the full state blob each time (not
  patches). Last-save-wins per runId. Double-tap on "correct" → same blob saved twice
  → single row.
- Network retries: the same payload replayed produces the same row. The server never
  inspects "is this a duplicate" — it just writes.
- Concurrent saves for the same `runId` are serialized through `acquireLock_()` with
  `waitLock(30000)`. The sheet write itself is O(1) row lookup via a runId → rowIndex
  cache (see Implementation section).

### Backward compat

Nothing existing breaks:

- `kh_awardEducationPoints_` stays wired and unchanged. `awardRingsSafe(kid, amount,
  source)` still works from existing HTML.
- `saveProgressSafe` stays wired. The SparkleLearning `showSessionComplete` call at
  line 2780 is left in place during Phase 2 rollout (dual-write). Phase 3 removes it.
- `logSparkleProgressSafe` → Notion stays wired during Phase 2. Phase 3 evaluates
  whether it's still needed (see Open Questions).
- `submitHomeworkSafe` / `approveHomeworkSafe` are untouched by Phase 1/2. Homework
  wiring (Task 1 extension for Buggsy) happens in a separate follow-up spec.
- `KH_MissionState` / daily-missions behavior is untouched. Daily-missions continues
  to write mission tile state. The tile tick-off is independent of the completion
  contract — "JJ finished her Sparkle mission" (daily-missions) and "JJ completed
  runId X" (this spec) are separate records that correlate by date+child+module.
- Parent reporting (`getWeekProgress_`, ProgressReport.html) keeps reading KH_History
  during Phase 2. Phase 3 migrates it.

### Server function signatures

All live in `Kidshub.js` alongside `saveMissionState_`. Safe wrappers added to
`Code.js` `serveData` whitelist (Code.js:407) and to the `Tbmsmoketest.js` wiring
check list (Tbmsmoketest.js:56).

```js
// Start or resume a run. Idempotent — calling twice with the same runId is a no-op.
// meta = { module, subject, source, activityCount, clientMeta }
// Returns { ok, runId, startedAt, isNewRun, activityIndex }
function startLessonRun_(child, runId, meta) { ... }
function startLessonRunSafe(child, runId, meta) { ... }

// Atomic upsert of run state. Always writes the full state blob.
// state = { activityIndex, sessionStars, activitiesJSON, completionReason? }
// Returns { ok, lastSavedAt }
function saveLessonRunState_(runId, state) { ... }
function saveLessonRunStateSafe(runId, state) { ... }

// Read the most recent in_progress run for this child+module+today. Also sweeps any
// stale (>6h) in_progress runs to abandoned on read.
// Returns the run object or null.
function getLessonRunResume_(child, module) { ... }
function getLessonRunResumeSafe(child, module) { ... }

// Finalize a run. Sets CompletedAt, Status='completed', CompletionReason.
// Idempotent on runId — re-calls return the existing completed state.
// final = { completionReason: 'finished'|'play_again_replaced'|'explicit_exit'|'abandoned_timeout',
//           sessionStars, activitiesJSON, activityIndex }
// Returns { ok, completedAt, sessionStars, dedupedAward }
function completeLessonRun_(runId, final) { ... }
function completeLessonRunSafe(runId, final) { ... }
```

`completeLessonRun_` is the single boundary with `kh_awardEducationPoints_`. It calls
it once per run with `(child, sessionStars, source + '|' + runId.slice(0,8))` so the
UID dedupe key still lives at kid/source/day granularity (current behavior) but the
history row carries the runId fragment for traceability.

### Client integration points

**SparkleLearning.html:**

- Add `generateRunId_()` (ES5 UUID v4 via `Math.random()`) near the existing
  `TBM_TEST_MODE` block (line 570).
- In `loadContent` (where the day content is fetched) — after content loads, call
  `getLessonRunResumeSafe` and show the resume screen or start fresh.
- In `startSession`/`showReadyScreen` — call `startLessonRunSafe` when JJ taps Go.
- In `advanceActivity` (line 1625) — after the local `completedActivities.push(...)`,
  fire `saveLessonRunStateSafe` with the full blob.
- In `handleCelebrationDone`/`showSessionComplete` (line 2766) — replace the ad-hoc
  `saveProgressSafe`/`awardRingsSafe`/`logSparkleProgressSafe` triple with a single
  `completeLessonRunSafe` call. Phase 2 keeps the legacy triple alongside for safety.
- In `replaySession` (line 2837) — finalize the current run with
  `completionReason='play_again_replaced'`, generate a new runId, call
  `startLessonRunSafe`, re-render activity 0.
- Add a `beforeunload` handler + 20s periodic timer, both firing the same
  `saveLessonRunStateSafe` payload.

**daily-missions.html:**

- No functional change in Phase 1/2. daily-missions owns tile tick-off
  (`KH_MissionState`), not lesson content.
- Phase 3 optional: show a "▶ resume" indicator on the Sparkle tile if the server
  reports an in-progress run. Not a blocker.

**HomeworkModule.html, reading-module, writing-module, fact-sprint, comic-studio,
investigation-module, wolfkid-cer:**

- Out of scope for this spec. Each uses its own backend path
  (`submitHomeworkSafe`, `saveProgressSafe`, `logQuestionResultSafe`). A follow-up
  spec extends the completion contract to Buggsy modules once JJ is shipped.

### Flag gate

Introduce `TBM_LESSON_RUNS_ENABLED` in `Code.js` top-level constants, read from
Script Properties (`LESSON_RUNS_ENABLED=1`). `startLessonRun_` and its siblings all
early-return `{ok: true, flagged_off: true}` when the flag is off. Client reads the
flag through `getBootstrap_` (or similar startup payload) so the HTML can skip the
integration entirely.

Default: off. LT flips it in Script Properties once spec lands.

## Sample code

Full implementation is out of scope for this spec, but the critical upsert loop
needs to be unambiguous. ES5-compatible since these sit in the shared `.js` server
code (which CAN use modern JS) — but the client-side UUID generator is HTML, so
it's shown in ES5.

```js
// Kidshub.js — server side, V8 OK
function _runIdRowCache_() {
  if (!this._runIdRows) this._runIdRows = {};
  return this._runIdRows;
}

function saveLessonRunState_(runId, state) {
  var lk = acquireLock_();
  if (!lk.acquired) return JSON.stringify({ status: 'locked' });
  try {
    var ss = getKHSS_();
    var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['KH_LessonRuns']) || 'KH_LessonRuns';
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) return JSON.stringify({ status: 'error', message: 'KH_LessonRuns not found' });

    var rowIdx = _findRunRow_(sheet, runId);
    if (rowIdx < 0) return JSON.stringify({ status: 'error', message: 'Unknown runId — call startLessonRun first' });

    var lastSaved = new Date().toISOString();
    // Columns: 8=LastSavedAt, 11=ActivityIndex, 13=SessionStars, 14=ActivitiesJSON
    sheet.getRange(rowIdx, 8).setValue(lastSaved);
    sheet.getRange(rowIdx, 11).setValue(state.activityIndex || 0);
    sheet.getRange(rowIdx, 13).setValue(state.sessionStars || 0);
    sheet.getRange(rowIdx, 14).setValue(JSON.stringify(state.activitiesJSON || []));
    stampKHHeartbeat_();
    return JSON.stringify({ status: 'ok', lastSavedAt: lastSaved });
  } finally {
    lk.lock.releaseLock();
  }
}
```

```html
<!-- SparkleLearning.html — ES5 only, HTML surface -->
<script>
function generateRunId_() {
  // RFC4122 v4 — ES5 compatible
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    var v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

var currentRunId = generateRunId_();
var lastSaveAt = 0;

function saveRunThrottled_() {
  var now = Date.now();
  if (now - lastSaveAt < 5000) return;
  lastSaveAt = now;
  var blob = {
    activityIndex: currentActivityIndex,
    sessionStars: totalStars,
    activitiesJSON: completedActivities
  };
  if (TBM_TEST_MODE) { return; }
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withFailureHandler(function(e) { console.error('Run save:', e); })
      .saveLessonRunStateSafe(currentRunId, blob);
  }
}
</script>
```

## Trade-offs considered

### Alternative 1 — Per-activity rows instead of one-row-per-run

Store one row in `KH_LessonRuns` per activity completed. Columns: RunId, Child, Module,
ActivityIndex, Type, StartedAt, FinishedAt, StarsEarned.

**Rejected because:**

- A 10-activity session would write 10 rows under 10 lock acquisitions. Current lock
  budget (`waitLock(30000)`) plus 6-minute execution cap plus Sheets write latency
  (~200ms per write on KH workbook) means a bad day burns 2+ seconds per activity.
  JJ's 10-minute session would bottleneck on writes.
- Resume queries become an aggregation (`SELECT * WHERE runId=? ORDER BY activityIndex`)
  instead of a single row lookup.
- Idempotency story gets harder: re-saves of the same activity need a composite key
  `(runId, activityIndex)` and a per-activity upsert loop.

The one-row-per-run + JSON blob approach is used because SparkleLearning activities
are small (3–15 total per run) and the JSON blob fits comfortably in a single cell.
If a single run ever exceeds ~40 activities (implausible for pre-K), this becomes a
problem worth revisiting.

### Alternative 2 — Client-side localStorage as the source of truth, server sync as backup

Save everything to `localStorage` on every event, fire-and-forget a single sync to
the server every 30 seconds. Resume reads from `localStorage`.

**Rejected because:**

- The primary use case LT cares about is "JJ started on her S10 FE, walked away, and
  now wants to finish on the same tablet." But she also sometimes switches devices
  (JJ home iPad, the spare S10). localStorage is per-device; the server must be the
  source of truth for cross-device resume.
- localStorage on Fully Kiosk / Fire TV WebView has been flaky — the chore surface
  already had to work around quota warnings (daily-missions.html uses it but falls
  back to server state, `loadMissionStateFromServer`, line 1189). Doubling down on it
  for lesson state invites the same class of bugs.
- Parent reporting would need to read the server anyway, so the server path has to
  exist. Having localStorage as an additional cache (not the truth) is fine, but the
  authoritative record lives on the Sheet.

The adopted model: server is authoritative, client does an optimistic
`localStorage.setItem('lessonrun_' + runId, blob)` alongside the server save as a
resilience layer (not a primary path). If the server save fails and `beforeunload`
fires, the localStorage copy is picked up on next load and re-synced.

### Alternative 3 — Reuse `KH_Education` for JJ

Extend the existing `KH_Education` sheet (currently Buggsy homework only) to carry
JJ SparkleLearning runs. Add a `Module` discriminator.

**Rejected because:**

- `KH_Education`'s columns are shaped for the homework approval workflow: `Status`
  has the values `auto_approved`/`pending_review`/`approved`/`returned`, and there's
  a `GeminiFeedback` column for the AI review pipeline. JJ's Sparkle runs are never
  reviewed by Gemini and don't need parent approval — they'd all sit in
  `auto_approved`, carrying dead columns.
- The homework approval UI (`getEducationQueue_` + Parent Dashboard) filters on
  `status='pending_review'` and would ignore Sparkle rows, but there's a high
  tripwire risk — any future query that assumes "every `KH_Education` row represents
  a gradable homework" breaks.
- Separating lesson runs from homework submissions also matches the mental model:
  "runs" are the flight recorder, "homework" is the graded artifact. Buggsy's future
  integration keeps `KH_Education` for the graded submission and adds a `RunId` FK
  column linking back to `KH_LessonRuns`.

## Rollout plan

Phase 1 — **Data model + server functions, dark.** (1 PR)

- Add `KH_LessonRuns` entry to `TAB_MAP` in Dataengine.js.
- Add the 6 new functions to `Kidshub.js` (`startLessonRun_`, `saveLessonRunState_`,
  `getLessonRunResume_`, `completeLessonRun_` + Safe wrappers).
- Register Safe wrappers in `Code.js` `serveData` (Code.js:407 area) and in
  `Tbmsmoketest.js` wiring check (line 56).
- Add `TBM_LESSON_RUNS_ENABLED` flag read from Script Properties.
- Add sheet tab via `ensureKHLessonRunsTab_()` (same pattern as
  `ensureKHEducationTab_()` at Kidshub.js:3559).
- No HTML changes. Flag is off by default.
- Gate 1 passes (wiring), Gate 3 passes (versions), smoke/regression pass.

Phase 2 — **SparkleLearning integration, flag-gated, dual-write.** (1 PR)

- Implement client changes in SparkleLearning.html (resume screen, autosave,
  beforeunload, play-again-replaces-run).
- Keep the existing `saveProgressSafe`/`logSparkleProgressSafe`/`awardRingsSafe`
  calls alongside — dual-write mode. If the new path fails, the legacy path still
  captures the session.
- LT flips `LESSON_RUNS_ENABLED=1` in Script Properties → JJ dogfoods for 5–7 days.
- Monitor `KH_LessonRuns` for data health + `KH_History` for drift between the two
  representations.

Phase 3 — **Cutover.** (1 PR)

- Remove the legacy `saveProgressSafe` and `logSparkleProgressSafe` client-side calls
  from SparkleLearning. Keep `awardRingsSafe` (it's still the ring grant path — it's
  called from inside `completeLessonRun_` now).
- Migrate parent reporting (`getWeekProgress_`, ProgressReport.html) to read
  `KH_LessonRuns` first, falling back to `KH_History` for historical data.
- Remove the flag gate; new path becomes default.

Phase 4 — **Buggsy extension.** (separate spec)

- Apply the same model to `HomeworkModule.html`, `reading-module`, `writing-module`,
  `fact-sprint`, etc. `KH_Education` gains a `RunId` column and each homework row
  links back to a `KH_LessonRuns` entry.
- Out of scope for this spec.

## Migration plan for existing data

No retroactive backfill. Historical `KH_History` rows with
`event_type='education_progress'` stay as-is. The Phase 3 parent reporting change
does a UNION read: new data from `KH_LessonRuns`, historical data from `KH_History`.
After 30 days of new data, the historical window for Progress Report is short enough
that the UNION is unnecessary and can be dropped.

Optional one-time backfill: a one-off Script Editor function
`migrateLessonRunsFromHistory_()` that walks `KH_History` rows with
`event_type='education_progress'` and synthesizes a `KH_LessonRuns` row per day with
`Status='completed'`, `CompletionReason='legacy_backfill'`, and
`ActivitiesJSON='[]'`. Executes once, logs the count, does not re-run. Useful only
if the progress report team wants a clean single-source-of-truth without the UNION.

## Verification plan (Gate 4 manifest for this spec)

```
grep -n "KH_LessonRuns" Dataengine.js           → expected: 1 TAB_MAP entry
grep -n "startLessonRun_" Kidshub.js            → expected: function definition
grep -n "saveLessonRunState_" Kidshub.js        → expected: function definition
grep -n "getLessonRunResume_" Kidshub.js        → expected: function definition
grep -n "completeLessonRun_" Kidshub.js         → expected: function definition
grep -n "startLessonRunSafe" Code.js            → expected: whitelist entry
grep -n "saveLessonRunStateSafe" Code.js        → expected: whitelist entry
grep -n "completeLessonRunSafe" Code.js         → expected: whitelist entry
grep -n "LESSON_RUNS_ENABLED" Code.js           → expected: flag read
grep -n "currentRunId" SparkleLearning.html     → expected: client UUID state
grep -n "saveLessonRunStateSafe" SparkleLearning.html → expected: client integration
grep -n "LessonRuns" Tbmsmoketest.js            → expected: Safe wrapper check
```

## Gate 5 feature verification checklist

| # | Check | Pass condition |
|---|-------|----------------|
| 1 | `KH_LessonRuns` tab created | Sheet exists with correct headers after first call |
| 2 | Start run | Row appears with `Status='in_progress'`, `ActivityIndex=0` |
| 3 | Autosave on advance | `LastSavedAt` updates within 5s of activity transition |
| 4 | beforeunload save | Row reflects latest state when tablet closes mid-session |
| 5 | Resume screen shows | If `Status='in_progress'` exists for today, resume UI renders on load |
| 6 | Resume continues | Tapping "▶" loads SparkleLearning at `ActivityIndex`, not 0 |
| 7 | Start Over replaces | Tapping "🔄" marks old run `abandoned` and starts new runId |
| 8 | Play Again replaces | In-session "Play Again" marks run `play_again_replaced`, new runId |
| 9 | Complete terminal | On finish, `Status='completed'`, `CompletedAt` set, `CompletionReason='finished'` |
| 10 | Ring dedupe preserved | Second run same day earns 0 rings (current dedupe intact) |
| 11 | Flag off → no-op | With `LESSON_RUNS_ENABLED` unset, no writes to `KH_LessonRuns` |
| 12 | Stale sweep | `in_progress` runs older than 6h auto-flip to `abandoned` on next resume read |
| 13 | Idempotent saves | Replaying the same payload produces a single row, not duplicates |
| 14 | Client runId format | `currentRunId` matches `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/` |
| 15 | ES5 compliant | No banned patterns in SparkleLearning.html after integration |

## Open questions for LT review

1. **Ring dedupe strategy.** Current plan keeps `kh_awardEducationPoints_`'s daily
   dedupe — replay runs earn 0 rings. Alternative is to dedupe by `runId` so
   legitimate re-runs also grant rings. The anti-farming argument says keep the
   daily dedupe. Is that the right call for JJ, given she's 4 and "farming" isn't
   really a behavior she's doing?

2. **Stale threshold.** 6 hours is a guess — long enough for "she started after
   breakfast, came back after nap," short enough to not resurface yesterday's
   abandoned run. Should the threshold be tunable per-child or are we fine with a
   constant?

3. **Cross-device resume.** If JJ starts on the S10 FE and walks to the spare
   tablet, the new device reads the in-progress run from the server and offers
   resume. Do we want this or should resume be device-local? Cross-device adds a
   small risk that two tablets open simultaneously can race on saves (last-write-
   wins, so no data corruption, but the earlier device's state gets overwritten).

4. **Daily-missions tile integration.** Should the Sparkle tile on daily-missions
   show a "▶ resume" indicator when an in-progress run exists? Not a blocker for
   Phase 1/2 but affects the tile tick-off semantics. Current behavior: the tile
   flips to "done" when JJ taps it; with this spec, the tile could flip to "done"
   only when `CompletionReason='finished'`.

5. **`logSparkleProgressSafe` → Notion retention.** With `KH_LessonRuns` as the
   source of truth, do we still need to write to the Notion Sparkle DB? It's used
   for LT's Notion-based reporting. Keeping it is cheap; removing it shrinks write
   latency. Should Phase 3 drop the Notion write or keep it for LT's dashboards?

6. **Subject field.** `Subject` is today a client-decided string
   (`lettersCompleted.length > 0 ? 'Letters' : 'Numbers'` in SparkleLearning.html:
   2790). It would be more robust to derive it from the curriculum content itself
   (`content.subject` or the dominant activity type). Source of truth question — is
   this in scope here or does it belong with the Vocab Catalog spec (Task 3) which
   also touches curriculum metadata?

---

**Definition of done for implementation (future session):**

- All 15 Gate 5 items green on staging
- Dogfood window: ≥5 JJ sessions on the real S10 FE with flag enabled, no drift
  between `KH_LessonRuns` and `KH_History`
- Parent Dashboard shows identical weekly numbers pre/post cutover
- Rollback path tested: flipping the flag off mid-session doesn't corrupt
  in-progress data; client falls back to legacy path on next load
