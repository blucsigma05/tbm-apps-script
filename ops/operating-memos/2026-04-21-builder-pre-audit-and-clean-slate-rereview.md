# TBM Operating Memo

## Topic
Builder pre-audit and clean-slate re-audit discipline

## Date
2026-04-21

## Status
Active

## Context
Repeated Codex manual audits on the same PR family, especially test-gate and review-pipeline PRs, kept surfacing new blocker or critical findings on later rounds. The visible pattern was not "the same bug was missed once." It was "the builder fixed the last named comments, then handed the PR back without proving the full touched contract was clean."

## Problem
TBM's current loop makes Codex the first real contract audit instead of the final confirmation step.

That happens when:
- PRs are broad enough that fixing named comments does not meaningfully re-check the whole touched surface.
- Builders optimize for "address the review" instead of "prove the PR now matches the rubric or contract."
- Re-audits are treated like patch validation instead of a clean-slate inspection of the current head.
- Critical test/gate logic is allowed to pass on weak evidence (`surrogate` or `pass` paths that do not really prove the rubric).

The result is predictable late-round P1 findings, especially in gate/test code where a weak measurement is itself a severity-worthy defect.

## Decision
TBM will treat re-audits as clean-slate reviews of the current named PR head, and builders must do a builder-side pre-audit before asking for re-audit on test/gate/review-pipeline PRs.

The builder pre-audit is not "did I fix the comments?" It is "if this were the first review on this head, what still fails the contract?"

For test/gate/review-pipeline PRs, the builder must explicitly sweep:
- registry or dispatch wiring for every new criterion
- false-pass and false-surrogate paths
- fail-closed behavior when proof is weak
- the whole touched criterion family, not just the exact lines from the last findings
- contract/rubric thresholds, not just plausibility of implementation

## Canonical Rule Location
- `ops/WORKFLOW.md § Two-Lane Handoff Rules`
- `CLAUDE.md § Output self-review (MANDATORY)` and `CLAUDE.md § Two-Lane Roles (MANDATORY)`
- `AGENTS.md § Two-Lane Roles (MANDATORY)`

## What Stays Flexible
- exact wording of PR comments or handoff comments
- whether the builder uses a written checklist in the PR thread, local notes, or commit-by-commit review
- the order of the builder pre-audit sweep
- whether LT asks for a re-audit immediately or after more fixes land

## Why
The alternative is the current failure mode: each round closes only the findings already named, while untouched false-pass paths remain for the next audit round to discover. That is acceptable for normal feature polish but not for gate/test/review-pipeline code, where one weak branch can corrupt the trustworthiness of the whole gate.

Treating re-audits as clean-slate inspections and requiring a builder pre-audit shifts defect discovery left:
- Codex becomes the final confirmation step more often
- repeated late-round P1 findings become rarer
- large audit PRs stop relying on comment-by-comment convergence

## What Changes Now
- `re-audit N` means current PR head only, with all prior findings treated as stale until re-anchored.
- Builders must not hand back test/gate/review-pipeline PRs after only patching named comments.
- Before requesting re-audit on those PRs, builders run a clean-slate contract sweep across the whole touched family.
- "Fixed the comments" is not a sufficient internal exit condition.

## Follow-Up Work
- Consider a repo-local builder checklist for gate/test PRs if this still recurs after the rule mirror lands.

## Source Conversation
- LT and Codex conversation on 2026-04-21 about repeated round-3/round-4 P1 findings in PR #57 and why manual Codex audits still discover blockers late in the build loop.

## Repo Rules To Mirror
- Re-audits are clean-slate inspections of the current PR head.
- Test/gate/review-pipeline PRs require a builder pre-audit before asking for re-audit.

## Notes
- This memo is about process shape, not blame. The issue is the loop design: narrow fix confirmation instead of whole-surface contract proof.
