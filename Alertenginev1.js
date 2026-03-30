// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// AlertEngine.gs v6 — Push Notifications via Pushover API
// WRITES TO: (Pushover API only — no sheet writes)
// READS FROM: 💻🧮 Helpers (for config)
// Replaces dead AT&T email-to-SMS gateway (killed June 17, 2025)
// ════════════════════════════════════════════════════════════════════

function getAlertEngineVersion() { return 6; }

// v4: openById migration — trigger-safe spreadsheet accessor
var _aeSS = null;
function getAESS_() {
  if (!_aeSS) _aeSS = SpreadsheetApp.openById('1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c');
  return _aeSS;
}

// ── PUSHOVER CONFIG ─────────────────────────────────────────────
// Script Properties: PUSHOVER_TOKEN, PUSHOVER_USER_LT, PUSHOVER_USER_JT

function getParentDashUrl_() {
  try { return ScriptApp.getService().getUrl() + '?page=kidshub&view=parent&jt=1'; }
  catch(e) { return ''; }
}

function getPushoverConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    token: props.getProperty('PUSHOVER_TOKEN') || '',
    userLT: props.getProperty('PUSHOVER_USER_LT') || '',
    userJT: props.getProperty('PUSHOVER_USER_JT') || ''
  };
}

// ── SEND PUSH NOTIFICATION ──────────────────────────────────────
// recipient: 'LT', 'JT', or 'BOTH'  |  url: optional deep link
function sendPush_(title, message, recipient, priority, url) {
  var config = getPushoverConfig_();
  if (!config.token) {
    console.log('ALERT_SKIP: PUSHOVER_TOKEN not configured');
    return false;
  }

  var users = [];
  if (recipient === 'LT' || recipient === 'BOTH') {
    if (config.userLT) users.push(config.userLT);
  }
  if (recipient === 'JT' || recipient === 'BOTH') {
    if (config.userJT) users.push(config.userJT);
  }

  if (users.length === 0) {
    console.log('ALERT_SKIP: No user keys configured for recipient: ' + recipient);
    return false;
  }

  var success = true;
  for (var i = 0; i < users.length; i++) {
    try {
      var payload = {
        token: config.token,
        user: users[i],
        title: title,
        message: message,
        sound: 'cashregister'
      };
      // Only include priority if non-zero (0 is Pushover's default)
      if (priority && priority !== 0) {
        payload.priority = String(priority);
      }
      // v5: Deep link support
      if (url) {
        payload.url = url;
        payload.url_title = 'Open Kids Dashboard';
      }

      var response = UrlFetchApp.fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        payload: payload,
        muteHttpExceptions: true
      });

      var code = response.getResponseCode();
      if (code !== 200) {
        var body = response.getContentText();
        console.log('PUSHOVER_ERROR (' + code + '): ' + body.substring(0, 200));
        success = false;
      }
    } catch(e) {
      console.log('PUSHOVER_EXCEPTION: ' + e.message);
      success = false;
    }
  }
  return success;
}


// ── SCHEDULE WINDOW ────────────────────────────────────────────
// M-F: 3 PM – 10 PM  |  Sat-Sun: 8 AM – 10 PM
function isAlertWindowOpen_() {
  var now = new Date();
  var tz = Session.getScriptTimeZone();
  var hour = parseInt(Utilities.formatDate(now, tz, 'H'));
  var day = now.getDay(); // 0=Sun, 6=Sat
  var isWeekend = (day === 0 || day === 6);
  if (isWeekend) {
    return hour >= 8 && hour < 22;
  } else {
    return hour >= 15 && hour < 22;
  }
}


// ════════════════════════════════════════════════════════════════════
// APPROVAL ALERTS — Check for pending tasks, push to JT + LT
// ════════════════════════════════════════════════════════════════════

function checkPendingApprovals() {
  if (!isAlertWindowOpen_()) return;

  try {
    var ss = getAESS_();
    var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_Chores'] || 'KH_Chores') : 'KH_Chores';
    var sheet = ss.getSheetByName(tabName);
    if (!sheet || sheet.getLastRow() < 2) return;

    var data = sheet.getDataRange().getValues();
    var h = data[0].map(function(c) { return String(c).trim(); });
    var compCol = h.indexOf('Completed');
    var approvedCol = h.indexOf('Parent_Approved');
    var childCol = h.indexOf('Child');
    var taskCol = h.indexOf('Task');
    var activeCol = h.indexOf('Active');

    if (compCol < 0 || approvedCol < 0) return;

    var pending = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Only active tasks
      if (activeCol >= 0 && String(row[activeCol] || '').toUpperCase() !== 'YES' && row[activeCol] !== true) continue;
      var isCompleted = row[compCol] === true || String(row[compCol]).toUpperCase() === 'TRUE';
      var isApproved = row[approvedCol] === true || String(row[approvedCol]).toUpperCase() === 'TRUE';
      if (isCompleted && !isApproved) {
        pending.push({
          child: String(row[childCol] || ''),
          task: String(row[taskCol] || '')
        });
      }
    }

    // Compare to last known count — only alert when count goes UP
    var props = PropertiesService.getScriptProperties();
    var lastCount = parseInt(props.getProperty('ALERT_LAST_PENDING') || '0');

    if (pending.length > lastCount && pending.length > 0) {
      // Build message body
      var lines = [];
      var maxShow = 4;
      for (var j = 0; j < Math.min(pending.length, maxShow); j++) {
        lines.push(pending[j].child + ': ' + pending[j].task);
      }
      if (pending.length > maxShow) {
        lines.push('+' + (pending.length - maxShow) + ' more');
      }

      var title = pending.length + ' task' + (pending.length > 1 ? 's' : '') + ' waiting for approval';
      var body = lines.join('\n');

      var sent = sendPush_(title, body, 'BOTH', 0, getParentDashUrl_());

      if (sent) {
        console.log('ALERT_SENT', JSON.stringify({
          type: 'approval',
          count: pending.length,
          prevCount: lastCount
        }));
      }
    }

    // Always update stored count (even if it went down)
    props.setProperty('ALERT_LAST_PENDING', String(pending.length));

  } catch (e) {
    console.log('ALERT_ERROR', 'checkPendingApprovals: ' + e.message);
  }

  // v5: Also check Asks on the same trigger cycle
  try { checkPendingAsks(); } catch (e2) { console.log('ALERT_ERROR', 'checkPendingAsks piggyback: ' + e2.message); }
}


// ════════════════════════════════════════════════════════════════════
// ASK ALERTS — Check for new pending Asks, push to JT only
// ════════════════════════════════════════════════════════════════════

function checkPendingAsks() {
  if (!isAlertWindowOpen_()) return;
  try {
    var ss = getAESS_();
    var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_Requests'] || 'KH_Requests') : 'KH_Requests';
    var sheet = ss.getSheetByName(tabName);
    if (!sheet || sheet.getLastRow() < 2) return;

    var data = sheet.getDataRange().getValues();
    var h = data[0].map(function(c) { return String(c).trim(); });
    var statusCol = h.indexOf('Status');
    var childCol = h.indexOf('Child');
    var typeCol = h.indexOf('Type');
    var titleCol = h.indexOf('Title');
    var amountCol = h.indexOf('Amount');
    if (statusCol < 0) return;

    var pending = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][statusCol] || '').trim() === 'Pending') {
        pending.push({
          child: String(data[i][childCol] || ''),
          type: String(data[i][typeCol] || ''),
          title: String(data[i][titleCol] || ''),
          amount: data[i][amountCol] || 0
        });
      }
    }

    var props = PropertiesService.getScriptProperties();
    var lastCount = parseInt(props.getProperty('ALERT_LAST_ASKS') || '0');

    if (pending.length > lastCount && pending.length > 0) {
      var newest = pending[pending.length - 1];
      var amtStr = newest.amount ? ' ($' + Number(newest.amount).toFixed(2) + ')' : '';
      var title = newest.child + ' sent an Ask';
      var body = newest.type + ': ' + newest.title + amtStr;
      if (pending.length > 1) {
        body += '\n' + pending.length + ' total asks waiting';
      }

      sendPush_(title, body, 'BOTH', 0, getParentDashUrl_());
    }

    props.setProperty('ALERT_LAST_ASKS', String(pending.length));
  } catch (e) {
    console.log('ALERT_ERROR', 'checkPendingAsks: ' + e.message);
  }
}


// ════════════════════════════════════════════════════════════════════
// SYSTEM ERROR ALERTS — Check ErrorLog tab, push to LT only
// ════════════════════════════════════════════════════════════════════

function checkSystemErrors() {
  if (!isAlertWindowOpen_()) return;
  try {
    var ss = getAESS_();
    var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['ErrorLog'] || 'ErrorLog') : 'ErrorLog';
    var sheet = ss.getSheetByName(tabName);
    if (!sheet || sheet.getLastRow() < 2) return;

    var props = PropertiesService.getScriptProperties();
    var lastErrorTS = props.getProperty('ALERT_LAST_ERROR_TS') || '';
    var lastAlertTime = parseInt(props.getProperty('ALERT_LAST_ERROR_ALERT') || '0');

    // Throttle: max 1 error alert per hour
    var now = Date.now();
    if (now - lastAlertTime < 3600000) return;

    var data = sheet.getDataRange().getValues();
    var h = data[0].map(function(c) { return String(c).trim(); });
    var tsCol = h.indexOf('Timestamp');
    if (tsCol < 0) tsCol = 0; // fallback to first column

    // Find new errors since last check
    var newErrors = [];
    for (var i = data.length - 1; i >= 1; i--) {
      var ts = String(data[i][tsCol] || '');
      if (ts <= lastErrorTS) break;
      newErrors.push(ts + ' — ' + String(data[i][1] || '') + ': ' + String(data[i][2] || ''));
    }

    if (newErrors.length > 0) {
      var title = 'TBM: ' + newErrors.length + ' new error' + (newErrors.length > 1 ? 's' : '');
      var body = newErrors.slice(0, 3).join('\n');
      if (newErrors.length > 3) body += '\n+' + (newErrors.length - 3) + ' more';

      sendPush_(title, body, 'LT', 1); // priority 1 = high for errors

      // Update last error timestamp to most recent
      var latestTS = String(data[data.length - 1][tsCol] || '');
      props.setProperty('ALERT_LAST_ERROR_TS', latestTS);
      props.setProperty('ALERT_LAST_ERROR_ALERT', String(now));

      console.log('ALERT_SENT', JSON.stringify({
        type: 'system_error',
        count: newErrors.length
      }));
    }

  } catch (e) {
    console.log('ALERT_ERROR', 'checkSystemErrors: ' + e.message);
  }
}


// ════════════════════════════════════════════════════════════════════
// TRIGGER SETUP — Run once to install time-driven triggers
// ════════════════════════════════════════════════════════════════════

function setupAlertTriggers() {
  // Remove existing alert triggers first
  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    var fn = existing[i].getHandlerFunction();
    if (fn === 'checkPendingApprovals' || fn === 'checkSystemErrors') {
      ScriptApp.deleteTrigger(existing[i]);
    }
  }

  // Approval check: every 5 minutes
  ScriptApp.newTrigger('checkPendingApprovals')
    .timeBased()
    .everyMinutes(5)
    .create();

  // Error check: every 15 minutes
  ScriptApp.newTrigger('checkSystemErrors')
    .timeBased()
    .everyMinutes(15)
    .create();

  Logger.log('AlertEngine triggers installed: checkPendingApprovals (5min), checkSystemErrors (15min)');
}


function removeAlertTriggers() {
  var existing = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < existing.length; i++) {
    var fn = existing[i].getHandlerFunction();
    if (fn === 'checkPendingApprovals' || fn === 'checkSystemErrors') {
      ScriptApp.deleteTrigger(existing[i]);
      removed++;
    }
  }
  Logger.log('Removed ' + removed + ' alert triggers');
}


// ════════════════════════════════════════════════════════════════════
// TEST — Send test push to LT only (safe to run anytime)
// ════════════════════════════════════════════════════════════════════

function testPushoverLT() {
  var ok = sendPush_('TBM Test', 'Pushover is working — ' + new Date().toLocaleTimeString(), 'LT', 0);
  Logger.log('Test push to LT: ' + (ok ? 'SUCCESS' : 'FAILED'));
}

function testPushoverJT() {
  var ok = sendPush_('TBM Test', 'Pushover is working — ' + new Date().toLocaleTimeString(), 'JT', 0);
  Logger.log('Test push to JT: ' + (ok ? 'SUCCESS' : 'FAILED'));
}

function testPushoverBoth() {
  var ok = sendPush_('TBM Test', 'Pushover is working — ' + new Date().toLocaleTimeString(), 'BOTH', 0);
  Logger.log('Test push to BOTH: ' + (ok ? 'SUCCESS' : 'FAILED'));
}


// ════════════════════════════════════════════════════════════════════
// DIAGNOSTIC — Full system check (safe to run anytime, pushes LT only)
// ════════════════════════════════════════════════════════════════════

function diagnoseAlertEngine() {
  var results = [];
  results.push('=== AlertEngine v4 Diagnostic ===');
  results.push('Timestamp: ' + new Date().toString());

  // 1. Check Pushover config
  var config = getPushoverConfig_();
  results.push('');
  results.push('--- PUSHOVER CONFIG ---');
  results.push('Token: ' + (config.token ? 'SET ✅ (' + config.token.substring(0, 6) + '...)' : 'MISSING ❌'));
  results.push('User LT: ' + (config.userLT ? 'SET ✅ (' + config.userLT.substring(0, 6) + '...)' : 'MISSING ❌'));
  results.push('User JT: ' + (config.userJT ? 'SET ✅ (' + config.userJT.substring(0, 6) + '...)' : 'MISSING ❌'));

  // 2. Check alert window
  var now = new Date();
  var tz = Session.getScriptTimeZone();
  var hour = parseInt(Utilities.formatDate(now, tz, 'H'));
  var day = now.getDay();
  var isWeekend = (day === 0 || day === 6);
  var windowOpen = isWeekend ? (hour >= 8 && hour < 22) : (hour >= 15 && hour < 22);
  results.push('');
  results.push('--- SCHEDULE WINDOW ---');
  results.push('Current hour: ' + hour + ' | Day: ' + day + ' (' + (isWeekend ? 'Weekend' : 'Weekday') + ')');
  results.push('Window open: ' + (windowOpen ? 'YES ✅' : 'NO ❌'));

  // 3. Check triggers
  results.push('');
  results.push('--- TRIGGERS ---');
  var triggers = ScriptApp.getProjectTriggers();
  var approvalTrigger = false;
  var errorTrigger = false;
  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    if (fn === 'checkPendingApprovals') approvalTrigger = true;
    if (fn === 'checkSystemErrors') errorTrigger = true;
  }
  results.push('checkPendingApprovals: ' + (approvalTrigger ? 'INSTALLED ✅' : 'MISSING ❌'));
  results.push('checkSystemErrors: ' + (errorTrigger ? 'INSTALLED ✅' : 'MISSING ❌'));

  // 4. Check stored state
  results.push('');
  results.push('--- STORED STATE ---');
  var props = PropertiesService.getScriptProperties();
  results.push('ALERT_LAST_PENDING: ' + (props.getProperty('ALERT_LAST_PENDING') || '(not set)'));
  results.push('ALERT_LAST_ERROR_TS: ' + (props.getProperty('ALERT_LAST_ERROR_TS') || '(not set)'));

  // 5. Pending scan
  results.push('');
  results.push('--- PENDING APPROVALS ---');
  try {
    var ss = getAESS_();
    var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_Chores'] || 'KH_Chores') : 'KH_Chores';
    var sheet = ss.getSheetByName(tabName);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      var h = data[0].map(function(c) { return String(c).trim(); });
      var compCol = h.indexOf('Completed');
      var approvedCol = h.indexOf('Parent_Approved');
      var childCol = h.indexOf('Child');
      var taskCol = h.indexOf('Task');
      var activeCol = h.indexOf('Active');
      var count = 0;
      for (var j = 1; j < data.length; j++) {
        var row = data[j];
        if (activeCol >= 0 && String(row[activeCol] || '').toUpperCase() !== 'YES' && row[activeCol] !== true) continue;
        var isComp = row[compCol] === true || String(row[compCol]).toUpperCase() === 'TRUE';
        var isApp = row[approvedCol] === true || String(row[approvedCol]).toUpperCase() === 'TRUE';
        if (isComp && !isApp) {
          count++;
          results.push('  ' + String(row[childCol] || '?') + ': ' + String(row[taskCol] || '?'));
        }
      }
      results.push('Pending now: ' + count);
    }
  } catch(e) {
    results.push('ERROR: ' + e.message);
  }

  // 6. Send diagnostic push to LT
  results.push('');
  results.push('--- PUSH TEST ---');
  var diagText = results.join('\n');
  var ok = sendPush_('TBM Diagnostic', diagText, 'LT', -1); // low priority
  results.push(ok ? 'Diagnostic push sent ✅' : 'Diagnostic push FAILED ❌');

  var output = results.join('\n');
  Logger.log(output);
  return output;
}


// Reset pending count so next cycle fires
function resetAlertPendingCount() {
  PropertiesService.getScriptProperties().setProperty('ALERT_LAST_PENDING', '0');
  Logger.log('ALERT_LAST_PENDING reset to 0');
}


// ════════════════════════════════════════════════════════════════════
// DAILY HEALTH CHECK (v6) — Called by 6:00 AM CST trigger
// Runs smoke test, checks ErrorLog, row counts, promo cliffs, Tiller freshness
// ════════════════════════════════════════════════════════════════════

function dailyHealthCheck() {
  var alerts = [];
  var ss = getAESS_();

  // 1. Run smoke test
  try {
    var smokeResult = tbmSmokeTest();
    if (smokeResult && smokeResult.overall !== 'PASS') {
      alerts.push({title: 'TBM Smoke Test FAIL', msg: 'Smoke test failed at ' + new Date().toLocaleTimeString() + '. Check ErrorLog.', to: 'LT', pri: 1});
    }
  } catch(e) {
    alerts.push({title: 'Smoke Test Error', msg: 'tbmSmokeTest() threw: ' + e.message, to: 'LT', pri: 1});
  }

  // 2. Check ErrorLog for entries in last 24h
  try {
    var errSheet = ss.getSheetByName('\uD83D\uDCBB ErrorLog');
    if (errSheet && errSheet.getLastRow() > 1) {
      var errData = errSheet.getDataRange().getValues();
      var cutoff = new Date(Date.now() - 86400000).toISOString();
      var recentCount = 0;
      for (var i = 1; i < errData.length; i++) {
        if (String(errData[i][0] || '') > cutoff) recentCount++;
      }
      if (recentCount > 0) {
        alerts.push({title: recentCount + ' Error' + (recentCount > 1 ? 's' : '') + ' in 24h', msg: 'ErrorLog has ' + recentCount + ' new entries. Review in workbook.', to: 'LT', pri: 0});
      }
    }
  } catch(e) {
    console.log('dailyHealthCheck ErrorLog scan failed: ' + e.message);
  }

  // 3. Check Transactions row count vs 20k cap
  try {
    var txTab = typeof TAB_MAP !== 'undefined' ? TAB_MAP['Transactions'] : 'Transactions';
    var txSheet = ss.getSheetByName(txTab);
    if (txSheet) {
      var txRows = txSheet.getLastRow();
      if (txRows > 16000) {
        var pct = Math.round((txRows / 20000) * 100);
        alerts.push({title: 'Transactions at ' + pct + '%', msg: txRows + '/20000 rows. Consider archiving older transactions.', to: 'LT', pri: txRows > 18000 ? 1 : 0});
      }
    }
  } catch(e) {
    console.log('dailyHealthCheck Transactions check failed: ' + e.message);
  }

  // 4. Check Balance History row count
  try {
    var bhTab = typeof TAB_MAP !== 'undefined' ? TAB_MAP['Balance History'] : 'Balance History';
    var bhSheet = ss.getSheetByName(bhTab);
    if (bhSheet) {
      var bhRows = bhSheet.getLastRow();
      if (bhRows > 16000) {
        var bhPct = Math.round((bhRows / 20000) * 100);
        alerts.push({title: 'Balance History at ' + bhPct + '%', msg: bhRows + '/20000 rows.', to: 'LT', pri: 0});
      }
    }
  } catch(e) {
    console.log('dailyHealthCheck Balance History check failed: ' + e.message);
  }

  // 5. Check promo cliffs (DebtModel promo expiration dates)
  try {
    var dmTab = typeof TAB_MAP !== 'undefined' ? TAB_MAP['DebtModel'] : '\uD83D\uDCBB\uD83E\uDDEE DebtModel';
    var dmSheet = ss.getSheetByName(dmTab);
    if (dmSheet && dmSheet.getLastRow() > 1) {
      var dmData = dmSheet.getDataRange().getValues();
      var dmHeaders = dmData[0].map(function(h) { return String(h).trim(); });
      var promoCol = dmHeaders.indexOf('Promo_End');
      if (promoCol < 0) promoCol = dmHeaders.indexOf('PromoEnd');
      if (promoCol < 0) promoCol = dmHeaders.indexOf('Promo End');
      var nameCol = dmHeaders.indexOf('Account') >= 0 ? dmHeaders.indexOf('Account') : 0;

      if (promoCol >= 0) {
        var now = new Date();
        for (var j = 1; j < dmData.length; j++) {
          var promoDate = dmData[j][promoCol];
          if (promoDate instanceof Date) {
            var daysLeft = Math.ceil((promoDate.getTime() - now.getTime()) / 86400000);
            var acctName = String(dmData[j][nameCol] || 'Unknown');
            if (daysLeft > 0 && daysLeft <= 3) {
              alerts.push({title: 'Promo expires in ' + daysLeft + 'd', msg: acctName + ' promo ends ' + promoDate.toLocaleDateString(), to: 'BOTH', pri: 1});
            } else if (daysLeft > 3 && daysLeft <= 7) {
              alerts.push({title: 'Promo cliff in ' + daysLeft + 'd', msg: acctName + ' promo ends ' + promoDate.toLocaleDateString(), to: 'BOTH', pri: 0});
            }
          }
        }
      }
    }
  } catch(e) {
    console.log('dailyHealthCheck promo cliff check failed: ' + e.message);
  }

  // 6. Check Tiller freshness — latest transaction date
  try {
    var txTab2 = typeof TAB_MAP !== 'undefined' ? TAB_MAP['Transactions'] : 'Transactions';
    var txSheet2 = ss.getSheetByName(txTab2);
    if (txSheet2 && txSheet2.getLastRow() > 1) {
      var dateCol = 0; // Date is typically first column
      var txHeaders = txSheet2.getRange(1, 1, 1, txSheet2.getLastColumn()).getValues()[0];
      for (var d = 0; d < txHeaders.length; d++) {
        if (String(txHeaders[d]).trim().toLowerCase() === 'date') { dateCol = d; break; }
      }
      // Read last 50 rows to find most recent date
      var startRow = Math.max(2, txSheet2.getLastRow() - 49);
      var dateRange = txSheet2.getRange(startRow, dateCol + 1, txSheet2.getLastRow() - startRow + 1, 1).getValues();
      var latestDate = null;
      for (var k = dateRange.length - 1; k >= 0; k--) {
        if (dateRange[k][0] instanceof Date) {
          latestDate = dateRange[k][0];
          break;
        }
      }
      if (latestDate) {
        var staleHours = (Date.now() - latestDate.getTime()) / 3600000;
        if (staleHours > 48) {
          alerts.push({title: 'Tiller Stale', msg: 'Latest transaction is ' + Math.round(staleHours) + 'h old. Check Tiller sync.', to: 'LT', pri: 1});
        }
      }
    }
  } catch(e) {
    console.log('dailyHealthCheck Tiller freshness check failed: ' + e.message);
  }

  // Send all accumulated alerts
  for (var a = 0; a < alerts.length; a++) {
    sendPush_(alerts[a].title, alerts[a].msg, alerts[a].to, alerts[a].pri);
  }

  var result = {checked: true, alertCount: alerts.length, timestamp: new Date().toISOString()};
  Logger.log('dailyHealthCheck complete: ' + JSON.stringify(result));
  return result;
}

// ════════════════════════════════════════════════════════════════════
// END OF FILE — AlertEngine v6
// ════════════════════════════════════════════════════════════════════