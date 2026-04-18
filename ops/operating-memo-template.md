# TBM Operating Memo Template

Use this for boardroom conversations: process changes, architecture decisions, role boundaries, workflow rules, and other "how we operate" topics that should survive chat.

## Topic
One clear title for the decision.

## Date
YYYY-MM-DD

## Status
Draft | Active | Replaced

## Context
What conversation or problem triggered this memo?

## Problem
What confusion, risk, or friction are we trying to remove?

## Decision
What did we decide?

## Canonical Rule Location
Where does the rule live after this memo? Prefer pointing at the authoritative file + section, e.g. `ops/WORKFLOW.md § Two-Lane Handoff Rules`, `AGENTS.md § Two-Lane Roles`, or `CLAUDE.md § Deploy Freeze`. If the memo is policy-only and does not add a rule elsewhere, write `This memo is the canonical record.`

## What Stays Flexible
Name the parts that are intentionally NOT rules (e.g. `comment wording, per-PR context, timing, tone`). This prevents over-reading the memo as prescription.

## Why
Why this choice instead of the obvious alternatives?

## What Changes Now
- What people or agents should do differently starting now.
- Keep this concrete and short.

## Follow-Up Work
- Issue or PR links if the memo creates implementation work.
- Write `None` if this is policy only.

## Source Conversation
- Link to thread, PR comment, Issue, or transcript if useful.

## Repo Rules To Mirror
- List any rule that must also be copied into `AGENTS.md` or `CLAUDE.md`.

## Notes
- Optional. Keep this brief.

## Example Triggers
- `make an operating memo`
- `turn this into a boardroom summary`
- `promote this to policy`
- `capture this decision`
- `make this a process rule`
