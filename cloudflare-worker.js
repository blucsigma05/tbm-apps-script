// ════════════════════════════════════════════════════════════════════
// cloudflare-worker.js v1 — Cloudflare Worker proxy for thompsonfams.com
// Mirrors Code.gs servePage routes → GAS /exec deployment
// ════════════════════════════════════════════════════════════════════
//
// SETUP: Paste into Cloudflare Workers dashboard → thompsonfams.com worker
// ENV VAR: GAS_EXEC_URL = your /exec deployment URL (set in Worker Settings → Variables)
//
// ROUTE MAP (matches Code.gs servePage routes):
//   thompsonfams.com/              → ?page=pulse (default)
//   thompsonfams.com/pulse         → ?page=pulse
//   thompsonfams.com/vein          → ?page=vein
//   thompsonfams.com/buggsy        → ?page=buggsy
//   thompsonfams.com/jj            → ?page=jj
//   thompsonfams.com/parent        → ?page=parent
//   thompsonfams.com/kidshub       → ?page=kidshub
//   thompsonfams.com/spine         → ?page=spine
//   thompsonfams.com/soul          → ?page=soul
//   thompsonfams.com/homework      → ?page=homework
//   thompsonfams.com/sparkle       → ?page=sparkle
//   thompsonfams.com/facts         → ?page=facts
//   thompsonfams.com/reading       → ?page=reading
//   thompsonfams.com/writing       → ?page=writing
//   thompsonfams.com/story-library → ?page=story-library
//   thompsonfams.com/comic-studio  → ?page=comic-studio
//   thompsonfams.com/progress      → ?page=progress
//   thompsonfams.com/story         → ?page=story
//   thompsonfams.com/wolfkid       → ?page=wolfkid
//   thompsonfams.com/dashboard     → ?page=dashboard
//   thompsonfams.com/vault         → ?page=vault
//   thompsonfams.com/debt          → ?page=debt
//   thompsonfams.com/jt            → ?page=jt
//   thompsonfams.com/weekly        → ?page=weekly
//
// API PASSTHROUGH:
//   thompsonfams.com/?action=api&fn=XXX  → proxied to GAS /exec
//   thompsonfams.com/?action=runTests    → proxied to GAS /exec
//   thompsonfams.com/?action=version     → proxied to GAS /exec
// ════════════════════════════════════════════════════════════════════

// Valid page routes — must match Code.gs servePage routes object
var VALID_PAGES = [
  'pulse', 'vein', 'vault', 'kidshub', 'buggsy', 'jj', 'parent',
  'spine', 'soul', 'debt', 'jt', 'weekly', 'homework', 'sparkle',
  'wolfkid', 'dashboard', 'facts', 'reading', 'writing',
  'story-library', 'comic-studio', 'progress', 'story'
];

addEventListener('fetch', function(event) {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  var url = new URL(request.url);
  var pathname = url.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  var searchParams = url.searchParams;

  // If ?action= is present, proxy directly to GAS (API calls, runTests, version, htmlSource)
  if (searchParams.has('action')) {
    return proxyToGAS(url);
  }

  // If ?page= is already set (legacy URL format), proxy directly
  if (searchParams.has('page')) {
    return fetchAndServeHTML(searchParams.get('page'), searchParams);
  }

  // Clean URL routing: /buggsy → ?page=buggsy, / → ?page=pulse
  var page = pathname || 'pulse';

  // Check if it's a valid page route
  if (VALID_PAGES.indexOf(page) === -1) {
    // Unknown route — default to pulse
    page = 'pulse';
  }

  return fetchAndServeHTML(page, searchParams);
}

async function fetchAndServeHTML(page, searchParams) {
  // Build the GAS htmlSource URL
  var gasUrl = GAS_EXEC_URL + '?action=htmlSource&page=' + encodeURIComponent(page);

  // Pass through relevant query params (child, view, jt, etc.)
  var passthrough = ['child', 'view', 'jt'];
  for (var i = 0; i < passthrough.length; i++) {
    var key = passthrough[i];
    if (searchParams.has(key)) {
      gasUrl += '&' + key + '=' + encodeURIComponent(searchParams.get(key));
    }
  }

  try {
    var response = await fetch(gasUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'ThompsonFams-Worker/1.0' }
    });

    var html = await response.text();

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-TBM-Page': page
      }
    });
  } catch (err) {
    return new Response(
      '<html><body style="background:#0a0a0a;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">' +
      '<div style="text-align:center"><h1>Thompson Family</h1><p>Temporarily unavailable. Try again in a moment.</p>' +
      '<p style="color:#64748b;font-size:12px">' + err.message + '</p></div></body></html>',
      { status: 502, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

async function proxyToGAS(url) {
  // Rebuild the full query string and proxy to GAS
  var gasUrl = GAS_EXEC_URL + url.search;

  try {
    var response = await fetch(gasUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'ThompsonFams-Worker/1.0' }
    });

    var body = await response.text();
    var contentType = response.headers.get('Content-Type') || 'application/json';

    return new Response(body, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Proxy error: ' + err.message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
