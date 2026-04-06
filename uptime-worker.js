/**
 * TBM Uptime Worker
 * Checks configured endpoints every 5 minutes (cron trigger).
 * UP = HTTP 200. Never parses response body.
 * Alerts only on state transitions; throttles persistent DOWN to 1/hr.
 *
 * Required env bindings:
 *   UPTIME_KV          — KV namespace (create in CF Dashboard → Workers & Pages → KV)
 *   PUSHOVER_TOKEN     — Pushover API token
 *   PUSHOVER_USER      — Pushover user/group key
 *   UPTIME_ENDPOINTS   — JSON array of endpoint objects: [{"name":"TBM","url":"https://..."}]
 *                        (store as Workers secret or plain env var)
 *
 * KV schema per endpoint (key = endpoint name):
 *   { status: "UP"|"DOWN", since: ms, lastAlertAt: ms }
 */

var PUSHOVER_API = 'https://api.pushover.net/1/messages.json';
var THROTTLE_MS  = 60 * 60 * 1000; // 1 hour between persistent-DOWN reminders
var FETCH_TIMEOUT_MS = 20000;       // 20-second timeout per check

// ── Scheduled entry point ────────────────────────────────────────────────────

addEventListener('scheduled', function(event) {
  event.waitUntil(runChecks(event));
});

// ── Manual fetch trigger (GET /check) for testing ───────────────────────────

addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  if (url.pathname === '/check') {
    event.respondWith(runChecks(event).then(function() {
      return new Response('Checks complete', { status: 200 });
    }).catch(function(e) {
      return new Response('Error: ' + e.message, { status: 500 });
    }));
  } else {
    event.respondWith(new Response('TBM Uptime Worker', { status: 200 }));
  }
});

// ── Core logic ───────────────────────────────────────────────────────────────

function runChecks(event) {
  var endpoints = parseEndpoints();
  if (!endpoints.length) {
    console.error('UPTIME_ENDPOINTS not configured');
    return Promise.resolve();
  }

  var promises = endpoints.map(function(ep) {
    return checkEndpoint(ep);
  });
  return Promise.all(promises);
}

function parseEndpoints() {
  try {
    var raw = (typeof UPTIME_ENDPOINTS !== 'undefined') ? UPTIME_ENDPOINTS : '[]';
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse UPTIME_ENDPOINTS: ' + e.message);
    return [];
  }
}

function checkEndpoint(ep) {
  var name = ep.name || ep.url;
  var url  = ep.url;

  return fetchWithTimeout(url, FETCH_TIMEOUT_MS)
    .then(function(resp) {
      var isUp = (resp.status === 200);
      return handleResult(name, url, isUp, resp.status, null);
    })
    .catch(function(err) {
      return handleResult(name, url, false, 0, err.message);
    });
}

function fetchWithTimeout(url, timeoutMs) {
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() {
      reject(new Error('Timeout after ' + timeoutMs + 'ms'));
    }, timeoutMs);

    fetch(url, { method: 'GET', redirect: 'follow' })
      .then(function(resp) {
        clearTimeout(timer);
        resolve(resp);
      })
      .catch(function(err) {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function handleResult(name, url, isUp, statusCode, errorMsg) {
  var kvKey = 'state:' + name;

  return readKVState(kvKey).then(function(prev) {
    var now       = Date.now();
    var newStatus = isUp ? 'UP' : 'DOWN';
    var prevStatus = prev ? prev.status : null;

    // ── No state change ──────────────────────────────────────────────────────
    if (prevStatus === newStatus) {
      // Persistent DOWN: send reminder if throttle window has elapsed
      if (!isUp) {
        var lastAlertAt = prev.lastAlertAt || 0;
        if (now - lastAlertAt >= THROTTLE_MS) {
          var since    = prev.since || now;
          var duration = formatDuration(now - since);
          var msg      = 'TBM DOWN (ongoing ' + duration + ') — ' + name +
                         ' returned ' + (statusCode || errorMsg) + ' — ' + formatTime(now);
          return sendPushover(msg, 1).then(function() {
            return writeKVState(kvKey, { status: 'DOWN', since: since, lastAlertAt: now });
          });
        }
      }
      // UP and was already UP — silence is healthy, nothing to do
      return Promise.resolve();
    }

    // ── State transition ─────────────────────────────────────────────────────
    var newState;
    if (isUp) {
      if (prevStatus === null) {
        // First check ever — initialize silently, no alert
        newState = { status: 'UP', since: now, lastAlertAt: 0 };
        return writeKVState(kvKey, newState);
      }
      // DOWN → UP: send recovery alert
      var downSince = prev.since || now;
      var downDur   = formatDuration(now - downSince);
      var recMsg    = 'TBM RECOVERED — ' + name + ' back online after ' + downDur;
      newState = { status: 'UP', since: now, lastAlertAt: 0 };
      return sendPushover(recMsg, 0).then(function() {
        return writeKVState(kvKey, newState);
      });
    } else {
      // UP → DOWN (or first check DOWN): send initial DOWN alert
      var downMsg = 'TBM DOWN — ' + name + ' returned ' +
                    (statusCode || errorMsg) + ' at ' + formatTime(now);
      newState = { status: 'DOWN', since: now, lastAlertAt: now };
      return sendPushover(downMsg, 1).then(function() {
        return writeKVState(kvKey, newState);
      });
    }
  });
}

// ── KV helpers ────────────────────────────────────────────────────────────────

function readKVState(key) {
  if (typeof UPTIME_KV === 'undefined') {
    console.warn('UPTIME_KV not bound — running stateless');
    return Promise.resolve(null);
  }
  return UPTIME_KV.get(key, 'json').then(function(val) {
    return val || null;
  }).catch(function(e) {
    console.error('KV read error: ' + e.message);
    return null;
  });
}

function writeKVState(key, state) {
  if (typeof UPTIME_KV === 'undefined') {
    return Promise.resolve();
  }
  return UPTIME_KV.put(key, JSON.stringify(state)).catch(function(e) {
    console.error('KV write error: ' + e.message);
  });
}

// ── Pushover helper ───────────────────────────────────────────────────────────

function sendPushover(message, priority) {
  if (typeof PUSHOVER_TOKEN === 'undefined' || typeof PUSHOVER_USER === 'undefined') {
    console.warn('Pushover credentials not configured — would send: ' + message);
    return Promise.resolve();
  }

  var body = JSON.stringify({
    token:    PUSHOVER_TOKEN,
    user:     PUSHOVER_USER,
    message:  message,
    title:    'TBM Uptime',
    priority: priority
  });

  return fetch(PUSHOVER_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    body
  }).then(function(resp) {
    if (!resp.ok) {
      console.error('Pushover returned ' + resp.status);
    }
  }).catch(function(e) {
    console.error('Pushover send failed: ' + e.message);
  });
}

// ── Utility ───────────────────────────────────────────────────────────────────

function formatDuration(ms) {
  var minutes = Math.floor(ms / 60000);
  if (minutes < 60) return minutes + ' min';
  var hours = Math.floor(minutes / 60);
  var rem   = minutes % 60;
  return rem > 0 ? hours + 'h ' + rem + 'm' : hours + 'h';
}

function formatTime(ms) {
  return new Date(ms).toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
}
