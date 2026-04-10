# Parent Alert Engine Spec

**Owner:** Opus (spec), Sonnet (build)
**Priority:** P3 — enables proactive parent engagement
**Status:** Draft — Awaiting LT Approval

---

## Problem

Parents have no automated way to know when:
- A child's learning streak is broken
- Homework has been pending review for too long
- Accuracy has dropped significantly
- A milestone was achieved

Currently, parents must manually check ProgressReport or KidsHub. This means
issues go unnoticed and celebrations are missed.

## Goal

Implement an education-focused alert engine using the existing `sendPush_()`
infrastructure in AlertEngine.gs. Maximum 2 education pushes per day to prevent
alert fatigue. Recipient: JT (not LT) for education alerts.

---

## Alert Triggers

### 1. Streak Broken
**Condition:** Child has not completed any education module for >1 calendar day
(excluding weekends).

```
Check: Last completion timestamp in QuestionLog or Homework Tracker
Frequency: Daily check at 6:00 PM (after school/homework time)
Suppress: If Saturday or Sunday (no school)
Priority: CHORE_APPROVAL (0, normal sound)
Message: "[Child] hasn't completed any learning activities today.
         Last activity: [date]. Streak was [N] days."
```

### 2. Pending Review > 48 Hours
**Condition:** An open-ended response (CER, writing, investigation) has been
submitted but not reviewed by a parent for >48 hours.

```
Check: Homework Tracker DB entries with Status="Done" but Grade=empty
       AND completed_at > 48 hours ago
Frequency: Daily check at 7:00 PM
Priority: TILLER_STALE (1, vibrate)
Message: "[Child] has [N] assignment(s) waiting for your review since [date].
         Subjects: [list]"
```

### 3. Accuracy Drop > 15%
**Condition:** A child's accuracy on a specific TEKS standard dropped more than
15 percentage points week-over-week.

```
Check: Compare this week's mastery % vs last week's for each standard
Frequency: Weekly check on Sunday at 5:00 PM
Priority: TILLER_STALE (1, vibrate)
Message: "[Child]'s accuracy on [standard description] dropped from [X]% to [Y]%.
         This may need extra practice or a different approach."
```

### 4. Weekly Digest
**Condition:** Every Sunday evening, send a summary of the week's education activity.

```
Frequency: Sunday at 6:30 PM
Priority: HYGIENE_REPORT_LOW (-1, quiet delivery)
Message: "Weekly Education Digest — [Child]
         Completed: [N] of [M] assigned modules
         Best subject: [subject] ([%]% accuracy)
         Needs attention: [subject] ([%]% accuracy)
         Streak: [N] days
         Total rings earned: [N]"
```

### 5. Milestone Achieved
**Condition:** A child masters a new letter (JJ), a new TEKS standard (Buggsy),
or reaches a ring/star milestone.

```
Check: On every QuestionLog write, check if mastery just crossed 70% threshold
Frequency: Real-time (triggered on question completion)
Priority: CHORE_APPROVAL (0, normal sound)
Message: "[Child] just mastered [milestone]! [celebration emoji]
         JJ: 'Mastered letter M! 9 of 14 letters complete.'
         Buggsy: 'Mastered TEKS 4.3E (Fraction Addition)! 12 of 20 standards.'"
Dedup: Only fire once per milestone (track in MasteryCache)
```

---

## Rate Limiting

**Maximum 2 education pushes per day** to prevent alert fatigue.

Implementation:
```javascript
var EDU_PUSH_LIMIT = 2;
var EDU_PUSH_CACHE_KEY = 'edu_push_count_' + Utilities.formatDate(new Date(), 'CST', 'yyyy-MM-dd');

function canSendEduPush_() {
  var count = parseInt(CacheService.getScriptCache().get(EDU_PUSH_CACHE_KEY) || '0');
  return count < EDU_PUSH_LIMIT;
}

function recordEduPush_() {
  var cache = CacheService.getScriptCache();
  var count = parseInt(cache.get(EDU_PUSH_CACHE_KEY) || '0');
  cache.put(EDU_PUSH_CACHE_KEY, String(count + 1), 86400);
}
```

**Priority order when rate-limited:**
1. Accuracy Drop (most urgent — something is wrong)
2. Pending Review (action needed from parent)
3. Streak Broken (awareness)
4. Milestone Achieved (celebration — can wait)
5. Weekly Digest (always sends — uses separate HYGIENE priority)

Note: Weekly Digest does NOT count against the daily limit (it's a different
alert tier and fires on a fixed schedule).

---

## Integration Points

### Existing Infrastructure
- `sendPush_(recipient, title, message, priority)` in AlertEngine.gs
- `PUSHOVER_PRIORITY.*` constants for priority levels
- Recipients: `"JT"` for education alerts
- GAS time-based triggers for scheduled checks

### New Functions

```javascript
// In AlertEngine.gs or new EducationAlerts.gs

function checkEduStreaks_() {
  // Query last completion per child
  // If > 1 weekday since last completion, fire streak alert
}

function checkPendingReviews_() {
  // Query Homework Tracker for ungraded assignments > 48h old
  // Fire pending review alert
}

function checkAccuracyDrops_() {
  // Compare this week vs last week mastery per standard
  // Fire accuracy drop alert if > 15% decline
}

function sendWeeklyDigest_() {
  // Compile weekly stats per child
  // Send digest push
}

function checkMilestones_(child, teksCode, newMasteryPct) {
  // Called after every QuestionLog write
  // Check if mastery just crossed 70% threshold
  // If so, fire milestone alert (deduplicated)
}
```

### GAS Triggers (LT installs)

| Time | Function | Purpose |
|------|----------|---------|
| 6:00 PM CST | `checkEduStreaks_()` | Streak broken check |
| 7:00 PM CST | `checkPendingReviews_()` | Pending review check |
| Sunday 5:00 PM CST | `checkAccuracyDrops_()` | Weekly accuracy check |
| Sunday 6:30 PM CST | `sendWeeklyDigest_()` | Weekly digest |
| (real-time) | `checkMilestones_()` | Called from question logging |

---

## Priority Mapping

| Alert | Pushover Constant | Value | Behavior |
|-------|-------------------|-------|----------|
| Milestone Achieved | `CHORE_APPROVAL` | 0 | Normal sound |
| Streak Broken | `CHORE_APPROVAL` | 0 | Normal sound |
| Weekly Digest | `HYGIENE_REPORT_LOW` | -1 | Quiet delivery |
| Pending Review > 48h | `TILLER_STALE` | 1 | Vibrate (high) |
| Accuracy Drop > 15% | `TILLER_STALE` | 1 | Vibrate (high) |

---

## Message Examples

### Streak Broken
```
Title: Learning Streak Alert
Body: Buggsy hasn't completed any learning activities today.
      Last activity: Monday June 15. Streak was 8 days.
```

### Pending Review
```
Title: Homework Awaiting Review
Body: Buggsy has 2 assignment(s) waiting for your review since June 13.
      Subjects: Writing (CER), Science (Investigation)
```

### Accuracy Drop
```
Title: Accuracy Alert — Buggsy
Body: Buggsy's accuracy on Fraction Addition (4.3E) dropped from 80% to 62%.
      This may need extra practice or a different approach.
```

### Weekly Digest
```
Title: Weekly Education Digest — Buggsy
Body: Completed: 8 of 10 assigned modules
      Best subject: Science (85% accuracy)
      Needs attention: Math Fractions (55% accuracy)
      Streak: 12 days
      Total rings earned: 47
```

### Milestone (JJ)
```
Title: Milestone! JJ mastered letter M!
Body: JJ just mastered letter M! 9 of 14 letters complete.
      Next up: S, T, O, C
```

### Milestone (Buggsy)
```
Title: Milestone! Buggsy mastered Fraction Addition!
Body: Buggsy just mastered TEKS 4.3E (Fraction Addition)!
      12 of 20 standards mastered this semester.
```

---

## Open Questions

1. **Should the alert engine live in AlertEngine.gs or a new EducationAlerts.gs?**
   AlertEngine.gs already handles finance/system alerts. Education alerts are
   a different domain. **Recommendation:** New file `EducationAlerts.gs` that
   imports from AlertEngine.gs (uses `sendPush_()` and priority constants).

2. **Should rate limiting be per-child or global?** Two kids could both trigger
   alerts on the same day. **Recommendation:** Per-child limit of 2/day. This
   means a max of 4 education pushes total (2 per kid).

3. **Weekend handling for streak alerts?** Should streaks count weekend days?
   **Recommendation:** No. Only count Mon-Fri. Weekend learning is bonus, not
   required. Don't fire streak alerts on Sat/Sun.
