Title: Play Surface Minimum Viable Standard v1
Notion link: Pending
Repo: blucsigma05/tbm-apps-script
Owner: LT
Current pipeline status: Defined -> ready for issue wiring and automation

## Problem

Backlog items `101` and `102` currently block the Play gate because "good enough to ship"
is undefined. In this repo, a surface is not just an HTML file. It is a route shown to a
specific child on a specific device class. If the target device is wrong, the gate is wrong.
If the competitor bar is fuzzy, the gate becomes opinion.

This spec defines one minimum viable standard for JJ surfaces and one for Buggsy surfaces,
using the actual device profiles they use plus a small benchmark set of current competitor
products. The goal is not to beat every competitor on every feature. The goal is to make
"ship / do not ship" deterministic enough that a Play skill or automation can run it without
guessing.

## Verified On

- Local control-plane files: `ops/surface-map.md`, `ops/verification-matrix.md`,
  `ops/master-stabilization-backlog.md`
- Local route representatives: `JJHome.html`, `SparkleLearning.html`, `daily-missions.html`,
  `ComicStudio.html`
- Local skills: `.claude/skills/qa-walkthrough/`, `.claude/skills/education-qa/`,
  `.claude/skills/game-design/`
- Official benchmark anchors refreshed on 2026-04-15:
  - JJ benchmark set:
    - [ABCmouse](https://www.abcmouse.com/learn/program/early-childhood-learning-programs-online)
    - [Khan Academy Kids](https://www.khanacademy.org/kids?pStoreID=epp.%2F)
    - [PBS KIDS](https://pbskids.org/)
  - Buggsy benchmark set:
    - [Prodigy Math](https://www.prodigygame.com/main-en/prodigy-math)
    - [Pixton Education](https://www.pixton.com/proven-impacts)
    - [Book Creator Comics](https://bookcreator.com/features/comics/)
- Known truth note: existing repo docs disagree on some Buggsy education target devices.
  This spec resolves that by requiring every Play run to name the device profile explicitly.
  If the route-to-device assignment is ambiguous, the run fails as `config_drift` instead of
  pretending the bar is known.

## Why it matters

- The Play gate cannot be trusted if it only checks "route loads."
- JJ and Buggsy need different bars because the target ages, devices, and competitive
  expectations are different.
- A deterministic standard lets future automation compare TBM against real apps like
  ABCmouse, Khan Academy Kids, Prodigy, Pixton, and Book Creator without turning the
  result into an essay contest.
- Device-specific quality matters more than desktop prettiness. A surface that feels fine on
  a laptop but awkward on an A9 or Surface Pro is not ready.

## What changes

### 1. Surface definition for Play gate runs

For this gate, a "surface" means:

`route + child + device profile + core loop`

The run is invalid if any one of those is missing.

### 2. Device profiles that define the standard

| Child | Device profile | Viewport | Primary routes | Gate type |
|---|---|---|---|---|
| JJ | `jj-board-tablet` | `800x1340` | `/jj` | full |
| JJ | `jj-learning-tablet` | `1200x1920` | `/sparkle`, `/daily-adventures`, `/sparkle-kingdom` | full |
| Buggsy | `buggsy-board-tablet` | `800x1340` | `/buggsy`, `/wolfdome` | full |
| Buggsy | `buggsy-workstation` | `1368x912` | `/daily-missions`, `/homework`, `/reading`, `/writing`, `/wolfkid`, `/facts`, `/investigation`, `/comic-studio` | full |
| Buggsy | `buggsy-secondary-tablet` | `800x1340` | `/homework`, `/reading`, `/writing`, `/wolfkid`, `/comic-studio`, `/baseline` | functional-smoke |

Rules:

- The primary device profile is the one that decides ship / do not ship.
- The secondary device profile is allowed to be weaker, but it still must not hard-fail,
  trap the child, or corrupt progress.
- If a route is shown to a child on more than one device in real life, both device profiles
  must be named in the gate output.

### 3. Universal Must-Pass rules

Every JJ and Buggsy surface must satisfy all of these on its primary device profile.

| ID | Rule | Pass condition |
|---|---|---|
| `U1` | Correct device | Tested at the mapped viewport for the real device profile |
| `U2` | Loads cleanly | Route returns `200`; no blank screen; no blocking console error; no endless spinner |
| `U3` | Correct child context | The route clearly shows the right child theme, data, and copy |
| `U4` | Core loop starts fast | Child can begin the intended action within 2 interactions and about 5 seconds of orientation |
| `U5` | Core loop completes | One real task, mission, lesson, or draft can be completed end-to-end |
| `U6` | Save / reload holds | Progress, draft, submission, or completion state survives reload or resume when the surface promises it |
| `U7` | No silent failure | Any missing data, audio, or backend response shows an explicit fallback state instead of doing nothing |
| `U8` | Feedback is understandable | Taps, clicks, answers, and saves produce visible or audible confirmation appropriate for the child's age |
| `U9` | Controls fit the device | Buttons, cards, input fields, and drawing areas are reachable and usable on the target device |
| `U10` | No dead ends | The child can recover from an error, back out, continue, or finish without needing adult intervention |
| `U11` | Truthful promise | The UI does not claim a reward, save, unlock, or completion that the backend does not honor |
| `U12` | Written judgment | The run produces a named decision: `ship`, `ship-with-backlog`, or `do-not-ship` with evidence |

If any universal must-pass rule fails on the primary device, the surface is `do-not-ship`.

### 4. JJ minimum viable standard

JJ surfaces compete less on complexity and more on warmth, clarity, and confidence.
The minimum bar is "guided, joyful, and safe for an early learner."

#### JJ must-pass additions

| ID | Rule | Pass condition |
|---|---|---|
| `J1` | Theme integrity | The game or board visually matches Sparkle Kingdom promise, not a generic worksheet after a magical loading screen |
| `J2` | Audio consistency | Instruction and celebration audio stay consistent within a session; no confusing voice switching if better audio is available |
| `J3` | Delighted success | Correct actions produce friendly delight: sparkle, star, celebration, or clear positive feedback |
| `J4` | Gentle failure | Wrong answers redirect gently; no punishing copy, harsh red-state, or ambiguous "nothing happened" outcome |
| `J5` | Age-fit content | Content, text density, and number of choices fit early-learning attention span and reading level |
| `J6` | Adult confidence signal | Parent or teacher can infer progress from saved state, star count, or logged completion even if the child is playing independently |

#### JJ benchmark categories

Compare the surface against the JJ benchmark set on these categories:

| Category | What "at least viable" means |
|---|---|
| Onboarding clarity | At least as easy to start as ABCmouse or Khan Academy Kids; no adult-style setup friction |
| Joy / delight | The session feels playful and alive, not like a dead worksheet inside a bright frame |
| Guided learning | The child always knows what to do next through copy, layout, audio, or animated cues |
| Session safety | Closed-world feel; no confusing exits, blank states, or accidental navigation traps |
| Progress visibility | There is a visible sense of completion, stars, path, or "you did it" progress |

JJ decision rule:

- `do-not-ship` if any of `J1` through `J6` fail
- `do-not-ship` if the surface is clearly behind the benchmark set in both
  `Onboarding clarity` and `Joy / delight`
- `ship-with-backlog` if all JJ must-pass rules pass but one non-critical benchmark category
  is marked `behind`
- `ship` if all JJ must-pass rules pass and benchmark comparison is `at-parity` or better in
  the critical categories

### 5. Buggsy minimum viable standard

Buggsy surfaces compete on usefulness, challenge, momentum, and creation depth.
The minimum bar is "clear mission, real progress, no fake saves, and age-appropriate polish."

#### Buggsy must-pass additions

| ID | Rule | Pass condition |
|---|---|---|
| `B1` | Mission clarity | The child can tell what the goal is without reading a wall of text |
| `B2` | Progress / reward clarity | XP, rings, completion, progress, or unlock state is visible and believable |
| `B3` | Creation usability | Typing, drawing, choosing panels, or submitting work feels usable on the primary device |
| `B4` | Resume integrity | Drafts, submissions, or completion states resume correctly when the surface promises resume |
| `B5` | Challenge fit | Tasks feel age-appropriate for Buggsy: not babyish, not needlessly frustrating |
| `B6` | Artifact or accomplishment | The child leaves with a saved artifact, submitted answer, completed mission, or explicit earned progress |

#### Buggsy benchmark categories

Compare the surface against the Buggsy benchmark set on these categories:

| Category | What "at least viable" means |
|---|---|
| Goal clarity | As clear as Prodigy or Pixton about what the child is trying to do right now |
| Reward / momentum | There is momentum to continue: quest, streak, rings, completion meter, or artifact progress |
| Creation depth | For creation surfaces, output feels more like a real tool than a glorified form |
| Accessibility / usability | Inputs, panels, prompts, and save actions feel manageable on Surface Pro and tolerable on tablet |
| Standards / learning fit | The learning task feels real and developmentally aligned, not cosmetic school theming |

Buggsy decision rule:

- `do-not-ship` if any of `B1` through `B6` fail
- `do-not-ship` if a creation surface is behind benchmark on both `Creation depth` and
  `Accessibility / usability`
- `do-not-ship` if a curriculum surface is behind benchmark on both `Goal clarity` and
  `Reward / momentum`
- `ship-with-backlog` if all Buggsy must-pass rules pass but one non-critical benchmark
  category is `behind`
- `ship` if all Buggsy must-pass rules pass and critical benchmark categories are
  `at-parity` or better

### 6. Universal Should-Pass rules

These do not block a ship decision on their own, but they convert a clean `ship` into
`ship-with-backlog` when multiple items are weak.

- `S1`: Entry animation or transition helps the child understand they are entering a new mode
- `S2`: Success state feels rewarding enough that the child would want to do one more task
- `S3`: Copy stays concise and readable at the target age
- `S4`: There is a visible progress indicator during a multi-step activity
- `S5`: Performance feels smooth on target hardware; no obvious jank during the core loop
- `S6`: The route includes at least one recovery path after network or data failure

### 7. Automation flow for the Play gate

The Play/automation lane should run in this order:

1. Resolve the route into `child + device profile + core loop`.
2. Load the benchmark set assigned to that child.
3. Fail closed as `config_drift` if the device profile is missing or disputed.
4. Run preflight:
   - route responds
   - sandbox/fixture mode chosen
   - screenshots and console capture enabled
5. Run the universal must-pass checks.
6. Run the child-specific checks (`J*` or `B*`).
7. Run the benchmark comparison using the five benchmark categories for that child.
8. Count should-pass weaknesses.
9. Emit a decision:
   - `ship`
   - `ship-with-backlog`
   - `do-not-ship`
10. Emit findings as separate records with:
   - `severity`
   - `area`
   - `route`
   - `device_profile`
   - `criterion_id`
   - evidence links or screenshot refs

### 8. Severity mapping for automation

| Condition | Severity |
|---|---|
| Any `U*`, `J*`, or `B*` failure | `critical` |
| Two or more `S*` failures | `major` |
| One `S*` failure or one non-critical benchmark `behind` | `minor` |
| Benchmark note without a direct product gap | `observation` |

### 9. Default outputs required from each run

Every run must produce:

- route
- child
- device profile
- benchmark set used
- ship decision
- must-pass failures
- should-pass weaknesses
- benchmark comparison table
- recommended next action

---

## MVSS v1 Extensions — Audit Rounds 1+2 (Accepted)

The following sections (A–N) were added after two audit rounds. They are binding — the rubric
JSON at `ops/play-gate-rubric.v1.json` and the surface map at `ops/surface-map.md` both reflect
these decisions.

### A. Preconditions tier

Before a Play gate run scores any criterion, four preconditions must pass. Failure aborts the
run with `preconditions_not_met` (does not count toward the competitive ship decision):

| ID | Name | Scope | Failure action |
|---|---|---|---|
| `PRE-1` | ES5 clean | Fire OS ambient surfaces only (TheSpine, TheSoul) | abort run |
| `PRE-2` | withFailureHandler coverage | All play surfaces — no empty `function(){}` handlers | abort run |
| `PRE-3` | Theme palette declared | CSS hex values match `ops/themes/palettes.md` registry | abort run |
| `PRE-4` | Safe wrapper chain intact | All `google.script.run.*` calls end in `Safe` | abort run |

**ES5 scope clarification:** Education surfaces (HomeworkModule, SparkleLearning, etc.) run on
Surface Pro 5 (Edge/Chromium) and Samsung S10 FE — modern-JS-tier. ES5 check is NOT applied to
them. Fire OS ambient surfaces (TheSpine, TheSoul) are the only surfaces where ES5 applies.

### B. Per-family subsections

Play gate runs are grouped by family. Each family has a primary competitor and family-specific
criteria layered on top of the universal + child-specific rules:

- **JJ families:**
  - `jj.hub` — JJHome (`/sparkle-kingdom`)
  - `jj.learning-session` — SparkleLearning (`/sparkle`), SparkleLearning Free (`/sparkle-free`), daily-adventures (`/daily-adventures`)
- **Buggsy families:**
  - `buggsy.curriculum` — HomeworkModule, reading-module, writing-module, WolfkidCER, investigation-module, fact-sprint
  - `buggsy.hub` — daily-missions (`/daily-missions`), DesignDashboard (`/wolfdome`)
  - `buggsy.diagnostic` — BaselineDiagnostic (Buggsy side), wolfkid-power-scan
  - `buggsy.creation` — ComicStudio
- **Shared:** BaselineDiagnostic (`/baseline`) is evaluated twice — once per child family with
  the child-specific device profile. Ship verdict is per child.

Each subsection names its `primary_competitor` and `comparison_anchor_url`. These are recorded
in `ops/play-gate-rubric.v1.json` benchmarkSets and in `ops/surface-map.md` per row.

### C. New universal must-pass IDs (U13–U16)

Four unhappy-path criteria promoted to universal must-pass in audit round 1.
`S6` (recovery path) removed — absorbed into `U14`.

| ID | Name | Pass condition |
|---|---|---|
| `U13` | empty-state-defined | Surface declares and renders a specific empty state with a CTA; blank screen or bare error text does not qualify |
| `U14` | error-has-retry-path | Errors surface through a designed element with a retry or recovery path. Native `alert()` banned as primary error UX. Empty `withFailureHandler(function(){})` banned. Gate-check "let them through" bypass banned. |
| `U15` | loading-has-max-time | Loading state has a declared maximum wait (≤10s) before fallback message appears. No endless spinner. |
| `U16` | offline-behavior-declared | Surface declares offline behavior: queue / read-only / refuse-clearly. Silent broken state not allowed. |

### D. Accessibility section (per family)

| Rule | Tier | Threshold / Source |
|---|---|---|
| `<html lang>` present | **BLOCK** | [WCAG 2.1 Language of Page](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html) — blocker filed as Issue #359 |
| No `user-scalable=no` | **BLOCK** | [WCAG 2.1 Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow) — blocker filed as Issue #358 |
| Touch target ≥24px standard / ≥60px JJ tablet | SHIP | [WCAG 2.2 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum); prek-milestones.md:93 |
| `prefers-reduced-motion` respected for continuous animation | SHIP | [WCAG 2.1 Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) |
| Visible focus on all interactive elements | SHIP | [WCAG 2.1 Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible) |
| Keyboard path where applicable | SHIP | [WCAG 2.1 Keyboard](https://www.w3.org/WAI/WCAG21/Understanding/keyboard) |
| Alt/aria-label on functional images | SHIP | [WCAG 2.1 Non-text Content](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content) |
| Body text contrast ≥4.5:1; large text ≥3:1 | SHIP | [WCAG 2.1 Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum) |
| UI component contrast ≥3:1 | SHIP | [WCAG 2.1 Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html) |
| Reflow at 320 CSS px width + 400% zoom | SHIP | [WCAG 2.1 Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow) |

BLOCK items fail the run. SHIP items convert a `ship` to `ship-with-backlog` when failing.
Measurement: axe-core + Playwright viewport tests.

### E. Parent-insight — durable record required

Curriculum, diagnostic, and creation families must emit a durable parent-readable record
(either in-surface read access OR a row the parent dashboard retrieves on demand).
**Push is supplemental only — never the sole adult-visibility channel.**

Hub and ambient families are exempt — they're live-state, not history.

Benchmarks:
- [ABCmouse Parent Section](https://support.abcmouse.com/hc/en-us/articles/4413437972503-Features-of-the-Parent-Section-in-ABCmouse-Classic)
- [Khan Academy parent reports](https://support.khanacademy.org/hc/en-us/articles/36120531499789-What-reports-can-I-use-as-a-parent-to-monitor-my-child-s-activity-on-Khan-Academy)
- [Prodigy parent portal](https://www.prodigygame.com/main-en/parents-2)

### F. Cross-surface consistency IDs (X1–X5)

| ID | Rule | Measurement |
|---|---|---|
| `X1` | nav-placement | Primary nav at identical selector across child's surface set; DOM selector match |
| `X2` | back-behavior | Back destination declared per-route in `ops/surface-map.md` `back_destination` column; Playwright click-and-assert-URL |
| `X3` | save-indicator | Allowed tokens only: `Saved`, `Saving…`, `Unsaved changes`; grep |
| `X4` | success-copy | Language from `ops/copy-patterns.md`; grep |
| `X5` | error-copy | Pattern `[what failed] + [user-actionable next step]`; pattern match |

### G. ComicStudio criteria — `buggsy.creation` subfamily (C1–C6)

Source anchors: [Book Creator Comics](https://bookcreator.com/features/comics/),
[Book Creator accessibility](https://bookcreator.com/accessibility/).
Pixton-class character rigging is NOT required. Canvas-first. Multi-comic library required.

| ID | Rule | Pass condition |
|---|---|---|
| `C1` | panel-layout-library | ≥6 layouts usable without freeform drawing |
| `C2` | dialogue-affordance | Speech bubble placement + text entry works on Surface Pro 5; dialogue is first-class |
| `C3` | character-placement | Drag-drop character/image onto panel; no rigging required |
| `C4` | canvas-freeform | Freeform drawing + image import as panel layer |
| `C5` | artifact-export | Saves and exports single comic (PNG/PDF); restorable |
| `C6` | multi-comic-library | Library of past comics persists; each reopenable |

### H. Surface-map column additions

Seven new columns added to `ops/surface-map.md` in this PR. See that file for per-row values.

| Column | Values | Purpose |
|---|---|---|
| `persistence_contract` | `submitted \| draft \| ephemeral \| configured-once` | Drives U6 + B4 test |
| `product_class` | `curriculum-module \| hub \| diagnostic \| dashboard \| creation-tool \| ambient \| finance \| story \| qa \| out-of-scope` | Benchmark target |
| `primary_competitor` | e.g. `Khan Academy Kids`, `Book Creator Comics` | Benchmark reference |
| `comparison_anchor_url` | Official product page URL | Benchmark source |
| `back_destination` | Route or `none` | X2 measurement |
| `tracked_files` | Comma-separated canonical paths | Machine-readable input for `hyg-14-rubric-drift.yml` |
| `mvss_scope` | `education \| chore \| ambient \| finance \| story \| parent \| qa \| out-of-scope` | Scope filter for hyg-14 — only `education` and `chore` rows couple to rubric updates |

### I. Rubric criterion canonical field schema

Every entry in `ops/play-gate-rubric.v1.json` uses this schema:

```json
{
  "id": "U4",
  "name": "core-loop-starts-fast",
  "description": "...",
  "tier": "universal-must-pass",
  "surface_family": "all",
  "threshold": "≤2 interactions AND ≤5s from route-ready to first state transition",
  "measurement_method": "Playwright trace or manual walkthrough",
  "evidence_type": "video + trace-json",
  "failure_mode": "critical",
  "owner": "education-owner",
  "source": "URL or file reference"
}
```

Allowed `owner` enum: `LT`, `JT`, `education-owner`, `finance-owner`, `platform-owner`, `shared`.
Thread references are banned in the `owner` field.

### J. Perf criteria — blocked on instrumentation Issue #360

Performance criterion `S5` (performance-smooth) carries `"blocked_on": "#360"` in the rubric
JSON. Play gate emits `perf_unknown` for S5 until Issue #360 closes. All other criteria are
manually evaluable and are not blocked.

Issue #360 scope: Playwright trace capture, frame-budget measurement, Lighthouse config,
boot-to-interactive, and artifact retention for Surface Pro 5 + Samsung S10 FE.

### K. Drift control — `hyg-14-rubric-drift.yml`

New workflow at `.github/workflows/hyg-14-rubric-drift.yml` enforces rubric coupling:

```
on: pull_request
Parser: reads ops/surface-map.md, selects rows WHERE mvss_scope IN ('education','chore'),
        extracts every value in the tracked_files column,
        unions into a set of paths covered by MVSS v1 rubric.
Checks:
  - If PR's changed-files set intersects the tracked_files union →
    must also touch ops/specs/2026-04-15-play-surface-minimum-viable-standard.md
    OR ops/play-gate-rubric.v1.json
    OR carry label rubric-n/a
  - Fails with explicit message if contract violated, naming specific
    tracked surface(s) touched without a rubric update.
```

Finance, ambient, story, parent, QA rows are excluded from coupling.
Does NOT parse the free-form `Primary Code` column.

### L. Adoption unit and worked-example count

Adoption unit = `route × child evaluation`. Routes serving one child produce 1 evaluation;
shared routes produce 1 evaluation per child.

**Distinct routes in MVSS scope: 15.**

- Buggsy-only (10): `/homework`, `/reading`, `/writing`, `/wolfkid`, `/facts`,
  `/investigation`, `/comic-studio`, `/daily-missions`, `/wolfdome`, `/power-scan`
- JJ-only (4): `/sparkle`, `/sparkle-kingdom`, `/daily-adventures`, `/sparkle-free`
- Shared (1): `/baseline` — evaluated twice (Buggsy rubric + JJ rubric)

ChoreBoard routes (`/buggsy`, `/jj`) are smoke-only — not in the MVSS competitive gate.

**MVSS v1 requires 16 worked evaluations** (10 Buggsy + 4 JJ + 2 for `/baseline`).
Evidence path: `ops/evidence/preview/<route-slug>/<child>/<yyyy-mm-dd>/`.

> **Definition vs. application:** This PR (closing backlog items 101 + 102) defines the standard.
> The 16 evaluations are executed during Play gate runs (backlog items 14–15) and are not
> required for the standard to be adopted — they are required before a ship judgment can be issued
> per surface. The `ops/evidence/preview/` directories committed here are scaffolding for those runs.
> Current state: all 16 are `PENDING` (Preview MCP tools not available at definition time).

### M. Worked-example evidence pipeline

Preview capture via Claude Preview MCP tools:
- `preview_start` — launches the `tbm-preview` config from `.claude/launch.json`
- `preview_screenshot` — viewport capture
- `preview_snapshot` — accessibility-tree snapshot (text/structure)

**Scope:** These artifacts are deployed-state captures via `thompsonfams.com`. They are
documentation illustrations, not branch-local verification. Branch-local verification is
Playwright's responsibility.

Use:
- ✅ Illustrative worked examples for the rubric
- ✅ "This is what `ship` looks like on HomeworkModule as of the PR date"
- ❌ Branch-local verification of code changes

Artifact paths: `ops/evidence/preview/<route-slug>/<child>/<yyyy-mm-dd>/screenshot.png` +
`snapshot.json`. Single-child routes emit one directory; `/baseline` emits two
(`.../baseline/buggsy/...` and `.../baseline/jj/...`).

Preview launcher requires `.claude/launch.json` and `.claude/preview-proxy.js` — both committed
in this PR so the evidence pipeline is reproducible from `origin/main`.

### N. Pre-filed blocker Issues

Six Issues filed before this PR branch was pushed. All cross-linked in the PR body.

| Issue | Title | Violation | File:line |
|---|---|---|---|
| #355 | fix: JJHome empty failure handler swallows schedule errors | U7 + U14 | `JJHome.html:532` |
| #356 | fix: ComicStudio gate-check bypass lets user through on failure | U11 | `ComicStudio.html:2941-2945` |
| #357 | fix: DesignDashboard native alert() for save errors | U14 | `DesignDashboard.html:1090-1092` |
| #358 | fix: BaselineDiagnostic user-scalable=no blocks accessibility zoom | WCAG Reflow | `BaselineDiagnostic.html:5` |
| #359 | fix: missing `<html lang>` across 5 education surfaces | WCAG Language of Page | 5 HTML files |
| #360 | instrumentation: Playwright trace + frame-budget on Surface Pro 5 + S10 FE | — (dependency) | — |

---

## Decision states (final)

Play gate emits exactly one of:
- `ship`
- `ship-with-backlog`
- `do-not-ship`
- `config_drift` — surface device ambiguous or route undeclared in `ops/surface-map.md`
- `preconditions_not_met` — PRE-1 through PRE-4 check fails

No other states. No `snapshot_stale`.

---

## Unknowns

- Whether `/play` will run only against deployed routes or also against local preview states
  (current evidence pipeline uses deployed state via `thompsonfams.com`)
- Whether secondary-tablet coverage for Buggsy should become full parity or remain
  functional-smoke only

## LT decisions already made (binding)

- ~~Confirm whether the canonical artifact for items 101 and 102 should be GitHub Issues, repo
  specs, or both~~ → **Both.** Issue #354 + this spec file.
- ~~Confirm whether Buggsy tablet secondary coverage should stay non-blocking~~ → **Yes, functional-smoke only.**
- ~~Confirm whether benchmark refresh should happen monthly or only when the Play skill changes~~
  → **Only when the Play skill changes.**

## Acceptance test

1. A reviewer can pick any JJ or Buggsy route and identify its device profile without guessing.
2. A reviewer can answer "ship / do-not-ship" for that route using this spec alone.
3. The same inputs produce the same decision across at least two independent reviewers.
4. An automation can map a finding to a criterion ID without inventing a new rule in chat.
5. A route with ambiguous device ownership fails as `config_drift` instead of being waved through.

## Evidence after completion

- `ops/specs/2026-04-15-play-surface-minimum-viable-standard.md` defines the human-readable gate
- `ops/play-gate-rubric.v1.json` stores the same rules in structured form for automation
- `ops/verification-matrix.md` references the Play gate lane so it is part of the control plane

## Codex review checklist

- [ ] JJ and Buggsy device profiles match current real usage, not just a stale doc
- [ ] Every benchmark anchor is an official product page, not a review site
- [ ] Universal rules are strict enough to block fake "loads fine" victories
- [ ] Creation surfaces are held to save/resume truth, not cosmetic polish only
- [ ] `config_drift` is treated as a failed run, not a warning
- [ ] The ship decision language matches the structured rubric exactly
