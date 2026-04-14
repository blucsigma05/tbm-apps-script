// ═══════════════════════════════════════════════════════════════
// Utility.js v8 — Run-once utility functions
// ═══════════════════════════════════════════════════════════════
// The isStaleDaily_ and isStaleWeekly_ fixes are already in
// KidsHub.gs v6 Full Deploy. These utilities handle cleanup.
// ═══════════════════════════════════════════════════════════════

function getUtilityVersion() { return 8; }


// ── FIX 3: Add Parent_PIN column to KH_Children ─────────────
// Run once from Apps Script editor.

function fixParentPINColumn() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['KH_Children'])
    ? TAB_MAP['KH_Children'] : 'KH_Children';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) { Logger.log('❌ KH_Children not found'); return; }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);

  if (headers.indexOf('Parent_PIN') >= 0) {
    Logger.log('✅ Parent_PIN column already exists');
    return;
  }

  // Add header in next column
  var newCol = headers.length + 1;
  sheet.getRange(1, newCol).setValue('Parent_PIN');
  sheet.getRange(1, newCol).setBackground('#0f1923').setFontColor('#fbbf24')
    .setFontWeight('bold').setFontFamily('Courier New').setFontSize(10);
  sheet.setColumnWidth(newCol, 70);

  // Set PIN for existing rows (Buggsy row 2, JJ row 3)
  var lastRow = sheet.getLastRow();
  for (var i = 2; i <= lastRow; i++) {
    sheet.getRange(i, newCol).setValue('1234');
  }

  Logger.log('✅ Added Parent_PIN column with default "1234" for ' + (lastRow - 1) + ' children');
  lock.releaseLock();
}


// ── FIX 4: Clean up stuck duplicate UIDs from the timezone bug ─
// This removes the "duplicate" block so kids can re-claim today.
// Run once after deploying the isStaleDaily_ fix.

function fixStaleDuplicates() {
  Logger.log('═══ Cleaning up stale duplicate entries ═══');

  var choresSheet = getKHSheet_('KH_Chores');
  if (!choresSheet) { Logger.log('❌ KH_Chores not found'); return; }

  var h = getKHHeaders_(choresSheet);
  var data = choresSheet.getDataRange().getValues();
  var today = getTodayISO_();
  var resetCount = 0;

  for (var i = 1; i < data.length; i++) {
    var done = data[i][khCol_(h, 'Completed')] === true ||
      String(data[i][khCol_(h, 'Completed')]).toUpperCase() === 'TRUE';
    if (!done) continue;

    var dateVal = data[i][khCol_(h, 'Completed_Date')];
    var dateStr;
    if (dateVal instanceof Date) {
      dateStr = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else {
      dateStr = String(dateVal || '').trim().substring(0, 10);
    }

    // If completed today but the isStaleDaily bug would have flagged it,
    // reset it so the kid can re-claim with the fixed code
    if (dateStr === today) {
      var taskID = String(data[i][khCol_(h, 'Task_ID')] || '');
      var child = String(data[i][khCol_(h, 'Child')] || '').toLowerCase();
      var uid = taskID + '_' + today + '_' + child;

      // Check if history entry exists
      if (historyUIDExists_(uid)) {
        // Entry exists — the claim DID go through server-side.
        // The problem was only that the UI showed 0 on refresh.
        // With the isStaleDaily_ fix, this will now display correctly.
        Logger.log('  ✅ ' + taskID + ' (' + child + '): history entry exists, will display correctly now');
      } else {
        // No history entry — the kid was locked out by duplicate guard
        // after a partial failure. Reset so they can try again.
        choresSheet.getRange(i + 1, khCol_(h, 'Completed') + 1).setValue(false);
        choresSheet.getRange(i + 1, khCol_(h, 'Completed_Date') + 1).setValue('');
        choresSheet.getRange(i + 1, khCol_(h, 'Parent_Approved') + 1).setValue(false);
        Logger.log('  🔄 ' + taskID + ' (' + child + '): reset (no history entry, was stuck)');
        resetCount++;
      }
    }

    // Also reset anything from before today (stale from previous days)
    if (dateStr && dateStr < today) {
      choresSheet.getRange(i + 1, khCol_(h, 'Completed') + 1).setValue(false);
      choresSheet.getRange(i + 1, khCol_(h, 'Completed_Date') + 1).setValue('');
      choresSheet.getRange(i + 1, khCol_(h, 'Parent_Approved') + 1).setValue(false);
      Logger.log('  🔄 ' + data[i][khCol_(h, 'Task_ID')] + ': reset (stale from ' + dateStr + ')');
      resetCount++;
    }
  }

  Logger.log('');
  Logger.log('Reset ' + resetCount + ' chores. Kids can now re-claim fresh.');
  Logger.log('═══ Done ═══');
}


// ── FULL DIAGNOSTIC: Run this to dump everything ─────────────
// Paste the Logger output back to Soul.

function diagKidsHub() {
  Logger.log('═══ diagKidsHub v6 — FULL TRACE ═══');
  Logger.log('Time: ' + new Date().toISOString());
  Logger.log('TZ: ' + Session.getScriptTimeZone());
  Logger.log('Today ISO: ' + getTodayISO_());
  Logger.log('');

  // 1. KH_History — count and last 5 entries
  Logger.log('── KH_History ──');
  var hSheet = getKHSheet_('KH_History');
  if (!hSheet) { Logger.log('❌ KH_History not found'); }
  else {
    var hData = hSheet.getDataRange().getValues();
    Logger.log('Total rows (incl header): ' + hData.length);
    var hH = hData[0].map(String);
    Logger.log('Headers: ' + hH.join(', '));
    var start = Math.max(1, hData.length - 5);
    for (var i = start; i < hData.length; i++) {
      Logger.log('  Row ' + (i+1) + ': UID=' + hData[i][0] + ' | Child=' + hData[i][2] + ' | Pts=' + hData[i][4] + ' | Type=' + hData[i][7] + ' | Date=' + hData[i][8]);
    }
  }
  Logger.log('');

  // 2. KH_Chores — first 5 rows, raw date types
  Logger.log('── KH_Chores (Completed_Date types) ──');
  var cSheet = getKHSheet_('KH_Chores');
  if (!cSheet) { Logger.log('❌ KH_Chores not found'); }
  else {
    var cData = cSheet.getDataRange().getValues();
    var cH = cData[0].map(String);
    var dateCol = cH.indexOf('Completed_Date');
    var doneCol = cH.indexOf('Completed');
    var taskCol = cH.indexOf('Task_ID');
    var childCol = cH.indexOf('Child');
    for (var i = 1; i < Math.min(cData.length, 8); i++) {
      var raw = cData[i][dateCol];
      var done = cData[i][doneCol];
      Logger.log('  Row ' + (i+1) + ': ' + cData[i][taskCol] + ' | Child=' + cData[i][childCol]
        + ' | Done=' + done + '(type:' + typeof done + ')'
        + ' | Date raw type=' + (raw instanceof Date ? 'DATE_OBJ' : typeof raw)
        + ' | raw=' + raw
        + ' | String(raw)=' + String(raw).substring(0, 30));
    }
  }
  Logger.log('');

  // 3. isStaleDaily_ test with actual cell values
  Logger.log('── isStaleDaily_ with actual cell values ──');
  if (cSheet) {
    for (var i = 1; i < Math.min(cData.length, 8); i++) {
      var raw = cData[i][dateCol];
      if (!raw) continue;
      var asStr = String(raw);
      Logger.log('  Row ' + (i+1) + ': isStaleDaily_(raw)=' + isStaleDaily_(raw)
        + ' | isStaleDaily_(String(raw))=' + isStaleDaily_(asStr));
    }
  }
  Logger.log('');

  // 4. Computed balances
  Logger.log('── Balances ──');
  var bBal = computeBalances_('buggsy', false);
  var jBal = computeBalances_('jj', false);
  Logger.log('Buggsy: ' + JSON.stringify(bBal));
  Logger.log('JJ: ' + JSON.stringify(jBal));
  Logger.log('');

  // 5. readChores_ output sample
  Logger.log('── readChores_ output (buggsy, first 3) ──');
  var tasks = readChores_('buggsy', false);
  for (var i = 0; i < Math.min(tasks.length, 3); i++) {
    var t = tasks[i];
    Logger.log('  ' + t.taskID + ': completed=' + t.completed + ' | approved=' + t.parentApproved + ' | pts=' + t.points + ' | compDate=' + t.completedDate);
  }
  Logger.log('');

  // 6. Check if v6 readChores_ fix is deployed
  // The fix adds compDateRaw variable. If old code is deployed,
  // String(DateObj) produces "Thu Mar 13..." which isStaleDaily_ can't match.
  Logger.log('── v6 readChores_ fix check ──');
  var src = readChores_.toString();
  var hasRawFix = src.indexOf('compDateRaw') >= 0;
  Logger.log('readChores_ contains "compDateRaw": ' + hasRawFix + (hasRawFix ? ' ✅' : ' ❌ OLD CODE DEPLOYED'));
  Logger.log('');

  // 7. Full getKidsHubData payload check
  Logger.log('── getKidsHubData(buggsy) meta ──');
  var payload = JSON.parse(getKidsHubData('buggsy'));
  Logger.log('_meta: ' + JSON.stringify(payload._meta));
  Logger.log('tasks count: ' + (payload.tasks || []).length);
  var completedCount = (payload.tasks || []).filter(function(t) { return t.completed; }).length;
  Logger.log('completed count: ' + completedCount);
  Logger.log('balances: ' + JSON.stringify(payload.balances));
  Logger.log('');

  Logger.log('═══ END diagKidsHub ═══');
}


// ── VERIFICATION: Run after deploying fixes ──────────────────

function verifyKHFix() {
  Logger.log('═══ KidsHub v6 Fix Verification ═══');

  // Test 1: isStaleDaily_ with today's date as string
  var today = getTodayISO_();
  var staleStr = isStaleDaily_(today);
  Logger.log('1. isStaleDaily_("' + today + '"): ' + staleStr + ' — ' + (!staleStr ? '✅ PASS' : '❌ FAIL'));

  // Test 2: isStaleDaily_ with a Date object for today
  var todayDate = new Date();
  var staleDate = isStaleDaily_(todayDate);
  Logger.log('2. isStaleDaily_(new Date()): ' + staleDate + ' — ' + (!staleDate ? '✅ PASS' : '❌ FAIL'));

  // Test 3: isStaleDaily_ with yesterday
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var yesterdayISO = Utilities.formatDate(yesterday, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var staleYest = isStaleDaily_(yesterdayISO);
  Logger.log('3. isStaleDaily_("' + yesterdayISO + '"): ' + staleYest + ' — ' + (staleYest ? '✅ PASS' : '❌ FAIL'));

  // Test 4: isStaleWeekly_ with today
  var staleWeekly = isStaleWeekly_(today);
  Logger.log('4. isStaleWeekly_("' + today + '"): ' + staleWeekly + ' — ' + (!staleWeekly ? '✅ PASS' : '❌ FAIL'));

  // Test 5: Parent_PIN column
  try {
    var childSheet = getKHSheet_('KH_Children');
    var headers = childSheet.getRange(1, 1, 1, childSheet.getLastColumn()).getValues()[0].map(String);
    var hasPin = headers.indexOf('Parent_PIN') >= 0;
    Logger.log('5. Parent_PIN column: ' + (hasPin ? '✅ PRESENT' : '❌ MISSING'));
  } catch(e) {
    Logger.log('5. Parent_PIN: ❌ ' + e.message);
  }

  // Test 6: Balance check
  var bugsBalance = sumHistoryPoints_('buggsy');
  var jjBalance = sumHistoryPoints_('jj');
  Logger.log('6. Buggsy earned: ' + bugsBalance + ' (should be > 0 if any history exists)');
  Logger.log('   JJ earned: ' + jjBalance);

  // Test 7: Timezone info
  Logger.log('7. Script timezone: ' + Session.getScriptTimeZone());
  Logger.log('   getTodayISO_(): ' + getTodayISO_());
  Logger.log('   new Date(): ' + new Date().toISOString());
  Logger.log('   Formatted: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'));

  Logger.log('');
  var allPass = !staleStr && !staleDate && staleYest && !staleWeekly;
  Logger.log(allPass ? '✅ ALL CHECKS PASSED — v6 fix is working' : '❌ ISSUES FOUND — review above');
  Logger.log('═══ End ═══');
}

// ═══════════════════════════════════════════════════════════════
// F04 PHASE 1 DIAGNOSTICS — Run from Apps Script editor
// Delete after Phase 1 data discovery is complete.
// ═══════════════════════════════════════════════════════════════

/**
 * diagAccountTypes() — F04 Phase 1, Diagnostic 1
 * Enumerates all Balance History Type + Class combos.
 * Answers: what are the actual account types? Which are liquid?
 * Run from editor → View → Logs.
 */
function diagAccountTypes() {
  var ss = SpreadsheetApp.openById(SSID);
  var bh = ss.getSheetByName(TAB_MAP['Balance History']);
  if (!bh) { Logger.log('ERROR: Balance History not found'); return; }
  var data = bh.getDataRange().getValues();

  var combos = {};   // "Type|Class" → { count, accounts[], latestBalance }
  var accounts = {}; // account name → { type, class, latestDate, latestBalance }

  for (var i = 1; i < data.length; i++) {
    var acct = String(data[i][3] || '').trim();
    var bal = parseFloat(data[i][8]) || 0;
    var dt = data[i][1];
    var type = String(data[i][11] || '').trim();
    var cls = String(data[i][12] || '').trim();
    if (!acct) continue;
    if (typeof dt === 'string') dt = new Date(dt);
    if (!(dt instanceof Date) || isNaN(dt.getTime())) continue;

    var key = type + ' | ' + cls;
    if (!combos[key]) combos[key] = { count: 0, accounts: [] };
    combos[key].count++;
    if (combos[key].accounts.indexOf(acct) < 0 && combos[key].accounts.length < 5) {
      combos[key].accounts.push(acct);
    }

    if (!accounts[acct] || dt >= accounts[acct].latestDate) {
      accounts[acct] = { type: type, cls: cls, latestDate: dt, balance: bal };
    }
  }

  Logger.log('═══ BALANCE HISTORY TYPE/CLASS COMBOS ═══');
  for (var c in combos) {
    Logger.log(c + '  (' + combos[c].count + ' rows)  e.g. ' + combos[c].accounts.join(', '));
  }

  Logger.log('');
  Logger.log('═══ ACCOUNT CLASSIFICATION MAP ═══');
  var liquid = [], investment = [], liability = [], other = [];
  for (var a in accounts) {
    var info = accounts[a];
    var typeLower = info.type.toLowerCase();
    var isLiquid = (typeLower.indexOf('checking') >= 0 || typeLower.indexOf('savings') >= 0 ||
                    typeLower.indexOf('cash') >= 0);
    var isInvestment = (typeLower.indexOf('brokerage') >= 0 || typeLower.indexOf('401') >= 0 ||
                        typeLower.indexOf('ira') >= 0 || typeLower.indexOf('hsa') >= 0 ||
                        typeLower.indexOf('investment') >= 0);
    var tag = info.cls === 'Liability' ? 'LIABILITY' :
              (isLiquid ? 'LIQUID' : (isInvestment ? 'INVESTMENT' : 'OTHER'));

    var line = tag + ' | ' + a + ' | type="' + info.type + '" class="' + info.cls +
               '" | $' + Math.round(info.balance);
    Logger.log(line);

    if (tag === 'LIQUID') liquid.push(a);
    else if (tag === 'INVESTMENT') investment.push(a);
    else if (tag === 'LIABILITY') liability.push(a);
    else other.push(a);
  }

  Logger.log('');
  Logger.log('SUMMARY: ' + liquid.length + ' liquid, ' + investment.length +
    ' investment, ' + liability.length + ' liability, ' + other.length + ' other');
  Logger.log('Total accounts: ' + Object.keys(accounts).length);
}

/**
 * diagTransferPairing() — F04 Phase 1, Diagnostic 2
 * Checks transfer pair matching rates for last 3 months.
 * Answers: does Tiller produce reliable paired rows for transfers?
 * Run from editor → View → Logs.
 */
function diagTransferPairing() {
  var ss = SpreadsheetApp.openById(SSID);
  var txSheet = ss.getSheetByName(TAB_MAP['Transactions']);
  if (!txSheet) { Logger.log('ERROR: Transactions not found'); return; }
  var data = txSheet.getDataRange().getValues();

  var TRANSFER_CATS = [
    'Transfer: Internal', 'Transfer: LOC Draw', 'Balance Transfers',
    'CC Payment', 'LOC Payment', 'Loan Payment', 'Investment',
    'Payroll Deduction', 'Duplicate - Exclude', 'Debt Offset'
  ];

  var now = new Date();
  var threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  // Collect all transfer-category transactions
  var transfers = [];
  for (var i = 1; i < data.length; i++) {
    var dt = data[i][1];
    var desc = String(data[i][2] || '').trim();
    var cat = String(data[i][3] || '').trim();
    var amt = parseFloat(data[i][4]) || 0;
    var acct = String(data[i][5] || '').trim();
    if (!dt || !cat) continue;
    if (typeof dt === 'string') dt = new Date(dt);
    if (!(dt instanceof Date) || isNaN(dt.getTime())) continue;
    if (dt < threeMonthsAgo) continue;
    if (TRANSFER_CATS.indexOf(cat) < 0) continue;

    transfers.push({ date: dt, desc: desc, cat: cat, amt: amt, acct: acct, matched: false });
  }

  // Attempt pair matching: same abs(amount), opposite signs, within 3 days
  var paired = 0;
  var unpaired = 0;
  for (var a = 0; a < transfers.length; a++) {
    if (transfers[a].matched) continue;
    var found = false;
    for (var b = a + 1; b < transfers.length; b++) {
      if (transfers[b].matched) continue;
      var daysDiff = Math.abs(transfers[a].date.getTime() - transfers[b].date.getTime()) / 86400000;
      if (daysDiff > 3) continue;
      if (Math.abs(Math.abs(transfers[a].amt) - Math.abs(transfers[b].amt)) < 0.01 &&
          transfers[a].amt * transfers[b].amt < 0) {
        transfers[a].matched = true;
        transfers[b].matched = true;
        paired += 2;
        found = true;
        break;
      }
    }
    if (!found) unpaired++;
  }

  Logger.log('═══ TRANSFER PAIR MATCHING (last 3 months) ═══');
  Logger.log('Total transfer-category transactions: ' + transfers.length);
  Logger.log('Paired: ' + paired + ' (' + (transfers.length > 0 ? Math.round(paired/transfers.length*100) : 0) + '%)');
  Logger.log('Unpaired: ' + unpaired);

  // Breakdown by category
  var byCat = {};
  for (var t = 0; t < transfers.length; t++) {
    var c = transfers[t].cat;
    if (!byCat[c]) byCat[c] = { total: 0, matched: 0, unmatched: 0 };
    byCat[c].total++;
    if (transfers[t].matched) byCat[c].matched++;
    else byCat[c].unmatched++;
  }
  Logger.log('');
  Logger.log('BY CATEGORY:');
  for (var cat in byCat) {
    var pct = byCat[cat].total > 0 ? Math.round(byCat[cat].matched / byCat[cat].total * 100) : 0;
    Logger.log('  ' + cat + ': ' + byCat[cat].total + ' total, ' + byCat[cat].matched +
      ' matched (' + pct + '%), ' + byCat[cat].unmatched + ' unmatched');
  }

  // Show unmatched details (first 15)
  Logger.log('');
  Logger.log('UNMATCHED SAMPLES (up to 15):');
  var shown = 0;
  for (var u = 0; u < transfers.length && shown < 15; u++) {
    if (!transfers[u].matched) {
      Logger.log('  ' + transfers[u].date.toLocaleDateString() + ' | ' + transfers[u].cat +
        ' | $' + transfers[u].amt.toFixed(2) + ' | acct=' + transfers[u].acct +
        ' | ' + transfers[u].desc.substring(0, 40));
      shown++;
    }
  }

  // Account diversity in transfers
  var acctSet = {};
  for (var j = 0; j < transfers.length; j++) {
    if (transfers[j].acct) acctSet[transfers[j].acct] = (acctSet[transfers[j].acct] || 0) + 1;
  }
  Logger.log('');
  Logger.log('ACCOUNTS IN TRANSFER TRANSACTIONS:');
  for (var acc in acctSet) {
    Logger.log('  ' + acc + ': ' + acctSet[acc] + ' transactions');
  }
}

// END Utility.js v8
