---
name: notion-contracts
description: >
  Single source of truth for all Notion database contracts in the Thompson
  platform. Use when building, debugging, or auditing any code that reads
  from or writes to Notion databases. Covers field names, data types, status
  flows, and which modules own which writes. Trigger on: Notion, database,
  homework tracker, pre-k prep, story factory, notion logging, notion query,
  page create, page update.
---

# Notion Database Contracts
**Single source of truth for every Notion integration in the Thompson platform.**

## Cardinal Rule
The field name in your code must exactly match the Notion property name. Fetch the page first if you're unsure. A typo silently creates a new property instead of updating the existing one.

---

## Database Registry

| DB Name | DB ID | Owner Module | Write Functions | Read Functions |
|---------|-------|--------------|-----------------|----------------|
| Homework Tracker | `9164c6a594b448028426366ff62952b5` | NotionEngine.gs | `logHomeworkToNotion_()`, `updateHomeworkStatus_()` | `queryPendingReviews_()`, ProgressReport.html |
| Pre-K Prep | `ac28bcfa-e972-428e-812d-f2281df55af9` | NotionEngine.gs | `logSparkleToNotion_()` | ProgressReport.html |
| Story Factory | `a899ee9786024ece8d09ae8432642b2a` | StoryFactory.gs | (story generation) | StoryLibrary.html |
| Characters DB | `1225d281b4d44a8094d3c817202f3288` | StoryFactory.gs | (character data) | ComicStudio.html |
| Canon Log | `d29ae2d2ee614ae0b27f8ccf9ac4dd81` | StoryFactory.gs | (story canon) | StoryReader.html |
| Audio Clip Queue | `f4fee7eb444f45a5ad80e19e39ce1780` | (manual) | (audio generation queue) | generate-audio.js |
| Active Versions | `collection://158238c5-...` | (deploy pipeline) | (version tracking) | Session start |

---

## Field Schemas

### Homework Tracker (`9164c6a594b448028426366ff62952b5`)

| Property Name | Notion Type | Valid Values | Written By | Example |
|---------------|-------------|--------------|------------|---------|
| Assignment | title | (free text) | `logHomeworkToNotion_()` | `"Math Module W3"` |
| Subject | select | Math, Science, Reading, Writing, Social Studies | `logHomeworkToNotion_()` | `"Math"` |
| Status | select | Not Started, In Progress, Done, pending_review, approved, Turned In | `updateHomeworkStatus_()` | `"pending_review"` |
| Score | number | 0-100 | `updateHomeworkStatus_()` | `85` |
| Date | date | ISO date string | `logHomeworkToNotion_()` | `"2026-04-10"` |
| TEKS | rich_text | (TEKS code string) | `logHomeworkToNotion_()` | `"4.3D"` |
| Difficulty | select | Easy, Medium, Hard | `logHomeworkToNotion_()` | `"Medium"` |
| Notes | rich_text | (free text) | `logHomeworkToNotion_()` | `"TEKS: 4.3D \| Difficulty: Medium"` |
| Student | select | Buggsy, JJ | `logHomeworkToNotion_()` | `"Buggsy"` |
| Module | rich_text | (module identifier) | `logHomeworkToNotion_()` | `"homework-module"` |
| Duration | number | (minutes) | `updateHomeworkStatus_()` | `15` |
| Attempts | number | (count) | `updateHomeworkStatus_()` | `2` |

### Pre-K Prep (`ac28bcfa-e972-428e-812d-f2281df55af9`)

| Property Name | Notion Type | Valid Values | Written By | Example |
|---------------|-------------|--------------|------------|---------|
| Skill | title | (free text) | `logSparkleToNotion_()` | `"Letter Recognition - B"` |
| Category | select | Letters, Numbers, Shapes, Colors, Phonics, Motor Skills | `logSparkleToNotion_()` | `"Letters"` |
| Status | select | Not Introduced, Practicing, Getting It, Mastered | `logSparkleToNotion_()` | `"Practicing"` |
| Date | date | ISO date string | `logSparkleToNotion_()` | `"2026-04-10"` |
| Notes | rich_text | (free text) | `logSparkleToNotion_()` | `"Recognized B in name, traced 3x"` |
| Student | select | JJ | `logSparkleToNotion_()` | `"JJ"` |
| Confidence | number | 1-5 | `logSparkleToNotion_()` | `3` |
| Module | rich_text | (module identifier) | `logSparkleToNotion_()` | `"sparkle-learn"` |

---

## Status Flows

### Homework Tracker
```
Not Started --> In Progress --> Done --> pending_review --> approved --> Turned In
```
- `Not Started`: Assignment created, not yet attempted
- `In Progress`: Student has started working
- `Done`: Student submitted answers, auto-scored
- `pending_review`: Awaiting parent review
- `approved`: Parent approved the work
- `Turned In`: Delivered to teacher / final state

### Pre-K Prep
```
Not Introduced --> Practicing --> Getting It --> Mastered
```
- `Not Introduced`: Skill not yet shown to JJ
- `Practicing`: Actively working on it, needs support
- `Getting It`: Shows understanding, occasional errors
- `Mastered`: Consistent independent success

---

## API Patterns

### Create a Page
```javascript
var payload = {
  parent: { database_id: DB_ID },
  properties: {
    // Title property
    "Assignment": { "title": [{ "text": { "content": "Math Module W3" } }] },
    // Select property
    "Status": { "select": { "name": "pending_review" } },
    // Number property
    "Score": { "number": 85 },
    // Date property
    "Date": { "date": { "start": "2026-04-10" } },
    // Rich text property
    "Notes": { "rich_text": [{ "text": { "content": "TEKS: 4.3D | Difficulty: Medium" } }] },
    // Checkbox property
    "Reviewed": { "checkbox": true },
    // URL property
    "Link": { "url": "https://example.com" }
  }
};
```

### Update a Page
```javascript
var payload = {
  properties: {
    "Status": { "select": { "name": "approved" } },
    "Score": { "number": 92 }
  }
};
// PATCH https://api.notion.com/v1/pages/{page_id}
```

### Property Type Quick Reference
```javascript
// Title
{ "PropName": { "title": [{ "text": { "content": "value" } }] } }
// Rich text
{ "PropName": { "rich_text": [{ "text": { "content": "value" } }] } }
// Select
{ "PropName": { "select": { "name": "value" } } }
// Multi-select
{ "PropName": { "multi_select": [{ "name": "tag1" }, { "name": "tag2" }] } }
// Number
{ "PropName": { "number": 42 } }
// Date
{ "PropName": { "date": { "start": "2026-04-10" } } }
// Checkbox
{ "PropName": { "checkbox": true } }
// URL
{ "PropName": { "url": "https://..." } }
```

---

## Guardrails

1. **Never guess a property name** -- fetch the database schema first if unsure. Use `queryDatabase_()` or the Notion MCP `notion-fetch` tool to inspect properties before writing.
2. **Never write to a DB you don't own** -- check the Owner column in the Database Registry above. If your module isn't listed as the owner, route through the owning module's API.
3. **Always use the Safe wrapper** -- never call the Notion API directly from client code. All writes go through `NotionEngine.gs` or `StoryFactory.gs` server-side functions wrapped in `withMonitor_()`.
4. **MCP table cell updates are unreliable** -- use `NotionEngine.gs` server-side functions instead. If you must use MCP, verify the write succeeded by reading back.
5. **Test Notion writes in sandbox mode before production** -- use the test database IDs or dry-run flags when available.

---

## Known Issues

1. **MCP table cell updates fail silently** -- the MCP `notion-update-page` tool sometimes reports success but the cell value is unchanged. Always read back after write. Flag for manual edit if the value doesn't stick.
2. **Notion icon + title update together causes double-emoji bug** -- when updating a page, set the title only. Do not include an icon property in the same PATCH call. Update icon separately if needed.
3. **old_str/new_str requires EXACT whitespace matching when updating via MCP** -- if you're using MCP tools to edit Notion content blocks, whitespace (including trailing spaces and newlines) must match exactly or the update will silently fail.
4. **Select values are case-sensitive** -- `"pending_review"` is not the same as `"Pending_Review"`. Always match the exact casing from the schema above.
5. **Date properties require ISO format** -- always use `"YYYY-MM-DD"` format. Notion rejects other date formats silently.
