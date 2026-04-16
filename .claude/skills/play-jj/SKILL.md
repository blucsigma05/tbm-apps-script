---
name: play-jj
description: Run MVSS v1 Play gate against a single JJ education route. Produce a ship/ship-with-backlog/do-not-ship verdict with evidence. Use when evaluating /sparkle, /sparkle-kingdom, /daily-adventures, /sparkle-free, or /baseline for JJ. Invoked by LT or Mastermind for P0-14 Play gate runs.
---

# Play/JJ — MVSS v1 Quality Gate for JJ's Education Surfaces

You are the Play gate evaluator for one JJ route. You produce one machine-readable verdict per invocation. You do not ship code; you judge shipping.

## Inputs

- **Route slug** — one of: `/sparkle`, `/sparkle-kingdom`, `/daily-adventures`, `/sparkle-free`, `/baseline` (with `child=jj`)
- **MVSS v1 rubric** — `ops/play-gate-rubric.v1.json` (canonical)
- **Surface map** — `ops/surface-map.md` (route → device + code + data deps)
- **Benchmark anchors** — ABCmouse (https://www.abcmouse.com/learn/program/early-childhood-learning-programs-online), Khan Academy Kids (https://www.khanacademy.org/kids), PBS KIDS (https://pbskids.org/)

## Audience context

JJ is 4 years old. Pre-reader. Short attention span. Needs:
- Touch targets ≥60px on S10 FE tablet (per `prek-milestones.md:93`)
- Nia ElevenLabs voice for all audio
- Sparkle Kingdom theme (purple-pink gradient, gold, stars)
- Gentle failure (no red, no punishing copy)
- Auto-redirect fallback to `/sparkle-kingdom` hub when stuck

## Process

### Step 1 — Resolve the surface

Read `ops/surface-map.md`. Find the row for the input route. Extract:
- Primary device
- Primary code files
- Data sources
- `persistence_contract`, `product_class`, `primary_competitor`, `comparison_anchor_url`, `back_destination`

**Device assertion (child-aware):** `/baseline` is a shared row covering both children. When `child=jj`, assert the S10 FE device column is present — do NOT emit `config_drift` just because the row also lists Surface Pro 5 for Buggsy. For all other JJ routes (JJ Personal surfaces), the row should list S10 FE exclusively; emit `config_drift` if the device is not S10 FE.

### Step 2 — Run preconditions (PRE-1..PRE-4)

Load rubric. For each precondition, apply its `measurement_method`:
- PRE-1 (ES5 Fire-OS-only): skip for JJ Personal surfaces (S10 FE is modern-JS tier per Notion canon)
- PRE-2 (failure-handler coverage): grep target .html for `withFailureHandler(function(){})` or `withFailureHandler(function() {})` — any match = fail
- PRE-3 (theme palette): read `ops/themes/palettes.md`, extract Sparkle Kingdom hex set, grep surface CSS for deviations
- PRE-4 (safe-wrapper chain): grep for `google.script.run\.` in surface, assert every callee ends in `Safe`

Any fail → emit `preconditions_not_met`, abort run, write verdict.json, stop.

### Step 3 — Gather evidence

Use Claude Preview MCP tools in this order:
1. `preview_start` — start the `tbm-preview` config
2. `preview_resize` — set viewport to match surface-map primary device (1200×1920 portrait for JJ Personal)
3. Navigate to route (via `preview_eval` — `window.location.href = '<route>'`)
4. `preview_screenshot` — capture initial state
5. `preview_snapshot` — accessibility tree
6. `preview_console_logs` — capture console errors / warnings
7. `preview_network` — capture network requests, check for 4xx/5xx
8. Read surface HTML source with `Read` tool
9. Read companion server file (e.g., `Kidshub.js` for education surfaces) — focus on functions the surface calls

Artifact paths (following `ops/evidence/preview/<route-slug>/<child>/<yyyy-mm-dd>/`):
- `screenshot.png` — preview capture
- `snapshot.json` — accessibility tree
- `console-logs.txt` — console output
- `network.json` — request list
- `verdict.json` — the final output (see Step 5)

### Step 4 — Evaluate criteria

For each rubric entry, evaluate against gathered evidence.

**Universal (U1-U16):**
- U1 correct-device: viewport match? If not match, major finding.
- U2 loads-cleanly: status 200, no blocking console error (filter info-level), no endless spinner
- U3 correct-child-context: child theme present (Sparkle Kingdom hex palette, Nia-voice audio clips), right data
- U4 core-loop-starts-fast: measure time from route-ready to first state transition via preview_eval performance API. Target ≤5s. (Marked `blocked_on: "instrumentation-issue"` per rubric — emit `perf_unknown` for now.)
- U5 core-loop-completes: simulate one interaction via preview_click, assert completion state
- U6 save-reload-holds: per surface's `persistence_contract` column — if `submitted|draft`, perform save → reload → assert state
- U7 no-silent-failure: introduce a forced failure (e.g., network offline via preview eval), assert visible fallback state
- U8 feedback-understandable: interaction produces visible change within 200ms
- U9 controls-fit-device: target sizes ≥60px for JJ routes (query computed styles via preview_inspect)
- U10 no-dead-ends: from any state, assert either a back destination, a retry, or a completion
- U11 truthful-promise: look for UI text promising save/reward; confirm backend records the event
- U12 written-judgment: (emitted by this skill's own output — always passes if we're here)
- U13 empty-state-defined: force empty data (e.g., mock empty curriculum), assert specific CTA + message
- U14 error-has-retry-path: look for native `alert()` in HTML source, empty withFailureHandler, gate-check bypass — any = fail
- U15 loading-has-max-time: grep for spinner/loading state timeout config
- U16 offline-behavior-declared: per surface-map `persistence_contract` — if queue-required but no queue evidence, fail

**JJ-specific (J1-J6):**
- J1 theme-integrity: visual match to Sparkle Kingdom promise (screenshot comparison vs anchor)
- J2 audio-consistency: grep for ElevenLabs Nia voice ID in audio src / phrases.json; no voice switches mid-session
- J3 delighted-success: trigger a correct action, assert visible celebration (sparkle/star/confetti) + positive audio
- J4 gentle-failure: trigger a wrong answer, assert no red, no punishing copy, gentle redirect
- J5 age-fit-content: text density ≤ 3 choices on screen, ≤ one line of instruction at a time, font ≥32pt (per prek-game-design memory)
- J6 adult-confidence-signal: saved state / star count / logged completion visible OR present in backend data

**Accessibility (D-section):**
- `<html lang>` present — grep first 10 lines
- No `user-scalable=no` in viewport meta — grep viewport
- Target size ≥60px (JJ routes) — preview_inspect computed style `width`/`height`/`padding`
- `prefers-reduced-motion` respected — grep for `@media (prefers-reduced-motion: reduce)` in CSS OR reduced-motion code path
- Visible focus — preview_eval `document.activeElement` styles after tab
- Contrast 4.5:1 body / 3:1 UI — run axe-core via preview_eval (if available) or flag `unchecked`
- Reflow at 320px — preview_resize 320×568, assert no horizontal scroll

**Should-pass (S1-S5):**
Evaluate as polish-level; S-failures don't block ship but accumulate toward `ship-with-backlog`.

### Step 5 — Emit verdict

Write to `ops/evidence/preview/<route-slug>/jj/<yyyy-mm-dd>/verdict.json`:

```json
{
  "route": "/sparkle",
  "child": "jj",
  "device": "Samsung S10 FE 1200x1920",
  "runAt": "2026-04-16T15:00:00Z",
  "runner": "play-jj",
  "rubricVersion": "2026-04-15-play-gate-v1",
  "verdict": "ship-with-backlog",
  "preconditionsResult": "pass",
  "passedCriteria": ["U1", "U2", "U3", "U6", "U7", "U8", "U10", "U11", "U14", "U15", "U16", "J1", "J2", "J3", "J4", "J6"],
  "failedCriteria": [
    {"id": "J5", "evidence": "Three-plus choices visible simultaneously on letter-match screen", "severity": "major"},
    {"id": "A11Y-LANG", "evidence": "<html> missing lang attribute", "severity": "major"}
  ],
  "unmeasuredCriteria": [
    {"id": "U4", "reason": "blocked_on instrumentation-issue (perf trace not wired)"},
    {"id": "U13", "reason": "could not simulate empty-data fallback without backend mutation"}
  ],
  "shouldPassWeaknesses": ["S1", "S3"],
  "benchmarkNotes": "Compared against ABCmouse + Khan Kids: JJ Sparkle feels more cohesive on theme (J1); lags on stickered progress celebration depth (S2).",
  "evidence": {
    "screenshot": "ops/evidence/preview/sparkle/jj/2026-04-16/screenshot.png",
    "snapshot": "ops/evidence/preview/sparkle/jj/2026-04-16/snapshot.json",
    "consoleLogs": "ops/evidence/preview/sparkle/jj/2026-04-16/console-logs.txt",
    "network": "ops/evidence/preview/sparkle/jj/2026-04-16/network.json"
  },
  "recommendation": "ship-with-backlog — fix J5 (choice-density) and add lang attribute (A11Y-LANG) before next release cycle; both are blockers to a full ship verdict"
}
```

### Step 6 — Escalation per #378 contract

For every `failedCriteria` entry:
- `severity: "blocker"` → file Issue with `kind:bug` + `severity:blocker` + `area:jj` + `found-by:play-jj` + PR/Issue link. Pushover to LT (once Tier B webhook lands).
- `severity: "critical"` → same as blocker. Pushover.
- `severity: "major"` → file Issue + labels; no Pushover; add to weekly digest queue.
- `severity: "minor"` → file Issue + labels; backlog.

If Issue body would be >1000 lines, link to verdict.json in repo instead of inlining.

### Step 7 — Return output

Print the verdict JSON. Stop. Do not add prose unless the invoker explicitly asked for a summary (e.g., `"summarize": true` in input or a verbal request).

## Guardrails

- Do NOT modify product code or surface files during evaluation. Writing evidence artifacts under `ops/evidence/` is required and permitted; editing anything else is not.
- Do NOT fill in `unmeasuredCriteria` with invented answers. If you can't measure, flag it.
- Do NOT skip preconditions even if they feel obviously fine. Run each.
- If preview_start fails to load the route, emit `config_drift` not `do-not-ship`. Distinguish environment problem from surface problem.

## Output contract

One verdict JSON per invocation. Evidence artifacts written to `ops/evidence/preview/<route-slug>/jj/<yyyy-mm-dd>/`. No prose appended unless the invoker explicitly requests it.

## Related

- Parent: MVSS v1 PR #361 (merged)
- Rubric: `ops/play-gate-rubric.v1.json`
- Spec: `ops/specs/2026-04-15-play-surface-minimum-viable-standard.md`
- Companion: Play/Buggsy skill (separate P0-13 Issue)
- Successor work: P0-14 (run skill against all JJ routes, produce 5 verdicts), P0-16 (fix findings)
- Inline-finding contract: #378

## Build Skills

- `thompson-engineer` — understand server architecture the surfaces call
- `adhd-accommodations` — (not applicable to JJ but referenced by Buggsy companion)
- `references:prek-milestones` — JJ age-appropriate criteria
- `education-qa` — 7-gate QA framework
