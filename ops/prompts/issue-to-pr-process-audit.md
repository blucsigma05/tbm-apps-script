# Issue → PR → Merge Process Audit

**Canonical prompt.** Paste into Codex / GPT / another reasoning model to run an evidence-backed audit of the TBM Issue → PR → Merge → Deploy pipeline.

Thin wrapper for local invocation: [`.claude/commands/issue-to-pr-process-audit.md`](../../.claude/commands/issue-to-pr-process-audit.md). The wrapper is a pointer only — this file is the source of truth.

---

## Role

You are auditing TBM's Issue → PR → Merge → Deploy pipeline for a single-maintainer repo (LT + 3 AI collaborators). Deliver **3–5 ranked recommendations LT can act on this week**, each backed by file:line evidence. Do NOT pitch industry best-practices — right-sized means "catches LT's actual failure modes," not generic CI.

## Operating context

- **Forge:** Gitea (`git.thompsonfams.com/blucsigma05/tbm-apps-script`), canonical since 2026-04-19. GitHub is an auto-mirror only; never a write target.
- **Runner:** One self-hosted `act_runner` on tbm-primary (Hetzner CX33, 4 vCPU / 7.6 GiB). Capacity 2 concurrent jobs.
- **Stack:** Google Apps Script + HtmlService (`.gs` / `.html`), finance dashboards (ThePulse/TheVein), kid surfaces (KidsHub, SparkleLearning, HomeworkModule, etc.), Cloudflare worker proxy at thompsonfams.com.
- **LT:** Systems/product thinker, not a developer. Values common-sense simplicity, calls out over-engineering.

## TACT evidence bar (non-negotiable)

- **Truth:** every claim cites a file path + line number, YAML block, or observed Gitea API output. No hand-waves.
- **Authenticity:** work in the system as-built, not how it "should" look.
- **Clarity:** structured, scannable, no hedging menus.
- **Hard rules:**
  - Paths you cite must resolve. Paths you didn't read = retraction.
  - No recommendation without concrete YAML / file edits.
  - No new infra (no Kubernetes, no paid services, no second VPS). One Hetzner box is the budget.
  - Max 2,000 words total output.

## Required reading (read literally — do not summarize from this prompt)

Repo-local:

- `AGENTS.md`
- `CLAUDE.md` — over context budget; skim for operational rules
- `ops/WORKFLOW.md`
- `.gitea/workflows/ci.yml`
- `.gitea/workflows/playwright-regression.yml`
- `.gitea/workflows/codex-pr-review.yml`
- `.gitea/workflows/pr-linked-issue.yml`
- `.gitea/workflows/codex-rereview-handoff.yml`
- `.gitea/workflows/workflow-lint.yml`
- `.gitea/workflows/hyg-14-rubric-drift.yml`
- `.github/scripts/triage_review.py` — NOTE: `codex-pr-review.yml:11` says this wasn't ported to Gitea. Decide: port it, or drop the reference. Don't audit an unreachable file.
- `.github/scripts/review-watcher.js` — `CLAUDE.md:573` says this was deleted; cross-check against actual workflow triggers.
- `.github/scripts/review-fixer.js`
- `.github/scripts/check_claude_md.py`
- `playwright.config.js`
- `tests/tbm/tbm-e2e-safe.spec.js`
- `tests/tbm/education-workflows.spec.js`
- `tests/tbm/perf-frame-budget.spec.js`

External (ask LT for access if unavailable):

- Notion Global Memory: `notion.so/2c2cea3cd9e8815bae35d37dbb682cee`
- TBM Project Memory: `notion.so/2c8cea3cd9e8818eaf53df73cb5c2eee`
- TBM Pipeline Operating Mode (whatever page LT points you at)

Live state (via Gitea API):

- PR 106 at current HEAD — read diff + body + statuses + review comments
- Recent workflow run durations + pass rates: `GET /api/v1/repos/blucsigma05/tbm-apps-script/actions/tasks?limit=50` (paginate 3–4 pages)
- Branch-protection state: `GET /api/v1/repos/blucsigma05/tbm-apps-script/branches/main`

## Must-cover questions

Every one of these must appear in your output, with evidence or a called-out "UNPROVEN" verdict:

1. **Is each PR-triggered gate load-bearing?** Distinguish: (a) catches real regressions, (b) emits red noise without blocking merge, (c) never runs because of a `paths:` filter, (d) runs but nothing enforces its result.
2. **Playwright scope.** Which path changes could plausibly affect `tbm-e2e-safe.spec.js` + `education-workflows.spec.js`? Which can't? Propose a concrete `paths:` allow-list, not `paths-ignore`.
3. **Codex triage port decision.** `codex-pr-review.yml:11` lists `triage_review.py` as "NOT in this MVP." Is it worth porting, or should the Gitea workflow drop the reference?
4. **PR Linked Issue Check false-red diagnosis.** The check fails on PRs whose body does contain `Closes #NNN`. Is this a real defect, or a `labeled/unlabeled` re-firing mid-edit issue? Prove with two run logs.
5. **CLAUDE.md bloat.** Measure line count at the audit target ref (do not trust cached numbers). Compare against `claude-md-baseline.json`. Recommend prune/split only if the ratio actually exceeds the baseline policy.
6. **Notion / repo drift.** Does CLAUDE.md (and `ops/WORKFLOW.md`) match the actual workflow files? Flag every claim in the docs that's false in the code.
7. **Enforcement surface.** What actually blocks merge on Gitea today? `branch_protections[]`, `status_check_contexts[]`, the pipeline-relay in `review-watcher.js` — read each and determine whether any are live.

## Required output shape (in this order)

1. **Executive summary** — ≤150 words. Headline finding first.

2. **Current pipeline map** — a concrete diagram (text or mermaid) of:
   `Issue → branch → PR → checks (named) → merge mechanism (named) → deploy path`
   with each arrow labeled by the file/workflow/script that carries it.

3. **Gate matrix by PR class.** Rows = gates. Columns = PR classes (`docs-only`, `workflow-only`, `gas-server`, `education-ui`, `finance-ui`, `multi-lane`). Cell = `runs` / `skips` / `should-run-doesn't` / `shouldn't-run-does`. Evidence for each "shouldn't-run-does" cell.

4. **Evidence-backed findings.** One section per finding, with: claim → file/line → verdict (`PROVEN` / `PARTIAL` / `UNPROVEN` / `FALSE`).

5. **Recommended operating model.** Lane/routing design. Before/after YAML for the 3 most-affected workflow files.

6. **Exact file/rule changes.** Unified diffs for the specific edits. Each diff is small enough to commit as a single PR.

7. **Ordered follow-up issues/PRs.** Title + labels (`kind:*`, `area:*`, `severity:*`, `model:*`, `needs:*`) + `## Build Skills` section + one-sentence scope. Ranked by impact × simplicity.

## Anti-patterns (rejection criteria)

- A recommendation that names no files and no line numbers. Rejected.
- "Consider caching / adding tests / improving docs" without a specific diff. Rejected.
- Tunnel vision on a single gate (Playwright, Codex review, etc.) when all five gates are in scope. Rejected.
- "Looks good" / no explicit verdict per claim. Rejected.
- Recommending new services, dashboards, or infra. Out of scope.

## Round protocol (if run adversarially against a defender)

- **Plan_diff is the artifact**, not the critique. Each round ends with a concrete set of accepted/rejected changes to the operating plan.
- No findings → loop exits. Do not prep next-round attacks on a closed loop.
- Concede where warranted; defend where evidence supports.
- Separate three things in any finding: code bug, PR-description drift, environment limitation. Do not collapse them.

## Grounded facts as of last audit

(Verify before citing — these drift.)

- Gitea branch protection on `main` was last observed `protected=false, status_check_contexts=[]`.
- `upload-artifact@v4` fails on the Gitea `act_runner` with `GHESNotSupportedError`. Repo comments at `playwright-regression.yml:23` and `play-gate.yml:7` claim v4 works; logs disagree.
- `workflow-lint.yml:151` runs `pip install --quiet jsonschema 2>&1 | tail -1` which hits PEP 668 `externally-managed-environment` on Ubuntu 24.04 runners.
- Pipeline-relay merge automation described in `CLAUDE.md` depends on `.github/scripts/review-watcher.js`, which still targets GitHub's API (`review-watcher.js:560`-ish) and was removed from the CI path per `ci.yml:182`.

Re-verify each of these at audit time. Do not cite them without reading.
