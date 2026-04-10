# SparkleLearning Modular Split Spec

**Owner:** Opus (spec), Sonnet (build), Codex (audit)
**Priority:** P2 — unblocks JJ Phase 2-5 activity additions
**Status:** Draft — Awaiting LT Approval
**Issue:** (to be created after spec merge)

---

## Problem

SparkleLearning.html is 3,052 lines (v15) and growing. 8 new activity types are
planned for JJ Phases 2-5. At current density (~60 lines/activity), adding 8
more types pushes the file past 3,500 lines. This causes:

1. **Context window pressure** — Codex reviews truncate, producing false positives
2. **Context compaction** — Claude context compaction fires mid-edit on files >3K lines
3. **Merge conflicts** — Multiple Sonnet builds touching the same monolith collide
4. **Cognitive load** — Finding the right render function in 3K lines is slow

## Goal

Split SparkleLearning.html into a core shell + pluggable activity renderer files,
using GAS HtmlService template includes. No behavior change. No new features.

---

## Current Architecture

### File Structure (single file)
```
SparkleLearning.html (3,052 lines)
  ├── <style> block              lines 9-548    (~540 lines CSS)
  ├── HTML skeleton              lines 550-576  (~26 lines)
  └── <script> block             lines 577-3051 (~2,474 lines JS)
       ├── Global state          lines 577-620
       ├── Audio system          lines 635-806
       ├── Shape renderer        lines 845-937
       ├── Utilities             lines 938-1160
       ├── Init pipeline         lines 1281-1430
       ├── Free play mode        lines 1427-1581
       ├── Asset registry        lines 1581-1627
       ├── Content loader        lines 1628-1691
       ├── Activity dispatcher   lines 1695-1747  (switch statement)
       ├── Activity lifecycle    lines 1749-1806
       ├── 17 render functions   lines 1808-2876  (~1,068 lines)
       ├── Session completion    lines 2878-2986
       └── Fallback screens      lines 2991-3051
```

### Activity Dispatch (current)
```javascript
function renderActivity(index) {
  var activity = todayContent.activities[index];
  var type = activity.type;
  switch (type) {
    case 'letter_intro':       renderLetterIntro(activity); break;
    case 'find_letter':
    case 'find_the_letter':    renderFindLetter(activity); break;
    // ... 15 more cases ...
    default: advanceActivity(activity.stars || 0);
  }
}
```

### Current Serving (Code.js line 285)
```javascript
return HtmlService.createHtmlOutputFromFile(route.file)
  .setTitle(route.title)
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
```
Uses `createHtmlOutputFromFile()` — no template processing, no includes.

---

## Proposed Architecture

### File Split

| File | Contents | Est. Lines |
|------|----------|------------|
| **SparkleLearning.html** | Core shell: CSS, HTML skeleton, global state, audio, feedback, lifecycle, dispatcher, completion | ~1,400 |
| **SparkleActivities-Core.html** | Original 17 render functions + their checker helpers | ~1,100 |
| **SparkleActivities-Phase2.html** | New Phase 2-5 activity renderers (8 types) | ~500+ |

### Include Pattern (GAS HtmlService)

**Step 1: Add `include_()` helper to Code.gs**
```javascript
function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
```

**Step 2: Switch SparkleLearning to template serving in Code.gs**
```javascript
// In the route handler, replace createHtmlOutputFromFile with:
var tmpl = HtmlService.createTemplateFromFile('SparkleLearning');
return tmpl.evaluate()
  .setTitle(route.title)
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
```

**Step 3: Add include scriptlets to SparkleLearning.html**
```html
<script>
  // === Core shell code (state, audio, feedback, lifecycle) ===
  // ... stays inline ...

  // === Activity Renderers (Phase 1 — original 17 types) ===
  <?!= include_('SparkleActivities-Core') ?>

  // === Activity Renderers (Phase 2+ — new types) ===
  <?!= include_('SparkleActivities-Phase2') ?>

  // === Session completion + fallback ===
  // ... stays inline ...
</script>
```

### Activity Registration Pattern

Replace the switch statement with a registry object. Activities self-register
when their include file is evaluated.

```javascript
// In core shell (SparkleLearning.html):
var ACTIVITY_REGISTRY = {};

function registerActivity(types, renderFn) {
  for (var i = 0; i < types.length; i++) {
    ACTIVITY_REGISTRY[types[i]] = renderFn;
  }
}

function renderActivity(index) {
  var activity = todayContent.activities[index];
  var type = activity.type;
  var renderer = ACTIVITY_REGISTRY[type];
  if (renderer) {
    renderer(activity);
  } else {
    console.warn('Unknown activity type: ' + type);
    advanceActivity(activity.stars || 0);
  }
}
```

```javascript
// In SparkleActivities-Core.html (pure JS, no HTML tags):
registerActivity(['letter_intro'], function renderLetterIntro(activity) {
  // ... existing render logic ...
});

registerActivity(['find_letter', 'find_the_letter'], function renderFindLetter(activity) {
  // ... existing render logic ...
});
// ... 15 more registrations ...
```

### CSS Strategy

CSS stays in the core shell `<style>` block. Activity-specific CSS that only
exists for one renderer type should be prefixed with `.sparkle-activity-{type}`
to prevent collisions. Existing CSS is already generic enough (`.grid-2x2`,
`.option-card`, `.letter-large`) that no namespace changes are needed for Phase 1.

New Phase 2+ activities should use the prefix convention.

---

## Constraints

1. **GAS HtmlService inlines at serve time.** `<?!= include_() ?>` evaluates
   server-side and concatenates the result into the HTML string. There is no
   lazy loading, no dynamic imports, no code splitting. The browser receives
   one big HTML document — same as today.

2. **All JS shares one global scope.** Include files cannot use `var` names that
   collide with the core shell. The registry pattern (`registerActivity`) avoids
   this: each renderer is a function expression, not a global declaration.

3. **Include files are pure JS (or pure CSS).** They do NOT have `<script>` or
   `<style>` tags — those are provided by the parent template. The include file
   content is injected inside the existing `<script>` block.

4. **ES5 only.** All include files follow the same ES5 rules as the parent.

5. **No circular includes.** GAS doesn't detect include loops. The shell includes
   activity files; activity files do not include anything.

6. **`createTemplateFromFile()` is slightly slower** than `createHtmlOutputFromFile()`.
   The difference is negligible for a single page serve but measurable in load
   testing. Not a concern for this use case.

---

## Migration Plan

### Phase 1: Plumbing (one PR)
1. Add `include_()` function to Code.gs
2. Switch SparkleLearning route from `createHtmlOutputFromFile` to `createTemplateFromFile`
3. Add `ACTIVITY_REGISTRY` and `registerActivity()` to SparkleLearning.html
4. Create empty `SparkleActivities-Core.html` with a single comment
5. Add `<?!= include_('SparkleActivities-Core') ?>` to SparkleLearning.html
6. Verify: page loads identically (no visual or functional change)

### Phase 2: Extract renderers (one PR)
1. Move all 17 `render*()` functions + their checker helpers into `SparkleActivities-Core.html`
2. Convert each to `registerActivity()` pattern
3. Remove the switch statement from `renderActivity()`, replace with registry lookup
4. Update `KNOWN_ACTIVITY_TYPES` to derive from `Object.keys(ACTIVITY_REGISTRY)`
5. Verify: all 17 activity types still render correctly

### Phase 3: Add new activities (per-phase PRs)
1. Create `SparkleActivities-Phase2.html`
2. Add `<?!= include_('SparkleActivities-Phase2') ?>` after Core include
3. Each new activity type = one `registerActivity()` call
4. No changes to the core shell needed

---

## What Does NOT Change

- Audio system (shared, stays in core)
- Feedback system (shared, stays in core)
- Star/progress tracking (shared, stays in core)
- Content loading pipeline (shared, stays in core)
- Session completion screen (shared, stays in core)
- Free play mode (stays in core — it's infrastructure, not an activity type)
- CSS (stays in core `<style>` block)
- URL parameters and routing
- The browser-side user experience (identical output)

---

## Risks

| Risk | Mitigation |
|------|------------|
| Include file syntax error breaks entire page | Each include file gets a standalone ES5 lint check in audit-source.sh |
| Function name collision between includes | Registry pattern avoids globals; each renderer is a function expression |
| Template evaluation strips comments | Already a known GAS constraint; not relevant since include files are JS only |
| Performance regression from template eval | Negligible; measured at <50ms difference for pages this size |
| Merge conflicts during migration | Phase 1 (plumbing) and Phase 2 (extraction) are separate PRs |

---

## Verification

### Phase 1 (Plumbing)
- [ ] `clasp push` succeeds
- [ ] SparkleLearning loads at `/sparkle` and `/sparkle-free`
- [ ] All 17 activity types render (run through a test curriculum week)
- [ ] Audio plays on first interaction
- [ ] Stars awarded on completion
- [ ] No console errors

### Phase 2 (Extraction)
- [ ] Same checklist as Phase 1
- [ ] `SparkleActivities-Core.html` passes ES5 lint
- [ ] `Object.keys(ACTIVITY_REGISTRY).length >= 17`
- [ ] SparkleLearning.html is under 1,500 lines
- [ ] Codex review on the PR completes WITHOUT truncation

### Phase 3 (New Activities)
- [ ] New activity types appear in `ACTIVITY_REGISTRY`
- [ ] Each new type renders with correct UI
- [ ] No regressions on existing 17 types

---

## Open Questions

1. **Should CSS also be split?** Current CSS is ~540 lines and shared across all
   activities. Splitting would add complexity without much benefit unless Phase 2+
   activities bring significant new CSS. **Recommendation: keep CSS in core for now.**

2. **Should `SparkleActivities-Core.html` be further split by category?** e.g.,
   `SparkleActivities-Letters.html`, `SparkleActivities-Numbers.html`. This adds
   complexity with minimal benefit since each renderer is self-contained.
   **Recommendation: one file per phase (Core, Phase2, Phase3, etc.).**

3. **How does this interact with issue #166 (Sonnet's visual overhaul)?** The
   visual overhaul modifies existing renderers. Migration should happen AFTER
   #166 merges to avoid conflicts. **Recommendation: merge #166 first, then
   extract renderers.**
