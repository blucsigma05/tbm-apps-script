---
name: play-gate
description: Run the Play-Gate quality check against a single TBM education route. Produce a ship / ship-with-backlog / do-not-ship verdict with evidence conforming to ops/play-gate-verdict.schema.json. Supports both JJ and Buggsy routes. Invoked by LT, Mastermind, or scheduled tasks for Play-Gate runs. Replaces the legacy play-jj / play-buggsy skills (those remain as thin stubs for one cycle per v8 plan).
---

# Play-Gate — MVSS v1 Quality Gate (consolidated)

You are the Play-Gate evaluator. You produce exactly one machine-readable verdict per invocation. This is the architecture-spike skill for PR 1 — `scripts/play-gate.js` is the code registry that dispatches the 12 PR-1 criteria.

## Inputs

- **Route slug** — JJ routes: `/sparkle`, `/sparkle-free`, `/daily-adventures`, `/sparkle-kingdom`. Buggsy routes: `/homework`, `/reading`, `/writing`, `/wolfkid`, `/facts`, `/investigation`, `/comic-studio`, `/daily-missions`, `/wolfdome`, `/power-scan`, `/baseline`.
- **Rubric** — `ops/play-gate-rubric.v1.json` (authoritative criterion list + thresholds)
- **Profiles** — `ops/play-gate-profiles.json` (canonical device/viewport/voice/theme; all consumers read from this)
- **Surface map** — `ops/surface-map.md`
- **Schema** — `ops/play-gate-verdict.schema.json` (ajv-validated verdict shape; D1 regression enforces `ship_decision` field, forbids legacy `verdict` field)

## How it runs

```
node scripts/play-gate.js --route /sparkle --child jj --mode fixture
node scripts/play-gate.js --route /homework --child buggsy --mode fixture
```

The CLI spawns Playwright against `tests/tbm/play-gate/play-gate.spec.js`, which:
1. Resolves device viewport from `ops/play-gate-profiles.json:routeViewports[<route>]`
2. Shims GAS via `tests/tbm/fixtures/gas-shim.js` (PR-1 = fixture mode only)
3. Runs every criterion in `tests/tbm/play-gate/measurements/` via the registry in `measurements/index.js`
4. Synthesizes `ship_decision` per rules below
5. Writes verdict to `ops/evidence/play-gate/<route>/<child>/<yyyy-mm-dd>/verdict.json`

## Decision rules (PR-1 spike)

| Condition | Verdict | Notes |
|---|---|---|
| Any precondition (`PRE-*`) fails | `do-not-ship` + `failure_state: preconditions_not_met` | Surface-level blocker |
| Any universal/family `fail` (not surrogate) | `do-not-ship` + `failure_state: null` | Criterion-level blocker |
| At least one `surrogate` result | `ship-with-backlog` | Must include `surrogateNote` on every surrogate |
| All `pass` or `skip` | `ship` | Clean sheet |

## Criteria (PR-1 = 12 total)

**Preconditions:** PRE-2 (failure-handler-coverage), PRE-4 (safe-wrapper-chain-intact)
**Universal:** U1, U2, U3, U7, U11, U12, U13, U14
**JJ-only:** J1 (theme-integrity)
**Buggsy-only:** B1 (mission-clarity)

PR-2+ adds U5, U6, U8, U9, U10, U15, U16, the remaining J* and B* criteria, and live-mode backfill.

## Non-goals for PR 1 (per v8 plan B1)

- Not a WCAG compliance claim
- Not proof the standard holds across product families
- Not proof live save/progress/reporting paths work
- Not `screenshots.spec.js` migration (PR 2)
- Not shared-shim consumer migration (PR 2)
- Not evidence-root rename (migration PR)

## U4 status

`U4 (core-loop-starts-fast)` is `blocked_on: "instrumentation-issue"` per rubric. PR 1 does not run U4. PR 3 closes U4 via: (a) real instrumentation, (b) LT-approved rubric waiver, or (c) LT-approved surrogate. Surrogate requires LT written approval AND a follow-up Issue (`kind:task` + `area:qa`) — a verdict.json note alone is insufficient (v8 rule).

## Legacy stubs

`.claude/skills/play-jj/SKILL.md` and `.claude/skills/play-buggsy/SKILL.md` are stubs for one release cycle. They invoke this skill's CLI with the appropriate child parameter. D3 regression test asserts both return schema-identical verdicts to `play-gate`.

## Reference

- Rubric: `ops/play-gate-rubric.v1.json` (version `2026-04-15-play-gate-v1`)
- Schema: `ops/play-gate-verdict.schema.json`
- Profile source: `ops/play-gate-profiles.json`
- Parent EPIC: #439
- Build Issue: #442
- Prototype: #440
