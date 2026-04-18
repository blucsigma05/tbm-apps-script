# ThePulse Feedback Review Handoff Prompt

## Save Target
- `ops/thread-handoffs/`
- Working-tree draft only
- One-off next-thread prompt, not a reusable standard yet

## Model Fit
- This prompt is model-neutral.
- Opus or Codex can use it.
- It relies on explicit evidence and output structure, not model-specific tooling.

## Auditor's Pass

### Artifact audited
- The next-thread prompt for reviewing external feedback on the saved `ThePulse` JT-first simplification plan.

### Rubric
- `Scope fidelity` - reviews external feedback on the existing saved plan, not self-review in a vacuum
- `Evidence anchoring` - requires repo evidence before defending or conceding any point
- `Actionability` - ends with a revised plan or explicit blocker
- `Output contract clarity` - tells the next thread exactly what to produce
- `Continuity readiness` - names the source artifact and what to update

### Weaknesses found in the earlier prompt shape
- It assumed the feedback artifact existed without forcing a hard stop if absent.
- It did not anchor the audit to the saved plan path.
- It risked defensive argument instead of evidence-based claim review.
- It did not make the end-state output contract explicit enough.

### Revisions made
- Anchored the review to `specs/thepulse-jt-first-simplification-draft.md`.
- Added an exact hard-stop message if the feedback artifact is missing.
- Forced atomic claim review with `correct / partially correct / unsupported / incorrect` classification.
- Required repo evidence for every defense, concession, and rejection.
- Required a concrete revised plan as the end state rather than commentary only.

## Final Deliverable

Use this prompt in the next thread:

```md
Review external feedback on the existing ThePulse JT-first simplification plan and produce an evidence-based revision.

Source plan:
- `C:\Dev\tbm-apps-script\specs\thepulse-jt-first-simplification-draft.md`

Required input:
- the actual external feedback artifact, pasted into the thread or attached in full

If the feedback artifact is missing, stop immediately and output exactly:
`Missing feedback artifact: cannot audit absent feedback`

Your job is not to defend the prior draft by instinct and not to concede by vibes. Audit the feedback claim by claim against the saved plan and the repo.

Rules:
1. Read the saved plan first.
2. Read the external feedback carefully and break it into atomic claims.
3. For each claim, classify it as:
   - `correct`
   - `partially correct`
   - `unsupported`
   - `incorrect`
4. Every classification must cite evidence:
   - from the saved plan
   - from the repo when implementation or feasibility is discussed
   - from current source files when the feedback makes a code-level claim
5. Defend the current plan where the feedback is weak.
6. Concede and revise where the feedback is right.
7. Do not preserve any part of the draft that cannot be defended with evidence.
8. Do not invent capabilities, files, or saved artifacts.

Prefer repo evidence from:
- `C:\Dev\tbm-apps-script\specs\thepulse-jt-first-simplification-draft.md`
- `C:\Dev\tbm-apps-script\ThePulse.html`
- `C:\Dev\tbm-apps-script\Dataengine.js`
- `C:\Dev\tbm-apps-script\cloudflare-worker.js`
- any directly relevant route, PIN, or data-contract files you actually inspect

Required output:

## Feedback Audit
- List each atomic feedback claim
- Give its classification
- Cite the evidence
- State whether the current draft stands, needs revision, or should drop that point entirely

## Defensible Parts Of The Current Draft
- What remains valid after audit
- Why it remains valid

## Valid Concessions
- What the feedback proved
- What changes because of that proof

## Unsupported Or Overreaching Feedback
- What the feedback asserted without support
- Why it does not survive evidence review

## Path To 100
- What was missing from the original draft
- What must be added or tightened to make the plan stronger

## Revised Plan
- Produce the revised plan in full
- Keep it implementation-ready
- Keep the target audience as a non-financial partner
- Preserve progressive disclosure for LT's deeper finance tooling

If the revised plan materially changes the saved draft, update:
- `C:\Dev\tbm-apps-script\specs\thepulse-jt-first-simplification-draft.md`

Do not implement the plan in this thread unless explicitly asked. This is a feedback-audit-and-revision pass only.
```
