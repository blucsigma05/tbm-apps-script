// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// Code.gs v88 — Apps Script Router (TBM Consolidated)
// WRITES TO: (routes only — delegates to DataEngine, KidsHub, etc.)
// READS FROM: (routes only — delegates to DataEngine, KidsHub, etc.)
// ════════════════════════════════════════════════════════════════════

// TAB_MAP — REMOVED (P2/#58 Wave 1). DataEngine.gs owns the canonical TAB_MAP.
// All .gs files share GAS global scope, so DE's TAB_MAP is available here.
// DO NOT redeclare var TAB_MAP in this file.

// v75: Feature flag — JJ lesson run completion contract (specs/jj-completion-contract.md)
// Read from Script Property 'LESSON_RUNS_ENABLED' (set to '1' to enable).
// Default: off. Dark rollout until Phase 2 client integration.
function isLessonRunsEnabled_() {
  try {
    var v = PropertiesService.getScriptProperties().getProperty('LESSON_RUNS_ENABLED');
    return v === '1' || v === 'true';
  } catch (e) { return false; }
}

function getCodeVersion() { return 88; }

// v37 FIX 5: ES5-safe left-pad helper — replaces String.padStart()
function leftPad2_(n) {
  var s = String(n);
  return s.length < 2 ? '0' + s : s;
}

// v87: GAS HtmlService include helper — used by SparkleLearning template
function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ════════════════════════════════════════════════════════════════════
// v41: CACHESERVICE — 15-min TTL payload cache
// v46: Chunked cache — splits >90KB payloads across multiple keys
//      to bypass CacheService's 100KB per-key limit
// ════════════════════════════════════════════════════════════════════
var DE_CACHE_KEY = 'DE_PAYLOAD';
var DE_CACHE_TTL = 900; // 15 minutes
var DE_CACHE_CHUNK_SIZE = 90000; // 90KB per chunk (safe margin under 100KB limit)

// v47: KidsHub data cache — 60s TTL with heartbeat invalidation
var KH_CACHE_KEY = 'KH_PAYLOAD';
var KH_CACHE_TTL = 60; // 60 seconds
var KH_CACHE_HB_KEY = 'KH_LAST_HB'; // stores last-seen heartbeat value

/**
 * v47: Get cached KH data if heartbeat hasn't changed.
 * Returns raw JSON string or null (cache miss / stale).
 */
function getCachedKHPayload_(key) {
  try {
    var cacheKey = getEnvCacheKey_(key || KH_CACHE_KEY);
    var scopedHBKey = getEnvCacheKey_(KH_CACHE_HB_KEY);
    var cache = CacheService.getScriptCache();
    var keys = cache.getAll([cacheKey, scopedHBKey]);
    var raw = keys[cacheKey];
    var cachedHB = keys[scopedHBKey];
    if (!raw || !cachedHB) return null;

    // Check heartbeat — single cell read (fast)
    var currentHB = getKHLastModified();
    if (!currentHB || currentHB !== cachedHB) return null;

    return raw; // return JSON string, not parsed
  } catch(e) {
    if (typeof logError_ === 'function') logError_('getCachedKHPayload_', e);
    return null;
  }
}

/**
 * v47: Store KH data + current heartbeat in cache.
 */
function setCachedKHPayload_(jsonStr, key) {
  try {
    var cacheKey = getEnvCacheKey_(key || KH_CACHE_KEY);
    var scopedHBKey = getEnvCacheKey_(KH_CACHE_HB_KEY);
    var cache = CacheService.getScriptCache();
    var currentHB = getKHLastModified();
    if (!currentHB) return; // no heartbeat → don't cache stale
    var payload = {};
    payload[cacheKey] = jsonStr;
    payload[scopedHBKey] = currentHB;
    cache.putAll(payload, KH_CACHE_TTL);
    var size = jsonStr.length;
    if (size > 50000) {
      Logger.log('📦 KH cache payload (' + cacheKey + '): ' + Math.round(size / 1024) + 'KB');
    }
  } catch(e) {
    Logger.log('setCachedKHPayload_ error (non-fatal): ' + e.message);
  }
}

function getCachedPayload_(cacheKey) {
  try {
    cacheKey = getEnvCacheKey_(cacheKey);
    var cache = CacheService.getScriptCache();
    var raw = cache.get(cacheKey);
    if (!raw) return null;

    // Check if this is a chunked payload
    if (raw.indexOf('"__chunked__":true') >= 0) {
      var meta = JSON.parse(raw);
      var chunks = [];
      var keys = [];
      for (var i = 0; i < meta.count; i++) {
        keys.push(cacheKey + '_chunk_' + i);
      }
      var chunkMap = cache.getAll(keys);
      for (var j = 0; j < keys.length; j++) {
        var chunk = chunkMap[keys[j]];
        if (!chunk) {
          // Missing chunk — cache is incomplete, treat as miss
          Logger.log('⚠ Cache chunk missing: ' + keys[j]);
          return null;
        }
        chunks.push(chunk);
      }
      return JSON.parse(chunks.join(''));
    }

    // Non-chunked — parse directly
    return JSON.parse(raw);
  } catch(e) {
    if (typeof logError_ === 'function') logError_('getCachedPayload_', e);
    return null;
  }
}

function setCachedPayload_(cacheKey, payload, ttl) {
  try {
    cacheKey = getEnvCacheKey_(cacheKey);
    var json = JSON.stringify(payload);
    var size = json.length;
    var effectiveTTL = ttl || DE_CACHE_TTL;
    var cache = CacheService.getScriptCache();

    // Log size for monitoring
    if (size > 80000) {
      Logger.log('📦 Cache payload size: ' + Math.round(size / 1024) + 'KB for key ' + cacheKey + (size > DE_CACHE_CHUNK_SIZE ? ' → CHUNKING' : ''));
    }

    if (size <= DE_CACHE_CHUNK_SIZE) {
      // Fits in a single key
      cache.put(cacheKey, json, effectiveTTL);
    } else {
      // Split into chunks
      var chunks = [];
      for (var i = 0; i < json.length; i += DE_CACHE_CHUNK_SIZE) {
        chunks.push(json.substring(i, i + DE_CACHE_CHUNK_SIZE));
      }

      // Write chunk metadata to the primary key
      var meta = { __chunked__: true, count: chunks.length, size: size };
      cache.put(cacheKey, JSON.stringify(meta), effectiveTTL);

      // Write chunks using putAll for efficiency
      var chunkMap = {};
      for (var c = 0; c < chunks.length; c++) {
        chunkMap[cacheKey + '_chunk_' + c] = chunks[c];
      }
      cache.putAll(chunkMap, effectiveTTL);

      Logger.log('📦 Cache chunked: ' + chunks.length + ' chunks (' + Math.round(size / 1024) + 'KB total)');
    }
  } catch(e) {
    Logger.log('setCachedPayload_ error (non-fatal): ' + e.message);
  }
}

// ════════════════════════════════════════════════════════════════════
// v82: QA ROUTE ISOLATION — HMAC token validation + env-scoped cache keys
// (specs/qa-route-isolation.md, issue #219)
// ════════════════════════════════════════════════════════════════════

/** Compute HMAC-SHA256 of message with secret. Returns lowercase hex string. */
function computeHmac_(message, secret) {
  try {
    var bytes = Utilities.computeHmacSha256Signature(message, secret);
    return bytes.map(function(b) {
      var hex = (b & 0xff).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  } catch(e) { return ''; }
}

/**
 * Validate a per-request QA HMAC token from the CF Worker.
 * Token format: "<timestamp>:<hmac-hex>" — 5-minute window.
 * Returns true if valid, false otherwise.
 */
function validateQAToken_(tokenParam) {
  if (!tokenParam) return false;
  var parts = tokenParam.split(':');
  if (parts.length !== 2) return false;
  var ts = parseInt(parts[0], 10);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > 300000) return false;
  var secret = PropertiesService.getScriptProperties().getProperty('QA_HMAC_SECRET');
  if (!secret) return false;
  var expected = computeHmac_(ts + ':qa', secret);
  return expected === parts[1];
}

/**
 * Return env-scoped cache key. Prepends 'qa:' when running in QA context
 * (SSID matches TBM_QA_SSID). Prod requests are unaffected.
 */
function getEnvCacheKey_(baseKey) {
  var qaSSID = PropertiesService.getScriptProperties().getProperty('TBM_QA_SSID');
  if (qaSSID && SSID === qaSSID) return 'qa:' + baseKey;
  return baseKey;
}

/** Bust the DE payload cache. Call from dashboards via google.script.run.
 * v82: env-scoped — busts only the namespace matching the active SSID (prod or qa:*). */
function bustCache() {
  try {
    var cache = CacheService.getScriptCache();

    // Remove primary keys (scoped to active env)
    var deKey = getEnvCacheKey_(DE_CACHE_KEY);
    cache.remove(deKey);
    var n = new Date();
    var ym = n.getFullYear() + '-' + leftPad2_(n.getMonth() + 1);
    var monthKey = getEnvCacheKey_(DE_CACHE_KEY + '_' + ym + '-01');
    cache.remove(monthKey);

    // Clean up chunk keys (up to 10 chunks per payload)
    var chunkKeys = [];
    for (var i = 0; i < 10; i++) {
      chunkKeys.push(deKey + '_chunk_' + i);
      chunkKeys.push(monthKey + '_chunk_' + i);
    }
    // Also bust KH cache (all + per-child keys)
    chunkKeys.push(getEnvCacheKey_(KH_CACHE_KEY));
    chunkKeys.push(getEnvCacheKey_(KH_CACHE_KEY + '_buggsy'));
    chunkKeys.push(getEnvCacheKey_(KH_CACHE_KEY + '_jj'));
    chunkKeys.push(getEnvCacheKey_(KH_CACHE_HB_KEY));
    cache.removeAll(chunkKeys);
  } catch(e) { if (typeof logError_ === 'function') logError_('bustCache', e); }
  return { status: 'ok', busted: new Date().toISOString() };
}

/** Read KH heartbeat timestamp from Helpers!Z1. Lightweight single-cell read. */
function getKHLastModified() {
  try {
    var ss = SpreadsheetApp.openById(SSID);
    var hn = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['Helpers'] || 'Helpers') : 'Helpers';
    var sh = ss.getSheetByName(hn);
    if (sh) {
      var v = sh.getRange('Z1').getValue();
      return v ? String(v) : '';
    }
  } catch(e) { if (typeof logError_ === 'function') logError_('getKHLastModified', e); }
  return '';
}

// ════════════════════════════════════════════════════════════════════
// 1. doGet — UNIFIED ENTRY POINT
// ════════════════════════════════════════════════════════════════════

function doGet(e) {
  var p = (e && e.parameter) || {};
  // v49: Route proxy actions to serveData BEFORE servePage checks
  if (p.action === 'htmlSource' || p.action === 'api') {
    return serveData(e);
  }
  if (p.page || !p.action) {
    return servePage(p.page || 'vein', e);
  }
  return serveData(e);
}


function servePage(page, e) {
  var routes = {
    'vein':     { file: 'TheVein',         title: 'The Vein — Thompson Household Command Center' },
    'pulse':    { file: 'ThePulse',        title: 'The Pulse — Thompson Household' },
    'vault':    { file: 'Vault',          title: 'LT Watch Vault' },
    'kidshub':  { file: 'KidsHub',        title: 'Kids Hub — Ring Quest' },
    'buggsy':   { file: 'KidsHub',        title: '⭕ Buggsy — Ring Quest', child: 'buggsy' },
    'jj':       { file: 'KidsHub',        title: '⭐ JJ\'s Sparkle Stars', child: 'jj' },
    'parent':   { file: 'KidsHub',        title: '⚙ Kids Hub — Parent Dashboard', child: 'buggsy', view: 'parent' },
    'spine':    { file: 'TheSpine',       title: 'The Spine — Thompson Office Display' },
    'soul':     { file: 'TheSoul',        title: 'The Soul — Thompson Family Display' },
    'debt':     { file: 'ThePulse',        title: 'The Pulse — Thompson Household' },
    'jt':       { file: 'ThePulse',        title: 'The Pulse — Thompson Household' },
    'weekly':   { file: 'ThePulse',        title: 'The Pulse — Thompson Household' },
    'homework':  { file: 'HomeworkModule',  title: 'Homework Module — Thompson Education' },
    'sparkle':   { file: 'SparkleLearning', title: 'Sparkle Learning — JJ Letter & Number Games' },
    'wolfkid':   { file: 'WolfkidCER',     title: 'Wolfkid CER — Episode 3' },
    'wolfdome':        { file: 'DesignDashboard', title: 'The Wolfdome — Buggsy Home' },
    'dashboard':       { file: 'DesignDashboard', title: 'The Wolfdome — Buggsy Home' },
    'sparkle-kingdom': { file: 'JJHome',          title: 'The Sparkle Kingdom — JJ Home' },
    'facts':     { file: 'fact-sprint',    title: 'Fact Sprint — Math Drill' },
    'reading':       { file: 'reading-module',  title: 'Reading Module — Thompson Education' },
    'writing':       { file: 'writing-module', title: 'Writing Module — Thompson Education' },
    'story-library': { file: 'StoryLibrary',   title: 'Story Library — Thompson Family Stories' },
    'comic-studio':  { file: 'ComicStudio',    title: 'Wolfkid Comic Studio' },
    'progress':      { file: 'ProgressReport', title: 'Weekly Progress Report' },
    'story':         { file: 'StoryReader',    title: 'Story Reader' },
    'investigation': { file: 'investigation-module', title: 'Field Investigation — Science' },
    'daily-missions':{ file: 'daily-missions', title: 'Daily Missions — Thompson Education' },
    'baseline':      { file: 'BaselineDiagnostic', title: 'Baseline Diagnostic — Thompson Education' },
    'power-scan':    { file: 'wolfkid-power-scan', title: 'Power Scan — Wolfkid Intelligence Division' },
    'qa-operator':   { file: 'QAOperator',         title: 'QA Operator Dashboard' }
  };

  var route = routes[page] || routes['pulse'];

  try {
    if (page === 'vault') {
      var tmpl = HtmlService.createTemplateFromFile('Vault');
      tmpl.sheetData = JSON.stringify(getAllVaultData());
      return tmpl.evaluate()
        .setTitle(route.title)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    if (page === 'kidshub' || page === 'buggsy' || page === 'jj' || page === 'parent') {
      var _childWhitelist = { buggsy: true, jj: true, 'sandbox-buggsy': true, 'sandbox-jj': true };
      var child = (route && route.child) || (e && e.parameter && e.parameter.child) || 'buggsy';
      var view  = (route && route.view) || (e && e.parameter && e.parameter.view)  || 'kid';
      // v74: Sandbox mode — prepend sandbox- to child name for isolated testing
      var isSandbox = (e && e.parameter && e.parameter.sandbox === '1');
      if (isSandbox && child.indexOf('sandbox-') !== 0) child = 'sandbox-' + child;
      var tmpl = HtmlService.createTemplateFromFile('KidsHub');
      tmpl.INIT_CHILD = _childWhitelist[child.toLowerCase()] ? child.toLowerCase() : '';
      tmpl.IS_SANDBOX = isSandbox ? 'true' : 'false';
      tmpl.INIT_VIEW  = view.toLowerCase();
      var title = 'Kids Hub — Ring Quest';
      if (child.toLowerCase() === 'jj')   title = '⭐ JJ\'s Sparkle Stars';
      if (view.toLowerCase()  === 'parent') title = '⚙ Kids Hub — Parent Dashboard';
      return tmpl.evaluate()
        .setTitle(title)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    // v88: SparkleLearning inlined (split reverted — template include boundary bugs)
    return HtmlService.createHtmlOutputFromFile(route.file)
      .setTitle(route.title)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutputFromFile('TheVein')
      .setTitle('The Vein — Thompson Household Command Center')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}


// v59: doPost — handles POST requests for large payloads (e.g. curriculum seeding)
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var fn = body.fn;
    var args = body.args || [];
    var whitelist = {
      'seedStaarRlaSprintSafe': seedStaarRlaSprintSafe,
      'pipelineRelaySafe': pipelineRelaySafe
    };
    if (!whitelist[fn]) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Function not in POST whitelist: ' + fn }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var result = whitelist[fn].apply(null, args);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    if (typeof logError_ === 'function') logError_('doPost', err);
    return ContentService.createTextOutput(JSON.stringify({ error: 'Request failed' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function serveData(e) {
  var action = e.parameter.action || 'data';

  // v82: QA env override — per-request SSID swap (tokens from CF Worker, 5-min window)
  // Safe: each GAS HTTP request runs in its own V8 isolate; SSID reassignment is local.
  if (e.parameter.env === 'qa') {
    if (!validateQAToken_(e.parameter.qa_token)) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'Invalid QA token' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    var qaSSID = PropertiesService.getScriptProperties().getProperty('TBM_QA_SSID');
    if (!qaSSID) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: 'QA workbook not configured' })
      ).setMimeType(ContentService.MimeType.JSON);
    }
    SSID = qaSSID;
    _tbmSS = null; // bust cached workbook reference
  }

  try {
    var result;

    // v49: Smart Proxy — return HTML content for Cloudflare Worker
    if (action === 'htmlSource') {
      var page = (e.parameter.page || 'pulse').toLowerCase();
      var routes = {
        'vein': 'TheVein', 'pulse': 'ThePulse', 'vault': 'Vault',
        'kidshub': 'KidsHub', 'spine': 'TheSpine', 'soul': 'TheSoul',
        'debt': 'ThePulse', 'jt': 'ThePulse', 'weekly': 'ThePulse',
        'parent': 'KidsHub', 'story-library': 'StoryLibrary',
        'comic-studio': 'ComicStudio', 'progress': 'ProgressReport',
        'story': 'StoryReader',
        'homework': 'HomeworkModule', 'sparkle': 'SparkleLearning',
        'wolfkid': 'WolfkidCER', 'wolfdome': 'DesignDashboard', 'dashboard': 'DesignDashboard', 'sparkle-kingdom': 'JJHome',
        'facts': 'fact-sprint', 'reading': 'reading-module',
        'writing': 'writing-module',
        'investigation': 'investigation-module', 'daily-missions': 'daily-missions',
        'baseline': 'BaselineDiagnostic',
        'power-scan': 'wolfkid-power-scan',
        'qa-operator': 'QAOperator'
      };
      var filename = routes[page] || 'ThePulse';
      try {
        var content;
        if (page === 'kidshub' || page === 'buggsy' || page === 'jj' || page === 'parent') {
          var _childWhitelist2 = { buggsy: true, jj: true, 'sandbox-buggsy': true, 'sandbox-jj': true };
          var tmpl = HtmlService.createTemplateFromFile('KidsHub');
          var _childParam = page === 'jj' ? 'jj' : (page === 'buggsy' ? 'buggsy' : (e.parameter.child || 'buggsy'));
          // v74: Sandbox mode
          var _isSandbox2 = e.parameter.sandbox === '1';
          if (_isSandbox2 && _childParam.indexOf('sandbox-') !== 0) _childParam = 'sandbox-' + _childParam;
          tmpl.INIT_CHILD = _childWhitelist2[_childParam.toLowerCase()] ? _childParam.toLowerCase() : '';
          tmpl.INIT_VIEW  = page === 'parent' ? 'parent' : (e.parameter.view  || 'kid').toLowerCase();
          tmpl.IS_SANDBOX = _isSandbox2 ? 'true' : 'false';
          content = tmpl.evaluate().getContent();
        } else if (page === 'vault') {
          var tmpl = HtmlService.createTemplateFromFile('Vault');
          tmpl.sheetData = JSON.stringify(getAllVaultData());
          content = tmpl.evaluate().getContent();
        } else {
          content = HtmlService.createHtmlOutputFromFile(filename).getContent();
        }
        return ContentService.createTextOutput(content)
          .setMimeType(ContentService.MimeType.TEXT);
      } catch (err) {
        return ContentService.createTextOutput(
          JSON.stringify({ error: 'htmlSource failed: ' + err.message, file: filename })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // v49: Smart Proxy — universal function router with security whitelist
    if (action === 'api') {
      var fn = e.parameter.fn;
      var args = [];
      try { args = JSON.parse(e.parameter.args || '[]'); } catch(ex) {}
      // v52: Validate args is an array with bounded length
      if (!Array.isArray(args)) args = [];
      if (args.length > 10) {
        return ContentService.createTextOutput(
          JSON.stringify({ error: 'Too many arguments (' + args.length + ')' })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      var API_WHITELIST = {
        'getDataSafe': getDataSafe, 'getMonthsSafe': getMonthsSafe,
        'getCashFlowForecastSafe': getCashFlowForecastSafe, 'getSimulatorDataSafe': getSimulatorDataSafe,
        'getWeeklyTrackerDataSafe': getWeeklyTrackerDataSafe, 'getSubscriptionDataSafe': getSubscriptionDataSafe,
        'getCategoryTransactionsSafe': getCategoryTransactionsSafe, 'getReconcileStatusSafe': getReconcileStatusSafe,
        'reconcileVeinPulseSafe': reconcileVeinPulseSafe, 'getBoardDataSafe': getBoardDataSafe,
        'getSystemHealthSafe': getSystemHealthSafe, 'getMERGateStatusSafe': getMERGateStatusSafe,
        'getCloseHistoryDataSafe': getCloseHistoryDataSafe, 'getKHAppUrlsSafe': getKHAppUrlsSafe,
        'getDeployedVersionsSafe': getDeployedVersionsSafe,
        'getKidsHubDataSafe': getKidsHubDataSafe, 'getKidsHubWidgetDataSafe': getKidsHubWidgetDataSafe,
        'getKHLastModified': getKHLastModified, 'getKHLastModifiedSafe': getKHLastModifiedSafe,
        'getSpineHeartbeatSafe': getSpineHeartbeatSafe,
        'khCompleteTaskSafe': khCompleteTaskSafe, 'khCompleteTaskWithBonusSafe': khCompleteTaskWithBonusSafe,
        'khUncompleteTaskSafe': khUncompleteTaskSafe, 'khApproveTaskSafe': khApproveTaskSafe,
        'khRejectTaskSafe': khRejectTaskSafe, 'khOverrideTaskSafe': khOverrideTaskSafe,
        'khApproveWithBonusSafe': khApproveWithBonusSafe, 'khResetTasksSafe': khResetTasksSafe,
        'khRedeemRewardSafe': khRedeemRewardSafe, 'khSubmitRequestSafe': khSubmitRequestSafe,
        'khApproveRequestSafe': khApproveRequestSafe, 'khDenyRequestSafe': khDenyRequestSafe,
        'khAddBonusTaskSafe': khAddBonusTaskSafe, 'khDebitScreenTimeSafe': khDebitScreenTimeSafe, 'updateMealPlanSafe': updateMealPlanSafe, 'getStoryApiStatsSafe': getStoryApiStatsSafe,
        'khSetBankOpeningSafe': khSetBankOpeningSafe, 'khVerifyPinSafe': khVerifyPinSafe,
        'khAddDeductionSafe': khAddDeductionSafe, 'khHealthCheckSafe': khHealthCheckSafe, 'khBatchApproveSafe': khBatchApproveSafe,
        'khSubmitGradeSafe': khSubmitGradeSafe, 'khGetGradeHistorySafe': khGetGradeHistorySafe,
        'updateFamilyNoteSafe': updateFamilyNoteSafe, 'addKidsEventSafe': addKidsEventSafe,
        'runMERGatesSafe': runMERGatesSafe, 'stampCloseMonthSafe': stampCloseMonthSafe,
        'getVaultDataSafe': getVaultDataSafe, 'runStoryFactorySafe': runStoryFactorySafe,
        'listStoredStoriesSafe': listStoredStoriesSafe, 'getStoredStorySafe': getStoredStorySafe, 'getActivityStoryPackSafe': getActivityStoryPackSafe,
        'getTodayContentSafe': getTodayContentSafe, 'seedWeek1CurriculumSafe': seedWeek1CurriculumSafe, 'seedStaarRlaSprintSafe': seedStaarRlaSprintSafe,
        'reconcileVeinPulse': reconcileVeinPulse, 'getScriptUrlSafe': getScriptUrlSafe,
        'submitFeedbackSafe': submitFeedbackSafe, 'getAudioBatchSafe': getAudioBatchSafe,
        'logHomeworkCompletionSafe': logHomeworkCompletionSafe, 'logSparkleProgressSafe': logSparkleProgressSafe,
        'awardRingsSafe': awardRingsSafe,
        'logQuestionResultSafe': logQuestionResultSafe,
        'savePowerScanResultsSafe': savePowerScanResultsSafe,
        'saveProgressSafe': saveProgressSafe,
        'loadProgressSafe': loadProgressSafe,
        'logScaffoldEventSafe': logScaffoldEventSafe,
        'getWeekProgressSafe': getWeekProgressSafe,
        'getWeeklyProgressSafe': getWeeklyProgressSafe,
        'getSpellingWordsSafe': getSpellingWordsSafe,
        'recordVocabExposuresSafe': recordVocabExposuresSafe,
        'getStoryForReaderSafe': getStoryForReaderSafe,
        'getStoryImagesSafe': getStoryImagesSafe,
        // runTestsSafe removed — diagnostic endpoint should not be publicly callable via CF /api.
        // Tests still run via ?action=runTests (direct GAS route, not proxied).
        'saveMissionStateSafe': saveMissionStateSafe,
        'getMissionStateSafe': getMissionStateSafe,
        'submitHomeworkSafe': submitHomeworkSafe,
        'getEducationQueueSafe': getEducationQueueSafe,
        'approveHomeworkSafe': approveHomeworkSafe,
        'getDailyScheduleSafe': getDailyScheduleSafe,
        'checkDay1Safe': checkDay1Safe,
        'saveDesignChoicesSafe': saveDesignChoicesSafe,
        'getDesignChoicesSafe': getDesignChoicesSafe,
        'getDesignUnlockedSafe': getDesignUnlockedSafe,
        'getDailyMissionsInitSafe': getDailyMissionsInitSafe,
        'seedAllCurriculumSafe': seedAllCurriculumSafe,
        'getOpsHealthSafe': getOpsHealthSafe,
        'resetSandboxSafe': resetSandboxSafe,
        'startLessonRunSafe': startLessonRunSafe,
        'saveLessonRunStateSafe': saveLessonRunStateSafe,
        'getLessonRunResumeSafe': getLessonRunResumeSafe,
        'completeLessonRunSafe': completeLessonRunSafe,
        // QA Operator Mode — PR 1 (specs/qa-operator-mode.md)
        'qaGetEnvStatusSafe': qaGetEnvStatusSafe,
        'qaListScenariosSafe': qaListScenariosSafe,
        'qaLoadScenarioSafe': qaLoadScenarioSafe,
        'qaSetClockSafe': qaSetClockSafe,
        'qaClearClockSafe': qaClearClockSafe,
        'qaSnapshotSafe': qaSnapshotSafe,
        'qaRestoreSafe': qaRestoreSafe,
        'qaListSnapshotsSafe': qaListSnapshotsSafe,
        'qaRunPersistenceTestsSafe': qaRunPersistenceTestsSafe,
        'qaClearTestDataSafe': qaClearTestDataSafe,
        'qaResetDataSafe': qaResetDataSafe,
        'qaExportStateSafe': qaExportStateSafe,
        'getAssetRegistrySafe': getAssetRegistrySafe,
        // ComicStudio v4 Day 2 — Drive draft + mode aggregator
        'saveComicDraftSafe': saveComicDraftSafe,
        'loadComicDraftSafe': loadComicDraftSafe,
        'loadComicDraftByDateSafe': loadComicDraftByDateSafe,
        'listComicDraftsSafe': listComicDraftsSafe,
        'deleteComicDraftSafe': deleteComicDraftSafe,
        'getComicStudioContextSafe': getComicStudioContextSafe,
        'checkHomeworkGateSafe': checkHomeworkGateSafe,
        // NotionEngine.js — Notion-specific wrappers (v2: renamed to avoid overriding Code.js handlers)
        'notionLogHomeworkSafe': notionLogHomeworkSafe,
        'notionLogSparkleProgressSafe': notionLogSparkleProgressSafe,
        'notionApproveHomeworkSafe': notionApproveHomeworkSafe,
        'getPendingReviewsSafe': getPendingReviewsSafe,
        // ContentEngine.gs v2 — Vocabulary usage grading (#225)
        'gradeVocabUsageSafe': gradeVocabUsageSafe
      };

      if (!fn || !API_WHITELIST[fn]) {
        return ContentService.createTextOutput(
          JSON.stringify({ error: 'Unknown or missing function: ' + (fn || 'null') })
        ).setMimeType(ContentService.MimeType.JSON);
      }

      try {
        var apiResult = API_WHITELIST[fn].apply(null, args);
        if (apiResult === undefined) apiResult = null;
        return ContentService.createTextOutput(
          JSON.stringify(apiResult)
        ).setMimeType(ContentService.MimeType.JSON);
      } catch (err) {
        if (typeof logError_ === 'function') logError_('serveData_API_' + fn, err);
        return ContentService.createTextOutput(
          JSON.stringify({ error: err.message, fn: fn })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (action === 'runTests') {
      var smokeRaw = tbmSmokeTest();
      var regRaw = tbmRegressionSuite();
      var smokeResult = JSON.parse(smokeRaw);
      var regressionResult = JSON.parse(regRaw);
      result = {
        timestamp: new Date().toISOString(),
        overall: (smokeResult.overall === 'PASS' && regressionResult.overall === 'PASS') ? 'PASS'
               : (smokeResult.overall === 'FAIL' || regressionResult.overall === 'FAIL') ? 'FAIL' : 'WARN',
        smoke: smokeResult,
        regression: regressionResult,
        versions: {
          codeGs: 'v' + getCodeVersion(),
          dataEngine: 'v' + (function(){ try { return getDataEngineVersion(); } catch(e) { return '?'; } })(),
          smokeTest: 'v' + (function(){ try { return getSmokeTestVersion(); } catch(e) { return '?'; } })(),
          regressionSuite: 'v' + (function(){ try { return getRegressionSuiteVersion(); } catch(e) { return '?'; } })()
        }
      };
    } else if (action === 'months') {
      result = getAvailableMonths();
    } else if (action === 'forecast') {
      result = getCashFlowForecast();
    } else if (action === 'simulator') {
      result = getSimulatorData();
    } else if (action === 'weekly') {
      result = getWeeklyTrackerData();
    } else if (action === 'cascade') {
      refreshCascadeTabs();
      result = { status: 'ok', refreshedAt: new Date().toISOString() };
    } else if (action === 'kids') {
      var khChild = (e.parameter.child || 'all').toLowerCase();
      result = getKidsHubData(khChild);
    } else if (action === 'kh_health') {
      result = JSON.parse(khHealthCheck());
    } else if (action === 'reconcile') {
      result = reconcileVeinPulse();
    } else if (action === 'board') {
      result = getBoardData();
    } else if (action === 'version') {
      result = { codeGs: 'v' + getCodeVersion(), dataEngine: 'v' + (function(){ try { return getDataEngineVersion(); } catch(e) { return 'unknown'; } })(), cascadeEngine: 'v' + (function(){ try { return getCascadeEngineVersion(); } catch(e) { return 'unknown'; } })(), updated: new Date().toISOString().slice(0,10) };
    } else if (action === 'loc') {
      result = getLOCCapacity();
    } else if (action === 'opsHealth') {
      result = getOpsHealth_();
    } else if (action === 'tillerFreshness') {
      result = checkTillerFreshness_();
    } else if (action === 'allVersions') {
      result = getDeployedVersions();
    } else {
      var start, end;
      if (e.parameter.month) {
        var ym = e.parameter.month;
        if (ym === 'current') {
          var n = new Date();
          ym = n.getFullYear() + '-' + leftPad2_(n.getMonth() + 1);
        }
        var parts = ym.split('-');
        var yr = parseInt(parts[0]);
        var mo = parseInt(parts[1]);
        start = ym + '-01';
        end   = ym + '-' + new Date(yr, mo, 0).getDate();
      } else {
        start = e.parameter.start || null;
        end   = e.parameter.end   || null;
      }
      if (!start || !end) {
        var n2 = new Date();
        var ym2 = n2.getFullYear() + '-' + leftPad2_(n2.getMonth() + 1);
        start = ym2 + '-01';
        end   = ym2 + '-' + new Date(n2.getFullYear(), n2.getMonth() + 1, 0).getDate();
      }
      result = getData(start, end, true);
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message, stack: err.stack }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// ════════════════════════════════════════════════════════════════════
// 2. GOOGLE.SCRIPT.RUN WRAPPERS — wired with withMonitor_ (v38)
// ════════════════════════════════════════════════════════════════════

function getDataSafe(paramsOrStart, endArg, debtArg) {
  return withMonitor_('getDataSafe', function() {
    var start, end;
    if (typeof paramsOrStart === 'string') {
      start = paramsOrStart;
      end = endArg || null;
    } else {
      var params = paramsOrStart || {};
      if (params.month) {
        var ym = params.month;
        if (ym === 'current') {
          var n = new Date();
          ym = n.getFullYear() + '-' + leftPad2_(n.getMonth() + 1);
        }
        var parts = ym.split('-');
        var yr = parseInt(parts[0]);
        var mo = parseInt(parts[1]);
        start = ym + '-01';
        end   = ym + '-' + new Date(yr, mo, 0).getDate();
      } else {
        start = params.start || null;
        end   = params.end   || null;
      }
    }
    if (!start || !end) {
      var n2 = new Date();
      var ym2 = n2.getFullYear() + '-' + leftPad2_(n2.getMonth() + 1);
      start = ym2 + '-01';
      end   = ym2 + '-' + new Date(n2.getFullYear(), n2.getMonth() + 1, 0).getDate();
    }
    // v41: CacheService — only cache current month requests
    var nowDate = new Date();
    var currentYM = nowDate.getFullYear() + '-' + leftPad2_(nowDate.getMonth() + 1);
    var isCurrentMonth = start === currentYM + '-01';
    var cacheKey = DE_CACHE_KEY + '_' + start;
    if (isCurrentMonth) {
      var cached = getCachedPayload_(cacheKey);
      if (cached) return cached;
    }
    try { SpreadsheetApp.openById(SSID).getSheetByName(TAB_MAP['Helpers'] || 'Helpers').getRange('Z1').setValue(new Date().toISOString()); } catch(e) { if (typeof logError_ === 'function') logError_('getDataSafe_heartbeat', e); }
    var raw = getData(start, end, true);
    var result = JSON.parse(JSON.stringify(raw));
    if (isCurrentMonth) {
      setCachedPayload_(cacheKey, result);
    }
    return result;
  });
}

// getMonthsSafe, getSimulatorDataSafe, getWeeklyTrackerDataSafe, getCashFlowForecastSafe,
// getScriptUrl, getScriptUrlSafe, runMERGatesSafe, stampCloseMonthSafe, updateFamilyNoteSafe,
// getCategoryTransactionsSafe, getCloseHistoryDataSafe, getSubscriptionDataSafe,
// runStoryFactorySafe, getStoredStorySafe, getAssetRegistrySafe,
// seedWeek1CurriculumSafe, seedStaarRlaSprintSafe, getStoryApiStatsSafe
// → moved to Code-Finance.gs.js (#299)

// ── KidsHub safe wrappers ────────────────────────────────────────
function getKidsHubDataSafe(child) {
  return withMonitor_('getKidsHubDataSafe', function() {
    var resolvedChild = child || 'all';
    // v70: Cache ALL requests — 'all', 'buggsy', 'jj' — each with own key
    var cacheKey = KH_CACHE_KEY + (resolvedChild === 'all' ? '' : '_' + resolvedChild);
    var cached = getCachedKHPayload_(cacheKey);
    if (cached) return cached;
    var result = getKidsHubData(resolvedChild, Date.now());
    // v70: Never cache error responses — let next request retry
    if (result && result.indexOf('"error"') === -1) {
      setCachedKHPayload_(result, cacheKey);
    }
    return result;
  });
}

// v41: Kids Hub WIDGET transformer. scope='summary' strips task details for ThePulse compact widget.
function getKidsHubWidgetDataSafe(scope) {
  return withMonitor_('getKidsHubWidgetDataSafe', function() {
    try {
      var isSummary = scope === 'summary';
      // v47: Use cached KH data if available
      var cached = getCachedKHPayload_();
      var raw;
      if (cached) {
        raw = typeof cached === 'string' ? JSON.parse(cached) : cached;
      } else {
        var freshStr = getKidsHubData('all', Date.now());
        setCachedKHPayload_(freshStr);
        raw = JSON.parse(freshStr);
      }
      if (raw.error) return { error: raw.error };
      var tasks      = raw.tasks      || [];
      var rewards    = raw.rewards    || [];
      var balances   = raw.balances   || {};
      var childCfg   = raw.childConfig|| {};
      var allowance  = raw.allowance  || {};
      var requests   = raw.requests   || [];
      var pendingRequestCount = raw.pendingRequestCount || {};
      var screenTime = raw.screenTime || {};
      var levels     = raw.levels     || [];

      function buildChild(key) {
        var cfg = childCfg[key] || {};
        var bal = balances[key] || { balance: 0, bankBalance: 0, earnedMoney: 0, bankOpening: 0 };
        var childTasks = tasks.filter(function(t) {
          return (t.child || '').toLowerCase() === key || (t.child || '').toUpperCase() === 'BOTH';
        });
        var childRewards = rewards.filter(function(r) {
          return (r.child || '').toLowerCase() === key || (r.child || '').toUpperCase() === 'BOTH';
        });
        var completed = childTasks.filter(function(t) { return t.completed; });
        var approved  = childTasks.filter(function(t) { return t.completed && t.parentApproved; });
        var pending   = childTasks.filter(function(t) { return t.completed && !t.parentApproved; });
        var totalPts  = bal.balance || 0;
        var tvMin = 0, moneyEarned = 0, approvedMoney = 0, snacksEarned = 0;
        for (var ci = 0; ci < completed.length; ci++) {
          tvMin += completed[ci].tvMinutes || 0;
          moneyEarned += completed[ci].money || 0;
          snacksEarned += completed[ci].snacks || 0;
        }
        for (var ai = 0; ai < approved.length; ai++) {
          approvedMoney += approved[ai].money || 0;
        }
        var sorted = childRewards.slice().sort(function(a, b) { return a.cost - b.cost; });
        var nextReward = null;
        for (var ri = 0; ri < sorted.length; ri++) {
          if (sorted[ri].cost > totalPts) { nextReward = sorted[ri]; break; }
        }
        if (!nextReward && sorted.length > 0) nextReward = sorted[sorted.length - 1];
        var requiredStatus = typeof getRequiredStatus_ === 'function' ? getRequiredStatus_(key) : null;

        var childRequests = requests.filter(function(r) {
          return (r.child || '').toLowerCase() === key;
        });
        var pendingAsks = childRequests.filter(function(r) { return r.status === 'Pending'; });

        return {
          name:  cfg.displayName || cfg.child || key,
          emoji: cfg.icon || (key === 'jj' ? '⭐' : '⭕'),
          allowanceMTD: moneyEarned,
          approvedMTD: approvedMoney,
          requiredStatus: requiredStatus,
          bankBalance: bal.bankBalance || 0,
          screenTime: screenTime[key] || { TV: { balance: 0 }, Gaming: { balance: 0 } },
          pendingRequestCount: pendingRequestCount[key] || 0,
          stats: {
            earnedPoints:    totalPts,
            totalTasks:      childTasks.length,
            completedCount:  completed.length,
            approvedCount:   approved.length,
            completionPct:   childTasks.length > 0 ? Math.round(completed.length / childTasks.length * 100) : 0,
            tvMinutesEarned: tvMin,
            snacksEarned:    snacksEarned,
            pendingCount:    pending.length,
            pendingApprovals: isSummary ? [] : pending.map(function(t) {
              return { icon: t.icon, task: t.task, points: t.points, money: t.money || 0, rowIndex: t.rowIndex };
            }),
            pendingAsks: isSummary ? [] : pendingAsks.map(function(r) {
              return { requestUID: r.requestUID, type: r.type, title: r.title, amount: r.amount };
            }),
            nextReward: nextReward ? { icon: nextReward.icon, name: nextReward.name, cost: nextReward.cost } : null
          }
        };
      }

      var buggsy = buildChild('buggsy');
      var jj     = buildChild('jj');
      var alwB   = allowance.buggsy || {};
      var alwJ   = allowance.jj     || {};

      return {
        buggsy: buggsy,
        jj:     jj,
        levels: levels,
        requiredStatus: {
          buggsy: buggsy.requiredStatus || null,
          jj: jj.requiredStatus || null
        },
        screenTime: {
          buggsy: buggsy.screenTime || { TV: { balance: 0 }, Gaming: { balance: 0 } },
          jj: jj.screenTime || { TV: { balance: 0 }, Gaming: { balance: 0 } }
        },
        household: {
          totalPendingApprovals: (buggsy.stats.pendingCount || 0) + (jj.stats.pendingCount || 0),
          totalPendingAsks:      (buggsy.pendingRequestCount || 0) + (jj.pendingRequestCount || 0),
          totalOwedMTD:          (buggsy.allowanceMTD || 0) + (jj.allowanceMTD || 0),
          totalApprovedMTD:      (buggsy.approvedMTD || 0) + (jj.approvedMTD || 0),
          weeklyBudgetImpact:    (alwB.weeklyAmount || 0) + (alwJ.weeklyAmount || 0)
        }
      };
    } catch (e) {
      Logger.log('getKidsHubWidgetDataSafe error: ' + e.message);
      return { error: 'Widget data error: ' + e.message };
    }
  });
}

// getCategoryTransactionsSafe, getCloseHistoryDataSafe, getSubscriptionDataSafe
// → moved to Code-Finance.gs.js (#299)

// _khDiag_, khCompleteTaskSafe, khCompleteTaskWithBonusSafe, khApproveTaskSafe,
// khUncompleteTaskSafe, khRejectTaskSafe, khApproveWithBonusSafe, khOverrideTaskSafe,
// khRedeemRewardSafe, khAddDeductionSafe, khResetTasksSafe, khVerifyPinSafe,
// getKHAppUrlsSafe, khHealthCheckSafe, khSubmitRequestSafe, khApproveRequestSafe,
// khDenyRequestSafe, khSetBankOpeningSafe, khDebitScreenTimeSafe, updateMealPlanSafe,
// khSubmitGradeSafe, khGetGradeHistorySafe, khAddBonusTaskSafe, khBatchApproveSafe
// → moved to Code-KidsHub.gs.js (#299)

// getStoryApiStatsSafe, runStoryFactorySafe, getStoredStorySafe, getAssetRegistrySafe,
// seedWeek1CurriculumSafe, seedStaarRlaSprintSafe
// → moved to Code-Finance.gs.js (#299)

// v83: Feedback Form — setup + submit (extended schema for pipeline #231)
function setupFeedbackSheet() {
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['Feedback']) || '💻 Feedback';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(['Timestamp', 'Surface', 'LayoutRating', 'ReadabilityRating', 'FreeText', 'User', 'Processed', 'Classification']);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold');
    Logger.log('Feedback sheet created: ' + tabName);
  } else {
    // v83: Migrate existing sheet — add User, Processed, Classification if missing
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var headerStr = headers.join(',');
    if (headerStr.indexOf('User') === -1) {
      var nextCol = headers.length + 1;
      sheet.getRange(1, nextCol).setValue('User');
      sheet.getRange(1, nextCol + 1).setValue('Processed');
      sheet.getRange(1, nextCol + 2).setValue('Classification');
      Logger.log('Feedback sheet migrated: added User, Processed, Classification columns');
    } else {
      Logger.log('Feedback sheet already has extended schema.');
    }
  }
}

// v83: Feedback with Pushover notification + Processed column for pipeline (#231)
function submitFeedbackSafe(payload) {
  return withMonitor_('submitFeedbackSafe', function() {
    var layout = parseInt(payload.layout, 10);
    if (isNaN(layout) || layout < 1 || layout > 5) {
      return JSON.parse(JSON.stringify({ error: true, message: 'Layout rating must be 1-5' }));
    }
    // readability is optional — kid surfaces send one emoji rating mapped to layout only
    var readabilityRaw = parseInt(payload.readability, 10);
    var readability = (isNaN(readabilityRaw) || readabilityRaw < 1 || readabilityRaw > 5) ? layout : readabilityRaw;
    var surface = String(payload.surface || 'unknown');
    var text = String(payload.text || '').substring(0, 500);
    var user = String(payload.user || 'unknown');

    var lock = LockService.getScriptLock();
    try { lock.waitLock(30000); } catch(e) {
      return JSON.parse(JSON.stringify({ error: true, message: 'System is busy' }));
    }
    try {
      var ss = SpreadsheetApp.openById(SSID);
      var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['Feedback']) || '💻 Feedback';
      var sheet = ss.getSheetByName(tabName);
      if (!sheet) {
        return JSON.parse(JSON.stringify({ error: true, message: 'Feedback sheet not found. Run setupFeedbackSheet() first.' }));
      }
      // v83: Extended row — added User, Processed, Classification columns for pipeline
      sheet.appendRow([new Date().toISOString(), surface, layout, readability, text, user, '', '']);

      // v83: Immediate Pushover to LT only — no feedback sits unread (#231 Layer 1)
      try {
        var stars = '';
        for (var s = 0; s < layout; s++) stars += '\u2b50';
        var preview = text ? (' \u2014 ' + text.substring(0, 80)) : '';
        if (typeof sendPush_ === 'function') {
          sendPush_(
            '\ud83d\udde3 Feedback: ' + surface,
            user + ': ' + stars + preview,
            'LT',
            typeof PUSHOVER_PRIORITY !== 'undefined' ? PUSHOVER_PRIORITY.CHORE_APPROVAL : 0
          );
        }
      } catch(pushErr) {
        if (typeof logError_ === 'function') logError_('submitFeedback_push', pushErr);
      }

      return JSON.parse(JSON.stringify({ success: true }));
    } finally {
      lock.releaseLock();
    }
  });
}

// v55 REMOVED: Duplicate updateMealPlanSafe deleted — original at ~line 876 handles (meal, cook, notes) correctly

// v52: Audio Wiring — getAudioBatchSafe moved to KidsHub.js

// v52: Notion write-backs — log homework and sparkle progress
function logHomeworkCompletionSafe(data) {
  return withMonitor_('logHomeworkCompletionSafe', function() {
    var apiKey = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');
    if (!apiKey) return JSON.parse(JSON.stringify({ error: true, message: 'NOTION_API_KEY not set' }));

    // Map incoming subject to Homework Tracker DB select options
    var SUBJ_MAP = {
      'Math': 'Math', 'math': 'Math',
      'Science': 'Science', 'science': 'Science',
      'RLA': 'Reading', 'Reading': 'Reading', 'reading': 'Reading',
      'Writing': 'Writing', 'RLA-Writing': 'Writing', 'RLA-Writing-CER': 'Writing',
      'Social Studies': 'Social Studies', 'Spelling': 'Spelling'
    };
    var notionSubject = SUBJ_MAP[String(data.subject || '')] || 'Other';
    var notesText = 'Child: ' + String(data.child || 'buggsy') +
      (data.score !== undefined && data.score !== null
        ? ' | Score: ' + data.score + (data.total ? '/' + data.total : '')
        : '');

    // v74: Read DB ID from Script Properties — fail-closed if not set
    var hwDbId = PropertiesService.getScriptProperties().getProperty('NOTION_HOMEWORK_DB_ID');
    if (!hwDbId) return JSON.parse(JSON.stringify({ error: true, message: 'NOTION_HOMEWORK_DB_ID not set' }));
    var payload = {
      parent: { database_id: hwDbId },
      properties: {
        'Assignment': { title: [{ text: { content: String(data.title || data.assignment || 'Homework Entry') } }] },
        'Subject': { select: { name: notionSubject } },
        'Due Date': { date: { start: String(data.date || new Date().toISOString().slice(0, 10)) } },
        'Status': { select: { name: 'Turned In' } },
        'Notes': { rich_text: [{ text: { content: notesText } }] }
      }
    };

    var resp = UrlFetchApp.fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = resp.getResponseCode();
    if (code >= 400) {
      if (typeof logError_ === 'function') logError_('logHomeworkCompletionSafe', new Error('Notion API ' + code));
      return JSON.parse(JSON.stringify({ error: true, message: 'Notion API error: ' + code }));
    }
    return JSON.parse(JSON.stringify({ success: true }));
  });
}

function logSparkleProgressSafe(data) {
  return withMonitor_('logSparkleProgressSafe', function() {
    var apiKey = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');
    if (!apiKey) return JSON.parse(JSON.stringify({ error: true, message: 'NOTION_API_KEY not set' }));

    // v74: Read DB ID from Script Properties — old hardcoded value was a PAGE, not a database
    var sparkleDbId = PropertiesService.getScriptProperties().getProperty('NOTION_SPARKLE_DB_ID');
    if (!sparkleDbId) return JSON.parse(JSON.stringify({ error: true, message: 'NOTION_SPARKLE_DB_ID not set' }));

    var payload = {
      parent: { database_id: sparkleDbId },
      properties: {
        'Name': { title: [{ text: { content: String(data.activity || 'Sparkle Progress') } }] },
        'Child': { select: { name: 'jj' } },
        'Subject': { select: { name: String(data.subject || 'Letters') } },
        'Score': { number: parseInt(data.score, 10) || 0 },
        'Date': { date: { start: String(data.date || new Date().toISOString().slice(0, 10)) } }
      }
    };

    var resp = UrlFetchApp.fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var code = resp.getResponseCode();
    if (code >= 400) {
      if (typeof logError_ === 'function') logError_('logSparkleProgressSafe', new Error('Notion API ' + code));
      return JSON.parse(JSON.stringify({ error: true, message: 'Notion API error: ' + code }));
    }
    return JSON.parse(JSON.stringify({ success: true }));
  });
}

// v54: Education ring/star awards — wires HTML awardRings() to KidsHub backend
function awardRingsSafe(kid, amount, source) {
  return withMonitor_('awardRingsSafe', function() {
    return JSON.parse(kh_awardEducationPoints_(kid, amount, source));
  });
}

// v54: Safe wrapper for KH heartbeat timestamp read
function getKHLastModifiedSafe() {
  return withMonitor_('getKHLastModifiedSafe', function() {
    return JSON.parse(JSON.stringify(getKHLastModified()));
  });
}

// v44: Deployed versions — calls all get*Version() functions from GASHardening
function getDeployedVersionsSafe() {
  return withMonitor_('getDeployedVersionsSafe', function() {
    return JSON.parse(JSON.stringify(getDeployedVersions()));
  });
}


// v50: Zero-touch deploy — combined smoke + regression test runner
// Called via ?action=runTests (direct) or ?action=api&fn=runTestsSafe (proxy)
function runTestsSafe() {
  return withMonitor_('runTestsSafe', function() {
    var smokeRaw = tbmSmokeTest();
    var regRaw = tbmRegressionSuite();
    var smokeResult = JSON.parse(smokeRaw);
    var regressionResult = JSON.parse(regRaw);
    return {
      timestamp: new Date().toISOString(),
      overall: (smokeResult.overall === 'PASS' && regressionResult.overall === 'PASS') ? 'PASS'
             : (smokeResult.overall === 'FAIL' || regressionResult.overall === 'FAIL') ? 'FAIL' : 'WARN',
      smoke: smokeResult,
      regression: regressionResult,
      versions: {
        codeGs: 'v' + getCodeVersion(),
        dataEngine: 'v' + (function(){ try { return getDataEngineVersion(); } catch(e) { return '?'; } })(),
        smokeTest: 'v' + (function(){ try { return getSmokeTestVersion(); } catch(e) { return '?'; } })(),
        regressionSuite: 'v' + (function(){ try { return getRegressionSuiteVersion(); } catch(e) { return '?'; } })()
      }
    };
  });
}

function getAppUrls() {
  var base = ScriptApp.getService().getUrl();
  return JSON.stringify({
    buggsy: base + '?page=kidshub&child=buggsy',
    jj:     base + '?page=kidshub&child=jj',
    parent: base + '?page=kidshub&view=parent'
  });
}


// ════════════════════════════════════════════════════════════════════
// 2b. THEBOARD DATA WRAPPER
// ════════════════════════════════════════════════════════════════════
function getBoardDataSafe() {
  return withMonitor_('getBoardDataSafe', function() {
    try {
      return JSON.parse(JSON.stringify(getBoardData()));
    } catch(e) {
      Logger.log('getBoardDataSafe error: ' + e.message);
      return { error: 'Board data error: ' + e.message };
    }
  });
}

// ════════════════════════════════════════════════════════════════════
// 3. MER GATE STATUS
// ════════════════════════════════════════════════════════════════════

function getMERGateStatus() {
  var ss = SpreadsheetApp.openById(SSID);
  var qa = ss.getSheetByName(TAB_MAP['QA_Gates']);
  if (!qa) return { error: true, message: 'QA_Gates sheet not found' };
  var data = qa.getRange('A1:G15').getValues();
  var total = 0, passCount = 0, warnCount = 0, failCount = 0;
  for (var i = 1; i <= 10; i++) {
    var gate = data[i][0];
    if (!gate && gate !== 0) continue;
    total++;
    var status = String(data[i][6] || '');
    if (status.indexOf('\uD83D\uDD34') >= 0 || status.indexOf('FAIL') >= 0) {
      failCount++;
    } else if (status.indexOf('\u26A0') >= 0 || status.indexOf('WARN') >= 0) {
      warnCount++;
    } else {
      passCount++;
    }
  }
  return {
    allGreen: failCount === 0 && warnCount === 0 && total > 0,
    allPassing: failCount === 0 && total > 0,
    total: total, passCount: passCount, warnCount: warnCount, failCount: failCount
  };
}

function getMERGateStatusSafe() {
  return withMonitor_('getMERGateStatusSafe', function() {
    return JSON.parse(JSON.stringify(getMERGateStatus()));
  });
}


// ════════════════════════════════════════════════════════════════════
// 3b. WATCH VAULT DATA
// ════════════════════════════════════════════════════════════════════
function getAllVaultData() {
  var sheets = ['LT_Collection', 'JT_Collection', 'Kids_Collection', 'Wishlist'];
  var result = {};
  for (var i = 0; i < sheets.length; i++) {
    result[sheets[i]] = readVaultSheet(sheets[i]);
  }
  return result;
}
function readVaultSheet(sheetName) {
  try {
    var ss = SpreadsheetApp.openById(SSID);
    var sheet = ss.getSheetByName(TAB_MAP[sheetName] || sheetName);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    var headers = data[0];
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = data[i][j];
      }
      rows.push(obj);
    }
    return rows;
  } catch(e) {
    Logger.log('readVaultSheet(' + sheetName + ') error: ' + e.message);
    return [];
  }
}
function getVaultDataSafe() {
  return withMonitor_('getVaultDataSafe', function() {
    return JSON.parse(JSON.stringify(getAllVaultData()));
  });
}


// ════════════════════════════════════════════════════════════════════
// 4. HEALTH CHECK
// ════════════════════════════════════════════════════════════════════

function healthCheck() {
  Logger.log('═══ Code.gs v' + getCodeVersion() + ' Health Check ═══');

  var fns = [
    'doGet', 'servePage', 'serveData', 'getDataSafe', 'getMonthsSafe',
    'getData', 'getSimulatorData', 'getWeeklyTrackerData',
    'getAvailableMonths', 'getCashFlowForecast', 'parseDebtExport',
    'getSimulatorDataSafe', 'getWeeklyTrackerDataSafe', 'getCashFlowForecastSafe',
    'getScriptUrl', 'getScriptUrlSafe',
    'getMERGateStatus', 'getMERGateStatusSafe',
    'refreshCascadeTabs', 'refreshCascadeTabsSafe', 'testCascade',
    'getLOCCapacity', 'getLOCCapacitySafe',
    'getCascadeResultsSafe',
    'getKidsHubData', 'getKidsHubDataSafe',
    'getAppUrls',
    'getCategoryTransactionsSafe', 'getCloseHistoryDataSafe', 'getSubscriptionDataSafe',
    'getDataEngineVersion',
    'getAllVaultData', 'readVaultSheet', 'getVaultDataSafe',
    'khCompleteTask', 'khApproveTask', 'khUncompleteTask',
    'khCompleteTaskWithBonus', 'khRedeemReward', 'khAddDeduction',
    'khResetTasks', 'khVerifyPin', 'khHealthCheck',
    'khRejectTask', 'khApproveWithBonus', 'khOverrideTask',
    'khRejectTaskSafe', 'khApproveWithBonusSafe', 'khOverrideTaskSafe',
    'getKHAppUrls', 'setupKHSheets', 'validateTaskIDs',
    'runDailyGateCheck', 'installDailyGateAlert', 'removeDailyGateAlert',
    'runDailyEducationAlerts', 'installDailyEducationAlertTrigger_', 'installWeeklyDigestTrigger_',
    'notionApi_', 'pushQAResult', 'pushPipelineEvent_', 'testNotionConnection',
    'isPipelineUrl_', 'pipelineStatusForType_', 'normalizePipelinePayload_', 'pipelineRelaySafe',
    'reconcileVeinPulse', 'reconcileVeinPulseSafe', 'resolveNestedKey_',
    'getCodeVersion',
    'getBoardData', 'getBoardDataSafe',
    'writeReconcileStatus_', 'getReconcileStatusSafe',
    'installReconciliationTrigger', 'removeReconciliationTrigger',
    // v36: Ask System + Parents Bank
    'khSubmitRequest', 'khSubmitRequestSafe',
    'khApproveRequest', 'khApproveRequestSafe',
    'khDenyRequest', 'khDenyRequestSafe',
    'khSetBankOpening', 'khSetBankOpeningSafe',
    // v37: Screen Time Bank
    'khDebitScreenTime', 'khDebitScreenTimeSafe',
    // v39: Bonus Task
    'khAddBonusTask', 'khAddBonusTaskSafe',
    // v38: GAS Hardening
    'withMonitor_', 'logError_', 'logPerf_',
    'auditTriggers', 'checkTillerSyncHealth', 'monthClosePreflight',
    'writeWeeklySnapshot', 'fullSystemDiagnostic',
    // v41: CacheService + heartbeat + widget scope
    'getCachedPayload_', 'setCachedPayload_', 'bustCache',
    'getKHLastModified', 'getKidsHubWidgetDataSafe',
    // v43: Story Factory
    'runStoryFactory', 'runStoryFactorySafe',
    // v44: Deployed Versions
    'getDeployedVersions', 'getDeployedVersionsSafe',
    // v51: Story Library + Curriculum
    'listStoredStories', 'listStoredStoriesSafe',
    'getStoredStory', 'getStoredStorySafe',
    'getTodayContent_', 'getTodayContentSafe',
    'ensureCurriculumTab_', 'seedWeek1Curriculum', 'seedWeek1CurriculumSafe',
    'addBedtimeStoryChore',
    // v53: Feedback + Audio + Notion write-backs
    'setupFeedbackSheet', 'submitFeedbackSafe',
    'getAudioBatchSafe',
    'logHomeworkCompletionSafe', 'logSparkleProgressSafe',
    // v62: Education + Batch + PowerScan
    'awardRingsSafe', 'getKHLastModifiedSafe', 'khBatchApproveSafe',
    'runTestsSafe', 'seedStaarRlaSprintSafe',
    'savePowerScanResultsSafe', 'logQuestionResultSafe',
    'getWeeklyProgressSafe',
    // v174: NotionEngine.js — renamed to avoid overriding Code.js handlers
    'notionLogHomeworkSafe', 'notionLogSparkleProgressSafe', 'notionApproveHomeworkSafe',
    'getPendingReviewsSafe'
  ];
  var allOk = true;
  for (var fi = 0; fi < fns.length; fi++) {
    var name = fns[fi];
    var exists = false;
    try { exists = typeof this[name] === 'function'; } catch(e) {}
    Logger.log('  ' + name + ': ' + (exists ? '✓' : '✗ MISSING'));
    if (!exists) allOk = false;
  }

  Logger.log('─── HTML Files (2-Surface Architecture) ───');
  var activeFiles = ['TheVein', 'ThePulse', 'Vault', 'KidsHub', 'TheSpine', 'TheSoul', 'StoryLibrary',
    'HomeworkModule', 'SparkleLearning', 'fact-sprint', 'reading-module', 'writing-module',
    'wolfkid-power-scan', 'investigation-module', 'daily-missions', 'BaselineDiagnostic',
    'StoryReader', 'ComicStudio', 'ProgressReport', 'WolfkidCER', 'DesignDashboard', 'JJHome'];
  for (var ai = 0; ai < activeFiles.length; ai++) {
    var fname = activeFiles[ai];
    try {
      HtmlService.createHtmlOutputFromFile(fname);
      Logger.log('  ' + fname + '.html: ✓ ACTIVE');
    } catch(e) {
      Logger.log('  ' + fname + '.html: ✗ NOT FOUND');
      allOk = false;
    }
  }

  var legacyFiles = ['Debt_Simulator', 'JTDashboard', 'WeeklyTracker', 'ThePulse_old', 'LTDashboard', 'AnalystConsole', 'OperatorDashboard', 'TheBoard'];
  for (var li = 0; li < legacyFiles.length; li++) {
    try {
      HtmlService.createHtmlOutputFromFile(legacyFiles[li]);
      Logger.log('  ' + legacyFiles[li] + '.html: ⚠ LEGACY (still exists)');
    } catch(e) {
      Logger.log('  ' + legacyFiles[li] + '.html: — removed (expected)');
    }
  }

  Logger.log('─── Data Engine ───');
  try {
    var months = getAvailableMonths();
    Logger.log('  getAvailableMonths(): ✓ (' + (months ? months.length : 0) + ' months)');
  } catch(e) {
    Logger.log('  getAvailableMonths(): ✗ ' + e.message);
    allOk = false;
  }

  try {
    var n = new Date();
    var testStart = n.getFullYear() + '-' + leftPad2_(n.getMonth()+1) + '-01';
    var testEnd = n.getFullYear() + '-' + leftPad2_(n.getMonth()+1) + '-' + leftPad2_(n.getDate());
    var data = getData(testStart, testEnd, true);
    Logger.log('  getData(): ✓');
    Logger.log('    earnedIncome: $' + data.earnedIncome);
    Logger.log('    debtCurrent: $' + data.debtCurrent);
    Logger.log('    _meta.version: ' + (data._meta ? data._meta.version : 'MISSING'));
    var raw = JSON.stringify(data);
    var nanCount = (raw.match(/\bNaN\b/g) || []).length;
    var undCount = (raw.match(/\bundefined\b/g) || []).length;
    if (nanCount > 0 || undCount > 0) {
      Logger.log('  ⚠ WARNING: ' + nanCount + ' NaN and ' + undCount + ' undefined');
    } else {
      Logger.log('  ✓ No NaN/undefined');
    }
  } catch(e) {
    Logger.log('  getData(): ✗ ' + e.message);
    allOk = false;
  }

  Logger.log('─── Navigation ───');
  try {
    Logger.log('  Script URL: ' + ScriptApp.getService().getUrl());
  } catch(e) {
    Logger.log('  Script URL: ✗ ' + e.message);
  }

  Logger.log('─── Cascade Engine ───');
  try {
    var parsed = parseDebtExport();
    Logger.log('  parseDebtExport(): ✓ (active: ' + parsed.active.length + ', excluded: ' + parsed.excluded.length + ')');
  } catch(e) {
    Logger.log('  parseDebtExport(): ✗ ' + e.message);
    allOk = false;
  }

  Logger.log('─── Legacy Checks ───');
  var ss = SpreadsheetApp.openById(SSID);
  var pe = ss.getSheetByName(TAB_MAP['Partner_Export'] || 'Partner_Export');
  Logger.log('  Partner_Export: ' + (pe ? '✓ (' + pe.getLastRow() + ' rows)' : '✗ NOT FOUND'));

  Logger.log('─── GAS Hardening (v38) ───');
  var hardeningSheets = ['💻 ErrorLog', '💻 PerfLog', '💻 Snapshots'];
  for (var hi = 0; hi < hardeningSheets.length; hi++) {
    var hSheet = ss.getSheetByName(hardeningSheets[hi]);
    Logger.log('  ' + hardeningSheets[hi] + ': ' + (hSheet ? '✓ (' + hSheet.getLastRow() + ' rows)' : '— not created yet'));
  }

  var triggers = ScriptApp.getProjectTriggers();
  Logger.log('  Triggers installed: ' + triggers.length + '/20');
  for (var ti = 0; ti < triggers.length; ti++) {
    Logger.log('    → ' + triggers[ti].getHandlerFunction());
  }

  try {
    pushQAResult({
      surface: 'System', version: 'v' + getCodeVersion(),
      gate: 'Health Check', status: allOk ? 'PASS' : 'FAIL',
      details: allOk ? 'All checks passed' : 'Issues found',
      values: { codeGs: 'v' + getCodeVersion() }
    });
    Logger.log('📤 Results pushed to Notion QA Log');
  } catch (e) {
    Logger.log('⚠️ Notion push failed (non-blocking): ' + e.message);
  }
  Logger.log('═══════════════════════════════');
  Logger.log(allOk ? '✓ ALL CHECKS PASSED' : '✗ ISSUES FOUND');
}


// ════════════════════════════════════════════════════════════════════
// 5. AUTOMATED GATE ALERTING
// ════════════════════════════════════════════════════════════════════

function runDailyGateCheck() {
  try {
    try { runMERGates(); } catch(e) { Logger.log('runMERGates error (non-fatal): ' + e.message); }
    var status = getMERGateStatus();
    if (!status || status.error) return;
    if (status.allPassing) { Logger.log('Gate check: all passing ✓'); return; }
    var subject = '\uD83D\uDD34 Thompson Dashboard: ' + status.failCount + ' QA gate(s) failing';
    var body = 'Daily Gate Check — ' + new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'}) + '\n\n'
      + 'RESULT: ' + status.failCount + ' FAILING · ' + status.warnCount + ' WARNING · ' + status.passCount + ' PASSING (of ' + status.total + ')\n\n'
      + 'Action: Open QA_Gates sheet to review.';
    MailApp.sendEmail({ to: Session.getActiveUser().getEmail(), subject: subject, body: body });
    Logger.log('Gate check: alert sent — ' + status.failCount + ' failing');
  } catch(e) {
    Logger.log('runDailyGateCheck error: ' + e.message);
  }
}

function installDailyGateAlert() {
  removeDailyGateAlert();
  ScriptApp.newTrigger('runDailyGateCheck').timeBased().everyDays(1).atHour(6).nearMinute(0).create();
  Logger.log('✓ Daily gate alert installed');
}

function removeDailyGateAlert() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'runDailyGateCheck') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}


// ════════════════════════════════════════════════════════════════════
// 6. NOTION API BRIDGE
// ════════════════════════════════════════════════════════════════════
function notionApi_(endpoint, method, payload) {
  var token = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');
  if (!token) throw new Error('NOTION_API_KEY not found');
  var options = {
    method: method,
    headers: { 'Authorization': 'Bearer ' + token, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    muteHttpExceptions: true
  };
  if (payload && method !== 'get') options.payload = JSON.stringify(payload);
  var response = UrlFetchApp.fetch('https://api.notion.com' + endpoint, options);
  var code = response.getResponseCode();
  var body = JSON.parse(response.getContentText());
  if (code < 200 || code >= 300) throw new Error('Notion API ' + code + ': ' + (body.message || 'unknown'));
  return body;
}

function pushQAResult(result) {
  var dbId = PropertiesService.getScriptProperties().getProperty('NOTION_QA_DB_ID');
  if (!dbId) throw new Error('NOTION_QA_DB_ID not found');
  return notionApi_('/v1/pages', 'post', {
    parent: { database_id: dbId },
    properties: {
      'Run': { title: [{ text: { content: result.surface + ' ' + result.version + ' — ' + new Date().toISOString() } }] },
      'Surface': { select: { name: result.surface } },
      'Version': { rich_text: [{ text: { content: result.version || '' } }] },
      'Gate': { select: { name: result.gate || 'Health Check' } },
      'Status': { select: { name: result.status } },
      'Details': { rich_text: [{ text: { content: (result.details || '').substring(0, 2000) } }] },
      'Run Date': { date: { start: new Date().toISOString() } },
      'Values JSON': { rich_text: [{ text: { content: (result.values ? JSON.stringify(result.values) : '').substring(0, 2000) } }] }
    }
  });
}

function isPipelineUrl_(value) {
  if (!value) return false;
  var str = String(value);
  return str.indexOf('https://') === 0 || str.indexOf('http://') === 0;
}

function pipelineStatusForType_(type) {
  var map = {
    deploy_complete: 'PASS',
    tests_failed: 'FAIL',
    review_ready: 'READY',
    fix_needed: 'ACTION_NEEDED',
    fix_pushed: 'INFO',
    pipeline_stalled: 'STOPPED'
  };
  return map[type] || 'INFO';
}

function normalizePipelinePayload_(payload) {
  var props = PropertiesService.getScriptProperties();
  var expectedSecret = props.getProperty('PIPELINE_SECRET');
  var safePayload = payload || {};
  var allowedTypes = {
    deploy_complete: true,
    tests_failed: true,
    review_ready: true,
    fix_needed: true,
    fix_pushed: true,
    pipeline_stalled: true
  };
  if (!expectedSecret) {
    return { ok: false, error: 'PIPELINE_SECRET not configured' };
  }
  if (String(safePayload.secret || '') !== expectedSecret) {
    return { ok: false, error: 'Invalid pipeline secret' };
  }
  var type = String(safePayload.type || '');
  if (!allowedTypes[type]) {
    return { ok: false, error: 'Unsupported pipeline type: ' + type };
  }
  var repo = String(safePayload.repo || '').trim();
  if (!repo) {
    return { ok: false, error: 'repo is required' };
  }
  var summary = String(safePayload.summary || '').trim();
  if (!summary) {
    return { ok: false, error: 'summary is required' };
  }
  var truncated = false;
  if (summary.length > 500) {
    summary = summary.substring(0, 500);
    truncated = true;
  }
  var prNumber = safePayload.prNumber;
  if (prNumber !== null && prNumber !== undefined && prNumber !== '') {
    prNumber = parseInt(prNumber, 10);
    if (isNaN(prNumber)) prNumber = null;
  } else {
    prNumber = null;
  }
  var cycle = safePayload.cycle;
  if (cycle !== null && cycle !== undefined && cycle !== '') {
    cycle = parseInt(cycle, 10);
    if (isNaN(cycle)) cycle = null;
  } else {
    cycle = null;
  }
  return {
    ok: true,
    truncated: truncated,
    payload: {
      repo: repo,
      type: type,
      summary: summary,
      prNumber: prNumber,
      prUrl: isPipelineUrl_(safePayload.prUrl) ? String(safePayload.prUrl) : '',
      sha: String(safePayload.sha || '').substring(0, 40),
      runUrl: isPipelineUrl_(safePayload.runUrl) ? String(safePayload.runUrl) : '',
      cycle: cycle
    }
  };
}

function pushPipelineEvent_(payload) {
  var dbId = PropertiesService.getScriptProperties().getProperty('NOTION_PIPELINE_DB_ID');
  if (!dbId) {
    return { ok: false, skipped: true, error: 'NOTION_PIPELINE_DB_ID not found' };
  }

  var event = notionApi_('/v1/pages', 'post', {
    parent: { database_id: dbId },
    properties: {
      'Event': { title: [{ text: { content: payload.repo + ' ' + payload.type + ' — ' + new Date().toISOString() } }] },
      'Repo': { rich_text: [{ text: { content: payload.repo } }] },
      'Type': { rich_text: [{ text: { content: payload.type } }] },
      'Status': { rich_text: [{ text: { content: pipelineStatusForType_(payload.type) } }] },
      'Summary': { rich_text: [{ text: { content: payload.summary } }] },
      'PR Number': { number: payload.prNumber === null ? null : payload.prNumber },
      'PR URL': payload.prUrl ? { url: payload.prUrl } : { url: null },
      'SHA': { rich_text: [{ text: { content: payload.sha || '' } }] },
      'Run URL': payload.runUrl ? { url: payload.runUrl } : { url: null },
      'Cycle': { number: payload.cycle === null ? null : payload.cycle },
      'Timestamp': { date: { start: new Date().toISOString() } }
    }
  });

  return { ok: true, id: event.id, url: event.url };
}

function pipelineRelaySafe(payload) {
  return withMonitor_('pipelineRelaySafe', function() {
    var normalized = normalizePipelinePayload_(payload);
    if (!normalized.ok) return normalized;

    var safePayload = normalized.payload;
    var notification;
    var notion;

    try {
      notification = sendPipelineNotification_(safePayload.type, safePayload);
    } catch (notifyErr) {
      notification = { ok: false, error: notifyErr.message };
    }

    try {
      notion = pushPipelineEvent_(safePayload);
    } catch (notionErr) {
      notion = { ok: false, error: notionErr.message };
    }

    return {
      ok: !!(notification && notification.ok) || !!(notion && notion.ok),
      truncated: normalized.truncated,
      notification: notification,
      notion: notion,
      payload: safePayload
    };
  });
}

function testNotionConnection() {
  try {
    var token = PropertiesService.getScriptProperties().getProperty('NOTION_API_KEY');
    if (!token) { Logger.log('❌ NOTION_API_KEY not found'); return; }
    var me = notionApi_('/v1/users/me', 'get');
    Logger.log('✅ Connected as: ' + me.name);
    var dbId = PropertiesService.getScriptProperties().getProperty('NOTION_QA_DB_ID');
    if (dbId) {
      var db = notionApi_('/v1/databases/' + dbId, 'get');
      Logger.log('✅ QA Log accessible: ' + db.title[0].plain_text);
    }
    var pipelineDbId = PropertiesService.getScriptProperties().getProperty('NOTION_PIPELINE_DB_ID');
    if (pipelineDbId) {
      var pipelineDb = notionApi_('/v1/databases/' + pipelineDbId, 'get');
      Logger.log('✅ Pipeline Log accessible: ' + pipelineDb.title[0].plain_text);
    }
  } catch (e) { Logger.log('❌ Connection failed: ' + e.message); }
}


// ════════════════════════════════════════════════════════════════════
// 7. VEIN/PULSE RECONCILIATION
// ════════════════════════════════════════════════════════════════════
function resolveNestedKey_(obj, key) {
  if (obj == null || !key) return undefined;
  if (obj.hasOwnProperty(key)) return obj[key];
  var parts = key.split('.');
  var cur = obj;
  for (var i = 0; i < parts.length; i++) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}

// v50: Removed dead FIELD_MAP codepath (ENV-009). Core fields checked directly.
function reconcileVeinPulse() {
  var n = new Date();
  var ym = n.getFullYear() + '-' + leftPad2_(n.getMonth() + 1);
  var start = ym + '-01';
  var end = ym + '-' + new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
  var data = getData(start, end, true);
  var coreFields = ['earnedIncome','totalMoneyIn','operatingExpenses','netCashFlow','totalAssets','totalLiabilities','netWorth','liquidCash','debtCurrent','debtCurrentActive','debtPaymentsMTD','interestBurn.monthly','monthlySurplus','dscr','statusLevel'];
  var total = coreFields.length, passed = 0, failed = 0, failures = [];
  for (var i = 0; i < coreFields.length; i++) {
    var key = coreFields[i];
    var val = resolveNestedKey_(data, key);
    var isBad = (val === undefined || val === null || (typeof val === 'number' && isNaN(val)));
    if (isBad) { failed++; failures.push({ field: key, value: JSON.stringify(val) }); }
    else { passed++; }
  }
  var status = failed === 0 ? 'PASS' : 'FAIL';
  var result = { status: status, total: total, passed: passed, failed: failed, failures: failures, checkedAt: new Date().toISOString(), dataMonth: ym };
  try { pushQAResult({ surface: 'Reconcile', version: 'v' + getCodeVersion(), gate: 'Vein/Pulse Reconciliation', status: status, details: status === 'PASS' ? 'All ' + total + ' fields valid' : failed + ' failed', values: { passed: passed, failed: failed } }); } catch(e) { if (typeof logError_ === 'function') logError_('reconcile_pushQA', e); }
  try { writeReconcileStatus_(result); } catch(e) { if (typeof logError_ === 'function') logError_('reconcile_writeStatus', e); }
  return result;
}

function reconcileVeinPulseSafe() {
  return withMonitor_('reconcileVeinPulseSafe', function() {
    try { return reconcileVeinPulse(); }
    catch(e) { return { status: 'ERROR', error: e.message }; }
  });
}


// ════════════════════════════════════════════════════════════════════
// 8. RECONCILE STATUS SHEET + TRIGGER
// ════════════════════════════════════════════════════════════════════
function writeReconcileStatus_(result) {
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = TAB_MAP['RECONCILE_STATUS'] || 'RECONCILE_STATUS';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.getRange('A1:A3').setValues([['LAST_RECONCILE_AT'],['LAST_RECONCILE_STATUS'],['LAST_RECONCILE_VERSIONS']]);
    sheet.setColumnWidth(1, 220); sheet.setColumnWidth(2, 400);
  }
  var versions = 'DE v' + (function(){ try { return getDataEngineVersion(); } catch(e) { return '?'; } })()
    + ' · Code v' + getCodeVersion()
    + ' · CE v' + (function(){ try { return getCascadeEngineVersion(); } catch(e) { return '?'; } })();
  sheet.getRange('B1').setValue(new Date().toISOString());
  sheet.getRange('B2').setValue(result.status || 'UNKNOWN');
  sheet.getRange('B3').setValue(versions);
}

function getReconcileStatusSafe() {
  return withMonitor_('getReconcileStatusSafe', function() {
    try {
      var ss = SpreadsheetApp.openById(SSID);
      var sheet = ss.getSheetByName(TAB_MAP['RECONCILE_STATUS'] || 'RECONCILE_STATUS');
      if (!sheet) return { lastReconcileAt: null, lastReconcileStatus: 'UNKNOWN', lastReconcileVersions: '' };
      return {
        lastReconcileAt: sheet.getRange('B1').getValue() || null,
        lastReconcileStatus: sheet.getRange('B2').getValue() || 'UNKNOWN',
        lastReconcileVersions: sheet.getRange('B3').getValue() || ''
      };
    } catch(e) {
      return { lastReconcileAt: null, lastReconcileStatus: 'ERROR', error: e.message };
    }
  });
}

function installReconciliationTrigger() {
  removeReconciliationTrigger();
  ScriptApp.newTrigger('reconcileVeinPulse').timeBased().everyDays(1).atHour(2).nearMinute(0).create();
  Logger.log('✓ Nightly reconciliation trigger installed');
}

function removeReconciliationTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'reconcileVeinPulse') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}
// ── OPS HEALTH ENDPOINT ─────────────────────────────────────────
// Called via ?action=opsHealth — returns operator-facing system health summary
// Designed for the ops/ framework: one call = "is the whole system healthy?"
function getOpsHealth_() {
  var now = new Date();
  var health = {
    timestamp: now.toISOString(),
    overall: 'GREEN',
    surfaces: {},
    errors: {},
    perf: {},
    versions: {},
    triggers: {},
    education: {},
    scorecard: { overall: 6.2, anchor: 'eabc5b9', lastUpdated: '2026-04-04' }
  };

  // ── 1. SYSTEM HEALTH (delegates to GASHardening) ────────────
  try {
    var sysHealth = getSystemHealth();
    health.errors = sysHealth.errors || {};
    health.perf = sysHealth.perf || {};
    health.versions = sysHealth.versions || {};
    health.triggers = sysHealth.triggers || {};
    health.monthStatus = sysHealth.monthStatus || {};

    // Tiller sync status
    if (sysHealth.tillerSync && sysHealth.tillerSync.status === 'stale') {
      health.overall = 'WATCH';
      health.tillerSync = sysHealth.tillerSync;
    }

    // Error escalation
    if (health.errors.status === 'critical') health.overall = 'RED';
    else if (health.errors.status === 'warning' && health.overall !== 'RED') health.overall = 'WATCH';

    // Trigger health
    if (health.triggers.orphans > 0 && health.overall !== 'RED') health.overall = 'WATCH';

    // Month-close grace period escalation
    if (health.monthStatus.priorCloseStatus === 'overdue' && health.overall === 'GREEN') health.overall = 'WATCH';
  } catch(e) {
    health.systemHealthError = e.message;
    health.overall = 'RED';
  }

  // ── 2. SURFACE HEALTH (route existence + backing files) ─────
  var surfaceMap = {
    pulse: 'ThePulse', vein: 'TheVein', kidshub: 'KidsHub',
    soul: 'TheSoul', spine: 'TheSpine', sparkle: 'SparkleLearning',
    homework: 'HomeworkModule', wolfkid: 'WolfkidCER',
    'daily-missions': 'daily-missions', 'fact-sprint': 'fact-sprint',
    reading: 'reading-module', writing: 'writing-module',
    investigation: 'investigation-module', baseline: 'BaselineDiagnostic',
    'comic-studio': 'ComicStudio', wolfdome: 'DesignDashboard', 'sparkle-kingdom': 'JJHome',
    progress: 'ProgressReport', 'story-library': 'StoryLibrary',
    story: 'StoryReader', 'wolfkid-power-scan': 'wolfkid-power-scan'
  };
  var surfaceResults = {};
  var surfaceKeys = Object.keys(surfaceMap);
  for (var s = 0; s < surfaceKeys.length; s++) {
    var route = surfaceKeys[s];
    var file = surfaceMap[route];
    try {
      HtmlService.createHtmlOutputFromFile(file);
      surfaceResults[route] = 'GREEN';
    } catch(e) {
      surfaceResults[route] = 'RED';
      if (health.overall !== 'RED') health.overall = 'RED';
    }
  }
  health.surfaces = surfaceResults;
  health.surfaceCount = { total: surfaceKeys.length, green: 0, red: 0 };
  for (var s2 = 0; s2 < surfaceKeys.length; s2++) {
    if (surfaceResults[surfaceKeys[s2]] === 'GREEN') health.surfaceCount.green++;
    else health.surfaceCount.red++;
  }

  // ── 3. EDUCATION STATUS ─────────────────────────────────────
  try {
    var ss = SpreadsheetApp.openById(SSID);
    var eduTab = TAB_MAP && TAB_MAP['KH_Education'] ? TAB_MAP['KH_Education'] : null;
    if (eduTab) {
      var eduSheet = ss.getSheetByName(eduTab);
      health.education.tabExists = !!eduSheet;
      if (eduSheet) {
        health.education.rows = eduSheet.getLastRow() - 1;
        health.education.status = 'active';
      }
    } else {
      health.education.status = 'no_tab_mapping';
    }

    // KH heartbeat (cache age)
    try {
      var cache = CacheService.getScriptCache();
      var heartbeat = cache.get('kh_heartbeat');
      if (heartbeat) {
        var hbAge = (now.getTime() - new Date(heartbeat).getTime()) / 1000;
        health.education.heartbeatAgeSec = Math.round(hbAge);
        health.education.heartbeatStatus = hbAge < 300 ? 'fresh' : 'stale';
      } else {
        health.education.heartbeatStatus = 'no_heartbeat';
      }
    } catch(e) {}
  } catch(e) {
    health.education = { status: 'error', error: e.message };
  }

  // ── 4. ERROR RATE CHECK (configurable threshold) ────────────
  try {
    var errorThreshold = 5;
    try {
      var customET = PropertiesService.getScriptProperties().getProperty('ERROR_RATE_THRESHOLD');
      if (customET) errorThreshold = parseInt(customET, 10);
    } catch(e2) {}
    var errorSheet = SpreadsheetApp.openById(SSID).getSheetByName(TAB_MAP['ErrorLog'] || 'ErrorLog');
    if (errorSheet) {
      var cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      var errorData = errorSheet.getDataRange().getValues();
      var errorCount = 0;
      for (var ei = 1; ei < errorData.length; ei++) {
        if (errorData[ei][0] instanceof Date && errorData[ei][0] > cutoff) errorCount++;
      }
      health.errors.count24h = errorCount;
      health.errors.threshold = errorThreshold;
      health.errors.status = errorCount === 0 ? 'green' : errorCount <= errorThreshold ? 'warning' : 'critical';
      if (errorCount > errorThreshold && health.overall !== 'RED') health.overall = 'RED';
      else if (errorCount > 0 && health.overall === 'GREEN') health.overall = 'WATCH';
    }
  } catch(e3) {
    health.errors.checkError = e3.message;
  }

  // ── 5. TILLER FRESHNESS (configurable threshold) ───────────
  try {
    var tillerThreshold = 72;
    try {
      var customTH = PropertiesService.getScriptProperties().getProperty('TILLER_STALE_HOURS');
      if (customTH) tillerThreshold = parseInt(customTH, 10);
    } catch(e4) {}
    health.tillerFreshness = { thresholdHours: tillerThreshold };
    if (health.tillerSync && health.tillerSync.staleAccounts) {
      health.tillerFreshness.staleCount = health.tillerSync.staleAccounts.length;
      health.tillerFreshness.status = health.tillerSync.staleAccounts.length === 0 ? 'green' : 'yellow';
    }
  } catch(e5) {}

  // ── 6. RISK SUMMARY (computed, not hardcoded) ──────────────
  var risks = [];
  if (health.errors.count24h > 0) risks.push('P1: ' + health.errors.count24h + ' errors in last 24h (threshold: ' + (health.errors.threshold || 5) + ')');
  if (health.surfaceCount && health.surfaceCount.red > 0) risks.push('P0: ' + health.surfaceCount.red + ' surfaces failed to load');
  if (health.triggers && health.triggers.orphans > 0) risks.push('P2: ' + health.triggers.orphans + ' orphan triggers');
  if (health.tillerSync && health.tillerSync.status === 'stale') risks.push('P1: Tiller data stale');
  if (health.monthStatus && health.monthStatus.priorCloseStatus === 'overdue') {
    risks.push('P1: ' + health.monthStatus.priorMonth + ' close overdue (' + health.monthStatus.daysSinceMonthEnd + 'd past month-end, grace period expired)');
  } else if (health.monthStatus && health.monthStatus.priorCloseStatus === 'pending') {
    risks.push('P2: ' + health.monthStatus.priorMonth + ' close pending (' + health.monthStatus.graceRemaining + 'd remaining in grace period)');
  }
  health.risks = risks;
  health.riskCount = risks.length;

  return health;
}

function getOpsHealthSafe() {
  return withMonitor_('getOpsHealthSafe', function() {
    return getOpsHealth_();
  });
}

// END OF FILE — Code.gs v88
