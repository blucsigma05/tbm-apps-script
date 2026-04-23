# TBM Phase Index

Canonical index of every named phase track in the TBM build loop. Updated when a phase ships, shifts, or a new track is added. Single source of truth for "what phase are we in."

**Why this file exists:** multiple overlapping phase lists (Migration, Codex filer, Hygiene, Orchestration Loop, JJ Completion Contract, StoryFactory, Phase 4 triage, Stabilization bands) accumulated across `ops/WORKFLOW.md`, `ops/migration/*`, `specs/*`, and handoff files. No single file carried current status. Reader had to grep to answer "where are we." This index replaces that.

## Update rules

- One row per phase track.
- Status values: `design`, `in-progress`, `live`, `deprecated`, `superseded`.
- `Scope` column names the core artifact file (design doc, workflow, spec).
- `Tracking` column names the canonical Gitea Issue / PR where progress is reported.
- Rows tagged **informational** capture adjacent systems that are NOT phase tracks but are routinely confused for them — they belong in the index specifically to kill the confusion.

---

## Migration tracks

| Track | Status | Scope | Tracking | Notes |
|---|---|---|---|---|
| **Migration Phase C** — control-plane build | **live** (shipped 2026-04-19) | `ops/thread-handoffs/2026-04-19-control-plane-phase-c.md`; PRs #41–#47 | handoff only (archived) | Phase C flipped TBM from GitHub-canonical to Gitea-canonical; Gitea Actions + control plane live at `tbm-cp-events.lthompson.workers.dev`. Historical track; no follow-up work. |
| **Migration Phase D** — deep-audit escalation | **design v1** (Q3 + Q9 ⚠️ OPEN) | `ops/migration/phase-d-deep-audit-design.md`; `.gitea/workflows/codex-deep-audit.yml` (stub) | Gitea Issue [#2](../../issues/2) | Milestone 1 (α + β runner) unblocked once Q9 lands. Milestone 2 (merge-gate) blocked on Q3 branch-protection boolean-OR. Milestone 3 (γ, class-mismatch auto-trigger) is v2 — separate design pass, outside current audit plan scope. |

## Codex review + filer

| Track | Status | Scope | Tracking | Notes |
|---|---|---|---|---|
| **Codex-review Filer Phase 1** — auto-file blocker/critical findings | **live** (protective) | `.github/scripts/file_codex_review_findings.py`; runs inline in `.gitea/workflows/codex-pr-review.yml` | PR #450 (GitHub lane history) | Files durable `claude:inbox` Issues on `severity:blocker`/`critical` findings. Signature-based dedup on `rule + file + evidence_hash + pr_number`. |
| **Codex-review Filer Phase 2** — auto-close resolved inbox issues | **live** (protective) | same filer script | PR #462 (GitHub lane history) | When a re-review drops a prior finding, adds `auto-close:resolved` and closes. Respects `auto:suppressed` permanent dismissal. |
| **Codex Re-review Handoff** — marker-poster (**NOT** filer Phase 3) | **live** (informational only) | `.gitea/workflows/codex-rereview-handoff.yml` | — | Posts a `<!-- codex-rereview -->` marker PR comment on every re-review. Does NOT file Issues or change state. Previously misclassified as "Filer Phase 3"; it is a distinct, non-protective subsystem. |

## Hygiene automation

| Track | Status | Scope | Tracking | Notes |
|---|---|---|---|---|
| **Hygiene Automation Phase 1** — HYG-06 version-drift pilot | **live** (pilot, single check) | `.github/workflows/hygiene.yml`; `.github/scripts/check_version_drift.py`; `file_hygiene_issue.py` | CLAUDE.md § Hygiene Automation | Phase 2+ explicitly out of scope until pilot trust-level clears. Files dedup'd hygiene Issues; `auto:filed`/`auto:suppressed` lifecycle. |

## Orchestration Loop (epic #107)

| Track | Status | Scope | Tracking | Notes |
|---|---|---|---|---|
| **Orchestration Loop Phase 1** | **live** | — | PR #113 | Part of #107 epic. |
| **Orchestration Loop Phase 2** | **live** | — | PR #114 | Part of #107 epic. |
| **Orchestration Loop Phase 3** | **in-progress** | — | PR #111 | Part of #107 epic. Previously referenced inline in `ops/WORKFLOW.md:32` example text (not a canonical ledger); that reference now points here. |

## JJ Completion Contract

| Track | Status | Scope | Tracking | Notes |
|---|---|---|---|---|
| **JJ Completion Contract Phase 1** | **in-progress** | `specs/jj-completion-contract.md` | Issue #133 | Data model + implementation pass 1. |

## StoryFactory pipeline (informational — not a migration phase)

| Track | Status | Scope | Tracking | Notes |
|---|---|---|---|---|
| **StoryFactory phased pipeline** | **live** (operational) | `specs/storyfactory-phased-pipeline.md`; `StoryFactory.js:7` header + `:1256 / :1316 / :1353` phase functions | — | Stages: Idea → Writing → Written → Illustrating → Illustrated → Assembling → Ready. `sf_phaseWrite_`, `sf_phaseIllustrate_`, `sf_phaseAssemble_` defined. A content-pipeline state machine, not a migration-style phase track — listed here because the phase vocabulary overlaps and previous audits misclassified it as "ambiguous." |

## Review lane

| Track | Status | Scope | Tracking | Notes |
|---|---|---|---|---|
| **Phase 4** — review-triage-gate | **live on GitHub lane; NOT yet ported to Gitea** | `specs/phase4-review-triage-gate.md`; `.github/scripts/triage_review.py` (commit `f74b0ed`, 2026-04-09) | Gitea port is Item 1a in current audit plan (pending Issue) | Implemented on the GitHub lane before the 2026-04-19 forge flip. `.gitea/workflows/codex-pr-review.yml:12` explicitly omits the triage pre-filter. Parity port pending as part of Wave 1. |

## Stabilization (severity bands, not phase tracks)

| Track | Status | Scope | Tracking | Notes |
|---|---|---|---|---|
| **Stabilization backlog P0–P8** | **in-progress** (13 / 111 Done = 11.7% as of 2026-04-21) | `ops/master-stabilization-backlog.md` | the backlog file itself | Severity bands used for audit-plan scoping. Not a phase track; indexed here because the terminology appears alongside phase tracks and readers conflate the two. |

---

## Related but not indexed

- **Pre-QA Hardening Sprint** and **Phase 8 Live Ops** are Project Memory–level phase markers on the TBM PM page (`notion.so/2c8cea3cd9e8818eaf53df73cb5c2eee`), not repo phase tracks. If they need a repo-visible index entry later, add them; for now they live in Notion.
- **"Section E5"** docs are section references, not phase markers — do not conflate.

## How to update this file

1. When a phase ships → change its `Status` column to `live`.
2. When a new phase track is added → add a row in its group, or add a new group heading if no group fits.
3. When a track is retired → mark `deprecated` or `superseded`; do **not** delete (preserves the audit trail).
4. Keep one phase track per row — no mixing.
5. If the `ops/WORKFLOW.md`, `ops/migration/*`, or a spec file starts carrying phase-status prose again, flag it — this index is supposed to be the only status ledger.

---

_Created 2026-04-22 via Wave 0 Item Ψ of the builder-loop audit plan (`C:\Users\BluCs\.claude\plans\d-you-can-do-polymorphic-hanrahan.md`). Previously these tracks were scattered across `ops/WORKFLOW.md` (inline example text), `ops/migration/*` files, `specs/*` files, and handoff archives._
