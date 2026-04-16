---
name: play-buggsy
description: Run MVSS v1 Play gate against a single Buggsy education route. Produce a ship/ship-with-backlog/do-not-ship verdict with evidence. Use when evaluating /homework, /reading, /writing, /wolfkid, /facts, /investigation, /comic-studio, /daily-missions, /wolfdome, /power-scan, or /baseline for Buggsy. Invoked by LT or Mastermind for P0-15 Play gate runs.
---

# Play/Buggsy — MVSS v1 Quality Gate for Buggsy's Education Surfaces

You are the Play gate evaluator for one Buggsy route. You produce one machine-readable verdict per invocation.

## Inputs

- **Route slug** — one of: `/homework`, `/reading`, `/writing`, `/wolfkid`, `/facts`, `/investigation`, `/comic-studio`, `/daily-missions`, `/wolfdome`, `/power-scan`, `/baseline` (with `child=buggsy`)
- **MVSS v1 rubric** — `ops/play-gate-rubric.v1.json`
- **Surface map** — `ops/surface-map.md`
- **Benchmark anchors**:
  - Prodigy Math (https://www.prodigygame.com/main-en/prodigy-math)
  - Pixton Education (https://www.pixton.com/proven-impacts)
  - Book Creator Comics (https://bookcreator.com/features/comics/)

## Audience context

Buggsy is 4th grade. Diagnosed ADHD. Attends Nance Elementary (math Meets 48%, science Meets 34%). STAAR windows: Dec 1–11, Apr 6–30. Needs:
- 3-2-1 rule (max 3 same-type questions consecutive)
- Count-up timers with milestones, NOT countdown (except Fact Sprint exception per `adhd-accommodations/SKILL.md:80`)
- Amber feedback on incorrect, never red
- Brain breaks every 4 questions
- Surface Pro 5 is primary device (per Notion canon Surface × Device × User)
- Marco ElevenLabs voice for audio
- Wolfdome theme (dark grid, neon, tech aesthetic)

## Per-family subsections

Buggsy route set is heterogeneous. Apply the family-specific benchmark + subset of rubric:

| Family | Routes | Primary competitor | Key criteria |
|---|---|---|---|
| `buggsy.curriculum` | `/homework`, `/reading`, `/writing`, `/wolfkid`, `/facts`, `/investigation` | Prodigy Math / Khan Academy | U1-U16, B1-B6, accessibility D-section, consistency X1-X5 |
| `buggsy.hub` | `/daily-missions`, `/wolfdome` | (no direct competitor — internal hub) | U-set except U5/U6 (hubs don't complete loops), B1/B2 emphasized |
| `buggsy.diagnostic` | `/baseline`, `/power-scan` | Khan Academy diagnostic flow | U-set with B5 (challenge-fit) emphasis |
| `buggsy.creation` | `/comic-studio` | Book Creator Comics (NOT Pixton — LT 2026-04-15) | C1-C6 (creation criteria) + U-set |

## Process

### Step 1 — Resolve surface

Read `ops/surface-map.md`. Identify route's family (from `product_class` column). Extract device, code, persistence contract, primary competitor, comparison anchor.

**Family override — `/wolfdome`:** The surface map currently labels `/wolfdome` as `creation-tool`, but it is a hub surface. Treat `/wolfdome` as `buggsy.hub` regardless of what `product_class` says in the map. Apply hub criteria (U-set minus U5/U6, B1/B2 emphasis) and skip ComicStudio C1-C6 subfamily.

For all other routes: if `product_class` is `curriculum-module` → `buggsy.curriculum`; `hub` → `buggsy.hub`; `diagnostic` → `buggsy.diagnostic`; `creation-tool` → `buggsy.creation`.

### Step 2 — Preconditions

Same as Play/JJ: PRE-1 (skip for modern-JS tier), PRE-2 (failure handlers), PRE-3 (Wolfdome palette vs `ops/themes/palettes.md`), PRE-4 (Safe wrapper chain).

### Step 3 — Gather evidence

Identical tool pattern to Play/JJ but:
- Viewport: 1368×912 for `buggsy-workstation` routes (Surface Pro 5)
- Voice check: Marco voice ID, not Nia

Artifact paths: `ops/evidence/preview/<route-slug>/buggsy/<yyyy-mm-dd>/`.

### Step 4 — Evaluate criteria

**Universal (U1-U16):** same as Play/JJ skill.

**Buggsy-specific (B1-B6):**
- B1 mission-clarity: goal stated in ≤1 short sentence + visible at top of surface
- B2 progress-reward-clarity: XP/rings/completion meter visible and updating believably
- B3 creation-usability: for creation family — typing/drawing/panel-selection feels responsive on Surface Pro 5
- B4 resume-integrity: per `persistence_contract` — draft/submitted/configured-once state restored correctly on reload
- B5 challenge-fit: content difficulty appropriate (not babyish, not frustrating). Sample 3 questions against grade-4 standards
- B6 artifact-or-accomplishment: evidence the kid can point to as "I did this" — saved artifact, submitted answer, earned ring

**Family-specific additions:**

For `buggsy.curriculum`:
- 3-2-1 rule: scan question sequence, no 3+ same-type consecutive (per `adhd-accommodations/SKILL.md:63`)
- Count-up timer only (exception: `/facts`): look for countdown syntax, fail if present outside Fact Sprint
- Amber feedback on wrong: grep CSS for `color: red` or similar in feedback states; fail if present
- Brain break every 4Q: look for break affordance or inserted micro-pause every 4 question indices

For `buggsy.creation` (ComicStudio only):
- C1 panel-layout-library: count available panel layouts, must be ≥6 without freeform drawing
- C2 dialogue-affordance: speech bubble placement + text entry works on Surface Pro 5
- C3 character-placement: drag-drop character/image onto panel — no rigging required
- C4 canvas-freeform: freeform drawing + image import as panel layer
- C5 artifact-export: save and export as single comic (PNG or PDF), restorable
- C6 multi-comic-library: past comics persist, reopenable

For `buggsy.hub`:
- **Skip U5 and U6 entirely** — hub surfaces do not own a completable loop or a persistence contract, so evaluating core-loop-completes or save-reload-holds will produce false failures. Mark both as `not_applicable` in the verdict.
- Focus evaluation on U1-U4, U7-U16, B1/B2, X1-X5.
- Navigation to all gated surfaces is functional.

For `buggsy.diagnostic`:
- B5 challenge-fit: critical (diagnostic must calibrate to actual grade-level)
- U6 save-reload-holds: critical (diagnostic can take multiple sessions; mid-flight state must persist)

**Accessibility (D-section):** same as Play/JJ but target size threshold is ≥24 CSS px (not 60 — Surface Pro 5 is not JJ tablet).

**Consistency (X1-X5):**
- X1 nav-placement: consistent header position across Buggsy surface set
- X2 back-behavior: destination matches `back_destination` column in surface-map
- X3 save-indicator: only allowed tokens (`Saved`, `Saving…`, `Unsaved changes`)
- X4 success-copy: drawn from `ops/copy-patterns.md` allowed vocab
- X5 error-copy: pattern `[what failed] + [user-actionable next step]`

### Step 5 — Emit verdict

Write to `ops/evidence/preview/<route-slug>/buggsy/<yyyy-mm-dd>/verdict.json`.

Schema identical to Play/JJ but with `child: "buggsy"`, Buggsy-family criteria in passed/failed lists, and benchmark notes comparing against family's primary competitor.

Special cases for Buggsy:
- If the route is `/comic-studio` AND C1-C6 subfamily applies, include explicit comparison to Book Creator Comics in `benchmarkNotes`.
- If `adhd-accommodations` 3-2-1/amber/countdown rules fail → severity `critical` (kid-facing reward pattern broken, akin to LT's #377 calibration).

### Step 6 — Escalation

Same #378 contract. Buggsy-specific note: ADHD-rule violations (3-2-1, countdown-where-banned, red feedback) default to severity `critical` unless the surface is explicitly whitelisted.

### Step 7 — Return summary

Print verdict JSON. One paragraph prose. Stop.

## Guardrails

- Do NOT modify code.
- If comic-studio times out (known Issue #377), emit `config_drift` with note "blocked by #377" — don't falsely mark as do-not-ship.
- Respect the Nance Elementary context: Buggsy's math/science baseline is below state average. Content that's "too hard" for a 4th grader elsewhere may be appropriate scaffolding here; use B5 judgment, not generic grade-4 benchmarks.

## Related

- Parent: MVSS v1 PR #361 (merged)
- Rubric: `ops/play-gate-rubric.v1.json`
- Spec: `ops/specs/2026-04-15-play-surface-minimum-viable-standard.md`
- Companion: Play/JJ skill (P0-12 Issue)
- Successor work: P0-15 (run skill against all 11 Buggsy routes), P0-16 (fix findings)
- Inline-finding contract: #378
- Known blocker: #377 (ComicStudio timeout — may gate full evaluation of /comic-studio)

## Build Skills

- `thompson-engineer` — server architecture
- `adhd-accommodations` — 3-2-1, countdown exception, amber rule, brain breaks
- `references:teks-math-grade4` — math content evaluation context
- `references:teks-science-grade4` — science content evaluation context
- `references:nance-school-data` — STAAR windows, school baselines
- `education-qa` — 7-gate framework
