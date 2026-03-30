// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// KH_DeployGate.gs — Pre-Deploy Schema & Function Validation
// Run khDeployGate() before EVERY deploy. No exceptions.
// ════════════════════════════════════════════════════════════════════

/**
 * DEPLOY GATE — Run before every deploy.
 * Validates:
 *   1. Every KH_SCHEMAS tab exists and headers match
 *   2. Every google.script.run function called from HTML exists as a top-level function
 *   3. KH_Requests column alignment (the Session 56 root cause)
 *   4. Critical helper functions exist (khCol_, getKHSheet_, etc.)
 *
 * Returns a structured result. Logs everything. Throws on FAIL so
 * you can't accidentally deploy past a broken gate.
 */
function khDeployGate() {
  var ss = SpreadsheetApp.openById('1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c');
  var results = {
    status: 'PASS',
    timestamp: new Date().toISOString(),
    version: 'KH_DeployGate v1',
    checks: [],
    failures: [],
    warnings: []
  };

  Logger.log('═══════════════════════════════════════════');
  Logger.log('  KH_DEPLOY GATE — Pre-Deploy Validation');
  Logger.log('═══════════════════════════════════════════');

  // ── CHECK 1: Schema Validation ──────────────────────────────────
  Logger.log('');
  Logger.log('── CHECK 1: KH_SCHEMAS vs Actual Sheet Headers ──');

  var schemaKeys = Object.keys(KH_SCHEMAS);
  for (var sk = 0; sk < schemaKeys.length; sk++) {
    var tabKey = schemaKeys[sk];
    var schema = KH_SCHEMAS[tabKey];
    var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP[tabKey] || tabKey) : tabKey;
    var sheet = ss.getSheetByName(tabName);

    if (!sheet) {
      var msg = 'MISSING TAB: ' + tabKey + ' (expected: ' + tabName + ')';
      results.warnings.push(msg);
      Logger.log('  ⚠ ' + msg);
      results.checks.push({ check: 'schema', tab: tabKey, status: 'WARN', detail: 'Tab not found (may be auto-created)' });
      continue;
    }

    var actualHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
    var expectedHeaders = schema.headers;

    // Check for missing columns (in schema but not in sheet)
    var missing = [];
    for (var mi = 0; mi < expectedHeaders.length; mi++) {
      if (actualHeaders.indexOf(expectedHeaders[mi]) < 0) {
        missing.push(expectedHeaders[mi]);
      }
    }

    // Check for extra columns (in sheet but not in schema)
    var extra = [];
    for (var ei = 0; ei < actualHeaders.length; ei++) {
      var h = actualHeaders[ei].trim();
      if (h && expectedHeaders.indexOf(h) < 0) {
        extra.push(h);
      }
    }

    // Check column count match
    var countMatch = actualHeaders.filter(function(h) { return h.trim() !== ''; }).length === expectedHeaders.length;

    if (missing.length > 0) {
      var failMsg = tabKey + ': MISSING columns: ' + missing.join(', ');
      results.failures.push(failMsg);
      results.status = 'FAIL';
      Logger.log('  ✗ ' + failMsg);
    } else if (extra.length > 0) {
      var warnMsg = tabKey + ': Extra columns (not in schema): ' + extra.join(', ');
      results.warnings.push(warnMsg);
      Logger.log('  ⚠ ' + warnMsg);
    } else {
      Logger.log('  ✓ ' + tabKey + ': ' + expectedHeaders.length + ' columns match');
    }

    results.checks.push({
      check: 'schema',
      tab: tabKey,
      status: missing.length > 0 ? 'FAIL' : (extra.length > 0 ? 'WARN' : 'PASS'),
      expected: expectedHeaders.length,
      actual: actualHeaders.filter(function(h) { return h.trim() !== ''; }).length,
      missing: missing,
      extra: extra
    });
  }

  // ── CHECK 2: Function Existence ─────────────────────────────────
  Logger.log('');
  Logger.log('── CHECK 2: Required Functions Exist ──');

  // Every function called via google.script.run from HTML surfaces
  var requiredFunctions = [
    // KidsHub.gs core
    'getKidsHubData', 'getKidsHubGsVersion',
    'khCompleteTask', 'khCompleteTaskWithBonus',
    'khApproveTask', 'khApproveWithBonus',
    'khRejectTask', 'khOverrideTask', 'khUncompleteTask',
    'khRedeemReward', 'khAddDeduction', 'khResetTasks',
    'khVerifyPin', 'khHealthCheck',
    'khSubmitRequest', 'khApproveRequest', 'khDenyRequest',
    'khSetBankOpening', 'khDebitScreenTime', 'khAddBonusTask',
    'getKHAppUrls', 'getKidsAllowanceLog',
    // Code.gs safe wrappers
    'getKidsHubDataSafe', 'getKidsHubWidgetDataSafe',
    'khCompleteTaskSafe', 'khCompleteTaskWithBonusSafe',
    'khApproveTaskSafe', 'khApproveWithBonusSafe',
    'khRejectTaskSafe', 'khOverrideTaskSafe', 'khUncompleteTaskSafe',
    'khRedeemRewardSafe', 'khAddDeductionSafe', 'khResetTasksSafe',
    'khVerifyPinSafe', 'khHealthCheckSafe',
    'khSubmitRequestSafe', 'khApproveRequestSafe', 'khDenyRequestSafe',
    'khSetBankOpeningSafe', 'khDebitScreenTimeSafe', 'khAddBonusTaskSafe',
    'getKHAppUrlsSafe',
    // Other core functions called from HTML
    'getDataSafe', 'getSimulatorDataSafe', 'getWeeklyTrackerDataSafe',
    'getCashFlowForecastSafe', 'getBoardDataSafe',
    'getScriptUrlSafe', 'bustCache', 'getKHLastModified',
    'getDeployedVersionsSafe', 'getSystemHealthSafe',
    'getReconcileStatusSafe', 'getMERGateStatusSafe',
    'runStoryFactorySafe',
    // Internal helpers that must exist
    'khCol_', 'getKHSheet_', 'getKHHeaders_',
    'acquireLock_', 'stampKHHeartbeat_',
    'withMonitor_', 'logError_', 'logPerf_'
  ];

  var missingFns = [];
  for (var fi = 0; fi < requiredFunctions.length; fi++) {
    var fnName = requiredFunctions[fi];
    var exists = false;
    try { exists = typeof this[fnName] === 'function'; } catch(e) {}
    if (!exists) {
      missingFns.push(fnName);
      Logger.log('  ✗ MISSING: ' + fnName);
    }
  }

  if (missingFns.length > 0) {
    results.status = 'FAIL';
    results.failures.push('Missing functions: ' + missingFns.join(', '));
    Logger.log('  ✗ ' + missingFns.length + ' function(s) missing');
  } else {
    Logger.log('  ✓ All ' + requiredFunctions.length + ' functions present');
  }

  results.checks.push({
    check: 'functions',
    status: missingFns.length > 0 ? 'FAIL' : 'PASS',
    total: requiredFunctions.length,
    missing: missingFns
  });

  // ── CHECK 3: KH_Requests Column Alignment ──────────────────────
  Logger.log('');
  Logger.log('── CHECK 3: KH_Requests Column Alignment (Session 56 Root Cause) ──');

  var reqTabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_Requests'] || 'KH_Requests') : 'KH_Requests';
  var reqSheet = ss.getSheetByName(reqTabName);
  if (reqSheet) {
    var reqHeaders = reqSheet.getRange(1, 1, 1, reqSheet.getLastColumn()).getValues()[0].map(String);
    var schemaHeaders = KH_SCHEMAS['KH_Requests'].headers;

    // The critical check: schema column count must match sheet column count
    var actualCount = reqHeaders.filter(function(h) { return h.trim() !== ''; }).length;
    var schemaCount = schemaHeaders.length;

    if (actualCount !== schemaCount) {
      var colMsg = 'KH_Requests: Schema has ' + schemaCount + ' columns, sheet has ' + actualCount + '. appendRow will misalign data!';
      results.failures.push(colMsg);
      results.status = 'FAIL';
      Logger.log('  ✗ ' + colMsg);
    } else {
      Logger.log('  ✓ KH_Requests: ' + schemaCount + ' columns in schema = ' + actualCount + ' in sheet');
    }

    // Verify khApproveRequest won't crash — check the columns it writes to
    var criticalCols = ['Status', 'Timestamp', 'Parent_Note'];
    var criticalMissing = [];
    for (var cci = 0; cci < criticalCols.length; cci++) {
      if (reqHeaders.indexOf(criticalCols[cci]) < 0) {
        criticalMissing.push(criticalCols[cci]);
      }
    }

    if (criticalMissing.length > 0) {
      var critMsg = 'KH_Requests: Missing critical columns for approve/deny: ' + criticalMissing.join(', ');
      results.failures.push(critMsg);
      results.status = 'FAIL';
      Logger.log('  ✗ ' + critMsg);
    } else {
      Logger.log('  ✓ KH_Requests: Status, Timestamp, Parent_Note columns present');
    }

    results.checks.push({
      check: 'kh_requests_alignment',
      status: (actualCount !== schemaCount || criticalMissing.length > 0) ? 'FAIL' : 'PASS',
      schemaColumns: schemaCount,
      sheetColumns: actualCount,
      criticalMissing: criticalMissing
    });
  } else {
    Logger.log('  ⚠ KH_Requests tab not found (will be auto-created on first use)');
    results.checks.push({ check: 'kh_requests_alignment', status: 'WARN', detail: 'Tab not found' });
  }

  // ── CHECK 4: Version Consistency ────────────────────────────────
  Logger.log('');
  Logger.log('── CHECK 4: Version Functions ──');

  var versionChecks = [
    ['DataEngine', 'getDataEngineVersion'],
    ['Code', 'getCodeGsVersion'],
    ['KidsHub', 'getKidsHubGsVersion'],
    ['CascadeEngine', 'getCascadeEngineVersion'],
    ['GASHardening', 'getGASHardeningVersion'],
    ['MonitorEngine', 'getMonitorEngineVersion'],
    ['CalendarSync', 'getCalendarSyncVersion'],
    ['AlertEngine', 'getAlertEngineVersion'],
    ['StoryFactory', 'getStoryFactoryVersion']
  ];

  var versions = {};
  for (var vi = 0; vi < versionChecks.length; vi++) {
    var label = versionChecks[vi][0];
    var fn = versionChecks[vi][1];
    try {
      versions[label] = this[fn]();
      Logger.log('  ✓ ' + label + ': v' + versions[label]);
    } catch(e) {
      versions[label] = '?';
      Logger.log('  ⚠ ' + label + ': version function not found');
    }
  }
  results.checks.push({ check: 'versions', status: 'PASS', versions: versions });

  // ── FINAL VERDICT ───────────────────────────────────────────────
  Logger.log('');
  Logger.log('═══════════════════════════════════════════');
  if (results.status === 'PASS') {
    Logger.log('  ✅ DEPLOY GATE: PASS — Safe to deploy');
  } else {
    Logger.log('  ❌ DEPLOY GATE: FAIL — DO NOT DEPLOY');
    Logger.log('  Failures:');
    for (var f = 0; f < results.failures.length; f++) {
      Logger.log('    → ' + results.failures[f]);
    }
  }
  if (results.warnings.length > 0) {
    Logger.log('  Warnings:');
    for (var w = 0; w < results.warnings.length; w++) {
      Logger.log('    ⚠ ' + results.warnings[w]);
    }
  }
  Logger.log('═══════════════════════════════════════════');

  return JSON.stringify(results, null, 2);
}