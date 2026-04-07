# TBM-MIGRATE-P1 — Static Surfaces to Cloudflare Pages

**Owner:** Code (build), Codex (audit), LT (gate)
**Priority:** P2 (post-Hardening Sprint Zero)
**Status:** Draft — Architecture Review
**Cost:** $5/month (Workers Paid plan)
**Risk to Education Modules:** Zero (parallel-deploy window, instant rollback)

---

## Problem

GAS HtmlService introduces 1–2 second cold starts on every surface load.
As surfaces and education modules grow, this latency compounds. Moving HTML
to CF Pages (static edge hosting) drops load times to ~80ms while keeping
the entire GAS backend intact.

## Architecture

```
BEFORE:
  Browser → CF Worker → GAS doGet → HtmlService.createHtmlOutput → HTML
  Browser → google.script.run → GAS function → response

AFTER:
  Browser → CF Pages (static HTML, ~80ms) → renders immediately
  Browser → CF Worker /api → GAS doGet?action=api&fn=X → JSON response
```

**What moves:** HTML/CSS/JS surface files (currently .html in GAS).
**What stays:** All .js backend files, Tiller, Sheets, KH_ tabs, all data.

## Current Surface Inventory (from servePage, line 214)

| Route | GAS File | Backend Calls | Migration Order | Risk |
|-------|----------|---------------|-----------------|------|
| `/soul` | TheSoul.html | getBoardDataSafe | 3 (ambient) | Low |
| `/spine` | TheSpine.html | getBoardDataSafe, getKidsHubWidgetDataSafe | 2 (ambient) | Low |
| `/vault` | Vault.html | getAllVaultData (template) | 4 (low traffic) | Low |
| `/vein` | TheVein.html | getDataSafe, getMERGateStatusSafe, getReconcileStatusSafe + many more | 5 (LT surface) | Medium |
| `/pulse` | ThePulse.html | getDataSafe, getSimulatorDataSafe, getWeeklyTrackerDataSafe | 6 (JT surface) | Medium |
| `/parent` | KidsHub.html (view=parent) | getKidsHubDataSafe, khBatchApproveSafe + writes | 7 (parent approval) | Medium |
| `/buggsy` | KidsHub.html (child=buggsy) | getKidsHubDataSafe + task writes | 8 (kid tablet) | High |
| `/jj` | KidsHub.html (child=jj) | getKidsHubDataSafe + task writes | 8 (kid tablet) | High |
| `/homework` | HomeworkModule.html | getTodayContentSafe, submitHomeworkSafe | 9 (education) | High |
| `/sparkle` | SparkleLearning.html | getTodayContentSafe, logSparkleProgressSafe | 9 (education) | High |
| `/daily-missions` | daily-missions.html | getMissionStateSafe, saveMissionStateSafe | 9 (education) | High |
| `/facts` | fact-sprint.html | logQuestionResultSafe | 9 (education) | High |
| `/reading` | reading-module.html | saveProgressSafe, loadProgressSafe | 9 (education) | High |
| `/writing` | writing-module.html | saveProgressSafe, loadProgressSafe | 9 (education) | High |
| `/investigation` | investigation-module.html | saveProgressSafe | 9 (education) | High |
| `/baseline` | BaselineDiagnostic.html | savePowerScanResultsSafe | 9 (education) | High |
| `/wolfkid` | WolfkidCER.html | (minimal backend) | 9 (education) | Medium |
| `/story-library` | StoryLibrary.html | listStoredStoriesSafe | 10 | Low |
| `/story` | StoryReader.html | getStoryForReaderSafe | 10 | Low |
| `/comic-studio` | ComicStudio.html | (minimal backend) | 10 | Low |
| `/progress` | ProgressReport.html | getWeeklyProgressSafe | 10 | Low |
| `/dashboard` | DesignDashboard.html | getDesignChoicesSafe | 10 | Low |

## Current CF Worker (cloudflare-worker.js)

The existing worker fetches HTML from GAS via `?action=htmlSource&page=X`,
injects the `google.script.run` shim, and serves the result. For Phase 1:

- **Static surfaces** (migrated): Worker serves from CF Pages origin.
  No GAS htmlSource call needed. Shim injection moves to build-time.
- **Non-migrated surfaces**: Worker continues proxying to GAS as-is.
- **API calls**: Worker continues proxying `/api?fn=X` to GAS `?action=api&fn=X`.

This means migration is **per-surface, incremental**. No big bang.

## API Gateway Changes

Currently `google.script.run` works natively inside GAS HtmlService. On CF Pages,
surfaces use the existing XHR shim that POSTs to `/api?fn=FUNCTION_NAME`.
This shim already exists in the CF Worker — it's how Cloudflare-proxied surfaces
work today. No new API gateway needed.

**Security:** The CF Worker does **not** currently implement HMAC signing — it
forwards `fn`/`args` to GAS and relies on the GAS `serveData` API whitelist
(Code.js:367–420) as the sole authorization layer. Only whitelisted functions
are callable. HMAC request signing should be added before moving auth-sensitive
surfaces to Pages, but is not required for Phase 1 read-only surfaces.

## Migration Protocol (per surface)

1. **Extract:** Copy surface .html from GAS into `surfaces/<route>/index.html`.
2. **Shim:** Replace `google.script.run` calls with the XHR shim inline
   (same shim the CF Worker already injects).
3. **ES5 gate:** If surface targets Fully Kiosk (JJ's S10 FE, Fire TVs),
   keep ES5. If surface targets desktop/modern browser only, ES6 allowed.
4. **Local test:** Serve locally, verify all data loads via `/api` proxy.
5. **Deploy to Pages:** Push to a `-next` path (e.g., `/sparkle-next`).
6. **Parallel run (14 days for education surfaces, 7 days for others):**
   - New Pages version at `/route-next`
   - Old GAS version at `/route` (unchanged)
   - Daily smoke test of `-next` version
7. **Flip:** Update CF Worker to serve Pages version at `/route`.
8. **Verify:** All backend calls work, load times improved.
9. **Rollback plan:** Single CF Worker route change, <30 seconds.

## ES5 Surface Map

| Surface | Target Device | ES5 Required? |
|---------|---------------|---------------|
| `/spine`, `/soul` | Fire TV WebView | YES |
| `/buggsy`, `/jj` | Fully Kiosk (A9/A7 tablets) | YES |
| `/sparkle` | Fully Kiosk (S10 FE) | YES |
| `/daily-missions` (JJ) | Fully Kiosk (S10 FE) | YES |
| `/daily-missions` (Buggsy) | Surface Pro (Edge) | NO |
| `/homework` | Surface 5 (Edge) | NO |
| `/vein` | Desktop (Chrome) | NO |
| `/pulse` | Galaxy S25 (Samsung Internet) | NO |
| `/parent` | Galaxy S25 (Samsung Internet) | NO |

## Cost Breakdown

| Item | Monthly | Notes |
|------|---------|-------|
| CF Pages | $0 | Free tier: unlimited sites, bandwidth, requests |
| CF Workers Paid | $5 | 10M requests/month, 30s CPU. Your usage: ~5K req/day |
| CF D1 (included) | $0 | 5GB storage, 25B reads/month. Phase 2 only. |
| **Total** | **$5** | vs Vercel+Supabase Pro: ~$45/month |

## Phase 2 — D1 Read Cache (future, not this spec)

Only pursue after Phase 1 is stable and you've measured where latency actually is.
D1 would cache Sheets reads at the edge for <20ms read latency.
Write path stays GAS → Sheets (Tiller invariant preserved).
Stale-read mitigation: write endpoints invalidate D1 rows on write;
realtime surfaces (KidsHub) keep hot-path reads on GAS.

## Phase 3 — Don't.

Phase 1 + Phase 2 carries the system for years. No need to pre-plan
a full backend migration to Workers.

## Dependencies

- TBM-HARDEN-Q14 (modular split) should complete first.
  Cleaner file organization makes surface extraction easier.
- Test deployment infrastructure (from Q14's CI gap fix) is reusable here.

## Non-Goals

- No backend changes. All .js GAS files stay exactly as-is.
- No new API endpoints. Existing API_WHITELIST is sufficient.
- No database migration. Sheets stays the data layer.
- No Tiller changes. Bank sync is untouched.
