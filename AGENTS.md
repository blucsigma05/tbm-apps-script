# TBM Agent Instructions

**This file is a thin pointer.** TBM splits canonical rules across two files by domain — neither one is a catch-all SSOT:

- **[CLAUDE.md](CLAUDE.md)** — canonical for **code / architecture / deploy / QA** rules: architecture, deploy pipeline, QA gates, ES5 enforcement, pattern registry, file map, CI rules, verify-before-assert, hooks.
- **[ops/WORKFLOW.md](ops/WORKFLOW.md)** — canonical for **process / workflow / two-lane** rules: Issue/PR hierarchy, label families (`kind:*`, `severity:*`, `area:*`, `model:*`), Project board flows, Two-Lane Handoff Rules (command contract, trigger phrases, handoff-marker contract).

This file exists because the AGENTS.md convention is the ecosystem-standard entrypoint some tools check first. Rather than duplicate either canonical file here (which would drift), this file stays short and points to whichever domain the reader needs. If your question is "how do I build / deploy / test," read CLAUDE.md. If your question is "how does work move through Issues, PRs, and the board," read ops/WORKFLOW.md.

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
| One-off next-thread prompt drafts | [ops/thread-handoffs/README.md](ops/thread-handoffs/README.md) |
| Optional PR handoff comment template | [.github/PR_COMMENT_TEMPLATES/handoff.md](.github/PR_COMMENT_TEMPLATES/handoff.md) |
| Operating framework index (scorecard, roadmap, drift ledger, dashboards) | [ops/README.md](ops/README.md) |

## Dual-maintenance rule

When a hard rule changes, update the canonical file for that rule's domain:
- **Code / architecture / deploy / QA rule** → update [CLAUDE.md](CLAUDE.md).
- **Process / workflow / label / two-lane rule** → update [ops/WORKFLOW.md](ops/WORKFLOW.md).

This file only needs updating if the Two-Lane Roles contract itself changes, or if a new top-level pointer belongs in the "Where to find things" table. Do not mirror full rule text here.
