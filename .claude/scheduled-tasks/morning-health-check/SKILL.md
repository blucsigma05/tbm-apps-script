---
name: morning-health-check
description: Daily 6am health check across TBM. Pulls latest, runs audit-source.sh, hits ?action=runTests, scans ErrorLog for new entries, compares deployed vs HEAD versions. LT wakes up knowing if anything broke overnight.
---

Run the morning health check across the Thompson Family Management system.

## Steps

1. **Pull latest main** from `https://github.com/blucsigma05/tbm-apps-script`.
2. **Static audit:** `bash audit-source.sh` in repo root. Report any FAIL or WARN line.
3. **Smoke test:** `curl -s 'https://thompsonfams.com/pulse?action=runTests'` and parse JSON. Report `overall` status (expect `PASS`).
4. **ErrorLog scan:** Hit `?action=getErrorLogTailSafe&hours=24` (or query the ErrorLog tab directly via GAS endpoint). Report count of new entries.
5. **Version drift:** Compare deployed versions (`?action=version`) against git HEAD `getXxxVersion()` returns. Report any file where they differ.

## Output

- Single Pushover summary, format:
  ```
  Branch: main @ <sha-short>
  Audit: PASS / N WARN / N FAIL
  Smoke: PASS / FAIL
  ErrorLog (24h): N new
  Version drift: N files
  ```
- Pushover priority `HYGIENE_REPORT_LOW` (-1) if everything clean.
- Pushover priority `SYSTEM_ERROR` (1) if smoke FAIL, audit FAIL, or ErrorLog has 5+ new entries.
- Pushover priority `PROD_DOWN` (2) if smoke endpoint returns non-200 (production down).

## On error

If any step throws or returns unexpected output, send a Pushover priority `SYSTEM_ERROR` (1) noting which step failed. Do not silently swallow.
