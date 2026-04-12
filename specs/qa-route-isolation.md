# /qa/* Route Isolation

**Owner:** Opus (spec), Code (build), Codex (audit), LT (gate)
**Priority:** P2
**Status:** Draft
**Prerequisite:** specs/qa-operator-mode.md (shipped)

---

## 1. Problem Statement

`TBM_ENV` is global. Entering QA mode today requires LT to manually flip
a Script Property, which switches the **entire deployment** to the QA
workbook. Every surface — kids' tablets, kitchen TV, phone dashboards —
reads QA data until LT flips it back. If LT forgets, production is
broken for everyone.

**Goal:** `thompsonfams.com/qa/homework` just works — PIN-gated, reads
from QA workbook, writes to QA workbook — while
`thompsonfams.com/homework` continues serving production data. No manual
toggle. No blast radius.

**Why per-request override works:** Each GAS HTTP request runs in its
own V8 isolate. Overriding `SSID` (global var at `TBMConfig.gs:42`) in
`serveData()` affects only that request. The CF Worker adds `env=qa`
only for validated `/qa/*` requests.

---

## 2. QA Route Allowlist

Explicit table. No wildcards. Mirrors `PATH_ROUTES` in
`cloudflare-worker.js:9`.

| Route | Backing Page | QA-Eligible | Notes |
|-------|-------------|-------------|-------|
| `/qa/buggsy` | KidsHub (child=buggsy) | Yes | |
| `/qa/jj` | KidsHub (child=jj) | Yes | |
| `/qa/parent` | KidsHub (view=parent) | Yes | |
| `/qa/homework` | HomeworkModule | Yes | |
| `/qa/sparkle` | SparkleLearning | Yes | |
| `/qa/sparkle-free` | SparkleLearning (freeplay) | Yes | |
| `/qa/wolfkid` | WolfkidCER | Yes | |
| `/qa/wolfdome` | DesignDashboard | Yes | |
| `/qa/dashboard` | DesignDashboard | Yes | Alias |
| `/qa/sparkle-kingdom` | JJHome | Yes | |
| `/qa/facts` | fact-sprint | Yes | |
| `/qa/reading` | reading-module | Yes | |
| `/qa/writing` | writing-module | Yes | |
| `/qa/story-library` | StoryLibrary | Yes | |
| `/qa/comic-studio` | ComicStudio | Yes | |
| `/qa/progress` | ProgressReport | Yes | |
| `/qa/story` | StoryReader | Yes | |
| `/qa/investigation` | investigation-module | Yes | |
| `/qa/daily-missions` | daily-missions | Yes | |
| `/qa/daily-adventures` | daily-missions (child=jj) | Yes | |
| `/qa/baseline` | BaselineDiagnostic | Yes | |
| `/qa/power-scan` | wolfkid-power-scan | Yes | |
| `/qa/spine` | TheSpine | Yes | |
| `/qa/soul` | TheSoul | Yes | |
| `/qa/vault` | Vault | Yes | |
| `/qa/` | QA Operator dashboard | **No (Phase 2)** | No backing page exists yet. Requires QAOperator.html + route entry in Code.js. See OQ-4. |
| `/qa/pulse` | ThePulse | **No** | Finance surface excluded |
| `/qa/vein` | TheVein | **No** | Finance surface excluded |

### Denied-Route Behavior

```
GET /qa/pulse  → 403 { "error": "Finance surfaces are not available in QA mode" }
GET /qa/xyz    → 403 { "error": "Route not available in QA mode" }
```

Explicit 403, never silent fallthrough to prod.

---

## 3. Auth Model

### Token Lifecycle

1. User navigates to `thompsonfams.com/qa/homework`
2. CF Worker checks for `tbm_qa` cookie — not found
3. Redirects to `/?gate=qa&returnTo=/qa/homework`
4. Front Door renders PIN gate with "QA Access" label
5. User enters 4-digit PIN → POST `/qa/api/verify-pin`
6. Worker validates PIN against `env.FINANCE_PIN` (same PIN as finance)
7. On success, generates cookie:
   ```
   timestamp = Date.now()
   hash = SHA-256(timestamp + ":qa:" + env.FINANCE_PIN)
   cookie = timestamp + ":" + hex(hash)
   ```
8. Sets `tbm_qa` cookie: `Path=/qa; HttpOnly; Secure; SameSite=Lax; Max-Age=14400`
9. Returns `{ ok: true, redirectTo: "/qa/homework" }`

### Why a Separate Cookie

- `tbm_auth`: `Path=/`, 24h, finance access
- `tbm_qa`: `Path=/qa`, 4h, QA access
- Separate lifetimes, separate scopes, separate audit trail

### Validation

Same structural check as `isValidFinanceCookie` (line 491):
- Cookie parses as `timestamp:64-char-hex`
- Timestamp within 4 hours
- (R9-F07 async SHA-256 limitation applies identically)

### returnTo

- PIN gate accepts `returnTo` in request body
- Validated: must start with `/qa/`
- Rejected values default to `/qa/`

---

## 4. CF Worker Changes

### 4.1 New Constants

```javascript
const QA_ROUTES = { /* 26 entries from allowlist */ };
const QA_DENIED = { '/qa/pulse': true, '/qa/vein': true };
```

### 4.2 Routing Block (before existing servePage)

```
if pathname starts with /qa:
  if QA_DENIED[pathname] → 403
  if /qa/api → validate cookie, proxy to GAS with env=qa
  if /qa/api/verify-pin → handleVerifyPin with qa target
  if QA_ROUTES[pathname] → validate cookie, serveQAPage
  else → 403
```

### 4.3 `serveQAPage()`

Same as `servePage()` but:
- Adds `env=qa` to GAS query params
- Injects QA-aware shim (not the prod shim)

### 4.4 QA-Aware Shim

Three differences from prod shim:
1. `var API = "/qa/api"` (not `/api`)
2. `getScriptUrlSafe` returns `origin + "/qa"` (not `origin`)
3. `getKHAppUrlsSafe` returns `/qa/buggsy`, `/qa/jj`, `/qa/parent`

Plus: injects non-dismissable amber QA banner.

### 4.5 `handleApi()` Change

Gains optional `envOverride` parameter. When `'qa'`, appends `&env=qa`
to the GAS target URL.

### 4.6 PIN Gate `returnTo`

`handleVerifyPin` gains:
- `gateType` parameter (`'qa'` or default finance)
- `returnTo` from request body, validated starts with `/qa/`
- Sets `tbm_qa` cookie (not `tbm_auth`) for QA gate type

Front Door HTML reads `gate=qa` param and renders QA-specific PIN card.

---

## 5. GAS Changes

### 5.1 `Code.js serveData()` — Per-Request Env

At the `api` handler entry point:

```javascript
if (e.parameter.env === 'qa') {
  if (!validateQAToken_(e.parameter.qa_token)) {
    return error('Invalid QA token', 403);
  }
  var qaSSID = PropertiesService.getScriptProperties().getProperty('TBM_QA_SSID');
  if (!qaSSID) return error('QA workbook not configured');
  SSID = qaSSID;
  _tbmSS = null;  // bust cached workbook reference
}
```

Token validation is mandatory. `env=qa` without a valid signed token
is rejected. Safe because each GAS request runs in its own V8 isolate.

### 5.2 TBMConfig.gs — No Changes

`TBM_QA_SSID` property already exists at line 30.

---

## 6. Cache Key Scoping

### Keys to Scope

| Key Pattern | File | Purpose |
|------------|------|---------|
| `DE_PAYLOAD` | Code.js:35 | DataEngine main |
| `DE_PAYLOAD_YYYY-MM-DD` | Code.js:619 | Month-specific |
| `DE_PAYLOAD_chunk_N` | Code.js:154 | Chunked fragments |
| `KH_PAYLOAD` | Code.js:40 | KidsHub main |
| `KH_PAYLOAD_buggsy` | Code.js:185 | Per-child |
| `KH_PAYLOAD_jj` | Code.js:186 | Per-child |
| `KH_LAST_HB` | Code.js:42 | Heartbeat |
| `asset_registry_vN` | Code.js:1035 | Asset registry |
| `board_data` | Dataengine.js:3212 | Board data |
| `edu_today_content_*` | Kidshub.js:3329 | Education content |

### Strategy

```javascript
function getEnvCacheKey_(baseKey) {
  var qaSSID = PropertiesService.getScriptProperties().getProperty('TBM_QA_SSID');
  if (qaSSID && SSID === qaSSID) return 'qa:' + baseKey;
  return baseKey;
}
```

Called inside `getCachedPayload_`, `setCachedPayload_`, and KH cache
accessors. `bustCache` gains QA-prefixed variants.

---

## 7. Navigation Preservation

When on `/qa/buggsy`, clicking "Homework" must navigate to
`/qa/homework`, not `/homework`.

**Solution:** The QA shim overrides `getScriptUrlSafe()` to return
`origin + "/qa"`. KidsHub's `eduGo()` builds nav URLs from this base.
`getKHAppUrlsSafe()` returns `/qa/buggsy`, `/qa/jj`, `/qa/parent`.

All in-app navigation stays in the `/qa/` namespace because the base
URL includes the prefix.

---

## 8. QA Banner

Injected by the QA shim on every `/qa/*` page:

- Background: `#f59e0b` (amber)
- Text: `QA MODE -- DATA IS NOT REAL`
- Position: `fixed; top:0; z-index:99999`
- Not dismissable
- Body gets `padding-top: 32px` offset
- Only on pages served via `/qa/*` — prod routes unaffected

---

## 9. Verification Matrix

### Route (5 tests)

| # | Test | Pass |
|---|------|------|
| R1 | Allowlisted route with valid cookie → 200 | HTML returned |
| R2 | `/qa/pulse` → 403 with explicit error | Not 200 |
| R3 | `/qa/nonexistent` → 403 | Not fallthrough |
| R4 | No cookie → 302 to PIN gate with returnTo | Not 200 |
| R5 | Expired cookie → 302 to PIN gate | Not stale page |

### Auth (6 tests)

| # | Test | Pass |
|---|------|------|
| A1 | Correct PIN → `tbm_qa` cookie with `Path=/qa` | Cookie set |
| A2 | Wrong PIN → 401, no cookie | No cookie |
| A3 | `tbm_qa` not sent on `/homework` (prod) | No leak |
| A4 | Cookie `Max-Age=14400` | 4h lifetime |
| A5 | returnTo preserved after PIN success | Correct redirect |
| A6 | `returnTo=/evil.com` → defaults to `/qa/` | No open redirect |

### Data (4 tests)

| # | Test | Pass |
|---|------|------|
| D1 | `/qa/api` reads QA workbook | QA data returned |
| D2 | `/api` reads prod workbook (same time) | Prod data |
| D3 | `/qa/api` write hits QA workbook | QA rows modified |
| D4 | Missing `TBM_QA_SSID` → error JSON | Not crash |

### Cache (5 tests)

| # | Test | Pass |
|---|------|------|
| C1 | QA cache keys prefixed `qa:` | Prefix present |
| C2 | Prod cache keys unprefixed | No `qa:` prefix |
| C3 | Clear prod cache → QA still has data | No cross-read |
| C4 | Clear QA cache → prod still has data | No cross-read |
| C5 | bustCache from QA clears only `qa:*` | Prod untouched |

### Navigation (4 tests)

| # | Test | Pass |
|---|------|------|
| N1 | eduGo from `/qa/buggsy` → `/qa/homework` | Stays in /qa |
| N2 | Child links from `/qa/parent` → `/qa/buggsy` | Stays in /qa |
| N3 | getScriptUrlSafe returns `origin + "/qa"` | /qa prefix |
| N4 | getKHAppUrlsSafe returns `/qa/*` paths | /qa prefix |

### Banner (3 tests)

| # | Test | Pass |
|---|------|------|
| B1 | `/qa/homework` shows amber banner | Visible |
| B2 | `/homework` (prod) has no banner | Clean |
| B3 | Banner not dismissable | No close button |

---

## 10. Open Questions

### Resolved: GAS-Side Signed Token (Required)

GAS must validate a signed token on every `env=qa` request. The CF
Worker generates an HMAC per-request; GAS validates before honoring
the override. Without this, anyone with the GAS deployment URL could
bypass the PIN gate and hit `?env=qa` directly.

**Token generation (CF Worker):**
```
timestamp = Date.now()
payload = timestamp + ":qa"
token = hex(SHA-256(payload + ":" + env.QA_HMAC_SECRET))
```
Appended as `&qa_token=<timestamp>:<token>` on every GAS request.

**Token validation (GAS, in serveData):**
```javascript
function validateQAToken_(tokenParam) {
  if (!tokenParam) return false;
  var parts = tokenParam.split(':');
  if (parts.length !== 2) return false;
  var ts = parseInt(parts[0], 10);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > 300000) return false; // 5 min window
  var secret = PropertiesService.getScriptProperties().getProperty('QA_HMAC_SECRET');
  if (!secret) return false;
  var expected = computeHmac_(ts + ':qa', secret);
  return expected === parts[1];
}
```

Reuses the shared-secret validation pattern at `Code.js:1634-1655`.
Requires `QA_HMAC_SECRET` as both a CF environment variable and a
GAS Script Property (same value).

**If token is missing or invalid:** Return 403 `{"error":"Invalid QA token"}`.
`env=qa` without a valid token is silently ignored (treated as prod).

### OQ-2: Cache Capacity

Adding `qa:*` keys doubles cache footprint during QA sessions.

**Recommendation:** Monitor. QA sessions are infrequent and short.

### OQ-3: Finance Surface Inclusion

Should `/qa/pulse` and `/qa/vein` be added later?

**Recommendation:** Defer indefinitely. Finance surfaces operate on real
Tiller data. Even QA snapshots carry audit risk.

### OQ-4: QA Operator Dashboard

Should the operator dashboard (`/qa/`) work with per-request dispatch
or continue requiring the global `TBM_ENV` flip?

**Recommendation:** Per-request dispatch. Relax `tbm_requireQA_()` guards
to accept per-request QA context in Phase 2.

---

## Files Touched

| File | Change |
|------|--------|
| `cloudflare-worker.js` | QA_ROUTES, QA_DENIED, routing block, serveQAPage, getQAShimScript, isValidQACookie, handleVerifyPin returnTo, Front Door qa gate |
| `Code.js` | serveData env=qa dispatch, getEnvCacheKey_(), cache function scoping |
| `TBMConfig.gs` | Unchanged (TBM_QA_SSID already exists) |
| `Tbmsmoketest.js` | QA route allowlist parity check |
| `wrangler.toml` | Add `QA_HMAC_SECRET` env var reference |

### Prerequisites

- `TBM_QA_SSID` Script Property set to QA workbook ID
- `QA_HMAC_SECRET` set as both CF environment variable and GAS Script Property (same value)
- QA workbook seeded via `seedQAWorkbook()`
