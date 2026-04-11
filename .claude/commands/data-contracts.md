---
name: data-contracts
description: >
  Google Sheets data layer contracts for the Thompson platform. Use when
  building, debugging, or auditing any code that reads from or writes to
  Google Sheets tabs. Covers TAB_MAP entries, column schemas, ownership rules,
  downstream consumers, and safe-wrapper patterns. Trigger on: sheet, tab,
  column, TAB_MAP, data layer, schema, KH_, field name, sheet write, sheet
  read, data contract, getRange, getValue.
---

# Data Contracts — Google Sheets Data Layer

## Cardinal Rule

TAB_MAP in DataEngine.gs is the only source of truth for sheet tab names. Never hardcode a sheet name with emoji prefixes. If a tab name is not in TAB_MAP, add it there first.

---

## Core Data Rules

- All sheet access via `SpreadsheetApp.openById(SSID)` — never `getActiveSpreadsheet()`
- Lock acquisition: `waitLock(30000)` — never `tryLock()`
- All .gs files share one global scope — TAB_MAP, SSID, and constants from DataEngine.gs are available everywhere
- Never redeclare shared constants

---

## Tab Registry

| Tab Name (via TAB_MAP) | Owner Module | Writes | Reads | Purpose |
|---|---|---|---|---|
| KH_Chores | KidsHub.gs | resetDailyTasksAuto(), completeChore() | KidsHub.html, Parent Dashboard | Daily chore definitions and completion state |
| KH_History | KidsHub.gs | logHistory_() | ProgressReport.html, Parent Dashboard | Ring/star awards, activity log |
| KH_Education | KidsHub.gs | logHomeworkCompletion() | ProgressReport.html, EducationAlerts.js | Homework submissions, grades, TEKS tags |
| KH_LessonRuns | KidsHub.gs | logLessonRun_() | ProgressReport.html | Sparkle/education session tracking |
| KH_StoryProgress | StoryFactory.gs | (story state) | StoryLibrary.html | Story generation progress |
| QuestionLog | KidsHub.gs | logQuestion_() | ProgressReport, ContentEngine, EducationAlerts | Per-question accuracy data for trends |
| Dashboard_Export | DataEngine.gs | (computed) | ThePulse.html, TheVein.html | Financial dashboard data |
| Debt_Export | DataEngine.gs | (computed) | ThePulse.html | Debt cascade data |
| DebtModel | DataEngine.gs | (computed) | CascadeEngine.gs | Debt modeling |
| ErrorLog | GASHardening.gs | logError_() | diagPreQA(), deploy verification | Runtime error tracking |
| PerfLog | GASHardening.gs | logPerf_() | diagnostics | Performance monitoring |
| Close History | MonitorEngine.gs | stampCloseMonth_() | MER gates | Month-end review tracking |

---

## Column Schemas (Education-Critical Tabs)

**Important:** These are best-effort from code analysis. The actual columns must be verified by reading the sheet header row. Always grep the actual getRange/getValue calls to verify column positions before writing code against them.

### KH_Education

| Column | Name | Data Type | Written By | Example Value |
|---|---|---|---|---|
| A | Timestamp | DateTime | logHomeworkCompletion() | 2026-04-10T08:30:00 |
| B | Child | String | logHomeworkCompletion() | buggsy |
| C | Subject | String | logHomeworkCompletion() | math |
| D | Topic | String | logHomeworkCompletion() | fractions |
| E | Score | Number | logHomeworkCompletion() | 85 |
| F | Total | Number | logHomeworkCompletion() | 100 |
| G | Grade | String | logHomeworkCompletion() | B |
| H | TEKS | String | logHomeworkCompletion() | 4.3F |
| I | Source | String | logHomeworkCompletion() | homework |

### QuestionLog

| Column | Name | Data Type | Written By | Example Value |
|---|---|---|---|---|
| A | Timestamp | DateTime | logQuestion_() | 2026-04-10T08:31:00 |
| B | Child | String | logQuestion_() | buggsy |
| C | Subject | String | logQuestion_() | math |
| D | Question | String | logQuestion_() | What is 3/4 + 1/2? |
| E | StudentAnswer | String | logQuestion_() | 5/4 |
| F | CorrectAnswer | String | logQuestion_() | 5/4 |
| G | Correct | Boolean | logQuestion_() | TRUE |
| H | TEKS | String | logQuestion_() | 4.3F |
| I | SessionId | String | logQuestion_() | abc123 |

### KH_LessonRuns

| Column | Name | Data Type | Written By | Example Value |
|---|---|---|---|---|
| A | Timestamp | DateTime | logLessonRun_() | 2026-04-10T08:25:00 |
| B | Child | String | logLessonRun_() | jj |
| C | Module | String | logLessonRun_() | sparkle |
| D | Topic | String | logLessonRun_() | letter-sounds |
| E | Duration | Number | logLessonRun_() | 420 |
| F | QuestionsAttempted | Number | logLessonRun_() | 10 |
| G | QuestionsCorrect | Number | logLessonRun_() | 8 |
| H | CompletionStatus | String | logLessonRun_() | completed |

---

## Ownership Rules

- Only the Owner Module should write to a tab
- Cross-module reads are fine — cross-module writes are forbidden
- If you need to write to a tab you do not own, add a function to the owner module and call that
- Every write function should use `waitLock(30000)`
- Every `google.script.run` call must have `withFailureHandler()`

---

## Safe Wrapper Pattern

```javascript
// Pattern: every public function gets a Safe wrapper
function doThingSafe(args) {
  return withMonitor_('doThingSafe', function() {
    var lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      return doThing_(args);
    } finally {
      lock.releaseLock();
    }
  });
}
```

---

## Downstream Consumer Map

Which surfaces depend on which tabs:

- **ThePulse:** Dashboard_Export, Debt_Export
- **TheVein:** Dashboard_Export
- **KidsHub (Buggsy/JJ boards):** KH_Chores, KH_History
- **Parent Dashboard:** KH_Chores, KH_History, KH_Education
- **ProgressReport:** KH_Education, KH_History, KH_LessonRuns, QuestionLog
- **Daily Missions:** KH_Education (completion state)
- **EducationAlerts:** KH_Education, QuestionLog

---

## Guardrails

- Never write to a sheet tab owned by another module
- Never use emoji in tab name references — TAB_MAP handles that
- Always verify column positions by grepping actual code before writing
- DataEngine.gs is ~4000 lines — always chunk-read (1500 lines at a time)
- If a new tab is needed, add it to TAB_MAP first, then build the read/write functions
