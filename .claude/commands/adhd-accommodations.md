---
name: adhd-accommodations
description: >
  Research-backed ADHD accommodation patterns for educational technology.
  Use this skill when designing, reviewing, or auditing any education surface
  used by Buggsy (4th grade, diagnosed ADHD). Covers executive function
  scaffolding, cognitive load management, feedback timing, chunking strategies,
  break patterns, and visual UX patterns grounded in the Dawson & Guare
  framework (Smart but Scattered) and current EdTech accessibility research.
  Trigger on: ADHD, executive function, attention, chunking, brain break,
  cognitive load, focus, sustained attention, task initiation, scaffolding.
---

# ADHD Accommodation Patterns — Educational Technology

**Framework:** Dawson & Guare (2012), "Smart but Scattered" + "Coaching Students with Executive Skills Deficits"
**Model:** A-B-C — Antecedent (set up environment) → Behavior (teach the skill) → Consequence (motivate with rewards)
**Target user:** Buggsy, 4th grade, diagnosed ADHD. Surface Pro 5 for homework, A9 tablet for chores.

---

## The 11 Executive Skills and How Technology Addresses Each

| Executive Skill | Challenge for ADHD Kids | Technology Accommodation |
|---|---|---|
| **Response Inhibition** | Act before thinking, blurt answers | Mandatory "Plan Your Attack" pause (30s) before questions start. Lock submit button for 3s on MC to prevent impulse tapping. |
| **Working Memory** | Forget instructions mid-task | Persistent instruction bar at top of screen. "Re-read prompt" button always visible. Break multi-step problems into sub-steps. |
| **Emotional Control** | Frustration on wrong answers | Gentle feedback (warm colors, encouraging text, 200ms delay before "try again"). Never use red for wrong — use soft purple or amber. No harsh sounds. |
| **Sustained Attention** | Drift after 5-7 minutes | Maximum 3 consecutive same-type questions (chunk size). Activity variety: alternate MC → visual → word problem → error analysis. Movement break every 4 questions. |
| **Task Initiation** | "I don't know where to start" | Auto-load today's work. No blank screen. Daily missions show exactly what to do. First question is EASY (confidence builder). |
| **Planning/Prioritizing** | Can't sequence steps | "Plan Your Attack" shows all questions first with difficulty labels. Student picks order (or follows recommended sequence). CER = Claim FIRST, then Evidence, then Reasoning. |
| **Organization** | Lose track of work | Progress dots/bar always visible. Star counter shows accumulation. Everything auto-saves. No manual file management. |
| **Time Management** | Time blindness | Time estimates on every module ("~12 min"). Count-up timer (not countdown — countdowns cause anxiety for ADHD kids). Optional "time check" audio cue at halfway point. |
| **Flexibility** | Stuck on one approach | Error analysis questions ("find the mistake" — forces perspective shift). Multiple valid answers on open-ended questions. "Try a different way" hint on second wrong attempt. |
| **Goal-Directed Persistence** | Quit when hard | Ring economy with visible savings goals. Streak tracking with streak-recovery ("You lost your streak, but you can start a new one RIGHT NOW"). Weekly completion bonus (not daily — allows bad days). |
| **Metacognition** | Can't self-evaluate | Monday Error Journal ("WHY did I get this wrong?"). Friday Self-Reflection ("What was hardest? What are you proud of?"). Baseline vs. progress comparison visible in parent dashboard. |

---

## Cognitive Load Management Rules

### The 3-2-1 Rule (per session)
- **3** maximum consecutive same-format questions before switching type
- **2** maximum consecutive text-heavy questions before a visual/interactive one
- **1** brain break every 4 questions (movement, not screen time)

### Question Sequencing for ADHD
```
Q1: Easy recall (confidence builder)
Q2: Easy-medium application
--- variety shift (different question type) ---
Q3: Medium application
Q4: Medium-hard
--- BRAIN BREAK (movement prompt, 30-60 seconds) ---
Q5: Hard synthesis
Q6: Error analysis (metacognitive)
```

### Cognitive Load Reducers
- **Progressive disclosure:** Show one question at a time, not all at once
- **Persistent context:** Keep passage/data visible while answering (split-screen, not page flip)
- **Chunked reading:** Paragraphs numbered, vocab highlighted, "tap to define" tooltips
- **Simplified choices:** Maximum 4 MC options (3 is better for younger kids)
- **Visual anchoring:** Every question card has a colored difficulty badge (green/yellow/orange) so the kid knows what they're getting into

---

## Timer Design for ADHD

### WRONG: Countdown timers
- Creates anxiety and time pressure
- ADHD kids freeze under countdown pressure
- Penalizes slower processing speed (which is executive function, not intelligence)

### RIGHT: Count-up timers with milestones
- Show elapsed time, not remaining time
- Visual milestones: "5 minutes — great pace!" (positive, not pressuring)
- Optional audio cue at halfway point (kid can disable)
- Personal best tracking (compete with yourself, not the clock)
- Fact Sprint exception: countdown is OK here because it's explicitly a speed game and the kid CHOSE to play it

### Timer Configuration
```javascript
scaffoldConfig.adhd = {
  timerMode: "count_up",        // NEVER countdown unless explicitly a speed game
  timerMilestones: [5, 10, 15], // minutes — show encouraging message at each
  timerAudioCue: "halfway",     // optional audio at 50% of time estimate
  timerVisible: true,           // always show, never hide (time awareness is a skill)
  personalBestTracking: true    // "You finished 30s faster than last time!"
}
```

---

## Break Patterns (Research-Backed)

### Brain Break Types
| Type | Duration | When | Example |
|------|----------|------|---------|
| **Movement** | 30-60s | Every 4 questions | "Stand up, 10 jumping jacks, sit down" |
| **Sensory** | 15-30s | After frustrating question | "Close eyes, take 3 deep breaths" |
| **Choice** | 30-60s | Every 6 questions | "Pick: stretch, push-ups, or balance" |
| **Celebration** | 10-15s | On 3-correct streak | Auto-plays ring burst + sound |

### Break Scheduling
- **Fixed breaks:** Every 4 questions regardless of performance
- **Triggered breaks:** After any wrong answer on a "hard" question
- **Earned breaks:** 3-correct streak = celebratory micro-break (10s)
- **No punitive breaks:** NEVER take away a break as consequence

### Movement Break Prompts (Rotate Weekly)
```
Week 1: "Stand up! Do 10 jumping jacks, then sit back down. Ready?"
Week 2: "Quick! Stand up, touch your toes 5 times, then sit back down. GO!"
Week 3: "Movement break! Do 5 high knees on each side, then sit back down."
Week 4: "Brain recharge! Pick: 10 wall push-ups, run in place 20 seconds, or 5 arm circles each way."
Week 5: "Stretch time! Reach for the ceiling, then touch your toes. Do it 3 times."
```

---

## Feedback Timing and Tone

### Correct Answer Feedback
- **Delay:** 0ms (instant — dopamine hit matters for ADHD motivation)
- **Visual:** Green flash + ring burst particles (0.4s animation)
- **Audio:** Short positive clip (0.5-1s, varied — 8 clips rotated to prevent habituation)
- **Text:** Varied praise ("Nice!", "Got it!", "Sharp thinking!", "Wolfkid approved!")
- **Streak bonus:** On 3rd consecutive correct, extra celebration (stars + streak fire emoji)

### Wrong Answer Feedback
- **Delay:** 200ms (brief pause prevents emotional flooding)
- **Visual:** Soft purple highlight (NOT red — red triggers shame/anxiety in ADHD kids)
- **Audio:** Gentle "try again" tone (NOT buzzer or negative sound)
- **Text:** Constructive ("Not quite — here's why..." NOT "Wrong!" or "Incorrect!")
- **Scaffold:** On 2nd wrong attempt, show hint. On 3rd, show correct answer with full explanation.
- **Recovery:** After showing correct, immediately show an easier question (rebuild confidence)

### Session Complete Feedback
- **Always positive:** Even 2/6 correct gets "You stuck with it! That takes real strength."
- **Growth framing:** "Last week you got 3/6. This week 4/6. You're growing!"
- **Ring award:** Always award SOMETHING. Zero rings = zero motivation to come back.
- **Error Journal prompt:** "Which one surprised you the most? Why?"

---

## Visual Design for ADHD

### Reduce Visual Noise
- Maximum 3 colors per screen (plus neutrals)
- No animated backgrounds during question time (save animations for breaks/celebrations)
- Clean card borders — no decorative elements near answer options
- Whitespace > density (generous padding: 16-24px on cards)

### Create Visual Hierarchy
- **Active question** = largest, brightest, centered
- **Progress indicator** = fixed position, subtle (top bar, not distracting)
- **Timer** = fixed position, small (corner, not center)
- **Navigation** = bottom, always available, never hidden

### Color Coding for ADHD
| Element | Color | Purpose |
|---------|-------|---------|
| Easy difficulty | Green badge | "I can do this" |
| Medium difficulty | Yellow badge | "I need to focus" |
| Hard difficulty | Orange badge | "Challenge mode" |
| Correct feedback | Green (#22C55E) | Instant reward |
| Wrong feedback | Amber (#fbbf24 — matches `.es-feedback.wrong` in exec-skills-components.html) | Gentle, not shaming |
| Active/selected | Gold (#fde68a) border | Clear selection state |
| Timer/progress | Muted gray (#94A3B8) | Background, not distracting |

---

## Anti-Patterns (NEVER Do This)

1. **NEVER use red for wrong answers** — red = danger/shame. Use warm amber (#fbbf24 Buggsy) or orchid (#da70d6 JJ/sparkle) — both implemented in `exec-skills-components.html`.
2. **NEVER use countdown timers** on homework (anxiety trigger). Count-up only.
3. **NEVER show all questions at once** — progressive disclosure, one at a time.
4. **NEVER punish with lost progress** — if app crashes, auto-save recovers everything.
5. **NEVER require reading instructions** — provide audio option for all instructions.
6. **NEVER have a "wrong answer" sound effect** — gentle tone or silence.
7. **NEVER block progress on a single hard question** — allow skip + return.
8. **NEVER make rewards contingent on perfection** — reward effort, not just accuracy.
9. **NEVER use flashing/strobing animations** — seizure risk + sensory overload.
10. **NEVER hide the exit button** — feeling trapped increases anxiety.

---

## scaffoldConfig.adhd Reference

> **ASPIRATIONAL SPEC — not yet implemented in full.** Only `brainBreakAfter`, `brainBreakPrompt`, and `timerMode` are currently consumed by modules (PR #173). The remaining fields describe the intended contract for future curriculum-data-driven configuration. Do not grep for these fields expecting to find them — they don't exist in the codebase yet.

When the full contract ships, curriculum data will include an `adhd` config block consumed by the module renderer:

```javascript
scaffoldConfig: {
  adhd: {
    chunkSize: 3,              // Max same-type questions in a row
    brainBreakAfter: 4,        // Movement break every N questions
    brainBreakType: "movement", // movement | sensory | choice
    brainBreakPrompt: "...",   // The specific break instruction
    visualCueMode: "progress_dots", // progress_dots | progress_bar
    transitionAudio: true,     // Play transition sound between activities
    choiceOnFriday: true,      // Friday = kid picks activity order
    maxConsecutiveText: 2,     // Max text-heavy Qs before visual/interactive
    interleaveVisual: true,    // Force visual Q between text Qs
    feedbackDelay: 0,          // ms delay on correct (0 = instant)
    celebrateStreak: 3,        // Celebrate after N consecutive correct
    readAloudOption: false     // Audio read-aloud for Buggsy (off — he must read)
  }
}
```

---

## Applying This Skill

When building or reviewing education modules:
1. Check every question sequence against the 3-2-1 rule
2. Verify timer mode is count-up (not countdown) unless it's a speed game
3. Confirm wrong-answer feedback uses warm colors and constructive text
4. Verify brain breaks are scheduled every 4 questions
5. Check that progress is always visible and auto-saved
6. Confirm first question in every module is Easy (confidence builder)
7. Verify no red color is used for wrong-answer states
8. Check that the "Plan Your Attack" step exists before questions start

Sources:
- [Dawson & Guare — Coaching Students with Executive Skills Deficits (2012)](https://colegiopspchubut.com.ar/storage/2023/02/Dawson-Peg_-Guare-Richard-Coaching-Students-with-Executive-Skills-Deficits.-Practical-Interventionin-the-Schools-Series.-2012.pdf)
- [ADHD-Friendly App Design — Monster Math](https://www.monstermath.app/blog/adhd-friendly-app-design-what-to-look-for-and-what-to-avoid)
- [UI/UX for ADHD: Designing Interfaces That Help Students — Din Studio](https://din-studio.com/ui-ux-for-adhd-designing-interfaces-that-actually-help-students/)
- [Inclusive UX/UI for Neurodivergent Users — Bootcamp/Medium](https://medium.com/design-bootcamp/inclusive-ux-ui-for-neurodivergent-users-best-practices-and-challenges-488677ed2c6e)
- [Cognitive Load Theory in UX Design — Tallwave](https://tallwave.com/blog/cognitive-load-in-ux/)
- [Systematic Review: Special Educational Interventions for Student Attention (2024)](https://journals.sagepub.com/doi/10.1177/01626434231198226)
