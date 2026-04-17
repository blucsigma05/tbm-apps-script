# TBM Operating Memo

## Topic
Shared repo, separate roles, and PR-scoped audits

## Date
2026-04-17

## Status
Active

## Context
TBM now uses a shared repo where Claude-family builders and Codex both work in the same project. This improved file access, but it also created confusion around role boundaries, PR scoping, and how to preserve important process conversations.

## Problem
Important operating decisions were living in chat only. That caused three problems:
- audit requests were sometimes over-scoped by inferred branch context
- LT was being forced to translate plain-English asks into git terms
- strategy and workflow conversations had no durable home outside raw transcripts

## Decision
TBM will use one shared repo with separate lanes:
- Claude/Opus/Sonnet are the builder lane
- Codex is the audit lane

Audit rule:
- If LT names a PR, audit that PR only unless LT explicitly says stacked or after another PR.

Conversation rule:
- If a boardroom conversation changes how TBM operates, capture it as an operating memo.

Language rule:
- Agents must translate LT's plain-English instructions into repo state. LT does not need to manage branch, commit, or HEAD terminology.

## Canonical Rule Location
- `ops/WORKFLOW.md § Two-Lane Handoff Rules` — full command contract, trigger phrases, and marker rules.
- `AGENTS.md § Two-Lane Roles (MANDATORY)` — short hard-rule mirror.
- `CLAUDE.md § Two-Lane Roles (MANDATORY)` — same short hard-rule mirror (identical to AGENTS.md block).
- `ops/diagrams/two-lane-model.md` — visual companion + house/contractor legend.

## What Stays Flexible
- Exact wording of any handoff comment (the `<!-- tbm-handoff -->` template is a shape, not a script).
- Per-PR context (what the Next Action actually says; what the Notes section contains).
- Timing — when LT decides to ask for a re-audit vs. a new audit; when a conversation gets promoted to a memo. Trigger phrases are examples, not an exhaustive allowlist.
- Tone — these rules are about scope and durability, not voice. Agents keep their individual writing styles.

## Why
This keeps the inspector independent without forcing separate repos. It also turns process decisions into durable operating records instead of scattered chat fragments.

## What Changes Now
- `audit 443` means PR 443 only.
- `re-audit 443` means the newest current state of PR 443 only.
- Boardroom conversations should be summarized into an operating memo when they change team behavior.
- Repo-wide behavior changes should be mirrored into `AGENTS.md` and `CLAUDE.md`.

## Follow-Up Work
- None

## Source Conversation
- LT and Codex conversation on 2026-04-17 about repo roles, audit scope, and boardroom summaries.

## Repo Rules To Mirror
- Shared repo, separate roles
- PR-scoped audits unless LT explicitly asks for stacked context
- Plain-English commands are preferred
- Boardroom conversations should become operating memos

## Notes
- This memo is the seed example for future operating memos.
