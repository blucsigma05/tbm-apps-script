---
name: parent-reporting
description: >
  Design patterns for parent-facing education progress reporting. Use this skill
  when building, reviewing, or auditing ProgressReport.html, the KidsHub parent
  dashboard, or any parent-visible education data. Covers what data to surface,
  alert thresholds, trend calculations, dashboard design, and notification
  strategy. Grounded in 2024-2025 EdTech learning analytics research.
  Trigger on: parent dashboard, progress report, parent view, education alerts,
  weekly digest, growth tracking, mastery visibility, trend arrows, parent
  notification, education push.
---

# Parent Reporting Skill — Education Progress Visibility

**Context:** Thompson family platform. Two parents (LT, JT). Two kids (Buggsy 4th grade, JJ Pre-K).
**Surfaces:** ProgressReport.html (route: /progress), KidsHub parent view (route: /parent)
**Data sources:** KH_Education, KH_History, KH_LessonRuns, QuestionLog

---

## Core Principle: Parents Are Not Data Analysts

> 85% of parents gave low marks (5/10 or below) to tracking progress across
> multiple apps. Parents want answers, not data. — 2025 EdTech consolidation study

**Every parent-facing metric must answer ONE of these questions:**
1. "Is my kid doing the work?" → Completion rate, streak, daily activity log
2. "Is my kid learning?" → Accuracy trend, mastery %, standards progress
3. "Does my kid need help?" → Alerts, declining trends, missed work
4. "What's next?" → Upcoming curriculum, scheduled assessments

If a metric doesn't answer one of these, it doesn't belong on the dashboard.

---

## Data Hierarchy (What to Show, In What Order)

### Level 1: Glanceable (Parent opens app, sees in <3 seconds)
| Metric | Source | Calculation |
|--------|--------|-------------|
| **Today's status** | KH_Education + KH_LessonRuns | "Done", "In progress", "Not started" |
| **This week's completion** | KH_Education count / 5 | Percentage bar |
| **Active streak** | KH_History unique days | Consecutive days with activity |
| **Alerts** (if any) | Computed from below rules | Red badge count |

### Level 2: Weekly Summary (Parent taps to see detail)
| Metric | Source | Calculation |
|--------|--------|-------------|
| **Sessions completed** | KH_Education rows this week | Count |
| **Overall accuracy** | QuestionLog correct/total this week | Percentage |
| **By subject** | QuestionLog grouped by Subject | Per-subject accuracy % |
| **Pending review** | KH_Education where Status='pending_review' | Count + age |
| **Daily log** | KH_Education grouped by day | Mon-Fri status grid |
| **Rings/Stars earned** | KH_History education events | Sum |

### Level 3: Growth View (Parent wants trends)
| Metric | Source | Calculation |
|--------|--------|-------------|
| **Week-over-week trend** | QuestionLog last 2 weeks | Arrow: up/down/flat per subject |
| **Standards mastery** | QuestionLog grouped by TEKS code | % correct per standard |
| **Vocabulary exposure** | KH_LessonRuns activitiesJSON | Words seen this week vs target (4-5/word) |
| **Time engagement** | KH_LessonRuns startedAt/completedAt | Minutes per session, avg per week |

### Level 4: Deep Dive (Parent wants specific answers)
| Metric | Source | Calculation |
|--------|--------|-------------|
| **Question-level results** | QuestionLog full rows | Which Qs right/wrong, time per Q |
| **Curriculum coverage** | CurriculumSeed + QuestionLog | TEKS heat map (green=mastered, yellow=in progress, red=gap) |
| **Historical progress** | QuestionLog 4+ weeks | Sparkline per subject |
| **Baseline comparison** | BaselineDiagnostic results | Current vs. initial assessment |

---

## Trend Calculation Rules

### Week-Over-Week Accuracy Trend
```
thisWeek = QuestionLog correct/total where date in current week
lastWeek = QuestionLog correct/total where date in previous week

if (thisWeek - lastWeek >= 10): arrow = UP (green), label = "Improving"
if (thisWeek - lastWeek <= -10): arrow = DOWN (red), label = "Needs attention"
else: arrow = FLAT (gray), label = "Steady"

Edge cases:
- No data last week: show "New this week" instead of trend
- No data this week: show "No activity" with amber warning
- Fewer than 5 questions either week: show "Not enough data" (don't compute from 2 Qs)
```

### Standards Mastery Levels
```
>= 80% correct on a TEKS code (min 5 questions): MASTERED (green)
50-79% correct: IN PROGRESS (yellow)
< 50% correct: NEEDS WORK (red)
< 5 questions answered: NOT YET ASSESSED (gray)
```

### Streak Calculation
```
streak = count consecutive calendar days (Mon-Fri only) with at least 1 KH_Education or KH_LessonRuns entry
Weekend days are NOT counted (don't break streak)
Public school holidays: configurable exclusion list (optional future feature)
```

---

## Alert Engine Rules

### When to Alert Parents (Push Notification via Pushover)

| Alert | Trigger | Priority | Recipient |
|-------|---------|----------|-----------|
| **Streak broken** | No activity today AND had streak >= 3 days | CHORE_APPROVAL (0) | BOTH |
| **Pending review > 48h** | KH_Education pending_review row older than 48 hours | CHORE_APPROVAL (0) | BOTH |
| **Accuracy drop** | Subject accuracy down > 15% week-over-week (min 5 Qs each week) | CHORE_APPROVAL (0) | BOTH |
| **Weekly digest** | Sunday 6pm — summary of both kids' week | HYGIENE_REPORT_LOW (-1) | BOTH |
| **Assessment ready** | Every 4th/8th week assessment results available | CHORE_APPROVAL (0) | BOTH |
| **Milestone achieved** | JJ: new letter mastered / Buggsy: TEKS standard mastered | CHORE_APPROVAL (0) | BOTH |

### When NOT to Alert
- Don't alert for daily completion (too noisy — parent checks ProgressReport)
- Don't alert for individual wrong answers (micromanagement)
- Don't alert on weekends (no expected activity)
- Don't alert if kid is on a school break (configurable calendar)

---

## Dashboard Layout Design

### ProgressReport.html Structure

```
┌─────────────────────────────────────────┐
│ HEADER: "Weekly Progress" + week label   │
│ TAB BAR: [Overview] [Buggsy] [JJ]       │
├─────────────────────────────────────────┤
│ ALERT BAR (if any alerts, red/amber)     │
│ "2 items need attention"                 │
├─────────────────────────────────────────┤
│ STAT CARDS (glanceable, 2x2 grid):       │
│ ┌──────────┐ ┌──────────┐               │
│ │ Sessions │ │ Accuracy │               │
│ │   3/5    │ │   78% ↑  │               │
│ └──────────┘ └──────────┘               │
│ ┌──────────┐ ┌──────────┐               │
│ │  Streak  │ │ Pending  │               │
│ │  7 days  │ │  1 item  │               │
│ └──────────┘ └──────────┘               │
├─────────────────────────────────────────┤
│ SUBJECT BREAKDOWN:                       │
│ Math:    ████████░░ 82% ↑               │
│ Science: ██████░░░░ 65% →               │
│ Reading: ████████░░ 78% ↓               │
│ Writing: [Pending review]                │
├─────────────────────────────────────────┤
│ DAILY LOG:                               │
│ Mon ✅  Tue ✅  Wed ⏳  Thu ·  Fri ·     │
├─────────────────────────────────────────┤
│ CURRICULUM PREVIEW (optional):           │
│ "This week: Fractions + Forces + Poetry" │
└─────────────────────────────────────────┘
```

### Color Coding
| Status | Color | Icon |
|--------|-------|------|
| Completed | Green (#22C55E) | Check mark |
| In progress | Amber (#F59E0B) | Hourglass |
| Pending review | Blue (#3B82F6) | Eye |
| Missed | Red (#EF4444) | X |
| Not yet | Gray (#64748B) | Dot |
| Improving | Green | Up arrow |
| Declining | Red | Down arrow |
| Steady | Gray | Right arrow |

---

## JJ-Specific Reporting

### Current State (Blocked)
JJ's detailed progress is blocked on KH_LessonRuns Phase 2 (per-session tracking for SparkleLearning). Until then, show:
- Stars this week (from KH_History)
- Day streak
- "Detailed progress coming soon" placeholder with tier marker

### Target State (After Phase 2)
| Metric | Source | Display |
|--------|--------|---------|
| Letters mastered | KH_LessonRuns activitiesJSON | Progress bar: 8/26 letters |
| Numbers mastered | KH_LessonRuns | Progress bar: 5/20 numbers |
| Colors known | KH_LessonRuns | Color dots (filled = known) |
| Shapes known | KH_LessonRuns | Shape icons (filled = known) |
| Name progress | Milestone metadata | "Can identify K, I, N, D" → "Can write KINDLE" |
| Session count | KH_LessonRuns | Sessions this week |
| Activity accuracy | KH_LessonRuns per-activity correct field | % correct on letter/number finding |

### Age-Appropriate Framing
- Don't show percentages for JJ (Pre-K parent doesn't need "63% on letter recognition")
- Show milestones: "JJ learned 2 new letters this week: L and E!"
- Show progress toward goal: "8 of 26 letters mastered — Phase 1 complete!"
- Show engagement: "JJ played 4 Sparkle sessions this week (target: 5)"

---

## Parent Notification Format

### Push Notification Templates

**Weekly Digest (Sunday 6pm):**
```
Thompson Weekly Education Report
Buggsy: 4/5 sessions, 78% accuracy (↑ from 71%), 8-day streak
JJ: 3/5 sessions, letters K-I-N-D mastered, 5-day streak
1 item pending review
```

**Streak Broken:**
```
Streak Alert: [Child]'s [N]-day streak ended
No education activity recorded today. A new streak starts tomorrow!
```

**Accuracy Drop:**
```
Heads Up: [Child]'s [Subject] accuracy dropped
This week: 62% | Last week: 78%
Check ProgressReport for details
```

**Milestone:**
```
[Child] Achievement!
JJ mastered letter E — that's 6 of 26!
Buggsy mastered TEKS 4.3E (adding fractions) — 82% accuracy
```

---

## Anti-Patterns

1. **Don't show raw data** — "47 QuestionLog rows this week" means nothing. Show "4/5 sessions complete."
2. **Don't compare siblings** — Never show "Buggsy is ahead of JJ." They're different ages and grades.
3. **Don't show grades** — Show mastery levels (mastered/in progress/needs work). A/B/C/D/F triggers anxiety.
4. **Don't over-alert** — Maximum 2 push notifications per day for education. Digest on Sunday covers the rest.
5. **Don't require login** — Parent dashboard accessible via /parent route without additional auth (Cloudflare proxy handles access).
6. **Don't mix education and chores** — ProgressReport is education only. Chore approval stays in KidsHub parent view.

---

## Applying This Skill

When building or reviewing parent-facing education reporting:
1. Check every metric against the 4 parent questions (doing work? learning? need help? what's next?)
2. Verify glanceable metrics load in <3 seconds (no heavy computation on page load)
3. Confirm trend calculations have minimum-data guards (don't compute from 2 questions)
4. Check alert thresholds are reasonable (not too noisy, not too quiet)
5. Verify JJ view shows milestones, not percentages
6. Confirm no sibling comparison exists anywhere in the UI
7. Check push notification frequency (max 2/day, digest on Sunday)

Sources:
- [Multi-modal Learning Analytics Dashboard in K-12 — Springer (2025)](https://link.springer.com/article/10.1186/s40561-025-00410-4)
- [Learning Analytics Dashboard for K-12 Teachers — ACM (2024)](https://dl.acm.org/doi/10.1145/3631700.3665228)
- [Primary School Teacher Perspectives on Dashboard Use — JLA](https://learning-analytics.info/index.php/JLA/article/view/8493)
- [Co-Developing Easy-to-Use LADs: Human-Centered Design — MDPI](https://www.mdpi.com/2227-7102/13/12/1190)
- [2025 EdTech Trends K-12 Leaders Should Act On — Solved Consulting](https://www.solvedconsulting.com/blog/2025-edtech-trends-every-k-12-leader-should-act-on-now)
