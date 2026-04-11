# Mastery Gates Spec

**Owner:** Opus (spec), Sonnet (build)
**Priority:** P3 — enables adaptive difficulty
**Status:** Draft — Awaiting LT Approval

---

## Problem

QuestionLog is wired and data flows in, but nothing consumes it. Every student
gets the same difficulty regardless of performance. There is no mechanism to:
- Track per-standard mastery
- Adjust difficulty based on performance
- Surface mastery data in ProgressReport
- Gate content progression on demonstrated understanding

## Goal

Implement mastery-based progression: compute per-standard mastery from QuestionLog,
set difficulty tiers via BaselineDiagnostic, and surface mastery data in ProgressReport
with child-appropriate displays (trend arrows for Buggsy, milestones for JJ).

---

## Data Model

### QuestionLog (existing sheet tab — assumed schema)

| Column | Type | Description |
|--------|------|-------------|
| timestamp | DateTime | When the question was answered |
| child | String | "buggsy" or "jj" |
| module | String | Source module (homework, fact-sprint, etc.) |
| teksCode | String | TEKS standard (e.g., "4.3E") |
| questionId | String | Unique question ID from curriculum |
| correct | Boolean | Whether the answer was correct |
| difficulty | String | "easy", "medium", "hard" |
| responseTime | Number | Seconds to answer |

### MasteryCache (new, computed — stored in sheet or CacheService)

| Column | Type | Description |
|--------|------|-------------|
| child | String | "buggsy" or "jj" |
| teksCode | String | TEKS standard |
| totalQuestions | Number | Total attempts on this standard |
| correctCount | Number | Number correct |
| masteryPct | Number | correctCount / totalQuestions * 100 |
| masteryLevel | String | "not_assessed", "needs_work", "in_progress", "mastered" |
| currentDifficulty | String | "easy", "medium", "hard" |
| lastUpdated | DateTime | Last computation time |

---

## Core Functions

### `getStandardMastery_(child, teksCode)`

Computes mastery percentage from QuestionLog for a specific child + TEKS code.

```
Input:  child="buggsy", teksCode="4.3E"
Output: {
  teksCode: "4.3E",
  totalQuestions: 12,
  correctCount: 9,
  masteryPct: 75,
  masteryLevel: "mastered",    // >= 75%
  currentDifficulty: "medium",
  trend: "improving",          // comparing last 5 vs previous 5
  lastAttempt: "2026-06-15"
}
```

**Mastery thresholds (per LT direction: 75% — "like the CPA exam"):**
- `>= 75%` = "mastered"
- `50-69%` = "in_progress"
- `< 50%` = "needs_work"
- `< 5 questions` = "not_assessed" (insufficient data)

### `getAllMastery_(child)`

Returns mastery data for ALL TEKS codes a child has attempted.

```
Output: [
  { teksCode: "4.3E", masteryPct: 75, masteryLevel: "mastered", trend: "improving" },
  { teksCode: "4.5D", masteryPct: 45, masteryLevel: "needs_work", trend: "stable" },
  ...
]
```

### `getDifficultyTier_(child, teksCode)`

Returns the appropriate difficulty tier for generating questions.

```
Logic:
  if (masteryPct >= 70) return "hard"
  if (masteryPct >= 50) return "medium"
  return "easy"

  // Override: BaselineDiagnostic sets initial tier
  // If child hasn't taken baseline for this standard, default to "easy"
```

### `computeTrend_(child, teksCode)`

Compares the last 5 attempts vs the previous 5 to determine trend.

```
Logic:
  recent5 = last 5 questions on this standard
  previous5 = the 5 before that
  if (recent5.pct > previous5.pct + 10) return "improving"
  if (recent5.pct < previous5.pct - 10) return "declining"
  return "stable"
```

---

## BaselineDiagnostic Integration

### Current State
BaselineDiagnostic.html exists but does NOT set difficulty tiers. It runs a
diagnostic assessment but the results aren't consumed by the curriculum system.

### Required Changes
1. BaselineDiagnostic writes initial mastery data to MasteryCache:
   - For each TEKS code tested, record the initial score
   - Set `currentDifficulty` based on diagnostic performance
2. Subsequent curriculum modules read `getDifficultyTier_()` to select questions
3. If no diagnostic exists for a TEKS code, default to "easy" (safe start)

---

## ProgressReport Integration

### Buggsy Display (Trend Arrows)
```
Math Standards:
  4.3E Fractions        ████████░░ 75%  ↑ improving
  4.5D Perimeter        ████░░░░░░ 45%  → stable
  4.4B Multi-step       ██████░░░░ 60%  ↓ declining
  4.2A Place Value      █████████░ 90%  ↑ improving

Science Standards:
  4.7A Rocks            ██████████ 100% ★ mastered
  4.8A Water Cycle      ███████░░░ 70%  ↑ improving
```

- Show percentage + trend arrow
- Color: green (mastered), blue (in progress), amber (needs work)
- Trend arrows: ↑ improving, → stable, ↓ declining
- Group by subject

### JJ Display (Milestones, NOT Percentages)
```
Letter Recognition:  K I N D L E J B ✓  |  A M S T O C _ _
                     8 of 14 letters mastered

Number Recognition:  1 2 3 4 5 ✓  |  6 7 8 _ _
                     5 of 10 numbers mastered

Colors:              red blue green ✓  |  yellow purple _
                     3 of 5 colors mastered

Shapes:              circle square ✓  |  triangle star _
                     2 of 4 shapes mastered
```

- Show individual items, not percentages
- Checkmark for mastered items
- Underscore for not-yet-mastered
- Progress expressed as "X of Y mastered"
- No trend arrows (too abstract for pre-K context)

---

## Difficulty Progression Rules

1. **Start easy.** First question on any new standard is always Easy difficulty.
2. **Promote on streak.** After 3 consecutive correct at current tier, promote to next tier.
3. **Demote on struggle.** After 2 consecutive wrong at current tier, demote one tier.
4. **Never skip tiers.** Easy → Medium → Hard. No jumping.
5. **Assessment weeks are fixed.** Week 12, 16, etc. use a fixed mix of difficulties.
6. **Minimum 5 questions** before mastery level affects anything.

---

## Implementation Sequence

1. **Create MasteryCache tab** in TBM workbook (add to TAB_MAP in DataEngine.gs)
2. **Implement `getStandardMastery_()`** in KidsHub.gs or new MasteryEngine.gs
3. **Implement `getDifficultyTier_()`** for curriculum difficulty selection
4. **Update BaselineDiagnostic** to write initial mastery data
5. **Update ProgressReport** with child-specific mastery displays
6. **Wire curriculum modules** to read difficulty tier before serving questions

---

## Open Questions

1. **Should mastery data be cached in CacheService?** QuestionLog could have
   thousands of rows. Computing mastery on every page load would be slow.
   **Recommendation:** Compute on write (when logging a question result) and
   cache in MasteryCache tab. Recompute daily via trigger.

2. **How does mastery interact with week-level curriculum?** Current curriculum
   is pre-generated with fixed questions. Mastery-based difficulty would need
   the serving layer to select appropriate questions at runtime.
   **Recommendation:** Phase 1 = mastery tracking + display only. Phase 2 =
   adaptive question selection.

3. **Should we expose mastery data via the API proxy?** ProgressReport runs
   client-side and needs to fetch mastery data.
   **Recommendation:** Add `getMasteryData(child)` Safe wrapper in Code.gs.
