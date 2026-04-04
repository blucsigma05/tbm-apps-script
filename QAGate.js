// ════════════════════════════════════════════════════════════════════
// QAGates.gs v3 — Pre-QA Automated Server-Side Test Runner
// ════════════════════════════════════════════════════════════════════
// Run: runAllQAGates() from the Apps Script editor → View → Logs
//
// Key names verified against live versions via getDeployedVersions().
// ════════════════════════════════════════════════════════════════════

var RUN_WRITE_TESTS = false; // flip to true to test KidsHub write paths

function runAllQAGates() {
  var results = [];
  var startTime = new Date();

  Logger.log('══════════════════════════════════════════');
  Logger.log('  TBM QA GATES v2 — ' + startTime.toISOString());
  Logger.log('══════════════════════════════════════════');

  results.push(gate1_VersionManifest());
  results.push(gate2_DataEngineShape());
  results.push(gate3_SimulatorShape());
  results.push(gate4_WeeklyTrackerShape());
  results.push(gate5_CFFShape());
  results.push(gate6_KidsHubShape());
  results.push(gate7_KidsHubWidget());
  results.push(gate8_BoardData());
  results.push(gate9_TabExistence());
  results.push(gate10_CrossConsistency());
  results.push(gate11_CacheBust());
  results.push(gate12_KHHealthCheck());
  results.push(gate13_CloseHistory());
  results.push(gate14_LOCCapacity());

  if (RUN_WRITE_TESTS) {
    results.push(gate15_EdgeCases());
    results.push(gate16_KHWritePath());
  } else {
    results.push({ gate: 15, name: 'Edge Cases (Write Tests)', status: 'SKIP', detail: 'RUN_WRITE_TESTS = false' });
    results.push({ gate: 16, name: 'KH Write Path', status: 'SKIP', detail: 'RUN_WRITE_TESTS = false' });
  }

  // ── SUMMARY ───────────────────────────────────────────────────
  var elapsed = ((new Date() - startTime) / 1000).toFixed(1);
  var p = 0, f = 0, w = 0, s = 0;
  results.forEach(function(r) {
    if (r.status === 'PASS') p++;
    else if (r.status === 'FAIL') f++;
    else if (r.status === 'WARN') w++;
    else s++;
  });

  Logger.log('');
  Logger.log('══════════════════════════════════════════');
  Logger.log('  RESULTS: ' + p + ' PASS / ' + f + ' FAIL / ' + w + ' WARN / ' + s + ' SKIP');
  Logger.log('  Elapsed: ' + elapsed + 's');
  Logger.log('══════════════════════════════════════════');
  results.forEach(function(r) {
    var icon = r.status === 'PASS' ? '✅' : (r.status === 'FAIL' ? '🔴' : (r.status === 'WARN' ? '🟡' : '⏭️'));
    Logger.log(icon + ' Gate ' + r.gate + ' [' + r.status + '] ' + r.name + (r.detail ? ' — ' + r.detail : ''));
  });

  return results;
}


// ════════════════════════════════════════════════════════════════════
//  GATE IMPLEMENTATIONS — key names from DataEngine v72 source
// ════════════════════════════════════════════════════════════════════

function gate1_VersionManifest() {
  var gate = { gate: 1, name: 'Version Manifest', status: 'PASS', detail: '' };
  try {
    var v = getDeployedVersions();
    var expected = {
      DataEngine: 72, Code: 45, CascadeEngine: 7, KidsHub: 22,
      GASHardening: 2, MonitorEngine: 5, CalendarSync: 2, AlertEngine: 2, StoryFactory: 4
    };
    var mismatches = [];
    for (var key in expected) {
      if (v[key] !== expected[key]) {
        mismatches.push(key + ': got ' + v[key] + ', want ' + expected[key]);
      }
    }
    gate.detail = mismatches.length > 0 ? mismatches.join('; ') : 'All 9 GS files at expected versions';
    if (mismatches.length > 0) gate.status = 'FAIL';
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate2_DataEngineShape() {
  // Keys verified from DataEngine v72 getData() lines 665-1090
  var gate = { gate: 2, name: 'DataEngine Payload Shape', status: 'PASS', detail: '' };
  try {
    var d = getData('2026-03-01', '2026-03-31', true);
    // Actual key names from getData() return object (DE v72)
    var required = [
      'earnedIncome',            // line 671
      'operatingExpenses',       // line 687
      'operationalCashFlow',     // line 760
      'bridgeCash',              // line 761
      'netCashFlow',             // line 764
      'debtCurrent',             // line 784
      'debtCurrentActive',       // line 785
      'debtCurrentExcluded',     // line 786
      'debtStart',               // line 783
      'interestBurn',            // line 902
      'totalMinimums',           // line 1027
      'netWorth',                // line 776
      'debtPaymentsMTD',         // line 809-821
      'weeklyCashMin',           // line 767
      'incomeThrottle',          // line 1025
      'onTrackDays',             // line 930
      'statusLevel',             // line 915
      'debtByType',              // line 787
      'totalAssets',             // line 774
      'totalLiabilities'         // line 775
    ];
    var missing = [];
    for (var i = 0; i < required.length; i++) {
      if (d[required[i]] === undefined) missing.push(required[i]);
    }
    if (missing.length > 0) {
      gate.status = 'FAIL';
      gate.detail = 'Missing keys: ' + missing.join(', ');
    } else {
      var typeErrors = [];
      if (typeof d.earnedIncome !== 'number') typeErrors.push('earnedIncome not number');
      if (typeof d.debtCurrent !== 'number') typeErrors.push('debtCurrent not number');
      if (typeof d.netWorth !== 'number') typeErrors.push('netWorth not number');
      if (typeof d.operatingExpenses !== 'number') typeErrors.push('operatingExpenses not number');
      if (d.debtCurrent <= 0) typeErrors.push('debtCurrent <= 0 (' + d.debtCurrent + ')');
      if (d.earnedIncome < 0) typeErrors.push('earnedIncome < 0');
      if (!Array.isArray(d.debtByType)) typeErrors.push('debtByType not array');
      if (typeErrors.length > 0) {
        gate.status = 'FAIL';
        gate.detail = typeErrors.join('; ');
      } else {
        gate.detail = 'All ' + required.length + ' keys present. debt=$' + d.debtCurrent.toFixed(0) + ', income=$' + d.earnedIncome.toFixed(0) + ', nw=$' + d.netWorth.toFixed(0);
      }
    }
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate3_SimulatorShape() {
  // Keys verified from DataEngine v72 getSimulatorData() lines 2242-2429
  var gate = { gate: 3, name: 'Simulator Data Shape', status: 'PASS', detail: '' };
  try {
    var s = getSimulatorData();
    var required = [
      'debts',                   // line 2243
      'excludedDebts',           // line 2244
      'debtStart',               // line 2245
      'income',                  // line 2247
      'minimums',                // line 2257
      'allNonMortgageDebt',      // line 2278
      'operationalCashFlow',     // line 2281
      'interestBurn',            // line 2317
      'debtTarget',              // line 2315
      'debtNow',                 // line 2423
      'incomeThrottle'           // line 2284
    ];
    var missing = [];
    for (var i = 0; i < required.length; i++) {
      if (s[required[i]] === undefined) missing.push(required[i]);
    }
    if (missing.length > 0) {
      gate.status = 'FAIL';
      gate.detail = 'Missing: ' + missing.join(', ');
    } else if (!Array.isArray(s.debts) || s.debts.length === 0) {
      gate.status = 'FAIL';
      gate.detail = 'debts array empty or not array';
    } else {
      // Debt object shape check — v72 parseDebtExport() line ~1795
      var d0 = s.debts[0];
      var debtKeys = ['name', 'balance', 'apr', 'minPayment'];
      var dMissing = debtKeys.filter(function(k) { return d0[k] === undefined; });
      if (dMissing.length > 0) {
        gate.status = 'WARN';
        gate.detail = 'Debt[0] missing: ' + dMissing.join(', ');
      } else {
        gate.detail = s.debts.length + ' active + ' + (s.excludedDebts ? s.excludedDebts.length : 0) + ' excluded, allNonMortgage=$' + (s.allNonMortgageDebt || 0).toFixed(0) + ', minimums=$' + (s.minimums || 0).toFixed(0);
      }
    }
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate4_WeeklyTrackerShape() {
  // Keys verified from DataEngine v72 getWeeklyTrackerData() lines 2473-2481
  var gate = { gate: 4, name: 'Weekly Tracker Shape', status: 'PASS', detail: '' };
  try {
    var w = getWeeklyTrackerData();
    if (!w || typeof w !== 'object') {
      gate.status = 'FAIL'; gate.detail = 'Returned non-object';
    } else if (w.error) {
      gate.status = 'FAIL'; gate.detail = 'Error: ' + w.error;
    } else {
      // Actual keys: currentMonth, priorMonth, thisWeek, lastWeek, asOf, locCapacity, _meta
      var required = ['currentMonth', 'priorMonth', 'thisWeek', 'lastWeek', 'asOf'];
      var missing = required.filter(function(k) { return w[k] === undefined; });
      if (missing.length > 0) {
        gate.status = 'FAIL';
        gate.detail = 'Missing: ' + missing.join(', ');
      } else {
        // Each period has .data sub-object which IS a getData() payload
        var cmOk = w.currentMonth && w.currentMonth.data && typeof w.currentMonth.data.earnedIncome === 'number';
        var pmOk = w.priorMonth && w.priorMonth.data && typeof w.priorMonth.data.earnedIncome === 'number';
        if (!cmOk || !pmOk) {
          gate.status = 'WARN';
          gate.detail = 'Sub-payloads missing earnedIncome: currentMonth=' + cmOk + ', priorMonth=' + pmOk;
        } else {
          gate.detail = 'OK — 4 periods, currentMonth income=$' + w.currentMonth.data.earnedIncome.toFixed(0) + ', ym=' + w.currentMonth.ym;
        }
      }
    }
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate5_CFFShape() {
  // Keys verified from DataEngine v72 getCashFlowForecast() return
  var gate = { gate: 5, name: 'Cash Flow Forecast Shape', status: 'PASS', detail: '' };
  try {
    var c = getCashFlowForecast();
    if (!c || typeof c !== 'object') {
      gate.status = 'FAIL'; gate.detail = 'Returned non-object';
    } else if (c.error) {
      gate.status = 'FAIL'; gate.detail = 'Error: ' + c.error;
    } else {
      var required = ['months', 'cashFlowPositiveDate'];
      var missing = required.filter(function(k) { return c[k] === undefined; });
      if (missing.length > 0) {
        gate.status = 'WARN'; gate.detail = 'Missing: ' + missing.join(', ');
      } else {
        gate.detail = 'OK — ' + (Array.isArray(c.months) ? c.months.length : '?') + ' forecast months';
      }
    }
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate6_KidsHubShape() {
  // Keys verified from KidsHub v22 getKidsHubData() return
  var gate = { gate: 6, name: 'KidsHub Data Shape', status: 'PASS', detail: '' };
  try {
    var raw = getKidsHubData('all');
    var kh = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (kh.error) {
      gate.status = 'FAIL'; gate.detail = 'Error: ' + kh.error;
    } else {
      var required = ['tasks', 'rewards', 'balances', 'childConfig', 'screenTime', 'requests'];
      var missing = required.filter(function(k) { return kh[k] === undefined; });
      if (missing.length > 0) {
        gate.status = 'FAIL'; gate.detail = 'Missing: ' + missing.join(', ');
      } else {
        var bBal = kh.balances && kh.balances.buggsy;
        var jBal = kh.balances && kh.balances.jj;
        if (!bBal || !jBal) {
          gate.status = 'WARN';
          gate.detail = 'Missing balance for ' + (!bBal ? 'buggsy ' : '') + (!jBal ? 'jj' : '');
        } else {
          gate.detail = 'OK — ' + kh.tasks.length + ' tasks, ' + kh.rewards.length + ' rewards, Buggsy=' + bBal.balance + ' rings, JJ=' + jBal.balance + ' stars';
        }
      }
    }
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate7_KidsHubWidget() {
  // Verified from Code v45 getKidsHubWidgetDataSafe() lines 285-395
  var gate = { gate: 7, name: 'KidsHub Widget (summary vs full)', status: 'PASS', detail: '' };
  try {
    var summary = getKidsHubWidgetDataSafe('summary');
    var full    = getKidsHubWidgetDataSafe('full');
    if (summary.error || full.error) {
      gate.status = 'FAIL'; gate.detail = 'Error: ' + (summary.error || full.error);
      logGate_(gate); return gate;
    }
    var issues = [];
    // summary strips pendingApprovals/pendingAsks to [] (Code v45 lines 354-358)
    if (summary.buggsy.stats.pendingApprovals.length > 0) issues.push('summary.buggsy.pendingApprovals not stripped');
    if (summary.jj.stats.pendingApprovals.length > 0)     issues.push('summary.jj.pendingApprovals not stripped');
    if (summary.buggsy.stats.pendingAsks.length > 0)      issues.push('summary.buggsy.pendingAsks not stripped');
    if (summary.jj.stats.pendingAsks.length > 0)          issues.push('summary.jj.pendingAsks not stripped');
    // full preserves them as arrays
    if (!Array.isArray(full.buggsy.stats.pendingApprovals)) issues.push('full.buggsy.pendingApprovals not array');
    if (!Array.isArray(full.jj.stats.pendingApprovals))     issues.push('full.jj.pendingApprovals not array');
    // Points match between summary and full
    if (summary.buggsy.stats.earnedPoints !== full.buggsy.stats.earnedPoints) {
      issues.push('buggsy points mismatch: summary=' + summary.buggsy.stats.earnedPoints + ' full=' + full.buggsy.stats.earnedPoints);
    }
    if (summary.jj.stats.earnedPoints !== full.jj.stats.earnedPoints) issues.push('jj points mismatch');
    // screenTime present on both
    if (!summary.buggsy.screenTime || !summary.jj.screenTime) issues.push('summary missing screenTime');
    if (!full.buggsy.screenTime || !full.jj.screenTime)       issues.push('full missing screenTime');
    // household aggregates
    if (!summary.household) issues.push('summary missing household');
    if (!full.household)    issues.push('full missing household');

    gate.detail = issues.length > 0 ? issues.join('; ') : 'Summary strips arrays, full preserves, points match, screenTime present';
    if (issues.length > 0) gate.status = 'FAIL';
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate8_BoardData() {
  // Keys verified from DataEngine v72 getBoardData() lines 3052-3076
  var gate = { gate: 8, name: 'Board Data (Spine/Soul)', status: 'PASS', detail: '' };
  try {
    var b = getBoardData();
    if (!b || typeof b !== 'object') {
      gate.status = 'FAIL'; gate.detail = 'Returned non-object';
    } else if (b.error) {
      gate.status = 'FAIL'; gate.detail = 'Error: ' + b.error;
    } else {
      // Actual keys: greeting, date, dayName, hour, weather, events, eventsMore,
      //              tomorrowPreview, choreStatus, familyNote, spineStale
      var required = ['greeting', 'date', 'weather', 'events', 'choreStatus'];
      var missing = required.filter(function(k) { return b[k] === undefined; });
      if (missing.length > 0) {
        gate.status = 'WARN';
        gate.detail = 'Missing: ' + missing.join(', ') + ' (weather=null is OK if API hiccups)';
      } else {
        var evtCount = Array.isArray(b.events) ? b.events.length : 0;
        gate.detail = 'OK — ' + evtCount + ' events, weather=' + (b.weather ? b.weather.tempF + '°F' : 'null') + ', chores pending=' + b.choreStatus.pendingApprovals;
      }
    }
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate9_TabExistence() {
  // Tab names verified from DataEngine v72 TAB_MAP (lines 159-205)
  var gate = { gate: 9, name: 'Tab Existence', status: 'PASS', detail: '' };
  try {
    var ss = SpreadsheetApp.openById(SSID);
    // Use ACTUAL prefixed names from TAB_MAP — not logical names
    var requiredTabs = [
      // 🔒 Tiller Core — no prefix on these 3
      'Transactions',
      'Balance History',
      'Categories',
      // 🔒 Tiller Core — prefixed
      '🔒 NetWorth',
      // 💻🧮 Finance
      '💻🧮 Budget_Data',
      '💻🧮 Debt_Export',
      '💻🧮 Close History',
      '💻🧮 DebtModel',
      '💻🧮 Helpers',
      '💻🧮 BankRec',
      '💻🧮 Dashboard_Export',
      '💻🧮 WeeklyCashMap',
      // 🧹📅 KidsHub
      '🧹📅 KH_Children',
      '🧹📅 KH_Chores',
      '🧹📅 KH_Rewards',
      '🧹📅 KH_Allowance',
      '🧹📅 KH_History',
      '🧹📅 KH_Redemptions',
      '🧹📅 KH_Streaks',
      '🧹📅 KH_Deductions',
      '🧹📅 KH_Requests',
      '🧹📅 KH_ScreenTime'
    ];
    var missing = [];
    for (var i = 0; i < requiredTabs.length; i++) {
      if (!ss.getSheetByName(requiredTabs[i])) missing.push(requiredTabs[i]);
    }
    gate.detail = missing.length > 0 ? 'Missing tabs: ' + missing.join(', ') : 'All ' + requiredTabs.length + ' required tabs present';
    if (missing.length > 0) gate.status = 'FAIL';
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate10_CrossConsistency() {
  var gate = { gate: 10, name: 'Cross-Function Consistency', status: 'PASS', detail: '' };
  try {
    var de = getData('2026-03-01', '2026-03-31', true);
    var sim = getSimulatorData();
    var issues = [];

    // DE.debtCurrent vs Sim.allNonMortgageDebt (both represent total non-mortgage debt)
    var deDbt = de.debtCurrent || 0;
    var simDbt = sim.allNonMortgageDebt || 0;
    var delta = Math.abs(deDbt - simDbt);
    if (delta > 5000) {
      issues.push('debt gap: DE.debtCurrent=$' + deDbt.toFixed(0) + ' vs Sim.allNonMortgageDebt=$' + simDbt.toFixed(0) + ' (delta=$' + delta.toFixed(0) + ')');
    }

    // interestBurn — both return { monthly, annual, ... } object
    var deInt = de.interestBurn && de.interestBurn.monthly ? de.interestBurn.monthly : 0;
    var simInt = sim.interestBurn && sim.interestBurn.monthly ? sim.interestBurn.monthly : 0;
    if (deInt > 0 && simInt > 0 && Math.abs(deInt - simInt) > 200) {
      issues.push('interestBurn gap: DE=$' + deInt.toFixed(0) + ' vs Sim=$' + simInt.toFixed(0));
    }

    // DE.totalMinimums vs Sim.minimums
    var deMins = de.totalMinimums || 0;
    var simMins = sim.minimums || 0;
    if (deMins > 0 && simMins > 0 && Math.abs(deMins - simMins) > 100) {
      issues.push('minimums gap: DE.totalMinimums=$' + deMins.toFixed(0) + ' vs Sim.minimums=$' + simMins.toFixed(0));
    }

    // choreStatus from DE vs KidsHub widget
    var widget = getKidsHubWidgetDataSafe('summary');
    if (!widget.error && de.onTrackDays !== undefined) {
      var dePending = de.choreStatus ? de.choreStatus.pendingApprovals : -1;
      // Note: slight timing differences are expected since these are separate function calls
    }

    if (issues.length > 0) {
      gate.status = 'WARN';
      gate.detail = issues.join('; ');
    } else {
      gate.detail = 'DE↔Sim debt delta=$' + delta.toFixed(0) + ', minimums DE=$' + deMins.toFixed(0) + '/Sim=$' + simMins.toFixed(0);
    }
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate11_CacheBust() {
  var gate = { gate: 11, name: 'Cache Bust', status: 'PASS', detail: '' };
  try {
    var result = bustCache();
    if (!result || result.status !== 'ok') {
      gate.status = 'FAIL'; gate.detail = 'bustCache returned: ' + JSON.stringify(result);
    } else {
      // Verify cache is empty — use same key format as Code v45 line 230
      var cache = CacheService.getScriptCache();
      var now = new Date();
      var ym = now.getFullYear() + '-' + (now.getMonth() + 1 < 10 ? '0' : '') + (now.getMonth() + 1);
      var key = 'de_payload_' + ym + '-01';
      var cached = cache.get(key);
      gate.detail = cached !== null ? 'Cache NOT cleared — key ' + key + ' still has value' : 'bustCache OK, verified cache empty';
      if (cached !== null) gate.status = 'FAIL';
    }
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate12_KHHealthCheck() {
  // khHealthCheck() returns JSON string with: status, version, tabs, issues, balances, pendingApprovals
  var gate = { gate: 12, name: 'KidsHub Health Check', status: 'PASS', detail: '' };
  try {
    var raw = khHealthCheck();
    var hc = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (hc.status === 'error') {
      gate.status = 'FAIL';
      gate.detail = 'Issues: ' + (hc.issues || []).join('; ');
    } else if (hc.status === 'warning') {
      gate.status = 'WARN';
      gate.detail = 'Warnings: ' + (hc.issues || []).join('; ');
    } else {
      var tabCount = Object.keys(hc.tabs || {}).length;
      gate.detail = 'Healthy — ' + tabCount + ' tabs checked, ' + (hc.pendingApprovals || 0) + ' pending approvals, version=' + (hc.version || '?');
    }
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate13_CloseHistory() {
  // getCloseHistoryData() returns an ARRAY of month objects (not {months:[]})
  // Verified from DataEngine v72 lines 2679-2716
  var gate = { gate: 13, name: 'Close History Data', status: 'PASS', detail: '' };
  try {
    var ch = getCloseHistoryData();
    if (!Array.isArray(ch)) {
      gate.status = 'FAIL';
      gate.detail = 'Expected array, got ' + typeof ch;
    } else if (ch.length === 0) {
      gate.status = 'WARN';
      gate.detail = 'Empty array — no closed months found';
    } else {
      // Check first month has expected keys: month, year, earnedIncome, debtCurrent
      var m0 = ch[0];
      var monthKeys = ['month', 'year', 'earnedIncome', 'debtCurrent'];
      var mMissing = monthKeys.filter(function(k) { return m0[k] === undefined; });
      if (mMissing.length > 0) {
        gate.status = 'WARN';
        gate.detail = 'Month[0] missing: ' + mMissing.join(', ');
      } else {
        gate.detail = 'OK — ' + ch.length + ' closed months, latest: ' + ch[ch.length-1].month + ' ' + ch[ch.length-1].year;
      }
    }
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate14_LOCCapacity() {
  var gate = { gate: 14, name: 'LOC Capacity', status: 'PASS', detail: '' };
  try {
    var loc = getLOCCapacity();
    if (!loc || typeof loc !== 'object') {
      gate.status = 'FAIL'; gate.detail = 'Returned non-object';
    } else if (loc.error) {
      gate.status = 'FAIL'; gate.detail = 'Error: ' + loc.error;
    } else {
      var required = ['totalAvailable', 'totalLimit', 'totalUsed'];
      var missing = required.filter(function(k) { return loc[k] === undefined; });
      if (missing.length > 0) {
        gate.status = 'WARN'; gate.detail = 'Missing: ' + missing.join(', ');
      } else {
        gate.detail = 'OK — limit=$' + (loc.totalLimit||0).toFixed(0) + ', used=$' + (loc.totalUsed||0).toFixed(0) + ', avail=$' + (loc.totalAvailable||0).toFixed(0);
      }
    }
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate15_EdgeCases() {
  var gate = { gate: 15, name: 'Edge Cases', status: 'PASS', detail: '' };
  try {
    var issues = [];

    // Test 1: $0 Money ask should be rejected (KidsHub v22 lines 1583-1585)
    var askResult = JSON.parse(khSubmitRequest('buggsy', 'Money', 'Test zero ask', 0, 'QA test'));
    if (askResult.status !== 'error') {
      issues.push('$0 Money ask NOT rejected (got status=' + askResult.status + ')');
    }

    // Test 2: Invalid child name should fail (KidsHub v22 lines 1566-1568)
    var badChild = JSON.parse(khSubmitRequest('nobody', 'Money', 'Bad child', 10, 'QA'));
    if (badChild.status !== 'error') {
      issues.push('Invalid child name not rejected');
    }

    // Test 3: Screen time debit with 0 minutes
    var stResult = JSON.parse(khDebitScreenTime('buggsy', 'TV', 0));
    // Should either error or return insufficient/ok with 0 deducted
    if (stResult.status === 'error' || stResult.status === 'insufficient' || stResult.status === 'ok') {
      // All acceptable — just checking it doesn't crash
    } else {
      issues.push('0-minute debit unexpected status: ' + stResult.status);
    }

    gate.detail = issues.length > 0 ? issues.join('; ') : '$0 ask rejected, invalid child rejected, 0-min debit handled';
    if (issues.length > 0) gate.status = 'FAIL';
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


function gate16_KHWritePath() {
  var gate = { gate: 16, name: 'KH Write Path (Claim→Approve→Reject)', status: 'PASS', detail: '' };
  try {
    var issues = [];
    var raw = JSON.parse(getKidsHubData('buggsy'));
    var tasks = raw.tasks || [];
    var testTask = null;
    for (var i = 0; i < tasks.length; i++) {
      if (!tasks[i].completed && tasks[i].child.toLowerCase() === 'buggsy' &&
          (tasks[i].frequency || '').toLowerCase() === 'daily') {
        testTask = tasks[i]; break;
      }
    }
    if (!testTask) {
      gate.status = 'WARN';
      gate.detail = 'No uncompleted Buggsy daily task found. Run daily reset first.';
      logGate_(gate); return gate;
    }
    var row = testTask.rowIndex;

    // Step 1: Claim
    var claimResult = JSON.parse(khCompleteTask(row));
    if (claimResult.status !== 'ok' && claimResult.status !== 'duplicate') {
      issues.push('Claim failed: ' + JSON.stringify(claimResult));
    }

    // Step 2: Reject — should write 0 points (KidsHub v22 line 1379)
    var rejectResult = JSON.parse(khRejectTask(row));
    if (rejectResult.status !== 'ok') {
      issues.push('Reject failed: ' + JSON.stringify(rejectResult));
    }
    if (rejectResult.reversedPoints !== 0) {
      issues.push('Reject reversedPoints not 0: got ' + rejectResult.reversedPoints);
    }

    // Step 3: Verify task is uncompleted after reject
    var afterReject = JSON.parse(getKidsHubData('buggsy'));
    var rejectedTask = (afterReject.tasks || []).filter(function(t) { return t.rowIndex === row; })[0];
    if (rejectedTask && rejectedTask.completed) {
      issues.push('Task still completed after reject');
    }

    // Step 4: Re-claim + double-claim idempotency
    var claim2 = JSON.parse(khCompleteTask(row));
    var claim3 = JSON.parse(khCompleteTask(row));
    if (claim3.status === 'error') {
      issues.push('Double-claim caused error: ' + claim3.message);
    }

    // Cleanup: uncomplete
    try { khUncompleteTask(row); } catch(e) { logError_('QAGate_cleanup', e); }

    gate.detail = issues.length > 0 ? issues.join('; ') : 'Claim→Reject(0pts)→Re-Claim→Idempotency all passed on row ' + row;
    if (issues.length > 0) gate.status = 'FAIL';
  } catch(e) {
    gate.status = 'FAIL'; gate.detail = 'Error: ' + e.message;
  }
  logGate_(gate); return gate;
}


// ════════════════════════════════════════════════════════════════════
function logGate_(gate) {
  var icon = gate.status === 'PASS' ? '✅' : (gate.status === 'FAIL' ? '🔴' : (gate.status === 'WARN' ? '🟡' : '⏭️'));
  Logger.log(icon + ' Gate ' + gate.gate + ' [' + gate.status + '] ' + gate.name + (gate.detail ? ' — ' + gate.detail : ''));
}