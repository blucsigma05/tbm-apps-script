# TBM Work Doctrine — CP-4
<!-- control-plane v1 — rules 1-16 + Forbidden list from expressive-bubbling-diffie.md plan, verbatim -->

## The Rules

1. Issue is canonical. No work without one.
2. No branch without an Issue.
3. Not on main = not real.
4. User-facing close requires device verification.
5. "Ready" names the layer.
6. Docs cannot outrank main/deployed/device.
7. Manual LT follow-up only when Code truly can't.
8. Every artifact points back to its Issue.
9. Every close-out states what was verified and at what layer.
10. SHA + grep proof for function/file existence claims.
11. Branch-only must be labeled branch-only.
12. Spec not built = Issue stays open.
13. Map + doctrine + verification = foundation. Audits = backstop.
14. Every PR touching a mapped surface updates the map. The implementing thread updates the map in the same PR. If the map is incomplete after the PR, the PR is not done. **Drift-control extension (MVSS v1):** If a PR's changed files intersect any value in the `tracked_files` column of `ops/surface-map.md` where `mvss_scope` is `education` or `chore`, the PR must also touch `ops/specs/2026-04-15-play-surface-minimum-viable-standard.md` or `ops/play-gate-rubric.v1.json`, or carry the label `rubric-n/a`. Enforced by `.github/workflows/hyg-14-rubric-drift.yml`. **Freeze-gate extension (P0-21):** Any PR adding a new freeze-critical mutation site (Safe wrapper that writes to money/kid-truth/household-config per `ops/mutation-paths.md` classes) MUST add `assertNotFrozen_('freeze-critical', 'funcName')` at the top of the wrapper AND add a row to `ops/mutation-paths.md`. See `ops/deploy-freeze.md` for full contract.
15. No unmapped change to a mapped surface. If a PR changes behavior for a mapped surface, the relevant map entries must be reviewed and updated in the same PR.
16. Chat Claude (Opus) cannot verify repo/deployed/device truth. If in chat: say "I can't verify from chat" — no performing confidence. TACT applies.

---

## Forbidden

- "Ready" without naming the layer
- Branch work in readiness language
- Closing user-facing Issues without device proof
- Treating Notion/spec as equivalent to build
- Handing LT no-op follow-up as completion proof
- Verifying payloads while skipping rendered surface

---

## Readiness Layers (for Rule 5)

| Layer | Definition | How to name it |
|---|---|---|
| branch-only | Change exists in local/remote branch, not in main | "branch-only" |
| main | Merged to origin/main | "on main" |
| deployed | clasp deploy completed, GAS serving new version | "deployed" |
| smoke-verified | `?action=runTests` → overall PASS + smoke PASS | "smoke-verified" |
| device-verified | LT or JT confirmed on real hardware | "device-verified" |

A claim of "ready" without specifying which layer is a violation of Rule 5.

---

## Completion Classes (from Master Stabilization Plan)

**Blocks Stable Use:**
P0, P1, P3 critical findings, P4 truth-critical items (#72-73), P7, P8 finance stability items (#96-98)

**Required Follow-Through (nothing dropped, doesn't block stable-use declaration):**
P2, P3 non-critical, P4 architecture items, P5, P6, P8 March close

**Definition of Done — Stable Unattended Use:**
- All "Blocks Stable Use" items complete
- Control plane exists in `ops/` and is current
- 4+ observation days with zero interventions
- JT can operate without LT
- All "Required Follow-Through" items have canonical Issues, current status, and explicit next action

**Definition of Done — Full Stabilization:**
ALL items (including follow-through) complete.
