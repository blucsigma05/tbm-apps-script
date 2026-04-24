# Thread Handoff — 2026-04-23 Master Thread (post-#73 drain)

**Session:** 2026-04-23 ~23:10 UTC → ~23:45 UTC. Opus Master/Quarterback role, picking up from the session that merged #63 + #65 + #73.

---

## What shipped this session

### Issues filed

| # | Title | Lane | Why filed |
|---|---|---|---|
| #98 | Workflow Lint has never passed — broken since inception | Codex / infra | Zero successful runs since 2026-04-20; blocks 10 open PRs; runner-side forensics needed |
| #99 | Pin `actions/upload-artifact@v4 → @v3` across 3 workflows | Codex / infra | Gitea act_runner is GHES-incompatible with v4+; root cause B of #96 |
| #100 | Playwright E2E: add `dismissSameTypePauseIfVisible` helper | Sonnet / test | PR #441 overlay breaks 3 specs; root cause A of #96 |

### PR merged

| # | Title | Merge |
|---|---|---|
| #86 | `DOCS: correct merge-automation wording` | squash `f625ade`; `merged_by: LT` (PAT attribution) |

### Comments posted

| Target | Comment | Purpose |
|---|---|---|
| PR #57 | id 949 | Redirect next builder: body already has `Closes #54`; 0s Linked-Issue fail is same infra as #98; real blockers are rebase + clean-slate sweep per 2026-04-21 memo |
| Issue #96 | id 971 | Final reconciliation: 3 RC-X diagnostics + links + close criteria |

### Issue #96 triage — delegated to 3 parallel subagents

- **RC-A Playwright E2E** (comment 957): real test-coverage gap from PR #441 overlay; helper fix in #100.
- **RC-B Frame Budget** (comment 952): upload-artifact@v4 GHES-incompatible (#99) + real JJ mobile perf regressions on 4 routes (parked for separate filing if serious).
- **RC-C TBM Smoke push-variant** (comment 955): stale finding — already resolved 2026-04-21 when `GAS_DEPLOY_URL` secret landed. 24+ green runs since. WONTFIX.

---

## What remains

- **#99 + #100 must both land** before #96 can close cleanly. #99 alone turns the job status green; #100 alone only turns the test-run step green.
- **PR #57 (play-gate PR-2)** needs: (1) rebase on gitea/main (behind 5, ahead 4); (2) clean-slate builder pre-audit per `ops/operating-memos/2026-04-21-builder-pre-audit-and-clean-slate-rereview.md`; (3) re-Codex-audit. Not master-thread scope.
- **JJ mobile perf regressions** surfaced by RC-B (`/sparkle` 72–83ms, `/sparkle-kingdom` 46–63ms, `/daily-adventures` 34.5–38.5ms vs 33ms budget, `/wolfkid` P4 CLS 0.482 vs 0.1). Parked — file a dedicated perf-regression Issue if it turns out to be serious (may be a noisy trace, needs reproduction).
- **14 other open PRs** unexamined this session. Next master-thread session should survey.

---

## Operational findings worth preserving

### Gitea API quirks encountered

1. **Issue-creation labels field = int64 array, not string array.** `POST /api/v1/.../issues` with `"labels": ["kind:bug"]` returns `cannot unmarshal "..." into ... int64`. You must GET `/api/v1/.../labels?limit=100` first and map names → IDs.
2. **`/actions/jobs/{N}/logs` uses an internal job-id sequence that is NOT the `task.id` from `/actions/tasks`.** Master thread was unable to deterministically map task → job-log, and brute-probing returned logs for adjacent tasks. This blocked API-based root-cause on Workflow Lint failures (Issue #98 absorbs the forensics).
3. **`/actions/runs/{N}` endpoints all 404.** Only `/actions/tasks` list and `/actions/jobs/{N}/logs` are exposed. No `/runs/{N}/jobs` lookup.
4. **`curl.exe -o /tmp/...`** on Git Bash / Windows: curl.exe is native Windows and interprets `/tmp/...` differently than bash. Use `/c/temp/...` or `C:\temp\...` (the latter inside quotes) instead.
5. **PowerShell → native Git** piping rewrites encoding. `git cat-file -p <sha> | Out-File ... -Encoding utf8` adds BOM + CRLF. Use `-Encoding ascii -NoNewline` OR stay in bash using Git's own pipe output.

### CI infra state summary (2026-04-23 end-of-session)

- **Workflow Lint** — broken since 2026-04-20, zero passes ever. Under #98.
- **Playwright E2E** — job-level red via upload-artifact@v4 + test-level red via missing overlay helper. Under #99 + #100.
- **Frame Budget** — same upload-artifact@v4 cause + real perf breaches. Under #99 + (parked).
- **TBM Smoke push-variant** — green for 24+ runs. Healthy.
- **PR Linked Issue Check** — fails at workflow-setup phase on some PRs (0s fail); same infra root as #98.

Roughly half the PR-gate surface has a known issue. Autonomous-merge evidence standard from PR #73 cannot be met on non-docs PRs until #98, #99, #100 land.

---

## Branch + working-tree state at handoff

- Current branch: `docs/72-fix-merge-automation-wording` (now merged via #86, could be deleted)
- Uncommitted: `.claude/settings.local.json` (gitignored, user-local permission grant added this session)
- Untracked: `.claude/scheduled_tasks.lock`, `.claude/worktrees/` (state files, not source)
- No stash left behind by this session (one was popped)
- Worktree `/tmp/mhc-wt` was created during RC investigation; cleanup attempted with `--force`, may linger — harmless

## Next session entry points

Priority order, taking pilot memo lanes into account:

1. **Codex lane — #99 (upload-artifact pin).** Mechanical grep+replace, unlocks job-level CI on 3 workflows. Hot files (LT confirms merge).
2. **Sonnet lane — #100 (Playwright helper).** Test fix, not hot.
3. **Sonnet/Opus — PR #57 rebase + clean-slate sweep.** Per 2026-04-21 memo.
4. **Codex lane — #98 (Workflow Lint deep forensics).** Needs runner-host access or a bisect test PR — not trivial.
5. **Survey other 14 open PRs** — some may be drain-ready now that rule-doc churn has settled.
