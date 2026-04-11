# StoryFactory Phased Pipeline — Write → Illustrate → Assemble

**Owner:** Sonnet (spec + build), Codex (audit), LT (gate)
**Issue:** #180
**Priority:** Major — ~50% production failure rate, story text discarded on every image failure
**Status:** Draft — Architecture Review
**Risk:** Medium — touches the polling loop and Notion status values. Additive: new statuses, new phase handlers, new Notion properties. Existing `Idea → Generating → Ready/Failed` path removed and replaced.

---

## Problem (grounded in code)

`StoryFactory.js:1155` — `runStoryFactory()` is monolithic. The `state` object at line 1168 is **in-memory only**. Comment at line 1170 makes this explicit:

> "These are IN-MEMORY ONLY. There is no persistent checkpoint store — the only retry path is setting Status back to Idea."

`pollForNewStories()` at line 1354 queries only `Status = 'Idea'`. When a story fails at image generation (the most failure-prone phase), all prior Gemini work is thrown away. The row lands at `Status = 'Failed'` and sits there until manually reset.

**Observed production failure signature:**
- `IMAGE_GATE_FAILED` thrown at line 1248 when `successfulImages < MIN_IMAGES_REQUIRED`
- Story text at this point: fully generated, audited, canon extracted — all discarded
- `CONFIG.MIN_IMAGES_REQUIRED = 1` (line 50) — even a single image failure out of 4 triggers the gate when that 1 is the only one

**Circuit breaker** (line 1315): global, 1-hour pause after 3 consecutive failures. One bad image API window stalls the entire story queue for an hour.

---

## Proposed Architecture

Three independent phases. `pollForNewStories()` picks up any row at an actionable status and dispatches to the correct handler.

```
Idea → Writing → Written → Illustrating → Illustrated → Assembling → Ready
                                                         ↓ (any phase failure)
                                                        Failed  (Failed Phase field)
```

### Phase 1: Write
| Property | Value |
|----------|-------|
| Input status | `Idea` |
| Claim status | `Writing` |
| Work | `generateStory()` + `auditStoryText_()` + `extractCanonFromStory()` |
| Save output | Story JSON → Notion `Story Data` property (rich_text, ≤ 2000 chars) or child page |
| Advance | Status → `Written` |
| Fail | Status → `Failed`, `Failed Phase` → `Write` |
| Retry cost | Cheapest phase — full retry is fine |

### Phase 2: Illustrate
| Property | Value |
|----------|-------|
| Input status | `Written` |
| Claim status | `Illustrating` |
| Work | `generateSceneImages()` — 4 images (scenes 0, 2, 4, 5 per `CONFIG.IMAGE_SCENES`) |
| Save output | Drive folder (named `StoryImages_<pageId>`), folder ID → Notion `Drive Folder` property |
| Track partial | `Images Generated` property (rich_text: `"3/4"`) — update on each successful image |
| Advance when | All `CONFIG.IMAGE_SCENES.length` images present → Status → `Illustrated` |
| Partial retry | If `Images Generated < total`: pick up on next poll, generate only missing images |
| Fail (0 images) | Status → `Failed`, `Failed Phase` → `Illustrate` |
| GAS limit note | 4 images × (up to 3 retries × `IMAGE_RETRY_DELAY 10s + IMAGE_COOLDOWN 8s`) ≈ 4 min max — fits in 6 min limit with margin |

### Phase 3: Assemble
| Property | Value |
|----------|-------|
| Input status | `Illustrated` |
| Claim status | `Assembling` |
| Work | Read story text from Notion `Story Data`, read images from Drive folder, `buildStoryPDF()` + `buildNotionCataloguePage()` |
| Advance | Status → `Ready` |
| Fail | Status → `Failed`, `Failed Phase` → `Assemble` |
| Failure rate | Near-zero — all inputs already persisted |

---

## New Notion Properties Required

These must be added to the Story DB (`a899ee9786024ece8d09ae8432642b2a`) in Notion UI before deploy:

| Property name | Type | Purpose |
|---------------|------|---------|
| `Story Data` | Rich text (or child page content) | Persisted story JSON from Phase 1 |
| `Drive Folder` | URL | Drive folder ID where images are saved |
| `Images Generated` | Rich text | `"3/4"` format — tracks per-image progress |
| `Failed Phase` | Select (Write, Illustrate, Assemble) | Which phase set Status to Failed |

**Existing properties unchanged:** `Status` (select), `Topic` (rich_text), `Character` (select), `Tone` (select), `Story Link` (URL), `Resume Hint` (rich_text), `Book Number` (number).

**New Status options to add to the `Status` select field:**
`Writing`, `Written`, `Illustrating`, `Illustrated`, `Assembling`

**Deprecated Status options (keep in Notion, stop generating):**
`Generating` — rows at `Generating` on deploy day: manually reset to `Idea` or `Written` depending on whether story text exists.

---

## Implementation Plan

### Step 1: `pollForNewStories()` dispatch loop

Replace single-status query with multi-status query, then dispatch:

```javascript
// NEW: query for any actionable status
var result = notionPost('databases/' + CONFIG.STORY_DB_ID + '/query', {
  filter: {
    or: [
      { property: 'Status', select: { equals: 'Idea' } },
      { property: 'Status', select: { equals: 'Written' } },
      { property: 'Status', select: { equals: 'Illustrated' } }
    ]
  },
  sorts: [{ timestamp: 'created_time', direction: 'ascending' }],  // oldest first
  page_size: 1
});

// Dispatch
var status = page.properties['Status'].select.name;
if (status === 'Idea')        { runWritePhase_(pageId, topic, character, tone); }
else if (status === 'Written')   { runIllustratePhase_(pageId); }
else if (status === 'Illustrated') { runAssemblePhase_(pageId); }
```

**Circuit breaker:** Replace global circuit breaker with per-phase counters:
`SF_WRITE_FAILS`, `SF_ILLUS_FAILS`, `SF_ASSEM_FAILS` — each trips independently with their own `SF_*_PAUSED_UNTIL` key. Remove `SF_CONSECUTIVE_FAILS` and `SF_PAUSED_UNTIL` from global scope (migrate via: if old key exists, delete it on first poll after deploy).

**Concurrency guard:** Keep `tryLock` pattern (line 1345) — intentionally skip, not wait. Unchanged.

### Step 2: `runWritePhase_(pageId, topic, character, tone)`

```
1. updateNotionRow(pageId, null, 'Writing')
2. characters = sf_getCharacterFromNotion_(character)
3. recentStories = sf_getRecentStories_(character)
4. canonFacts = sf_getCanonFacts_(character)
5. storyData = generateStory(topic, character, tone, characters, recentStories, canonFacts)
   [retry logic: unchanged from current line 1215-1227]
6. audit = auditStoryText_(storyData, character)
7. canonData = extractCanonFromStory(storyData)
8. Serialize storyData + canonData to JSON string
9. sf_saveStoryData_(pageId, jsonString)   ← NEW: writes to Notion 'Story Data' property
10. updateNotionRow(pageId, null, 'Written')
CATCH: updateNotionRow(pageId, null, 'Failed'), sf_setFailedPhase_(pageId, 'Write')
```

**Story data size:** `storyData` is ~6 scenes × ~200 chars text + prompts = ~3-5KB. Notion rich_text limit is 2000 chars per block. Use child page content if JSON exceeds 1800 chars (safe threshold). See `sf_saveStoryData_()` below.

### Step 3: `runIllustratePhase_(pageId)`

```
1. storyData = sf_loadStoryData_(pageId)   ← NEW: reads from Notion 'Story Data'
2. characters = sf_getCharacterFromNotion_(storyData.character)
3. driveFolder = sf_getOrCreateImageFolder_(pageId)  ← NEW: Drive folder for this story
4. existing = sf_listExistingImages_(driveFolder.id)  ← NEW: check which images already saved
5. FOR each scene in CONFIG.IMAGE_SCENES:
     IF scene not in existing:
       blob = generateSingleSceneImage_(storyData.scenes[scene], characters)
       IF blob: sf_saveImageToFolder_(driveFolder.id, 'scene_' + scene + '.png', blob)
6. saved = sf_listExistingImages_(driveFolder.id)
7. IF saved.length >= CONFIG.IMAGE_SCENES.length:
     updateNotionRow(pageId, null, 'Illustrated')
     sf_updateImagesProgress_(pageId, saved.length + '/' + CONFIG.IMAGE_SCENES.length)
   ELSE IF saved.length == 0:
     updateNotionRow(pageId, null, 'Failed'), sf_setFailedPhase_(pageId, 'Illustrate')
   ELSE:
     sf_updateImagesProgress_(pageId, saved.length + '/' + CONFIG.IMAGE_SCENES.length)
     // leave at 'Illustrating' — next poll will retry missing images
     updateNotionRow(pageId, null, 'Written')  ← revert to Written to pick up next cycle
```

### Step 4: `runAssemblePhase_(pageId)`

```
1. storyData = sf_loadStoryData_(pageId)
2. driveFolder = sf_getDriveFolderForStory_(pageId)
3. imageBlobs = sf_loadImagesFromFolder_(driveFolder.id)  ← ordered by CONFIG.IMAGE_SCENES
4. bookNumber = getNextBookNumber()
5. pdf = buildStoryPDF(storyData, imageBlobs, bookNumber)
6. notionUrl = buildNotionCataloguePage(storyData, pdf.url, bookNumber, storyData._canonData, storyData.tone)
7. updateNotionRow(pageId, pdf.url, 'Ready')
   + sf_deleteStoryData_(pageId)  ← cleanup: clear Story Data after assembly (optional)
CATCH: updateNotionRow(pageId, null, 'Failed'), sf_setFailedPhase_(pageId, 'Assemble')
```

### New Helper Functions Required

| Function | Purpose |
|----------|---------|
| `sf_saveStoryData_(pageId, json)` | Write story JSON to Notion `Story Data` property. If > 1800 chars: split into child page blocks. |
| `sf_loadStoryData_(pageId)` | Read + parse story JSON from Notion page. Reads child page if `Story Data` starts with `CHILD:`. |
| `sf_getOrCreateImageFolder_(pageId)` | Create/get Drive subfolder in `CONFIG.STORY_FOLDER_ID` named `StoryImages_<pageId_short>`. Save folder ID to Notion `Drive Folder` property. |
| `sf_listExistingImages_(folderId)` | Return array of scene numbers already saved in Drive folder. |
| `sf_saveImageToFolder_(folderId, filename, blob)` | Save a single image blob to Drive folder. |
| `sf_loadImagesFromFolder_(folderId)` | Return ordered array of image blobs matching CONFIG.IMAGE_SCENES order. Missing = null. |
| `sf_updateImagesProgress_(pageId, progress)` | Write `"3/4"` string to Notion `Images Generated` property. |
| `sf_setFailedPhase_(pageId, phase)` | Write `phase` to Notion `Failed Phase` select property. |
| `sf_getDriveFolderForStory_(pageId)` | Read `Drive Folder` URL from Notion, extract folder ID. |

---

## Version Bump

`StoryFactory.js v15.4 → v16.0` — breaking change to status flow and polling logic.

---

## Migration Plan

On deploy day:
1. Add Notion properties + status options in Notion UI (LT action, 5 min)
2. Any rows at `Status = 'Generating'` must be manually set to `Idea` (they have no persisted state — can't be resumed mid-flight)
3. New code goes live — `pollForNewStories()` now handles `Idea`, `Written`, `Illustrated`
4. Old `Generating` status: if a row sits there and polling restarts, it won't be picked up (not in the filter). Safe.

---

## Scope Gates

**In scope:**
- `StoryFactory.js` only — no changes to `Code.js`, `Kidshub.js`, or any HTML surface
- New Notion properties (LT manual action)
- New Drive folder pattern for per-story image storage

**Out of scope (future issues):**
- Automatic retry backlog with exponential backoff
- Per-story attempt counter with max retries
- Pushover notification on story completion (`Ready` Pushover could fire from `runAssemblePhase_`)
- Integration with SparkleLearning `audio_story` activity (tracked in specs/storyfactory-audiostory-bridge.md)
- Story quality metrics / stats dashboard

---

## Deploy Manifest

```bash
# Phase handlers exist
grep -n "function runWritePhase_"        StoryFactory.js   → expected: 1 match
grep -n "function runIllustratePhase_"   StoryFactory.js   → expected: 1 match
grep -n "function runAssemblePhase_"     StoryFactory.js   → expected: 1 match

# Multi-status poll query
grep -n "'Written'" StoryFactory.js     → expected: ≥ 2 (filter + claim)
grep -n "'Illustrated'" StoryFactory.js → expected: ≥ 2 (filter + claim)
grep -n "'Writing'" StoryFactory.js     → expected: ≥ 1 (claim)
grep -n "'Assembling'" StoryFactory.js  → expected: ≥ 1 (claim)

# Helper functions
grep -n "function sf_saveStoryData_"    StoryFactory.js   → expected: 1 match
grep -n "function sf_loadStoryData_"    StoryFactory.js   → expected: 1 match
grep -n "function sf_getOrCreateImageFolder_" StoryFactory.js → expected: 1 match

# Version bump
grep -n "v16" StoryFactory.js           → expected: header + getter + EOF comment

# Old monolithic pipeline still callable (test path only — pollForNewStories no longer calls it directly)
grep -n "function runStoryFactory"      StoryFactory.js   → expected: 1 match
```

---

## Feature Verification Checklist (Gate 5)

Run from GAS editor after deploy, verify Logger output:

- [ ] `pollForNewStories()` with a `Written` row: Logger shows "Dispatching to runIllustratePhase_"
- [ ] `runWritePhase_` on an Idea row: Status flips to `Written`, `Story Data` property is non-empty
- [ ] `runIllustratePhase_` with a `Written` row: Drive folder `StoryImages_<id>` created in `STORY_FOLDER_ID`
- [ ] Partial image failure (mock 1/4 images): Status stays at `Written` (re-queued), `Images Generated = "1/4"`
- [ ] `runAssemblePhase_` with an `Illustrated` row: PDF created, Notion catalogue page created, Status → `Ready`
- [ ] Phase 1 Gemini failure: Status → `Failed`, `Failed Phase = Write`
- [ ] Phase 2 all images fail: Status → `Failed`, `Failed Phase = Illustrate`
- [ ] Per-phase circuit breaker: after 3 Write fails, Write is paused but Illustrated rows still proceed through Assemble

---

## Open Questions — Resolved

| Question | Resolution |
|----------|-----------|
| Story JSON size — fits in Notion rich_text? | No. ~3-5KB exceeds 2000-char limit. Use child page blocks via `appendNotionBlocks_`. `sf_saveStoryData_` writes `CHILD:<blockId>` to the `Story Data` property as a pointer. |
| Drive folder per-story or shared? | Per-story, named `StoryImages_<pageId[:8]>` inside `CONFIG.STORY_FOLDER_ID`. Folder ID stored in Notion `Drive Folder` property. |
| What happens to old `Generating` rows on deploy? | They are NOT in the new poll filter — they sit idle. LT resets them to `Idea` manually. |
| Circuit breaker — per-phase or remove? | Per-phase. Three independent counters. Write fails shouldn't block Assemble from succeeding. |
| `runStoryFactory()` — delete or keep? | Keep as test-only entry point (not called by poll). Preserves manual trigger path during transition. |
