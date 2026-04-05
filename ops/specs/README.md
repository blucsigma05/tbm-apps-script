# TBM Specs

Store build specs in this directory using:

`YYYY-MM-DD-<slug>.md`

Every spec must begin with a short header containing:

- `Title`
- `Notion link`
- `Repo`
- `Owner`
- `Current pipeline status`

Then use the Pipeline Operating Mode sections in this exact order:

1. Problem
2. Verified On
3. Why it matters
4. What changes
5. Unknowns
6. LT decisions needed
7. Acceptance test
8. Evidence after completion
9. Codex review checklist

No change that affects behavior, routes, data contracts, QA gates, or deploy flow should skip this lane.
