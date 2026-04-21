# Codex Reviewer README — Read This First

> **Cardinal rule:** GitHub is suspended. **Gitea is canonical** for all current operations unless a doc explicitly says otherwise. If you see a reference to GitHub in code or docs, assume it is legacy context, not a live signal.

This file exists so any automated or human reviewer coming into this repo can get correct context in one read. Tiered by what answers which question — skip down to the tier that matches your task.

---

## Current source of truth

| Domain | Canonical home |
|---|---|
| Source control | **Gitea** — `git.thompsonfams.com/blucsigma05/tbm-apps-script` |
| PRs & Issues | **Gitea** at the URL above |
| Repo remote for audits | `gitea` (not `origin`) |
| CI + PR review | **Gitea Actions** → `.gitea/workflows/codex-pr-review.yml` |
| Deploy pipeline | **Gitea Actions** → `.gitea/workflows/deploy-*.yml` (5 workflows) |
| GitHub repo | **Archive-only** since 2026-04-19 — account suspended, push forbidden, historical read OK |
| Gemini GitHub Action | **Retired** 2026-04-19 — replaced by Codex (OpenAI gpt-4o) |
| VPS hosting Gitea | `tbm-primary` at `159.69.36.234` (Hetzner CX33 Nuremberg); SSH via `ssh tbm-primary` |

---

## Tier 1 — governance (read first; answers "what are the rules")

1. **`CLAUDE.md`** (repo root) — build-flow, pre-authorized merges policy, hook overrides, credential stack, execution-lane rubric
2. **`C:\Users\BluCs\.claude\CLAUDE.md`** (user-global) — broader version of the same content; canonical if the two disagree

## Tier 2 — the Gitea migration (answers "how did we get here")

3. **`ops/thread-handoffs/2026-04-19-control-plane-phase-c.md`** — Phase C closing state when the migration flipped
4. **`ops/migration/gitea-install-runbook.md`** — how Gitea is deployed on `tbm-primary`
5. **`ops/migration/workflow-triage-2026-04-19.md`** — per-file triage of all 28 legacy `.github/workflows/*.yml` with rationale (DELETE / PORT / DEDUPE)
6. **`ops/migration/phase-d-deep-audit-design.md`** — deep-audit architecture: Codex CLI primary, Anthropic fallback; α/β/γ trigger paths; run caps

## Tier 3 — the code surfaces (answers "what's actually wired")

7. **`.gitea/workflows/codex-pr-review.yml`** — the workflow Codex itself runs under; shows how PRs get reviewed + verdicts posted
8. **`.gitea/workflows/deploy-and-notify.yml`** — canonical deploy flow: `clasp push` → smoke → Gitea release → Pushover
9. **`adapters/base.py` + `adapters/gitea.py`** — forge-abstraction layer. `ForgeAdapter` interface + Gitea concrete implementation. `ForgeCapabilityUnavailable` is the exception callers catch when a required signal is not available on the target forge (fail closed, never fail open)

## Tier 4 — infra components (answers "what runs where")

10. **`cf-events-worker/README.md` + `cf-events-worker/src/index.js`** — Cloudflare Workers-based control-plane event bus. Notion → Worker → Durable Object work-queue → agent pickup
11. **`.gitea/workflows/` directory listing** — all 23 ported workflows; shows breadth of what's automated

## Tier 5 — operational history (answers "what's been discussed")

12. **Gitea Issue #7** (closed) — PORT wave umbrella; 17 merged PRs with full audit trail
13. **Gitea Issue #2** (open) — Phase D deep-audit build kickoff
14. **Gitea Issue #23** (open) — rail-watchdog redesign follow-up

---

## Known stale references

These places still mention GitHub as canonical and will be cleaned up opportunistically. If you hit one, treat it as out-of-date, not load-bearing:

- **Notion Global Memory** (`notion.so/2c2cea3cd9e8815bae35d37dbb682cee`) — last rewritten 2026-04-04 before the migration. Claims GitHub canonical + Gemini CI active. A canonical rewrite is in flight in a parallel Opus thread. **Trust CLAUDE.md over Global Memory until the rewrite lands.**
- **Notion Project Memory pages** — may still reference `github.com/blucsigma05/...` paths. Use the Gitea URL as truth.
- **Inline comments and docstrings across the repo** — migration was transport-only; many scripts still have "GitHub" in comments where only the token name or API base URL changed. If the logic is Gitea-correct and only the comment is stale, it's fine.
- **`C:/Dev/tbm-apps-script/.github/scripts/*.py`** — Python scripts still live under `.github/scripts/` (not `.gitea/scripts/`) because `.gitea/workflows/*.yml` reference them at that path. The path is historical, not a statement about canon.
- **`origin` remote on local clones** — still points at GitHub for archive read. Use `gitea` remote for all operations.

---

## When this doc is out of date

Update in-place. Small CHORE PR is fine — no issue-first needed since this is documentation. Keep the tier ordering stable (reviewers scroll to the section matching their task).

Ownership: Claude (Opus) maintains per CLAUDE.md governance-docs rule.

*Last updated: 2026-04-21 — initial version.*
