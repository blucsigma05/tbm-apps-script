# Google Apps Script — Build Standards & Conventions (v3.1)

**Standards-Version: GAS-v3.1**

> **This is the permanent source of truth for GAS projects that adopt this standard.**
> The editable canonical copy lives in Git. Notion is a read-only mirror for discovery,
> onboarding, and operator access.
>
> These standards are battle-tested across **300+ cumulative production file versions**
> of a multi-surface GAS platform serving dashboards, kid-facing apps, approval flows,
> ambient displays, and triggered automations from a single Apps Script project.
>
> **Scope split:**
> - **Core Standard** — universal GAS patterns and process rules
> - **Profile: Single-Workbook Web App** — additional requirements for bound-workbook,
>   multi-surface HTML, kiosk/WebView, Cloudflare Worker proxy, and ambient display deployments

---

# Part 0 — Project Initialization

## 0. Mandatory Project Initialization

Every new GAS project MUST start from the official base template. If a project does not
start from this template, development MUST stop until it is rebuilt from it.

### 0.1 — Why This Exists

Developers rarely read the whole standards document before coding. They start building,
then search when they hit a problem. By the time they find the rule, the wrong pattern is
already in the codebase.

The base template removes that risk. The project starts with working scaffolding, versioned
modules, monitoring, and deployment checks already in place.

### 0.2 — Required Template Contents

Every new GAS project MUST begin with these files already present:

| File | Contents | Why |
|------|----------|-----|
| `Code.gs` | `doGet()` router, `doPost()` shell, `getCodeVersion()`, cache bust Safe wrapper | Single entry point established from day one |
| `DataEngine.gs` | `getDataEngineVersion()`, `TAB_MAP` skeleton, `SSID` constant, `de_getWorkbook_()` | Workbook access and tab ownership are established immediately |
| `GASHardening.gs` | `getGASHardeningVersion()`, `logError_()`, `logPerf_()`, `withMonitor_()`, `setupErrorLogSheet()`, `setupPerfLogSheet()`, `auditTriggers()`, `cleanOrphanedTriggers()`, `getDeployedVersions()` | Monitoring exists before the first bug |
| `SmokeTest.gs` | `getSmokeTestVersion()`, `smokeTest()` with template, wiring, schema, environment, trigger, and contract categories | Deploy gate exists before the first deploy |
| `RegressionSuite.gs` | `getRegressionSuiteVersion()`, `regressionSuite()` with empty BUG/ENV/PERF assertion arrays | Regression framework exists before the first bug fix |

### 0.3 — Required Sheet Tabs

Run these setup functions once from the editor before writing any application code:

```javascript
setupErrorLogSheet(); // creates 💻 ErrorLog
setupPerfLogSheet();  // creates 💻 PerfLog
```

### 0.4 — First-Run Validation

After creating the project from the template, run `getDeployedVersions()` from the editor.
Every module MUST return a number. If any module returns `'?'`, the template was not set up
correctly.

```javascript
{
  DataEngine: 1,
  Code: 1,
  GASHardening: 1,
  SmokeTest: 1,
  RegressionSuite: 1,
  _timestamp: '2026-03-26T...'
}
```

### 0.5 — Project Metadata (document externally)

Before writing application code, record these decisions in the project's README, Notion page,
or wiki:

```text
PROJECT INITIALIZATION RECORD
─────────────────────────────
Project Name:         [name]
Standards-Version:    GAS-v3.1
Profile:              Core / Core + Single-Workbook Web App
SSID:                 [spreadsheet ID]
Created:              [date]
Stability Threshold:  Defined / Not Yet (MUST be defined before file version 20)
Target Surfaces:      [dashboard, kiosk, workflow, automation, etc.]
ES5 Required:         Yes / No (Yes if ANY surface targets WebView/kiosk)
Trigger Budget:       [planned triggers] / 20 max
Required Properties:  [API_SECRET, PUSHOVER_TOKEN, ...]
Owner:                [who is responsible for production stability]
```

Every adopting repo MUST also declare `Standards-Version: GAS-v3.1` in its README.

### 0.6 — Template Compliance Gate

The smoke test includes a Template Compliance check (Category 0). If the project was not
initialized from the template, the check fails and the build score drops to `BLOCKED`
regardless of every other category.

```javascript
function checkTemplateCompliance_() {
  var result = {
    status: 'PASS',
    description: 'Project started from official base template',
    details: '',
    missing: []
  };

  var requiredVersionFns = [
    'getDataEngineVersion',
    'getCodeVersion',
    'getGASHardeningVersion',
    'getSmokeTestVersion',
    'getRegressionSuiteVersion'
  ];
  var i;
  for (i = 0; i < requiredVersionFns.length; i++) {
    if (typeof this[requiredVersionFns[i]] !== 'function') {
      result.missing.push(requiredVersionFns[i] + ' (version function)');
    }
  }

  var requiredInfraFns = [
    'logError_',
    'logPerf_',
    'withMonitor_',
    'auditTriggers',
    'getDeployedVersions',
    'de_getWorkbook_'
  ];
  for (i = 0; i < requiredInfraFns.length; i++) {
    if (typeof this[requiredInfraFns[i]] !== 'function') {
      result.missing.push(requiredInfraFns[i] + ' (infrastructure)');
    }
  }

  var ss = de_getWorkbook_();
  var requiredSheets = ['💻 ErrorLog', '💻 PerfLog'];
  for (i = 0; i < requiredSheets.length; i++) {
    if (!ss.getSheetByName(requiredSheets[i])) {
      result.missing.push(requiredSheets[i] + ' (sheet)');
    }
  }

  if (result.missing.length > 0) {
    result.status = 'FAIL';
    result.details = 'Missing template components: ' + result.missing.join(', ');
  } else {
    result.details = 'All template components present.';
  }

  return result;
}
```

---

# Part I — Structural Standards

## 1. File Structure & Naming Conventions

### 1.1 — `.gs` File Naming

Every `.gs` file in the project MUST be named with PascalCase matching its logical module
name.

```text
DataEngine.gs      — core computation
Code.gs            — router + API surface
KidsHub.gs         — kid-facing feature server
GASHardening.gs    — monitoring, logging, maintenance
CascadeEngine.gs   — simulation engine
MonitorEngine.gs   — gates + close operations
CalendarSync.gs    — calendar integration
AlertEngine.gs     — notification rules
StoryFactory.gs    — narrative content engine
```

Rules:
- One module per `.gs` file
- The filename IS the module name
- Never create `Utilities.gs`, `Helpers.gs`, or `Misc.gs`

### 1.2 — When to Create a New `.gs` File

Create a new `.gs` file when ALL are true:
1. The functionality has a distinct responsibility
2. It will own at least one sheet tab OR expose at least one Safe wrapper OR manage at least one trigger
3. It has at least 3 related functions

### 1.3 — Version Functions

Every `.gs` file MUST have a version function as its first meaningful line:

```javascript
function getDataEngineVersion() { return 72; }
```

Rules:
- Return a number, never a string
- Increment by exactly 1 on every edit
- Never skip or decrement versions
- Never keep inline changelog comments in code files

### 1.4 — Function Naming Conventions

GAS shares a single global scope across all `.gs` files. If two files define the same
function name, the last one loaded wins silently.

| Type | Pattern | Example |
|------|---------|---------|
| Private/internal | `modulePrefix_functionName_()` | `de_buildPayload_()` |
| Safe wrapper | `descriptiveNameSafe()` | `getSimulatorDataSafe()` |
| Version function | `get<ModuleName>Version()` | `getDataEngineVersion()` |
| Setup (one-time) | `setup<Thing>()` | `setupErrorLogSheet()` |
| Trigger installer | `install<TriggerName>()` | `installDailySync()` |
| Trigger handler | `handle<EventName>()` or `on<EventName>()` | `handleDailySync()` |
| Diagnostic | `diag_<thing>()` | `diag_debtPayload()` |

Module prefixes:

| Module | Prefix |
|--------|--------|
| DataEngine | `de_` |
| KidsHub | `kh_` |
| CascadeEngine | `ce_` |
| MonitorEngine | `me_` |
| CalendarSync | `cs_` |
| AlertEngine | `ae_` |
| StoryFactory | `sf_` |
| GASHardening | `gh_` |

Before adding any new function:
1. Search all `.gs` files for the exact name
2. Search for similar names doing the same job
3. Reuse or extend the canonical implementation instead of creating a parallel version

### 1.5 — Variable Naming Conventions

```javascript
var CACHE_KEY = 'DE_PAYLOAD';
var CACHE_TTL = 900;
var totalDebt = 0;
var de_cachedPayload = null;
var isApproved = false;
```

### 1.6 — Sheet/Tab Naming Conventions

| Icon | Meaning | Rule |
|------|---------|------|
| 🔒 | Tiller-owned / locked | Read-only for scripts except explicit upstream syncs |
| 💻🧮 | Computed / derived / control | Script-owned |
| 🧹📅 | Feature module tabs | Owned by a specific `.gs` file |
| ⌚📦 | Vault / collections | Specialty storage |
| ❌ | Deprecated | Do not reference in new code |

Raw sheet names belong only inside `TAB_MAP`.

## 2. Module Ownership Rules

### 2.1 — Sheet Tab Ownership

Every sheet tab MUST have exactly one `.gs` file that writes to it.

```text
// DataEngine.gs
// WRITES TO: DebtModel, CashFlowForecast, Dashboard_Export
// READS FROM: Transactions, BalanceHistory, Budget, Helpers
```

Rules:
- Document ownership at the top of each module
- If two modules need to write the same tab, one of them is wrong
- The smoke test SHOULD verify no duplicate writers exist

### 2.2 — Constant Ownership

Constants MUST be defined in exactly one file. GAS global scope already shares them across
modules.

### 2.3 — `TAB_MAP` Ownership

`TAB_MAP` is defined once, typically in `DataEngine.gs`. Other files reference it. They do
not redeclare it.

### 2.4 — Pattern Registry

| Pattern | Canonical File | Function(s) |
|---------|---------------|-------------|
| Error logging | `GASHardening.gs` | `logError_()` |
| Performance monitoring | `GASHardening.gs` | `logPerf_()`, `withMonitor_()` |
| Tab name lookup | `DataEngine.gs` | `TAB_MAP` |
| Version reporting | `GASHardening.gs` | `getDeployedVersions()` |
| Cache read/write | `Code.gs` or data engine | `getCachedPayload_()`, `setCachedPayload_()` |
| Trigger audit | `GASHardening.gs` | `auditTriggers()` |
| Workbook reference | `DataEngine.gs` | `SSID`, `de_getWorkbook_()` |
| Idempotency check | Per-module | `historyUIDExists_()` |

## 3. Architecture Guardrails

### 3.1 — One Implementation Per Concept

If a concept exists in the codebase, there is exactly one implementation of it.

### 3.2 — No Client-Side Financial Calculations

Display-only dashboards do zero financial calculations. All math happens server-side. The
one permitted exception is client-side-only simulation that uses server inputs, does not
persist results, and is clearly labeled simulated/projected.

### 3.3 — Data Flow Direction

Source → Sheets → DataEngine → Safe Wrappers → HTML surfaces

Dashboards MUST NOT:
- Write to sheets except through explicit Safe wrappers
- Call another dashboard's server function directly
- Depend on `localStorage` or `sessionStorage` for truth
- Hardcode live data values

### 3.4 — The `doGet()` Router Pattern `[Profile: Single-Workbook Web App]`

All HTML surfaces are served by a single `doGet(e)` in `Code.gs`.

```javascript
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'pulse';

  var pageMap = {
    // Core surfaces
    'pulse': 'ThePulse',
    'vein': 'TheVein',

    // Kids
    'kidshub': 'KidsHub',

    // Education
    'homework': 'HomeworkModule',
    'sparkle': 'SparkleLearn',
    'reading': 'ReadingModule',
    'writing': 'WritingModule',

    // Ambient
    'spine': 'TheSpine',
    'soul': 'TheSoul'
  };

  var htmlFile = pageMap[page] || 'ThePulse';

  return HtmlService.createHtmlOutputFromFile(htmlFile)
    .setTitle('TBM — ' + htmlFile)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

Rules:
- One `doGet()` in the entire project
- All routes go through `pageMap`
- When the map grows beyond ~8 routes, organize with in-map comments by domain
- `ALLOWALL` is required for kiosk/WebView targets

See also Part IV and §17.

### 3.5 — `doPost()` / API Surface Standard

All web app POST traffic goes through a single `doPost(e)` in `Code.gs`.

Rules:
- There is exactly one `doPost()` in the project
- POST requests are parsed as JSON with `try/catch`
- External actions dispatch through an allowlist map, never dynamic function names from the request body
- External callers MUST include a shared secret validated against Script Properties
- JSON responses always use `ContentService.createTextOutput(JSON.stringify(...))`
- Error responses follow the same `{ error: true, message: '...' }` contract used by Safe wrappers
- If callers can retry or hammer the endpoint, add idempotency and rate-aware guards

```javascript
function doPost(e) {
  var payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: 'invalid_json'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var actionMap = {
    'pipelineRelaySafe': pipelineRelaySafe,
    'runTestsSafe': runTestsSafe
  };

  var action = payload && payload.action;
  var fn = actionMap[action];
  if (typeof fn !== 'function') {
    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: 'unknown_action'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var secret = payload.secret;
  var expected = PropertiesService.getScriptProperties().getProperty('API_SECRET');
  if (!secret || secret !== expected) {
    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: 'unauthorized'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var result = fn(payload);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err2) {
    logError_('doPost', err2);
    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: err2.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 3.6 — Config / Environment Standard

Every project documents its required Script Properties and validates them at boot.

Rules:
- Required properties appear in the initialization record and README
- Property names use `UPPER_SNAKE_CASE`
- Prefix by concern: `API_`, `PUSH_`, `CF_`, `FEATURE_`
- Property values MUST NEVER appear in logs, error sheets, or client payloads
- The smoke test validates required properties are present and non-empty

```javascript
function checkEnvironment_() {
  var required = ['API_SECRET', 'PUSHOVER_TOKEN', 'PUSHOVER_USER_LT'];
  var props = PropertiesService.getScriptProperties();
  var missing = [];
  var i;
  for (i = 0; i < required.length; i++) {
    if (!props.getProperty(required[i])) {
      missing.push(required[i]);
    }
  }
  return {
    status: missing.length > 0 ? 'FAIL' : 'PASS',
    missing: missing
  };
}
```

Logging rule:

```javascript
Logger.log('Using API key: [REDACTED]');
```

## 4. Version System

### 4.1 — File Version (Integer)

Every `.gs` file carries an integer file version through its version function.

### 4.2 — Project Version (Semantic)

The project as a whole uses semantic versioning tracked externally.

| Level | When | Examples |
|-------|------|----------|
| Patch | Bug fix, UI tweak, validation | Null check, CSS fix, logging improvement |
| Minor | New feature following existing patterns | New dashboard section, new Safe wrapper |
| Major | Structural or architectural change | Tab rename, router change, workflow architecture change |

Project version never appears in code.

## 5. Version Threshold System

Every project MUST define a Stability Threshold before v1 ships.

### 5.1 — Phase Definitions

**Build Phase (file versions 1–10):**
- Architecture evolving
- Breaking changes allowed

**Growth Phase (11–25):**
- Architecture locked
- Features must follow established patterns
- No new architectural patterns without review

**Stability Phase (26+):**
- Architecture frozen
- Only patch/minor work without formal exception
- Every change requires a regression assertion

### 5.2 — Enforcement

If any module reaches version 20 without a documented threshold, deployment MUST stop.

```javascript
function checkVersionThresholds_() {
  var versions = getDeployedVersions();
  var warnings = [];
  var moduleName;
  for (moduleName in versions) {
    if (moduleName === '_timestamp') continue;
    if (typeof versions[moduleName] === 'number' && versions[moduleName] >= 20) {
      warnings.push(moduleName + ' is at v' + versions[moduleName] +
        ' — verify Stability Threshold is documented');
    }
  }
  return {
    status: warnings.length > 0 ? 'WARN' : 'PASS',
    warnings: warnings
  };
}
```

## 6. Schema Protection Rules

### 6.1 — Column References: Header Lookup, Not Position

Preferred read-heavy pattern:

```javascript
function de_getHeaderMap_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  var i;
  for (i = 0; i < headers.length; i++) {
    if (headers[i]) map[String(headers[i]).trim()] = i;
  }
  return map;
}
```

Preferred write-heavy pattern:

```javascript
var KH_REQUESTS_SCHEMA = {
  COLS: ['Timestamp', 'Kid', 'TaskName', 'Status', 'CompletedAt',
    'ApprovedBy', 'ApprovedAt', 'BonusAmount', 'UID', 'TaskID'],
  indexOf: function(name) {
    var i;
    for (i = 0; i < this.COLS.length; i++) {
      if (this.COLS[i] === name) return i;
    }
    throw new Error('KH_REQUESTS_SCHEMA: Unknown column "' + name + '"');
  }
};
```

Rules:
- If you read more than 2 columns, use a header map or schema constant
- Append new columns to the right
- Smoke test validates schema alignment

### 6.2 — Column Modification Rules

1. New columns go to the right
2. Never delete a column without searching all code for references
3. Never rename a header without updating all schema references
4. Smoke tests fail until schema constants are updated

### 6.3 — Row Range Safety

```javascript
var lastRow = sheet.getLastRow();
var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
```

Rules:
- Never hardcode capped ranges unless justified
- Warn when caps are being approached
- Prefer script-computed values over complex stale-prone sheet formulas when reliability matters

### 6.4 — Formula Protection

```javascript
function de_safeSetValue_(sheet, row, col, value) {
  var existing = sheet.getRange(row, col).getFormula();
  if (existing) {
    throw new Error('Attempted to overwrite formula in ' + sheet.getName() +
      ' R' + row + 'C' + col + ': ' + existing);
  }
  sheet.getRange(row, col).setValue(value);
}
```

### 6.5 — Sheet Protection

| Tab Type | Protection Level |
|----------|------------------|
| 🔒 Tiller-owned | Sheet-level protection |
| 💻🧮 Control tabs | Protected ranges on critical columns |
| 🧹📅 Feature tabs | Script writes only |

## 7. Anti-Drift Rules

### 7.1 — The Duplication Check

Before writing any new function, search for:
1. The exact function name
2. Similar names for the same concept
3. Existing implementations in other modules

### 7.2 — The Reviewer's Question

If a reviewer flags the same issue in two consecutive reviews, it is priority-zero and MUST
be fixed before any other work.

### 7.3 — The Rename Rule

Never rename a function, constant, sheet tab, or header without updating every `.gs` and
`.html` reference in the same change.

### 7.4 — The “Works in Editor” Trap

What works in the editor can fail silently in production:

| Works in Editor | Fails in Production | Why |
|----------------|--------------------|-----|
| `getActiveSpreadsheet()` | Trigger context | No active sheet context |
| Simple trigger with authorized service | `onEdit()` + `MailApp` | Restricted permissions |
| Wrong handler name run manually | Trigger execution | Trigger calls missing handler name |
| ES6 in HTML | Older kiosk/WebView | Syntax error |
| `Logger.log()` review only | Trigger diagnosis | Output is ephemeral |

Always verify in the actual runtime context.

---

# Part II — Operational Patterns

## 8. Safe Wrapper Pattern

Every function exposed to `google.script.run` gets a `*Safe` wrapper.

### 8.1 — Basic Pattern

```javascript
function de_getReportData_(params) {
  return {};
}

function getReportDataSafe(params) {
  try {
    return de_getReportData_(params);
  } catch (e) {
    logError_('getReportDataSafe', e);
    return { error: true, message: e.message };
  }
}
```

### 8.2 — Enhanced Pattern

```javascript
function getReportDataSafe(params) {
  return withMonitor_('getReportDataSafe', function() {
    return JSON.parse(JSON.stringify(de_getReportData_(params)));
  });
}
```

### 8.3 — Serialization Rule

Every Safe wrapper MUST return JSON-safe values.

### 8.4 — Error Response Contract

Success returns the payload directly.

Error returns:

```javascript
{ error: true, message: 'Human-readable error description' }
```

## 9. Error Logging

### 9.1 — Setup (run once)

```javascript
function setupErrorLogSheet() {
  var ss = de_getWorkbook_();
  var sheet = ss.getSheetByName('💻 ErrorLog');
  if (!sheet) {
    sheet = ss.insertSheet('💻 ErrorLog');
    sheet.appendRow(['Timestamp', 'Function', 'Error Message', 'Stack Trace', 'Duration (s)']);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
  }
}
```

### 9.2 — Logger Function

```javascript
function logError_(functionName, error, durationSec) {
  try {
    var ss = de_getWorkbook_();
    var sheet = ss.getSheetByName('💻 ErrorLog');
    if (!sheet) return;

    var msg = (error && error.message) ? error.message : String(error);
    var stack = (error && error.stack) ? error.stack : '';
    var dur = (typeof durationSec === 'number') ? durationSec.toFixed(2) : '';

    sheet.appendRow([
      new Date().toISOString(),
      functionName,
      msg,
      stack,
      dur
    ]);

    var totalRows = sheet.getLastRow();
    if (totalRows > 501) {
      sheet.deleteRows(2, totalRows - 501);
    }
  } catch (e) {
    console.warn('logError_ failed: ' + e.message);
  }
}
```

### 9.3 — Concurrency Note

`logError_()` intentionally does **not** use `LockService`. This avoids deadlocks when errors
occur inside already-locked business-state paths. See §11 for the explicit lock exceptions list.

## 10. Performance Monitoring

### 10.1 — Performance Logger

```javascript
function logPerf_(functionName, durationSec, status, note) {
  try {
    console.log('⏱ ' + functionName + ': ' + durationSec.toFixed(2) + 's [' + status + ']');

    if (durationSec > 3 || status === 'ERROR') {
      var ss = de_getWorkbook_();
      var sheet = ss.getSheetByName('💻 PerfLog');
      if (!sheet) return;
      sheet.appendRow([
        new Date().toISOString(),
        functionName,
        parseFloat(durationSec.toFixed(2)),
        status,
        note || ''
      ]);
    }
  } catch (e) {
    console.warn('logPerf_ failed: ' + e.message);
  }
}
```

### 10.2 — Monitor Wrapper

```javascript
function withMonitor_(name, fn) {
  var start = new Date().getTime();
  try {
    var result = fn();
    var elapsed = (new Date().getTime() - start) / 1000;
    logPerf_(name, elapsed, 'OK');
    return result;
  } catch (e) {
    var elapsedErr = (new Date().getTime() - start) / 1000;
    logPerf_(name, elapsedErr, 'ERROR', e.message);
    logError_(name, e, elapsedErr);
    throw e;
  }
}
```

### 10.3 — Setup (run once)

```javascript
function setupPerfLogSheet() {
  var ss = de_getWorkbook_();
  var sheet = ss.getSheetByName('💻 PerfLog');
  if (!sheet) {
    sheet = ss.insertSheet('💻 PerfLog');
    sheet.appendRow(['Timestamp', 'Function', 'Duration (s)', 'Status', 'Note']);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
  }
}
```

## 11. LockService — Concurrency Control

**Every business-state write path MUST use LockService.**

### 11.1 — Standard Write Pattern

```javascript
function kh_writeRecord_(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return { error: true, message: 'System is busy — please try again in a few seconds' };
  }

  try {
    var ss = de_getWorkbook_();
    var sheet = ss.getSheetByName(TAB_MAP['History'] || 'History');
    sheet.appendRow([new Date(), payload.name, payload.value]);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}
```

### 11.2 — Lock Timeout Guidelines

| Context | Timeout |
|---------|---------|
| Interactive Safe wrapper | `15000` |
| Background trigger | `30000` |
| Money-path write | `30000` |
| Bulk operation | `60000` |

### 11.3 — Lock Rules

1. Prefer `waitLock()` to `tryLock()`
2. Never release and reacquire within one logical transaction
3. Always release in `finally`
4. Never nest script locks

### 11.4 — Explicit Lock Exceptions

The lock rule applies to business-state writes. These exceptions are intentionally unlocked:
- `logError_()` — avoids deadlock inside already-locked failure paths
- `logPerf_()` — same rationale
- Append-only diagnostic or audit logs where occasional duplicates are acceptable and locking would degrade the primary path

## 12. CacheService — Payload Caching

### 12.1 — Constants

```javascript
var CACHE_KEY = 'DE_PAYLOAD';
var CACHE_TTL = 900;
var CHUNK_SIZE = 90000;
```

### 12.2 — Chunked Cache Pattern

Use chunking for payloads approaching the 100KB per-key limit.

```javascript
function setCachedPayload_(cacheKey, payload, ttl) {
  try {
    var json = JSON.stringify(payload);
    var cache = CacheService.getScriptCache();
    if (json.length <= CHUNK_SIZE) {
      cache.put(cacheKey, json, ttl || CACHE_TTL);
      cache.remove(cacheKey + '_chunks');
      return;
    }

    var chunks = [];
    var i;
    for (i = 0; i < json.length; i += CHUNK_SIZE) {
      chunks.push(json.substring(i, i + CHUNK_SIZE));
    }

    var pairs = {};
    pairs[cacheKey + '_chunks'] = String(chunks.length);
    for (i = 0; i < chunks.length; i++) {
      pairs[cacheKey + '_' + i] = chunks[i];
    }
    cache.putAll(pairs, ttl || CACHE_TTL);
    cache.remove(cacheKey);
  } catch (e) {
    console.warn('setCachedPayload_ failed: ' + e.message);
  }
}
```

### 12.3 — Cache Bust Function

Expose an explicit cache bust function.

### 12.4 — Cache Rules

1. Cache failures are non-fatal
2. If payload exceeds ~500KB, split the endpoint instead
3. Use `putAll()` for chunk writes
4. Warn when payload size approaches the single-key limit

## 13. Idempotency Guards

Prevent duplicate writes from retries and double-clicks.

### 13.1 — Client-Side UID Generation

```javascript
var uid = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
```

### 13.2 — Server-Side Duplicate Check

```javascript
function kh_historyUIDExists_(sheet, uid, uidColIndex) {
  var data = sheet.getDataRange().getValues();
  var i;
  for (i = 0; i < data.length; i++) {
    if (data[i][uidColIndex] === uid) return true;
  }
  return false;
}
```

### 13.3 — Combined Pattern

Do the duplicate check inside the lock scope.

## 14. `TAB_MAP` Pattern

Never hardcode sheet names in code.

### 14.1 — Definition

```javascript
var TAB_MAP = {
  'Transactions': '🔒 Transactions',
  'BalanceHistory': '🔒 Balance History',
  'Accounts': '🔒 Accounts',
  'Categories': '🔒 Categories',
  'Budget': '💻🧮 Budget_Data',
  'DebtModel': '💻🧮 DebtModel',
  'Helpers': '💻🧮 Helpers',
  'CashFlowForecast': '💻🧮 CashFlowForecast',
  'BankRec': '💻🧮 BankRec',
  'CloseHistory': '💻🧮 Close History',
  'KH_Rewards': '🧹📅 KH_Rewards',
  'KH_History': '🧹📅 KH_History',
  'KH_Requests': '🧹📅 KH_Requests',
  'ErrorLog': '💻 ErrorLog',
  'PerfLog': '💻 PerfLog'
};
```

### 14.2 — Usage

```javascript
var sheet = ss.getSheetByName(TAB_MAP['Transactions']);
```

### 14.3 — Keeping `TAB_MAP` Current

Add every new tab here in the same change that introduces it.

### 14.4 — `TAB_MAP` Validation

```javascript
function checkTabMap_() {
  var ss = de_getWorkbook_();
  var results = { status: 'PASS', details: [] };
  var logicalName;
  for (logicalName in TAB_MAP) {
    if (!ss.getSheetByName(TAB_MAP[logicalName])) {
      results.status = 'WARN';
      results.details.push(logicalName + ' → "' + TAB_MAP[logicalName] + '" (NOT FOUND)');
    }
  }
  return results;
}
```

## 15. Trigger Management

GAS allows only 20 installable triggers per project.

### 15.1 — Simple vs. Installable Triggers

| Feature | Simple | Installable |
|---------|--------|-------------|
| Runs as | Limited permissions | Creating user |
| Can send email | No | Yes |
| Can call `UrlFetchApp` | No | Yes |
| Counts toward 20 limit | No | Yes |

Rule: if a handler uses any authorized service, it MUST be installable.

### 15.2 — Audit Function

```javascript
function auditTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var i;
  for (i = 0; i < triggers.length; i++) {
    var handler = triggers[i].getHandlerFunction();
    var exists = typeof this[handler] === 'function';
    Logger.log((exists ? '✓' : '✗ ORPHAN') + ' | ' + handler);
  }
}
```

### 15.3 — Idempotent Install Pattern

Always remove before install.

### 15.4 — Trigger Rules

1. Check quota before installing
2. Every trigger handler needs install/remove functions
3. Do not rely on simple triggers for authorized services
4. Clean orphaned triggers periodically

## 16. ES5 Compliance `[Profile: Single-Workbook Web App]`

If any HTML surface serves older WebView, kiosk, or Fire TV targets, client-side JS MUST be
ES5-safe.

### 16.1 — Banned Constructs in HTML Files

| Banned | Use Instead | Why |
|--------|-------------|-----|
| `let` / `const` | `var` | Older WebView |
| `=>` | `function() {}` | Syntax error |
| Template literals | Concatenation | Syntax error |
| `?.` | Guard chains | Syntax error |
| `??` | Explicit fallback | Syntax error |
| `async` / `await` | Callbacks / `.then()` | Not supported |
| Destructuring | Manual assignment | Syntax error |
| Default params | Explicit fallback | Syntax error |
| Spread | `slice` / loops | Syntax error |
| `for...of` | Indexed loop | Not supported |
| `Array.includes()` | `indexOf()` | Not supported |
| `Array.find()` | `for` loop + `break` | Not supported |
| `Array.from()` | `Array.prototype.slice.call()` | Not supported |
| `Object.entries()` | `for...in` | Not supported |
| `Object.assign()` | Manual copy loop | Not supported |
| `String.padStart()` | Manual padding | Not supported |
| `String.startsWith()` | `indexOf(prefix) === 0` | Not supported |
| `String.endsWith()` | `indexOf(suffix, str.length - suffix.length) !== -1` | Not supported |
| `URLSearchParams` | Manual query parsing | Not supported |
| `Promise` | Callbacks | Not supported |
| `backdrop-filter` | Solid backgrounds | Unsupported in Fire TV WebView |

### 16.2 — Where This Applies

- HTML client JS: ES5 mandatory for affected targets
- `.gs` server files: modern GAS V8 syntax is allowed unless project constraints say otherwise

See also Part IV.

## 17. HTML Dashboard Pattern `[Profile: Single-Workbook Web App]`

### 17.1 — Data Loading

```javascript
function loadDashboard() {
  showLoading();
  google.script.run
    .withSuccessHandler(function(data) {
      hideLoading();
      if (data && data.error) {
        showError(data.message);
        return;
      }
      renderDashboard(data);
    })
    .withFailureHandler(function(err) {
      hideLoading();
      showError('Server error: ' + (err && err.message ? err.message : 'Unknown'));
    })
    .getReportDataSafe();
}
```

### 17.2 — Dashboard Rules

1. All live data comes from the server
2. Check `data.error` in success handlers
3. Display-only dashboards do zero server-owned business math
4. Include build metadata in payloads
5. Reload when tab becomes visible again

```javascript
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    loadDashboard();
  }
});
```

### 17.3 — Polling Pattern for Live Displays

```javascript
var POLL_INTERVAL = 300000;

function startPolling() {
  loadDashboard();
  setInterval(function() {
    loadDashboard();
  }, POLL_INTERVAL);
}
```

Rules:
- Never poll faster than every 60 seconds
- Use caching for heavy shared payloads
- Stagger multi-surface refresh intervals

See Part IV for ambient-display guidance.

---

# Part III — Process Standards

## 18. Pre-Build Checklist

```text
□ ARCHITECTURE REVIEW
  □ Existing module or new module?
  □ If new: distinct responsibility and ownership?

□ MODULE OWNERSHIP CHECK
  □ Which tabs are read?
  □ Which tabs are written?
  □ Is any write target already owned elsewhere?

□ NAMING CONVENTION REVIEW
  □ Names follow §1.4
  □ No collisions across all `.gs` files

□ SCHEMA IMPACT ASSESSMENT
  □ New columns append right
  □ New tabs added to TAB_MAP
  □ Existing sheet reads use headers/schema

□ TRIGGER QUOTA CHECK
  □ Run auditTriggers()
  □ Remain within the 20-trigger cap

□ VERSION THRESHOLD CHECK
  □ Current phase identified
  □ Change type allowed in that phase
```

## 19. Pre-Deploy Checklist

```text
□ CODE COMPLETE
  □ Version function bumped in every edited `.gs` file
  □ No TODO/FIXME in changed production code
  □ New sheet references use TAB_MAP

□ DIAGNOSTIC VERIFICATION
  □ Diagnostic function written
  □ Diagnostic run
  □ Runtime output verified

□ SMOKE TEST
  □ Run smoke test
  □ All critical categories PASS

□ REGRESSION SUITE
  □ Run regression suite
  □ Add new assertion for the bug being fixed

□ BUILD SCORE
  □ Score computed automatically
  □ Score is not HOLD or BLOCKED

□ DEPLOYMENT
  □ Update EXISTING deployment
  □ Do not create a new deployment URL

□ POST-DEPLOY VERIFICATION
  □ Hard refresh all served pages
  □ Verify build timestamp / version numbers
  □ Check ErrorLog and PerfLog
```

### 19.1 — `clasp` Deploy Workflow (alternative to manual editor deploy)

```text
□ CLASP DEPLOY WORKFLOW
  □ Edit locally in the project directory
  □ `clasp push`
  □ Run `?action=runTests` against the deployed URL
  □ If PASS: `clasp deploy`
  □ Git: create branch, commit, push, open PR
  □ CI/Gemini review the PR against standards
  □ Merge on pass
  □ Update Active Versions tracking (README or Notion)
```

`clasp push` uploads the entire project. There is no selective push. Treat each push as a
full-file replacement deployment event.

## 20. Production Failure Playbook

### Step 1 — Immediate Triage

Classify the failure: outage, UI failure, data corruption, silent failure, or performance.

### Step 2 — Check the Code First

1. Open ErrorLog
2. Open PerfLog
3. Check Apps Script executions
4. Read the code path that failed

### Step 3 — Write a Diagnostic Script

```javascript
function diag_myIssue() {
  var ss = de_getWorkbook_();
  var sheet = ss.getSheetByName(TAB_MAP['DebtModel'] || 'DebtModel');
  Logger.log('Last row: ' + sheet.getLastRow());
}
```

### Step 4 — Fix and Verify

1. Make the fix
2. Re-run the diagnostic
3. Add a regression test
4. Follow the full pre-deploy checklist

### Step 5 — Rollback Procedure

Deploy the previous known-good version through the existing deployment.

### Step 6 — Post-Incident

1. Add the bug to the regression suite
2. Write a short incident summary
3. Add a missing standard if the incident exposed a standards gap

### 20.6 — Diagnostic Lifecycle Rule

Diagnostic functions have two valid lifecycles:

1. **Temporary diagnostics**
   - Named `diag_<issue>()`
   - Created for one investigation
   - MUST be deleted in the same PR that ships the fix unless promoted

2. **Permanent health checks**
   - Moved into a diagnostics module, smoke test, or regression suite
   - Named with the owning module or test pattern

If a `diag_*` function survives more than one deploy cycle without promotion or deletion,
it is dead code and must be removed.

## 21. GAS Platform Limits & Gotchas

### 21.1 — Hard Limits

| Limit | Value | What Happens |
|-------|-------|--------------|
| Execution time | 6 minutes | Function terminates |
| Triggers | 20 | Install silently fails at 21 |
| CacheService value | 100KB/key | `put()` silently fails |
| PropertiesService value | 9KB/key | Throws |
| PropertiesService total | 500KB/store | Writes fail |
| Spreadsheet cells | 10 million | Cannot grow further |

### 21.2 — Workbook Accessor Rule

Every project MUST define exactly one workbook accessor helper. All runtime sheet access goes
through this helper. Never scatter raw `openById()` calls across the codebase. Never use
`getActiveSpreadsheet()` in trigger-capable runtime code.

```javascript
var SSID = '1_your_spreadsheet_id';

function de_getWorkbook_() {
  return SpreadsheetApp.openById(SSID);
}
```

Rules:
- All runtime code that touches sheets calls the workbook helper
- `getActiveSpreadsheet()` is disallowed in runtime examples and production code
- The one permitted exception is `doGet()` when the project is a bound web app, but the helper is still preferred for consistency

### 21.3 — Timezone Rule

```javascript
function checkTimezones() {
  var ss = de_getWorkbook_();
  var scriptTz = Session.getScriptTimeZone();
  var sheetTz = ss.getSpreadsheetTimeZone();
  Logger.log('Script TZ: ' + scriptTz);
  Logger.log('Sheet TZ: ' + sheetTz);
}
```

Rules:
- Script timezone and sheet timezone MUST match
- Use `Utilities.formatDate()` for server-side formatted timestamps
- Include timezone in payloads when clients display server-owned dates

### 21.4 — Global Scope Gotcha

All `.gs` files share one global scope. Duplicate top-level names silently shadow one another.

### 21.5 — Special GAS Names to Never Shadow

`onEdit`, `onOpen`, `doGet`, `doPost`, `onInstall`, `onFormSubmit`, `onSelectionChange`
must each exist in only the appropriate place.

### 21.6 — PropertiesService Usage

Use Script Properties for small config values only. Never treat it as a cache or data store.

### 21.7 — Bulk Write Performance

Prefer `setValues()` over repeated `appendRow()` for bulk writes.

### 21.8 — HtmlService Caching After Deploy

HTML can stay cached after deploy. Clear in this order:
1. Wait for Google CDN
2. Hard refresh desktop browsers
3. Clear kiosk/WebView app cache
4. Confirm you updated the existing deployment, not a new URL

## 22. Code Ownership & Debugging Philosophy

### 22.1 — Own the Bug

When something fails after deploy, check the code first.

### 22.2 — Never Deflect

Do not blame deploy habits, the user, or the platform before tracing the actual code path.

### 22.3 — Diagnostic-Before-Deploy Rule

Before shipping a fix, write a diagnostic and verify runtime output.

### 22.4 — The Two-Mention Rule

If the same review issue is raised twice, it becomes priority-zero.

### 22.5 — Post-Fix Requirements

Every bug fix produces:
1. The fix
2. A diagnostic or equivalent runtime proof
3. A regression assertion
4. A version bump in the affected module(s)

### 22.6 — Full-File Replacement Rule

When an AI agent edits a `.gs` or `.html` file, it MUST produce a complete file replacement,
not a partial stale-context patch. Reasons:
- Partial patches against stale context create drift
- GAS deploys files as full units
- `clasp push` uploads the complete project

Rule:
- AI-generated code changes replace the full file contents for that file
- Version bump, fix, and cleanup land together in the same replacement
- This rule does not apply to human live-editor edits in the GAS editor

---

# Part IV — Profile: Single-Workbook Web App

This profile applies to GAS projects that are:
- bound to one workbook
- serving multiple HTML surfaces through `doGet()`
- targeting kiosk, WebView, ambient displays, or Cloudflare Worker proxy flows

If a project declares `Profile: Core + Single-Workbook Web App`, the profile sections below
become mandatory in addition to the Core Standard.

### IV.1 — Cloudflare Worker Sync Gate

When a Cloudflare Worker proxies `google.script.run` calls, the Worker maintains an allowlist
of callable Safe wrappers, typically an `FNS` array.

Rules:
- Every `google.script.run.<fnName>Safe()` target in HTML MUST appear in the Worker `FNS` array
- Additions to HTML Safe wrapper calls and Worker allowlist updates happen in the same change
- A pre-push validation script compares HTML call targets to the Worker `FNS` array
- Missing Worker allowlist entries are Sev-2 blockers

Expected validation behavior:
- extract `google.script.run` targets from HTML
- extract Worker `FNS` array values
- fail loudly with the exact missing function names

This check runs before push, not just in code review.

### IV.2 — Ambient Display Patterns

Ambient displays require explicit handling of stale state, limited browser engines, and fixed
screen geometry.

Rules:
- Design for known CSS pixel targets and DPR combinations
- Fire TV / older WebView do not support `backdrop-filter`; use solid backgrounds
- Use visibility-change reloads for wake-from-sleep recovery
- Use staggered polling intervals across surfaces
- Cross-reference the cache-clearing sequence in §21.8 for Fully Kiosk / Fire TV deploy validation

Typical target note:
- Example: `980×551` CSS pixels at `dpr=2` for Fire TV surfaces

See also §3.4, §16, and §17.

---

# Appendix A — Quick Reference Card

```text
═══════════════════════════════════════════════════════════
GAS STANDARDS — QUICK REFERENCE
═══════════════════════════════════════════════════════════

NEW PROJECT SETUP
  □ Created from base template
  □ Standards-Version declared in README + init record
  □ Profile declared (Core / Core + Single-Workbook Web App)
  □ Workbook helper defined
  □ ErrorLog + PerfLog created
  □ Required Script Properties documented
  □ Stability Threshold declared

BEFORE WRITING CODE
  □ Search for duplicate names
  □ Confirm module ownership
  □ Add tabs to TAB_MAP
  □ Use workbook helper, not getActiveSpreadsheet()

BEFORE DEPLOYING
  □ Version function bumped
  □ Diagnostic verified at runtime
  □ Smoke test PASS
  □ Regression suite PASS
  □ Existing deployment updated

WEB APP / API RULES
  □ One doGet()
  □ One doPost()
  □ POST actions dispatch through allowlist only
  □ External POST calls validate shared secret

PROFILE CHECKS
  □ HTML uses ES5-safe syntax
  □ Worker FNS list matches Safe wrappers
  □ Ambient displays reload on visibility wake

SILENT-FAILURE TRAPS
  ✗ Duplicate top-level function names
  ✗ getActiveSpreadsheet() in trigger paths
  ✗ Simple trigger using authorized services
  ✗ CacheService payload >100KB per key
  ✗ New deployment URL instead of updating existing one
═══════════════════════════════════════════════════════════
```

---

# Appendix B — Deployed Versions Collector

```javascript
function getDeployedVersions() {
  var v = {};
  var checks = [
    ['DataEngine', 'getDataEngineVersion'],
    ['Code', 'getCodeVersion'],
    ['CascadeEngine', 'getCascadeEngineVersion'],
    ['KidsHub', 'getKidsHubVersion'],
    ['GASHardening', 'getGASHardeningVersion'],
    ['MonitorEngine', 'getMonitorEngineVersion'],
    ['CalendarSync', 'getCalendarSyncVersion'],
    ['AlertEngine', 'getAlertEngineVersion'],
    ['StoryFactory', 'getStoryFactoryVersion'],
    ['SmokeTest', 'getSmokeTestVersion'],
    ['RegressionSuite', 'getRegressionSuiteVersion']
  ];
  var i;
  for (i = 0; i < checks.length; i++) {
    var label = checks[i][0];
    var fn = checks[i][1];
    try {
      v[label] = (typeof this[fn] === 'function') ? this[fn]() : '?';
    } catch (e) {
      v[label] = '?';
    }
  }
  v._timestamp = new Date().toISOString();
  return v;
}
```

---

# Appendix C — Smoke Test Categories

| # | Category | What It Checks | Method |
|---|----------|---------------|--------|
| 0 | Template Compliance | Base template components exist | Runtime |
| 1 | Wiring | HTML-to-server function wiring | Runtime |
| 2 | Schema | Headers, schema constants, TAB_MAP resolution | Runtime |
| 3 | Growth | Row counts, payload size, caps | Runtime |
| 4 | Environment | Version functions, workbook helper, runtime basics | Runtime |
| 5 | Triggers | Trigger count, orphans, handler existence | Runtime |
| 6 | Concurrency | No double-lock anti-patterns | Source-level (manual) |
| 7 | ES5 Compliance | Banned constructs in HTML | Source-level (manual or automated) |
| 8 | Row Safety | Write paths validate row identity | Source-level (manual) |
| 9 | HTML Contract Validation | Banned ES5 patterns, banned CSS properties, structural violations | Source-level (automated via `checkHTMLContracts_()`) |
| 10 | Duplicate Function Detection | No function name defined in more than one `.gs` file | Source-level (automated) |
| 11 | Environment Validation | Required Script Properties present and non-empty | Runtime |

Categories 6 and 8 remain manual review categories. Categories 9–11 are automated
source-level or runtime checks.

---

# Appendix D — Regression Suite Structure

Each regression assertion has:

```javascript
{
  id: 'BUG-001',
  description: 'Human-readable bug description',
  test: function() {
    return true;
  }
}
```

Categories:
- `BUG-nnn` — fixed bugs that must never recur
- `ENV-nnn` — environment invariants
- `PERF-nnn` — performance guardrails

---

# Appendix E — Build Score System

Every deploy gets a computed score.

## E.1 — Scoring Function

```javascript
function computeBuildScore_(smokeResults) {
  var categories = smokeResults.categories || {};
  var score = 0;
  var maxScore = 100;
  var breakdown = {};

  var templateStatus = categories['0_template'] ? categories['0_template'].status : 'FAIL';
  var templateScore = (templateStatus === 'PASS') ? 15 : 0;
  breakdown.templateCompliance = { score: templateScore, max: 15 };
  score += templateScore;

  if (templateScore === 0) {
    return {
      score: 0,
      max: maxScore,
      grade: 'BLOCKED',
      reason: 'Template compliance failed',
      breakdown: breakdown
    };
  }

  function points(status, passPoints, warnPoints) {
    if (status === 'PASS') return passPoints;
    if (status === 'WARN') return warnPoints;
    return 0;
  }

  breakdown.wiring = { score: points(categories['1_wiring'] && categories['1_wiring'].status, 15, 10), max: 15 };
  breakdown.schemaIntegrity = { score: points(categories['2_schema'] && categories['2_schema'].status, 15, 10), max: 15 };
  breakdown.growthMetrics = { score: points(categories['3_growth'] && categories['3_growth'].status, 10, 7), max: 10 };
  breakdown.environment = { score: points(categories['4_environment'] && categories['4_environment'].status, 15, 10), max: 15 };
  breakdown.triggers = { score: points(categories['5_triggers'] && categories['5_triggers'].status, 10, 7), max: 10 };

  score += breakdown.wiring.score;
  score += breakdown.schemaIntegrity.score;
  score += breakdown.growthMetrics.score;
  score += breakdown.environment.score;
  score += breakdown.triggers.score;

  var versions = {};
  try { versions = getDeployedVersions(); } catch (e) {}
  var versionCount = 0;
  var versionIssues = 0;
  var key;
  for (key in versions) {
    if (key === '_timestamp') continue;
    versionCount++;
    if (typeof versions[key] !== 'number' || versions[key] < 1) {
      versionIssues++;
    }
  }
  var versionScore = (versionIssues === 0 && versionCount > 0) ? 10 : (versionIssues <= 1 ? 7 : 0);
  breakdown.versionDiscipline = {
    score: versionScore,
    max: 10,
    modules: versionCount,
    issues: versionIssues
  };
  score += versionScore;

  var grade = 'BLOCKED';
  if (score >= 90) grade = 'SHIP';
  else if (score >= 80) grade = 'CONDITIONAL';
  else if (score >= 70) grade = 'HOLD';

  return {
    score: score,
    max: maxScore,
    grade: grade,
    breakdown: breakdown
  };
}
```

## E.2 — Grade Scale

| Score | Grade | Action |
|-------|-------|--------|
| 90–100 | `SHIP` | Deploy |
| 80–89 | `CONDITIONAL` | Deploy with documented follow-up |
| 70–79 | `HOLD` | Fix concerns first |
| Below 70 | `BLOCKED` | Do not deploy |

Special rule: if template compliance fails, the build is blocked regardless of other scores.

---

# Appendix F — CI Enforcement Map

| Rule | Enforcement | Blocks Merge? |
|------|-------------|---------------|
| Duplicate top-level function names across `.gs` files | Automated (Cat 10 smoke test + CI script) | YES |
| Raw sheet names outside `TAB_MAP` | Automated grep/source check | YES |
| `getActiveSpreadsheet()` in non-setup code | Automated grep/source check | YES |
| Banned ES5 constructs in HTML files | Automated (Cat 9 + CI script) | YES |
| Missing version bump in edited `.gs` file | Automated diff check | YES |
| CF Worker `FNS` array sync | Automated pre-push gate | YES — Profile only |
| Lock on business-state write paths | Human review | No (warn) |
| Schema constant matches sheet headers | Automated (Cat 2) | YES |
| Trigger quota check | Automated (Cat 5) | YES (if >20) |
| Module ownership headers | Human review | No (warn) |
| Diagnostic lifecycle (`diag_*`) | Human review | No (warn) |
| `doPost` secret validation | Human review | No (warn) |
| Script Properties redaction in logs | Human review | No (warn) |

---

# Appendix G — Standards Version Adoption

Each GAS project declares which version of this standard it follows.

Declaration:

```text
Standards-Version: GAS-v3.1
```

Add this to the project's README and initialization record.

Versioning:
- Patch (`v3.1 → v3.2`) — clarifications and new examples; no migration needed
- Minor (`v3.x → v4.0`) — new required patterns; migration note required
- Major (`v4.x → v5.0`) — breaking changes; migration guide required

Adoption rule:
- New projects MUST use the latest version
- Existing projects SHOULD upgrade within one quarter of a new minor release
- Major releases get a 6-month migration window

Breaking changes to the standard require a migration note in this appendix changelog.

### Changelog

- `v3.0 → v3.1`
  - Fixed `getActiveSpreadsheet()` contradictions in example code
  - Added workbook helper requirement
  - Added `doPost()` / API Surface Standard
  - Added Config / Environment Standard
  - Added Cloudflare Worker Sync Gate profile section
  - Tightened LockService scope to business-state writes
  - Expanded ES5 banned list
  - Added `clasp` deploy workflow to the pre-deploy checklist
  - Added diagnostic lifecycle rule
  - Added full-file replacement rule
  - Added CI Enforcement Map
  - Added Standards Version Adoption
  - Split Core Standard from Single-Workbook Web App Profile
  - Added smoke-test categories 9–11

---

*End of GAS Standards Kit v3.1.*
*Git is the canonical editable source. Notion is a read-only mirror.*
