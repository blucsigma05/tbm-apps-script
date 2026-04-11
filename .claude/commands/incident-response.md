---
name: incident-response
description: >
  Triage and recovery runbook for Thompson platform incidents. Use when
  deploy proof fails, production tests return errors, routes break,
  ErrorLog fills up, Pushover alerts fire, the review-fixer stalls, or
  any system behaves unexpectedly. Trigger on: incident, error, broken,
  down, alert, ErrorLog, test failed, deploy failed, route broken, blank
  screen, stalled, rollback, triage, on-call, production issue.
---

1. **Cardinal Rule:** "Diagnose before you fix. Read the error, check the logs, identify the scope. A rushed fix to the wrong layer makes two incidents out of one."

2. **Severity Classification:**

| Severity | Definition | Response Time | Examples |
|---|---|---|---|
| P1 — Down | A primary surface is unreachable or showing wrong data | Immediate | Blank screen on /buggsy, wrong child's data, data loss |
| P2 — Degraded | A surface works but key features are broken | Same session | Missing audio, broken save/resume, wrong theme |
| P3 — Cosmetic | Visual or non-blocking issues | Next deploy | Alignment off, wrong animation, stale copy |
| P4 — Enhancement | Not broken, could be better | Backlog | UX improvement, performance optimization |

3. **Incident Triage Flowchart:**
```
Is a surface blank or unreachable?
  YES → Route issue (check CF → GAS → HTML chain)
  NO ↓
Is production test failing?
  YES → Check ErrorLog (last 5 min), check ?action=runTests output
  NO ↓
Is data wrong or stale?
  YES → Check sheet tab, check cache, check Tiller sync
  NO ↓
Is a feature broken post-deploy?
  YES → Compare deployed version vs expected, check clasp deployments
  NO ↓
Is an alert firing?
  YES → Read the alert, check the source system, verify the threshold
```

4. **Common Incidents and Playbooks:**

**Deploy proof fails (`?action=runTests` not PASS):**
1. Read the full JSON response — which tests failed?
2. Check ErrorLog for new entries in last 5 minutes
3. If smoke tests fail: likely a function signature change or missing Safe wrapper
4. If regression tests fail: likely a behavior change in a hot file
5. Do NOT deploy further. Fix the failing test, re-push, re-run.
6. If test infrastructure itself is broken: run `diagPreQA()` to isolate

**Blank screen on a route:**
1. `curl -s -o /dev/null -w "%{http_code}" https://thompsonfams.com/<route>` — is CF returning 200?
2. If not 200: check CF worker, check PATH_ROUTES, verify `wrangler deploy` was run
3. If 200 but blank: check GAS router in Code.gs — does the case exist for this page?
4. If case exists: check the backing HTML file — does it exist? Was it pushed?
5. Check browser console for JS errors — ES6 in an HTML file will silently break

**ErrorLog filling up:**
1. Read last 10 entries: what function, what error, what time?
2. Group by function — is it one function failing repeatedly?
3. Check if it correlates with a recent deploy
4. Common causes: missing sheet tab, renamed function, lock timeout, Notion API failure
5. Fix the source, verify with `diagPreQA()`

**Review-fixer stalled:**
1. Check PR: how many `[review-fix-N]` commits exist?
2. If N >= 3: manual intervention required (cycle cap)
3. Check if `PIPELINE_BOT_TOKEN` is configured — without it, bot pushes don't retrigger CI
4. Check `review-watcher.yml` — is the workflow enabled?
5. Check the unresolved threads — are they mechanical (auto-fixable) or architectural (needs human)?

**Pushover alerts not firing:**
1. Check Script Properties: PUSHOVER_TOKEN, PUSHOVER_USER_LT, PUSHOVER_USER_JT
2. Run `sendPush_('Test', 'Test message', 'LT', PUSHOVER_PRIORITY.CHORE_APPROVAL)` from GAS editor
3. If no delivery: check Pushover API status, check token validity
4. If delivery works but alerts aren't firing: check the trigger function schedule

**Stale Tiller data:**
1. Check Tiller sync status in the sheet
2. CF worker HYG-09 cron should alert if data > threshold hours old
3. If alert didn't fire: check CF worker scheduled() function, check wrangler.toml cron
4. If Tiller is down: manual bank data entry until sync restores

5. **Post-Incident Checklist:**
   - [ ] Root cause identified and documented
   - [ ] Fix deployed and verified
   - [ ] ErrorLog clean for 30 min post-fix
   - [ ] Affected surfaces verified at target viewport
   - [ ] If deploy-related: full deploy proof captured
   - [ ] Notion thread handoff updated with incident details
   - [ ] Pushover confirmation that alerts are flowing again (if alert-related)

6. **Rollback Decision:**
   - Can you fix forward in < 30 minutes? → Fix forward
   - Is the broken version causing data corruption? → Rollback immediately
   - Is it a visual-only regression? → Fix forward, mark P3
   - Rollback method: `clasp deploy -i <previous-deployment-id>` — but you need the previous ID from `clasp deployments` output

7. **Guardrails:**
   - Never "fix" by deleting ErrorLog entries — they're diagnostic evidence
   - Never rollback without checking if the old version has its own issues
   - Never silence a Pushover alert by removing the trigger — fix the source
   - Never skip post-incident verification — "it stopped erroring" is not "it's fixed"
   - Always capture evidence before fixing — screenshots, log entries, test output
