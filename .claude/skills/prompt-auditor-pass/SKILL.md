---
name: prompt-auditor-pass
description: >
  Two-pass prompt construction with an adversarial audit step. Use whenever the user asks Claude
  to build a prompt for another AI system (GPT, Gemini, another Opus instance) to run a review,
  audit, evaluation, or structured analysis. Also triggers on requests to build rubrics,
  evaluation frameworks, system prompts, or review prompts where a bad prompt would cause
  meaningful rework downstream. Trigger phrases: "build me a prompt", "prompt engineer",
  "audit this prompt", "attack this prompt", "review prompt", "evaluation prompt", "rubric",
  "system prompt", "prompt for GPT/Gemini/Opus to review X". Do NOT use for throwaway one-off
  prompts, conversational iteration, or trivial reformatting tasks.
---

# Prompt Auditor Pass

Two-pass prompt construction. A first-pass prompt is a draft; an audited prompt is a finished
deliverable. Single-pass prompts suffer from the same blind spots as single-pass writing — the
author is too close to the intent to see what's missing.

## Cardinal Rule
The auditor is a second opinion, not a superior. Pass 2 findings get triaged with judgment in
Pass 3 — not accepted wholesale. Capitulation drift is the Pass 3 failure mode.

---

## When to Use

- User wants a prompt for another AI system to audit, review, or evaluate something
- User is building a rubric, evaluation framework, or scoring structure
- Prompt will be reused across multiple items (not a one-off)
- Stakes are high enough that a bad prompt causes meaningful rework
- User explicitly says "audit this prompt" or "make this prompt better"
- User is asking Claude to write a prompt that Claude itself will later receive (e.g., "build
  the prompt for Opus to triage this feedback")

## When NOT to Use

- Quick one-off prompts in the flow of conversation
- User is iterating conversationally and wants fast turnaround
- Trivial prompts (reformat, summarize, list the items in X)
- User has already written the prompt and just wants a second opinion (skip to Pass 2 only)

---

## The Three Passes

### Pass 1 — Draft Prompt
Build the best prompt you can for the stated task. No audit yet. Focus:
- What is the prompt actually supposed to accomplish?
- What structure serves that goal?
- What does the receiver need to know that the author would assume?
- What output format makes the result usable?

Do NOT over-engineer. A prompt that's too long or too structured for the task is a failure mode
in its own right.

### Pass 2 — Auditor's Review
Switch role. Audit the Pass 1 prompt against the stated goal. The audit is NOT a style review
or a generic best-practices checklist. It is a targeted check for whether the prompt will
actually produce the outcome the user wants.

Ask these questions in order:

1. **Intent fit.** Does the prompt's structure actually serve the user's stated priority? Or
   has it drifted toward generic "good prompt" patterns that don't match this specific goal?
2. **Implicit assumptions.** What does the prompt assume the receiver knows that the receiver
   won't actually know? (Domain context, user priorities, preservation rules, house style.)
3. **Failure modes not defended.** What could the receiver do wrong even if it follows the
   prompt literally? Capitulation, scope creep, over-correction, style drift, hallucinated
   confidence, missing nuance on edge cases.
4. **Over-engineering check.** Is any section doing less work than it costs in prompt length?
   Long prompts have diminishing returns — each section should earn its place.
5. **Under-specification check.** Where will the receiver fill in defaults that differ from
   what the user wants? Those are the gaps.
6. **Output format usability.** Will the output be scannable, actionable, and aligned with how
   the user will consume it? Or is the format optimized for the author's sense of
   thoroughness rather than the user's workflow?
7. **Preservation rules.** What should the prompt explicitly tell the receiver NOT to change,
   not just what to change? (This is a frequently missed section.)

### Pass 3 — Hardened Prompt
Produce the final prompt. Incorporate audit findings selectively — accept points that improve
outcome-fit, reject points that are style preferences or scope creep. For any audit point
rejected, hold the original.

The output of Pass 3 is the deliverable. Pass 1 and Pass 2 are scaffolding.

---

## Output Modes

User can choose one:

### Full three-pass (visible)
Show Pass 1 draft, Pass 2 audit findings (with disposition), Pass 3 final prompt. More
auditable, teaches the pattern, longer output.

### Audit-folded (default)
Run Pass 1 and Pass 2 internally, show only the Pass 3 final prompt with a brief note at the
end listing the 2-4 biggest audit catches and how they were addressed. Faster, less noisy.

### Audit-only
User has already written the prompt. Skip Pass 1. Run Pass 2 against the user's version. Pass
3 is either a hardened rewrite or a targeted change list, whichever the user requests.

Default to audit-folded unless user requests otherwise or the prompt is complex enough that
showing the reasoning adds value.

---

## Scoring Matrix (Required)

Every audit produces a scored matrix. Pass 2 scores the draft; Pass 3 scores the hardened
version. The matrix makes improvement visible and prevents "looks good, ship it" audits that
find nothing.

### Dimensions (each 0-10)

| Dimension | Question |
|---|---|
| **Intent fit** | Does the prompt serve the user's actual stated goal, not a generic version of it? |
| **Receiver-readiness** | Does the receiver have the context, priorities, and constraints needed to act? |
| **Failure-mode defense** | Does it defend against the specific ways this kind of prompt goes wrong? |
| **Right-sizing** | Is it scoped appropriately — not bloated with defensive scaffolding, not skeletal? |
| **Output usability** | Will the output arrive in the form the user actually consumes? |

### Score calibration
- **0-3:** Absent or actively counterproductive on this dimension
- **4-6:** Present but underdeveloped; noticeable gaps
- **7-8:** Solid; minor tightening possible
- **9-10:** Load-bearing and well-executed; no obvious improvement

The overall score is a holistic judgment supported by the matrix, not a simple average.
A 10 in every dimension is rare and usually means the audit wasn't looking hard enough.

### Output format

```
**Pass 1 draft: [X]/10**

| Dimension | Score | Evidence |
|---|---|---|
| Intent fit | 7 | Addresses goal but uses generic reviewer framing |
| Receiver-readiness | 6 | Missing user's stated priorities |
| Failure-mode defense | 5 | No capitulation guard; no known-blind-spots section |
| Right-sizing | 8 | Length appropriate |
| Output usability | 7 | Flat list output; not pre-triaged |

**Pass 3 hardened: [Y]/10**

| Dimension | Score | Evidence |
|---|---|---|
| Intent fit | 10 | Priorities anchored in dedicated section |
| Receiver-readiness | 9 | Explicit preservation rules; known blind spots listed |
| Failure-mode defense | 10 | Capitulation guard; disposition protocol; intent-misread flag |
| Right-sizing | 8 | Slightly longer than ideal; every section earns place |
| Output usability | 10 | Four-part structured output matches user's workflow |

**Net delta:** +14 points. Biggest gains: failure-mode defense, intent fit.
**Remaining tradeoffs:** [list anything unresolved]
```

### Honesty guardrail
Pass 3 is not automatically 10/10. If genuine tradeoffs remain that only user input can
resolve, score honestly (8 or 9) and list the unresolved items. A falsely-perfect score hides
real decisions. The user's trust in the scoring depends on it being real — once the scores
are known to be sycophantic, the matrix is worthless.

Common reasons Pass 3 scores below 10:
- A tradeoff exists that requires user preference to resolve (length vs completeness, for
  instance)
- The domain has inherent ambiguity the prompt can manage but not eliminate
- The receiver model has known quirks the prompt can mitigate but not fix

---

## Domain-Specific Audit Lenses

The audit questions adjust per domain. Load the relevant lens at Pass 2.

### Review / audit prompts (e.g., "GPT reviews Opus's plan")
- Does it force triage categories, or will the receiver just produce a flat list?
- Does it anchor to the USER'S priorities, or leave the receiver to guess?
- Does it defend against capitulation ("do not silently accept feedback to avoid conflict")?
- Does it force per-item disposition (accept/modify/reject with rationale), or allow vibes-
  based rewriting?
- Does it flag known blind spots in the specific reviewing model's audit style?

### Evaluation / scoring rubrics (e.g., "grade these student CERs")
- Are the criteria independent, or do they bleed into each other?
- Are the scoring levels distinguishable, or will everything cluster in the middle?
- Is there a calibration example per level?
- Does the rubric tell the evaluator what to do when a submission is off-pattern?
- Does it specify what NOT to penalize (e.g., creativity, voice, dialect)?

### System prompts (e.g., "behavior rules for a persistent agent")
- Are the rules operationally precise (an agent can follow them) or aspirational?
- Do they handle conflict between rules?
- Is there a "when in doubt" default?
- Does the prompt define what's out of scope, not just what's in scope?

### Content generation prompts (e.g., "Gemini generates 10 reading passages")
- Is the output format strict enough for downstream parsing?
- Are there explicit anti-patterns to avoid (common failure modes for that model)?
- Does it specify the reader/audience/register concretely?
- Does it force variety across batch outputs, or will they all sound the same?

### Meta-prompts (a prompt that Claude itself will later receive)
- Does it preserve enough context that a fresh Claude instance (no memory) can act on it?
- Does it anchor to the originating user's values, not generic defaults?
- Does it distinguish LT-specific context (like Notion IDs, repo conventions) from universal
  instructions?

---

## Failure Modes to Avoid

### In Pass 1
- Writing a prompt that's over-structured for a small task. Length and formality are not
  quality signals.
- Pattern-matching to a generic "audit prompt" template without adapting to the specific
  task.
- Leaving user priorities implicit. If the user said "I care about X, not Y," the prompt must
  encode that.

### In Pass 2
- Generic critique that doesn't attack the specific prompt. "This could be more specific" is
  not useful audit output.
- Finding nits instead of failure modes. The audit should target what would go wrong, not what
  stylistically could be tighter.
- Producing an audit that accepts everything ("looks good"). A Pass 2 that finds nothing is
  either a trivial prompt that shouldn't have used this skill, or an audit that's failing.

### In Pass 3
- Capitulation drift. Accepting every audit point to look thorough, even when the original
  choice was right.
- Producing a prompt that's longer than Pass 1 with every addition being defensive rather
  than load-bearing.
- Losing the user's voice by over-sanitizing.

---

## Example Triggers

- "Build me a prompt for GPT 5.4 to review this migration plan" → full three-pass, review
  lens
- "Can you write a system prompt for a Claude Code agent that..." → audit-folded, system
  prompt lens
- "I wrote this prompt, is it good?" → audit-only
- "I need a rubric to grade Buggsy's CERs" → audit-folded, rubric lens
- "Make me a prompt Gemini can use to generate bedtime story scenes" → audit-folded, content
  generation lens

## Non-Triggers

- "Summarize this" — not a prompt build
- "Respond to this email" — not a prompt build
- "What should I say to..." — conversational, not prompt construction
- "Fix this bug" — coding, not prompting

---

## Integration with Existing Patterns

This skill complements the Verify-Before-Assert rule in CLAUDE.md. Both are defenses against
first-pass output drift — VBA guards against patching code without reading source; this skill
guards against shipping a prompt without auditing it. Same shape: the first output is always
a draft.

For migration plans, architectural decisions, and other high-stakes deliverables, consider
whether the same two-pass pattern applies to the deliverable itself, not just to prompts for
reviewing it.
