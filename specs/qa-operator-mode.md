# QA Operator Mode — Frontend for Existing QA Harness

**Owner:** Opus (spec), Code (build), Codex (audit), LT (gate)
**Priority:** P3 — quality-of-life for LT; does not unblock shipping
**Status:** Draft — Architecture Review
**Scope:** Frontend only. All backend capability already exists.

---

## Problem

The QA harness is fully built on the server side but has no frontend. LT must
open the GAS Script Editor, set a Script Property, pick a function from a
dropdown, and hand-run individual functions to walk JJ/Buggsy screens end-to-end.
This is how every pre-deploy manual test is done today.

**Verified by source read:**

- `TBMConfig.gs:20-67` — `TBM_ENV` switches between `prod` and `qa` via Script
  Property `TBM_ENV`. `tbm_requireQA_(caller)` throws if not in QA.
  `tbm_getWorkbook_()` is the canonical workbook accessor.
- `QAHarness.gs` — 594 lines of QA infrastructure:
  - `tbm_now_()` with `CLOCK_OVERRIDE` Script Property
  - `setClockOverride(iso)` / `clearClockOverride()` (lines 37, 49)
  - 5 named scenarios in `QA_SCENARIOS` at line 64: `fresh-morning`,
    `pending-approvals`, `all-clear`, `week-rollover`, `education-pending-review`
  - `loadScenario(name)` (line 96), `listScenarios()` (line 135)
  - `snapshotQAState(name)` (line 251), `restoreQAState(name)` (line 289)
  - `runPersistenceTests()` (line 345) with 5 test cases
- `Resettesting.js` — `clearKHTestData()`, `seedQAWorkbook()`, `resetQAData()`
- `Code.js:214` `servePage()` — route table has 24 entries. **No `qa` route.**
  LT cannot hit any QA UI via `thompsonfams.com/qa`.

Every QA function requires `TBM_ENV=qa`. There is no wrapper that exposes
them to HTML via `google.script.run`. The Cloudflare worker
(`cloudflare-worker.js:338`) does not list any `qa*` functions in its
serveData whitelist.

**Net:** the QA infrastructure is 100% backend. The cost of running one QA
walkthrough is:

1. Open Google Drive → find TBM Apps Script project → open Script Editor
2. Project Settings → Script Properties → set `TBM_ENV=qa` → Save
3. Select function dropdown → `loadScenario` → Run → authorize → check Logger
4. Back to dropdown → `snapshotQAState` → type snapshot name in code → Run
5. Open the target surface in a new browser tab
6. Do the thing
7. Back to editor → `restoreQAState` → edit snapshot name → Run
8. Project Settings → Script Properties → set `TBM_ENV=prod` → Save
9. Verify prod is back (check with `getDeployedVersions` or similar)

If LT forgets step 8, every subsequent real operation runs against the QA
workbook. This has happened. LT also has to remember which scenario loads
which state, and there's no visual confirmation of the current clock override
or environment.

The goal: a single `/qa` surface that wraps the existing backend with a UI LT
can use from any device, ideally their phone during a walkthrough on the S10 FE
or Surface Pro.

## Design

A new HTML surface `QAOperator.html` served at `/qa`, wired to the existing
QA harness via new Safe wrappers in Code.js. Protected by environment check
+ PIN, indistinguishable from prod if `TBM_ENV=prod` (renders a red guard
page).

### Route

Added to `servePage()` route table (Code.js:214):

```js
'qa': { file: 'QAOperator', title: 'TBM QA Operator' }
```

Cloudflare worker adds `/qa` proxy → `?page=qa` (standard pattern).

### Environment guard

The `/qa` route reads `TBM_ENV.ENV` in the page template:

- If `env === 'qa'`: render the operator dashboard
- If `env !== 'qa'`: render a guard page — red background, huge "PROD MODE" text,
  instructions to switch env, no interactive controls

The guard is **server-side** (rendered in `servePage` before HTML output),
not client-side. A client-only check can be bypassed; the server check cannot.

### PIN gate

Same PIN mechanism ThePulse uses today (Cloudflare Worker `/api/verify-pin`
path from CLAUDE.md route list). QA Operator inherits the gate:

1. On load, prompt for PIN
2. Send to `/api/verify-pin`
3. On success, enable all controls
4. On failure, lock the UI and show "Wrong PIN"

Reused infrastructure — no new auth code.

### Dashboard layout

ES5-only HTML (Fully Kiosk + S10 FE compat). Single-page, scroll to sections.

```
┌─────────────────────────────────────┐
│ ⚠ QA ENVIRONMENT                   │
│ Workbook: <TBM_QA_SSID short hash>  │
│ Clock:    2026-04-06T06:00:00       │
│ Scenario: fresh-morning             │
└─────────────────────────────────────┘

┌─────────────── SCENARIOS ───────────────┐
│ [ Load: fresh-morning ]                 │
│ [ Load: pending-approvals ]             │
│ [ Load: all-clear ]                     │
│ [ Load: week-rollover ]                 │
│ [ Load: education-pending-review ]      │
└─────────────────────────────────────────┘

┌─────────────── CLOCK ───────────────────┐
│ Override: [ YYYY-MM-DDTHH:MM:SS ] [Set] │
│ Current:  2026-04-06T06:00:00           │
│ [ Clear Override ]                      │
└─────────────────────────────────────────┘

┌──────────── SNAPSHOT / RESTORE ─────────┐
│ Name: [ pre-walkthrough ]               │
│ [ Snapshot ] [ Restore ] [ List ]       │
└─────────────────────────────────────────┘

┌──────────── LAUNCH SURFACE ─────────────┐
│ [ /jj ]   [ /buggsy ]   [ /parent ]     │
│ [ /sparkle ] [ /homework ] [ /daily-    │
│   missions ] [ /reading ] [ /writing ]  │
│ [ /wolfkid ] [ /facts ] [ /investi-     │
│   gation ] [ /baseline ]                │
│ Each opens in a new tab with ?qa=1      │
└─────────────────────────────────────────┘

┌──────────── PERSISTENCE TESTS ──────────┐
│ [ Run All Tests ]                       │
│ Last run: 2026-04-06T06:00:00 — PASS    │
│ Details: [expandable log]               │
└─────────────────────────────────────────┘

┌────────────── DATA TOOLS ───────────────┐
│ [ Clear Test Data ]                     │
│ [ Seed Week 1 Curriculum ]              │
│ [ Reset QA Data ]                       │
│ [ Export State as JSON ]                │
└─────────────────────────────────────────┘
```

### Safe wrappers (new — added to Code.js)

All guarded by `tbm_requireQA_()` server-side:

```js
// QAOperatorSafe.js — new file alongside other Safe wrappers

function qaGetEnvStatusSafe() {
  return withMonitor_('qaGetEnvStatusSafe', function() {
    return {
      env: TBM_ENV.ENV,
      envName: TBM_ENV.ENV_NAME,
      ssid: (SSID || '').slice(0, 8) + '...' + (SSID || '').slice(-4),
      clockOverride: PropertiesService.getScriptProperties().getProperty('CLOCK_OVERRIDE') || null,
      now: tbm_now_().toISOString(),
      activeScenario: PropertiesService.getScriptProperties().getProperty('QA_ACTIVE_SCENARIO') || null
    };
  });
}

function qaListScenariosSafe() {
  return withMonitor_('qaListScenariosSafe', function() {
    tbm_requireQA_('qaListScenariosSafe');
    return listScenarios();
  });
}

function qaLoadScenarioSafe(name) {
  return withMonitor_('qaLoadScenarioSafe', function() {
    tbm_requireQA_('qaLoadScenarioSafe');
    var result = loadScenario(name);
    PropertiesService.getScriptProperties().setProperty('QA_ACTIVE_SCENARIO', name);
    return result;
  });
}

function qaSetClockSafe(iso) {
  return withMonitor_('qaSetClockSafe', function() {
    tbm_requireQA_('qaSetClockSafe');
    return setClockOverride(iso);
  });
}

function qaClearClockSafe() {
  return withMonitor_('qaClearClockSafe', function() {
    tbm_requireQA_('qaClearClockSafe');
    return clearClockOverride();
  });
}

function qaSnapshotSafe(name) {
  return withMonitor_('qaSnapshotSafe', function() {
    tbm_requireQA_('qaSnapshotSafe');
    return snapshotQAState(name);
  });
}

function qaRestoreSafe(name) {
  return withMonitor_('qaRestoreSafe', function() {
    tbm_requireQA_('qaRestoreSafe');
    return restoreQAState(name);
  });
}

function qaListSnapshotsSafe() {
  return withMonitor_('qaListSnapshotsSafe', function() {
    tbm_requireQA_('qaListSnapshotsSafe');
    var props = PropertiesService.getScriptProperties().getKeys();
    var names = [];
    for (var i = 0; i < props.length; i++) {
      if (props[i].indexOf('QA_SNAP_') === 0) names.push(props[i].substring(8));
    }
    return { snapshots: names };
  });
}

function qaRunPersistenceTestsSafe() {
  return withMonitor_('qaRunPersistenceTestsSafe', function() {
    tbm_requireQA_('qaRunPersistenceTestsSafe');
    return runPersistenceTests();
  });
}

function qaClearTestDataSafe() {
  return withMonitor_('qaClearTestDataSafe', function() {
    tbm_requireQA_('qaClearTestDataSafe');
    clearKHTestData();
    return { status: 'ok' };
  });
}

function qaResetDataSafe() {
  return withMonitor_('qaResetDataSafe', function() {
    tbm_requireQA_('qaResetDataSafe');
    resetQAData();
    return { status: 'ok' };
  });
}

function qaExportStateSafe() {
  return withMonitor_('qaExportStateSafe', function() {
    tbm_requireQA_('qaExportStateSafe');
    var ss = tbm_getWorkbook_();
    var tabs = ['KH_Chores', 'KH_History', 'KH_Requests', 'KH_ScreenTime',
                'KH_Rewards', 'KH_Education', 'KH_MissionState'];
    var state = {};
    for (var i = 0; i < tabs.length; i++) {
      var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP[tabs[i]]) || tabs[i];
      var sheet = ss.getSheetByName(tabName);
      if (sheet && sheet.getLastRow() > 0) {
        state[tabs[i]] = sheet.getDataRange().getValues();
      }
    }
    return { exportedAt: new Date().toISOString(), tabs: state };
  });
}
```

Registered in `Code.js serveData` whitelist (line 407 area) and
`Tbmsmoketest.js` wiring check (line 56 area). All 11 functions.

### Launch Surface semantics

Each "Launch" button opens the target route in a new tab (`target="_blank"`)
with `?qa=1` appended. The target surface inherits the QA environment because
`TBM_ENV.ENV` is read at server side from Script Properties — not from the URL.

`?qa=1` is a visual hint only: surfaces that support it render a small badge
("⚠ QA") so LT can tell at a glance. The badge wiring is one-line per surface:

```html
<!-- Every surface template — 3-line addition -->
<script>
  if (/[?&]qa=1/.test(window.location.search)) {
    var badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;top:0;right:0;background:#f59e0b;color:#000;padding:4px 12px;z-index:99999;font-weight:bold;';
    badge.textContent = 'QA';
    document.body.appendChild(badge);
  }
</script>
```

Optional for Phase 1, mandatory for Phase 2.

### Safety rails

1. **Server guard (primary):** every `qa*Safe` function calls `tbm_requireQA_()`.
   If `TBM_ENV=prod`, the call throws before any read/write happens. Client
   cannot bypass.
2. **Route guard (secondary):** `servePage('qa')` renders the prod-mode error
   page if `TBM_ENV.ENV !== 'qa'`. No operator UI renders at all.
3. **PIN gate (tertiary):** PIN gate on client; if wrong, controls disabled.
   Not a security boundary — just prevents fat-finger access.
4. **Big red banner:** cannot miss you're in QA. Header bar states the workbook
   short hash so LT can verify at a glance.
5. **Confirm dialog** before destructive actions (Clear, Reset, Restore).
6. **Exit handoff:** "Back to Prod" button on the dashboard that swaps
   `TBM_ENV=prod` in Script Properties via a `qaExitToProdSafe()` wrapper.
   This closes the one manual step LT currently has to remember.

## Trade-offs considered

### Alternative 1 — Build a Chrome DevTools panel

Write a Chrome extension that injects a QA operator panel into any TBM surface
when `TBM_ENV=qa`. No new route, no new HTML file.

**Rejected because:**
- Chrome extensions aren't cross-device — LT uses an S10 FE, a Surface Pro, a
  phone, and Fire Stick tablets. None of those run a Chrome extension that
  injects DOM into a webview.
- Extension signing / distribution / updates / Chrome Web Store policy all
  become LT's problem.
- The goal is a single URL; an extension is the opposite of that.

### Alternative 2 — Bolt the controls onto ThePulse / TheVein

Add a hidden "QA Mode" tab to an existing LT dashboard, gated by env check.

**Rejected because:**
- The existing dashboards are large enough that adding a QA section increases
  cognitive load for the common case (LT is viewing finances, not testing).
- Surface isolation matters: if LT accidentally enables `TBM_ENV=qa` while
  trying to pay a bill on ThePulse, the consequences are bad. A separate route
  makes the env switch deliberate.
- The `/qa` route is also discoverable via a single URL for bookmarking,
  scripting, and mobile access.

### Alternative 3 — Script Editor macro buttons only

Add a custom menu to the Apps Script editor with one-click buttons for each
scenario. No HTML surface.

**Rejected because:**
- Still requires opening the Script Editor, which requires desktop access.
- Can't be used from the S10 FE while walking JJ through a flow.
- Doesn't let LT launch target surfaces with QA context — each launch would
  still need a manual URL in the browser.

## Rollout plan

### PR 1 — Safe wrappers only, dark

- Add 11 Safe wrappers to `Code.js` (or a new `QAOperatorSafe.js` file).
- Whitelist in `serveData` (line 407 area).
- Wiring check in `Tbmsmoketest.js`.
- No HTML, no route. Backend is ready for the client.

### PR 2 — QAOperator.html + route

- Ship `QAOperator.html` (new file).
- Add `'qa': { file: 'QAOperator', title: 'TBM QA Operator' }` to the
  `servePage()` route table at Code.js:245.
- Server-side env guard: if `TBM_ENV.ENV !== 'qa'`, render a red guard page
  instead.
- Client-side PIN gate, dashboard sections, launch buttons.
- Smoke + regression pass.
- CF Worker adds `/qa` route to the route list + hits 200 post-deploy.

### PR 3 — QA badge on child surfaces

- Add the 10-line QA badge snippet to every surface template that consumers
  reach from the Launch section.
- Pure visual, no behavior change.

### Phase 2 — Scenario editor

- UI to add/edit/delete scenarios without opening Script Editor.
- Scenarios stored in `KH_QA_Scenarios` tab (columns: name, description, clock,
  setup_json) instead of hardcoded in `QA_SCENARIOS` at QAHarness.gs:64.
- `loadScenario()` becomes data-driven.
- Out of scope for PR 1-3.

## Verification plan (Gate 4 manifest)

```
grep -n "qaGetEnvStatusSafe"     Code.js             → 1 whitelist + 1 function
grep -n "qaListScenariosSafe"    Code.js             → 1 whitelist + 1 function
grep -n "qaLoadScenarioSafe"     Code.js             → 1 whitelist + 1 function
grep -n "qaSetClockSafe"         Code.js             → 1 whitelist + 1 function
grep -n "qaSnapshotSafe"         Code.js             → 1 whitelist + 1 function
grep -n "qaRestoreSafe"          Code.js             → 1 whitelist + 1 function
grep -n "qaRunPersistenceTestsSafe" Code.js          → 1 whitelist + 1 function
grep -n "qaClearTestDataSafe"    Code.js             → 1 whitelist + 1 function
grep -n "qaExportStateSafe"      Code.js             → 1 whitelist + 1 function
grep -n "'qa':"                  Code.js             → 1 route entry in servePage
ls QAOperator.html                                   → file exists
grep -n "TBM_ENV.ENV !== 'qa'"   Code.js             → 1+ guard in servePage for 'qa' route
grep -n "/qa"                    cloudflare-worker.js → 1+ route entry
```

## Gate 5 feature verification checklist

| # | Check | Pass condition |
|---|-------|----------------|
| 1 | `/qa` route renders in QA env | Opening `/qa` with `TBM_ENV=qa` shows operator dashboard |
| 2 | `/qa` route blocked in prod env | Opening `/qa` with `TBM_ENV=prod` shows red guard page, no controls |
| 3 | Load scenario | Tapping "Load fresh-morning" calls `loadScenario`, dashboard shows clock = 2026-04-06T06:00:00 |
| 4 | Clock override | Setting `2026-04-07T14:00:00` in the Clock section updates `tbm_now_()` server-side |
| 5 | Clear clock | Tapping Clear returns `tbm_now_()` to real time |
| 6 | Snapshot saves | Typing a name + tap Snapshot writes a `QA_SNAP_<name>` property |
| 7 | Restore loads | Typing a name + tap Restore replays the saved state to the workbook |
| 8 | Launch surface | Tapping "Launch /jj" opens `/jj?qa=1` in new tab, surface renders |
| 9 | Persistence tests | Tap Run runs all 5 tests, results display within 60s |
| 10 | Env status polling | Dashboard refreshes env status every 10s |
| 11 | Prod guard via direct API | Calling `qaLoadScenarioSafe` from prod env throws with actionable error |
| 12 | ES5 compliance | QAOperator.html has zero banned patterns |
| 13 | PIN gate | Without correct PIN, all buttons disabled |
| 14 | Cloudflare route | `thompsonfams.com/qa` returns 200 when in QA env |
| 15 | Exit to prod | "Back to Prod" button switches `TBM_ENV=prod`, subsequent loads show guard |

## Open questions for LT review

1. **PIN source.** ThePulse/TheVein use a shared LT PIN. Should `/qa` use the
   same PIN or have its own (less bleeding through if someone ever learns the
   PIN)?

2. **`qaExitToProdSafe`.** Flipping `TBM_ENV` via a wrapper that any
   authenticated client can call is a foot gun — you could exit QA via a
   dashboard tap while someone else is mid-test. Should this be Script-Editor-
   only, or guarded by "are you sure?" + a second PIN, or restricted to LT's
   specific Google account?

3. **Scenario visibility.** Does LT want the scenario list hardcoded in
   `QA_SCENARIOS` (code changes require a deploy) or data-driven via a tab
   (LT can edit live)?

4. **QA badge on every surface.** PR 3 adds a visual badge. Any surface that
   doesn't get the badge is invisible to LT when walking flows. Should PR 2
   bundle the badge wiring so no surface is excluded?

5. **Data export format.** `qaExportStateSafe` returns JSON. Should the UI
   also expose a "download as CSV" button for when LT wants to eyeball a tab
   in a spreadsheet?

6. **Multi-user safety.** If LT is running a scenario on one device and JT
   opens `/qa` on another, they'd clobber each other's state. Need a "QA
   session lock" (one LT at a time) or is this over-engineering for a
   two-person team?

7. **Mobile layout.** LT walks JJ flows on the S10 FE (1920×1200 portrait).
   The mock layout assumes desktop. Mobile-first or desktop-first?

---

**Definition of done:**

- All 15 Gate 5 items green
- LT walks a full JJ Monday session from `/qa`: load `fresh-morning`,
  snapshot, launch `/jj`, do the flow, restore, verify state matches snapshot
- Round-trip time from "I want to test JJ's Monday flow" to "I'm in JJ's
  Monday flow" drops from ~2 minutes (Script Editor path) to ~15 seconds
  (two taps in /qa)
- No prod-mode regression (deploying this spec does NOT change any prod
  behavior; the route is invisible when `TBM_ENV=prod`)
