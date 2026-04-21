# Thread Handoff — 2026-04-19 Control-Plane Phase C

**Session:** 2026-04-19, single long session. GitHub account suspended
since ~00:30 CT same day. All work is local-only on feature branches.

---

## What shipped this session

### Control plane (Cloudflare Worker `tbm-cp-events`)

Live at `https://tbm-cp-events.lthompson.workers.dev`. Current version
`5ccfba46` (latest counted; heartbeat version 5caa194 with §E.5 comment
is pending redeploy — comment-only so benign to defer).

**Endpoints:**
- `GET /events/health` — 200 + binding status (unauth)
- `POST /events/notion` — signed state transitions (live)
- `POST /events/forge/{gitea|github}` — stub
- `POST /events/openai/callback` — stub
- `GET /events/heartbeat-tick` — manual §E.4 trigger
- `GET /events/escalation-tick[?age_hours=N]` — manual §E.5 trigger

**Crons:** `*/5 * * * *` heartbeat + `0 */4 * * *` escalation — both active.

**Integration verified live:** 13 paths (signature, transitions,
idempotency, invalid-transition, BLOCKED with policy table,
resolution clear-on-exit, heartbeat reclaim, escalation scan + dedup,
Pushover graceful degrade). See `test/integration.mjs` for replayable
suite; `ops/migration/control-plane-architecture.md` for full system
doc.

### Forge adapters

Abstract contract `adapters/base.py` + concrete `adapters/gitea.py`
(476 lines, untested against live Gitea). GitHub adapter deliberately
not written — GitHub is fallback-only now.

### Hooks

`.githooks/commit-msg` extended to enforce `#N` / `CHORE:` / `DOCS:` /
`CONFIG:` / `WIP:` rule at the git layer (not just Claude-harness
pre-exec hook). 12/12 self-tests pass. `.githooks/README.md` documents
the tier split.

### Docs (new in `ops/migration/`)

- `hetzner-cx22-order-spec.md` — field-by-field VPS order runbook
- `section-E5-exception-ownership.md` — canonical §E.5 defaults + invariants (LT-approved)
- `gitea-install-runbook.md` — install Gitea + Caddy + PostgreSQL on the provisioned VPS
- `control-plane-architecture.md` — system-level doc; read this FIRST if walking in cold

### Claude memory updates

- `feedback_notion_filter_quirks.md` — renamed-column filter quirk + DS vs DB ID distinction
- `feedback_cf_worker_free_plan_do.md` — `new_sqlite_classes` migration requirement
- `reference_cp_events_worker.md` — worker URL, IDs, how to redeploy

---

## Commits landed (branch → sha → one-liner)

All LOCAL; nothing pushed (GitHub suspended):

| Branch | Commit | One-liner |
|---|---|---|
| `feat/control-plane-events-worker` | `9b879a3` | wire KV + SQLite DO; first deploy |
| | `cbcf827` | real /events/notion flow + HMAC + state-matrix tests |
| | `9aa86f5` | align notion.js with verified WQ schema |
| | `23a27c9` | BLOCKED-state exception-queue support |
| | `ab81399` | heartbeat watcher (§E.4) |
| | `9e064d5` | replayable integration test suite |
| | `9e74335` | escalation watcher (§E.5) |
| | `5caa194` | point DEFAULT_EXCEPTION_OWNER at canonical §E.5 doc |
| `feat/adapter-interface` | `bb78235` | base.py — ForgeAdapter contract |
| | `3c3d763` | gitea.py — concrete impl (untested vs live) |
| `config/preview-path-fix-and-hetzner-spec` | `08bae14` | launch.json fix + Hetzner CX22 runbook |
| `config/githooks-commit-msg-expansion` | `56159dd` | commit-msg hook + .githooks/README |
| `docs/section-E5-canonical` | `d982339` | canonical §E.5 doc |
| `docs/control-plane-phase-c-artifacts` | (this commit) | architecture + Gitea runbook + handoff |

Total: 14 commits across 6 branches.

---

## Open items for LT

### Blocking nothing today

1. **Archive `PIPE-TEST-20260419`** — Notion test row, currently in
   READY-TO-BUILD with an audit-stamp `last_event_reason`. Safe to
   leave; delete via Notion UI when convenient.
2. **Pushover secrets** (optional) — `wrangler secret put
   PUSHOVER_APP_TOKEN` + `PUSHOVER_USER_KEY` if you want the escalation
   watcher to actually page instead of log-only.
3. **Hetzner order email** — the runbook uses `lthompson@memoveindesigns.com`;
   LT flagged that they don't check that inbox regularly. Update the
   runbook (one-line change) before clicking through Hetzner's signup.
   My recommended replacement: `thompson090916@gmail.com` (already
   used for Drive per CLAUDE.md). Pending LT confirm.

### Next concrete steps

When LT is ready for host setup:
1. Order Hetzner CX22 per `ops/migration/hetzner-cx22-order-spec.md`
   (update the email first).
2. First SSH + hardening (step 6 of that runbook).
3. Install Gitea + Caddy + Postgres per `ops/migration/gitea-install-runbook.md`.
4. Create bot PAT on Gitea; `wrangler secret put GITEA_TOKEN`.
5. Generate + wire `HMAC_SECRET_FORGE` for incoming Gitea webhooks.
6. Import bundle (`ops/migration/tbm-apps-script-2026-04-19.bundle`).
7. Sacrificial test PR through the new pipeline.

---

## Mental model

Full architecture in `ops/migration/control-plane-architecture.md`. One
sentence: **agents POST signed events to the Worker; the Worker's
per-`work_id` Durable Object serializes against concurrent writes,
checks the §E.11 state matrix, writes Notion atomically with KV-based
idempotency**. Notion is the durable projection; the DO is the
transactional boundary.

---

## Unresolved questions + decisions deferred

- **§E.5 canonical text** — LT approved my best-guess table as
  canonical (see change log in `section-E5-exception-ownership.md`).
  If a prior §E.5 draft surfaces, reconcile before next BLOCKED-touching
  deploy.
- **Notion filter quirk** — root cause not investigated (renamed
  `last_event` column returns 0 hits on server-side filter).
  Client-side workaround in place; formal fix deferred.
- **Gitea adapter review-thread method** — returns `[]` because Gitea
  v1 doesn't expose thread-resolution state. Autonomous-merge gate on
  Gitea PRs will need a different signal (likely: explicit reviewer
  approval via check-run states).
- **Hot-file commits scattered across branches** — .claude/launch.json
  only exists on `config/preview-path-fix-and-hetzner-spec`; if LT
  starts a new branch from `origin/main`, the preview path fix is NOT
  there. Either merge that branch when possible, or accept that
  preview will break on branches not descended from it.

---

## Working tree state as of handoff

- Main tree is on `docs/control-plane-phase-c-artifacts`.
- Phantom diffs from an earlier `git reset --mixed origin/main` remain
  in the working tree (grinder file deletions, HTML modifications —
  NOT real uncommitted work, just the delta between the local cached
  `main` and `origin/main`). They were never committed and can be
  discarded with `git restore .` when LT wants a clean tree — BUT
  that also discards the pre-session uncommitted work in
  `.claude/settings.local.json` and `ops/README.md`. Two ways:
    1. Stash legit work, `git restore .`, pop stash — clean.
    2. Just leave the tree dirty; it's local-only noise.

---

## Where to pick up next

Default next move: address the three open items above (email update,
then Hetzner order when LT's ready). Real-time walkthrough mode per
LT's preference — I wrote the runbooks; LT clicks through; we
sync on each step.

Secondary: push these 14 local commits once a destination exists
(GitHub restored OR Gitea up). No rush.

---

## Post-checkpoint additions (same session, continued past the handoff)

After this handoff was first written the session kept going through the
whole host-stack setup. Everything below is additive on top of the
earlier sections.

### Infrastructure (Gitea host is LIVE)

- **Hetzner CX33** at `159.69.36.234` (Nuremberg, eu-central),
  Ubuntu 24.04, $10.19/mo. Hardened: ufw, fail2ban, unattended-upgrades,
  `lt` NOPASSWD sudo, root SSH disabled, SSH restricted to LT's home IPv4 `/32` + IPv6 `/64` at the Hetzner firewall.
- **PostgreSQL 16** backing Gitea.
- **Gitea 1.24.6** at `https://git.thompsonfams.com` — admin `lt`
  created via web installer, `tbm-bot` created via CLI (long-lived PAT
  `cp-events-worker-2026-04-19` is live as `GITEA_TOKEN` on the worker).
- **Caddy 2.11.2** reverse-proxying to Gitea:3000; Let's Encrypt cert
  auto-renewed.
- **`tbm-runner-1`** Gitea Actions runner registered, host mode,
  labels `ubuntu-latest:host,ubuntu-22.04:host`. Host has Node 20 +
  Python 3 + requests pre-installed.
- **All 150 branches + tags** mirrored from local to Gitea.

### Control-plane wiring

- Worker secrets `GITEA_TOKEN` + `HMAC_SECRET_FORGE` set.
- `/events/forge/gitea` handler graduated from stub: HMAC-verifies,
  parses event type/delivery/repo/action/sender/ref/pr_number, logs
  structured, returns 200. Deployed as `8e87f4f5-fc3e-442e-aac8-452137638fdc`.
- Gitea → CF Worker webhook configured (hook id=1): push, pull_request,
  pull_request_review, issues, issue_comment, release — all HMAC-signed.
  Not explicitly end-to-end tested (LT lacked `write:issue` scope at
  the test moment); first real event will exercise it.

### Codex PR review on Gitea (THE PIPE WORKS)

- `.gitea/workflows/codex-pr-review.yml` MVP on branch
  `feat/gitea-codex-review-mvp`. Uses `${{ secrets.GITEA_TOKEN }}`
  (renamed from `GITHUB_TOKEN` — both compat aliases in Gitea; GITEA_
  is idiomatic). Reuses `.github/scripts/codex_review.py` unchanged.
- `OPENAI_API_KEY` added to Gitea repo secrets.
- **Proven on PR #1**
  (`git.thompsonfams.com/blucsigma05/tbm-apps-script/pulls/1`): runner
  picked up workflow → fetched diff → called gpt-4o → posted comment
  back to PR → gated merge on INCONCLUSIVE verdict. Full pipe.
- **Known noise:** the old `.github/workflows/*.yml` (~30 files) are
  ALSO discovered by Gitea Actions. They fail fast (GitHub-specific
  deps) but clutter the runner log. Remove or relocate as follow-up.

### Codex doc patches (accepted + committed)

Parallel Codex thread flagged two doc issues, surgically patched them,
LT approved:
- `ops/WORKFLOW.md` — stale contradiction (said blocker Issues weren't
  auto-created; contradicted the live claude:inbox filer from #450).
- Both `CLAUDE.md` + `ops/WORKFLOW.md` — added explicit rule stating
  INCONCLUSIVE-or-stronger-review-requested should auto-escalate into
  deep Codex audit (intent, not yet built).

Committed on `docs/phase-c-codex-patches` (commit `bf9f28f`).

### Phase D tracked

[Issue #2](https://git.thompsonfams.com/blucsigma05/tbm-apps-script/issues/2):
auto-escalate INCONCLUSIVE Codex verdicts into deep-audit lane. Full
design sketch in body — new WQ states `DEEP-AUDIT-PENDING` /
`DEEP-AUDIT-RUNNING`, label-based trigger auto-applied on INCONCLUSIVE,
longer-context / stronger-model deep audit, merge gate integration.
This is genuinely new scope (Phase D), not Phase C incompleteness.

### Credentials hygiene (end of session)

Three setup PATs revoked by LT in Gitea UI:
- `admin-claude-setup-2026-04-19`
- `claude-setup-repo-create-2026-04-19` (was embedded in git remote
  URL — the exposed one)
- `claude-setup-issue-create-2026-04-19`

The token embedded in `.git/config` was stripped via
`git remote set-url gitea https://git.thompsonfams.com/...`. `.git/config`
grep confirmed clean.

`cp-events-worker-2026-04-19` (tbm-bot PAT) remains — still live as
`GITEA_TOKEN` on the worker. Do NOT revoke.

### Branches awaiting PR → main merge on Gitea

`gitea/main` is still at `b40cd2e` (pre-session). Phase C code lives
on feature branches, not canonical:

| Branch | Commits ahead | Status |
|---|---|---|
| `feat/control-plane-events-worker` | 8 | needs PR + audit |
| `feat/adapter-interface` | 2 | needs PR + audit |
| `config/preview-path-fix-and-hetzner-spec` | 1 | needs PR + audit |
| `config/githooks-commit-msg-expansion` | 1 | needs PR + audit |
| `docs/section-E5-canonical` | 1 | needs PR |
| `docs/control-plane-phase-c-artifacts` | 1 | needs PR (contains THIS file) |
| `feat/gitea-codex-review-mvp` | 4+ | **PR #1 open, INCONCLUSIVE-blocked** |
| `docs/phase-c-codex-patches` | 1 | needs PR |

Merging these is its own chunk of work. The Codex workflow auto-blocks
on FAIL/INCONCLUSIVE so each PR needs either a clean pass or an
explicit gate bypass.

### Desktop git auth — NEEDS SETUP for next session

The `gitea` remote has no stored credential anymore. Next `git push
gitea ...` will prompt for username + password and fail unless a
credential helper is wired.

Recommended first action for next session:
```bash
git config --global credential.helper manager
# Or: git config --global credential.helper store  (plaintext — less safe)
```

Then generate a FRESH PAT in Gitea (Settings → Applications) with
scopes `write:repository,write:issue` (no admin). Do one push; enter
PAT at prompt; Windows credential manager stores it. Future pushes
reuse the stored credential.

**DO NOT embed the PAT in the remote URL.** That's what got exposed
the first time. Token in URL = token in `.git/config` plaintext.

### Prioritized next-session backlog

1. **Git credential helper setup** (above) — 2 min, unblocks pushes
2. **Delete `.github/workflows/*.yml`** from main via `CHORE:` PR —
   kills the 30+ noise jobs on every push
3. **Merge the 8 feature branches** into `gitea/main` — makes Phase C
   canonical, not just operational
4. **Phase D (Issue #2)** — INCONCLUSIVE auto-escalation lane
5. **Add tbm-bot as org member** on `blucsigma05` — bot currently can't
   see private repos; webhook delivery works (HMAC, not PAT), but
   direct API calls FROM worker TO Gitea via tbm-bot PAT will 404
   until membership is granted
6. **Reboot `tbm-primary`** to pick up the pending kernel upgrade from
   the earlier apt upgrade (~1 min downtime)

### Kickoff line for next session

> "Resume from `ops/thread-handoffs/2026-04-19-control-plane-phase-c.md`
> post-checkpoint section. Phase C operationally done, credentials
> clean, backlog tracked. Start with git credential helper setup,
> then either close the main-branch gap or start Phase D (Issue #2)."
