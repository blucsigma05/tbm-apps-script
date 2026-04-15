---
name: version-drift-check
description: Daily 7am compare deployed GAS versions vs git HEAD source versions. Catches when someone pushes code but forgets to deploy, or deploys without committing.
---

Detect version drift between deployed and source.

## Steps

1. Hit `https://thompsonfams.com/pulse?action=version` — returns JSON with `{ "<filename>": <version> }` per `.gs` file.
2. For each `.gs` file in `C:\Dev\tbm-apps-script` (main branch HEAD), grep for `function get<Name>Version()` and extract the `return N` value.
3. Build a comparison: `<file>: deployed=A, head=B`.
4. Report any file where `A != B`.

## Output

- 0 drift: silent.
- 1–4 drift: Pushover priority `HYGIENE_REPORT_LOW` (-1) with comparison table.
- 5+ drift: priority `CHORE_APPROVAL` (0) — meaningful gap, deploy likely backed up.
- 10+ drift: priority `SYSTEM_ERROR` (1) — system out of sync, manual reconciliation needed.

## Direction matters

- `deployed > head` → deploy ahead of code (someone deployed without committing — bad)
- `deployed < head` → code ahead of deploy (commit landed but not yet deployed — common, not urgent)

Tag direction in the report.
