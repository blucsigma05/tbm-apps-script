# Sparkle Visual System — Asset Registry

**Owner:** Opus (spec), Code (build), Codex (audit), LT (gate)
**Priority:** P2 — quality lever for JJ, independent of Task 1
**Status:** Draft — Architecture Review
**Scope:** SparkleLearning only. Does NOT touch KidsHub JJHome (already polished).

---

## Problem

CurriculumSeed.js already provides rich per-activity fields (`image`, `word`, `plural
objects`, named `items`, `audioPrompt`/`audioCorrect`/`audioWrong`) but SparkleLearning
renders generic SVG shapes for almost everything. The loading screen promises magic;
the games deliver flat geometry. This was the April 8 audit's single biggest visual
finding: "all 18 games render bare SVG shapes."

Concretely, three bugs hide inside the current data-to-render path:

### Bug 1 — `color_sort` items are invisible

`CurriculumSeed.js:284` defines Week 3 Wednesday's color sort with semantic items:

```js
items: [
  { name: "apple",     color: "red" },
  { name: "sky",       color: "blue" },
  { name: "sun",       color: "yellow" },
  { name: "truck",     color: "red" },
  { name: "ocean",     color: "blue" },
  { name: "banana",    color: "yellow" }
]
```

`SparkleLearning.html:2453` `renderColorSort()` ignores the `name` field entirely.
It only reads `items[i].color` for matching and `renderShape(items[i].shape,
items[i].color, 56)` for display. But the items have NO `shape` field. So
`renderShape(undefined, 'red', 56)` falls through to the default circle
(`SparkleLearning.html:864`). Apple, truck, and rose all render as identical red
circles. JJ can't distinguish them. The "sort by color" game doesn't teach the
concept of a named thing because there are no named things — just disks.

### Bug 2 — `letter_intro` `image` field has zero consumers

`CurriculumSeed.js:33` attaches an `image` to every letter intro:

| Letter | image value | Intent |
|--------|-------------|--------|
| K | `"fire"` | KINDLE → flame |
| I | `"ice_cream"` | Ice cream cone |
| K | `"kite"` | Alt word for K |
| I | `"bug"` | Insect |
| N | `"boy"` | Nathan |
| D | `"dad"` | Daddy |
| L | `"boy"` | LeShawd |
| E | `"star"` | Excellent |
| J | `"girl"` | Jennifer |
| B | `"boy"` | Buggsy |

`SparkleLearning.html:1684` `renderLetterIntro()` never references
`activity.image`. Grep for `activity.image` → **0 matches in the whole file**. The
field is documentation. JJ sees the letter K, the word "KINDLE" as plain text, and
nothing that visually connects letter to concept.

### Bug 3 — `renderCountWithMe` plural-to-singular is broken

`CurriculumSeed.js:60-78` (and similar everywhere) uses plural `objects` values:
`"stars"`, `"hearts"`, `"moons"`, `"butterflies"`, `"sparkles"`.

`SparkleLearning.html:1791-1794` `renderCountWithMe()` passes `objects` as the
shape name into `renderShape()`. Inside `renderShape` (line 784), the first
transformation is:

```js
var sh = String(shape || 'circle').toLowerCase().replace(/s$/, '');
```

This trims a single trailing `s`. For plural English nouns that's:

| Input | Output | renderShape case |
|-------|--------|------------------|
| `stars` | `star` | hits `case 'star'` ✓ |
| `hearts` | `heart` | hits `case 'heart'` ✓ |
| `moons` | `moon` | hits `case 'moon'` ✓ |
| `sparkles` | `sparkle` | **no case** → default circle ✗ |
| `butterflies` | `butterflie` | **no case** → default circle ✗ |

`butterflies` → `butterflie` → default pink circle. `sparkles` → `sparkle` → there
is no `sparkle` case in `renderShape` → default pink circle. Tuesday-morning
"count the butterflies" and Friday-afternoon "count the sparkles" both display
flat pink disks. JJ counts disks.

### Root cause

SparkleLearning has no concept of an **asset** — just a flat shape library
(`renderShape`, lines 780–867) that knows 13 SVG shapes and defaults to a circle.
CurriculumSeed has no validation that its field values map to anything renderable.
The two files grew independently.

## Design: Asset Registry

A single source-of-truth catalog that maps every conceptual asset key
(`"fire"`, `"apple"`, `"butterfly"`) to a resolver with an emoji, an inline SVG
reference, or a Drive image ID. Both CurriculumSeed (at seed time) and
SparkleLearning (at render time) consult the registry.

### Schema

```js
// Each entry:
{
  id:       'apple',          // registry key (matches CurriculumSeed field values)
  type:     'emoji',          // 'emoji' | 'svg' | 'image'
  value:    '🍎',             // the emoji char, SVG shape key, or Drive file ID
  name:     'apple',          // display name (used in speak() and alt text)
  plural:   'apples',         // plural form for "count the apples" etc
  color:    'red',            // semantic color for color_sort/color_hunt resolvers
  category: 'food'            // loose grouping for LT's eyes only
}
```

Type-specific resolver rules:

- **`type: 'emoji'`** — `value` is the emoji character(s). Rendered as a
  `<span class="asset-emoji" style="font-size:120px">🍎</span>`. Pre-K design spec
  requires 80×80 minimum, so the default size is 120px for single-asset displays
  and 64px for scatter/grid displays.

- **`type: 'svg'`** — `value` is the SVG shape key, dispatched through the
  existing `renderShape(shape, color, size)` switch. This is the compat path that
  lets the registry hit any of the 13 existing SVGs by key.

- **`type: 'image'`** — `value` is a Google Drive file ID. Fetched via a new
  `getAssetImageSafe(fileId)` call that returns base64 PNG/JPEG bytes, cached in
  `CacheService` for 24h (matches the existing audio pattern in
  `getAudioBatchSafe`, Kidshub.js:2838). Phase 2 only — emoji + svg cover Phase 1.

### Where the registry lives

**Single source, server-side:** `AssetRegistry.js` (new `.gs` file, pushed via
clasp alongside the other `.js` server files). The file exports a single constant
`ASSET_REGISTRY` as a plain JS object literal (V8 runtime, modern JS OK since
this is a server file). Kidshub.js, CurriculumSeed.js, and any other `.gs`
consumer can read `ASSET_REGISTRY` directly (shared global scope — see CLAUDE.md
"All `.gs` files share one global scope").

**Client access via Safe wrapper:** `getAssetRegistrySafe()` in Code.js returns
the registry as a JSON-serialized snapshot. SparkleLearning calls it once at load
time (alongside `getTodayContentSafe`) and caches the result in a module-level
variable:

```js
// SparkleLearning.html, near the existing loadContent
var _assetRegistry = null;
function loadAssetRegistry(cb) {
  if (_assetRegistry) { cb(); return; }
  if (typeof google === 'undefined' || !google.script || !google.script.run) {
    _assetRegistry = {};
    cb();
    return;
  }
  google.script.run
    .withSuccessHandler(function(r) { _assetRegistry = r || {}; cb(); })
    .withFailureHandler(function() { _assetRegistry = {}; cb(); })
    .getAssetRegistrySafe();
}
```

Registry fetched from `CacheService` with a 12h TTL. Total payload for ~100
entries is well under 16KB — fast enough that no second-load optimization is
needed.

**Why not inline into SparkleLearning.html:** CurriculumSeed must be able to
validate against the same registry at seed time. Two sources = drift waiting to
happen. The April 8 audit's root-cause finding ("CurriculumSeed uses fields that
SparkleLearning ignores") IS the drift bug. Fixing it by adding a second copy in
HTML is the same bug with an extra file.

**Why not pure JSON file:** GAS server code cannot read a JSON file from the
deployed `.gs` surface without going through Drive or embedding it. A `.js`
constant is the shortest path.

### Field mapping from CurriculumSeed to registry resolution

This table is the complete "what CurriculumSeed provides → what SparkleLearning
should render" contract. Any field not listed here stays as-is.

| Activity type | Current field | Current render | New resolver |
|---------------|---------------|----------------|--------------|
| `letter_intro` | `image: "fire"` | ignored | Render 120px emoji/asset next to the big letter |
| `letter_intro` | `word: "KINDLE"` | shown as text card | Keep text card, add hero asset for the word via registry lookup |
| `beginning_sound` | `word: "Igloo"` | shown as text button | Keep button, add 64px asset above it |
| `count_with_me` | `objects: "butterflies"` | broken singularization → circle | Registry lookup by plural OR singular, resolve to the right SVG/emoji |
| `color_hunt` | `shapes` (random fallback) | flat colored shapes | Phase 1: keep shapes. Phase 2: pull themed items per week. |
| `color_sort` | `items: [{name, color}]` | all circles | Registry lookup on `item.name`, render resolved asset |
| `shape_match` | `target: 'circle'` | SVG shape | Stay as-is (these are literal shape-name games) |
| `quantity_match` | `numbers: [1,2,3]` | dot clusters | Stay as-is Phase 1, Phase 2 use themed items per group |
| `pattern_next` | `{shape, color}` tuples | SVG shapes | Stay as-is |

### Fallback behavior on registry miss

**Server-side (CurriculumSeed seed time):** Any content that references an
asset ID not in the registry fails validation loud. `seedWeek1Curriculum()` adds a
guard:

```js
// CurriculumSeed.js — new helper
function validateContentAgainstRegistry_(weekContent) {
  var missing = [];
  _walkActivities_(weekContent, function(act) {
    if (act.image && !ASSET_REGISTRY[act.image]) missing.push({field: 'image', value: act.image, id: act.id});
    if (act.items) {
      for (var i = 0; i < act.items.length; i++) {
        if (act.items[i].name && !ASSET_REGISTRY[act.items[i].name]) {
          missing.push({field: 'items[].name', value: act.items[i].name, id: act.id});
        }
      }
    }
    if (act.objects) {
      var obj = String(act.objects).toLowerCase();
      var singular = obj.replace(/ies$/, 'y').replace(/s$/, '');
      if (!ASSET_REGISTRY[obj] && !ASSET_REGISTRY[singular]) {
        missing.push({field: 'objects', value: act.objects, id: act.id});
      }
    }
  });
  if (missing.length > 0) {
    throw new Error('Missing assets: ' + JSON.stringify(missing));
  }
}
```

This closes Bug 1, 2, and 3 at the seed boundary — future content drift gets
caught before it ships.

**Client-side (SparkleLearning render time):** Never crash. A missing asset
degrades to the existing `renderShape` default circle with a `console.warn` for
telemetry. User-visible behavior: the slot shows SOMETHING; JJ's lesson doesn't
blank out.

```js
// SparkleLearning.html — new helper
function resolveAsset(assetId, size, fallbackColor) {
  var entry = _assetRegistry[String(assetId || '').toLowerCase()];
  if (!entry) {
    // Try plural→singular normalization
    var normalized = String(assetId || '').toLowerCase().replace(/ies$/, 'y').replace(/s$/, '');
    entry = _assetRegistry[normalized];
  }
  if (!entry) {
    if (console && console.warn) console.warn('asset miss:', assetId);
    return renderShape('circle', fallbackColor || 'pink', size || 64);
  }
  if (entry.type === 'emoji') {
    return '<span class="asset-emoji" style="font-size:' + (size || 120) + 'px;line-height:1;">' + entry.value + '</span>';
  }
  if (entry.type === 'svg') {
    return renderShape(entry.value, entry.color || fallbackColor, size || 64);
  }
  if (entry.type === 'image') {
    return '<img class="asset-img" alt="' + (entry.name || '') + '" src="" data-asset-id="' + assetId + '" style="width:' + (size || 120) + 'px;height:auto;" />';
    // Phase 2: lazy-load the real src from getAssetImageSafe cache
  }
  return renderShape('circle', fallbackColor || 'pink', size || 64);
}
```

### Workflow for LT to add new assets

1. Open `AssetRegistry.js` in VS Code.
2. Add the new entry to the `ASSET_REGISTRY` object. For 90% of cases that's one
   line: `'pineapple': { id: 'pineapple', type: 'emoji', value: '🍍', name: 'pineapple', plural: 'pineapples', color: 'yellow' }`.
3. `clasp push`.
4. Done. No sheet edit, no Drive upload, no redeploy trigger.

For SVG custom assets: paste the SVG shape key (must already exist in
`renderShape` — or extend `renderShape`'s switch in the same PR).

For image assets (Phase 2 only): upload to the `TBM_Assets` Drive folder, copy
the file ID, register as `type: 'image', value: '<drive-file-id>'`.

### Priority list for which activities gain the most

Ordered by measurable JJ impact:

1. **`color_sort`** — biggest visual win. Six identical circles → six distinct
   emoji fruits/vehicles. Directly tests the registry approach. Ships in PR 1.
2. **`letter_intro`** — adds the `image` hero per letter intro. Every week this
   runs ×15 activities for JJ. Ships in PR 1.
3. **`count_with_me`** — fixes the plural singularization bug (butterflies,
   sparkles). Ships in PR 1.
4. **`beginning_sound`** — illustrates the target word with an asset. Ships in
   PR 2 (needs an asset per word, some content re-seeding).
5. **`color_hunt`** — themed asset pools per week instead of random flat shapes.
   Ships in PR 2.
6. **`more_or_less`** / **`quantity_match`** — themed asset groups per activity.
   Ships in PR 2.

### Relationship to Task 1 — completion contract

When the registry resolves an asset, SparkleLearning records the resolved asset
ID in the per-activity entry of `activitiesJSON` (new field for the Lesson Run
data model — backward compatible, additive):

```json
{
  "idx": 0,
  "type": "color_sort",
  "activityId": "w3w4",
  "resolvedAssets": ["apple", "sky", "sun", "truck", "ocean", "banana"],
  "starsEarned": 2,
  "attempts": 1,
  "correct": true
}
```

LT's parent reporting can then say "JJ sorted 6 items correctly today: apple,
sky, sun, truck, ocean, banana" instead of "JJ completed color_sort activity 4."
This is the seed for the real parent reporting (Task 5).

### Relationship to Task 3 — vocab catalog

When vocab catalog integration lands, `getSpellingWords_(grade, week)` returns
words whose names exist in the registry. The registry is the visual anchor that
makes vocab worth bringing into SparkleLearning — without it, the word `"apple"`
is just text.

Task 3 spec should reference this registry as a dependency: vocab words that
don't have a registry entry get a tracked "missing-asset" status in the catalog
and skip visualized contexts until LT adds the asset.

## Sample code

### `AssetRegistry.js` (new file, ~120 lines)

```js
// AssetRegistry.js — v1
// Shared asset catalog for SparkleLearning, CurriculumSeed, and curriculum validators.
// V8 server-side — modern JS OK here.

var ASSET_REGISTRY = {
  // Letter intro hero images — concepts tied to letters in CurriculumSeed
  'fire':      { id: 'fire',      type: 'emoji', value: '🔥', name: 'fire',        plural: 'fires',        color: 'red',    category: 'concept' },
  'ice_cream': { id: 'ice_cream', type: 'emoji', value: '🍦', name: 'ice cream',   plural: 'ice creams',   color: 'pink',   category: 'food' },
  'kite':      { id: 'kite',      type: 'emoji', value: '🪁', name: 'kite',        plural: 'kites',        color: 'blue',   category: 'object' },
  'bug':       { id: 'bug',       type: 'emoji', value: '🐛', name: 'bug',         plural: 'bugs',         color: 'green',  category: 'animal' },
  'dad':       { id: 'dad',       type: 'emoji', value: '👨', name: 'Daddy',       plural: 'daddies',      color: 'gray',   category: 'person' },
  'boy':       { id: 'boy',       type: 'emoji', value: '👦', name: 'boy',         plural: 'boys',         color: 'gray',   category: 'person' },
  'girl':      { id: 'girl',      type: 'emoji', value: '👧', name: 'girl',        plural: 'girls',        color: 'pink',   category: 'person' },
  'star':      { id: 'star',      type: 'svg',   value: 'star',     name: 'star',  plural: 'stars',  color: 'gold',   category: 'shape' },

  // color_sort items from CurriculumSeed Week 3 + Week 4
  'apple':      { id: 'apple',      type: 'emoji', value: '🍎', name: 'apple',      plural: 'apples',      color: 'red',    category: 'food' },
  'sky':        { id: 'sky',        type: 'emoji', value: '🌤️', name: 'sky',        plural: 'skies',       color: 'blue',   category: 'nature' },
  'sun':        { id: 'sun',        type: 'svg',   value: 'sun',  name: 'sun',       plural: 'suns',        color: 'gold',   category: 'nature' },
  'banana':     { id: 'banana',     type: 'emoji', value: '🍌', name: 'banana',     plural: 'bananas',     color: 'yellow', category: 'food' },
  'truck':      { id: 'truck',      type: 'emoji', value: '🚛', name: 'truck',      plural: 'trucks',      color: 'red',    category: 'vehicle' },
  'fire truck': { id: 'fire truck', type: 'emoji', value: '🚒', name: 'fire truck', plural: 'fire trucks', color: 'red',    category: 'vehicle' },
  'ocean':      { id: 'ocean',      type: 'emoji', value: '🌊', name: 'ocean',      plural: 'oceans',      color: 'blue',   category: 'nature' },
  'leaf':       { id: 'leaf',       type: 'emoji', value: '🍃', name: 'leaf',       plural: 'leaves',      color: 'green',  category: 'nature' },
  'frog':       { id: 'frog',       type: 'emoji', value: '🐸', name: 'frog',       plural: 'frogs',       color: 'green',  category: 'animal' },

  // count_with_me plurals — fixes the broken singularization
  'butterfly':  { id: 'butterfly',  type: 'svg',   value: 'butterfly', name: 'butterfly', plural: 'butterflies', color: 'pink',   category: 'animal' },
  'sparkle':    { id: 'sparkle',    type: 'emoji', value: '✨', name: 'sparkle',    plural: 'sparkles',    color: 'gold',   category: 'effect' },
  'heart':      { id: 'heart',      type: 'svg',   value: 'heart',     name: 'heart',     plural: 'hearts',      color: 'pink',   category: 'shape' },
  'moon':       { id: 'moon',       type: 'svg',   value: 'moon',      name: 'moon',      plural: 'moons',       color: 'purple', category: 'shape' }
};

// Plural index — enables O(1) lookup by plural or singular
var ASSET_PLURAL_INDEX = (function() {
  var idx = {};
  for (var key in ASSET_REGISTRY) {
    if (!ASSET_REGISTRY.hasOwnProperty(key)) continue;
    var entry = ASSET_REGISTRY[key];
    idx[key] = entry;
    if (entry.plural) idx[entry.plural.toLowerCase()] = entry;
    if (entry.name) idx[entry.name.toLowerCase()] = entry;
  }
  return idx;
})();

function getAssetRegistry_() {
  return ASSET_REGISTRY;
}

function getAssetRegistryVersion() { return 1; }
```

### Safe wrapper in Code.js

```js
// Code.js — add to serveData whitelist near line 407
'getAssetRegistrySafe': getAssetRegistrySafe,

// Add function alongside the other Safe wrappers
function getAssetRegistrySafe() {
  return withMonitor_('getAssetRegistrySafe', function() {
    var cached = CacheService.getScriptCache().get('asset_registry_v1');
    if (cached) return JSON.parse(cached);
    var reg = getAssetRegistry_();
    try { CacheService.getScriptCache().put('asset_registry_v1', JSON.stringify(reg), 43200); } catch(e) {}
    return JSON.parse(JSON.stringify(reg));
  });
}
```

## Trade-offs considered

### Alternative 1 — Pure emoji, drop the SVG library

Replace all `renderShape()` calls with emoji. Star → ⭐, heart → ❤️, moon → 🌙, etc.

**Rejected because:**
- Emoji rendering on Samsung S10 FE varies by system font. `renderShape` SVGs
  look identical across devices. LT has spent weeks tuning the JJHome visuals;
  ripping the SVG library out would also rip out the visual consistency those
  screens depend on.
- Shape-name games (`shape_match` with target `circle`/`square`/`triangle`) need
  actual geometry — the whole point is that a circle is a circle. Emoji shapes
  don't work for this activity type.
- The SVG library is small (~13 shapes) and works; the registry adds on top of
  it rather than replacing it.

### Alternative 2 — Drive image URLs for everything

Instead of emoji + SVG, point the registry at Drive file IDs and fetch PNG/JPEG
bytes via `DriveApp`.

**Rejected for Phase 1 because:**
- Network latency per image is real. JJ's 10-minute session has 10+ activities,
  each rendering 1–6 assets. Emoji cost 0 network calls; inlined SVG cost 0
  network calls; Drive images cost ~150ms each on a warm cache, more on a cold
  cache.
- Image management becomes LT's problem — upload, rename, permissions, 404
  debugging. Emoji is zero-maintenance.
- The Fire Stick tablets have limited CDN caching headroom and unreliable memory
  eviction. Hundreds of Drive image fetches per day stress this.

**Kept as Phase 2:** for specific high-impact cases (mascots, custom
illustrations, photographs of family members) where emoji doesn't cut it. The
`type: 'image'` registry field and the `getAssetImageSafe` wrapper are
scaffolded so Phase 2 can drop in without a rewrite.

### Alternative 3 — Inline the registry in SparkleLearning.html only

Put `ASSET_REGISTRY` as a `var` at the top of SparkleLearning.html alongside
`COLOR_MAP`. No server round trip.

**Rejected because:**
- CurriculumSeed.js must validate against the same registry at seed time. A
  client-only registry means the server blindly seeds content referencing
  assets the client might not know about — which is the exact bug this spec is
  solving. Two sources of truth = drift.
- Adding an HTML→.gs reverse-lookup mechanism is harder than adding a .gs→HTML
  forward fetch (which is the existing `google.script.run` pattern, already wired).
- Cost of one extra Safe wrapper call at load time: ~80ms first load, 0 after
  cache. Acceptable.

## Rollout plan

### PR 1 — Registry + color_sort + letter_intro + count_with_me fix

Lands:
- `AssetRegistry.js` (new file, ~50 entries)
- `Code.js`: `getAssetRegistrySafe()` + whitelist
- `CurriculumSeed.js`: `validateContentAgainstRegistry_()` called from `seedWeek1Curriculum()` and `seedAllCurriculum_()`
- `SparkleLearning.html`:
  - `_assetRegistry` state + `loadAssetRegistry(cb)` at load time
  - `resolveAsset(assetId, size, fallbackColor)` helper
  - `renderLetterIntro()` — render `activity.image` above the letter card
  - `renderColorSort()` — replace `renderShape(items[i].shape, items[i].color, 56)` with `resolveAsset(items[i].name, 56, items[i].color)`
  - `renderCountWithMe()` — pass `objects` through `resolveAsset()` instead of `renderShape()`
- `Tbmsmoketest.js`: add `getAssetRegistrySafe` to wiring check list
- `audit-source.sh`: grep for `activity.image` in SparkleLearning.html → should
  now have >0 matches (regression guard)

### PR 2 — beginning_sound, color_hunt, more_or_less, quantity_match

Expands:
- `beginning_sound` adds a hero asset for the target word
- `color_hunt` uses themed asset pools (fruits this week, vehicles next week)
- `more_or_less` and `quantity_match` use themed groups
- Additional registry entries for Weeks 5–8 content (covers the full
  `CurriculumSeed.js` library)

### PR 3 — Phase 2: image type scaffolding

Adds:
- `getAssetImageSafe(fileId)` with `CacheService` + 24h TTL
- Client-side lazy-load pattern for `type: 'image'` entries
- Upload process doc for LT in `ops/` directory
- Phase 2 is not a feature release on its own — it unlocks future custom
  illustrations without a rewrite.

## Verification plan (Gate 4 manifest)

```
grep -n "ASSET_REGISTRY" AssetRegistry.js         → expected: 1+ definitions
grep -n "getAssetRegistrySafe" Code.js            → expected: whitelist + function
grep -n "getAssetRegistrySafe" SparkleLearning.html → expected: loadAssetRegistry call
grep -n "resolveAsset" SparkleLearning.html       → expected: helper + ≥3 call sites
grep -n "activity.image" SparkleLearning.html     → expected: >0 matches (regression bar)
grep -n "validateContentAgainstRegistry_" CurriculumSeed.js → expected: helper + calls
grep -n "items\[i\].name" SparkleLearning.html    → expected: reference in renderColorSort
grep -n "ASSET_PLURAL_INDEX" AssetRegistry.js     → expected: index definition
```

## Gate 5 feature verification checklist

| # | Check | Pass condition |
|---|-------|----------------|
| 1 | Registry loads on SparkleLearning load | `_assetRegistry` is non-null after `loadAssetRegistry` callback |
| 2 | color_sort shows distinct items | Week 3 Wednesday color_sort renders 6 distinct emoji (apple, sky, sun, truck, ocean, banana), not 6 circles |
| 3 | letter_intro shows image hero | Week 1 Monday "K is for KINDLE" renders 🔥 alongside the letter card |
| 4 | count_with_me butterflies | Week 1 Tuesday Round 4 "count butterflies" renders the butterfly SVG, not pink circles |
| 5 | count_with_me sparkles | Week 1 Tuesday Round 5 "count sparkles" renders ✨ emoji, not pink circles |
| 6 | Registry miss degrades gracefully | Manually inject an unknown asset ID → console.warn + default circle (no crash) |
| 7 | Plural→singular normalization | `resolveAsset('butterflies')` returns same as `resolveAsset('butterfly')` |
| 8 | CurriculumSeed validator catches bad content | Seed a test week with `image: 'nonexistent'` → throws with actionable message |
| 9 | ES5 compliance preserved | No banned patterns in SparkleLearning.html after integration |
| 10 | Cache hit on second load | Second call to `getAssetRegistrySafe` returns from `CacheService`, not recompute |
| 11 | Registry payload under 16KB | `JSON.stringify(ASSET_REGISTRY).length < 16384` |
| 12 | `activitiesJSON` writes resolved IDs | Lesson Run blob records resolved asset IDs per activity (Task 1 integration) |

## Open questions for LT review

1. **Scope of Phase 1 asset coverage.** The registry needs ~50 entries to cover
   Weeks 1–4 of `CurriculumSeed.js`. Should PR 1 ship all 50 or start with the 15
   assets needed for the specific activities listed in the priority list and
   backfill as content expands?

2. **`type: 'image'` timeline.** Phase 2 scaffolds it but we don't build any
   image assets. Is there demand for custom illustrations (e.g., a drawing of
   Daddy for the letter D intro) or is emoji sufficient? If the former, Phase 2
   also needs an asset authoring doc.

3. **Sparkle kingdom mascot parity.** JJHome.html has a polished mascot with CSS
   animations (`#sparkle-bg img` referenced at SparkleLearning.html:2178). Should
   the registry carry the mascot ID so lesson activities can use the same art, or
   keep it as a JJHome-only element?

4. **CurriculumSeed refactor scope.** The validator flags missing assets, but it
   runs on new seeds only. Should PR 1 also audit the existing `JJ_WEEK_1..4`
   constants and fix any missing asset references inline?

5. **Audio integration.** Registry entries carry `name` — should they also carry
   an `audioClipId` for the pre-recorded ElevenLabs file? E.g., "apple" → play
   `jj_word_apple.mp3` when JJ taps it. This is a nice-to-have that could live
   alongside the asset registry cleanly.

6. **color_hunt refactor.** Today the fallback generates random `{shape, color}`
   pairs. With the registry we could generate themed pools ("find 3 red fruits")
   which is more engaging than "find 3 red shapes." Worth doing in PR 2 or
   defer?

---

**Definition of done for implementation (future session):**

- All 12 Gate 5 items green
- `activity.image` > 0 matches in SparkleLearning.html (current: 0 matches)
- `renderColorSort` reads `items[i].name`, not just `items[i].color`
- Manual QA: JJ walks through Week 1 Monday, Tuesday, and Week 3 Wednesday
  lessons on the S10 FE. Every asset renders as something distinct. No default
  circles except for intentional `shape_match` activities.
- Pre-K game design spec compliance: touch targets remain 80×80 minimum, contrast
  remains 7:1 or better on all resolved assets
