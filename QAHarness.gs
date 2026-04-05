// ════════════════════════════════════════════════════════════════════
// QAHarness.gs v1 — Scenario Fixtures, Clock Override, Snapshot/Restore
// WRITES TO: KH_ tabs (via seed/restore), Script Properties (clock, snapshots)
// READS FROM: TAB_MAP, TBM_ENV, Script Properties
// ════════════════════════════════════════════════════════════════════

function getQAHarnessVersion() { return 1; }

// ════════════════════════════════════════════════════════════════════
// 1. CLOCK OVERRIDE
//
// tbm_now_() returns an overridable "now" for testing time-dependent
// workflows (morning reset, week rollover, approval timing).
//
// In prod: always returns real new Date().
// In QA with CLOCK_OVERRIDE set: returns the override time.
//
// Usage: Replace new Date() with tbm_now_() in business logic that
// checks "what time is it" for workflow decisions. Keep real new Date()
// for logging timestamps (ErrorLog, PerfLog, etc).
// ════════════════════════════════════════════════════════════════════

function tbm_now_() {
  if (typeof TBM_ENV !== 'undefined' && TBM_ENV.ENV === 'qa') {
    try {
      var override = PropertiesService.getScriptProperties().getProperty('CLOCK_OVERRIDE');
      if (override) return new Date(override);
    } catch(e) { /* fall through to real time */ }
  }
  return new Date();
}

/**
 * Set clock override. QA only.
 * @param {string} isoDateString — ISO 8601 date string (e.g., '2026-04-07T06:00:00')
 */
function setClockOverride(isoDateString) {
  tbm_requireQA_('setClockOverride');
  var d = new Date(isoDateString);
  if (isNaN(d.getTime())) throw new Error('Invalid date: ' + isoDateString);
  PropertiesService.getScriptProperties().setProperty('CLOCK_OVERRIDE', isoDateString);
  Logger.log('Clock override set: ' + isoDateString + ' (' + d.toLocaleString() + ')');
  return { clock: isoDateString, resolved: d.toISOString() };
}

/**
 * Clear clock override. Returns to real time.
 */
function clearClockOverride() {
  tbm_requireQA_('clearClockOverride');
  PropertiesService.getScriptProperties().deleteProperty('CLOCK_OVERRIDE');
  Logger.log('Clock override cleared. tbm_now_() returns real time.');
  return { clock: 'real', now: new Date().toISOString() };
}


// ════════════════════════════════════════════════════════════════════
// 2. SCENARIO FIXTURES
//
// Pre-defined data states loadable into QA workbook.
// Each scenario sets the clock + populates known test data.
// ════════════════════════════════════════════════════════════════════

var QA_SCENARIOS = {
  'fresh-morning': {
    description: '6 AM Monday — all tasks reset, no completions, zero points',
    clock: '2026-04-06T06:00:00',
    setup: setupFreshMorning_
  },
  'pending-approvals': {
    description: '3 PM — 3 tasks completed by kids, awaiting parent approval',
    clock: '2026-04-06T15:00:00',
    setup: setupPendingApprovals_
  },
  'all-clear': {
    description: '7 PM — all tasks approved, board shows celebration state',
    clock: '2026-04-06T19:00:00',
    setup: setupAllClear_
  },
  'week-rollover': {
    description: 'Sunday 11:59 PM — test Monday morning reset behavior',
    clock: '2026-04-05T23:59:00',
    setup: setupWeekRollover_
  },
  'education-pending-review': {
    description: '4 PM — homework submitted, parent needs to review',
    clock: '2026-04-06T16:00:00',
    setup: setupEducationPendingReview_
  }
};

/**
 * Load a named scenario into the QA workbook.
 * Sets clock, runs setup function, busts cache.
 */
function loadScenario(scenarioName) {
  tbm_requireQA_('loadScenario');
  var scenario = QA_SCENARIOS[scenarioName];
  if (!scenario) {
    var available = Object.keys(QA_SCENARIOS).join(', ');
    throw new Error('Unknown scenario: ' + scenarioName + '. Available: ' + available);
  }

  Logger.log('=== Loading scenario: ' + scenarioName + ' ===');
  Logger.log('Description: ' + scenario.description);

  // Set clock
  if (scenario.clock) {
    setClockOverride(scenario.clock);
  }

  // Reset to clean slate first
  clearKHTestData();

  // Run scenario-specific setup
  scenario.setup();

  // Bust cache so dashboards pick up new state
  try {
    CacheService.getScriptCache().removeAll(['kh_payload', 'kh_heartbeat', 'de_payload']);
  } catch(e) { /* cache bust is best-effort */ }

  Logger.log('=== Scenario ' + scenarioName + ' loaded ===');
  return {
    scenario: scenarioName,
    description: scenario.description,
    clock: scenario.clock,
    timestamp: new Date().toISOString()
  };
}

/**
 * List all available scenarios.
 */
function listScenarios() {
  var result = [];
  var keys = Object.keys(QA_SCENARIOS);
  for (var i = 0; i < keys.length; i++) {
    result.push({ name: keys[i], description: QA_SCENARIOS[keys[i]].description });
  }
  return result;
}


// ── SCENARIO SETUP FUNCTIONS ─────────────────────────────────────

function setupFreshMorning_() {
  // clearKHTestData already ran — workbook is clean
  // Seed tasks but leave all uncompleted
  seedKHChores_();
  Logger.log('Fresh morning: 12 tasks seeded, all pending');
}

function setupPendingApprovals_() {
  seedKHChores_();
  // Mark 3 tasks as completed (awaiting parent approval)
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_Chores'] || 'KH_Chores') : 'KH_Chores';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(String);
  var cDone = headers.indexOf('Completed');
  var cDate = headers.indexOf('Completed_Date');
  var now = tbm_now_();
  var marked = 0;

  for (var i = 1; i < data.length && marked < 3; i++) {
    if (cDone >= 0) sheet.getRange(i + 1, cDone + 1).setValue(true);
    if (cDate >= 0) sheet.getRange(i + 1, cDate + 1).setValue(now);
    marked++;
  }
  Logger.log('Pending approvals: 3 tasks marked completed, awaiting parent review');
}

function setupAllClear_() {
  seedKHChores_();
  // Mark ALL tasks as completed AND approved
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_Chores'] || 'KH_Chores') : 'KH_Chores';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(String);
  var cDone = headers.indexOf('Completed');
  var cDate = headers.indexOf('Completed_Date');
  var cAppr = headers.indexOf('Parent_Approved');
  var now = tbm_now_();

  for (var i = 1; i < data.length; i++) {
    if (cDone >= 0) sheet.getRange(i + 1, cDone + 1).setValue(true);
    if (cDate >= 0) sheet.getRange(i + 1, cDate + 1).setValue(now);
    if (cAppr >= 0) sheet.getRange(i + 1, cAppr + 1).setValue(true);
  }
  Logger.log('All clear: all tasks completed and approved');
}

function setupWeekRollover_() {
  seedKHChores_();
  // Seed a full week of history so rollover has data to preserve
  seedKHHistory_();
  Logger.log('Week rollover: tasks + history seeded, clock at Sunday 11:59 PM');
}

function setupEducationPendingReview_() {
  seedKHChores_();
  // Seed an education submission awaiting review
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_Education'] || 'KH_Education') : 'KH_Education';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    Logger.log('WARNING: KH_Education tab not found — skipping education seed');
    return;
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  var colMap = {};
  for (var h = 0; h < headers.length; h++) { colMap[headers[h]] = h; }

  var row = new Array(headers.length);
  for (var c = 0; c < row.length; c++) row[c] = '';
  if (colMap['Child'] !== undefined) row[colMap['Child']] = 'buggsy';
  if (colMap['Module'] !== undefined) row[colMap['Module']] = 'homework';
  if (colMap['Score'] !== undefined) row[colMap['Score']] = 85;
  if (colMap['Status'] !== undefined) row[colMap['Status']] = 'pending_review';
  if (colMap['Date'] !== undefined) row[colMap['Date']] = tbm_now_();
  if (colMap['Submitted_Date'] !== undefined) row[colMap['Submitted_Date']] = tbm_now_();

  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, 1, headers.length).setValues([row]);
  Logger.log('Education pending review: homework submission seeded for buggsy');
}


// ════════════════════════════════════════════════════════════════════
// 3. SNAPSHOT / RESTORE
//
// Save and restore QA workbook state for repeatable destructive tests.
// Stores tab data in Script Properties (9KB per key limit).
// Falls back to a QA_Snapshots tab if data exceeds property limits.
// ════════════════════════════════════════════════════════════════════

var SNAPSHOT_TABS = ['KH_Chores', 'KH_History', 'KH_Requests', 'KH_ScreenTime', 'KH_Rewards'];

/**
 * Save current state of key KH tabs.
 * @param {string} snapshotName — identifier for this snapshot
 */
function snapshotQAState(snapshotName) {
  tbm_requireQA_('snapshotQAState');
  var ss = SpreadsheetApp.openById(SSID);
  var snapshot = {};

  for (var i = 0; i < SNAPSHOT_TABS.length; i++) {
    var tabKey = SNAPSHOT_TABS[i];
    var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP[tabKey] || tabKey) : tabKey;
    var sheet = ss.getSheetByName(tabName);
    if (sheet && sheet.getLastRow() > 0) {
      snapshot[tabKey] = sheet.getDataRange().getValues();
    }
  }

  var json = JSON.stringify(snapshot);
  var propKey = 'QA_SNAP_' + snapshotName;

  if (json.length < 9000) {
    PropertiesService.getScriptProperties().setProperty(propKey, json);
    Logger.log('Snapshot "' + snapshotName + '" saved to Script Properties (' + json.length + ' bytes)');
  } else {
    // Fallback: write to a dedicated tab
    var snapSheet = ss.getSheetByName('QA_Snapshots');
    if (!snapSheet) snapSheet = ss.insertSheet('QA_Snapshots');
    var row = snapSheet.getLastRow() + 1;
    snapSheet.getRange(row, 1).setValue(snapshotName);
    snapSheet.getRange(row, 2).setValue(json);
    snapSheet.getRange(row, 3).setValue(new Date().toISOString());
    Logger.log('Snapshot "' + snapshotName + '" saved to QA_Snapshots tab (' + json.length + ' bytes, exceeded property limit)');
  }

  return { name: snapshotName, size: json.length, tabs: SNAPSHOT_TABS.length };
}

/**
 * Restore a saved snapshot.
 * @param {string} snapshotName — identifier for the snapshot to restore
 */
function restoreQAState(snapshotName) {
  tbm_requireQA_('restoreQAState');
  var propKey = 'QA_SNAP_' + snapshotName;
  var json = PropertiesService.getScriptProperties().getProperty(propKey);

  // Check fallback tab if not in properties
  if (!json) {
    var ss = SpreadsheetApp.openById(SSID);
    var snapSheet = ss.getSheetByName('QA_Snapshots');
    if (snapSheet) {
      var data = snapSheet.getDataRange().getValues();
      for (var r = 0; r < data.length; r++) {
        if (data[r][0] === snapshotName) { json = data[r][1]; break; }
      }
    }
  }

  if (!json) throw new Error('Snapshot "' + snapshotName + '" not found');

  var snapshot = JSON.parse(json);
  var ss2 = SpreadsheetApp.openById(SSID);

  var keys = Object.keys(snapshot);
  for (var i = 0; i < keys.length; i++) {
    var tabKey = keys[i];
    var tabName = typeof TAB_MAP !== 'undefined' ? (TAB_MAP[tabKey] || tabKey) : tabKey;
    var sheet = ss2.getSheetByName(tabName);
    if (!sheet) { Logger.log('WARNING: ' + tabKey + ' not found — skipping restore'); continue; }

    var values = snapshot[tabKey];
    if (!values || values.length === 0) continue;

    // Clear existing data
    if (sheet.getLastRow() > 0) {
      sheet.clearContents();
    }
    // Write snapshot data
    sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
    Logger.log('Restored ' + tabKey + ' (' + values.length + ' rows)');
  }

  Logger.log('Snapshot "' + snapshotName + '" restored');
  return { name: snapshotName, tabsRestored: keys.length };
}

// Version history tracked in Notion deploy page. Do not add version comments here.
// QAHarness.gs v1 — EOF
