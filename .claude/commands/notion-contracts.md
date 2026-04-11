---
name: notion-contracts
description: >
  Single source of truth for all Notion database IDs, field names, select
  option values, and logging contracts in the TBM platform. Use this skill
  when writing code that reads from or writes to Notion, debugging a Notion
  API 400/401 error, auditing what data is being logged, or building a new
  logging call. Triggers on: Notion, DB ID, database field, logHomework,
  logSparkle, notion logging, notion payload, notion schema, NOTION_API_KEY.
---

# Notion Contracts — TBM Platform

## Cardinal Rule
> Field names and select option values are EXACT. A wrong select value causes
> a Notion API 400 that silently drops the log entry. Always match the option
> strings in this file, not a guess.

---

## Authentication

| Property | Script Property Key | Notes |
|----------|-------------------|-------|
| API Key | `NOTION_API_KEY` | Integration token from notion.so/my-integrations |
| Notion Version | `2022-06-28` | Header: `Notion-Version` |
| Homework DB ID | `NOTION_HOMEWORK_DB_ID` | Set in Script Properties — not hardcoded |
| Sparkle DB ID | `NOTION_SPARKLE_DB_ID` | Set in Script Properties — not hardcoded |

API keys rotate. **Never hardcode them.** Always read from `PropertiesService.getScriptProperties()`.

---

## Database: Homework Tracker (Buggsy)

**Notion Page ID:** `9164c6a594b448028426366ff62952b5`
**Script Property:** `NOTION_HOMEWORK_DB_ID`
**GAS Function:** `logHomeworkCompletionSafe(data)` in Code.js
**Surface written from:** HomeworkModule.html, reading-module.html, writing-module.html, investigation-module.html, daily-missions.html

### Field Schema

| Notion Field | Notion Type | Allowed Values / Notes |
|-------------|-------------|----------------------|
| `Assignment` | title | Free text — the assignment name or `[Error Journal] ...` or `[Reflection] ...` |
| `Subject` | select | `Math`, `Science`, `Reading`, `Writing`, `Social Studies`, `Spelling`, `ExecSkills`, `Other` |
| `Due Date` | date | ISO date string `YYYY-MM-DD` |
| `Status` | select | `Turned In` (auto-set on log) |
| `Notes` | rich_text | `Child: buggsy | Score: 5/6` format (built by GAS) |

### SUBJ_MAP (Code.js) — Incoming → Notion select

```javascript
var SUBJ_MAP = {
  'Math': 'Math', 'math': 'Math',
  'Science': 'Science', 'science': 'Science',
  'RLA': 'Reading', 'Reading': 'Reading', 'reading': 'Reading',
  'Writing': 'Writing', 'RLA-Writing': 'Writing', 'RLA-Writing-CER': 'Writing',
  'Social Studies': 'Social Studies', 'Spelling': 'Spelling',
  'ExecSkills': 'Other'  // journal/reflection logs route here
};
// Any key not in this map → 'Other'
```

### Logging Payload Shape

```javascript
logHomeworkCompletionSafe({
  child: 'buggsy',          // or 'jj'
  title: 'Assignment name', // Required — appears as Notion page title
  subject: 'Math',          // Required — must be in SUBJ_MAP
  score: 5,                 // Optional — MC correct count
  total: 6,                 // Optional — total MC questions
  date: '2026-04-11'        // Optional — defaults to today
});
```

---

## Database: Pre-K Prep (JJ/Kindle)

**Notion Page ID:** `ac28bcfa-e972-428e-812d-f2281df55af9`
**Script Property:** `NOTION_SPARKLE_DB_ID`
**GAS Function:** `logSparkleProgressSafe(data)` in Code.js
**Surface written from:** SparkleLearning.html, daily-missions.html (JJ path)

### Field Schema

| Notion Field | Notion Type | Allowed Values / Notes |
|-------------|-------------|----------------------|
| `Skill` | title | Skill name (e.g., `Letter K`, `Colors — Red`) |
| `Category` | select | `Letters`, `Numbers`, `Colors`, `Shapes`, `Writing`, `Phonics` |
| `Status` | select | `Not Introduced`, `Practicing`, `Getting It`, `Mastered` |
| `Phase` | select | `Phase 1`, `Phase 2`, `Phase 3`, `Phase 4` |
| `Date Introduced` | date | ISO date — first session with this skill |
| `Practice Count` | number | Increment each session |
| `Fun Rating` | select | `⭐`, `⭐⭐`, `⭐⭐⭐` |
| `Notes` | rich_text | Free text |

### Logging Payload Shape

```javascript
logSparkleProgressSafe({
  child: 'jj',
  skill: 'Letter K',          // Notion page title
  category: 'Letters',        // Must match Category select options
  status: 'Practicing',       // Must match Status select options
  phase: 'Phase 1',           // Must match Phase select options
  stars: 3                    // Maps to Fun Rating ⭐⭐⭐
});
```

---

## Database: PM Active Versions

**Notion Page ID:** `2c8cea3cd9e8818eaf53df73cb5c2eee`
**Data Source:** `collection://158238c5-9a78-4fa5-9ef8-203f8e0e00a9`
**Updated by:** Claude after every deploy (Step 11 in deploy pipeline)
**MCP note:** Table cell updates via MCP tool fail (known bug — update title only, never icon+title together)

### Version Row Update

After every deploy, update the row for the changed file:
- Title = `FileName.gs v<N>`
- **Do NOT** change the icon (double-emoji bug)

---

## Database: Audio Clip Queue

**Notion Page ID:** `f4fee7eb444f45a5ad80e19e39ce1780`
**Data Source:** `d1c3e770-177b-4fcb-b308-015809210845`
**Purpose:** Queue of audio phrases pending ElevenLabs generation
**Source of truth:** `phrases.json` in repo root

| Notion Field | Type | Notes |
|-------------|------|-------|
| `Phrase` | title | Exact text to synthesize |
| `Voice` | select | `Nia (JJ)`, `Marco (Buggsy)` |
| `Category` | select | `Letter`, `Celebration`, `Instruction`, `Feedback`, `Story` |
| `Status` | select | `Pending`, `Generated`, `Uploaded`, `Verified` |
| `File Name` | text | Output filename without extension |

**Generation flow:** Add row to queue → run `node generate-audio.js` locally → clips uploaded to Drive `1rXWVBD9QMruWOj6AlNB4mY2E9wzWGctm/jj/` or `/buggsy/` → mark `Verified` in queue.

---

## Database: QA Test Plan

**Notion Page ID:** `32ccea3cd9e8818f9e30f317dea0fed7`
**Updated by:** Claude or LT after QA runs
**Purpose:** Gate 5 (Feature Verification Checklist) and Gate 6 (QA Round) tracking

---

## Database: Trust Backlog

**Notion Page ID:** `338cea3cd9e8814a8cd6e1e04ecb4748`
**Updated by:** LT

---

## Database: Integration Map

**Notion Page ID:** `33acea3cd9e881888295e3ab98be3fc4`
**Updated by:** LT or Claude during architecture decisions

---

## Thread Handoff Archive

**Notion Page ID:** `322cea3cd9e881bb8afcd560fe772481`
**Written by:** Claude at end of every session
**Format:** `Session YYYY-MM-DD — [brief what was done]`

---

## Education Platform Page

**Notion Page ID:** `331cea3cd9e8816aa07feec250328cf8`
**Purpose:** Parent-visible education progress overview

---

## Known Limitations

1. **Table cell updates via MCP fail.** Update page title only. For table data changes, use the Notion web UI or `UrlFetchApp.fetch` directly.
2. **Icon + title update = double-emoji bug.** Never set icon and title in the same MCP call.
3. **DB IDs live in Script Properties**, not hardcoded. If a function returns `DB_ID not set`, the property is missing — set it in GAS Script Properties, not in code.
4. **Notion API `2022-06-28`** — this version must be in the `Notion-Version` header of every request. Do not use a newer or older version string.
5. **400 errors = field mismatch.** Check the exact select option string — typos and case differences both cause 400s.

---

## Quick Diagnostic

```javascript
// Run in GAS editor to test end-to-end Notion write:
function testNotionContract() {
  var result = logHomeworkCompletionSafe({
    child: 'buggsy',
    title: 'Notion Contract Test',
    subject: 'Math',
    score: 9,
    total: 10
  });
  Logger.log(JSON.stringify(result));
  // Expected: { "success": true }
}
```
