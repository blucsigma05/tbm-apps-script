# Spec: Friday Review — Missed Day Catch-Up Queue

**Issue:** #410
**Date:** 2026-04-16
**Status:** Implementing

---

## Problem

Friday Review is pre-seeded generic curriculum, not a dynamic rollup of missed content. If Buggsy missed Tuesday + Wednesday, Friday silently walks past the missed material. A kid who misses Wednesday's Food Chains science but aces Friday's 2 generic science questions gets a false green signal. That is a measurement lie and breaks LT-trust.

## Verified On

- `CurriculumSeed.js:1176-1219` — Week 2 Friday has only 2 science questions (predator/prey + hibernation), both from Monday's Animal Adaptations. Wednesday's Food Chains (TEKS 4.9A/4.9B) is not represented.
- `Kidshub.js:3294-3398` — `_aggregateKHEducation_` initializes weekLog with `status: 'missed'` for any past day without a KH_Education row. The data is there; it was never surfaced on Friday.
- 2026-04-16 STAAR incident: Wednesday's Food Chains science got no Friday surfacing before Thursday's test.

## Why It Matters

Friday is the only catch-all chance in the week. Silent Friday = silent weekly miss. Severity:critical per rubric (#378) — directly breaks unsupervised trust and TEKS coverage measurement.

## What Changes

### Server (Kidshub.js v73 → v74)

New functions added after `getTodayContentSafe`:

- `isStaarWindow_()` — returns true if today is Apr 6–30 or Dec 1–11 (Nance STAAR windows per `nance-school-data.md`)
- `hasScience_(dayContent)` — returns true if a day's content has science module questions
- `buildFridayMakeupQueue_(child)` — private; reads weekLog via `_aggregateKHEducation_`, finds missed Mon-Thu days, fetches their content from fullWeek, sorts with STAAR-window science-first priority
- `getFridayMakeupQueueSafe(child)` — public `withMonitor_` wrapper; callable from surface AND diagnostics

No schema changes. Existing `makeupDate` field in `submitHomework_` (added in #409) handles crediting to original day — no server changes needed there.

### Client (HomeworkModule.html)

New state: `_fridayQueue`, `_fridayQueueIndex`, `_isFridayMakeupMode`, `_pendingFridayResponse`

New functions:
- `renderFridayProgressBanner_()` — "CATCH-UP MODE / You missed N days / Day N of N — Wednesday Catch-Up"
- `_advanceFridayQueue_()` — resets per-step state (answers, completionSubmitState, moduleStarted, etc.), loads next MODULE, re-renders all tabs

Modified:
- `loadCurriculumContent()` — on Friday (non-`MAKEUP_MODE`), fires `getFridayMakeupQueueSafe` after `getTodayContentSafe` succeeds; if queue non-empty, builds `_fridayQueue = [...missedDays, fridayStep]`, overrides MODULE to first step, removes generic catch-up banner, calls `init()` then `renderFridayProgressBanner_()`
- `buildHomeworkCompletionPayload_()` — passes `makeupDate = _fridayQueue[_fridayQueueIndex].dayISO` for non-Friday steps
- `submitHomeworkCompletion_()` success handler — localStorage stamps original day ISO; calls `_advanceFridayQueue_()` if more steps remain

## Unknowns

None at build time. All data (weekLog, fullWeek) was already available server-side; this change wires it to the Friday surface.

## LT Decisions Needed

- **Friday credit:** Spec says makeup earns TEKS coverage but does NOT extend streak. Ring award still happens via `kh_awardEducationPoints_` using today's dedup UID — rings are earned for work done today. Original-day ISO only affects KH_Education Timestamp (for weekLog) and localStorage. Confirm this matches intent.
- **No cap on queue depth:** A kid who missed 4 days and shows up Friday sees 5 steps. Hyperfocus catching up is a WIN. Confirm no cap desired.

## Acceptance Tests

1. Load `/homework` on Friday where Buggsy has missed Tuesday + Wednesday → banner shows "You missed 2 days", MODULE = Tuesday content
2. STAAR window active (Apr 6-30): if Wednesday had science, Wednesday sorts before Tuesday
3. Complete Tuesday step → KH_Education row timestamps to Tuesday ISO, surface advances to Wednesday
4. Complete Wednesday → advances to Friday Review
5. Complete Friday Review → normal completion screen, no extra step
6. Friday with zero missed days → no banner, normal Friday Review loads directly
7. `?day=wednesday` on Friday → MAKEUP_MODE active, Friday queue does NOT fire
8. `getFridayMakeupQueueSafe('buggsy')` callable from GAS editor independently

## Evidence After Completion

- [ ] PR #419 green CI
- [ ] `?action=runTests` clean
- [ ] Manual walkthrough on Buggsy's Surface Pro 5 with simulated 2-day-missed week
- [ ] KH_Education row for makeup step shows Tuesday ISO as Timestamp, not Friday

## Codex Review Checklist

- [ ] `buildFridayMakeupQueue_` handles edge case: day exists in weekLog as missed but has no content in fullWeek (skipped via `if (!dayContent || !dayContent.module) continue`)
- [ ] `_advanceFridayQueue_` resets all per-step state (answers, completionSubmitState, completionLogged, moduleStarted, brain break counter)
- [ ] ES5 compliance — no arrow functions, template literals, let/const in HomeworkModule.html
- [ ] `withMonitor_` wrapper on public server function
- [ ] `makeupDate` not sent as empty string when it should be '' — checked: `_fridayQueueIndex < _fridayQueue.length - 1` guard ensures Friday step sends `makeupDate: ''`
