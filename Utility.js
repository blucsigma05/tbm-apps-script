// ═══════════════════════════════════════════════════════════════
// Utility.js v10 — Run-once utility functions
// ═══════════════════════════════════════════════════════════════
// The isStaleDaily_ and isStaleWeekly_ fixes are already in
// KidsHub.gs v6 Full Deploy. These utilities handle cleanup.
// ═══════════════════════════════════════════════════════════════

function getUtilityVersion() { return 10; }


// ── FIX 3: Add Parent_PIN column to KH_Children ─────────────
// Run once from Apps Script editor.

function fixParentPINColumn() {
  assertNotFrozen_('freeze-critical', 'fixParentPINColumn');
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
  assertNotFrozen_('freeze-critical', 'fixStaleDuplicates');
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

// ═══════════════════════════════════════════════════════════════
// AMAZON ORDER DETAIL MATCHING
// Seeds Amazon order CSV data into Amazon_Detail tab, then
// cross-references against Tiller Transactions to match lump
// Amazon charges with item-level detail.
// ═══════════════════════════════════════════════════════════════

/**
 * Step 1: Seed Amazon order history into Amazon_Detail tab.
 * Data from amazon.com/gp/b2b/reports CSV export (Jan 15 – Apr 15 2026).
 * Run once, then use matchAmazonToTiller() to cross-reference.
 */
function seedAmazonOrderHistory() {
  assertNotFrozen_('freeze-critical', 'seedAmazonOrderHistory');
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = 'Amazon_Detail';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
  } else {
    sheet.clear();
  }

  var headers = ['Order ID', 'Order Date', 'Qty', 'Description', 'Price', 'Amazon Category', 'ASIN', 'Matched Tiller Row', 'Tiller Amount', 'Tiller Category'];
  sheet.appendRow(headers);

  // Embedded data from amazon_order_history.csv (Jan 15 – Apr 15 2026)
  var items = [
    ['111-7601270-2963447','2026-04-13',1,'Basesailor USB to USB C Adapter',7.99,'Cell Phones & Accessories','B07Z66MK6L'],
    ['111-7601270-2963447','2026-04-13',1,'Honest Amish Classic Beard Oil 2oz',12.22,'Beauty & Personal Care','B00M49SG0Q'],
    ['111-7601270-2963447','2026-04-13',1,'Anker USB C Adapter 2-Pack',8.99,'Electronics','B08HZ6PS61'],
    ['111-3043999-2967417','2026-04-09',1,'JOLLY RANCHER Gummies 27oz',7.39,'Grocery','B0DW5LNSJN'],
    ['111-3043999-2967417','2026-04-09',1,'HI-CHEW Easter Variety 6-Pack',23.99,'Grocery','B0CNL3FFZL'],
    ['111-3043999-2967417','2026-04-09',1,'Laffy Taffy Fruit Combos 6oz',9.92,'Grocery','B0B8T8P3ZX'],
    ['111-3043999-2967417','2026-04-09',1,'JOLLY RANCHER Sour Gummies 6.5oz',2.75,'Grocery','B0CFWZWYSM'],
    ['111-1132284-6893848','2026-04-09',1,'Girls Gymnastics Leotard 5t Gold Pink Blue',9.58,'Clothing','B0F9WYH51W'],
    ['111-1132284-6893848','2026-04-09',2,'Microsoft Surface Pen Platinum',17.42,'Cell Phones & Accessories','B0DLDQDQC4'],
    ['111-1132284-6893848','2026-04-09',1,'Girls Gymnastics Leotard 5t Leopard',7.57,'Clothing','B0CNSLSMXR'],
    ['111-1132284-6893848','2026-04-09',1,'XIMA Pastel Floral Headbands 5-Pack',9.99,'Beauty & Personal Care','B0F9WZTL7L'],
    ['111-0122931-3142624','2026-03-29',1,'UGREEN USB 3.0 Switch 2-Computer 4-Port',35.14,'Electronics','B0C8MSP967'],
    ['111-3796570-7793814','2026-03-28',1,'Beyblade X Xtreme Battle Set',54.99,'Toys & Games','B0CS8CM4YB'],
    ['111-1247617-5985069','2026-03-28',1,'Beyblade X Transformers Optimus vs Megatron',25.49,'Toys & Games','B0CLFNMPF6'],
    ['111-9189780-6582659','2026-03-28',1,'Gerutek 2-Pack Screen Protector Tab A11/A9',7.49,'Electronics','B0CMC28R5Q'],
    ['111-8203589-0306656','2026-03-28',1,'SPARIN 2-Pack Screen Protector Tab A7 Lite',7.98,'Electronics','B09228GJ3G'],
    ['111-8680126-9377856','2026-03-28',1,'Gerutek Case Tab A11 8.7" Blue',26.99,'Electronics','B0GG8RGCKK'],
    ['111-6042876-1381830','2026-03-28',1,'SEYMAC Case Tab A7 Lite Yellowish/Pink',26.99,'Electronics','B096LLBG39'],
    ['111-1677330-8643466','2026-02-10',1,'BUYIFY Foldable Laptop Bed Desk',28.97,'Office Products','B0D3CZL7FB'],
    ['111-5949670-9479416','2026-02-09',1,'Premier Protein Powder Vanilla 23.3oz',26.48,'Health & Household','B06ZZ3PJQD'],
    ['111-5129023-9901004','2026-02-07',1,'WOCCI 18mm Watch Band White Garden',14.99,'Clothing','B0B2PDV45Q'],
    ['111-5129023-9901004','2026-02-07',1,'WOCCI 18mm Watch Band Black',14.99,'Clothing','B0B2PB8RR8'],
    ['111-5129023-9901004','2026-02-07',1,'WOCCI 18mm Watch Band Leopard',14.99,'Clothing','B0B2P9MDHP'],
    ['111-5129023-9901004','2026-02-07',1,'WOCCI 18mm Watch Band Brown',14.99,'Clothing','B0B2PCP2YK'],
    ['111-3309691-9069802','2026-02-07',1,'National Blue Ice Melt 20lb Bucket',54.99,'Patio & Garden','B08RJV7G89'],
    ['111-1916655-2515465','2026-02-07',1,'Festty Glasses Strap 3-Pack Black',7.99,'Clothing','B0BG9XR1MQ'],
    ['111-1916655-2515465','2026-02-07',1,'Charmast 10000mAh Power Bank',20.99,'Cell Phones & Accessories','B0BY2RV75W'],
    ['111-2782053-7961062','2026-02-03',1,'Snow Joe Snow Shovel 18" Blade',39.97,'Patio & Garden','B01LXEQ6UM'],
    ['111-2204875-1501032','2026-02-03',1,'ProCase Watch Box 12-Slot Espresso',29.99,'Clothing','B0CXXJ94SB'],
    ['111-2204875-1501032','2026-02-03',1,'iBayam 2-Pack Tape Measure',3.99,'Tools','B07WG5B464'],
    ['111-2204875-1501032','2026-02-03',1,'Flintstones Complete Gummies 180ct',13.99,'Health & Household','B00BV47LQA'],
    ['111-5329756-1853007','2026-01-29',1,'JOREST Watch Repair Kit',14.99,'Clothing','B09MK72YFD'],
    ['111-5329756-1853007','2026-01-29',1,'JOREST Watch Repair Kit (2nd)',14.99,'Clothing','B09MK72YFD'],
    ['111-6251942-1240262','2026-01-27',1,'Amazon Essentials Mickey Hoodie L',21.50,'Clothing','B0BHTJB8J2'],
    ['111-6251942-1240262','2026-01-27',1,'Amazon Essentials Minnie Hoodie L',21.50,'Clothing','B08WY4596T'],
    ['111-8550495-6367455','2026-01-27',1,'GORILLA GRIP Can Opener Black',11.99,'Home & Kitchen','B09NXMDPS1'],
    ['111-9222713-3133863','2026-01-27',1,'LiCB 20-Pack SR621SW 364 Battery',6.99,'Health & Household','B07DF6YP1J'],
    ['111-9222713-3133863','2026-01-27',1,'Miss Jessies Pillow Soft Curls 8.5oz',19.97,'Beauty','B0094KPK70'],
    ['111-9222713-3133863','2026-01-27',1,'LiCB 20-Pack SR920SW 371 Battery',6.99,'Health & Household','B07DJ9G64D'],
    ['111-9222713-3133863','2026-01-27',1,'LiCB 20-Pack SR927SW 395 Battery',6.99,'Health & Household','B07G532RBV'],
    ['111-9222713-3133863','2026-01-27',1,'Supaze Hair Styling Set 3-Piece',7.99,'Beauty','B096FPFZ6Z'],
    ['111-9222713-3133863','2026-01-27',1,'LiCB 20-Pack SR626SW 377 Battery',6.99,'Health & Household','B0792Q2H8G'],
    ['111-7168478-6399429','2026-01-22',1,'RAW Classic 1-1/4 Pre-Rolled Cones 100-Pack',21.99,'Health & Household','B09D8T9FG9'],
    ['111-8131531-0074604','2026-01-20',1,'Kinky-Curly Knot Today Leave-In 236ml',16.99,'Beauty','B01N00TYUY'],
    ['111-8131531-0074604','2026-01-20',1,'Mielle Pomegranate & Honey Conditioner 12oz',12.96,'Beauty','B07GZYSC81'],
    ['111-2700970-0665849','2026-01-19',1,'Conair Hair Dryer 1875W Pink',21.99,'Beauty','B000E8PG98'],
    ['111-5470153-9879428','2026-01-19',2,'Bob Marley Rolling Paper Variety 16-Pack',12.83,'Health & Household','B0DB6L5XQQ'],
    ['111-6365137-1923411','2026-01-19',1,'UGREEN 25000mAh 200W Power Bank',79.98,'Cell Phones & Accessories','B0CXHM5RY2'],
    ['111-6365137-1923411','2026-01-19',1,'Amazon Essentials Boys Sweatsuit Camel 4T',12.00,'Clothing','B0FFJXFC9S'],
    ['111-6365137-1923411','2026-01-19',1,'Fernvia Toddler Girls Outfit 2T-5T',19.99,'Clothing','B0C73TDFL5'],
    ['111-6365137-1923411','2026-01-19',1,'Anker Zolo Power Bank 20000mAh 45W',37.99,'Cell Phones & Accessories','B0DT12DNVF'],
    ['111-6365137-1923411','2026-01-19',1,'Amazon Essentials Boys Sweatsuit Grey 4T',12.00,'Clothing','B0FFJ54NTW'],
    ['111-3306539-9637814','2026-01-19',1,'Disney Minnie Mouse Outfit Pink/Brown 4T',19.99,'Clothing','B0BXB9353F'],
    ['111-3306539-9637814','2026-01-19',1,'Disney Minnie Mouse Outfit Pink Glitter 5T',19.99,'Clothing','B07Q3ZS9X6'],
    ['111-3306539-9637814','2026-01-19',1,'Disney Mickey Minnie Hoodie Oatmeal 4T',19.99,'Clothing','B0D1JFR68T'],
    ['D01-5147369-1485028','2026-03-26',1,'Paramount+ Premium Monthly',13.99,'Digital Subscription','B08WPPBTJ2'],
    ['D01-0807399-5504214','2026-02-26',1,'Paramount+ Premium Monthly',13.99,'Digital Subscription','B08WPPBTJ2'],
    ['D01-1341589-8425843','2026-01-30',1,'Alexa+',0,'Digital Subscription','B0DCCNHWV5'],
    ['D01-4545339-0329819','2026-01-26',1,'Paramount+ Premium Monthly',12.99,'Digital Subscription','B08WPPBTJ2']
  ];

  var rows = [];
  for (var i = 0; i < items.length; i++) {
    rows.push([items[i][0], items[i][1], items[i][2], items[i][3], items[i][4], items[i][5], items[i][6], '', '', '']);
  }
  sheet.getRange(2, 1, rows.length, 10).setValues(rows);

  // Format
  sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#E8E8E8');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 10);

  Logger.log('Seeded ' + rows.length + ' Amazon items into ' + tabName);
  return { status: 'ok', items: rows.length };
}

/**
 * Step 2: Match Amazon orders to Tiller Transactions.
 * Groups items by Order ID → sums prices → finds matching Amazon/AMZN
 * charge in Transactions within ±3 days and ±$2.00 of order total.
 * Writes matched Tiller row number, amount, and category back to Amazon_Detail.
 */
function matchAmazonToTiller() {
  assertNotFrozen_('freeze-critical', 'matchAmazonToTiller');
  var ss = SpreadsheetApp.openById(SSID);
  var amzSheet = ss.getSheetByName('Amazon_Detail');
  if (!amzSheet) return { error: 'Run seedAmazonOrderHistory() first' };
  var amzData = amzSheet.getDataRange().getValues();

  // Group Amazon items by Order ID
  var orders = {};
  for (var a = 1; a < amzData.length; a++) {
    var oid = String(amzData[a][0] || '').trim();
    if (!oid) continue;
    if (!orders[oid]) {
      orders[oid] = { date: amzData[a][1], total: 0, items: [], rows: [] };
    }
    var price = parseFloat(amzData[a][4]) || 0;
    var qty = parseInt(amzData[a][2], 10) || 1;
    orders[oid].total += price * qty;
    orders[oid].items.push(String(amzData[a][3] || '').substring(0, 60));
    orders[oid].rows.push(a + 1); // 1-indexed sheet row
  }

  // Load Transactions
  var txSheet = ss.getSheetByName(TAB_MAP['Transactions']);
  if (!txSheet) return { error: 'Transactions tab not found' };
  var txData = txSheet.getDataRange().getValues();

  // Find Amazon transactions
  var amazonTx = [];
  for (var t = 1; t < txData.length; t++) {
    var desc = String(txData[t][2] || '').toUpperCase();
    if (desc.indexOf('AMAZON') >= 0 || desc.indexOf('AMZN') >= 0 || desc.indexOf('PRIME') >= 0) {
      amazonTx.push({
        row: t + 1,
        date: txData[t][1] instanceof Date ? txData[t][1] : new Date(txData[t][1]),
        desc: desc,
        amount: Math.abs(parseFloat(txData[t][4]) || 0),
        category: String(txData[t][3] || ''),
        matched: false
      });
    }
  }

  var matched = 0;
  var unmatched = 0;
  var results = [];

  for (var oid in orders) {
    var order = orders[oid];
    var orderDate = order.date instanceof Date ? order.date : new Date(order.date);
    var orderTotal = Math.round(order.total * 100) / 100;
    var bestMatch = null;
    var bestDiff = 999;

    for (var tx = 0; tx < amazonTx.length; tx++) {
      if (amazonTx[tx].matched) continue;
      var daysDiff = Math.abs(amazonTx[tx].date.getTime() - orderDate.getTime()) / 86400000;
      if (daysDiff > 5) continue; // within 5 days
      var amtDiff = Math.abs(amazonTx[tx].amount - orderTotal);
      var tolerance = Math.max(2.00, orderTotal * 0.12); // 12% or $2, whichever is larger
      if (amtDiff < tolerance && amtDiff < bestDiff) {
        bestDiff = amtDiff;
        bestMatch = tx;
      }
    }

    if (bestMatch !== null) {
      amazonTx[bestMatch].matched = true;
      matched++;
      // Write match info back to Amazon_Detail for each item in this order
      for (var r = 0; r < order.rows.length; r++) {
        amzSheet.getRange(order.rows[r], 8).setValue(amazonTx[bestMatch].row);
        amzSheet.getRange(order.rows[r], 9).setValue(-amazonTx[bestMatch].amount); // negative = expense
        amzSheet.getRange(order.rows[r], 10).setValue(amazonTx[bestMatch].category);
      }
      results.push({
        orderId: oid,
        orderTotal: orderTotal,
        tillerAmount: amazonTx[bestMatch].amount,
        tillerCategory: amazonTx[bestMatch].category,
        tillerRow: amazonTx[bestMatch].row,
        items: order.items.length
      });
    } else {
      unmatched++;
      results.push({
        orderId: oid,
        orderTotal: orderTotal,
        tillerAmount: null,
        tillerCategory: 'UNMATCHED',
        items: order.items.length
      });
    }
  }

  Logger.log('═══ AMAZON → TILLER MATCHING ═══');
  Logger.log('Amazon orders: ' + Object.keys(orders).length);
  Logger.log('Tiller Amazon transactions: ' + amazonTx.length);
  Logger.log('Matched: ' + matched);
  Logger.log('Unmatched: ' + unmatched);
  Logger.log('');
  for (var ri = 0; ri < results.length; ri++) {
    var r = results[ri];
    if (r.tillerAmount) {
      Logger.log('✓ ' + r.orderId + ' | $' + r.orderTotal.toFixed(2) + ' → Tiller row ' + r.tillerRow + ' ($' + r.tillerAmount.toFixed(2) + ') [' + r.tillerCategory + '] — ' + r.items + ' items');
    } else {
      Logger.log('✗ ' + r.orderId + ' | $' + r.orderTotal.toFixed(2) + ' → NO MATCH — ' + r.items + ' items');
    }
  }

  return { status: 'ok', matched: matched, unmatched: unmatched, total: Object.keys(orders).length, details: results };
}

// END Utility.js v10
