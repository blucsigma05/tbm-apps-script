# withFailureHandler() Coverage Audit

Date: April 3, 2026
Anchor: `fadf8fd`
Rule: Every `google.script.run` call MUST have a paired `withFailureHandler()` (CLAUDE.md Tier 1, item #10)

## Summary

- Total google.script.run calls: **190**
- Total withFailureHandler calls: **145**
- Gap: **45 calls (23.7%)**
- Files with gaps: **11**

## File-by-File Status

| File | Calls | Handlers | Gap | Priority |
|------|-------|----------|-----|----------|
| ThePulse.html | 12 | 12 | 0 | PASS |
| TheVein.html | 27 | 27 | 0 | PASS |
| BaselineDiagnostic.html | 1 | 1 | 0 | PASS |
| KidsHub.html | 48 | 47 | 1 | LOW |
| fact-sprint.html | 13 | 7 | **6** | HIGH |
| SparkleLearning.html | 13 | 7 | **6** | HIGH |
| daily-missions.html | 10 | 5 | **5** | HIGH |
| writing-module.html | 10 | 5 | **5** | HIGH |
| investigation-module.html | 10 | 5 | **5** | HIGH |
| reading-module.html | 9 | 6 | **3** | MEDIUM |
| HomeworkModule.html | 9 | 6 | **3** | MEDIUM |
| WolfkidCER.html | 6 | 3 | **3** | MEDIUM |
| StoryLibrary.html | 3 | 1 | **2** | LOW |
| ComicStudio.html | 4 | 2 | **2** | LOW |
| StoryReader.html | 3 | 2 | 1 | LOW |
| ProgressReport.html | 2 | 1 | 1 | LOW |
| DesignDashboard.html | 2 | 1 | 1 | LOW |
| wolfkid-power-scan.html | 2 | 1 | 1 | LOW |

## Fix Order

### Wave 1 — HIGH priority (5 files, ~27 missing handlers)
1. fact-sprint.html (6)
2. SparkleLearning.html (6)
3. daily-missions.html (5)
4. writing-module.html (5)
5. investigation-module.html (5)

### Wave 2 — MEDIUM priority (3 files, ~9 missing handlers)
6. reading-module.html (3)
7. HomeworkModule.html (3)
8. WolfkidCER.html (3)

### Wave 3 — LOW priority (5 files, ~7 missing handlers)
9. KidsHub.html (1)
10. StoryLibrary.html (2)
11. ComicStudio.html (2)
12. StoryReader.html (1)
13. ProgressReport.html (1)
14. DesignDashboard.html (1)
15. wolfkid-power-scan.html (1)

## Standard Fix Pattern (ES5 only)

```javascript
google.script.run
  .withSuccessHandler(function(result) {
    // handle success
  })
  .withFailureHandler(function(err) {
    console.error('functionName failed:', err);
    // show user-visible error state if appropriate
  })
  .functionNameSafe(args);
```

## Verification

After fixing, run:
```bash
# Count calls vs handlers — should match
grep -c "google.script.run" *.html
grep -c "withFailureHandler" *.html
```

## Scorecard Impact

Fixing this moves:
- Automation Maturity: 6.5 → 7.0
- Data Integrity Controls: 6.0 → 6.5 (fewer silent failures)
