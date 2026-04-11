---
name: grading-review-pipeline
description: >
  End-to-end grading and review workflow for the Thompson education platform.
  Use when building, debugging, or auditing the path from student submission
  through auto-grading, Gemini first-pass, parent review, and ring/star award.
  Covers MC auto-grade, short answer review, CER/ECR rubric scoring, parent
  approval flow, and award timing. Trigger on: grading, review, auto-grade,
  Gemini, parent review, pending review, ring award, star award, score,
  rubric, CER, ECR, approval, grade pipeline.
---

1. **Cardinal Rule:** "Rings and stars are not awarded until the grading pipeline completes. For MC, that's instant. For open-ended responses, that means Gemini first-pass PLUS parent review. Premature awards break parent trust."

2. **The Pipeline (4 stages):**

```
Student submits answer
  → Stage 1: Type Classification
    MC → auto-grade immediately (correct/incorrect)
    Short Answer → Stage 2
    CER (3 sentences) → Stage 2
    ECR (4 paragraphs) → Stage 2
  → Stage 2: Gemini First-Pass
    Sends response + rubric + TEKS code to ContentEngine.gs
    Returns structured JSON: score, rubricScores, feedback, confidence, suggestedRings, misconception
    If confidence = "low" → always flag for parent review
    If confidence = "high" AND score >= 70% → auto-approve with suggested rings
    If confidence = "medium" → flag for parent review with Gemini's suggestion visible
  → Stage 3: Parent Review
    Parent sees: student response, Gemini feedback, suggested score, suggested rings
    Parent can: approve as-is, adjust score, adjust rings, add notes
    Parent approval triggers Stage 4
  → Stage 4: Award
    Rings/Stars awarded based on final approved score
    Logged to KH_Education and Notion Homework Tracker
    Pushover notification to child (optional)
```

3. **MC Auto-Grade Rules:**
   - Instant comparison: selected === correct
   - Feedback via ExecSkills.showFeedback() — green for correct, amber/purple for wrong
   - Wrong answers tracked for Monday Error Journal
   - Rings awarded immediately for MC-only modules (no parent gate)
   - Score logged to KH_Education with TEKS tag

4. **Gemini Grading Contract:**
   - Function: `gradeResponseWithGemini_()` in ContentEngine.gs
   - Output schema (strict — must match exactly):
   ```json
   {
     "score": 7,
     "maxScore": 9,
     "rubricScores": {"claim": 3, "evidence": 2, "reasoning": 2},
     "feedback": "Your claim is clear but your evidence needs a specific text reference.",
     "confidence": "medium",
     "suggestedRings": 2,
     "misconception": "Student may be confusing opinion with evidence"
   }
   ```
   - Feedback rules: constructive only, never "wrong" or "incorrect", Wolfkid framing for Buggsy
   - CER rubric: Claim (1-3), Evidence (1-3), Reasoning (1-3) = max 9
   - ECR rubric: Intro (1-4), Evidence1 (1-4), Evidence2 (1-4), Conclusion (1-4) = max 16

5. **Ring/Star Economy (from thompson-teacher):**

| Activity | Buggsy Rings | JJ Stars |
|----------|-------------|----------|
| Daily module (MC) | 8 | 2 |
| Perfect sprint | +2 | — |
| Writing quality (CER/ECR) | +3 | — |
| Wolfkid Episode | 10-13 | — |
| Comic Studio | 5 | — |
| Review quiz 80%+ | +5 | — |
| Weekly completion | +10 | +3 |
| SparkleLearn session | — | 2 |
| Name practice | — | 1 |

   - Award timing: MC rings = immediate. Open-ended rings = after parent approval.
   - Minimum award: always award SOMETHING for completing the module. Zero rings kills motivation.
   - Award function: `awardRingsSafe(child, count, source)` in KidsHub.gs

6. **Parent Review Surface:**
   - Location: Parent Dashboard (/parent) → Education section → Pending Review
   - Data source: KH_Education rows where Status = 'pending_review'
   - Also: Notion Homework Tracker via `getPendingReviewsSafe()`
   - Alert: Pushover after 48h if still pending (via EducationAlerts.js)

7. **Status Flow:**
```
submitted → auto-graded (MC) → rings awarded
submitted → pending_review (open-ended) → parent reviews → approved → remaining rings awarded
```

8. **Logging Contract:**
   - KH_Education row: child, subject, assignment, score, teksCode, difficulty, date, status, timeSpent, geminiScore, parentScore, notes
   - Notion Homework Tracker: mirrors KH_Education with richer metadata
   - QuestionLog: per-question breakdown for trend analysis
   - All logging happens exactly ONCE — no double-logging on retry

9. **Error Journal Integration (Monday only):**
   - After module completion on Monday, if missedQuestions.length > 0:
   - Show ExecSkills.showErrorJournal() with missed questions
   - Student picks one, explains WHY they got it wrong
   - Journal entry logged to Notion with timestamp

10. **Friday Reflection Integration:**
    - After module completion on Friday:
    - Show ExecSkills.showFridayReflection()
    - Two prompts: "What was hardest?" and "What are you proud of?"
    - Reflection logged to Notion with timestamp

11. **Guardrails:**
    - Never award rings before the grading pipeline completes
    - Never show Gemini feedback to the child — it goes to the parent
    - Never auto-approve low-confidence Gemini grades
    - Never skip parent review for CER/ECR (even if Gemini is confident)
    - Never log the same submission twice
    - Always show the child constructive feedback via ExecSkills, regardless of score
