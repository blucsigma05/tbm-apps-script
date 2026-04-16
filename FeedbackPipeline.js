// ════════════════════════════════════════════════════════════════════
// FeedbackPipeline.gs v2 — Gemini Triage + Auto-Issue + Weekly Digest
// WRITES TO: Feedback (Processed, Classification columns)
// READS FROM: Feedback, Script Properties (GEMINI_API_KEY, GITHUB_PAT)
// DEPENDENCIES: callGemini_ (ContentEngine.gs), sendPush_ (AlertEngine),
//               logError_ (GASHardening.gs), TAB_MAP (DataEngine.gs)
// Issue: #231
// ════════════════════════════════════════════════════════════════════

function getFeedbackPipelineVersion() { return 2; }

// ════════════════════════════════════════════════════════════════════
// LAYER 2: GEMINI TRIAGE — classify unprocessed feedback rows
// Run via daily trigger (LT installs: 7:00 AM CST).
// Reads rows where Processed is empty, sends to Gemini, writes back.
// ════════════════════════════════════════════════════════════════════

/**
 * Daily trigger entry point. Classifies unprocessed feedback via Gemini.
 * Safe to run multiple times — only touches rows with empty Processed column.
 */
function triageFeedback() {
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['Feedback']) || '💻 Feedback';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet || sheet.getLastRow() < 2) {
    Logger.log('triageFeedback: No feedback rows to process.');
    return;
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colMap = {};
  for (var h = 0; h < headers.length; h++) { colMap[headers[h]] = h; }

  // Validate required columns exist
  var reqCols = ['Timestamp', 'Surface', 'LayoutRating', 'FreeText', 'User', 'Processed', 'Classification'];
  for (var r = 0; r < reqCols.length; r++) {
    if (colMap[reqCols[r]] === undefined) {
      Logger.log('triageFeedback: Missing column "' + reqCols[r] + '". Run setupFeedbackSheet() first.');
      return;
    }
  }

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  var processedCol = colMap['Processed'] + 1; // 1-indexed for sheet writes
  var classificationCol = colMap['Classification'] + 1;
  var processed = 0;
  var issues = [];

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    // Skip already processed
    if (String(row[colMap['Processed']] || '').length > 0) continue;

    var surface = String(row[colMap['Surface']] || 'unknown');
    var rating = parseInt(row[colMap['LayoutRating']], 10) || 0;
    var text = String(row[colMap['FreeText']] || '');
    var user = String(row[colMap['User']] || 'unknown');
    var timestamp = String(row[colMap['Timestamp']] || '');
    var sheetRow = i + 2; // 1-indexed, skip header

    // If no free text and rating >= 3, classify as compliment and skip Gemini
    if (!text && rating >= 3) {
      sheet.getRange(sheetRow, processedCol).setValue('auto-skip');
      sheet.getRange(sheetRow, classificationCol).setValue('compliment');
      processed++;
      continue;
    }

    // If no free text and rating < 3, classify as signal but skip Gemini
    if (!text && rating < 3) {
      sheet.getRange(sheetRow, processedCol).setValue('auto-skip');
      sheet.getRange(sheetRow, classificationCol).setValue('low-rating');
      processed++;
      continue;
    }

    // Has free text — ask Gemini
    var classification = classifyFeedback_(surface, rating, text, user);
    sheet.getRange(sheetRow, classificationCol).setValue(classification.type);

    if (classification.type === 'bug' || classification.type === 'feature_request') {
      // Queue for issue creation
      var issueResult = createGitHubIssue_(surface, rating, text, user, timestamp, classification);
      if (issueResult && issueResult.url) {
        sheet.getRange(sheetRow, processedCol).setValue('issue-created');
        issues.push(issueResult.url);
      } else {
        sheet.getRange(sheetRow, processedCol).setValue('triage-failed');
      }
    } else {
      sheet.getRange(sheetRow, processedCol).setValue('classified');
    }
    processed++;

    // Rate limit: 1 second between Gemini calls
    if (i < data.length - 1) Utilities.sleep(1000);
  }

  Logger.log('triageFeedback: Processed ' + processed + ' rows, created ' + issues.length + ' issues.');

  // Notify LT if issues were created
  if (issues.length > 0 && typeof sendPush_ === 'function') {
    try {
      sendPush_(
        'Feedback Triage: ' + issues.length + ' issues created',
        issues.join('\n'),
        'LT',
        typeof PUSHOVER_PRIORITY !== 'undefined' ? PUSHOVER_PRIORITY.CHORE_APPROVAL : 0
      );
    } catch(e) { /* non-critical */ }
  }
}

/**
 * Classify a feedback entry using Gemini.
 * Returns { type: 'bug'|'feature_request'|'compliment'|'noise', severity: string, summary: string }
 */
function classifyFeedback_(surface, rating, text, user) {
  var fallback = { type: 'noise', severity: 'minor', summary: text.substring(0, 100) };

  try {
    var prompt = 'You are a feedback classifier for a family household platform (TBM).\n' +
      'The platform has education modules for kids (homework, spelling, reading, math drills, comic creation) ' +
      'and finance dashboards for adults.\n\n' +
      'Classify this user feedback:\n' +
      'Surface: ' + surface + '\n' +
      'Rating: ' + rating + '/5\n' +
      'User: ' + user + '\n' +
      'Text: "' + text + '"\n\n' +
      'Respond with ONLY a JSON object (no markdown, no explanation):\n' +
      '{\n' +
      '  "type": "bug" | "feature_request" | "compliment" | "noise",\n' +
      '  "severity": "blocker" | "major" | "minor",\n' +
      '  "summary": "one-line summary for a GitHub issue title (max 60 chars)"\n' +
      '}\n\n' +
      'Rules:\n' +
      '- "bug": something is broken, not working, errors, crashes, unresponsive\n' +
      '- "feature_request": user wants something new or different\n' +
      '- "compliment": positive feedback, praise, enjoyment\n' +
      '- "noise": unclear, off-topic, or too vague to act on\n' +
      '- severity "blocker": blocks core usage, "major": significant issue, "minor": cosmetic or edge case';

    var result = callGemini_(prompt, { temperature: 0.1, maxOutputTokens: 256 });
    if (result && result.candidates && result.candidates[0] && result.candidates[0].content) {
      var responseText = result.candidates[0].content.parts[0].text;
      // Strip markdown code fences if present
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      var parsed = JSON.parse(responseText);
      // Validate expected fields
      var validTypes = ['bug', 'feature_request', 'compliment', 'noise'];
      if (validTypes.indexOf(parsed.type) === -1) parsed.type = 'noise';
      if (!parsed.severity) parsed.severity = 'minor';
      if (!parsed.summary) parsed.summary = text.substring(0, 60);
      return parsed;
    }
  } catch(e) {
    if (typeof logError_ === 'function') logError_('classifyFeedback_', e);
  }

  return fallback;
}


// ════════════════════════════════════════════════════════════════════
// LAYER 3: AUTO-ISSUE CREATION via GitHub API
// Creates GitHub issues from feedback classified as bug/feature_request.
// Requires Script Property: GITHUB_PAT (fine-grained PAT with issues:write)
// ════════════════════════════════════════════════════════════════════

var GITHUB_REPO = 'blucsigma05/tbm-apps-script';

/**
 * Surface name → area label mapping.
 */
function getSurfaceAreaLabel_(surface) {
  var map = {
    'comic-studio': 'area:education',
    'homework-module': 'area:education',
    'sparkle-learning': 'area:education',
    'fact-sprint': 'area:education',
    'reading-module': 'area:education',
    'writing-module': 'area:education',
    'investigation-module': 'area:education',
    'design-dashboard': 'area:education',
    'daily-missions': 'area:education',
    'the-pulse': 'area:finance',
    'kidshub': 'area:shared',
    'kidshub-parent': 'area:shared'
  };
  return map[surface] || 'area:shared';
}

/**
 * Create a GitHub issue from classified feedback.
 * Returns { url: string } on success, null on failure.
 */
function createGitHubIssue_(surface, rating, text, user, timestamp, classification) {
  var pat = PropertiesService.getScriptProperties().getProperty('GITHUB_PAT');
  if (!pat) {
    Logger.log('createGitHubIssue_: GITHUB_PAT not configured — skipping issue creation.');
    return null;
  }

  var kindLabel = classification.type === 'bug' ? 'kind:bug' : 'kind:task';
  var sevLabel = 'severity:' + (classification.severity || 'minor');
  var areaLabel = getSurfaceAreaLabel_(surface);

  var title = '[Feedback] ' + surface + ': ' + (classification.summary || text.substring(0, 60));
  if (title.length > 70) title = title.substring(0, 67) + '...';

  var body = '## User Feedback (auto-created by FeedbackPipeline)\n\n' +
    '| Field | Value |\n' +
    '|-------|-------|\n' +
    '| **Surface** | `' + surface + '` |\n' +
    '| **User** | ' + user + ' |\n' +
    '| **Rating** | ' + rating + '/5 |\n' +
    '| **Timestamp** | ' + timestamp + ' |\n' +
    '| **Classification** | ' + classification.type + ' (' + classification.severity + ') |\n\n' +
    '## Feedback Text\n\n> ' + text + '\n\n' +
    '## Build Skills\n\n' +
    '- `thompson-engineer` \u2014 GAS architecture\n' +
    '- `qa-walkthrough` \u2014 reproduce on target device\n' +
    '- `incident-response` \u2014 if bug, diagnose root cause\n\n' +
    '---\n' +
    '*Auto-created by FeedbackPipeline.gs v1 (issue #231)*';

  var url = 'https://api.github.com/repos/' + GITHUB_REPO + '/issues';
  var payload = {
    title: title,
    body: body,
    labels: [kindLabel, sevLabel, areaLabel, 'needs:lt-decision']
  };

  try {
    var resp = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'token ' + pat, 'Accept': 'application/vnd.github.v3+json' },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = resp.getResponseCode();
    if (code === 201) {
      var created = JSON.parse(resp.getContentText());
      Logger.log('createGitHubIssue_: Created #' + created.number + ': ' + created.html_url);
      return { url: created.html_url, number: created.number };
    }

    Logger.log('createGitHubIssue_: GitHub API returned ' + code + ': ' + resp.getContentText().substring(0, 300));
    if (typeof logError_ === 'function') logError_('createGitHubIssue_', new Error('HTTP ' + code));
    return null;
  } catch(e) {
    if (typeof logError_ === 'function') logError_('createGitHubIssue_', e);
    return null;
  }
}


// ════════════════════════════════════════════════════════════════════
// LAYER 4: WEEKLY DIGEST — summarize feedback for the week
// Run via weekly trigger (LT installs: Sunday 9:00 AM CST).
// ════════════════════════════════════════════════════════════════════

/**
 * Weekly digest: counts feedback by classification, sends Pushover summary.
 */
function feedbackWeeklyDigest() {
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['Feedback']) || '💻 Feedback';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet || sheet.getLastRow() < 2) {
    Logger.log('feedbackWeeklyDigest: No feedback data.');
    return;
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colMap = {};
  for (var h = 0; h < headers.length; h++) { colMap[headers[h]] = h; }

  if (colMap['Timestamp'] === undefined || colMap['Classification'] === undefined) {
    Logger.log('feedbackWeeklyDigest: Missing required columns.');
    return;
  }

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  var weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  var counts = { bug: 0, feature_request: 0, compliment: 0, noise: 0, 'low-rating': 0, total: 0 };
  var surfaces = {};

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var ts = new Date(row[colMap['Timestamp']]);
    if (isNaN(ts.getTime()) || ts < weekAgo) continue;

    counts.total++;
    var cls = String(row[colMap['Classification']] || 'unclassified');
    if (counts[cls] !== undefined) {
      counts[cls]++;
    }

    var surface = String(row[colMap['Surface']] || 'unknown');
    surfaces[surface] = (surfaces[surface] || 0) + 1;
  }

  if (counts.total === 0) {
    Logger.log('feedbackWeeklyDigest: No feedback this week.');
    return;
  }

  // Build surface breakdown
  var surfaceList = Object.keys(surfaces);
  surfaceList.sort(function(a, b) { return surfaces[b] - surfaces[a]; });
  var surfaceLines = [];
  for (var s = 0; s < surfaceList.length && s < 5; s++) {
    surfaceLines.push(surfaceList[s] + ': ' + surfaces[surfaceList[s]]);
  }

  var body = counts.total + ' feedback entries this week:\n' +
    '\ud83d\udc1b Bugs: ' + counts.bug + '\n' +
    '\u2728 Features: ' + counts.feature_request + '\n' +
    '\ud83d\udc4d Compliments: ' + counts.compliment + '\n' +
    '\ud83d\udce2 Low ratings: ' + counts['low-rating'] + '\n\n' +
    'Top surfaces: ' + surfaceLines.join(', ');

  if (typeof sendPush_ === 'function') {
    try {
      sendPush_(
        '\ud83d\udcca Feedback Digest (' + counts.total + ' this week)',
        body,
        'LT',
        typeof PUSHOVER_PRIORITY !== 'undefined' ? PUSHOVER_PRIORITY.HYGIENE_REPORT_LOW : -1
      );
    } catch(e) { /* non-critical */ }
  }

  Logger.log('feedbackWeeklyDigest:\n' + body);
}


// ════════════════════════════════════════════════════════════════════
// MANUAL ENTRY POINTS
// ════════════════════════════════════════════════════════════════════

/**
 * Manual run: triage + digest in one go. For testing from GAS editor.
 */
function runFeedbackPipeline() {
  Logger.log('=== Feedback Pipeline Manual Run ===');
  triageFeedback();
  feedbackWeeklyDigest();
  Logger.log('=== Pipeline Complete ===');
}

// ── DIAG + TRIGGER MANAGEMENT (v2, #379) ─────────────────────────

function diagFeedbackPipelineSafe() {
  try {
    var ss = SpreadsheetApp.openById(SSID);
    var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['Feedback']) || '💻 Feedback';
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) return { ok: false, error: 'Feedback sheet missing' };

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var colMap = {};
    for (var h = 0; h < headers.length; h++) { colMap[headers[h]] = h; }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { ok: true, pipelineVersion: getFeedbackPipelineVersion(), totalRows: 0 };

    var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    var totalRows = data.length;
    var unprocessed = 0;
    var processedToday = 0;
    var classifications = {};
    var oldestUnprocessed = null;
    var todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var processed = String(row[colMap['Processed']] || '');
      var timestamp = new Date(row[colMap['Timestamp']] || 0);
      var classification = String(row[colMap['Classification']] || '');

      if (!processed) {
        unprocessed++;
        if (!oldestUnprocessed || timestamp < new Date(oldestUnprocessed)) {
          oldestUnprocessed = timestamp.toISOString();
        }
      } else if (timestamp >= todayStart) {
        processedToday++;
      }
      if (classification) {
        classifications[classification] = (classifications[classification] || 0) + 1;
      }
    }

    var triggers = ScriptApp.getProjectTriggers();
    var triageTriggers = [];
    for (var t = 0; t < triggers.length; t++) {
      if (triggers[t].getHandlerFunction() === 'triageFeedback') {
        triageTriggers.push({
          type: String(triggers[t].getEventType()),
          source: String(triggers[t].getTriggerSource())
        });
      }
    }

    return {
      ok: true,
      pipelineVersion: getFeedbackPipelineVersion(),
      sheetName: tabName,
      totalRows: totalRows,
      unprocessed: unprocessed,
      processedToday: processedToday,
      oldestUnprocessed: oldestUnprocessed,
      classifications: classifications,
      triggersInstalled: triageTriggers.length,
      triggerDetails: triageTriggers,
      triggersHealthy: triageTriggers.length >= 1,
      checkedAt: new Date().toISOString()
    };
  } catch (e) {
    if (typeof logError_ === 'function') logError_('diagFeedbackPipelineSafe', e);
    return { ok: false, error: e.message || String(e) };
  }
}

function installTriageFeedbackTriggerSafe() {
  return withMonitor_('installTriageFeedbackTriggerSafe', function() {
    var triggers = ScriptApp.getProjectTriggers();
    for (var t = 0; t < triggers.length; t++) {
      if (triggers[t].getHandlerFunction() === 'triageFeedback') {
        return { ok: true, installed: false, msg: 'Trigger already installed' };
      }
    }
    ScriptApp.newTrigger('triageFeedback').timeBased().atHour(7).nearMinute(0).everyDays(1).create();
    return { ok: true, installed: true, msg: 'triageFeedback daily trigger installed at 7 AM' };
  });
}

function uninstallTriageFeedbackTriggerSafe() {
  return withMonitor_('uninstallTriageFeedbackTriggerSafe', function() {
    var triggers = ScriptApp.getProjectTriggers();
    var removed = 0;
    for (var t = 0; t < triggers.length; t++) {
      if (triggers[t].getHandlerFunction() === 'triageFeedback') {
        ScriptApp.deleteTrigger(triggers[t]);
        removed++;
      }
    }
    return { ok: true, removed: removed };
  });
}

// Version history tracked in Notion deploy page. Do not add version comments here.
// FeedbackPipeline.gs v2 — EOF
