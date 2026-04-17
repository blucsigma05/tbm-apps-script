---
name: adhd-accommodations
description: ADHD accommodation rules for Buggsy's homework surfaces — question sequencing, pacing, feedback tone, and timer constraints.
---

# ADHD Accommodations — Buggsy Homework Surfaces

Rules sourced from Smart but Scattered framework and applied to HomeworkModule, daily-missions, and fact-sprint surfaces.

---

## Line 63 — 3-2-1 Rule (Question Sequencing)

**Maximum 3 consecutive same-type questions** in any homework sequence.

- Types are: `multiple_choice`, `computation`, `word_problem`, `error_analysis`, `multi_step`, `open_ended`, `short_answer`, `why_question`, `visual`, `real_world`, `fill_blank`, `griddable`, `estimation`
- Count resets when question type changes
- When a run hits 3 and the next question is the same type: insert a micro-pause before the next question (not instead of it)
- **Implementation:** `checkSameTypePause_(q, idx)` in `HomeworkModule.html` — fires at multiples of 3 when `allQs[idx+1].type === q.type`

## Line 80 — Timer Constraint (No Countdowns)

**Count-up timers only on homework surfaces.** Countdown timers create performance anxiety and hyperfocus on the clock.

- Exception: `/facts` (Fact Sprint) — countdown is the core mechanic
- Homework Module: session timer counts UP (ExecSkills floating timer)
- Daily Missions: no per-mission timer visible to student

---

## Brain-Break Pattern (every 4 questions)

- `_brainBreakAfter = 4` in HomeworkModule
- Fires `showBrainBreak()` which shows 30s overlay with movement prompt
- Timer auto-dismisses; "I'M DONE" button also works
- Counter resets to 0 after each brain break

## Same-Type Micro-Pause Pattern (3-2-1 rule enforcement)

- Fires `showSameTypePause_()` — no auto-timer, student-controlled dismiss
- Overlay color: amber (`#f59e0b`) — distinct from brain-break purple
- z-index: 9001 (above brain-break overlay at 9000 in case of edge overlap)
- Message includes count of remaining same-type questions ahead
- "READY — KEEP GOING" dismiss button

---

## Feedback Tone

- **Wrong answers:** amber/warning palette only — no red
- **Correct answers:** green confirmation + audio celebration
- Error journal on Monday only (Metacognition skill — review errors once, move on)

---

## Surfaces This Applies To

| Surface | File | Applies |
|---------|------|---------|
| Homework Module | `HomeworkModule.html` | All rules |
| Daily Missions | `daily-missions.html` | Timer rule + no same-type run enforcement at mission level |
| Fact Sprint | `fact-sprint.html` | Countdown exception applies here |
| Investigation | `investigation-module.html` | Timer rule only |
| Writing Module | `writing-module.html` | Timer rule only |
