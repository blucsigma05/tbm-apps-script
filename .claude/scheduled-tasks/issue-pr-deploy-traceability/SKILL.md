---
name: issue-pr-deploy-traceability
description: Saturday 6am audit. Find broken Issue↔PR↔Deploy chains — PRs without Closes#N, issues older than 14 days with no PR, merged PRs with no deploy tag. Closes the "where did that go" gap.
---

Audit traceability across the Issue → PR → Deploy chain. Find anything orphaned at any stage.

## PART A — PRs missing Issue link

1. `gh pr list --repo blucsigma05/tbm-apps-script --state all --search "merged:>$(date -d '-7 days' --iso) -body:Closes -body:Fixes -body:Refs" --json number,title,author,state,body`
2. Also check open PRs without issue links: `gh pr list --state open --json number,title,author,body` then filter for body without `#N` reference.
3. Report each: `#NN [author] [state] - [title]`.

## PART B — Aged Issues without a PR

1. `gh issue list --state open --search "created:<$(date -d '-14 days' --iso)" --json number,title,author,createdAt,labels`
2. For each, check `gh pr list --search "head:*<issue-number>* OR body:#<issue-number>"` — has any PR mentioned this issue?
3. Report issues with no implementation activity in 14+ days. Skip if labeled `kind:epic`, `needs:lt-decision`, or `status:draft`.

## PART C — Merged PRs without deploy tag

1. `gh pr list --state merged --search "merged:>$(date -d '-14 days' --iso)" --json number,title,mergedAt,headRefName`
2. For each, check `gh release list --limit 50` for a release tag created within 24h of the merge.
3. Report merged PRs that didn't trigger a release. These are likely undeployed (or deploy failed silently).

## Output

- **Notion:** Append weekly traceability report to a "Traceability Reports" child page under TBM PM (`2c8cea3cd9e8818eaf53df73cb5c2eee`). Format:
  ```
  ## YYYY-MM-DD Traceability Audit
  A. PRs missing issue link: N
     [list of PR numbers with titles]
  B. Stale issues with no PR: N
     [list of issue numbers with age]
  C. Merged PRs with no deploy: N
     [list of PR numbers with merge date]
  ```
- **Pushover** priority `HYGIENE_REPORT_LOW` (-1) one-line summary: `Traceability: A=N B=M C=K`.
- Escalate to `BACKLOG_STALE` (0) if any single category > 5 items.
- Escalate to `SYSTEM_ERROR` (1) if Part C (undeployed merges) > 3 — that's a deploy pipeline gap, urgent.
