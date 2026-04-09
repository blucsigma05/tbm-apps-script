# Parent Reporting De-Stub Scope — What's Real Today, What's Blocked

**Owner:** Opus (spec), Code (build), Codex (audit), LT (gate)
**Priority:** P1 for the "authoritative today" scope, P2 for Task-1-blocked items
**Status:** Draft — Architecture Review
**Scope:** ProgressReport.html + `getWeeklyProgressSafe` + the implicit contract
between them

---

## Problem

The parent-facing weekly progress report is labeled a "stub" in code comments
but behaves like a Frankenstein: the backend returns real data that the UI
normalizes against an older mock shape. Neither side is the authoritative
source, and the UI's fallback hides backend drift because it silently swaps
in zeros when the shape doesn't match.

**Verified by source read:**

`getWeeklyProgressSafe` — `Kidshub.js:2917-3037`:

```js
/**
 * v29: Progress report data stub — called by ProgressReport.html.
 * Returns skeleton data structure. Wire to real sheet data when
 * KH_Homework and KH_SparkleProgress sheets have data flowing.
 */
function getWeeklyProgressSafe() { ... }
```

The comment says "stub" but the body actually:

1. Reads `KH_History` (line 2936) and sums rings + chores by child + week
2. Reads `KH_Education` (line 2941) for Buggsy homework — modules, pending
   review, MC accuracy
3. Computes a consecutive-day streak from unique dates
4. Returns `{ buggsy: {...}, jj: {...} }` with these fields per child:
   - `child` — `'buggsy'` or `'jj'`
   - `weekLabel` — `'Week of 4/6'`
   - `choresCompleted` — int
   - `ringsEarned` — int
   - `questionsAnswered` — int (= modules completed)
   - `accuracy` — float 0..1 (only populated for Buggsy MC modules)
   - `streakDays` — int
   - `topSubject` — string (most-frequent subject this week)
   - `pendingReview` — int

**What the UI actually expects** — `ProgressReport.html:899-929` `useMockData()`:

```js
buggsy: {
  name: 'Buggsy',
  ringsThisWeek: 0,
  ringsTotal: 0,
  streak: 0,
  completionRate: 0,
  sessionsCompleted: 0,
  sessionsTotal: 5,
  avgScore: 0,
  timeSpent: 0,
  subjects: [],          // array of {name, score, total}
  weekLog: [],           // array of {day, status, score}
  alerts: []             // array of {text, severity}
},
jj: {
  name: 'JJ (Kindle)',
  starsThisWeek: 0,
  starsTotal: 0,
  streak: 0,
  completionRate: 0,
  sessionsCompleted: 0,
  sessionsTotal: 5,
  milestones: [],        // array of {name, status}
  weekLog: [],
  alerts: []
}
```

**The shape drift bridge** — `ProgressReport.html:580-587`:

```js
// Normalize field names — handle both real backend shape and mock shape
var rings = b.ringsThisWeek !== undefined ? b.ringsThisWeek : (b.ringsEarned || 0);
var streak = b.streak !== undefined ? b.streak : (b.streakDays || 0);
var done = b.sessionsCompleted !== undefined ? b.sessionsCompleted : (b.questionsAnswered || 0);
var total = b.sessionsTotal || 5;
var avgPct = b.avgScore !== undefined ? Math.round(b.avgScore) : (b.accuracy !== undefined ? Math.round(b.accuracy * 100) : null);
var completion = b.completionRate !== undefined ? b.completionRate : Math.min(100, Math.round((done / total) * 100));
var pending = b.pendingReview || 0;
```

Every field has two names and the UI handles both. This is drift made visible.

**What silently fails today:**

- JJ has **no `KH_Education` rows** — SparkleLearning writes to `KH_History` via
  `saveProgress_` (Kidshub.js:3292) with `event_type='education_progress'`. The
  backend `getWeeklyProgressSafe` loop at line 2981 is keyed on `KH_Education`,
  so JJ's `questionsAnswered` is always 0. The UI shows "0/5 Sessions" for JJ
  every single week, even when she runs SparkleLearning daily.
- `weekLog`, `subjects`, `alerts`, `milestones` — the backend returns none of
  these fields. The UI falls back to empty arrays, which render as "no data"
  states.
- `ringsTotal`, `starsTotal` — the backend returns `ringsEarned` (week only).
  "Total rings" across the child's history is never computed. UI falls back
  to 0.
- `timeSpent` — no source anywhere. Always 0.

**Net:** The report runs, doesn't crash, shows Buggsy mostly-right numbers,
shows JJ mostly-zero. Nothing flags the difference. LT doesn't know which
fields are real and which are zeros because the mock fallback matches the
failure mode exactly.

## Design — three-tier classification

Each field falls into one of three tiers:

### Tier A — authoritative today from existing data (Phase 1)

These fields can be populated fully and correctly right now. Phase 1 of this
spec rewrites `getWeeklyProgressSafe` to return the UI's expected shape for
these fields and removes the UI normalization bridge for them.

| Field | Source | Notes |
|-------|--------|-------|
| `ringsThisWeek` | `KH_History` — sum of `Points` where `Event_Type ∈ {completion, approval, education}` and date in this week | Both children. Current backend computes as `ringsEarned`; just rename. |
| `streak` | `KH_History` — consecutive unique days with any `completion`/`approval`/`education` row | Both children. Current `streakDays` renamed. |
| `sessionsCompleted` (Buggsy) | `KH_Education` — count of rows this week where `Child='buggsy'` | Current `questionsAnswered` renamed. |
| `sessionsTotal` (Buggsy) | Fixed = 5 (Mon–Fri curriculum schedule) | Could be read from curriculum schedule if needed; 5 works now. |
| `pendingReview` (Buggsy) | `KH_Education` — count of rows with `Status='pending_review'` and `Child='buggsy'` | Unchanged — backend already returns this. |
| `avgScore` (Buggsy) | `KH_Education` — average of `Score` column for auto-graded rows this week | Rewrite: current `accuracy` uses rings/8 heuristic which only works for specific modules. Real average from the `Score` column is more honest. |
| `weekLog` (Buggsy, partial) | `KH_Education` — group rows by date, one entry per Mon-Fri with `{day, status, score}` | New field. Can be computed today. |
| `subjects` (Buggsy) | `KH_Education` — group rows by `Subject` column, accumulate `{name, score, total}` | New field. Can be computed today. |
| `completionRate` (Buggsy) | `(sessionsCompleted / sessionsTotal) * 100`, capped at 100 | Currently computed client-side. Move to server for consistency. |

### Tier B — blocked on Task 1 (JJ Completion Contract)

These fields need a real per-activity record for JJ. `KH_LessonRuns` (from
Task 1 spec) is the source. Phase 2 of this spec lands after Task 1 merges.

| Field | Needs | Why it's blocked |
|-------|-------|------------------|
| `sessionsCompleted` (JJ) | `KH_LessonRuns` — count of runs with `Child='jj'`, `Status='completed'`, this week | Today JJ writes to `KH_History` with one `education_progress` row per day (aggregated), not one per lesson. |
| `sessionsTotal` (JJ) | 5 (Mon-Fri JJ schedule) | Fixed value — not blocked, but paired with sessionsCompleted. |
| `avgScore` (JJ) | `KH_LessonRuns.activitiesJSON` — compute correct/total ratio across activities | No per-activity record exists today. |
| `weekLog` (JJ) | `KH_LessonRuns` grouped by date | Same — no per-day granularity today. |
| `milestones` (JJ) | Derived from `KH_LessonRuns.activitiesJSON` — "first time nailing K recognition", "first 5-star round", etc. | Requires activity-level semantic tagging that only exists post-Task-1. |
| `subjects` (JJ) | `KH_LessonRuns.subject` or derived from activity types | Current backend has no subject field for JJ at all. |

### Tier C — needs data not yet collected (Phase 3+)

| Field | Gap |
|-------|-----|
| `ringsTotal` / `starsTotal` | Historical lifetime totals. Would need an all-time scan of `KH_History` (slow) or a denormalized totals cache. Decide if it's worth the cost. |
| `timeSpent` | Needs activity duration tracking. Depends on Task 1's `activitiesJSON` `startedAt`/`finishedAt` fields. |
| `alerts` | Needs a rules engine: "streak broken", "3 days since last session", "pending review > 2 days old". Can be written once the underlying fields are real (Phases 1-2). |

## Design — Phase 1 rewrite of `getWeeklyProgressSafe`

Rewrite the function to return the UI's expected shape (not the current
drifted shape) for all Tier A fields. Leave Tier B fields as `null` or empty
arrays with an explicit `tierB_blocked: true` marker so the UI can render a
"Coming soon" indicator instead of silently showing zeros.

**New shape:**

```js
{
  weekLabel: 'Week of 4/6',
  weekStart: '2026-04-06',
  weekEnd: '2026-04-12',
  buggsy: {
    name: 'Buggsy',
    // Tier A (real)
    ringsThisWeek: 42,
    streak: 3,
    sessionsCompleted: 2,
    sessionsTotal: 5,
    completionRate: 40,
    avgScore: 85,
    pendingReview: 1,
    weekLog: [
      { day: 'Mon', status: 'done',    score: 90 },
      { day: 'Tue', status: 'done',    score: 80 },
      { day: 'Wed', status: 'pending', score: null },
      { day: 'Thu', status: 'none',    score: null },
      { day: 'Fri', status: 'none',    score: null }
    ],
    subjects: [
      { name: 'Math',    score: 2, total: 2 },
      { name: 'Science', score: 1, total: 1 }
    ],
    // Tier B (blocked markers for client UI)
    tierB_blocked: false,  // Buggsy is NOT blocked — he has real data
    // Tier C (future)
    ringsTotal: null,
    timeSpent: null,
    alerts: []
  },
  jj: {
    name: 'JJ (Kindle)',
    // Tier A (real — only these exist)
    // Codex review 2026-04-09: JJ uses stars* naming consistently, NOT
    // ringsThisWeek. This preserves the LT-approved "keep the split" — Buggsy
    // is rings*, JJ is stars*. Half-migration risk: if any code path writes
    // jj.ringsThisWeek, the UI renders blank. Enforced in _buildChildReport_
    // below and in Gate 5 checklist item 16.
    starsThisWeek: 8,       // from KH_History education rings (named stars for JJ)
    streak: 2,              // streak is shared semantics across children
    // Tier B (blocked)
    sessionsCompleted: null,
    sessionsTotal: 5,
    completionRate: null,
    weekLog: [],
    subjects: [],
    milestones: [],
    tierB_blocked: true,    // JJ IS blocked until Task 1 lands
    tierB_reason: 'jj-lesson-run-data-model',
    // Tier C
    starsTotal: null,
    timeSpent: null,
    alerts: []
  },
  meta: {
    generatedAt: '2026-04-09T12:00:00Z',
    source: 'KH_History + KH_Education',
    blockedTierB: ['jj']
  }
}
```

**Phase 1 code changes:**

1. `Kidshub.js` — rewrite `getWeeklyProgressSafe` body. Keep the function name.
   Remove the "stub" doc comment — the function is no longer a stub for
   Buggsy. Add a new doc comment describing the tier classification and
   pointing at this spec.

2. `ProgressReport.html` — delete the normalization bridge at lines 580-587.
   The UI assumes the new shape. Add a "Coming soon" UI state for JJ that
   renders when `tierB_blocked === true`.

3. `ProgressReport.html` `useMockData()` (line 899) — keep it as a fallback
   for when `getWeeklyProgressSafe` throws, but update the mock shape to
   match the new tier-classified shape. Keep the all-zeros pattern but add
   `tierB_blocked: true` for JJ so the mock and the real shape look the same
   to the renderer.

4. Add `getWeeklyProgressVersion() { return 2; }` alongside the function so
   client can feature-detect.

### Why return `null` instead of `0` for Tier B fields

`0` is a valid data point ("zero sessions completed this week"). `null`
signals "we don't have the data at all." The UI renders these differently:

```js
if (b.sessionsCompleted === null) {
  html += '<div class="placeholder">Not yet tracked</div>';
} else {
  html += '<div>' + b.sessionsCompleted + '/' + b.sessionsTotal + ' Sessions</div>';
}
```

This prevents the silent-zero bug: LT can't look at "0/5 Sessions" for JJ and
think "she didn't do any work this week" when the real answer is "we don't
track it."

## Migration path

### Phase 1 (ships now — unblocked)

- Rewrite `getWeeklyProgressSafe` to the tier-classified shape
- Add Buggsy `weekLog` + `subjects` aggregation from `KH_Education`
- Remove the `ProgressReport.html` normalization bridge
- Add "Not yet tracked" UI placeholder for null fields
- Add `tierB_blocked` indicator at the UI child-section level
- Update `useMockData()` shape to match the real shape (not drift anymore)
- Smoke + regression pass

### Phase 2 (ships after Task 1 merges — blocked)

- JJ `sessionsCompleted` / `sessionsTotal` from `KH_LessonRuns`
- JJ `weekLog` from `KH_LessonRuns` grouped by date
- JJ `subjects` from `KH_LessonRuns.subject`
- JJ `milestones` from `KH_LessonRuns.activitiesJSON` semantic tagging
- Flip `jj.tierB_blocked = false`
- Parent dashboard shows real JJ numbers for the first time

### Phase 3 (Tier C — independent follow-ups)

- `ringsTotal` / `starsTotal` — decide if an all-time scan or a
  denormalized cache is the right pattern. Probably cache, refreshed weekly.
- `timeSpent` — derived from `KH_LessonRuns.activitiesJSON` start/end
  timestamps. Requires Task 1 Phase 2.
- `alerts` rules engine — streak break, session overdue, review overdue.
  Straightforward once underlying data is real.
- Vocab exposure count per week (blocked on Task 3 Phase 4 — which itself
  depends on Task 1).

### Phase 4 (polish)

- Per-child "historical" view: past 4 weeks trend
- Exportable PDF (nice-to-have for LT's records)
- Email digest (weekly summary auto-sent to LT + JT)

## Trade-offs considered

### Alternative 1 — Ship Phase 1 + Phase 2 together after Task 1

Wait for Task 1 (JJ Completion Contract) to merge, then rewrite
`getWeeklyProgressSafe` fully. Avoids shipping a partial state.

**Rejected because:**
- Buggsy has real Tier A data today. Withholding the Buggsy improvements
  until JJ is ready punishes Buggsy's reporting for JJ's blocker.
- The "stub" label has been in the code for months. Making it partially real
  now with a clear marker of what's still pending is more honest than leaving
  the whole function labeled "stub" and then suddenly flipping a switch.
- Phase 1 can land this week. Phase 2 ships when Task 1 lands. Parallelism.

### Alternative 2 — Compute JJ data from the fragmented stores today

Today's `KH_History` has `event_type='education_progress'` rows for JJ (one
per day, aggregated by `saveProgress_`). Could derive a "sessions completed"
count from that.

**Rejected because:**
- One row per day ≠ one row per session. JJ could run SparkleLearning twice
  on a given day and only one row gets written. "Sessions completed" from
  this source would be wrong by the right amount (too low).
- The answer is still "we don't have per-session data for JJ." Computing a
  wrong answer from a fragmented source and calling it right is the kind of
  thing that creates long-lived reporting drift.
- Waiting for `KH_LessonRuns` to be the source is the right call.

### Alternative 3 — Delete `ProgressReport.html` and use parent-section of KidsHub

Merge the weekly report into the Parent Dashboard view of KidsHub. One fewer
file to maintain.

**Rejected because:**
- `/progress` is already a bookmarked link for LT. Removing it breaks muscle
  memory.
- Parent Dashboard of KidsHub is task-approval focused ("what do I need to
  sign off on right now"). Progress Report is reflection-focused ("how was
  the week"). Different mental modes deserve different surfaces.
- Merging them blocks future polish work on Progress Report (PDF export,
  email digest).

## Sample code

### New `getWeeklyProgressSafe` (Kidshub.js rewrite)

```js
/**
 * v30: Parent-facing weekly progress report data.
 * Tier A fields (real): populated from KH_History and KH_Education.
 * Tier B fields (blocked): return null with tierB_blocked=true for JJ until
 *   Task 1 (JJ Completion Contract) lands KH_LessonRuns.
 * Tier C fields (future): lifetime totals, time tracking, alerts.
 * See specs/parent-reporting-scope.md for the full tier classification.
 */
function getWeeklyProgressSafe() {
  return withMonitor_('getWeeklyProgressSafe', function() {
    var weekBounds = _computeWeekBounds_();

    var buggsy = _buildChildReport_('buggsy', weekBounds, {
      hasKHEducation: true,
      hasKHLessonRuns: false, // will flip to true after Task 1
      tierBBlocked: false
    });

    var jj = _buildChildReport_('jj', weekBounds, {
      hasKHEducation: false, // JJ does not write to KH_Education
      hasKHLessonRuns: false,
      tierBBlocked: true
    });

    return JSON.parse(JSON.stringify({
      weekLabel: weekBounds.label,
      weekStart: weekBounds.startISO,
      weekEnd: weekBounds.endISO,
      buggsy: buggsy,
      jj: jj,
      meta: {
        generatedAt: new Date().toISOString(),
        source: 'KH_History + KH_Education',
        blockedTierB: ['jj'],
        version: 2
      }
    }));
  });
}

function _buildChildReport_(child, bounds, flags) {
  var isJJ = (child === 'jj');
  var pointsSum = _sumRingsThisWeek_(child, bounds); // same query, different label

  var base = {
    name: isJJ ? 'JJ (Kindle)' : 'Buggsy',
    child: child,
    // Tier A — real data
    // Naming split enforced: Buggsy uses rings*, JJ uses stars*.
    // Using conditional keys keeps the backend payload self-consistent and
    // prevents half-migration — if UI code reads jj.ringsThisWeek it gets
    // undefined and the bug is loud, not silent.
    streak: _computeStreak_(child),
    sessionsCompleted: null,
    sessionsTotal: 5,
    completionRate: null,
    avgScore: null,
    pendingReview: 0,
    weekLog: [],
    subjects: [],
    // Tier B (blocked for JJ until Task 1)
    milestones: [],
    tierB_blocked: flags.tierBBlocked,
    tierB_reason: flags.tierBBlocked ? 'jj-lesson-run-data-model' : null,
    // Tier C (future)
    timeSpent: null,
    alerts: []
  };

  if (isJJ) {
    base.starsThisWeek = pointsSum;
    base.starsTotal = null; // Tier C
  } else {
    base.ringsThisWeek = pointsSum;
    base.ringsTotal = null; // Tier C
  }

  if (flags.hasKHEducation) {
    var eduAgg = _aggregateKHEducation_(child, bounds);
    base.sessionsCompleted = eduAgg.count;
    base.completionRate = Math.min(100, Math.round((eduAgg.count / base.sessionsTotal) * 100));
    base.avgScore = eduAgg.avgScore;
    base.pendingReview = eduAgg.pendingReview;
    base.weekLog = eduAgg.weekLog;
    base.subjects = eduAgg.subjects;
  }

  if (flags.hasKHLessonRuns) {
    // Phase 2: merge in JJ data from KH_LessonRuns
    var runsAgg = _aggregateKHLessonRuns_(child, bounds);
    base.sessionsCompleted = runsAgg.count;
    base.completionRate = runsAgg.completionRate;
    base.avgScore = runsAgg.avgScore;
    base.weekLog = runsAgg.weekLog;
    base.subjects = runsAgg.subjects;
    base.milestones = runsAgg.milestones;
    base.tierB_blocked = false;
    base.tierB_reason = null;
  }

  return base;
}
```

Helpers (`_sumRingsThisWeek_`, `_computeStreak_`, `_aggregateKHEducation_`,
etc.) are extractions from the current `getWeeklyProgressSafe` body. Nothing
new — just reshape what's already computed.

### `ProgressReport.html` renderer change

```js
// Replace lines 580-587 normalization bridge
function renderBuggsy(data) {
  var b = data.buggsy;
  var html = '';
  html += '<div class="section-label">WEEKLY STATS</div>';
  html += '<div class="stat-grid">';
  html += buildStatCard(b.ringsThisWeek, 'Rings This Week');
  html += buildStatCard(b.streak, 'Day Streak');
  html += buildStatCard(b.sessionsCompleted + '/' + b.sessionsTotal, 'Sessions');
  html += buildStatCard((b.avgScore !== null ? b.avgScore + '%' : '--'), 'Avg Score');
  if (b.pendingReview > 0) html += buildStatCard(b.pendingReview, 'Needs Review');
  html += '</div>';
  // ... rest unchanged, no more b.ringsThisWeek ? ... : b.ringsEarned drift
}

function renderJJ(data) {
  var j = data.jj;
  var html = '';

  // Render the Tier A data JJ actually has
  html += '<div class="section-label">THIS WEEK</div>';
  html += '<div class="stat-grid">';
  html += buildStatCard(j.ringsThisWeek, 'Stars This Week');
  html += buildStatCard(j.streak, 'Day Streak');
  html += '</div>';

  // If Tier B is blocked, render a clear placeholder instead of silent zeros
  if (j.tierB_blocked) {
    html += '<div class="tier-b-placeholder">';
    html += '<div class="placeholder-title">Detailed Progress Coming Soon</div>';
    html += '<div class="placeholder-sub">JJ\'s per-activity progress tracking is being built. ';
    html += 'Rings and streak are accurate today.</div>';
    html += '</div>';
  } else {
    // Phase 2: JJ has full data
    html += '<div class="section-label">SESSIONS</div>';
    html += buildStatCard(j.sessionsCompleted + '/' + j.sessionsTotal, 'Sessions');
    // ... full render
  }
}
```

## Verification plan (Gate 4 manifest)

```
grep -n "getWeeklyProgressSafe" Kidshub.js        → function definition
grep -n "v30:" Kidshub.js                         → version comment for this rewrite
grep -n "tierB_blocked"         Kidshub.js        → field in returned shape
grep -n "tierB_blocked"         ProgressReport.html → client handles the flag
grep -n "ringsThisWeek"         Kidshub.js        → Tier A field (was ringsEarned)
grep -n "weekLog"               Kidshub.js        → new field populated for Buggsy
grep -n "subjects:"             Kidshub.js        → new field populated for Buggsy
grep -c "ringsEarned"           ProgressReport.html → 0 (normalization bridge removed)
grep -c "b.questionsAnswered"   ProgressReport.html → 0 (normalization bridge removed)
grep -c "streakDays"            ProgressReport.html → 0 (normalization bridge removed)
grep -n "getWeeklyProgressVersion" Kidshub.js     → returns 2
```

## Gate 5 feature verification checklist

| # | Check | Pass condition |
|---|-------|----------------|
| 1 | Backend returns new shape | `getWeeklyProgressSafe()` response has `buggsy.ringsThisWeek`, not `buggsy.ringsEarned` |
| 2 | Buggsy weekLog populated | Array has 5 entries, one per Mon-Fri, with `{day, status, score}` |
| 3 | Buggsy subjects populated | Array of `{name, score, total}` grouped by subject |
| 4 | Buggsy avgScore | `avgScore` is mean of `Score` column, not the rings/8 heuristic |
| 5 | JJ shows real stars + streak | `jj.starsThisWeek` and `jj.streak` are non-zero when JJ did work |
| 6 | JJ shows tierB_blocked marker | `jj.tierB_blocked === true` in Phase 1 |
| 7 | JJ UI renders placeholder | Tier B section shows "Coming soon" text, not silent zeros |
| 8 | Normalization bridge removed | grep for `b.ringsEarned` and `b.streakDays` in ProgressReport.html returns 0 |
| 9 | Mock matches real shape | `useMockData()` returns the tier-classified shape, not the old mock |
| 10 | Version bump | `getWeeklyProgressVersion() === 2` |
| 11 | Doc comment updated | "stub" removed from function comment; tier spec linked |
| 12 | Cache busted on deploy | First call after deploy returns new shape, not cached old shape |
| 13 | ES5 compliant | Client-side changes don't introduce banned patterns |
| 14 | Phase 2 readiness | `_buildChildReport_` accepts `hasKHLessonRuns: true` flag cleanly when Task 1 ships |
| 15 | Smoke + regression pass | `runTests` JSON shows no new failures |
| 16 | Naming split clean | `buggsy.starsThisWeek` is undefined AND `jj.ringsThisWeek` is undefined AND `buggsy.ringsThisWeek` is a number AND `jj.starsThisWeek` is a number. Enforced in `_buildChildReport_` via conditional field assignment. Per Codex non-blocking note 2026-04-09. |

## Open questions for LT review

1. **Mock-data fallback behavior.** Today if the backend throws, the UI
   falls back to `useMockData()` (all zeros). With the new shape, should the
   fallback show "Error loading" instead? Silent zeros hide backend outages.

2. **JJ's ring vs star naming.** Backend uses `ringsThisWeek` generically;
   the UI calls JJ's "Stars This Week" but reads from `ringsThisWeek`. Keep
   the field-name split (`ringsThisWeek` for Buggsy, `starsThisWeek` for JJ)
   or use `pointsThisWeek` / `pointsTotal` generically?

3. **Phase 1 ship timing.** Ships independently as soon as approved (Buggsy
   data is real today). Phase 2 waits for Task 1. Confirm.

4. **`tierB_blocked` removal trigger.** When Task 1 lands and JJ gets real
   data, the `tierB_blocked` flag on JJ flips to false. Should this be a
   manual flip in `_buildChildReport_` (LT deploys the change), or should it
   auto-detect "if `KH_LessonRuns` has any completed rows for JJ this week,
   read from there instead"?

5. **`alerts` rules.** Phase 3 includes an alerts engine. Starter rules:
   - Streak broken (yesterday had activity, today doesn't)
   - Pending review > 48 hours old
   - Sessions completed < 3 by Wednesday
   - Any SparkleLearning error within the last 24 hours
   Add to this list or cut it?

6. **Lifetime totals (Tier C).** All-time `ringsTotal` / `starsTotal`
   requires either an all-time scan or a denormalized cache. Which path?
   - All-time scan: correct, slow (each report call reads all of KH_History)
   - Weekly-refreshed cache: fast, can drift
   - Event-sourced counter: correct, fast, needs schema change

7. **Email digest priority.** Phase 4 mentions an email digest. Does LT want
   it? Weekly, bi-weekly, monthly?

---

**Definition of done:**

- Phase 1 Gate 5 items 1-15 green
- Parent dashboard shows accurate Buggsy numbers for a full week after
  deploy, including `weekLog` and `subjects` breakdown
- JJ section shows real rings/streak and a clear "Coming soon" placeholder
  instead of silent zeros
- `ProgressReport.html` has no normalization bridge (`grep` returns 0)
- Phase 2 ships within 1 week of Task 1 Phase 3 cutover
- No parent-facing regression — existing bookmarks still work, existing
  visual layout preserved
