# Nightly Grinder — Canary Plan

Before the grinder consumes the broad `model:opus` + `needs:implementation`
queue, it must prove stop-discipline and correctness on a narrowed label
filter. This file is the rollout checklist.

**Parent Issue.** #454
**Runbook.** `ops/grinder-runbook.md`

---

## Stage 1 — Narrow to `grinder-canary`

**Goal.** 5–10 supervised fires against Issues explicitly tagged for canary
use. Every fire is reviewed cold next morning before the next fire.

### Setup

1. Keep `NIGHTLY_GRINDER_ENABLED=false` until the canary Issues exist.
2. Hand-pick 5–10 well-scoped, low-blast-radius Issues from backlog and
   add the `grinder-canary` label. Criteria for a canary Issue:
   - Single-file or single-module change
   - No schema or `TAB_MAP` edits
   - No financial calculator changes
   - No kid-visible UI changes
   - Has a clear, measurable acceptance checklist
   - Has a `## Build Skills` section
3. Register the scheduled task with the label filter narrowed:
   - Env var passed at fire time: `GRINDER_LABEL_FILTER=grinder-canary`
   - (Can still require `needs:implementation` by passing
     `grinder-canary,needs:implementation` — recommended.)
4. Flip `NIGHTLY_GRINDER_ENABLED=true`.

### Observe (per fire)

For each morning after a fire, before the next fire:

- [ ] Pushover delivered exactly one terminal notification
- [ ] Notion Scheduled Tasks DB has the row for the fire
- [ ] If shipped: PR exists, branch named `grinder/<N>-<slug>`, CI green,
  Codex review explicit PASS, `## Build Skills` section present in PR body
- [ ] If shipped: diff stays inside the Issue's stated scope — no
  unrelated refactors, no hot-file edits
- [ ] If parked: Issue has the correct label (`status:broken` or
  `needs:lt-decision`), comment explains the reason, no state leaked
  into main
- [ ] Lock file removed (`/tmp/grinder.lock` absent)
- [ ] Stop discipline held — no retries, no override flags used

### Gate to Stage 2

All of the below must be true before broadening the filter:

- [ ] 5 consecutive clean fires (shipped or parked-correctly — either is fine)
- [ ] Zero bad fires (wrong scope, wrong stop reason, override flag used,
  hot file touched, merge attempted)
- [ ] Codex has reviewed at least 3 of the canary PRs with explicit PASS
- [ ] LT has reviewed every canary PR in the morning — no surprise diffs

If ANY fire is bad → go back to start of Stage 1, fix the runbook or
selector, rerun 5 clean fires from zero.

---

## Stage 2 — Broaden to `model:opus` + `needs:implementation`

**Goal.** First week on the broad filter runs with LT reviewing every
morning before coffee. Two-strike rule on regressions.

### Setup

1. Flip the filter env var: drop `grinder-canary`, keep
   `model:opus,needs:implementation` (the selector default).
2. Leave `NIGHTLY_GRINDER_ENABLED=true`.
3. Continue morning cold-reviews for the first week.

### Two-strike rule

If TWO consecutive fires are "bad" by the canary criteria above:

1. Flip `NIGHTLY_GRINDER_ENABLED=false` immediately.
2. Open a post-mortem Issue with `kind:decision` + `needs:lt-decision`.
   Body: the two bad fires, their PRs/comments, root cause hypothesis.
3. Do NOT re-enable until the post-mortem closes with a fix landed.

### Gate to steady-state

After one clean week on the broad filter:

- [ ] Zero bad fires across 5+ broad-filter fires
- [ ] LT morning review ≤5 minutes per PR on average
- [ ] No post-mortem Issues opened

At that point the morning-review burden can relax. The grinder is now
normal infrastructure.

---

## Out of scope (explicitly deferred)

- **Auto-merge.** Separate Issue, gated on 30+ clean grinder fires with
  zero false-positive Codex reviews. Not this canary.
- **Multi-issue fires.** Never. Violates bounded-blast-radius.
- **Spec-picking.** `kind:spec` stays human-driven.
- **Parallel grinders.** The lock file enforces one at a time; do not
  lift that.

---

## Rollback procedure

If canary reveals a systemic issue:

1. `gh variable set NIGHTLY_GRINDER_ENABLED --body false` — stops all
   future fires in ≤60s.
2. If a bad PR was opened, close it without merging; comment links the
   fire and the issue that should be re-opened.
3. Label affected Issues with `status:broken` so they won't re-enter the
   queue until the root cause is fixed.
4. Open a post-mortem Issue (see Stage 2 two-strike rule).
5. Fix, re-run Stage 1 from zero before re-enabling.

No "just one more fire to see if it works." Stage 1 restarts from zero.
