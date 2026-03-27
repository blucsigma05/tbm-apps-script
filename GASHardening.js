// ════════════════════════════════════════════════════════════════════
// GAS HARDENING v2 — Centralized Monitoring, Logging & Maintenance
// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════

function getGASHardeningVersion() { return 2; }

//
// WHAT THIS DOES:
//   1. Centralized error logging to an ErrorLog sheet
//   2. Performance monitoring wrapper for all Safe functions
//   3. Trigger audit / cleanup
//   4. Tiller sync health check (daily trigger)
//   5. Monthly auto-close preflight
//   6. PropertiesService config migration
//
// INSTALL:
//   1. Paste this file into Apps Script project as GASHardening.gs
//   2. Run setupErrorLogSheet() once to create the ErrorLog tab
//   3. Run auditTriggers() to see what's currently installed
//   4. Run installHardeningTriggers() to set up daily Tiller check
//   5. Modify Code.gs Safe wrappers per the wiring guide below
// ════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════
// 1. ERROR LOGGING
// ═══════════════════════════════════════════════════════════════

/**
 * Create the ErrorLog tab if it doesn't exist.
 * Run once from the editor.
 */
function setupErrorLogSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('💻 ErrorLog');
  if (!sheet) {
    sheet = ss.insertSheet('💻 ErrorLog');
    sheet.appendRow(['Timestamp', 'Function', 'Error Message', 'Stack Trace', 'Duration (s)']);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 180);
    sheet.setColumnWidth(3, 400);
    sheet.setColumnWidth(4, 400);
    sheet.setColumnWidth(5, 90);
    Logger.log('✓ ErrorLog sheet created');
  } else {
    Logger.log('ErrorLog sheet already exists');
  }
}

/**
 * Centralized error logger. Call from any catch block.
 * @param {string} functionName - which function errored
 * @param {Error|string} error - the caught error
 * @param {number} [durationSec] - optional elapsed time before error
 */
function logError_(functionName, error, durationSec) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('💻 ErrorLog');
    if (!sheet) return; // fail silently if sheet doesn't exist yet
    
    var msg = (error && error.message) ? error.message : String(error);
    var stack = (error && error.stack) ? error.stack : '';
    var dur = (typeof durationSec === 'number') ? durationSec.toFixed(2) : '';
    
    sheet.appendRow([
      new Date().toISOString(),
      functionName,
      msg,
      stack,
      dur
    ]);
    
    // Keep only last 500 rows to prevent bloat
    var totalRows = sheet.getLastRow();
    if (totalRows > 501) {
      sheet.deleteRows(2, totalRows - 501);
    }
  } catch(e) {
    // If logging itself fails, just console.warn — don't throw
    console.warn('logError_ failed: ' + e.message);
  }
}


// ═══════════════════════════════════════════════════════════════
// 2. PERFORMANCE MONITORING
// ═══════════════════════════════════════════════════════════════

/**
 * Performance monitoring sheet — optional, for tracking trends.
 * Run once to create.
 */
function setupPerfLogSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('💻 PerfLog');
  if (!sheet) {
    sheet = ss.insertSheet('💻 PerfLog');
    sheet.appendRow(['Timestamp', 'Function', 'Duration (s)', 'Status', 'Note']);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
    Logger.log('✓ PerfLog sheet created');
  } else {
    Logger.log('PerfLog sheet already exists');
  }
}

/**
 * Log a performance entry. Only logs if duration > threshold OR if it errored.
 * @param {string} functionName
 * @param {number} durationSec
 * @param {string} status - 'OK' or 'ERROR'
 * @param {string} [note] - optional note (e.g., error message)
 */
function logPerf_(functionName, durationSec, status, note) {
  try {
    // Always console.log for Apps Script execution log visibility
    var logLine = '⏱ ' + functionName + ': ' + durationSec.toFixed(2) + 's [' + status + ']';
    if (note) logLine += ' — ' + note;
    console.log(logLine);
    
    // Only write to sheet if slow (>3s) or errored
    if (durationSec > 3 || status === 'ERROR') {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('💻 PerfLog');
      if (!sheet) return;
      
      sheet.appendRow([
        new Date().toISOString(),
        functionName,
        parseFloat(durationSec.toFixed(2)),
        status,
        note || ''
      ]);
      
      // Keep only last 500 rows
      var totalRows = sheet.getLastRow();
      if (totalRows > 501) {
        sheet.deleteRows(2, totalRows - 501);
      }
    }
    
    // Email alert if approaching 6-min GAS limit
    if (durationSec > 240) { // 4 minutes = danger zone
      try {
        MailApp.sendEmail(
          Session.getEffectiveUser().getEmail(),
          '⚠️ TBM GAS: ' + functionName + ' took ' + durationSec.toFixed(0) + 's',
          'Function ' + functionName + ' took ' + durationSec.toFixed(2) + ' seconds.\n' +
          'GAS limit is 360 seconds (6 minutes).\n' +
          'This function is at ' + ((durationSec / 360) * 100).toFixed(0) + '% of the limit.\n\n' +
          'Investigate batch reads, caching, or splitting the function.'
        );
      } catch(mailErr) {
        console.warn('Could not send perf alert email: ' + mailErr.message);
      }
    }
  } catch(e) {
    console.warn('logPerf_ failed: ' + e.message);
  }
}

/**
 * Wrap any function with performance monitoring and error logging.
 * Usage in Code.gs Safe wrappers — see wiring guide below.
 *
 * @param {string} name - function name for logging
 * @param {Function} fn - the function to execute
 * @return {*} the function's return value
 */
function withMonitor_(name, fn) {
  var start = new Date().getTime();
  try {
    var result = fn();
    var elapsed = (new Date().getTime() - start) / 1000;
    logPerf_(name, elapsed, 'OK');
    return result;
  } catch(e) {
    var elapsed = (new Date().getTime() - start) / 1000;
    logPerf_(name, elapsed, 'ERROR', e.message);
    logError_(name, e, elapsed);
    throw e; // re-throw so the Safe wrapper can handle it
  }
}


// ═══════════════════════════════════════════════════════════════
// 3. TRIGGER AUDIT & CLEANUP
// ═══════════════════════════════════════════════════════════════

/**
 * Audit all installed triggers. Run from editor, check Logs.
 * Flags orphaned triggers (handler function doesn't exist).
 */
function auditTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log('═══ TRIGGER AUDIT ═══');
  Logger.log('Total triggers installed: ' + triggers.length);
  Logger.log('GAS quota: 20 triggers per project');
  Logger.log('');
  
  var orphans = [];
  
  for (var i = 0; i < triggers.length; i++) {
    var t = triggers[i];
    var handler = t.getHandlerFunction();
    var exists = false;
    try { exists = typeof eval(handler) === 'function'; } catch(e) {}
    
    var triggerType = '';
    try { triggerType = String(t.getEventType()); } catch(e) { triggerType = 'UNKNOWN'; }
    
    var source = '';
    try { source = String(t.getTriggerSource()); } catch(e) { source = 'UNKNOWN'; }
    
    var status = exists ? '✓' : '✗ ORPHAN';
    Logger.log(
      '  [' + (i + 1) + '] ' + status +
      ' | Handler: ' + handler +
      ' | Type: ' + triggerType +
      ' | Source: ' + source +
      ' | ID: ' + t.getUniqueId()
    );
    
    if (!exists) {
      orphans.push({ trigger: t, handler: handler, id: t.getUniqueId() });
    }
  }
  
  Logger.log('');
  if (orphans.length > 0) {
    Logger.log('⚠ Found ' + orphans.length + ' orphaned trigger(s):');
    for (var j = 0; j < orphans.length; j++) {
      Logger.log('  → ' + orphans[j].handler + ' (ID: ' + orphans[j].id + ')');
    }
    Logger.log('');
    Logger.log('Run deleteOrphanedTriggers() to remove them.');
  } else {
    Logger.log('✓ No orphaned triggers found.');
  }
  
  Logger.log('');
  Logger.log('Remaining quota: ' + (20 - triggers.length) + ' trigger slots');
}

/**
 * Delete all triggers whose handler function doesn't exist.
 * Run AFTER reviewing auditTriggers() output.
 */
function deleteOrphanedTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var deleted = 0;
  
  for (var i = 0; i < triggers.length; i++) {
    var handler = triggers[i].getHandlerFunction();
    var exists = false;
    try { exists = typeof eval(handler) === 'function'; } catch(e) {}
    
    if (!exists) {
      Logger.log('Deleting orphaned trigger: ' + handler + ' (ID: ' + triggers[i].getUniqueId() + ')');
      ScriptApp.deleteTrigger(triggers[i]);
      deleted++;
    }
  }
  
  Logger.log('Deleted ' + deleted + ' orphaned trigger(s). Remaining: ' + (ScriptApp.getProjectTriggers().length));
}

/**
 * List all triggers in a compact format for quick reference.
 */
function listTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log('Active triggers (' + triggers.length + '/20):');
  for (var i = 0; i < triggers.length; i++) {
    Logger.log('  ' + triggers[i].getHandlerFunction() + ' → ' + triggers[i].getEventType());
  }
}


// ═══════════════════════════════════════════════════════════════
// 4. TILLER SYNC HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

/**
 * Check every account's most recent transaction date.
 * Flags any account >3 days stale.
 * Designed to run daily via time-driven trigger.
 */
function checkTillerSyncHealth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var txnSheet = ss.getSheetByName('Transactions');
  if (!txnSheet) {
    Logger.log('ERROR: Transactions sheet not found');
    return;
  }
  
  var data = txnSheet.getDataRange().getValues();
  var headers = data[0];
  
  // Find column indices (Tiller convention: B=Date, F=Account)
  var dateCol = -1, acctCol = -1;
  for (var h = 0; h < headers.length; h++) {
    var hdr = String(headers[h]).toLowerCase().trim();
    if (hdr === 'date') dateCol = h;
    if (hdr === 'account') acctCol = h;
  }
  
  if (dateCol === -1 || acctCol === -1) {
    Logger.log('ERROR: Could not find Date or Account columns');
    return;
  }
  
  // Build map of account → most recent transaction date
  var accountDates = {};
  for (var r = 1; r < data.length; r++) {
    var acct = String(data[r][acctCol]).trim();
    var txnDate = data[r][dateCol];
    if (!acct || !txnDate) continue;
    
    if (txnDate instanceof Date) {
      if (!accountDates[acct] || txnDate > accountDates[acct]) {
        accountDates[acct] = txnDate;
      }
    }
  }
  
  // Check staleness
  var now = new Date();
  var staleDays = 3;
  var staleAccounts = [];
  var allOk = true;
  
  Logger.log('═══ TILLER SYNC HEALTH CHECK ═══');
  Logger.log('Checked at: ' + now.toISOString());
  Logger.log('Stale threshold: ' + staleDays + ' days');
  Logger.log('');
  
  var accounts = Object.keys(accountDates).sort();
  for (var a = 0; a < accounts.length; a++) {
    var name = accounts[a];
    var lastDate = accountDates[name];
    var ageMs = now.getTime() - lastDate.getTime();
    var ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    var status = ageDays > staleDays ? '⚠ STALE' : '✓';
    
    Logger.log('  ' + status + ' ' + name + ': last txn ' + ageDays + ' days ago (' + lastDate.toLocaleDateString() + ')');
    
    if (ageDays > staleDays) {
      staleAccounts.push({ name: name, ageDays: ageDays, lastDate: lastDate });
      allOk = false;
    }
  }
  
  Logger.log('');
  
  // Email alert if stale accounts found
  if (!allOk) {
    Logger.log('⚠ ' + staleAccounts.length + ' account(s) stale — sending alert email');
    
    var body = 'Tiller Sync Health Check — ' + now.toLocaleDateString() + '\n\n';
    body += staleAccounts.length + ' account(s) have not synced in ' + staleDays + '+ days:\n\n';
    for (var s = 0; s < staleAccounts.length; s++) {
      body += '  • ' + staleAccounts[s].name + ': ' + staleAccounts[s].ageDays + ' days (last: ' + staleAccounts[s].lastDate.toLocaleDateString() + ')\n';
    }
    body += '\nCheck Tiller Console → Linked Accounts for connection issues.';
    
    try {
      MailApp.sendEmail(
        Session.getEffectiveUser().getEmail(),
        '⚠️ TBM: ' + staleAccounts.length + ' Tiller account(s) stale',
        body
      );
      Logger.log('Alert email sent.');
    } catch(e) {
      Logger.log('Could not send email: ' + e.message);
    }
  } else {
    Logger.log('✓ All accounts syncing normally.');
  }
}


// ═══════════════════════════════════════════════════════════════
// 5. MONTHLY AUTO-CLOSE PREFLIGHT
// ═══════════════════════════════════════════════════════════════

/**
 * Check the prior month against Definition of Done.
 * Run on 1st of each month via trigger, or manually anytime.
 * 
 * Definition of Done:
 *   1. Uncategorized = 0
 *   2. ATM/Cash < 20
 *   3. Transfers net to ~$0 (within $5)
 *   4. Large transactions (>$500) flagged for review
 */
function monthClosePreflight() {
  var now = new Date();
  // Prior month
  var priorYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  var priorMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // 1-indexed
  var priorLabel = priorYear + '-' + (priorMonth < 10 ? '0' : '') + priorMonth;
  
  var startDate = new Date(priorYear, priorMonth - 1, 1);
  var endDate = new Date(priorYear, priorMonth, 0); // last day
  
  Logger.log('═══ MONTH CLOSE PREFLIGHT: ' + priorLabel + ' ═══');
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var txnSheet = ss.getSheetByName('Transactions');
  if (!txnSheet) { Logger.log('ERROR: No Transactions sheet'); return; }
  
  var data = txnSheet.getDataRange().getValues();
  var headers = data[0];
  
  // Column indices
  var dateCol = -1, catCol = -1, amtCol = -1, descCol = -1;
  for (var h = 0; h < headers.length; h++) {
    var hdr = String(headers[h]).toLowerCase().trim();
    if (hdr === 'date') dateCol = h;
    if (hdr === 'category') catCol = h;
    if (hdr === 'amount') amtCol = h;
    if (hdr === 'description') descCol = h;
  }
  
  // Filter to prior month
  var monthTxns = [];
  for (var r = 1; r < data.length; r++) {
    var d = data[r][dateCol];
    if (!(d instanceof Date)) continue;
    if (d >= startDate && d <= endDate) {
      monthTxns.push({
        date: d,
        category: String(data[r][catCol] || '').trim(),
        amount: parseFloat(data[r][amtCol]) || 0,
        description: String(data[r][descCol] || '').trim()
      });
    }
  }
  
  Logger.log('Total transactions: ' + monthTxns.length);
  Logger.log('');
  
  var issues = [];
  
  // CHECK 1: Uncategorized = 0
  var uncategorized = monthTxns.filter(function(t) {
    return !t.category || t.category.toLowerCase() === 'uncategorized';
  });
  if (uncategorized.length > 0) {
    issues.push('❌ ' + uncategorized.length + ' uncategorized transaction(s)');
    Logger.log('❌ CHECK 1 — Uncategorized: ' + uncategorized.length);
    for (var u = 0; u < Math.min(uncategorized.length, 10); u++) {
      Logger.log('  → ' + uncategorized[u].date.toLocaleDateString() + ' | $' + uncategorized[u].amount.toFixed(2) + ' | ' + uncategorized[u].description);
    }
    if (uncategorized.length > 10) Logger.log('  ... and ' + (uncategorized.length - 10) + ' more');
  } else {
    Logger.log('✅ CHECK 1 — Uncategorized: 0');
  }
  
  // CHECK 2: ATM/Cash < 20
  var atmCash = monthTxns.filter(function(t) {
    var cat = t.category.toLowerCase();
    return cat === 'atm' || cat === 'cash' || cat === 'atm/cash' || cat === 'cash & atm';
  });
  if (atmCash.length >= 20) {
    issues.push('⚠️ ATM/Cash transactions: ' + atmCash.length + ' (threshold: <20)');
    Logger.log('⚠️ CHECK 2 — ATM/Cash: ' + atmCash.length + ' (audit for misclassification)');
  } else {
    Logger.log('✅ CHECK 2 — ATM/Cash: ' + atmCash.length);
  }
  
  // CHECK 3: Transfer categories net to ~$0
  var transferCats = ['transfer', 'transfers', 'account transfer', 'internal transfer'];
  var transferNet = 0;
  var transferCount = 0;
  for (var t = 0; t < monthTxns.length; t++) {
    if (transferCats.indexOf(monthTxns[t].category.toLowerCase()) !== -1) {
      transferNet += monthTxns[t].amount;
      transferCount++;
    }
  }
  if (Math.abs(transferNet) > 5) {
    issues.push('⚠️ Transfers net to $' + transferNet.toFixed(2) + ' (should be ~$0)');
    Logger.log('⚠️ CHECK 3 — Transfer net: $' + transferNet.toFixed(2) + ' across ' + transferCount + ' txns');
  } else {
    Logger.log('✅ CHECK 3 — Transfer net: $' + transferNet.toFixed(2) + ' (' + transferCount + ' txns)');
  }
  
  // CHECK 4: Large transactions (>$500)
  var large = monthTxns.filter(function(t) { return Math.abs(t.amount) > 500; });
  if (large.length > 0) {
    issues.push('📋 ' + large.length + ' large transaction(s) (>$500) — review flagged');
    Logger.log('📋 CHECK 4 — Large transactions: ' + large.length);
    for (var lg = 0; lg < large.length; lg++) {
      Logger.log('  → ' + large[lg].date.toLocaleDateString() + ' | $' + large[lg].amount.toFixed(2) + ' | ' + large[lg].category + ' | ' + large[lg].description);
    }
  } else {
    Logger.log('✅ CHECK 4 — No large transactions');
  }
  
  // SUMMARY
  Logger.log('');
  var verdict = issues.length === 0 ? '🟢 READY TO CLOSE' : '🔴 NEEDS ATTENTION';
  Logger.log('═══ VERDICT: ' + verdict + ' ═══');
  
  // Send email with results
  var body = 'Month Close Preflight: ' + priorLabel + '\n';
  body += 'Verdict: ' + verdict + '\n\n';
  
  if (issues.length > 0) {
    body += 'Issues found:\n';
    for (var i = 0; i < issues.length; i++) {
      body += '  ' + issues[i] + '\n';
    }
  } else {
    body += 'All checks passed. ' + priorLabel + ' is ready to close.\n';
  }
  
  body += '\nTotal transactions reviewed: ' + monthTxns.length;
  
  try {
    var emoji = issues.length === 0 ? '🟢' : '🔴';
    MailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      emoji + ' TBM Month Close: ' + priorLabel + ' — ' + (issues.length === 0 ? 'READY' : issues.length + ' issue(s)'),
      body
    );
    Logger.log('Preflight email sent.');
  } catch(e) {
    Logger.log('Could not send email: ' + e.message);
  }
  
  return { month: priorLabel, verdict: verdict, issues: issues, txnCount: monthTxns.length };
}


// ═══════════════════════════════════════════════════════════════
// 6. PROPERTIESSERVICE CONFIG MIGRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Migrate hardcoded config values to PropertiesService.
 * Run once. After this, read config via getConfig_().
 */
function migrateConfigToProperties() {
  var props = PropertiesService.getScriptProperties();
  
  // Only set if not already set (don't overwrite manual edits)
  var defaults = {
    'KIDS_DOMAIN': 'kids.memovein.com',
    'TILLER_STALE_DAYS': '3',
    'PERF_ALERT_THRESHOLD_SEC': '240',
    'ERROR_LOG_MAX_ROWS': '500',
    'PERF_LOG_SLOW_THRESHOLD_SEC': '3'
  };
  
  var existing = props.getProperties();
  var migrated = 0;
  
  for (var key in defaults) {
    if (!existing[key]) {
      props.setProperty(key, defaults[key]);
      Logger.log('  Set: ' + key + ' = ' + defaults[key]);
      migrated++;
    } else {
      Logger.log('  Skip (exists): ' + key + ' = ' + existing[key]);
    }
  }
  
  Logger.log('Migrated ' + migrated + ' config value(s). Total properties: ' + Object.keys(props.getProperties()).length);
}

/**
 * Read a config value from PropertiesService.
 * Falls back to a default if not set.
 */
function getConfig_(key, defaultVal) {
  var val = PropertiesService.getScriptProperties().getProperty(key);
  return val !== null ? val : (defaultVal || '');
}

/**
 * Show all current config values.
 */
function showConfig() {
  var props = PropertiesService.getScriptProperties().getProperties();
  Logger.log('═══ SCRIPT PROPERTIES ═══');
  var keys = Object.keys(props).sort();
  for (var i = 0; i < keys.length; i++) {
    Logger.log('  ' + keys[i] + ' = ' + props[keys[i]]);
  }
  Logger.log('Total: ' + keys.length);
}


// ═══════════════════════════════════════════════════════════════
// 7. WEEKLY SNAPSHOT (Vault Row)
// ═══════════════════════════════════════════════════════════════

/**
 * Write a single row of key metrics to a Snapshots sheet.
 * Run weekly via trigger (Saturday morning).
 * Over time, this becomes your trend data.
 */
function writeWeeklySnapshot() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create sheet if needed
  var sheet = ss.getSheetByName('💻 Snapshots');
  if (!sheet) {
    sheet = ss.insertSheet('💻 Snapshots');
    sheet.appendRow([
      'Date', 'Total Debt', 'Consumer Debt', 'Mortgage',
      'Net Worth', 'Monthly Burn', 'Cash on Hand',
      'Debt-Free Date', 'Active Accounts'
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
  }
  
  // Pull current metrics from DataEngine
  try {
    var now = new Date();
    var ym = now.getFullYear() + '-' + (now.getMonth() + 1 < 10 ? '0' : '') + (now.getMonth() + 1);
    var startStr = ym + '-01';
    var endStr = ym + '-' + new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    var data = getData(startStr, endStr, true);
    
    // Debt-free date from cascade if available
    var debtFreeDate = '';
    try {
      var cascadeSheet = ss.getSheetByName('💻 Cascade_Proof');
      if (cascadeSheet) {
        // Look for payoff date in cascade proof
        var proofData = cascadeSheet.getDataRange().getValues();
        for (var p = proofData.length - 1; p >= 0; p--) {
          if (String(proofData[p][0]).indexOf('Debt-Free') !== -1 || String(proofData[p][0]).indexOf('debt-free') !== -1) {
            debtFreeDate = String(proofData[p][1] || proofData[p][2] || '');
            break;
          }
        }
      }
    } catch(e) {}
    
    sheet.appendRow([
      new Date(),
      data.totalLiabilities || 0,
      data.debtCurrent || 0,
      data.mortgageBalance || 0,
      data.netWorth || 0,
      data.operatingExpenses || 0,
      data.totalAssets || 0,
      debtFreeDate,
      data.debts ? data.debts.length : 0
    ]);
    
    Logger.log('✓ Weekly snapshot written for ' + now.toLocaleDateString());
  } catch(e) {
    Logger.log('ERROR writing snapshot: ' + e.message);
    logError_('writeWeeklySnapshot', e);
  }
}


// ═══════════════════════════════════════════════════════════════
// 8. TRIGGER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Install all hardening triggers. Run once.
 * - Daily: Tiller sync health check (7 AM)
 * - Monthly: Close preflight (1st of month, 8 AM)
 * - Weekly: Snapshot (Saturday, 6 AM)
 */
function installHardeningTriggers() {
  // Remove existing hardening triggers first to avoid duplicates
  removeHardeningTriggers();
  
  // Daily Tiller health check at 7 AM
  ScriptApp.newTrigger('checkTillerSyncHealth')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();
  Logger.log('✓ Installed: checkTillerSyncHealth (daily 7 AM)');
  
  // Monthly close preflight on 1st at 8 AM
  ScriptApp.newTrigger('monthClosePreflight')
    .timeBased()
    .onMonthDay(1)
    .atHour(8)
    .create();
  Logger.log('✓ Installed: monthClosePreflight (1st of month, 8 AM)');
  
  // Weekly snapshot on Saturday at 6 AM
  ScriptApp.newTrigger('writeWeeklySnapshot')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SATURDAY)
    .atHour(6)
    .create();
  Logger.log('✓ Installed: writeWeeklySnapshot (Saturday 6 AM)');
  
  Logger.log('');
  Logger.log('All hardening triggers installed. Run auditTriggers() to verify.');
}

/**
 * Remove only the hardening triggers.
 */
function removeHardeningTriggers() {
  var targets = ['checkTillerSyncHealth', 'monthClosePreflight', 'writeWeeklySnapshot'];
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  
  for (var i = 0; i < triggers.length; i++) {
    if (targets.indexOf(triggers[i].getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  Logger.log('Removed ' + removed + ' hardening trigger(s).');
}


// ═══════════════════════════════════════════════════════════════
// 9. FULL SYSTEM DIAGNOSTIC
// ═══════════════════════════════════════════════════════════════

/**
 * Run everything at once. Use as a system health snapshot.
 */
function fullSystemDiagnostic() {
  Logger.log('╔══════════════════════════════════════════╗');
  Logger.log('║   TBM FULL SYSTEM DIAGNOSTIC             ║');
  Logger.log('║   ' + new Date().toISOString() + '       ║');
  Logger.log('╚══════════════════════════════════════════╝');
  Logger.log('');
  
  // Trigger audit
  auditTriggers();
  Logger.log('');
  
  // Config check
  showConfig();
  Logger.log('');
  
  // Tiller sync check
  checkTillerSyncHealth();
  Logger.log('');
  
  // Version check
  try {
    Logger.log('═══ COMPONENT VERSIONS ═══');
    try { Logger.log('  DataEngine: v' + getDataEngineVersion()); } catch(e) { Logger.log('  DataEngine: ERROR — ' + e.message); }
    try { Logger.log('  Code.gs: v' + getCodeGsVersion()); } catch(e) { Logger.log('  Code.gs: ERROR — ' + e.message); }
    try { Logger.log('  CascadeEngine: v' + getCascadeEngineVersion()); } catch(e) { Logger.log('  CascadeEngine: ERROR — ' + e.message); }
  } catch(e) {
    Logger.log('Version check error: ' + e.message);
  }
  
  Logger.log('');
  Logger.log('═══ DIAGNOSTIC COMPLETE ═══');
}


// ═══════════════════════════════════════════════════════════════
// 10. SYSTEM HEALTH DASHBOARD PAYLOAD
// ═══════════════════════════════════════════════════════════════
//
// Single function that reads all monitoring surfaces and returns
// one JSON blob for TheVein's System Ops panel (and a slim
// version for TheSpine heartbeat).
//
// Called via: google.script.run.getSystemHealthSafe()

/**
 * Full system health payload for TheVein.
 * Returns status for: Tiller sync, month close, errors, perf,
 * versions, triggers, snapshots, reconciliation, MER gates.
 */
function getSystemHealth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var now = new Date();
  var result = {};

  // ── 1. TILLER SYNC ──────────────────────────────────────────
  try {
    var txnSheet = ss.getSheetByName('Transactions');
    var tillerStatus = { status: 'unknown', staleAccounts: [], checkedAt: now.toISOString() };
    if (txnSheet) {
      var txnData = txnSheet.getDataRange().getValues();
      var headers = txnData[0];
      var dateCol = -1, acctCol = -1;
      for (var h = 0; h < headers.length; h++) {
        var hdr = String(headers[h]).toLowerCase().trim();
        if (hdr === 'date') dateCol = h;
        if (hdr === 'account') acctCol = h;
      }
      if (dateCol !== -1 && acctCol !== -1) {
        var accountDates = {};
        for (var r = 1; r < txnData.length; r++) {
          var acct = String(txnData[r][acctCol]).trim();
          var txnDate = txnData[r][dateCol];
          if (!acct || !(txnDate instanceof Date)) continue;
          if (!accountDates[acct] || txnDate > accountDates[acct]) {
            accountDates[acct] = txnDate;
          }
        }
        var staleDays = parseInt(getConfig_('TILLER_STALE_DAYS', '3'));
        var stale = [];
        var accounts = Object.keys(accountDates);
        for (var a = 0; a < accounts.length; a++) {
          var ageDays = Math.floor((now.getTime() - accountDates[accounts[a]].getTime()) / (1000 * 60 * 60 * 24));
          if (ageDays > staleDays) {
            stale.push({ name: accounts[a], ageDays: ageDays });
          }
        }
        tillerStatus.status = stale.length === 0 ? 'healthy' : 'stale';
        tillerStatus.staleAccounts = stale;
        tillerStatus.totalAccounts = accounts.length;
      }
    }
    result.tillerSync = tillerStatus;
  } catch(e) {
    result.tillerSync = { status: 'error', error: e.message };
  }

  // ── 2. MONTH STATUS ─────────────────────────────────────────
  try {
    var curYear = now.getFullYear();
    var curMonth = now.getMonth() + 1;
    var curLabel = curYear + '-' + (curMonth < 10 ? '0' : '') + curMonth;
    
    // Check if current month has uncategorized transactions
    var txnSheet2 = ss.getSheetByName('Transactions');
    var monthStatus = { month: curLabel, status: 'open', uncategorized: 0, atmCash: 0 };
    if (txnSheet2) {
      var startDate = new Date(curYear, curMonth - 1, 1);
      var endDate = new Date(curYear, curMonth, 0);
      var allData = txnSheet2.getDataRange().getValues();
      var hdr2 = allData[0];
      var dCol = -1, cCol = -1;
      for (var h2 = 0; h2 < hdr2.length; h2++) {
        var hn = String(hdr2[h2]).toLowerCase().trim();
        if (hn === 'date') dCol = h2;
        if (hn === 'category') cCol = h2;
      }
      if (dCol !== -1 && cCol !== -1) {
        var uncat = 0, atm = 0;
        for (var r2 = 1; r2 < allData.length; r2++) {
          var d = allData[r2][dCol];
          if (!(d instanceof Date) || d < startDate || d > endDate) continue;
          var cat = String(allData[r2][cCol] || '').trim().toLowerCase();
          if (!cat || cat === 'uncategorized') uncat++;
          if (cat === 'atm' || cat === 'cash' || cat === 'atm/cash' || cat === 'cash & atm') atm++;
        }
        monthStatus.uncategorized = uncat;
        monthStatus.atmCash = atm;
        monthStatus.status = uncat === 0 && atm < 20 ? 'clean' : 'needs_attention';
      }
    }
    
    // Check prior month close status from Close History
    try {
      var priorMonth = curMonth === 1 ? 12 : curMonth - 1;
      var priorYear = curMonth === 1 ? curYear - 1 : curYear;
      var priorLabel = priorYear + '-' + (priorMonth < 10 ? '0' : '') + priorMonth;
      var chSheet = ss.getSheetByName(TAB_MAP['Close History'] || 'Close History');
      var priorClosed = false;
      if (chSheet) {
        var chData = chSheet.getDataRange().getValues();
        for (var ch = 1; ch < chData.length; ch++) {
          if (String(chData[ch][0]).indexOf(priorLabel) !== -1) {
            priorClosed = true;
            break;
          }
        }
      }
      monthStatus.priorMonth = priorLabel;
      monthStatus.priorClosed = priorClosed;
    } catch(e) {}
    
    result.monthStatus = monthStatus;
  } catch(e) {
    result.monthStatus = { status: 'error', error: e.message };
  }

  // ── 3. ERROR LOG (last 24h) ─────────────────────────────────
  try {
    var errSheet = ss.getSheetByName('💻 ErrorLog');
    var errorSummary = { count24h: 0, lastError: null, status: 'healthy' };
    if (errSheet && errSheet.getLastRow() > 1) {
      var errData = errSheet.getDataRange().getValues();
      var cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      var recent = [];
      for (var e1 = 1; e1 < errData.length; e1++) {
        var ts = new Date(errData[e1][0]);
        if (ts >= cutoff) {
          recent.push({ fn: errData[e1][1], msg: errData[e1][2], at: errData[e1][0] });
        }
      }
      errorSummary.count24h = recent.length;
      errorSummary.status = recent.length === 0 ? 'healthy' : (recent.length > 5 ? 'critical' : 'warning');
      if (recent.length > 0) {
        errorSummary.lastError = { fn: recent[recent.length - 1].fn, msg: recent[recent.length - 1].msg };
      }
    }
    result.errors = errorSummary;
  } catch(e) {
    result.errors = { status: 'error', error: e.message };
  }

  // ── 4. PERF LOG (last 24h) ──────────────────────────────────
  try {
    var perfSheet = ss.getSheetByName('💻 PerfLog');
    var perfSummary = { slowCalls24h: 0, avgDuration: 0, slowest: null, status: 'healthy' };
    if (perfSheet && perfSheet.getLastRow() > 1) {
      var perfData = perfSheet.getDataRange().getValues();
      var cutoff2 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      var recentPerf = [];
      for (var p1 = 1; p1 < perfData.length; p1++) {
        var pts = new Date(perfData[p1][0]);
        if (pts >= cutoff2) {
          recentPerf.push({ fn: perfData[p1][1], dur: parseFloat(perfData[p1][2]) || 0 });
        }
      }
      perfSummary.slowCalls24h = recentPerf.length;
      if (recentPerf.length > 0) {
        var totalDur = 0, maxDur = 0, maxFn = '';
        for (var p2 = 0; p2 < recentPerf.length; p2++) {
          totalDur += recentPerf[p2].dur;
          if (recentPerf[p2].dur > maxDur) {
            maxDur = recentPerf[p2].dur;
            maxFn = recentPerf[p2].fn;
          }
        }
        perfSummary.avgDuration = parseFloat((totalDur / recentPerf.length).toFixed(2));
        perfSummary.slowest = { fn: maxFn, dur: parseFloat(maxDur.toFixed(2)) };
        perfSummary.status = maxDur > 240 ? 'critical' : (recentPerf.length > 10 ? 'warning' : 'healthy');
      }
    }
    result.perf = perfSummary;
  } catch(e) {
    result.perf = { status: 'error', error: e.message };
  }

  // ── 5. COMPONENT VERSIONS ───────────────────────────────────
  try {
    result.versions = getDeployedVersions();
  } catch(e) {
    result.versions = { error: e.message };
  }

  // ── 6. TRIGGER INVENTORY ────────────────────────────────────
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var triggerList = [];
    var orphanCount = 0;
    for (var ti = 0; ti < triggers.length; ti++) {
      var handler = triggers[ti].getHandlerFunction();
      var exists = false;
      try { exists = typeof eval(handler) === 'function'; } catch(e) {}
      triggerList.push({ handler: handler, active: exists });
      if (!exists) orphanCount++;
    }
    result.triggers = {
      total: triggers.length,
      quota: 20,
      remaining: 20 - triggers.length,
      orphans: orphanCount,
      status: orphanCount > 0 ? 'warning' : 'healthy',
      list: triggerList
    };
  } catch(e) {
    result.triggers = { status: 'error', error: e.message };
  }

  // ── 7. LAST SNAPSHOT ────────────────────────────────────────
  try {
    var snapSheet = ss.getSheetByName('💻 Snapshots');
    var snapshot = { status: 'none' };
    if (snapSheet && snapSheet.getLastRow() > 1) {
      var lastRow = snapSheet.getLastRow();
      var snapRow = snapSheet.getRange(lastRow, 1, 1, 9).getValues()[0];
      snapshot = {
        status: 'ok',
        date: snapRow[0] instanceof Date ? snapRow[0].toISOString() : String(snapRow[0]),
        totalDebt: snapRow[1] || 0,
        consumerDebt: snapRow[2] || 0,
        mortgage: snapRow[3] || 0,
        netWorth: snapRow[4] || 0,
        monthlyBurn: snapRow[5] || 0,
        cashOnHand: snapRow[6] || 0,
        debtFreeDate: snapRow[7] || '',
        activeAccounts: snapRow[8] || 0
      };
    }
    result.lastSnapshot = snapshot;
  } catch(e) {
    result.lastSnapshot = { status: 'error', error: e.message };
  }

  // ── 8. RECONCILIATION STATUS ────────────────────────────────
  try {
    var recSheet = ss.getSheetByName(TAB_MAP['RECONCILE_STATUS'] || 'RECONCILE_STATUS');
    if (recSheet) {
      var recAt = recSheet.getRange('B1').getValue();
      var recStatus = recSheet.getRange('B2').getValue();
      var recVersions = recSheet.getRange('B3').getValue();
      var staleHours = recAt ? (now.getTime() - new Date(recAt).getTime()) / (1000 * 60 * 60) : 999;
      result.reconcile = {
        status: recStatus || 'UNKNOWN',
        lastRun: recAt || null,
        versions: recVersions || '',
        stale: staleHours > 48,
        ageHours: Math.floor(staleHours)
      };
    } else {
      result.reconcile = { status: 'UNKNOWN', lastRun: null };
    }
  } catch(e) {
    result.reconcile = { status: 'error', error: e.message };
  }

  // ── 9. MER GATES ────────────────────────────────────────────
  try {
    result.merGates = getMERGateStatus();
  } catch(e) {
    result.merGates = { error: true, message: e.message };
  }

  // ── 10. OVERALL STATUS ──────────────────────────────────────
  var overallIssues = 0;
  if (result.tillerSync && result.tillerSync.status === 'stale') overallIssues++;
  if (result.errors && result.errors.status !== 'healthy') overallIssues++;
  if (result.perf && result.perf.status !== 'healthy') overallIssues++;
  if (result.triggers && result.triggers.orphans > 0) overallIssues++;
  if (result.reconcile && result.reconcile.stale) overallIssues++;
  if (result.merGates && !result.merGates.allPassing) overallIssues++;
  if (result.monthStatus && result.monthStatus.uncategorized > 0) overallIssues++;

  result.overall = {
    status: overallIssues === 0 ? 'green' : (overallIssues <= 2 ? 'yellow' : 'red'),
    issueCount: overallIssues,
    checkedAt: now.toISOString()
  };

  return result;
}

/**
 * Safe wrapper for dashboard calls.
 */
function getSystemHealthSafe() {
  return withMonitor_('getSystemHealthSafe', function() {
    return JSON.parse(JSON.stringify(getSystemHealth()));
  });
}

/**
 * Slim version for TheSpine — just heartbeat + sync status.
 * Minimal sheet reads to keep it fast on the ambient display.
 */
function getSpineHeartbeatSafe() {
  return withMonitor_('getSpineHeartbeatSafe', function() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date();
    var heartbeat = {
      timestamp: now.toISOString(),
      versions: {}
    };

    // Versions (fast — just function calls)
    try { heartbeat.versions.de = getDataEngineVersion(); } catch(e) { heartbeat.versions.de = '?'; }
    try { heartbeat.versions.code = getCodeGsVersion(); } catch(e) { heartbeat.versions.code = '?'; }

    // Last Helpers Z1 write (heartbeat pulse)
    try {
      var helpers = ss.getSheetByName(TAB_MAP['Helpers'] || 'Helpers');
      if (helpers) {
        var z1 = helpers.getRange('Z1').getValue();
        if (z1) {
          var pulseAge = Math.floor((now.getTime() - new Date(z1).getTime()) / (1000 * 60));
          heartbeat.lastPulse = { at: String(z1), ageMinutes: pulseAge };
          heartbeat.dataFresh = pulseAge < 30; // data loaded within 30min
        }
      }
    } catch(e) {}

    // Error count last 24h (one sheet read)
    try {
      var errSheet = ss.getSheetByName('💻 ErrorLog');
      if (errSheet && errSheet.getLastRow() > 1) {
        var errData = errSheet.getDataRange().getValues();
        var cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        var count = 0;
        for (var i = 1; i < errData.length; i++) {
          if (new Date(errData[i][0]) >= cutoff) count++;
        }
        heartbeat.errors24h = count;
      } else {
        heartbeat.errors24h = 0;
      }
    } catch(e) { heartbeat.errors24h = -1; }

    heartbeat.status = (heartbeat.dataFresh !== false && heartbeat.errors24h === 0) ? 'green' : 'yellow';
    return JSON.parse(JSON.stringify(heartbeat));
  });
}


// ═══════════════════════════════════════════════════════════════
// 9. DEPLOYED VERSIONS — Single source of truth for all scripts
// ═══════════════════════════════════════════════════════════════

/**
 * Returns the deployed version of every .gs file in the project.
 * Each script must have a get*Version() function returning a number.
 * Scripts without a version function return '?' until one is added.
 *
 * Call via google.script.run.getDeployedVersionsSafe() from TheVein.
 */
function getDeployedVersions() {
  var v = {};
  var checks = [
    ['DataEngine',    'getDataEngineVersion'],
    ['Code',          'getCodeGsVersion'],
    ['CascadeEngine', 'getCascadeEngineVersion'],
    ['KidsHub',       'getKidsHubGsVersion'],
    ['GASHardening',  'getGASHardeningVersion'],
    ['MonitorEngine', 'getMonitorEngineVersion'],
    ['CalendarSync',  'getCalendarSyncVersion'],
    ['AlertEngine',   'getAlertEngineVersion'],
    ['StoryFactory',  'getStoryFactoryVersion']
  ];
  for (var i = 0; i < checks.length; i++) {
    var label = checks[i][0];
    var fn = checks[i][1];
    try {
      v[label] = eval(fn + '()');
    } catch(e) {
      v[label] = '?';
    }
  }
  v._timestamp = new Date().toISOString();
  return v;
}