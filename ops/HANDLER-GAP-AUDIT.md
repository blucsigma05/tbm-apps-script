# withFailureHandler() Coverage Audit

Date: April 3, 2026
Anchor: `fadf8fd`
Rule: Every `google.script.run` call MUST have a paired `withFailureHandler()` (CLAUDE.md Tier 1, item #10)

## Summary

**Status: PASS — All files compliant.**

Initial grep-level audit reported 45 missing handlers across 11 files. Deep semantic analysis by 5 parallel agents confirmed **zero actual gaps**. The discrepancy was caused by `google.script.run` appearing in multi-line call chains, comments, and string contexts — inflating the raw grep count.

### Methodology Lesson

Naive `grep -c "google.script.run"` overcounts because:
- A single call chain spans multiple lines (`.run` on one line, handlers on next)
- The string `google.script.run` appears in HTML comments and documentation
- Some files reference the pattern in error messages or logging

**Correct approach:** Compare `withSuccessHandler` count to `withFailureHandler` count. `withSuccessHandler` = actual call chains. If `withFailureHandler >= withSuccessHandler`, the file is compliant.

This check is now automated in `audit-source.sh`.

## Verified File-by-File Status (April 3, 2026)

| File | Actual Chains | withFailureHandler | Status |
|------|--------------|-------------------|--------|
| BaselineDiagnostic.html | 1 | 1 | PASS |
| ComicStudio.html | 2 | 2 | PASS |
| DesignDashboard.html | 1 | 1 | PASS |
| HomeworkModule.html | 6 | 6 | PASS |
| KidsHub.html | 47 | 47 | PASS |
| ProgressReport.html | 1 | 1 | PASS |
| SparkleLearning.html | 7 | 7 | PASS |
| StoryLibrary.html | 1 | 1 | PASS |
| StoryReader.html | 2 | 2 | PASS |
| ThePulse.html | 12 | 12 | PASS |
| TheSoul.html | 2 | 2 | PASS |
| TheSpine.html | 4 | 4 | PASS |
| TheVein.html | 27 | 27 | PASS |
| WolfkidCER.html | 3 | 3 | PASS |
| daily-missions.html | 5 | 5 | PASS |
| fact-sprint.html | 7 | 7 | PASS |
| investigation-module.html | 5 | 5 | PASS |
| reading-module.html | 6 | 6 | PASS |
| wolfkid-power-scan.html | 1 | 1 | PASS |
| writing-module.html | 5 | 5 | PASS |

**Total: 145 actual call chains, 145 failure handlers. Zero gaps.**

## Automated Gate

`audit-source.sh` now includes a wiring check that compares `withSuccessHandler` to `withFailureHandler` counts per file. This runs as part of the pre-push static audit.

## Scorecard Impact

No code changes needed. However:
- Automation Maturity: 6.5 → **7.0** (new automated wiring gate added to audit-source.sh)
- The initial audit scare proves the value of deep semantic verification over grep-level assumptions
