// ════════════════════════════════════════════════════════════════════
// ResetTesting.gs v2 — QA Sandbox Reset + Seed Tooling
// WRITES TO: KH_ tabs (KH_History, KH_Chores, KH_Children, etc.)
// READS FROM: TAB_MAP (via DataEngine global scope)
// ════════════════════════════════════════════════════════════════════

function getResetTestingVersion() { return 2; }

// ════════════════════════════════════════════════════════════════════
// 1. ENVIRONMENT-GUARDED RESET
//
// clearKHTestData() — wipes all KidsHub test data for clean slate.
// v2: Now requires QA environment. Will not run against production.
// ════════════════════════════════════════════════════════════════════

function clearKHTestData() {
  tbm_requireQA_('clearKHTestData');

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var ss = SpreadsheetApp.openById(SSID);

  function getSheet(key) {
    var name = typeof TAB_MAP !== 'undefined' ? (TAB_MAP[key] || key) : key;
    return ss.getSheetByName(name);
  }

  function clearDataRows(key) {
    var sheet = getSheet(key);
    if (!sheet) { Logger.log('WARNING: ' + key + ' not found — skipping'); return 0; }
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) { Logger.log('OK: ' + key + ' already empty'); return 0; }
    sheet.deleteRows(2, lastRow - 1);
    Logger.log('OK: ' + key + ' cleared (' + (lastRow - 1) + ' rows removed)');
    return lastRow - 1;
  }

  Logger.log('=== KidsHub Test Data Clear v2 ===');
  Logger.log('Environment: ' + TBM_ENV.ENV_NAME);
  Logger.log('SSID: ' + SSID);
  Logger.log('Time: ' + new Date().toISOString());
  Logger.log('');

  // 1. Clear all history/ledger tabs
  var tabs = [
    'KH_History',
    'KH_Redemptions',
    'KH_Streaks',
    'KH_ScreenTime',
    'KH_Deductions',
    'KH_Requests'
  ];
  var totalCleared = 0;
  for (var t = 0; t < tabs.length; t++) {
    totalCleared += clearDataRows(tabs[t]);
  }

  // 2. Reset KH_Chores completion columns
  var chores = getSheet('KH_Chores');
  if (chores) {
    var data = chores.getDataRange().getValues();
    var headers = data[0].map(String);
    var cDone = headers.indexOf('Completed');
    var cDate = headers.indexOf('Completed_Date');
    var cAppr = headers.indexOf('Parent_Approved');
    var cMult = headers.indexOf('Bonus_Multiplier');
    var resetCount = 0;

    for (var i = 1; i < data.length; i++) {
      var row = i + 1;
      if (cDone >= 0) chores.getRange(row, cDone + 1).setValue(false);
      if (cDate >= 0) chores.getRange(row, cDate + 1).setValue('');
      if (cAppr >= 0) chores.getRange(row, cAppr + 1).setValue(false);
      if (cMult >= 0) chores.getRange(row, cMult + 1).setValue(1);
      resetCount++;
    }
    Logger.log('OK: KH_Chores reset (' + resetCount + ' rows: Completed=false, Date=blank, Approved=false, Mult=1)');
  } else {
    Logger.log('WARNING: KH_Chores not found');
  }

  // 3. Reset Bank_Opening to 0 for all kids
  var children = getSheet('KH_Children');
  if (children) {
    var cData = children.getDataRange().getValues();
    var cHeaders = cData[0].map(String);
    var boCol = cHeaders.indexOf('Bank_Opening');
    var bankReset = 0;
    if (boCol >= 0) {
      for (var k = 1; k < cData.length; k++) {
        children.getRange(k + 1, boCol + 1).setValue(0);
        bankReset++;
      }
      Logger.log('OK: KH_Children Bank_Opening reset to $0 (' + bankReset + ' kids)');
    } else {
      Logger.log('WARNING: Bank_Opening column not found in KH_Children');
    }
  } else {
    Logger.log('WARNING: KH_Children not found');
  }

  Logger.log('');
  Logger.log('=== Clean slate ready ===');
  Logger.log('Cleared: ' + totalCleared + ' data rows across ' + tabs.length + ' tabs');
  Logger.log('Chores: All reset to uncompleted');
  Logger.log('Banks: $0 for all kids');
  lock.releaseLock();
}


// ════════════════════════════════════════════════════════════════════
// 2. QA SEED FUNCTIONS
//
// Populate the QA workbook with known test data so tests can
// reference specific values. All seed functions require QA env.
// ════════════════════════════════════════════════════════════════════

/**
 * Master seed — resets everything then populates all test data.
 * Run from GAS editor after setting TBM_ENV=qa.
 */
function seedQAWorkbook() {
  tbm_requireQA_('seedQAWorkbook');
  Logger.log('=== QA Workbook Seed ===');
  Logger.log('Environment: ' + TBM_ENV.ENV_NAME);
  Logger.log('SSID: ' + SSID);
  Logger.log('');

  clearKHTestData();
  seedKHChores_();
  seedKHHistory_();
  seedSampleTransactions_();
  seedSampleBalanceHistory_();

  Logger.log('');
  Logger.log('=== QA Seed Complete ===');
}

/**
 * Seed KH_Chores with known tasks for both kids.
 * 3 morning + 2 afternoon + 1 evening per kid.
 */
function seedKHChores_() {
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_Chores'] || 'KH_Chores') : 'KH_Chores';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) { Logger.log('WARNING: KH_Chores not found — skipping seed'); return; }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  var colMap = {};
  for (var h = 0; h < headers.length; h++) { colMap[headers[h]] = h; }

  // Clear existing data rows
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }

  var tasks = [
    // Buggsy — morning
    {Child: 'buggsy', Task_Name: 'QA-Make Bed', Time_Block: 'Morning', Points: 5, Must_Do: true},
    {Child: 'buggsy', Task_Name: 'QA-Brush Teeth AM', Time_Block: 'Morning', Points: 3, Must_Do: true},
    {Child: 'buggsy', Task_Name: 'QA-Get Dressed', Time_Block: 'Morning', Points: 3, Must_Do: true},
    // Buggsy — afternoon/evening
    {Child: 'buggsy', Task_Name: 'QA-Homework', Time_Block: 'Afternoon', Points: 10, Must_Do: true},
    {Child: 'buggsy', Task_Name: 'QA-Read 20min', Time_Block: 'Afternoon', Points: 5, Must_Do: false},
    {Child: 'buggsy', Task_Name: 'QA-Brush Teeth PM', Time_Block: 'Evening', Points: 3, Must_Do: true},
    // JJ — morning
    {Child: 'jj', Task_Name: 'QA-Make Bed', Time_Block: 'Morning', Points: 5, Must_Do: true},
    {Child: 'jj', Task_Name: 'QA-Brush Teeth AM', Time_Block: 'Morning', Points: 3, Must_Do: true},
    {Child: 'jj', Task_Name: 'QA-Get Dressed', Time_Block: 'Morning', Points: 3, Must_Do: true},
    // JJ — afternoon/evening
    {Child: 'jj', Task_Name: 'QA-Pick Up Toys', Time_Block: 'Afternoon', Points: 5, Must_Do: true},
    {Child: 'jj', Task_Name: 'QA-Coloring Time', Time_Block: 'Afternoon', Points: 3, Must_Do: false},
    {Child: 'jj', Task_Name: 'QA-Brush Teeth PM', Time_Block: 'Evening', Points: 3, Must_Do: true}
  ];

  var rows = [];
  for (var i = 0; i < tasks.length; i++) {
    var t = tasks[i];
    var row = new Array(headers.length);
    for (var c = 0; c < row.length; c++) row[c] = '';
    if (colMap['Child'] !== undefined) row[colMap['Child']] = t.Child;
    if (colMap['Task_Name'] !== undefined) row[colMap['Task_Name']] = t.Task_Name;
    if (colMap['Time_Block'] !== undefined) row[colMap['Time_Block']] = t.Time_Block;
    if (colMap['Points'] !== undefined) row[colMap['Points']] = t.Points;
    if (colMap['Must_Do'] !== undefined) row[colMap['Must_Do']] = t.Must_Do;
    if (colMap['Completed'] !== undefined) row[colMap['Completed']] = false;
    if (colMap['Parent_Approved'] !== undefined) row[colMap['Parent_Approved']] = false;
    if (colMap['Bonus_Multiplier'] !== undefined) row[colMap['Bonus_Multiplier']] = 1;
    rows.push(row);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  Logger.log('OK: KH_Chores seeded with ' + rows.length + ' tasks (' + tasks.length + ' total, 6 per kid)');
}

/**
 * Seed KH_History with approval test data.
 * 5 completed+approved, 2 pending approval, 1 declined.
 */
function seedKHHistory_() {
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_History'] || 'KH_History') : 'KH_History';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) { Logger.log('WARNING: KH_History not found — skipping seed'); return; }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  var colMap = {};
  for (var h = 0; h < headers.length; h++) { colMap[headers[h]] = h; }

  var today = (typeof tbm_now_ === 'function') ? tbm_now_() : new Date();
  var yesterday = new Date(today.getTime() - 86400000);

  var entries = [
    // Approved entries (yesterday)
    {Child: 'buggsy', Task_Name: 'QA-Make Bed', Points_Earned: 5, Status: 'approved', Date: yesterday},
    {Child: 'buggsy', Task_Name: 'QA-Brush Teeth AM', Points_Earned: 3, Status: 'approved', Date: yesterday},
    {Child: 'buggsy', Task_Name: 'QA-Get Dressed', Points_Earned: 3, Status: 'approved', Date: yesterday},
    {Child: 'jj', Task_Name: 'QA-Make Bed', Points_Earned: 5, Status: 'approved', Date: yesterday},
    {Child: 'jj', Task_Name: 'QA-Brush Teeth AM', Points_Earned: 3, Status: 'approved', Date: yesterday},
    // Pending approval (today)
    {Child: 'buggsy', Task_Name: 'QA-Homework', Points_Earned: 10, Status: 'pending', Date: today},
    {Child: 'jj', Task_Name: 'QA-Pick Up Toys', Points_Earned: 5, Status: 'pending', Date: today},
    // Declined
    {Child: 'buggsy', Task_Name: 'QA-Read 20min', Points_Earned: 0, Status: 'declined', Date: yesterday}
  ];

  var rows = [];
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    var row = new Array(headers.length);
    for (var c = 0; c < row.length; c++) row[c] = '';
    if (colMap['Child'] !== undefined) row[colMap['Child']] = e.Child;
    if (colMap['Task_Name'] !== undefined) row[colMap['Task_Name']] = e.Task_Name;
    if (colMap['Points_Earned'] !== undefined) row[colMap['Points_Earned']] = e.Points_Earned;
    if (colMap['Status'] !== undefined) row[colMap['Status']] = e.Status;
    if (colMap['Date'] !== undefined) row[colMap['Date']] = e.Date;
    if (colMap['Completed_Date'] !== undefined) row[colMap['Completed_Date']] = e.Date;
    rows.push(row);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  Logger.log('OK: KH_History seeded with ' + rows.length + ' entries (5 approved, 2 pending, 1 declined)');
}

/**
 * Seed Transactions with sample categorized entries for DataEngine testing.
 * 10 entries spanning 3 categories.
 */
function seedSampleTransactions_() {
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['Transactions'] || 'Transactions') : 'Transactions';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) { Logger.log('WARNING: Transactions not found — skipping seed'); return; }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  var colMap = {};
  for (var h = 0; h < headers.length; h++) { colMap[headers[h]] = h; }

  var today = new Date();
  var entries = [
    {Date: new Date(today.getFullYear(), today.getMonth(), 1), Description: 'QA-Grocery Store', Amount: -125.50, Category: 'Groceries', Account: 'QA Checking'},
    {Date: new Date(today.getFullYear(), today.getMonth(), 3), Description: 'QA-Gas Station', Amount: -45.00, Category: 'Auto & Transport', Account: 'QA Checking'},
    {Date: new Date(today.getFullYear(), today.getMonth(), 5), Description: 'QA-Electric Bill', Amount: -180.00, Category: 'Utilities', Account: 'QA Checking'},
    {Date: new Date(today.getFullYear(), today.getMonth(), 7), Description: 'QA-Restaurant', Amount: -65.00, Category: 'Dining Out', Account: 'QA Credit Card'},
    {Date: new Date(today.getFullYear(), today.getMonth(), 10), Description: 'QA-Paycheck', Amount: 3500.00, Category: 'LT Income', Account: 'QA Checking'},
    {Date: new Date(today.getFullYear(), today.getMonth(), 12), Description: 'QA-Amazon', Amount: -42.99, Category: 'Shopping', Account: 'QA Credit Card'},
    {Date: new Date(today.getFullYear(), today.getMonth(), 15), Description: 'QA-Mortgage', Amount: -1800.00, Category: 'Mortgage', Account: 'QA Checking'},
    {Date: new Date(today.getFullYear(), today.getMonth(), 18), Description: 'QA-Grocery Store 2', Amount: -98.75, Category: 'Groceries', Account: 'QA Checking'},
    {Date: new Date(today.getFullYear(), today.getMonth(), 20), Description: 'QA-CC Payment', Amount: -500.00, Category: 'CC Payment', Account: 'QA Checking'},
    {Date: new Date(today.getFullYear(), today.getMonth(), 25), Description: 'QA-Paycheck 2', Amount: 3500.00, Category: 'LT Income', Account: 'QA Checking'}
  ];

  var rows = [];
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i];
    var row = new Array(headers.length);
    for (var c = 0; c < row.length; c++) row[c] = '';
    if (colMap['Date'] !== undefined) row[colMap['Date']] = e.Date;
    if (colMap['Description'] !== undefined) row[colMap['Description']] = e.Description;
    if (colMap['Amount'] !== undefined) row[colMap['Amount']] = e.Amount;
    if (colMap['Category'] !== undefined) row[colMap['Category']] = e.Category;
    if (colMap['Account'] !== undefined) row[colMap['Account']] = e.Account;
    rows.push(row);
  }

  // Append after existing data (don't clear Transactions — may have formulas in row 1)
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) lastRow = 1;
  if (rows.length > 0) {
    sheet.getRange(lastRow + 1, 1, rows.length, headers.length).setValues(rows);
  }
  Logger.log('OK: Transactions seeded with ' + rows.length + ' sample entries');
}

/**
 * Seed Balance History with fake account balances for DE testing.
 * 4 fake accounts, 3 rows each.
 */
function seedSampleBalanceHistory_() {
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['BalanceHistory'] || 'Balance History') : 'Balance History';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) { Logger.log('WARNING: Balance History not found — skipping seed'); return; }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  var colMap = {};
  for (var h = 0; h < headers.length; h++) { colMap[headers[h]] = h; }

  var today = new Date();
  var accounts = [
    {name: 'QA Checking', balances: [5200, 4800, 5100]},
    {name: 'QA Credit Card', balances: [-2100, -2300, -2050]},
    {name: 'QA Savings', balances: [10000, 10000, 10025]},
    {name: 'QA Auto Loan', balances: [-15000, -14800, -14600]}
  ];

  var rows = [];
  for (var a = 0; a < accounts.length; a++) {
    var acct = accounts[a];
    for (var b = 0; b < acct.balances.length; b++) {
      var row = new Array(headers.length);
      for (var c = 0; c < row.length; c++) row[c] = '';
      var d = new Date(today.getFullYear(), today.getMonth(), (b + 1) * 10);
      if (colMap['Date'] !== undefined) row[colMap['Date']] = d;
      if (colMap['Account'] !== undefined) row[colMap['Account']] = acct.name;
      if (colMap['Balance'] !== undefined) row[colMap['Balance']] = acct.balances[b];
      rows.push(row);
    }
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 1) lastRow = 1;
  if (rows.length > 0) {
    sheet.getRange(lastRow + 1, 1, rows.length, headers.length).setValues(rows);
  }
  Logger.log('OK: Balance History seeded with ' + rows.length + ' entries (4 accounts x 3 snapshots)');
}


/**
 * Full QA reset — clears everything and reseeds.
 * This is the one-button "give me a fresh QA environment" function.
 */
function resetQAData() {
  tbm_requireQA_('resetQAData');
  Logger.log('=== Full QA Reset + Reseed ===');
  seedQAWorkbook();
  Logger.log('=== resetQAData complete ===');
}

// Version history tracked in Notion deploy page. Do not add version comments here.
// ResetTesting.gs v2 — EOF
