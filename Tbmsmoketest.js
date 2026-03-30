// ════════════════════════════════════════════════════════════════════
// tbmSmokeTest.gs — Phase A1: Pre-Deploy Structural Validation
// ════════════════════════════════════════════════════════════════════
// Version history tracked in Notion deploy page. Do not add version comments here.
//
// PURPOSE: Run BEFORE every deploy. Must return all PASS to proceed.
// RUNTIME TARGET: < 15 seconds
// OUTPUT: JSON with PASS/FAIL per category + details
//
// CATEGORIES:
//   1. Wiring — every HTML google.script.run call maps to a server function
//   2. Schema — KH_SCHEMAS match actual sheet headers, TAB_MAP entries resolve
//   3. Growth — row counts within safe limits, cache payload size
//   4. Environment — TAB_MAP defined, triggers present, no unexpected triggers
//   5. Triggers — count within quota, all handlers exist
//
// CATEGORIES REQUIRING SOURCE TEXT (NOT RUNTIME-VERIFIABLE):
//   6. Concurrency — double-lock patterns (MANUAL AUDIT ONLY)
//   7. ES5 Compliance — banned constructs in Fire Stick HTML (MANUAL AUDIT ONLY)
//   8. Row Safety — Task_ID validation on write functions (MANUAL AUDIT ONLY)
//
// USAGE: Run tbmSmokeTest() from Apps Script editor → View → Logs
// ════════════════════════════════════════════════════════════════════

function getSmokeTestVersion() { return 3; }

/**
 * Main entry point. Run this before every deploy.
 * Returns JSON summary. Also logs to console.
 */
function tbmSmokeTest() {
  var startTime = new Date();
  var results = {
    timestamp: startTime.toISOString(),
    overall: 'PASS',
    runtime_ms: 0,
    categories: {},
    meta: {
      source_required_categories: ['6_concurrency', '7_es5_compliance', '8_row_safety'],
      note: 'Categories 6-8 require source text analysis and cannot be verified at runtime. Mark as NOT_VERIFIED in smoke test output. Use tbmRegressionSuite for behavioral checks.'
    }
  };

  // ── Category 1: Wiring ──────────────────────────────────────────
  results.categories['1_wiring'] = checkWiring_();

  // ── Category 2: Schema Alignment ────────────────────────────────
  results.categories['2_schema'] = checkSchemas_();

  // ── Category 3: Growth Metrics ──────────────────────────────────
  results.categories['3_growth'] = checkGrowth_();

  // ── Category 4: Environment ─────────────────────────────────────
  results.categories['4_environment'] = checkEnvironment_();

  // ── Category 5: Triggers ────────────────────────────────────────
  results.categories['5_triggers'] = checkTriggers_();

  // ── Category 9: HTML Contracts ──────────────────────────────────
  results.categories['9_html_contracts'] = checkHTMLContracts_();

  // ── Categories 6-8: Source-level (NOT runtime verifiable) ───────
  results.categories['6_concurrency'] = {
    status: 'NOT_VERIFIED',
    description: 'Double-lock patterns in KH write functions',
    details: 'Requires source text analysis. BUG-001 (double-lock in khCompleteTaskWithBonus) FIXED in KidsHub v24 — completion logic inlined inside single lock scope. Verify no new double-lock patterns introduced.',
    method: 'source_level_only'
  };

  results.categories['7_es5_compliance'] = {
    status: 'NOT_VERIFIED',
    description: 'ES5 banned constructs in Fire Stick HTML surfaces',
    details: 'Automated coverage via category 9_html_contracts (runtime). Manual audit still recommended for constructs regex cannot catch (e.g. nested arrow functions in strings).',
    method: 'source_level_only',
    see_also: '9_html_contracts',
    banned_constructs: ['let ', 'const ', '=>', '`', '...', 'async ', 'await ', '?.', '??']
  };

  results.categories['8_row_safety'] = {
    status: 'NOT_VERIFIED',
    description: 'Task_ID validation on all KH write functions',
    details: 'Requires source text analysis. KidsHub v24 added expectedTaskID param to 6 write functions (khCompleteTask, khApproveTask, khUncompleteTask, khOverrideTask, khRejectTask, khApproveWithBonus). Backward-compatible — validation skips if client omits taskID. Full protection requires KidsHub.html v27 + TheVein.html v58 client updates.',
    method: 'source_level_only'
  };

  // ── Compute overall status ──────────────────────────────────────
  var cats = results.categories;
  var hasWarn = false;
  for (var key in cats) {
    if (cats.hasOwnProperty(key)) {
      if (cats[key].status === 'FAIL') { results.overall = 'FAIL'; break; }
      if (cats[key].status === 'WARN') hasWarn = true;
    }
  }
  if (results.overall !== 'FAIL' && hasWarn) results.overall = 'WARN';

  results.runtime_ms = new Date().getTime() - startTime.getTime();

  // Log full results
  Logger.log('═══ TBM SMOKE TEST RESULTS ═══');
  Logger.log(JSON.stringify(results, null, 2));
  Logger.log('═══ OVERALL: ' + results.overall + ' (' + results.runtime_ms + 'ms) ═══');

  return JSON.stringify(results, null, 2);
}


// ════════════════════════════════════════════════════════════════════
// CATEGORY 1: WIRING
// Verify every known HTML google.script.run call has a matching
// server-side function definition.
// ════════════════════════════════════════════════════════════════════

function checkWiring_() {
  var result = {
    status: 'PASS',
    description: 'Every google.script.run call from HTML surfaces maps to an existing server function',
    details: '',
    method: 'runtime',
    checked: 0,
    missing: []
  };

  // Canonical list: every *Safe function called from any HTML surface
  // Source: grep -oP '\\w+Safe\\w*' across all 5 HTML files (Session 59 extraction)
  var expectedFunctions = [
    // KidsHub.html (18 functions)
    'addKidsEventSafe', 'getKHAppUrlsSafe', 'getKidsHubDataSafe',
    'khAddDeductionSafe', 'khApproveRequestSafe', 'khApproveTaskSafe',
    'khApproveWithBonusSafe', 'khCompleteTaskSafe', 'khCompleteTaskWithBonusSafe',
    'khDenyRequestSafe', 'khOverrideTaskSafe', 'khRedeemRewardSafe',
    'khRejectTaskSafe', 'khResetTasksSafe', 'khSubmitRequestSafe',
    'khUncompleteTaskSafe', 'khVerifyPinSafe', 'runStoryFactorySafe',
    // ThePulse.html (8 functions)
    'getCategoryTransactionsSafe', 'getDataSafe', 'getKidsHubWidgetDataSafe',
    'getMonthsSafe', 'getReconcileStatusSafe', 'getScriptUrlSafe',
    'getSimulatorDataSafe', 'getWeeklyTrackerDataSafe',
    // TheSoul.html (2 functions)
    'getBoardDataSafe', 'getKidsHubDataSafe',
    // TheSpine.html (4 functions)
    'getBoardDataSafe', 'getDataSafe', 'getKidsHubDataSafe', 'getSpineHeartbeatSafe',
    // TheVein.html (19 functions)
    'getCashFlowForecastSafe', 'getCloseHistoryDataSafe', 'getDataSafe',
    'getKidsHubWidgetDataSafe', 'getMERGateStatusSafe', 'getMonthsSafe',
    'getReconcileStatusSafe', 'getScriptUrlSafe', 'getSubscriptionDataSafe',
    'getSystemHealthSafe', 'khAddBonusTaskSafe', 'khApproveRequestSafe',
    'khApproveTaskSafe', 'khApproveWithBonusSafe', 'khDebitScreenTimeSafe',
    'khDenyRequestSafe', 'khOverrideTaskSafe', 'khRejectTaskSafe',
    'khSetBankOpeningSafe', 'khSubmitGradeSafe', 'khGetGradeHistorySafe',
    'runMERGatesSafe', 'stampCloseMonthSafe', 'updateFamilyNoteSafe',
    // v52: Feedback + Education (ThePulse, TheVein, education modules)
    'submitFeedbackSafe', 'getAudioBatchSafe',
    'logHomeworkCompletionSafe', 'logSparkleProgressSafe'
  ];

  // Deduplicate
  var seen = {};
  var unique = [];
  for (var i = 0; i < expectedFunctions.length; i++) {
    if (!seen[expectedFunctions[i]]) {
      seen[expectedFunctions[i]] = true;
      unique.push(expectedFunctions[i]);
    }
  }

  result.checked = unique.length;

  for (var j = 0; j < unique.length; j++) {
    var fnName = unique[j];
    try {
      if (typeof this[fnName] !== 'function') {
        result.missing.push(fnName);
      }
    } catch (e) {
      result.missing.push(fnName + ' (error: ' + e.message + ')');
    }
  }

  if (result.missing.length > 0) {
    result.status = 'FAIL';
    result.details = result.missing.length + ' of ' + result.checked + ' functions NOT FOUND: ' + result.missing.join(', ');
  } else {
    result.details = 'All ' + result.checked + ' functions verified present.';
  }

  return result;
}


// ════════════════════════════════════════════════════════════════════
// CATEGORY 2: SCHEMA ALIGNMENT
// Verify KH_SCHEMAS match actual sheet headers and TAB_MAP resolves.
// ════════════════════════════════════════════════════════════════════

function checkSchemas_() {
  var result = {
    status: 'PASS',
    description: 'KH_SCHEMAS match actual sheet headers. TAB_MAP entries resolve to real tabs.',
    details: '',
    method: 'runtime',
    schema_checks: [],
    tab_map_checks: { total: 0, resolved: 0, missing: [] }
  };

  var failures = [];

  // ── Check KH_SCHEMAS ──
  if (typeof KH_SCHEMAS === 'undefined') {
    result.status = 'FAIL';
    result.details = 'KH_SCHEMAS is undefined. KidsHub.gs may not be loaded.';
    return result;
  }

  var ss = SpreadsheetApp.openById(SSID);

  for (var tabKey in KH_SCHEMAS) {
    if (!KH_SCHEMAS.hasOwnProperty(tabKey)) continue;
    var schema = KH_SCHEMAS[tabKey];
    if (!schema || !schema.headers) continue;

    var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP[tabKey]) ? TAB_MAP[tabKey] : tabKey;
    var sheet = ss.getSheetByName(tabName);
    var check = { tab: tabKey, resolvedName: tabName, status: 'PASS', details: '' };

    if (!sheet) {
      // Tab might not exist yet (e.g., KH_ScreenTime auto-creates on first use)
      check.status = 'WARN';
      check.details = 'Tab not found (may auto-create on first use)';
    } else {
      var lastCol = sheet.getLastColumn();
      if (lastCol === 0) {
        check.status = 'WARN';
        check.details = 'Tab exists but is empty';
      } else {
        var actualHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
        var expectedHeaders = schema.headers;

        // Check count match
        if (actualHeaders.length !== expectedHeaders.length) {
          check.status = 'FAIL';
          check.details = 'Column count mismatch: schema=' + expectedHeaders.length + ', actual=' + actualHeaders.length;
          failures.push(tabKey + ': ' + check.details);
        } else {
          // Check header names match
          var mismatched = [];
          for (var c = 0; c < expectedHeaders.length; c++) {
            if (actualHeaders[c] !== expectedHeaders[c]) {
              mismatched.push('col ' + (c + 1) + ': expected "' + expectedHeaders[c] + '", got "' + actualHeaders[c] + '"');
            }
          }
          if (mismatched.length > 0) {
            check.status = 'FAIL';
            check.details = mismatched.join('; ');
            failures.push(tabKey + ': ' + check.details);
          } else {
            check.details = expectedHeaders.length + ' columns matched';
          }
        }
      }
    }

    result.schema_checks.push(check);
  }

  // ── Check TAB_MAP ──
  if (typeof TAB_MAP !== 'undefined') {
    for (var logicalName in TAB_MAP) {
      if (!TAB_MAP.hasOwnProperty(logicalName)) continue;
      result.tab_map_checks.total++;
      var physicalName = TAB_MAP[logicalName];
      var tabSheet = ss.getSheetByName(physicalName);
      if (tabSheet) {
        result.tab_map_checks.resolved++;
      } else {
        result.tab_map_checks.missing.push(logicalName + ' → "' + physicalName + '"');
      }
    }
  } else {
    result.status = 'FAIL';
    failures.push('TAB_MAP is undefined');
  }

  // v3: Auto-create known setup-able tabs (Tightening Plan 1.3)
  if (result.tab_map_checks.missing.length > 0) {
    var missingAfterSetup = [];
    for (var am = 0; am < result.tab_map_checks.missing.length; am++) {
      if (result.tab_map_checks.missing[am].indexOf('Feedback') === 0) {
        try {
          setupFeedbackSheet();
          result.tab_map_checks.resolved++;
          result.details = (result.details ? result.details + ' ' : '') + 'Feedback tab auto-created.';
        } catch(eSetup) {
          missingAfterSetup.push(result.tab_map_checks.missing[am] + ' (auto-create failed: ' + eSetup.message + ')');
        }
      } else {
        missingAfterSetup.push(result.tab_map_checks.missing[am]);
      }
    }
    result.tab_map_checks.missing = missingAfterSetup;
  }

  if (result.tab_map_checks.missing.length > 0) {
    // Unresolved TAB_MAP entries are WARN, not FAIL — code gracefully handles null.
    if (result.status !== 'FAIL') result.status = 'WARN';
    result.details = (result.details ? result.details + ' | ' : '') +
      'TAB_MAP WARN: ' + result.tab_map_checks.missing.length + ' entries point to non-existent tabs: ' +
      result.tab_map_checks.missing.join(', ');
  }

  if (failures.length > 0) {
    result.status = 'FAIL';
    result.details = failures.length + ' issues: ' + failures.join(' | ');
  } else if (result.status !== 'WARN') {
    // Only set "all good" message if we're not already in WARN state from TAB_MAP
    result.details = result.schema_checks.length + ' schemas checked, ' +
      result.tab_map_checks.resolved + '/' + result.tab_map_checks.total + ' TAB_MAP entries resolved.';
  } else {
    // WARN state — prepend the schema pass info to the existing WARN details
    result.details = result.schema_checks.length + ' schemas PASS, ' +
      result.tab_map_checks.resolved + '/' + result.tab_map_checks.total + ' TAB_MAP resolved. ' + result.details;
  }

  return result;
}


// ════════════════════════════════════════════════════════════════════
// CATEGORY 3: GROWTH METRICS
// Check row counts, warn/fail at defined thresholds.
// ════════════════════════════════════════════════════════════════════

function checkGrowth_() {
  var result = {
    status: 'PASS',
    description: 'KH_History, Transactions, Balance History row counts within safe limits',
    details: '',
    method: 'runtime',
    metrics: {}
  };

  var ss = SpreadsheetApp.openById(SSID);
  var warnings = [];
  var failures = [];

  // ── Define thresholds ──
  var checks = [
    { logical: 'KH_History',       warnAt: 5000,  failAt: 15000 },
    { logical: 'Transactions',     warnAt: 15000, failAt: 19000 },
    { logical: 'Balance History',  warnAt: 15000, failAt: 20000 },
    { logical: 'KH_Chores',       warnAt: 100,   failAt: 300 },
    { logical: 'KH_Redemptions',  warnAt: 2000,  failAt: 10000 }
  ];

  for (var i = 0; i < checks.length; i++) {
    var c = checks[i];
    var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP[c.logical]) ? TAB_MAP[c.logical] : c.logical;
    var sheet = ss.getSheetByName(tabName);

    if (!sheet) {
      result.metrics[c.logical] = { rows: 0, status: 'MISSING', warn: c.warnAt, fail: c.failAt };
      continue;
    }

    var rowCount = sheet.getLastRow();
    var status = 'OK';

    if (rowCount >= c.failAt) {
      status = 'FAIL';
      failures.push(c.logical + ': ' + rowCount + ' rows (limit: ' + c.failAt + ')');
    } else if (rowCount >= c.warnAt) {
      status = 'WARN';
      warnings.push(c.logical + ': ' + rowCount + ' rows (warn at ' + c.warnAt + ')');
    }

    result.metrics[c.logical] = { rows: rowCount, status: status, warn: c.warnAt, fail: c.failAt };
  }

  if (failures.length > 0) {
    result.status = 'FAIL';
    result.details = 'FAIL: ' + failures.join('; ');
    if (warnings.length > 0) result.details += ' | WARN: ' + warnings.join('; ');
  } else if (warnings.length > 0) {
    result.status = 'WARN';
    result.details = 'WARN: ' + warnings.join('; ');
  } else {
    var summaryParts = [];
    for (var key in result.metrics) {
      if (result.metrics.hasOwnProperty(key)) {
        summaryParts.push(key + ': ' + result.metrics[key].rows);
      }
    }
    result.details = 'All within limits. ' + summaryParts.join(', ');
  }

  return result;
}


// ════════════════════════════════════════════════════════════════════
// CATEGORY 4: ENVIRONMENT
// Verify TAB_MAP, version functions, critical config.
// ════════════════════════════════════════════════════════════════════

function checkEnvironment_() {
  var result = {
    status: 'PASS',
    description: 'TAB_MAP defined, version functions present, critical config intact',
    details: '',
    method: 'runtime',
    checks: {}
  };

  var failures = [];

  // ── TAB_MAP ──
  if (typeof TAB_MAP === 'undefined') {
    failures.push('TAB_MAP is undefined');
    result.checks.TAB_MAP = 'UNDEFINED';
  } else {
    var tabCount = 0;
    for (var k in TAB_MAP) { if (TAB_MAP.hasOwnProperty(k)) tabCount++; }
    result.checks.TAB_MAP = 'OK (' + tabCount + ' entries)';
  }

  // ── Version functions ──
  var versionFns = [
    { name: 'getDataEngineVersion', file: 'DataEngine.gs' },
    { name: 'getCodeGsVersion', file: 'Code.gs' },
    { name: 'getCascadeEngineVersion', file: 'CascadeEngine.gs' },
    { name: 'getKidsHubVersion', file: 'KidsHub.gs' },
    { name: 'getSmokeTestVersion', file: 'tbmSmokeTest.gs' }
  ];

  var versions = {};
  for (var i = 0; i < versionFns.length; i++) {
    var vf = versionFns[i];
    try {
      if (typeof this[vf.name] === 'function') {
        versions[vf.file] = 'v' + this[vf.name]();
      } else {
        versions[vf.file] = 'NOT_FOUND';
        // Don't fail for missing version functions — some may not have them
      }
    } catch (e) {
      versions[vf.file] = 'ERROR: ' + e.message;
    }
  }
  result.checks.versions = versions;

  // ── KH_SCHEMAS ──
  if (typeof KH_SCHEMAS === 'undefined') {
    failures.push('KH_SCHEMAS is undefined');
    result.checks.KH_SCHEMAS = 'UNDEFINED';
  } else {
    var schemaCount = 0;
    for (var s in KH_SCHEMAS) { if (KH_SCHEMAS.hasOwnProperty(s)) schemaCount++; }
    result.checks.KH_SCHEMAS = 'OK (' + schemaCount + ' schemas)';
  }

  // ── PropertiesService check ──
  try {
    var props = PropertiesService.getScriptProperties();
    var allProps = props.getProperties();
    var propKeys = [];
    for (var pk in allProps) { if (allProps.hasOwnProperty(pk)) propKeys.push(pk); }
    result.checks.scriptProperties = propKeys.length + ' keys present';
    // Check for critical keys
    var criticalKeys = ['NOTION_API_KEY'];
    for (var ci = 0; ci < criticalKeys.length; ci++) {
      if (!allProps[criticalKeys[ci]]) {
        // Warn but don't fail — not all environments have all keys
        result.checks['prop_' + criticalKeys[ci]] = 'MISSING';
      }
    }
  } catch (e) {
    result.checks.scriptProperties = 'ERROR: ' + e.message;
  }

  // ── Duplicate function name check (limited — checks known risky names) ──
  // GAS shares global scope. If two files define the same function name,
  // the last one loaded wins silently. We can't enumerate all functions,
  // but we can check critical ones resolve to expected behavior.
  var criticalFunctions = ['getDataSafe', 'getBoardDataSafe', 'getKidsHubDataSafe', 'khCompleteTaskSafe'];
  for (var cf = 0; cf < criticalFunctions.length; cf++) {
    if (typeof this[criticalFunctions[cf]] !== 'function') {
      failures.push('Critical function missing: ' + criticalFunctions[cf]);
    }
  }

  if (failures.length > 0) {
    result.status = 'FAIL';
    result.details = failures.join('; ');
  } else {
    result.details = 'Environment healthy. ' + JSON.stringify(versions);
  }

  return result;
}


// ════════════════════════════════════════════════════════════════════
// CATEGORY 5: TRIGGERS
// Verify trigger count within quota, all handlers are real functions.
// ════════════════════════════════════════════════════════════════════

function checkTriggers_() {
  var result = {
    status: 'PASS',
    description: 'Active triggers within quota (max 20), all handlers exist',
    details: '',
    method: 'runtime',
    triggers: [],
    count: 0,
    orphaned: [],
    quota_headroom: 0
  };

  var GAS_TRIGGER_LIMIT = 20;
  var WARN_THRESHOLD = 15;

  try {
    var triggers = ScriptApp.getProjectTriggers();
    result.count = triggers.length;
    result.quota_headroom = GAS_TRIGGER_LIMIT - triggers.length;

    for (var i = 0; i < triggers.length; i++) {
      var t = triggers[i];
      var handlerName = t.getHandlerFunction();
      var triggerType = t.getEventType().toString();

      var triggerInfo = {
        handler: handlerName,
        type: triggerType,
        exists: typeof this[handlerName] === 'function'
      };

      result.triggers.push(triggerInfo);

      if (!triggerInfo.exists) {
        result.orphaned.push(handlerName);
      }
    }

    // Check thresholds
    if (result.count >= GAS_TRIGGER_LIMIT) {
      result.status = 'FAIL';
      result.details = 'TRIGGER LIMIT HIT: ' + result.count + '/' + GAS_TRIGGER_LIMIT;
    } else if (result.count >= WARN_THRESHOLD) {
      result.status = 'WARN';
      result.details = 'Approaching trigger limit: ' + result.count + '/' + GAS_TRIGGER_LIMIT;
    }

    if (result.orphaned.length > 0) {
      result.status = 'FAIL';
      result.details = (result.details ? result.details + ' | ' : '') +
        'Orphaned triggers (handler function missing): ' + result.orphaned.join(', ');
    }

    if (result.status === 'PASS') {
      result.details = result.count + ' triggers active (' + result.quota_headroom + ' slots remaining). All handlers verified.';
    }

  } catch (e) {
    result.status = 'FAIL';
    result.details = 'Error reading triggers: ' + e.message;
  }

  return result;
}


// ════════════════════════════════════════════════════════════════════
// QUICK HELPER: Run just the wiring check
// ════════════════════════════════════════════════════════════════════
function smokeTestWiringOnly() {
  var result = checkWiring_();
  Logger.log(JSON.stringify(result, null, 2));
  return JSON.stringify(result, null, 2);
}


// ════════════════════════════════════════════════════════════════════
// QUICK HELPER: Run just the growth check
// ════════════════════════════════════════════════════════════════════
function smokeTestGrowthOnly() {
  var result = checkGrowth_();
  Logger.log(JSON.stringify(result, null, 2));
  return JSON.stringify(result, null, 2);
}


// ════════════════════════════════════════════════════════════════════
// CATEGORY 9: HTML CONTRACT VALIDATION (Tightening Plan 2.1)
// Runtime scan of all HTML surfaces for ES5 violations + structure.
// ════════════════════════════════════════════════════════════════════

function checkHTMLContracts_() {
  var result = {
    status: 'PASS',
    description: 'All HTML surfaces load cleanly and pass ES5 + structural contracts',
    details: '',
    method: 'runtime',
    surfaces: {}
  };

  var surfaces = ['ThePulse', 'TheVein', 'KidsHub', 'TheSpine', 'TheSoul', 'SparkleLearning'];
  var allIssues = [];

  for (var i = 0; i < surfaces.length; i++) {
    var name = surfaces[i];
    var surfaceIssues = [];
    var html;

    try {
      html = HtmlService.createHtmlOutputFromFile(name).getContent();
    } catch(e) {
      surfaceIssues.push('FILE_NOT_FOUND: ' + e.message);
      result.surfaces[name] = { status: 'FAIL', issues: surfaceIssues };
      allIssues.push(name + ': FILE NOT FOUND');
      continue;
    }

    // ES5 violations
    if (/[^=!<>]=>/.test(html)) surfaceIssues.push('arrow function');
    if (/\blet\s+\w/.test(html)) surfaceIssues.push('let keyword');
    if (/\bconst\s+\w/.test(html)) surfaceIssues.push('const keyword');
    if (/`[^`]*\$\{/.test(html)) surfaceIssues.push('template literal');
    if (/\?\?/.test(html)) surfaceIssues.push('nullish coalescing ??');
    if (/\?\./.test(html)) surfaceIssues.push('optional chaining ?.');
    if (/\.includes\s*\(/.test(html)) surfaceIssues.push('Array.includes()');
    if (/backdrop-filter\s*:[^n]/.test(html)) surfaceIssues.push('backdrop-filter (non-none)');

    // Structural contracts
    if (html.indexOf('tbm-version') === -1) surfaceIssues.push('missing tbm-version meta tag');
    if (html.indexOf('google.script.run') === -1) surfaceIssues.push('no google.script.run calls');

    if (surfaceIssues.length > 0) {
      result.surfaces[name] = { status: 'FAIL', issues: surfaceIssues };
      for (var j = 0; j < surfaceIssues.length; j++) {
        allIssues.push(name + ': ' + surfaceIssues[j]);
      }
    } else {
      result.surfaces[name] = { status: 'PASS', issues: [] };
    }
  }

  if (allIssues.length > 0) {
    result.status = 'FAIL';
    result.details = allIssues.length + ' issue(s): ' + allIssues.join(' | ');
  } else {
    result.details = surfaces.length + ' surfaces passed all contracts.';
  }

  return result;
}

// END OF FILE — tbmSmokeTest.gs v3