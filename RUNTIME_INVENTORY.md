# TBM Runtime Inventory

Captured **2026-04-13** (F15 audit). Update this file when any runtime binding changes.
Runtime state lives outside git — this document is the explicit record.

---

## Cloudflare Worker — Main Proxy

| Property | Value |
|---|---|
| Worker name | `tbm-smart-proxy` |
| Entry point | `cloudflare-worker.js` |
| Wrangler config | `wrangler.toml` |
| Deploy workflow | `.github/workflows/deploy-worker.yml` |

### Route Binding

**Route:** `thompsonfams.com/*` → Worker `tbm-smart-proxy`

**Ownership:** Dashboard-managed. The route is configured in the Cloudflare dashboard,
not in `wrangler.toml` (the route block is commented out — see `wrangler.toml` lines 6–9).

**Verification command:**
```bash
# Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID env vars
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/workers/routes" \
  | python3 -m json.tool
```

**Dashboard path:** Cloudflare Dashboard → Workers & Pages → tbm-smart-proxy → Triggers → Routes

**Audit note (F15, 2026-04-13):** Route binding was not independently verified from the API
during this audit. The route has been stable and implicit in all prior smoke tests
(thompsonfams.com traffic hits the worker as expected). Use the command above to
capture current binding from the API before any route changes.

---

## Cloudflare Worker — Uptime Monitor

| Property | Value |
|---|---|
| Worker name | (see `wrangler-uptime.toml`) |
| Entry point | `uptime-worker.js` |
| Wrangler config | `wrangler-uptime.toml` |
| Deploy workflow | `.github/workflows/deploy-uptime-worker.yml` |

**Route:** Cron-triggered only (no HTTP route). Schedule defined in `wrangler-uptime.toml`.

---

## GAS Production Deployment

See `DEPLOYMENTS.md` for the full deployment manifest.

| Property | Value |
|---|---|
| Production endpoint | `https://script.google.com/macros/s/AKfycbweFe1QLmIAlr2x0umcJ-uc2EIm-ADdcjJ9QjihBr6tmnt4Axz6xO73lmwBl4Jk6_KVOw/exec` |
| Deployment version | @567 (as of 2026-04-13) |
| Deploy workflow | `.github/workflows/deploy-and-notify.yml` |
| GAS script ID | in `appsscript.json` / `.clasp.json` |

**Cloudflare → GAS routing:**
`CF Worker cloudflare-worker.js:6 GAS_URL` → production `/exec` endpoint above.

---

## Secret Inventory Summary

Secrets relevant to runtime routing (full inventory: `.github/secret-inventory.json`):

| Secret | Used by | Purpose |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | deploy-worker.yml, deploy-uptime-worker.yml | Wrangler deploy auth |
| `CLOUDFLARE_ACCOUNT_ID` | deploy-worker.yml, deploy-uptime-worker.yml | Wrangler account target |
| `CF_WORKER_URL` | deploy-worker.yml | Post-deploy front-door smoke URL (e.g. `https://thompsonfams.com`) |
| `GAS_DEPLOY_URL` | deploy-and-notify.yml | GAS `/exec` URL for smoke tests |
| `GAS_DEPLOYMENT_ID` | deploy-and-notify.yml | GAS deployment ID for `clasp deploy -i` |
| `CLASP_CREDENTIALS_JSON` | deploy-and-notify.yml | GAS push credentials |

---

## Change Protocol

When any runtime binding changes (route, endpoint, secret rotation):

1. Update this file with the new values.
2. Update `DEPLOYMENTS.md` if the GAS endpoint changes.
3. Commit and merge before making the live change.
4. Re-verify with the commands above after the change.
