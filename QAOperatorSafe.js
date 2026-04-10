// ════════════════════════════════════════════════════════════════════
// QAOperatorSafe.gs v1 — Safe Wrappers for QA Operator Mode
// WRITES TO: Script Properties (clock override, active scenario, snapshots)
// READS FROM: QAHarness.gs, Resettesting.js, TBMConfig.gs, TAB_MAP
// ════════════════════════════════════════════════════════════════════
// Version history tracked in Notion deploy page. Do not add version comments here.
//
// PURPOSE: Expose QAHarness + ResetTesting functions to HTML via google.script.run.
// Every function requires TBM_ENV=qa. Calling any function in prod throws.
// These wrappers are registered in Code.js serveData whitelist and
// Tbmsmoketest.js CANONICAL_SAFE_FUNCTIONS.
//
// SPEC: specs/qa-operator-mode.md — PR 1 scope
// ════════════════════════════════════════════════════════════════════

function getQAOperatorSafeVersion() { return 1; }

// ── QA STATUS ──────────────────────────────────────────────────────

/**
 * Returns current QA environment status.
 * Does NOT require QA env — safe to call from any env so the client
 * can show the prod guard page with real env info.
 */
function qaGetEnvStatusSafe() {
  return withMonitor_('qaGetEnvStatusSafe', function() {
    var ssid = SSID || '';
    return {
      env: TBM_ENV.ENV,
      envName: TBM_ENV.ENV_NAME,
      ssid: ssid.slice(0, 8) + '...' + ssid.slice(-4),
      clockOverride: PropertiesService.getScriptProperties().getProperty('CLOCK_OVERRIDE') || null,
      now: tbm_now_().toISOString(),
      activeScenario: PropertiesService.getScriptProperties().getProperty('QA_ACTIVE_SCENARIO') || null
    };
  });
}

// ── SCENARIOS ──────────────────────────────────────────────────────

/**
 * Lists all available QA scenario names and descriptions.
 */
function qaListScenariosSafe() {
  return withMonitor_('qaListScenariosSafe', function() {
    tbm_requireQA_('qaListScenariosSafe');
    return listScenarios();
  });
}

/**
 * Loads a named scenario into the QA workbook and sets the clock override.
 * @param {string} name — scenario name (e.g. 'fresh-morning')
 */
function qaLoadScenarioSafe(name) {
  return withMonitor_('qaLoadScenarioSafe', function() {
    tbm_requireQA_('qaLoadScenarioSafe');
    var result = loadScenario(name);
    PropertiesService.getScriptProperties().setProperty('QA_ACTIVE_SCENARIO', name);
    return result;
  });
}

// ── CLOCK OVERRIDE ─────────────────────────────────────────────────

/**
 * Sets the clock override to the given ISO date string.
 * @param {string} iso — ISO 8601 string (e.g. '2026-04-07T14:00:00')
 */
function qaSetClockSafe(iso) {
  return withMonitor_('qaSetClockSafe', function() {
    tbm_requireQA_('qaSetClockSafe');
    return setClockOverride(iso);
  });
}

/**
 * Clears the clock override. tbm_now_() returns real time after this.
 */
function qaClearClockSafe() {
  return withMonitor_('qaClearClockSafe', function() {
    tbm_requireQA_('qaClearClockSafe');
    return clearClockOverride();
  });
}

// ── SNAPSHOT / RESTORE ─────────────────────────────────────────────

/**
 * Takes a snapshot of current QA workbook state.
 * @param {string} name — snapshot name (e.g. 'pre-walkthrough')
 */
function qaSnapshotSafe(name) {
  return withMonitor_('qaSnapshotSafe', function() {
    tbm_requireQA_('qaSnapshotSafe');
    return snapshotQAState(name);
  });
}

/**
 * Restores a previously saved QA workbook snapshot.
 * @param {string} name — snapshot name to restore
 */
function qaRestoreSafe(name) {
  return withMonitor_('qaRestoreSafe', function() {
    tbm_requireQA_('qaRestoreSafe');
    return restoreQAState(name);
  });
}

/**
 * Lists all saved snapshot names by scanning Script Properties for QA_SNAP_* keys.
 */
function qaListSnapshotsSafe() {
  return withMonitor_('qaListSnapshotsSafe', function() {
    tbm_requireQA_('qaListSnapshotsSafe');
    var props = PropertiesService.getScriptProperties().getKeys();
    var names = [];
    for (var i = 0; i < props.length; i++) {
      if (props[i].indexOf('QA_SNAP_') === 0) {
        names.push(props[i].substring(8));
      }
    }
    return { snapshots: names };
  });
}

// ── PERSISTENCE TESTS ──────────────────────────────────────────────

/**
 * Runs the full Q7 persistence test suite.
 * Returns structured results with pass/fail per test case.
 */
function qaRunPersistenceTestsSafe() {
  return withMonitor_('qaRunPersistenceTestsSafe', function() {
    tbm_requireQA_('qaRunPersistenceTestsSafe');
    return runPersistenceTests();
  });
}

// ── DATA TOOLS ─────────────────────────────────────────────────────

/**
 * Clears all KidsHub test data from the QA workbook.
 */
function qaClearTestDataSafe() {
  return withMonitor_('qaClearTestDataSafe', function() {
    tbm_requireQA_('qaClearTestDataSafe');
    clearKHTestData();
    return { status: 'ok' };
  });
}

/**
 * Resets all QA data to baseline state.
 */
function qaResetDataSafe() {
  return withMonitor_('qaResetDataSafe', function() {
    tbm_requireQA_('qaResetDataSafe');
    resetQAData();
    return { status: 'ok' };
  });
}

/**
 * Exports current QA workbook state as structured JSON.
 * Reads key KH_ tabs and returns their data ranges.
 */
function qaExportStateSafe() {
  return withMonitor_('qaExportStateSafe', function() {
    tbm_requireQA_('qaExportStateSafe');
    var ss = tbm_getWorkbook_();
    var tabs = [
      'KH_Chores', 'KH_History', 'KH_Requests', 'KH_ScreenTime',
      'KH_Rewards', 'KH_Education', 'KH_MissionState'
    ];
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

// Version history tracked in Notion deploy page. Do not add version comments here.
// QAOperatorSafe.gs v1 — EOF
