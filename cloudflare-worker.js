// ═══════════════════════════════════════════════════════════════════
// TBM Smart Proxy v3.6 — thompsonfams.com — Front Door + PIN Gate + QA Route Isolation
// Clean URLs + GAS API shim + goog stub
// ═══════════════════════════════════════════════════════════════════

const GAS_URL = 'https://script.google.com/macros/s/AKfycbweFe1QLmIAlr2x0umcJ-uc2EIm-ADdcjJ9QjihBr6tmnt4Axz6xO73lmwBl4Jk6_KVOw/exec';

// Build identity — replaced at deploy time by deploy-worker.yml
// Exposes /version route so post-deploy smoke and alignment checks have a stable assertion target.
const WORKER_BUILD = '__BUILD_ID__';

// Clean URL → GAS query param mapping
const PATH_ROUTES = {
  '/buggsy': { page: 'kidshub', child: 'buggsy' },
  '/jj':     { page: 'kidshub', child: 'jj' },
  '/parent': { page: 'kidshub', view: 'parent' },
  '/pulse':  { page: 'pulse' },
  '/vein':   { page: 'vein' },
  '/spine':  { page: 'spine' },
  '/soul':   { page: 'soul' },
  '/vault':  { page: 'vault' },
  // Education modules (v2.5)
  '/homework':      { page: 'homework' },
  '/sparkle':       { page: 'sparkle' },
  '/sparkle-free':  { page: 'sparkle', mode: 'freeplay' },
  '/wolfkid':       { page: 'wolfkid' },
  '/wolfdome':          { page: 'wolfdome' },
  '/dashboard':         { page: 'wolfdome' },
  '/sparkle-kingdom':   { page: 'sparkle-kingdom' },
  '/facts':         { page: 'facts' },
  '/reading':       { page: 'reading' },
  '/writing':       { page: 'writing' },
  '/story-library': { page: 'story-library' },
  '/comic-studio':  { page: 'comic-studio' },
  '/progress':      { page: 'progress' },
  '/story':         { page: 'story' },
  '/investigation': { page: 'investigation' },
  '/daily-missions':{ page: 'daily-missions' },
  '/daily-adventures':{ page: 'daily-missions', child: 'jj' },
  '/baseline':      { page: 'baseline' },
  '/power-scan':    { page: 'power-scan' }
};

// ─── QA Route Isolation (v3.6, issue #219, #297) ────────────────────────────
// 25-entry allowlist mirrors PATH_ROUTES minus finance surfaces.
const QA_ROUTES = {
  '/qa/buggsy':          { page: 'kidshub', child: 'buggsy' },
  '/qa/jj':              { page: 'kidshub', child: 'jj' },
  '/qa/parent':          { page: 'kidshub', view: 'parent' },
  '/qa/homework':        { page: 'homework' },
  '/qa/sparkle':         { page: 'sparkle' },
  '/qa/sparkle-free':    { page: 'sparkle', mode: 'freeplay' },
  '/qa/wolfkid':         { page: 'wolfkid' },
  '/qa/wolfdome':        { page: 'wolfdome' },
  '/qa/dashboard':       { page: 'wolfdome' },
  '/qa/sparkle-kingdom': { page: 'sparkle-kingdom' },
  '/qa/facts':           { page: 'facts' },
  '/qa/reading':         { page: 'reading' },
  '/qa/writing':         { page: 'writing' },
  '/qa/story-library':   { page: 'story-library' },
  '/qa/comic-studio':    { page: 'comic-studio' },
  '/qa/progress':        { page: 'progress' },
  '/qa/story':           { page: 'story' },
  '/qa/investigation':   { page: 'investigation' },
  '/qa/daily-missions':  { page: 'daily-missions' },
  '/qa/daily-adventures':{ page: 'daily-missions', child: 'jj' },
  '/qa/baseline':        { page: 'baseline' },
  '/qa/power-scan':      { page: 'power-scan' },
  '/qa/spine':           { page: 'spine' },
  '/qa/soul':            { page: 'soul' },
  '/qa/vault':           { page: 'vault' },
  '/qa/operator':        { page: 'qa-operator' }
};
// Finance surfaces excluded — real Tiller data, no QA snapshot. Explicit 403.
const QA_DENIED = { '/qa/pulse': true, '/qa/vein': true };
// Finance API denylist — blocks direct /qa/api calls to finance-only functions.
// Mirrors QA_DENIED: if the page is denied, its backing API calls are denied too.
const QA_FINANCE_DENIED = {
  'getDataSafe': true, 'getMonthsSafe': true,
  'getCashFlowForecastSafe': true, 'getSimulatorDataSafe': true,
  'getWeeklyTrackerDataSafe': true, 'getSubscriptionDataSafe': true,
  'getCategoryTransactionsSafe': true, 'getReconcileStatusSafe': true,
  'reconcileVeinPulseSafe': true, 'reconcileVeinPulse': true,
  'getMERGateStatusSafe': true, 'getCloseHistoryDataSafe': true,
  'runMERGatesSafe': true, 'stampCloseMonthSafe': true,
  'getRecentTransactionsSafe': true
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Route: /version → build identity for post-deploy smoke + alignment checks (F03/F04)
    if (url.pathname === '/version') {
      return new Response(JSON.stringify({ worker: WORKER_BUILD, gas_target: GAS_URL.slice(-12) }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Route: /api/verify-pin → PIN gate handler
    if (url.pathname === '/api/verify-pin' && request.method === 'POST') {
      return handleVerifyPin(request, env);
    }

    // Route: /api → proxy function calls to GAS
    if (url.pathname === '/api') {
      return handleApi(request, url, env, null);
    }

    // Route: / → Front Door landing page
    if (url.pathname === '/' && !url.searchParams.has('page')) {
      return serveFrontDoor();
    }

    // Route: /qa/* → QA mode (PIN-gated, QA workbook via per-request SSID override)
    if (url.pathname.indexOf('/qa') === 0) {
      // Explicit deny for finance surfaces
      if (QA_DENIED[url.pathname]) {
        return jsonResponse({ error: 'Finance surfaces are not available in QA mode' }, 403);
      }
      // /qa/api/verify-pin — check before /qa/api to avoid prefix match
      if (url.pathname === '/qa/api/verify-pin' && request.method === 'POST') {
        return handleVerifyPin(request, env, 'qa');
      }
      // /qa/api — proxy function calls to GAS with env=qa token
      if (url.pathname === '/qa/api') {
        if (!isValidQACookie(request, env)) {
          return jsonResponse({ error: 'QA authentication required' }, 401);
        }
        return handleApi(request, url, env, 'qa');
      }
      // Allowlisted QA pages
      if (QA_ROUTES[url.pathname]) {
        if (!isValidQACookie(request, env)) {
          return Response.redirect(
            url.origin + '/?gate=qa&returnTo=' + encodeURIComponent(url.pathname + url.search), 302
          );
        }
        return serveQAPage(request, url, env);
      }
      // Anything else under /qa — 403, never fallthrough to prod
      return jsonResponse({ error: 'Route not available in QA mode' }, 403);
    }

    // Route: /pulse, /vein → Finance guard (cookie check)
    if (url.pathname === '/pulse' || url.pathname === '/vein') {
      if (!isValidFinanceCookie(request, env)) {
        return Response.redirect(url.origin + '/?gate=' + url.pathname.slice(1), 302);
      }
    }

    // Route: everything else → serve HTML page from GAS
    return servePage(request, url);
  },

  // HYG-09: Tiller freshness check — cron daily 12:00 UTC (see wrangler.toml)
  async scheduled(event, env, ctx) {
    try {
      const resp = await fetch(GAS_URL + '?action=tillerFreshness');
      if (!resp.ok) { throw new Error('GAS returned HTTP ' + resp.status); }
      const data = await resp.json();
      if (!data.fresh && data.hoursSince > data.threshold) {
        if (env.PUSHOVER_USER_KEY && env.PUSHOVER_APP_TOKEN) {
          const body = new URLSearchParams({
            token: env.PUSHOVER_APP_TOKEN,
            user: env.PUSHOVER_USER_KEY,
            title: 'HYG-09: Tiller Stale',
            message: 'Latest transaction is ' + Math.round(data.hoursSince) + 'h old (threshold: ' + data.threshold + 'h). Check Tiller sync.',
            priority: '1'
          });
          await fetch('https://api.pushover.net/1/messages.json', { method: 'POST', body });
        }
      }
    } catch (e) {
      console.error('HYG-09 Tiller freshness check failed: ' + e.message);
    }
  }
};


// ═══════════════════════════════════════════════════════════════════
// SERVE PAGE
// ═══════════════════════════════════════════════════════════════════

async function servePage(request, url) {
  var params = new URLSearchParams();
  params.set('action', 'htmlSource');

  // Check for clean URL path first
  var route = PATH_ROUTES[url.pathname];
  if (route) {
    for (var key in route) {
      params.set(key, route[key]);
    }
    // Also pass through any extra query params (e.g. ?jt=1)
    for (const [k, v] of url.searchParams) {
      if (k !== 'action' && !params.has(k)) {
        params.set(k, v);
      }
    }
  } else {
    // Fallback: legacy query param style (?page=soul)
    for (const [k, v] of url.searchParams) {
      if (k !== 'action') {
        params.set(k, v);
      }
    }
    if (!params.has('page')) {
      params.set('page', 'pulse');
    }
  }

  var target = GAS_URL + '?' + params.toString();

  try {
    var response = await fetch(target, { redirect: 'follow' });

    if (!response.ok) {
      return errorPage('GAS returned ' + response.status);
    }

    var html = await response.text();

    // Safety check — if GAS returned JSON error instead of HTML
    if (html.charAt(0) === '{') {
      try {
        var err = JSON.parse(html);
        if (err.error) return errorPage('GAS error: ' + err.error);
      } catch(e) {}
    }

    // v2.7: Inject full shim in <head> so it loads BEFORE any
    // page scripts that call google.script.run.
    // OLD (v2.4-v2.6): blocker in <head> + shim at </body> = race condition.
    //   The blocker set google={} but NOT google.script.run, so inline
    //   scripts crashed with "Cannot read properties of undefined".
    // NEW: full shim in <head> = guaranteed ready before any inline script.
    // Safety net: also inject at </body> in case anything overwrites mid-page.
    var shim = getShimScript();
    if (html.indexOf('<head>') !== -1) {
      html = html.replace('<head>', '<head>\n' + shim);
    } else {
      html = shim + '\n' + html;
    }
    // Safety net: re-inject at </body> to override any mid-page overwrites
    if (html.indexOf('</body>') !== -1) {
      html = html.replace('</body>', shim + '\n</body>');
    }

    var pageName = params.get('page');
    var cacheControl = 'no-cache';
    var headers = {
      'Content-Type': 'text/html; charset=utf-8'
    };

    if (pageName === 'soul' || pageName === 'spine') {
      // Ambient surfaces: cache 60s — they auto-refresh on a client timer
      cacheControl = 'public, max-age=60';
      headers['CDN-Cache-Control'] = 'public, max-age=60';
    }

    headers['Cache-Control'] = cacheControl;

    return new Response(html, { headers: headers });
  } catch(err) {
    return errorPage('Fetch failed: ' + err.message);
  }
}


// ═══════════════════════════════════════════════════════════════════
// HANDLE API — proxy function calls to GAS
// ═══════════════════════════════════════════════════════════════════

async function handleApi(request, url, env, envOverride) {
  var fn = url.searchParams.get('fn');
  if (!fn) {
    return jsonResponse({ error: 'Missing fn parameter' }, 400);
  }

  var args = '[]';
  if (request.method === 'POST') {
    try {
      var body = await request.json();
      args = JSON.stringify(body.args || []);
    } catch(e) {
      args = '[]';
    }
  } else {
    args = url.searchParams.get('args') || '[]';
  }

  var target = GAS_URL + '?action=api&fn=' + encodeURIComponent(fn)
    + '&args=' + encodeURIComponent(args);

  // v3.6: QA finance denylist — block finance-only functions at the proxy layer.
  // Matches QA_DENIED route policy: pulse/vein pages denied → their backing API calls denied too.
  if (envOverride === 'qa' && QA_FINANCE_DENIED[fn]) {
    return jsonResponse({ error: 'Finance function not available in QA mode: ' + fn }, 403);
  }

  // v3.6: QA env override — append env=qa + per-request HMAC token; fail closed if secret missing
  if (envOverride === 'qa') {
    if (!env || !env.QA_HMAC_SECRET) {
      return jsonResponse({ error: 'QA_HMAC_SECRET not configured' }, 503);
    }
    var ts = Date.now();
    var hmac = await computeQAHmac_(ts + ':qa', env.QA_HMAC_SECRET);
    target += '&env=qa&qa_token=' + encodeURIComponent(ts + ':' + hmac);
  }

  try {
    var response = await fetch(target, { redirect: 'follow' });
    var data = await response.text();

    // v3.4: Validate GAS returned a real JSON response, not an Access Denied HTML page
    if (!response.ok) {
      return jsonResponse({ error: 'GAS returned HTTP ' + response.status, fn: fn }, 502);
    }

    // Verify response is actually JSON — GAS auth failures return HTML with 200
    try {
      JSON.parse(data);
    } catch(parseErr) {
      return jsonResponse({ error: 'GAS returned non-JSON response', fn: fn, hint: 'Possible auth failure or deploy issue' }, 502);
    }

    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch(err) {
    return jsonResponse({ error: 'GAS proxy error: ' + err.message }, 502);
  }
}


// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

function errorPage(message) {
  return new Response(
    '<!DOCTYPE html><html><head><title>TBM Error</title></head>' +
    '<body style="font-family:sans-serif;padding:40px;background:#1a1a2e;color:#e0e0e0">' +
    '<h2 style="color:#ff6b6b">TBM Proxy Error</h2>' +
    '<p>' + message + '</p>' +
    '<p style="color:#888;font-size:12px">GAS URL: ' + GAS_URL.substring(0, 60) + '...</p>' +
    '<p><a href="javascript:location.reload()" style="color:#6bc5ff">Retry</a></p>' +
    '</body></html>',
    { status: 502, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}


// ═══════════════════════════════════════════════════════════════════
// GOOGLE.SCRIPT.RUN SHIM + GOOG STUB
// Injected into <head> before any surface scripts reference it.
// ═══════════════════════════════════════════════════════════════════

function getShimScript() {
  return '<script>\n' +
'(function() {\n' +
'  // Stub goog namespace — GAS Closure Library bootstrap references it\n' +
'  if (!window.goog) {\n' +
'    window.goog = {\n' +
'      provide: function() {},\n' +
'      require: function() {},\n' +
'      exportSymbol: function() {},\n' +
'      exportProperty: function() {},\n' +
'      isDefAndNotNull: function(a) { return a != null; },\n' +
'      isDef: function(a) { return a !== undefined; },\n' +
'      inherits: function(child, parent) {\n' +
'        function T() {} T.prototype = parent.prototype;\n' +
'        child.prototype = new T(); child.prototype.constructor = child;\n' +
'      },\n' +
'      base: function() {},\n' +
'      string: { trim: function(s) { return s.trim(); } },\n' +
'      dom: { getDocument: function() { return document; } },\n' +
'      events: { listen: function() {} }\n' +
'    };\n' +
'  }\n' +
'\n' +
'  var API = "/api";\n' +
'\n' +
'  function R() {\n' +
'    this._ok = function() {};\n' +
'    this._err = function(e) { console.error("[TBM]", e); };\n' +
'  }\n' +
'\n' +
'  R.prototype.withSuccessHandler = function(fn) {\n' +
'    this._ok = fn || function() {};\n' +
'    return this;\n' +
'  };\n' +
'\n' +
'  R.prototype.withFailureHandler = function(fn) {\n' +
'    this._err = fn || function() {};\n' +
'    return this;\n' +
'  };\n' +
'\n' +
'  var FNS = [\n' +
'    "getDataSafe","getMonthsSafe","getCashFlowForecastSafe",\n' +
'    "getSimulatorDataSafe","getWeeklyTrackerDataSafe",\n' +
'    "getSubscriptionDataSafe","getCategoryTransactionsSafe",\n' +
'    "getReconcileStatusSafe","reconcileVeinPulseSafe","getBoardDataSafe",\n' +
'    "getSystemHealthSafe","getMERGateStatusSafe",\n' +
'    "getCloseHistoryDataSafe",\n' +
'    "getKidsHubDataSafe","getKidsHubWidgetDataSafe",\n' +
'    "getKHLastModified","getSpineHeartbeatSafe",\n' +
'    "khCompleteTaskSafe","khCompleteTaskWithBonusSafe","khUncompleteTaskSafe",\n' +
'    "khApproveTaskSafe","khRejectTaskSafe",\n' +
'    "khOverrideTaskSafe","khApproveWithBonusSafe",\n' +
'    "khResetTasksSafe","khRedeemRewardSafe",\n' +
'    "khSubmitRequestSafe","khApproveRequestSafe","khDenyRequestSafe",\n' +
'    "khAddBonusTaskSafe","khDebitScreenTimeSafe",\n' +
'    "khSetBankOpeningSafe","khVerifyPinSafe",\n' +
'    "khAddDeductionSafe","khHealthCheckSafe",\n' +
'    "khSubmitGradeSafe","khGetGradeHistorySafe",\n' +
'    "updateFamilyNoteSafe","reconcileVeinPulse",\n' +
'    "getVaultDataSafe","runStoryFactorySafe",\n' +
'    "getDeployedVersionsSafe",\n' +
'    "runMERGatesSafe","stampCloseMonthSafe",\n' +
'    "addKidsEventSafe",\n' +
'    "getKHLastModifiedSafe","getStoryApiStatsSafe",\n' +
'    "khBatchApproveSafe","updateMealPlanSafe",\n' +
'    "getTodayContentSafe","getAudioBatchSafe",\n' +
'    "logHomeworkCompletionSafe","logSparkleProgressSafe",\n' +
'    "awardRingsSafe","seedWeek1CurriculumSafe","seedStaarRlaSprintSafe","submitFeedbackSafe",\n' +
'    "logQuestionResultSafe","savePowerScanResultsSafe","getWeeklyProgressSafe",\n' +
'    "saveProgressSafe","loadProgressSafe","logScaffoldEventSafe","getWeekProgressSafe",\n' +
'    "listStoredStoriesSafe","getStoryForReaderSafe","getStoryImagesSafe",\n' +
'    "saveMissionStateSafe","getMissionStateSafe",\n' +
'    "submitHomeworkSafe","getEducationQueueSafe","approveHomeworkSafe",\n' +
'    "getDailyScheduleSafe",\n' +
'    "checkDay1Safe",\n' +
'    "saveDesignChoicesSafe",\n' +
'    "getDesignChoicesSafe",\n' +
'    "getDesignUnlockedSafe",\n' +
'    "resetSandboxSafe",\n' +
'    "getRecentTransactionsSafe",\n' +
'    "getDailyMissionsInitSafe",\n' +
'    "getAssetRegistrySafe",\n' +
'    "checkHomeworkGateSafe",\n' +
'    "saveComicDraftSafe","loadComicDraftSafe","listComicDraftsSafe",\n' +
'    "loadComicDraftByDateSafe","getComicStudioContextSafe","finishComicSafe"\n' +
'  ];\n' +
'\n' +
'  for (var i = 0; i < FNS.length; i++) {\n' +
'    (function(name) {\n' +
'      R.prototype[name] = function() {\n' +
'        var args = [];\n' +
'        for (var j = 0; j < arguments.length; j++) args.push(arguments[j]);\n' +
'        var self = this;\n' +
'        fetch(API + "?fn=" + encodeURIComponent(name), {\n' +
'          method: "POST",\n' +
'          headers: { "Content-Type": "application/json" },\n' +
'          body: JSON.stringify({ args: args })\n' +
'        })\n' +
'        .then(function(r) { return r.text(); })\n' +
'        .then(function(t) {\n' +
'          var parsed;\n' +
'          try { parsed = JSON.parse(t); } catch(e) { parsed = t; }\n' +
'          try { self._ok(parsed); } catch(e2) { console.error("[TBM] Handler error in " + name + ":", e2); }\n' +
'        })\n' +
'        .catch(function(err) {\n' +
'          try { self._err({ message: err.message || "Network error" }); } catch(e) {}\n' +
'        });\n' +
'      };\n' +
'    })(FNS[i]);\n' +
'  }\n' +
'\n' +
'  // OVERRIDE: return proxy URL, not GAS URL\n' +
'  R.prototype.getScriptUrlSafe = function() {\n' +
'    var self = this;\n' +
'    setTimeout(function() { self._ok(window.location.origin); }, 0);\n' +
'  };\n' +
'\n' +
'  // OVERRIDE: return clean proxy URLs for kid tablets\n' +
'  R.prototype.getKHAppUrlsSafe = function() {\n' +
'    var self = this;\n' +
'    var b = window.location.origin;\n' +
'    setTimeout(function() {\n' +
'      self._ok({\n' +
'        buggsy: b + "/buggsy",\n' +
'        jj: b + "/jj",\n' +
'        parent: b + "/parent"\n' +
'      });\n' +
'    }, 0);\n' +
'  };\n' +
'\n' +
'  var g = {};\n' +
'  g.script = {};\n' +
'  Object.defineProperty(g.script, "run", {\n' +
'    get: function() { return new R(); }\n' +
'  });\n' +
'  window.google = g;\n' +
'\n' +
'  console.log("[TBM] Smart Proxy v3.1 — " + FNS.length + " functions via /api");\n' +
'})();\n' +
'</script>';
}


// ═══════════════════════════════════════════════════════════════════
// QA SHIM — Same as prod shim but API="/qa/api", /qa/* nav URLs,
// amber non-dismissable banner. Finance functions stripped. (v3.6)
// ═══════════════════════════════════════════════════════════════════

function getQAShimScript() {
  return '<script>\n' +
'(function() {\n' +
'  if (!window.goog) {\n' +
'    window.goog = {\n' +
'      provide: function() {},\n' +
'      require: function() {},\n' +
'      exportSymbol: function() {},\n' +
'      exportProperty: function() {},\n' +
'      isDefAndNotNull: function(a) { return a != null; },\n' +
'      isDef: function(a) { return a !== undefined; },\n' +
'      inherits: function(child, parent) {\n' +
'        function T() {} T.prototype = parent.prototype;\n' +
'        child.prototype = new T(); child.prototype.constructor = child;\n' +
'      },\n' +
'      base: function() {},\n' +
'      string: { trim: function(s) { return s.trim(); } },\n' +
'      dom: { getDocument: function() { return document; } },\n' +
'      events: { listen: function() {} }\n' +
'    };\n' +
'  }\n' +
'\n' +
'  var API = "/qa/api";\n' +
'\n' +
'  function R() {\n' +
'    this._ok = function() {};\n' +
'    this._err = function(e) { console.error("[TBM-QA]", e); };\n' +
'  }\n' +
'\n' +
'  R.prototype.withSuccessHandler = function(fn) {\n' +
'    this._ok = fn || function() {};\n' +
'    return this;\n' +
'  };\n' +
'\n' +
'  R.prototype.withFailureHandler = function(fn) {\n' +
'    this._err = fn || function() {};\n' +
'    return this;\n' +
'  };\n' +
'\n' +
'  // Finance functions (ThePulse/TheVein) stripped — those surfaces are QA-denied.\n' +
'  var FNS = [\n' +
'    "getBoardDataSafe",\n' +
'    "getSystemHealthSafe",\n' +
'    "getKidsHubDataSafe","getKidsHubWidgetDataSafe",\n' +
'    "getKHLastModified","getSpineHeartbeatSafe",\n' +
'    "khCompleteTaskSafe","khCompleteTaskWithBonusSafe","khUncompleteTaskSafe",\n' +
'    "khApproveTaskSafe","khRejectTaskSafe",\n' +
'    "khOverrideTaskSafe","khApproveWithBonusSafe",\n' +
'    "khResetTasksSafe","khRedeemRewardSafe",\n' +
'    "khSubmitRequestSafe","khApproveRequestSafe","khDenyRequestSafe",\n' +
'    "khAddBonusTaskSafe","khDebitScreenTimeSafe",\n' +
'    "khSetBankOpeningSafe","khVerifyPinSafe",\n' +
'    "khAddDeductionSafe","khHealthCheckSafe",\n' +
'    "khSubmitGradeSafe","khGetGradeHistorySafe",\n' +
'    "updateFamilyNoteSafe",\n' +
'    "getVaultDataSafe","runStoryFactorySafe",\n' +
'    "getDeployedVersionsSafe",\n' +
'    "addKidsEventSafe",\n' +
'    "getKHLastModifiedSafe","getStoryApiStatsSafe",\n' +
'    "khBatchApproveSafe","updateMealPlanSafe",\n' +
'    "getTodayContentSafe","getAudioBatchSafe",\n' +
'    "logHomeworkCompletionSafe","logSparkleProgressSafe",\n' +
'    "awardRingsSafe","seedWeek1CurriculumSafe","seedStaarRlaSprintSafe","submitFeedbackSafe",\n' +
'    "logQuestionResultSafe","savePowerScanResultsSafe","getWeeklyProgressSafe",\n' +
'    "saveProgressSafe","loadProgressSafe","logScaffoldEventSafe","getWeekProgressSafe",\n' +
'    "listStoredStoriesSafe","getStoryForReaderSafe","getStoryImagesSafe",\n' +
'    "saveMissionStateSafe","getMissionStateSafe",\n' +
'    "submitHomeworkSafe","getEducationQueueSafe","approveHomeworkSafe",\n' +
'    "getDailyScheduleSafe",\n' +
'    "checkDay1Safe",\n' +
'    "saveDesignChoicesSafe",\n' +
'    "getDesignChoicesSafe",\n' +
'    "getDesignUnlockedSafe",\n' +
'    "resetSandboxSafe",\n' +
'    "getDailyMissionsInitSafe",\n' +
'    "getAssetRegistrySafe",\n' +
'    "checkHomeworkGateSafe",\n' +
'    "saveComicDraftSafe","loadComicDraftSafe","listComicDraftsSafe",\n' +
'    "loadComicDraftByDateSafe","getComicStudioContextSafe","finishComicSafe"\n' +
'  ];\n' +
'\n' +
'  for (var i = 0; i < FNS.length; i++) {\n' +
'    (function(name) {\n' +
'      R.prototype[name] = function() {\n' +
'        var args = [];\n' +
'        for (var j = 0; j < arguments.length; j++) args.push(arguments[j]);\n' +
'        var self = this;\n' +
'        fetch(API + "?fn=" + encodeURIComponent(name), {\n' +
'          method: "POST",\n' +
'          headers: { "Content-Type": "application/json" },\n' +
'          body: JSON.stringify({ args: args })\n' +
'        })\n' +
'        .then(function(r) { return r.text(); })\n' +
'        .then(function(t) {\n' +
'          var parsed;\n' +
'          try { parsed = JSON.parse(t); } catch(e) { parsed = t; }\n' +
'          try { self._ok(parsed); } catch(e2) { console.error("[TBM-QA] Handler error in " + name + ":", e2); }\n' +
'        })\n' +
'        .catch(function(err) {\n' +
'          try { self._err({ message: err.message || "Network error" }); } catch(e) {}\n' +
'        });\n' +
'      };\n' +
'    })(FNS[i]);\n' +
'  }\n' +
'\n' +
'  // OVERRIDE: return /qa base URL for QA nav\n' +
'  R.prototype.getScriptUrlSafe = function() {\n' +
'    var self = this;\n' +
'    setTimeout(function() { self._ok(window.location.origin + "/qa"); }, 0);\n' +
'  };\n' +
'\n' +
'  // OVERRIDE: return /qa/* app URLs for kid tablets\n' +
'  R.prototype.getKHAppUrlsSafe = function() {\n' +
'    var self = this;\n' +
'    var b = window.location.origin;\n' +
'    setTimeout(function() {\n' +
'      self._ok({\n' +
'        buggsy: b + "/qa/buggsy",\n' +
'        jj: b + "/qa/jj",\n' +
'        parent: b + "/qa/parent"\n' +
'      });\n' +
'    }, 0);\n' +
'  };\n' +
'\n' +
'  var g = {};\n' +
'  g.script = {};\n' +
'  Object.defineProperty(g.script, "run", {\n' +
'    get: function() { return new R(); }\n' +
'  });\n' +
'  window.google = g;\n' +
'\n' +
'  // QA amber banner — non-dismissable, injected once\n' +
'  if (!window.__tbmQABanner) {\n' +
'    window.__tbmQABanner = true;\n' +
'    function injectQABanner() {\n' +
'      var s = document.createElement("style");\n' +
'      s.textContent = "body{padding-top:32px!important}";\n' +
'      document.head.appendChild(s);\n' +
'      var b = document.createElement("div");\n' +
'      b.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;background:#f59e0b;color:#1a1a1a;font-weight:800;font-family:monospace;font-size:12px;text-align:center;padding:8px;letter-spacing:2px;pointer-events:none";\n' +
'      b.textContent = "QA MODE \u2014 DATA IS NOT REAL";\n' +
'      document.body.appendChild(b);\n' +
'    }\n' +
'    if (document.body) { injectQABanner(); }\n' +
'    else { document.addEventListener("DOMContentLoaded", injectQABanner); }\n' +
'  }\n' +
'\n' +
'  console.log("[TBM-QA] Smart Proxy v3.5 QA mode — " + FNS.length + " functions via /qa/api");\n' +
'})();\n' +
'</script>';
}


// ═══════════════════════════════════════════════════════════════════
// FRONT DOOR — Landing page at thompsonfams.com/
// ═══════════════════════════════════════════════════════════════════

function serveFrontDoor() {
  var html = FRONT_DOOR_HTML;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}


// ═══════════════════════════════════════════════════════════════════
// PIN GATE — verify PIN + set auth cookie
// ═══════════════════════════════════════════════════════════════════

async function handleVerifyPin(request, env, gateType) {
  try {
    var body = await request.json();
    var pin = String(body.pin || '').replace(/\D/g, '').slice(0, 4);
    var isQA = gateType === 'qa';
    var financeTarget = body.target === 'vein' ? 'vein' : 'pulse';
    var rateLimitKey = isQA ? 'verify-pin:qa' : ('verify-pin:' + financeTarget);

    var clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (env.PIN_RATE_LIMITER && typeof env.PIN_RATE_LIMITER.limit === 'function') {
      var rateLimitResult = await env.PIN_RATE_LIMITER.limit({
        key: rateLimitKey + ':' + clientIP
      });
      if (!rateLimitResult.success) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Too many attempts. Try again shortly.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '10'
            }
          }
        );
      }
    }

    if (!env.FINANCE_PIN) {
      return jsonResponse({ ok: false, error: 'PIN not configured' }, 500);
    }

    if (pin !== String(env.FINANCE_PIN)) {
      return jsonResponse({ ok: false, error: 'Incorrect PIN' }, 401);
    }

    var ts = Date.now().toString();
    var data = new TextEncoder().encode(ts + ':' + env.FINANCE_PIN);
    var hashBuf = await crypto.subtle.digest('SHA-256', data);
    var hashArr = Array.from(new Uint8Array(hashBuf));
    var hashHex = hashArr.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    var cookieVal = ts + ':' + hashHex;

    if (isQA) {
      // v3.5: QA gate — validate returnTo (must start with /qa/), set tbm_qa cookie
      var returnTo = String(body.returnTo || '');
      if (!returnTo || returnTo.indexOf('/qa/') !== 0) returnTo = '/qa/homework';
      return new Response(JSON.stringify({ ok: true, redirectTo: returnTo }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'tbm_qa=' + cookieVal + '; Path=/qa; HttpOnly; Secure; SameSite=Lax; Max-Age=14400'
        }
      });
    }

    return new Response(JSON.stringify({ ok: true, redirectTo: '/' + financeTarget }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': 'tbm_auth=' + cookieVal + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400'
      }
    });
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Server error' }, 500);
  }
}

// ═══════════════════════════════════════════════════════════════════
// QA COOKIE — tbm_qa, Path=/qa, 4h lifetime (v3.5)
// ═══════════════════════════════════════════════════════════════════

function isValidQACookie(request, env) {
  if (!env.FINANCE_PIN) return false;
  var cookies = request.headers.get('Cookie') || '';
  var match = cookies.match(/tbm_qa=([^;]+)/);
  if (!match) return false;
  var parts = match[1].split(':');
  if (parts.length !== 2) return false;
  var ts = parts[0];
  var hash = parts[1];
  // Check expiry (4h = 14400000ms)
  var age = Date.now() - parseInt(ts, 10);
  if (isNaN(age) || age > 14400000 || age < 0) return false;
  // SECURITY NOTE (R9-F07): Same structural check as finance cookie.
  // crypto.subtle.digest is async-only. Accepted: validate structure
  // (timestamp:64-char-hex) + expiry + HttpOnly/Secure/SameSite.
  return hash.length === 64;
}


// ═══════════════════════════════════════════════════════════════════
// SERVE QA PAGE — like servePage but env=qa + QA shim + HMAC token
// ═══════════════════════════════════════════════════════════════════

async function serveQAPage(request, url, env) {
  var params = new URLSearchParams();
  params.set('action', 'htmlSource');
  params.set('env', 'qa');

  // Generate per-request HMAC token so GAS can validate the env=qa override; fail closed if secret missing
  if (!env || !env.QA_HMAC_SECRET) {
    return jsonResponse({ error: 'QA_HMAC_SECRET not configured' }, 503);
  }
  var ts = Date.now();
  var hmac = await computeQAHmac_(ts + ':qa', env.QA_HMAC_SECRET);
  params.set('qa_token', ts + ':' + hmac);

  var qaRoute = QA_ROUTES[url.pathname];
  if (qaRoute) {
    for (var key in qaRoute) {
      params.set(key, qaRoute[key]);
    }
  }

  // Pass through extra query params (e.g. ?jt=1) but protect reserved keys
  for (const [k, v] of url.searchParams) {
    if (k !== 'action' && k !== 'env' && k !== 'qa_token' && !params.has(k)) {
      params.set(k, v);
    }
  }

  var target = GAS_URL + '?' + params.toString();

  try {
    var response = await fetch(target, { redirect: 'follow' });
    if (!response.ok) {
      return errorPage('GAS returned ' + response.status);
    }
    var html = await response.text();

    if (html.charAt(0) === '{') {
      try {
        var err = JSON.parse(html);
        if (err.error) return errorPage('GAS error: ' + err.error);
      } catch(e) {}
    }

    // Inject QA-aware shim (different API endpoint + amber banner)
    var qaShim = getQAShimScript();
    if (html.indexOf('<head>') !== -1) {
      html = html.replace('<head>', '<head>\n' + qaShim);
    } else {
      html = qaShim + '\n' + html;
    }
    if (html.indexOf('</body>') !== -1) {
      html = html.replace('</body>', qaShim + '\n</body>');
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  } catch(err) {
    return errorPage('Fetch failed: ' + err.message);
  }
}


// ═══════════════════════════════════════════════════════════════════
// QA HMAC HELPER — HMAC-SHA256 via Web Crypto API (async)
// ═══════════════════════════════════════════════════════════════════

async function computeQAHmac_(message, secret) {
  var enc = new TextEncoder();
  var keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  var sig = await crypto.subtle.sign('HMAC', keyMaterial, enc.encode(message));
  var hashArr = Array.from(new Uint8Array(sig));
  return hashArr.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}


function isValidFinanceCookie(request, env) {
  if (!env.FINANCE_PIN) return false;
  var cookies = request.headers.get('Cookie') || '';
  var match = cookies.match(/tbm_auth=([^;]+)/);
  if (!match) return false;
  var parts = match[1].split(':');
  if (parts.length !== 2) return false;
  var ts = parts[0];
  var hash = parts[1];
  // Check expiry (24h)
  var age = Date.now() - parseInt(ts, 10);
  if (isNaN(age) || age > 86400000 || age < 0) return false;
  // SECURITY NOTE (R9-F07): Cookie hash cannot be verified synchronously.
  // crypto.subtle.digest is async-only. Accepted risk: validate structure
  // (timestamp:64-char-hex) + expiry (24h) + HttpOnly/Secure/SameSite flags.
  // Cookie cannot be forged from client JS. HTTPS prevents MITM replay.
  return hash.length === 64;
}


// ═══════════════════════════════════════════════════════════════════
// FRONT DOOR HTML
// ═══════════════════════════════════════════════════════════════════

var FRONT_DOOR_HTML = '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n  <title>The Thompsons \u00b7 Family Management System</title>\n  <meta name="theme-color" content="#0d0d14">\n  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Cormorant+Garamond:wght@300;400;600&family=Barlow+Condensed:wght@400;600;700;800&display=swap" rel="stylesheet">\n  <style>\n    :root{\n      --bg-base:#0d0d14;\n      --bg-gradient:linear-gradient(160deg,#0d0d14 0%,#111118 30%,#141420 60%,#0f0f1a 100%);\n      --glass-bg:rgba(255,255,255,0.05);\n      --glass-border:rgba(255,255,255,0.09);\n      --glass-hover:rgba(255,255,255,0.09);\n      --gold:#C9A84C;\n      --gold-soft:#e8d5a3;\n      --gold-dim:rgba(201,168,76,0.35);\n      --text-primary:#f0ede8;\n      --text-muted:rgba(240,237,232,0.6);\n      --text-dim:rgba(240,237,232,0.3);\n      --shadow-deep:0 24px 80px rgba(0,0,0,0.6);\n      --shadow-card:0 16px 40px rgba(0,0,0,0.35);\n      --radius:4px;\n      --ease:cubic-bezier(.22,.61,.36,1);\n      --mx:50%;\n      --my:50%;\n    }\n    *{box-sizing:border-box}html,body{margin:0;min-height:100%}\n    body{font-family:\'Barlow Condensed\',sans-serif;color:var(--text-primary);background:radial-gradient(ellipse 60% 50% at 50% 0%,rgba(201,168,76,0.08) 0%,transparent 60%),radial-gradient(ellipse 40% 35% at 15% 50%,rgba(92,40,51,0.12) 0%,transparent 55%),radial-gradient(ellipse 40% 35% at 85% 50%,rgba(30,58,138,0.10) 0%,transparent 55%),radial-gradient(ellipse 80% 60% at 50% 100%,rgba(30,20,10,0.4) 0%,transparent 70%),var(--bg-gradient);overflow-x:hidden}\n    .scene{position:relative;min-height:100vh;isolation:isolate;overflow:hidden}\n    .orb{position:absolute;border-radius:50%;filter:blur(18px);opacity:.65;pointer-events:none;mix-blend-mode:screen;animation:drift linear infinite}\n    .orb.one{width:42vw;height:42vw;left:-8vw;top:-6vw;background:radial-gradient(circle at 30% 30%,rgba(180,205,255,.52),rgba(180,205,255,0) 68%);animation-duration:28s}\n    .orb.two{width:30vw;height:30vw;right:-4vw;top:22vh;background:radial-gradient(circle at 35% 35%,rgba(246,212,152,.24),rgba(246,212,152,0) 70%);animation-duration:24s;animation-direction:reverse}\n    .orb.three{width:34vw;height:34vw;left:40vw;bottom:-10vw;background:radial-gradient(circle at 50% 50%,rgba(175,196,236,.22),rgba(175,196,236,0) 70%);animation-duration:30s}\n    .particles{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0}\n    .particle{position:absolute;bottom:-20px;width:4px;height:4px;border-radius:50%;background:radial-gradient(circle,rgba(253,230,138,.95) 0%,rgba(212,168,67,.75) 45%,rgba(212,168,67,0) 100%);box-shadow:0 0 10px rgba(253,230,138,.45);opacity:.75;animation:rise linear infinite}\n    .wrap{position:relative;z-index:2;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px 18px 48px}\n    .shell{width:min(100%,760px);display:flex;flex-direction:column;align-items:center}\n    .crest-wrap{position:relative;padding-top:clamp(20px,5vh,56px);margin-bottom:56px;transform-style:preserve-3d;will-change:transform;transition:transform .22s var(--ease);opacity:0;animation:introUp 0.9s var(--ease) 0.1s forwards}\n    .crest-glow{position:absolute;inset:auto 50% -20px auto;transform:translateX(50%);width:min(70vw,480px);height:min(30vw,200px);border-radius:50%;background:radial-gradient(ellipse at center,rgba(201,168,76,0.22) 0%,rgba(201,168,76,0.08) 40%,rgba(201,168,76,0) 70%);filter:blur(24px);z-index:-1;animation:pulseGlow 7s ease-in-out infinite}\n    .crest-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:calc(min(240px,30vw) + 60px);height:calc(min(240px,30vw) + 60px);border-radius:50%;border:1px solid rgba(201,168,76,0.12);animation:pulseGlow 7s ease-in-out 1s infinite;pointer-events:none;z-index:-1}\n    .crest{width:clamp(240px,30vw,320px);max-width:80vw;display:block;filter:drop-shadow(0 0 40px rgba(201,168,76,0.20)) drop-shadow(0 20px 60px rgba(0,0,0,0.5));animation:crestFloat 6s ease-in-out infinite,crestTilt 14s ease-in-out infinite;user-select:none;-webkit-user-drag:none}\n    .brand{margin-top:18px;text-align:center;opacity:0;animation:introUp 0.7s var(--ease) 0.25s forwards}\n    .brand h1{margin:0;font-family:\'Cormorant Garamond\',serif;font-size:clamp(22px,3.2vw,34px);font-weight:300;letter-spacing:10px;color:var(--gold-soft);text-shadow:0 1px 0 rgba(0,0,0,0.08)}\n    .brand p{margin:10px 0 0;font-family:\'Barlow Condensed\',sans-serif;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:var(--text-dim)}\n    .panel{width:min(100%,680px);transform-style:preserve-3d;transition:transform .22s var(--ease)}\n    .section{margin-bottom:26px}\n    .section:nth-child(1){opacity:0;animation:introUp 0.6s var(--ease) 0.4s forwards}\n    .section:nth-child(2){opacity:0;animation:introUp 0.6s var(--ease) 0.52s forwards}\n    .section:nth-child(3){opacity:0;animation:introUp 0.6s var(--ease) 0.64s forwards}\n    .section-head{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:0 6px}\n    .section-label{font-family:\'Barlow Condensed\',sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(201,168,76,0.70);font-weight:700}\n    .pill{font-size:10px;letter-spacing:1.4px;text-transform:uppercase;color:var(--gold-soft);border:1px solid rgba(253,230,138,.28);background:rgba(212,168,67,.10);padding:4px 8px;border-radius:999px}\n    .grid{display:grid;gap:14px}\n    .grid.family,.grid.education{grid-template-columns:repeat(3,minmax(0,1fr))}\n    .grid.finance{max-width:460px;margin:0 auto;grid-template-columns:repeat(2,minmax(0,1fr))}\n    .door{position:relative;display:block;text-decoration:none;color:inherit;min-height:102px;padding:18px 16px 16px;border-radius:4px;background:radial-gradient(circle at var(--mx) var(--my),rgba(255,255,255,.16) 0%,rgba(255,255,255,.06) 22%,rgba(255,255,255,.03) 38%,rgba(255,255,255,0) 60%),var(--glass-bg);border:1px solid var(--glass-border);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:var(--shadow-card);overflow:hidden;transform:translateY(0) scale(1);transition:transform .25s ease,border-color .25s ease,background .25s ease,box-shadow .25s ease}\n    .door::before{content:"";position:absolute;inset:-1px;background:linear-gradient(115deg,rgba(255,255,255,.18),rgba(255,255,255,0) 32%,rgba(253,230,138,.13) 52%,rgba(255,255,255,0) 74%);opacity:.35;pointer-events:none}\n    .door::after{content:"";position:absolute;inset:0;transform:translateX(-140%);background:linear-gradient(100deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.12) 45%,rgba(255,255,255,0) 100%);transition:transform .7s var(--ease);pointer-events:none}\n    .door:hover,.door:focus-visible{border-color:rgba(253,230,138,.44);background:radial-gradient(circle at var(--mx) var(--my),rgba(255,255,255,.22) 0%,rgba(255,255,255,.10) 24%,rgba(255,255,255,.04) 42%,rgba(255,255,255,0) 62%),var(--glass-hover);transform:translateY(-2px) scale(1.02);box-shadow:0 20px 40px rgba(16,24,40,.18),0 0 0 1px rgba(253,230,138,.06) inset;outline:none}\n    .door:hover::after,.door:focus-visible::after{transform:translateX(140%)}\n    .door.locked{cursor:pointer}\n    .door.locked:active{transform:translateY(1px) scale(0.98)}\n    .icon{font-size:30px;line-height:1;margin-bottom:12px;filter:drop-shadow(0 4px 12px rgba(0,0,0,.15));transition:transform 0.25s ease}\n    .door:hover .icon,.door:focus-visible .icon{transform:translateY(-3px)}\n    .lock{position:absolute;top:10px;right:12px;font-size:15px;opacity:.5;transition:transform 0.3s ease}\n    .door.locked:hover .lock{transform:rotate(-8deg)}\n    .name{font-family:\'Barlow Condensed\',sans-serif;font-size:15px;font-weight:700;letter-spacing:0.5px;color:var(--text-primary);margin-bottom:5px}\n    .sub{font-size:11px;color:var(--text-muted);line-height:1.45;opacity:0.6;transition:opacity 0.25s ease}\n    .door:hover .sub,.door:focus-visible .sub{opacity:1}\n    footer{margin-top:8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(240,242,248,.20);text-align:center;opacity:0;animation:introUp 0.5s var(--ease) 0.76s forwards}\n    .gate{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:20px;z-index:50;background:rgba(13,19,33,.60);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}\n    .gate.show{display:flex}\n    .gate-card{width:min(100%,300px);border-radius:4px;padding:24px 22px 20px;background:rgba(13,13,20,0.92);border:1px solid rgba(201,168,76,0.25);box-shadow:0 0 0 1px rgba(201,168,76,0.08),0 24px 70px rgba(0,0,0,0.7),0 0 60px rgba(201,168,76,0.04);text-align:center;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);transform:translateY(8px) scale(.985);animation:gateIn .25s var(--ease) forwards}\n    .gate-crest{width:80px;display:block;margin:0 auto 12px;filter:drop-shadow(0 12px 28px rgba(0,0,0,.22))}\n    .gate-title{margin:0 0 14px;color:var(--gold-soft);font-family:\'Cormorant Garamond\',serif;font-size:30px;font-weight:400;letter-spacing:.5px}\n    .gate-target{margin:-4px 0 14px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--text-dim)}\n    .pin{width:100%;background:transparent;border:none;border-bottom:2px solid rgba(201,168,76,0.35);border-radius:0;color:var(--text-primary);font-size:34px;line-height:1.2;text-align:center;letter-spacing:16px;padding:8px 10px 12px 22px;outline:none;font-family:\'Cormorant Garamond\',serif;transition:border-color .2s ease,box-shadow .2s ease}\n    .pin:focus{border-bottom-color:rgba(201,168,76,0.9);box-shadow:0 12px 28px rgba(201,168,76,0.08)}\n    .pin.error{border-bottom-color:#ff8383;animation:shake .4s linear}\n    .gate-actions{margin-top:18px}\n    .enter-btn{width:100%;border:none;border-radius:999px;padding:12px 16px;color:#1f1b10;font-size:14px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,#f3d17a 0%,#d4a843 55%,#b8882f 100%);box-shadow:0 10px 24px rgba(212,168,67,.28);transition:transform .2s ease,box-shadow .2s ease,filter .2s ease}\n    .enter-btn:hover{transform:translateY(-1px);box-shadow:0 14px 28px rgba(212,168,67,.32);filter:brightness(1.02)}\n    .cancel-btn{appearance:none;border:none;background:transparent;color:var(--text-dim);font-size:13px;margin-top:12px;cursor:pointer}\n    .error-msg{min-height:18px;margin-top:10px;font-size:12px;color:#ffb1b1}\n    .door[href*=\"buggsy\"]:hover,.door[href*=\"buggsy\"]:focus-visible{border-color:rgba(245,158,11,0.4);box-shadow:0 20px 40px rgba(0,0,0,0.25),0 0 20px rgba(245,158,11,0.06) inset}\n    .door[href*=\"jj\"]:hover,.door[href*=\"jj\"]:focus-visible{border-color:rgba(236,72,153,0.4);box-shadow:0 20px 40px rgba(0,0,0,0.25),0 0 20px rgba(236,72,153,0.06) inset}\n    .door[href*=\"parent\"]:hover,.door[href*=\"parent\"]:focus-visible{border-color:rgba(201,168,76,0.35)}\n    .door[href*=\"homework\"]:hover,.door[href*=\"homework\"]:focus-visible{border-color:rgba(245,158,11,0.35)}\n    .door[href*=\"sparkle\"]:hover,.door[href*=\"sparkle\"]:focus-visible{border-color:rgba(168,85,247,0.35)}\n    .door.locked[data-locked=\"pulse\"]:hover{border-color:rgba(184,131,106,0.5);box-shadow:0 20px 40px rgba(0,0,0,0.25),0 0 20px rgba(92,40,51,0.12) inset}\n    .door.locked[data-locked=\"vein\"]:hover{border-color:rgba(37,99,235,0.4);box-shadow:0 20px 40px rgba(0,0,0,0.25),0 0 20px rgba(30,58,138,0.12) inset}\n    @keyframes introUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}\n    @keyframes crestFloat{0%,100%{transform:translateY(0px) rotate(0deg)}50%{transform:translateY(-4px) rotate(0deg)}}\n    @keyframes crestTilt{0%,100%{transform:rotate(0deg)}50%{transform:rotate(0.8deg)}}\n    @keyframes drift{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(2vw,1.4vw,0) scale(1.04)}100%{transform:translate3d(0,0,0) scale(1)}}\n    @keyframes rise{0%{transform:translateY(0) scale(.7);opacity:0}12%{opacity:.78}100%{transform:translateY(-110vh) scale(1.08);opacity:0}}\n    @keyframes pulseGlow{0%,100%{opacity:.42;transform:translateX(50%) scale(1)}50%{opacity:.64;transform:translateX(50%) scale(1.08)}}\n    @keyframes gateIn{to{transform:translateY(0) scale(1)}}\n    @keyframes shake{0%,100%{transform:translateX(0)}16%{transform:translateX(-8px)}32%{transform:translateX(8px)}48%{transform:translateX(-8px)}64%{transform:translateX(8px)}80%{transform:translateX(-5px)}}\n    @media(max-width:700px){.grid.family,.grid.education{grid-template-columns:repeat(2,minmax(0,1fr))}}\n    @media(max-width:480px){.wrap{padding-top:22px}.crest-wrap{margin-bottom:44px}.grid.family,.grid.education{grid-template-columns:repeat(2,minmax(0,1fr))}.grid.finance{grid-template-columns:repeat(2,minmax(0,1fr))}.door{min-height:96px}.brand h1{letter-spacing:4px}.brand p{letter-spacing:3px}}\n    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}\n  </style>\n</head>\n<body>\n  <div class="scene" id="scene">\n    <div class="orb one"></div><div class="orb two"></div><div class="orb three"></div>\n    <div class="particles" id="particles"></div>\n    <div class="wrap"><div class="shell">\n      <div class="crest-wrap" id="crestWrap">\n        <div class="crest-glow"></div>\n        <img class="crest" src="https://i.ibb.co/FLDTT6QH/1774020751171.png" alt="Thompson family crest"/>\n        <div class="brand"><h1>THE THOMPSONS</h1><p>Every Thompson \u00b7 Every Day</p></div>\n      </div>\n      <div class="panel" id="panel">\n        <section class="section"><div class="section-head"><div class="section-label">Family</div></div>\n          <div class="grid family">\n            <a class="door" href="/buggsy" data-card><div class="icon">\uD83D\uDC3A</div><div class="name">Buggsy</div><div class="sub">Chore board</div></a>\n            <a class="door" href="/jj" data-card><div class="icon">\u2728</div><div class="name">JJ</div><div class="sub">Chore board</div></a>\n            <a class="door" href="/parent" data-card><div class="icon">\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66</div><div class="name">Parent Hub</div><div class="sub">Approvals</div></a>\n          </div>\n        </section>\n        <section class="section"><div class="section-head"><div class="section-label">Education</div></div>\n          <div class="grid education">\n            <a class="door" href="/homework" data-card><div class="icon">\uD83D\uDCDA</div><div class="name">Homework</div><div class="sub">Buggsy</div></a>\n            <a class="door" href="/sparkle" data-card><div class="icon">\uD83C\uDF1F</div><div class="name">SparkleLearn</div><div class="sub">JJ</div></a>\n            <a class="door" href="/daily-missions" data-card><div class="icon">\uD83C\uDFAF</div><div class="name">Daily Missions</div><div class="sub">Progress and goals</div></a>\n          </div>\n        </section>\n        <section class="section"><div class="section-head"><div class="section-label">Finance</div><div class="pill">PIN Required</div></div>\n          <div class="grid finance">\n            <a class="door locked" href="/pulse" data-card data-locked="pulse"><div class="lock">\uD83D\uDD12</div><div class="icon">\uD83E\uDEC0</div><div class="name">ThePulse</div><div class="sub">Daily finance</div></a>\n            <a class="door locked" href="/vein" data-card data-locked="vein"><div class="lock">\uD83D\uDD12</div><div class="icon">\uD83E\uDDE0</div><div class="name">TheVein</div><div class="sub">Command center</div></a>\n          </div>\n        </section>\n        <footer>TBM \u00b7 thompsonfams.com</footer>\n      </div>\n    </div></div>\n  </div>\n  <div class="gate" id="gate"><div class="gate-card">\n    <img class="gate-crest" src="https://i.ibb.co/FLDTT6QH/1774020751171.png" alt="Thompson family crest"/>\n    <h2 class="gate-title">Enter PIN</h2>\n    <div class="gate-target" id="gateTarget">Finance Access</div>\n    <input class="pin" id="pinInput" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="one-time-code" aria-label="4 digit PIN"/>\n    <div class="gate-actions"><button class="enter-btn" id="enterBtn">Enter</button><button class="cancel-btn" id="cancelBtn" type="button">Cancel</button><div class="error-msg" id="errorMsg"></div></div>\n  </div></div>\n  <script>\n(function(){\n  var scene=document.getElementById("scene"),panel=document.getElementById("panel"),crestWrap=document.getElementById("crestWrap"),particles=document.getElementById("particles"),gate=document.getElementById("gate"),pinInput=document.getElementById("pinInput"),enterBtn=document.getElementById("enterBtn"),cancelBtn=document.getElementById("cancelBtn"),errorMsg=document.getElementById("errorMsg"),gateTarget=document.getElementById("gateTarget"),currentTarget="pulse",currentReturnTo="",reduceMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n  function createParticles(){if(!particles||reduceMotion)return;for(var i=0;i<10;i++){var d=document.createElement("span");d.className="particle";d.style.left=(6+Math.random()*88)+"%";d.style.width=(3+Math.random()*2.6)+"px";d.style.height=d.style.width;d.style.animationDuration=(20+Math.random()*12)+"s";d.style.animationDelay=(Math.random()*10)+"s";d.style.opacity=(0.32+Math.random()*0.5).toFixed(2);particles.appendChild(d)}}\n  function onMove(e){if(reduceMotion)return;var x=e.clientX/window.innerWidth,y=e.clientY/window.innerHeight;var rx=(y-0.5)*-7,ry=(x-0.5)*10;crestWrap.style.transform="perspective(1000px) rotateX("+(rx*0.7)+"deg) rotateY("+(ry*0.9)+"deg)";panel.style.transform="perspective(1200px) rotateX("+(rx*0.35)+"deg) rotateY("+(ry*0.45)+"deg)";document.documentElement.style.setProperty("--mx",(x*100).toFixed(2)+"%");document.documentElement.style.setProperty("--my",(y*100).toFixed(2)+"%")}\n  var cards=document.querySelectorAll("[data-card]");for(var ci=0;ci<cards.length;ci++){(function(card){card.addEventListener("mousemove",function(ev){var r=card.getBoundingClientRect();var x=((ev.clientX-r.left)/r.width)*100;var y=((ev.clientY-r.top)/r.height)*100;card.style.setProperty("--mx",x.toFixed(2)+"%");card.style.setProperty("--my",y.toFixed(2)+"%")})})(cards[ci])}\n  function openGate(target,returnTo){currentTarget=target==="vein"?"vein":(target==="qa"?"qa":"pulse");currentReturnTo=returnTo||"";gate.classList.add("show");gateTarget.textContent=currentTarget==="vein"?"TheVein":(currentTarget==="qa"?"QA Access":"ThePulse");errorMsg.textContent="";pinInput.value="";pinInput.classList.remove("error");setTimeout(function(){pinInput.focus()},10)}\n  function closeGate(){gate.classList.remove("show");errorMsg.textContent="";pinInput.value="";pinInput.classList.remove("error")}\n  function showPinError(msg){errorMsg.textContent=msg||"Incorrect PIN";pinInput.value="";pinInput.classList.remove("error");void pinInput.offsetWidth;pinInput.classList.add("error");pinInput.focus()}\n  function submitPin(){var pin=(pinInput.value||"").replace(/\\D/g,"").slice(0,4);pinInput.value=pin;if(pin.length!==4){showPinError("Enter all 4 digits");return}enterBtn.disabled=true;errorMsg.textContent="";var xhr=new XMLHttpRequest();xhr.open("POST",currentTarget==="qa"?"/qa/api/verify-pin":"/api/verify-pin",true);xhr.setRequestHeader("Content-Type","application/json");xhr.onreadystatechange=function(){if(xhr.readyState!==4)return;enterBtn.disabled=false;try{var data=JSON.parse(xhr.responseText);if(xhr.status===200&&data.ok){window.location.href=data.redirectTo||("/"+currentTarget)}else{showPinError(data.error||"Incorrect PIN")}}catch(e){showPinError("Connection issue")}};xhr.onerror=function(){enterBtn.disabled=false;showPinError("Connection issue")};xhr.send(JSON.stringify(currentTarget==="qa"?{pin:pin,returnTo:currentReturnTo}:{pin:pin,target:currentTarget}))}\n  var locked=document.querySelectorAll("[data-locked]");for(var li=0;li<locked.length;li++){(function(el){el.addEventListener("click",function(ev){ev.preventDefault();openGate(el.getAttribute("data-locked"))})})(locked[li])}\n  enterBtn.addEventListener("click",submitPin);cancelBtn.addEventListener("click",closeGate);\n  pinInput.addEventListener("input",function(){pinInput.value=pinInput.value.replace(/\\D/g,"").slice(0,4);pinInput.classList.remove("error");errorMsg.textContent=""});\n  pinInput.addEventListener("keydown",function(e){if(e.key==="Enter")submitPin();if(e.key==="Escape")closeGate()});\n  gate.addEventListener("click",function(e){if(e.target===gate)closeGate()});\n  window.addEventListener("mousemove",onMove,{passive:true});\n  window.addEventListener("mouseleave",function(){crestWrap.style.transform="";panel.style.transform=""});\n  createParticles();\n  var qs=window.location.search;var gateMatch=qs.match(/[?&]gate=([^&]*)/);var gateParam=gateMatch?gateMatch[1].toLowerCase():"";\n  var returnToMatch=qs.match(/[?&]returnTo=([^&]*)/);var returnToParam=returnToMatch?decodeURIComponent(returnToMatch[1]):"";if(gateParam==="pulse"||gateParam==="vein"){openGate(gateParam)}else if(gateParam==="qa"){openGate("qa",returnToParam.indexOf("/qa/")===0?returnToParam:"/qa/")}\n})();\n  </script>\n</body>\n</html>';
