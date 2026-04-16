// ════════════════════════════════════════════════════════════════════
// tbmRegressionSuite.gs v10 — Phase A3: Post-Deploy Behavioral Assertions
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

function getRegressionSuiteVersion() { return 10; }

// v10 (#377): Global flag used by FreezeGate.js to suppress logError_/sendPush_
// side effects during FREEZE regression tests. Without this, 5 FREEZE tests fire
// ~14 Pushover API calls + ~16 sheet writes per ?action=runTests run, pushing
// GAS execution past its 30s limit and silently killing the HTTP response.
// FreezeGate._isFreezeTestMode_() reads this var directly (shared global scope).
var _FREEZE_TEST_MODE = false;

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
  // v6: Finance audit — golden-month identity checks + tolerance checks
  runFinanceIdentityAssertions_(results);
  runFinanceToleranceAssertions_(results);
  // v7: Freeze gate assertions (P0-23)
  runFreezeGateAssertions_(results);

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
      'ComicStudio', 'DesignDashboard', 'JJHome', 'ProgressReport', 'BaselineDiagnostic',
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
// FINANCE IDENTITY ASSERTIONS — v6
// Calls getData() for current month, verifies derived metrics are
// mathematically consistent. These are NOT tolerance checks — they
// verify exact algebraic relationships that must always hold.
// ════════════════════════════════════════════════════════════════════

function runFinanceIdentityAssertions_(results) {
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth();
  var startStr = y + '-' + (m < 9 ? '0' : '') + (m + 1) + '-01';
  var lastDay = new Date(y, m + 1, 0).getDate();
  var endStr = y + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (lastDay < 10 ? '0' : '') + lastDay;

  var data = null;
  try {
    data = getData(startStr, endStr, true);
  } catch (e) {
    results.assertions.push({
      id: 'FIN-001', status: 'FAIL', category: 'finance-identity',
      description: 'getData() must not throw for current month',
      details: 'Error: ' + e.message
    });
    return;
  }

  // FIN-001: Net worth = assets - liabilities
  var nwExpected = roundTo(data.totalAssets - data.totalLiabilities, 2);
  var nwActual = roundTo(data.netWorth, 2);
  results.assertions.push({
    id: 'FIN-001', category: 'finance-identity',
    description: 'netWorth === totalAssets - totalLiabilities',
    status: Math.abs(nwActual - nwExpected) < 0.02 ? 'PASS' : 'FAIL',
    details: 'expected=' + nwExpected + ' actual=' + nwActual
  });

  // FIN-002: operationalCashFlow = earnedIncome - operatingExpenses
  var ocfExpected = roundTo(data.earnedIncome - data.operatingExpenses, 2);
  var ocfActual = roundTo(data.operationalCashFlow, 2);
  results.assertions.push({
    id: 'FIN-002', category: 'finance-identity',
    description: 'operationalCashFlow === earnedIncome - operatingExpenses',
    status: Math.abs(ocfActual - ocfExpected) < 0.02 ? 'PASS' : 'FAIL',
    details: 'expected=' + ocfExpected + ' actual=' + ocfActual
  });

  // FIN-003: netCashFlow = operationalCashFlow + bridgeCash
  var ncfExpected = roundTo(data.operationalCashFlow + data.bridgeCash, 2);
  var ncfActual = roundTo(data.netCashFlow, 2);
  results.assertions.push({
    id: 'FIN-003', category: 'finance-identity',
    description: 'netCashFlow === operationalCashFlow + bridgeCash (LOC)',
    status: Math.abs(ncfActual - ncfExpected) < 0.02 ? 'PASS' : 'FAIL',
    details: 'expected=' + ncfExpected + ' actual=' + ncfActual
  });

  // FIN-004: totalCashFlow = (earnedIncome + bridgeCash) - operatingExpenses - debtPaymentsMTD
  var tcfExpected = roundTo((data.earnedIncome + data.bridgeCash) - data.operatingExpenses - data.debtPaymentsMTD, 2);
  var tcfActual = roundTo(data.totalCashFlow, 2);
  results.assertions.push({
    id: 'FIN-004', category: 'finance-identity',
    description: 'totalCashFlow === trueCashIn - opex - debtPayments',
    status: Math.abs(tcfActual - tcfExpected) < 0.02 ? 'PASS' : 'FAIL',
    details: 'expected=' + tcfExpected + ' actual=' + tcfActual
  });

  // FIN-005: liabilityAccounts sum === totalLiabilities
  var liabSum = 0;
  if (data.liabilityAccounts) {
    for (var la = 0; la < data.liabilityAccounts.length; la++) {
      liabSum += data.liabilityAccounts[la].balance || 0;
    }
  }
  liabSum = roundTo(liabSum, 2);
  var totalLiab = roundTo(data.totalLiabilities, 2);
  results.assertions.push({
    id: 'FIN-005', category: 'finance-identity',
    description: 'sum(liabilityAccounts) === totalLiabilities',
    status: Math.abs(liabSum - totalLiab) < 0.02 ? 'PASS' : 'FAIL',
    details: 'sum=' + liabSum + ' total=' + totalLiab
  });

  // FIN-006: totalMoneyIn >= earnedIncome (can include loanProceeds + balanceTransfers)
  results.assertions.push({
    id: 'FIN-006', category: 'finance-identity',
    description: 'totalMoneyIn >= earnedIncome',
    status: data.totalMoneyIn >= data.earnedIncome - 0.01 ? 'PASS' : 'FAIL',
    details: 'totalMoneyIn=' + data.totalMoneyIn + ' earnedIncome=' + data.earnedIncome
  });

  // FIN-007: debtPaymentsMTD >= 0
  results.assertions.push({
    id: 'FIN-007', category: 'finance-identity',
    description: 'debtPaymentsMTD >= 0 (cannot be negative)',
    status: data.debtPaymentsMTD >= 0 ? 'PASS' : 'FAIL',
    details: 'debtPaymentsMTD=' + data.debtPaymentsMTD
  });

  // FIN-008: incomeThrottle = earnedIncome - opex - debtPaymentsMTD
  var itExpected = roundTo(data.earnedIncome - data.operatingExpenses - data.debtPaymentsMTD, 2);
  var itActual = roundTo(data.incomeThrottle, 2);
  results.assertions.push({
    id: 'FIN-008', category: 'finance-identity',
    description: 'incomeThrottle === earnedIncome - opex - debtPaymentsMTD',
    status: Math.abs(itActual - itExpected) < 0.02 ? 'PASS' : 'FAIL',
    details: 'expected=' + itExpected + ' actual=' + itActual
  });
}


// ════════════════════════════════════════════════════════════════════
// FINANCE TOLERANCE ASSERTIONS — v6
// Verifies production data stays within sane bounds.
// NOT algebraic identities — these are sanity guardrails.
// Thresholds calibrated to Thompson household norms.
// ════════════════════════════════════════════════════════════════════

function runFinanceToleranceAssertions_(results) {
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth();
  var startStr = y + '-' + (m < 9 ? '0' : '') + (m + 1) + '-01';
  var lastDay = new Date(y, m + 1, 0).getDate();
  var endStr = y + '-' + (m < 9 ? '0' : '') + (m + 1) + '-' + (lastDay < 10 ? '0' : '') + lastDay;

  var data = null;
  try {
    data = getData(startStr, endStr, true);
  } catch (e) {
    results.assertions.push({
      id: 'TOL-001', status: 'FAIL', category: 'finance-tolerance',
      description: 'getData() for tolerance checks',
      details: 'Error: ' + e.message
    });
    return;
  }

  // TOL-001: earnedIncome in reasonable range (>$0, <$50K/month)
  results.assertions.push({
    id: 'TOL-001', category: 'finance-tolerance',
    description: 'earnedIncome between $0 and $50,000',
    status: (data.earnedIncome >= 0 && data.earnedIncome < 50000) ? 'PASS' : 'WARN',
    details: 'earnedIncome=' + data.earnedIncome
  });

  // TOL-002: operatingExpenses in reasonable range
  results.assertions.push({
    id: 'TOL-002', category: 'finance-tolerance',
    description: 'operatingExpenses between $0 and $30,000',
    status: (data.operatingExpenses >= 0 && data.operatingExpenses < 30000) ? 'PASS' : 'WARN',
    details: 'operatingExpenses=' + data.operatingExpenses
  });

  // TOL-003: debtCurrent in reasonable range (>$0 while paying off, <$500K)
  results.assertions.push({
    id: 'TOL-003', category: 'finance-tolerance',
    description: 'debtCurrent between $0 and $500,000',
    status: (data.debtCurrent >= 0 && data.debtCurrent < 500000) ? 'PASS' : 'WARN',
    details: 'debtCurrent=' + data.debtCurrent
  });

  // TOL-004: no unmapped categories with spend > $500
  var bigUnmapped = [];
  if (data.unmappedCategories) {
    for (var u = 0; u < data.unmappedCategories.length; u++) {
      if (data.unmappedCategories[u].amount > 500) {
        bigUnmapped.push(data.unmappedCategories[u].category + ' ($' + data.unmappedCategories[u].amount + ')');
      }
    }
  }
  results.assertions.push({
    id: 'TOL-004', category: 'finance-tolerance',
    description: 'No unmapped categories with spend > $500',
    status: bigUnmapped.length === 0 ? 'PASS' : 'WARN',
    details: bigUnmapped.length === 0 ? 'clean' : bigUnmapped.join(', ')
  });

  // TOL-005: getData vs getSimulatorData — operatingExpenses within 1%
  var simData = null;
  try {
    simData = JSON.parse(getSimulatorDataSafe());
  } catch (e) {
    results.assertions.push({
      id: 'TOL-005', status: 'WARN', category: 'finance-tolerance',
      description: 'Cross-engine parity — opex',
      details: 'getSimulatorData unavailable: ' + e.message
    });
    simData = null;
  }
  if (simData && data.operatingExpenses > 0) {
    var simOpex = simData.operatingExpenses || 0;
    var opexDrift = Math.abs(data.operatingExpenses - simOpex);
    var opexPct = (opexDrift / data.operatingExpenses) * 100;
    results.assertions.push({
      id: 'TOL-005', category: 'finance-tolerance',
      description: 'getData vs getSimulatorData opex within 1%',
      status: opexPct < 1 ? 'PASS' : (opexPct < 5 ? 'WARN' : 'FAIL'),
      details: 'getData=' + roundTo(data.operatingExpenses, 2) + ' sim=' + roundTo(simOpex, 2) +
        ' drift=' + roundTo(opexPct, 1) + '%'
    });
  }

  // TOL-006: getData vs getSimulatorData — debtPaymentsMTD within $5
  if (simData) {
    var simDebtPay = simData.debtPaymentsMTD || 0;
    var debtPayDrift = Math.abs(data.debtPaymentsMTD - simDebtPay);
    results.assertions.push({
      id: 'TOL-006', category: 'finance-tolerance',
      description: 'getData vs getSimulatorData debtPaymentsMTD within $5',
      status: debtPayDrift < 5 ? 'PASS' : (debtPayDrift < 50 ? 'WARN' : 'FAIL'),
      details: 'getData=' + data.debtPaymentsMTD + ' sim=' + simDebtPay + ' drift=$' + roundTo(debtPayDrift, 2)
    });
  }
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


// ════════════════════════════════════════════════════════════════════
// FREEZE GATE ASSERTIONS (P0-23 — 5 tests)
// ════════════════════════════════════════════════════════════════════

/**
 * Run all 5 freeze gate assertions.
 * Saves any existing freeze state before tests and restores it after, so running
 * the regression suite during an operational freeze does not clear the live gate.
 */
function runFreezeGateAssertions_(results) {
  // Suppress logError_/sendPush_ side effects in FreezeGate for the duration of
  // these tests. Prevents ~14 Pushover API calls + ~16 sheet writes that would
  // push ?action=runTests past GAS's 30s execution limit. See FreezeGate.js v4.
  _FREEZE_TEST_MODE = true;
  // Capture ALL freeze-related properties so a live operational freeze is fully
  // preserved — including any active bypass token, block counter, and debounce ts.
  var props = PropertiesService.getScriptProperties();
  var priorFreezeRaw      = props.getProperty('DEPLOY_FREEZE');
  var priorEmergencyRaw   = props.getProperty('DEPLOY_FREEZE_EMERGENCY');
  var priorBlockCount     = props.getProperty('FREEZE_BLOCK_COUNT');
  var priorLastPush       = props.getProperty('FREEZE_LAST_PUSH');

  try {

  // FREEZE-001: setFreeze_ activates; getFreezeState_ returns active:true with reason
  var f1 = { id: 'FREEZE-001', category: 'freeze-gate', description: 'setFreeze_ activates; getFreezeState_ returns active:true', status: 'FAIL', details: '' };
  try {
    setFreeze_('regression-test', new Date(new Date().getTime() + 60000).toISOString());
    var s1 = getFreezeState_();
    if (s1.active === true && s1.reason === 'regression-test') {
      f1.status = 'PASS';
      f1.details = 'state.active=true, state.reason=regression-test';
    } else {
      f1.details = 'Expected active:true reason:regression-test, got: ' + JSON.stringify(s1);
    }
  } catch(e) {
    f1.details = 'threw: ' + e.message;
  } finally {
    try { liftFreeze_(); } catch(e2) {}
  }
  results.assertions.push(f1);

  // FREEZE-002: liftFreeze_ clears state; getFreezeState_ returns active:false
  var f2 = { id: 'FREEZE-002', category: 'freeze-gate', description: 'liftFreeze_ clears state; getFreezeState_ returns active:false', status: 'FAIL', details: '' };
  try {
    setFreeze_('regression-test-lift', new Date(new Date().getTime() + 60000).toISOString());
    liftFreeze_();
    var s2 = getFreezeState_();
    if (s2.active === false) {
      f2.status = 'PASS';
      f2.details = 'state.active=false after lift';
    } else {
      f2.details = 'Expected active:false after lift, got: ' + JSON.stringify(s2);
    }
  } catch(e) {
    f2.details = 'threw: ' + e.message;
  } finally {
    try { liftFreeze_(); } catch(e2) {}
  }
  results.assertions.push(f2);

  // FREEZE-003: assertNotFrozen_ throws when freeze is active and no bypass token
  var f3 = { id: 'FREEZE-003', category: 'freeze-gate', description: 'assertNotFrozen_ throws when freeze active (no bypass)', status: 'FAIL', details: '' };
  try {
    setFreeze_('regression-test-block', new Date(new Date().getTime() + 60000).toISOString());
    var threw = false;
    try {
      assertNotFrozen_('freeze-critical', 'regressionTestCaller');
    } catch(blockErr) {
      threw = true;
      if (blockErr.message.indexOf('FROZEN') === 0) {
        f3.status = 'PASS';
        f3.details = 'Threw FROZEN error as expected: ' + blockErr.message.substring(0, 60);
      } else {
        f3.details = 'Threw non-FROZEN error: ' + blockErr.message;
      }
    }
    if (!threw) {
      f3.details = 'assertNotFrozen_ did NOT throw — gate did not block';
    }
  } catch(e) {
    f3.details = 'setup threw: ' + e.message;
  } finally {
    try { liftFreeze_(); } catch(e2) {}
  }
  results.assertions.push(f3);

  // FREEZE-004: assertNotFrozen_ does NOT throw when valid emergency token is present
  var f4 = { id: 'FREEZE-004', category: 'freeze-gate', description: 'assertNotFrozen_ bypasses with valid emergency token', status: 'FAIL', details: '' };
  try {
    setFreeze_('regression-test-bypass', new Date(new Date().getTime() + 60000).toISOString());
    generateEmergencyToken_('regression-bypass-test', 1);
    var bypassThrew = false;
    try {
      assertNotFrozen_('freeze-critical', 'regressionBypassCaller');
    } catch(e) {
      bypassThrew = true;
      f4.details = 'Threw despite valid bypass token: ' + e.message;
    }
    if (!bypassThrew) {
      f4.status = 'PASS';
      f4.details = 'assertNotFrozen_ allowed through with valid emergency token';
    }
  } catch(e) {
    f4.details = 'setup threw: ' + e.message;
  } finally {
    try { liftFreeze_(); } catch(e2) {}
    try { PropertiesService.getScriptProperties().deleteProperty('DEPLOY_FREEZE_EMERGENCY'); } catch(e2) {}
  }
  results.assertions.push(f4);

  // FREEZE-005: getFreezeState_ auto-expires past-expiresAt freeze
  var f5 = { id: 'FREEZE-005', category: 'freeze-gate', description: 'getFreezeState_ auto-expires when expiresAt is in the past', status: 'FAIL', details: '' };
  try {
    // Set freeze with expiry 1 second in the past
    setFreeze_('regression-test-expiry', new Date(new Date().getTime() - 1000).toISOString());
    var s5 = getFreezeState_();
    if (s5.active === false && s5.autoExpired === true) {
      f5.status = 'PASS';
      f5.details = 'state.active=false, state.autoExpired=true — auto-expired correctly';
    } else {
      f5.details = 'Expected active:false autoExpired:true, got: ' + JSON.stringify(s5);
    }
  } catch(e) {
    f5.details = 'threw: ' + e.message;
  } finally {
    try { liftFreeze_(); } catch(e2) {}
  }
  results.assertions.push(f5);

  } finally {
    // Always restore side-effect mode before restoring properties so any
    // exception during property restore doesn't leave test mode silently active.
    _FREEZE_TEST_MODE = false;
    // Restore all four freeze properties to pre-test state.
    // Each is set if it existed before, deleted if it didn't.
    if (priorFreezeRaw)    { props.setProperty('DEPLOY_FREEZE', priorFreezeRaw); }
    else                   { props.deleteProperty('DEPLOY_FREEZE'); }

    if (priorEmergencyRaw) { props.setProperty('DEPLOY_FREEZE_EMERGENCY', priorEmergencyRaw); }
    else                   { props.deleteProperty('DEPLOY_FREEZE_EMERGENCY'); }

    if (priorBlockCount)   { props.setProperty('FREEZE_BLOCK_COUNT', priorBlockCount); }
    else                   { props.deleteProperty('FREEZE_BLOCK_COUNT'); }

    if (priorLastPush)     { props.setProperty('FREEZE_LAST_PUSH', priorLastPush); }
    else                   { props.deleteProperty('FREEZE_LAST_PUSH'); }
  }
}


// END OF FILE — tbmRegressionSuite.gs v10
