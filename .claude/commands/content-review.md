---
name: content-review
description: >
  The full grading pipeline for open-ended student responses in the TBM
  platform. Use this skill when building or debugging the homework submission
  flow, the Gemini first-pass review, the parent approval dashboard, or the
  ring award sequence for open-ended work. Covers: submitHomework, Gemini
  review, approveHomework, ring awards on approval, and Pushover notification
  patterns. Triggers on: grading, open-ended, gemini review, parent approval,
  pending review, approve homework, return homework, ring award.
---

# Content Review — Grading Pipeline

## The Pipeline (4 Phases, In Order)

```
Student submits open-ended response
        ↓
Phase 1: Write row to KH_Education sheet (under lock)
        ↓
Phase 2: Award rings for MC auto-grade (if no open-ended text)
        ↓
Phase 3: Push notification → JT + LT
        ↓
Phase 4: Gemini first-pass review (outside lock, 5-30s)
        ↓
Row in KH_Education: Status = 'pending_review', GeminiFeedback populated
        ↓
JT sees item on Parent Dashboard → Approve or Return
        ↓
approveHomework_(rowIndex, 'approve'/'return', notes)
        ↓
10 rings awarded (approve) or 0 rings, student notified to retry (return)
```

---

## KH_Education Sheet Schema

**Tab name:** `KH_Education` (via `TAB_MAP['KH_Education']`)
**Headers (12 columns):**

| Col | Field | Notes |
|-----|-------|-------|
| 1 | Timestamp | `new Date()` at submission |
| 2 | Child | `'buggsy'` or `'jj'` (lowercase) |
| 3 | Module | `'homework'`, `'writing'`, `'reading'`, etc. |
| 4 | Subject | `'Math'`, `'Science'`, `'RLA'`, `'Writing'`, etc. |
| 5 | Score | Number — MC correct count |
| 6 | AutoGraded | Boolean — true if no open-ended text |
| 7 | ResponseText | Student's open-ended response (may be blank) |
| 8 | Status | `'auto_approved'` or `'pending_review'` → `'approved'` or `'returned'` |
| 9 | ParentNotes | LT/JT feedback text (set during approval) |
| 10 | RingsAwarded | Number — 5 (auto) or 10 (parent approved) |
| 11 | ReviewTimestamp | Date of parent review |
| 12 | GeminiFeedback | JSON string: `{ feedback: "...", timestamp: "..." }` |

---

## Phase 1: submitHomework_() — What Triggers It

Called by `submitHomeworkSafe()` from the client via `google.script.run`.

**Auto-graded path (no open-ended text):**
- `isAutoGrade = true`
- Status set to `'auto_approved'`
- Rings = 5 (hardcoded default)
- Rings awarded immediately in Phase 2

**Open-ended path (response text present):**
- `isAutoGrade = false`
- Status set to `'pending_review'`
- Rings = 0 until parent approves
- Gemini runs in Phase 4

**Data shape expected by `submitHomeworkSafe`:**
```javascript
google.script.run
  .withSuccessHandler(function(result) { /* result = JSON string */ })
  .withFailureHandler(function(err) { console.error(err.message); })
  .submitHomeworkSafe({
    child: 'buggsy',          // Required
    module: 'homework',        // Module name
    subject: 'Writing',        // Required for Notion + KH_Education
    score: 4,                  // MC score
    rings: 5,                  // Base ring value for this session
    responseText: '...',       // Open-ended response (triggers pending_review)
    prompt: 'Explain...'       // The assignment prompt (fed to Gemini)
  });
```

---

## Phase 4: Gemini Review

**Function:** `reviewWithGemini_(data)` in Kidshub.js
**Model:** `gemini-2.0-flash`
**Script Property:** `GEMINI_API_KEY`

**Prompt structure:**
```
You are reviewing a 10-year-old 4th grader's [subject] response.
Assignment: [data.prompt]
Student response: [data.response]
Provide briefly:
  (1) spelling errors
  (2) grammar notes
  (3) structure score (A/B/C/Incomplete)
  (4) one encouraging comment
  (5) one improvement suggestion
Keep it under 150 words. This is for the parent.
```

**Gemini is triggered only when:**
- `status === 'pending_review'`
- `data.responseText` exists and length > 20 characters

**Gemini result is written to column 12** (GeminiFeedback) as a JSON string:
```json
{ "feedback": "Spelling: 2 errors (recieve→receive, thier→their). Grammar: strong sentence structure. Structure: B. Great job defending your claim with evidence! Next time, add a second piece of evidence to strengthen your argument.", "timestamp": "2026-04-11T..." }
```

**If Gemini fails:** Error is logged to ErrorLog, column 12 stays blank. Parent still sees the submission — they just don't get the AI pre-read. Parent review is always the final gate.

---

## Parent Approval — approveHomework_()

**Function:** `approveHomework_(rowIndex, action, notes)` in Kidshub.js
**Called from:** Parent Dashboard (KidsHub.html, parent view)
**Safe wrapper:** `approveHomeworkSafe(rowIndex, action, notes)`

**Actions:**

| Action | Status change | Rings awarded | Push notification |
|--------|--------------|---------------|------------------|
| `'approve'` | `'pending_review'` → `'approved'` | 10 rings | "Writing approved! +10 rings" |
| `'return'` | `'pending_review'` → `'returned'` | 0 rings | "Please try again" (to child) |

**Ring economy for open-ended work:**
- Auto-graded MC only: **5 rings**
- Parent-approved open-ended: **10 rings** (premium for writing effort)
- Returned: **0 rings** (student revises and resubmits)

**Notes field:** LT/JT writes feedback here on `'return'`. This text is shown to the student.

---

## Parent Dashboard Queue

**KidsHub.html parent view** shows items where `Status = 'pending_review'`.
The `pendingReview` count in the payload is computed by `getKHEduAgg_()`:

```javascript
// In Kidshub.js:
if (statusVal === 'pending_review') out.pendingReview++;
```

This count drives the badge/alert on the parent dashboard. If it's wrong, check:
1. The KH_Education tab for rows where col 8 = `'pending_review'`
2. Whether `getKHEduAgg_()` is reading the right tab name (via TAB_MAP)
3. Whether the Pushover notification fired when the item was submitted

---

## Gemini in StoryFactory

The **StoryFactory** (`StoryFactory.js`) uses a separate Gemini key (`'JJ Stories'` Script Property) and separate models:
- Story generation: `gemini-2.5-flash`
- Image generation: `gemini-2.5-flash-image`

This is a **completely different Gemini integration** from the homework grading pipeline. They share the same underlying API but use different Script Properties and different prompts.

**StoryFactory pipeline:**
```
Notion trigger → Character fetch → Memory inject → Gemini story generation
→ Canon extract → Gemini image generation (with character ref images)
→ PDF on Drive → Notion page created
```

Do not confuse `GEMINI_API_KEY` (homework grading) with `JJ Stories` key (story factory). They are separate keys.

---

## Error States and Recovery

| Error | Cause | Recovery |
|-------|-------|---------|
| `No GEMINI_API_KEY` | Script Property not set | Set `GEMINI_API_KEY` in GAS Script Properties |
| Gemini call returns no text | API error or quota exhausted | Check GAS ErrorLog; parent still reviews manually |
| Row index incorrect on approval | UI sent wrong rowIndex | Cross-check col 8 = `'pending_review'` before approve |
| `locked` status returned | Lock contention | Client should retry after 2-3 seconds |
| Rings not awarded on approve | `kh_awardEducationPoints_` failure | Check ErrorLog; rings can be manually added via KH_Rings tab |

---

## Quality Standards for Gemini Prompts

When modifying the Gemini review prompt:
1. **Stay parent-focused** — output is for the parent, not the student
2. **Stay concise** — under 200 words; parents won't read walls of text
3. **Always include a structure score** — A/B/C/Incomplete is the fastest signal
4. **Always include one positive** — models good review behavior for parents
5. **Match grade level** — 4th grader (Buggsy) vs Pre-K (JJ) need different framing
6. **No hallucination risk** — prompt only on what the student actually wrote; never infer intent

JJ currently has no open-ended submission path (she cannot type). Gemini grading is Buggsy-only for now.
