# TBM Weekly Operating Cadence

Date: April 3, 2026
Purpose: Lightweight operating rhythm for TBM.
Audience: Founder/operator, not full-time developer.
Time commitment: ~70 min/week + monthly deep dive. This is management review time, not build time. Build sessions are separate.

## Goal

Answer five questions every week:

1. What changed?
2. What broke?
3. What drifted?
4. What still works?
5. What is the next highest-value fix?

---

## Core Rule

Every week should produce:

- one updated scorecard
- one updated blocker list
- one updated drift note
- one next-step decision

If a week creates code but not clarity, the system is getting harder to manage.

---

## Monday: System Readiness Review (20-30 min)

### Review
- latest merged PRs / commits
- last deploy notes
- test results from Playwright / smoke flows
- any user-visible breakage from live usage
- scorecard from last week

### Questions
- Did anything new ship?
- Did anything regress?
- Are current docs still truthful?
- Is there anything kids or parents can feel immediately?

### Output
- `This Week's P0`
- `This Week's P1`
- `Hold / defer list`

---

## Wednesday: Workflow Integrity Review (20 min)

### Run or verify one real workflow
- one kid flow (load board, complete one task)
- one parent flow (open parent view, review one item)
- one ambient or dashboard flow (load Soul/Spine, verify content)

### Questions
- Did the UI load?
- Did the state save?
- Did the result match what the UI implied?
- Did any fallback or silent failure happen?

### Output
- `Verified Working`
- `Misleading UI`
- `Broken Save`
- `Needs Monitoring`

---

## Friday: Operating Closeout (20-30 min)

### Review
- what actually got fixed
- what stayed open
- what new drift appeared
- whether scores changed

### Update
- repo scorecard (ops/SCORECARD.md)
- drift ledger (ops/DRIFT-LEDGER.md)
- next week's priorities

### Output
- `Wins`
- `Regressions`
- `Open Risks`
- `Next Week's Lead Fix`

---

## Monthly Deep Review (45-60 min)

Once a month:
- compare current repo to scorecard target
- look for features/visuals lost in drift
- archive stale Notion docs
- update runtime-canon docs
- reset the roadmap phase focus

---

## Anti-Patterns

If these happen, slow down:

- multiple merges but no updated deploy truth
- features added without route/test/log updates
- UI says success while backend state is uncertain
- docs becoming fiction
- too many fixes dependent on memory instead of checklist

---

## Success Condition

This cadence is working if:
- you can tell what changed in under 10 minutes
- you know the current biggest risk
- you know what is truly working
- you can choose the next fix confidently
