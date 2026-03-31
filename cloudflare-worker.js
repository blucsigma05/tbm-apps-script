// ═══════════════════════════════════════════════════════════════════
// TBM Smart Proxy v2.3 — thompsonfams.com
// Clean URLs + GAS API shim + goog stub
// ═══════════════════════════════════════════════════════════════════

const GAS_URL = 'https://script.google.com/macros/s/AKfycbweFe1QLmIAlr2x0umcJ-uc2EIm-ADdcjJ9QjihBr6tmnt4Axz6xO73lmwBl4Jk6_KVOw/exec';

// Clean URL → GAS query param mapping
const PATH_ROUTES = {
  '/buggsy': { page: 'kidshub', child: 'buggsy' },
  '/jj':     { page: 'kidshub', child: 'jj' },
  '/parent': { page: 'kidshub', view: 'parent' },
  '/pulse':  { page: 'pulse' },
  '/vein':   { page: 'vein' },
  '/spine':  { page: 'spine' },
  '/soul':   { page: 'soul' },
  '/vault':  { page: 'vault' }
};

export default {
  async fetch(request) {
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

    // Route: /api → proxy function calls to GAS
    if (url.pathname === '/api') {
      return handleApi(request, url);
    }

    // Route: everything else → serve HTML page
    return servePage(request, url);
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

    // Inject shim BEFORE any other scripts run
    if (html.indexOf('<head>') !== -1) {
      html = html.replace('<head>', '<head>\n' + getShimScript());
    } else if (html.indexOf('<HEAD>') !== -1) {
      html = html.replace('<HEAD>', '<HEAD>\n' + getShimScript());
    } else {
      html = getShimScript() + '\n' + html;
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
// HANDLE API — proxy function calls to GAS
// ═══════════════════════════════════════════════════════════════════

async function handleApi(request, url) {
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

  try {
    var response = await fetch(target, { redirect: 'follow' });
    var data = await response.text();

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
'    "khBatchApproveSafe","updateMealPlanSafe"\n' +
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
'  console.log("[TBM] Smart Proxy v2 — " + FNS.length + " functions via /api");\n' +
'})();\n' +
'</script>';
}
