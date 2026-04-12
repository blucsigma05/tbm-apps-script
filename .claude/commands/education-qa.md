---
name: education-qa
description: >
  Systematic QA protocol for education surfaces in the Thompson family platform.
  Use this skill when testing SparkleLearning, daily-missions, HomeworkModule, reading-module,
  writing-module, fact-sprint, investigation-module, or any education surface for curriculum
  correctness, save/load behavior, progress tracking, notification delivery, and cross-day
  state persistence. Triggers on: education QA, curriculum testing, sparkle QA, does it save,
  progress test, notification check, education bugs, QA walkthrough education, test curriculum,
  verify saves, day 2 test, session persistence, sparkle broken, games glitchy.
---

# Education QA Skill — Thompson Platform
**Every lesson must save. Every notification must fire. Every screen must work on day 2.**

## Cardinal Rule
> Never declare an education surface "working" based on a single session.
> The minimum test is: complete a session, close the app, reopen the next day,
> verify state persisted, verify "done" activities are locked, verify new activities load.

---

## Test Environment Setup

### Sandbox Mode (ALWAYS use for QA)
```
Base URLs:
  JJ Sparkle:    thompsonfams.com/sparkle?sandbox=1
  JJ Missions:   thompsonfams.com/daily-adventures?sandbox=1
  Buggsy Missions: thompsonfams.com/daily-missions?sandbox=1
  Buggsy Homework: thompsonfams.com/homework?sandbox=1
  Parent Dashboard: thompsonfams.com/parent?sandbox=1
```

- Sandbox mode prefixes child name with `sandbox-` — all writes isolated from production
- Golden banner confirms sandbox active: "SANDBOX MODE — writes are isolated from production"
- Reset sandbox between test runs: call `resetSandboxSafe()` from GAS editor

### QA Harness (for advanced testing)
- **Clock override**: `setClockOverride('2026-04-08T06:00:00')` — freeze time for day-specific tests
- **Scenarios**: `loadQAScenario('education-pending-review')` — pre-seeds education state
- **Snapshot/restore**: `snapshotQAState('before-test')` / `restoreQAState('before-test')`
- All QA functions require `TBM_ENV=qa` — will throw in production

### Device Viewports
| Surface | Device | Viewport |
|---------|--------|----------|
| JJ Sparkle / Daily Adventures | Samsung S10 FE | 1200x1920 |
| Buggsy Daily Missions | Surface Pro 5 | 1368x912 |
| Buggsy KidsHub | Samsung A9 tablet | 800x1340 |
| Parent Dashboard | Samsung S25 phone | 412x915 |

---

## QA Protocol — Sparkle Learning (JJ)

### Gate 1: Visual Inspection
Walk every game type. For each:
- [ ] Background is themed (not plain solid color)
- [ ] Game assets have gradients/highlights (not flat SVG shapes)
- [ ] Entry animations play on screen load
- [ ] Touch targets are minimum 48px
- [ ] Text is readable at device viewport
- [ ] Theme matches loading screen aesthetic (Sparkle Kingdom)

**Game types to check** (all 18):
`letter_intro`, `find_letter`, `find_number`, `count_with_me`, `quantity_match`,
`color_hunt`, `shape_match`, `pattern_next`, `letter_sound`, `beginning_sound`,
`letter_trace`, `number_trace`, `audio_story`, `color_sort`, `more_or_less`,
`name_builder`, `sparkle_challenge`, `free_draw`

### Gate 2: Audio Consistency
For each game type:
- [ ] Instruction audio plays (Nia voice, not robot)
- [ ] No mid-activity voice switch (Nia → Web Speech → Nia)
- [ ] Correct answer audio fires
- [ ] Wrong answer audio fires (gentle, not punishing)
- [ ] Celebration audio plays at session complete
- [ ] No dead air (loading indicator while audio fetches)

### Gate 3: Save/Load Cycle
1. Start a curriculum session (sandbox mode)
2. Complete 3 activities
3. Note total stars earned
4. Close browser tab
5. Reopen the same URL
6. Verify:
   - [ ] Total stars restored to previous count
   - [ ] Letters completed array preserved
   - [ ] Session can continue or shows appropriate state
   - [ ] Console has no errors on reload

### Gate 4: Cross-Day Persistence
1. Complete a full session on "Day 1" (use clock override if needed)
2. Advance clock to "Day 2" (`setClockOverride` next day)
3. Reload the app
4. Verify:
   - [ ] Previous day's progress is saved (not lost)
   - [ ] New day's curriculum loads (different activities)
   - [ ] "All done" state from Day 1 does NOT carry to Day 2
   - [ ] Stars are cumulative (Day 1 + Day 2)
   - [ ] Completed letters persist across days

### Gate 5: Curriculum Progression
1. Check curriculum tab has data for test child
2. Verify Day 1 activities match CurriculumSeed.js Week 1 Monday
3. Complete Day 1 fully
4. Advance to Day 2 — verify new activities (Tuesday content)
5. Advance to Day 5 (Friday) — verify week wraps
6. Advance to Week 2 — verify new week content loads
7. Check:
   - [ ] Activity types match curriculum definition
   - [ ] 10-activity cap enforced (not 15+)
   - [ ] Unknown activity types don't crash (skip silently)
   - [ ] Focus letters/numbers match weekly theme

### Gate 6: Notification Delivery
1. Complete a homework submission (Buggsy sandbox)
2. Check within 30 seconds:
   - [ ] Pushover notification received (both LT and JT)
   - [ ] Message includes child name + subject
   - [ ] Status correct: "Auto-graded" or "Needs your review"
3. For Sparkle Learning (JJ):
   - [ ] Verify `logSparkleProgressSafe()` fires (check Notion)
   - [ ] Note: Sparkle does NOT have Pushover yet — verify this gap

### Gate 7: Edge Cases
- [ ] Tap a completed activity — should not re-trigger or double-save
- [ ] Rapidly tap answer options — should not double-count
- [ ] Kill app mid-activity — reopen should recover gracefully
- [ ] No internet — should show error state, not blank screen
- [ ] Complete all activities — "All Done" / celebration screen appears
- [ ] After "All Done" — "Play Again" resets session, not cumulative progress

---

## QA Protocol — Daily Missions

### JJ-Specific Checks
- [ ] `?child=jj` route loads JJ schedule (not Buggsy)
- [ ] Sparkle Kingdom theme applied (purple gradient, not dark grid)
- [ ] Loading screen: cartwheel animation, orbiting dots, "Hi JJ!"
- [ ] Games launch to `/sparkle` with correct `activity=` parameter
- [ ] Celebration includes particle effects (check for `!isJJ()` bug)
- [ ] "All Done" banner shows "YAY! ALL DONE!" text
- [ ] Day 2: previous day's missions reset, new day loads fresh

### Buggsy-Specific Checks
- [ ] Default route loads Buggsy schedule
- [ ] Wolfdome theme applied (dark grid, scan lines, neon)
- [ ] Loading screen: Mach Turbo Light character, speedometer
- [ ] Games launch to varied modules (`/homework`, `/reading`, `/writing`, etc.)
- [ ] Ring burst particles fire on "All Done"
- [ ] Dynamic schedule loads from backend (not just hardcoded)

### Cross-Child Checks
- [ ] Sandbox mode works for both children
- [ ] Mission state saves for both (localStorage + server)
- [ ] Both get separate `todayKey` entries (no cross-contamination)

---

## QA Protocol — Homework Module (Buggsy)

### Submission Flow
1. Load homework module in sandbox mode
2. Answer multiple choice questions
3. Write open-ended response (>20 chars)
4. Submit
5. Verify:
   - [ ] MC auto-graded immediately (score shown)
   - [ ] Open-ended marked "pending_review" (not auto-approved)
   - [ ] Pushover notification fires
   - [ ] KH_Education row created with correct data
   - [ ] Gemini feedback generated (check column 12 after ~30 seconds)
   - [ ] Rings awarded for MC portion
   - [ ] Parent Dashboard shows pending review item

### Parent Approval Flow
1. Open Parent Dashboard (sandbox mode)
2. Find pending submission
3. Approve
4. Verify:
   - [ ] Status changes to "approved"
   - [ ] Remaining rings awarded
   - [ ] Pushover notification to child

---

## Reporting Format

After each QA run, document findings as:

```
## QA Run — [Surface] — [Date]
**Environment**: Sandbox / Production
**Device**: [viewport]
**Clock**: [real time / override to YYYY-MM-DD]

### PASS
- [item]: [what worked]

### FAIL
- [item]: [what broke] — [expected vs actual] — [severity P1/P2/P3]

### BLOCKED
- [item]: [why it couldn't be tested]

### Screenshots
- [description]: [screenshot reference]
```

---

## Known Issues to Verify Status

| ID | Issue | Surface | Expected State |
|----|-------|---------|---------------|
| 1 | Day 2 "all done" doesn't reset | daily-missions | OPEN — investigate server-side |
| 2 | JJ celebration particles blocked | daily-missions:1462 | OPEN — `!isJJ()` guard |
| 3 | Voice switching Nia/robot | SparkleLearning | OPEN — audio load race condition |
| 4 | No "back to Sparkle Kingdom" nav | SparkleLearning | OPEN — no exit nav after session |
| 5 | Sparkle has no Pushover | SparkleLearning | BY DESIGN — needs implementation |
| 6 | No curriculum lock | SparkleLearning | BY DESIGN — needs state machine |
| 7 | Activity type aliases | SparkleLearning | P3 — silent skip on unknown type |
