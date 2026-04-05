# Pipeline Go-Live

Use this checklist before enabling the closed-loop TBM automation in production.

## Required GitHub Secrets

These secrets are required for the hosted workflow path to work end to end.

| Secret | Used by | Why it matters |
|---|---|---|
| `GAS_DEPLOY_URL` | `.github/workflows/ci.yml`, `.github/workflows/review-fixer.yml` | Lets GitHub hit the deployed Apps Script `?action=runTests` endpoint. |
| `PIPELINE_RELAY_URL` | `ci.yml`, `review-watcher.yml`, `review-fixer.yml` | Lets GitHub send pipeline events back into GAS over `doPost`. |
| `PIPELINE_SECRET` | `ci.yml`, `review-watcher.yml`, `review-fixer.yml` | Shared secret required by `pipelineRelaySafe`. |
| `CLASP_CREDENTIALS_JSON` | `review-fixer.yml` | Allows the hosted fixer to push and deploy Apps Script changes. |
| `GAS_DEPLOYMENT_ID` | `review-fixer.yml` | Tells the hosted fixer which existing deployment to update. |

## Recommended GitHub Secrets

These are not always strictly required, but the pipeline is cleaner with them.

| Secret | Used by | Why it matters |
|---|---|---|
| `PIPELINE_BOT_TOKEN` | `review-fixer.yml` | Makes bot-made fix commits push as a real token-backed actor so CI and watcher triggers retrigger reliably. |

## Required Apps Script Properties

These properties must exist in the deployed Apps Script project.

| Property | Used by | Why it matters |
|---|---|---|
| `PIPELINE_SECRET` | `Code.js` | Authorizes relay payloads in `normalizePipelinePayload_()`. |

## Optional Apps Script Properties

These expand the relay behavior but do not block the core loop.

| Property | Used by | Why it matters |
|---|---|---|
| `NOTION_API_KEY` | `Code.js` | Required if pipeline events should be written to Notion. |
| `NOTION_PIPELINE_DB_ID` | `Code.js` | Destination database for pipeline event rows. |

## Existing Runtime Dependencies

- Pushover delivery to `LT` must already work through the existing Alert Engine configuration.
- `doPost()` must be deployed on the production Apps Script web app URL referenced by `PIPELINE_RELAY_URL`.
- The GitHub Actions workflows must exist on the PR branch, not only locally.

## First Live Validation

1. Confirm all required GitHub secrets exist in `blucsigma05/tbm-apps-script`.
2. Confirm the deployed Apps Script project has `PIPELINE_SECRET`.
3. Send one manual relay POST for `deploy_complete` and verify:
   - GAS returns `{ ok: true }` or a partial-success payload
   - LT receives the notification
   - Notion logs the event if Notion properties are configured
4. Open a test PR from the pipeline branch.
5. Verify `TBM Smoke + Regression` comments on the PR.
6. Verify `Pipeline Review Watcher` creates or updates exactly one summary comment.
7. Add or simulate one deterministic mechanical review thread if the fixer needs to be tested.
8. Verify `Pipeline Review Fixer` either:
   - pushes a `[review-fix-N]` commit, or
   - exits cleanly with a no-op summary, or
   - marks the cycle stalled after the configured cap
9. Confirm the watcher shows explicit current-head states for:
   - `CI`
   - `Codex review`
10. Approve the PR and confirm the watcher moves the PR to `pipeline:ready` only after:
   - CI is `PASS`
   - Codex review is `PASS`
   - GitHub approval state is `APPROVED`
   - unresolved actionable threads are `0`

## Review Gate Contract

Use the watcher summary comment as the authoritative gate view for open PRs.

| Gate | What counts as current | What counts as pass | What still blocks |
|---|---|---|---|
| `CI` | Latest `TBM Smoke + Regression` run on the PR head SHA | Workflow conclusion `success` | `RUNNING`, `WAITING`, or any failing conclusion |
| `Codex review` | Latest Codex-authored review on the PR head SHA | Review state `APPROVED` or explicit current-head `Codex PASS` | `COMMENTED` without explicit outcome, `WAITING`, `STALE`, or explicit/current `FAIL` |

## Gemini Status

As of April 5, 2026, Gemini is removed from the hard merge gate. The required release contract is now:

- Claude or human implementation work
- GitHub review lane
- Codex explicit `PASS` or `FAIL`
- TBM CI / regression
- GitHub approval state

Gemini can return later as a manual or advisory lane once it reliably produces current-head review artifacts.

## Manual Backstops

- If `PIPELINE_BOT_TOKEN` is missing, fix pushes may succeed but not retrigger the full workflow chain.
- If Notion properties are missing, relay events can still succeed through push notification alone.
- If the watcher state drifts, use the manual `workflow_dispatch` entry on `review-watcher.yml` with a PR number to recompute labels and the summary comment.
- If a PR predates the merged automation foundation, use the retrofit queue to re-review it and do not treat a `COMMENTED` Codex review as equivalent to Codex `PASS` or `FAIL`.
