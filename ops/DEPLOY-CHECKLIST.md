# TBM Deploy Checklists

Date: April 3, 2026
Purpose: Practical deploy control checklist for TBM.

## Rule

No deploy should rely on memory.

Every deploy should answer:
- what changed
- what was tested
- what could break
- how you would know
- what you would do next if it did

---

## Universal Pre-Merge Checklist

### Scope
- [ ] Change is clearly named
- [ ] Touched surface/module identified
- [ ] Clear expected outcome stated

### Contract
- [ ] Every changed UI still matches its backend payload
- [ ] No route or API name changed without docs update
- [ ] No save path or response shape changed without verification

### Test
- [ ] At least one direct verification done
- [ ] Automation ran if available
- [ ] New risks are not added without test coverage

### Ops
- [ ] Monitoring still reflects reality
- [ ] Version collectors updated if new modules added
- [ ] Docs still truthful

### Security
- [ ] No secrets in source
- [ ] No new hardcoded IDs or unsafe setup paths

---

## TBM Deploy Checklist

### Before merge
- [ ] Review changed routes, Safe wrappers, and worker exposure
- [ ] Run smoke checks for touched surfaces
- [ ] Run Playwright screenshot or safe E2E suite if UI changed
- [ ] Confirm loading screens dismiss on changed boards/modules
- [ ] Confirm changed modules do not silently fall into fallback
- [ ] Confirm completion/reward semantics still match backend writes
- [ ] Confirm all google.script.run calls have withFailureHandler()

### Before deploy
- [ ] `bash audit-source.sh` passes
- [ ] `clasp push` succeeds
- [ ] Run Apps Script smoke/test endpoint (`?action=runTests`)
- [ ] Run Playwright on touched surfaces
- [ ] Capture screenshots for changed primary surfaces

### After deploy
- [ ] Open live route
- [ ] Check one real user flow
- [ ] Confirm no console/runtime obvious breakage
- [ ] Confirm route loads and content appears
- [ ] If save path changed, confirm one real save
- [ ] Check ErrorLog for new errors (last 5 min)

### TBM Required Sign-Off Questions
- Would a kid know if this was fallback or real work?
- Would a parent know whether this actually counted?
- Did the backend record what the UI implied?
- Is this behavior now reflected in docs and scorecard?

---

## New Surface Checklist

Use this every time a new page/module appears.

- [ ] Route exists in cloudflare-worker.js
- [ ] Route added to CLAUDE.md route table
- [ ] Backing .html file exists
- [ ] Backend Safe wrapper exists in Code.gs if needed
- [ ] All google.script.run calls have withFailureHandler()
- [ ] Response shape documented
- [ ] Smoke coverage added
- [ ] Version discipline updated (header, getter, EOF)
- [ ] Monitoring/logging decision made
- [ ] Screenshot or visual verification path exists

---

## Hotfix Checklist

For urgent fixes:

- [ ] Identify the exact user-visible bug
- [ ] Fix the smallest safe scope
- [ ] Verify the touched flow directly
- [ ] Record the bug in drift ledger or release notes
- [ ] Schedule any hardening follow-up

Do not call a hotfix "done" if:
- it changed behavior but not test coverage
- it changed contracts but not docs
- it solved one symptom but created a hidden branch

---

## Deploy Note Template

```text
Repo: blucsigma05/tbm-apps-script
Date:
Head:
Change:
Touched files/modules:

What was tested:
What was manually verified:
Known risks:
Rollback or fallback:
Scorecard impact:
Next follow-up:
```
