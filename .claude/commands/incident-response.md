---
name: incident-response
description: >
  Runbook for diagnosing and resolving TBM platform failures. Use this skill
  when ?action=runTests fails, ErrorLog has new entries, a surface is returning
  500s, a child can't access their dashboard, Cloudflare routes are broken, or
  a deploy left the system in a bad state. Triggers on: tests failing, surface
  down, 500 error, ErrorLog noisy, smoke failed, regression failed, deploy
  broken, rollback, system error, something not working.
---

# Incident Response — TBM Platform

## Cardinal Rule
> Diagnose before you act. A broken deploy is worse than a slow recovery.
> Read the error. Check the source. Fix the actual cause. Never bypass safety checks.

---

## Step 1: Classify the Incident

| Symptom | Likely cause | Go to |
|---------|-------------|-------|
| `?action=runTests` returns `overall: FAIL` | Smoke or regression failure | § Smoke Failure |
| Cloudflare route returns 500 | GAS error or missing function | § CF 500 |
| KidsHub surface blank / spinner | Heartbeat stale or GAS quota hit | § Surface Down |
| ErrorLog has new entries | Exception in server function | § ErrorLog Triage |
| Audio not playing | ElevenLabs key expired or Drive permission | § Audio Failure |
| Rings not awarding | Lock contention or sheet write failure | § Ring/Star Failure |
| Notion logging silent | API key expired or DB ID changed | § Notion Failure |
| Deploy looks pushed but behavior unchanged | Pushed to wrong deployment ID | § Wrong Deploy |

---

## Smoke Failure — `?action=runTests` returns FAIL

**Step 1: Read the structured JSON output.**

```
https://<GAS_EXEC_URL>?action=runTests
```

JSON shape:
```json
{
  "overall": "FAIL",
  "smoke": { "overall": "PASS/FAIL", "checks": [...] },
  "regression": { "overall": "PASS/FAIL", "results": [...] }
}
```

Look at `.smoke.checks` for the first FAIL. Each check is a named test.

**Step 2: Find the failing check name → grep the source.**

```bash
grep -n "<check_name>" tbmSmokeTest.gs tbmRegressionSuite.gs Code.gs
```

**Step 3: Common failures and fixes.**

| Check | Cause | Fix |
|-------|-------|-----|
| `wiring-check` | New `google.script.run` call without Safe wrapper | Add Safe wrapper + smoke test entry |
| `version-consistency` | 3-location version mismatch | Grep all 3 locations, align to highest |
| `notion-homework-db` | NOTION_HOMEWORK_DB_ID Script Property not set | Set in GAS Script Properties |
| `kh-heartbeat` | `stampKHHeartbeat_()` not called after last write | Check last KidsHub write path |
| `tab-map-access` | Sheet tab renamed without updating TAB_MAP | Update TAB_MAP in DataEngine.gs |
| `cache-valid` | CacheService stale or malformed JSON | `CacheService.getScriptCache().removeAll()` |

**Step 4: Re-run tests after fix.**

Only declare resolved when `overall == "PASS"` AND `smoke.overall == "PASS"` from a fresh `/exec?action=runTests` hit. Not from logs, not from inference.

---

## CF 500 — Cloudflare Route Returns 500

**Step 1: Identify which route.**

```bash
# Check all CF routes from CLAUDE.md route list:
curl -s -o /dev/null -w "%{http_code}" https://thompsonfams.com/<route>
```

**Step 2: Check if GAS itself is erroring.**

Hit the GAS `/exec?page=<surface>` directly (requires Google auth for `/dev`). The CF worker just proxies — if CF returns 500, GAS is likely erroring or the deployment is stale.

**Step 3: Check ErrorLog.**

```javascript
// Run in GAS editor:
function checkRecentErrors() {
  var ss = SpreadsheetApp.openById(SSID);
  var log = ss.getSheetByName('ErrorLog');
  var last = log.getLastRow();
  var rows = log.getRange(Math.max(2, last-20), 1, 20, 5).getValues();
  rows.forEach(function(r) { Logger.log(JSON.stringify(r)); });
}
```

**Step 4: Check deployment ID.**

```bash
clasp deployments
```

The active deployment ID in CLAUDE.md must match what `clasp deployments` shows. If a new deployment was accidentally created, the CF worker is pointing at the old one.

**Fix:** `clasp deploy -i <correct_deployment_id>` — never create a new deployment.

---

## Surface Down — KidsHub Blank or Spinner

**Likely causes (in order):**
1. GAS quota exhausted (check Execution log in GAS dashboard)
2. Heartbeat cache stale (age > 120s triggers fallback state)
3. `getKHPayload_()` threw an exception (ErrorLog will show it)
4. Sheet tab renamed without TAB_MAP update

**Diagnosis:**
```javascript
// Run in GAS editor — does the payload load?
function diagKH() {
  var result = getKHPayload_();
  Logger.log(JSON.stringify(result).substring(0, 1000));
}
```

**Heartbeat check:**
```javascript
function checkHeartbeat() {
  var cache = CacheService.getScriptCache();
  var hb = cache.get('kh_heartbeat');
  Logger.log('heartbeat: ' + hb);
  // Should be a recent timestamp, not null
}
```

**Quota fix:** If quota is exhausted, nothing executes until reset (midnight PST). Use `diagPreQA()` from GASHardening.gs to see quota state.

---

## ErrorLog Triage

**Read ErrorLog:**
```javascript
// In GAS editor:
function readErrorLog() {
  var ss = SpreadsheetApp.openById(SSID);
  var log = ss.getSheetByName('ErrorLog');
  var last = log.getLastRow();
  if (last < 2) { Logger.log('ErrorLog empty — no errors'); return; }
  var rows = log.getRange(2, 1, Math.min(last - 1, 30), 5).getValues();
  rows.reverse().forEach(function(r) {
    Logger.log(r[0] + ' | ' + r[1] + ' | ' + r[2]);
  });
}
```

**ErrorLog columns:** `[Timestamp, Function, Message, StackTrace, Version]`

**Error patterns and fixes:**

| Error message pattern | Cause | Fix |
|----------------------|-------|-----|
| `Cannot read property of undefined` | Null sheet or null payload field | Add null guard before access |
| `Lock timed out` | `waitLock(30000)` failed after 30s | Check if another execution is hung; re-run after 60s |
| `Notion API 400` | Invalid payload field (usually wrong select value) | Check SUBJ_MAP in logHomeworkCompletionSafe |
| `Notion API 401` | NOTION_API_KEY expired | Rotate key in Script Properties |
| `No GEMINI_API_KEY` | Script Property not set | Set GEMINI_API_KEY in Script Properties |
| `DriveApp permission` | Service account lost Drive access | Re-authorize in GAS OAuth |
| `getSheetByName null` | Tab renamed, TAB_MAP stale | Update TAB_MAP in DataEngine.gs |

**After fixing:** Clear ErrorLog rows fixed, re-run `?action=runTests`, verify no new entries appear within 5 minutes.

---

## Audio Failure — ElevenLabs Not Playing

**Diagnosis order:**
1. Check browser console for `Audio failed` errors
2. Check `ELEVENLABS_API_KEY` is set in Script Properties
3. Check Drive folder `1rXWVBD9QMruWOj6AlNB4mY2E9wzWGctm` is accessible
4. Run `auditAudioClips()` in GAS editor — confirms clip inventory
5. Check `getAudioBatchSafe()` returns non-null for a known clip name

**Web Speech API fallback:** If ElevenLabs fails, modules fall back to `speechSynthesis.speak()`. If both fail, check that the page isn't in a sandboxed iframe that blocks `speechSynthesis`.

**ElevenLabs quota:** API has monthly character limits. If quota is exhausted, all audio generates silently. Check [ElevenLabs dashboard](https://elevenlabs.io) for quota status.

---

## Ring/Star Failure — Rings Not Awarding

**Diagnosis:**
```javascript
// Run in GAS editor:
function testRingAward() {
  var result = kh_awardEducationPoints_('buggsy', 5, 'test');
  Logger.log(JSON.stringify(result));
}
```

Expected: `{ success: true }` or `{ duplicate: true }` (if already awarded today for this source).

**Common causes:**
- `duplicate: true` — same source string already awarded today. By design — not a bug.
- Lock timeout — another ring award in progress. Retry after 30s.
- Sheet permission — KH tab not writable. Check GAS execution permissions.
- `kh_awardEducationPoints_` returns wrong shape — grep for the function, check version match.

---

## Notion Failure — Logging Silent

**Test directly:**
```javascript
function testNotionLog() {
  var result = logHomeworkCompletionSafe({
    child: 'buggsy',
    title: 'Test Entry',
    subject: 'Math',
    score: 5,
    total: 6
  });
  Logger.log(JSON.stringify(result));
}
```

Expected: `{ success: true }`. If `{ error: true }`:
- `NOTION_API_KEY not set` → set in Script Properties
- `NOTION_HOMEWORK_DB_ID not set` → set from CLAUDE.md Notion IDs table
- `Notion API 401` → API key expired, rotate at notion.so/my-integrations
- `Notion API 400` → invalid property value, check SUBJ_MAP and field names in `logHomeworkCompletionSafe`

---

## Wrong Deploy — Behavior Unchanged After Push

**Symptom:** `clasp push` succeeded, but changes aren't live.

**Cause:** `clasp push` without `clasp deploy -i <ID>` leaves changes in HEAD but not serving.

**Fix:**
```bash
clasp deployments          # confirm the active deployment ID
clasp deploy -i <ID>       # redeploy to the EXISTING deployment — never create new
curl -s "<exec_url>?action=runTests" | python3 -m json.tool
```

The `/exec` URL always serves the most recent deployment. `/dev` serves HEAD (requires auth). **Never use `/dev` to validate a production deploy.**

---

## Rollback Procedure

Use only when a new deploy broke something and the previous version is known-good.

1. `git log --oneline -10` — find the last good commit SHA
2. `git checkout <SHA> -- <affected_files>` — restore specific files (NOT full repo revert)
3. Version the rollback: bump version number in all 3 locations, add `-rollback` suffix to commit message
4. `clasp push` → `clasp deploy -i <ID>`
5. Verify `?action=runTests` returns PASS
6. Open an Issue `kind:bug severity:blocker` documenting what broke and why the rollback was needed

**Never hard-reset main.** Rollback as a new commit, not a destructive reset.

---

## Post-Incident Checklist

- [ ] `?action=runTests` returns `overall: PASS`
- [ ] No new ErrorLog entries in last 5 minutes
- [ ] KidsHub heartbeat age < 120s
- [ ] All CF routes return 200 (spot check 3-5)
- [ ] Pushover PROD_DOWN or DEPLOY_FAIL alert dismissed
- [ ] Issue opened documenting root cause + fix (if incident > 10 min)
- [ ] If rollback: Issue tagged `kind:bug severity:blocker` with regression details
