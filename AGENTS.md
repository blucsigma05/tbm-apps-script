# TBM Agent Instructions

**This file is a thin pointer. The canonical project rules live in [CLAUDE.md](CLAUDE.md).** Any agent working in this repo — Claude family, Codex, or other tool-agnostic agents — should read `CLAUDE.md` first; that is the single source of truth for architecture, deploy pipeline, QA gates, ES5 enforcement, pattern registry, file map, CI rules, and everything else about how TBM is built and operated.

This file exists because the AGENTS.md convention is the ecosystem-standard entrypoint some tools check first. Rather than duplicate `CLAUDE.md` here (which would drift), we keep this short and load-bearing.

## Two-Lane Roles (MANDATORY)

- **Builder lane** (Claude/Opus/Sonnet): scope, spec, implement, fix.
- **Audit lane** (Codex): inspects the named PR or named current state only.
- **PR-scoped audits**: when LT names a PR, audit that PR alone unless LT explicitly says `stacked` or `after PR M`.
- **Plain-English commands**: agents translate LT's natural-language instructions into repo state. LT does not own git terminology.
- **Boardroom conversations become operating memos** in `ops/operating-memos/YYYY-MM-DD-<topic>.md` when they change how TBM operates.
- **Handoff comments are optional**: use `<!-- tbm-handoff -->` only when a PR changes hands mid-flight or pauses with a clear next action. At most one active comment per PR, edited in place.

See [ops/WORKFLOW.md § Two-Lane Handoff Rules](ops/WORKFLOW.md) for the command contract, trigger phrases, audit scope rules, and full examples. Visual companion: [ops/diagrams/two-lane-model.md](ops/diagrams/two-lane-model.md).

## Where to find things

| You want… | Read |
|---|---|
| Project rules, architecture, deploy pipeline, QA gates, patterns | [CLAUDE.md](CLAUDE.md) |
| Issue / PR / label / board workflow and two-lane nuance | [ops/WORKFLOW.md](ops/WORKFLOW.md) |
| Visual model of the builder/auditor flow | [ops/diagrams/two-lane-model.md](ops/diagrams/two-lane-model.md) |
| Operating memo template | [ops/operating-memo-template.md](ops/operating-memo-template.md) |
| Seed example memo (2026-04-17 two-lane decision) | [ops/operating-memos/2026-04-17-agent-roles-and-audit-scope.md](ops/operating-memos/2026-04-17-agent-roles-and-audit-scope.md) |
| Optional PR handoff comment template | [.github/PR_COMMENT_TEMPLATES/handoff.md](.github/PR_COMMENT_TEMPLATES/handoff.md) |
| Operating framework index (scorecard, roadmap, drift ledger, dashboards) | [ops/README.md](ops/README.md) |

## Dual-maintenance rule

When a hard rule changes, update [CLAUDE.md](CLAUDE.md) first. This file only needs updating if the Two-Lane Roles contract itself changes, or if a new top-level pointer belongs in the "Where to find things" table. Do not mirror full rule text here.
