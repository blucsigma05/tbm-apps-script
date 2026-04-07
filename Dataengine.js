// ════════════════════════════════════════════════════════════════════
// DATA ENGINE v86 — Dynamic KPI Computation from Raw Tiller Data
// WRITES TO: 💻🧮 Dashboard_Export, 💻🧮 Debt_Export, 💻🧮 DebtModel, 💻🧮 Cascade Proof, 💻🧮 Cascade Month-by-Month, 💻🧮 Cascade Payoff Schedule, 📋 Board_Config
// READS FROM: 🔒 Transactions, 🔒 Balance History, 🔒 Categories, 💻🧮 Budget_Data, 💻🧮 Helpers, 💻🧮 DebtModel, 💻🧮 BankRec, 💻🧮 Budget_Rules, 💻 MealPlan
// ════════════════════════════════════════════════════════════════════

function getDataEngineVersion() { return 86; }

// ════════════════════════════════════════════════════════════════════
//
// WHAT THIS DOES:
//   Reads Transactions, Budget_Data, Categories, Balance History, and
//   Debt_Export directly — computes all Dashboard_Export KPIs on the fly
//   for ANY date range. No snapshots.
//
// USAGE:
//   1. Paste this file into your Apps Script project (new file: DataEngine.gs)
//   2. Add the doGet route (see ROUTING section at bottom)
//   3. Deploy new version
//   4. Dashboards call: ?action=data&month=2026-01
//      or: ?action=data&month=current
//      or: ?action=data&start=2026-01-01&end=2026-02-14
//      or: ?action=data&start=2026-01-01&end=2026-02-14&debt=true
//
// RETURNS: JSON matching Dashboard_Export KV structure + debt array
// ════════════════════════════════════════════════════════════════════

/**
 * Test runner — call this from the Apps Script editor Run button.
 */
function testGetData() {
  var result = getData('2026-01-01', '2026-01-31', true);
  Logger.log('=== KEY METRICS (Jan 2026) ===');
  Logger.log('earnedIncome: $' + result.earnedIncome);
  Logger.log('operatingExpenses: $' + result.operatingExpenses);
  Logger.log('netCashFlow: $' + result.netCashFlow);
  Logger.log('totalAssets: $' + result.totalAssets);
  Logger.log('totalLiabilities: $' + result.totalLiabilities);
  Logger.log('netWorth: $' + result.netWorth);
  Logger.log('debtCurrent (all non-mortgage): $' + result.debtCurrent);
  Logger.log('debtCurrentActive: $' + result.debtCurrentActive);
  Logger.log('debtCurrentExcluded: $' + result.debtCurrentExcluded);
  Logger.log('dayOfMonth: ' + result.dayOfMonth);
  Logger.log('daysInMonth: ' + result.daysInMonth);
  Logger.log('monthElapsedPct: ' + result.monthElapsedPct);
  Logger.log('mortgageBalance: $' + result.mortgageBalance);
  Logger.log('dscr: ' + result.dscr);
  Logger.log('Active debts: ' + (result.debts ? result.debts.length : 'N/A'));
  Logger.log('Excluded debts: ' + (result.excludedDebts ? result.excludedDebts.length : 'N/A'));
  Logger.log('Full keys: ' + Object.keys(result).length);
}

/**
 * Diagnostic — verify grouped debt totals for TheSpine/TheSoul v12.
 */
function de_testGetDebtByType_() {
  var parsed = parseDebtExport();
  var grouped = de_getDebtByType_(parsed.active, parsed.excluded, de_getCurrentMortgageBalance_());
  Logger.log('=== DEBT BY TYPE ===');
  grouped.forEach(function(row) {
    Logger.log(row.type + ': $' + row.total + ' | ' + row.count + ' accounts | ' + row.accounts.join(', '));
  });
}

/**
 * Diagnostic — run this to see exactly what Balance History + Debt_Export contain.
 */
function diagBalanceSheet() {
  var ss = getDESS_();

  var bh = ss.getSheetByName(TAB_MAP['Balance History']);
  var headers = bh.getRange(1, 1, 1, 15).getValues()[0];
  Logger.log('=== BALANCE HISTORY HEADERS ===');
  for (var i = 0; i < headers.length; i++) {
    Logger.log('Col ' + String.fromCharCode(65+i) + ' (idx ' + i + '): "' + headers[i] + '"');
  }

  var bhData = bh.getDataRange().getValues();
  Logger.log('BH total rows: ' + bhData.length);
  var sampleStart = Math.max(1, bhData.length - 10);
  Logger.log('=== LAST 10 BH ROWS ===');
  for (var r = sampleStart; r < bhData.length; r++) {
    Logger.log('Row ' + (r+1) + ': Date=' + bhData[r][1] + ' | Acct=' + bhData[r][3] + ' | Bal(I)=' + bhData[r][8] + ' | Type(L)=' + bhData[r][11] + ' | Class(M)=' + bhData[r][12]);
  }

  var classCounts = {};
  for (var h = 1; h < bhData.length; h++) {
    var cls = bhData[h][12] || '(empty)';
    classCounts[cls] = (classCounts[cls] || 0) + 1;
  }
  Logger.log('=== CLASS DISTRIBUTION ===');
  for (var c in classCounts) {
    Logger.log('"' + c + '": ' + classCounts[c] + ' rows');
  }

  var latest = {};
  var endDate = new Date('2026-01-31T23:59:59');
  for (var h = 1; h < bhData.length; h++) {
    var dt = bhData[h][1];
    var acct = bhData[h][3];
    var bal = bhData[h][8];
    var cls = bhData[h][12];
    if (!dt || !acct) continue;
    if (typeof dt === 'string') dt = new Date(dt);
    if (!(dt instanceof Date) || isNaN(dt.getTime())) continue;
    if (dt > endDate) continue;
    if (!latest[acct] || dt >= latest[acct].date) {
      latest[acct] = { balance: parseFloat(bal) || 0, date: dt, cls: cls };
    }
  }

  Logger.log('=== LATEST BALANCE PER ACCOUNT (as of Jan 31) ===');
  var aTotal = 0, lTotal = 0;
  for (var a in latest) {
    var e = latest[a];
    var tag = e.cls === 'Asset' ? 'ASSET' : (e.cls === 'Liability' ? 'LIAB' : 'OTHER');
    Logger.log(tag + ' | ' + a + ' | $' + e.balance + ' | class="' + e.cls + '" | date=' + e.date);
    if (e.cls === 'Asset') aTotal += e.balance;
    if (e.cls === 'Liability') lTotal += Math.abs(e.balance);
  }
  Logger.log('Asset total: $' + aTotal);
  Logger.log('Liability total: $' + lTotal);
  Logger.log('Net worth: $' + (aTotal - lTotal));

  Logger.log('=== DEBT_EXPORT ===');
  var dx = ss.getSheetByName(TAB_MAP['Debt_Export']);
  if (dx) {
    var dxData = dx.getDataRange().getValues();
    Logger.log('Debt_Export rows: ' + dxData.length);
    for (var d = 0; d < Math.min(dxData.length, 45); d++) {
      Logger.log('Row ' + (d+1) + ': [' + dxData[d].slice(0,4).join(' | ') + ']');
    }
  } else {
    Logger.log('Debt_Export sheet NOT FOUND');
  }
}

// v46 FIX #1: Shared CC_MAP — single source of truth for CC payment
// description matching across getData() and getSimulatorData().
// Canonical label is 'CACU' (not 'Community America'). BUDGET_MAP uses 'CACU'.
var SHARED_CC_MAP = [
  [/transfer from/, null],
  [/cardmember serv/, 'Chase'], [/chase/, 'Chase'],
  [/discover/, 'Discover'], [/comenity/, 'Comenity'], [/citi/, 'Citi'],
  [/bk of amer/, 'BofA'], [/bank of america/, 'BofA'],
  [/barclaycard/, 'Barclaycard'], [/community ameri/, 'CACU'],
  [/target card/, 'Target'], [/jcpenny/, 'JCPenney'], [/sears/, 'Sears'],
  [/nefurnmart/, 'NFM'], [/umbkc/, 'UMB']
];
// v46: LOAN_PAYMENT_MAP — routes 'Loan Payment' category transactions
// to BUDGET_MAP-aligned labels via ACH description matching.
// NFM autopay shows as 'Loan Payment' in Tiller but debt name is 'Comenity *3834'.
var LOAN_PAYMENT_MAP = [
  [/comenity/i, 'Comenity'], [/nefurnmart/i, 'Comenity'], [/nfm/i, 'Comenity'],
  [/barclaycard/i, 'Barclaycard']
];
// v78: BUDGET_MAP — single source of truth for debt-to-label mapping.
// Used by both getData() and getSimulatorData() for debtPaymentBudget.
// Previously duplicated inside both functions — hoisted to prevent drift.
var BUDGET_MAP = {
  'Chase':         [/prime visa/i, /southwest/i, /sapphire/i, /chase/i],
  'Discover':      [/discover/i],
  'Citi':          [/citi/i],
  'BofA':          [/boa/i, /bof.?a/i, /bank of america/i, /bk of amer/i],
  'LT-LOC':        [/lt.?loc/i, /x8840/i],
  'JT-LOC':        [/jt.?loc/i, /x4540/i],
  'Comenity':      [/comenity/i, /nfm/i, /nefurnmart/i],
  'Barclaycard':   [/barclaycard/i, /barclays/i],
  'CACU':          [/cacu/i, /community america/i],
  'UMB':           [/umb/i],
  'SoFi Loan':     [/sofi/i, /personal loan/i],
  'Auto Loan':     [/auto/i, /telluride/i],
  'Student Loans': [/nelnet/i, /sloan/i, /student/i, /servic/i],
  'Solar Panel':   [/solar/i]
};
// v54: TAB_MAP — emoji-prefixed tab name resolution.
// After workbook consolidation, all TBM tabs renamed with category prefixes.
// Every getSheetByName() call MUST use TAB_MAP[logicalName].
// Ring Quest tabs (Chores, Rewards via openById) are NOT affected.
var TAB_MAP = {
  // 🔒 Tiller Core
  'Categories':       'Categories',
  'Transactions':     'Transactions',
  'Balance History':  'Balance History',
  'NetWorth':         '🔒 NetWorth',
  // 💻🧮 Active Finance
  'Budget_Data':      '💻🧮 Budget_Data',
  'Debt_Export':      '💻🧮 Debt_Export',
  'Close History':    '💻🧮 Close History',
  'DebtModel':        '💻🧮 DebtModel',
  'Metrics':          '💻🧮 Metrics',
  'QA_Gates':         '💻🧮 QA_Gates',
  'Cascade Proof':    '💻🧮 Cascade Proof',
  'Cascade Month-by-Month': '💻🧮 Cascade Month-by-Month',
  'Cascade Payoff Schedule': '💻🧮 Cascade Payoff Schedule',
  'Dashboard_Export': '💻🧮 Dashboard_Export',
  'Sheet Map':        '💻🧮 Sheet Map',
  'Helpers':          '💻🧮 Helpers',
  'Budget_Rules':     '💻🧮 Budget_Rules',
  'BankRec':          '💻🧮 BankRec',
  'WCM':              '💻🧮 WeeklyCashMap',
  'Partner_Export':   '💻🧮 Partner_Export',
  // ⌚📦 Watch Vault
  'LT_Collection':    '⌚📦 LT Collection',
  'JT_Collection':    '⌚📦 JT Collection',
  'Kids_Collection':  '⌚📦 Kids Collection',
  'Wishlist':         '⌚📦 Wish List',
  'Style Reference':  '⌚📦 Style Reference',
  // 🧹📅 Kids Hub — KH_ tabs (v56)
  'KH_Chores':        '🧹📅 KH_Chores',
  'KH_History':       '🧹📅 KH_History',
  'KH_Rewards':       '🧹📅 KH_Rewards',
  'KH_Redemptions':   '🧹📅 KH_Redemptions',
  'KH_Streaks':       '🧹📅 KH_Streaks',
  'KH_Deductions':    '🧹📅 KH_Deductions',
  'KH_Allowance':     '🧹📅 KH_Allowance',
  'KH_Children':      '🧹📅 KH_Children',
  'KH_Requests':      '🧹📅 KH_Requests',
  'KH_ScreenTime':    '🧹📅 KH_ScreenTime',
  'KH_Grades':        '🧹📅 KH_Grades',
  'KH_PowerScan':     '🧹📅 KH_PowerScan',
  'KH_MissionState':  '🧹📅 KH_MissionState',
  'KH_Education':     '🧹📅 KH_Education',
  // 💻 Education + System
  'Curriculum':       '💻 Curriculum',
  'QuestionLog':      '💻 QuestionLog',
  'Feedback':         '💻 Feedback',
  'MealPlan':         '💻 MealPlan',
  // 📋 Board Config
  'Board_Config':     '📋 Board_Config'
};

// v73: Request-scoped sheet data cache — same pattern as KidsHub v25.
// When _deCache is non-null, de_readSheet_() caches getDataRange().getValues() results.
// Activated at getData()/getSimulatorData()/getWeeklyTrackerData() entry, cleared in finally.
// Write functions and standalone callers see _deCache=null → always read fresh.
var _deCache = null;
var _deSS = null; // cached SpreadsheetApp.openById(SSID)

// v83: SSID now provided by TBMConfig.gs (environment-aware via TBM_ENV)
// var SSID is declared globally in TBMConfig.gs — available here via shared scope

function getDESS_() {
  if (!_deSS) _deSS = SpreadsheetApp.openById(SSID);
  return _deSS;
}

function de_readSheet_(tabKey) {
  if (_deCache && _deCache.hasOwnProperty(tabKey)) return _deCache[tabKey];
  var ss = getDESS_();
  var name = TAB_MAP[tabKey] || tabKey;
  var sheet = ss.getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 1) {
    if (_deCache) _deCache[tabKey] = null;
    return null;
  }
  var data = sheet.getDataRange().getValues();
  if (_deCache) _deCache[tabKey] = data;
  return data;
}

function getData(startStr, endStr, includeDebt) {
  if (!startStr || !endStr) {
    throw new Error('getData requires startStr and endStr. Use testGetData() to run from the editor.');
  }
  // v73: Activate request-scoped cache
  var _cacheOwner = !_deCache;
  if (_cacheOwner) _deCache = {};
  try {
  var ss = getDESS_();
  var startDate = new Date(startStr + 'T00:00:00');
  var endDate = new Date(endStr + 'T23:59:59');
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new Error('Invalid dates: start=' + startStr + ', end=' + endStr);
  }

  var _warnings = [];  // v24: collect warnings for _meta
  // ── 1. Load Categories → build PartnerBucket + key mappings ──
  var catData = de_readSheet_('Categories');
  if (!catData || catData.length < 2) throw new Error('Categories sheet empty or missing');
  var catMap = {};      // category → { type, bucket, group }
  var bucketMap = {};   // bucket label → normalized key

  for (var i = 1; i < catData.length; i++) {
    var catName = catData[i][0];
    var catType = catData[i][2];    // Income, Expense, Transfer, etc.
    var bucket = catData[i][4];     // Partner Bucket
    if (!catName) continue;
    catMap[catName] = { type: catType, bucket: bucket, group: catData[i][1] };
  }

  var BUCKET_KEYS = {
    '1-Income': 'income',
    '2-Fixed Expenses': 'fixed_expenses',
    '3-Necessary Living': 'necessary_living',
    '4-Discretionary': 'discretionary',
    'Debt Cost': 'debt_cost',
    '5-Financial': 'financial',
    'Debt Payments': 'debt_payments',
    '6-Transfer': 'transfer',
    '7-Investment': 'investment'
  };

  function catKey(name) {
    return name.toLowerCase().replace(/\s+/g, '').replace(/:/g, '').replace(/\//g, '');
  }

  var TRANSFER_CATS = [
    'Transfer: Internal', 'Transfer: LOC Draw', 'Balance Transfers',
    'CC Payment', 'LOC Payment', 'Loan Payment', 'Investment', 'Payroll Deduction',
    'Duplicate - Exclude', 'Debt Offset',
    // v34: Debt payment categories — tracked in debt minimums, NOT operating expenses
    'SoFi Loan', 'Auto Loan', 'Student Loans', 'Solar Panel'
  ];

  var EARNED_INCOME_CATS = ['JT Income', 'LT Income', 'Bonus Income', 'Other Income', 'Interest Income'];

  // ── 2. Load Transactions, filter by date range ──
  var txData = de_readSheet_('Transactions');
  if (!txData || txData.length < 2) throw new Error('Transactions sheet empty or missing');

  var catActuals = {};   // category → sum of absolute amounts
  var earnedIncome = 0;
  var loanProceeds = 0;
  var balanceTransfers = 0;
  var totalMoneyIn = 0;
  var operatingExpenses = 0;
  var rawBankActivity = 0;
  var ccPayments = 0;
  var loanPayments = 0;

  for (var t = 1; t < txData.length; t++) {
    var txDate = txData[t][1];   // Col B
    var txCat = txData[t][3];    // Col D
    var txAmt = txData[t][4];    // Col E

    if (!txDate || !txCat) continue;
    if (typeof txDate === 'string') txDate = new Date(txDate);
    if (!(txDate instanceof Date) || isNaN(txDate.getTime())) continue;
    if (txDate < startDate || txDate > endDate) continue;

    var amt = parseFloat(txAmt) || 0;
    rawBankActivity += amt;

    if (!catActuals[txCat]) catActuals[txCat] = 0;
    catActuals[txCat] += amt;

    if (EARNED_INCOME_CATS.indexOf(txCat) >= 0 && amt > 0) {
      earnedIncome += amt;
    }
    if (txCat === 'Loan Proceeds' && amt > 0) {
      loanProceeds += amt;
    }
    if (txCat === 'Balance Transfers' && amt > 0) {
      balanceTransfers += amt;
    }
    if (amt < 0 && TRANSFER_CATS.indexOf(txCat) < 0) {
      operatingExpenses += Math.abs(amt);
    }
    if (txCat === 'CC Payment') ccPayments += amt;
    if (txCat === 'Loan Payment') loanPayments += amt;
  }

  totalMoneyIn = earnedIncome + loanProceeds + balanceTransfers;

  // ── 3. Build expense buckets from actuals ──
  var bucketActuals = {};
  var catDetails = {};
  var catExportKeys = {}; // v55: catKey→underscore export key

  // v34: Debt payment categories — these appear in debt minimums, NOT in spending buckets
  var DEBT_PAYMENT_CATS = ['SoFi Loan', 'Auto Loan', 'Student Loans', 'Solar Panel'];

  for (var cat in catActuals) {
    var info = catMap[cat];
    if (!info) continue;
    var bKey = BUCKET_KEYS[info.bucket];
    if (!bKey) continue;
    if (info.type === 'Expense') {
      // v34: Skip debt payment categories from bucket aggregation
      if (DEBT_PAYMENT_CATS.indexOf(cat) >= 0) continue;
      var absAmt = Math.abs(catActuals[cat]);
      if (!bucketActuals[bKey]) bucketActuals[bKey] = 0;
      bucketActuals[bKey] += absAmt;
      catDetails[bKey + '.' + catKey(cat)] = absAmt;
        catExportKeys[bKey + '.' + catKey(cat)] = bKey + '.' + cat.toLowerCase().replace(/ +/g,'_');
    }
  }

  // v45: Unmapped category diagnostic — surfaces categories with spend but no bucket mapping
  var _unmappedCategories = [];
  for (var _uCat in catActuals) {
    var _uInfo = catMap[_uCat];
    if (!_uInfo || !BUCKET_KEYS[(_uInfo||{}).bucket]) {
      if (TRANSFER_CATS.indexOf(_uCat) < 0 && EARNED_INCOME_CATS.indexOf(_uCat) < 0 && _uCat !== 'Loan Proceeds') {
        _unmappedCategories.push({ category: _uCat, amount: roundTo(Math.abs(catActuals[_uCat]), 2) });
      }
    }
  }
  _unmappedCategories.sort(function(a, b) { return b.amount - a.amount; });
  if (_unmappedCategories.length > 0) {
    _warnings.push('Unmapped categories: ' + _unmappedCategories.map(function(u) { return u.category + ' ($' + u.amount + ')'; }).join(', '));
  }
  // v24: Category coverage validation
  var _expectedBuckets = ['fixed_expenses', 'necessary_living', 'discretionary', 'debt_cost'];
  for (var _eb = 0; _eb < _expectedBuckets.length; _eb++) {
    if (!bucketActuals[_expectedBuckets[_eb]]) {
      _warnings.push('No transactions for bucket: ' + _expectedBuckets[_eb]);
    }
  }
  // ── 4. Load Budget_Data for the date range ──
  var budData = de_readSheet_('Budget_Data');
  if (!budData || budData.length < 2) { _warnings.push('Budget_Data empty'); budData = [[]]; }
  var monthFractions = getMonthFractions(startDate, endDate);
  var catBudgets = {};
  var bucketBudgets = {};

  for (var b = 1; b < budData.length; b++) {
    var budYM = budData[b][1];
    var budCat = String(budData[b][2] || '').trim();
    var budAmt = parseFloat(budData[b][4]) || 0;
    if (!budYM || !budCat) continue;
    var frac = monthFractions[budYM];
    if (frac === undefined || frac === 0) continue;
    var prorated = budAmt * frac;
    if (!catBudgets[budCat]) catBudgets[budCat] = 0;
    catBudgets[budCat] += prorated;
    var catInfo = catMap[budCat];
    if (catInfo) {
      var bk = BUCKET_KEYS[catInfo.bucket];
      // v34: Skip debt payment categories from bucket aggregation (they're in debt minimums)
      if (bk && DEBT_PAYMENT_CATS.indexOf(budCat) < 0) {
        if (!bucketBudgets[bk]) bucketBudgets[bk] = 0;
        bucketBudgets[bk] += Math.abs(prorated);
        catDetails[bk + '.' + catKey(budCat) + '.budget'] = (catDetails[bk + '.' + catKey(budCat) + '.budget'] || 0) + Math.abs(prorated);
          if (!catExportKeys[bk + '.' + catKey(budCat)]) catExportKeys[bk + '.' + catKey(budCat)] = bk + '.' + budCat.toLowerCase().replace(/ +/g,'_');
      }
    }
  }

  var incomeBudget = (catBudgets['JT Income'] || 0) + (catBudgets['LT Income'] || 0) +
    (catBudgets['Bonus Income'] || 0) + (catBudgets['Other Income'] || 0) +
    (catBudgets['Interest Income'] || 0);

  // ── 5. Balance History — latest balance per account ──
  var bhData = de_readSheet_('Balance History');
  if (!bhData || bhData.length < 2) throw new Error('Balance History sheet empty or missing');
  var latestInRange = {};
  var latestOverall = {};

  for (var h = 1; h < bhData.length; h++) {
    var bhDate = bhData[h][1];  // Col B
    var bhAcct = bhData[h][3];  // Col D
    var bhBal = bhData[h][8];   // Col I (Balance)
    var bhType = bhData[h][11]; // Col L (Type)
    var bhClass = bhData[h][12]; // Col M (Class)
    if (!bhDate || !bhAcct) continue;
    if (typeof bhDate === 'string') bhDate = new Date(bhDate);
    if (!(bhDate instanceof Date) || isNaN(bhDate.getTime())) continue;
    var entry = { balance: parseFloat(bhBal) || 0, date: bhDate, cls: bhClass, type: bhType };
    if (!latestOverall[bhAcct] || bhDate >= latestOverall[bhAcct].date) {
      latestOverall[bhAcct] = entry;
    }
    if (bhDate <= endDate) {
      if (!latestInRange[bhAcct] || bhDate >= latestInRange[bhAcct].date) {
        latestInRange[bhAcct] = entry;
      }
    }
  }

  var latestBal = {};
  for (var acct in latestOverall) {
    latestBal[acct] = latestInRange[acct] || latestOverall[acct];
  }

  var totalAssets = 0, totalLiabilities = 0;
  var assetCount = 0, liabCount = 0;
  for (var acct in latestBal) {
    var entry = latestBal[acct];
    if (entry.cls === 'Asset') {
      totalAssets += entry.balance;
      assetCount++;
    } else if (entry.cls === 'Liability') {
      var liabBal = Math.abs(entry.balance);
      if (entry.balance < 0) liabBal = 0;
      totalLiabilities += liabBal;
      liabCount++;
    }
  }
  var netWorth = totalAssets - totalLiabilities;

  // ── 5b. Build cash accounts list (checking/savings ONLY — v7 fix) ──
  var cashAccounts = [];
  var liquidCash = 0;
  var LIQUID_TYPES = ['checking', 'savings'];
  for (var acct in latestBal) {
    var entry = latestBal[acct];
    if (entry.cls === 'Asset') {
      var acctType = String(entry.type || '').toLowerCase();
      var isLiquid = false;
      for (var lt = 0; lt < LIQUID_TYPES.length; lt++) {
        if (acctType.indexOf(LIQUID_TYPES[lt]) >= 0) { isLiquid = true; break; }
      }
      if (isLiquid) {
        cashAccounts.push({
          name: acct,
          balance: roundTo(entry.balance, 2),
          type: entry.type || '',
          lastSynced: entry.date ? formatDate(entry.date) : ''
        });
        liquidCash += entry.balance;
      }
    }
  }
  cashAccounts.sort(function(a, b) { return b.balance - a.balance; });
  liquidCash = roundTo(liquidCash, 2);

  // v11: Full asset & liability account lists
  var assetAccounts = [];
  var liabilityAccounts = [];
  for (var acct in latestBal) {
    var entry = latestBal[acct];
    if (entry.cls === 'Asset') {
      assetAccounts.push({ name: acct, balance: roundTo(entry.balance, 2), type: entry.type || '' });
    } else if (entry.cls === 'Liability') {
      liabilityAccounts.push({ name: acct, balance: roundTo(Math.abs(entry.balance), 2), type: entry.type || '' });
    }
  }
  assetAccounts.sort(function(a, b) { return b.balance - a.balance; });
  liabilityAccounts.sort(function(a, b) { return b.balance - a.balance; });

  // ═══════════════════════════════════════════════════════════════════
  // ── 6. Debt data from Debt_Export (always current) ──────────────
  //    v26 FIX: Explicit active/excluded tracking.
  //    debtCurrent = active + excluded = ALL non-mortgage debt.
  //    debtCurrentActive = active only (for cascade/waterfall display).
  //    Previous versions set debtCurrent = debtTotal from the parsing
  //    loop which could miss excluded accounts depending on sheet layout.
  // ═══════════════════════════════════════════════════════════════════
  var debts = [];
  var excludedDebtsFromExport = [];    // v26: separate excluded array
  var debtTotalActive = 0;             // v26: active-only sum
  var debtTotalExcluded = 0;           // v26: excluded-only sum
  if (includeDebt) {
    var dxData = de_readSheet_('Debt_Export');
    if (dxData && dxData.length > 0) {
      var dxHeaders = [];
      var dxFoundHeader = false;
      var _inExcludedSection = false;  // v26: track which section we're in
      for (var d = 0; d < dxData.length; d++) {
        var cellA = String(dxData[d][0] || '').trim();
        if (!cellA) continue;
        if (cellA.indexOf('DEBT EXPORT') >= 0) continue;
        if (cellA.indexOf('Publish') >= 0) continue;
        if (cellA.indexOf('Pulls live') >= 0) continue;
        if (cellA.indexOf('SUMMARY') >= 0) break;

        // v26: Detect EXCLUDED section boundary
        if (cellA.indexOf('EXCLUDED') >= 0) {
          _inExcludedSection = true;
          continue;
        }

        if (cellA === 'name') {
          if (!dxFoundHeader) {
            dxHeaders = dxData[d];
            dxFoundHeader = true;
          }
          // v26: Second "name" header in excluded section — just skip it
          continue;
        }
        if (!dxFoundHeader) continue;

        var dRow = {};
        for (var dc = 0; dc < dxHeaders.length; dc++) {
          if (dxHeaders[dc]) dRow[dxHeaders[dc]] = dxData[d][dc];
        }
        var bal = assertNumeric(dRow['balance'], 'balance');
        // v26: Allow zero-balance in excluded section (for completeness)
        if (bal <= 0.01 && !_inExcludedSection) continue;

        var debtObj = {
          name: dRow['name'],
          balance: bal,
          apr: assertNumeric(dRow['apr'], 'apr'),
          minPayment: assertNumeric(dRow['minPayment'], 'minPayment'),
          promoAPR: dRow['promoAPR'] != null ? parseFloat(dRow['promoAPR']) : null,
          promoExpires: dRow['promoExpires'] ? formatDate(dRow['promoExpires']) : null,
          type: dRow['type'] || '',
          strategy: dRow['strategy'] || '',
          priority: parseInt(dRow['priority']) || 99,
          limit: parseFloat(dRow['limit']) || null,
          payoffDate: dRow['payoffDate'] || null
        };

        // v26: Route to correct array and sum
        if (_inExcludedSection) {
          excludedDebtsFromExport.push(debtObj);
          debtTotalExcluded += bal;
        } else {
          debts.push(debtObj);
          debtTotalActive += bal;
        }
      }
    }
  }

  // v26: debtCurrent = ALL non-mortgage debt (active + excluded)
  var debtCurrent = debtTotalActive + debtTotalExcluded;
  // ── v62: Build per-label debt minimum budgets (ported from getSimulatorData) ──
  // Maps each BUDGET_MAP label → sum of Debt_Export minimums for accounts in
  // that group. TheVein v40 reads debtPaymentBudget[label] for $actual/$budget.
  var debtPaymentBudget = {};
  var _allDebtsForBudget = debts.concat(excludedDebtsFromExport);
  var _unmatchedBudgetDebts = [];
  for (var _bmi = 0; _bmi < _allDebtsForBudget.length; _bmi++) {
    var _bmd = _allDebtsForBudget[_bmi];
    var _dname = (_bmd.name || '').toLowerCase();
    var _bmMatched = false;
    for (var _bmLbl in BUDGET_MAP) {
      if (_bmMatched) break;
      var _bmPatterns = BUDGET_MAP[_bmLbl];
      for (var _bmPi = 0; _bmPi < _bmPatterns.length; _bmPi++) {
        if (_bmPatterns[_bmPi].test(_dname)) {
          debtPaymentBudget[_bmLbl] = (debtPaymentBudget[_bmLbl] || 0) + (_bmd.minPayment || 0);
          _bmMatched = true;
          break;
        }
      }
    }
    if (!_bmMatched) _unmatchedBudgetDebts.push(_bmd.name);
  }
  var _budgetMapCoverage = _allDebtsForBudget.length > 0
    ? roundTo((_allDebtsForBudget.length - _unmatchedBudgetDebts.length) / _allDebtsForBudget.length * 100, 1)
    : 100;
  var weeklyCashMap = de_getWeeklyCashMapMetrics_(ss);

  // ── 7. Compute derived metrics ──
  var operationalCashFlow = earnedIncome - operatingExpenses;
  var netCashFlow = totalMoneyIn - operatingExpenses;

  var startM = startDate.getMonth();
  var endM = endDate.getMonth();
  var startY = startDate.getFullYear();
  var endY = endDate.getFullYear();
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  var periodLabel, monthName, yearNum, monthNum;
  if (startM === endM && startY === endY) {
    monthName = MONTHS[startM];
    yearNum = startY;
    monthNum = startM + 1;
    periodLabel = monthName + ' ' + yearNum;
  } else {
    monthName = MONTHS[startM] + '\u2013' + MONTHS[endM];
    yearNum = endY;
    monthNum = endM + 1;
    periodLabel = MONTHS[startM].substring(0,3) + ' ' + startDate.getDate() + ' \u2013 ' + MONTHS[endM].substring(0,3) + ' ' + endDate.getDate() + ', ' + endY;
  }

  var trackedDebt = debts.length + excludedDebtsFromExport.length;  // v26: count all
  var bhLiab = liabCount;
  var coverage = '\u2713 ' + (assetCount + liabCount) + ' accounts';

  // ── Wave 4: Time-in-month + mortgage + DSCR helpers ──
  var _now_v21 = new Date();
  var _dim_v21 = new Date(endY, endM + 1, 0).getDate();
  var _isPast_v21 = endDate < new Date(_now_v21.getFullYear(), _now_v21.getMonth(), _now_v21.getDate());
  var _dom_v21 = _isPast_v21 ? _dim_v21 : endDate.getDate();

  // mortgageBalance: largest liability > $100K NOT tracked in debts[]
  var _debtNames_v21 = {};
  for (var _di = 0; _di < debts.length; _di++) _debtNames_v21[debts[_di].name] = true;
  for (var _dix = 0; _dix < excludedDebtsFromExport.length; _dix++) _debtNames_v21[excludedDebtsFromExport[_dix].name] = true;
  var _mortgageBalance_v21 = 0;
  for (var _a2 in latestBal) {
    var _e2 = latestBal[_a2];
    if (_e2.cls === 'Liability' && Math.abs(_e2.balance) > 100000 && !_debtNames_v21[_a2]) {
      if (Math.abs(_e2.balance) > _mortgageBalance_v21) _mortgageBalance_v21 = Math.abs(_e2.balance);
    }
  }

  // dscr: sum of ALL minPayments (active + excluded) / earnedIncome (null if income = 0)
  var _dscr_v21 = null;
  if (earnedIncome > 0) {
    var _totalMins_v21 = 0;
    for (var _dj = 0; _dj < debts.length; _dj++) _totalMins_v21 += (debts[_dj].minPayment || 0);
    for (var _djx = 0; _djx < excludedDebtsFromExport.length; _djx++) _totalMins_v21 += (excludedDebtsFromExport[_djx].minPayment || 0);
    _dscr_v21 = roundTo(_totalMins_v21 / earnedIncome, 4);
  }

  // v26: Cache baseline — scans Balance History, expensive to repeat
  var _cachedDebtBaseline = computeDebtBaseline();

  // ── 7b. Compute interest burn server-side (v24) ──
  // v26: include both active + excluded for full interest picture
  var _allDebtsForBurn = debts.concat(excludedDebtsFromExport);
  var _interestBurn = (includeDebt && _allDebtsForBurn.length > 0) ? de_computeInterestBurn_(_allDebtsForBurn) : { monthly: 0, annual: 0, byAccount: [], byTier: [], lowAprBurn: 0, critical: 0, high: 0, medium: 0, low: 0 };

  // ── 8. Build response matching Dashboard_Export KV structure ──
  var result = {
    // Metadata
    year: yearNum,
    monthNum: monthNum,
    month: monthName,
    periodLabel: periodLabel,
    startDate: startStr,
    endDate: endStr,
    isRange: (startM !== endM || startY !== endY),
    generatedAt: new Date().toISOString(),

    // Income
    'income.monthlyBudget': roundTo(incomeBudget, 2),
    earnedIncome: roundTo(earnedIncome, 2),
    loanProceeds: roundTo(loanProceeds, 2),
    balanceTransfers: roundTo(balanceTransfers, 2),
    totalMoneyIn: roundTo(totalMoneyIn, 2),
    'income.lt_income.actual': roundTo(Math.abs(catActuals['LT Income'] || 0), 2),
    'income.lt_income.budget': roundTo(catBudgets['LT Income'] || 0, 2),
    'income.jt_income.actual': roundTo(Math.abs(catActuals['JT Income'] || 0), 2),
    'income.jt_income.budget': roundTo(catBudgets['JT Income'] || 0, 2),
    'income.other_income.actual': roundTo(Math.abs(catActuals['Other Income'] || 0), 2),
    'income.other_income.budget': roundTo(catBudgets['Other Income'] || 0, 2),
    'income.interest_income.actual': roundTo(Math.abs(catActuals['Interest Income'] || 0), 2),
    'income.interest_income.budget': roundTo(catBudgets['Interest Income'] || 0, 2),
    'income.bonus_income.actual': roundTo(Math.abs(catActuals['Bonus Income'] || 0), 2),
    'income.bonus_income.budget': roundTo(catBudgets['Bonus Income'] || 0, 2),

    // Expenses — bucket totals
    operatingExpenses: roundTo(operatingExpenses, 2),
    'expenses.fixed_expenses.budget': roundTo(bucketBudgets['fixed_expenses'] || 0, 2),
    'expenses.fixed_expenses.actual': roundTo(bucketActuals['fixed_expenses'] || 0, 2),
    'expenses.necessary_living.budget': roundTo(bucketBudgets['necessary_living'] || 0, 2),
    'expenses.necessary_living.actual': roundTo(bucketActuals['necessary_living'] || 0, 2),
    'expenses.discretionary.budget': roundTo(bucketBudgets['discretionary'] || 0, 2),
    'expenses.discretionary.actual': roundTo(bucketActuals['discretionary'] || 0, 2),
    'expenses.debt_cost.budget': roundTo(bucketBudgets['debt_cost'] || 0, 2),
    'expenses.debt_cost.actual': roundTo(bucketActuals['debt_cost'] || 0, 2),

    // Expenses — subcategory detail (fixed)
    'expenses.fixed_expenses.mortgage.actual': roundTo(catDetails['fixed_expenses.mortgage'] || 0, 2),
    'expenses.fixed_expenses.mortgage.budget': roundTo(catDetails['fixed_expenses.mortgage.budget'] || 0, 2),
    // v34: Debt payment categories forced to $0 — tracked in debt minimums, NOT expenses
    'expenses.fixed_expenses.sofi_loan.actual': 0,
    'expenses.fixed_expenses.sofi_loan.budget': 0,
    'expenses.fixed_expenses.auto_loan.actual': 0,
    'expenses.fixed_expenses.auto_loan.budget': 0,
    'expenses.fixed_expenses.student_loans.actual': 0,
    'expenses.fixed_expenses.student_loans.budget': 0,
    'expenses.fixed_expenses.solar_panel.actual': 0,
    'expenses.fixed_expenses.solar_panel.budget': 0,
    'expenses.fixed_expenses.life_insurance.actual': roundTo(catDetails['fixed_expenses.lifeinsurance'] || 0, 2),
    'expenses.fixed_expenses.life_insurance.budget': roundTo(catDetails['fixed_expenses.lifeinsurance.budget'] || 0, 2),
    'expenses.fixed_expenses.auto_insurance.actual': roundTo(catDetails['fixed_expenses.autoinsurance'] || 0, 2),
    'expenses.fixed_expenses.auto_insurance.budget': roundTo(catDetails['fixed_expenses.autoinsurance.budget'] || 0, 2),
    'expenses.fixed_expenses.phone.actual': roundTo(catDetails['fixed_expenses.phone'] || 0, 2),
    'expenses.fixed_expenses.phone.budget': roundTo(catDetails['fixed_expenses.phone.budget'] || 0, 2),

    // Expenses — subcategory detail (necessary)
    'expenses.necessary_living.utilities.actual': roundTo(catDetails['necessary_living.utilities'] || 0, 2),
    'expenses.necessary_living.utilities.budget': roundTo(catDetails['necessary_living.utilities.budget'] || 0, 2),
    'expenses.necessary_living.groceries.actual': roundTo(catDetails['necessary_living.groceries'] || 0, 2),
    'expenses.necessary_living.groceries.budget': roundTo(catDetails['necessary_living.groceries.budget'] || 0, 2),
    'expenses.necessary_living.childcare.actual': roundTo(catDetails['necessary_living.childcare'] || 0, 2),
    'expenses.necessary_living.childcare.budget': roundTo(catDetails['necessary_living.childcare.budget'] || 0, 2),
    'expenses.necessary_living.transportation.actual': roundTo(catDetails['necessary_living.transportation'] || 0, 2),
    'expenses.necessary_living.transportation.budget': roundTo(catDetails['necessary_living.transportation.budget'] || 0, 2),
    'expenses.necessary_living.home_maintenance.actual': roundTo(catDetails['necessary_living.homemaintenance'] || 0, 2),
    'expenses.necessary_living.home_maintenance.budget': roundTo(catDetails['necessary_living.homemaintenance.budget'] || 0, 2),
    'expenses.necessary_living.healthcare.actual': roundTo(catDetails['necessary_living.healthcare'] || 0, 2),
    'expenses.necessary_living.healthcare.budget': roundTo(catDetails['necessary_living.healthcare.budget'] || 0, 2),
    'expenses.necessary_living.security.actual': roundTo(catDetails['necessary_living.security'] || 0, 2),
    'expenses.necessary_living.security.budget': roundTo(catDetails['necessary_living.security.budget'] || 0, 2),
    'expenses.necessary_living.taxes.actual': roundTo(catDetails['necessary_living.taxes'] || 0, 2),
    'expenses.necessary_living.taxes.budget': roundTo(catDetails['necessary_living.taxes.budget'] || 0, 2),

    // Expenses — subcategory detail (discretionary)
    'expenses.discretionary.fast_food.actual': roundTo(catDetails['discretionary.fastfood'] || 0, 2),
    'expenses.discretionary.fast_food.budget': roundTo(catDetails['discretionary.fastfood.budget'] || 0, 2),
    'expenses.discretionary.general_shopping.actual': roundTo(catDetails['discretionary.generalshopping'] || 0, 2),
    'expenses.discretionary.general_shopping.budget': roundTo(catDetails['discretionary.generalshopping.budget'] || 0, 2),
    'expenses.discretionary.subscriptions.actual': roundTo(catDetails['discretionary.subscriptions'] || 0, 2),
    'expenses.discretionary.subscriptions.budget': roundTo(catDetails['discretionary.subscriptions.budget'] || 0, 2),
    'expenses.discretionary.personal_care.actual': roundTo(catDetails['discretionary.personalcare'] || 0, 2),
    'expenses.discretionary.personal_care.budget': roundTo(catDetails['discretionary.personalcare.budget'] || 0, 2),
    'expenses.discretionary.kids_activities.actual': roundTo(catDetails['discretionary.kidsactivities'] || 0, 2),
    'expenses.discretionary.kids_activities.budget': roundTo(catDetails['discretionary.kidsactivities.budget'] || 0, 2),
    'expenses.discretionary.travel.actual': roundTo(catDetails['discretionary.travel'] || 0, 2),
    'expenses.discretionary.travel.budget': roundTo(catDetails['discretionary.travel.budget'] || 0, 2),
    'expenses.discretionary.vices.actual': roundTo(catDetails['discretionary.vices'] || 0, 2),
    'expenses.discretionary.vices.budget': roundTo(catDetails['discretionary.vices.budget'] || 0, 2),
    'expenses.discretionary.atm_cash.actual': roundTo(catDetails['discretionary.atmcash'] || 0, 2),
    'expenses.discretionary.atm_cash.budget': roundTo(catDetails['discretionary.atmcash.budget'] || 0, 2),
    'expenses.discretionary.miscellaneous.actual': roundTo(catDetails['discretionary.miscellaneous'] || 0, 2),
    'expenses.discretionary.miscellaneous.budget': roundTo(catDetails['discretionary.miscellaneous.budget'] || 0, 2),

    // Expenses — debt cost detail
    'expenses.debt_cost.fees_&_interest.actual': roundTo(catDetails['debt_cost.fees&interest'] || 0, 2),
    'expenses.debt_cost.fees_&_interest.budget': roundTo(catDetails['debt_cost.fees&interest.budget'] || 0, 2),

    // Cash flow
    rawBankActivity: roundTo(rawBankActivity, 2),
    operationalCashFlow: roundTo(operationalCashFlow, 2),
    bridgeCash: roundTo(loanProceeds, 2),
    bridgeCashLabel: loanProceeds > 0 ? 'LOC / Loan Draw' : '',
    'netCashFlow (All Money In \u2212 Out)': roundTo(operationalCashFlow + loanProceeds, 2),
    netCashFlow: roundTo(operationalCashFlow + loanProceeds, 2),

    // WeeklyCashMap
    weeklyCashMin: weeklyCashMap.weeklyCashMin,
    pinchPointDate: weeklyCashMap.pinchPointDate,
    weeksOfRunway: weeklyCashMap.weeksOfRunway,
    honestWeeklyBurn: weeklyCashMap.honestWeeklyBurn,
    honestMonthlyDeficit: weeklyCashMap.honestMonthlyDeficit,

    // Net Worth
    totalAssets: roundTo(totalAssets, 2),
    totalLiabilities: roundTo(totalLiabilities, 2),
    netWorth: roundTo(netWorth, 2),
    cashAccounts: cashAccounts,
    assetAccounts: assetAccounts,
    liabilityAccounts: liabilityAccounts,
    liquidCash: liquidCash,

    // ═══ Debt — v26: three-tier reporting ═══
    debtStart: _cachedDebtBaseline,
    debtCurrent: roundTo(debtCurrent, 2),                        // v26: active + excluded
    debtCurrentActive: roundTo(debtTotalActive, 2),               // v26: cascade/waterfall
    debtCurrentExcluded: roundTo(debtTotalExcluded, 2),           // v26: transparency
    debtByType: de_getDebtByType_(debts, excludedDebtsFromExport, _mortgageBalance_v21),
    debtTarget: readDebtExportMeta('debtFreeTarget') || null,
cashFlowPositiveDate: (function() {
  var _cfpNow = new Date();
  var _cfpChildcare = new Date(2027, 8, 1);
  var _cfpSofi = null;
  for (var _cfpi = 0; _cfpi < debts.length; _cfpi++) {
    if (debts[_cfpi].name && debts[_cfpi].name.indexOf('JT Sofi') >= 0) { _cfpSofi = debts[_cfpi]; break; }
  }
  var _cfpPayoff = _cfpNow;
  if (_cfpSofi && _cfpSofi.balance > 0) {
    var _cfpMo = amortizationMonths(_cfpSofi.balance, _cfpSofi.apr, _cfpSofi.minPayment || 0);
    _cfpPayoff = new Date(_cfpNow); _cfpPayoff.setMonth(_cfpPayoff.getMonth() + _cfpMo);
  }
  var _cfpLater = _cfpChildcare > _cfpPayoff ? _cfpChildcare : _cfpPayoff;
  var _cfpMS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return _cfpMS[_cfpLater.getMonth()] + ' ' + _cfpLater.getFullYear();
})(),

    // ── Debt payments for this date range (v43) ──
    // Previously only in getSimulatorData(). Adding to getData() so prior-month
    // views in ThePulse show correct debt payments, not current-month fallback.
    debtPaymentsMTD: (function() {
      var _dpm = 0;
      var _DEBT_PAY = ['CC Payment', 'LOC Payment', 'Loan Payment', 'SoFi Loan', 'Auto Loan', 'Student Loans', 'Solar Panel'];
      for (var _t = 1; _t < txData.length; _t++) {
        var _td = txData[_t][1], _tc = String(txData[_t][3]||'').trim(), _ta = parseFloat(txData[_t][4])||0;
        if (!_td||!_tc) continue;
        if (typeof _td==='string') _td=new Date(_td);
        if (!(_td instanceof Date)||isNaN(_td.getTime())) continue;
        if (_td<startDate||_td>endDate) continue;
        if (_ta<0 && _DEBT_PAY.indexOf(_tc)>=0) _dpm+=Math.abs(_ta);
      }
      return roundTo(_dpm,2);
    })(),
    debtPaymentDetail: (function() {
      var _dpd = {};
      var _DEBT_PAY2 = ['CC Payment', 'LOC Payment', 'Loan Payment', 'SoFi Loan', 'Auto Loan', 'Student Loans', 'Solar Panel'];
      // v44: LOC_MAP for LOC Payment category (separate from CC_MAP)
      var _LOC_MAP = [[/x8840/,'LT-LOC'],[/x4540/,'JT-LOC'],[/lt.?loc/,'LT-LOC'],[/jt.?loc/,'JT-LOC']];
      // v46 FIX #1: Use SHARED_CC_MAP (unified, canonical labels)
      var _CC_MAP = SHARED_CC_MAP;
      for (var _t2=1;_t2<txData.length;_t2++) {
        var _td2=txData[_t2][1],_tc2=String(txData[_t2][3]||'').trim(),_ta2=parseFloat(txData[_t2][4])||0;
        var _desc2=String(txData[_t2][2]||'').toLowerCase().trim();
        if (!_td2||!_tc2) continue;
        if (typeof _td2==='string') _td2=new Date(_td2);
        if (!(_td2 instanceof Date)||isNaN(_td2.getTime())) continue;
        if (_td2<startDate||_td2>endDate) continue;
        if (_ta2>=0||_DEBT_PAY2.indexOf(_tc2)<0) continue;
        var _dpKey;
        if (_tc2==='CC Payment') {
          _dpKey='CC Payment';
          for (var _cm2=0;_cm2<_CC_MAP.length;_cm2++) {
            if (_CC_MAP[_cm2][0].test(_desc2)){_dpKey=_CC_MAP[_cm2][1];break;}
          }
          if (_dpKey===null) continue;
          if (!_dpd.__ccAccounts) _dpd.__ccAccounts=[];
          if (_dpd.__ccAccounts.indexOf(_dpKey)<0) _dpd.__ccAccounts.push(_dpKey);
        } else if (_tc2==='LOC Payment') {
          _dpKey='LOC Payment';
          for (var _lm2=0;_lm2<_LOC_MAP.length;_lm2++) {
            if (_LOC_MAP[_lm2][0].test(_desc2)){_dpKey=_LOC_MAP[_lm2][1];break;}
          }
                  if (!_dpd.__locAccounts) _dpd.__locAccounts=[];
          if (_dpd.__locAccounts.indexOf(_dpKey)<0) _dpd.__locAccounts.push(_dpKey);
      } else if (_tc2==='Loan Payment') {
        _dpKey='Loan Payment';
        for (var _lpm2=0;_lpm2<LOAN_PAYMENT_MAP.length;_lpm2++) {
          if (LOAN_PAYMENT_MAP[_lpm2][0].test(_desc2)){_dpKey=LOAN_PAYMENT_MAP[_lpm2][1];break;}
        }
        if (_dpKey===null) continue;
        if (!_dpd.__loanAccounts) _dpd.__loanAccounts=[];
        if (_dpd.__loanAccounts.indexOf(_dpKey)<0) _dpd.__loanAccounts.push(_dpKey);
      } else {
        _dpKey=_tc2;
      }
        if (!_dpd[_dpKey]) _dpd[_dpKey]=0;
        _dpd[_dpKey]+=Math.abs(_ta2);
      }
      // Round numeric values — pass metadata arrays through as-is
      var _out={};
      var _META_KEYS={'__ccAccounts':1,'__locAccounts':1,'__loanAccounts':1};
      for (var _k2 in _dpd) _out[_k2]=(_META_KEYS[_k2]?_dpd[_k2]:roundTo(_dpd[_k2],2));
      return _out;
    })(),
    // v62: Per-label debt minimum budgets — ported from getSimulatorData for TheVein v40
    debtPaymentBudget: (function() {
      var _dpb = {};
      for (var _k in debtPaymentBudget) _dpb[_k] = Math.round(debtPaymentBudget[_k]);
      return _dpb;
    })(),
    _budgetMapCoverage: _budgetMapCoverage,
    _unmatchedBudgetDebts: _unmatchedBudgetDebts,
    // Payments
    ccPayments: roundTo(ccPayments, 2),
    loanPayments: roundTo(loanPayments, 2),

    // Coverage
    acctCoverage: coverage,
    trackedDebtAccounts: trackedDebt,
    bhLiabilityAccounts: bhLiab,
    // v51: Explicit debt counts — Dumb Glass compliant
    activeDebtCount: debts.length,
    excludedDebtCount: excludedDebtsFromExport.length,
    totalDebtCount: debts.length + excludedDebtsFromExport.length,

    // ── Wave 4: Time-in-month metrics ──
    dayOfMonth: _dom_v21,
    daysInMonth: _dim_v21,
    monthElapsedPct: roundTo(_dom_v21 / _dim_v21, 4),
    mortgageBalance: roundTo(_mortgageBalance_v21, 2),
    dscr: _dscr_v21,
    // v24: Canonical surplus + interest burn
    monthlySurplus: roundTo(earnedIncome - operatingExpenses, 2),
    interestBurn: _interestBurn,
    // v45: Canonical interest burn from Debt_Export SUMMARY (matches getSimulatorData)
    canonicalInterestBurn: parseFloat(readDebtExportMeta('totalMonthlyInterest')) || 0,

    // ═══ v26: Pre-computed display fields — dashboards should read, not recalculate ═══
    daysRemaining: _dim_v21 - _dom_v21,
    spendPct: earnedIncome > 0 ? roundTo((operatingExpenses / earnedIncome) * 100, 1) : 0,
    incomePct: incomeBudget > 0 ? roundTo((earnedIncome / incomeBudget) * 100, 1) : 0,
    debtChange: roundTo((_cachedDebtBaseline || 0) - debtCurrent, 2),
    debtChangePct: (function() {
      var _ds = _cachedDebtBaseline || 0;
      return _ds > 0 ? roundTo(((_ds - debtCurrent) / _ds) * 100, 1) : 0;
    })(),
    statusLevel: (function() {
      var _incOk = incomeBudget > 0 ? (earnedIncome / incomeBudget) >= 0.8 : earnedIncome > 0;
      var _spendOk = earnedIncome > 0 ? (operatingExpenses / earnedIncome) < 0.85 : true;
      var _ds2 = _cachedDebtBaseline || 0;
      var _debtOk = _ds2 > 0 ? (debtCurrent <= _ds2) : true;
      var _score = (_incOk ? 1 : 0) + (_spendOk ? 1 : 0) + (_debtOk ? 1 : 0);
      return _score >= 3 ? 'green' : _score >= 2 ? 'yellow' : 'red';
    })(),
    // Bucket percentages (so UI doesn't divide)
    'expenses.fixed_expenses.pct': operatingExpenses > 0 ? roundTo(((bucketActuals['fixed_expenses'] || 0) / operatingExpenses) * 100, 1) : 0,
    'expenses.necessary_living.pct': operatingExpenses > 0 ? roundTo(((bucketActuals['necessary_living'] || 0) / operatingExpenses) * 100, 1) : 0,
    'expenses.discretionary.pct': operatingExpenses > 0 ? roundTo(((bucketActuals['discretionary'] || 0) / operatingExpenses) * 100, 1) : 0,
    'expenses.debt_cost.pct': operatingExpenses > 0 ? roundTo(((bucketActuals['debt_cost'] || 0) / operatingExpenses) * 100, 1) : 0
  };

  result.onTrackDays = (function() {
    if (!includeDebt) return 0;
    var bhData = de_readSheet_('Balance History');
    if (!bhData || bhData.length < 2) return 0;
    var _trackedNames = {};
    for (var _oti = 0; _oti < debts.length; _oti++) _trackedNames[debts[_oti].name] = true;
    for (var _otx = 0; _otx < excludedDebtsFromExport.length; _otx++) _trackedNames[excludedDebtsFromExport[_otx].name] = true;
    var dailySnaps = {};
    for (var _bhi = 1; _bhi < bhData.length; _bhi++) {
      var _bhDate = bhData[_bhi][1];
      var _bhAcct = String(bhData[_bhi][3] || '').trim();
      var _bhBal = Math.abs(parseFloat(bhData[_bhi][8]) || 0);
      var _bhClass = bhData[_bhi][12];
      if (!_bhDate || !_bhAcct || _bhClass !== 'Liability') continue;
      if (!_trackedNames[_bhAcct]) continue;
      if (_bhDate instanceof Date) _bhDate = Utilities.formatDate(_bhDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      else _bhDate = String(_bhDate).substring(0, 10);
      if (!dailySnaps[_bhDate]) dailySnaps[_bhDate] = {};
      dailySnaps[_bhDate][_bhAcct] = _bhBal;
    }
    var sortedDays = Object.keys(dailySnaps).sort().reverse();
    if (sortedDays.length < 2) return 0;
    var streak = 0;
    for (var _di = 0; _di < sortedDays.length - 1; _di++) {
      var today = dailySnaps[sortedDays[_di]];
      var yesterday = dailySnaps[sortedDays[_di + 1]];
      var increased = false;
      for (var _acct in today) {
        if (yesterday[_acct] !== undefined && today[_acct] > yesterday[_acct] + 0.01) {
          increased = true; break;
        }
      }
      if (increased) break;
      streak++;
    }
    return streak;
  })();

  result.lastWin = (function() {
    if (!includeDebt) return null;
    var bhData = de_readSheet_('Balance History');
    if (!bhData || bhData.length < 2) return null;
    var _trackedNames = {};
    for (var _lwi = 0; _lwi < debts.length; _lwi++) _trackedNames[debts[_lwi].name] = true;
    for (var _lwx = 0; _lwx < excludedDebtsFromExport.length; _lwx++) _trackedNames[excludedDebtsFromExport[_lwx].name] = true;
    var wins = [];
    for (var _bhi2 = 1; _bhi2 < bhData.length; _bhi2++) {
      var _dt = bhData[_bhi2][1];
      var _acct = String(bhData[_bhi2][3] || '').trim();
      var _bal = Math.abs(parseFloat(bhData[_bhi2][8]) || 0);
      var _cls = bhData[_bhi2][12];
      if (!_dt || !_acct || _cls !== 'Liability') continue;
      if (!_trackedNames[_acct]) continue;
      if (_bal < 1) {
        if (_dt instanceof Date) _dt = Utilities.formatDate(_dt, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        else _dt = String(_dt).substring(0, 10);
        wins.push({ name: _acct, date: _dt });
      }
    }
    if (!wins.length) return null;
    wins.sort(function(a, b) { return b.date < a.date ? -1 : 1; });
    return { name: wins[0].name, date: wins[0].date };
  })();

  result.pulseState = (function() {
    var _otd = result.onTrackDays || 0;
    var _nw = result.nextWin || (function() {
      var _pool = debts.concat(excludedDebtsFromExport);
      var _cand = null;
      for (var _ni = 0; _ni < _pool.length; _ni++) {
        var _nd = _pool[_ni];
        var _bal = _nd.balance || 0;
        if (_bal > 0 && _bal < 1000) {
          if (!_cand || _bal < _cand.balance) _cand = { name: _nd.name, balance: roundTo(_bal, 2) };
        }
      }
      return _cand;
    })();
    var _dc = debtCurrent || 0;
    var _ds = _cachedDebtBaseline || 0;
    if (_otd > 7 && _nw) return 'strong';
    if (_otd >= 1 || (_ds > 0 && _dc <= _ds)) return 'neutral';
    return 'fallback';
  })();

  // v46 FIX #6a: Dumb Glass pre-computation — dashboards read these, not recalculate
  var _totalMins_v46 = 0;
  for (var _mg = 0; _mg < debts.length; _mg++) _totalMins_v46 += (debts[_mg].minPayment || 0);
  for (var _mgx = 0; _mgx < excludedDebtsFromExport.length; _mgx++) _totalMins_v46 += (excludedDebtsFromExport[_mgx].minPayment || 0);
  result.debtNow = roundTo(debtCurrent, 2);
  result.debtNetChange = roundTo((_cachedDebtBaseline || 0) - debtCurrent, 2);
  result.gapAfterDebt = roundTo(earnedIncome - operatingExpenses - _totalMins_v46, 2);
  // v52: Income Throttle — server-canonical "what's left after ALL bills"
  result.incomeThrottle = roundTo(earnedIncome - operatingExpenses - result.debtPaymentsMTD, 2);
  // v53: Export totalMinimums for TheVein Monthly Pulse debt payment visual
  result.totalMinimums = roundTo(_totalMins_v46, 2);
  // v55: Dynamic subcategory export — covers ALL categories
  result.subcategories = {};
  for (var _cdK in catDetails) {
    result.subcategories[_cdK] = roundTo(catDetails[_cdK], 2);
    var _isBud = _cdK.indexOf('.budget') >= 0;
    var _baseK = _isBud ? _cdK.replace('.budget', '') : _cdK;
    var _expBase = catExportKeys[_baseK] || _baseK;
    var _sfx = _isBud ? '.budget' : '.actual';
    var _fk = 'expenses.' + _expBase + _sfx;
    if (result[_fk] === undefined) result[_fk] = roundTo(catDetails[_cdK], 2);
  }
  // v26: Attach both debt arrays
  if (includeDebt) {
    if (debts.length > 0) result.debts = debts;
    if (excludedDebtsFromExport.length > 0) result.excludedDebts = excludedDebtsFromExport;
  }

  // ── 9. Financial integrity checks (F-16 Dual Audit) ──
  var integrityErrors = [];

  var moneyInExpected = earnedIncome + loanProceeds + balanceTransfers;
  var moneyInDelta = Math.abs(totalMoneyIn - moneyInExpected);
  if (moneyInDelta > 0.02) {
    integrityErrors.push('MoneyIn: totalMoneyIn=$' + totalMoneyIn.toFixed(2) + ' vs (earned+loans+BT)=$' + moneyInExpected.toFixed(2) + ' delta=$' + moneyInDelta.toFixed(2));
  }

  var ocfExpected = earnedIncome - operatingExpenses;
  var ocfDelta = Math.abs(operationalCashFlow - ocfExpected);
  if (ocfDelta > 0.02) {
    integrityErrors.push('CashFlow: operationalCashFlow=$' + operationalCashFlow.toFixed(2) + ' vs (earned-opEx)=$' + ocfExpected.toFixed(2) + ' delta=$' + ocfDelta.toFixed(2));
  }

  var nwExpected = totalAssets - totalLiabilities;
  var nwDelta = Math.abs(netWorth - nwExpected);
  if (nwDelta > 0.02) {
    integrityErrors.push('NetWorth: nw=$' + netWorth.toFixed(2) + ' vs (assets-liab)=$' + nwExpected.toFixed(2) + ' delta=$' + nwDelta.toFixed(2));
  }

  // v26: Debt reconciliation — active + excluded must equal debtCurrent
  if (includeDebt) {
    var _activeArraySum = 0;
    for (var ic = 0; ic < debts.length; ic++) { _activeArraySum += debts[ic].balance; }
    var _excludedArraySum = 0;
    for (var icx = 0; icx < excludedDebtsFromExport.length; icx++) { _excludedArraySum += excludedDebtsFromExport[icx].balance; }
    var _totalArraySum = _activeArraySum + _excludedArraySum;

    var debtDelta = Math.abs(debtCurrent - _totalArraySum);
    if (debtDelta > 1.00) {
      integrityErrors.push('DebtRecon: debtCurrent=$' + debtCurrent.toFixed(2) + ' vs sum(active+excluded)=$' + _totalArraySum.toFixed(2) + ' delta=$' + debtDelta.toFixed(2));
    }

    // v26: Cross-check active sum
    var activeDelta = Math.abs(debtTotalActive - _activeArraySum);
    if (activeDelta > 1.00) {
      integrityErrors.push('ActiveRecon: debtTotalActive=$' + debtTotalActive.toFixed(2) + ' vs sum(debts[])=$' + _activeArraySum.toFixed(2));
    }
  }

  // v45: Unmapped category diagnostic for bucket variance debugging
  result.unmappedCategories = _unmappedCategories;
  // v24: Attach response metadata
  result._meta = de_buildMeta_(startStr, endStr, _warnings);
  // v24: debtStart $0 warning
  if (result.debtStart <= 0) {
    integrityErrors.push('debtStart=$0 \u2014 DebtModel may be missing or account names changed');
  }
  if (integrityErrors.length > 0) {
    result.integrityErrors = integrityErrors;
    Logger.log('\u26a0\ufe0f INTEGRITY CHECK FAILED: ' + integrityErrors.join(' | '));
  }

  // v77: Pulse Summary — informational narrative for ThePulse
  result.pulseSummary = de_buildPulseSummary_(result);

  return result;
  } finally {
    if (_cacheOwner) { _deCache = null; _deSS = null; }
  }
}


// ╔══════════════════════════════════════════════════════════════════╗
// ║  CHUNK 2 — Utilities + Debt Baseline + LOC + CFF             ║
// ║  getMonthFractions, formatDate, roundTo, assertNumeric,       ║
// ║  getDataEngineVersion, getAvailableMonths, amortizationMonths, ║
// ║  readDebtExportMeta, computeDebtBaseline, getLOCCapacity,      ║
// ║  getCashFlowForecast                                          ║
// ╚══════════════════════════════════════════════════════════════════╝
/**
 * Calculate what fraction of each month falls within the date range.
 * Returns { '2026-01': 1.0, '2026-02': 0.5, ... }
 */
function getMonthFractions(startDate, endDate) {
  var fractions = {};
  var cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor <= endDate) {
    var y = cursor.getFullYear();
    var m = cursor.getMonth();
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var monthStart = new Date(y, m, 1);
    var monthEnd = new Date(y, m, daysInMonth, 23, 59, 59);
    var rangeStart = startDate > monthStart ? startDate : monthStart;
    var rangeEnd = endDate < monthEnd ? endDate : monthEnd;
    var coveredDays = Math.floor((rangeEnd - rangeStart) / 86400000) + 1;
    var fraction = Math.min(1, Math.max(0, coveredDays / daysInMonth));
    var ym = y + '-' + leftPad2_(m + 1);
    fractions[ym] = fraction;
    cursor = new Date(y, m + 1, 1);
  }

  return fractions;
}


/**
 * Format a date value (Date object or string) to YYYY-MM-DD
 */
function formatDate(d) {
  if (!d) return null;
  if (typeof d === 'string') return d;
  if (d instanceof Date) {
    return d.getFullYear() + '-' + leftPad2_(d.getMonth() + 1) + '-' + leftPad2_(d.getDate());
  }
  return String(d);
}


/**
 * Round to N decimal places
 */
function roundTo(n, places) {
  var f = Math.pow(10, places);
  return Math.round(n * f) / f;
}
/**
 * Assert that a value is numeric — logs a warning and returns 0 if not.
 */
function assertNumeric(x, fieldName) {
  var n = parseFloat(x);
  if (isNaN(n)) {
    Logger.log('\u26a0\ufe0f assertNumeric: non-numeric value' + (fieldName ? ' for "' + fieldName + '"' : '') + ': ' + JSON.stringify(x));
    return 0;
  }
  return n;
}


/**
 * Get list of available months from Budget_Data (for dropdown population)
 */
function getAvailableMonths() {
  var budData = de_readSheet_('Budget_Data');
  if (!budData || budData.length < 2) return [];
  var months = {};
  var MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  for (var i = 1; i < budData.length; i++) {
    var ym = budData[i][1];
    if (!ym || months[ym]) continue;
    var parts = String(ym).split('-');
    var y = parseInt(parts[0]);
    var m = parseInt(parts[1]);
    months[ym] = {
      yearMonth: ym,
      label: MONTH_NAMES[m - 1] + ' ' + y,
      start: ym + '-01',
      end: ym + '-' + new Date(y, m, 0).getDate()
    };
  }

  return Object.values(months).sort(function(a, b) {
    return a.yearMonth < b.yearMonth ? -1 : 1;
  });
}


/**
 * Calculate months to pay off a loan using amortization.
 */
function amortizationMonths(balance, apr, payment) {
  if (!balance || balance <= 0 || !payment || payment <= 0) return 0;
  if (!apr || apr <= 0) return Math.ceil(balance / payment);
  var r = apr / 12;
  var monthlyInterest = balance * r;
  if (payment <= monthlyInterest) return Infinity;
  var n = -Math.log(1 - (r * balance / payment)) / Math.log(1 + r);
  return Math.ceil(n);
}


/**
 * Read a named value from Debt_Export SUMMARY METRICS section.
 */
function readDebtExportMeta(key) {
  var data = de_readSheet_('Debt_Export');
  if (!data || data.length < 2) return null;
  var inSummary = false;
  for (var r = 0; r < data.length; r++) {
    var cellA = String(data[r][0] || '').trim();
    if (cellA.indexOf('SUMMARY') >= 0) { inSummary = true; continue; }
    if (!inSummary) continue;
    if (cellA === key) {
      var val = data[r][1];
      if (val instanceof Date) {
        return Utilities.formatDate(val, Session.getScriptTimeZone(), 'MMM yyyy');
      }
      if (typeof val === 'string') val = val.replace(/^["']|["']$/g, '');
      return val;
    }
  }
  return null;
}


/**
 * Compute non-mortgage debt baseline from Balance History.
 * v22 FIX: Three bugs caused $299K → $242K regression — all fixed.
 * See v22 changelog for details.
 */
function computeDebtBaseline() {
  // v73: Use cached reads when called within getData() scope
  // ── v28 PRIMARY: Iterate Close History for January 2026 (not hardcoded row) ──
  var chData = de_readSheet_('Close History');
  if (chData && chData.length > 1) {
    for (var r = 1; r < chData.length; r++) {
      var monthStr = String(chData[r][0] || '').trim().toLowerCase();
      if (monthStr.indexOf('jan') >= 0 && monthStr.indexOf('2026') >= 0) {
        var baseline = parseFloat(chData[r][7]);
        if (baseline > 0) {
          Logger.log('computeDebtBaseline: $' + Math.round(baseline) + ' from Close History row ' + (r+1) + ' (Jan 2026)');
          return roundTo(baseline, 2);
        }
      }
    }
    Logger.log('\u26a0\ufe0f computeDebtBaseline: Jan 2026 not found or zero in Close History \u2014 falling back to Balance History scan');
  } else {
    Logger.log('\u26a0\ufe0f computeDebtBaseline: Close History sheet not found \u2014 falling back to Balance History scan');
  }

  // ── FALLBACK: Balance History scan (original v22-v26 logic) ──
  var dmData = de_readSheet_('DebtModel');
  if (!dmData || dmData.length < 2) {
    Logger.log('\u26a0\ufe0f computeDebtBaseline: DebtModel sheet not found');
    return 0;
  }
  var headerRow = -1;
  for (var i = 0; i < Math.min(dmData.length, 10); i++) {
    if (String(dmData[i][0]).trim() === 'Account') { headerRow = i; break; }
  }
  if (headerRow < 0) {
    Logger.log('\u26a0\ufe0f computeDebtBaseline: No header row found in DebtModel');
    return 0;
  }
  var trackedNames = {};
  for (var i = headerRow + 2; i < dmData.length; i++) {
    var acct = String(dmData[i][0] || '').trim();
    if (!acct || acct.indexOf('\u2193') >= 0) continue;
    var tillerName = String(dmData[i][14] || '').trim();
    if (tillerName) trackedNames[tillerName] = true;
    if (acct) trackedNames[acct] = true;
  }
  var bhData = de_readSheet_('Balance History');
  if (!bhData || bhData.length < 2) {
    Logger.log('\u26a0\ufe0f computeDebtBaseline: Balance History sheet not found');
    return 0;
  }
  var windowStart = new Date('2025-12-15T00:00:00');
  var windowEnd = new Date('2026-01-31T23:59:59');
  var latestByAcct = {};
  for (var h = 1; h < bhData.length; h++) {
    var bhDate = bhData[h][1];
    var bhAcct = bhData[h][3];
    var bhBal = bhData[h][8];
    var bhClass = bhData[h][12];
    if (!bhDate || !bhAcct) continue;
    if (typeof bhDate === 'string') bhDate = new Date(bhDate);
    if (!(bhDate instanceof Date) || isNaN(bhDate.getTime())) continue;
    if (bhDate < windowStart || bhDate > windowEnd) continue;
    if (bhClass !== 'Liability') continue;
    var acctName = String(bhAcct).trim();
    if (!trackedNames[acctName]) continue;
    var bal = Math.abs(parseFloat(bhBal) || 0);
    if (!latestByAcct[acctName] || bhDate >= latestByAcct[acctName].date) {
      latestByAcct[acctName] = { balance: bal, date: bhDate };
    }
  }
  var total = 0;
  var count = 0;
  for (var a in latestByAcct) {
    total += latestByAcct[a].balance;
    count++;
  }
  if (total <= 0) {
    Logger.log('\u26a0\ufe0f computeDebtBaseline: No matching accounts. TrackedNames: ' + Object.keys(trackedNames).length);
    return 0;
  }
  Logger.log('\u26a0\ufe0f computeDebtBaseline: $' + Math.round(total) + ' from ' + count + ' accounts (FALLBACK \u2014 Close History was unavailable)');
  return roundTo(total, 2);
}


/**
 * v19: LOC Bridge Capacity Tracker.
 */
function getLOCCapacity() {
  var now = new Date();

  var dxData = de_readSheet_('Debt_Export');
  if (!dxData || dxData.length < 2) return _emptyLOCCapacity();
  var dxHeaders = [];
  var foundHeader = false;
  var locAccounts = [];
  var LOC_NAMES = ['LT-LOC', 'JT-LOC'];

  for (var d = 0; d < dxData.length; d++) {
    var cellA = String(dxData[d][0] || '').trim();
    if (cellA === 'name' && !foundHeader) { dxHeaders = dxData[d]; foundHeader = true; continue; }
    if (!foundHeader) continue;
    if (cellA.indexOf('EXCLUDED') >= 0 || cellA.indexOf('SUMMARY') >= 0) break;
    if (!cellA) continue;
    var isLOC = false;
    for (var ln = 0; ln < LOC_NAMES.length; ln++) {
      if (cellA.indexOf(LOC_NAMES[ln]) >= 0) { isLOC = true; break; }
    }
    if (!isLOC) continue;
    var dRow = {};
    for (var dc = 0; dc < dxHeaders.length; dc++) { if (dxHeaders[dc]) dRow[dxHeaders[dc]] = dxData[d][dc]; }
    var bal = parseFloat(dRow['balance']) || 0;
    var lim = parseFloat(dRow['limit']) || 0;
    var apr = parseFloat(dRow['apr']) || 0;
    var avail = Math.max(0, lim - bal);
    locAccounts.push({
      name: cellA,
      balance: roundTo(bal, 2),
      limit: roundTo(lim, 2),
      available: roundTo(avail, 2),
      apr: apr,
      pctUsed: lim > 0 ? roundTo((bal / lim) * 100, 1) : 100
    });
  }

  var totalLimit = 0, totalUsed = 0;
  for (var a = 0; a < locAccounts.length; a++) {
    totalLimit += locAccounts[a].limit;
    totalUsed += locAccounts[a].balance;
  }
  var totalAvailable = Math.max(0, totalLimit - totalUsed);
  var capacityPct = totalLimit > 0 ? roundTo((totalAvailable / totalLimit) * 100, 1) : 0;

  var txData = de_readSheet_('Transactions');
  var drawsByMonth = {};

  for (var t = 1; t < txData.length; t++) {
    var txDate = txData[t][1];
    var txCat = String(txData[t][3] || '').trim();
    var txAmt = parseFloat(txData[t][4]) || 0;
    if (txCat !== 'Loan Proceeds' || txAmt <= 0) continue;
    if (!txDate) continue;
    if (typeof txDate === 'string') txDate = new Date(txDate);
    if (!(txDate instanceof Date) || isNaN(txDate.getTime())) continue;
    var ym = txDate.getFullYear() + '-' + leftPad2_(txDate.getMonth() + 1);
    if (!drawsByMonth[ym]) drawsByMonth[ym] = 0;
    drawsByMonth[ym] += txAmt;
  }

  var MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var drawHistory = [];
  var sortedYMs = Object.keys(drawsByMonth).sort();
  for (var s = 0; s < sortedYMs.length; s++) {
    var ym = sortedYMs[s];
    var parts = ym.split('-');
    var label = MONTH_NAMES[parseInt(parts[1]) - 1] + ' ' + parts[0];
    drawHistory.push({ ym: ym, label: label, amount: roundTo(drawsByMonth[ym], 2) });
  }

  var currentYM = now.getFullYear() + '-' + leftPad2_(now.getMonth() + 1);
  var recentDraws = [];
  for (var r = drawHistory.length - 1; r >= 0 && recentDraws.length < 3; r--) {
    if (drawHistory[r].ym === currentYM) continue;
    recentDraws.push(drawHistory[r].amount);
  }

  var currentMonthDraw = drawsByMonth[currentYM] || 0;
  var dayOfMonth = now.getDate();
  var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  var avgMonthlyDraw = 0;
  if (recentDraws.length > 0) {
    var sum = 0;
    for (var rd = 0; rd < recentDraws.length; rd++) sum += recentDraws[rd];
    avgMonthlyDraw = roundTo(sum / recentDraws.length, 2);
  } else if (currentMonthDraw > 0 && dayOfMonth >= 7) {
    avgMonthlyDraw = roundTo((currentMonthDraw / dayOfMonth) * daysInMonth, 2);
  }

  var projectedDepletionDate = null;
  var daysRemaining = null;

  if (avgMonthlyDraw > 0 && totalAvailable > 0) {
    var monthsRemaining = totalAvailable / avgMonthlyDraw;
    daysRemaining = Math.round(monthsRemaining * 30.44);
    var depDate = new Date(now);
    depDate.setDate(depDate.getDate() + daysRemaining);
    projectedDepletionDate = formatDate(depDate);
  } else if (totalAvailable <= 0) {
    daysRemaining = 0;
    projectedDepletionDate = formatDate(now);
  }

  var warning = 'green';
  if (totalAvailable <= 0) {
    warning = 'exhausted';
  } else if (daysRemaining !== null && daysRemaining <= 14) {
    warning = 'red';
  } else if (daysRemaining !== null && daysRemaining <= 30) {
    warning = 'yellow';
  } else if (capacityPct < 10) {
    warning = 'red';
  } else if (capacityPct < 25) {
    warning = 'yellow';
  }

  return {
    accounts: locAccounts,
    totalAvailable: roundTo(totalAvailable, 2),
    totalLimit: roundTo(totalLimit, 2),
    totalUsed: roundTo(totalUsed, 2),
    capacityPct: capacityPct,
    drawHistory: drawHistory,
    currentMonthDraw: roundTo(currentMonthDraw, 2),
    avgMonthlyDraw: avgMonthlyDraw,
    projectedDepletionDate: projectedDepletionDate,
    daysRemaining: daysRemaining,
    warning: warning,
    asOf: formatDate(now)
  };
}

function _emptyLOCCapacity() {
  return {
    accounts: [], totalAvailable: 0, totalLimit: 0, totalUsed: 0,
    capacityPct: 0, drawHistory: [], currentMonthDraw: 0, avgMonthlyDraw: 0,
    projectedDepletionDate: null, daysRemaining: null, warning: 'exhausted',
    asOf: formatDate(new Date())
  };
}

function getLOCCapacitySafe() {
  try {
    return JSON.parse(JSON.stringify(getLOCCapacity()));
  } catch(e) {
    Logger.log('getLOCCapacity error: ' + e.message);
    return _emptyLOCCapacity();
  }
}


/**
 * Read WeeklyCashMap pickup cells by column-A label scan.
 */
function de_getWeeklyCashMapMetrics_(ss) {
  var empty = {
    weeklyCashMin: null,
    pinchPointDate: null,
    weeksOfRunway: null,
    honestWeeklyBurn: null,
    honestMonthlyDeficit: null
  };
  try {
    var data = de_readSheet_('WCM');
    if (!data || data.length < 1) return empty;
    var pickup = {};
    var KEYS = ['weeklyCashMin','pinchPointDate','weeksOfRunway','honestWeeklyBurn','honestMonthlyDeficit'];
    for (var i = 0; i < data.length; i++) {
      var label = String(data[i][0] || '').trim();
      if (KEYS.indexOf(label) > -1) {
        pickup[label] = data[i][1];
      }
    }
    function _num(val, places) {
      var n = parseFloat(val);
      return isNaN(n) ? null : roundTo(n, places);
    }
    var _pinch = pickup.pinchPointDate;
    return {
      weeklyCashMin: _num(pickup.weeklyCashMin, 2),
      pinchPointDate: _pinch instanceof Date ? formatDate(_pinch) : (_pinch || null),
      weeksOfRunway: (function(val) {
        var n = parseFloat(val);
        return isNaN(n) ? null : Math.round(n);
      })(pickup.weeksOfRunway),
      honestWeeklyBurn: _num(pickup.honestWeeklyBurn, 2),
      honestMonthlyDeficit: _num(pickup.honestMonthlyDeficit, 2)
    };
  } catch (e) {
    return empty;
  }
}


/**
 * Get Cash Flow Forecast data for 2026-2027.
 */
function getCashFlowForecast() {
  // v73: Activate cache if not already active (standalone calls)
  var _cacheOwner = !_deCache;
  if (_cacheOwner) _deCache = {};
  try {
  var budData = de_readSheet_('Budget_Data');
  if (!budData || budData.length < 2) return { error: 'Budget_Data empty' };
  var monthBudgets = {};
  for (var b = 1; b < budData.length; b++) {
    var ym = String(budData[b][1] || '');
    var cat = String(budData[b][2] || '');
    var amt = parseFloat(budData[b][4]) || 0;
    if (!ym || !cat) continue;
    if (!monthBudgets[ym]) monthBudgets[ym] = {};
    monthBudgets[ym][cat] = amt;
  }

  var dxData = de_readSheet_('Debt_Export');
  var debts = {};
  if (dxData && dxData.length > 0) {
    var dxHeaders = [], foundHeader = false, foundData = false;
    for (var d = 0; d < dxData.length; d++) {
      var cellA = String(dxData[d][0] || '').trim();
      if (cellA === 'name' && !foundHeader) { dxHeaders = dxData[d]; foundHeader = true; continue; }
      if (!foundHeader) continue;
      if (!cellA) { if (foundData) break; continue; }
      if (cellA.indexOf('EXCLUDED') >= 0 || cellA.indexOf('SUMMARY') >= 0) break;
      foundData = true;
      var dRow = {};
      for (var dc = 0; dc < dxHeaders.length; dc++) { if (dxHeaders[dc]) dRow[dxHeaders[dc]] = dxData[d][dc]; }
      debts[dRow['name']] = dRow;
    }
  }

  // v29 FIX: Match actual Debt_Export names (was 'SoFi Loan 1301 (JT)' / 'SoFi Loan 4474 (LT)')
  var sofiJT = debts['JT Sofi'] || {};
  var sofiLT = debts['LT Sofi'] || {};

  var sofiJTMonths = amortizationMonths(parseFloat(sofiJT['balance'])||0, parseFloat(sofiJT['apr'])||0, parseFloat(sofiJT['minPayment'])||0);
  var sofiLTMonths = amortizationMonths(parseFloat(sofiLT['balance'])||0, parseFloat(sofiLT['apr'])||0, parseFloat(sofiLT['minPayment'])||0);

  var now = new Date();
  var sofiJTPayoff = new Date(now.getFullYear(), now.getMonth() + sofiJTMonths, 1);
  var sofiLTPayoff = new Date(now.getFullYear(), now.getMonth() + sofiLTMonths, 1);

  var txData = de_readSheet_('Transactions');
  var catData = de_readSheet_('Categories');
  var catMap = {};
  for (var i = 1; i < catData.length; i++) {
    var cn = catData[i][0], ct = catData[i][2];
    if (cn) catMap[cn] = { type: ct };
  }

  var EARNED_CATS = ['JT Income', 'LT Income', 'Bonus Income', 'Other Income', 'Interest Income'];
  var XFER_CATS = ['Transfer: Internal', 'Transfer: LOC Draw', 'Balance Transfers',
    'CC Payment', 'LOC Payment', 'Loan Payment', 'Investment', 'Payroll Deduction', 'Duplicate - Exclude', 'Debt Offset'];

  var monthActuals = {};
  for (var t = 1; t < txData.length; t++) {
    var txDate = txData[t][1], txCat = txData[t][3], txAmt = parseFloat(txData[t][4]) || 0;
    if (!txDate || !txCat) continue;
    if (typeof txDate === 'string') txDate = new Date(txDate);
    if (!(txDate instanceof Date) || isNaN(txDate.getTime())) continue;
    var ym = txDate.getFullYear() + '-' + leftPad2_(txDate.getMonth() + 1);
    if (!monthActuals[ym]) monthActuals[ym] = { income: 0, opex: 0 };
    if (EARNED_CATS.indexOf(txCat) >= 0 && txAmt > 0) monthActuals[ym].income += txAmt;
    if (txAmt < 0 && XFER_CATS.indexOf(txCat) < 0) monthActuals[ym].opex += Math.abs(txAmt);
  }

  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var dec2026 = monthBudgets['2026-12'] || {};
  var currentMonth = now.getFullYear() + '-' + leftPad2_(now.getMonth() + 1);

  // v30 FIX: Budget_Data stores ALL amounts as positive. Must use category name to determine income vs expense.
  var CFF_INCOME_CATS = ['JT Income', 'LT Income', 'Bonus Income', 'Other Income', 'Interest Income', 'Loan Proceeds'];
  var CFF_XFER_CATS = ['Transfer: Internal', 'Transfer: LOC Draw', 'Balance Transfers',
    'CC Payment', 'LOC Payment', 'Loan Payment', 'Investment', 'Payroll Deduction', 'Duplicate - Exclude', 'Debt Offset'];

  function cffSplitBudget(budgetMonth) {
    var inc = 0, exp = 0;
    for (var c in budgetMonth) {
      var a = budgetMonth[c];
      if (CFF_INCOME_CATS.indexOf(c) >= 0) {
        inc += a;
      } else if (CFF_XFER_CATS.indexOf(c) < 0 && a > 0) {
        exp -= a; // Convert positive budget amount to negative expense
      }
    }
    return { income: inc, expenses: exp };
  }

  var baseIncome = 0, baseExpense = 0;
  var baseSplit = cffSplitBudget(dec2026);
  baseIncome = baseSplit.income;
  baseExpense = baseSplit.expenses;
  // v26: If dec 2026 is empty, scan backward for last populated month
  if (baseIncome === 0 || baseExpense === 0) {
    for (var _fb = 11; _fb >= 0; _fb--) {
      var _fbYM = '2026-' + leftPad2_(_fb + 1);
      if (monthBudgets[_fbYM]) {
        var _fbSplit = cffSplitBudget(monthBudgets[_fbYM]);
        if (baseIncome === 0 && _fbSplit.income > 0) baseIncome = _fbSplit.income;
        if (baseExpense === 0 && _fbSplit.expenses < 0) baseExpense = _fbSplit.expenses;
        if (baseIncome > 0 && baseExpense < 0) break;
      }
    }
  }

  var months = [];
  var cumulative = 0;
  var cashPositiveYM = null;
  // v46 FIX #5b: Read childcare drop date/amount from Debt_Export SUMMARY
  var _childcareDropAmt = parseFloat(readDebtExportMeta('childcareDropAmount')) || 0;
  var _childcareDropYM = String(readDebtExportMeta('childcareDropDate') || '2027-09');
  var _childcareDropYr = parseInt(_childcareDropYM.split('-')[0]) || 2027;
  var _childcareDropMo = parseInt(_childcareDropYM.split('-')[1]) || 9;

  for (var yr = 2026; yr <= 2027; yr++) {
    for (var mo = 1; mo <= 12; mo++) {
      var ym = yr + '-' + leftPad2_(mo);
      var label = MONTHS[mo - 1] + ' ' + yr;
      var projDate = new Date(yr, mo - 1, 15);
      var events = [];
      var income, expenses;

      if (monthActuals[ym] && ym < currentMonth) {
        income = monthActuals[ym].income;
        expenses = -monthActuals[ym].opex;
      } else if (monthBudgets[ym]) {
        var _mSplit = cffSplitBudget(monthBudgets[ym]);
        income = _mSplit.income;
        expenses = _mSplit.expenses;
      } else {
        income = baseIncome;
        expenses = baseExpense;
        if (projDate >= sofiJTPayoff) {
          // v46 FIX #5a: Kill || 1634 hardcode — NaN check, 0 if missing
          var sofiJTPmt = parseFloat(sofiJT['minPayment']) || 0;
          if (sofiJTPmt > 0) {
            expenses += sofiJTPmt;
            events.push('SoFi JT paid off \u2192 +$' + Math.round(sofiJTPmt) + '/mo');
          }
        }
        // v46 FIX #5b: Read childcare drop from Debt_Export SUMMARY
        if (yr > _childcareDropYr || (yr === _childcareDropYr && mo >= _childcareDropMo)) {
          if (_childcareDropAmt > 0) {
            expenses += _childcareDropAmt;
            events.push('Childcare drops \u2192 +$' + Math.round(_childcareDropAmt) + '/mo');
          }
        }
      }

      var net = income + expenses;
      cumulative += net;
      if (!cashPositiveYM && net > 0 && ym >= '2027-01') cashPositiveYM = ym;

      months.push({ ym: ym, label: label, income: Math.round(income), expenses: Math.round(expenses), net: Math.round(net), cumulative: Math.round(cumulative), events: events });
    }
  }

  return {
    months: months,
    sofiJTPayoff: sofiJTPayoff.getFullYear() + '-' + leftPad2_(sofiJTPayoff.getMonth() + 1),
    sofiLTPayoff: sofiLTPayoff.getFullYear() + '-' + leftPad2_(sofiLTPayoff.getMonth() + 1),
    cashPositiveYM: cashPositiveYM,
    // v26: Server-canonical cash-flow-positive date — kills hardcoded childcareDrop in WT/DS
    cashFlowPositiveDate: cashPositiveYM ? cashPositiveYM + '-01' : null,
    sofiJTMonths: sofiJTMonths,
    sofiLTMonths: sofiLTMonths,
    locCapacity: getLOCCapacity(),
    _meta: de_buildMeta_('forecast', '2026-2027')
  };
  } finally {
    if (_cacheOwner) { _deCache = null; _deSS = null; }
  }
}


// ════════════════════════════════════════════════════════════════════
// ROUTING: See Code.gs — doGet() handles HTML pages + data API
// DO NOT add a doGet() in this file — it will conflict with Code.gs
// ════════════════════════════════════════════════════════════════════// 
// ════════════════════════════════════════════════════════════════════
// ██  CHUNK 3 — SIMULATOR + WEEKLY TRACKER + META + VERIFY
// ██  parseDebtExport()      — v21 Wave 6: promoAction added
// ██  getSimulatorData()     — v21 Wave 4: budgetBreathingRoom added
// ██  getWeeklyTrackerData() — unchanged from v19
// ██  de_buildMeta_() + de_computeInterestBurn_() + verify functions
// ════════════════════════════════════════════════════════════════════


/**
 * Parse Debt_Export sheet into { active, excluded } arrays.
 * v21 Wave 6: adds promoAction field (reads Debt_Export col V / DebtModel col V).
 */
function parseDebtExport() {
  var dxData = de_readSheet_('Debt_Export');
  if (!dxData || dxData.length < 2) return { active: [], excluded: [], summary: {} };
  var dxHeaders = [];
  var foundHeader = false;
  var inExcluded = false;
  var inSummary = false;
  var active = [];
  var excluded = [];
  var summary = {};

  for (var d = 0; d < dxData.length; d++) {
    var cellA = String(dxData[d][0] || '').trim();

    if (cellA === 'name' && !foundHeader) {
      dxHeaders = dxData[d];
      foundHeader = true;
      continue;
    }
    if (!foundHeader) continue;
    // v42 FIX: Skip repeat 'name' header rows (EXCLUDED section header leaks through).
    // getData() already has this guard — parseDebtExport() was missing it.
    // Without it, 'name' row parses as a debt with name='name', min=$0.
    if (cellA === 'name') continue;

    if (cellA.indexOf('EXCLUDED') >= 0) { inExcluded = true; inSummary = false; continue; }
    if (cellA.indexOf('SUMMARY') >= 0) { inSummary = true; inExcluded = false; continue; }

    if (inSummary) {
      if (cellA) summary[cellA] = dxData[d][1];
      continue;
    }

    if (!cellA) continue;

    var dRow = {};
    for (var dc = 0; dc < dxHeaders.length; dc++) {
      if (dxHeaders[dc]) dRow[dxHeaders[dc]] = dxData[d][dc];
    }

    var bal = parseFloat(dRow['balance']) || 0;
    if (bal <= 0.01 && !inExcluded) continue;

    var promoAPR = (dRow['promoAPR'] !== undefined && dRow['promoAPR'] !== '') ? parseFloat(dRow['promoAPR']) : null;
    var promoEnd = (dRow['promoExpires'] && String(dRow['promoExpires']).trim() !== '')
      ? formatDate(dRow['promoExpires']) : null;

    var obj = {
      name:       dRow['name'] || '',
      balance:    bal,
      apr:        parseFloat(dRow['apr']) || 0,
      min:        parseFloat(dRow['minPayment']) || 0,
      promoAPR:   promoAPR,
      promoEnd:   promoEnd,
      type:       dRow['type'] || '',
      strategy:   dRow['strategy'] || 'Minimum',
      priority:   parseInt(dRow['priority']) || 99,
      limit:      dRow['limit'] ? parseFloat(dRow['limit']) : null,
      payoffDate: dRow['payoffDate'] || null,
      promoAction: dRow['promoAction'] || null
    };

    // v16: Dynamic CC minimum calculation
    if (obj.type === 'revolving' && bal > 0.01) {
      var now = new Date();
      var isPromoActive = (promoAPR !== null && promoEnd && new Date(promoEnd) > now);
      var effectiveAPR = isPromoActive ? promoAPR : obj.apr;
      var monthlyRate = effectiveAPR / 12;
      var calcMin = Math.max(bal * 0.01 + bal * monthlyRate, 25);
      calcMin = Math.round(calcMin * 100) / 100;
      var storedMin = parseFloat(dRow['minPayment']) || 0;
      obj.minStored = storedMin;
      obj.min = calcMin;
      obj.minDrift = Math.abs(calcMin - storedMin) > 25 ? Math.round((calcMin - storedMin) * 100) / 100 : 0;
    } else if (bal <= 0.01) {
      obj.min = 0;
      obj.minStored = parseFloat(dRow['minPayment']) || 0;
      obj.minDrift = 0;
    }

    if (inExcluded) {
      excluded.push(obj);
    } else {
      active.push(obj);
    }
  }

  return { active: active, excluded: excluded };
}


/**
 * Current mortgage balance for grouped debt visuals.
 * Largest liability over $100K not already represented in Debt_Export.
 */
function de_getCurrentMortgageBalance_() {
  var parsed = parseDebtExport();
  var tracked = {};
  parsed.active.concat(parsed.excluded).forEach(function(d) {
    var name = String(d.name || '').trim();
    if (name) tracked[name] = true;
  });

  var bhData = de_readSheet_('Balance History');
  if (!bhData || bhData.length < 2) return 0;
  var latestBal = {};
  for (var i = 1; i < bhData.length; i++) {
    var bhDate = bhData[i][1];
    var bhAcct = bhData[i][3];
    var bhBal = bhData[i][8];
    var bhClass = bhData[i][12];
    if (!bhDate || !bhAcct) continue;
    if (typeof bhDate === 'string') bhDate = new Date(bhDate);
    if (!(bhDate instanceof Date) || isNaN(bhDate.getTime())) continue;
    if (!latestBal[bhAcct] || bhDate >= latestBal[bhAcct].date) {
      latestBal[bhAcct] = { balance: parseFloat(bhBal) || 0, date: bhDate, cls: bhClass };
    }
  }

  var mortgageBalance = 0;
  for (var acct in latestBal) {
    var entry = latestBal[acct];
    if (entry.cls !== 'Liability') continue;
    if (tracked[acct]) continue;
    var absBal = Math.abs(entry.balance || 0);
    if (absBal <= 100000) continue;
    if (absBal > mortgageBalance) mortgageBalance = absBal;
  }
  return roundTo(mortgageBalance, 2);
}

/**
 * Group debt balances for Spine/Soul v12 grouped waterfall visuals.
 * Returns [{ type, total, count, accounts }].
 */
function de_getDebtByType_(activeDebts, excludedDebts, mortgageBalance) {
  var allDebts = (activeDebts || []).concat(excludedDebts || []);
  var orderedTypes = [
    'Mortgage',
    'Personal Loans',
    'Credit Cards',
    'Student Loans',
    'Lines of Credit',
    'Auto',
    'Solar'
  ];
  var groups = {};
  orderedTypes.forEach(function(type) {
    groups[type] = { type: type, total: 0, count: 0, accounts: [] };
  });

  function addToGroup(type, debtObj, name, balance) {
    if (!groups[type]) return;
    var absBal = roundTo(Math.abs(parseFloat(balance) || 0), 2);
    if (absBal <= 0) return;
    groups[type].total += absBal;
    var isDupe = false;
    for (var gi = 0; gi < groups[type].accounts.length; gi++) {
      if (groups[type].accounts[gi].name === name) { isDupe = true; break; }
    }
    if (!isDupe) {
      groups[type].accounts.push({
        name: name,
        balance: absBal,
        apr: debtObj ? (debtObj.apr || 0) : 0,
        min: debtObj ? (debtObj.min || 0) : 0,
        strategy: debtObj ? (debtObj.strategy || 'Minimum') : 'Minimum',
        promo: debtObj ? (debtObj.promoAPR != null ? debtObj.promoAPR : null) : null,
        promoEnd: debtObj ? (debtObj.promoEnd || null) : null,
        excluded: debtObj ? (!!debtObj.excluded) : false
      });
      groups[type].count = groups[type].accounts.length;
    }
  }

  if ((parseFloat(mortgageBalance) || 0) > 0) {
    addToGroup('Mortgage', null, 'Mortgage', mortgageBalance);
  }

  for (var i = 0; i < allDebts.length; i++) {
    var debt = allDebts[i] || {};
    var name = String(debt.name || '').trim();
    var nameRaw = name.toLowerCase();
    var typeRaw = String(debt.type || '').toLowerCase();
    var bucket = null;

    if (/student/.test(typeRaw) || /nelnet|sloan|student/.test(nameRaw)) {
      bucket = 'Student Loans';
    } else if (/loc|line of credit/.test(typeRaw) || /lt-?loc|jt-?loc|x8840|x4540/.test(nameRaw)) {
      bucket = 'Lines of Credit';
    } else if (/auto/.test(typeRaw) || /telluride/.test(nameRaw)) {
      bucket = 'Auto';
    } else if (/solar/.test(typeRaw) || /solar/.test(nameRaw)) {
      bucket = 'Solar';
    } else if (/revolving|credit/.test(typeRaw) || /visa|citi|discover|chase|southwest|sapphire|prime visa|boa|bank of america|barclay|comenity|nfm|umb|cacu|card/.test(nameRaw)) {
      bucket = 'Credit Cards';
    } else if (/mortgage/.test(typeRaw) || /mortgage|amerisave/.test(nameRaw)) {
      bucket = 'Mortgage';
    } else if (/personal/.test(typeRaw) || /sofi|personal loan|loan/.test(nameRaw)) {
      bucket = 'Personal Loans';
    } else {
      bucket = 'Personal Loans';
    }

    addToGroup(bucket, debt, name, debt.balance);
  }

  var result = [];
  for (var j = 0; j < orderedTypes.length; j++) {
    var grouped = groups[orderedTypes[j]];
    if (grouped.total <= 0) continue;
    grouped.total = roundTo(grouped.total, 2);
    grouped.accounts.sort();
    grouped.count = grouped.accounts.length;
    result.push(grouped);
  }
  return result;
}

/**
 * getPartnerBucketMap() — v17
 */
function getPartnerBucketMap() {
  var data = de_readSheet_('Budget_Data');
  if (!data || data.length < 2) return {};
  var headers = data[0].map(function(h) { return String(h).trim(); });
  var catIdx = headers.indexOf('Category');
  var bucketIdx = headers.indexOf('PartnerBucket');
  if (catIdx < 0 || bucketIdx < 0) return {};
  var map = {};
  for (var i = 1; i < data.length; i++) {
    var cat = String(data[i][catIdx] || '').trim();
    var bucket = String(data[i][bucketIdx] || '').trim();
    if (cat && bucket) map[cat] = bucket;
  }
  return map;
}


/**
 * getSimulatorData()
 * v21 Wave 4: adds budgetBreathingRoom.
 */
function getSimulatorData() {
  // v73: Activate cache
  var _cacheOwner = !_deCache;
  if (_cacheOwner) _deCache = {};
  try {
  var ss = getDESS_();
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth(); // 0-indexed
  var ym = y + '-' + leftPad2_(m + 1);

  var partnerBucketMap = getPartnerBucketMap();
  var BUCKET_KEYS = {
    'Fixed Expenses': 'fixedExpenses',
    'Necessary Living': 'necessaryLiving',
    'Discretionary': 'discretionary',
    'Debt Cost': 'debtCost',
    'Debt Payments': 'debtPayments',
    'Income': 'income',
    'Transfer': 'transfer'
  };

  var deParsed = parseDebtExport();
  var activeDebts = deParsed.active;
  var excludedDebts = deParsed.excluded;

  var totalMinimums = 0;
  for (var i = 0; i < activeDebts.length; i++) {
    totalMinimums += activeDebts[i].min || 0;
  }
  // v38: Include excluded debt minimums — total household obligation
  for (var ix = 0; ix < excludedDebts.length; ix++) {
    totalMinimums += excludedDebts[ix].min || 0;
  }

  var EARNED_INCOME_CATS_SIM = ['JT Income', 'LT Income', 'Bonus Income', 'Other Income', 'Interest Income'];
  var txData = de_readSheet_('Transactions');
  var monthStart = new Date(y, m, 1);
  var monthEnd = new Date(y, m + 1, 0, 23, 59, 59);
  var earnedIncome = 0;
  // v30: Track income by source for expandable income bucket
  var incomeBySource = {};
  for (var _ic = 0; _ic < EARNED_INCOME_CATS_SIM.length; _ic++) incomeBySource[EARNED_INCOME_CATS_SIM[_ic]] = 0;
  var loanProceedsTotal = 0;

  for (var t = 1; t < txData.length; t++) {
    var txDate = txData[t][1];
    var txCat = String(txData[t][3] || '').trim();
    var txAmt = parseFloat(txData[t][4]) || 0;
    if (!txDate || !txCat) continue;
    if (typeof txDate === 'string') txDate = new Date(txDate);
    if (!(txDate instanceof Date) || isNaN(txDate.getTime())) continue;
    if (txDate < monthStart || txDate > monthEnd) continue;
    if (EARNED_INCOME_CATS_SIM.indexOf(txCat) >= 0 && txAmt > 0) {
      earnedIncome += txAmt;
      incomeBySource[txCat] = (incomeBySource[txCat] || 0) + txAmt;
    }
    if (txCat === 'Loan Proceeds' && txAmt > 0) {
      loanProceedsTotal += txAmt;
    }
  }

  var TRANSFER_CATS_SIM = [
    'Transfer: Internal', 'Transfer: LOC Draw', 'Balance Transfers',
    'CC Payment', 'LOC Payment', 'Loan Payment', 'Investment', 'Payroll Deduction',
    'Duplicate - Exclude', 'Debt Offset',
    // v34: Debt payment categories — tracked in debt minimums, NOT operating expenses
    'SoFi Loan', 'Auto Loan', 'Student Loans', 'Solar Panel'
  ];
  // v38: Track actual debt payments MTD (CC Payment + Loan Payment + DEBT_PAYMENT_CATS outflows)
  var DEBT_PAY_CATS_SIM = ['CC Payment', 'LOC Payment', 'Loan Payment', 'SoFi Loan', 'Auto Loan', 'Student Loans', 'Solar Panel'];
  var debtPaymentsMTD = 0;
  var debtPaymentDetail = {}; // v38: per-category breakdown for expandable dropdown
  // v49 FIX: LOC_MAP_SIM must be declared before loop — was inside CC Payment block,
  // causing TypeError if LOC Payment transaction processed before any CC Payment.
  var LOC_MAP_SIM = [[/x8840/,'LT-LOC'],[/x4540/,'JT-LOC'],[/lt.?loc/,'LT-LOC'],[/jt.?loc/,'JT-LOC']];
  var operatingExpenses = 0;
  var bucketTotals = { fixedExpenses: 0, necessaryLiving: 0, discretionary: 0, debtCost: 0, other: 0 };
  for (var t2 = 1; t2 < txData.length; t2++) {
    var txDate2 = txData[t2][1];
    var txCat2 = String(txData[t2][3] || '').trim();
    var txAmt2 = parseFloat(txData[t2][4]) || 0;
    if (!txDate2 || !txCat2) continue;
    if (typeof txDate2 === 'string') txDate2 = new Date(txDate2);
    if (!(txDate2 instanceof Date) || isNaN(txDate2.getTime())) continue;
    if (txDate2 < monthStart || txDate2 > monthEnd) continue;
    // v41: CC Payment split by card name parsed from description (col C).
    // Col F = source bank account (CC Checking) — not useful for card ID.
    // Col C ACH descriptions contain the payee name — map to clean labels.
    // x8840 = LT-LOC, x4540 = JT-LOC — these ARE debt payments, include them.
    if (txAmt2 < 0 && DEBT_PAY_CATS_SIM.indexOf(txCat2) >= 0) {
      debtPaymentsMTD += Math.abs(txAmt2);
      var dpKey;
      if (txCat2 === 'CC Payment') {
        var txDesc2 = String(txData[t2][2] || '').toLowerCase().trim();
        // v46 FIX #1: Use SHARED_CC_MAP (unified — 'CACU' canonical, not 'Community America')
        var CC_MAP = SHARED_CC_MAP;
        dpKey = 'CC Payment'; // fallback for unmapped
        for (var _cm = 0; _cm < CC_MAP.length; _cm++) {
          if (CC_MAP[_cm][0].test(txDesc2)) { dpKey = CC_MAP[_cm][1]; break; }
        }
        if (dpKey === null) continue; // skip credit-side transfers (positive amt already filtered above)
        if (!debtPaymentDetail.__ccAccounts) debtPaymentDetail.__ccAccounts = [];
        if (debtPaymentDetail.__ccAccounts.indexOf(dpKey) < 0) debtPaymentDetail.__ccAccounts.push(dpKey);
        if (!debtPaymentDetail[dpKey]) debtPaymentDetail[dpKey] = 0;
        debtPaymentDetail[dpKey] += Math.abs(txAmt2);
      } else if (txCat2 === 'LOC Payment') {
        var txDesc2loc = String(txData[t2][2] || '').toLowerCase().trim();
        dpKey = 'LOC Payment';
        for (var _lm = 0; _lm < LOC_MAP_SIM.length; _lm++) {
          if (LOC_MAP_SIM[_lm][0].test(txDesc2loc)) { dpKey = LOC_MAP_SIM[_lm][1]; break; }
        }
        if (!debtPaymentDetail.__locAccounts) debtPaymentDetail.__locAccounts = [];
        if (debtPaymentDetail.__locAccounts.indexOf(dpKey) < 0) debtPaymentDetail.__locAccounts.push(dpKey);
        if (!debtPaymentDetail[dpKey]) debtPaymentDetail[dpKey] = 0;
        debtPaymentDetail[dpKey] += Math.abs(txAmt2);
      } else if (txCat2 === 'Loan Payment') {
        var txDescLoan = String(txData[t2][2] || '').toLowerCase().trim();
        dpKey = 'Loan Payment';
        for (var _lpm = 0; _lpm < LOAN_PAYMENT_MAP.length; _lpm++) {
          if (LOAN_PAYMENT_MAP[_lpm][0].test(txDescLoan)) { dpKey = LOAN_PAYMENT_MAP[_lpm][1]; break; }
        }
        if (dpKey === null) continue;
        if (!debtPaymentDetail.__loanAccounts) debtPaymentDetail.__loanAccounts = [];
        if (debtPaymentDetail.__loanAccounts.indexOf(dpKey) < 0) debtPaymentDetail.__loanAccounts.push(dpKey);
        if (!debtPaymentDetail[dpKey]) debtPaymentDetail[dpKey] = 0;
        debtPaymentDetail[dpKey] += Math.abs(txAmt2);
      } else {
        dpKey = txCat2;
        if (!debtPaymentDetail[dpKey]) debtPaymentDetail[dpKey] = 0;
        debtPaymentDetail[dpKey] += Math.abs(txAmt2);
      }
    }
    if (txAmt2 < 0 && TRANSFER_CATS_SIM.indexOf(txCat2) < 0) {
      operatingExpenses += Math.abs(txAmt2);
      var rawBucket = partnerBucketMap[txCat2] || '';
      var bKey = BUCKET_KEYS[rawBucket] || 'other';
      if (bucketTotals.hasOwnProperty(bKey)) {
        bucketTotals[bKey] += Math.abs(txAmt2);
      } else {
        bucketTotals.other += Math.abs(txAmt2);
      }
    }
  }

  // ── v42: Build per-label debt minimum budgets ─────────────────────
  // Maps each CC_MAP label → sum of DebtModel minimums for accounts in
  // that group. ThePulse v12 reads debtPaymentBudget[label] for $actual/$budget.
  var debtPaymentBudget = {};
  var _allDebtsForBudget = activeDebts.concat(excludedDebts);
  var _unmatchedBudgetDebts = []; // v46 FIX #10: track unmatched debts
  for (var _bmi = 0; _bmi < _allDebtsForBudget.length; _bmi++) {
    var _bmd = _allDebtsForBudget[_bmi];
    var _dname = (_bmd.name || '').toLowerCase();
    var _bmMatched = false; // v46 FIX #3: outer break prevents double-count
    for (var _bmLbl in BUDGET_MAP) {
      if (_bmMatched) break; // v46 FIX #3
      var _bmPatterns = BUDGET_MAP[_bmLbl];
      for (var _bmPi = 0; _bmPi < _bmPatterns.length; _bmPi++) {
        if (_bmPatterns[_bmPi].test(_dname)) {
          debtPaymentBudget[_bmLbl] = (debtPaymentBudget[_bmLbl] || 0) + (_bmd.min || 0);
          _bmMatched = true; // v46 FIX #3
          break;
        }
      }
    }
    if (!_bmMatched) _unmatchedBudgetDebts.push(_bmd.name); // v46 FIX #10
  }
  // v51: BUDGET_MAP coverage diagnostic — target 100%
  var _budgetMapCoverage = _allDebtsForBudget.length > 0
    ? roundTo((_allDebtsForBudget.length - _unmatchedBudgetDebts.length) / _allDebtsForBudget.length * 100, 1)
    : 100;
  var income = Math.round(earnedIncome);
  var minimums = Math.round(totalMinimums);

  // v15: breathingRoom = income - minimums - operatingExpenses
  var breathingRoom = income - minimums - Math.round(operatingExpenses);

  // ── Wave 4: budgetBreathingRoom — Budget_Data incomeBudget - minimums - expense57Budget ──
  var budgetBreathingRoom = (function() {
    var _bdData = de_readSheet_('Budget_Data');
    if (!_bdData || _bdData.length < 2) return null;
    var _incomeBudget = 0, _expenseBudget = 0;
    var _INCOME_CATS = ['JT Income', 'LT Income', 'Bonus Income', 'Other Income', 'Interest Income'];
    var _XFER = ['Transfer: Internal', 'Transfer: LOC Draw', 'Balance Transfers',
      'CC Payment', 'LOC Payment', 'Loan Payment', 'Investment', 'Payroll Deduction',
      'Duplicate - Exclude', 'Debt Offset',
      'SoFi Loan', 'Auto Loan', 'Student Loans', 'Solar Panel'];
    for (var _b = 1; _b < _bdData.length; _b++) {
      var _ym2 = String(_bdData[_b][1] || '').trim();
      var _cat = String(_bdData[_b][2] || '').trim();
      var _amt = parseFloat(_bdData[_b][4]) || 0;
      if (_ym2 !== ym || !_cat) continue;
      if (_INCOME_CATS.indexOf(_cat) >= 0) {
        _incomeBudget += Math.abs(_amt);
      } else if (_XFER.indexOf(_cat) < 0) {
        _expenseBudget += Math.abs(_amt);
      }
    }
    return Math.round(_incomeBudget - minimums - _expenseBudget);
  })();

  activeDebts.sort(function(a, b) { return a.priority - b.priority; });

  var totalActiveDebt = 0;
  for (var j = 0; j < activeDebts.length; j++) totalActiveDebt += activeDebts[j].balance;
  var totalExcludedDebt = 0;
  for (var k = 0; k < excludedDebts.length; k++) totalExcludedDebt += excludedDebts[k].balance;
  var allNonMortgageDebt = totalActiveDebt + totalExcludedDebt;

  var piM = m === 0 ? 11 : m - 1;
  var piY = m === 0 ? y - 1 : y;
  var piStart = new Date(piY, piM, 1);
  var piEnd = new Date(piY, piM + 1, 0, 23, 59, 59);
  var MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var priorIncome = 0;
  var priorOpEx = 0;
  var priorBuckets = { fixedExpenses: 0, necessaryLiving: 0, discretionary: 0, debtCost: 0, other: 0 };
  for (var pm = 1; pm < txData.length; pm++) {
    var pmDate = txData[pm][1];
    var pmCat = String(txData[pm][3] || '').trim();
    var pmAmt = parseFloat(txData[pm][4]) || 0;
    if (!pmDate || !pmCat) continue;
    if (typeof pmDate === 'string') pmDate = new Date(pmDate);
    if (!(pmDate instanceof Date) || isNaN(pmDate.getTime())) continue;
    if (pmDate < piStart || pmDate > piEnd) continue;
    if (EARNED_INCOME_CATS_SIM.indexOf(pmCat) >= 0 && pmAmt > 0) {
      priorIncome += pmAmt;
    }
    if (pmAmt < 0 && TRANSFER_CATS_SIM.indexOf(pmCat) < 0) {
      priorOpEx += Math.abs(pmAmt);
      var pmRawBucket = partnerBucketMap[pmCat] || '';
      var pmBKey = BUCKET_KEYS[pmRawBucket] || 'other';
      if (priorBuckets.hasOwnProperty(pmBKey)) {
        priorBuckets[pmBKey] += Math.abs(pmAmt);
      } else {
        priorBuckets.other += Math.abs(pmAmt);
      }
    }
  }

  // v46 FIX #6a: Cache baseline for pre-computed fields
  var _cachedBaseline_sim = computeDebtBaseline();
  return {
    debts:        activeDebts,
    excludedDebts: excludedDebts,
    debtStart:    _cachedBaseline_sim,
    bonus:        parseFloat(readDebtExportMeta('augustBonus')) || 0,
    income:       income,
    // v30: Income breakdown by source for expandable bucket
    incomeBySource: {
      ltIncome: Math.round(incomeBySource['LT Income'] || 0),
      jtIncome: Math.round(incomeBySource['JT Income'] || 0),
      bonusIncome: Math.round(incomeBySource['Bonus Income'] || 0),
      otherIncome: Math.round(incomeBySource['Other Income'] || 0),
      interestIncome: Math.round(incomeBySource['Interest Income'] || 0)
    },
    loanProceeds: Math.round(loanProceedsTotal),
    minimums:     minimums,
    // v38: Actual debt payments this month (CC Payment + Loan Payment + DEBT_PAYMENT_CATS)
    debtPaymentsMTD: roundTo(debtPaymentsMTD, 2),
    // v38: Per-category breakdown for expandable dropdown
    debtPaymentDetail: (function() {
      var d = {};
      var _META_KEYS={'__ccAccounts':1,'__locAccounts':1,'__loanAccounts':1};
      for (var k in debtPaymentDetail) {
        d[k] = (_META_KEYS[k] ? debtPaymentDetail[k] : roundTo(debtPaymentDetail[k], 2));
      }
      return d;
    })(),
    debtPaymentBudget: (function() {
      var _dpb = {};
      for (var _k in debtPaymentBudget) _dpb[_k] = Math.round(debtPaymentBudget[_k]);
      return _dpb;
    })(),
    breathingRoom: breathingRoom,
    budgetBreathingRoom: budgetBreathingRoom,
    totalActiveDebt:    roundTo(totalActiveDebt, 2),
    totalExcludedDebt:  roundTo(totalExcludedDebt, 2),
    allNonMortgageDebt: roundTo(allNonMortgageDebt, 2),
    debtByType: de_getDebtByType_(activeDebts, excludedDebts, de_getCurrentMortgageBalance_()),
    // v51: Cash flow parity with getData() + dynamic debt counts + coverage
    operationalCashFlow: roundTo(earnedIncome - operatingExpenses, 2),
    netCashFlow: roundTo(earnedIncome - operatingExpenses + loanProceedsTotal, 2),
    // v52: Income Throttle — earned minus opex minus actual debt payments MTD
    incomeThrottle: roundTo(earnedIncome - operatingExpenses - debtPaymentsMTD, 2),
    activeDebtCount: activeDebts.length,
    excludedDebtCount: excludedDebts.length,
    totalDebtCount: activeDebts.length + excludedDebts.length,
    _budgetMapCoverage: _budgetMapCoverage,
    // v57: bridgeCash parity with getData() — closes audit #39/NEW-B
    bridgeCash: roundTo(loanProceedsTotal, 2),
    bridgeCashLabel: loanProceedsTotal > 0 ? 'LOC / Loan Draw' : '',
    _unmatchedBudgetDebts: _unmatchedBudgetDebts,
    operatingExpenses:  roundTo(operatingExpenses, 2),
    bucketBreakdown: {
      fixedExpenses:    roundTo(bucketTotals.fixedExpenses, 2),
      necessaryLiving:  roundTo(bucketTotals.necessaryLiving, 2),
      discretionary:    roundTo(bucketTotals.discretionary, 2),
      debtCost:         roundTo(bucketTotals.debtCost, 2),
      other:            roundTo(bucketTotals.other, 2)
    },
    priorMonth: {
      label: MONTHS_SHORT[piM],
      income: Math.round(priorIncome),
      operatingExpenses: roundTo(priorOpEx, 2),
      minimums: minimums,
      buckets: {
        fixedExpenses:    roundTo(priorBuckets.fixedExpenses, 2),
        necessaryLiving:  roundTo(priorBuckets.necessaryLiving, 2),
        discretionary:    roundTo(priorBuckets.discretionary, 2),
        debtCost:         roundTo(priorBuckets.debtCost, 2),
        other:            roundTo(priorBuckets.other, 2)
      }
    },
    asOf:         now.toISOString(),
    debtTarget:   readDebtExportMeta('debtFreeTarget') || null,
    locCapacity:  getLOCCapacity(),
    interestBurn: (activeDebts.length > 0 || excludedDebts.length > 0) ? de_computeInterestBurn_(activeDebts.concat(excludedDebts)) : { monthly: 0, annual: 0, byAccount: [], byTier: [], lowAprBurn: 0, critical: 0, high: 0, medium: 0, low: 0 },
    // v30: Canonical interest burn from Debt_Export (uses full APR, no promo discount)
    canonicalInterestBurn: parseFloat(readDebtExportMeta('totalMonthlyInterest')) || 0,
    // v30: Budget breakdown by bucket for actual/budget display
    incomeBudget: (function() {
      var _bdD2 = de_readSheet_('Budget_Data');
      if (!_bdD2 || _bdD2.length < 2) return 0;
      var _ib = 0;
      var _INCOME_CATS2 = ['JT Income', 'LT Income', 'Bonus Income', 'Other Income', 'Interest Income'];
      for (var _b2 = 1; _b2 < _bdD2.length; _b2++) {
        var _ym3 = String(_bdD2[_b2][1] || '').trim();
        var _cat2 = String(_bdD2[_b2][2] || '').trim();
        var _amt2 = parseFloat(_bdD2[_b2][4]) || 0;
        if (_ym3 !== ym || !_cat2) continue;
        if (_INCOME_CATS2.indexOf(_cat2) >= 0) _ib += Math.abs(_amt2);
      }
      return Math.round(_ib);
    })(),
    bucketBudgets: (function() {
      var _bdD3 = de_readSheet_('Budget_Data');
      if (!_bdD3 || _bdD3.length < 2) return {};
      var _pbm = getPartnerBucketMap();
      var _BKEYS2 = { 'Fixed Expenses': 'fixedExpenses', 'Necessary Living': 'necessaryLiving', 'Discretionary': 'discretionary', 'Debt Cost': 'debtCost' };
      var _XFER2 = ['Transfer: Internal', 'Transfer: LOC Draw', 'Balance Transfers', 'CC Payment', 'LOC Payment', 'Loan Payment', 'Investment', 'Payroll Deduction', 'Duplicate - Exclude', 'Debt Offset', 'SoFi Loan', 'Auto Loan', 'Student Loans', 'Solar Panel'];
      var _INCOME2 = ['JT Income', 'LT Income', 'Bonus Income', 'Other Income', 'Interest Income'];
      var _bb = { fixedExpenses: 0, necessaryLiving: 0, discretionary: 0, debtCost: 0, other: 0 };
      for (var _b3 = 1; _b3 < _bdD3.length; _b3++) {
        var _ym4 = String(_bdD3[_b3][1] || '').trim();
        var _cat3 = String(_bdD3[_b3][2] || '').trim();
        var _amt3 = parseFloat(_bdD3[_b3][4]) || 0;
        if (_ym4 !== ym || !_cat3) continue;
        if (_INCOME2.indexOf(_cat3) >= 0 || _XFER2.indexOf(_cat3) >= 0) continue;
        var _rawB = _pbm[_cat3] || '';
        var _bk = _BKEYS2[_rawB] || 'other';
        _bb[_bk] = (_bb[_bk] || 0) + Math.abs(_amt3);
      }
      return { fixedExpenses: Math.round(_bb.fixedExpenses), necessaryLiving: Math.round(_bb.necessaryLiving), discretionary: Math.round(_bb.discretionary), debtCost: Math.round(_bb.debtCost), other: Math.round(_bb.other) };
    })(),

    // v26: Pre-computed business logic — dashboards should read, not sort/filter
    nextWin: (function() {
      var _sorted = activeDebts.filter(function(d) { return d.balance > 0; }).sort(function(a, b) { return a.balance - b.balance; });
      var _nw = _sorted[0];
      if (!_nw) return null;
      return { name: _nw.name, balance: roundTo(_nw.balance, 2), min: _nw.min || 0, strategy: _nw.strategy || '' };
    })(),
    promoCountdowns: (function() {
      var _now = new Date();
      var _promos = [];
      for (var _pi = 0; _pi < activeDebts.length; _pi++) {
        var _pd = activeDebts[_pi];
        if (!_pd.promoEnd) continue;
        var _end = new Date(_pd.promoEnd);
        if (isNaN(_end.getTime())) continue;
        var _days = Math.round((_end - _now) / 86400000);
        _promos.push({
          name: _pd.name,
          balance: _pd.balance,
          apr: _pd.apr,
          daysLeft: _days,
          expired: _days < 0,
          promoAction: _pd.promoAction || null,
          expiresDate: formatDate(_end)
        });
      }
      _promos.sort(function(a, b) { return a.daysLeft - b.daysLeft; });
      return _promos;
    })(),
    bonusCountdown: (function() {
      var _now2 = new Date();
      var _aug = new Date(_now2.getFullYear(), 7, 1);
      if (_aug <= _now2) _aug = new Date(_now2.getFullYear() + 1, 7, 1);
      return { daysLeft: Math.round((_aug - _now2) / 86400000), amount: parseFloat(readDebtExportMeta('augustBonus')) || 0 };
    })(),
    // v26: Server-side SoFi JT payoff + CF positive date — kills client-side amortMonths()
    sofiJTPayoff: (function() {
      var _sjt = null;
      for (var _si = 0; _si < activeDebts.length; _si++) {
        if (activeDebts[_si].name && activeDebts[_si].name.indexOf('JT Sofi') >= 0) { _sjt = activeDebts[_si]; break; }
      }
      if (!_sjt || _sjt.balance <= 0) return null;
      var _mo = amortizationMonths(_sjt.balance, _sjt.apr, _sjt.min || 0);
      var _d = new Date(); _d.setMonth(_d.getMonth() + _mo);
      return { months: _mo, date: formatDate(_d), minPayment: _sjt.min || 0 };
    })(),
    cashFlowPositiveDate: (function() {
      // Server-canonical: max(sofiJTPayoff, childcareDrop Sep 2027)
      var _now3 = new Date();
      var _childcare = new Date(2027, 8, 1); // Sep 2027
      var _sjt2 = null;
      for (var _si2 = 0; _si2 < activeDebts.length; _si2++) {
        if (activeDebts[_si2].name && activeDebts[_si2].name.indexOf('JT Sofi') >= 0) { _sjt2 = activeDebts[_si2]; break; }
      }
      var _jtPayoff = _now3;
      if (_sjt2 && _sjt2.balance > 0) {
        var _mo2 = amortizationMonths(_sjt2.balance, _sjt2.apr, _sjt2.min || 0);
        _jtPayoff = new Date(_now3); _jtPayoff.setMonth(_jtPayoff.getMonth() + _mo2);
      }
      var _later = _childcare > _jtPayoff ? _childcare : _jtPayoff;
      // v30 FIX: Return "Mon YYYY" format so frontend parseTargetDate() can parse it
      var _MS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return _MS[_later.getMonth()] + ' ' + _later.getFullYear();
    })(),
    // v46 FIX #6a: Dumb Glass pre-computation (mirrors getData)
    debtNow: roundTo(allNonMortgageDebt, 2),
    debtNetChange: roundTo((_cachedBaseline_sim || 0) - allNonMortgageDebt, 2),
    gapAfterDebt: roundTo(earnedIncome - operatingExpenses - totalMinimums, 2),
    // v46 FIX #10: Unmatched debt warning
    unmatchedBudgetDebts: _unmatchedBudgetDebts,
    // v78: Use shared de_buildPulseSummary_() — single source of truth
    pulseSummary: de_buildPulseSummary_({
      operatingExpenses: roundTo(operatingExpenses, 2),
      'expenses.fixed_expenses.actual': roundTo(bucketTotals.fixedExpenses, 2),
      'expenses.necessary_living.actual': roundTo(bucketTotals.necessaryLiving, 2),
      'expenses.discretionary.actual': roundTo(bucketTotals.discretionary, 2),
      'expenses.fixed_expenses.budget': (function() {
        var _bdD = de_readSheet_('Budget_Data');
        if (!_bdD || _bdD.length < 2) return 0;
        var _pbm = getPartnerBucketMap();
        var _total = 0;
        var _XFER = ['Transfer: Internal', 'Transfer: LOC Draw', 'Balance Transfers', 'CC Payment', 'LOC Payment', 'Loan Payment', 'Investment', 'Payroll Deduction', 'Duplicate - Exclude', 'Debt Offset', 'SoFi Loan', 'Auto Loan', 'Student Loans', 'Solar Panel'];
        var _INC = ['JT Income', 'LT Income', 'Bonus Income', 'Other Income', 'Interest Income'];
        for (var _b = 1; _b < _bdD.length; _b++) {
          var _ym = String(_bdD[_b][1] || '').trim();
          var _cat = String(_bdD[_b][2] || '').trim();
          var _amt = parseFloat(_bdD[_b][4]) || 0;
          if (_ym !== ym || !_cat) continue;
          if (_INC.indexOf(_cat) >= 0 || _XFER.indexOf(_cat) >= 0) continue;
          if ((_pbm[_cat] || '') === 'Fixed Expenses') _total += Math.abs(_amt);
        }
        return _total;
      })(),
      'expenses.necessary_living.budget': 0, // filled by de_buildPulseSummary_ from payload
      'expenses.discretionary.budget': 0,
      'expenses.debt_cost.budget': 0,
      dayOfMonth: new Date().getDate(),
      daysInMonth: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
      daysRemaining: (function() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate() - n.getDate(); })(),
      incomeThrottle: roundTo(earnedIncome - operatingExpenses - debtPaymentsMTD, 2),
      integrityErrors: null
    }),
    _meta: de_buildMeta_('simulator', ym)
  };
  } finally {
    if (_cacheOwner) { _deCache = null; _deSS = null; }
  }
}


/**
 * getWeeklyTrackerData() — unchanged from v19
 */
function getWeeklyTrackerData() {
  // v73: Activate cache — 4x getData() calls share cached sheet data
  var _cacheOwner = !_deCache;
  if (_cacheOwner) _deCache = {};
  try {
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth();

  function pad(n) { return leftPad2_(n); }
  function fmtDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function monthDays(yr, mo) { return new Date(yr, mo + 1, 0).getDate(); }

  var currStart = y + '-' + pad(m + 1) + '-01';
  var currEnd   = y + '-' + pad(m + 1) + '-' + monthDays(y, m);

  var priorY = m === 0 ? y - 1 : y;
  var priorM = m === 0 ? 11 : m - 1;
  var priorStart = priorY + '-' + pad(priorM + 1) + '-01';
  var priorEnd   = priorY + '-' + pad(priorM + 1) + '-' + monthDays(priorY, priorM);

  var todayClean = new Date(y, m, now.getDate());
  var dayOfWeek = todayClean.getDay();
  var daysFromMon = (dayOfWeek + 6) % 7;
  var thisMon = new Date(todayClean);
  thisMon.setDate(todayClean.getDate() - daysFromMon);
  var thisWeekStart = fmtDate(thisMon);
  var thisWeekEnd   = fmtDate(now);

  var lastSun = new Date(thisMon);
  lastSun.setDate(thisMon.getDate() - 1);
  var lastMon = new Date(lastSun);
  lastMon.setDate(lastSun.getDate() - 6);
  var lastWeekStart = fmtDate(lastMon);
  var lastWeekEnd   = fmtDate(lastSun);

  var currentMonthData = getData(currStart, currEnd, true);
  var priorMonthData   = getData(priorStart, priorEnd, true);
  var thisWeekData_raw = getData(thisWeekStart, thisWeekEnd, false);
  var lastWeekData_raw = getData(lastWeekStart, lastWeekEnd, false);

  return {
    currentMonth: { idx: m, ym: y + '-' + pad(m + 1), start: currStart, end: currEnd, data: currentMonthData },
    priorMonth: { idx: priorM, ym: priorY + '-' + pad(priorM + 1), start: priorStart, end: priorEnd, data: priorMonthData },
    thisWeek: { start: thisWeekStart, end: thisWeekEnd, data: thisWeekData_raw },
    lastWeek: { start: lastWeekStart, end: lastWeekEnd, data: lastWeekData_raw },
    asOf: now.toISOString(),
    locCapacity: getLOCCapacity(),
    _meta: de_buildMeta_(currStart, currEnd)
  };
  } finally {
    if (_cacheOwner) { _deCache = null; _deSS = null; }
  }
}


// ════════════════════════════════════════════════════════════════════
// LEGACY VERIFICATION — Run after deploying DataEngine v35+
// ════════════════════════════════════════════════════════════════════

function verifyDataEngineFixes() {
  var now = new Date();
  var y = now.getFullYear();
  var m = leftPad2_(now.getMonth() + 1);
  var start = y + '-' + m + '-01';
  var end = y + '-' + m + '-' + leftPad2_(now.getDate());

  var data = getData(start, end, true);
  var deployedVersion = (data._meta && data._meta.version) ? data._meta.version : '?';

  Logger.log('\u2550'.repeat(50));
  Logger.log('  DataEngine v' + deployedVersion + ' Verification');
  Logger.log('\u2550'.repeat(50));

  // Check 1: debtCurrent = active + excluded (THE v26 FIX)
  Logger.log('');
  Logger.log('CHECK 1: debtCurrent (active + excluded)');
  Logger.log('  debtCurrent (all non-mortgage): $' + Math.round(data.debtCurrent || 0));
  Logger.log('  debtCurrentActive: $' + Math.round(data.debtCurrentActive || 0));
  Logger.log('  debtCurrentExcluded: $' + Math.round(data.debtCurrentExcluded || 0));
  var _sumCheck = (data.debtCurrentActive || 0) + (data.debtCurrentExcluded || 0);
  Logger.log('  active + excluded = $' + Math.round(_sumCheck));
  Logger.log('  Matches debtCurrent: ' + (Math.abs(data.debtCurrent - _sumCheck) < 1 ? '\u2705' : '\ud83d\udd34 MISMATCH'));
  Logger.log('  debtCurrent > $300K: ' + (data.debtCurrent > 300000 ? '\u2705' : '\ud83d\udd34 TOO LOW — excluded accounts missing?'));

  if (data.debts) {
    var activeSum = 0;
    Logger.log('  Active debts (' + data.debts.length + '):');
    data.debts.forEach(function(d) { activeSum += d.balance; Logger.log('    ' + d.name + ': $' + Math.round(d.balance)); });
    Logger.log('  Active array sum: $' + Math.round(activeSum));
  }
  if (data.excludedDebts) {
    var exclSum = 0;
    Logger.log('  Excluded debts (' + data.excludedDebts.length + '):');
    data.excludedDebts.forEach(function(d) { exclSum += d.balance; Logger.log('    ' + d.name + ': $' + Math.round(d.balance)); });
    Logger.log('  Excluded array sum: $' + Math.round(exclSum));
  }

  // Check 2: Budget sign convention
  Logger.log('');
  Logger.log('CHECK 2: Budget sign convention');
  var disc = data['expenses.discretionary.budget'] || 0;
  var fixed = data['expenses.fixed_expenses.budget'] || 0;
  var nec = data['expenses.necessary_living.budget'] || 0;
  Logger.log('  discretionary budget: ' + disc + (disc > 0 ? ' \u2705' : ' \ud83d\udd34'));
  Logger.log('  fixed budget: ' + fixed + (fixed > 0 ? ' \u2705' : ' \ud83d\udd34'));
  Logger.log('  necessary budget: ' + nec + (nec > 0 ? ' \u2705' : ' \ud83d\udd34'));

  // Check 3: Wave 4 fields
  Logger.log('');
  Logger.log('CHECK 3: Wave 4 fields');
  Logger.log('  dayOfMonth: ' + data.dayOfMonth + (data.dayOfMonth > 0 ? ' \u2705' : ' \ud83d\udd34'));
  Logger.log('  daysInMonth: ' + data.daysInMonth + (data.daysInMonth >= 28 ? ' \u2705' : ' \ud83d\udd34'));
  Logger.log('  monthElapsedPct: ' + data.monthElapsedPct);
  Logger.log('  mortgageBalance: $' + data.mortgageBalance);
  Logger.log('  dscr: ' + data.dscr);

  // Check 4: Cross-surface consistency (getData vs getSimulatorData)
  Logger.log('');
  Logger.log('CHECK 4: Cross-surface consistency');
  var sim = getSimulatorData();
  Logger.log('  getData().debtCurrent: $' + Math.round(data.debtCurrent));
  Logger.log('  getSimulatorData().allNonMortgageDebt: $' + Math.round(sim.allNonMortgageDebt));
  var _crossDelta = Math.abs(data.debtCurrent - sim.allNonMortgageDebt);
  Logger.log('  Delta: $' + Math.round(_crossDelta) + (_crossDelta < 100 ? ' \u2705' : ' \ud83d\udd34 MISMATCH'));

  // Check 5: debtStart
  Logger.log('');
  Logger.log('CHECK 5: debtStart baseline');
  Logger.log('  debtStart: $' + Math.round(data.debtStart));
  Logger.log('  > $290K: ' + (data.debtStart > 290000 ? '\u2705' : '\ud83d\udd34'));

  // Check 6: Integrity errors
  Logger.log('');
  Logger.log('CHECK 6: Integrity');
  if (data.integrityErrors && data.integrityErrors.length > 0) {
    Logger.log('  \u26a0\ufe0f Integrity errors: ' + data.integrityErrors.join(' | '));
  } else {
    Logger.log('  No integrity errors \u2705');
  }

  // Check 7: _meta version
  Logger.log('');
  Logger.log('CHECK 7: _meta');
  Logger.log('  version: ' + (data._meta ? data._meta.version : 'MISSING'));
  Logger.log('  engine: ' + (data._meta ? data._meta.engine : 'MISSING'));

  var allPass = data.debtCurrent > 300000 &&
    Math.abs(data.debtCurrent - _sumCheck) < 1 &&
    disc > 0 && data.dayOfMonth > 0 &&
    _crossDelta < 100 &&
    data.debtStart > 290000 &&
    data._meta && data._meta.version != null;

  Logger.log('');
  Logger.log('\u2550'.repeat(50));
  Logger.log(allPass ? '\u2705 ALL v' + deployedVersion + ' CHECKS PASSED' : '\ud83d\udd34 CHECKS INCOMPLETE — review above');
  Logger.log('\u2550'.repeat(50));
}


// ════════════════════════════════════════════════════════════════════
// getSubscriptionData() — detect recurring charges from Transactions
// ════════════════════════════════════════════════════════════════════

function getSubscriptionData(startDate, endDate) {
  var txData = de_readSheet_('Transactions');
  if (!txData || txData.length < 2) return { subscriptions: [], periodTransactions: [], totalMonthly: 0, totalAnnual: 0, periodTotal: 0, asOf: '' };
  var now = new Date();
  var sixMonthsAgo = new Date(now); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  var sixtyDaysAgo = new Date(now); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  var periodStart, periodEnd, periodLabel;
  if (startDate && endDate) {
    periodStart = new Date(startDate + 'T00:00:00');
    periodEnd = new Date(endDate + 'T23:59:59');
    periodLabel = (periodStart.getMonth() + 1) + '/' + periodStart.getFullYear();
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    periodLabel = (now.getMonth() + 1) + '/' + now.getFullYear();
  }

  var merchants = {};
  var periodTxns = [];

  for (var i = 1; i < txData.length; i++) {
    var cat = String(txData[i][3] || '').trim();
    if (cat !== 'Subscriptions') continue;
    var txDate = txData[i][1];
    if (!txDate) continue;
    if (typeof txDate === 'string') txDate = new Date(txDate);
    if (!(txDate instanceof Date) || isNaN(txDate.getTime())) continue;
    if (txDate < sixMonthsAgo) continue;
    var desc = String(txData[i][2] || '').trim();
    var amt = parseFloat(txData[i][4]) || 0;
    if (amt >= 0) continue;
    if (txDate >= periodStart && txDate <= periodEnd) {
      periodTxns.push({ date: formatDate(txDate), description: desc, amount: roundTo(Math.abs(amt), 2), account: String(txData[i][5] || '').trim() });
    }
    var normDesc = desc.replace(/\d{2}\/\d{2}\/?\d{0,4}/g, '').replace(/\s+/g, ' ').trim();
    if (!merchants[normDesc]) merchants[normDesc] = { charges: [], total: 0 };
    merchants[normDesc].charges.push({ date: txDate, amount: Math.abs(amt) });
    merchants[normDesc].total += Math.abs(amt);
  }

  var subs = [];
  for (var name in merchants) {
    var merch = merchants[name];
    if (merch.charges.length < 1) continue;
    merch.charges.sort(function(a, b) { return b.date - a.date; });
    var lastCharge = merch.charges[0];
    if (lastCharge.date < sixtyDaysAgo) continue;
    var chargeCount = merch.charges.length;
    var frequency = 'monthly';
    if (chargeCount >= 2) {
      var daysBetween = [];
      for (var c = 0; c < Math.min(chargeCount - 1, 5); c++) {
        var gap = Math.round((merch.charges[c].date - merch.charges[c + 1].date) / (1000 * 60 * 60 * 24));
        daysBetween.push(gap);
      }
      var avgGap = daysBetween.reduce(function(a, b) { return a + b; }, 0) / daysBetween.length;
      if (avgGap > 320) frequency = 'annual';
      else if (avgGap > 50) frequency = 'bi-monthly';
    }
    var monthlyCost = frequency === 'annual' ? lastCharge.amount / 12 :
      frequency === 'bi-monthly' ? lastCharge.amount / 2 : lastCharge.amount;
    subs.push({ name: name, monthlyCost: roundTo(monthlyCost, 2), lastCharge: roundTo(lastCharge.amount, 2), lastDate: formatDate(lastCharge.date), frequency: frequency, chargeCount: chargeCount });
  }

  subs.sort(function(a, b) { return b.monthlyCost - a.monthlyCost; });
  var totalMonthly = 0;
  for (var s = 0; s < subs.length; s++) totalMonthly += subs[s].monthlyCost;

  periodTxns.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  var periodTotal = 0;
  for (var p = 0; p < periodTxns.length; p++) periodTotal += periodTxns[p].amount;

  return { subscriptions: subs, periodTransactions: periodTxns, totalMonthly: roundTo(totalMonthly, 2), totalAnnual: roundTo(totalMonthly * 12, 2), periodTotal: roundTo(periodTotal, 2), periodLabel: periodLabel, asOf: formatDate(now) };
}



// ════════════════════════════════════════════════════════════════════
// getCloseHistoryData() — Monthly Trends for The Vein (v7 addition)
// ════════════════════════════════════════════════════════════════════

function getCloseHistoryData() {
  var data = de_readSheet_('Close History');
  if (!data || data.length < 2) return [];
  var months = [];

  for (var i = 1; i < data.length; i++) {
    var monthLabel = String(data[i][0] || '').trim();
    var status = String(data[i][1] || '').trim();
    var earned = parseFloat(data[i][3]) || 0;
    var moneyOut = parseFloat(data[i][5]) || 0;
    var ncf = parseFloat(data[i][6]) || 0;
    var debt = parseFloat(data[i][7]) || 0;

    if (earned === 0 && moneyOut === 0) continue;
    if (status.toLowerCase().trim() !== 'closed') continue;

    var parts = monthLabel.split(' ');
    var monthName = parts[0] || '';
    var year = parseInt(parts[1]) || 2026;
    var absMoneyOut = Math.abs(moneyOut);

    months.push({
      month: monthName,
      year: year,
      earnedIncome: roundTo(earned, 2),
      moneyOut: roundTo(absMoneyOut, 2),
      netCashFlow: roundTo(ncf, 2),
      operationalCashFlow: roundTo(earned - absMoneyOut, 2),
      debtCurrent: roundTo(debt, 2),
      disc_actual: 0
    });
  }

  return months;
}



// ════════════════════════════════════════════════════════════════════
// getCategoryTransactions() — E-6: Transaction drill-down for WeeklyTracker
// ════════════════════════════════════════════════════════════════════
function getCategoryTransactions(category, startStr, endStr) {
  var txData = de_readSheet_('Transactions');
  if (!txData || txData.length < 2) return { transactions: [], total: 0 };
  var startDate = new Date(startStr + 'T00:00:00');
  var endDate = new Date(endStr + 'T23:59:59');
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { transactions: [], total: 0, error: 'Invalid dates' };
  }
  var txns = [];
  var total = 0;
  for (var t = 1; t < txData.length; t++) {
    var txDate = txData[t][1];
    var txCat = String(txData[t][3] || '').trim();
    var txAmt = parseFloat(txData[t][4]) || 0;
    var txDesc = String(txData[t][2] || '').trim();
    var txAcct = String(txData[t][5] || '').trim();
    if (!txDate || txCat !== category) continue;
    if (typeof txDate === 'string') txDate = new Date(txDate);
    if (!(txDate instanceof Date) || isNaN(txDate.getTime())) continue;
    if (txDate < startDate || txDate > endDate) continue;
    txns.push({
      date: formatDate(txDate),
      description: txDesc,
      amount: roundTo(Math.abs(txAmt), 2),
      account: txAcct
    });
    total += Math.abs(txAmt);
  }
  txns.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  return { transactions: txns, total: roundTo(total, 2), category: category };
}
// ════════════════════════════════════════════════════════════════════
// getCascadeResultsSafe() — Server-side cascade for DebtSimulator (v24)
// ════════════════════════════════════════════════════════════════════
function getCascadeResultsSafe(extraMonthly, lumpSum, sideIncome) {
  try {
    var parsed = parseDebtExport();
    var debts = parsed.active;
    var augustBonus = parseFloat(readDebtExportMeta('augustBonus')) || 0;
    var extra = (parseFloat(extraMonthly) || 0) + (parseFloat(sideIncome) || 0);
    var lump = parseFloat(lumpSum) || 0;
    var result;
    if (typeof ce_runCascadeWithExtras_ === 'function') {
      result = ce_runCascadeWithExtras_(debts, augustBonus, extra, lump);
    } else {
      result = ce_runCascade_(debts, augustBonus);
    }
    return JSON.parse(JSON.stringify(result));
  } catch(e) {
    Logger.log('getCascadeResultsSafe error: ' + e.message);
    return { error: e.message };
  }
}
// ════════════════════════════════════════════════════════════════════
// de_buildMeta_() — Response metadata for trust & traceability (v24)
// ════════════════════════════════════════════════════════════════════
function de_buildMeta_(startOrLabel, endOrScope, warnings) {
  return {
    engine: 'DataEngine',
    version: getDataEngineVersion(),
    generatedAt: new Date().toISOString(),
    range: String(startOrLabel) + (endOrScope ? ' -> ' + String(endOrScope) : ''),
    warnings: warnings || []
  };
}
// ════════════════════════════════════════════════════════════════════
// de_computeInterestBurn_() — Server-side interest cost breakdown (v24)
// ════════════════════════════════════════════════════════════════════
function de_computeInterestBurn_(debts) {
  var monthly = 0;
  var byAccount = [];
  var now = new Date();
  for (var i = 0; i < debts.length; i++) {
    var d = debts[i];
    var bal = d.balance || d.bal || 0;
    var apr = d.apr || 0;
    var isPromo = d.promoAPR !== null && d.promoAPR !== undefined &&
                  d.promoEnd && new Date(d.promoEnd) > now;
    var effectiveRate = isPromo ? d.promoAPR : apr;
    var moInt = bal * effectiveRate / 12;
    monthly += moInt;
    byAccount.push({
      name: d.name,
      balance: roundTo(bal, 2),
      apr: apr,
      effectiveRate: roundTo(effectiveRate, 4),
      monthlyInterest: roundTo(moInt, 2)
    });
  }
  byAccount.sort(function(a, b) { return b.monthlyInterest - a.monthlyInterest; });
  // v59 #53: Server-side tier aggregations — Dumb Glass compliance
  var TIERS = [
    { label: '25%+ APR (Critical)', min: 0.25, max: 999 },
    { label: '18-25% APR (High)', min: 0.18, max: 0.25 },
    { label: '12-18% APR (Medium)', min: 0.12, max: 0.18 },
    { label: 'Under 12% APR', min: 0, max: 0.12 }
  ];
  var byTier = [];
  var lowAprBurn = 0;
  for (var ti = 0; ti < TIERS.length; ti++) {
    var tier = TIERS[ti];
    var tierMonthly = 0, tierBalance = 0, tierCount = 0;
    for (var ai = 0; ai < byAccount.length; ai++) {
      var acct = byAccount[ai];
      if (acct.apr >= tier.min && acct.apr < tier.max) {
        tierMonthly += acct.monthlyInterest;
        tierBalance += acct.balance;
        tierCount++;
      }
    }
    byTier.push({
      label: tier.label,
      minApr: tier.min,
      maxApr: tier.max >= 999 ? null : tier.max,
      monthly: roundTo(tierMonthly, 2),
      balance: roundTo(tierBalance, 2),
      count: tierCount,
      pctOfBurn: monthly > 0 ? roundTo(tierMonthly / monthly * 100, 1) : 0
    });
  }
  // v59 #53: lowAprBurn — interest from APR < 0.18 accounts (post high-APR payoff scenario)
  for (var li = 0; li < byAccount.length; li++) {
    if (byAccount[li].apr < 0.18) lowAprBurn += byAccount[li].monthlyInterest;
  }
  lowAprBurn = roundTo(lowAprBurn, 2);
  // v60 #53: Flat tier keys for Dumb Glass — TheVein reads interestBurn.critical etc.
  // Thresholds per #53 spec: critical ≥20%, high 15-20%, medium 10-15%, low <10%
  // Additive — existing byTier[] array preserved for detailed breakdown consumers.
  var critical = 0, high = 0, medium = 0, low = 0;
  for (var fi = 0; fi < byAccount.length; fi++) {
    var fa = byAccount[fi];
    if (fa.apr >= 0.20) critical += fa.monthlyInterest;
    else if (fa.apr >= 0.15) high += fa.monthlyInterest;
    else if (fa.apr >= 0.10) medium += fa.monthlyInterest;
    else low += fa.monthlyInterest;
  }
  return {
    monthly: roundTo(monthly, 2),
    annual: roundTo(monthly * 12, 2),
    byAccount: byAccount,
    byTier: byTier,
    lowAprBurn: lowAprBurn,
    critical: roundTo(critical, 2),
    high: roundTo(high, 2),
    medium: roundTo(medium, 2),
    low: roundTo(low, 2)
  };
}
// ════════════════════════════════════════════════════════════════════
// getBoardData() — Wave 5: Thompson Family Morning Card (TheBoard)
// Reads Google Calendar, weather, KidsHub chore status, family note.
// Called by getBoardDataSafe() wrapper in Code.gs v31.
// ════════════════════════════════════════════════════════════════════

function getBoardData() {
  var now = new Date();
  var hour = now.getHours();
  var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var dayName = dayNames[now.getDay()];
  var monthNames = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];

  // ── 1. Time-of-day greeting ───────────────────────────────────────
  var greetings;
  if (hour < 12) {
    greetings = [
      'Good morning, Thompson family.',
      'Rise and shine, Thompsons.',
      'Morning, Thompsons. Let\'s make it count.',
      'Good morning — new day, new wins.'
    ];
  } else if (hour < 17) {
    greetings = [
      'Good afternoon, Thompsons. Keep it rolling.',
      'Afternoon, Thompson family.',
      'Good afternoon — stay on it, Thompsons.',
      'Halfway there, Thompsons. Finish strong.'
    ];
  } else {
    greetings = [
      'Good evening, Thompsons. Almost there.',
      'Evening, Thompson family. Wind it down right.',
      'Good evening — you made it, Thompsons.',
      'Night\'s coming, Thompsons. Rest up.'
    ];
  }
  // Day-of-week specials
  var daySpecials = {
    'Monday':    'Happy Monday, Thompsons. Set the tone.',
    'Tuesday':   'Happy Tuesday, Thompsons. Let\'s get it.',
    'Wednesday': 'Hump day, Thompsons. Downhill from here.',
    'Friday':    'Happy Friday, Thompsons. We made it.',
    'Saturday':  'Happy Saturday, Thompsons. Family time.',
    'Sunday':    'Happy Sunday, Thompsons. Recharge day.'
  };
  if (daySpecials[dayName] && Math.random() < 0.3) {
    greetings.push(daySpecials[dayName]);
  }
  var greeting = greetings[Math.floor(Math.random() * greetings.length)];

  // ── 2. Date string ────────────────────────────────────────────────
  var dateStr = dayName + ', ' + monthNames[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();

  // ── 3. Weather via Open-Meteo (free, no API key, reliable from GAS) ──
  // Fort Worth, TX: 32.7555, -97.3308
  var weather = null;
  try {
    var wxUrl = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=32.7555&longitude=-97.3308'
      + '&current=temperature_2m,apparent_temperature,weather_code'
      + '&daily=temperature_2m_max,temperature_2m_min'
      + '&temperature_unit=fahrenheit&timezone=America/Chicago&forecast_days=1';
    var wxResp = UrlFetchApp.fetch(wxUrl, { muteHttpExceptions: true });
    if (wxResp.getResponseCode() === 200) {
      var wxJson = JSON.parse(wxResp.getContentText());
      var cur = wxJson.current;
      var daily = wxJson.daily;
      if (cur) {
        weather = {
          tempF:     Math.round(cur.temperature_2m) || 0,
          feelsF:    Math.round(cur.apparent_temperature) || 0,
          condition: de_openMeteoCondition_(cur.weather_code),
          highF:     daily ? Math.round(daily.temperature_2m_max[0]) : 0,
          lowF:      daily ? Math.round(daily.temperature_2m_min[0]) : 0,
          icon:      de_openMeteoIcon_(cur.weather_code)
        };
      }
    }
  } catch(e) {
    if (typeof logError_ === 'function') logError_('de_getBoardData_Weather', e);
  }

  // ── 4. Google Calendar events (today) ─────────────────────────────
  var events = [];
  var calNames = ['Bills and Financial', 'Thompson Household', 'Kids Activities'];
  var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  var todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  try {
    // Default calendar
    var defEvents = CalendarApp.getDefaultCalendar().getEvents(todayStart, todayEnd);
    for (var di = 0; di < defEvents.length; di++) {
      events.push(_boardFormatEvent(defEvents[di], 'Default'));
    }
    // Named calendars
    for (var ci = 0; ci < calNames.length; ci++) {
      var cals = CalendarApp.getCalendarsByName(calNames[ci]);
      for (var cj = 0; cj < cals.length; cj++) {
        var calEvents = cals[cj].getEvents(todayStart, todayEnd);
        for (var ce = 0; ce < calEvents.length; ce++) {
          events.push(_boardFormatEvent(calEvents[ce], calNames[ci]));
        }
      }
    }
  } catch(e) {
    if (typeof logError_ === 'function') logError_('de_getBoardData_Calendar', e);
  }

  // Sort by start time, cap at 3
  events.sort(function(a, b) { return (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin); });
  var hasMore = events.length > 3;
  var moreCount = hasMore ? events.length - 3 : 0;
  events = events.slice(0, 3);

  // ── 5. 7-day upcoming events (all day, all calendars except finance) ──
  var upcomingEvents = [];
  var tomorrowPreview = null; // kept for backward-compat; clients should use upcomingEvents
  try {
    var upDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (var ud = 1; ud <= 7; ud++) {
      var upStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ud, 0, 0, 0);
      var upEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ud, 23, 59, 59);
      var upLabel = ud === 1 ? 'Tomorrow' : upDayNames[upStart.getDay()];
      var upEvts  = [];
      var upDef = CalendarApp.getDefaultCalendar().getEvents(upStart, upEnd);
      for (var udi = 0; udi < upDef.length; udi++) upEvts.push(_boardFormatEvent(upDef[udi], 'Default'));
      for (var uci = 0; uci < calNames.length; uci++) {
        if (calNames[uci] === 'Bills and Financial') continue; // skip finance events
        var uCals = CalendarApp.getCalendarsByName(calNames[uci]);
        for (var ucj = 0; ucj < uCals.length; ucj++) {
          var uCalEvts = uCals[ucj].getEvents(upStart, upEnd);
          for (var uce = 0; uce < uCalEvts.length; uce++) upEvts.push(_boardFormatEvent(uCalEvts[uce], calNames[uci]));
        }
      }
      upEvts.sort(function(a, b) { return (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin); });
      for (var uei = 0; uei < upEvts.length; uei++) {
        if (upcomingEvents.length >= 3) break;
        upcomingEvents.push({ title: upEvts[uei].title, timeStr: upLabel });
      }
      if (upcomingEvents.length >= 3) break;
    }
  } catch(e) {
    if (typeof logError_ === 'function') logError_('de_getBoardData_UpcomingEvents', e);
  }

  // ── 6. KidsHub chore status ───────────────────────────────────────
  // v83: Use getKidsHubWidgetData_ which builds the .buggsy.stats shape.
  // getKidsHubData() returns flat tasks array without per-child stats.
  var choreStatus = { buggsy: { completed: 0, total: 0 }, jj: { completed: 0, total: 0 }, pendingApprovals: 0 };
  try {
    var khWidget = getKidsHubWidgetDataSafe('summary');
    if (khWidget && !khWidget.error) {
      if (khWidget.buggsy && khWidget.buggsy.stats) {
        choreStatus.buggsy.completed = khWidget.buggsy.stats.completedCount || 0;
        choreStatus.buggsy.total     = khWidget.buggsy.stats.totalTasks || 0;
      }
      if (khWidget.jj && khWidget.jj.stats) {
        choreStatus.jj.completed     = khWidget.jj.stats.completedCount || 0;
        choreStatus.jj.total         = khWidget.jj.stats.totalTasks || 0;
      }
      choreStatus.pendingApprovals = (khWidget.household && khWidget.household.totalPendingApprovals) || 0;
    }
  } catch(e) {
    if (typeof logError_ === 'function') logError_('de_getBoardData_ChoreStatus', e);
  }

  // ── 7. Family note from Board_Config tab ──────────────────────────
  var familyNote = '';
  try {
    var bcData = de_readSheet_('Board_Config');
    if (bcData) {
      for (var bi = 0; bi < bcData.length; bi++) {
        if (String(bcData[bi][0]).trim() === 'FAMILY_NOTE') {
          familyNote = String(bcData[bi][1] || '').trim();
          break;
        }
      }
    }
  } catch(e) {
    if (typeof logError_ === 'function') logError_('de_getBoardData_FamilyNote', e);
  }

  // ── 8. Tonight's dinner from MealPlan tab (v78) ────────────────
  var dinner = null;
  try {
    var mpData = de_readSheet_('MealPlan');
    if (mpData && mpData.length > 1) {
      var todayStr = now.getFullYear() + '-' + (now.getMonth() + 1 < 10 ? '0' : '') + (now.getMonth() + 1) + '-' + (now.getDate() < 10 ? '0' : '') + now.getDate();
      for (var mp = 1; mp < mpData.length; mp++) {
        var mpDate = mpData[mp][0];
        if (mpDate instanceof Date) {
          var mpY = mpDate.getFullYear();
          var mpM = mpDate.getMonth() + 1;
          var mpD = mpDate.getDate();
          mpDate = mpY + '-' + (mpM < 10 ? '0' : '') + mpM + '-' + (mpD < 10 ? '0' : '') + mpD;
        }
        if (String(mpDate).indexOf(todayStr) === 0) {
          dinner = {
            meal: String(mpData[mp][1] || ''),
            cook: String(mpData[mp][2] || ''),
            notes: String(mpData[mp][3] || ''),
            updatedBy: String(mpData[mp][4] || ''),
            kidMeal: String(mpData[mp][5] || '')
          };
          break;
        }
      }
    }
  } catch(e) {
    if (typeof logError_ === 'function') logError_('de_getBoardData_Dinner', e);
  }

  // ── 9. Return payload ─────────────────────────────────────────────
  return {
    greeting:         greeting,
    date:             dateStr,
    dayName:          dayName,
    hour:             hour,
    weather:          weather,
    events:           events,
    eventsMore:       moreCount,
    upcomingEvents:   upcomingEvents,
    tomorrowPreview:  tomorrowPreview,
    choreStatus:      choreStatus,
    familyNote:       familyNote,
    spineStale:       (function() {
      try {
        var hSheet = getDESS_().getSheetByName(TAB_MAP['Helpers'] || 'Helpers');
        if (!hSheet) return false;
        var lastBeat = hSheet.getRange('Z1').getValue();
        if (!lastBeat) return true;
        var lastTime = new Date(lastBeat);
        if (isNaN(lastTime.getTime())) return true;
        var ageHours = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);
        return ageHours > 6;
      } catch(e) { return false; }
    })(),
    dinner:           dinner,
    refreshedAt:      now.toISOString()
  };
}

// v78: Setup MealPlan sheet — run once from editor
function setupMealPlanSheet() {
  var ss = getDESS_();
  var tabName = TAB_MAP['MealPlan'] || '💻 MealPlan';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(['Date', 'Meal', 'Cook', 'Notes', 'UpdatedBy', 'UpdatedAt']);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setColumnWidth(1, 120);
    sheet.setColumnWidth(2, 250);
    sheet.setColumnWidth(3, 80);
    sheet.setColumnWidth(4, 250);
    sheet.setColumnWidth(5, 100);
    sheet.setColumnWidth(6, 160);
    Logger.log('MealPlan sheet created: ' + tabName);
  } else {
    Logger.log('MealPlan sheet already exists.');
  }
}


// v75: Update family note in Board_Config — called from TheVein note editor
function updateFamilyNote(noteText) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    var ss = getDESS_();
    var sheet = ss.getSheetByName(TAB_MAP['Board_Config'] || 'Board_Config');
    if (!sheet) throw new Error('Board_Config tab not found');
    var data = sheet.getDataRange().getValues();
    var found = false;
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === 'FAMILY_NOTE') {
        sheet.getRange(i + 1, 2).setValue(String(noteText || '').trim());
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow(['FAMILY_NOTE', String(noteText || '').trim()]);
    }
    try { CacheService.getScriptCache().remove('board_data'); } catch(e) {}
    return { success: true, note: String(noteText || '').trim() };
  } catch (e) {
    Logger.log('updateFamilyNote error: ' + e.toString());
    return { success: false, error: e.message || e.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Format a CalendarApp event for Board display.
 */
function _boardFormatEvent(evt, calName) {
  var start = evt.getStartTime();
  var isAllDay = evt.isAllDayEvent();
  var h = start.getHours();
  var m = start.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  var h12 = h % 12 || 12;
  var timeStr = isAllDay ? 'All day' : h12 + ':' + leftPad2_(m) + ' ' + ampm;
  return {
    title:        evt.getTitle(),
    timeStr:      timeStr,
    startHour:    h,
    startMin:     m,
    isAllDay:     isAllDay,
    calendarName: calName || 'Default',
    calendar:     evt.getOriginalCalendarId ? evt.getOriginalCalendarId() : ''
  };
}


function de_openMeteoCondition_(code) {
  var c = parseInt(code) || 0;
  if (c === 0) return 'Clear sky';
  if (c <= 3) return ['Mainly clear', 'Partly cloudy', 'Overcast'][c - 1];
  if (c === 45 || c === 48) return 'Foggy';
  if (c >= 51 && c <= 57) return 'Drizzle';
  if (c >= 61 && c <= 67) return 'Rain';
  if (c >= 71 && c <= 77) return 'Snow';
  if (c >= 80 && c <= 82) return 'Rain showers';
  if (c >= 85 && c <= 86) return 'Snow showers';
  if (c >= 95) return 'Thunderstorm';
  return 'Unknown';
}

function de_openMeteoIcon_(code) {
  var c = parseInt(code) || 0;
  if (c === 0) return '☀️';
  if (c <= 2) return '⛅';
  if (c === 3) return '☁️';
  if (c === 45 || c === 48) return '🌫️';
  if (c >= 51 && c <= 57) return '🌦️';
  if (c >= 61 && c <= 67) return '🌧️';
  if (c >= 71 && c <= 77) return '🌨️';
  if (c >= 80 && c <= 82) return '🌧️';
  if (c >= 85 && c <= 86) return '🌨️';
  if (c >= 95) return '⛈️';
  return '🌤️';
}


// ════════════════════════════════════════════════════════════════════
// setupBoardConfig() — One-time setup: creates 📋 Board_Config tab
// Run once from Apps Script editor. Creates key-value config sheet.
// ════════════════════════════════════════════════════════════════════

function setupBoardConfig() {
  var ss = getDESS_();
  var existing = ss.getSheetByName('📋 Board_Config');
  if (existing) {
    Logger.log('📋 Board_Config already exists — no action taken.');
    return;
  }
  var sheet = ss.insertSheet('📋 Board_Config');
  sheet.getRange('A1:B1').setValues([['Key', 'Value']]);
  sheet.getRange('A2:B2').setValues([['FAMILY_NOTE', 'Welcome to the Thompson Board!']]);
  sheet.getRange('A1:B1').setFontWeight('bold');
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 400);
  Logger.log('✅ Board_Config tab created with default FAMILY_NOTE.');
}


// ╔══════════════════════════════════════════════════════════════════╗
// ║  v77: Pulse Summary + Soul Moment — narrative builders          ║
// ╚══════════════════════════════════════════════════════════════════╝

/**
 * Build an informational (NOT prescriptive) summary for ThePulse.
 * Uses only fields already in the result payload — no new sheet reads.
 */
function de_buildPulseSummary_(payload) {
  var summary = { headline: '', detail: '', alert: null };

  // v84: comma-format a positive integer as a dollar string
  function fmtAmt_(n) {
    return '$' + Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Determine headline from spending vs time-in-month pace
  var totalBudget = (payload['expenses.fixed_expenses.budget'] || 0) +
                    (payload['expenses.necessary_living.budget'] || 0) +
                    (payload['expenses.discretionary.budget'] || 0) +
                    (payload['expenses.debt_cost.budget'] || 0);
  var totalActual = payload.operatingExpenses || 0;

  // v84: guard — if budget fields are zero/missing, don't show a false headline
  if (totalBudget === 0) {
    summary.headline = 'Budget data unavailable.';
    return summary;
  }

  var dayOfMonth = payload.dayOfMonth || new Date().getDate();
  var daysInMonth = payload.daysInMonth || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  var timePct = (dayOfMonth / daysInMonth) * 100;
  var spendPct = (totalActual / totalBudget) * 100;

  if (spendPct <= timePct - 10) {
    summary.headline = 'On track this month.';
  } else if (spendPct <= timePct + 10) {
    summary.headline = 'Tracking close to budget.';
  } else {
    summary.headline = 'Spending is ahead of pace.';
  }

  // Detail: find the bucket with largest overage (if any)
  var buckets = [
    { name: 'Fixed Expenses', actual: payload['expenses.fixed_expenses.actual'] || 0, budget: payload['expenses.fixed_expenses.budget'] || 0 },
    { name: 'Necessary Living', actual: payload['expenses.necessary_living.actual'] || 0, budget: payload['expenses.necessary_living.budget'] || 0 },
    { name: 'Discretionary', actual: payload['expenses.discretionary.actual'] || 0, budget: payload['expenses.discretionary.budget'] || 0 }
  ];
  var worstOver = null;
  for (var i = 0; i < buckets.length; i++) {
    var b = buckets[i];
    if (b.budget > 0 && b.actual > b.budget) {
      var over = Math.round(b.actual - b.budget);
      if (!worstOver || over > worstOver.over) {
        worstOver = { name: b.name, over: over };
      }
    }
  }

  var details = [];
  if (worstOver) {
    details.push(worstOver.name + ' is ' + fmtAmt_(worstOver.over) + ' over budget.');
  }

  var daysRemaining = payload.daysRemaining || 0;
  if (daysRemaining <= 7 && daysRemaining > 0) {
    details.push(daysRemaining + ' days left in the month.');
  }

  // Cash flow context
  var incomeThrottle = payload.incomeThrottle;
  if (incomeThrottle != null && incomeThrottle !== undefined) {
    if (incomeThrottle < 0) {
      details.push('Spending ' + fmtAmt_(incomeThrottle) + ' more than earned so far.');
    }
  }

  summary.detail = details.join(' ');

  // Alert: only for anomalies
  if (payload.integrityErrors && payload.integrityErrors.length > 0) {
    summary.alert = payload.integrityErrors.length + ' data integrity issue' + (payload.integrityErrors.length > 1 ? 's' : '') + ' detected.';
  }

  return summary;
}

/**
 * Build a rotating family moment string for TheSoul kitchen display.
 * Cycles through available content based on time.
 */
function de_buildSoulMoment_(boardPayload, kidsPayload) {
  var moments = [];

  // Kid streaks
  if (kidsPayload && kidsPayload.kids) {
    for (var i = 0; i < kidsPayload.kids.length; i++) {
      var kid = kidsPayload.kids[i];
      if (kid.streakDays && kid.streakDays >= 2) {
        moments.push(kid.name + ': \ud83d\udd25 ' + kid.streakDays + '-day streak!');
      }
      if (kid.starsToday && kid.starsToday > 0) {
        moments.push(kid.name + ' earned ' + kid.starsToday + ' star' + (kid.starsToday > 1 ? 's' : '') + ' today!');
      }
    }
  }

  // Family note
  if (boardPayload && boardPayload.familyNote) {
    moments.push(boardPayload.familyNote);
  }

  // Rotate by 5-minute window
  if (moments.length === 0) return '';
  var idx = Math.floor(new Date().getMinutes() / 5) % moments.length;
  return moments[idx];
}

// END OF FILE — DataEngine v86