// ═══════════════════════════════════════════════════
// MonitorEngine.gs v7
// WRITES TO: 💻🧮 Close History, 💻🧮 Month-End Review
// READS FROM: 💻🧮 DebtModel, 💻🧮 Helpers, 🔒 Transactions, 🔒 Balance History
// ═══════════════════════════════════════════════════

function getMonitorEngineVersion() { return 7; }

var MONITOR_EMAIL = 'lthompson@memoveindesigns.com';
// v6: openById migration — trigger-safe (was getActiveSpreadsheet, fails from CLOCK triggers)
var TBM = SpreadsheetApp.openById('1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c');

var ME_TRANSFER_CATS = [
  'Transfer: Internal', 'Transfer: External', 'Transfer: LOC Draw',
  'Balance Transfers', 'CC Payment', 'LOC Payment', 'Loan Payment',
  'Loan Proceeds', 'Investment', 'Payroll Deduction', 'Duplicate - Exclude',
  'Debt Offset', 'SoFi Loan', 'Auto Loan', 'Student Loans', 'Solar Panel'
];

function me_parseAmount_(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  var s = val.toString().replace(/[$,\s]/g, '');
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function me_defaultPriorMonth_(monthLabel) {
  if (monthLabel) return monthLabel;
  var now = new Date();
  var prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return Utilities.formatDate(prior, 'America/Chicago', 'yyyy-MM');
}

function parseMonthRange_(monthLabel) {
  var p = monthLabel.split('-');
  return { start: new Date(parseInt(p[0]), parseInt(p[1]) - 1, 1),
           end:   new Date(parseInt(p[0]), parseInt(p[1]), 0) };
}

function loadMonthTransactions_(startDate, endDate) {
  var txSheet = TBM.getSheetByName('Transactions');
  if (!txSheet) throw new Error('MonitorEngine: Transactions sheet not found');
  var txData = txSheet.getDataRange().getValues();
  var txns = [];
  for (var i = 1; i < txData.length; i++) {
    var d = txData[i][1];
    if (d instanceof Date && d >= startDate && d <= endDate) {
      txns.push({ date: d, desc: (txData[i][2]||'').toString(),
        cat: (txData[i][3]||'').toString(), amt: me_parseAmount_(txData[i][4]),
        acct: (txData[i][5]||'').toString() });
    }
  }
  return { txns: txns, sheet: txSheet };
}

// ══════════════════════════════════════════════════════
//  stampCloseMonth — seals month in Close History
// ══════════════════════════════════════════════════════
function stampCloseMonth(monthLabel) {
  monthLabel = me_defaultPriorMonth_(monthLabel);
  var range = parseMonthRange_(monthLabel);
  Logger.log('═══ stampCloseMonth(' + monthLabel + ') ═══');

  var MN = ['January','February','March','April','May','June',
            'July','August','September','October','November','December'];
  var yr = parseInt(monthLabel.split('-')[0]);
  var mi = parseInt(monthLabel.split('-')[1]) - 1;
  var displayMonth = MN[mi] + ' ' + yr;
  Logger.log('Target: "' + displayMonth + '"');

  var dmSheet = TBM.getSheetByName('💻🧮 DebtModel');
  if (!dmSheet) throw new Error('stampCloseMonth: 💻🧮 DebtModel not found');
  var dmNames = dmSheet.getRange('O8:O30').getValues();
  var debtAccounts = [];
  for (var d = 0; d < dmNames.length; d++) {
    var nm = (dmNames[d][0]||'').toString().trim();
    if (nm) debtAccounts.push(nm);
  }
  Logger.log('Debt accounts: ' + debtAccounts.length);

  // BH: Col B(1)=Date, Col D(3)=Account, Col I(8)=Balance
  var bhSheet = TBM.getSheetByName('Balance History');
  if (!bhSheet) throw new Error('stampCloseMonth: Balance History not found');
  var bhData = bhSheet.getDataRange().getValues();
  var latest = {};
  for (var b = 1; b < bhData.length; b++) {
    var bd = bhData[b][1];
    if (!(bd instanceof Date) || bd > range.end) continue;
    var ba = (bhData[b][3]||'').toString().trim();
    if (!ba) continue;
    if (!latest[ba] || bd >= latest[ba].date)
      latest[ba] = { date: bd, balance: me_parseAmount_(bhData[b][8]) };
  }

  var debtCurrent = 0, matched = 0, unmatched = [];
  debtAccounts.forEach(function(acct) {
    if (latest[acct]) {
      debtCurrent += Math.abs(latest[acct].balance);
      matched++;
      Logger.log('  ' + acct + ': $' + Math.abs(latest[acct].balance).toFixed(2));
    } else { unmatched.push(acct); Logger.log('  ' + acct + ': NOT FOUND'); }
  });
  Logger.log('debtCurrent: $' + debtCurrent.toFixed(2) + ' (' + matched + '/' + debtAccounts.length + ')');

  var chSheet = TBM.getSheetByName('💻🧮 Close History');
  if (!chSheet) throw new Error('stampCloseMonth: 💻🧮 Close History not found');
  var chData = chSheet.getDataRange().getValues();
  var targetRow = -1;
  for (var c = 0; c < chData.length; c++) {
    if ((chData[c][0]||'').toString().trim() === displayMonth) { targetRow = c + 1; break; }
  }
  if (targetRow === -1) {
    Logger.log('Row for "' + displayMonth + '" not found.');
    return { success: false, reason: 'Month not found: ' + displayMonth, debtCurrent: debtCurrent };
  }

  chSheet.getRange(targetRow, 8).setValue(debtCurrent);
  chSheet.getRange(targetRow, 2).setValue('Closed');
  chSheet.getRange(targetRow, 3).setValue(new Date());
  Logger.log('✅ Row ' + targetRow + ': H=$' + debtCurrent.toFixed(2) + ', B=Closed');

  return { success: true, month: displayMonth, monthLabel: monthLabel,
    row: targetRow, debtCurrent: debtCurrent, matched: matched,
    unmatched: unmatched, timestamp: new Date().toISOString() };
}

// ══════════════════════════════════════════════════════
//  listLargeTransactions — all > $500, NO exclusions
// ══════════════════════════════════════════════════════
function listLargeTransactions(monthLabel) {
  monthLabel = me_defaultPriorMonth_(monthLabel);
  var range = parseMonthRange_(monthLabel);
  var loaded = loadMonthTransactions_(range.start, range.end);
  Logger.log('═══ listLargeTransactions(' + monthLabel + ') ═══');

  var large = loaded.txns.filter(function(t) { return Math.abs(t.amt) > 500; });
  large.sort(function(a, b) { return Math.abs(b.amt) - Math.abs(a.amt); });
  Logger.log('Large transactions (>$500): ' + large.length);
  large.forEach(function(t, i) {
    Logger.log((i+1) + '. ' + Utilities.formatDate(t.date,'America/Chicago','MM/dd') +
      ' | $' + t.amt.toFixed(2) + ' | ' + t.cat + ' | ' + t.acct + ' | ' + t.desc);
  });

  var byCat = {};
  large.forEach(function(t) {
    var k = t.cat || '(empty)';
    if (!byCat[k]) byCat[k] = { count: 0, total: 0 };
    byCat[k].count++; byCat[k].total += t.amt;
  });
  Logger.log('By category:');
  Object.keys(byCat).sort().forEach(function(c) {
    Logger.log('  ' + c + ': ' + byCat[c].count + ' txns, $' + byCat[c].total.toFixed(2));
  });
  return { month: monthLabel, count: large.length, transactions: large, byCat: byCat };
}

// ══════════════════════════════════════════════════════
//  checkRefiGhosts — DM live > $100 but BH latest = $0
// ══════════════════════════════════════════════════════
function checkRefiGhosts() {
  Logger.log('═══ checkRefiGhosts() ═══');
  var dmSheet = TBM.getSheetByName('💻🧮 DebtModel');
  if (!dmSheet) throw new Error('checkRefiGhosts: 💻🧮 DebtModel not found');
  var dmData = dmSheet.getRange('A8:P30').getValues();

  var bhSheet = TBM.getSheetByName('Balance History');
  if (!bhSheet) throw new Error('checkRefiGhosts: Balance History not found');
  var bhData = bhSheet.getDataRange().getValues();
  var latestBH = {};
  for (var b = 1; b < bhData.length; b++) {
    var d = bhData[b][1];
    if (!(d instanceof Date)) continue;
    var a = (bhData[b][3]||'').toString().trim();
    if (!a) continue;
    if (!latestBH[a] || d >= latestBH[a].date)
      latestBH[a] = { date: d, balance: me_parseAmount_(bhData[b][8]) };
  }

  var ghosts = [];
  for (var i = 0; i < dmData.length; i++) {
    var acct = (dmData[i][0]||'').toString().trim();
    var tiller = (dmData[i][14]||'').toString().trim();
    var live = me_parseAmount_(dmData[i][15]);
    if (!acct || !tiller) continue;
    var bh = latestBH[tiller];
    if (live > 100 && (!bh || Math.abs(bh.balance) === 0)) {
      ghosts.push({ account: acct, tillerName: tiller, liveBalance: live,
        bhBalance: 0, bhDate: bh ? bh.date : null });
      Logger.log('🚩 ' + acct + ' (' + tiller + ') — DM: $' + live.toFixed(2) + ', BH: $0');
    }
  }
  Logger.log(ghosts.length === 0 ? '✅ No refi ghosts.' : '⚠️ ' + ghosts.length + ' ghost(s).');
  return ghosts;
}

// ══════════════════════════════════════════════════════
//  runMERGates — 11-gate automated pre-check
// ══════════════════════════════════════════════════════
function runMERGates(monthLabel) {
  monthLabel = me_defaultPriorMonth_(monthLabel);
  var range = parseMonthRange_(monthLabel);
  Logger.log('═══ MonitorEngine v6 — runMERGates(' + monthLabel + ') ═══');

  var loaded = loadMonthTransactions_(range.start, range.end);
  var monthTxns = loaded.txns, txSheet = loaded.sheet;
  Logger.log('Month transactions: ' + monthTxns.length);
  var results = [];

  // Gate 1: Uncategorized = 0 — v7: include transaction details for triage
  var uncatTxns = monthTxns.filter(function(t) {
    return !t.cat || t.cat === '' || t.cat === 'Uncategorized';
  });
  var uncat = uncatTxns.length;
  var uncatDetails = [];
  uncatTxns.sort(function(a, b) { return b.date - a.date; });
  for (var _u = 0; _u < Math.min(uncatTxns.length, 10); _u++) {
    var _ut = uncatTxns[_u];
    uncatDetails.push(Utilities.formatDate(_ut.date, 'America/Chicago', 'MMM dd') +
      ' \u2014 ' + (_ut.desc || 'No description') + ' \u2014 $' + Math.abs(_ut.amt).toFixed(2));
  }
  if (uncatTxns.length > 10) uncatDetails.push('and ' + (uncatTxns.length - 10) + ' more\u2026');
  results.push({ gate: 1, name: 'Uncategorized = 0',
    status: uncat === 0 ? 'PASS' : 'FAIL', value: uncat,
    detail: uncat + ' uncategorized transactions',
    details: uncatDetails });

  // Gate 2: ATM/Cash < 20 — v7: include transaction details
  var atmTxns = monthTxns.filter(function(t) { return t.cat === 'ATM/Cash'; });
  var atm = atmTxns.length;
  var atmDetails = [];
  atmTxns.sort(function(a, b) { return b.date - a.date; });
  for (var _a = 0; _a < Math.min(atmTxns.length, 10); _a++) {
    var _at = atmTxns[_a];
    atmDetails.push(Utilities.formatDate(_at.date, 'America/Chicago', 'MMM dd') +
      ' \u2014 ' + (_at.desc || 'ATM') + ' \u2014 $' + Math.abs(_at.amt).toFixed(2));
  }
  if (atmTxns.length > 10) atmDetails.push('and ' + (atmTxns.length - 10) + ' more\u2026');
  results.push({ gate: 2, name: 'ATM/Cash < 20',
    status: atm < 20 ? 'PASS' : 'FAIL', value: atm,
    detail: atm + ' ATM/Cash transactions',
    details: atmDetails });

  // Gate 3: Transfer Net ~$0
  var tNet = 0;
  monthTxns.forEach(function(t) { if (ME_TRANSFER_CATS.indexOf(t.cat) > -1) tNet += t.amt; });
  results.push({ gate: 3, name: 'Transfer Net ~$0',
    status: Math.abs(tNet) < 500 ? 'PASS' : 'WARN', value: tNet.toFixed(2),
    detail: 'Net: $' + tNet.toFixed(2) + ' (threshold: $500, known ~$272/mo)' });

  // Gate 4: Large Txns > $500 — NO exclusions, first 10 itemized
  var lgTxns = monthTxns.filter(function(t) { return Math.abs(t.amt) > 500; });
  lgTxns.sort(function(a, b) { return Math.abs(b.amt) - Math.abs(a.amt); });
  var lgLines = lgTxns.map(function(t) {
    return Utilities.formatDate(t.date,'America/Chicago','MM/dd') +
      ' $' + t.amt.toFixed(2) + ' ' + t.cat + ' — ' + t.desc;
  });
  var lgDetails = lgLines.slice(0, 10);
  if (lgLines.length > 10) lgDetails.push('and ' + (lgLines.length - 10) + ' more\u2026');
  results.push({ gate: 4, name: 'Large Txns > $500', status: 'REVIEW', value: lgTxns.length,
    detail: lgTxns.length + ' large transactions' +
      (lgLines.length > 0 ? ':\n' + lgLines.slice(0,10).join('\n') +
        (lgLines.length > 10 ? '\n... and ' + (lgLines.length-10) + ' more' : '') : ''),
    details: lgDetails });

  // Gate 5: BankRec Tie-Out
  results.push({ gate: 5, name: 'BankRec Tie-Out', status: 'REVIEW', value: 'Manual',
    detail: 'Check BankRec tab — cash <$1, CC <$100 timing variance' });

  // Gate 6: NW = DE Tie
  results.push({ gate: 6, name: 'NW = DE Tie', status: 'REVIEW',
    value: 'Run ?action=verify', detail: 'Cross-check NetWorth tab vs DataEngine netWorth' });

  // Gate 7: Promo Cliff Alerts
  var promo = checkPromoCliffs_();
  var g7s, g7d;
  if (promo.unreadable) { g7s = 'WARN'; g7d = 'Cannot read Debt_Export — ' + promo.reason; }
  else if (promo.alerts.length > 0) { g7s = 'WARN';
    g7d = promo.alerts.map(function(a) { return a.account + ' — ' + a.message; }).join('; ');
  } else { g7s = 'PASS'; g7d = 'No active promo cliffs'; }
  results.push({ gate: 7, name: 'Promo Cliff Alerts', status: g7s,
    value: promo.unreadable ? 'UNREADABLE' : promo.alerts.length + ' active', detail: g7d });

  // Gate 8: Orphan Account Detection
  var known = getKnownAccounts_();
  var oTxns = monthTxns.filter(function(t) { return t.acct && known.indexOf(t.acct) === -1; });
  var oAccts = [];
  oTxns.forEach(function(t) { if (oAccts.indexOf(t.acct) === -1) oAccts.push(t.acct); });
  results.push({ gate: 8, name: 'Orphan Account Detection',
    status: oTxns.length === 0 ? 'PASS' : 'WARN', value: oTxns.length,
    detail: oTxns.length + ' txns from ' + oAccts.length + ' unknown accounts' +
      (oAccts.length > 0 ? ': ' + oAccts.slice(0,5).join(', ') : '') });

  // Gate 9: Row Cap Headroom — 20000, ~370 txns/mo
  var rowCount = txSheet.getLastRow();
  var rowCap = 20000;
  var headroom = rowCap - rowCount;
  results.push({ gate: 9, name: 'Row Cap Headroom',
    status: headroom > 1000 ? 'PASS' : headroom > 500 ? 'WARN' : 'FAIL',
    value: rowCount + ' / ' + rowCap,
    detail: headroom + ' rows remaining (~' + Math.floor(headroom/370) + ' months at ~370 txns/mo)' });

  // Gate 10: CC/LOC Payment Netting
  var ccNet = 0, locNet = 0;
  monthTxns.forEach(function(t) {
    if (t.cat === 'CC Payment') ccNet += t.amt;
    if (t.cat === 'LOC Payment') locNet += t.amt;
  });
  results.push({ gate: 10, name: 'CC/LOC Payment Netting',
    status: Math.abs(ccNet) < 500 ? 'PASS' : 'WARN', value: '$' + ccNet.toFixed(2),
    detail: 'CC: $' + ccNet.toFixed(2) + ' (~$241/mo). LOC: $' + locNet.toFixed(2) + ' (~$31/mo)' });

  // Gate 11: Misc Spot Check
  results.push({ gate: 11, name: 'Misc Spot Check', status: 'REVIEW', value: 'Manual',
    detail: 'Review Misc category — flag anything > $200' });

  // Summary
  var p=0,f=0,w=0,rv=0;
  results.forEach(function(r) {
    if (r.status==='PASS') p++; else if (r.status==='FAIL') f++;
    else if (r.status==='WARN') w++; else rv++;
  });
  var summary = p+' PASS / '+f+' FAIL / '+w+' WARN / '+rv+' REVIEW';
  Logger.log('───────────────────────────────────────');
  results.forEach(function(r) {
    Logger.log('Gate '+r.gate+' ['+r.status+'] '+r.name+' — '+r.detail);
  });
  Logger.log('SUMMARY: ' + summary);
  return { month: monthLabel, timestamp: new Date().toISOString(),
    version: 'MonitorEngine v6', summary: summary,
    allAutoPass: f === 0 && w === 0, gates: results };
}

// ══════════════════════════════════════════════════════
//  PROMO CLIFF SCANNER — multi-row header detection
// ══════════════════════════════════════════════════════
function checkPromoCliffs_() {
  var deSheet = TBM.getSheetByName('💻🧮 Debt_Export');
  if (!deSheet) return { unreadable: true, reason: 'Sheet not found', alerts: [] };
  var data = deSheet.getDataRange().getValues();
  if (data.length < 2) return { unreadable: true, reason: 'Sheet has < 2 rows', alerts: [] };
  var today = new Date(), alerts = [];
  var headerRow=-1, nameCol=-1, promoEndCol=-1, aprCol=-1, balCol=-1;
  var maxScan = Math.min(4, data.length - 1);

  for (var tryRow = 0; tryRow <= maxScan; tryRow++) {
    var row = data[tryRow];
    var tn=-1, tp=-1, ta=-1, tb=-1;
    for (var h = 0; h < row.length; h++) {
      var hdr = (row[h]||'').toString().toLowerCase().replace(/[\s_]/g, '');
      if (hdr==='name'||hdr==='account') tn=h;
      if (hdr==='promoend'||hdr==='promoenddate'||hdr==='promoexpires') tp=h;
      if (hdr==='apr'||hdr==='rate') ta=h;
      if (hdr==='balance'||hdr==='bal') tb=h;
    }
    if (tn>=0 && tp>=0) {
      headerRow=tryRow; nameCol=tn; promoEndCol=tp; aprCol=ta; balCol=tb;
      Logger.log('checkPromoCliffs_: Headers in row ' + tryRow);
      break;
    }
  }
  if (headerRow===-1)
    return { unreadable: true, reason: 'Columns not found in rows 0-'+maxScan, alerts: [] };

  for (var i = headerRow+1; i < data.length; i++) {
    var nm = data[i][nameCol];
    if (!nm) continue;
    var pe = data[i][promoEndCol];
    if (!pe) continue;
    if (!(pe instanceof Date)) {
      if (typeof pe === 'string') { pe = new Date(pe+'T12:00:00'); if (isNaN(pe.getTime())) continue; }
      else continue;
    }
    var days = Math.floor((pe - today) / 86400000);
    var postApr = (aprCol>=0 && typeof data[i][aprCol]==='number') ? data[i][aprCol] : null;
    var bal = (balCol>=0 && typeof data[i][balCol]==='number') ? data[i][balCol] : 0;
    var note = postApr ? ' → '+(postApr*100).toFixed(1)+'% on $'+Math.round(bal).toLocaleString() : '';
    if (days <= 0) alerts.push({ account:nm, daysUntil:days, severity:'CRITICAL',
      message:'EXPIRED '+Math.abs(days)+' days ago'+note });
    else if (days <= 7) alerts.push({ account:nm, daysUntil:days, severity:'CRITICAL',
      message:days+' DAYS — action required NOW'+note });
    else if (days <= 30) alerts.push({ account:nm, daysUntil:days, severity:'HIGH',
      message:days+' days — plan needed'+note });
    else if (days <= 90) alerts.push({ account:nm, daysUntil:days, severity:'MEDIUM',
      message:days+' days — on radar'+note });
  }
  return { unreadable: false, reason: null, alerts: alerts };
}

// ══════════════════════════════════════════════════════
//  KNOWN ACCOUNTS — BH-based orphan detection
// ══════════════════════════════════════════════════════
function getKnownAccounts_() {
  var sh = TBM.getSheetByName('Balance History');
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  var acctCol = -1;
  for (var h = 0; h < data[0].length; h++) {
    if ((data[0][h]||'').toString().toLowerCase() === 'account') { acctCol = h; break; }
  }
  if (acctCol === -1) return [];
  var accounts = [];
  for (var i = 1; i < data.length; i++) {
    var a = (data[i][acctCol]||'').toString();
    if (a && accounts.indexOf(a) === -1) accounts.push(a);
  }
  Logger.log('Known accounts: ' + accounts.length);
  return accounts;
}

// ══════════════════════════════════════════════════════
//  TRIGGER MANAGEMENT
// ══════════════════════════════════════════════════════
function setupMonitorTriggers() {
  ScriptApp.newTrigger('runMonthlyMERReport_')
    .timeBased().onMonthDay(1).atHour(9)
    .inTimezone('America/Chicago').create();
  Logger.log('MonitorEngine: Monthly trigger installed (1st @ 9 AM CT).');
}

function removeMonitorTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  triggers.forEach(function(t) {
    if (t.getHandlerFunction() === 'runMonthlyMERReport_') {
      ScriptApp.deleteTrigger(t); removed++;
    }
  });
  Logger.log('MonitorEngine: Removed ' + removed + ' trigger(s).');
}

// ══════════════════════════════════════════════════════
//  MONTHLY TRIGGER — MER report + large txns + auto-stamp
// ══════════════════════════════════════════════════════
function runMonthlyMERReport_() {
  var now = new Date();
  var prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var monthLabel = Utilities.formatDate(prior, 'America/Chicago', 'yyyy-MM');

  var result = runMERGates(monthLabel);
  var lgResult = listLargeTransactions(monthLabel);

  var subject = 'TBM MER Gates — ' + monthLabel + ' — ' + result.summary;
  var body = 'MonitorEngine v6 — Monthly Close Pre-Check\n' +
    'Month: ' + monthLabel + '\nRun at: ' + result.timestamp + '\n\n' +
    '═══════════════════════════════════════\n';
  result.gates.forEach(function(g) {
    var icon = g.status==='PASS' ? '✅' : g.status==='FAIL' ? '❌' : g.status==='WARN' ? '⚠️' : '👁️';
    body += icon+' Gate '+g.gate+' ['+g.status+'] '+g.name+'\n   → '+g.detail+'\n\n';
  });
  body += '═══════════════════════════════════════\nSUMMARY: '+result.summary+'\n\n';

  if (lgResult.count > 0) {
    body += '═══════════════════════════════════════\n' +
      'LARGE TRANSACTIONS (>$500) — '+lgResult.count+' items\n' +
      '═══════════════════════════════════════\n';
    lgResult.transactions.forEach(function(t, i) {
      body += (i+1)+'. '+Utilities.formatDate(t.date,'America/Chicago','MM/dd') +
        ' | $'+t.amt.toFixed(2)+' | '+t.cat+' | '+t.acct+' | '+t.desc+'\n';
    });
    body += '\n';
  }
  body += 'Next: Complete manual gates (4, 5, 6, 11) in the MER Close Checklist.';

  MailApp.sendEmail(MONITOR_EMAIL, subject, body);
  Logger.log('MER report emailed to ' + MONITOR_EMAIL);

  if (result.allAutoPass) {
    Logger.log('All auto gates PASS — stamping ' + monthLabel);
    var stamp = stampCloseMonth(monthLabel);
    Logger.log(stamp.success
      ? '✅ Stamped: '+stamp.month+' $'+stamp.debtCurrent.toFixed(2)
      : '⚠️ Stamp failed: '+stamp.reason);
  } else {
    Logger.log('⚠️ Gate failures — NOT auto-stamped. Run stampCloseMonth() manually.');
  }
}

// EOF — MonitorEngine.gs v7