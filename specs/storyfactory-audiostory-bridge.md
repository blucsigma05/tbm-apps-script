# StoryFactory → SparkleLearning `audio_story` Bridge

**Owner:** Opus (spec), Sonnet (build), Codex (audit), LT (gate)
**Priority:** P1 — JJ's Week 2 Thursday (2026-04-16) is the next day an `audio_story` activity appears in the live curriculum and it currently renders a hardcoded bunny fallback.
**Status:** Draft — Architecture Review
**Scope:** JJ SparkleLearning `audio_story` activity type only. StoryReader.html (bedtime scene stories) is untouched. Buggsy has no `audio_story` entries (verified) so this spec does not affect him.
**Risk:** Low — additive. New module, new Safe wrapper, one-line mutation inside an existing Safe wrapper, zero breaking changes to `renderAudioStory`.

---

## ES5 reminder — SparkleLearning.html is a Fully Kiosk / Fire TV WebView surface

Any client-side code Sonnet writes into `SparkleLearning.html` MUST be ES5 only.
The server-side `.js` modules (`ActivityStoryPacks.js`, `Kidshub.js`, `Code.js`) run on
V8 and CAN use modern JS, but this spec does not introduce any modern JS patterns —
the whole file is ES5-clean for symmetry with the rest of the codebase.

Banned in `.html` (enforced by `audit-source.sh`):

- `let` / `const` → use `var`
- Arrow functions `=>` → use `function(){}`
- Template literals `` `${}` `` → use string concatenation
- `async` / `await` → use callbacks or `.then()`
- Nullish coalescing `??` → use `||` or ternary
- Optional chaining `?.` → explicit null checks
- `.includes()` → `indexOf() !== -1`
- `.find()` → `for` loop
- Destructuring `var {a, b} = obj` → `var a = obj.a`
- Spread `...arr` → `Array.prototype.slice.call()`
- `URLSearchParams`, `Object.entries()`, `Object.values()`
- `for...of` loops
- `backdrop-filter` CSS

**Allowed ES5.1 methods** (all green in target WebViews): `Object.keys()`, `Array.isArray()`,
`JSON.parse`, `JSON.stringify`, `String.prototype.indexOf/trim`, `Array.prototype.forEach/map/filter`.

---

## Problem

`SparkleLearning.html`'s `renderAudioStory()` (verified at **line 2473**, prompt was correct) reads
four fields off the activity payload — `story`, `question`, `answer`, `options` — and
falls back to a hardcoded "bunny in the garden" placeholder when any field is missing.

**Verified by `grep` at the source:**

```
$ grep -n "renderAudioStory\|audio_story\|story_listen" SparkleLearning.html
598:  'letter_trace', 'number_trace', 'audio_story', 'story_listen', 'color_sort',
1666:    case 'audio_story':
1667:    case 'story_listen':       renderAudioStory(activity); break;
2473:function renderAudioStory(activity) {
```

The function body (lines 2473-2505 of the live file):

```js
function renderAudioStory(activity) {
  var mc = getMainContent();
  var story = activity.story || 'Once upon a time, a little bunny hopped through the garden.';
  var question = activity.question || 'What animal was in the story?';
  var answer = activity.answer || 'Bunny';
  var options = activity.options || ['Bunny', 'Cat', 'Dog'];
  // ... speak(story), reveal question, speak(question), speak(options) ...
}
```

**The curriculum already wires `audio_story` activities with story IDs but no story
content.** Verified entries in `CurriculumSeed.js`:

| Line | Week | Day | Activity id | storyId |
|------|------|-----|-------------|---------|
| 222 | JJ Week 2 | Thursday | `w2th5` | `jj-kitchen` |
| 297 | JJ Week 3 | Thursday | `w3th5` | `jj-buggsy-treasure` |
| 373 | JJ Week 4 | Thursday | `w4th5` | `jj-buggsy-rainy` |

Every one of these has `type: "audio_story"`, `audioPrompt`, `audioCorrect`, and `storyId`,
but NONE has `story`, `question`, `answer`, or `options`. So every time JJ hits an
`audio_story` in the live curriculum, the renderer falls back to the bunny placeholder.

**`StoryFactory.js` is the official story pipeline** but it is hooked up to a
different surface. Verified:

```
$ grep -n "STORY_INDEX\|getStoryForReader\|loadStoryToProps" StoryFactory.js
1508:      // passes keys that STORY_INDEX and getStoryForReader() accept
1556:var STORY_INDEX = {
1571:function getStoryForReader(storyKey) {
1602:function loadStoryToProps(storyKey, jsonString) {
```

`STORY_INDEX` at line **1556** contains **exactly one entry**:

```js
var STORY_INDEX = {
  'week1-jj-garden-mystery': {
    title: "JJ and GranniePoo's Garden Mystery",
    character: 'JJ',
    type: 'vocabulary_bedtime',
    week: 1,
    propertyKey: 'STORY_week1_jj_garden_mystery'
  }
};
```

Prompt line numbers confirmed (1556, 1571, 1602). **Divergence from the prompt's
narrative**: the one existing JJ story is NOT referenced by any `audio_story` activity
in `CurriculumSeed.js` — the storyIds used in the seed (`jj-kitchen`, `jj-buggsy-treasure`,
`jj-buggsy-rainy`) do not match the STORY_INDEX key (`week1-jj-garden-mystery`).
`week1-jj-garden-mystery` is a `vocabulary_bedtime` story consumed by `StoryReader.html`
at the `/story` route, not by SparkleLearning.

**Week 1 has NO `audio_story` activity.** Confirmed — a grep for `audio_story` in
`CurriculumSeed.js` returns exactly three matches (lines 222, 297, 373), all in
`JJ_WEEK_2/3/4`. Week 1 Thursday has 15 letter-sound activities (the 10-activity cap at
`SparkleLearning.html:1573` slices to first 10, dropping 5 — adding a 16th audio_story
would be invisible unless we displace a letter-sound drill). **This spec does not add
a Week 1 `audio_story`**; see Decision 4 below.

**Buggsy has NO `audio_story` activity.** Confirmed by grep — all three CurriculumSeed
matches live inside `JJ_WEEK_*` blocks (lines 165-403); `BUGGSY_WEEK_*` starts at line 404
and has zero `audio_story` entries. The apparent "Buggsy" in the story titles
("JJ and Buggsy's Treasure Hunt") refers to Buggsy as a character IN JJ's story, not to
the Buggsy curriculum owner.

**Net:** JJ's weekly curriculum promises audio stories three times this month. The
renderer is ready. The bridge between the curriculum's `storyId` and the renderer's
expected fields is the missing piece — and this spec defines it.

## Chosen architecture

### Decision 1 — Content authoring: pre-authored JSON vs on-the-fly Gemini

**Chosen: pre-authored JSON story packs.**

The three stories are 3-5 sentences each, age-4 reading level, totally deterministic by
design. Running Gemini at lesson time to generate a paragraph JJ will hear adds 2-5s of
latency on a Fire Kids tablet with flaky WiFi, burns inference budget every time a
4-year-old taps Play Again, risks generating off-rail content without LT pre-review, and
makes ElevenLabs audio pre-caching impossible (each regeneration invalidates the clip).
Pre-authored content is reviewable before deploy, cacheable at load time, works fully
offline after the first `getTodayContentSafe` response, and does not depend on a network
round-trip during rendering. StoryFactory's live Gemini pipeline stays exactly as it is —
it produces bedtime `vocabulary_bedtime` stories for StoryReader, which are a different
shape at a different route.

### Decision 2 — Where story content lives

**Chosen: new server-side module `ActivityStoryPacks.js` with `ACTIVITY_STORY_PACKS` constant.**

Three modules could own this content. Each was considered:

- **CurriculumSeed.js inline** — bloats the existing `audio_story` activity lines from
  ~150 characters to ~500+. Drags pedagogical curriculum data and story prose into the
  same file. Makes curriculum diffs noisy when story text changes.
- **StoryFactory.js `STORY_INDEX`** — wrong shape. `STORY_INDEX` entries point to full
  `{scenes: [{text, image}], vocabulary_words}` stories stored in `ScriptProperties`
  (`'STORY_week1_jj_garden_mystery'`, 8KB per-key limit enforced at `StoryFactory.js:1615`),
  consumed by StoryReader at `/story`. Audio-story packs are a compact
  `{story, question, answer, options}` shape targeted at a different renderer. Mixing
  them semantically collides two unrelated data models in one index.
- **New `ActivityStoryPacks.js` module** — one file, one responsibility, one exported
  constant. Reviewable in one PR. Testable in isolation. Can migrate to a Drive-loaded
  variant or ScriptProperties storage later without touching curriculum or StoryFactory.

The new module is the cleanest boundary.

### Decision 3 — Delivery path: client fetches or server injects

**Chosen: server-side injection inside `getTodayContentSafe`.**

`SparkleLearning.html` calls `getTodayContentSafe('jj')` exactly once at load time
(verified at line **1585**) and the response fills `todayContent.activities`. Adding a
new client-side fetch from inside `renderAudioStory` (line 2473) would require a loading
state (JJ would see a blank panel while the story loads), an ES5-safe async pattern the
existing `renderActivity` dispatcher doesn't have, and a second network round-trip during
the critical "attention window" of a pre-K lesson.

Instead, the `Kidshub.js` `getTodayContent_()` function (which `getTodayContentSafe` wraps)
is extended to post-process the activities array: any activity with `type === 'audio_story'`
and a `storyId` that maps to an entry in `ACTIVITY_STORY_PACKS` gets its `story`,
`question`, `answer`, and `options` fields populated from the pack BEFORE the response
is returned to the client. Activities with an unknown `storyId` pass through unchanged
(and fall back to the hardcoded bunny placeholder — no regression, same behavior as today).

`renderAudioStory` stays functionally identical. No new code path, no new loading state,
no extra round-trip. The contract with the client is: if the server knows the story,
the activity arrives fully populated; if not, the client's existing fallback handles it.

### Decision 4 — Week 1 `audio_story`: add or skip

**Chosen: skip. Do not add a Week 1 `audio_story` activity. Ship three story packs
(weeks 2/3/4) matching the existing CurriculumSeed entries.**

Week 1 Thursday has 15 letter-sound activities. The 10-activity cap at
`SparkleLearning.html:1573` (`todayContent.activities.slice(0, 10)`) means activities
11-15 are dropped every session — so appending a 16th `audio_story` would never reach
JJ. To include one, we'd have to displace one of the first 10 Week 1 letter-sound
activities, which would lower letter-sound practice density in the foundational K/I
introduction week. The cost of losing K/I repetitions in Week 1 outweighs the benefit
of an earlier first exposure to `audio_story`; Week 2 Thursday (2026-04-16, four
school days after Week 1 Friday) is a natural first exposure. Flagged for LT in the
Open Questions section in case a different calculus is preferred.

## Story content (all three packs, full JSON)

Each pack is a self-contained object with the exact four fields `renderAudioStory` reads,
plus a `title` field for LT's reference (not consumed by the renderer). Age 4 reading
level: sentences max 13 words, mostly 1-2 syllable, simple declarative structure,
curriculum-themed vocabulary subtly embedded so the story reinforces that week's
letter/number/color/shape focus.

### Pack: `jj-kitchen` (Week 2 Thursday)

**Curriculum alignment:** JJ Week 2 focus — letters **N** and **D** (review K/I),
numbers up to **4**, color **blue**, shapes square/triangle. The story uses **Daddy**
(letter D), **three** scoops (number), **blue spoon** (color), and keeps sentences
simple.

```js
'jj-kitchen': {
  title: "JJ's Kitchen",
  story: "JJ walks into the kitchen for a snack. Daddy asks if she wants ice cream. JJ smiles and nods and holds up three fingers. Daddy scoops one, two, three big scoops into her bowl. JJ takes a big blue spoon and says thank you, Daddy!",
  question: "How many scoops of ice cream did Daddy give JJ?",
  answer: "Three",
  options: ["Three", "One", "Five"]
}
```

### Pack: `jj-buggsy-treasure` (Week 3 Thursday)

**Curriculum alignment:** JJ Week 3 focus — letters **L** and **E** (completes KINDLE),
numbers up to **5**, color **yellow**, shapes **rectangle** and **star**. The story
uses **five** treasures (number), **yellow** arrows (color), **stars** (shape),
**rectangle rock** (shape). Buggsy appears as a character (thematic continuity with
curriculum Week 4 letter B).

```js
'jj-buggsy-treasure': {
  title: "JJ and Buggsy's Treasure Hunt",
  story: "JJ and Buggsy find a map in the yard. The map shows a treasure hunt! They follow the yellow arrows and look for stars. Under the rectangle rock they find one, two, three, four, five shiny treasures. Buggsy gives JJ a big hug!",
  question: "How many treasures did JJ and Buggsy find?",
  answer: "Five",
  options: ["Five", "Two", "Three"]
}
```

### Pack: `jj-buggsy-rainy` (Week 4 Thursday)

**Curriculum alignment:** JJ Week 4 focus — letters **J** and **B**, numbers up to 5,
color **green**, shapes **heart** and **diamond**. The story uses **Buggsy** (letter B),
**JJ** (letter J), **green** blanket (color), **heart** pillows (shape). Narratively
celebrates JJ finishing one month of letters.

```js
'jj-buggsy-rainy': {
  title: "JJ and Buggsy's Rainy Day",
  story: "It is raining and JJ and Buggsy can not go outside. Buggsy has a big idea to build a blanket fort. They pick a green blanket and drape it over two chairs. JJ puts heart pillows inside and Buggsy brings snacks. The green fort is the best rainy day ever!",
  question: "What color was JJ and Buggsy's blanket fort?",
  answer: "Green",
  options: ["Green", "Red", "Blue"]
}
```

**Word counts / sentence counts per pack:**

| Pack | Sentences | Total words | Max words/sentence | Notes |
|------|-----------|-------------|---------------------|-------|
| `jj-kitchen` | 5 | 49 | 11 | D, blue, three |
| `jj-buggsy-treasure` | 5 | 43 | 13 | yellow, star, rectangle, five |
| `jj-buggsy-rainy` | 5 | 53 | 12 | B, J, green, heart |

Each pack's question is the **exact** question the existing `audioCorrect` field already
hints at in `CurriculumSeed.js`:

- `w2th5.audioCorrect`: "Great listening! How many scoops did JJ get? Three!" → question "How many scoops of ice cream did Daddy give JJ?", answer "Three"
- `w3th5.audioCorrect`: "Great listening! They found 5 treasures!" → question "How many treasures did JJ and Buggsy find?", answer "Five"
- `w4th5.audioCorrect`: "Great listening! What color was the blanket fort? Green!" → question "What color was JJ and Buggsy's blanket fort?", answer "Green"

## File change list

Every file Sonnet touches, with exact edits. No vague "update X to support Y" bullets.

### NEW file: `ActivityStoryPacks.js` (root of repo)

```js
// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// ActivityStoryPacks.gs v1 — Pre-authored story packs for SparkleLearning audio_story
// WRITES TO: (none — read-only module)
// READS FROM: (none — static constant)
// ════════════════════════════════════════════════════════════════════
// PURPOSE: Supply the story/question/answer/options fields for JJ's
//   curriculum audio_story activities. Consumed by Kidshub.js
//   getTodayContent_() which mutates matching activities in place before
//   returning to SparkleLearning.html.
//
// CONSUMER: SparkleLearning.html renderAudioStory() (line 2473)
// DATA FLOW: CurriculumSeed storyId → ACTIVITY_STORY_PACKS[storyId] →
//   activity.{story, question, answer, options} → renderAudioStory
//
// NOT TO BE CONFUSED WITH: StoryFactory.js STORY_INDEX which owns
//   full-scene vocabulary_bedtime stories served by StoryReader.html.
//   Audio-story packs are a different shape for a different renderer.
// ════════════════════════════════════════════════════════════════════

function getActivityStoryPacksVersion() { return 1; }

var ACTIVITY_STORY_PACKS = {
  'jj-kitchen': {
    title: "JJ's Kitchen",
    story: "JJ walks into the kitchen for a snack. Daddy asks if she wants ice cream. JJ smiles and nods and holds up three fingers. Daddy scoops one, two, three big scoops into her bowl. JJ takes a big blue spoon and says thank you, Daddy!",
    question: "How many scoops of ice cream did Daddy give JJ?",
    answer: "Three",
    options: ["Three", "One", "Five"]
  },
  'jj-buggsy-treasure': {
    title: "JJ and Buggsy's Treasure Hunt",
    story: "JJ and Buggsy find a map in the yard. The map shows a treasure hunt! They follow the yellow arrows and look for stars. Under the rectangle rock they find one, two, three, four, five shiny treasures. Buggsy gives JJ a big hug!",
    question: "How many treasures did JJ and Buggsy find?",
    answer: "Five",
    options: ["Five", "Two", "Three"]
  },
  'jj-buggsy-rainy': {
    title: "JJ and Buggsy's Rainy Day",
    story: "It is raining and JJ and Buggsy can not go outside. Buggsy has a big idea to build a blanket fort. They pick a green blanket and drape it over two chairs. JJ puts heart pillows inside and Buggsy brings snacks. The green fort is the best rainy day ever!",
    question: "What color was JJ and Buggsy's blanket fort?",
    answer: "Green",
    options: ["Green", "Red", "Blue"]
  }
};

/**
 * Look up an activity story pack by storyId.
 * Returns the pack object (title + story + question + answer + options)
 * or null if the storyId is unknown.
 */
function getActivityStoryPack_(storyId) {
  if (!storyId || typeof storyId !== 'string') return null;
  var pack = ACTIVITY_STORY_PACKS[storyId];
  if (!pack) return null;
  // Return a shallow copy so callers can't mutate the master constant.
  return {
    title: pack.title,
    story: pack.story,
    question: pack.question,
    answer: pack.answer,
    options: pack.options.slice()
  };
}

/**
 * Safe wrapper — returns a JSON-round-tripped copy.
 * Whitelisted in Code.js serveData API_WHITELIST. Registered in
 * Tbmsmoketest.js CANONICAL_SAFE_FUNCTIONS. Callable from HTML via
 * google.script.run but the typical consumer is server-side
 * getTodayContent_() which calls the underscore variant directly.
 *
 * Returns:
 *   { ok: true,  pack: {title, story, question, answer, options} } — on hit
 *   { ok: false, error: 'unknown_story_id', storyId: '...' }       — on miss
 */
function getActivityStoryPackSafe(storyId) {
  return withMonitor_('getActivityStoryPackSafe', function() {
    var pack = getActivityStoryPack_(storyId);
    if (!pack) {
      return { ok: false, error: 'unknown_story_id', storyId: storyId || null };
    }
    return JSON.parse(JSON.stringify({ ok: true, pack: pack }));
  });
}

// END OF FILE — ActivityStoryPacks.gs v1
```

**Why Safe wrapper even though the server consumer is internal:** `audit-source.sh`'s
wiring check (`CANONICAL_SAFE_FUNCTIONS`) enforces Safe-wrapped external access for any
function touched by HTML. Even though the typical consumer is `getTodayContent_` server-side,
exposing `getActivityStoryPackSafe` as a whitelisted API gives QA/smoke a direct
runtime-verifiable ping (`?action=api&fn=getActivityStoryPackSafe&args=["jj-kitchen"]`)
without going through the full curriculum fetch. This is also the function the Gate 5
checklist below pings to prove the module loaded.

### MODIFIED file: `Kidshub.js` — extend `getTodayContent_()` to inject story packs

**Location:** inside the existing `getTodayContent_` function (find via `grep -n "function getTodayContent_" Kidshub.js`).

**Change:** after the activity list is loaded from the curriculum sheet/fallback and
just before the function returns, add a post-processing loop that mutates any
`audio_story` activity in `dayContent` whose `storyId` maps to an `ACTIVITY_STORY_PACKS`
entry.

**The exact code to add** (place immediately before the `return { content: dayContent, ... }`
line at the end of the `try` block — operate on the `dayContent` local variable, which is
the object that holds the `.activities` array):

```js
// v{NEW}: Inject ActivityStoryPacks content into audio_story activities.
// CurriculumSeed ships audio_story entries with storyId only — the story
// text, question, answer, and options live in ActivityStoryPacks.js so
// SparkleLearning's renderAudioStory (line 2473) can read them off the
// activity object without a second round-trip. See
// specs/storyfactory-audiostory-bridge.md.
if (dayContent && dayContent.activities && dayContent.activities.length) {
  for (var i = 0; i < dayContent.activities.length; i++) {
    var act = dayContent.activities[i];
    if (act && act.type === 'audio_story' && act.storyId) {
      // Reference ACTIVITY_STORY_PACKS via the getter to avoid a load-order
      // dependency on file parse order in GAS.
      var pack = (typeof getActivityStoryPack_ === 'function')
        ? getActivityStoryPack_(act.storyId)
        : null;
      if (pack) {
        act.story = pack.story;
        act.question = pack.question;
        act.answer = pack.answer;
        act.options = pack.options;
        // Preserve existing audioPrompt / audioCorrect / title from the
        // curriculum — do not overwrite.
      }
      // Unknown storyId → leave activity unchanged; renderAudioStory falls
      // back to the hardcoded bunny placeholder (same as today).
    }
  }
}
```

**Why mutate in place vs rebuild the array:** the activity object already has
curriculum-authored `audioPrompt`, `audioCorrect`, `title`, `stars`, and `id` fields
that MUST survive the injection. A rebuild would require copying them all. In-place
assignment of the four new fields preserves everything else exactly.

**Why the `typeof === 'function'` guard:** GAS parses files alphabetically. `ActivityStoryPacks.js`
sorts before `Kidshub.js` so the function should be defined at call time, but the guard
makes the call resilient to future filename changes and gives a graceful degradation path
(pack missing → activity falls through to bunny) instead of a hard reference error.

**Version bump:** `Kidshub.js` version getter gets bumped. Find the current version via
`grep -n "function getKidsHubVersion" Kidshub.js`. Bump all three locations (header,
getter, EOF comment) by +1. The version bump is required because `getTodayContent_`
now mutates its return value shape in a way the release notes need to capture.

**Function signature change (required for Gate 5 determinism):** The current signature
is `getTodayContent_(child)`. Extend it to accept an optional second parameter:

```js
function getTodayContent_(child, _testDateOverride) {
```

Inside the function body, replace:

```js
var today = new Date();
today.setHours(0, 0, 0, 0);
```

with:

```js
var today = _testDateOverride ? new Date(_testDateOverride) : new Date();
today.setHours(0, 0, 0, 0);
```

This is a **test-only back door.** Production callers (`getTodayContentSafe`) always
omit the second argument and get live-date behavior unchanged. Gate 5 items 9–11 pass
a specific ISO date string so the function deterministically returns the correct week's
content regardless of when the QA run occurs. Do NOT expose `_testDateOverride` through
any Safe wrapper or API route — it is internal to `.gs` test harness calls only.

### MODIFIED file: `Code.js` — whitelist the new Safe wrapper

**Location:** the `API_WHITELIST` object inside `serveData` (lines 379-432; verified by
read). Add a single entry:

```js
'getActivityStoryPackSafe': getActivityStoryPackSafe,
```

Insertion point: alphabetically near `getStoryForReaderSafe` (currently line 415) or
grouped with the other story-related entries near `listStoredStoriesSafe` (line 402).
Either location is fine — the whitelist is a flat object and the audit does not enforce
ordering.

**Version bump:** `Code.js` line 12 getter (currently `return 74`), line 3 header
(`Code.gs v74`), line 1987 EOF comment (`// END OF FILE — Code.gs v74`). Bump all three
by +1.

### MODIFIED file: `Tbmsmoketest.js` — add Safe wrapper to wiring check

**Location:** the `CANONICAL_SAFE_FUNCTIONS` array starting at line 42 (verified by
read). Add `'getActivityStoryPackSafe'` to the list — any free slot is fine. Suggested
insertion near the existing story-family entries (`listStoredStoriesSafe`,
`getStoredStorySafe` at line 55):

```js
'listStoredStoriesSafe', 'getStoredStorySafe', 'getActivityStoryPackSafe',
```

**Version bump:** `Tbmsmoketest.js` line 40 getter (currently `return 6`), the header
comment at line 2 (`tbmSmokeTest.gs v6`), and the EOF comment (`// END OF FILE — tbmSmokeTest.gs v6`).
Bump all three by +1.

### NOT MODIFIED (read for reference, no changes)

- **`SparkleLearning.html`** — `renderAudioStory` (line 2473) already reads
  `activity.story`, `activity.question`, `activity.answer`, `activity.options`. No
  client-side change needed. Version NOT bumped.
- **`CurriculumSeed.js`** — the three existing `audio_story` entries (lines 222, 297,
  373) already carry the storyIds the bridge matches against. No seed change needed.
  Version NOT bumped.
- **`StoryFactory.js`** — `STORY_INDEX` and `getStoryForReader*` are untouched. They
  continue to serve the bedtime `/story` route. Version NOT bumped.

## Server function signatures

Full signatures for every function added or touched in this spec.

```js
// ActivityStoryPacks.js — NEW MODULE

/** @return {number} Version integer. */
function getActivityStoryPacksVersion() { /* returns 1 */ }

/**
 * Internal lookup — returns a shallow copy or null.
 * @param {string} storyId e.g. 'jj-kitchen'
 * @return {{title:string, story:string, question:string, answer:string, options:string[]}|null}
 */
function getActivityStoryPack_(storyId) { /* ... */ }

/**
 * Safe wrapper. Whitelisted in Code.js serveData. Registered in Tbmsmoketest.js
 * CANONICAL_SAFE_FUNCTIONS. Wrapped in withMonitor_ for error logging.
 *
 * @param {string} storyId
 * @return {{ok:true, pack:{title,story,question,answer,options}}|
 *          {ok:false, error:'unknown_story_id', storyId:string|null}}
 */
function getActivityStoryPackSafe(storyId) { /* ... */ }
```

**Error shape rationale:** the `{ok:false, error, storyId}` shape matches the existing
`logError_` convention and makes failures observable in ErrorLog without throwing. The
server never throws for an unknown storyId — it just returns `ok:false` and the client
falls through to the hardcoded bunny placeholder. Unknown storyIds do NOT count as
"errors"; they're a valid shape for activities not yet bridged.

**Safe wrapper pattern** (matches `StoryFactory.js:1728` `getStoryForReaderSafe`):

```js
function getActivityStoryPackSafe(storyId) {
  return withMonitor_('getActivityStoryPackSafe', function() {
    var pack = getActivityStoryPack_(storyId);
    if (!pack) {
      return { ok: false, error: 'unknown_story_id', storyId: storyId || null };
    }
    return JSON.parse(JSON.stringify({ ok: true, pack: pack }));
  });
}
```

The `JSON.parse(JSON.stringify(...))` round-trip strips any non-JSON-safe references
(matching the existing `getStoryForReaderSafe` pattern) and guarantees the client
receives a plain object tree.

## Version bumps

**MANDATORY 3-location rule per CLAUDE.md** for every modified `.js` file. All three
must match. `audit-source.sh` version consistency check enforces this.

| File | Action | Header line | Getter function | EOF comment | Notes |
|------|--------|-------------|------------------|-------------|-------|
| `ActivityStoryPacks.js` | NEW | `ActivityStoryPacks.gs v1` (line 3) | `function getActivityStoryPacksVersion() { return 1; }` | `// END OF FILE — ActivityStoryPacks.gs v1` | N/A — brand new, starts at v1. See file template above. |
| `Kidshub.js` | BUMP +1 | bump `KidsHub.gs v{N}` → `v{N+1}` | `function getKidsHubVersion() { return {N+1}; }` | bump EOF comment to `v{N+1}` | Look up current N with `grep -n "function getKidsHubVersion" Kidshub.js`. Sonnet must read the actual file — do NOT assume N. |
| `Code.js` | BUMP 74 → 75 | line 3: `Code.gs v74` → `v75` | line 12: `return 74;` → `return 75;` | line 1987: `// END OF FILE — Code.gs v74` → `v75` | All three verified by read. |
| `Tbmsmoketest.js` | BUMP 6 → 7 | line 2: `tbmSmokeTest.gs v6` → `v7` | line 40: `return 6;` → `return 7;` | last line: `v6` → `v7` | All three verified by read. |

**Files NOT bumped** — `SparkleLearning.html`, `CurriculumSeed.js`, `StoryFactory.js`.
No `<meta name="tbm-version">` change in SparkleLearning.html because the HTML is
untouched (the bridge lives entirely server-side).

## Gate 4 — Deploy Manifest

Run every line after Sonnet's build. Zero matches = NOT DONE. Run from repo root.

```
grep -n "ACTIVITY_STORY_PACKS"              ActivityStoryPacks.js     → expected: 1 const declaration + 1 comment reference
grep -n "jj-kitchen"                        ActivityStoryPacks.js     → expected: 1 match (the pack key)
grep -n "jj-buggsy-treasure"                ActivityStoryPacks.js     → expected: 1 match
grep -n "jj-buggsy-rainy"                   ActivityStoryPacks.js     → expected: 1 match
grep -n "getActivityStoryPack_"             ActivityStoryPacks.js     → expected: 1 function definition
grep -n "getActivityStoryPackSafe"          ActivityStoryPacks.js     → expected: 1 function definition
grep -n "getActivityStoryPacksVersion"      ActivityStoryPacks.js     → expected: 1 function definition
grep -n "getActivityStoryPackSafe"          Code.js                   → expected: 1 whitelist entry
grep -n "getActivityStoryPackSafe"          Tbmsmoketest.js           → expected: 1 CANONICAL_SAFE_FUNCTIONS entry
grep -n "ACTIVITY_STORY_PACKS\|getActivityStoryPack_"  Kidshub.js     → expected: 1+ references (the injection loop)
grep -n "audio_story"                       Kidshub.js                → expected: 1+ matches (injection loop type check)
grep -n "function getKidsHubVersion"        Kidshub.js                → expected: matches after bump
grep -n "function getCodeVersion"           Code.js                   → expected: "return 75;"
grep -n "function getSmokeTestVersion"      Tbmsmoketest.js           → expected: "return 7;"
grep -c "w2th5.*audio_story.*jj-kitchen"           CurriculumSeed.js  → expected: 1 (unchanged)
grep -c "w3th5.*audio_story.*jj-buggsy-treasure"   CurriculumSeed.js  → expected: 1 (unchanged)
grep -c "w4th5.*audio_story.*jj-buggsy-rainy"      CurriculumSeed.js  → expected: 1 (unchanged)
grep -n "function renderAudioStory"         SparkleLearning.html      → expected: line 2473 (unchanged)
```

All lines must return the expected count. Any mismatch means the build is incomplete.

## Gate 5 — Feature Verification Checklist

Specific, measurable pass conditions. Each item has a literal value, field name, or
count. Sonnet must run every item post-deploy and capture evidence (Logger output or
grep output). "Looks correct" does NOT count.

| # | Check | Pass condition |
|---|-------|----------------|
| 1 | `ActivityStoryPacks.js` loads in GAS | `getActivityStoryPacksVersion()` returns `1` when called from Script Editor |
| 2 | Pack lookup — Week 2 | `getActivityStoryPack_('jj-kitchen')` returns object where `.answer === "Three"` AND `.options.length === 3` AND `.options.indexOf("Three") !== -1` |
| 3 | Pack lookup — Week 3 | `getActivityStoryPack_('jj-buggsy-treasure')` returns object where `.answer === "Five"` AND `.options.indexOf("Five") !== -1` |
| 4 | Pack lookup — Week 4 | `getActivityStoryPack_('jj-buggsy-rainy')` returns object where `.answer === "Green"` AND `.options.indexOf("Green") !== -1` |
| 5 | Pack isolation | Mutating the returned object's `options` array does NOT mutate subsequent lookups (`getActivityStoryPack_('jj-kitchen').options.pop(); getActivityStoryPack_('jj-kitchen').options.length === 3`) |
| 6 | Safe wrapper success shape | `getActivityStoryPackSafe('jj-kitchen')` returns `{ok:true, pack:{...}}` where `pack.story.indexOf("ice cream") !== -1` |
| 7 | Safe wrapper miss shape | `getActivityStoryPackSafe('nope-unknown')` returns `{ok:false, error:'unknown_story_id', storyId:'nope-unknown'}` |
| 8 | Safe wrapper null-input shape | `getActivityStoryPackSafe(null)` returns `{ok:false, error:'unknown_story_id', storyId:null}` (no throw) |
| 9 | KidsHub injection — Week 2 | Call `getTodayContent_('jj', '2026-04-16')` — uses the `_testDateOverride` param (W2 Thursday) — and find the activity with `type === 'audio_story'`. Assert `activity.story.indexOf("JJ walks into the kitchen") === 0` AND `activity.question.indexOf("How many scoops") !== -1` AND `activity.answer === "Three"` AND `Array.isArray(activity.options)` AND `activity.options.length === 3` |
| 10 | KidsHub injection — Week 3 | Same as #9 using `getTodayContent_('jj', '2026-04-23')` (W3 Thursday via `_testDateOverride`). Assert `activity.answer === "Five"` AND `activity.story.indexOf("treasure") !== -1` |
| 11 | KidsHub injection — Week 4 | Same as #9 using `getTodayContent_('jj', '2026-04-30')` (W4 Thursday via `_testDateOverride`). Assert `activity.answer === "Green"` AND `activity.story.indexOf("blanket fort") !== -1` |
| 12 | Curriculum metadata preserved | After injection, W2 Thursday audio_story activity still has `audioPrompt`, `audioCorrect`, `title`, `stars`, and `id === 'w2th5'` unchanged from `CurriculumSeed.js` line 222 |
| 13 | Unknown storyId passthrough | If a test activity `{type:'audio_story', storyId:'ghost-story-xyz'}` is injected into `getTodayContent_`'s input path, the activity returned has NO `story`/`question`/`answer`/`options` fields set (fallback path intact) |
| 14 | `renderAudioStory` reads real content | Load `/sparkle?debug_day=w2th5` (or manual nav to Week 2 Thursday) on a real Fire Kids tablet, verify the visible story text on screen starts with "JJ walks into the kitchen" NOT "Once upon a time, a little bunny" |
| 15 | ElevenLabs voice reads the real story | Using `speak()` path (SparkleLearning.html `renderAudioStory` line 2496: `speak(story, function() {...})`), audibly confirm JJ hears the kitchen story, not the bunny fallback |
| 16 | Comprehension question is the correct one | On screen and audibly, the question after story playback matches "How many scoops of ice cream did Daddy give JJ?" |
| 17 | Three options render as buttons | DOM inspect: `document.querySelectorAll('.option-btn').length === 3` for audio_story activity |
| 18 | Correct answer is among the options | DOM inspect: at least one `.option-btn` has text content `"Three"` (W2), `"Five"` (W3), or `"Green"` (W4) matching the week |
| 19 | Tapping correct answer advances | Tap the "Three" button; `checkStoryAnswer` (line 2512) calls `handleCorrectAnswer` and advances |
| 20 | Tapping wrong answer stays put | Tap "One" or "Five" on W2; `handleWrongAnswer` fires; activity does not advance |
| 21 | Fallback on unknown storyId doesn't hang UI | Manually inject a test curriculum entry with `storyId: 'unknown-xyz'`, load SparkleLearning, verify the hardcoded bunny story renders without a console error |
| 22 | Code.js whitelist wiring | `grep -n "getActivityStoryPackSafe" Code.js` returns exactly 1 line (the whitelist entry) |
| 23 | Tbmsmoketest wiring | Run `tbmSmokeTest()` from Script Editor; Category 1 (wiring) result for `getActivityStoryPackSafe` is `OK` |
| 24 | Version consistency — ActivityStoryPacks.js | 3 locations match: header `v1`, getter returns `1`, EOF comment `v1` |
| 25 | Version consistency — Kidshub.js | 3 locations match at the new bumped N+1 value |
| 26 | Version consistency — Code.js | 3 locations match at `75` |
| 27 | Version consistency — Tbmsmoketest.js | 3 locations match at `7` |
| 28 | ES5 compliance in diff | `audit-source.sh` passes with zero new ES5 violations on any changed `.html` file. Note: this spec touches NO `.html` files, so this check is trivially green, but run it anyway for discipline. |
| 29 | Smoke + regression pass | `?action=runTests` JSON shows `overall === "PASS"` AND `smoke.overall === "PASS"` after deploy |
| 30 | No new ErrorLog entries | Post-deploy + 1 JJ test session, `ErrorLog` tab shows zero new rows mentioning `getActivityStoryPackSafe`, `getActivityStoryPack_`, or `ActivityStoryPacks` |

Items 1-8, 22-23 are runnable from the Apps Script editor before a real kid ever sees
the change (smoke loop). Items 9-11 require a date override or curriculum sheet walk.
Items 14-21 require a real tablet and JJ (or a mock of JJ's session). Items 24-27 are
audit-source checks that must green up before push.

## Open questions — resolved

The Notion design prompt at `https://www.notion.so/33dcea3cd9e881daaeeec7337727e79c` is
the LT decision authority for this spec. **Verification note:** the prompt itself is a
locked Notion page behind JS-required rendering and cannot be fetched directly from a
headless session; the design decisions below are captured from the orchestration prompt
that delegated this spec, which quotes the Notion prompt verbatim for each decision
point. If LT updates the Notion prompt, the spec is the source-of-truth for the decision
captured at spec time.

**Decision 1 — Pre-authored vs Gemini runtime generation.**
> "Running Gemini at lesson time to generate a paragraph JJ will hear adds 2-5s of
> latency on a Fire Kids tablet with flaky WiFi, burns inference budget every time a
> 4-year-old taps Play Again, risks generating off-rail content without LT pre-review,
> and makes ElevenLabs audio pre-caching impossible."
>
> **Resolution:** pre-authored JSON. StoryFactory runtime pipeline stays dedicated to
> StoryReader bedtime stories; audio_story packs are deterministic.

**Decision 2 — Where story content lives.**
> "Three modules could own this content: CurriculumSeed inline, StoryFactory STORY_INDEX,
> or a new standalone module."
>
> **Resolution:** new `ActivityStoryPacks.js` module. Clean boundary, reviewable in one
> PR, testable in isolation. STORY_INDEX is for `vocabulary_bedtime` scene stories at
> a different route. CurriculumSeed inline would balloon activity lines and mix
> curriculum data with story prose.

**Decision 3 — Delivery path to SparkleLearning.**
> "The client already has one fetch (`getTodayContentSafe('jj')`). Adding a second
> fetch inside renderAudioStory would require a loading state and an async pattern
> the existing ES5 dispatcher does not have."
>
> **Resolution:** server-side injection inside `getTodayContent_`. Activities are
> mutated in place to carry `story`/`question`/`answer`/`options` before the response
> ships. Zero new network round-trips, renderAudioStory unchanged.

**Decision 4 — Week 1 audio_story.**
> "Week 1 Thursday already has 15 activities and the 10-activity cap at
> SparkleLearning.html:1573 drops the last 5. Adding a 16th would never reach JJ."
>
> **Resolution:** skip. Ship three story packs for Weeks 2/3/4. Week 2 Thursday
> (2026-04-16) is the natural first exposure. Flagged for LT in case of override.

## Open questions for LT (non-blocking — spec can ship without these)

1. **Week 1 audio_story.** Skip is the chosen default (Decision 4). If LT prefers to
   displace one Week 1 Thursday letter-sound drill to make room for an audio_story,
   the least-damaging candidate is `w1th12` (the I-Ice-cream beginning_sound drill,
   which overlaps with `w1th03` KINDLE-K beginning_sound already covered twice in
   the same day). A 4th pack would be added to `ACTIVITY_STORY_PACKS` keyed by a
   storyId like `jj-k-kite`. Not in scope for this spec.

2. **Audio pre-caching.** The `preloadCurriculumAudio` call at SparkleLearning.html
   line 1576 currently preloads audio for the activities array. Does it need to be
   extended to preload the story text as a separate ElevenLabs clip so
   `speak(story, cb)` at line 2496 hits cache? Depends on how `speak()` / audio clip
   queue is wired. Flagged for investigation in the implementation PR, NOT the spec.

3. **Play Again on a story activity.** When JJ taps Play Again mid-session (line 2837
   `replaySession`), does the audio_story replay with fresh audio or a cached clip?
   Current behavior: the full `todayContent.activities` is re-iterated from index 0,
   so the same pack is rendered again. This is fine — no spec change needed — but
   worth confirming on-device.

4. **Story distractors as curriculum reinforcement.** Today's options are simple
   numbers/colors. Could distractors be curriculum-focus letters or shapes (e.g.,
   Week 2 options: `["Three", "N", "Blue"]`)? Would tighten the feedback loop but
   risks confusing the question ("How many scoops?" → "N" is nonsense as an answer).
   Keep simple distractors for now; revisit after first QA pass.

5. **Multilingual support.** Out of scope for this spec. ACTIVITY_STORY_PACKS is an
   English-only lookup. If/when the family adds Spanish, the pack shape would extend
   to `{en: {...}, es: {...}}` with a client-supplied `locale` param.

6. **Story analytics.** Should story answers (correct/wrong) get logged as
   `education_progress` events to `KH_History` the same way other activity types do?
   Current state: `checkStoryAnswer` (line 2512) routes to `handleCorrectAnswer`
   which already wires into `completedActivities.push()` and the standard
   end-of-session save. Nothing new needed. Noted for clarity.

## Verification divergences from the orchestration prompt

Every prompt claim was verified against source; this section captures what matched and
what diverged.

**Matched exactly:**
- `SparkleLearning.html:2473` for `renderAudioStory` — confirmed.
- `StoryFactory.js:1556` for `STORY_INDEX` — confirmed.
- `StoryFactory.js:1571` for `getStoryForReader` — confirmed.
- `StoryFactory.js:1602` for `loadStoryToProps` — confirmed.
- `CurriculumSeed.js:222` for W2 audio_story — confirmed.
- `CurriculumSeed.js:297` for W3 audio_story — confirmed.
- `CurriculumSeed.js:373` for W4 audio_story — confirmed.
- STORY_INDEX has exactly one entry, `week1-jj-garden-mystery` — confirmed.
- No Week 1 audio_story activity exists — confirmed.
- Buggsy has no audio_story activities — confirmed (all `audio_story` matches live
  inside `JJ_WEEK_2/3/4` blocks, and `BUGGSY_WEEK_*` starts at line 404).

**Additive findings (not in the prompt but relevant):**
- `getStoryForReaderSafe` is ALREADY whitelisted at `Code.js:415`. The bridge does
  not need to whitelist that specific wrapper — a new `getActivityStoryPackSafe`
  wrapper is the right target for whitelisting, NOT a new entry for `getStoryForReaderSafe`.
- The `audio_story` case at `SparkleLearning.html:1666-1667` routes both `audio_story`
  AND `story_listen` types to `renderAudioStory`. This spec covers `audio_story`
  only; `story_listen` has no curriculum entries (verified — `grep -n "story_listen"
  CurriculumSeed.js` returns zero) and is a dead code path for now.
- The audio_story entries in CurriculumSeed have an `audioCorrect` field that
  *contains the answer as a spoken cue* (`"How many scoops did JJ get? Three!"`).
  The comprehension question in this spec is worded to match that cue exactly so
  audio and on-screen text align. Confirming this alignment is Gate 5 item #16.
- The `story` field on `activity` is spoken via `speak()` (line 2496), then the
  question, then the options. The full story text IS the audio — there is no
  separate audio file. ElevenLabs voice will synthesize from the string at playback.

**Minor drift to watch:**
- `SparkleLearning.html` meta version is `v14` (line 7). This spec does not bump
  it because the HTML is untouched — but if a later PR touches any client code,
  bump to `v15` before pushing.
- `StoryFactory.js` uses the standard 3-location version pattern: header line 6
  (`Version: 15.4`), getter line 10 (`return 15.4;`), EOF line 1860
  (`// END OF FILE — StoryFactory v15.4`). This spec does not touch StoryFactory.js
  so no version bump is needed there. All JS files this spec DOES touch follow the
  3-location rule per the version-bumps table above.

---

**Definition of done for implementation:**

1. `ActivityStoryPacks.js` is pushed to GAS with all three packs and its Safe wrapper.
2. `getTodayContent_` (Kidshub.js) mutates matching `audio_story` activities before
   return — verified by Script Editor call with debug date override.
3. `getActivityStoryPackSafe` is whitelisted in `Code.js` and appears in
   `Tbmsmoketest.js CANONICAL_SAFE_FUNCTIONS`.
4. `audit-source.sh` passes — version consistency, wiring check, ES5 (trivially).
5. `diagPreQA()` shows all categories PASS.
6. `clasp push` succeeds, `clasp deploy -i <existing-id>` updates production.
7. `?action=runTests` JSON returns `overall === "PASS"` AND `smoke.overall === "PASS"`.
8. Real-tablet session on JJ Week 2 Thursday (2026-04-16 or via curriculum date
   override) shows the kitchen story text on screen and audibly, not the bunny
   fallback. Screenshot captured for the PR.
9. Gate 5 items 1-30 all green. Items 9-21 must be verified on a real tablet with
   a real JJ session — OR a recorded session replay by LT.
10. Post-deploy: no new ErrorLog rows mentioning the new functions within 1 hour
    of deploy.
