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

## Guardrails

- Never add a CF route without a matching GAS case
- Never rename an HTML file without updating the GAS router
- Never deploy CF worker changes without verifying all routes return 200
- The route map is the contract — if it is not in the table, it does not exist
