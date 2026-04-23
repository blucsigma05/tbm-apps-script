# Title
Preview-deploy probe vs. local `wrangler dev`

# Notion link
None. Repo-local research artifact for Gitea Issue #71.

# Repo
`https://git.thompsonfams.com/blucsigma05/tbm-apps-script`

# Owner
Codex

# Current pipeline status
Research only. No preview-probe workflow is wired yet.

---

## Problem

TBM does not have one truthful non-production verification path for Cloudflare Worker changes.

Current state is split three ways:

- `.claude/preview-proxy.js` proxies the live site at `thompsonfams.com`; it is documentation capture against deployed production, not branch-local verification.
- `tests/tbm/play-gate/play-gate.spec.js` defaults to `http://localhost:8080` and can fall back to `file://`, which is fast but not Cloudflare-edge truth.
- `.gitea/workflows/playwright-regression.yml` runs against `https://thompsonfams.com`, which is production-only and can fail for reasons unrelated to the branch under review.

Issue #71 asks which path should become the canonical non-production probe for Worker changes:

- preview-deploy probe
- local `wrangler dev`

## Verified On

Repo state:

- `.claude/launch.json` and `.claude/preview-proxy.js` wire `tbm-preview` to `localhost:3456` and proxy live `thompsonfams.com`.
- `ops/specs/2026-04-15-play-surface-minimum-viable-standard.md` says `ops/evidence/preview/` captures are deployed-state illustrations, not branch-local verification.
- `.gitea/workflows/playwright-regression.yml` points Playwright at `https://thompsonfams.com`.
- `tests/tbm/play-gate/play-gate.spec.js` defaults `PLAY_GATE_BASE_URL` to `http://localhost:8080`.
- `cloudflare-worker.js` is the front-door Worker under `wrangler.toml`; it uses routes, cookies, and a hardcoded production GAS URL, but no Durable Object binding.
- `cf-events-worker/wrangler.toml` binds a Durable Object (`WORK_STATE_MACHINE`), which matters because preview URL support is different there.
- Root `package.json` has `@playwright/test` and `@babel/parser`, but no Wrangler; Wrangler is not installed at repo root.
- `cf-events-worker/package.json` declares `"wrangler": "^3.0.0"`, but there is no checked-in local installation in the current tree.

Official Cloudflare docs checked on 2026-04-23:

- Preview URLs: [developers.cloudflare.com/workers/configuration/previews/](https://developers.cloudflare.com/workers/configuration/previews/)
- Development and testing: [developers.cloudflare.com/workers/development-testing/](https://developers.cloudflare.com/workers/development-testing/)
- Supported bindings per development mode: [developers.cloudflare.com/workers/development-testing/bindings-per-env/](https://developers.cloudflare.com/workers/development-testing/bindings-per-env/)
- Versions and deployments: [developers.cloudflare.com/workers/configuration/versions-and-deployments/](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/)

Key verified facts from those docs:

- Preview URLs are available for Worker versions created by `wrangler deploy` or `wrangler versions upload`.
- `wrangler versions upload` creates a version without deploying it to production and returns preview URLs for eligible Workers.
- Preview URL support requires Wrangler `3.74.0+`; explicit `preview_urls` config requires `3.91.0+`; preview aliases require `4.21.0+`.
- Preview URLs are not generated for Workers that implement Durable Objects.
- Preview URLs do not expose logs via Workers Logs, `wrangler tail`, or Logpush.
- Default `wrangler dev` runs code locally via Miniflare/workerd, with local simulations by default and optional per-binding remote connections.
- `wrangler dev --remote` uploads code to a temporary Cloudflare preview environment, but Cloudflare recommends local development with remote bindings for most work because iteration is faster.

## Why it matters

The current repo can answer two different questions, but not the one TBM actually needs for merge confidence:

- "What does production look like right now?" -> live-site proxy and Playwright against `thompsonfams.com`
- "Does the branch render anything on my machine?" -> localhost / file fallback

The missing question is:

- "Will this exact branch build and behave as a Cloudflare Worker without touching production?"

That is the question a merge gate needs.

## What changes

### Decision

Use a **preview-deploy probe** as the canonical branch-truth check for `cloudflare-worker.js` and `uptime-worker.js`.

Use **local `wrangler dev`** as the fast local development loop, not as the merge gate.

### Why preview-deploy probe wins for the gate

- It produces a real non-production Worker version on Cloudflare, which is closer to deploy truth than localhost or `file://`.
- It gives the branch a unique preview URL that CI or Playwright can probe without touching `thompsonfams.com` production.
- It matches the repo's actual need: branch-local verification of Worker build/output before merge.
- It aligns with the parser approach being tracked under Gitea #67, but that parser currently lives in open PR #75 rather than on `gitea/main`.

### Why local `wrangler dev` does not win the gate

- It is a developer-loop tool, not a durable CI artifact.
- In default mode it runs locally, not on Cloudflare's infrastructure.
- It can still be valuable for debugging, but it does not answer "did this branch create a valid Cloudflare Worker version?" as directly as a preview upload does.
- The current repo already proves local preview can drift into "helpful but not canonical" territory.

### Scope boundary

This recommendation applies to the Workers that do **not** use Durable Objects:

- `cloudflare-worker.js`
- `uptime-worker.js`

It does **not** apply to `cf-events-worker` in its current form because Cloudflare does not generate Preview URLs for Workers with Durable Objects. If TBM later needs non-production branch truth for `cf-events-worker`, use a separate strategy:

- local `wrangler dev` with the right local fixtures for fast work
- `wrangler dev --remote` only when an edge-only behavior must be verified

### Recommended implementation shape for the follow-up PR

1. Pin Wrangler explicitly in repo tooling before wiring the probe. Gitea #68 is already the natural dependency for this.
2. Add `preview_urls = true` explicitly in the relevant Wrangler config instead of relying on dashboard defaults.
3. In a non-production workflow, run `wrangler versions upload` instead of `wrangler deploy`.
4. Capture the returned preview URL and run a probe suite against it:
   - `/version`
   - one education route
   - one QA route if relevant
5. Once the parser from PR #75 lands, parse stdout + stderr with `.github/scripts/parse_wrangler_output.py` instead of trusting exit code alone.
6. If Wrangler is pinned to `4.21.0+`, prefer a readable alias such as `pr-<number>` or `sha-<shortsha>` for operator ergonomics.
7. Keep `wrangler dev` documented as the manual local loop for fast debug iterations.

## Unknowns

- Whether TBM wants preview URLs publicly reachable or gated behind Cloudflare Access from day one.
- Whether the first probe should cover finance-gated routes or stay on non-finance routes initially.
- Whether the first rollout should be PR-only, `workflow_dispatch` only, or both.
- Whether alias cleanup needs its own maintenance rule once preview aliases are introduced.
- Whether route-level features that depend on the zone hostname should later require a second thompsonfams.com-specific probe. Preview URLs run on `workers.dev`, not on the production route.

## LT decisions needed

- Confirm the canonical recommendation: preview-deploy probe for gate truth, local `wrangler dev` for local loop.
- Decide whether preview URLs must be Cloudflare-Access-protected before the first rollout.
- Decide whether the first implementation should scope to `cloudflare-worker.js` only, or include `uptime-worker.js` in the same PR.
- Decide alias style if preview aliases are used: `pr-<number>` or `sha-<shortsha>`.

## Acceptance test

1. A PR that changes `cloudflare-worker.js` or `wrangler.toml` can upload a non-production Worker version without mutating production routes.
2. The workflow captures a preview URL from Wrangler output and probes `/version` successfully.
3. A bad Worker config or bad entry point fails the preview-probe workflow before merge.
4. The workflow classifies Wrangler output via `.github/scripts/parse_wrangler_output.py`, not exit code only.
5. Local developers still have a documented fast loop via `wrangler dev`.
6. No one mistakes the live-site preview proxy for branch-local verification after the follow-up PR lands.

## Evidence after completion

- [ ] Follow-up implementation Issue opened or linked from Gitea #71
- [ ] Preview-probe workflow merged for `cloudflare-worker.js`
- [ ] Probe run artifact shows preview URL + probe results for a known-good branch
- [ ] Intentional bad-config branch proves the workflow fails closed
- [ ] `wrangler dev` local-loop docs updated to say "developer loop only, not merge truth"

## Codex review checklist

- [ ] The recommendation does not claim preview URLs work for Durable Object Workers
- [ ] The recommendation does not claim preview URLs give route-level parity with `thompsonfams.com`
- [ ] Wrangler version requirements are stated correctly: `3.74.0+` preview URLs, `3.91.0+` explicit `preview_urls`, `4.21.0+` preview alias
- [ ] The repo-specific facts are anchored in current files, not memory
- [ ] The document makes one recommendation, not a hedged menu
