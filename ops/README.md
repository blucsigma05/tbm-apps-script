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
| [WEEKLY-CADENCE.md](WEEKLY-CADENCE.md) | Mon/Wed/Fri operating rhythm | Reference |
| [HANDLER-GAP-AUDIT.md](HANDLER-GAP-AUDIT.md) | withFailureHandler() coverage audit and fix plan | Until resolved |

## How To Use

1. **Before deploying:** Run through DEPLOY-CHECKLIST.md
2. **Monday:** Review OPS-DASHBOARD.md, set P0/P1 for the week
3. **Wednesday:** Run one real workflow per area, note results
4. **Friday:** Update SCORECARD.md, DRIFT-LEDGER.md, set next week's priority
5. **Monthly:** Review ROADMAP-10-10.md progress, re-score, reset phase focus

## Relationship to Other Docs

- **CLAUDE.md** = build rules and code standards (what Claude follows)
- **ops/** = operating framework (what the system operator tracks)
- **Notion** = architecture memory, QA history, handoffs, decision logs
- **GitHub** = runtime truth (deployed code)
