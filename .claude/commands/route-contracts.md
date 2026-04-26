---
name: route-contracts
description: >
  Cloudflare Worker route mapping and proxy contracts for the Thompson
  platform. Use when adding routes, debugging 404s, verifying deploy
  integrity, or auditing the path from public URL to GAS handler to
  backing HTML file. Trigger on: route, URL, Cloudflare, proxy, 404,
  page not found, clean URL, API proxy, worker, thompsonfams.com,
  route integrity, CF verify.
---

# Route Contracts — Cloudflare Worker + GAS Router

## Cardinal Rule

A working route requires three things in agreement: a Cloudflare PATH_ROUTES entry, a GAS Code.gs router case, and a backing HTML file. If any one is missing, the route returns a blank page or 404. Always verify all three.

---

## The Three-Layer Route Stack

```
User -> thompsonfams.com/sparkle
  -> Cloudflare Worker (PATH_ROUTES['/sparkle'] -> {page: 'sparkle'})
    -> GAS (servePage -> Code.gs router -> case 'sparkle')
      -> HTML (SparkleLearning.html)
```

---

## Complete Route Map

| Public URL | CF Route Key | GAS page= | Backing HTML | Device | Viewport | Access |
|---|---|---|---|---|---|---|
| /pulse | /pulse | pulse | ThePulse.html | JT S25 | 412x915 | Finance (PIN) |
| /vein | /vein | vein | TheVein.html | LT Desktop | 1920x1080 | Finance (PIN) |
| /parent | /parent | kidshub (view=parent) | KidsHub.html | JT S25 | 412x915 | Parents |
| /buggsy | /buggsy | kidshub (child=buggsy) | KidsHub.html | A9 Tablet | 800x1340 | Buggsy |
| /jj | /jj | kidshub (child=jj) | KidsHub.html | A7 Tablet | 800x1340 | JJ |
| /spine | /spine | spine | TheSpine.html | Fire Stick | 980x551 | Adults |
| /soul | /soul | soul | TheSoul.html | Fire Stick | 980x551 | Everyone |
| /daily-missions | /daily-missions | daily-missions | daily-missions.html | Surface Pro | 1368x912 | Buggsy |
| /daily-adventures | /daily-adventures | daily-missions (child=jj) | daily-missions.html | S10 FE | 1200x1920 | JJ |
| /sparkle | /sparkle | sparkle | SparkleLearning.html | S10 FE | 1200x1920 | JJ |
| /sparkle-free | /sparkle-free | sparkle (mode=freeplay) | SparkleLearning.html | S10 FE | 1200x1920 | JJ |
| /homework | /homework | homework | HomeworkModule.html | Surface Pro | 1368x912 | Buggsy |
| /wolfkid | /wolfkid | wolfkid | WolfkidCER.html | Surface Pro | 1368x912 | Buggsy |
| /reading | /reading | reading | reading-module.html | Surface Pro | 1368x912 | Buggsy |
| /writing | /writing | writing | writing-module.html | Surface Pro | 1368x912 | Buggsy |
| /facts | /facts | facts | fact-sprint.html | Surface Pro | 1368x912 | Buggsy |
| /investigation | /investigation | investigation | investigation-module.html | Surface Pro | 1368x912 | Buggsy |
| /baseline | /baseline | baseline | BaselineDiagnostic.html | Surface Pro | 1368x912 | Both |
| /progress | /progress | progress | ProgressReport.html | JT S25 | 412x915 | Parents |
| /comic-studio | /comic-studio | comic-studio | ComicStudio.html | Surface Pro | 1368x912 | Buggsy |
| /story-library | /story-library | story-library | StoryLibrary.html | Any | Responsive | Everyone |
| /story | /story | story | StoryReader.html | Any | Responsive | Everyone |
| /vault | /vault | vault | Vault.html | LT Desktop | 1920x1080 | LT |
| /dashboard | /dashboard | wolfdome | DesignDashboard.html | LT Desktop | 1920x1080 | LT |
| /power-scan | /power-scan | power-scan | (TBD) | Surface Pro | 1368x912 | Buggsy |

---

## API Proxy Contract

- POST to `/api?fn=FUNCTION_NAME` -> proxied to GAS google.script.run
- GET `/api/verify-pin` -> PIN verification for finance surfaces
- Finance surfaces (/pulse, /vein) require cookie auth via PIN gate
- All other surfaces are open access via Cloudflare proxy

---

## Adding a New Route -- Checklist

1. Add entry to PATH_ROUTES in `cloudflare-worker.js`
2. Add case to Code.gs router (`serveHtml_` or `servePage` handler)
3. Create backing HTML file
4. Add route to CLAUDE.md route tables (CF routes + File Map)
5. Add viewport entry to Device Viewport Map in CLAUDE.md
6. Add to Playwright screenshot spec if visual regression is needed
7. Deploy CF worker: `wrangler deploy`
8. Verify: `curl -s -o /dev/null -w "%{http_code}" https://thompsonfams.com/newroute`

---

## Caching Rules

- `/soul` and `/spine`: cached 60s at CF edge (ambient, auto-refresh)
- All other routes: no-cache (dynamic content)
- `/api`: never cached

---

## Route Integrity Verification

- `audit-source.sh` includes route integrity check
- CF worker routes -> GAS routes -> backing HTML files must all align
- Post-deploy: curl all routes, expect 200
- Any mismatch = P1 bug

---

## QA Route Parity (`/qa/*` namespace)

`cloudflare-worker.js` defines a parallel `QA_ROUTES` allowlist that mirrors `PATH_ROUTES` minus finance surfaces, plus `/qa/operator`. Parity is contractual — if a new prod route lands without a `/qa/` mirror, QA Operator Mode can't exercise it without falling back to direct GAS access (which doesn't carry the QA SSID override).

### The parity contract

| Set | Source | Count at HEAD `b878a02` |
|---|---|---|
| PATH_ROUTES (all prod routes) | `cloudflare-worker.js:13-42` | 27 |
| QA_ROUTES (all `/qa/*` routes) | `cloudflare-worker.js:46-73` | 26 |
| QA_DENIED (finance, intentionally absent from QA_ROUTES) | `cloudflare-worker.js:75` | 2 (`/qa/pulse`, `/qa/vein`) |
| `/qa/operator` (QA-only, no prod equivalent) | `cloudflare-worker.js:72` | 1 |

**Expected invariant:** `len(QA_ROUTES) == len(PATH_ROUTES) - len(QA_DENIED) + 1` → `27 - 2 + 1 = 26` ✓

### Parity check script (reproducible)

```bash
PATH_KEYS=$(sed -n '/const PATH_ROUTES = {/,/^};/p' cloudflare-worker.js \
  | grep -oE "'/[a-z-]+'" | tr -d "'" | sort -u)

QA_KEYS=$(sed -n '/const QA_ROUTES = {/,/^};/p' cloudflare-worker.js \
  | grep -oE "'/qa/[a-z-]+'" | sed 's|/qa/|/|' | tr -d "'" | sort -u)

QA_DENIED_KEYS=$(grep -oE "'/qa/[a-z-]+': true" cloudflare-worker.js \
  | sed -E "s|'/qa/([a-z-]+)': true|/\\1|" | sort -u)

# Routes in PATH_ROUTES but not mirrored in QA_ROUTES (excluding finance):
echo "MISSING qa mirrors:"
comm -23 <(echo "$PATH_KEYS") <(echo "$QA_KEYS") | grep -v -F -f <(echo "$QA_DENIED_KEYS" | sed 's|/||')

# Routes in QA_ROUTES with no prod equivalent (only /qa/operator should appear):
echo "QA-only routes:"
comm -13 <(echo "$PATH_KEYS") <(echo "$QA_KEYS")
```

### When to invoke

- **Before merging any PR that adds a `PATH_ROUTES` entry.** The new entry must have a corresponding `QA_ROUTES` entry (or be added to `QA_DENIED` if it's a finance/sensitive surface).
- **Before merging any PR that removes a route.** Both `PATH_ROUTES` AND `QA_ROUTES` must be updated; orphan entries in either become silent dead routes.
- **As part of the standing route-integrity check.** `audit-source.sh` already validates `PATH_ROUTES` page targets resolve to backing HTML; the parity check above complements that with a presence check across the two route tables.

### Verified-clean status at HEAD `b878a02` (2026-04-25)

- PATH_ROUTES count: **27** (verified `ops/phantom-route-audit-2026-04-25.md`)
- QA_ROUTES count: **26** (`/qa/operator` + 25 mirrors of non-finance PATH_ROUTES)
- QA_DENIED: **2** (`/qa/pulse`, `/qa/vein`)
- Invariant check: `27 - 2 + 1 = 26` ✓
- Missing QA mirrors: **0**
- QA-only routes (expected: just `/qa/operator`): **1** ✓

(Reference: backlog item 73 PR #170 documented the PATH_ROUTES side; this section formalizes the QA_ROUTES parity rule that was implicit in the worker's "25-entry allowlist mirrors PATH_ROUTES minus finance surfaces" comment.)

---

## Guardrails

- Never add a CF route without a matching GAS case
- Never rename an HTML file without updating the GAS router
- Never deploy CF worker changes without verifying all routes return 200
- **Never add a `PATH_ROUTES` entry without either a `QA_ROUTES` mirror or a `QA_DENIED` entry** — orphan prod routes break QA Operator Mode silently
- The route map is the contract — if it is not in the table, it does not exist
