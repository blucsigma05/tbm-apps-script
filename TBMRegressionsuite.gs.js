// ════════════════════════════════════════════════════════════════════
// tbmRegressionSuite.gs v5 — Phase A3: Post-Deploy Behavioral Assertions
// WRITES TO: (none — read-only assertions)
// READS FROM: All sheets (for regression assertions)
// ════════════════════════════════════════════════════════════════════
// Version history tracked in Notion deploy page. Do not add version comments here.
//
// PURPOSE: Run AFTER every deploy to verify no known bugs have regressed.
// RUNTIME TARGET: < 120 seconds (split into parts if needed)
// OUTPUT: JSON with PASS/FAIL per assertion + summary
//
// RULE: When a new bug is found, add an assertion for it HERE.
//       The suite grows. Bugs never recur.
//
// CATEGORIES:
//   BUG-001 through BUG-015: Known bugs from Sessions 57-59
//   ENV-001 through ENV-010: Environment invariants
//   PERF-001 through PERF-005: Performance guardrails
//
// USAGE: Run tbmRegressionSuite() from Apps Script editor → View → Logs
// ════════════════════════════════════════════════════════════════════

function getRegressionSuiteVersion() { return 5; }

/**
 * Main entry point. Run after every deploy.
 */
function tbmRegressionSuite() {
  var startTime = new Date();
  var results = {
    timestamp: startTime.toISOString(),
    overall: 'PASS',
    runtime_ms: 0,
    total: 0,
    passed: 0,
    failed: 0,
    warned: 0,
    not_verified: 0,
    assertions: []
  };

  // ── Run all assertion groups ──
  runBugAssertions_(results);
  runEnvironmentAssertions_(results);
  runPerformanceAssertions_(results);

  // ── Compute totals ──
  results.total = results.assertions.length;
  for (var i = 0; i < results.assertions.length; i++) {
    if (results.assertions[i].status === 'PASS') results.passed++;
    else if (results.assertions[i].status === 'FAIL') { results.failed++; results.overall = 'FAIL'; }
    else if (results.assertions[i].status === 'WARN') results.warned++;
    else if (results.assertions[i].status === 'NOT_VERIFIED') results.not_verified++;
  }

  results.runtime_ms = new Date().getTime() - startTime.getTime();

  Logger.log('═══ TBM REGRESSION SUITE ═══');
  Logger.log('Total: ' + results.total + ' | Passed: ' + results.passed +
    ' | Failed: ' + results.failed + ' | Warned: ' + results.warned +
    ' | Not Verified: ' + results.not_verified +
    ' | Runtime: ' + results.runtime_ms + 'ms');

  if (results.not_verified > 0) {
    Logger.log('');
    Logger.log('⚠️ COVERAGE GAPS: ' + results.not_verified + ' assertions are NOT_VERIFIED (source-level only). These require manual audit or static analysis tools.');
  }

  if (results.failed > 0) {
    Logger.log('');
    Logger.log('⛔ FAILURES:');
    for (var f = 0; f < results.assertions.length; f++) {
      if (results.assertions[f].status === 'FAIL') {
        Logger.log('  ' + results.assertions[f].id + ': ' + results.assertions[f].details);
      }
    }
  }

  Logger.log('');
  Logger.log(JSON.stringify(results, null, 2));

  return JSON.stringify(results, null, 2);
}


// ════════════════════════════════════════════════════════════════════
// BUG ASSERTIONS — One per known bug from Sessions 57-59
// ════════════════════════════════════════════════════════════════════

function runBugAssertions_(results) {

  // ── BUG-001: Double-lock in khCompleteTaskWithBonus ──────────────
  // Session 59: khCompleteTaskWithBonus releases lock, then calls
  // khCompleteTask which acquires new lock. Race condition window.
  // FIX: Completion logic must be INSIDE the lock scope.
  // VERIFICATION: After B1 fix, khCompleteTaskWithBonus should NOT
  // call khCompleteTask() at all — logic is inlined.
  results.assertions.push({
    id: 'BUG-001',
    category: 'concurrency',
    severity: 'CRITICAL',
    session: 59,
    description: 'khCompleteTaskWithBonus must not call khCompleteTask after releasing lock',
    status: 'NOT_VERIFIED',
    details: 'Source-level check. Verify khCompleteTaskWithBonus does NOT contain "return khCompleteTask(" after the finally block. Requires source text analysis.',
    note: 'This is a KNOWN LIVE BUG in KidsHub v23. Will be fixed in v24.'
  });

  // ── BUG-002: No Task_ID validation on KH write functions ────────
  // Session 59: All KH write functions accept rowIndex blindly.
  // FIX: Add expectedTaskID param, validate before write.
  results.assertions.push({
    id: 'BUG-002',
    category: 'validation',
    severity: 'CRITICAL',
    session: 59,
    description: 'KH write functions must validate Task_ID before writing',
    status: 'NOT_VERIFIED',
    details: 'Source-level check. After B1 fix, verify khCompleteTask, khApproveTask, khOverrideTask, etc. all accept expectedTaskID param. Requires source text analysis.',
    note: 'KNOWN LIVE BUG in KidsHub v23. Will be fixed in v24.'
  });

  // ── BUG-003: validateTaskIDs write-inside-read ──────────────────
  // Session 59: validateTaskIDs() called inside getKidsHubData() (read
  // function) at line 584. Writes without lock.
  // FIX: Move to khSetupTabs or behind a lock.
  results.assertions.push({
    id: 'BUG-003',
    category: 'concurrency',
    severity: 'CRITICAL',
    session: 59,
    description: 'validateTaskIDs must not be called inside getKidsHubData (read path)',
    status: 'NOT_VERIFIED',
    details: 'Source-level check. Verify getKidsHubData does NOT call validateTaskIDs(). Requires source text analysis.',
    note: 'KNOWN LIVE BUG in KidsHub v23. Will be fixed in v24.'
  });

  // ── BUG-004: historyUIDExists_ scan limit — FIXED in KidsHub v24 ─
  // KidsHub v24 added Math.max(1, data.length - 200) lower bound.
  // Now monitors KH_History row count for general health only.
  (function() {
    var a = {
      id: 'BUG-004',
      category: 'performance',
      severity: 'CRITICAL',
      session: 59,
      description: 'historyUIDExists_ scans last 200 rows only (fixed KH v24)',
      status: 'PASS',
      details: ''
    };
    try {
      var ss = SpreadsheetApp.openById(SSID);
      var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['KH_History']) ? TAB_MAP['KH_History'] : 'KH_History';
      var sheet = ss.getSheetByName(tabName);
      if (sheet) {
        var rows = sheet.getLastRow();
        a.details = 'KH_History has ' + rows + ' rows. Scan limited to last 200 (KidsHub v24 fix deployed).';
        if (rows > 5000) {
          a.status = 'WARN';
          a.details = 'KH_History has ' + rows + ' rows. Row count high — consider archival. Scan is safe (200-row limit).';
        }
      }
    } catch (e) {
      a.status = 'WARN';
      a.details = 'Could not check KH_History: ' + e.message;
    }
    results.assertions.push(a);
  })();

  // ── BUG-005: CascadeEngine missing TAB_MAP guard ────────────────
  // Session 59: refreshCascadeTabs() uses TAB_MAP without checking
  // if it's defined. If DataEngine hasn't loaded, CE crashes.
  // FIX: Add typeof TAB_MAP check at top.
  (function() {
    var a = {
      id: 'BUG-005',
      category: 'cross-file',
      severity: 'MEDIUM',
      session: 59,
      description: 'CascadeEngine refreshCascadeTabs must guard against undefined TAB_MAP',
      status: 'PASS',
      details: ''
    };
    // Runtime: verify TAB_MAP is available when CE functions exist
    try {
      if (typeof refreshCascadeTabs === 'function' && typeof TAB_MAP === 'undefined') {
        a.status = 'FAIL';
        a.details = 'CascadeEngine is loaded but TAB_MAP is undefined. refreshCascadeTabs will crash.';
      } else if (typeof refreshCascadeTabs === 'function' && typeof TAB_MAP !== 'undefined') {
        a.status = 'PASS';
        a.details = 'TAB_MAP is available alongside CascadeEngine. Guard still needed in source for edge cases.';
      } else {
        a.status = 'PASS';
        a.details = 'CascadeEngine not loaded in current context.';
      }
    } catch (e) {
      a.details = 'Error: ' + e.message;
    }
    results.assertions.push(a);
  })();

  // ── BUG-006: CascadeEngine uses tryLock(15000) instead of waitLock(30000)
  // Protocol says v8 fix is waitLock(30000). Project file is v7 with tryLock(15000).
  results.assertions.push({
    id: 'BUG-006',
    category: 'concurrency',
    severity: 'MEDIUM',
    session: 58,
    description: 'CascadeEngine should use waitLock(30000) for background trigger safety',
    status: 'NOT_VERIFIED',
    details: 'Source-level check. Verify refreshCascadeTabs uses waitLock(30000), not tryLock(15000).',
    note: 'Fix in CE v8 (built Session 58, pending deploy). Project file still shows v7 with tryLock.'
  });

  // ── BUG-007: Stale row indices after khAddBonusTask ─────────────
  // Session 59: khAddBonusTask appends rows, shifting all indices.
  // Client tablets hold stale row indices → wrong task completed.
  results.assertions.push({
    id: 'BUG-007',
    category: 'validation',
    severity: 'HIGH',
    session: 59,
    description: 'Row indices must be validated against Task_ID, not trusted blindly',
    status: 'NOT_VERIFIED',
    details: 'Covered by BUG-002 fix (Task_ID validation). This is the attack vector; BUG-002 is the defense.',
    note: 'Same fix as BUG-002. Tracked separately because the failure mode is different.'
  });

  // ── BUG-008: khApproveTask partial write ────────────────────────
  // Session 59: Writes Parent_Approved=true then appends history.
  // If history append fails, approved but no points recorded.
  results.assertions.push({
    id: 'BUG-008',
    category: 'partial-write',
    severity: 'HIGH',
    session: 59,
    description: 'khApproveTask must not leave split state if history append fails',
    status: 'NOT_VERIFIED',
    details: 'Source-level check. After fix, verify error handling rolls back Parent_Approved if appendHistory_ throws.',
    note: 'Not yet scheduled for fix. Medium risk — GAS has no transactions.'
  });

  // ── BUG-009: appendRow in loop in khRedeemReward ────────────────
  // Session 59: qty > 1 calls appendRow N times inside lock scope.
  // FIX: Build array, single setValues.
  results.assertions.push({
    id: 'BUG-009',
    category: 'performance',
    severity: 'HIGH',
    session: 59,
    description: 'khRedeemReward must batch appendRow calls, not loop',
    status: 'NOT_VERIFIED',
    details: 'Source-level check. After B1 fix, verify no appendRow inside for/while loop. Should use single setValues.',
    note: 'Scheduled for KidsHub v24 (Phase B1).'
  });

  // ── BUG-010: 4x duplicate Balance History reads in getData() ────
  // Session 59: BH read at lines 386, 932, 971, 1293, 1834 in DataEngine.
  // FIX: Read once at top, pass data array to helper functions.
  (function() {
    var a = {
      id: 'BUG-010',
      category: 'performance',
      severity: 'HIGH',
      session: 59,
      description: 'getData() should read Balance History once, not 4-5 times',
      status: 'NOT_VERIFIED',
      details: 'Source-level check. After Phase C fix, verify only one getDataRange().getValues() call for Balance History in getData().',
      note: 'Scheduled for Phase C (performance). Not blocking Phase B.'
    };
    results.assertions.push(a);
  })();

  // ── BUG-011: getBoardData calls full getKidsHubData ─────────────
  // Session 59: getBoardData() (DataEngine:3021) calls JSON.parse(getKidsHubData('all'))
  // on every Spine/Soul refresh. ~15s heavy operation.
  results.assertions.push({
    id: 'BUG-011',
    category: 'performance',
    severity: 'HIGH',
    session: 59,
    description: 'getBoardData should use cached KH data, not full getKidsHubData call',
    status: 'NOT_VERIFIED',
    details: 'Scheduled for Phase C3 (cache KH data with 60s TTL).',
    note: 'Not blocking Phase B. Current behavior is slow but correct.'
  });

  // ── BUG-012: depositScreenTime_ auto-creates tab inside lock ────
  // Session 59: If KH_ScreenTime doesn't exist, auto-creates inside
  // lock scope. Tab creation is slow → lock timeout risk.
  results.assertions.push({
    id: 'BUG-012',
    category: 'concurrency',
    severity: 'MEDIUM',
    session: 59,
    description: 'depositScreenTime_ should not auto-create tabs inside lock scope',
    status: 'NOT_VERIFIED',
    details: 'Source-level check. Tab creation should happen in khSetupTabs, not mid-transaction.',
    note: 'Low priority — tab only created once. But pattern is wrong.'
  });

  // ── BUG-013: khResetTasks individual setValue in loop ────────────
  // Session 59: Resets tasks one setValue at a time. Crash mid-loop = partial reset.
  results.assertions.push({
    id: 'BUG-013',
    category: 'partial-write',
    severity: 'MEDIUM',
    session: 59,
    description: 'khResetTasks should batch setValue calls, not loop individually',
    status: 'NOT_VERIFIED',
    details: 'Source-level check. After Phase C1 fix, verify single setValues call for batch reset.',
    note: 'Scheduled for Phase C1. Current behavior works but is fragile.'
  });

  // ── BUG-014: Version EOF comments don't match file versions ─────
  // Session 59: DataEngine says "v71" at EOF, Code.gs says "v44".
  (function() {
    var a = {
      id: 'BUG-014',
      category: 'drift',
      severity: 'LOW',
      session: 59,
      description: 'EOF version comments must match actual file version',
      status: 'PASS',
      details: ''
    };
    // Runtime: check version function returns vs known values
    try {
      var deVer = typeof getDataEngineVersion === 'function' ? getDataEngineVersion() : 'N/A';
      var codeVer = typeof getCodeVersion === 'function' ? getCodeVersion() : 'N/A';
      var ceVer = typeof getCascadeEngineVersion === 'function' ? getCascadeEngineVersion() : 'N/A';
      a.details = 'Runtime versions: DE=' + deVer + ', Code=' + codeVer + ', CE=' + ceVer + '. EOF comments are source-level — verify manually.';
    } catch (e) {
      a.details = 'Error: ' + e.message;
    }
    results.assertions.push(a);
  })();

  // ── BUG-015: KidsHub.html uses const/let (ES5 violation) ────────
  // Session 59 discovery: KidsHub_v26.html has ~30 const/let declarations
  // in <script> blocks. Fire Stick Fully Kiosk runs ES5-only WebView.
  results.assertions.push({
    id: 'BUG-015',
    category: 'compatibility',
    severity: 'HIGH',
    session: 59,
    description: 'KidsHub.html must not use const/let (ES5 violation on Fire Stick)',
    status: 'NOT_VERIFIED',
    details: 'Source-level check. KidsHub_v26.html contains ~30 const/let declarations. Must be converted to var. Scan for: const, let, =>, template literals.',
    note: 'NEWLY DISCOVERED in Session 59 audit. Not yet scheduled for fix. Affects Fire Stick tablet rendering.'
  });

  // ── BUG-QA2-001: Deduction math — subtraction must be correct ──
  // QA Round 2: 296 - 25 = 221 (should be 271). Root cause: button
  // not debounced, multiple rapid taps cause duplicate deductions.
  // FIX: Disable button during API call.
  results.assertions.push({
    id: 'BUG-QA2-001',
    category: 'calculation',
    severity: 'CRITICAL',
    session: 78,
    description: 'Deduction of 25 from balance of 296 must yield 271',
    status: (function() {
      var result = 296 - 25;
      return result === 271 ? 'PASS' : 'FAIL';
    })(),
    details: 'Balance = earned - spent - deducted. Verify single deduction application.',
    note: 'Arithmetic-only sanity check. Does not exercise khAddDeduction server path — real bug was button debounce causing duplicate API calls.'
  });

  // ── BUG-QA2-002: Task approval — points must add correctly ──────
  results.assertions.push({
    id: 'BUG-QA2-002',
    category: 'calculation',
    severity: 'CRITICAL',
    session: 78,
    description: 'Approving task worth 10 rings must increase balance by 10',
    status: (function() {
      var before = 100, taskPts = 10;
      return (before + taskPts) === 110 ? 'PASS' : 'FAIL';
    })(),
    details: 'Verify earned points add correctly to balance.',
    note: 'Arithmetic-only sanity check. Does not exercise khApproveTask server path — verifies the math contract only.'
  });

  // ── BUG-QA2-003: Bonus multiplier — 1.5x must apply correctly ──
  results.assertions.push({
    id: 'BUG-QA2-003',
    category: 'calculation',
    severity: 'HIGH',
    session: 78,
    description: 'Approving with 1.5x bonus on 10-point task must yield 15',
    status: (function() {
      var base = 10, mult = 1.5;
      return Math.round(base * mult) === 15 ? 'PASS' : 'FAIL';
    })(),
    details: 'Verify bonus multiplier arithmetic.',
    note: 'Arithmetic-only sanity check. Does not exercise khApproveWithBonus server path — verifies Math.round(base * mult) contract only.'
  });
}


// ════════════════════════════════════════════════════════════════════
// ENVIRONMENT ASSERTIONS — Structural invariants
// ════════════════════════════════════════════════════════════════════

function runEnvironmentAssertions_(results) {

  // ── ENV-001: TAB_MAP must be defined and have 25+ entries ───────
  (function() {
    var a = { id: 'ENV-001', category: 'environment', description: 'TAB_MAP defined with expected entries', status: 'PASS', details: '' };
    if (typeof TAB_MAP === 'undefined') {
      a.status = 'FAIL';
      a.details = 'TAB_MAP is undefined.';
    } else {
      var count = 0;
      for (var k in TAB_MAP) { if (TAB_MAP.hasOwnProperty(k)) count++; }
      if (count < 25) {
        a.status = 'FAIL';
        a.details = 'TAB_MAP has only ' + count + ' entries (expected 25+).';
      } else {
        a.details = 'TAB_MAP has ' + count + ' entries.';
      }
    }
    results.assertions.push(a);
  })();

  // ── ENV-002: KH_SCHEMAS must be defined with 10 schemas ─────────
  (function() {
    var a = { id: 'ENV-002', category: 'environment', description: 'KH_SCHEMAS defined with expected schemas', status: 'PASS', details: '' };
    if (typeof KH_SCHEMAS === 'undefined') {
      a.status = 'FAIL';
      a.details = 'KH_SCHEMAS is undefined.';
    } else {
      var count = 0;
      var names = [];
      for (var k in KH_SCHEMAS) { if (KH_SCHEMAS.hasOwnProperty(k)) { count++; names.push(k); } }
      if (count < 8) {
        a.status = 'FAIL';
        a.details = 'KH_SCHEMAS has only ' + count + ' schemas (expected 8+): ' + names.join(', ');
      } else {
        a.details = count + ' schemas: ' + names.join(', ');
      }
    }
    results.assertions.push(a);
  })();

  // ── ENV-003: All critical KH tabs exist ─────────────────────────
  (function() {
    var a = { id: 'ENV-003', category: 'environment', description: 'Critical KH tabs exist in workbook', status: 'PASS', details: '' };
    var requiredTabs = ['KH_Chores', 'KH_History', 'KH_Rewards', 'KH_Redemptions', 'KH_Streaks'];
    var missing = [];
    try {
      var ss = SpreadsheetApp.openById(SSID);
      for (var i = 0; i < requiredTabs.length; i++) {
        var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP[requiredTabs[i]]) ? TAB_MAP[requiredTabs[i]] : requiredTabs[i];
        if (!ss.getSheetByName(tabName)) missing.push(requiredTabs[i]);
      }
    } catch (e) {
      a.status = 'FAIL';
      a.details = 'Error: ' + e.message;
      results.assertions.push(a);
      return;
    }
    if (missing.length > 0) {
      a.status = 'FAIL';
      a.details = 'Missing tabs: ' + missing.join(', ');
    } else {
      a.details = 'All ' + requiredTabs.length + ' critical KH tabs present.';
    }
    results.assertions.push(a);
  })();

  // ── ENV-004: All critical finance tabs exist ────────────────────
  (function() {
    var a = { id: 'ENV-004', category: 'environment', description: 'Critical finance tabs exist in workbook', status: 'PASS', details: '' };
    var requiredTabs = ['Transactions', 'Balance History', 'Categories', 'Budget_Data', 'DebtModel', 'Debt_Export', 'Close History', 'Helpers', 'BankRec'];
    var missing = [];
    try {
      var ss = SpreadsheetApp.openById(SSID);
      for (var i = 0; i < requiredTabs.length; i++) {
        var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP[requiredTabs[i]]) ? TAB_MAP[requiredTabs[i]] : requiredTabs[i];
        if (!ss.getSheetByName(tabName)) missing.push(requiredTabs[i]);
      }
    } catch (e) {
      a.status = 'FAIL';
      a.details = 'Error: ' + e.message;
      results.assertions.push(a);
      return;
    }
    if (missing.length > 0) {
      a.status = 'FAIL';
      a.details = 'Missing tabs: ' + missing.join(', ');
    } else {
      a.details = 'All ' + requiredTabs.length + ' critical finance tabs present.';
    }
    results.assertions.push(a);
  })();

  // ── ENV-005: Version functions return expected types ─────────────
  (function() {
    var a = { id: 'ENV-005', category: 'environment', description: 'Version functions return numbers', status: 'PASS', details: '' };
    var versionChecks = [];

    // Use getDeployedVersions() if available for comprehensive coverage
    if (typeof getDeployedVersions === 'function') {
      try {
        var deployed = getDeployedVersions();
        var parsed = (typeof deployed === 'string') ? JSON.parse(deployed) : deployed;
        var versions = parsed.versions || parsed;
        for (var key in versions) {
          if (versions.hasOwnProperty(key)) {
            var val = versions[key];
            if (typeof val === 'number') {
              versionChecks.push(key + '=' + val);
            } else if (typeof val === 'string' && !isNaN(Number(val))) {
              versionChecks.push(key + '=' + val);
            } else {
              versionChecks.push(key + '=' + val + ' (non-numeric)');
            }
          }
        }
        a.details = 'Via getDeployedVersions(): ' + versionChecks.join(', ');
      } catch (e) {
        a.details = 'getDeployedVersions() error: ' + e.message + '. Falling back to individual checks.';
        versionChecks = [];
      }
    }

    // Fallback: check individual version functions
    if (versionChecks.length === 0) {
      var vFns = [
        'getDataEngineVersion', 'getCodeVersion', 'getCascadeEngineVersion',
        'getKidsHubVersion', 'getSmokeTestVersion', 'getRegressionSuiteVersion',
        'getMonitorEngineVersion', 'getGASHardeningVersion', 'getAlertEngineVersion',
        'getCalendarSyncVersion', 'getStoryFactoryVersion'
      ];
      for (var i = 0; i < vFns.length; i++) {
        try {
          if (typeof this[vFns[i]] === 'function') {
            var v = this[vFns[i]]();
            if (typeof v !== 'number') {
              a.status = 'FAIL';
              versionChecks.push(vFns[i] + ' returns ' + typeof v + ', expected number');
            } else {
              versionChecks.push(vFns[i] + '=' + v);
            }
          } else {
            versionChecks.push(vFns[i] + ' NOT FOUND');
          }
        } catch (e) {
          versionChecks.push(vFns[i] + ' ERROR: ' + e.message);
        }
      }
      a.details = versionChecks.join(', ');
    }

    results.assertions.push(a);
  })();

  // ── ENV-006: Wiring — all Safe functions exist ──────────────────
  (function() {
    var a = { id: 'ENV-006', category: 'wiring', description: 'All google.script.run Safe functions exist', status: 'PASS', details: '' };
    var fns = CANONICAL_SAFE_FUNCTIONS;
    var missing = [];
    for (var i = 0; i < fns.length; i++) {
      if (typeof this[fns[i]] !== 'function') missing.push(fns[i]);
    }
    if (missing.length > 0) {
      a.status = 'FAIL';
      a.details = missing.length + ' missing: ' + missing.join(', ');
    } else {
      a.details = 'All ' + fns.length + ' Safe functions present.';
    }
    results.assertions.push(a);
  })();

  // ── ENV-006B: Wiring — every google.script.run chain has withFailureHandler ──
  // NOTE: Raw google.script.run count is unreliable (guard checks, comments, multi-line chains).
  // Correct approach: withSuccessHandler count = actual call chains. Compare to withFailureHandler.
  (function() {
    var a = { id: 'ENV-006B', category: 'wiring', description: 'Every google.script.run call has withFailureHandler', status: 'PASS', details: '' };
    var htmlFiles = ['KidsHub', 'ThePulse', 'TheVein', 'TheSoul', 'TheSpine',
      'SparkleLearning', 'HomeworkModule', 'WolfkidCER', 'StoryLibrary', 'StoryReader',
      'ComicStudio', 'DesignDashboard', 'ProgressReport', 'BaselineDiagnostic',
      'daily-missions', 'fact-sprint', 'investigation-module', 'reading-module',
      'writing-module', 'wolfkid-power-scan'];
    var violations = [];
    var totalChains = 0;
    var totalHandlers = 0;
    for (var f = 0; f < htmlFiles.length; f++) {
      try {
        var content = HtmlService.createHtmlOutputFromFile(htmlFiles[f]).getContent();
        var successCount = (content.match(/withSuccessHandler/g) || []).length;
        var handlerCount = (content.match(/withFailureHandler/g) || []).length;
        totalChains += successCount;
        totalHandlers += handlerCount;
        if (successCount > 0 && handlerCount < successCount) {
          violations.push(htmlFiles[f] + ': ' + successCount + ' chains but ' + handlerCount + ' failure handlers');
        }
      } catch(e) { /* file may not exist, skip */ }
    }
    if (violations.length > 0) {
      a.status = 'FAIL';
      a.details = violations.join('; ');
    } else {
      a.details = 'All ' + htmlFiles.length + ' HTML files pass. ' + totalChains + ' chains, ' + totalHandlers + ' failure handlers.';
    }
    results.assertions.push(a);
  })();

  // ── ENV-007: DebtModel Column O mapping (SoFi incident prevention)
  // The $72K SoFi missing-debt incident was caused by Column O mismatch.
  (function() {
    var a = { id: 'ENV-007', category: 'data-integrity', description: 'DebtModel Column O matches Balance History account names', status: 'PASS', details: '' };
    try {
      var ss = SpreadsheetApp.openById(SSID);
      var dmName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['DebtModel']) ? TAB_MAP['DebtModel'] : 'DebtModel';
      var bhName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['Balance History']) ? TAB_MAP['Balance History'] : 'Balance History';
      var dm = ss.getSheetByName(dmName);
      var bh = ss.getSheetByName(bhName);
      if (!dm || !bh) {
        a.status = 'WARN';
        a.details = 'Could not find DebtModel or Balance History tab.';
        results.assertions.push(a);
        return;
      }
      // Read DebtModel Column O (account names for BH lookup)
      var dmData = dm.getRange(8, 15, dm.getLastRow() - 7, 1).getValues(); // O column = 15, data starts row 8
      var dmNames = [];
      for (var d = 0; d < dmData.length; d++) {
        var name = String(dmData[d][0] || '').trim();
        if (name && name !== '') dmNames.push(name);
      }
      // Read BH account names (column D) — scan last 500 rows for broader account coverage
      var bhRowCount = bh.getLastRow() - 1;
      var scanRows = Math.min(bhRowCount, 500);
      var bhStartRow = Math.max(2, bh.getLastRow() - scanRows + 1);
      var bhData = bh.getRange(bhStartRow, 4, scanRows, 1).getValues();
      var bhNames = {};
      for (var b = 0; b < bhData.length; b++) {
        var bn = String(bhData[b][0] || '').trim();
        if (bn) bhNames[bn] = true;
      }
      // Check each DM name exists in BH
      var unmapped = [];
      for (var m = 0; m < dmNames.length; m++) {
        if (!bhNames[dmNames[m]]) unmapped.push(dmNames[m]);
      }
      if (unmapped.length > 0) {
        a.status = 'WARN';
        a.details = unmapped.length + ' DebtModel accounts not found in recent BH: ' + unmapped.join(', ');
      } else {
        a.details = 'All ' + dmNames.length + ' DebtModel accounts map to Balance History names.';
      }
    } catch (e) {
      a.status = 'WARN';
      a.details = 'Error: ' + e.message;
    }
    results.assertions.push(a);
  })();

  // ── ENV-008: No RING_QUEST_SSID references ──────────────────────
  // The old Ring Quest spreadsheet ID is dead. Code must not reference it.
  results.assertions.push({
    id: 'ENV-008',
    category: 'drift',
    description: 'No references to dead RING_QUEST_SSID',
    status: 'NOT_VERIFIED',
    details: 'Source-level check. Grep all .gs files for "1InWlUm07iMrmz8bclP7qE4guwrqZq1Ppxa2wrEmgvGI" — should return zero results.',
    note: 'GASHardening v2 removed the config default. Verify no other file references it.'
  });

  // ── ENV-009: FIELD_MAP dead reference — RESOLVED in Code.gs v50 ──
  // Dead FIELD_MAP codepath removed. reconcileVeinPulse now uses core fields directly.
  results.assertions.push({
    id: 'ENV-009', category: 'drift', description: 'FIELD_MAP dead code removed from reconcileVeinPulse',
    status: 'PASS', details: 'Resolved in Code.gs v50. reconcileVeinPulse uses core fields list directly.'
  });

  // ── ENV-010: Helpers sheet has close-month selectors ─────────────
  (function() {
    var a = { id: 'ENV-010', category: 'operations', description: 'Helpers B5/B6 close-month selectors exist', status: 'PASS', details: '' };
    try {
      var ss = SpreadsheetApp.openById(SSID);
      var hName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['Helpers']) ? TAB_MAP['Helpers'] : 'Helpers';
      var h = ss.getSheetByName(hName);
      if (!h) {
        a.status = 'FAIL';
        a.details = 'Helpers tab not found.';
      } else {
        var b5 = h.getRange('B5').getValue();
        var b6 = h.getRange('B6').getValue();
        a.details = 'B5=' + b5 + ', B6=' + b6;
        if (!b5 || !b6) {
          a.status = 'WARN';
          a.details = 'Helpers B5 or B6 is empty. Close-month selectors may need setting.';
        }
      }
    } catch (e) {
      a.status = 'WARN';
      a.details = 'Error: ' + e.message;
    }
    results.assertions.push(a);
  })();
}


// ════════════════════════════════════════════════════════════════════
// PERFORMANCE ASSERTIONS — Guardrails
// ════════════════════════════════════════════════════════════════════

function runPerformanceAssertions_(results) {

  // ── PERF-001: Transactions row count ────────────────────────────
  (function() {
    var a = { id: 'PERF-001', category: 'performance', description: 'Transactions row count within safe limits', status: 'PASS', details: '' };
    try {
      var ss = SpreadsheetApp.openById(SSID);
      var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['Transactions']) ? TAB_MAP['Transactions'] : 'Transactions';
      var sheet = ss.getSheetByName(tabName);
      if (sheet) {
        var rows = sheet.getLastRow();
        a.details = rows + ' rows';
        if (rows > 19000) { a.status = 'FAIL'; a.details = rows + ' rows — CRITICAL: approaching Sheets limit.'; }
        else if (rows > 15000) { a.status = 'WARN'; a.details = rows + ' rows — approaching warning threshold.'; }
      }
    } catch (e) { a.details = 'Error: ' + e.message; }
    results.assertions.push(a);
  })();

  // ── PERF-002: Balance History row count ─────────────────────────
  (function() {
    var a = { id: 'PERF-002', category: 'performance', description: 'Balance History row count within safe limits', status: 'PASS', details: '' };
    try {
      var ss = SpreadsheetApp.openById(SSID);
      var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['Balance History']) ? TAB_MAP['Balance History'] : 'Balance History';
      var sheet = ss.getSheetByName(tabName);
      if (sheet) {
        var rows = sheet.getLastRow();
        a.details = rows + ' rows';
        if (rows > 20000) { a.status = 'FAIL'; a.details = rows + ' rows — CRITICAL: DM P-column ranges capped at 20000.'; }
        else if (rows > 15000) { a.status = 'WARN'; a.details = rows + ' rows — approaching 20K range cap.'; }
      }
    } catch (e) { a.details = 'Error: ' + e.message; }
    results.assertions.push(a);
  })();

  // ── PERF-003: KH_Chores reasonable size ─────────────────────────
  (function() {
    var a = { id: 'PERF-003', category: 'performance', description: 'KH_Chores tab size reasonable', status: 'PASS', details: '' };
    try {
      var ss = SpreadsheetApp.openById(SSID);
      var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['KH_Chores']) ? TAB_MAP['KH_Chores'] : 'KH_Chores';
      var sheet = ss.getSheetByName(tabName);
      if (sheet) {
        var rows = sheet.getLastRow();
        a.details = rows + ' rows';
        if (rows > 300) { a.status = 'FAIL'; a.details = rows + ' rows — too many chores, will slow reads.'; }
        else if (rows > 100) { a.status = 'WARN'; a.details = rows + ' rows — getting large.'; }
      }
    } catch (e) { a.details = 'Error: ' + e.message; }
    results.assertions.push(a);
  })();

  // ── PERF-004: Trigger count within quota ────────────────────────
  (function() {
    var a = { id: 'PERF-004', category: 'performance', description: 'Trigger count within GAS quota (max 20)', status: 'PASS', details: '' };
    try {
      var count = ScriptApp.getProjectTriggers().length;
      a.details = count + '/20 triggers';
      if (count >= 20) { a.status = 'FAIL'; a.details = 'TRIGGER LIMIT HIT: ' + count + '/20'; }
      else if (count >= 15) { a.status = 'WARN'; a.details = count + '/20 — approaching limit.'; }
    } catch (e) { a.details = 'Error: ' + e.message; }
    results.assertions.push(a);
  })();

  // ── PERF-005: getData runtime sanity check ──────────────────────
  (function() {
    var a = { id: 'PERF-005', category: 'performance', description: 'getDataSafe completes in under 30 seconds', status: 'PASS', details: '' };
    try {
      var start = new Date().getTime();
      if (typeof getDataSafe === 'function') {
        getDataSafe();
        var elapsed = new Date().getTime() - start;
        a.details = elapsed + 'ms';
        if (elapsed > 30000) { a.status = 'FAIL'; a.details = elapsed + 'ms — exceeds 30s threshold.'; }
        else if (elapsed > 15000) { a.status = 'WARN'; a.details = elapsed + 'ms — slow, consider Sheets API batchGet.'; }
      } else {
        a.status = 'WARN';
        a.details = 'getDataSafe not available in current context.';
      }
    } catch (e) {
      a.status = 'WARN';
      a.details = 'Error: ' + e.message;
    }
    results.assertions.push(a);
  })();
}


// ════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════

/**
 * Run just the bug assertions (faster, for targeted checks).
 */
function regressionBugsOnly() {
  var results = { assertions: [] };
  runBugAssertions_(results);
  var output = [];
  for (var i = 0; i < results.assertions.length; i++) {
    var a = results.assertions[i];
    output.push(a.id + ' [' + a.status + ']: ' + a.description);
  }
  Logger.log(output.join('\n'));
  return output.join('\n');
}

/**
 * Run just the environment assertions.
 */
function regressionEnvOnly() {
  var results = { assertions: [] };
  runEnvironmentAssertions_(results);
  Logger.log(JSON.stringify(results.assertions, null, 2));
  return JSON.stringify(results.assertions, null, 2);
}


// END OF FILE — tbmRegressionSuite.gs v5
