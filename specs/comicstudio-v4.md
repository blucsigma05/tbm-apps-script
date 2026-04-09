# ComicStudio v4 — Wolfkid Comic Builder (Pressure Pen + Time-Lapse Replay)

**Owner:** Opus (spec), Sonnet (build), Codex (audit), LT (gate)
**Priority:** P1 — Thursday narrative payoff for the Wolfkid CER loop; completes the Buggsy
creative surface promise
**Status:** Draft — Architecture Review
**Scope:** `ComicStudio.html` ground-up rebuild, plus new server surface for episode context
preload + Drive publish. No changes to any other HTML file except the CANONICAL_SAFE_FUNCTIONS
list in `Tbmsmoketest.js` and the API_WHITELIST in `Code.js`.
**Risk:** Medium — single-file UI rebuild on a Buggsy-only surface; backend additions use
established Drive + Pushover patterns. Touch-input engine swap is the highest-risk piece and
is mitigated by a touch fallback path.
**Device target:** Buggsy's **Surface Pro 5 running Chrome** — 1368×912 at 2×DPR, touch +
Microsoft Surface Pen (N-Trig digitizer exposing `pressure`, `tiltX`, `tiltY`, `pointerType`
via the standard Pointer Events API). **NOT a Fire Stick** — this file is exempt from the
project-wide ES5 rule. See §3 below.
**Roadmap:** 7-day implementation window Fri Apr 10 → Thu Apr 16 (day Buggsy runs the full
CER→Comic loop live). One feature per day, theming last.

---

## 1. Problem

`ComicStudio.html` is Thursday's third block in the Buggsy daily-missions schedule. It
ships today as a minimum-viable drawing surface: 2–4 panels, 8 flat colors, a single pen
brush, a single eraser, captions, and a vocab callout. Rings are awarded silently via
`awardRingsSafe`. It has no relationship to the Wolfkid CER episode Buggsy wrote 12 minutes
earlier in block 2, and no relationship to his Surface Pen. A kid using a $300 stylus on a
$600 tablet sees an interface that treats his pen as a mouse.

Four gaps make the surface feel unfinished:

1. **Input engine** — `mousedown` + `touchstart` handlers only. Stylus `pressure`, `tiltX`,
   `tiltY` are ignored. Every line is the same width regardless of how hard he presses.
   Verified: ComicStudio.html lines 862–869 register only mouse and touch events. Zero
   `pointerdown` occurrences in the file.
2. **No episode payoff** — `getTodayContentSafe` IS called at ComicStudio.html:1026, but
   only to map vocabulary. The Thursday `wolfkidEpisode` block (CurriculumSeed.js:512–517:
   "Episode 1: The Signal in the Storm", scenario + writingPrompt + weather data) is never
   read. There is no signal that the kid just finished CER work on this exact story.
3. **No persistence** — Walk away mid-panel, tab crashes, Surface sleeps: everything is
   gone. No autosave. No draft. No resume. Zero `localStorage`, `ScriptProperties`, or
   `DriveApp` calls anywhere in the file.
4. **No publish artifact** — `finishComic()` at line 946 composes a DOM preview, awards
   rings, and shows a trophy. Nothing leaves the client. Parents never see the comic. The
   kid has nothing to show. The ring counter is the only receipt.

Additionally the v1/v3 version label mismatch (`MODULE_VERSION = 'v1'` at line 610 vs
`<meta name="tbm-version" content="v3">` at line 7) is a symptom of this file getting
patched in passing without a proper version bump workflow. v4 re-aligns both labels.

---

## 2. Source verification

Every line number in the LT context prompt was grep-verified against the actual files in
this branch. Findings below — divergences flagged explicitly in §2.2.

### 2.1 Confirmed

| Context claim | Verified at | Notes |
|---|---|---|
| `ComicStudio.html` is 1043 lines | 1043 lines (`wc -l`) | Exact |
| `<meta name="tbm-version" content="v3">` at line 7 | line 7 | Exact |
| `MODULE_VERSION = 'v1'` at line 610 | line 610 | Exact |
| `CHILD = 'buggsy'` at line 611 | line 611 | Exact |
| `canvas.addEventListener('mousedown', startDraw)` at line 862 | line 862 | Exact |
| `canvas.addEventListener('touchstart', startDraw)` at line 866 | line 866 | Exact |
| Zero Pointer Events support | `grep pointerdown ComicStudio.html` → 0 matches | Confirmed |
| `awardRingsSafe(CHILD, rings, MODULE_NAME)` at line 999 | line 999 | Exact |
| `FALLBACK_VOCAB` at lines 654–660 (VALIANT/LURKING/TRIUMPH/PERILOUS/CUNNING) | lines 654–660 | Exact |
| `daily-missions.html:847` — `{ name: 'Comic Studio', time: 12, page: 'comic-studio' }` | line 847 | Exact |
| `CurriculumSeed.js:498` — Thursday key | line 498 | Exact |
| `CurriculumSeed.js:512` — `wolfkidEpisode` title "Episode 1: The Signal in the Storm" | lines 512–517 | Exact — scenario, writingPrompt, data all match |
| `Kidshub.js:3571` — `submitHomework_` | line 3571 | Exact |
| Wolfdome palette `#0a1628`, `#1a1a2e`, `#00f0ff`, `#ff4444`, `#00ff88` at game-design.md:45 | lines 45–56 | Exact — "Mach Turbo Light (red hedgehog) as mission commander" at line 52 |
| `sendPush_` with `PUSHOVER_PRIORITY` constants (Kidshub.js) | Kidshub.js lines 1351, 3628, 3747 | Confirmed pattern |
| `PUSHOVER_PRIORITY.CHORE_APPROVAL` = 0 | Alertenginev1.js line 24 | Exact |
| `acquireLock_()` uses `waitLock(30000)` | Kidshub.js line 621 (+ line 624) | Exact — BUG-006 fix |
| `Nunito`, `Orbitron`, `JetBrains Mono` already loaded in ComicStudio.html | line 9 | Exact — single `<link>` tag pulls all three families |
| `comic-studio` CF worker route exists | cloudflare-worker.js line 30 | Exact: `'/comic-studio': { page: 'comic-studio' }` |
| `getTodayContent_` in Kidshub.js | line 2543 | Returns `{ content, fullWeek, day, week, child }` |
| `CANONICAL_SAFE_FUNCTIONS` in Tbmsmoketest.js | lines 42–62 | Smoke test wiring source |
| `API_WHITELIST` map in Code.js `serveData` | lines 377–432 | Inline object literal inside the `action === 'api'` branch |

### 2.2 Divergences from the LT context prompt

1. **Canvas dimensions.** Context said "400×300 @ 0.7 quality JPEG is ~15-20KB base64."
   Verified at `ComicStudio.html:786` — canvases are created at `width="400" height="400"`,
   not 400×300. Every draft size estimate in the context is therefore ~25% low. Recalculated
   in §5.3 (draft size math).

2. **ComicStudio already calls `getTodayContentSafe`.** Context said "ComicStudio IS already
   wired into Thursday's static schedule. It just has no episode context or lesson data when
   tapped." Partially true — the call exists at `ComicStudio.html:1026` but only maps
   `data.vocabulary` into `todayVocab`, ignoring `data.wolfkidEpisode` entirely. v4 reuses
   that call path and extends it (or replaces it with a new aggregator — see §7 Feature 4).
   This means "episode preload" is not a net-new server call; it's an extension of an
   existing one.

3. **`MODULE_NAME` location.** Context implied `MODULE_VERSION = 'v1'` is at line 610. That's
   accurate — but `MODULE_NAME = 'comic-studio'` is at line 609 (one above). Harmless; noted
   for completeness so the edit at v4 bumps both cleanly.

4. **`Code.js:1356` is a diagnostic listing, not the production whitelist.** Context cited
   `Code.js:1356` as a whitelist location. That line is inside a `listFunctions` diagnostic
   helper (a `fns` array used by `Logger.log`). The real production whitelist is
   `API_WHITELIST` at Code.js lines 377–432 inside the `action === 'api'` branch of the
   router. v4 adds entries to **both** locations (and to the GASHardening.js:1723 list)
   to keep the three whitelists in sync, because every other Safe wrapper in the project
   appears in all three.

5. **`ScriptProperties` 9KB per-key limit.** Context correctly self-corrected on this. For
   the record: Google Apps Script `PropertiesService` has a hard limit of **9 KB per
   value** and a soft 500 KB per property store. 4 panel canvases at 400×400 JPEG q0.7 as
   base64 data URLs are ~18–25 KB each = ~80–100 KB before the replay buffer is added.
   ScriptProperties is the wrong bucket. v4 uses Drive as the draft store (see §7
   Feature 3). Drive write/read latency is ~500–1500 ms per call, which is fine for a
   60-second autosave cadence.

---

## 3. The ES6 Exception (READ THIS BEFORE WRITING A LINE OF CODE)

**This file is exempt from the project's ES5-only rule. Use modern JavaScript freely.**

The project-wide rule at `CLAUDE.md` §"ES5 ONLY — HTML surfaces (non-negotiable)" exists
because Fire Stick tablets run Fully Kiosk Browser on an old Android WebView that silently
breaks on arrow functions, template literals, `let`/`const`, `??`, `?.`, destructuring,
`async`/`await`, `Array.includes()`, `for...of`, and `backdrop-filter`.

**ComicStudio.html does not run on a Fire Stick.** It runs on Buggsy's Surface Pro 5 in
Chrome (current channel). Chrome ships all ES2015–ES2022 syntax. The daily-missions shell
that launches into Comic Studio is routed from the Surface Pro session, not the Fire Stick
kitchen/office surfaces.

Allowed in this file specifically:

- `let` / `const` for block scoping
- Arrow functions for callbacks and inline handlers
- Template literals for multi-line strings and interpolation
- `async` / `await` for Drive/publish flows
- `?.` optional chaining and `??` nullish coalescing
- `Object.entries()`, `Object.values()`, `Array.prototype.includes()`, `find()`, `findIndex()`
- Destructuring (object + array)
- Spread / rest operators
- Classes (if useful for the brush engine or replay recorder)
- `URLSearchParams`, `fetch`, `FormData`
- **Pointer Events API** (the whole reason for this exception — `pointerdown`, `pointermove`,
  `pointerup`, `pointercancel`, `setPointerCapture`, `event.pressure`, `event.tiltX/Y`,
  `event.pointerType`)
- `MediaRecorder` on canvas streams (for the optional replay export)

**Still banned (universal rules):**

- No bare `eval()`, no dynamic `Function()` constructor with user input
- No `innerHTML` with unescaped user content (use `textContent` or escape via the existing
  `escapeHtml` helper pattern from line 613)
- No `google.script.run` call without a matching `.withFailureHandler()` — project rule,
  not an ES rule, still applies
- No new CDN dependencies — the three Google Fonts already loaded at line 9 are sufficient.
  Do not pull in new libraries (no html2canvas, no Paper.js, no Fabric.js). Build the
  brushes and the replay engine from the native Canvas2D API.

**One concrete consequence:** the existing `escapeHtml` function at line 613 is ES5 (for
good reason — it gets reused in patches during partial edits). Sonnet MAY keep it as-is
and still use template literals elsewhere in the same file. Mixing styles is fine; the
spec just forbids the inverse (writing template literals in Fire Stick HTML files).

**Callout in code:** Add a comment block near `MODULE_VERSION = 'v4'` that documents the
exception:

```js
// ─────────────────────────────────────────────────────────────
// ES6+ ALLOWED IN THIS FILE ONLY.
// Device target: Buggsy's Surface Pro 5 (Chrome). NOT a Fire Stick.
// See specs/comicstudio-v4.md §3 for the rationale.
// Every other .html file in this repo is ES5-only — do not paste
// modern syntax from ComicStudio.html into KidsHub.html etc.
// ─────────────────────────────────────────────────────────────
```

---

## 4. Architecture overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                           ComicStudio.html v4                        │
│                       (single file, ES6+ allowed)                    │
│                                                                       │
│  ┌───────────┐    ┌─────────────┐    ┌──────────────┐    ┌────────┐  │
│  │  Header   │    │ Left: Tools │    │  Main Canvas │    │ Right: │  │
│  │  + Rings  │◄───┤ + MTL panel │    │  4 panels    │◄───┤  Brief │  │
│  │  counter  │    │ + Brushes   │    │  Pointer     │    │  or    │  │
│  └───────────┘    │ + Colors    │    │  Events      │    │  Free  │  │
│                   └─────────────┘    │  engine      │    │  Mode  │  │
│                                      │  + Replay    │    └────────┘  │
│                                      │  buffer      │                │
│                                      └──────┬───────┘                │
│                                             │                        │
│                              autosave 60s   │                        │
│                              + beforeunload │                        │
│                                             ▼                        │
└───────────────────────────────────────────┼──────────────────────────┘
                                             │
                          google.script.run  │  google.script.run
                                             ▼
            ┌──────────────────────────────────────────────────────┐
            │                   GAS server (V8)                    │
            │                                                      │
            │  NEW: getComicStudioContextSafe(child)                │
            │    ├─ calls getTodayContent_(child)                   │
            │    ├─ checks KH_Education for today's Wolfkid CER row │
            │    └─ returns { mode, episode, studentCER, vocab }    │
            │                                                      │
            │  NEW: saveComicDraftSafe(child, draftJson)            │
            │    └─ writes to Drive: Wolfkid Comics/drafts/         │
            │       buggsy_<YYYY-MM-DD>.json                        │
            │                                                      │
            │  NEW: loadComicDraftSafe(child)                       │
            │    └─ reads the above, returns JSON or null           │
            │                                                      │
            │  NEW: publishComicToArchiveSafe(child, meta, pngB64,  │
            │                                 replayB64)            │
            │    ├─ writes PNG to Wolfkid Comics/YYYY-MM-DD_slug.png│
            │    ├─ optional: WebM to Wolfkid Comics/replays/       │
            │    ├─ fires sendPush_ to BOTH parents                 │
            │    ├─ clears the draft blob                           │
            │    └─ returns { driveUrl, fileName, rings }           │
            │                                                      │
            │  EXISTING: awardRingsSafe(child, rings, source)       │
            │    (called by publishComicToArchiveSafe server-side)  │
            └──────────────────────────────────────────────────────┘
```

Client state lives in a small set of top-level variables (unchanged from v1 philosophy):
`panelCount`, `activePanel`, `panelCanvases[]`, `panelContexts[]`, `captions[]`, plus the
new additions documented per feature below.

**Autosave cadence:** `setInterval` at 60_000 ms + `window.addEventListener('beforeunload')`
serialize-and-ship. Serialization is cheap (< 50ms); server write is async and non-blocking
(fire-and-forget pattern already used by `saveMissionStateSafe` in daily-missions).

---

## 5. Global implementation rules

### 5.1 File changes scope

- **Rewritten:** `ComicStudio.html` — entire file, single commit, ~1400–1700 lines expected
  (up from 1043). Version bump from v1/v3 (mismatched) to unified **v4** at both locations:
  `<meta name="tbm-version" content="v4">` (line 7) and `var MODULE_VERSION = 'v4'` (line
  610 or equivalent in the rewrite).
- **Extended:** `Kidshub.js` — add 4 new server functions + their Safe wrappers:
  `getComicStudioContext_` / `getComicStudioContextSafe`,
  `saveComicDraft_` / `saveComicDraftSafe`,
  `loadComicDraft_` / `loadComicDraftSafe`,
  `publishComicToArchive_` / `publishComicToArchiveSafe`.
  Bump `getKidsHubVersion` by +1 (follow the existing 3-location version pattern in that
  file).
- **Extended:** `Code.js` — add the 4 new Safe wrappers to `API_WHITELIST` (Code.js:377–432)
  AND to the diagnostic `fns` list near line 1363 (both locations so `listFunctions` stays
  honest). Bump `getCodeVersion` by +1.
- **Extended:** `Tbmsmoketest.js` — add the 4 new Safe wrapper names to `CANONICAL_SAFE_FUNCTIONS`
  (line 42–62). Bump `getSmokeTestVersion` from 6 to 7.
- **Extended:** `GASHardening.js` — add the 4 new Safe wrapper names to the diagnostic
  list at line ~1720 if that matches the pattern used by existing wrappers (verified:
  `awardRingsSafe` is at GASHardening.js:1723, so the new wrappers go adjacent).
- **No changes:** `daily-missions.html`, `KidsHub.html`, `CurriculumSeed.js`, `cloudflare-worker.js`
  (route already exists at line 30), `audit-source.sh`, `Alertenginev1.js`, any other HTML
  file, any `.json` asset file.

### 5.2 Version bump enforcement

Per CLAUDE.md "Version Bumping" and the Tier 2 rule "Version mismatches across the 3
required locations":

- `ComicStudio.html` — two locations (meta tag line 7, MODULE_VERSION line 610). Both to
  `v4`. No third "EOF" comment — HTML files don't follow the .gs 3-location pattern per
  project convention. Verified by `grep -n 'tbm-version\|MODULE_VERSION' ComicStudio.html`
  returning exactly those two lines.
- `Kidshub.js`, `Code.js`, `Tbmsmoketest.js`, `GASHardening.js` — follow the .gs rule: bump
  header comment, bump the `getXxxVersion()` return value, bump the EOF comment. Sonnet
  must grep all three locations per file before committing.

### 5.3 Draft storage — size math and Drive write path

**Why not ScriptProperties.** A 400×400 canvas exported at `toDataURL('image/jpeg', 0.7)`
produces a base64 string of ~20–28 KB depending on stroke density. Four panels = 80–112 KB.
Add the replay buffer (estimated 200 strokes × 12 points × ~50 bytes serialized ≈ 30 KB
after JSON minification) and the total draft blob is 110–150 KB. ScriptProperties caps at
9 KB per value and 500 KB per property store (technically fits the store budget if split
across 12+ keys, but splitting is fragile and 9 KB keys are a nightmare to debug).

**Why Drive.** `DriveApp` supports writes of up to 10 MB per file trivially, no per-key
fragmentation. The existing StoryFactory pattern (StoryFactory.js:1668–1692) already does
folder-create-if-missing + file write in the same workbook namespace. Write latency is
500–1500 ms, which is fine because autosave is fire-and-forget from the client's point of
view.

**Folder layout on Drive (all paths relative to the `Wolfkid Comics` folder, created if
missing on first publish):**

```
Wolfkid Comics/
├── drafts/
│   ├── buggsy_2026-04-09.json     ← current draft (overwritten each autosave)
│   └── buggsy_2026-04-08.json     ← yesterday's draft (kept until cleanup)
├── 2026-04-09_signal-in-the-storm.png      ← published comics
├── 2026-04-09_wolfkid-free-draw.png
└── replays/
    ├── 2026-04-09_signal-in-the-storm.webm ← optional replay captures
    └── ...
```

**Folder ID persistence.** Store the top-level folder ID in Script Properties as
`COMIC_ARCHIVE_FOLDER_ID` on first successful publish. Subsequent calls read the property
and skip the folder lookup. Fallback: if the property is set but `DriveApp.getFolderById(id)`
throws (folder deleted), rebuild by name and reset the property.

---

## 6. UI shell rebuild

Before drilling into the seven features, the layout itself is re-gridded. This section is
the skeleton every feature hangs off of.

### 6.1 Layout grid

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER: WOLFDOME COMIC STUDIO     v4     🏆 0 rings    Pen: ✏ detected │  56px
├───────────┬───────────────────────────────────────────┬─────────────────┤
│           │                                           │                 │
│   TOOLS   │            MAIN CANVAS AREA               │  RIGHT PANEL    │
│  (left)   │         (4 panels, 2x2 grid)              │                 │
│           │                                           │  MISSION BRIEF  │
│ [Pencil]  │  ┌──────────────┐  ┌──────────────┐       │    or           │
│ [Ink]     │  │              │  │              │       │  FREE MODE      │
│ [Marker]  │  │   PANEL 1    │  │   PANEL 2    │       │                 │
│ [Chalk]   │  │              │  │              │       │  [episode data] │
│ [Eraser]  │  └──────────────┘  └──────────────┘       │  [your CER]     │
│ [Fill]    │  ┌──────────────┐  ┌──────────────┐       │  [vocab]        │
│           │  │              │  │              │       │                 │
│  COLORS   │  │   PANEL 3    │  │   PANEL 4    │       │  ┌───────────┐  │
│  ■ ■ ■ ■  │  │              │  │              │       │  │MTL sprite │  │
│  ■ ■ ■ ■  │  └──────────────┘  └──────────────┘       │  │  + quip   │  │
│           │                                           │  └───────────┘  │
│  CAPTIONS │  [Autosave: 47s ago]                      │                 │
│  (tabs)   │                                           │                 │
├───────────┴───────────────────────────────────────────┴─────────────────┤
│  FOOTER: [Save Draft]    [Preview]    [Save to Wolfdome Archives]      │
└─────────────────────────────────────────────────────────────────────────┘
```

CSS Grid layout:

- `grid-template-columns: 220px 1fr 320px` (tools / canvas / brief)
- `grid-template-rows: 56px 1fr 60px` (header / body / footer)
- `min-width: 1200px` on the page — Surface Pro native is 1368×912 so this fits with slack
- `gap: 12px` between cells

### 6.2 Panel layout

Panel count stays selectable (1, 2, 3, 4) via the existing picker pattern, but **default is
4** (up from 2) because the Surface Pro's horizontal real estate makes a 2×2 grid read
naturally. Each panel canvas remains 400×400 internal resolution; CSS-scaled to the cell
size. With 320px of right panel and 220px of left panel, the center column is ~800–850 px,
which comfortably fits a 2×2 grid of ~380 px cells with padding.

### 6.3 Entry animation sequence

All animations use CSS keyframes with `animation-delay` for the cascade. Total cascade
duration: ~1800ms from first frame to "ready" state.

| Element | Delay (ms) | Duration (ms) | Transform |
|---|---|---|---|
| Loading terminal (see §13, Feature 6) | 0 | 2000 | fade in + type 4 lines |
| Header bar | 2000 | 400 | `translateY(-12px) → 0`, opacity 0→1 |
| Left toolbar | 2100 | 400 | `translateX(-20px) → 0` |
| Panel 1 | 2200 | 500 | `scale(0.92) → 1`, opacity 0→1 |
| Panel 2 | 2280 | 500 | same |
| Panel 3 | 2360 | 500 | same |
| Panel 4 | 2440 | 500 | same |
| Right brief panel | 2300 | 500 | `translateX(20px) → 0` |
| MTL sprite + speech bubble | 2800 | 600 | scale(0) → 1, with slight rotation `-5deg → 0` |
| Footer actions | 2900 | 400 | `translateY(12px) → 0` |

All animations use `cubic-bezier(0.16, 1, 0.3, 1)` ("ease-out-expo") for a crisp tech feel.

---

## 7. Feature specs

### FEATURE 1 — Pointer Events pressure drawing engine

**Requirement.** Replace all `mousedown`/`mousemove`/`mouseup`/`touchstart`/`touchmove`/`touchend`
listeners with Pointer Events. Read `event.pressure` and map it to line width with an
exponential ease so light touches feel responsive but full press doesn't run away. Show a
"Pen detected" badge in the header when `event.pointerType === 'pen'`. Capture the pointer
on `pointerdown` so fast pen movements don't drop the stroke.

**Acceptance criteria.**

- Any `grep 'mousedown\|touchstart' ComicStudio.html` returns 0 matches.
- `grep 'pointerdown' ComicStudio.html` returns at least 1 match.
- With the Surface Pen, a light press (~0.2 pressure) produces a line ~2px wide. A full
  press (~0.9 pressure) produces a line ~8px wide on the Ink brush.
- With a finger touch, `event.pointerType === 'touch'`. Pressure is not reliable on touch;
  lines are a fixed mid weight (5 px for Ink).
- With a mouse, `event.pointerType === 'mouse'`. Pressure is always 0.5 (Chrome's default
  for mice). Lines are a fixed mid weight. Holding Shift while drawing constrains the
  current stroke to a straight line from the `pointerdown` point.
- Pen detection badge in the header reads "✏ Pen detected" when `pointerType === 'pen'` on
  the most recent `pointerdown`. Reverts to blank when a non-pen event is seen next.
- On fast pen flicks across the canvas, no gaps appear in the stroke. Use `setPointerCapture`
  to guarantee this.

**Pressure-to-width formula.**

```js
// widthForBrush: per-brush min/max from BRUSH_DEFS (see Feature 2)
function pressureToWidth(pressure, minWidth, maxWidth, pointerType) {
  if (pointerType === 'touch') {
    return (minWidth + maxWidth) / 2; // fixed mid weight for finger touch
  }
  if (pointerType === 'mouse') {
    return (minWidth + maxWidth) / 2; // fixed mid weight for mouse
  }
  // Pen: exponential ease — light press feels responsive, full press is controlled
  const eased = Math.pow(pressure, 1.6);
  return minWidth + (maxWidth - minWidth) * eased;
}
```

**Implementation sketch.**

```js
function attachDrawEvents(canvas, panelIdx) {
  const state = {
    drawing: false,
    lastX: 0,
    lastY: 0,
    lastPressure: 0.5,
    shiftAnchor: null, // set on pointerdown if shiftKey
    strokeId: null
  };

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
    activePanel = panelIdx;
    selectPanel(panelIdx);
    state.drawing = true;
    const pos = getPos(e);
    state.lastX = pos.x;
    state.lastY = pos.y;
    state.lastPressure = (e.pressure > 0) ? e.pressure : 0.5;
    state.shiftAnchor = e.shiftKey ? { x: pos.x, y: pos.y } : null;
    state.strokeId = newStrokeId();
    updatePenBadge(e.pointerType);
    recordStrokeStart(panelIdx, state.strokeId, pos, state.lastPressure, e.pointerType);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!state.drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    let targetX = pos.x, targetY = pos.y;

    // Shift-constrained straight line (mouse only)
    if (state.shiftAnchor && e.pointerType === 'mouse') {
      const dx = pos.x - state.shiftAnchor.x;
      const dy = pos.y - state.shiftAnchor.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        targetY = state.shiftAnchor.y;
      } else {
        targetX = state.shiftAnchor.x;
      }
    }

    const pressure = (e.pressure > 0) ? e.pressure : state.lastPressure;
    const brush = BRUSH_DEFS[activeTool];
    const width = pressureToWidth(pressure, brush.minWidth, brush.maxWidth, e.pointerType);

    drawStrokeSegment(panelIdx, state.lastX, state.lastY, targetX, targetY, width, brush);
    recordStrokePoint(panelIdx, state.strokeId, targetX, targetY, pressure);

    state.lastX = targetX;
    state.lastY = targetY;
    state.lastPressure = pressure;
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!state.drawing) return;
    state.drawing = false;
    state.shiftAnchor = null;
    recordStrokeEnd(panelIdx, state.strokeId);
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
  });

  canvas.addEventListener('pointercancel', (e) => {
    // Treat same as pointerup — finalize the stroke cleanly
    if (state.drawing) {
      state.drawing = false;
      recordStrokeEnd(panelIdx, state.strokeId);
    }
  });

  // CSS: canvas needs `touch-action: none` to prevent browser scroll/zoom on pen contact
  canvas.style.touchAction = 'none';
}
```

**Pen badge update.**

```js
function updatePenBadge(pointerType) {
  const badge = document.getElementById('pen-badge');
  if (pointerType === 'pen') {
    badge.textContent = '✏ Pen detected';
    badge.classList.add('pen-active');
  } else {
    badge.textContent = '';
    badge.classList.remove('pen-active');
  }
}
```

**Edge cases.**

- **iOS Safari** will read `e.pressure === 0` for mouse/touch and `> 0` only for Pencil.
  The fallback `(e.pressure > 0) ? e.pressure : 0.5` handles this. But the device target
  is Chrome on Surface Pro, so iOS is not a supported path.
- **Palm rejection.** Windows Ink with the Surface Pen automatically suppresses touch
  events when the pen hovers/contacts. No client-side palm rejection needed. If Sonnet
  sees palm contact artifacts during QA, fall back to ignoring `pointertype === 'touch'`
  events while a recent `pointerdown` from `pointertype === 'pen'` is still inside a
  300ms debounce window.
- **Canvas needs `touch-action: none`.** Without this CSS property, Chrome on touch
  devices will try to scroll/zoom the page on canvas touch and never fire
  `pointermove`. This is easy to forget — include it in the canvas setup code AND in
  the Gate 4 manifest grep.

---

### FEATURE 2 — Brush system (6 tools)

**Requirement.** Replace the current single "pen" tool (plus eraser) with a 6-tool
brush palette. Each brush has a distinct visual character, a distinct compositing
strategy, and its own pressure mapping range. The existing 8-color palette at line 652
stays. Tool selection persists across panels within a session (stored in a module-scoped
`activeTool` var, not per-panel).

**The 6 brushes.**

| Tool key | Label | Min width | Max width | Alpha | Compositing | Notes |
|---|---|---|---|---|---|---|
| `pencil` | Pencil | 1 | 4 | 0.95 | `source-over` | Rough texture via low-frequency random offset on each segment (±0.5 px). `lineCap: round`. |
| `ink` | Ink | 2 | 6 | 1.0 | `source-over` | Smooth, fully opaque. `lineCap: round`, `lineJoin: round`. This is the "default feel" brush. |
| `marker` | Marker | 4 | 10 | 0.7 | `source-over` | Semi-opaque — strokes stack visibly. `lineCap: round`. |
| `chalk` | Chalk | 3 | 8 | 0.85 | `source-over` | Particle scatter brush (see below). |
| `eraser` | Eraser | 4 | 16 | 1.0 | `destination-out` | Removes pixels. Pressure-sensitive width (bigger range than pen tools). |
| `fill` | Paint Bucket | — | — | 1.0 | `source-over` | Flood fill on `pointerdown`. Uses the active color. No pressure mapping. |

**Stroke rendering by brush.**

```js
function drawStrokeSegment(panelIdx, x1, y1, x2, y2, width, brush) {
  const ctx = panelContexts[panelIdx];
  ctx.save();
  ctx.globalCompositeOperation = brush.compositing;
  ctx.globalAlpha = brush.alpha;
  ctx.strokeStyle = brush.useColor ? activeColor : '#000000';
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (brush.key === 'chalk') {
    // Particle scatter: don't actually stroke a line, scatter N dots
    // along the segment based on length.
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx*dx + dy*dy);
    const density = 1.2; // dots per pixel of segment length
    const count = Math.max(1, Math.floor(len * density));
    ctx.fillStyle = activeColor;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const cx = x1 + dx * t + (Math.random() - 0.5) * width * 1.5;
      const cy = y1 + dy * t + (Math.random() - 0.5) * width * 1.5;
      const r = (Math.random() * 0.6 + 0.4) * width * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (brush.key === 'pencil') {
    // Light random jitter on each endpoint for texture
    const jx1 = x1 + (Math.random() - 0.5) * 0.8;
    const jy1 = y1 + (Math.random() - 0.5) * 0.8;
    const jx2 = x2 + (Math.random() - 0.5) * 0.8;
    const jy2 = y2 + (Math.random() - 0.5) * 0.8;
    ctx.beginPath();
    ctx.moveTo(jx1, jy1);
    ctx.lineTo(jx2, jy2);
    ctx.stroke();
  } else {
    // Ink, marker, eraser — standard line stroke
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  ctx.restore();
}
```

**BRUSH_DEFS object.**

```js
const BRUSH_DEFS = {
  pencil:  { key: 'pencil',  label: 'Pencil',  minWidth: 1,  maxWidth: 4,  alpha: 0.95, compositing: 'source-over',   useColor: true },
  ink:     { key: 'ink',     label: 'Ink',     minWidth: 2,  maxWidth: 6,  alpha: 1.0,  compositing: 'source-over',   useColor: true },
  marker:  { key: 'marker',  label: 'Marker',  minWidth: 4,  maxWidth: 10, alpha: 0.7,  compositing: 'source-over',   useColor: true },
  chalk:   { key: 'chalk',   label: 'Chalk',   minWidth: 3,  maxWidth: 8,  alpha: 0.85, compositing: 'source-over',   useColor: true },
  eraser:  { key: 'eraser',  label: 'Eraser',  minWidth: 4,  maxWidth: 16, alpha: 1.0,  compositing: 'destination-out', useColor: false },
  fill:    { key: 'fill',    label: 'Fill',    minWidth: 0,  maxWidth: 0,  alpha: 1.0,  compositing: 'source-over',   useColor: true, isFill: true }
};
```

**Paint bucket (flood fill).**

On `pointerdown` when `activeTool === 'fill'`, skip the stroke engine and instead call
`floodFill(panelIdx, x, y, activeColor)`. Implementation uses a standard queue-based
scanline fill over the canvas `ImageData`. 400×400 = 160,000 pixels, well within
performance budget for a tap-triggered operation.

```js
function floodFill(panelIdx, startX, startY, fillHex) {
  const canvas = panelCanvases[panelIdx];
  const ctx = panelContexts[panelIdx];
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;
  const w = canvas.width;
  const h = canvas.height;
  const sx = Math.floor(startX);
  const sy = Math.floor(startY);
  const idx = (sy * w + sx) * 4;
  const startR = data[idx], startG = data[idx+1], startB = data[idx+2], startA = data[idx+3];
  const fill = hexToRgba(fillHex); // {r,g,b,a}
  // Short-circuit: already the fill color
  if (startR === fill.r && startG === fill.g && startB === fill.b && startA === fill.a) return;

  const tolerance = 2; // 0..255, small tolerance for anti-aliased edges
  const stack = [[sx, sy]];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    const i = (y * w + x) * 4;
    if (Math.abs(data[i]   - startR) > tolerance) continue;
    if (Math.abs(data[i+1] - startG) > tolerance) continue;
    if (Math.abs(data[i+2] - startB) > tolerance) continue;
    if (Math.abs(data[i+3] - startA) > tolerance) continue;
    data[i]   = fill.r;
    data[i+1] = fill.g;
    data[i+2] = fill.b;
    data[i+3] = fill.a;
    stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
  }
  ctx.putImageData(img, 0, 0);

  // Record fill as a single "stroke" in the replay buffer (type: 'fill')
  recordFill(panelIdx, startX, startY, fillHex);
}
```

**Toolbar rendering.** Each brush gets a button with a 40×40 preview swatch showing the
brush's stroke characteristic (a small curved stroke rendered on an inline canvas). The
active brush gets a cyan glow border (`0 0 8px #00f0ff`).

**Edge cases.**

- **Eraser with flood fill color.** `compositing: 'destination-out'` ignores the color —
  it always removes pixels. Set `useColor: false` so the UI doesn't highlight a color
  swatch when eraser is active.
- **Chalk density at small brush sizes.** At width 3 (chalk min), 1.2 dots/px can look
  sparse. Clamp density to `Math.max(1.2, 3/width)` so thin chalk still reads as a line.
- **Fill across anti-aliased edges.** The tolerance of 2 handles most anti-aliased
  boundaries. If a fill leaks through a near-invisible gap, the tolerance is the right
  knob — don't add scanline optimization until Sonnet verifies the simple version works.

---

### FEATURE 3 — Autosave + resume

**Requirement.** Every 60 seconds while drawing and on `beforeunload`, serialize the full
comic state to a Drive JSON blob keyed by child + date. On page load, check for a draft
for today; if present, offer a resume prompt. If the kid chooses Resume, rehydrate every
panel canvas from its stored data URL and restore the replay buffer.

**Acceptance criteria.**

- `setInterval` fires every 60_000 ms during active sessions.
- `window.addEventListener('beforeunload', ...)` triggers a final save (synchronous-style
  serialize, fire-and-forget POST via `google.script.run`).
- Drive folder `Wolfkid Comics/drafts/` exists after first save (auto-created).
- File path: `buggsy_<YYYY-MM-DD>.json` in the drafts folder (overwritten each save).
- On `init()`, client calls `loadComicDraftSafe('buggsy')`. If response has a payload,
  show the resume prompt.
- Resume prompt renders with two buttons: `▶ RESUME` (cyan, primary) and `✖ START FRESH`
  (gray, secondary). Start Fresh deletes the draft file from Drive (calls
  `deleteComicDraftSafe(CHILD, getTodayDateKey())`) and proceeds to normal init. Writing
  an empty object is NOT sufficient — `loadComicDraft_` returns non-null whenever the
  file exists, so the resume card would reappear with an empty draft on the next reload.
- Resume rehydrates all 4 panel canvases by loading each stored data URL into an `Image`,
  drawing it to the canvas, and restoring `captions[]`, `activeTool`, `activeColor`, and
  `replayBuffer`.

**Draft JSON shape (client-owned; server persists opaquely).**

```js
// saved as Wolfkid Comics/drafts/buggsy_2026-04-09.json
{
  "version": 4,                       // draft format version (not MODULE_VERSION)
  "child": "buggsy",
  "dateKey": "2026-04-09",
  "savedAt": "2026-04-09T14:32:08.412Z",
  "episodeId": "wolfkid-ep-01-signal-in-the-storm", // null in Free Mode
  "mode": "mission",                  // "mission" or "free"
  "panelCount": 4,
  "activePanel": 2,
  "activeTool": "ink",
  "activeColor": "#00f0ff",
  "captions": ["It was a dark night.", "", "", ""],
  "panels": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",  // panel 0
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",  // panel 1
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",  // panel 2
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."   // panel 3
  ],
  "replayBuffer": [                   // see Feature 7 for full shape
    { "panel": 0, "brush": "ink", "color": "#000000",
      "startedAt": 1712678042123,
      "points": [
        { "x": 120.5, "y": 88.1, "p": 0.34, "t": 1712678042123 },
        { "x": 121.2, "y": 89.3, "p": 0.41, "t": 1712678042142 }
      ]
    }
  ]
}
```

Expected total size: 100–160 KB per draft. Drive handles this trivially.

**Client serialize helper.**

```js
function serializeDraft() {
  return {
    version: 4,
    child: CHILD,
    dateKey: todayISO(),
    savedAt: new Date().toISOString(),
    episodeId: currentEpisodeId, // set by mission-mode preload, null in free mode
    mode: currentMode,
    panelCount,
    activePanel,
    activeTool,
    activeColor,
    captions: captions.slice(0, panelCount),
    panels: panelCanvases
      .slice(0, panelCount)
      .map(c => c.toDataURL('image/jpeg', 0.7)),
    replayBuffer
  };
}

function autosaveDraft() {
  if (TBM_TEST_MODE) return;
  if (!hasDrawnAnything) return; // don't save empty drafts
  const draft = serializeDraft();
  const draftJson = JSON.stringify(draft);
  google.script.run
    .withSuccessHandler(() => { updateAutosaveBadge('saved'); })
    .withFailureHandler((err) => {
      console.warn('autosave failed:', err);
      updateAutosaveBadge('failed');
    })
    .saveComicDraftSafe(CHILD, draftJson);
}

// kick off periodic autosave after first stroke
let autosaveTimer = null;
function startAutosaveTimer() {
  if (autosaveTimer) return;
  autosaveTimer = setInterval(autosaveDraft, 60_000);
}

// final save on page unload
window.addEventListener('beforeunload', () => {
  if (hasDrawnAnything && !TBM_TEST_MODE) {
    // Note: google.script.run is fire-and-forget; GAS may or may not receive this
    // within the unload window. Best effort.
    autosaveDraft();
  }
});
```

**Server: `saveComicDraft_(child, draftJson)`.**

```js
/**
 * Write a comic draft blob to Drive. Overwrites any existing draft for this child+date.
 * Returns { success: true, fileId, bytes } or { error: message }.
 *
 * @param {string} child - 'buggsy' (only Buggsy today; shape allows future kids)
 * @param {string} draftJson - JSON string already serialized by the client
 * @returns {object}
 */
function saveComicDraft_(child, draftJson) {
  const lk = acquireLock_();
  if (!lk.acquired) return { error: 'locked' };
  try {
    const childLower = String(child || 'buggsy').toLowerCase();
    const dateKey = getTodayISO_();
    const folder = ensureComicDraftsFolder_();
    const fileName = childLower + '_' + dateKey + '.json';
    const existing = folder.getFilesByName(fileName);
    while (existing.hasNext()) {
      existing.next().setTrashed(true);
    }
    const blob = Utilities.newBlob(draftJson, 'application/json', fileName);
    const file = folder.createFile(blob);
    return { success: true, fileId: file.getId(), bytes: draftJson.length };
  } catch (e) {
    if (typeof logError_ === 'function') logError_('saveComicDraft_', e);
    return { error: String(e.message || e) };
  } finally {
    lk.lock.releaseLock();
  }
}

function saveComicDraftSafe(child, draftJson) {
  return withMonitor_('saveComicDraftSafe', function() {
    return JSON.parse(JSON.stringify(saveComicDraft_(child, draftJson)));
  });
}
```

**Server: `deleteComicDraft_(child, dateKey)`.**

```js
/**
 * Delete today's comic draft file from Drive. Called by Start Fresh in the
 * resume-card UI. Idempotent — deleting a non-existent file is a no-op.
 *
 * Using delete instead of overwriting with {} is required because
 * loadComicDraft_ returns non-null whenever the file exists, regardless of
 * content. An empty-object write would cause the resume card to reappear on
 * the next page load with an empty (but non-null) draft.
 *
 * @param {string} child - 'buggsy'
 * @param {string} dateKey - 'YYYY-MM-DD'
 * @return {object} { status: 'ok', deleted: true|false } or { status: 'locked' }
 */
function deleteComicDraft_(child, dateKey) {
  const lk = acquireLock_();
  if (!lk.acquired) return { status: 'locked' };
  try {
    const childLower = String(child || 'buggsy').toLowerCase();
    const key = dateKey || getTodayISO_();
    const folder = ensureComicDraftsFolder_();
    const fileName = childLower + '_' + key + '.json';
    const files = folder.getFilesByName(fileName);
    var deleted = false;
    while (files.hasNext()) {
      files.next().setTrashed(true);
      deleted = true;
    }
    return { status: 'ok', deleted: deleted };
  } catch (e) {
    if (typeof logError_ === 'function') logError_('deleteComicDraft_', e);
    return { status: 'error', message: String(e.message || e) };
  } finally {
    lk.lock.releaseLock();
  }
}

function deleteComicDraftSafe(child, dateKey) {
  return withMonitor_('deleteComicDraftSafe', function() {
    return JSON.parse(JSON.stringify(deleteComicDraft_(child, dateKey)));
  });
}
```

**Server: `loadComicDraft_(child)`.**

```js
/**
 * Load today's comic draft for a child. Returns the draft object or null if none.
 *
 * @param {string} child - 'buggsy'
 * @returns {object|null} - the draft JSON parsed, or null
 */
function loadComicDraft_(child) {
  try {
    const childLower = String(child || 'buggsy').toLowerCase();
    const dateKey = getTodayISO_();
    const folder = ensureComicDraftsFolder_();
    const fileName = childLower + '_' + dateKey + '.json';
    const files = folder.getFilesByName(fileName);
    if (!files.hasNext()) return null;
    const file = files.next();
    const text = file.getBlob().getDataAsString();
    return JSON.parse(text);
  } catch (e) {
    if (typeof logError_ === 'function') logError_('loadComicDraft_', e);
    return null;
  }
}

function loadComicDraftSafe(child) {
  return withMonitor_('loadComicDraftSafe', function() {
    const result = loadComicDraft_(child);
    return JSON.parse(JSON.stringify(result));
  });
}
```

**Server: `ensureComicDraftsFolder_()`.**

```js
/**
 * Returns the Drive folder for comic drafts, creating the parent and subfolder on demand.
 * Caches the folder ID in Script Properties for subsequent calls.
 */
function ensureComicDraftsFolder_() {
  const props = PropertiesService.getScriptProperties();
  const cached = props.getProperty('COMIC_DRAFTS_FOLDER_ID');
  if (cached) {
    try { return DriveApp.getFolderById(cached); }
    catch (_) { /* cached ID dead, fall through to rebuild */ }
  }
  const root = ensureComicArchiveRootFolder_();
  const sub = root.getFoldersByName('drafts');
  const drafts = sub.hasNext() ? sub.next() : root.createFolder('drafts');
  props.setProperty('COMIC_DRAFTS_FOLDER_ID', drafts.getId());
  return drafts;
}

function ensureComicArchiveRootFolder_() {
  const props = PropertiesService.getScriptProperties();
  const cached = props.getProperty('COMIC_ARCHIVE_FOLDER_ID');
  if (cached) {
    try { return DriveApp.getFolderById(cached); }
    catch (_) {}
  }
  const root = DriveApp.getRootFolder();
  const existing = root.getFoldersByName('Wolfkid Comics');
  const folder = existing.hasNext() ? existing.next() : root.createFolder('Wolfkid Comics');
  props.setProperty('COMIC_ARCHIVE_FOLDER_ID', folder.getId());
  return folder;
}
```

**Client rehydrate on resume.**

```js
async function rehydrateFromDraft(draft) {
  panelCount = draft.panelCount || 4;
  activePanel = draft.activePanel || 0;
  activeTool = draft.activeTool || 'ink';
  activeColor = draft.activeColor || '#000000';
  captions = draft.captions.slice();
  replayBuffer = draft.replayBuffer || [];
  currentMode = draft.mode || 'free';
  currentEpisodeId = draft.episodeId || null;
  hasDrawnAnything = replayBuffer.length > 0;

  buildPanelGrid(); // creates canvases
  // Now draw the stored panel images back into each canvas
  for (let i = 0; i < draft.panels.length; i++) {
    if (!draft.panels[i]) continue;
    await loadImageToCanvas(draft.panels[i], panelContexts[i]);
  }
  renderCaptions();
  updateToolbarSelection();
  if (hasDrawnAnything) startAutosaveTimer();
}

function loadImageToCanvas(dataUrl, ctx) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0); resolve(); };
    img.onerror = () => resolve(); // bad draft; skip this panel
    img.src = dataUrl;
  });
}
```

**Resume prompt.** Renders as a modal overlay (same pattern as `plan-overlay` at line
547) with two buttons. Blocks canvas interaction until the user chooses.

**Edge cases.**

- **Tab opened with no draft.** `loadComicDraftSafe` returns `null`; no prompt appears;
  normal init runs.
- **Stale draft (date mismatch).** The file is named by date key, so yesterday's draft
  won't be loaded today. Yesterday's draft stays on Drive until a cleanup pass clears
  it. Out of scope for v4 — LT can nuke the drafts folder manually if it fills up.
- **Draft larger than 500 KB.** Should not happen with 4 panels, but if the replay
  buffer grows beyond expectation, truncate it to the last 500 strokes in
  `serializeDraft` before shipping.
- **Network failure during autosave.** `withFailureHandler` shows a "save failed" badge
  in the header. Next autosave tick retries. No user-blocking behavior.
- **TEST MODE.** When `?test=1` is in the URL, autosave is skipped entirely (same pattern
  as existing `awardRings` skip at ComicStudio.html:993).

---

### FEATURE 4 — Episode preload (Mission Mode vs Free Mode)

**Requirement.** On init, call a new aggregator `getComicStudioContextSafe(child)` that
returns the mode decision plus all data needed for the right-sidebar brief. The server
owns the mode decision — client is dumb.

**Mode rules.**

- **Mission Mode** — returned when the kid HAS submitted today's Wolfkid CER (any row in
  `KH_Education` with `Module = 'wolfkid-cer'` or `Subject = 'Wolfkid Episode'` and
  `Timestamp` on today's date) AND the Thursday `wolfkidEpisode` exists in
  `getTodayContent_` (i.e. it's Thursday and the Buggsy curriculum row is seeded).
- **Free Mode** — any other case (no CER submitted, not Thursday, no curriculum row, etc.).

**Server: `getComicStudioContext_(child)`.**

```js
/**
 * Returns context for ComicStudio's mode decision and right-sidebar render.
 * Single round-trip: aggregates episode + CER submission + vocab in one call.
 *
 * @param {string} child - 'buggsy'
 * @returns {object} {
 *   mode: 'mission' | 'free',
 *   episodeId: string | null,
 *   episode: {                          // null in free mode
 *     id: string,
 *     title: string,
 *     scenario: string,
 *     writingPrompt: string,
 *     data: object                      // the weather data etc.
 *   } | null,
 *   studentCER: {                       // null in free mode
 *     submittedAt: string,              // ISO
 *     claim: string,                    // first sentence of responseText
 *     responseText: string,              // full text
 *     rings: number                      // rings awarded for the CER
 *   } | null,
 *   vocab: [                             // always populated (mission or free)
 *     { word: string, definition: string, sentence: string }
 *   ],
 *   freePrompts: [                       // array of 10 in free mode, empty in mission
 *     { id: string, text: string }
 *   ],
 *   ringsCap: number                     // 55 in mission, 30 in free
 * }
 */
function getComicStudioContext_(child) {
  const childLower = String(child || 'buggsy').toLowerCase();
  const today = getTodayISO_();
  const result = {
    mode: 'free',
    episodeId: null,
    episode: null,
    studentCER: null,
    vocab: [],
    freePrompts: [],
    ringsCap: 30
  };

  // 1. Load today's curriculum content
  let dayContent = null;
  try {
    const content = getTodayContent_(childLower);
    dayContent = (content && content.content) || null;
    if (dayContent && dayContent.vocabulary) {
      result.vocab = dayContent.vocabulary.slice(0, 5);
    }
  } catch (e) {
    if (typeof logError_ === 'function') logError_('getComicStudioContext_:content', e);
  }

  // 2. Check for a submitted Wolfkid CER today
  let studentCER = null;
  try {
    const sheet = ensureKHEducationTab_();
    if (sheet.getLastRow() >= 2) {
      const data = sheet.getDataRange().getValues();
      for (let i = data.length - 1; i >= 1; i--) {
        const row = data[i];
        const ts = row[0];
        const rowChild = String(row[1] || '').toLowerCase();
        const module = String(row[2] || '').toLowerCase();
        const subject = String(row[3] || '').toLowerCase();
        const responseText = String(row[6] || '');
        const status = String(row[7] || '');
        const rings = Number(row[9]) || 0;
        if (rowChild !== childLower) continue;
        if (!(ts instanceof Date)) continue;
        const rowDateKey = Utilities.formatDate(ts, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        if (rowDateKey !== today) continue;
        const isWolfkid = module.indexOf('wolfkid') !== -1 || subject.indexOf('wolfkid') !== -1;
        if (!isWolfkid) continue;
        if (!responseText) continue;
        studentCER = {
          submittedAt: ts.toISOString(),
          claim: responseText.split(/[.!?]/)[0].trim() + '.',
          responseText: responseText,
          rings: rings,
          status: status
        };
        break; // most recent wins
      }
    }
  } catch (e) {
    if (typeof logError_ === 'function') logError_('getComicStudioContext_:cer', e);
  }

  // 3. Decide mode
  if (dayContent && dayContent.wolfkidEpisode && studentCER) {
    result.mode = 'mission';
    result.episodeId = slugifyEpisodeTitle_(dayContent.wolfkidEpisode.title);
    result.episode = {
      id: result.episodeId,
      title: dayContent.wolfkidEpisode.title || '',
      scenario: dayContent.wolfkidEpisode.scenario || '',
      writingPrompt: dayContent.wolfkidEpisode.writingPrompt || '',
      data: dayContent.wolfkidEpisode.data || {}
    };
    result.studentCER = studentCER;
    result.ringsCap = 55;
  } else {
    result.mode = 'free';
    result.freePrompts = COMIC_STUDIO_FREE_PROMPTS.slice();
    result.ringsCap = 30;
  }

  return result;
}

function getComicStudioContextSafe(child) {
  return withMonitor_('getComicStudioContextSafe', function() {
    return JSON.parse(JSON.stringify(getComicStudioContext_(child)));
  });
}

function slugifyEpisodeTitle_(title) {
  return String(title || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
}
```

**COMIC_STUDIO_FREE_PROMPTS constant.** Add at top of Kidshub.js near the other constants.

```js
const COMIC_STUDIO_FREE_PROMPTS = [
  { id: 'mtl-vehicle',  text: 'Draw Mach Turbo Light\'s newest vehicle. What does it do that no other ride can?' },
  { id: 'pack-meeting', text: 'Draw the Pack at their team meeting. Who\'s arguing? Who\'s laughing?' },
  { id: 'new-villain',  text: 'Draw a villain we haven\'t met yet. Give them a name and a weakness.' },
  { id: 'hq-day',       text: 'Draw a normal day at Pack HQ. Show what everyone is doing.' },
  { id: 'training',     text: 'Draw Wolfkid training for a dangerous mission. Show three skills he\'s practicing.' },
  { id: 'origin',       text: 'Draw how Wolfkid first met Mach Turbo Light. Where were they? What happened?' },
  { id: 'disaster',     text: 'Draw the aftermath of a disaster — a flood, a storm, a fire. How does the Pack help?' },
  { id: 'secret-base',  text: 'Draw the Pack\'s secret underground base. Label three rooms.' },
  { id: 'crowd',        text: 'Draw the Pack getting thanked by a crowd. Who is cheering loudest? Why?' },
  { id: 'future',       text: 'Draw Wolfkid 10 years from now. What does he look like? What job does he have?' }
];
```

**Client: Mission Mode brief rendering.** The right sidebar renders a terminal-styled
panel with the scenario, the student's CER claim, and the episode data. All text uses
`JetBrains Mono` for the "terminal" feel. Scan-line animation on the background.

```html
<div class="mission-brief" id="mission-brief">
  <div class="brief-header">
    <div class="brief-icon">🛰</div>
    <div class="brief-title">MISSION BRIEFING</div>
    <div class="brief-dot"></div>
  </div>
  <div class="brief-section">
    <div class="brief-label">EPISODE</div>
    <div class="brief-episode-title" id="brief-episode-title"></div>
  </div>
  <div class="brief-section">
    <div class="brief-label">SCENARIO</div>
    <div class="brief-body" id="brief-scenario"></div>
  </div>
  <div class="brief-section">
    <div class="brief-label">DATA READOUT</div>
    <div class="brief-data" id="brief-data"></div>
  </div>
  <div class="brief-section">
    <div class="brief-label">YOUR CER CLAIM</div>
    <div class="brief-cer-claim" id="brief-cer-claim"></div>
  </div>
  <div class="brief-springboard">
    <em>Your mission: illustrate this episode your way.</em>
  </div>
</div>
```

`DATA READOUT` formats the `episode.data` object as a key-value table with monospace
spacing:

```
WIND SPEED    45 mph and dropping
TEMPERATURE   52F
FORECAST      clearing by 3pm
CURRENT TIME  11am
```

**Client: Free Mode brief rendering.** Swaps the brief panel for a simpler "FREE DRAW
CHALLENGE" panel with a rotating prompt (pick random from `freePrompts` on each init) and
the vocab callout.

```html
<div class="free-brief" id="free-brief">
  <div class="brief-header">
    <div class="brief-icon">🎨</div>
    <div class="brief-title">FREE DRAW CHALLENGE</div>
  </div>
  <div class="free-prompt" id="free-prompt-text"></div>
  <div class="free-vocab">
    <div class="brief-label">VOCAB BONUS</div>
    <div class="vocab-word" id="free-vocab-word"></div>
    <div class="vocab-def" id="free-vocab-def"></div>
  </div>
</div>
```

**Rings differential.** The ring cap is enforced client-side on `finishComic` (now
renamed to `publishComic`): base 15 + 10 if all panels captioned + 5 if ≥20 words = 30
max for Free Mode. Mission Mode adds +10 vocab bonus (curriculum-focused, not awarded in
Free Mode) + 15 episode-illustrated bonus = 55 max. Both caps are also enforced
server-side via `Math.min(rings, ringsCap)`. The ring cap is visible to the kid in
both modes — under the publish button:

- Mission: `+55 rings available if you nail the mission`
- Free: `+30 rings available for free draws`

**Edge cases.**

- **No curriculum row seeded.** Mode = free. The kid can still use Comic Studio every day.
- **CER submitted but `wolfkidEpisode` missing from today's content.** Mode = free (the
  episode context is the scarce resource).
- **Multiple CER submissions today.** Use the most recent row. For loop reads bottom-up.
- **CER with empty responseText.** Treated as not submitted. Mode = free.

---

### FEATURE 5 — Publish → Drive archive + Pushover notification

**Requirement.** On the "SAVE TO WOLFDOME ARCHIVES" button, composite all panels into a
single vertical PNG strip with speech-bubble captions, upload to Drive, fire Pushover to
BOTH parents with the Drive link, clear the draft, and trigger the achievement sequence
(see Feature 6). Rings are awarded server-side inside the publish call.

**Acceptance criteria.**

- Publish button is enabled only when at least one panel has strokes (`hasDrawnAnything === true`).
- Click compiles a PNG via offscreen canvas composition (not html2canvas; no new deps).
- Final PNG dimensions: **800 × 2400** px (4 panels × 600 px tall including caption region,
  centered in an 800px wide canvas with 100px horizontal padding).
- PNG written to Drive at `Wolfkid Comics/YYYY-MM-DD_<slug>.png` where slug is
  `slugifyEpisodeTitle_(episode.title)` in Mission Mode or `free-draw-<random>` in Free
  Mode.
- Pushover fires via `sendPush_(title, message, 'BOTH', PUSHOVER_PRIORITY.CHORE_APPROVAL, driveUrl)`
  where `driveUrl` is the shareable viewer URL.
- On success, client receives `{ driveUrl, fileName, rings }` and the achievement sequence
  (Feature 6) runs with the actual rings number.
- On failure, the client surfaces an error banner "Publish failed — try again" and the
  draft remains intact.
- Draft is cleared on successful publish (deleted from Drive drafts folder).

**PNG composition approach — pure Canvas2D (no html2canvas).**

```js
function composePublishPng(draftData) {
  const PANEL_WIDTH = 600;
  const PANEL_HEIGHT = 450;
  const CAPTION_HEIGHT = 150;
  const PADDING_X = 100;
  const PADDING_Y = 60;
  const TOTAL_WIDTH = 800;
  const PANEL_ROW_HEIGHT = PANEL_HEIGHT + CAPTION_HEIGHT + 30; // 30 gap
  const TOTAL_HEIGHT = PADDING_Y * 2 + PANEL_ROW_HEIGHT * panelCount + 120; // + header band
  const off = document.createElement('canvas');
  off.width = TOTAL_WIDTH;
  off.height = TOTAL_HEIGHT;
  const ctx = off.getContext('2d');

  // Background: navy gradient with scan lines
  const grad = ctx.createLinearGradient(0, 0, 0, TOTAL_HEIGHT);
  grad.addColorStop(0, '#0a1628');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, TOTAL_WIDTH, TOTAL_HEIGHT);

  // Scan lines
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let y = 0; y < TOTAL_HEIGHT; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(TOTAL_WIDTH, y);
    ctx.stroke();
  }

  // Header band
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 42px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WOLFDOME COMIC STUDIO', TOTAL_WIDTH / 2, 55);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '18px JetBrains Mono, monospace';
  ctx.fillText(episodeTitleOrDefault(), TOTAL_WIDTH / 2, 85);

  // Panels
  for (let i = 0; i < panelCount; i++) {
    const x = PADDING_X;
    const y = 120 + i * PANEL_ROW_HEIGHT;
    // Panel frame
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, PANEL_WIDTH, PANEL_HEIGHT);
    // Inner white background for the comic art
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 3, y + 3, PANEL_WIDTH - 6, PANEL_HEIGHT - 6);
    // Draw the panel canvas scaled into the frame
    ctx.drawImage(panelCanvases[i], x + 3, y + 3, PANEL_WIDTH - 6, PANEL_HEIGHT - 6);
    // Speech-bubble caption
    drawSpeechBubble(ctx, x, y + PANEL_HEIGHT + 18, PANEL_WIDTH, CAPTION_HEIGHT - 18, captions[i] || '');
  }

  // Footer stamp
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '14px JetBrains Mono, monospace';
  ctx.textAlign = 'right';
  ctx.fillText('Drawn by Buggsy • ' + todayISO(), TOTAL_WIDTH - PADDING_X, TOTAL_HEIGHT - 25);

  return off.toDataURL('image/png');
}

function drawSpeechBubble(ctx, x, y, w, h, text) {
  // Rounded rect bubble body
  const r = 16;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Caption text
  if (text) {
    ctx.fillStyle = '#0a1628';
    ctx.font = '24px Nunito, sans-serif';
    ctx.textAlign = 'left';
    wrapText(ctx, text, x + 20, y + 36, w - 40, 30);
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 20px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('(no caption)', x + w/2, y + h/2 + 6);
  }
}
```

**Client publish flow.**

```js
async function publishComic() {
  if (publishing) return;
  publishing = true;
  showPublishingOverlay(); // "Uploading your comic to the archives..."

  try {
    const pngDataUrl = composePublishPng();
    const pngBase64 = pngDataUrl.split(',')[1]; // strip "data:image/png;base64,"
    const meta = {
      mode: currentMode,
      episodeId: currentEpisodeId,
      episodeTitle: currentEpisode ? currentEpisode.title : null,
      captions: captions.slice(0, panelCount),
      vocabUsed: checkVocabInCaptions(),
      panelCount,
      totalWords: totalWordsInCaptions(),
      strokeCount: replayBuffer.length,
      durationMs: Date.now() - sessionStartAt
    };
    google.script.run
      .withSuccessHandler(onPublishSuccess)
      .withFailureHandler(onPublishFailure)
      .publishComicToArchiveSafe(CHILD, meta, pngBase64);
  } catch (e) {
    onPublishFailure(e);
  }
}

function onPublishSuccess(result) {
  publishing = false;
  hidePublishingOverlay();
  // Feature 6: achievement unlock sequence
  runAchievementSequence(result.rings, result.driveUrl, result.fileName);
}

function onPublishFailure(err) {
  publishing = false;
  hidePublishingOverlay();
  showBanner('Publish failed — try again', 'error');
  console.warn('publish failed:', err);
}
```

**Server: `publishComicToArchive_(child, meta, pngBase64)`.**

```js
/**
 * Publish a comic to the Wolfkid Comics Drive folder, fire Pushover, award rings,
 * clear today's draft.
 *
 * @param {string} child - 'buggsy'
 * @param {object} meta - { mode, episodeId, episodeTitle, captions[], vocabUsed, panelCount, totalWords, strokeCount, durationMs }
 * @param {string} pngBase64 - base64-encoded PNG bytes (no data: prefix)
 * @returns {object} { success, driveUrl, fileName, rings }
 */
function publishComicToArchive_(child, meta, pngBase64) {
  const lk = acquireLock_();
  if (!lk.acquired) return { error: 'locked' };
  try {
    const childLower = String(child || 'buggsy').toLowerCase();
    const dateKey = getTodayISO_();
    const slug = (meta && meta.episodeTitle)
      ? slugifyEpisodeTitle_(meta.episodeTitle)
      : 'free-draw-' + Utilities.getUuid().substring(0, 8);
    const fileName = dateKey + '_' + slug + '.png';

    // 1. Write PNG to archive root
    const rootFolder = ensureComicArchiveRootFolder_();
    const blob = Utilities.newBlob(Utilities.base64Decode(pngBase64), 'image/png', fileName);
    const file = rootFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const driveUrl = file.getUrl();

    // 2. Compute rings (server authoritative, cannot be client-spoofed)
    // Free Mode: 15 base + 10 all-panels + 5 saved = 30 max (vocab bonus is Mission-only)
    // Mission Mode: 15 base + 10 all-panels + 5 saved + 10 vocab + 15 episode = 55 max
    const isMission = meta && meta.mode === 'mission';
    let rings = 15; // base — all modes
    if (meta && meta.panelCount && meta.captions && meta.captions.filter(function(c) { return c && c.trim(); }).length === meta.panelCount) rings += 10;
    if (meta && meta.totalWords >= 20) rings += 5;
    if (isMission && meta.vocabUsed) rings += 10; // vocab bonus: Mission Mode only
    if (isMission) rings += 15;                   // episode-illustrated bonus: Mission Mode only
    // Belt-and-suspenders: enforce hard cap by mode so server can never over-award
    const ringsCap = isMission ? 55 : 30;
    rings = Math.min(rings, ringsCap);

    // 3. Award rings via existing KH pipeline
    try {
      if (typeof kh_awardEducationPoints_ === 'function') {
        kh_awardEducationPoints_(childLower, rings, 'comic-studio');
      }
    } catch (e) {
      if (typeof logError_ === 'function') logError_('publishComicToArchive_:awardRings', e);
    }

    // 4. Pushover to BOTH parents
    try {
      if (typeof sendPush_ === 'function') {
        const childDisplay = childLower.charAt(0).toUpperCase() + childLower.slice(1);
        const title = childDisplay + ' published a Wolfkid comic!';
        const message = (meta && meta.episodeTitle)
          ? meta.episodeTitle + ' — +' + rings + ' rings'
          : 'Free draw — +' + rings + ' rings';
        sendPush_(title, message, 'BOTH', PUSHOVER_PRIORITY.CHORE_APPROVAL, driveUrl);
      }
    } catch (e) {
      if (typeof logError_ === 'function') logError_('publishComicToArchive_:push', e);
    }

    // 5. Clear today's draft (best-effort, non-blocking)
    try {
      const draftsFolder = ensureComicDraftsFolder_();
      const draftFiles = draftsFolder.getFilesByName(childLower + '_' + dateKey + '.json');
      while (draftFiles.hasNext()) {
        draftFiles.next().setTrashed(true);
      }
    } catch (e) {
      if (typeof logError_ === 'function') logError_('publishComicToArchive_:clearDraft', e);
    }

    stampKHHeartbeat_();
    return { success: true, driveUrl: driveUrl, fileName: fileName, rings: rings };
  } catch (e) {
    if (typeof logError_ === 'function') logError_('publishComicToArchive_', e);
    return { error: String(e.message || e) };
  } finally {
    lk.lock.releaseLock();
  }
}

function publishComicToArchiveSafe(child, meta, pngBase64) {
  return withMonitor_('publishComicToArchiveSafe', function() {
    return JSON.parse(JSON.stringify(publishComicToArchive_(child, meta, pngBase64)));
  });
}
```

**Edge cases.**

- **PNG too large for `google.script.run` payload.** GAS caps `google.script.run` args at
  ~50 MB total, which 800×2400 PNG comfortably fits. A typical 4-panel comic compresses
  to ~300–500 KB. No chunking needed.
- **Drive folder ID caching stale.** `ensureComicArchiveRootFolder_` catches the
  `getFolderById` error and rebuilds via `getFoldersByName`.
- **Double-publish.** Client sets a `publishing = true` flag on entry; re-clicks are
  ignored. Button becomes visually disabled during the upload (~1-3 seconds).
- **Ring award duplicate guard.** `kh_awardEducationPoints_` already dedupes by its own
  UID pattern. A repeat publish on the same date+module produces at most 1 ring grant.
- **Pushover failure (no token or API down).** Non-fatal; publish still returns success.
  The kid still sees the achievement sequence. Parent notification retry is out of scope.
- **`setSharing` can fail** on workspace accounts with "anyone with link" disabled at
  the domain level. If `setSharing` throws, the file still exists; return the `file.getUrl()`
  unmodified — LT can grant access manually from Drive UI.

---

### FEATURE 6 — Wolfdome theming + MTL sidebar + achievement unlock sequence

**Requirement.** Apply the full Wolfdome aesthetic from `.claude/commands/game-design.md:45-56`.
Add a Mach Turbo Light (red hedgehog) sprite to the left sidebar with contextual tips that
rotate based on the kid's current activity. Build the boot-sequence loading screen and the
achievement-unlock sequence that fires on publish success.

**Palette (verified from game-design.md:46-47).**

```css
:root {
  --wd-navy:        #0a1628;
  --wd-charcoal:    #1a1a2e;
  --wd-cyan:        #00f0ff;
  --wd-red:         #ff4444;
  --wd-green:       #00ff88;
  --wd-text:        #e2e8f0;
  --wd-muted:       #94a3b8;
  --wd-panel-bg:    rgba(10, 22, 40, 0.85);
  --wd-panel-border: rgba(0, 240, 255, 0.35);
  --wd-glow-cyan:   0 0 12px rgba(0, 240, 255, 0.6);
  --wd-glow-red:    0 0 12px rgba(255, 68, 68, 0.5);
  --wd-glow-green:  0 0 12px rgba(0, 255, 136, 0.55);
}
```

**Background.**

```css
body {
  background: linear-gradient(135deg, var(--wd-navy) 0%, var(--wd-charcoal) 100%);
  color: var(--wd-text);
  font-family: 'Nunito', sans-serif;
  position: relative;
  min-height: 100vh;
}

/* Grid overlay at 8% opacity */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 240, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 240, 255, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 1;
}

/* Scan lines at 4% opacity, 2s slow drift */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 240, 255, 0.04) 0px,
    rgba(0, 240, 255, 0.04) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  z-index: 1;
  animation: scanDrift 8s linear infinite;
}

@keyframes scanDrift {
  0% { transform: translateY(0); }
  100% { transform: translateY(6px); }
}
```

**Panel borders with neon glow.**

```css
.panel-slot canvas,
.mission-brief,
.free-brief,
.toolbar-section {
  border: 2px solid var(--wd-panel-border);
  border-radius: 4px; /* sharp corners per game-design.md:50 */
  box-shadow: var(--wd-glow-cyan), inset 0 0 8px rgba(0, 240, 255, 0.1);
  transition: box-shadow 0.2s ease;
}

.panel-slot:hover canvas {
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.8), inset 0 0 10px rgba(0, 240, 255, 0.2);
}
```

**MTL sprite + speech bubble.**

MTL (Mach Turbo Light) is Buggsy's original character — red hedgehog. Per
`project_mach_turbo_light.md` memory, he's the only permitted design drift in TBM.
Source asset: find a 128×128 MTL PNG under `assets/` or `i.ibb.co/...` — verify existence,
fall back to a simple colored SVG placeholder if no PNG is available. The current
ComicStudio at `ComicStudio.html:501` references `https://i.ibb.co/FLDTT6QH/1774020751171.png`
as a watermark — reuse that URL if it's an MTL-adjacent image, otherwise commit a new
128×128 MTL sprite to the Drive assets and reference it.

**Left sidebar MTL block.**

```html
<div class="mtl-panel">
  <div class="mtl-sprite-wrap">
    <img src="<MTL_SPRITE_URL>" alt="Mach Turbo Light" class="mtl-sprite" />
    <div class="mtl-label">MISSION COMMANDER</div>
  </div>
  <div class="mtl-speech" id="mtl-speech">
    <div class="mtl-speech-text">Press harder for thicker lines.</div>
  </div>
</div>
```

```css
.mtl-sprite {
  width: 120px;
  height: 120px;
  display: block;
  margin: 0 auto;
  animation: mtlBob 3s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(255, 68, 68, 0.5));
}
@keyframes mtlBob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
.mtl-label {
  text-align: center;
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--wd-red);
  text-shadow: var(--wd-glow-red);
  margin-top: 8px;
}
.mtl-speech {
  background: var(--wd-panel-bg);
  border: 1px solid var(--wd-red);
  border-radius: 8px 8px 8px 0;
  padding: 10px 12px;
  margin-top: 10px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--wd-text);
  box-shadow: var(--wd-glow-red);
  position: relative;
}
.mtl-speech::before {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 0;
  height: 0;
  border-top: 8px solid var(--wd-red);
  border-right: 8px solid transparent;
}
```

**MTL contextual tips (rotate every 20 seconds).**

```js
const MTL_TIPS_COMMON = [
  'Press harder for thicker lines.',
  'Don\'t forget to caption your panels.',
  'Try the marker for bold strokes.',
  'Chalk looks great for shadows.',
  'Autosaving every minute — your work is safe.'
];

const MTL_TIPS_MISSION = [
  'The storm is clearing — how will Wolfkid act?',
  'Use the weather data in your comic somehow.',
  'Your CER claim is the starting frame. What happens next?',
  'Mission Mode unlocks +55 rings — make it count.'
];

const MTL_TIPS_FREE = [
  'Free Mode — draw what you want.',
  'Show someone in the Pack no one talks about.',
  'Give Mach Turbo Light a new gadget this week.',
  'Free Mode caps at 30 rings. Still awesome.'
];

function rotateMtlTip() {
  const pool = (currentMode === 'mission')
    ? MTL_TIPS_MISSION.concat(MTL_TIPS_COMMON)
    : MTL_TIPS_FREE.concat(MTL_TIPS_COMMON);
  const tip = pool[Math.floor(Math.random() * pool.length)];
  const el = document.querySelector('.mtl-speech-text');
  if (el) {
    el.style.opacity = 0;
    setTimeout(() => {
      el.textContent = tip;
      el.style.opacity = 1;
    }, 200);
  }
}

setInterval(rotateMtlTip, 20_000);
```

**Loading screen — terminal boot sequence.**

```html
<div id="boot-overlay">
  <div class="boot-inner">
    <pre id="boot-log"></pre>
  </div>
</div>
```

```js
const BOOT_LINES = [
  '[0.00] WOLFDOME COMIC STUDIO v4',
  '[0.21] Loading pack directory ...OK',
  '[0.47] Initializing pressure-sensing drawing subsystem ...OK',
  '[0.83] Mach Turbo Light online ...OK',
  '[1.12] Pulling today\'s mission brief ...OK',
  '[1.43] Systems nominal. Ready for artist.'
];

function runBootSequence() {
  const log = document.getElementById('boot-log');
  let i = 0;
  const interval = setInterval(() => {
    if (i >= BOOT_LINES.length) {
      clearInterval(interval);
      setTimeout(() => {
        document.getElementById('boot-overlay').classList.add('boot-done');
      }, 400);
      return;
    }
    log.textContent += BOOT_LINES[i] + '\n';
    i++;
  }, 220);
}
```

```css
#boot-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.5s ease;
}
#boot-overlay.boot-done {
  opacity: 0;
  pointer-events: none;
}
#boot-log {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: var(--wd-green);
  text-shadow: var(--wd-glow-green);
  white-space: pre;
  line-height: 1.6;
  max-width: 560px;
  min-height: 160px;
}
```

Total boot time: ~1.3 seconds (6 lines × 220 ms) + 400 ms fade = ~1.7 seconds. Fast
enough that impatient Buggsy doesn't notice, slow enough to feel intentional.

**Achievement unlock sequence (on publish success).**

Timeline (in ms, all triggered from `runAchievementSequence(rings, driveUrl, fileName)`):

| t (ms) | Action |
|---|---|
| 0 | Publishing overlay fades out. Canvas area dims to 40% opacity. |
| 100 | XP burst particles start radiating from the canvas center (see below). |
| 100 | Screen flash: 1 frame of full-screen cyan at 20% opacity, fades over 400 ms. |
| 300 | Ring counter in header starts animating from 0 to final `rings` over 1500 ms (ease-out). |
| 600 | Achievement badge drops in from the top: card with MTL mini-sprite, "ACHIEVEMENT UNLOCKED" header, "Wolfkid Historian" (or mission-specific title) label. Drop uses `cubic-bezier(0.34, 1.56, 0.64, 1)` for an overshoot bounce. |
| 800 | "ACHIEVEMENT UNLOCKED" text typewriter-animates in (12 ms per character). |
| 1400 | Achievement title ("Wolfkid Historian") fades in over 300 ms. |
| 1800 | Ring count animation ends. |
| 2000 | "VIEW IN ARCHIVE" button fades in (opens `driveUrl` in a new tab). |
| 2000 | "BACK TO MISSIONS" button fades in (navigates to `/daily-missions`). |

**XP burst particles.**

```js
function fireXpBurst(cx, cy) {
  const colors = ['#00f0ff', '#ff4444', '#00ff88', '#ffd700'];
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 80 + Math.random() * 120;
    const size = 4 + Math.random() * 6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const particle = document.createElement('div');
    particle.className = 'xp-particle';
    particle.style.cssText = `
      left: ${cx}px; top: ${cy}px;
      width: ${size}px; height: ${size}px;
      background: ${color};
      box-shadow: 0 0 8px ${color};
      --tx: ${(Math.cos(angle) * dist).toFixed(0)}px;
      --ty: ${(Math.sin(angle) * dist).toFixed(0)}px;
    `;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1400);
  }
}
```

```css
.xp-particle {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9998;
  animation: xpFly 1.4s cubic-bezier(0.15, 0, 0.55, 1) forwards;
}
@keyframes xpFly {
  0%   { transform: translate(0, 0) scale(1.3); opacity: 1; }
  60%  { opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
}
```

**Achievement title text** — pick based on mode + episode:

- Mission Mode: `Wolfkid Historian — ${episodeTitle}` (e.g. "Wolfkid Historian — Episode 1: The Signal in the Storm")
- Free Mode: `Free-Draw Scout — ${promptText.substring(0, 40)}...`

**Edge cases.**

- **Reduced motion.** Check `window.matchMedia('(prefers-reduced-motion: reduce)')`. If
  true, skip the particle burst and shorten all animations to < 200 ms. The ring counter
  still animates (it's meaningful motion).
- **Archive URL fails to copy.** "View in Archive" opens `driveUrl` via `window.open`. If
  Drive sharing failed (see Feature 5 edge case), the URL still points to the file —
  parents with Drive access can view, public viewers see a permission prompt. Not a bug
  to fix in v4.

---

### FEATURE 7 — Time-lapse replay (THE MAGIC FEATURE)

**Requirement.** Record every stroke during drawing (already captured in `replayBuffer`
for autosave — see Feature 3). On publish, replay the entire comic being drawn as a 10–15
second animation in an overlay. Each stroke plays back in order at accelerated speed, with
a progress bar. Playback is the default; WebM export is stretch and explicitly deferred if
too complex (see §14 Appendix).

**Acceptance criteria.**

- Every `pointerdown` creates a new stroke entry in `replayBuffer`.
- Every `pointermove` appends a point `{x, y, p, t}` to the current stroke's `points` array.
- Every `pointerup` finalizes the stroke (no further mutation).
- `floodFill` events are recorded as stroke type `'fill'` with a single point.
- Buffer persists through the draft (survives page reload).
- On publish success, the achievement sequence overlay includes a "▶ REPLAY" button that,
  when tapped, plays the full comic back in a 600×450 centered modal canvas.
- Total replay duration targets **12 seconds** (configurable). Per-stroke time:
  `max(300 ms, 12000 / totalStrokes)`.
- Progress bar under the modal canvas fills from 0% → 100% matching playback position.
- After replay finishes, a "▶ REPLAY AGAIN" button appears alongside a "SHARE REPLAY" button.
  SHARE REPLAY is marked `(coming soon)` in v4 (stretch feature — see §14).

**Replay buffer shape (stroke object).**

```js
// replayBuffer is top-level: var replayBuffer = [];
// Each entry:
{
  strokeId: 'stroke-1712678042123-abc',  // unique per stroke
  type: 'stroke',                         // 'stroke' | 'fill'
  panel: 2,                               // 0-indexed
  brush: 'ink',                           // BRUSH_DEFS key
  color: '#00f0ff',                       // hex
  startedAt: 1712678042123,               // ms since epoch
  endedAt: 1712678044320,                 // ms since epoch, set on pointerup
  points: [
    { x: 120.5, y: 88.1, p: 0.34, t: 1712678042123 },
    { x: 121.2, y: 89.3, p: 0.41, t: 1712678042142 },
    // ...
  ]
}

// Fill entry:
{
  strokeId: 'fill-1712678050000-xyz',
  type: 'fill',
  panel: 1,
  brush: 'fill',
  color: '#ff4444',
  startedAt: 1712678050000,
  endedAt: 1712678050000,
  points: [{ x: 200, y: 150, p: 0, t: 1712678050000 }]
}
```

**Recording functions.**

```js
let currentStrokeId = null;
let currentStrokePoints = [];

function newStrokeId() {
  return 'stroke-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
}

function recordStrokeStart(panelIdx, strokeId, pos, pressure, pointerType) {
  hasDrawnAnything = true;
  startAutosaveTimer();
  const entry = {
    strokeId,
    type: 'stroke',
    panel: panelIdx,
    brush: activeTool,
    color: activeColor,
    startedAt: Date.now(),
    endedAt: 0,
    points: [{ x: pos.x, y: pos.y, p: pressure, t: Date.now() }]
  };
  replayBuffer.push(entry);
  currentStrokeId = strokeId;
}

function recordStrokePoint(panelIdx, strokeId, x, y, pressure) {
  // Last entry should be the active stroke
  const e = replayBuffer[replayBuffer.length - 1];
  if (!e || e.strokeId !== strokeId) return;
  e.points.push({ x, y, p: pressure, t: Date.now() });
}

function recordStrokeEnd(panelIdx, strokeId) {
  const e = replayBuffer[replayBuffer.length - 1];
  if (!e || e.strokeId !== strokeId) return;
  e.endedAt = Date.now();
  currentStrokeId = null;
}

function recordFill(panelIdx, x, y, colorHex) {
  hasDrawnAnything = true;
  startAutosaveTimer();
  replayBuffer.push({
    strokeId: 'fill-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    type: 'fill',
    panel: panelIdx,
    brush: 'fill',
    color: colorHex,
    startedAt: Date.now(),
    endedAt: Date.now(),
    points: [{ x, y, p: 0, t: Date.now() }]
  });
}

function truncateReplayBufferIfNeeded() {
  // Defensive: cap buffer to last 500 strokes for autosave size
  if (replayBuffer.length > 500) {
    replayBuffer = replayBuffer.slice(-500);
  }
}
```

**Replay playback engine.**

```js
function playReplay() {
  const modal = document.getElementById('replay-modal');
  const canvas = document.getElementById('replay-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 600;
  canvas.height = 450;

  // Clear with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  modal.classList.remove('hidden');

  const totalDurationMs = 12000;
  const strokes = replayBuffer;
  if (strokes.length === 0) return;
  const perStroke = Math.max(300, Math.floor(totalDurationMs / strokes.length));

  // Scale from 400x400 panel space to a 600x450 replay canvas showing one panel at a time
  // Actually: we want to show the whole comic. Render a 2x2 grid of panels inside the replay canvas.
  // Each panel in replay canvas: ~290 x 220 px, 10 px gap.
  const PANEL_W = 285;
  const PANEL_H = 215;
  const PANELS = [
    { x: 5,   y: 5 },
    { x: 300, y: 5 },
    { x: 5,   y: 230 },
    { x: 300, y: 230 }
  ];

  // Draw panel frames up front
  strokes.forEach(() => {}); // no-op, just to suppress lint
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(PANELS[i].x, PANELS[i].y, PANEL_W, PANEL_H);
  }

  let strokeIdx = 0;
  const progressBar = document.getElementById('replay-progress');

  function playOneStroke() {
    if (strokeIdx >= strokes.length) {
      progressBar.style.width = '100%';
      showReplayDoneControls();
      return;
    }
    const stroke = strokes[strokeIdx];
    const panel = PANELS[stroke.panel] || PANELS[0];
    const scaleX = PANEL_W / 400;
    const scaleY = PANEL_H / 400;

    if (stroke.type === 'fill') {
      // Flash the panel background
      ctx.fillStyle = stroke.color;
      ctx.fillRect(panel.x, panel.y, PANEL_W, PANEL_H);
    } else {
      // Render each segment over perStroke ms, equal timing
      const segmentCount = Math.max(1, stroke.points.length - 1);
      const perSeg = perStroke / segmentCount;
      let segIdx = 0;

      function drawSegmentStep() {
        if (segIdx >= segmentCount) return;
        const p0 = stroke.points[segIdx];
        const p1 = stroke.points[segIdx + 1];
        const brush = BRUSH_DEFS[stroke.brush] || BRUSH_DEFS.ink;
        const width = pressureToWidth(p1.p, brush.minWidth, brush.maxWidth, 'pen');
        // Scale into replay canvas coords
        const x0 = panel.x + p0.x * scaleX;
        const y0 = panel.y + p0.y * scaleY;
        const x1 = panel.x + p1.x * scaleX;
        const y1 = panel.y + p1.y * scaleY;
        ctx.save();
        ctx.globalAlpha = brush.alpha;
        ctx.globalCompositeOperation = brush.compositing;
        ctx.strokeStyle = brush.useColor ? stroke.color : '#ffffff';
        ctx.lineWidth = width * Math.min(scaleX, scaleY);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.restore();
        segIdx++;
        setTimeout(drawSegmentStep, perSeg);
      }
      drawSegmentStep();
    }

    strokeIdx++;
    progressBar.style.width = ((strokeIdx / strokes.length) * 100).toFixed(1) + '%';
    setTimeout(playOneStroke, perStroke);
  }

  playOneStroke();
}
```

**Note on timing.** The nested `setTimeout` pattern is good enough for v4 — `requestAnimationFrame`
would give smoother 60 FPS playback but adds complexity. If Sonnet has spare time on day 4
(Mon Apr 13), upgrade to rAF. If not, ship the setTimeout version.

**Replay modal layout.**

```html
<div id="replay-modal" class="hidden">
  <div class="replay-inner">
    <div class="replay-header">
      <span class="replay-title">REPLAY</span>
      <button class="replay-close" onclick="closeReplayModal()">×</button>
    </div>
    <canvas id="replay-canvas" width="600" height="450"></canvas>
    <div class="replay-progress-wrap">
      <div id="replay-progress" class="replay-progress-fill"></div>
    </div>
    <div class="replay-controls" id="replay-controls">
      <button onclick="playReplay()">▶ REPLAY AGAIN</button>
      <button disabled title="Coming soon in v5">SHARE REPLAY (coming soon)</button>
    </div>
  </div>
</div>
```

**Edge cases.**

- **Empty buffer.** `replayBuffer.length === 0` — show a "Nothing to replay yet — draw
  something first!" message in the modal.
- **Giant buffer (>500 strokes).** Playback still works; per-stroke time floors at 300 ms
  so 500 strokes = 150 seconds. The buffer is already truncated to 500 in
  `truncateReplayBufferIfNeeded` so total is bounded.
- **Colors rendered with `destination-out` (eraser).** Eraser strokes in replay need
  `composite = 'destination-out'` on the replay canvas to match the original erase. The
  inner canvas is already prefilled with white, so erased regions show white — matches
  the source behavior.
- **Free-mode replay without a published comic.** Replay is triggered from the achievement
  sequence, which only runs on publish. So replay is always in the post-publish context.
  No standalone "replay my current work" in v4.

---

## 8. File change list

| File | Current state | Change | Version bump |
|---|---|---|---|
| `ComicStudio.html` | 1043 lines, v1/v3 mismatch | **REWRITTEN** — full rebuild per §6 + §7 features | `v3 → v4` (meta tag line 7) + `v1 → v4` (`MODULE_VERSION` line 610). Both labels must match. |
| `Kidshub.js` | ~4050 lines | Add `COMIC_STUDIO_FREE_PROMPTS` constant, `getComicStudioContext_` + Safe wrapper, `saveComicDraft_` + Safe, `loadComicDraft_` + Safe, `publishComicToArchive_` + Safe, `ensureComicArchiveRootFolder_`, `ensureComicDraftsFolder_`, `slugifyEpisodeTitle_`. ~350 new lines. | `getKidsHubVersion` +1 (verify current at file header; bump header comment, getter, and EOF comment per the 3-location rule) |
| `Code.js` | 1987 lines | Add 4 new Safe wrappers to `API_WHITELIST` (line 377–432) AND to the `fns` diagnostic list near line 1363. No other changes. | `getCodeVersion` +1 (3-location) |
| `Tbmsmoketest.js` | 706 lines | Add 4 new Safe wrapper names to `CANONICAL_SAFE_FUNCTIONS` (line 42–62). | `getSmokeTestVersion` 6 → 7 (3-location) |
| `GASHardening.js` | (verify) | Add 4 new Safe wrapper names to the diagnostic list at ~line 1720 (where `awardRingsSafe` is at line 1723). | `getHardeningVersion` +1 (3-location) |
| `specs/comicstudio-v4.md` | new file | **THIS SPEC** | — |

**Files NOT touched:**

- `daily-missions.html` — Thursday block already wires to `?page=comic-studio`, no change needed
- `CurriculumSeed.js` — `wolfkidEpisode` structure is the contract; new v4 code reads it as-is
- `cloudflare-worker.js` — `/comic-studio` route already exists at line 30
- `audit-source.sh` — existing ES5 scan excludes ComicStudio.html. **Add an explicit
  allowlist comment** referencing this spec so future audit runs don't flag the ES6+ syntax.
  See §9.
- `KidsHub.html`, `ThePulse.html`, `TheVein.html`, `SparkleLearning.html`, and every other
  education HTML file — no changes
- `.claspignore`, `appsscript.json` — no changes

---

## 9. audit-source.sh ES5 exemption

**Action:** Sonnet must add ComicStudio.html to the ES5 scan exclusion list in
`audit-source.sh`.

**Current state:** `audit-source.sh` runs ES5-pattern greps over all `.html` files. Let
Sonnet grep for the scan loop (likely `find . -name '*.html'` or equivalent) and add:

```bash
# ComicStudio.html is exempt from ES5 rule — runs on Chrome (Surface Pro 5),
# not Fully Kiosk on Android WebView. See specs/comicstudio-v4.md §3.
HTML_FILES=$(find . -maxdepth 1 -name '*.html' ! -name 'ComicStudio.html')
```

If the scan uses a different pattern (e.g. a hard-coded list), the intent is the same:
exclude `ComicStudio.html` explicitly and leave a comment pointing at this spec.

**Verification before committing:** after the change, run `bash audit-source.sh` with a
deliberate ES6 test (`const x = 1;`) inserted into ComicStudio.html. The audit should pass.
Remove the test. Run again — should still pass. Then run with the same test inserted into
a different HTML file (e.g. HomeworkModule.html). The audit should FAIL. This proves the
exemption is narrow, not global.

---

## 10. API_WHITELIST additions (exact entries for Code.js)

Add these lines to the `API_WHITELIST` object in `Code.js` (line 377–432), adjacent to
existing Buggsy/education entries:

```js
'getComicStudioContextSafe': getComicStudioContextSafe,
'saveComicDraftSafe':        saveComicDraftSafe,
'loadComicDraftSafe':        loadComicDraftSafe,
'deleteComicDraftSafe':      deleteComicDraftSafe,
'publishComicToArchiveSafe': publishComicToArchiveSafe,
```

Additionally add the same 5 names to the diagnostic `fns` list near line 1363 (so
`listFunctions` stays honest):

```js
// v75: Comic Studio v4
'getComicStudioContext_', 'getComicStudioContextSafe',
'saveComicDraft_', 'saveComicDraftSafe',
'loadComicDraft_', 'loadComicDraftSafe',
'deleteComicDraft_', 'deleteComicDraftSafe',
'publishComicToArchive_', 'publishComicToArchiveSafe',
```

---

## 11. Smoke test wiring (exact entries for Tbmsmoketest.js)

Add these to `CANONICAL_SAFE_FUNCTIONS` (line 42–62), any position in the array:

```js
'getComicStudioContextSafe',
'saveComicDraftSafe',
'loadComicDraftSafe',
'deleteComicDraftSafe',
'publishComicToArchiveSafe',
```

After the push, run `tbmSmokeTest()` from the GAS editor. Category 1 (wiring) must show
all 5 new functions as present. If any return as missing, the Safe wrapper is not defined
in Kidshub.js — fix the definition, re-push, re-run.

---

## 12. Gate 4 manifest (grep lines that prove the build landed)

Run each line from the repo root after `clasp push`. Expected results in the right column.
Zero matches or `display:none` = NOT DONE.

```
# Version alignment
grep -n 'tbm-version" content="v4"' ComicStudio.html
  → expected: 1 match at line 7
grep -n "MODULE_VERSION = 'v4'" ComicStudio.html
  → expected: 1 match (was v1 before)

# Feature 1: Pointer Events
grep -n 'pointerdown' ComicStudio.html
  → expected: ≥1 match
grep -n 'setPointerCapture' ComicStudio.html
  → expected: ≥1 match
grep -n 'e.pressure\|event.pressure' ComicStudio.html
  → expected: ≥2 matches
grep -n "pressureToWidth\|Math.pow(pressure, 1.6)" ComicStudio.html
  → expected: ≥1 match
grep -n 'Pen detected\|pen-badge' ComicStudio.html
  → expected: ≥1 match
grep -n "addEventListener('mousedown'\|addEventListener('touchstart'" ComicStudio.html
  → expected: 0 matches (all removed)
grep -n 'touch-action' ComicStudio.html
  → expected: ≥1 match (CSS `touch-action: none` on canvas)

# Feature 2: Brush system
grep -n 'BRUSH_DEFS' ComicStudio.html
  → expected: ≥2 matches (define + reference)
grep -n "key: 'pencil'\|key: 'ink'\|key: 'marker'\|key: 'chalk'\|key: 'eraser'\|key: 'fill'" ComicStudio.html
  → expected: 6 matches (one per brush)
grep -n 'floodFill\|destination-out' ComicStudio.html
  → expected: ≥2 matches

# Feature 3: Autosave + resume
grep -n 'saveComicDraftSafe\|loadComicDraftSafe\|deleteComicDraftSafe' ComicStudio.html
  → expected: ≥3 matches
grep -n "setInterval(autosaveDraft\|setInterval.*60" ComicStudio.html
  → expected: ≥1 match
grep -n "beforeunload" ComicStudio.html
  → expected: ≥1 match
grep -n 'RESUME\|START FRESH' ComicStudio.html
  → expected: ≥2 matches
grep -n "deleteComicDraftSafe" ComicStudio.html
  → expected: ≥1 match (Start Fresh handler — NOT saveComicDraftSafe with empty object)
grep -n "function saveComicDraft_\|function loadComicDraft_\|function deleteComicDraft_" Kidshub.js
  → expected: 3 matches
grep -n "function deleteComicDraft_\|function deleteComicDraftSafe" Kidshub.js
  → expected: 2 matches
grep -n "ensureComicDraftsFolder_\|ensureComicArchiveRootFolder_" Kidshub.js
  → expected: ≥4 matches

# Feature 4: Episode preload / Mission vs Free Mode
grep -n 'getComicStudioContextSafe' ComicStudio.html
  → expected: ≥1 match
grep -n "function getComicStudioContext_\|function getComicStudioContextSafe" Kidshub.js
  → expected: 2 matches
grep -n "wolfkidEpisode" Kidshub.js
  → expected: ≥1 match (inside getComicStudioContext_)
grep -n "COMIC_STUDIO_FREE_PROMPTS" Kidshub.js
  → expected: ≥2 matches (define + reference)
grep -n "MISSION BRIEFING\|FREE DRAW CHALLENGE" ComicStudio.html
  → expected: 2 matches
grep -n "currentMode === 'mission'\|currentMode === 'free'" ComicStudio.html
  → expected: ≥2 matches
grep -n "ringsCap: 55\|ringsCap: 30" Kidshub.js
  → expected: 2 matches

# Feature 5: Publish → Drive + Pushover
grep -n "function publishComicToArchive_\|function publishComicToArchiveSafe" Kidshub.js
  → expected: 2 matches
grep -n "publishComicToArchiveSafe" ComicStudio.html
  → expected: ≥1 match
grep -n "PUSHOVER_PRIORITY.CHORE_APPROVAL" Kidshub.js
  → expected: ≥1 match within publishComicToArchive_
grep -n "SAVE TO WOLFDOME ARCHIVES\|WOLFDOME ARCHIVES" ComicStudio.html
  → expected: ≥1 match
grep -n "composePublishPng\|drawSpeechBubble" ComicStudio.html
  → expected: ≥2 matches

# Feature 6: Wolfdome theming + MTL
grep -n "#0a1628" ComicStudio.html
  → expected: ≥1 match (navy background)
grep -n "#00f0ff" ComicStudio.html
  → expected: ≥3 matches (cyan accents)
grep -n "#ff4444" ComicStudio.html
  → expected: ≥1 match (red for MTL)
grep -n "mtl-sprite\|Mach Turbo Light\|MISSION COMMANDER" ComicStudio.html
  → expected: ≥2 matches
grep -n "MTL_TIPS_COMMON\|MTL_TIPS_MISSION\|MTL_TIPS_FREE" ComicStudio.html
  → expected: 3 matches (one per array)
grep -n "boot-overlay\|WOLFDOME COMIC STUDIO" ComicStudio.html
  → expected: ≥2 matches
grep -n "scanDrift\|scan lines" ComicStudio.html
  → expected: ≥1 match
grep -n "runAchievementSequence\|ACHIEVEMENT UNLOCKED" ComicStudio.html
  → expected: ≥2 matches
grep -n "fireXpBurst\|xp-particle" ComicStudio.html
  → expected: ≥2 matches

# Feature 7: Time-lapse replay
grep -n "replayBuffer" ComicStudio.html
  → expected: ≥8 matches (extensive use)
grep -n "playReplay\|replay-modal\|REPLAY" ComicStudio.html
  → expected: ≥3 matches
grep -n "recordStrokeStart\|recordStrokePoint\|recordStrokeEnd" ComicStudio.html
  → expected: 3 matches (definitions)

# ES6 exception callout
grep -n "ES6+ ALLOWED IN THIS FILE ONLY\|NOT a Fire Stick" ComicStudio.html
  → expected: ≥1 match (the comment block near MODULE_VERSION)

# audit-source.sh exemption
grep -n "ComicStudio.html" audit-source.sh
  → expected: ≥1 match (the exclusion comment)

# API_WHITELIST + smoke test wiring
grep -n "getComicStudioContextSafe.*:" Code.js
  → expected: 1 match (inside API_WHITELIST)
grep -n "saveComicDraftSafe\|loadComicDraftSafe\|deleteComicDraftSafe\|publishComicToArchiveSafe" Code.js
  → expected: ≥8 matches (API_WHITELIST + fns list = 2 each = 8 total, minimum)
grep -n "getComicStudioContextSafe\|saveComicDraftSafe\|loadComicDraftSafe\|deleteComicDraftSafe\|publishComicToArchiveSafe" Tbmsmoketest.js
  → expected: ≥5 matches (one per function in CANONICAL_SAFE_FUNCTIONS)
```

---

## 13. Gate 5 — Feature Verification Checklist

This is the feature-correctness gate. Every item has a measurable pass condition. Items
are cumulative — all prior verified items carry forward to every future ComicStudio build.

### Core pressure drawing (Feature 1)

- [ ] **VC-CS-01** — With the Surface Pen, drawing at very light press (pressure ≈ 0.15)
      produces a line ≤ 3 px wide on the Ink brush. Measured by inspecting the canvas
      pixel data after a short stroke.
- [ ] **VC-CS-02** — With the Surface Pen, drawing at full press (pressure ≈ 0.95)
      produces a line ≥ 5 px wide on the Ink brush.
- [ ] **VC-CS-03** — The "✏ Pen detected" badge appears in the header within 100 ms of
      the pen first touching the canvas. The badge text is exactly "Pen detected" (no
      emoji variation).
- [ ] **VC-CS-04** — A fast diagonal flick across a panel produces a continuous line
      with no visible gaps (Pointer Capture is working).
- [ ] **VC-CS-05** — With mouse + Shift held, drawing from (100, 100) to (200, 300)
      produces a horizontal line at y=100 (Shift-constrain active).

### Brush system (Feature 2)

- [ ] **VC-CS-06** — The toolbar shows exactly 6 brush buttons: Pencil, Ink, Marker,
      Chalk, Eraser, Fill. Buttons render in that order.
- [ ] **VC-CS-07** — Tapping Marker then drawing produces a line that is visibly
      semi-transparent (alpha ≈ 0.7) — confirmed by overlapping two strokes and seeing
      the intersection as a darker shade.
- [ ] **VC-CS-08** — Tapping Chalk then drawing produces a scatter-particle pattern
      (not a solid line). Individual dots are distinguishable at brush size 5+.
- [ ] **VC-CS-09** — Tapping Fill then tapping inside a closed shape flood-fills the
      shape with the active color. Fill does not leak outside the enclosed region.
- [ ] **VC-CS-10** — Tapping Eraser then drawing removes pixels (canvas background
      becomes visible where erased). Eraser width scales with pen pressure.
- [ ] **VC-CS-11** — Switching panels preserves the active brush — if Ink was selected
      in Panel 1, tapping Panel 2 still has Ink as the active brush.

### Autosave + resume (Feature 3)

- [ ] **VC-CS-12** — After first stroke, `setInterval(autosaveDraft, 60000)` is running
      (verify via browser devtools → Sources → paused state shows the timer).
- [ ] **VC-CS-13** — Each autosave tick produces a visible "Saved just now" or
      equivalent status pill in the header. Status updates even on network failure (to
      "Save failed").
- [ ] **VC-CS-14** — Reloading the page within the same day with autosave data
      triggers a resume prompt. The prompt text includes the word "RESUME" in all caps.
- [ ] **VC-CS-15** — Tapping RESUME on the prompt restores all 4 panel canvases visually
      identical to pre-reload (diffable by pixel inspection).
- [ ] **VC-CS-16** — Tapping START FRESH on the prompt calls `deleteComicDraftSafe` and
      deletes the draft file from Drive. Verified by reloading immediately after tapping
      START FRESH: `loadComicDraftSafe('buggsy')` returns null and the resume card does
      NOT appear. (Writing an empty object is not acceptable — file existence alone
      triggers the resume card.)
- [ ] **VC-CS-17** — The Drive folder `Wolfkid Comics/drafts/` exists after first
      autosave. The draft file is named `buggsy_<YYYY-MM-DD>.json` exactly.

### Mission Mode / Free Mode (Feature 4)

- [ ] **VC-CS-18** — With a Wolfkid CER submitted for today and Thursday curriculum
      seeded, opening ComicStudio enters Mission Mode. The right sidebar shows
      "MISSION BRIEFING" as the header text.
- [ ] **VC-CS-19** — In Mission Mode, the right sidebar renders `episode.title`,
      `episode.scenario`, `episode.data`, and `studentCER.claim` as separate labeled
      sections.
- [ ] **VC-CS-20** — In Mission Mode, the ring counter under the publish button reads
      exactly `+55 rings available if you nail the mission`.
- [ ] **VC-CS-21** — With NO CER submitted for today, opening ComicStudio enters Free
      Mode. Right sidebar shows "FREE DRAW CHALLENGE" as the header text.
- [ ] **VC-CS-22** — In Free Mode, the prompt text is randomly selected from
      `COMIC_STUDIO_FREE_PROMPTS` (10 prompts). Refreshing the page shows a different
      prompt most of the time (not enforced — probabilistic).
- [ ] **VC-CS-23** — In Free Mode, the ring counter under the publish button reads
      exactly `+30 rings available for free draws`.
- [ ] **VC-CS-24** — The server function `getComicStudioContextSafe('buggsy')` returns
      an object with exactly these top-level keys: `mode`, `episodeId`, `episode`,
      `studentCER`, `vocab`, `freePrompts`, `ringsCap`. Verified via Logger.log
      from the GAS editor.

### Publish → Drive + Pushover (Feature 5)

- [ ] **VC-CS-25** — The SAVE TO WOLFDOME ARCHIVES button is disabled (visually grayed
      out) until at least one stroke has been made.
- [ ] **VC-CS-26** — Clicking the publish button uploads a PNG to Drive. The file
      appears in `Wolfkid Comics/` (not in `drafts/`) within 5 seconds.
- [ ] **VC-CS-27** — The uploaded PNG has dimensions exactly 800 × 2400. Verified by
      downloading and checking via `file` command or image properties.
- [ ] **VC-CS-28** — In Mission Mode, the published filename matches
      `<YYYY-MM-DD>_<slug-of-episode-title>.png`. In Free Mode, matches
      `<YYYY-MM-DD>_free-draw-<8-char-uuid>.png`.
- [ ] **VC-CS-29** — A Pushover notification fires on publish to BOTH LT and JT. Title
      text includes `Buggsy published a Wolfkid comic!`. Message includes the rings
      count. Notification has a clickable URL that opens the published PNG in Drive.
- [ ] **VC-CS-30** — On publish success, the draft file is deleted from
      `Wolfkid Comics/drafts/` within 10 seconds. Verified by reloading and confirming
      no resume prompt appears.
- [ ] **VC-CS-31** — On simulated publish failure (throw inside `publishComicToArchive_`),
      the client shows an error banner "Publish failed — try again" and the draft is
      still present on Drive.
- [ ] **VC-CS-32** — Server-computed rings match the formula: 15 base + 10 if all panels
      captioned + 5 if ≥20 words (both modes) + 10 if vocab used (Mission Mode only) +
      15 episode-illustrated bonus (Mission Mode only). Max 55 in Mission, 30 in Free.
      Server enforces the cap via `Math.min(rings, ringsCap)` regardless of input, so
      a well-captioned free draw cannot exceed 30 rings.

### Wolfdome theming + MTL + achievement sequence (Feature 6)

- [ ] **VC-CS-33** — Body background is the navy→charcoal gradient. Verified by DOM
      inspection: `getComputedStyle(document.body).background` contains `#0a1628` and
      `#1a1a2e`.
- [ ] **VC-CS-34** — Grid overlay is visible on the background at 8% opacity. Verified
      by reading the `::before` pseudo-element CSS.
- [ ] **VC-CS-35** — Scan lines animate vertically every 8 seconds. Verified by
      inspecting `body::after` CSS for `scanDrift` animation.
- [ ] **VC-CS-36** — Panel canvas borders have a cyan neon glow
      (`box-shadow` includes `rgba(0, 240, 255, ...)` with a blur ≥ 8 px).
- [ ] **VC-CS-37** — MTL sprite is visible in the left sidebar at 120×120 px with a
      red drop-shadow. Sprite idle-animates (bob up/down) every 3 seconds.
- [ ] **VC-CS-38** — MTL speech bubble starts with a tip from `MTL_TIPS_COMMON` on
      first render. After 20 seconds, the tip text changes (rotation active).
- [ ] **VC-CS-39** — Boot sequence overlay runs on page load. Shows at least 4 "loading
      subsystem" lines in monospace green. Clears within 2 seconds.
- [ ] **VC-CS-40** — On publish success, the achievement sequence fires: particle burst
      (at least 20 particles), ring counter animates from 0 to the rings total over
      ~1500 ms, achievement badge drops in with bounce, "ACHIEVEMENT UNLOCKED" text
      types in character by character.
- [ ] **VC-CS-41** — Achievement sequence shows a "VIEW IN ARCHIVE" button that opens
      the Drive URL in a new tab (`target="_blank"`).

### Time-lapse replay (Feature 7)

- [ ] **VC-CS-42** — `replayBuffer` accumulates exactly one entry per `pointerdown`.
      Verified by drawing 5 strokes and checking `replayBuffer.length === 5` via
      console.
- [ ] **VC-CS-43** — Each stroke entry has the exact keys: `strokeId`, `type`, `panel`,
      `brush`, `color`, `startedAt`, `endedAt`, `points`. `points` is a non-empty array
      of `{x, y, p, t}` objects.
- [ ] **VC-CS-44** — Fill operations are recorded with `type: 'fill'` and a single
      point.
- [ ] **VC-CS-45** — On the achievement overlay, a "▶ REPLAY" button appears.
- [ ] **VC-CS-46** — Tapping REPLAY opens a modal with a 600×450 canvas that re-plays
      the entire comic. Duration is 10–15 seconds for a typical comic (~50–150 strokes).
- [ ] **VC-CS-47** — The replay progress bar under the canvas fills from 0% to 100%
      matching playback position.
- [ ] **VC-CS-48** — After replay finishes, a "REPLAY AGAIN" button appears along with
      a disabled "SHARE REPLAY (coming soon)" button.

### Cross-cutting

- [ ] **VC-CS-49** — The file is exactly v4 at both locations (meta tag line 7 AND
      `MODULE_VERSION` in the init script). Grep-verified.
- [ ] **VC-CS-50** — `audit-source.sh` runs clean after commit (ES5 exemption in effect).
- [ ] **VC-CS-51** — `tbmSmokeTest()` Category 1 Wiring shows all 4 new Safe wrappers as
      PRESENT, not MISSING.
- [ ] **VC-CS-52** — ES6+ syntax is actually used in the file (not merely allowed). Grep:
      `grep -cE 'const |let |=>|\`.*\${' ComicStudio.html` returns ≥ 20. If the file
      still uses exclusively ES5 syntax, the exception is wasted.

---

## 14. Appendix: deferred scope

These items were explicitly cut from v4 scope. Listed here so they don't get lost, with
rationale for each and a rough guess at where they land next.

| Item | Rationale for deferring | Where it might land |
|---|---|---|
| **Speech bubble tool** | DOM overlays + composite is an extra composition path that's easy to get wrong at 2D canvas compositing time. Captions already work and speech-bubbles are aesthetic, not content. | v5 (weekend after v4 ships, if QA clean) |
| **Character stamps via Gemini** | Gemini-generated stamps have a quality floor and a tuning loop. A week is not enough. The brush system (Feature 2) delivers expressive variety without the asset generation risk. | v5 or later, only if we build a character asset library on Drive first |
| **Scene backgrounds with selectable themes** | CSS gradients already look great per game-design.md. Adding a theme picker adds a UI dimension without obvious payoff. | v5 if LT requests it |
| **Sound effects** | Audio pipeline on TBM is already well-developed (phrases.json + ElevenLabs), but integrating into a creative tool is a distraction from the core drawing loop. | Optional in v4: pen click in replay playback IF Sonnet has spare time on day 4 |
| **Gallery / portfolio page** | The Drive folder IS the gallery. LT can open it directly. Building a custom viewer is a second surface. | v6 maybe — first validate kids use the publish feature |
| **Rename to "Wolfkid Story Studio"** | `ComicStudio` is the established brand and file name. Rename forces route, worker, and cache changes with zero upside. | Won't do |
| **WebM replay export** | MediaRecorder on canvas streams works in Chrome but capture UX is finicky — the 12-second replay has to run at real time, not accelerated, which kills the kid's attention. Also adds MediaRecorder API surface area. Deferring as explicit stretch. | v5 stretch; spec the playback NOW (Feature 7), add the capture later |

### A note on one item I considered arguing for

**I considered arguing for the speech bubble tool** because it's the single feature that
would most transform ComicStudio from "drawing app" to "comic book builder" in a kid's
perception. Speech bubbles are the thing comics have that drawings don't.

But two facts killed that argument:

1. Sonnet has 5 build days for 7 features. Adding an 8th with DOM→canvas compositing
   risk (which is exactly the class of risk that killed character stamps) is the wrong
   trade.
2. Captions already exist and already render under each panel in the published PNG
   (drawn as speech-bubble-shaped white rectangles with cyan borders in
   `drawSpeechBubble`). That's a solid 80% of the perceived value of speech bubbles
   without the on-canvas text placement UX.

So I'm not arguing for it. Ship v4 as scoped, QA it on Thursday, and revisit speech
bubbles in a v5 design session if Buggsy specifically asks for them.

---

## 15. Implementation roadmap

| Day | Date | Features | Primary file changes |
|---|---|---|---|
| 1 | Fri Apr 10 | F1 (Pointer Events) + F2 (brushes) + F3 scaffold (client serialize only) | `ComicStudio.html` rewrite begins |
| 2 | Sat Apr 11 | F3 complete (Drive draft + resume prompt) + F4 (server aggregator + mode UI) | `ComicStudio.html`, `Kidshub.js` (server functions) |
| 3 | Sun Apr 12 | F5 (publish flow + Drive archive + Pushover) | `Kidshub.js` (publish server), `ComicStudio.html` (compose + button wiring) |
| 4 | Mon Apr 13 | F7 (time-lapse replay playback + recording) | `ComicStudio.html` (replay engine) |
| 5 | Tue Apr 14 | F6 (Wolfdome theming, MTL sidebar, achievement sequence, boot screen) | `ComicStudio.html` (CSS + sequence JS) |
| 6 | Wed Apr 15 | QA on Surface Pro with stylus, bug fixes, Gate 5 verification | (fixes as needed) |
| 7 | Thu Apr 16 | Buggsy runs the full CER → Comic Studio loop live | — |

Each day ends with `audit-source.sh`, `clasp push`, smoke test, and a branch+PR. Each
feature lands in its own PR against main, closing a sub-task of the v4 implementation
issue. If Sonnet gets blocked, the block becomes a separate issue with `kind:bug` +
`severity:blocker` + a link to this spec.

---

**End of spec.**
