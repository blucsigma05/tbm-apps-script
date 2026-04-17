# TBM Operating Framework

This directory contains the operational control documents for the TBM platform.

These are **not** architecture docs or code docs. They are **management instruments** for keeping the system healthy, truthful, and safe to evolve.

## Documents

| File | Purpose | Update cadence |
|------|---------|----------------|
| [SCORECARD.md](SCORECARD.md) | 8-category quality scorecard with current scores and 90-day targets | Weekly (Friday) |
| [ROADMAP-10-10.md](ROADMAP-10-10.md) | Phased plan to reach production-grade maturity | Monthly review |
| [DRIFT-LEDGER.md](DRIFT-LEDGER.md) | Feature-by-feature truth table: shipped, lost, regressed, partial | Per deploy / weekly |
| [OPS-DASHBOARD.md](OPS-DASHBOARD.md) | Operator-facing health view: status, risks, wins, action queue | Weekly (Monday) |
| [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md) | Pre/post deploy gates + new surface checklist | Every deploy |
| [PIPELINE-GO-LIVE.md](PIPELINE-GO-LIVE.md) | Required secrets, script properties, and first-live validation for the hosted pipeline | Before rollout |
| [RETROFIT-AUDIT-QUEUE-2026-04-05.md](RETROFIT-AUDIT-QUEUE-2026-04-05.md) | Concrete Codex retrofit queue for PRs 45-54 after the automation foundation landed | Until queue is empty |
| [WEEKLY-CADENCE.md](WEEKLY-CADENCE.md) | Mon/Wed/Fri operating rhythm | Reference |
| [HANDLER-GAP-AUDIT.md](HANDLER-GAP-AUDIT.md) | withFailureHandler() coverage audit and fix plan | Until resolved |
| [specs/](specs) | Build specs using the Pipeline Operating Mode template | Before work starts |
| [WORKFLOW.md](WORKFLOW.md) | Issue / PR / label / board workflow — canonical home for process rules, including `§ Two-Lane Handoff Rules` | Reference |
| [operating-memo-template.md](operating-memo-template.md) | Template for capturing boardroom conversations (process, architecture, role decisions) as durable memos | Copy when needed |
| [operating-memos/](operating-memos) | Dated operating memos produced from boardroom conversations; `2026-04-17-agent-roles-and-audit-scope.md` is the seed example | Appended per memo |
| [diagrams/two-lane-model.md](diagrams/two-lane-model.md) | Mermaid visual + house/contractor legend for the two-lane builder/auditor model | Reference |

> **Where the rules live.** Detailed process policy lives in [WORKFLOW.md](WORKFLOW.md); diagrams and templates are navigation aids, not separate rule sources. Short hard-rule mirrors sit in `AGENTS.md` and `CLAUDE.md` with pointers back to this directory.

## How To Use

1. **Before deploying:** Run through DEPLOY-CHECKLIST.md
2. **Monday:** Review OPS-DASHBOARD.md, set P0/P1 for the week
3. **Wednesday:** Run one real workflow per area, note results
4. **Friday:** Update SCORECARD.md, DRIFT-LEDGER.md, set next week's priority
5. **Monthly:** Review ROADMAP-10-10.md progress, re-score, reset phase focus

## Relationship to Other Docs

- **CLAUDE.md** = build rules and code standards (what Claude follows)
- **ops/** = operating framework (what the system operator tracks)
- **ops/specs/** = approved build specs and pipeline handoff artifacts
- **Notion** = architecture memory, QA history, handoffs, decision logs
- **GitHub** = runtime truth (deployed code)
