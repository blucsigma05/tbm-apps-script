---
name: stale-pr-check
description: Daily 8am check for open PRs older than 24 hours in blucsigma05/tbm-apps-script. No PR should sit unmerged. Reports who or what is blocking each.
---

Find stale PRs and report what's blocking them.

## Steps

1. `gh pr list --repo blucsigma05/tbm-apps-script --state open --json number,title,createdAt,author,headRefName,labels`
2. For each PR, compute age = `now - createdAt` in hours.
3. Filter to PRs older than 24 hours.
4. For each stale PR, infer what's blocking it from labels:
   - `pipeline:codex-review` → Codex
   - `pipeline:awaiting-fix` → author
   - `needs:lt-decision` → LT
   - No pipeline label → CI not started
   - Has `pipeline:passed` but unmerged → ready to merge

## Output

- 0 stale PRs: silent (no Pushover).
- 1+ stale: Pushover priority `BACKLOG_STALE` (0) with one line per PR:
  ```
  #NN [age]h - [title] - blocked-on:[reason]
  ```
- Any PR > 72h old: priority `HYGIENE_REPORT_LOW` (-1) with same content + "URGENT 72h+" tag at top.

## Override behavior

PRs with label `wip` or `draft:true` are skipped (intentionally in-progress).
