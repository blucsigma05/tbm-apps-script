# Play-Gate Consumer Inventory (P3)

Prerequisite inventory for Issue [#440](https://github.com/blucsigma05/tbm-apps-script/issues/440) under EPIC [#439](https://github.com/blucsigma05/tbm-apps-script/issues/439). This document is the P3 deliverable of the v8 plan: categorize every repo-local consumer of the evidence-root path `ops/evidence/preview/` before migration to `ops/evidence/play-gate/`.

Generated 2026-04-17 from grep + workflow inspection. Refresh before the migration PR opens.

## Class table

| Class | Files | Update action in migration PR |
|---|---|---|
| **Writers** — code that emits artifacts | future `scripts/play-gate.js` (PR 1) writes new runs to `ops/evidence/play-gate/` directly; no legacy writer exists | No migration — new code writes new path from day 1 |
| **Uploaders** — CI workflows that publish artifacts | `.github/workflows/playwright-regression.yml` (1 `path:` entry) | Update `path:` string to new root in migration PR |
| **Readers** — code/workflows that consume artifacts | None found in grep (no readers in-repo today) | No action until a reader emerges |
| **Docs** — markdown/JSON referencing the path | `ops/play-gate-rubric.v1.json:478`, `ops/specs/2026-04-15-play-surface-minimum-viable-standard.md:435`, `.claude/skills/play-jj/SKILL.md`, `.claude/skills/play-buggsy/SKILL.md` | Update path strings atomically in migration PR |
| **Duplicate/shadow skills** | `.agents/skills/play-jj/SKILL.md`, `.agents/skills/play-buggsy/SKILL.md` (untracked shadow of `.claude/skills/`) | Confirm with LT whether `.agents/` is authoritative or dead before migration PR; treat as unknown-unknowns if unresolved |
| **Temp handoffs** | `.claude/tmp/issue-321-rule-homework.md`, `.claude/tmp/issue-reduced-motion.md`, `.claude/tmp/thread-handoff-2026-04-17.md` | No update — files decay naturally on next thread cycle |
| **Procedures** — human-executed checklists | None found in plain prose | Flag at PR review if one surfaces |
| **Unknown-unknowns** — external consumers not in-repo | Cloudflare dashboards, Pushover alerts, external shell scripts, Notion handoffs, LT personal notes — not enumerable | **Rollback-on-miss rule** (see below) |

## Migration rule

The evidence-root rename lands in a **dedicated migration PR** after PR 1 closes. Non-migration PRs (including PR 1 itself) write new evidence to `ops/evidence/play-gate/` directly.

The migration PR atomically:
1. Updates the single uploader (`.github/workflows/playwright-regression.yml`).
2. Updates the 4 doc consumers (rubric JSON, spec MD, 2 skill SKILL.md).
3. Resolves the `.agents/skills/**` shadow (either promotes, deletes, or documents why it exists).
4. Adds a CI check (extension of `check_profile_sync.py` or sibling) blocking new string literals `ops/evidence/preview` in non-legacy locations.

## Rollback-on-miss rule

If the migration PR lands and any consumer proves missed — split-brain evidence between old and new roots, broken Pushover link, broken dashboard, etc. — the migration PR is **reverted**, the missed consumer is added to this inventory, and the migration is re-landed. This is the designed failsafe for the unknown-unknowns class.

Not a piecemeal fix-forward. Not a partial revert. Revert the whole migration PR, fix, re-land.

## Post-migration artifact-integrity smoke check (v8)

Immediately after the migration PR merges, a one-shot CI smoke job runs:

1. Write a dummy verdict.json to `ops/evidence/play-gate/smoke/test/<today>/verdict.json` from within a CI job.
2. Invoke the updated `.github/workflows/playwright-regression.yml` uploader step against the smoke path.
3. Read the artifact back from the CI run's artifact store; assert it lives at the expected path.
4. Grep every updated doc consumer (`ops/play-gate-rubric.v1.json`, `ops/specs/2026-04-15-play-surface-minimum-viable-standard.md`, `.claude/skills/play-*/SKILL.md`) for any residual `ops/evidence/preview` string.
5. Fail the smoke job (blocking subsequent merges to main) on any mismatch.

This single smoke-run proves writer + uploader + doc paths all align end-to-end, catching any silent split-brain before it reaches an adoption PR.

## Inventory refresh checklist (before migration PR opens)

- [ ] Re-grep `ops/evidence/preview` across the repo — confirm still 9 repo-local hits in 7 distinct files
- [ ] Re-grep `.github/workflows/` for any new uploader added since 2026-04-17
- [ ] Confirm `.agents/skills/` shadow status with LT — promote / delete / document
- [ ] Ask LT if any external consumer (Cloudflare dashboard, Pushover link, shell alias) uses the old path
- [ ] Confirm temp handoffs have naturally decayed and don't need special handling

## Related

- EPIC [#439](https://github.com/blucsigma05/tbm-apps-script/issues/439) — Play-Gate Architecture + MCSS Adoption Roadmap
- Task [#440](https://github.com/blucsigma05/tbm-apps-script/issues/440) — P1/P2/P3 prerequisite prototype
- Plan: `C:\Users\BluCs\.claude\plans\i-need-you-to-encapsulated-fountain.md` (v8, approved 2026-04-17)
