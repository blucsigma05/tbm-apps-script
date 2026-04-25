# TBM Operating Memo

## Topic
Lightweight multi-model build loop, kid-surface design workflow, and artifact discipline

## Date
2026-04-25

## Status
Active

## Context
LT asked what TBM should learn from the common "LLM chaos" failure mode: too many agents, too much implicit context, and not enough verification. The immediate trigger was JJ and Buggsy education drift: visuals are inconsistent, loaders differ across surfaces, content/audio coherence is unreliable, and old docs contain stale carve-outs like "already polished."

## Problem
TBM has the right ingredients but not a tight enough operating loop for design-heavy education work:
- build decisions can drift when chat carries context instead of durable artifacts
- a second model can catch real misses, but only if it audits bounded work instead of inheriting vague shared context
- JJ and Buggsy are being judged as separate surfaces when the actual problem is a missing cross-kid education design system
- stale docs can keep false exemptions alive long after the code changed

## Decision
TBM will use a lightweight multi-model loop for education work:
- one canonical spec per system, not parallel design truths in chat
- one bounded work packet per PR or audit step
- one builder lane and one auditor lane per packet
- one evidence trail that both models read from

For JJ and Buggsy education surfaces, TBM will operate as one design family:
- JJ and Buggsy share one canonical education visual-system spec
- no kid surface is exempt from audit or refactor because it "looks better" or was previously called polished
- wireframe before code remains mandatory
- design exploration happens upstream; production implementation still obeys GAS / HtmlService / device constraints

TBM will treat "shared context" as a discipline problem:
- agents may share artifacts
- agents may not rely on shared vibes, implied memory, or unlogged chat conclusions

## Canonical Rule Location
This memo is the canonical record for the operating rule set with full context. The hard-rule subset is mirrored into `CLAUDE.md § Two-Lane Roles` in this PR. `AGENTS.md` already declares (line 21) that the full Two-Lane Roles rule set lives in CLAUDE.md, so the existing AGENTS.md pointer covers the mirror requirement of `ops/WORKFLOW.md:332` without duplication. CLAUDE.md bloat against the HYG-04 baseline is tracked separately as Gitea #160 (slim pass).

## What Stays Flexible
- which model plays the builder or auditor role on a given packet, as long as the roles stay separate
- whether design exploration happens strictly after the first audit or in parallel with it
- exact prompt wording, issue wording, and comment tone
- how many packets are active at once, as long as each packet stays bounded and reviewable
- whether a design artifact comes from Claude Design, Figma, or another approved upstream tool

## Why
More agents do not solve context drift. Smaller packets, explicit artifacts, and independent verification do.

This memo keeps the useful part of multi-model work:
- separate builder and auditor perspectives
- independent spot checks
- design exploration without shipping design-tool output directly

It rejects the failure mode:
- giant prompts
- one model building from another model's unverified summary
- chat acting as the only record
- stale docs surviving because no one re-opened them against source

## What Changes Now
- Before a design-heavy education change starts, create or name the canonical artifact set:
  - issue
  - spec
  - evidence path
  - target files
- Education work for JJ and Buggsy runs through the same operating sequence:
  1. audit current state
  2. define or update canonical spec
  3. explore design upstream
  4. transcribe into production code
  5. re-run the gate
- Builder and auditor do not share conclusions by chat summary alone. They share paths, verdicts, screenshots, spec sections, and file references.
- Any doc that contains a stale exemption or stale implementation claim must be corrected or demoted before it is reused as planning truth.

## Follow-Up Work

**Done**
- Patch Play-Gate QA-route normalization and add regression coverage before relying on `/qa/*` wide sweeps. **Landed in PR #151 (`f787769`, 2026-04-25):** `tests/tbm/play-gate/measurements/_helpers.js` adds `normalizeRoute()` that strips `/qa/` and falls through to the prod-route lookup; `tests/ci/play-gate-regression.test.js` adds 10 D7 cases covering /qa/sparkle parity, /qa/sparkle-kingdom + /qa/homework cross-kid resolution, /qa/pulse + /qa/vein finance denial-by-absence, /qa/<unmapped> still null, prod routes unchanged, and `normalizeRoute` exported.

**Tracked as Issues** (per `ops/WORKFLOW.md:331` — memo work is not memo-body backlog):
- Gitea #157 — Create `specs/education-visual-system.md` as canonical cross-kid education design-system spec
- Gitea #158 — Demote `specs/sparkle-visual-system.md` to superseded pointer (blocked by #157)
- Gitea #159 — Run JJ + Buggsy coherence audits against new artifact discipline (blocked by #157)

These are also added as rows 62d / 62e / 62f in `ops/master-stabilization-backlog.md` so the routine backlog scrub catches them if the Issue queue gets buried.

## Source Conversation
- LT and Codex conversation on 2026-04-25 about learning from multi-model failure patterns and turning that into TBM operating rules for education work.

## Repo Rules To Mirror
- Education design work uses one canonical spec for JJ + Buggsy, not per-surface carve-outs.
- Multi-model work shares artifacts, not implicit context.
- One bounded work packet per PR or audit step: one builder, one auditor, one evidence trail per packet.
- Stale docs lose authority until corrected or demoted.

## Notes
- Practical artifact checklist for this loop:
  - `Issue`: what exact packet is being worked
  - `Spec`: what "good" means
  - `Evidence`: screenshots, verdict JSON, logs, or mismatch tables
  - `Code refs`: exact files and line anchors
  - `Audit result`: pass, fail, surrogate, or open question
- If one of those is missing, the packet is not ready for a second model to review.
