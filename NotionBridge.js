// NotionBridge.gs v1
// Pushes TBM health data to Notion for Custom Agent consumption.
// Setup: Script Properties → NOTION_TOKEN = your integration token
//        Script Properties → NOTION_HEALTH_DB = 82411a222f774ee59574e06d5ac76154
//
// Usage: Run pushHealthSnapshot() manually or on a weekly time trigger.
// Install trigger: Run installWeeklyHealthPush() once from Apps Script editor.
//
// Version history tracked in Notion deploy page. Do not add version comments here.

// ═══════════════════════════════════════════════════════════════
// SECTION 1: Configuration
// ═══════════════════════════════════════════════════════════════

var NOTION_API_URL = 'https://api.notion.com/v1/pages';
var NOTION_API_VERSION = '2022-06-28';

function _getNotionToken() {
  var token = PropertiesService.getScriptProperties().getProperty('NOTION_TOKEN');
  if (!token) throw new Error('NOTION_TOKEN not set in Script Properties. Go to Project Settings → Script Properties → Add NOTION_TOKEN.');
  return token;
}

function _getNotionDbId() {
  var dbId = PropertiesService.getScriptProperties().getProperty('NOTION_HEALTH_DB');
  if (!dbId) dbId = '82411a222f774ee59574e06d5ac76154'; // default
  return dbId;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: Data Collection
// ═══════════════════════════════════════════════════════════════

function _collectHealthData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {};
  var log = [];

  // --- KPIs from DataEngine ---
  var data = null;
  try {
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth(); // 0-indexed
    var startStr = y + '-' + _pad(m + 1) + '-01';
    var lastDay = new Date(y, m + 1, 0).getDate();
    var endStr = y + '-' + _pad(m + 1) + '-' + _pad(lastDay);
    data = getData(startStr, endStr, true);

    result.earnedIncome = _round(data.earnedIncome);
    result.opExpenses = _round(data.operatingExpenses);
    result.cashFlow = _round(data.operationalCashFlow);
    result.debtCurrent = _round(data.debtCurrent || data.totalNonMortgageDebt);
    result.debtPayments = _round(data.debtPaymentsMTD);
    result.netWorth = _round(data.netWorth);
    result.interestBurn = _round(data.canonicalInterestBurn);
    result.deVersion = typeof getDataEngineVersion === 'function' ? getDataEngineVersion() : 0;

    // Extra fields for the agent report body
    result.debtStart = _round(data.debtStart);
    result.debtPaidSoFar = _round((data.debtStart || 0) - (data.debtCurrent || 0));
    result.totalMinimums = _round(data.totalMinimums);
    result.bridgeCash = _round(data.bridgeCash);

    log.push('KPI collection: OK');
  } catch (e) {
    log.push('KPI collection FAILED: ' + e.message);
    result.earnedIncome = 0;
    result.opExpenses = 0;
    result.cashFlow = 0;
    result.debtCurrent = 0;
    result.debtPayments = 0;
    result.netWorth = 0;
    result.interestBurn = 0;
    result.deVersion = 0;
  }

  // --- MER Gate Results ---
  result.gates = [];
  try {
    var merSheet = ss.getSheetByName(TAB_MAP['MER'] || '💻🧮 Month-End Review');
    if (!merSheet) merSheet = ss.getSheetByName('Month-End Review');
    if (merSheet) {
      var merData = merSheet.getDataRange().getValues();
      var gateCount = 0;
      var passCount = 0;
      var failCount = 0;
      var warnCount = 0;

      for (var r = 1; r < merData.length; r++) {
        var gateName = String(merData[r][0] || '').trim();
        var gateResult = String(merData[r][1] || '').trim();
        var gateValue = String(merData[r][2] || '').trim();
        // Only count rows that start with "Gate" — skip metadata rows (Month, Status, Summary, etc.)
        if (!gateName || gateName.indexOf('Gate') !== 0) continue;

        gateCount++;
        var status = 'UNKNOWN';
        var combined = (gateResult + ' ' + gateValue).toUpperCase();
        if (combined.indexOf('PASS') > -1 || gateResult.indexOf('✅') > -1) {
          passCount++;
          status = 'PASS';
        } else if (combined.indexOf('FAIL') > -1 || gateResult.indexOf('❌') > -1 || gateResult.indexOf('🔴') > -1) {
          failCount++;
          status = 'FAIL';
        } else if (combined.indexOf('WARN') > -1 || combined.indexOf('REVIEW') > -1 || gateResult.indexOf('⚠') > -1) {
          warnCount++;
          status = 'WARN';
        }

        result.gates.push({
          name: gateName,
          status: status,
          value: gateValue
        });
      }

      result.gateCount = gateCount;
      result.gatePass = passCount;
      result.gateFail = failCount;
      result.gateWarn = warnCount;
      log.push('MER gates: ' + passCount + '/' + gateCount + ' pass');
    } else {
      log.push('MER sheet not found');
      result.gateCount = 0;
      result.gatePass = 0;
      result.gateFail = 0;
      result.gateWarn = 0;
    }
  } catch (e) {
    log.push('MER gate collection FAILED: ' + e.message);
    result.gateCount = 0;
    result.gatePass = 0;
    result.gateFail = 0;
    result.gateWarn = 0;
  }

  // --- Uncategorized transactions ---
  try {
    var txSheet = ss.getSheetByName(TAB_MAP['Transactions'] || '🔒 Transactions');
    if (!txSheet) txSheet = ss.getSheetByName('Transactions');
    if (txSheet) {
      var txData = txSheet.getDataRange().getValues();
      var uncat = 0;
      for (var r = 1; r < txData.length; r++) {
        var cat = String(txData[r][3] || '').trim(); // Column D = Category
        var dt = txData[r][1]; // Column B = Date
        if (dt && (!cat || cat.toLowerCase() === 'uncategorized')) uncat++;
      }
      result.uncategorized = uncat;
      log.push('Uncategorized: ' + uncat);
    }
  } catch (e) {
    log.push('Uncategorized check FAILED: ' + e.message);
    result.uncategorized = -1;
  }

  // --- Row capacity ---
  try {
    var txSheet2 = ss.getSheetByName(TAB_MAP['Transactions'] || '🔒 Transactions');
    if (!txSheet2) txSheet2 = ss.getSheetByName('Transactions');
    if (txSheet2) {
      result.rowCount = txSheet2.getLastRow();
      result.rowCap = 20000;
      result.rowPct = Math.round((result.rowCount / result.rowCap) * 100);
      log.push('Row capacity: ' + result.rowCount + '/' + result.rowCap + ' (' + result.rowPct + '%)');
    }
  } catch (e) {
    log.push('Row cap check FAILED: ' + e.message);
    result.rowCount = 0;
    result.rowCap = 20000;
    result.rowPct = 0;
  }

  // --- Promo cliffs within 60 days ---
  result.promoAlerts = [];
  try {
    if (data && data.debts) {
      var now2 = new Date();
      var sixtyDays = new Date(now2.getTime() + 60 * 86400000);
      for (var i = 0; i < data.debts.length; i++) {
        var d = data.debts[i];
        if (d.promoEnd) {
          var promoDate = new Date(d.promoEnd);
          if (promoDate <= sixtyDays) {
            var daysLeft = Math.round((promoDate - now2) / 86400000);
            result.promoAlerts.push({
              name: d.name,
              balance: _round(d.balance),
              promoEnd: d.promoEnd,
              postAPR: d.postPromoAPR || d.apr,
              daysLeft: daysLeft,
              expired: daysLeft < 0
            });
          }
        }
      }
    }
    log.push('Promo alerts: ' + result.promoAlerts.length);
  } catch (e) {
    log.push('Promo check FAILED: ' + e.message);
  }

  result.log = log;
  return result;
}

function _round(val) {
  var n = parseFloat(val);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

function _pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: Notion API Push
// ═══════════════════════════════════════════════════════════════

function _determineStatus(health) {
  if (health.gateFail > 0 || health.uncategorized > 5) return 'Alert';
  if (health.gateWarn > 0 || health.uncategorized > 0 || health.rowPct > 80) return 'Warning';
  return 'Healthy';
}

function _buildPageContent(health) {
  var lines = [];
  var now = new Date();

  lines.push('## Validation Run: ' + now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US'));
  lines.push('');

  // Gate summary
  lines.push('### MER Gates: ' + health.gatePass + '/' + health.gateCount + ' pass');
  if (health.gates && health.gates.length > 0) {
    for (var i = 0; i < health.gates.length; i++) {
      var g = health.gates[i];
      var icon = g.status === 'PASS' ? '✅' : (g.status === 'FAIL' ? '❌' : '⚠️');
      lines.push(icon + ' **' + g.name + '**: ' + g.status + (g.value ? ' — ' + g.value : ''));
    }
  }
  lines.push('');

  // KPI snapshot
  lines.push('### KPI Snapshot');
  lines.push('- Earned Income: $' + _fmt(health.earnedIncome));
  lines.push('- Operating Expenses: $' + _fmt(health.opExpenses));
  lines.push('- Cash Flow: $' + _fmt(health.cashFlow));
  lines.push('- Non-Mortgage Debt: $' + _fmt(health.debtCurrent));
  lines.push('- Debt Paid Since Jan 1: $' + _fmt(health.debtPaidSoFar));
  lines.push('- Debt Payments MTD: $' + _fmt(health.debtPayments));
  lines.push('- Total Minimums: $' + _fmt(health.totalMinimums));
  lines.push('- Interest Burn: $' + _fmt(health.interestBurn) + '/mo');
  lines.push('- Net Worth: $' + _fmt(health.netWorth));
  lines.push('- Bridge Cash: $' + _fmt(health.bridgeCash));
  lines.push('- DataEngine: v' + health.deVersion);
  lines.push('');

  // Data quality
  lines.push('### Data Quality');
  lines.push('- Uncategorized transactions: ' + health.uncategorized);
  lines.push('- Row capacity: ' + health.rowCount + ' / ' + health.rowCap + ' (' + health.rowPct + '%)');
  lines.push('');

  // Promo alerts
  if (health.promoAlerts && health.promoAlerts.length > 0) {
    lines.push('### Promo Cliff Alerts');
    for (var j = 0; j < health.promoAlerts.length; j++) {
      var p = health.promoAlerts[j];
      var tag = p.expired ? '🔴 EXPIRED' : ('⚠️ ' + p.daysLeft + ' days');
      lines.push('- **' + p.name + '**: $' + _fmt(p.balance) + ' — ' + tag + ' → ' + (p.postAPR * 100).toFixed(1) + '% APR');
    }
    lines.push('');
  }

  // Collection log
  lines.push('### Collection Log');
  if (health.log) {
    for (var k = 0; k < health.log.length; k++) {
      lines.push('- ' + health.log[k]);
    }
  }

  return lines.join('\n');
}

function _fmt(val) {
  if (val == null || isNaN(val)) return '0';
  var abs = Math.abs(val);
  var str = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return val < 0 ? '-' + str : str;
}

function _postToNotion(health) {
  var token = _getNotionToken();
  var dbId = _getNotionDbId();
  var status = _determineStatus(health);
  var now = new Date();
  var dateStr = (now.getMonth() + 1) + '/' + now.getDate() + '/' + now.getFullYear();

  var payload = {
    parent: { database_id: dbId },
    properties: {
      'Date': {
        title: [{ text: { content: dateStr } }]
      },
      'Status': {
        select: { name: status }
      },
      'Earned Income': {
        number: health.earnedIncome || 0
      },
      'Op Expenses': {
        number: health.opExpenses || 0
      },
      'Cash Flow': {
        number: health.cashFlow || 0
      },
      'Debt Current': {
        number: health.debtCurrent || 0
      },
      'Debt Payments': {
        number: health.debtPayments || 0
      },
      'Net Worth': {
        number: health.netWorth || 0
      },
      'Interest Burn': {
        number: health.interestBurn || 0
      },
      'DE Version': {
        number: health.deVersion || 0
      }
    },
    children: _markdownToBlocks(_buildPageContent(health))
  };

  var options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(NOTION_API_URL, options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code === 200 || code === 201) {
    var parsed = JSON.parse(body);
    return { success: true, pageId: parsed.id, url: parsed.url };
  } else {
    return { success: false, code: code, error: body };
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: Markdown → Notion Blocks (simplified)
// ═══════════════════════════════════════════════════════════════

function _markdownToBlocks(md) {
  var lines = md.split('\n');
  var blocks = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (line.indexOf('### ') === 0) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ type: 'text', text: { content: line.substring(4) } }] }
      });
    } else if (line.indexOf('## ') === 0) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: line.substring(3) } }] }
      });
    } else if (line.indexOf('- ') === 0) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: _parseRichText(line.substring(2)) }
      });
    } else if (line.trim() === '') {
      // skip blank lines
    } else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: _parseRichText(line) }
      });
    }
  }

  // Notion API limits to 100 blocks per request
  if (blocks.length > 100) blocks = blocks.slice(0, 100);
  return blocks;
}

function _parseRichText(text) {
  // Simple bold parsing: **text** → bold annotation
  var parts = [];
  var regex = /\*\*([^*]+)\*\*/g;
  var lastIndex = 0;
  var match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: { content: text.substring(lastIndex, match.index) } });
    }
    parts.push({
      type: 'text',
      text: { content: match[1] },
      annotations: { bold: true }
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', text: { content: text.substring(lastIndex) } });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', text: { content: text } });
  }

  return parts;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5: Public Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Main entry point. Collects health data and pushes to Notion.
 * Run manually or via weekly trigger.
 */
function pushHealthSnapshot() {
  Logger.log('═══ NotionBridge: Starting health snapshot ═══');

  var health = _collectHealthData();
  Logger.log('Collection complete. Gates: ' + health.gatePass + '/' + health.gateCount +
             ', Status: ' + _determineStatus(health));

  var result = _postToNotion(health);

  if (result.success) {
    Logger.log('✅ Posted to Notion. Page: ' + result.url);
  } else {
    Logger.log('❌ Notion API error (' + result.code + '): ' + result.error);
  }

  Logger.log('═══ NotionBridge: Complete ═══');
  return result;
}

/**
 * Dry run — collects data and logs it without posting to Notion.
 * Use this to verify data collection before going live.
 */
function testHealthCollection() {
  var health = _collectHealthData();
  Logger.log('═══ HEALTH DATA (dry run) ═══');
  Logger.log('Status: ' + _determineStatus(health));
  Logger.log('Gates: ' + health.gatePass + '/' + health.gateCount +
             ' (fail=' + health.gateFail + ', warn=' + health.gateWarn + ')');
  Logger.log('Income: $' + health.earnedIncome);
  Logger.log('OpEx: $' + health.opExpenses);
  Logger.log('CF: $' + health.cashFlow);
  Logger.log('Debt: $' + health.debtCurrent);
  Logger.log('NW: $' + health.netWorth);
  Logger.log('Interest: $' + health.interestBurn + '/mo');
  Logger.log('Uncategorized: ' + health.uncategorized);
  Logger.log('Row cap: ' + health.rowCount + '/' + health.rowCap + ' (' + health.rowPct + '%)');
  Logger.log('Promo alerts: ' + health.promoAlerts.length);
  if (health.promoAlerts.length > 0) {
    for (var i = 0; i < health.promoAlerts.length; i++) {
      var p = health.promoAlerts[i];
      Logger.log('  ' + p.name + ': $' + p.balance + ' — ' + p.daysLeft + ' days → ' + (p.postAPR * 100).toFixed(1) + '%');
    }
  }
  Logger.log('Log: ' + health.log.join(' | '));
  Logger.log('');
  Logger.log('Page content preview:');
  Logger.log(_buildPageContent(health));
}

/**
 * Verify Notion API connection. Tests token + database access.
 */
function testNotionConnection() {
  var token = _getNotionToken();
  var dbId = _getNotionDbId();

  var options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch('https://api.notion.com/v1/databases/' + dbId, options);
  var code = response.getResponseCode();

  if (code === 200) {
    var parsed = JSON.parse(response.getContentText());
    Logger.log('✅ Connected to Notion. Database: ' + parsed.title[0].plain_text);
    Logger.log('Properties: ' + Object.keys(parsed.properties).join(', '));
  } else {
    Logger.log('❌ Connection failed (' + code + '): ' + response.getContentText());
    Logger.log('Check: 1) NOTION_TOKEN in Script Properties, 2) Integration shared with Health Log DB');
  }
}

/**
 * Install weekly trigger. Run once from Apps Script editor.
 * Pushes health snapshot every Wednesday at 10 AM CT.
 */
function installWeeklyHealthPush() {
  // Remove existing triggers for this function
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'pushHealthSnapshot') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger('pushHealthSnapshot')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.WEDNESDAY)
    .atHour(10)
    .create();

  Logger.log('✅ Weekly trigger installed: pushHealthSnapshot() every Wednesday ~10 AM');
}

// EOF — NotionBridge.gs v1