# TBM Operating Memo

## Topic
Auditor's pass discipline and thread continuity by default

## Date
2026-04-18

## Status
Active

## Context
LT asked that prompt review and thread continuity stop depending on ad hoc memory. The immediate trigger was an "auditor's pass" that produced a score without an explicit rubric, plus a broader concern that useful process patterns were not being promoted into durable repo artifacts for the next thread.

## Problem
Two failure modes were showing up:
- prompt and plan reviews could look rigorous while still being score theater
- reusable process decisions could stay trapped in chat and die with the thread

That creates avoidable drift. A future thread or a different model can only reuse what was actually saved.

## Decision
TBM now treats auditor-pass work and continuity as explicit operating behavior:

- Before handing off a reusable prompt, plan, template, or process artifact, run a real auditor's pass with explicit criteria.
- If a score is used, explain the rubric and what keeps the draft from 10/10.
- If a process becomes reusable, promote it in the same thread into a durable artifact: skill, workflow rule, operating memo, or saved repo file.
- If the next thread will need the artifact, save it and name the exact path.

## Canonical Rule Location
- `ops/WORKFLOW.md` - `Thread continuity and auditor's pass`
- `AGENTS.md` - `Two-Lane Roles (MANDATORY)` short mirror
- `CLAUDE.md` - `Two-Lane Roles (MANDATORY)` short mirror
- `.claude/skills/auditors-pass-continuity/SKILL.md` - reusable execution guide
- `ops/thread-handoffs/` - house location for one-off next-thread prompt drafts

## What Stays Flexible
- The exact rubric criteria for a given artifact
- Whether the final report uses a score, pass/gap language, or both
- The specific durable file path used for one-off handoffs
- The wording of the final prompt or memo

## Why
This removes fake rigor and reduces context-loss risk. A score becomes defensible only when the criteria are visible. A process becomes reusable only when it is saved where future threads can discover it.

## What Changes Now
- "Auditor's pass" means critique plus rubric plus revision, not just a score.
- "Make this permanent" means create a durable repo artifact in the same thread.
- One-off next-thread prompts live in `ops/thread-handoffs/` unless promoted into a reusable template or standard.
- Any prompt, plan, or template intended for reuse must include a continuity save path.

## Follow-Up Work
- None

## Source Conversation
- LT and Codex conversation on 2026-04-18 about auditor-pass scoring, reusable prompt review, and next-thread continuity.

## Repo Rules To Mirror
- real auditor's pass before reusable handoff
- continuity-by-default for any artifact that must survive the thread
- one-off next-thread prompt drafts live in `ops/thread-handoffs/`
- promote reusable process into a skill, standard, memo, or saved file in the same thread

## Notes
- This memo records the operating decision. The workflow file carries the detailed rule and the skill carries the execution pattern.
