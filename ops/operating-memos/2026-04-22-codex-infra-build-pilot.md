# 2026-04-22 — Codex infra-build pilot

## Why

Adversarial-review loop on 2026-04-22 (ref: Issue #66 and rounds archived in it) surfaced a pattern: Claude's build output on infrastructure/CI work was propose-from-memory rather than propose-from-verified-evidence. Specific failures in that loop: regex patterns written without running `wrangler`, `npm ci` changes proposed without checking `package-lock.json`, "audit whether" bullets where a direct file read would have decided.

Codex's output in the same loop was the opposite shape: reproductions with captured output, multi-version tests, specific doc citations, clean scope.

The pain was concentrated in one class of work: **CI, Wrangler, workflow semantics, tool-version drift, schema/output behavior**. That is where Codex's evidence-gathering has been stronger and where Claude's propose-from-memory has been hurting the lane.

## Scope (pilot boundary)

### Codex builds (pilot lane)

**Primary surfaces (CI runs here on Gitea since the 2026-04-20 port):**
- `.gitea/workflows/*.yml` — primary CI + deploy workflows on Gitea Actions runners
- `wrangler*.toml` — Wrangler config (`wrangler.toml`, `wrangler-uptime.toml` — glob verified 2026-04-22)
- `package.json` / `package-lock.json` — tool-version pinning surface
- `audit-source.sh` — schema validation, wrangler checks, and related pre-push hooks
- `.github/scripts/*.py` and `.github/scripts/*.js` — CI helper scripts (Python/Node) referenced by Gitea workflows; most `check_*`, `parse_*`, and `file_*_findings` scripts live here
- `.github/tests/**` and adjacent fixture directories — test fixtures for CI scripts (e.g., #67's `wrangler-output-fixtures/`)

**Historical / mostly-empty surfaces (no Gitea CI runs here post-migration):**
- `.github/workflows/*.yml` — GitHub Actions workflow files. On `gitea/main` this directory is empty post-port (files were renamed into `.gitea/workflows/` via commit `eaa6d00`). If a surviving `.github/workflows/` file needs Codex-lane edits, verify it still runs somewhere before touching (`git ls-tree -r gitea/main -- .github/workflows/` should not be empty).

**Deploy/test gating (scope, not specific files):**
- Cloudflare deploy/test gating in whichever files define it (currently `.gitea/workflows/deploy-worker.yml`, `.gitea/workflows/deploy-uptime-worker.yml`)
- Tool-version pinning across the repo (extends to any `wranglerVersion:` or equivalent pin expressions in the above files)

### Claude builds (unchanged)

- GAS app logic (`*.gs`)
- HTML / ES5 surfaces
- Notion-linked process work
- Deploy-pipeline-adjacent repo work (the glue, not the CI YAML)
- Anything requiring the TBM integration surface: memory, hooks, skill scaffolding, Notion API, ES5/GAS conventions

### Cross-audit

- Claude audits Codex-built infra/CI PRs
- Codex audits Claude-built app/UI PRs
- Each model audits the other on the evidence bar below

## Rules

**Operational packaging:** Rules 1 + 2 below are baked into the `codex-audit` skill at
`.claude/skills/codex-audit/SKILL.md` (Gitea #92). Invoke `/codex-audit #N` or use the
skill's trigger phrases to run a cross-audit against this rule surface without
re-deriving the methodology each round.

1. **No plan item without verification.** (Codified to Claude memory 2026-04-22.) Applies to both lanes. A plan_diff bullet, spec item, Issue body claim, or audit finding is invalid unless the author has already run the command, read the exact file/line, or cited a verifiable source that makes it true. The bar each lane demands of the other it meets before writing.
2. **For CI/Wrangler/workflow work, the build artifact is a tested branch or a verified issue comment with command output — not a prose rewrite.** No speculative `plan_diff` cycles. If an item cannot be demonstrated with captured output, it does not land.
3. **Labels are load-bearing.** Pilot Issues are tagged `model:codex`. If an Issue's scope spans both lanes, the primary author gets the model tag and the cross-audit lane is named in the Issue body.
4. **Mechanics (pending LT confirmation).** Open question: does Codex push branches directly to Gitea (requires Gitea PAT with `write:repository` scope for Codex), or does Codex hand LT/Claude a diff + evidence bundle and Claude commits? Default until LT decides: **courier-with-evidence** — Codex produces the diff + command output as a Gitea Issue comment or shared artifact, Claude commits and pushes. This is slower than direct-push but requires no new **push** credentials for Codex (Codex retains the read/comment-scope Gitea PAT it already uses to post evidence comments and run preflight reads — see Rule 5). The delta courier vs direct-push is write-to-git scope, not read-API scope.
5. **Preflight check (before producing any build bundle).** Verify all of:
   - **Target files exist on the intended base branch.** Default base: `gitea/main`. Fetch the branch first (`git fetch gitea main`), then for each file in your planned diff: `git ls-tree -r gitea/main -- <path>` (shell-agnostic — works in Git Bash and PowerShell; the `--` separator avoids path-translation issues that would otherwise need `MSYS_NO_PATHCONV=1` as a Git Bash workaround). Empty output = file not on base. If Codex intends to add a new file rather than modify one, this is expected — document that intent in the bundle. If modifying, empty output = stop and post a blocked-state comment with the command + output.
   - **No other open PR has overlapping scope for the same files.** Run: `curl.exe -s -H "Authorization: token <pat>" "https://git.thompsonfams.com/api/v1/repos/blucsigma05/tbm-apps-script/pulls?state=open" | python3 -c "import sys,json; [print(p['number']) for p in json.load(sys.stdin)]"` to list open PR numbers. For each: `curl.exe -s -H "Authorization: token <pat>" "https://git.thompsonfams.com/api/v1/repos/blucsigma05/tbm-apps-script/pulls/<N>.diff" | python3 -c "import sys; [print(l.rstrip()) for l in sys.stdin if l.startswith('diff --git')]"` to see touched files. (Shell-portable notes, applying to every curl command in this memo — all run identically in Git Bash, PowerShell, and cmd: **(a)** `curl.exe` is used explicitly instead of bare `curl` because PowerShell's default `curl` aliases to `Invoke-WebRequest`, which does not accept the same flags; `curl.exe` forces the real curl binary in all three shells. **(b)** Auth uses `-H "Authorization: token <pat>"` (Gitea PAT as bearer token) instead of `-u <pat>`; the basic-auth `-u user:pat` form works in real curl but the repo credential flow (`git credential fill`) yields separate username + password fields, so a one-token `-u <pat>` is ambiguous as a non-interactive command. **(c)** `grep` is not available in the default PowerShell environment; the `python3` pipe above replaces it. The PowerShell-native equivalent for the diff-header scan is `Select-String -Pattern '^diff --git'`. **(d)** URL arguments are double-quoted (`"https://..."`), never single-quoted. Git Bash and PowerShell treat both quote styles as string delimiters, but cmd treats single quotes as literal characters — a single-quoted URL in cmd is passed to curl with leading/trailing apostrophes and is rejected as invalid. Double quotes work in all three shells. Verified end-to-end 2026-04-23 by running the command above from a `.cmd` file in cmd — produced the expected PR-number list.) If any open PR touches a file in your planned diff, that's a collision — post both PR numbers on the Issue and ask LT whether to stack, wait, or rebase.
   - **The workflow (if any) actually runs on the target runner lane.** Gitea Actions runs `.gitea/workflows/*` only; GitHub Actions runs `.github/workflows/*` only. Since the 2026-04-20 port these are separate lanes. Editing a GitHub-Actions-only file expecting it to run on Gitea is a scope error.
   If any preflight check fails, do NOT produce the build bundle. Post a blocked-state comment on the Issue with the failing preflight command + output, and stop. This is the exact pattern that surfaced on Issue #70 on 2026-04-22 and correctly prevented a scope-mismatched PR from being opened.

## Pilot population

First pilot batch: Issues **#67, #68, #69, #70, #71** — all filed 2026-04-22 as children of Issue #66, all fall inside the Codex scope above.

| Issue | Title | Lane |
|-------|-------|------|
| #67 | Research: verify Wrangler warning/error output, then design fail-on-warning parser | Codex |
| #68 | Pin Wrangler in repo tooling: package.json + lockfile + workflow | Codex |
| #69 | Pin `cloudflare/wrangler-action@v3` behavior in `deploy-uptime-worker.yml` | Codex |
| #70 | Fix false-pass in `deploy-worker.yml`: missing `CF_WORKER_URL` must fail | Codex |
| #71 | Research: preview-deploy probe vs local `wrangler dev` simulation | Codex |

Issue #66 itself (restore rate limiting) is **Claude-built** — it needs the GAS + deploy-pipeline + Notion context, and it crosses into Cloudflare dashboard coordination with LT. Codex audits the resulting PR.

## Exit metric

**Single binary signal:** did the first-review cycle surface any "you wrote this from memory" defects, and did every required Gitea check pass on the PR's HEAD commit?

- **PASS** = BOTH of:
  1. **Opposite-lane cross-audit shows PASS.** Cross-audit comes from the OPPOSITE build lane — it is never self-audit:
     - For **Codex-built pilot PRs** (current pilot focus): Claude posts a manual cross-audit PR comment on Gitea via the API. That comment explicitly states `**Verdict:** PASS`, names the files reviewed, and lists zero findings of severity `blocker` or `critical`. Claude's comment IS the cross-audit signal. The automated `Codex PR Review / Codex PR Review (pull_request)` status from `.gitea/workflows/codex-pr-review.yml` still runs but on a Codex-built PR it is Codex auditing its own build — that is self-check, not cross-audit. A self-check that disagrees with Claude's cross-audit is a useful escalation signal but absence or failure of the self-check alone does not gate PASS.
     - For **Claude-built PRs** (outside the current pilot scope, but the rule is symmetric): the automated `Codex PR Review / Codex PR Review (pull_request)` Gitea status is the cross-audit gate. Its posted comment must be in the bot-authored shape defined in CLAUDE.md § Codex PR Audit Lane pass/fail standard — specifically, the body begins with the `<!-- codex-pr-review -->` marker and the first heading after the marker contains the stable text `Codex PR Review: PASS` (match on the stable text, not the emoji — the posting pipeline mojibakes the emoji; see CLAUDE.md § Codex PR Audit Lane for the byte-level detail), with a `**Files Reviewed:**` section and no P1 findings — and the Gitea status must be `status: success` (Gitea API `/commits/<sha>/statuses` returns a list where each entry uses the key `status`, not `state` — verified 2026-04-23 against the live repo). The `**Verdict:** PASS` token used elsewhere in this memo refers only to Claude-authored manual cross-audit comments (for Codex-built pilot PRs, previous bullet); `codex_review.py` does not emit that token.
  2. **All other Gitea status contexts on the PR's HEAD commit must be `status: success`.** This is independent of lane — `ci.yml`, `playwright-regression.yml`, hygiene checks, etc. all count. Conditional workflows absent per their own `paths:` filters are fine; if present, they must be `success`. Any `failure` / `error` on any context (other than the cross-audit signal itself, handled by rule 1 above) blocks PASS.

  Verification commands:
  - Fetch statuses: `curl.exe -s -H "Authorization: token <pat>" "https://git.thompsonfams.com/api/v1/repos/blucsigma05/tbm-apps-script/commits/<sha>/statuses" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(s['context'], s['status']) for s in d]"`. (The `/statuses` plural endpoint returns a list of per-context entries; each entry's key is `status` — verified 2026-04-23. The singular `/status` endpoint returns an aggregate object whose top-level key is `state`; either is usable but the commands and prose in this memo use the plural-endpoint shape consistently.)
  - Fetch Claude's cross-audit comment (for Codex-built pilot PRs): `curl.exe -s -H "Authorization: token <pat>" "https://git.thompsonfams.com/api/v1/repos/blucsigma05/tbm-apps-script/issues/<pr_number>/comments" | python3 -c "import sys,json; [print(c['id'], c['user']['login'], c['body'][:100]) for c in json.load(sys.stdin)]"` — look for a Claude-authored comment with `**Verdict:** PASS`.
  - Empirically observed Gitea status contexts on pilot-class PRs (illustrative of what MAY appear, NOT an exhaustive required list): `Codex PR Review / Codex PR Review (pull_request)`, `TBM Smoke + Regression / Run TBM Tests (pull_request)`, `Playwright Regression / Playwright E2E Regression (pull_request)`, `HYG-04 CLAUDE.md Bloat Check / CLAUDE.md Bloat Check (pull_request)`, `HYG-14 Rubric Drift / Check rubric coupling (pull_request)`, `PR Linked Issue Check / Require linked issue (pull_request)`, `Codex Re-review Handoff (Phase 3) / Post tbm-handoff marker (pull_request_target)`.

- **FAIL** = ANY of:
  - Opposite-lane cross-audit has one or more `blocker` or `critical` findings
  - Opposite-lane cross-audit verdict is `INCONCLUSIVE` or missing (rubber-stamp = FAIL per CLAUDE.md § Codex PR Audit Lane pass/fail standard)
  - For Codex-built pilot PRs: no Claude-authored cross-audit comment exists on the PR (absence of signal = FAIL)
  - Any Gitea status context OTHER than the cross-audit signal shows `failure` or `error`

A clean audit alone is not the signal. A clean audit that then fails in CI proves the audit missed something — co-signal matters.

Evaluate after 2–3 issues (the #67–#71 batch is close enough — 5 issues is acceptable pilot size since they share a domain).

## Expansion

If pass: expand Codex scope beyond the current surfaces listed in "Codex builds (pilot lane)" above. Candidates in order (none of these are in current scope):
- Python helpers that aren't `check_*` / `parse_*` / `file_*_findings` (e.g., new CI-adjacent utilities outside the existing `.github/scripts/` family)
- `cloudflare-worker.js` edits when scope is infrastructure (route changes, middleware) rather than application logic
- `clasp` / `appsscript.json` deploy-target config (currently Claude-lane as deploy-pipeline-adjacent)

Do not expand to GAS `.gs` files, HTML surfaces, or Notion-linked flows without a separate pilot — those need TBM integration context that requires evaluation beyond this pilot.

## Revert

If fail: revert to Claude-builds-all, Codex-audits. Document failure in a follow-up memo; do not expand.

Either way the root-cause rule (no bullet without verification) stands for Claude regardless of pilot outcome.

## Open questions for LT

### Still open

1. **Codex mechanics: direct Gitea push vs. courier-with-evidence?** Default remains courier until LT explicitly flips it. This has been the operating mode through PR #68 (comment 615) and PR #73 audits on 2026-04-22 through 2026-04-23 without friction; LT may formalize or change.

### Resolved during pilot (kept for decision record)

2. **Cross-audit trigger (resolved 2026-04-23):** Cross-audit is ALWAYS opposite-lane. For **Codex-built pilot PRs** (the current pilot population), the cross-audit signal is a **Claude-authored manual PR comment** posted via the Gitea API with explicit `**Verdict:** PASS` / `FAIL`. The existing `codex-pr-review.yml` workflow still runs on those PRs, but on Codex-built work it is Codex auditing its own output (self-check), not cross-audit — it's a useful co-signal (if Codex's self-check flags something Claude missed, escalate), not the primary gate. For **Claude-built PRs** (outside the current pilot scope), `codex-pr-review.yml` IS the cross-audit per CLAUDE.md § Codex PR Audit Lane. If a separate deeper-audit pipeline is stood up for pilot PRs in the future (e.g., a distinct Claude-run workflow rather than manual comments), both the exit metric above and this section must be updated in the same PR.
3. **First pilot Issue (resolved 2026-04-22):** kicked off at #68 (Pin Wrangler) — mechanical, unblocks #67 and #69 downstream. Codex courier bundle posted as comment 615 on #68; Claude-audit in progress.
