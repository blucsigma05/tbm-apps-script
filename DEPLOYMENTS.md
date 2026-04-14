# TBM GAS Deployment Manifest

Tracked as of **2026-04-13** (F11 audit). Update this file before archiving
or deleting any deployment. Deletion via `clasp delete -i <ID>` is irreversible.

---

## Live Deployments

| Deployment ID | Version | Role | Status | Notes |
|---|---|---|---|---|
| `AKfycbweFe1QLmIAlr2x0umcJ-uc2EIm-ADdcjJ9QjihBr6tmnt4Axz6xO73lmwBl4Jk6_KVOw` | @567 | **PRODUCTION** | ✅ Active | Cloudflare worker hard-codes this ID in `GAS_URL`. All user traffic routes here. Do not archive without updating the worker. |
| `AKfycbxkTlg8BRMuFaj5g0o0IYW308HNiXtXMeVgkKQo7dFe` | @HEAD | HEAD snapshot | ⚠️ Review | `@HEAD` deployments track the latest push. Not pinned — will change on every `clasp push`. Evaluate for archival. |
| `AKfycbxpPBbYYpVrxtXKDByxF7vdpJvIxfsk1WHESHxg-keG_0064GZHU-UOuYgCor5JrqOCNg` | @181 | Old pinned version | ⚠️ Review | Pinned to @181. Not routed by Cloudflare. Evaluate for archival once rollback window for @181 era is closed. |

---

## Production Routing Contract

```
User → thompsonfams.com → Cloudflare Worker (cloudflare-worker.js)
                             │
                             └─→ GAS_URL (production deployment above, @567)
```

The production deployment ID is also stored in:
- `cloudflare-worker.js` — `GAS_URL` constant (last 12 chars: `Jk6_KVOw/exec`)
- GitHub secret `GAS_DEPLOY_URL` — full `/exec` URL used by smoke tests
- GitHub secret `GAS_DEPLOYMENT_ID` — used by `clasp deploy -i` to pin new pushes to the production slot

---

## Change Procedure

### To promote a new production deployment

1. `clasp push --force` (done by `deploy-and-notify.yml` automatically)
2. `clasp deploy -i <PRODUCTION_DEPLOYMENT_ID>` (done by `deploy-and-notify.yml`)
3. No changes to this manifest required — same ID, version number increments.

### To archive an old deployment

1. Update this manifest — mark Status as `🗄️ Archived` and record the date.
2. Commit and merge the manifest update first.
3. Then run: `clasp delete -i <DEPLOYMENT_ID>`
4. **This is irreversible.** Verify the ID against this manifest before running.

### To update the production endpoint

If the production deployment ID must change (e.g., rollback to a different slot):

1. Update `cloudflare-worker.js` `GAS_URL` constant.
2. Update GitHub secrets `GAS_DEPLOY_URL` and `GAS_DEPLOYMENT_ID`.
3. Update this manifest.
4. Submit as a PR — do not edit the worker directly in the Cloudflare dashboard.
