# 2026-04-24 — TBM Cascade Close

**Thread:** Opus 4.7 / 1M context. Closed at deploy-and-notify run 1202 SUCCESS, full pipeline validated end-to-end.

---

## Headlines

- **Stabilization 13.5% → 29.7%** (Done 15 → 33 of 111). +18 items via P1 sweep scrub.
- **Auto-deploy on merge: WORKS** — validated run 1202 (npm install + clasp push + clasp deploy + smoke + Gitea release + Pushover all green).
- **CI gates restored:** `workflow-lint`, `pr-linked-issue`, `playwright-regression` all functional after multi-cause chain fixes.
- **31 PRs merged this session.**
- **17+ Gitea Issues closed.**
- **act_runner v0.2.11 → v0.4.1** + capacity 1 → 2 on tbm-primary.
- **Kid + finance surfaces fixed in production:** /wolfdome + /sparkle-kingdom titles, /daily-adventures JJ context, /sparkle 12s bootstrap, /progress loader, /pulse Monthly Cash Flow math reconciles.

---

## Cascade chain (fix-order)

| # | Issue / Concern | PR | Outcome |
|---|---|---|---|
| 1 | Workflow Lint broken 4 days (Gitea #98) | #106 (4 commits) | Fixed: install-path → shellcheck guard → actionlint v3 ignore → pip PEP 668 bypass. Closed #98. |
| 2 | act_runner capacity bottleneck (Gitea #111) | #114 doc | Capacity bumped 1→2 on host; documented `ops/host-config/act_runner.md`. |
| 3 | codex-audit skill packaging (Gitea #92) | #117 | `.claude/skills/codex-audit/SKILL.md` — closed-set scrub + correlate + byte-verify methodology. |
| 4 | Skill discovery in Desktop App slash picker | #118 | Mirrored adversarial-defender + prompt-auditor-pass into project-local. |
| 5 | /pulse Monthly Cash Flow math (Gitea #95) | #129 + manual /deploy-pipeline @681 | Dropped v60 server-netCF override; rows + total reconcile. Live in production. |
| 6 | act_runner v0.2.11 → v0.4.1 | (host change, no PR) | Fixes node24 compat in upgraded GitHub actions. |
| 7 | npm install -g EACCES on host-mode runner (Gitea #130) | #131 | User-scope `$HOME/.npm-global` prefix in deploy-and-notify + deploy-uptime-worker. |
| 8 | pr-linked-issue null-labels crash (Gitea #126) | #132 | `if labels is None: labels = []` after json.loads. Validated 2 SUCCESS runs. |
| 9 | deploy-worker.yml fail-closed on missing CF_WORKER_URL (Gitea #70) | #133 | Changed warning+exit 0 to error+exit 1. |
| 10 | .claspignore stale (cf-events-worker + .gitea pollution) | #134 (CHORE) | Lifted from local working tree to gitea/main. |
| 11 | deploy-and-notify metadata bugs (Gitea #139) | #140 | Fixed TAG env-prefix order + Pushover priority=2 retry/expire params. |
| 12 | Backlog scrub items 28-50 | #127 | 18 items marked Done with sweep evidence. |
| 13 | Mass merge of #72 cohort (scheduled routines) + master-thread PRs | #57, #74, #77-85, #91, #101-103, #105, #108-110, #115-116 | 21 PRs merged in cascade waves. |
| 14 | Issue #72 reopened (interim findings visibility) | n/a | Until #128 filer landing. |

---

## State of the world (as of close)

### CI / runner
- `act_runner v0.4.1` on tbm-primary, capacity 2.
- `deploy-and-notify.yml` — auto-fires on `.gs/.html` push to main. **Validated end-to-end run 1202.**
- `workflow-lint`, `pr-linked-issue`, `codex-pr-review`, `hyg-14-rubric-drift`, `ci.yml` — green on recent PRs.
- `playwright-regression` — running again post-act_runner-upgrade (was blocked on node24 since 2026-04-20).

### Open Gitea Issues at close: 25
- 0 blocker, 0 critical, 9 major, 8 minor, 8 unlabeled.
- Headlines unaddressed:
  - **#34** JJ letter-E audio (needs ElevenLabs API access)
  - **#66** rate limiting on /api/verify-pin (needs CF dashboard binding config)
  - **#83** 3 diagnostic GAS endpoints (recentErrors / triggerAudit / sheetGrowth)
  - **#112** zombie action_task rows (~400 stuck status=1; backlog hygiene)
  - **#128** scheduled-routine findings filer (interim: #72 reopened; full filer wiring deferred)

### Open PRs at close: 3 (all master-thread's, not mine)
- **#138** wire Codex skill board into TBM nav
- **#113** mirror workflow rebase (was blocked on workflow-lint conflict; should now resolve cleanly post-cascade)
- **#64** superseded by #113

### Stabilization backlog
- Canonical: `ops/master-stabilization-backlog.md`
- 33/111 = 29.7% Done. Self-reported in line 15 of file.
- Item 45 (/pulse cash flow) marked Open in scrub but actually FIXED via PR #129/#95 — first task of next scrub.
- Items 47/48 Fire Stick on-device verification — needs LT physical access.

### Production GAS
- Deploy ID: `AKfycbweFe1QLmIAlr2x0umcJ-uc2EIm-ADdcjJ9QjihBr6tmnt4Axz6xO73lmwBl4Jk6_KVOw`
- Latest @681 (ThePulse v65 — Gitea #95 fix)
- Other live versions: smoke shows Code.gs v96, etc. (per run 1202 smoke breakdown)

### Cloudflare Worker
- Auto-deploys via `deploy-worker.yml` on push to main when `cloudflare-worker.js` or `wrangler.toml` change. Now fail-closed on missing `CF_WORKER_URL` (Gitea #70).

### Notion
- Active Versions DB needs sync — last update precedes today's deploy. Per CLAUDE.md § Deploy Pipeline step 9.
- Issue #72 (scheduled-routine tracker) reopened as interim findings stream.

---

## Failure-pattern catalog discovered today

**"host-mode act_runner ≠ GitHub ubuntu-latest"** is the recurring class. Specific instances fixed:

| Symptom | File | Fix pattern |
|---|---|---|
| `tar: actionlint: Cannot open: Permission denied` | workflow-lint.yml | Install to `$HOME/.local/bin`, not `/usr/local/bin` |
| `shellcheck: command not found` | workflow-lint.yml | Guard step with `command -v shellcheck` |
| `actionlint exits non-zero on v3 upload-artifact` | workflow-lint.yml | `-ignore '...too old to run on GitHub Actions'` flag |
| `pip install fails PEP 668 externally-managed` | workflow-lint.yml | `--user --break-system-packages` |
| `EACCES: permission denied, mkdir '/usr/lib/node_modules/...'` | deploy-and-notify.yml + deploy-uptime-worker.yml | `npm config set prefix "$HOME/.npm-global"` + `$GITHUB_PATH` append |
| `runs.using ... got node24` | (act_runner-side) | Upgrade act_runner to v0.4.1 |

**Future symptom of same class to expect:** any new workflow that installs CLI tools globally without user-scope prefix. Pre-emptively use the patterns above.

---

## Methodology lessons codified to memory this session

- `feedback_skill_duplication_tradeoff.md` — repo-local + user-global skill duplicates can both be load-bearing.
- `feedback_gitea_status_record_drift.md` — re-runs don't refresh prior status; check `/actions/tasks` first.
- `feedback_prompt_auditor_pass_default.md` — `/prompt-auditor-pass` defaults to audit-folded; full three-pass only on explicit ask.

---

## Next thread's first three actions

(Per the master-thread bootstrap prompt that succeeded this handoff:)

1. `cd "C:/Dev/tbm-apps-script"`
2. Drain `claude:inbox` queue via Gitea API
3. If empty + LT silent: default to `/play-gate jj` or `/play-gate buggsy` for backlog items 14/15 (real verdict still needed; skill is built and live).

Critical context for next thread:
- Auto-deploy on merge **works**. No need to manually `/deploy-pipeline` for routine .gs/.html changes.
- `git push gitea <branch>` is pre-authorized.
- Use git worktrees (`/tmp/tbm-wt-N`) to avoid colliding with parallel Opus threads in `C:/Dev/tbm-apps-script`. The main workspace was hijacked by branch-switching three times in this session.
- For long Gitea API payloads, write to file + `curl --data-binary @file.json`. Heredocs trip on `${{ }}` and backticks.

---

## Uncommitted state notes

Main workspace `C:/Dev/tbm-apps-script` has uncommitted changes from session work — `.gitignore`, `Code.js`, `TheVein.html`, `ops/README.md`, `ops/evidence/codex-skills/STATUS.md`, `scripts/audit_repo_skills.py`, `CodexSkillsDashboard.html` (untracked). These appear to be master-thread artifacts (not mine) that landed locally during my session. Next thread should `git status` and decide what's intentional vs cruft.

Worktrees that may still exist: `/tmp/tbm-wt-95`, `/tmp/tbm-wt-130`, `/tmp/tbm-wt-126`, `/tmp/tbm-wt-70`, `/tmp/tbm-wt-claspignore`, `/tmp/tbm-wt-135`, `/tmp/tbm-wt-92`, `/tmp/tbm-wt-111`, `/tmp/tbm-wt-skills`, `/tmp/tbm-wt-scrub`, `/tmp/tbm-wt-98`. All branches pushed, all PRs merged. `git worktree prune` is safe.

---

_Closing thread. Next master-thread Opus picks up from the bootstrap prompt + this handoff._
