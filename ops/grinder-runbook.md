# Nightly Grinder — Claude Code Runbook

**Purpose.** Every fire, convert idle overnight hours into exactly one
shipped PR awaiting human review. Fresh context. Hardcoded gates. LT reviews
PRs in the morning.

**Parent Issue.** #454
**Parent epic.** #340 (Issue-to-PR automation)
**Kill switches.** See bottom of this file.

This file IS the prompt. The scheduled task fires a fresh Claude Code
session with these instructions loaded. Follow every step as written.

---

## 0. Pre-flight (fail closed)

Run these checks before anything else. If any fails → EXIT with the matching
Pushover tier. Never retry, never escalate override flags.

| Check | Command | On fail |
|---|---|---|
| Kill switch master | `gh variable get AUTOMATION_ENABLED` | EXIT silent |
| Kill switch grinder | `gh variable get NIGHTLY_GRINDER_ENABLED` | EXIT silent |
| Lock file | `[ -f /tmp/grinder.lock ]` — if present, read PID and check `kill -0 <pid>` | EXIT silent (overlapping fire) |
| Deploy freeze | `bash audit-source.sh` check 6 equivalent (read script-prop `DEPLOY_FREEZE_ACTIVE` via `clasp run getFreezeState_` or equivalent probe) | EXIT silent |
| Repo clean | `git status --porcelain` empty | EXIT + `SYSTEM_ERROR` Pushover |
| Main CI green | `gh run list --branch main --limit 1 --json conclusion` → `success` | EXIT + `SYSTEM_ERROR` |

On pass: write lock — `echo $$ > /tmp/grinder.lock` — and register a trap to
remove it on any exit path. Never leave a stale lock.

Any kill switch flipped to `false` must take effect on the next fire in
≤60 seconds. Do not cache. Read fresh every fire.

---

## 1. Sync to fresh main

```bash
git fetch origin main
git checkout main
git pull --ff-only
```

If `--ff-only` fails → EXIT + `SYSTEM_ERROR` Pushover. Don't rebase, don't
merge — main is source of truth. A non-fast-forward state means something
happened that needs human attention.

---

## 2. Select exactly one Issue

```bash
PICKED=$(REPO=blucsigma05/tbm-apps-script \
  python3 .github/scripts/grinder_select_issue.py)
```

- `$PICKED == 0` → idle. Send `HYGIENE_REPORT_LOW` Pushover
  "Grinder idle, no eligible issues." and EXIT clean.
- `$PICKED > 0` → the one Issue for this fire.

**Never pick a second Issue in the same fire.** Even if the first fails.
Failures stop the fire; they don't advance to the next candidate.

### Eligibility (enforced by the selector, here for transparency)

Selected Issue MUST have: `state:open`, `model:opus`, `needs:implementation`,
a `## Build Skills` section in the body, no open PR closing it.

Selected Issue MUST NOT have: `needs:lt-decision`, `status:draft`,
`status:broken`, `kind:decision`.

Sort: `severity:blocker` → `critical` → `major` → `minor`, then oldest
`createdAt` first.

During canary, narrow the label filter:
```bash
GRINDER_LABEL_FILTER='grinder-canary' python3 ...
```

---

## 3. Read the Issue end to end

```bash
gh issue view $PICKED --comments
```

Read the entire body and every comment. No skimming. Extract:
- Acceptance criteria (the checklist)
- Build Skills list
- Any attached spec files referenced by path
- Files / surfaces named explicitly

If anything is ambiguous — stop and escalate per §7.

---

## 4. Load declared skills

Parse the `## Build Skills` section from the Issue body. For each skill
name, invoke the Skill tool with that exact name. If a declared skill
doesn't exist in the environment → EXIT per §7 (skill-missing path).

---

## 5. Branch + implement

```bash
SLUG=$(gh issue view $PICKED --json title --jq '.title' \
  | tr '[:upper:] ' '[:lower:]-' | tr -cd 'a-z0-9-' | cut -c1-50)
BRANCH="grinder/${PICKED}-${SLUG}"
git checkout -b "$BRANCH"
```

Implement per the Issue spec. Stay within the listed scope. Do not expand
to adjacent refactors. Do not touch files outside what the Issue describes.

**Forbidden files (non-negotiable, no override).** If the work touches ANY
of these, EXIT per §7 with the reason `hot file, requires LT`:

- `.github/workflows/**`
- `.github/scripts/**` (exception: adding pure test files under
  `.github/scripts/tests/` is allowed; modifying existing helpers is not)
- `CLAUDE.md`
- `audit-source.sh`
- `cloudflare-worker.js`
- Anything in `ops/operating-memos/**` already merged (they're frozen
  records — you may add a NEW memo only if the Issue explicitly asks for one)

---

## 6. Run the full deploy pipeline — all 11 steps

Reference: `CLAUDE.md` § "Deploy Pipeline (MANDATORY — every deploy)".

No shortcuts. Each step is a gate:

1. EDIT (done in §5)
2. VERSION bump in all 3 locations per changed `.gs` file
3. `bash audit-source.sh` — any FAIL blocks; any WARN must be reviewed
4. `clasp push`
5. `diagPreQA()` via `clasp run diagPreQA` — all categories PASS
6. `clasp deploy -i <deploymentId>`
7. Hit `?action=runTests` on production `/exec` URL — JSON assert
   `overall == "PASS"` AND `smoke.overall == "PASS"`; scan ErrorLog for
   new rows in last 5 min
8. Git: `git add <specific files>` → commit with `#${PICKED}` → push branch
9. Notion PM Active Versions DB row + Thread Handoff row
10. curl all Cloudflare proxy endpoints — expect 200 on every one
11. `gh release create v<version> --notes "..."`

**Never stop at step 4.** Any failure in steps 3–7 → EXIT per §7 with
`status:broken` on the Issue.

---

## 7. Stop conditions (EXIT immediately, never retry)

| Condition | Label Issue | Pushover | Post to Issue |
|---|---|---|---|
| `audit-source.sh` FAIL | `status:broken` | `DEPLOY_FAIL` | `Grinder blocked on #${PICKED} — audit failed: <captured stderr>` |
| `diagPreQA()` FAIL | `status:broken` | `DEPLOY_FAIL` | `Grinder blocked on #${PICKED} — diagPreQA: <failing category>` |
| `runTests` smoke ≠ PASS | `status:broken` | `DEPLOY_FAIL` | `Grinder blocked on #${PICKED} — smoke: <failing test>` |
| Merge conflict needing judgment | `needs:lt-decision` | `BACKLOG_STALE` | `Grinder parked — conflict requires human resolution. Files: ...` |
| Spec ambiguous | `needs:lt-decision` | `BACKLOG_STALE` | `Grinder parked — spec ambiguity: <the question>` |
| Deploy freeze active | _(no label change)_ | _(silent)_ | _(no comment — freeze is expected downtime)_ |
| Hot file touched | `needs:lt-decision` | `BACKLOG_STALE` | `Grinder parked — touches hot file <path>; requires LT implementation` |
| Declared skill not in env | `needs:lt-decision` | `BACKLOG_STALE` | `Grinder parked — declared skill '<name>' not installed` |
| `clasp` auth expired | _(no label change)_ | `SYSTEM_ERROR` | `Grinder infra failure — clasp auth broken, run clasp login` |
| Any hook refuses operation | `needs:lt-decision` | `BACKLOG_STALE` | `Grinder parked — hook blocked: <hook name> / <reason>` |
| 2-hour runtime timeout | _(runtime-enforced)_ | `SYSTEM_ERROR` | _(runtime posts the timeout notice)_ |

**NEVER set `EMERGENCY=1` or `HOTFIX=1` autonomously.** Those flags are LT's.
Hitting a hook block is a stop condition, not a prompt to bypass.

---

## 8. Ship — open the PR

```bash
gh pr create \
  --base main \
  --head "$BRANCH" \
  --title "feat(#${PICKED}): <the issue title>" \
  --body "Closes #${PICKED}

## Summary
<one paragraph — what shipped, why>

## Skills loaded
<list from the Issue's Build Skills>

## Evidence
- audit-source.sh: PASS
- diagPreQA: PASS
- smoke: PASS
- runTests overall: PASS
- CF proxy probes: 200 on all N routes

## Grinder metadata
- Fire started: <ISO timestamp>
- Fire finished: <ISO timestamp>
- Runtime: <seconds>
"
```

**NEVER merge.** LT reviews in the morning. Merging is a separate trust
tier (see `CLAUDE.md` § Autonomous Merge Authority — the grinder is
explicitly excluded: "PRs opened by a non-interactive agent lane ... always
confirm merge first, no override").

---

## 9. Close the loop

1. Comment on the Issue with the PR link:
   `gh issue comment ${PICKED} --body "Grinder shipped → #<PR>"`
2. Pushover `DEPLOY_OK` priority (-2, silent):
   `Grinder shipped #${PICKED} → PR #<PR> (<url>)`
3. Append a row to Notion "Claude Code Scheduled Tasks" DB
   (`334cea3cd9e8812a95bdcea2786b50d6`) with: timestamp, issue, verdict,
   PR, duration.
4. Remove the lock file. Exit clean.

---

## Pushover tiers (contract)

Use the named constants from `AlertEngine.gs` `PUSHOVER_PRIORITY`. Never
bare integers. Reference: `CLAUDE.md` § "Alert Tiers (HYG-12)".

| Event | Constant | Value | Body template |
|---|---|---|---|
| Shipped PR | `DEPLOY_OK` | -2 | `Grinder shipped #{N} → PR #{M} ({url})` |
| Parked on decision | `BACKLOG_STALE` | 0 | `Grinder parked #{N} — {reason}` |
| Stopped on error | `DEPLOY_FAIL` | 2 | `Grinder blocked on #{N} — {reason}` |
| Idle, no work | `HYGIENE_REPORT_LOW` | -1 | `Grinder idle, no eligible issues` |
| Clasp/infra break | `SYSTEM_ERROR` | 1 | `Grinder infra failure — {detail}` |

---

## Kill switches (three, all ≤60s)

1. `gh variable set NIGHTLY_GRINDER_ENABLED --body false` — next fire
   no-ops at §0.
2. Disable / update the scheduled task itself. Removes the trigger entirely
   until re-registered.
3. Remove `model:opus` or `needs:implementation` labels from the queue —
   the selector starves.

The master `AUTOMATION_ENABLED=false` switch also short-circuits the
grinder at §0 along with every other auto-filer.

---

## Observability

- **Pushover** is the source of truth for "did it run, did it work." Every
  fire emits exactly one terminal notification at one of the five tiers.
- **ErrorLog sheet** captures any uncaught error via the normal GAS
  `logError_` path (runtime, not this runbook's concern).
- **Notion Scheduled Tasks DB** row per fire — written at §9 on success,
  or by a dedicated skip-write on the stop paths that still want a record.
- **Lock file** at `/tmp/grinder.lock` carries the PID of the active fire.
  Stale locks (PID not alive) are treated as absent.

---

## Explicit non-goals

The grinder does NOT:
- Merge PRs (LT reviews — always).
- Spec. `kind:spec` Issues are ineligible.
- Pick more than one Issue per fire.
- Set override flags (`EMERGENCY=1`, `HOTFIX=1`).
- Touch hot files.
- Escalate past stop conditions.
- Modify `main` directly.
- Force-push anything.

---

## References

- Parent Issue: #454
- Parent epic (Issue-to-PR automation): #340
- Umbrella courier-reduction epic: #376
- Canary plan: `ops/grinder-canary-plan.md`
- Selector: `.github/scripts/grinder_select_issue.py`
- Deploy pipeline spec: `CLAUDE.md` § "Deploy Pipeline (MANDATORY)"
- Autonomous merge authority rules: `CLAUDE.md` § "Autonomous Merge Authority"
- Alert tiers: `CLAUDE.md` § "Alert Tiers (HYG-12)"
- Notion Scheduled Tasks DB: `334cea3cd9e8812a95bdcea2786b50d6`
