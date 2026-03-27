// ════════════════════════════════════════════════════════════════════
// CASCADE ENGINE v10 — Dynamic Debt Cascade Generator
// ════════════════════════════════════════════════════════════════════
// Version history tracked in Notion deploy page. Do not add version comments here.

function getCascadeEngineVersion() { return 10; }

// v10: openById migration — trigger-safe spreadsheet accessor
var _ceSS = null;
function getCESS_() {
  if (!_ceSS) _ceSS = SpreadsheetApp.openById('1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c');
  return _ceSS;
}

// TAB_MAP — owned by DataEngine.gs. Available via GAS global scope.
// DO NOT redeclare var TAB_MAP in this file.
/**
 * Main entry — regenerate all three Cascade tabs from live data.
 * Safe to call from google.script.run or the editor Run button.
 */
function refreshCascadeTabs() {
  // v9: TAB_MAP guard — if DataEngine hasn't loaded, bail gracefully (BUG-005)
  if (typeof TAB_MAP === 'undefined') {
    Logger.log('CascadeEngine: TAB_MAP not available (DataEngine not loaded). Skipping refresh.');
    return;
  }
  var lock = LockService.getScriptLock();
  // v9: waitLock(30000) replaces tryLock(15000) for background trigger safety (BUG-006)
  // waitLock throws on timeout — wrap in try/catch
  try {
    lock.waitLock(30000);
  } catch (e) {
    Logger.log('CascadeEngine: Could not acquire lock after 30s — another refresh is running');
    return;
  }
  try {
  var ss = getCESS_();
  var startTime = new Date();

  // ── 1. Load debts ──
  var parsed = parseDebtExport();
  var activeDebts = parsed.active;
  var excludedDebts = parsed.excluded;

  // ── 2. Load DebtModel for notes + extra fields ──
  var dmNotes = loadDebtModelNotes_(ss);

  // ── 3. Load summary meta ──
  var augustBonus = parseFloat(readDebtExportMeta('augustBonus')) || 0;
  var debtFreeTarget = readDebtExportMeta('debtFreeTarget') || '';

  // ── 4. Run cascade simulation ──
  var simResult = runCascade_(activeDebts, augustBonus);

  // ── 4b. Write computed debt-free date back to Debt_Export ──
  //   Replaces the static "Dec 2028" string with actual CascadeEngine output
  if (simResult.lastPayoffLabel) {
    var cleanDate = simResult.lastPayoffLabel.replace(/\s*\(Month.*\)/, '');
    writeDebtExportMeta('debtFreeTarget', cleanDate);
    Logger.log('  Wrote debtFreeTarget: ' + cleanDate);
  }

  // v4: Write lastCascadeRun timestamp for DataEngine staleness check
  writeDebtExportMeta('lastCascadeRun', new Date().toISOString());
  Logger.log('  Wrote lastCascadeRun: ' + new Date().toISOString());
  // ── 5. Write all three tabs ──
  writeCascadeProof_(ss, activeDebts, dmNotes, simResult, startTime);
  writeCascadeMonthByMonth_(ss, simResult);
  writeCascadePayoffSchedule_(ss, simResult, activeDebts);

  Logger.log('═══ Cascade Tabs Refreshed ═══');
  Logger.log('  Active debts: ' + activeDebts.length);
  Logger.log('  Excluded debts: ' + excludedDebts.length);
  Logger.log('  Total active debt: $' + Math.round(simResult.startingDebt));
  Logger.log('  Total interest: $' + Math.round(simResult.totalInterest));
  Logger.log('  Debt-free month: ' + simResult.lastPayoffMonth + ' (' + simResult.lastPayoffLabel + ')');
  Logger.log('  Duration: ' + ((new Date() - startTime) / 1000).toFixed(1) + 's');
  } finally {
    lock.releaseLock();
  }
}

/**
 * Safe wrapper for google.script.run callers.
 */
function refreshCascadeTabsSafe() {
  return withMonitor_('refreshCascadeTabsSafe', function() {
    refreshCascadeTabs();
    return { status: 'ok', refreshedAt: new Date().toISOString() };
  });
}

// ════════════════════════════════════════════════════════════════════
// SIMULATION ENGINE (ported from Debt Simulator v10 client-side)
// ════════════════════════════════════════════════════════════════════

/**
 * Run the hybrid cascade simulation.
 * Strategy: Quick Win (< $1000) first → then highest APR.
 * Freed minimums cascade to next target.
 * August bonus applied as windfall in month 6 (Aug 2026).
 *
 * @param {Array} debts — active debt objects from parseDebtExport()
 * @param {number} augustBonus — windfall amount
 * @returns {Object} { accts, months, startingDebt, totalInterest, lastPayoffMonth, lastPayoffLabel }
 */
function runCascade_(debts, augustBonus, extraMonthly, lumpSum) {
  extraMonthly = extraMonthly || 0;
  lumpSum = lumpSum || 0;
  var now = new Date();
  var baseYear = now.getFullYear();
  var baseMonth = now.getMonth(); // 0-indexed

  // Deep copy debts into simulation accounts
  var accts = [];
  var startingDebt = 0;
  for (var i = 0; i < debts.length; i++) {
    var d = debts[i];
    if (d.balance <= 0.01) continue;
    accts.push({
      name: d.name,
      bal: d.balance,
      startBal: d.balance,
      apr: d.apr || 0,
      min: d.min || 0,
      promoAPR: d.promoAPR,
      promoEnd: d.promoEnd ? new Date(d.promoEnd + 'T00:00:00') : null,
      type: d.type || '',
      strategy: d.strategy || '',
      priority: d.priority || 99,
      paid: 0,
      intPaid: 0,
      payoffMonth: null,
      payoffDate: null,
      freedPerMonth: 0
    });
    startingDebt += d.balance;
  }

  // Determine windfall month (August = month index where projection hits Aug)
  var bonusMonth = (8 - (baseMonth + 1));
  if (bonusMonth <= 0) bonusMonth += 12;

  var months = [];
  var freedPool = 0;
  var maxMonths = 360;
  var wfApplied = false;
  var month = 0;

  function isMinOnly(a) {
    return !a.strategy || a.strategy === 'Minimum Only' || a.strategy === 'Minimum' || a.strategy === 'Excluded';
  }

  function getTarget(active) {
    // Hybrid: Quick Wins (< $1000 balance) first by smallest balance,
    // then highest APR among attackable accounts
    var qw = [];
    for (var j = 0; j < active.length; j++) {
      if (active[j].startBal < 1000 && active[j].strategy === 'Quick Win') qw.push(active[j]);
    }
    qw.sort(function(a, b) { return a.bal - b.bal; });
    if (qw.length > 0) return qw[0];

    var attackable = [];
    for (var k = 0; k < active.length; k++) {
      if (!isMinOnly(active[k])) attackable.push(active[k]);
    }
    attackable.sort(function(a, b) { return b.apr - a.apr; });
    return attackable.length > 0 ? attackable[0] : null;
  }

  while (month < maxMonths) {
    month++;
    var projDate = new Date(baseYear, baseMonth + month, 1);
    var active = [];
    for (var a = 0; a < accts.length; a++) {
      if (accts[a].bal > 0) active.push(accts[a]);
    }
    if (active.length === 0) break;

    // ── Interest accrual ──
    for (var a = 0; a < active.length; a++) {
      var acc = active[a];
      var isPromo = acc.promoAPR !== null && acc.promoAPR !== undefined &&
                    acc.promoEnd && projDate <= acc.promoEnd;
      var rate = isPromo ? acc.promoAPR : acc.apr;
      var interest = acc.bal * rate / 12;
      acc.bal += interest;
      acc.intPaid += interest;
    }

    // ── Minimum payments ──
    var payoffsThisMonth = [];
    for (var a = 0; a < active.length; a++) {
      var acc = active[a];
      var pmt = Math.min(acc.min, acc.bal);
      acc.bal -= pmt;
      acc.paid += pmt;
      if (acc.bal <= 0.01) {
        acc.bal = 0;
        acc.payoffMonth = month;
        acc.payoffDate = projDate;
        acc.freedPerMonth = acc.min;
        freedPool += acc.min;
        payoffsThisMonth.push(acc.name);
      }
    }

    // ── Extra payments from freed pool ──
    var totalExtra = freedPool + extraMonthly;
    var stillActive = [];
    for (var a = 0; a < accts.length; a++) {
      if (accts[a].bal > 0) stillActive.push(accts[a]);
    }

    var cascadeTarget = null;
    var cascadeAmt = 0;
    if (totalExtra > 0 && stillActive.length > 0) {
      var t = getTarget(stillActive);
      if (!t) {
        stillActive.sort(function(x, y) { return y.apr - x.apr; });
        t = stillActive[0];
      }
      if (t) {
        var p = Math.min(totalExtra, t.bal);
        t.bal -= p;
        t.paid += p;
        cascadeTarget = t.name;
        cascadeAmt = roundTo(totalExtra, 2);
        if (t.bal <= 0.01) {
          t.bal = 0;
          t.payoffMonth = month;
          t.payoffDate = projDate;
          t.freedPerMonth = t.min;
          freedPool += t.min;
          payoffsThisMonth.push(t.name);
        }
      }
    }

    // ── Lump sum payment (month 1, v4) ──
    if (lumpSum > 0 && month === 1) {
      var lsRem = lumpSum;
      while (lsRem > 0) {
        var lsActive = [];
        for (var la = 0; la < accts.length; la++) {
          if (accts[la].bal > 0) lsActive.push(accts[la]);
        }
        if (lsActive.length === 0) break;
        var lsT = getTarget(lsActive);
        if (!lsT) { lsActive.sort(function(x, y) { return y.apr - x.apr; }); lsT = lsActive[0]; }
        if (!lsT) break;
        var lsP = Math.min(lsRem, lsT.bal);
        lsT.bal -= lsP; lsT.paid += lsP; lsRem -= lsP;
        if (lsT.bal <= 0.01) {
          lsT.bal = 0; lsT.payoffMonth = month; lsT.payoffDate = projDate;
          lsT.freedPerMonth = lsT.min; freedPool += lsT.min;
          payoffsThisMonth.push(lsT.name);
        }
      }
    }
    // ── Windfall (August bonus) ──
    if (augustBonus > 0 && !wfApplied && month >= bonusMonth) {
      wfApplied = true;
      var rem = augustBonus;
      while (rem > 0) {
        var sa = [];
        for (var a = 0; a < accts.length; a++) {
          if (accts[a].bal > 0) sa.push(accts[a]);
        }
        if (sa.length === 0) break;
        var t = getTarget(sa);
        if (!t) {
          sa.sort(function(x, y) { return y.apr - x.apr; });
          t = sa[0];
        }
        if (!t) break;
        var p = Math.min(rem, t.bal);
        t.bal -= p;
        t.paid += p;
        rem -= p;
        if (t.bal <= 0.01) {
          t.bal = 0;
          t.payoffMonth = month;
          t.payoffDate = projDate;
          t.freedPerMonth = t.min;
          freedPool += t.min;
          payoffsThisMonth.push(t.name);
        }
      }
    }

    // ── Snapshot for Month-by-Month ──
    var remainingDebt = 0;
    var activeCount = 0;
    for (var a = 0; a < accts.length; a++) {
      if (accts[a].bal > 0) { remainingDebt += accts[a].bal; activeCount++; }
    }
    months.push({
      mo: month,
      date: projDate,
      freedPerMo: roundTo(freedPool, 2),
      cascadeTarget: cascadeTarget,
      cascadeAmt: cascadeAmt,
      payoffs: payoffsThisMonth.join(', '),
      remaining: roundTo(remainingDebt, 2),
      activeCount: activeCount,
      isBonus: (augustBonus > 0 && month === bonusMonth)
    });
  }

  // Find last payoff
  var lastPayoff = 0;
  var lastPayoffLabel = '';
  for (var a = 0; a < accts.length; a++) {
    if (accts[a].payoffMonth && accts[a].payoffMonth > lastPayoff) {
      lastPayoff = accts[a].payoffMonth;
    }
  }
  if (lastPayoff > 0) {
    var lpDate = new Date(baseYear, baseMonth + lastPayoff, 1);
    var MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    lastPayoffLabel = MN[lpDate.getMonth()] + ' ' + lpDate.getFullYear() + ' (Month ' + lastPayoff + ')';
  }

  var totalInterest = 0;
  for (var a = 0; a < accts.length; a++) totalInterest += accts[a].intPaid;

  return {
    accts: accts,
    months: months,
    startingDebt: startingDebt,
    totalInterest: roundTo(totalInterest, 2),
    lastPayoffMonth: lastPayoff,
    lastPayoffLabel: lastPayoffLabel
  };
}

// ════════════════════════════════════════════════════════════════════
// ▸▸▸  CHUNK 2 OF 2 — DebtModel Notes + Tab Writers + Utilities
// ════════════════════════════════════════════════════════════════════
// DEBTMODEL NOTES READER
// ════════════════════════════════════════════════════════════════════

/**
 * Read DebtModel tab for notes, due dates, credit limits per account.
 * Returns { 'Account Name': { notes, dueDate, creditLimit, strategy } }
 */
function loadDebtModelNotes_(ss) {
  var dm = ss.getSheetByName(TAB_MAP['DebtModel']);
  if (!dm) return {};

  var data = dm.getDataRange().getValues();
  var headerRow = -1;
  for (var r = 0; r < Math.min(data.length, 10); r++) {
    if (String(data[r][0]).trim() === 'Account') { headerRow = r; break; }
  }
  if (headerRow < 0) return {};

  var result = {};
  for (var r = headerRow + 2; r < data.length; r++) {
    var acct = String(data[r][0] || '').trim();
    if (!acct || acct.indexOf('↓') >= 0) continue;
    var tillerName = String(data[r][14] || '').trim();
    var notes = String(data[r][13] || '').trim();
    var dueDate = data[r][4];
    var creditLimit = parseFloat(data[r][3]) || 0;
    var strategy = String(data[r][5] || '').trim();
    var entry = { notes: notes, dueDate: dueDate, creditLimit: creditLimit, strategy: strategy };
    if (tillerName) result[tillerName] = entry;
    if (acct) result[acct] = entry;
  }
  return result;
}

/**
 * Write a value to Debt_Export SUMMARY METRICS section.
 * Finds the row where col A matches the key, writes val to col B.
 * If the key doesn't exist, appends a new row after the last summary row.
 *
 * @param {string} key — the metric key (e.g., 'debtFreeTarget')
 * @param {*} val — value to write
 */
function writeDebtExportMeta(key, val) {
  var ss = getCESS_();
  var dx = ss.getSheetByName(TAB_MAP['Debt_Export']);
  if (!dx) return;

  var data = dx.getDataRange().getValues();
  var inSummary = false;
  var lastSummaryRow = -1;

  for (var r = 0; r < data.length; r++) {
    var cellA = String(data[r][0] || '').trim();
    if (cellA.indexOf('SUMMARY') >= 0) { inSummary = true; continue; }
    if (!inSummary) continue;
    lastSummaryRow = r;
    if (cellA === key) {
      // v3 FIX: Force plain text before writing
      var targetCell = dx.getRange(r + 1, 2);
      targetCell.setNumberFormat('@');
      targetCell.setValue(String(val));
      return;
    }
  }

  if (lastSummaryRow >= 0) {
    dx.getRange(lastSummaryRow + 2, 1).setValue(key);
    var newValCell = dx.getRange(lastSummaryRow + 2, 2);
    newValCell.setNumberFormat('@');
    newValCell.setValue(String(val));
  }
}

/**
 * Parameterized cascade for DebtSimulator slider inputs (v4).
 */
function runCascadeWithExtras_(debts, augustBonus, extraMonthly, lumpSum) {
  return runCascade_(debts, augustBonus, extraMonthly || 0, lumpSum || 0);
}
// ════════════════════════════════════════════════════════════════════
// TAB WRITERS
// ════════════════════════════════════════════════════════════════════

/**
 * Write Cascade Proof tab — account listing with live data + simulation results.
 */
function writeCascadeProof_(ss, activeDebts, dmNotes, simResult, genTime) {
  var sheet = getOrCreateSheet_(ss, 'Cascade Proof');
  sheet.clearContents();
  sheet.clearFormats();

  var MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var dateStr = genTime.getFullYear() + '-' +
    leftPad2_(genTime.getMonth() + 1) + '-' +
    leftPad2_(genTime.getDate()) + ' ' +
    leftPad2_(genTime.getHours()) + ':' +
    leftPad2_(genTime.getMinutes());

  var rows = [];
  rows.push(['Debt Cascade Proof — Source-Linked', '', '', '', '', '', '', '', '']);
  rows.push(['All values from Debt_Export | Min = from Debt_Export minPayment', '', '', '', '', '', '', '', '']);
  rows.push(['Generated ' + dateStr, '', '', '', '', '', '', '', '']);
  rows.push(['', '', '', '', '', '', '', '', '']);

  rows.push(['SUMMARY', '', '', '', '', '', '', '', '']);
  var totalMins = 0;
  for (var i = 0; i < activeDebts.length; i++) totalMins += (activeDebts[i].min || 0);
  rows.push(['Total Active Debt:', simResult.startingDebt, '', '', '', '', '', '', '']);
  rows.push(['Total Minimums:', totalMins, '', '', '', '', '', '', '']);
  rows.push(['Accounts:', activeDebts.length, '', '', '', '', '', '', '']);
  rows.push(['Interest (projected):', Math.round(simResult.totalInterest), '', '', '', '', '', '', '']);
  rows.push(['Debt-Free:', simResult.lastPayoffLabel, '', '', '', '', '', '', '']);
  rows.push(['', '', '', '', '', '', '', '', '']);

  rows.push(['ACTIVE ACCOUNTS', '', '', '', '', '', '', '', '']);
  rows.push(['#', 'Account', 'Balance', 'APR', 'Min Pmt', 'Strategy', 'Payoff Mo', 'Payoff Date', 'Notes']);

  var sorted = activeDebts.slice().sort(function(a, b) { return (a.priority || 99) - (b.priority || 99); });
  for (var i = 0; i < sorted.length; i++) {
    var d = sorted[i];
    var sim = null;
    for (var j = 0; j < simResult.accts.length; j++) {
      if (simResult.accts[j].name === d.name) { sim = simResult.accts[j]; break; }
    }
    var notes = '';
    if (dmNotes[d.name]) notes = dmNotes[d.name].notes || '';
    var payoffMo = sim && sim.payoffMonth ? sim.payoffMonth : '';
    var payoffDate = sim && sim.payoffDate ? sim.payoffDate : '';
    rows.push([i + 1, d.name, d.balance, d.apr, d.min, d.strategy || '', payoffMo, payoffDate, notes]);
  }

  sheet.getRange(1, 1, rows.length, 9).setValues(rows);

  // Formatting
  sheet.getRange(1, 1).setFontWeight('bold').setFontSize(12);
  sheet.getRange(2, 1).setFontColor('#666666').setFontStyle('italic');
  sheet.getRange(3, 1).setFontColor('#999999');
  sheet.getRange(5, 1).setFontWeight('bold').setFontSize(10);
  sheet.getRange(6, 1, 5, 1).setFontWeight('bold');
  sheet.getRange(6, 2).setNumberFormat('$#,##0.00');
  sheet.getRange(7, 2).setNumberFormat('$#,##0.00');
  sheet.getRange(9, 2).setNumberFormat('$#,##0');

  var headerRowIdx = 13;
  sheet.getRange(headerRowIdx, 1, 1, 9).setFontWeight('bold')
    .setBackground('#e8eaf6').setHorizontalAlignment('center');

  var dataStart = headerRowIdx + 1;
  var dataCount = sorted.length;
  if (dataCount > 0) {
    sheet.getRange(dataStart, 3, dataCount, 1).setNumberFormat('$#,##0.00');
    sheet.getRange(dataStart, 4, dataCount, 1).setNumberFormat('0.00%');
    sheet.getRange(dataStart, 5, dataCount, 1).setNumberFormat('$#,##0.00');
    sheet.getRange(dataStart, 8, dataCount, 1).setNumberFormat('MMM yyyy');
  }

  sheet.setColumnWidth(1, 30);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 100);
  sheet.setColumnWidth(4, 70);
  sheet.setColumnWidth(5, 90);
  sheet.setColumnWidth(6, 140);
  sheet.setColumnWidth(7, 80);
  sheet.setColumnWidth(8, 100);
  sheet.setColumnWidth(9, 300);
}

/**
 * Write Cascade Month-by-Month tab — full monthly projection timeline.
 */
function writeCascadeMonthByMonth_(ss, simResult) {
  var sheet = getOrCreateSheet_(ss, 'Cascade Month-by-Month');
  sheet.clearContents();
  sheet.clearFormats();

  var headers = ['Mo', 'Date', 'Freed $/mo', 'Cascade →', 'Cascade $', 'Payoffs', 'Remaining', 'Active'];
  var rows = [headers];

  for (var i = 0; i < simResult.months.length; i++) {
    var m = simResult.months[i];
    rows.push([m.mo, m.date, m.freedPerMo, m.cascadeTarget || '', m.cascadeAmt || 0, m.payoffs || '', m.remaining, m.activeCount]);
    if (m.remaining <= 0) break;
  }

  sheet.getRange(1, 1, rows.length, 8).setValues(rows);

  sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#e8eaf6').setHorizontalAlignment('center');
  var dataCount = rows.length - 1;
  if (dataCount > 0) {
    sheet.getRange(2, 2, dataCount, 1).setNumberFormat('MMM yyyy');
    sheet.getRange(2, 3, dataCount, 1).setNumberFormat('$#,##0.00');
    sheet.getRange(2, 5, dataCount, 1).setNumberFormat('$#,##0.00');
    sheet.getRange(2, 7, dataCount, 1).setNumberFormat('$#,##0.00');
  }

  for (var i = 1; i < rows.length; i++) {
    if (rows[i][5] && String(rows[i][5]).length > 0) {
      sheet.getRange(i + 1, 1, 1, 8).setBackground('#e8f5e9');
    }
    if (simResult.months[i - 1] && simResult.months[i - 1].isBonus) {
      sheet.getRange(i + 1, 1, 1, 8).setBackground('#fff3e0');
    }
  }

  sheet.setColumnWidth(1, 40);
  sheet.setColumnWidth(2, 90);
  sheet.setColumnWidth(3, 90);
  sheet.setColumnWidth(4, 200);
  sheet.setColumnWidth(5, 90);
  sheet.setColumnWidth(6, 250);
  sheet.setColumnWidth(7, 110);
  sheet.setColumnWidth(8, 60);
}

/**
 * Write Cascade Payoff Schedule tab — per-account payoff summary.
 */
function writeCascadePayoffSchedule_(ss, simResult, activeDebts) {
  var sheet = getOrCreateSheet_(ss, 'Cascade Payoff Schedule');
  sheet.clearContents();
  sheet.clearFormats();

  var headers = ['Account', 'Start Bal', 'APR', 'Min Pmt', 'Strategy', 'Payoff Mo', 'Payoff Date', 'Interest', 'Freed $/mo', 'Cumul Freed'];
  var rows = [headers];

  var sorted = simResult.accts.slice().sort(function(a, b) {
    return (a.payoffMonth || 999) - (b.payoffMonth || 999);
  });

  var cumulFreed = 0;
  var totalStartBal = 0;
  var totalMin = 0;
  var totalInterest = 0;

  for (var i = 0; i < sorted.length; i++) {
    var a = sorted[i];
    cumulFreed += a.freedPerMonth || a.min || 0;
    totalStartBal += a.startBal;
    totalMin += a.min;
    totalInterest += a.intPaid;
    rows.push([
      a.name,
      roundTo(a.startBal, 2),
      a.apr,
      roundTo(a.min, 2),
      a.strategy || '',
      a.payoffMonth || '',
      a.payoffDate || '',
      roundTo(a.intPaid, 2),
      roundTo(a.freedPerMonth || a.min || 0, 2),
      roundTo(cumulFreed, 2)
    ]);
  }

  rows.push(['TOTAL', roundTo(totalStartBal, 2), '', roundTo(totalMin, 2), '', '', '', roundTo(totalInterest, 2), '', '']);

  sheet.getRange(1, 1, rows.length, 10).setValues(rows);

  sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#e8eaf6').setHorizontalAlignment('center');
  var dataCount = rows.length - 2;
  if (dataCount > 0) {
    sheet.getRange(2, 2, dataCount + 1, 1).setNumberFormat('$#,##0.00');
    sheet.getRange(2, 3, dataCount, 1).setNumberFormat('0.00%');
    sheet.getRange(2, 4, dataCount + 1, 1).setNumberFormat('$#,##0.00');
    sheet.getRange(2, 7, dataCount, 1).setNumberFormat('MMM yyyy');
    sheet.getRange(2, 8, dataCount + 1, 1).setNumberFormat('$#,##0.00');
    sheet.getRange(2, 9, dataCount, 1).setNumberFormat('$#,##0.00');
    sheet.getRange(2, 10, dataCount, 1).setNumberFormat('$#,##0.00');
  }

  var totalRowIdx = rows.length;
  sheet.getRange(totalRowIdx, 1, 1, 10).setFontWeight('bold').setBackground('#f5f5f5');

  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 70);
  sheet.setColumnWidth(4, 90);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 80);
  sheet.setColumnWidth(7, 100);
  sheet.setColumnWidth(8, 100);
  sheet.setColumnWidth(9, 100);
  sheet.setColumnWidth(10, 100);
}

// ════════════════════════════════════════════════════════════════════
// UTILITIES
// ════════════════════════════════════════════════════════════════════

/**
 * Get or create a sheet by name. If it exists, return it. If not, create it.
 */
function getOrCreateSheet_(ss, name) {
  var physicalName = TAB_MAP[name] || name;
  var sheet = ss.getSheetByName(physicalName);
  if (!sheet) {
    sheet = ss.insertSheet(physicalName);
  }
  return sheet;
}

/**
 * Test runner — run from the Apps Script editor to verify cascade output.
 */
function testCascade() {
  var parsed = parseDebtExport();
  var bonus = parseFloat(readDebtExportMeta('augustBonus')) || 0;
  Logger.log('=== CASCADE TEST ===');
  Logger.log('Active debts: ' + parsed.active.length);
  Logger.log('August bonus: $' + bonus);

  var result = runCascade_(parsed.active, bonus);
  Logger.log('Starting debt: $' + Math.round(result.startingDebt));
  Logger.log('Total interest: $' + Math.round(result.totalInterest));
  Logger.log('Last payoff: Month ' + result.lastPayoffMonth + ' (' + result.lastPayoffLabel + ')');
  Logger.log('');

  var sorted = result.accts.slice().sort(function(a, b) {
    return (a.payoffMonth || 999) - (b.payoffMonth || 999);
  });
  for (var i = 0; i < sorted.length; i++) {
    var a = sorted[i];
    Logger.log('  ' + (i + 1) + '. ' + a.name +
      ' | $' + Math.round(a.startBal) +
      ' @ ' + (a.apr * 100).toFixed(1) + '%' +
      ' → Mo ' + (a.payoffMonth || '?') +
      ' | Int: $' + Math.round(a.intPaid) +
      ' | Freed: $' + Math.round(a.min) + '/mo');
  }
}

// ════════════════════════════════════════════════════════════════════
// VERSION ACCESSOR (P3/#61 — dynamic version in Code.gs)
// ════════════════════════════════════════════════════════════════════
/**
// ════════════════════════════════════════════════════════════════════
// AUTOMATED CASCADE TRIGGER (P4/#62)
// ════════════════════════════════════════════════════════════════════
/**
 * Install a monthly time-driven trigger for refreshCascadeTabs().
 * Runs on the 1st of each month at ~7:00 AM.
 * Safe to call multiple times — removes existing trigger first.
 */
function installMonthlyCascadeRefresh() {
  removeMonthlyCascadeRefresh();
  ScriptApp.newTrigger('refreshCascadeTabs')
    .timeBased()
    .onMonthDay(1)
    .atHour(7)
    .nearMinute(0)
    .create();
  Logger.log('✓ Monthly cascade refresh installed — runs 1st of each month at ~7:00 AM');
}
/**
 * Remove existing refreshCascadeTabs time-driven trigger.
 */
function removeMonthlyCascadeRefresh() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'refreshCascadeTabs') {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log('Removed existing cascade refresh trigger');
    }
  }
}
// ════════════════════════════════════════════════════════════════════
// END OF FILE — CascadeEngine v7
// ════════════════════════════════════════════════════════════════════