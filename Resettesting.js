/**
 * KH_ClearTestData_v2.gs — Wipe ALL KidsHub test data for clean slate
 * 
 * Run clearKHTestData() from the Apps Script editor.
 * 
 * Clears data rows (preserves headers):
 *   KH_History, KH_Redemptions, KH_Streaks, KH_ScreenTime, KH_Deductions, KH_Requests
 * 
 * Resets KH_Chores:
 *   Completed=false, Completed_Date=blank, Parent_Approved=false, Bonus_Multiplier=1
 * 
 * Resets KH_Children:
 *   Bank_Opening=0 for all kids
 * 
 * Does NOT touch: KH_Rewards, KH_Chores structure, KH_Children config, seed data
 */
function clearKHTestData() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  var ss = SpreadsheetApp.openById('1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c');
  
  function getSheet(key) {
    var name = typeof TAB_MAP !== 'undefined' ? (TAB_MAP[key] || key) : key;
    return ss.getSheetByName(name);
  }
  
  function clearDataRows(key) {
    var sheet = getSheet(key);
    if (!sheet) { Logger.log('⚠ ' + key + ' not found — skipping'); return 0; }
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) { Logger.log('✓ ' + key + ' already empty'); return 0; }
    sheet.deleteRows(2, lastRow - 1);
    Logger.log('✓ ' + key + ' cleared (' + (lastRow - 1) + ' rows removed)');
    return lastRow - 1;
  }
  
  Logger.log('═══ KidsHub Test Data Clear v2 ═══');
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
    Logger.log('✓ KH_Chores reset (' + resetCount + ' rows: Completed=false, Date=blank, Approved=false, Mult=1)');
  } else {
    Logger.log('⚠ KH_Chores not found');
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
      Logger.log('✓ KH_Children Bank_Opening reset to $0 (' + bankReset + ' kids)');
    } else {
      Logger.log('⚠ Bank_Opening column not found in KH_Children');
    }
  } else {
    Logger.log('⚠ KH_Children not found');
  }
  
  Logger.log('');
  Logger.log('═══ Clean slate ready ═══');
  Logger.log('Cleared: ' + totalCleared + ' data rows across ' + tabs.length + ' tabs');
  Logger.log('Chores: All reset to uncompleted');
  Logger.log('Banks: $0 for all kids');
  Logger.log('Screen Time: 0m TV, 0m Gaming for all kids');
  Logger.log('Rings/Stars: 0 (no history = no earned points)');
  lock.releaseLock();
}