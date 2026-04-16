// ════════════════════════════════════════════════════════════════════
// Preflight.gs v2 — Module Go-Live Readiness Checker
// Spec: specs/module-golive-preflight.md
// READS: Curriculum sheet (via getTodayContent_), HTML sources
// WRITES: Preflight_Status sheet (24h escalation tracking only)
// ════════════════════════════════════════════════════════════════════

function getPreflightVersion() { return 2; }

// ── Module registry ──────────────────────────────────────────────────
// Maps moduleId → HTML filename + expected kid wiring.
// expectedKid: null = supports any kid.
var PREFLIGHT_MODULE_MAP = {
  'homework-module':   { htmlFile: 'HomeworkModule',       expectedKid: 'buggsy' },
  'reading-module':    { htmlFile: 'reading-module',       expectedKid: 'buggsy' },
  'writing-module':    { htmlFile: 'writing-module',       expectedKid: 'buggsy' },
  'fact-sprint':       { htmlFile: 'fact-sprint',          expectedKid: 'buggsy' },
  'sparkle':           { htmlFile: 'SparkleLearning',      expectedKid: 'jj'     },
  'daily-missions':    { htmlFile: 'daily-missions',       expectedKid: null     },
  'investigation':     { htmlFile: 'investigation-module', expectedKid: 'buggsy' },
  'baseline':          { htmlFile: 'BaselineDiagnostic',   expectedKid: null     }
};

// ── Public entry point ────────────────────────────────────────────────
// Returns structured pass/fail for all 7 readiness checks.
// date: 'YYYY-MM-DD' string used as _testDateOverride for getTodayContent_.
function modulePreflight(moduleId, kid, date) {
  var startMs = Date.now();
  var checks = [];
  var contentResp = null;
  var htmlSource = null;
  var prefetchErr = null;

  // ── Pre-fetch ────────────────────────────────────────────────────
  try {
    if (typeof getTodayContent_ === 'function') {
      contentResp = getTodayContent_(kid, date);
    } else {
      prefetchErr = 'getTodayContent_ not available in scope';
    }
  } catch (e) {
    prefetchErr = 'getTodayContent_ threw: ' + (e && e.message ? e.message : String(e));
  }

  if (!prefetchErr) {
    try {
      var entry = PREFLIGHT_MODULE_MAP[moduleId];
      if (entry) {
        htmlSource = HtmlService.createHtmlOutputFromFile(entry.htmlFile).getContent();
      }
    } catch (e) {
      // non-fatal — individual checks note missing source
      htmlSource = null;
    }
  }

  // Pre-fetch failure is itself a finding — return immediately
  if (prefetchErr) {
    var f = { id: 'prefetch', pass: false, evidence: prefetchErr, fix_pointer: 'Kidshub.js:2663 getTodayContent_' };
    return { module: moduleId, kid: kid, date: date, ready: false,
             checks: [f], failures: [f], duration_ms: Date.now() - startMs };
  }

  // ── Run 7 checks ─────────────────────────────────────────────────
  var c1 = pf_seedExists_(contentResp, kid, date);
  var c2 = pf_wiredToSource_(moduleId, kid, htmlSource);
  var c3 = pf_kidRoutingResolves_(moduleId, kid);
  var c4 = pf_dayStateResolves_(moduleId, kid, date, contentResp);
  var c5 = pf_assetsPresent_(contentResp);
  var c6 = pf_surfaceRendersClean_(moduleId, contentResp);
  var c7 = pf_payloadMatchesRender_(moduleId, contentResp, htmlSource);

  checks = [
    { id: 'seed_exists',          pass: c1.pass, evidence: c1.evidence, fix_pointer: c1.fix_pointer },
    { id: 'wired_to_source',      pass: c2.pass, evidence: c2.evidence, fix_pointer: c2.fix_pointer },
    { id: 'kid_routing_resolves', pass: c3.pass, evidence: c3.evidence, fix_pointer: c3.fix_pointer },
    { id: 'day_state_resolves',   pass: c4.pass, evidence: c4.evidence, fix_pointer: c4.fix_pointer },
    { id: 'assets_present',       pass: c5.pass, evidence: c5.evidence, fix_pointer: c5.fix_pointer },
    { id: 'surface_renders_clean',pass: c6.pass, evidence: c6.evidence, fix_pointer: c6.fix_pointer },
    { id: 'payload_matches_render',pass: c7.pass, evidence: c7.evidence, fix_pointer: c7.fix_pointer }
  ];

  var failures = [];
  for (var i = 0; i < checks.length; i++) {
    if (!checks[i].pass) { failures.push(checks[i]); }
  }
  var ready = failures.length === 0;

  var result = { module: moduleId, kid: kid, date: date, ready: ready,
                 checks: checks, failures: failures, duration_ms: Date.now() - startMs };

  if (!ready) {
    pf_trackFailures_(moduleId, kid, failures);
    if (typeof sendPush_ === 'function') {
      var failIds = failures.map(function(f) { return f.id; }).join(', ');
      sendPush_('Preflight BLOCKED: ' + moduleId,
                kid + ' | ' + date + ' | failed: ' + failIds,
                'LT', PUSHOVER_PRIORITY.SYSTEM_ERROR);
    }
  }

  Logger.log('modulePreflight ' + (ready ? 'PASS' : 'FAIL') + ' — ' + moduleId + ' ' + kid + ' ' + date +
             (failures.length ? ' | failed: ' + failures.map(function(f) { return f.id; }).join(', ') : ''));
  return result;
}

// ── Check #1: seed_exists ─────────────────────────────────────────────
function pf_seedExists_(contentResp, kid, date) {
  if (contentResp !== null) {
    return { pass: true,
      evidence: 'Curriculum row found for kid=' + kid + ' date=' + date +
                ' (day=' + (contentResp.day || '?') + ' week=' + (contentResp.week || '?') + ')',
      fix_pointer: null };
  }
  return { pass: false,
    evidence: 'No curriculum row in Curriculum sheet covers kid=' + kid + ' date=' + date +
              '. Week may not be seeded or date falls outside any seeded range.',
    fix_pointer: 'CurriculumSeed.js: run seedWeek1CurriculumSafe or seedStaarRlaSprintSafe to seed a row covering ' + date };
}

// ── Check #2: wired_to_source ─────────────────────────────────────────
function pf_wiredToSource_(moduleId, kid, htmlSource) {
  var entry = PREFLIGHT_MODULE_MAP[moduleId];
  if (!entry) {
    return { pass: false,
      evidence: 'Module "' + moduleId + '" not in PREFLIGHT_MODULE_MAP — wiring unverifiable',
      fix_pointer: 'Preflight.js: add entry to PREFLIGHT_MODULE_MAP' };
  }
  if (!htmlSource) {
    return { pass: false,
      evidence: 'HTML source for ' + entry.htmlFile + '.html could not be loaded',
      fix_pointer: 'GAS project: verify ' + entry.htmlFile + '.html is present and pushed' };
  }
  var kidLower = String(kid).toLowerCase();
  var correctCall = ".getTodayContentSafe('" + kidLower + "')";
  if (htmlSource.indexOf(correctCall) !== -1) {
    return { pass: true,
      evidence: 'Found ' + correctCall + ' in ' + entry.htmlFile + '.html',
      fix_pointer: null };
  }
  var otherKid = kidLower === 'buggsy' ? 'jj' : 'buggsy';
  var wrongCall = ".getTodayContentSafe('" + otherKid + "')";
  if (htmlSource.indexOf(wrongCall) !== -1) {
    return { pass: false,
      evidence: 'Module is hardwired to ' + otherKid + ' but kid=' + kid + ' was requested',
      fix_pointer: entry.htmlFile + '.html: update getTodayContentSafe call to use \'' + kidLower + '\'' };
  }
  if (htmlSource.indexOf('getTodayContentSafe') === -1) {
    return { pass: false,
      evidence: 'No getTodayContentSafe call found in ' + entry.htmlFile + '.html — deprecated fetcher path?',
      fix_pointer: entry.htmlFile + '.html: wire loadCurriculumContent() to google.script.run.getTodayContentSafe' };
  }
  return { pass: false,
    evidence: 'getTodayContentSafe found but not matching kid=' + kid + ' in ' + entry.htmlFile + '.html',
    fix_pointer: entry.htmlFile + '.html: verify getTodayContentSafe argument' };
}

// ── Check #3: kid_routing_resolves ────────────────────────────────────
function pf_kidRoutingResolves_(moduleId, kid) {
  var entry = PREFLIGHT_MODULE_MAP[moduleId];
  if (!entry) {
    return { pass: false,
      evidence: 'Module "' + moduleId + '" not in PREFLIGHT_MODULE_MAP',
      fix_pointer: 'Preflight.js: add entry to PREFLIGHT_MODULE_MAP' };
  }
  if (entry.expectedKid === null) {
    return { pass: true,
      evidence: 'Module ' + moduleId + ' (' + entry.htmlFile + '.html) supports any kid; kid=' + kid + ' resolves',
      fix_pointer: null };
  }
  var kidLower = String(kid).toLowerCase();
  if (kidLower === entry.expectedKid) {
    return { pass: true,
      evidence: 'Module ' + moduleId + ' routes kid=' + kid + ' to ' + entry.htmlFile + '.html',
      fix_pointer: null };
  }
  return { pass: false,
    evidence: 'Module ' + moduleId + ' is configured for kid=' + entry.expectedKid + ' but requested kid=' + kid,
    fix_pointer: 'PREFLIGHT_MODULE_MAP: add support for kid=' + kid + ' or use correct module for this kid' };
}

// ── Check #4: day_state_resolves ──────────────────────────────────────
// Validates module-specific content shape — mirrors each module's client success handler logic.
function pf_dayStateResolves_(moduleId, kid, date, resp) {
  if (!resp) {
    return { pass: false,
      evidence: 'getTodayContent_ returned null for kid=' + kid + ' date=' + date,
      fix_pointer: 'CurriculumSeed.js: seed a week row covering ' + date + ' for kid=' + kid };
  }
  var c = resp.content;
  if (!c) {
    return { pass: false,
      evidence: 'Response has no .content for kid=' + kid + ' day=' + resp.day + ' week=' + resp.week,
      fix_pointer: 'CurriculumSeed.js: verify ContentJSON is valid for ' + resp.day + ' week ' + resp.week };
  }
  if (moduleId === 'homework-module') {
    var hasModule = c.module && (
      (c.module.math && c.module.math.questions && c.module.math.questions.length > 0) ||
      (c.module.science && c.module.science.questions && c.module.science.questions.length > 0) ||
      (c.module.questions && c.module.questions.length > 0)
    );
    var hasReview = c.review_quiz && c.review_quiz.length > 0;
    if (!hasModule && !hasReview) {
      var keys = typeof Object.keys === 'function' ? Object.keys(c).join(', ') : '(unavailable)';
      return { pass: false,
        evidence: 'HomeworkModule: no module.questions or review_quiz for day=' + resp.day + '. Content keys: ' + keys,
        fix_pointer: 'CurriculumSeed.js: verify module.math.questions or module.science.questions for day=' + resp.day };
    }
    return { pass: true,
      evidence: 'HomeworkModule: ' + (hasModule ? 'module.questions present' : 'review_quiz present') +
                ' day=' + resp.day + ' week=' + resp.week, fix_pointer: null };
  }
  if (moduleId === 'reading-module') {
    var hasPassage = c.cold_passage && c.cold_passage.title;
    var hasQ = c.cold_passage && c.cold_passage.questions && c.cold_passage.questions.length > 0;
    if (!hasPassage || !hasQ) {
      return { pass: false,
        evidence: 'ReadingModule: cold_passage=' + (hasPassage ? 'OK' : 'MISSING') +
                  ' questions=' + (hasQ ? 'OK' : 'MISSING') + ' day=' + resp.day,
        fix_pointer: 'reading-module.html:1906 — seed content.cold_passage with title+questions for day=' + resp.day };
    }
    return { pass: true,
      evidence: 'ReadingModule: cold_passage + ' + c.cold_passage.questions.length + ' questions day=' + resp.day,
      fix_pointer: null };
  }
  if (moduleId === 'writing-module') {
    var hasWriting = c.quick_write || c.grammar_sprint;
    if (!hasWriting) {
      return { pass: false,
        evidence: 'WritingModule: no content.quick_write or content.grammar_sprint for day=' + resp.day,
        fix_pointer: 'writing-module.html:1648 — seed content.quick_write or content.grammar_sprint for day=' + resp.day };
    }
    return { pass: true,
      evidence: 'WritingModule: writing content present day=' + resp.day, fix_pointer: null };
  }
  if (moduleId === 'fact-sprint') {
    var hasFacts = c.fact_sprint && c.fact_sprint.questions && c.fact_sprint.questions.length > 0;
    if (!hasFacts) {
      return { pass: false,
        evidence: 'FactSprint: no content.fact_sprint.questions for day=' + resp.day,
        fix_pointer: 'fact-sprint.html:1677 — seed content.fact_sprint.questions for day=' + resp.day };
    }
    return { pass: true,
      evidence: 'FactSprint: ' + c.fact_sprint.questions.length + ' questions day=' + resp.day,
      fix_pointer: null };
  }
  // Generic: non-null content passes for unregistered module types
  return { pass: true,
    evidence: 'Content present for ' + moduleId + ' kid=' + kid + ' day=' + resp.day,
    fix_pointer: null };
}

// ── Check #5: assets_present ──────────────────────────────────────────
function pf_assetsPresent_(resp) {
  if (!resp || !resp.content) {
    return { pass: true, evidence: 'No payload — asset check vacuously passes', fix_pointer: null };
  }
  var str = JSON.stringify(resp.content);
  var re = /https?:\/\/[^\s"',\]>]+/g;
  var match;
  var assetUrls = [];
  var seen = {};
  while ((match = re.exec(str)) !== null) {
    var u = match[0];
    if (!seen[u] && /\.(mp3|wav|ogg|m4a|mp4|jpg|jpeg|png|gif|webp)(\?|$)/i.test(u)) {
      assetUrls.push(u);
      seen[u] = true;
    }
  }
  if (assetUrls.length === 0) {
    return { pass: true, evidence: 'No asset URLs in payload (vacuously passes)', fix_pointer: null };
  }
  var failed = [];
  for (var i = 0; i < assetUrls.length; i++) {
    try {
      var r = UrlFetchApp.fetch(assetUrls[i], { method: 'head', muteHttpExceptions: true, followRedirects: true });
      if (r.getResponseCode() !== 200) {
        failed.push({ url: assetUrls[i], status: r.getResponseCode() });
      }
    } catch (e) {
      failed.push({ url: assetUrls[i], error: e.message });
    }
  }
  if (failed.length > 0) {
    return { pass: false,
      evidence: 'Asset check failed: ' + JSON.stringify(failed),
      fix_pointer: 'Audio pipeline: regenerate missing assets or fix URLs in curriculum ContentJSON' };
  }
  return { pass: true,
    evidence: 'All ' + assetUrls.length + ' asset URLs return 200', fix_pointer: null };
}

// ── Check #6: surface_renders_clean ──────────────────────────────────
// Server-side simulation: would the module's success handler trigger _usingFallback = true?
// Mirrors exact guard logic from each module's loadCurriculumContent() success handler.
function pf_surfaceRendersClean_(moduleId, resp) {
  if (!resp || !resp.content) {
    return { pass: false,
      evidence: 'No content payload — surface would show error/fallback state',
      fix_pointer: 'Fix check #1 (seed_exists) first' };
  }
  var c = resp.content;
  if (moduleId === 'homework-module') {
    // v14+: FALLBACK_MODULE deleted. Bad content → redirectToDailyMissions_() or showLoadError_.
    var hasM = c.module && (
      (c.module.math && c.module.math.questions && c.module.math.questions.length > 0) ||
      (c.module.science && c.module.science.questions && c.module.science.questions.length > 0) ||
      (c.module.questions && c.module.questions.length > 0));
    var hasR = c.review_quiz && c.review_quiz.length > 0;
    if (!hasM && !hasR) {
      return { pass: false,
        evidence: 'HomeworkModule: content present but no questions/review_quiz; surface calls redirectToDailyMissions_()',
        fix_pointer: 'HomeworkModule.html:2298 — verify module.questions or review_quiz is seeded' };
    }
    return { pass: true, evidence: 'HomeworkModule: success handler guard passes; renders without fallback', fix_pointer: null };
  }
  if (moduleId === 'reading-module') {
    // _usingFallback = true if !content.cold_passage → FALLBACK_PASSAGE renders ("The Deep Ocean")
    if (!c.cold_passage || !c.cold_passage.title) {
      return { pass: false,
        evidence: 'ReadingModule: no content.cold_passage — surface sets _usingFallback=true and renders FALLBACK_PASSAGE',
        fix_pointer: 'reading-module.html:1906 — seed content.cold_passage' };
    }
    return { pass: true, evidence: 'ReadingModule: cold_passage present; no fallback fires', fix_pointer: null };
  }
  if (moduleId === 'writing-module') {
    // _usingFallback = true if !content.quick_write && !content.grammar_sprint
    if (!c.quick_write && !c.grammar_sprint) {
      return { pass: false,
        evidence: 'WritingModule: no quick_write or grammar_sprint — surface sets _usingFallback=true',
        fix_pointer: 'writing-module.html:1648 — seed content.quick_write or content.grammar_sprint' };
    }
    return { pass: true, evidence: 'WritingModule: writing content present; no fallback fires', fix_pointer: null };
  }
  if (moduleId === 'fact-sprint') {
    // initWithFallback() fires if !content.fact_sprint.questions
    if (!c.fact_sprint || !c.fact_sprint.questions || c.fact_sprint.questions.length === 0) {
      return { pass: false,
        evidence: 'FactSprint: no fact_sprint.questions — surface calls initWithFallback() with hardcoded generators',
        fix_pointer: 'fact-sprint.html:1677 — seed content.fact_sprint.questions' };
    }
    return { pass: true, evidence: 'FactSprint: questions present; no fallback fires', fix_pointer: null };
  }
  return { pass: true,
    evidence: 'Module ' + moduleId + ': content present (module-specific fallback check not yet implemented — verify manually)',
    fix_pointer: null };
}

// ── Check #7: payload_matches_render ─────────────────────────────────
// Full cross-verification requires data-tbm-source-row attribute on the module root element,
// populated from the server response by each module's success handler.
// This check verifies: (a) server payload has identity fields, (b) HTML instrumentation is present.
function pf_payloadMatchesRender_(moduleId, resp, htmlSource) {
  if (!resp) {
    return { pass: false,
      evidence: 'No server payload to compare against rendered surface',
      fix_pointer: 'Fix checks #1/#4 first' };
  }
  var hasIdentity = resp.week && resp.day && resp.child;
  if (!hasIdentity) {
    return { pass: false,
      evidence: 'Payload missing identity fields: week=' + resp.week + ' day=' + resp.day + ' child=' + resp.child,
      fix_pointer: 'CurriculumSeed.js: verify WeekNumber column is populated' };
  }
  var rowKey = resp.week + '-' + resp.day + '-' + String(resp.child).toLowerCase();
  if (htmlSource && htmlSource.indexOf('data-tbm-source-row') !== -1) {
    return { pass: true,
      evidence: 'Server identity: ' + rowKey + '; data-tbm-source-row instrumentation present in HTML',
      fix_pointer: null };
  }
  // Instrumentation missing — spec requires it ships in this PR
  return { pass: false,
    evidence: 'data-tbm-source-row attribute not found in ' + moduleId + ' HTML source. ' +
              'Server payload identity confirmed (' + rowKey + ') but DOM cross-check is impossible without instrumentation.',
    fix_pointer: 'Add <span id="tbm-source-row" data-tbm-source-row=""> to module root and populate in success handler (see spec check #7)' };
}

// ── 24h escalation tracker ────────────────────────────────────────────
// Logs failures to Preflight_Status sheet. Fires Pushover if same check fails >24h.
function pf_trackFailures_(moduleId, kid, failures) {
  try {
    var ss = SpreadsheetApp.openById(SSID);
    var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['Preflight_Status']) || '💻 Preflight_Status';
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      sheet.appendRow(['ModuleId', 'Kid', 'CheckId', 'FirstFailedAt', 'LastCheckedAt', 'AlertFired']);
      sheet.setFrozenRows(1);
    }
    var now = new Date().toISOString();
    var data = sheet.getLastRow() > 1 ? sheet.getDataRange().getValues() : [sheet.getRange(1, 1, 1, 6).getValues()[0]];
    var headers = data[0];
    var mCol = headers.indexOf('ModuleId');
    var kCol = headers.indexOf('Kid');
    var cCol = headers.indexOf('CheckId');
    var fCol = headers.indexOf('FirstFailedAt');
    var lCol = headers.indexOf('LastCheckedAt');
    var aCol = headers.indexOf('AlertFired');

    for (var i = 0; i < failures.length; i++) {
      var checkId = failures[i].id;
      var existingRow = -1;
      for (var r = 1; r < data.length; r++) {
        if (data[r][mCol] === moduleId && data[r][kCol] === kid && data[r][cCol] === checkId) {
          existingRow = r + 1;
          break;
        }
      }
      if (existingRow === -1) {
        sheet.appendRow([moduleId, kid, checkId, now, now, 'no']);
      } else {
        sheet.getRange(existingRow, lCol + 1).setValue(now);
        var firstFailed = data[existingRow - 1][fCol];
        var alreadyAlerted = data[existingRow - 1][aCol];
        if (alreadyAlerted !== 'yes' && firstFailed) {
          var diffMs = new Date().getTime() - new Date(firstFailed).getTime();
          if (diffMs > 86400000) { // 24h
            if (typeof sendPush_ === 'function') {
              sendPush_(
                'Preflight 24h Failure: ' + moduleId,
                'Module=' + moduleId + ' kid=' + kid + ' check=' + checkId + ' failing >24h.',
                'LT',
                PUSHOVER_PRIORITY.SYSTEM_ERROR
              );
            }
            sheet.getRange(existingRow, aCol + 1).setValue('yes');
          }
        }
      }
    }
  } catch (e) {
    if (typeof logError_ === 'function') { logError_('pf_trackFailures_', e); }
  }
}

// END OF FILE — Preflight.gs v2
