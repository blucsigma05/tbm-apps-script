---
name: play-buggsy
description: STUB — delegates to the play-gate skill with child=buggsy. Kept for one release cycle per v8 plan B1 so any caller referring to this skill name continues to work. Runs the Play-Gate quality check against a Buggsy route and produces a schema-identical verdict to play-gate.
---

# play-buggsy — Legacy stub (one release cycle)

This skill is a thin stub. The authoritative skill is `.claude/skills/play-gate/SKILL.md`.

## Invocation

For any Buggsy route (`/homework`, `/reading`, `/writing`, `/wolfkid`, `/facts`, `/investigation`, `/comic-studio`, `/daily-missions`, `/wolfdome`, `/power-scan`, `/baseline`), run:

```
node scripts/play-gate.js --route <route> --child buggsy --mode fixture
```

The output conforms to `ops/play-gate-verdict.schema.json` and is written to `ops/evidence/play-gate/<route>/buggsy/<yyyy-mm-dd>/verdict.json`.

## Why this is a stub

v8 plan B1 consolidates `play-jj` + `play-buggsy` into a single `play-gate` skill that reads child + route as parameters. Keeping this stub file for one cycle prevents breakage for any external caller that still references `play-buggsy` by name. D3 regression test asserts the stub produces a verdict schema-identical to the main skill.

## Removal schedule

PR 2 cycle close: remove this stub if no caller outside the repo still references it (grep `ops/`, `.github/`, external procedure docs).

## Reference

- Consolidated skill: `.claude/skills/play-gate/SKILL.md`
- Rubric: `ops/play-gate-rubric.v1.json`
- Schema: `ops/play-gate-verdict.schema.json`
- Build Issue: #442
