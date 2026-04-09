# Audit Tools

## Overview
TBM has two audit scripts. Both are read-only — they inspect, never modify.

| Script | When to run | What it checks | Exit code |
|--------|-------------|---------------|-----------|
| `audit-source.sh` | Before every `clasp push` | ES5, versions, routes, wiring, staleness | 0=pass, 1=fail |
| `scripts/audit-deep.sh` | Before merge / during audit | TAB_MAP bypass, SSID hardcoding, lock coverage, save paths | 0=pass, 1=fail |

## Running

```bash
# Pre-push gate (mandatory — CLAUDE.md step 3)
bash audit-source.sh

# Deep audit (before merge or during formal audit)
bash scripts/audit-deep.sh
```

## How to use from each platform

### Claude Code (CLI / Desktop)
```
# Direct
bash scripts/audit-deep.sh

# Or via skill — deploy-pipeline runs audit-source.sh as step 3
/deploy-pipeline
```

### Codex Desktop (Actions)
Create thin-launcher Actions that call the repo scripts:
```bash
# Action: "Deep Audit"
bash scripts/audit-deep.sh
```
Keep logic in the repo, not the Action. If an Action grows beyond one line,
move the logic into a script.

### CI (GitHub Actions)
`audit-source.sh` runs in CI via workflow. `audit-deep.sh` can be added as
a PR check when deeper analysis is needed.

## Adding new checks
1. Decide if the check belongs in `audit-source.sh` (pre-push, fast, every push)
   or `audit-deep.sh` (deeper analysis, before merge)
2. Add the check with FAIL/WARN counter logic and clear output
3. Update the Known Blocker Patterns table in `docs/AUDIT_STANDARDS.md`
4. Test: introduce a known violation, verify the script catches it, revert
