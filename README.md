# TBM (TillerBudgetMaster)

> **Canonical forge: Gitea.** GitHub is an automated mirror maintained for historical access and disaster recovery — all writes go to Gitea.

Google Apps Script + HtmlService system for household finance, kid chore management, and education dashboards. Google Sheets is the data layer, Tiller Money syncs bank data, HTML dashboards served via GAS web app, Cloudflare Workers proxy at [thompsonfams.com](https://thompsonfams.com).

## Canonical forge + mirror

| Surface | Role | URL |
|---|---|---|
| **Gitea** | **canonical source control** — PRs, Issues, CI, branch protection, deploy pipeline | [git.thompsonfams.com/blucsigma05/tbm-apps-script](https://git.thompsonfams.com/blucsigma05/tbm-apps-script) |
| GitHub | auto-mirror (DR + historical URL access + external-reader read-only) | [github.com/blucsigma05/tbm-apps-script](https://github.com/blucsigma05/tbm-apps-script) |

The mirror is one-way (`gitea/main` → `github:main`) via `.gitea/workflows/mirror-to-github.yml`. Fast-forward only — **no `--force` flags**. All writes originate on Gitea.

History: 2026-04-19 migration to Gitea (after GitHub account suspension). 2026-04-22 GitHub account unsuspended; forge canon clarified to Gitea-primary + GitHub-auto-mirror (Gitea Issues #60 + #61, Items Θ + Φ of Wave 0 audit plan).

## Where to read next

- **Builders / agents** — read [`CLAUDE.md`](CLAUDE.md) top to bottom. § Forge Canon is mandatory before any git/CI operation; the rest of the file covers architecture, ES5 enforcement, deploy pipeline, QA gates, and the pattern registry.
- **Reviewers (Codex, Anthropic, human auditors)** — read [`ops/readme-for-codex-reviewers.md`](ops/readme-for-codex-reviewers.md) first. It is the Gitea-era reviewer onboarding doc: current source-of-truth table, tiered reading list, known stale references.
- **Process / workflow / labels / Issue-PR-Project hierarchy** — read [`ops/WORKFLOW.md`](ops/WORKFLOW.md). Two-Lane Handoff Rules, audit scope rules, memo trigger phrases.
- **Thin pointer for ecosystem tools** — [`AGENTS.md`](AGENTS.md) points at the above.
- **Phase status (migration, filer, hygiene, etc.)** — [`ops/PHASES.md`](ops/PHASES.md) is the single source of truth.

## Never push to GitHub directly

`origin` = the mirror. Do not run `git push origin <branch>` from your workstation — that bypasses the Gitea canonical forge, and the mirror workflow expects origin/main to only ever fast-forward from gitea/main. If a branch lands on GitHub without going through Gitea first, the next mirror push fails (which is the correct, fail-loud behavior).

For one-time GitHub sync operations (e.g. closing a divergence gap), use `scripts/one-time-github-catchup.sh` — it has fail-closed defenses against accidental force-pushes.
