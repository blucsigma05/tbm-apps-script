# Workflow Triage — 2026-04-19

**Context:** Gitea is primary host at `git.thompsonfams.com`. Runner `tbm-runner-1` is live
(host mode, `ubuntu-latest:host`). The only proven Gitea workflow is
`.gitea/workflows/codex-pr-review.yml` (PR #1, verdict posted). GitHub account suspended since
~00:30 CT 2026-04-19. All 28 `.github/workflows/*.yml` files are discovered and attempted by
Gitea Actions — most fail fast on GitHub-specific deps.

**Triage scope:** DELETE / PORT / DEDUPE only. No files changed, no new workflows created.

---

## Summary Table

| File | Category | One-line reason | PORT: what needs changing | DEDUPE: covered by |
|---|---|---|---|---|
| `ci.yml` | PORT | Core GAS smoke+regression gate — valuable logic, two `actions/github-script` steps need curl replacement | Replace two `github-script` steps with curl to Gitea API; remove `workflow_dispatch` for `review-watcher.yml` (GitHub-only) | — |
| `code-sweep.yml` | DELETE | Requires `anthropics/claude-code-action@v1` — no Gitea equivalent; Notion integration also unbuilt | — | — |
| `codex-finding-listener.yml` | PORT | Finding-marker detection is still needed; all GitHub API calls are replaceable with Gitea API | Replace `secrets.GITHUB_TOKEN` with `GITEA_TOKEN`; rewrite all `github.rest.*` calls as `curl` to Gitea API; verify parse_finding_comment.py env-var contract | — |
| `codex-pr-review.yml` | DEDUPE | Covered by `.gitea/workflows/codex-pr-review.yml`; Gitea version is MVP (no triage/filer/retry) | — | `.gitea/workflows/codex-pr-review.yml` (see §Functional Gap note) |
| `codex-rereview-handoff.yml` | PORT | Handoff marker logic is pure Python + Gitea comment API; no GitHub-specific deps in the script | Replace `GITHUB_TOKEN` with `GITEA_TOKEN`; verify `post_tbm_handoff_marker.py` uses env vars, not hardcoded GitHub URLs | — |
| `deploy-and-notify.yml` | PORT | GAS deploy + smoke + release is core pipeline; `gh release create` is the only GitHub dep | Replace `gh release create` with Gitea release API (`curl` POST to `/api/v1/repos/{repo}/releases`); `clasp push` is environment-agnostic | — |
| `deploy-uptime-worker.yml` | PORT | Cloudflare Worker deploy — `cloudflare/wrangler-action@v3` is the only non-standard action | Replace `cloudflare/wrangler-action@v3` with inline `npm install -g wrangler && wrangler deploy`; secrets are environment-agnostic | — |
| `deploy-worker.yml` | PORT | CF Worker deploy with build-ID stamp — same action issue as deploy-uptime-worker | Same fix: inline wrangler; keep GAS alignment check (pure curl) | — |
| `hyg-01-stale-branches.yml` | PORT | Stale-branch logic lives in `check_stale_branches.py`; only `GH_TOKEN` alias is GitHub-specific | Rename env var `GH_TOKEN` → `GITEA_TOKEN`; update `check_stale_branches.py` to use Gitea API (`/api/v1/repos/{repo}/branches`) instead of GitHub REST | — |
| `hyg-02-orphaned-prs.yml` | PORT | Orphaned-PR check is still useful on Gitea; same token alias issue | Rename `GH_TOKEN` → `GITEA_TOKEN`; update `check_orphaned_prs.py` to Gitea API for PR list (`/api/v1/repos/{repo}/pulls`) | — |
| `hyg-03-integration-map-drift.yml` | PORT | Notion API call is platform-agnostic; no GitHub dep in workflow YAML | No workflow-level changes; verify `check_integration_map_drift.py` uses only Notion API + env vars | — |
| `hyg-04-claude-md-bloat.yml` | PORT | `gh` CLI used for PR comments — replaceable with Gitea API | Replace `gh pr view` / `gh api` / `gh pr comment` with `curl` to Gitea issues API; rest of script is file-analysis only | — |
| `hyg-05-parking-lot-age.yml` | PORT | Notion API call only; no GitHub dep | No workflow-level changes needed; verify `check_parking_lot_age.py` env contract | — |
| `hyg-06-version-drift.yml` | PORT | Triggered by `workflow_run: [Deploy and Notify]` — Gitea supports `workflow_run`; logic is pure curl to GAS URL | Change `workflow_run` trigger to reference new Gitea workflow name if `deploy-and-notify` is renamed; rest is platform-agnostic | — |
| `hyg-07-secrets-audit.yml` | DELETE | Script reads GitHub repo secrets via GitHub REST API (`/repos/{repo}/actions/secrets`) — Gitea secrets API is different and this audits GitHub-specific secret metadata. On Gitea the audit would need a full rewrite against Gitea's API | — | — |
| `hyg-08-dead-workflows.yml` | PORT | Uses `GH_TOKEN` + GitHub Actions API to check workflow run history — Gitea has equivalent `/api/v1/repos/{repo}/actions/tasks` | Rename `GH_TOKEN` → `GITEA_TOKEN`; update `check_dead_workflows.py` to query Gitea Actions API (`/api/v1/repos/{repo}/actions/workflows/{id}/runs`) | — |
| `hyg-11-trust-backlog-age.yml` | PORT | Notion-only; no GitHub dep in YAML | No workflow-level changes; verify `check_trust_backlog_age.py` env contract | — |
| `hyg-13-knowledge-graph-diff.yml` | PORT | Triggered on push to main watching knowledge files; posts to Notion; no GitHub dep beyond standard vars | `GITHUB_REPOSITORY` and `GITHUB_SHA` / `PUSH_BEFORE` are provided by Gitea under the same env var names — no changes needed | — |
| `hyg-14-rubric-drift.yml` | PORT | Pure shell + awk parsing of `ops/surface-map.md`; reads PR labels via `github.event.pull_request.labels` | Gitea passes labels in the same workflow context key; verify `toJson(github.event.pull_request.labels.*.name)` resolves on Gitea (known compat) — low-risk | — |
| `hygiene-filer.yml` | PORT | `workflow_call` + `GH_TOKEN` for issue creation; `file_hygiene_issue.py` calls GitHub Issues API | Rename `GH_TOKEN` → `GITEA_TOKEN`; update `file_hygiene_issue.py` to use Gitea Issues API (`/api/v1/repos/{repo}/issues`); `workflow_call` is supported on Gitea | — |
| `play-gate.yml` | PORT | Playwright + Node on runner; artifact upload; no GitHub-specific API calls | `actions/setup-node@v4` resolves against Gitea's built-in action mirror or needs inline `node` (already at v20 on host runner); `actions/upload-artifact@v4` needs verification on Gitea runner — may need inline artifact handling | — |
| `playwright-regression.yml` | PORT | Core E2E regression gate — hits live thompsonfams.com; two `actions/github-script` comment steps need replacement | Replace two `github-script` comment steps with curl to Gitea Issues API; `actions/setup-node@v4` same concern as play-gate; `actions/upload-artifact@v4` same | — |
| `post-deploy-closeout.yml` | PORT | Notion + CF route sweep; triggered by `workflow_run: [Deploy and Notify]`; `gh` used only for PR metadata lookup | Replace `gh pr list` lookup with Gitea API (`/api/v1/repos/{repo}/pulls?state=closed`); fix `workflow_run` trigger to match ported deploy workflow name; `post_deploy_closeout.py` uses Notion + curl — platform-agnostic | — |
| `pr-linked-issue.yml` | PORT | Pure Python inline — reads `PR_BODY` / `PR_TITLE` / `PR_LABELS` from context; no GitHub API calls | Gitea injects same context keys; zero workflow-level changes likely needed — verify `github.event.pull_request.labels.*.name` compat | — |
| `rail-watchdog.yml` | PORT (unclear — flag to LT) | Useful watchdog concept but script queries GitHub Actions API to check last successful run times — full logic rewrite needed for Gitea | Must rewrite inline Python to use Gitea Actions API (`/api/v1/repos/{repo}/actions/workflows/{filename}/runs?status=success`); rail list hardcodes `.github/workflows/` filenames — update to new Gitea workflow paths after migration | — |
| `review-fixer.yml` | DELETE | Deeply GitHub-coupled: `PIPELINE_BOT_TOKEN` for push-to-PR, `github.rest.*` dispatches to `codex-pr-review.yml` via GitHub API, `review-fixer.js` and `review-watcher.js` call GitHub REST directly. Entire auto-fix-and-redispatch loop is GitHub-native | — | — |
| `review-watcher.yml` | DELETE | `review-watcher.js` calls GitHub REST API throughout (`github.rest.pulls`, `github.rest.issues`, `workflow_run` trigger for GitHub-named workflows). No Gitea equivalent of the live-summary-comment pattern exists yet | — | — |
| `workflow-lint.yml` | PORT | actionlint + shellcheck + policy checks are platform-agnostic; paths filter is for `.github/workflows/` — needs update | Change paths filter to cover `.gitea/workflows/` (and optionally `.github/workflows/` during transition); actionlint is downloaded directly from GitHub releases — still works | — |

**Counts: DELETE = 3 | PORT = 23 | DEDUPE = 1 | PORT (unclear) = 1**

*(rail-watchdog counted in PORT total; the "unclear" flag is for LT review.)*

---

## Per-File Rationale

### ci.yml — PORT

**What it does:** TBM's primary CI gate. On every PR to `main`, hits the GAS deploy URL
(`?action=runTests`), parses the JSON response via `parse_test_results.py`, posts a comment back
to the PR, optionally notifies the pipeline relay, and re-triggers `review-watcher.yml`.

**Why it fails on Gitea today:** Two `actions/github-script@v7` steps (comment posting, dispatch
of `review-watcher.yml`). `github-script` is a GitHub-authored action that wraps the GitHub
Octokit SDK — not available on Gitea and not in the built-in action mirror.

**If kept:** Fails on every PR at the "Comment on PR" step. The test run itself succeeds, but
results are never posted and the re-trigger dispatch fails. Runner log shows error and exits
non-zero — blocking the PR incorrectly.

**If ported:** Replace both `github-script` steps with `curl` to Gitea Issues API
(`/api/v1/repos/{repo}/issues/{pr_number}/comments`). Remove the `review-watcher` dispatch step
(it references a GitHub-only workflow). `parse_test_results.py` uses only file I/O and env vars —
no changes needed.

---

### code-sweep.yml — DELETE

**What it does:** Scheduled Claude Code agent run — reads Notion Trust Backlog, builds specs from
a queue, opens PRs. Uses `anthropics/claude-code-action@v1`.

**Why it fails on Gitea today:** `anthropics/claude-code-action@v1` is a GitHub Action that does
not exist in Gitea's action mirror. Even if wired, the `ANTHROPIC_API_KEY` auth mode for
that action is GitHub-specific.

**If kept:** Fails at the action-resolution step. No work is done. Runner log shows missing
action.

**Why delete (not port):** The code-sweep pattern as written — a scheduled agent autonomously
building and opening PRs — is architecture-level scope, not a simple port. It also requires
`NOTION_API_KEY` which was explicitly called out as not configured. No equivalent exists on
Gitea and no near-term plan to build one is in the backlog. Delete cleanly; revisit if an
autonomous build-queue agent is spec'd for Gitea.

---

### codex-finding-listener.yml — PORT

**What it does:** Listens for `issue_comment`, `pull_request_review_comment`, and
`pull_request_review` events. Detects Codex finding markers and applies labels, auto-files issues
for `severity:blocker` findings via `parse_finding_comment.py`.

**Why it fails on Gitea today:** The YAML itself uses no GitHub-specific actions — pure `run`
steps. However, `parse_finding_comment.py` calls GitHub REST API via `GITHUB_TOKEN` for label
management and issue creation. Gitea surfaces the same events (issue_comment, PR review) so the
trigger is compatible.

**If kept without porting:** Python script attempts to call `api.github.com` — returns 404/401
because `GITHUB_TOKEN` on Gitea is a Gitea PAT with no GitHub scope.

**If ported:** Update `parse_finding_comment.py` to call Gitea API endpoints
(`/api/v1/repos/{repo}/issues/{number}/labels`, `/api/v1/repos/{repo}/issues`). Token rename is
env-var level — rename `GITHUB_TOKEN` → `GITEA_TOKEN` in the workflow env block.

---

### codex-pr-review.yml — DEDUPE

**What it does:** Full Codex PR review v3 — lint-gate job, triage, OpenAI gpt-4o call,
structured findings, finding-label application, inline filer (Phase 1), rubber-stamp integrity
check, 429 auto-requeue, verdict-based merge block.

**Why it's DEDUPE:** `.gitea/workflows/codex-pr-review.yml` on branch
`feat/gitea-codex-review-mvp` (proven on PR #1) covers the core review loop: diff fetch →
`codex_review.py` → post comment → verdict gate. That Gitea workflow's own header explicitly
lists what it omits from scope: triage pre-filter, inline filer, 429 auto-requeue, rubber-stamp
check, triage labels.

**Functional gap (important):** The Gitea MVP is intentionally stripped. The GitHub version has
materially more logic — triage mode (skip/light/medium/full), the inline Codex Review Filer
(Phase 1 of the claude:inbox router), integrity check, and 429 retry. None of these block the
DEDUPE call — the Gitea file is the live anchor and the right base for future enhancement. The
GitHub file should be removed to prevent it from running alongside the Gitea version and producing
duplicate review comments.

**Verification before delete:** Confirm `.gitea/workflows/codex-pr-review.yml` is merged to
`gitea/main` (currently on `feat/gitea-codex-review-mvp`, PR #1 INCONCLUSIVE-blocked). Delete
the `.github/` copy only after the Gitea version is on `main`.

---

### codex-rereview-handoff.yml — PORT

**What it does:** Phase 3 of the Codex ↔ Claude event router. On PR open/sync/reopen, scans PR
body for `Closes #N` keywords, posts a `<!-- tbm-handoff -->` marker comment via
`post_tbm_handoff_marker.py`.

**Why it fails on Gitea today:** Uses `pull_request_target` trigger (Gitea supports this) and
`GITHUB_TOKEN` for comment posting. Script calls GitHub Issues API to post the marker.

**If kept without porting:** Script attempts `api.github.com` — fails silently or errors.

**If ported:** Update `post_tbm_handoff_marker.py` to use Gitea Issues comments API. Rename
token env var. The trigger, concurrency, and overall structure are fully compatible.

---

### deploy-and-notify.yml — PORT

**What it does:** On merge to `main` (excluding CF worker / markdown paths), runs `clasp push`,
`clasp deploy`, smoke-tests the GAS endpoint, creates a GitHub release, and sends Pushover
notifications.

**Why it fails on Gitea today:** `gh release create` uses the `gh` CLI authenticated to GitHub.
Everything else (clasp, curl smoke, Pushover) is platform-agnostic.

**If kept without porting:** Deploy and smoke succeed; release creation step fails (gh CLI calls
`api.github.com`). Pushover failure notification mentions GitHub run URL — cosmetically wrong
but functional.

**If ported:** Replace `gh release create` with a `curl POST` to Gitea releases API
(`/api/v1/repos/{repo}/releases`). Update run URL formatting in Pushover steps to use
`git.thompsonfams.com` instead of `github.com`. `GH_TOKEN` alias in that step → `GITEA_TOKEN`.

---

### deploy-uptime-worker.yml — PORT

**What it does:** On push to `main` touching `uptime-worker.js` or `wrangler-uptime.toml`,
deploys the Cloudflare uptime worker using `cloudflare/wrangler-action@v3`.

**Why it fails on Gitea today:** `cloudflare/wrangler-action@v3` is a GitHub Action. Gitea's
action mirror does not include Cloudflare community actions.

**If kept without porting:** Fails at action resolution. No deploy happens.

**If ported:** Replace `cloudflare/wrangler-action@v3` with inline steps:
```
npm install -g wrangler
wrangler deploy --config wrangler-uptime.toml
```
Secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) are already in Gitea repo secrets.
Remove `environment: production` (Gitea environments work differently — verify if needed).

---

### deploy-worker.yml — PORT

**What it does:** On push to `main` touching `cloudflare-worker.js` or `wrangler.toml`, stamps
`__BUILD_ID__` into the worker, deploys via `cloudflare/wrangler-action@v3`, then runs a
front-door smoke check and GAS alignment assertion.

**Why it fails on Gitea today:** Same as `deploy-uptime-worker.yml` — community action.

**If ported:** Inline wrangler as above. The BUILD_ID stamp (`sed -i`) and post-deploy smoke
(curl + python3) are platform-agnostic. Concurrency group name
(`tbm-production-release`) matches `deploy-and-notify.yml` — keep the same group on Gitea.

---

### hyg-01-stale-branches.yml — PORT

**What it does:** Weekly sweep for branches older than N days with no open PR. Sends Pushover.
Logic in `check_stale_branches.py`.

**Why it fails on Gitea today:** `GH_TOKEN` is passed as env var and `check_stale_branches.py`
calls GitHub API to list branches and their associated PRs.

**If ported:** Rename `GH_TOKEN` → `GITEA_TOKEN` in workflow. Update script to use
`/api/v1/repos/{repo}/branches` and `/api/v1/repos/{repo}/pulls?state=open` on Gitea API.
Schedule (cron Monday 13:00 UTC) is compatible.

---

### hyg-02-orphaned-prs.yml — PORT

**What it does:** Daily sweep for open PRs with no activity for N days. Sends Pushover.
Logic in `check_orphaned_prs.py`.

**Why it fails on Gitea today:** Same `GH_TOKEN` + GitHub API pattern.

**If ported:** Same fix as hyg-01: token rename + script API update to
`/api/v1/repos/{repo}/pulls?state=open`.

---

### hyg-03-integration-map-drift.yml — PORT

**What it does:** Weekly check of Notion Integration Map DB for stale entries. Sends Pushover.
Logic in `check_integration_map_drift.py`.

**Why it "fails" on Gitea today:** Does not fail on the runner — all calls are to Notion API
(`api.notion.com`) using `NOTION_API_KEY`. But `NOTION_INTEGRATION_MAP_DB` secret may not be
configured on Gitea yet.

**If ported:** Zero workflow-level changes needed. Verify `NOTION_API_KEY` and
`NOTION_INTEGRATION_MAP_DB` are in Gitea repo secrets.

---

### hyg-04-claude-md-bloat.yml — PORT

**What it does:** On PRs touching `CLAUDE.md`, analyzes line growth, duplicate phrases, dead file
refs via `check_claude_md.py`. Posts a PR comment; Pushover on severe findings.

**Why it fails on Gitea today:** Three `gh` CLI calls for PR comment management (`gh pr view`,
`gh api`, `gh pr comment`).

**If ported:** Replace all three `gh` calls with `curl` to Gitea Issues API. The Python script
itself is file-analysis only — no platform dep.

---

### hyg-05-parking-lot-age.yml — PORT

**What it does:** Bi-monthly sweep of Notion Parking Lot page for items older than N days.
Sends Pushover. Logic in `check_parking_lot_age.py`.

**Why it fails on Gitea today:** Does not fail — Notion API calls are platform-agnostic. Same
secret-availability caveat as hyg-03.

**If ported:** Zero workflow-level changes. Verify `NOTION_API_KEY` in Gitea secrets (Parking
Lot page ID is hardcoded in YAML: `32ccea3cd9e881809257fd5e7973c6d7`).

---

### hyg-06-version-drift.yml — PORT

**What it does:** After successful `Deploy and Notify` (or nightly cron), hits GAS deploy URL
and compares version constants. Sends Pushover on drift.

**Why it fails on Gitea today:** The `workflow_run` trigger references `Deploy and Notify` by
display name. If the ported Gitea deploy workflow uses a different `name:` field, the trigger
won't fire. Logic itself (curl to GAS URL, python3 file scan) is platform-agnostic.

**If ported:** Ensure the Gitea port of `deploy-and-notify.yml` keeps `name: Deploy and Notify`
(or update the trigger here). No other changes needed.

---

### hyg-07-secrets-audit.yml — DELETE

**What it does:** Lists GitHub repo secrets via `PIPELINE_BOT_TOKEN` (PAT with `repo` scope),
flags orphaned or old secrets.

**Why delete:** `check_secrets_audit.py` calls `api.github.com/repos/{repo}/actions/secrets`
— a GitHub-specific endpoint. Gitea's secrets API (`/api/v1/repos/{repo}/actions/secrets`) has
a different response schema and does not expose secret creation timestamps. A Gitea-native
version would need a full rewrite from scratch. The audit value is lower-priority than the core
pipeline; delete now, revisit as a new Gitea-native hyg-07.

---

### hyg-08-dead-workflows.yml — PORT

**What it does:** Monthly check for workflows with no successful run in N days. Sends Pushover.
Logic in `check_dead_workflows.py`.

**Why it fails on Gitea today:** `GH_TOKEN` + script calls GitHub Actions API
(`/repos/{repo}/actions/workflows` and `/runs`). Gitea has a compatible endpoint.

**If ported:** Rename `GH_TOKEN` → `GITEA_TOKEN`. Update `check_dead_workflows.py` to use
Gitea Actions API (`/api/v1/repos/{repo}/actions/workflows` and
`/api/v1/repos/{repo}/actions/workflows/{id}/runs`). Note: workflow file names in Gitea may
include both `.github/workflows/` and `.gitea/workflows/` paths; script should handle both.

---

### hyg-11-trust-backlog-age.yml — PORT

**What it does:** Weekly sweep for stale Trust Backlog items in Notion. Sends Pushover. Logic
in `check_trust_backlog_age.py`.

**Why it fails on Gitea today:** Does not fail — Notion API calls only. `NOTION_TRUST_BACKLOG_DB`
secret availability is the only concern.

**If ported:** Zero workflow-level changes. Verify `NOTION_API_KEY` and
`NOTION_TRUST_BACKLOG_DB` are in Gitea secrets.

---

### hyg-13-knowledge-graph-diff.yml — PORT

**What it does:** On push to `main` touching `CLAUDE.md`, `ops/`, `specs/`, or `*.json`, diffs
changed knowledge files and posts a summary to Notion Thread Archive. Sends Pushover.

**Why it "fails" on Gitea today:** Does not fail at the runner level — script uses Notion API
and git diff. Standard env vars `GITHUB_REPOSITORY`, `GITHUB_SHA`, and context variable
`github.event.before` are all provided by Gitea under the same names (Gitea implements
GitHub-compat env var names for these).

**If ported:** Zero workflow-level changes. Verify `NOTION_API_KEY` and
`NOTION_THREAD_ARCHIVE_ID` (hardcoded as `322cea3cd9e881bb8afcd560fe772481`) access in Gitea.

---

### hyg-14-rubric-drift.yml — PORT

**What it does:** On every PR to `main`, enforces rubric coupling: if MVSS-tracked surface files
are changed, the PR must also touch the spec or rubric file (or carry `rubric-n/a` label). Pure
shell + awk against `ops/surface-map.md`.

**Why it fails on Gitea today:** Uses `github.event.pull_request.base.sha` and `github.sha` in
a `run:` step — both are provided by Gitea. Uses `toJson(github.event.pull_request.labels.*.name)`
for label check — Gitea supports this context expression in `env:` blocks for most PR events.

**If ported:** Very low risk — verify `toJson(github.event.pull_request.labels.*.name)` resolves
correctly on Gitea (it does for `pull_request` events; confirm behavior on `pull_request_target`
if trigger is changed). No API calls in this workflow.

---

### hygiene-filer.yml — PORT

**What it does:** Reusable workflow (`workflow_call`) that accepts a finding JSON and invokes
`file_hygiene_issue.py` to create/update a GitHub Issue in the claude:inbox.

**Why it fails on Gitea today:** `workflow_call` is supported in Gitea (v1.20+). However,
`file_hygiene_issue.py` calls GitHub Issues API (`api.github.com`) using `GH_TOKEN`.

**If ported:** Rename `GH_TOKEN` → `GITEA_TOKEN`. Update `file_hygiene_issue.py` to use Gitea
Issues API. Note: this workflow is a dependency for all hygiene workflows that call it — port
it before or alongside any hygiene workflow that uses `workflow_call` to invoke it.

---

### play-gate.yml — PORT

**What it does:** On-demand quality check for a single education route. Runs Playwright fixture
tests via `scripts/play-gate.js`, uploads evidence artifacts.

**Why it fails on Gitea today:** `actions/setup-node@v4` is a GitHub-authored action that may
not be in Gitea's built-in action mirror. `actions/upload-artifact@v4` same concern.

**If ported:** Replace `actions/setup-node@v4` with inline version check (runner host already
has Node 20). Replace `actions/upload-artifact@v4` with either: (a) a curl upload to a
persistent store, or (b) accept that artifacts are stored on the runner's local filesystem and
reference them via Gitea's artifact mechanism. Verify Gitea runner's artifact support with the
existing `feat/gitea-codex-review-mvp` workflow's lack of artifact steps as a baseline.

---

### playwright-regression.yml — PORT

**What it does:** Full E2E regression against `https://thompsonfams.com` — main, education, and
perf-frame-budget test suites. Uploads screenshots and traces. Posts PR comment.

**Why it fails on Gitea today:** Two `actions/github-script@v7` steps (comment posting). Same
`actions/setup-node@v4` and `actions/upload-artifact@v4` concerns as play-gate.

**If ported:** Replace `github-script` comment steps with curl to Gitea Issues API. Handle
`setup-node` and `upload-artifact` same as play-gate. The test suites themselves hit
`thompsonfams.com` — fully platform-agnostic. This is one of the more complex ports (3 test
jobs, 6 artifact upload steps).

---

### post-deploy-closeout.yml — PORT

**What it does:** After successful `Deploy and Notify`, pulls deployed versions, updates Notion
PM Active Versions DB, sweeps CF routes from `ops/routes.json`, appends thread handoff to Notion.
Logic in `post_deploy_closeout.py`.

**Why it fails on Gitea today:** `gh pr list` for PR metadata lookup; `workflow_run` trigger
references `Deploy and Notify` by name. Script is Notion + curl — no GitHub API calls.

**If ported:** Replace `gh pr list` with Gitea API (`/api/v1/repos/{repo}/pulls?state=closed`).
Ensure `workflow_run` trigger name matches the ported deploy workflow name. `GITHUB_SHA` and
`GITHUB_REF_NAME` are provided by Gitea under the same names.

---

### pr-linked-issue.yml — PORT

**What it does:** Enforces that every non-chore/docs PR body contains a `Closes #N` /
`Fixes #N` / `Resolves #N` keyword. Pure Python inline script using only env vars from workflow
context.

**Why it fails on Gitea today:** It likely does not fail — this workflow uses zero GitHub API
calls. All data comes from `github.event.pull_request.*` context, which Gitea provides under
the same keys.

**If ported:** High confidence zero changes needed. Verify `toJSON(github.event.pull_request.labels.*.name)`
resolves on Gitea `pull_request` events (compat in Gitea 1.20+). This is the lowest-risk PORT
in the set.

---

### rail-watchdog.yml — PORT (unclear — flag to LT)

**What it does:** Daily check that each scheduled safety rail (`hyg-*` workflows) has had a
successful run within its expected interval. Sends Pushover on stale rails. Inline Python script
using GitHub Actions API to query last successful run timestamps.

**Why it fails on Gitea today:** Inline Python calls GitHub REST API (`api.github.com/repos/{repo}/actions/workflows/{filename}/runs?status=success`). The URL is hardcoded (implicitly via GITHUB_REPOSITORY + github.com base). On Gitea, the equivalent is
`/api/v1/repos/{repo}/actions/workflows/{id}/runs` — but Gitea uses numeric workflow IDs, not
filenames, which changes the query pattern.

**What's unclear:** Gitea's API returns workflow tasks differently — the path by filename vs by
numeric ID may require a lookup step. Additionally, the rail list hardcodes `.github/workflows/`
filenames; after migration these will move to `.gitea/workflows/`. The full script needs rewriting
but the logic is sound. Flagging to LT: confirm whether the Gitea runner's Actions API fully
supports per-workflow run history at the needed granularity, or whether this watchdog should be
simplified (e.g., time-based cron health check via Pushover heartbeat instead of API polling).

---

### review-fixer.yml — DELETE

**What it does:** Auto-applies deterministic review fixes on PRs labeled `pipeline:fix-needed`.
Checks out PR branch, runs `review-fixer.js`, commits and pushes fixes, then re-dispatches
`codex-pr-review.yml` via GitHub API.

**Why delete:** Deeply GitHub-specific throughout:
- Requires `PIPELINE_BOT_TOKEN` (GitHub PAT with push access) for branch checkout and push
- `review-fixer.js` uses GitHub Octokit SDK to read PR state, read review comments, and apply labels
- Post-fix redispatch calls `api.github.com/repos/{repo}/actions/workflows/codex-pr-review.yml/dispatches`
- `git remote set-url` uses `github.com` hardcoded

Porting this requires rewriting `review-fixer.js` entirely against Gitea's API. The
auto-fix-and-redispatch pattern also assumes GitHub's review-comment threading model, which
differs from Gitea. This is architectural scope, not a port. Delete now; if the auto-fixer pattern
is re-specced for Gitea it starts from scratch.

---

### review-watcher.yml — DELETE

**What it does:** Aggregates pipeline state across all PR checks and maintains a live summary
comment on the PR. Watches `workflow_run` events for CI, Codex, and Playwright results.
Logic in `review-watcher.js`.

**Why delete:** `review-watcher.js` is heavily GitHub Octokit SDK-dependent — calls
`github.rest.pulls.get`, `github.rest.actions.listWorkflowRunsForRepo`, `github.rest.issues.*`
throughout. The `workflow_run` trigger watches workflows by display name that are GitHub-side
(`TBM Smoke + Regression`, `Codex PR Review`, `Playwright Regression`). The pipeline relay URL
(`PIPELINE_RELAY_URL`) calls a GAS endpoint that may itself be GitHub-aware. This is not
a port — it's a full rewrite of a stateful aggregator against Gitea's API, which has different
check-run and PR-status APIs. Delete; if LT wants a Gitea-native pipeline dashboard it needs a
fresh spec.

---

### workflow-lint.yml — PORT

**What it does:** On PRs touching `.github/workflows/` or `.github/scripts/`, runs actionlint,
shellcheck, py_compile, F07 pull_request_target policy, F08 artifact-download policy, and
rubric schema validation.

**Why it fails on Gitea today:** Path filter targets `.github/workflows/**` and
`.github/scripts/**` — on Gitea, workflows will live in `.gitea/workflows/`. Actionlint is
downloaded directly from GitHub releases (not a GitHub Action) — works anywhere. Policy checks
hard-scan `.github/workflows/*.yml` file paths.

**If ported:** Update `paths:` filter to include `.gitea/workflows/**`. Update the inline F07
and F08 policy checks to glob `.gitea/workflows/*.yml` (and optionally `.github/workflows/*.yml`
during the transition period). actionlint invocation needs to point to `.gitea/workflows/*.yml`.
The rubric schema validation is path-agnostic.

---

## Recommended Execution Order

### Batch 1 — DELETEs (no dependencies, do first)

Remove the three DELETE files in a single `CHORE:` PR. Zero downstream effects because:
- `code-sweep.yml` was never operational (NOTION_API_KEY not configured)
- `review-fixer.yml` is only triggered by `pipeline:fix-needed` label — not in active use on Gitea
- `review-watcher.yml` dependencies (`ci.yml` dispatch, `review-fixer.js`) are GitHub-side

```
CHORE: remove github-only workflows (code-sweep, review-fixer, review-watcher)
```

### Batch 2 — DEDUPE verification + delete

Before deleting `.github/workflows/codex-pr-review.yml`:
1. Verify `.gitea/workflows/codex-pr-review.yml` is merged to `gitea/main` (PR #1 must close first)
2. Confirm no other workflow dispatches `codex-pr-review.yml` by filename (search: `review-fixer.yml`
   dispatched it — being deleted in Batch 1; `ci.yml` dispatched `review-watcher.yml`, not this one)
3. Delete in a `CHORE:` PR

### Batch 3 — Zero-change PORTs (no script updates, workflow YAML only)

These require only workflow-level token renames or path adjustments — no Python/JS changes:
- `hyg-03-integration-map-drift.yml` — secrets only
- `hyg-05-parking-lot-age.yml` — secrets only
- `hyg-11-trust-backlog-age.yml` — secrets only
- `hyg-13-knowledge-graph-diff.yml` — zero changes (env vars are compat)
- `hyg-14-rubric-drift.yml` — low-risk, verify label context compat
- `pr-linked-issue.yml` — likely zero changes; verify label compat
- `workflow-lint.yml` — path filter update only

**Block on Batch 1:** none. Can run in parallel with Batch 1.

### Batch 4 — PORTs requiring script edits (Python/JS)

Each of these requires updating a `.github/scripts/*.py` file AND the workflow YAML. They have
no cross-dependencies on each other but depend on `hygiene-filer.yml` (which is itself a PORT)
if any hygiene workflow calls it as `workflow_call`.

Recommended sub-order:
1. `hygiene-filer.yml` first (dependency for hygiene callers)
2. `hyg-01-stale-branches.yml`
3. `hyg-02-orphaned-prs.yml`
4. `hyg-04-claude-md-bloat.yml`
5. `hyg-06-version-drift.yml` (after deploy-and-notify port confirms its name)
6. `hyg-08-dead-workflows.yml`
7. `codex-finding-listener.yml`
8. `codex-rereview-handoff.yml`
9. `hyg-07-secrets-audit.yml` is DELETE — already handled in Batch 1

### Batch 5 — Deploy pipeline PORTs (must be sequential; touch production)

These affect live deployment. Port in this order:
1. `deploy-and-notify.yml` — gate: smoke must pass on Gitea runner before marking done
2. `deploy-worker.yml` — gate: CF Worker smoke must return correct BUILD_ID
3. `deploy-uptime-worker.yml` — gate: uptime worker deploys cleanly
4. `post-deploy-closeout.yml` — gate: depends on `deploy-and-notify` name being stable

**Block on Batch 4 for `hyg-06-version-drift.yml`** (workflow_run trigger name must match
`deploy-and-notify` port).

### Batch 6 — CI and test PORTs (highest complexity)

These touch the PR review gate — highest risk if broken:
1. `ci.yml` — replace `github-script` steps; verify smoke comment posts correctly
2. `playwright-regression.yml` — most complex port (3 jobs, 6 artifact steps, 2 comment steps)
3. `play-gate.yml` — depends on artifact handling decision

### Batch 7 — Watchdog (flag to LT before starting)

- `rail-watchdog.yml` — needs LT decision on Gitea Actions API availability and watchdog design
  before starting. Do not port until Gitea API capabilities are verified with a test call.

### Batch 8 — Codex pipeline (after Batch 6 CI is stable)

- `review-fixer.yml` — DELETE (done in Batch 1)
- `review-watcher.yml` — DELETE (done in Batch 1)

These are already handled; Batch 8 is a placeholder if a Gitea-native pipeline-dashboard spec
is opened later.

---

## Notes on Gitea Action Compatibility

`actions/checkout@v4` — included in Gitea's built-in action mirror. Works.
`actions/setup-node@v4` — NOT in Gitea's built-in mirror by default on self-hosted runners.
  Host runner already has Node 20 installed; use `node --version` check instead.
`actions/upload-artifact@v4` — behavior on self-hosted Gitea runners varies by Gitea version.
  Verify before using; consider inline artifact archival as fallback.
`actions/github-script@v7` — GitHub-authored, NOT available. Replace with `curl` to Gitea API.
`cloudflare/wrangler-action@v3` — community action, NOT available. Inline wrangler.
`anthropics/claude-code-action@v1` — NOT available. DELETE workflows using it.

`GITHUB_TOKEN` / `GITEA_TOKEN` — Gitea provides both as aliases for the same built-in job token.
  Using `GITEA_TOKEN` is idiomatic (per the proven codex-pr-review.yml). Either works today.
  Standard env vars (`GITHUB_SHA`, `GITHUB_REPOSITORY`, `GITHUB_RUN_ID`, `GITHUB_SERVER_URL`,
  `GITHUB_REF_NAME`) are all populated by Gitea under the same names.
