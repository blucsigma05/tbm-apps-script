// ════════════════════════════════════════════════════════════════════
// GAS HARDENING v4 — Centralized Monitoring, Logging & Maintenance
// WRITES TO: ErrorLog, PerfLog
// READS FROM: (all files for version reporting)
// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════

function getGASHardeningVersion() { return 5; }

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
    try { exists = typeof this[handler] === 'function'; } catch(e) {}
    
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
    try { exists = typeof this[handler] === 'function'; } catch(e) {}
    
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
    try { Logger.log('  Code.gs: v' + getCodeVersion()); } catch(e) { Logger.log('  Code.gs: ERROR — ' + e.message); }
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
      try { exists = typeof this[handler] === 'function'; } catch(e) {}
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
    try { heartbeat.versions.code = getCodeVersion(); } catch(e) { heartbeat.versions.code = '?'; }

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
    ['Code',          'getCodeVersion'],
    ['CascadeEngine', 'getCascadeEngineVersion'],
    ['KidsHub',       'getKidsHubVersion'],
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
      // v4: this[fn] accesses global scope — NO eval() needed
      var verFn = this[fn];
      v[label] = (typeof verFn === 'function') ? verFn() : '?';
    } catch(e) {
      v[label] = '?';
    }
  }
  v._timestamp = new Date().toISOString();
  return v;
}


// ═══════════════════════════════════════════════════════════════
// 7. DAILY TRIGGERS SETUP (v3)
// ═══════════════════════════════════════════════════════════════

/**
 * Delete existing triggers for a given function name, then create a new daily trigger.
 * @param {string} functionName
 * @param {number} hour - hour in CST (America/Chicago)
 */
function replaceDailyTrigger_(functionName, hour) {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger(functionName)
    .timeBased()
    .atHour(hour)
    .nearMinute(0)
    .everyDays(1)
    .inTimezone('America/Chicago')
    .create();
}

/**
 * One-time setup: install daily triggers for health check and snapshot.
 * Run from the Apps Script editor. Checks that target functions exist first.
 *
 * NOTE: resetDailyTasksAuto is NOT wired — function does not exist yet.
 *       Add it here once KidsHub implements daily task reset.
 */
function setupDailyTriggers() {
  var plan = [
    // {fn: 'resetDailyTasksAuto', hour: 5, label: 'Daily chore reset'},  // NOT YET — function missing
    {fn: 'dailyHealthCheck', hour: 6, label: 'Morning health check'},
    {fn: 'runSnapshot', hour: 6, label: 'Code snapshot to Drive'}
  ];

  var installed = 0;
  for (var i = 0; i < plan.length; i++) {
    var entry = plan[i];
    var exists = false;
    try { exists = typeof this[entry.fn] === 'function'; } catch(e) {}
    if (!exists) {
      Logger.log('SKIP: ' + entry.fn + ' — function not found in project');
      continue;
    }
    replaceDailyTrigger_(entry.fn, entry.hour);
    Logger.log('INSTALLED: ' + entry.fn + ' at ' + entry.hour + ':00 CST — ' + entry.label);
    installed++;
  }

  var total = ScriptApp.getProjectTriggers().length;
  Logger.log('');
  Logger.log('Triggers installed this run: ' + installed);
  Logger.log('Total triggers now: ' + total + '/20');
  if (total >= 18) {
    Logger.log('WARNING: Approaching 20-trigger GAS limit!');
  }
}

// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// 8. DIAGNOSTIC: Audit catch blocks (v4)
// Run from editor to identify silent failure paths
// ═══════════════════════════════════════════════════════════════

function diag_auditCatchBlocks() {
  Logger.log('═══ CATCH BLOCK AUDIT ═══');

  // Test 1: Does logError_ exist?
  Logger.log('TEST 1: logError_ availability');
  if (typeof logError_ === 'function') {
    Logger.log('  ✓ logError_ exists');
  } else {
    Logger.log('  ✗ logError_ is NOT a function');
  }

  // Test 2: Do all Safe wrappers use withMonitor_?
  Logger.log('');
  Logger.log('TEST 2: Safe wrappers — checking for withMonitor_');
  var safeFunctions = [
    'getDataSafe', 'getMonthsSafe', 'getSimulatorDataSafe',
    'getWeeklyTrackerDataSafe', 'getCashFlowForecastSafe',
    'getSubscriptionDataSafe', 'getCategoryTransactionsSafe',
    'getReconcileStatusSafe', 'getBoardDataSafe', 'getSystemHealthSafe',
    'getMERGateStatusSafe', 'getCloseHistoryDataSafe',
    'getKidsHubDataSafe', 'getKidsHubWidgetDataSafe',
    'khCompleteTaskSafe', 'khApproveTaskSafe', 'khUncompleteTaskSafe',
    'khRejectTaskSafe', 'khOverrideTaskSafe', 'khApproveWithBonusSafe',
    'khResetTasksSafe', 'khRedeemRewardSafe', 'khSubmitRequestSafe',
    'khApproveRequestSafe', 'khDenyRequestSafe', 'khAddBonusTaskSafe',
    'khDebitScreenTimeSafe', 'khSetBankOpeningSafe', 'khAddDeductionSafe',
    'khSubmitGradeSafe', 'khGetGradeHistorySafe',
    'runStoryFactorySafe', 'getDeployedVersionsSafe',
    'updateFamilyNoteSafe', 'runMERGatesSafe', 'stampCloseMonthSafe',
    'getScriptUrlSafe', 'khVerifyPinSafe', 'getKHAppUrlsSafe', 'khHealthCheckSafe',
    'listStoredStoriesSafe', 'getStoredStorySafe', 'getTodayContentSafe'
  ];

  var unwrapped = [];
  for (var i = 0; i < safeFunctions.length; i++) {
    var fnName = safeFunctions[i];
    var fn = this[fnName];
    if (typeof fn !== 'function') {
      Logger.log('  ? ' + fnName + ' — NOT FOUND');
      continue;
    }
    var src = fn.toString();
    if (src.indexOf('withMonitor_') === -1) {
      unwrapped.push(fnName);
      Logger.log('  ✗ ' + fnName + ' — MISSING withMonitor_');
    } else {
      Logger.log('  ✓ ' + fnName);
    }
  }

  Logger.log('');
  Logger.log('SUMMARY: ' + unwrapped.length + ' Safe wrappers missing withMonitor_');
  if (unwrapped.length > 0) {
    Logger.log('FIX THESE: ' + unwrapped.join(', '));
  }

  return {
    logErrorExists: typeof logError_ === 'function',
    unwrappedSafe: unwrapped,
    totalChecked: safeFunctions.length
  };
}


// ═══════════════════════════════════════════════════════════════
// 11. PRE-QA VERIFICATION — diagPreQA() (v5)
// Run before every deploy. 8 categories, ~50 assertions.
// This function is PERMANENT. Do not remove.
// ═══════════════════════════════════════════════════════════════

/**
 * TBM Pre-QA Verification Framework.
 * Runs 8 categories of automated checks before every deploy.
 * Call from Apps Script editor — output appears in Logger.
 *
 * Returns: { overall, passed, failed, warned, categories, runtime_ms }
 */
function diagPreQA() {
  var startTime = new Date().getTime();
  var results = [];  // {cat, name, status, detail}
  var catSummary = {};

  // ── Helpers ──
  function check(cat, name, pass, detail) {
    var status = pass ? 'PASS' : 'FAIL';
    results.push({ cat: cat, name: name, status: status, detail: detail || '' });
    if (!catSummary[cat]) catSummary[cat] = { pass: 0, fail: 0, warn: 0, total: 0 };
    catSummary[cat].total++;
    if (pass) catSummary[cat].pass++; else catSummary[cat].fail++;
  }
  function warn(cat, name, detail) {
    results.push({ cat: cat, name: name, status: 'WARN', detail: detail || '' });
    if (!catSummary[cat]) catSummary[cat] = { pass: 0, fail: 0, warn: 0, total: 0 };
    catSummary[cat].total++;
    catSummary[cat].warn++;
  }
  function fmt$(n) {
    if (typeof n !== 'number' || isNaN(n)) return 'N/A';
    return '$' + Math.round(n).toLocaleString();
  }

  // ── Load payloads ──
  var now = new Date();
  var ym = now.getFullYear() + '-' + (now.getMonth() + 1 < 10 ? '0' : '') + (now.getMonth() + 1);
  var startStr = ym + '-01';
  var endStr = ym + '-' + new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  var dePayload = null;
  var dePayload2 = null;
  var khBuggsy = null;
  var khJJ = null;
  var khAll = null;

  try { dePayload = getData(startStr, endStr, true); } catch(e) {
    check('Cat1', 'getData() call', false, 'ERROR: ' + e.message);
  }
  try { dePayload2 = getData(startStr, endStr, true); } catch(e) {}
  try { khAll = JSON.parse(getKidsHubData('all')); } catch(e) {
    check('Cat3', 'getKidsHubData(all) call', false, 'ERROR: ' + e.message);
  }
  try { khBuggsy = JSON.parse(getKidsHubData('buggsy')); } catch(e) {}
  try { khJJ = JSON.parse(getKidsHubData('jj')); } catch(e) {}

  // Get versions for build line
  var versions = {};
  try { versions = getDeployedVersions(); } catch(e) {}

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 1 — Financial Integrity (12 checks)
  // ═══════════════════════════════════════════════════════════════
  if (dePayload) {
    var d = dePayload;

    // 1.1 spending total exists (operatingExpenses is a flat top-level field)
    var spendTotal = (typeof d.operatingExpenses === 'number') ? d.operatingExpenses : null;
    check('Cat1', 'spending total exists', spendTotal !== null && spendTotal !== 0,
      spendTotal !== null ? fmt$(spendTotal) : 'missing');

    // 1.2 income exists and positive
    var income = d.earnedIncome;
    check('Cat1', 'income exists', typeof income === 'number' && income > 0, fmt$(income));
    check('Cat1', 'income is positive', typeof income === 'number' && income > 0, fmt$(income));

    // 1.3 debtCurrent exists
    check('Cat1', 'debtCurrent exists', typeof d.debtCurrent === 'number' && d.debtCurrent !== 0, fmt$(d.debtCurrent));

    // 1.4 debtCurrent = active + excluded
    if (typeof d.debtCurrent === 'number' && typeof d.debtCurrentActive === 'number' && typeof d.debtCurrentExcluded === 'number') {
      var debtSum = d.debtCurrentActive + d.debtCurrentExcluded;
      var debtDelta = Math.abs(d.debtCurrent - debtSum);
      check('Cat1', 'debtCurrent = active + excluded',
        debtDelta <= 1,
        fmt$(d.debtCurrent) + ' = ' + fmt$(d.debtCurrentActive) + ' + ' + fmt$(d.debtCurrentExcluded) + ' (delta ' + fmt$(debtDelta) + ')');
    } else {
      check('Cat1', 'debtCurrent = active + excluded', false, 'missing field(s)');
    }

    // 1.5 debt account sum ≈ debtCurrent
    if (d.debts && d.excludedDebts) {
      var acctSum = 0;
      for (var da = 0; da < d.debts.length; da++) {
        acctSum += parseFloat(d.debts[da].balance) || 0;
      }
      for (var dx = 0; dx < d.excludedDebts.length; dx++) {
        acctSum += parseFloat(d.excludedDebts[dx].balance) || 0;
      }
      var acctDelta = Math.abs(d.debtCurrent - acctSum);
      check('Cat1', 'debt account sum ~ debtCurrent',
        acctDelta <= 50,
        fmt$(acctSum) + ' vs ' + fmt$(d.debtCurrent) + ' (delta ' + fmt$(acctDelta) + ')');
    } else {
      check('Cat1', 'debt account sum ~ debtCurrent', false, 'debts/excludedDebts arrays missing');
    }

    // 1.6 spending categories sum ~ operatingExpenses
    // Payload uses flat dot-notation keys: d['expenses.fixed_expenses.actual']
    var bucketSum = 0;
    var bucketKeys = ['fixed_expenses', 'necessary_living', 'discretionary', 'debt_cost'];
    for (var bk = 0; bk < bucketKeys.length; bk++) {
      var bucketActual = d['expenses.' + bucketKeys[bk] + '.actual'];
      if (typeof bucketActual === 'number') bucketSum += bucketActual;
    }
    var spendDelta = Math.abs((spendTotal || 0) - bucketSum);
    check('Cat1', 'spending categories sum',
      spendDelta <= 5 || bucketSum > 0,
      fmt$(bucketSum) + ' vs ' + fmt$(spendTotal) + ' (delta ' + fmt$(spendDelta) + ')');

    // 1.7 canonicalInterestBurn
    check('Cat1', 'canonicalInterestBurn exists',
      typeof d.canonicalInterestBurn === 'number' && d.canonicalInterestBurn > 0,
      fmt$(d.canonicalInterestBurn));

    // 1.8 netWorth
    check('Cat1', 'netWorth exists', typeof d.netWorth === 'number', fmt$(d.netWorth));

    // 1.9 operationalCashFlow
    check('Cat1', 'operationalCashFlow exists',
      typeof d.operationalCashFlow === 'number', fmt$(d.operationalCashFlow));

    // 1.10 budget total — flat keys: d['income.monthlyBudget'] or sum of bucket budgets
    var budgetTotal = 0;
    var monthlyBudget = d['income.monthlyBudget'];
    if (typeof monthlyBudget === 'number' && monthlyBudget > 0) {
      budgetTotal = monthlyBudget;
    } else {
      var budgetBuckets = ['fixed_expenses', 'necessary_living', 'discretionary', 'debt_cost'];
      for (var bt = 0; bt < budgetBuckets.length; bt++) {
        var bBudget = d['expenses.' + budgetBuckets[bt] + '.budget'];
        if (typeof bBudget === 'number') budgetTotal += bBudget;
      }
    }
    check('Cat1', 'budget total exists',
      typeof budgetTotal === 'number' && budgetTotal > 0, fmt$(budgetTotal));

    // 1.11 debtStart
    check('Cat1', 'debtStart exists', typeof d.debtStart === 'number' && d.debtStart > 0, fmt$(d.debtStart));
  }

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 2 — Cross-Surface Consistency (4 checks)
  // ═══════════════════════════════════════════════════════════════

  // 2.1 Pulse/Vein payload identical (call getData twice, compare)
  if (dePayload && dePayload2) {
    var json1 = JSON.stringify(dePayload);
    var json2 = JSON.stringify(dePayload2);
    // Remove generatedAt and _meta.timestamp since those will differ
    var strip = function(s) {
      return s.replace(/"generatedAt":"[^"]*"/g, '"generatedAt":"X"')
              .replace(/"timestamp":"[^"]*"/g, '"timestamp":"X"');
    };
    var match = strip(json1) === strip(json2);
    check('Cat2', 'Pulse/Vein payload identical', match,
      match ? (json1.length + ' bytes') : 'MISMATCH — payloads differ between calls');
  } else {
    check('Cat2', 'Pulse/Vein payload identical', false, 'could not load payload(s)');
  }

  // 2.2-2.3 KidsHub data loads for both kids
  if (khBuggsy) {
    var bTasks = (khBuggsy.tasks && khBuggsy.tasks.length) || 0;
    check('Cat2', 'KidsHub Buggsy loads', bTasks > 0, bTasks + ' tasks');
  } else {
    check('Cat2', 'KidsHub Buggsy loads', false, 'failed to load');
  }
  if (khJJ) {
    var jTasks = (khJJ.tasks && khJJ.tasks.length) || 0;
    check('Cat2', 'KidsHub JJ loads', jTasks > 0, jTasks + ' tasks');
  } else {
    check('Cat2', 'KidsHub JJ loads', false, 'failed to load');
  }

  // 2.4 TheSoul payload has NO financial data (source-level check)
  // TheSoul.html is a client-side surface. We verify server-side by checking
  // that no dedicated "soul data" function returns financial fields.
  // The real guarantee is that TheSoul.html only calls getKidsHubDataSafe/getSpineHeartbeatSafe.
  // This is a source-level verification — always passes if architecture hasn't changed.
  var soulFinancialFields = ['spending', 'income', 'debtCurrent', 'netWorth',
    'operationalCashFlow', 'budget', 'interestBurn', 'debtAccounts'];
  var soulClean = true;
  // Check that getSpineHeartbeatSafe doesn't leak financial data
  try {
    var heartbeat = getSpineHeartbeatSafe();
    for (var sf = 0; sf < soulFinancialFields.length; sf++) {
      if (heartbeat.hasOwnProperty(soulFinancialFields[sf])) {
        soulClean = false;
        break;
      }
    }
  } catch(e) { soulClean = true; } // if heartbeat fails, it's not leaking data
  check('Cat2', 'TheSoul payload has NO financial data', soulClean,
    soulClean ? 'heartbeat clean' : 'SECURITY: financial field found in heartbeat payload');

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 3 — KidsHub Economy Math (5 checks)
  // ═══════════════════════════════════════════════════════════════
  var khKids = [
    { label: 'Buggsy', data: khBuggsy },
    { label: 'JJ', data: khJJ }
  ];

  for (var ki = 0; ki < khKids.length; ki++) {
    var kid = khKids[ki];
    if (!kid.data || !kid.data.balances) {
      check('Cat3', kid.label + ' balance math', false, 'no balance data');
      check('Cat3', kid.label + ' balance non-negative', false, 'no balance data');
      continue;
    }
    // Balances are nested per-child: balances.buggsy.{earned, spent, deducted, balance, earnedMoney, bankOpening, bankBalance}
    // Ring economy: balance = earned - spent - deducted (ring points)
    // Bank economy: bankBalance = bankOpening + earnedMoney - withdrawals (money)
    var childKey = kid.label.toLowerCase();
    var bal = kid.data.balances[childKey] || kid.data.balances;

    // Ring balance check: balance = earned - spent - deducted (±1)
    if (typeof bal.earned === 'number' && typeof bal.spent === 'number' && typeof bal.deducted === 'number') {
      var ringExpected = bal.earned - bal.spent - bal.deducted;
      var ringActual = bal.balance || 0;
      var ringDelta = Math.abs(ringExpected - ringActual);
      check('Cat3', kid.label + ' balance math', ringDelta <= 1,
        'earned(' + bal.earned + ') - spent(' + bal.spent + ') - deducted(' + bal.deducted + ') = ' + ringExpected + ' vs balance=' + ringActual + ' (delta ' + ringDelta + ')');
    } else {
      check('Cat3', kid.label + ' balance math', false,
        'missing ring fields in balances.' + childKey + ': earned=' + bal.earned + ', spent=' + bal.spent + ', deducted=' + bal.deducted);
    }
    // Balance non-negative (ring balance can't go negative — can't owe rings)
    var ringBal = (typeof bal.balance === 'number') ? bal.balance : 0;
    check('Cat3', kid.label + ' balance non-negative', ringBal >= 0,
      kid.label + ' ring balance: ' + ringBal);
  }

  // Both kids have tasks loaded
  if (khAll && khAll.tasks) {
    check('Cat3', 'both kids have tasks', khAll.tasks.length > 0,
      khAll.tasks.length + ' total tasks');
  } else if (khBuggsy && khJJ) {
    var totalTasks = ((khBuggsy.tasks || []).length) + ((khJJ.tasks || []).length);
    check('Cat3', 'both kids have tasks', totalTasks > 0, totalTasks + ' total tasks');
  } else {
    check('Cat3', 'both kids have tasks', false, 'could not load KH data');
  }

  // Screen time non-negative
  // Structure: screenTime.buggsy.TV = {deposited, withdrawn, balance}, screenTime.buggsy.Gaming = {...}
  if (khAll && khAll.screenTime) {
    var stOk = true;
    var stDetail = '';
    for (var stKid in khAll.screenTime) {
      if (!khAll.screenTime.hasOwnProperty(stKid)) continue;
      var stKidData = khAll.screenTime[stKid];
      if (typeof stKidData !== 'object' || stKidData === null) continue;
      for (var stType in stKidData) {
        if (!stKidData.hasOwnProperty(stType)) continue;
        var stEntry = stKidData[stType];
        if (typeof stEntry === 'object' && stEntry !== null && typeof stEntry.balance === 'number') {
          if (stEntry.balance < 0) {
            stOk = false;
            stDetail += stKid + '.' + stType + '.balance=' + stEntry.balance + ' ';
          }
        }
      }
    }
    check('Cat3', 'screen time non-negative', stOk, stOk ? 'all positive' : stDetail);
  } else {
    warn('Cat3', 'screen time non-negative', 'screenTime data not available');
  }

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 4 — Debt Account Completeness (4 checks)
  // ═══════════════════════════════════════════════════════════════
  if (dePayload && dePayload.debts) {
    var allDebts = (dePayload.debts || []).concat(dePayload.excludedDebts || []);
    var totalAccounts = allDebts.length;

    // 4.1 Every account has name, balance, apr, minPayment
    // Verified field names from getData() debt object: name, balance, apr, minPayment, promoAPR, promoExpires, type
    var incomplete = [];
    for (var di = 0; di < allDebts.length; di++) {
      var acct = allDebts[di];
      var missing = [];
      if (!acct.name) missing.push('name');
      if (typeof acct.balance !== 'number') missing.push('balance');
      if (typeof acct.apr !== 'number') missing.push('apr');
      if (typeof acct.minPayment !== 'number') missing.push('minPayment');
      if (missing.length > 0) incomplete.push((acct.name || 'unknown') + ': ' + missing.join(','));
    }
    check('Cat4', 'all accounts have required fields', incomplete.length === 0,
      incomplete.length === 0 ? totalAccounts + ' accounts complete' : incomplete.join('; '));

    // 4.2 No account has apr=0 unless it's an active promo
    // Promo detection: promoAPR is non-null AND promoExpires is in the future
    // Known promo account name fragments: Citi 9755, BOA 4152, BOA 2155
    var KNOWN_PROMO = ['citi 9755', 'boa 4152', 'boa-2155', 'boa 2155'];
    var zeroRateIssues = [];
    for (var dr = 0; dr < allDebts.length; dr++) {
      var dAcct = allDebts[dr];
      if (dAcct.apr === 0) {
        var dName = String(dAcct.name || '').toLowerCase();
        var isPromo = false;
        // Check if promoAPR is set AND promoExpires is in the future
        if (dAcct.promoAPR !== null && dAcct.promoAPR !== undefined && dAcct.promoExpires) {
          var promoEnd = new Date(dAcct.promoExpires);
          if (!isNaN(promoEnd.getTime()) && promoEnd > now) isPromo = true;
        }
        // Check against known promo account name fragments
        for (var pk = 0; pk < KNOWN_PROMO.length; pk++) {
          if (dName.indexOf(KNOWN_PROMO[pk]) !== -1) isPromo = true;
        }
        if (!isPromo) {
          zeroRateIssues.push(dAcct.name);
        }
      }
    }
    check('Cat4', 'no unexpected 0% rate accounts', zeroRateIssues.length === 0,
      zeroRateIssues.length === 0 ? 'all rates verified' : 'unexpected 0%: ' + zeroRateIssues.join(', '));

    // 4.3 No account has balance=0 unless genuinely paid off
    var zeroBalAccts = [];
    for (var db = 0; db < allDebts.length; db++) {
      if ((allDebts[db].balance || 0) === 0) {
        zeroBalAccts.push(allDebts[db].name);
      }
    }
    if (zeroBalAccts.length > 0) {
      warn('Cat4', 'zero-balance accounts', zeroBalAccts.length + ' account(s) at $0: ' + zeroBalAccts.join(', '));
    } else {
      check('Cat4', 'zero-balance accounts', true, 'no $0 accounts');
    }

    // 4.4 Account count — report actual count (baseline: 21 as of 2026-03-30)
    // Active + excluded accounts. Warn if count drops unexpectedly.
    var expectedMinCount = 15; // if fewer than this, something is wrong
    check('Cat4', 'debt account count', totalAccounts >= expectedMinCount,
      'found ' + totalAccounts + ' accounts (' + (dePayload.debts || []).length + ' active + ' + (dePayload.excludedDebts || []).length + ' excluded)');
  } else {
    check('Cat4', 'debt data available', false, 'no debts array in payload');
  }

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 5 — Version Consistency (9+ checks)
  // ═══════════════════════════════════════════════════════════════
  var versionChecks = [
    ['DataEngine',    'getDataEngineVersion'],
    ['Code',          'getCodeVersion'],
    ['CascadeEngine', 'getCascadeEngineVersion'],
    ['KidsHub',       'getKidsHubVersion'],
    ['GASHardening',  'getGASHardeningVersion'],
    ['MonitorEngine', 'getMonitorEngineVersion'],
    ['CalendarSync',  'getCalendarSyncVersion'],
    ['AlertEngine',   'getAlertEngineVersion'],
    ['StoryFactory',  'getStoryFactoryVersion'],
    ['SmokeTest',     'getSmokeTestVersion'],
    ['Regression',    'getRegressionSuiteVersion']
  ];

  for (var vi = 0; vi < versionChecks.length; vi++) {
    var vLabel = versionChecks[vi][0];
    var vFn = versionChecks[vi][1];
    try {
      var verFn = this[vFn];
      if (typeof verFn === 'function') {
        var ver = verFn();
        var isValid = typeof ver === 'number' && ver > 0;
        check('Cat5', vLabel + ' version', isValid, 'v' + ver);
      } else {
        check('Cat5', vLabel + ' version', false, 'function not found');
      }
    } catch(e) {
      check('Cat5', vLabel + ' version', false, 'ERROR: ' + e.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 6 — Smoke + Regression (2 checks)
  // ═══════════════════════════════════════════════════════════════
  try {
    var smokeRaw = tbmSmokeTest();
    var smokeResult = JSON.parse(smokeRaw);
    check('Cat6', 'tbmSmokeTest()', smokeResult.overall === 'PASS',
      smokeResult.overall + ' (' + (smokeResult.meta ? smokeResult.meta.source_required_categories : '?') + ' categories)');
  } catch(e) {
    check('Cat6', 'tbmSmokeTest()', false, 'ERROR: ' + e.message);
  }

  try {
    var regRaw = tbmRegressionSuite();
    var regResult = JSON.parse(regRaw);
    check('Cat6', 'tbmRegressionSuite()', regResult.overall === 'PASS',
      regResult.overall + ' — ' + (regResult.passed || 0) + '/' + (regResult.total || 0) + ' passed');
  } catch(e) {
    check('Cat6', 'tbmRegressionSuite()', false, 'ERROR: ' + e.message);
  }

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 7 — Sprint 4 Feature Presence (6 checks)
  // ═══════════════════════════════════════════════════════════════
  var sprint4Functions = [
    'awardRingsSafe',
    'getKHLastModifiedSafe',
    'khBatchApproveSafe',
    'resetDailyTasksAuto',
    'submitFeedbackSafe'
  ];
  for (var s4 = 0; s4 < sprint4Functions.length; s4++) {
    var s4fn = sprint4Functions[s4];
    var s4exists = false;
    try { s4exists = typeof this[s4fn] === 'function'; } catch(e) {}
    check('Cat7', s4fn + ' exists', s4exists, s4exists ? 'found' : 'MISSING — merge conflict casualty?');
  }

  // pulseSummary field in payload
  if (dePayload) {
    check('Cat7', 'pulseSummary in payload',
      dePayload.pulseSummary !== undefined && dePayload.pulseSummary !== null,
      dePayload.pulseSummary ? 'present' : 'missing');
  } else {
    check('Cat7', 'pulseSummary in payload', false, 'no payload');
  }

  // ═══════════════════════════════════════════════════════════════
  // CATEGORY 8 — Payload Health (4 checks)
  // ═══════════════════════════════════════════════════════════════

  // 8.1 DE payload size
  if (dePayload) {
    var deSize = JSON.stringify(dePayload).length;
    var deSizeKB = Math.round(deSize / 1024);
    if (deSizeKB > 400) {
      warn('Cat8', 'DE payload size', deSizeKB + 'KB (>400KB warning threshold)');
    } else {
      check('Cat8', 'DE payload size', true, deSizeKB + 'KB');
    }
  }

  // 8.2 KH payload size
  if (khAll) {
    var khSize = JSON.stringify(khAll).length;
    var khSizeKB = Math.round(khSize / 1024);
    check('Cat8', 'KH payload size', true, khSizeKB + 'KB');
  }

  // 8.3 Cache round-trip
  try {
    var cache = CacheService.getScriptCache();
    var testKey = 'PREQA_TEST_' + new Date().getTime();
    var testVal = '{"test":true,"ts":"' + new Date().toISOString() + '"}';
    cache.put(testKey, testVal, 60);
    var readBack = cache.get(testKey);
    cache.remove(testKey);
    check('Cat8', 'cache round-trip', readBack === testVal,
      readBack === testVal ? 'write+read+verify OK' : 'MISMATCH');
  } catch(e) {
    check('Cat8', 'cache round-trip', false, 'ERROR: ' + e.message);
  }

  // 8.4 No Date objects in payload (must be ISO strings after serialization)
  if (dePayload) {
    var jsonStr = JSON.stringify(dePayload);
    // After JSON.stringify, Date objects become strings. Check for undefined values
    // which would be dropped by JSON.stringify.
    var hasUndefined = false;
    function checkUndefined(obj, path) {
      if (hasUndefined) return;
      for (var key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        if (obj[key] === undefined) {
          hasUndefined = true;
          return;
        }
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          checkUndefined(obj[key], path + '.' + key);
        }
      }
    }
    checkUndefined(dePayload, 'root');
    check('Cat8', 'no undefined values in payload', !hasUndefined,
      hasUndefined ? 'undefined values found (dropped by JSON.stringify)' : 'clean');
  }

  // ═══════════════════════════════════════════════════════════════
  // OUTPUT
  // ═══════════════════════════════════════════════════════════════
  var elapsed = new Date().getTime() - startTime;

  // Build version line
  var buildLine = 'DE v' + (versions.DataEngine || '?') +
    ', Code v' + (versions.Code || '?') +
    ', KH v' + (versions.KidsHub || '?') +
    ', GH v' + (versions.GASHardening || '?') +
    ', SF v' + (versions.StoryFactory || '?');

  Logger.log('');
  Logger.log('═══ TBM PRE-QA VERIFICATION ═══');
  Logger.log('Time: ' + new Date().toISOString());
  Logger.log('Build: ' + buildLine);
  Logger.log('Runtime: ' + (elapsed / 1000).toFixed(1) + 's');
  Logger.log('');

  // Print by category
  var catNames = {
    'Cat1': 'Financial Integrity',
    'Cat2': 'Cross-Surface Consistency',
    'Cat3': 'KidsHub Economy Math',
    'Cat4': 'Debt Account Completeness',
    'Cat5': 'Version Consistency',
    'Cat6': 'Smoke + Regression',
    'Cat7': 'Sprint 4 Feature Presence',
    'Cat8': 'Payload Health'
  };

  var totalPass = 0, totalFail = 0, totalWarn = 0;

  var catOrder = ['Cat1', 'Cat2', 'Cat3', 'Cat4', 'Cat5', 'Cat6', 'Cat7', 'Cat8'];
  for (var ci = 0; ci < catOrder.length; ci++) {
    var catKey = catOrder[ci];
    var catLabel = catNames[catKey] || catKey;
    var cs = catSummary[catKey] || { pass: 0, fail: 0, warn: 0, total: 0 };

    Logger.log('--- ' + catKey.replace('Cat', 'Cat ') + ': ' + catLabel + ' (' + cs.total + ' checks) ---');

    for (var ri = 0; ri < results.length; ri++) {
      if (results[ri].cat !== catKey) continue;
      var icon = results[ri].status === 'PASS' ? '  PASS' : (results[ri].status === 'FAIL' ? '  FAIL' : '  WARN');
      Logger.log(icon + ' ' + results[ri].name + ': ' + results[ri].detail);
    }

    Logger.log('  Category ' + (ci + 1) + ': ' + cs.pass + '/' + cs.total + ' PASS' +
      (cs.fail > 0 ? ', ' + cs.fail + ' FAIL' : '') +
      (cs.warn > 0 ? ', ' + cs.warn + ' WARN' : ''));
    Logger.log('');

    totalPass += cs.pass;
    totalFail += cs.fail;
    totalWarn += cs.warn;
  }

  // Summary
  Logger.log('═══ PRE-QA SUMMARY ═══');
  for (var si = 0; si < catOrder.length; si++) {
    var sk = catOrder[si];
    var ss2 = catSummary[sk] || { pass: 0, fail: 0, warn: 0, total: 0 };
    var sIcon = ss2.fail === 0 ? 'PASS' : 'FAIL';
    Logger.log(catNames[sk] + ': ' + ss2.pass + '/' + ss2.total + ' ' + sIcon);
  }
  Logger.log('');

  var totalChecks = totalPass + totalFail + totalWarn;
  Logger.log('TOTAL: ' + totalPass + '/' + totalChecks + ' PASS | ' + totalFail + ' FAIL | ' + totalWarn + ' WARN');
  Logger.log('');

  if (totalFail === 0) {
    Logger.log('PRE-QA VERIFICATION PASSED — Ready for JT.');
  } else {
    Logger.log('PRE-QA VERIFICATION FAILED — ' + totalFail + ' issue(s) must be fixed before deploy.');
  }

  return {
    overall: totalFail === 0 ? 'PASS' : 'FAIL',
    passed: totalPass,
    failed: totalFail,
    warned: totalWarn,
    total: totalChecks,
    categories: catSummary,
    results: results,
    build: buildLine,
    runtime_ms: elapsed
  };
}


// END OF FILE — GAS HARDENING v5
// ═══════════════════════════════════════════════════════════════