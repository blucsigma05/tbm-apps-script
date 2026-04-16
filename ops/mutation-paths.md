# TBM Production Mutation Path Inventory

<!-- canonical inventory of every code path that can modify production state -->
<!-- drives deploy freeze gating (P0 item 22) -->
<!-- updated in every PR that adds/removes a mutation call site (work-doctrine rule 14) -->

## Severity classes

- **freeze-critical** — touches money, household truth, kid grades, chore completion, curriculum state, parent approvals, PIN config, finance records, kid-visible rewards. Deploy freeze MUST block execution of these paths.
- **freeze-safe** — observability (logs, heartbeats, caches that regenerate), retry/backoff counters, API usage counters, trigger setup, test diagnostics, notification pushes (parent acts on the alert; alert itself isn't truth). Deploy freeze can leave these running.
- **freeze-ambiguous** — LT decides per-run. None currently (previously-flagged items all classified freeze-safe by LT 2026-04-16).

## Totals

| Class | Count |
|---|---:|
| freeze-critical | 18 |
| freeze-safe | 62 |
| freeze-ambiguous | 0 |
| **Total** | **80** |

## By mutation class

| Class | Count |
|---|---:|
| sheet-write | 26 (20 truth + 6 observability) |
| property-set | 16 |
| notion-write | 9 |
| trigger-create | 14 |
| external-post | 7 |
| cache-put / cache-remove | 8 |

## By trigger path

| Path | Count |
|---|---:|
| scheduled-trigger | 28 |
| manual-run | 23 |
| parent-action-surface | 8 |
| library-helper | 4 |
| kid-action-surface | 2 |
| finance-action | 2 |

## Canonical inventory

### freeze-critical (18)

| # | File:line | Mutation | Target | Trigger |
|---|---|---|---|---|
| 1 | Kidshub.js:1378 | sheet-write | KH_Chores:Completed | kid-action-surface |
| 2 | Kidshub.js:1379 | sheet-write | KH_Chores:Completed_Date | kid-action-surface |
| 3 | Kidshub.js:1533 | sheet-write | KH_Chores:row | parent-action-surface |
| 4 | Kidshub.js:1544 | sheet-write | KH_Chores:Parent_Approved | parent-action-surface |
| 5 | Code.js:994 | notion-write | api.notion.com/v1/pages (finance) | finance-action |
| 6 | Code.js:1034 | notion-write | api.notion.com/v1/pages (finance) | finance-action |
| 7 | Code.js:1467 | notion-write | api.notion.com (parent config) | parent-action-surface |
| 8 | Dataengine.js:3322 | sheet-write | Board_Config:note | parent-action-surface |
| 9 | Utility.js:32 | sheet-write | KH_Children:Parent_PIN | manual-run |
| 10 | Utility.js:40 | sheet-write | KH_Children:PIN_value | manual-run |
| 11 | Utility.js:92 | sheet-write | KH_Chores:Completed | manual-run |
| 12 | Utility.js:93 | sheet-write | KH_Chores:Completed_Date | manual-run |
| 13 | Utility.js:94 | sheet-write | KH_Chores:Parent_Approved | manual-run |
| 14 | Utility.js:102 | sheet-write | KH_Chores:Completed | manual-run |
| 15 | Utility.js:103 | sheet-write | KH_Chores:Completed_Date | manual-run |
| 16 | Utility.js:104 | sheet-write | KH_Chores:Parent_Approved | manual-run |
| 17 | Utility.js:548 | sheet-write | Amazon_Detail:rows | manual-run |
| 18 | Utility.js:635-636 | sheet-write | Amazon_Detail:col8-9 | manual-run |

### freeze-safe (62)

**Observability / heartbeats (7):**
| # | File:line | Mutation | Target | Trigger |
|---|---|---|---|---|
| 19 | Code.js:706 | sheet-write | Helpers:Z1 heartbeat | library-helper |
| 20 | Kidshub.js:251 | sheet-write | Helpers:Z1 heartbeat | library-helper |
| 21 | GASHardening.js:48 | sheet-write | ErrorLog header init | manual-run |
| 22 | GASHardening.js:78 | sheet-write | ErrorLog append (logError_) | library-helper |
| 23 | GASHardening.js:111 | sheet-write | PerfLog header init | manual-run |
| 24 | GASHardening.js:140 | sheet-write | PerfLog append (logPerf_/withMonitor_) | library-helper |
| 25 | GASHardening.js:628,662 | sheet-write | audit log appends | scheduled-trigger |

**Property state (16):**
| # | File:line | Mutation | Target | Trigger |
|---|---|---|---|---|
| 26 | Alertenginev1.js:227 | property-set | ALERT_LAST_PENDING | scheduled-trigger |
| 27 | Alertenginev1.js:289 | property-set | ALERT_LAST_ASKS | scheduled-trigger |
| 28 | Alertenginev1.js:338 | property-set | ALERT_LAST_ERROR_TS | scheduled-trigger |
| 29 | Alertenginev1.js:339 | property-set | ALERT_LAST_ERROR_ALERT | scheduled-trigger |
| 30 | Alertenginev1.js:514 | property-set | ALERT_LAST_PENDING (manual) | manual-run |
| 31 | CalendarSync.js:437 | property-set | CS_PREFIX_bonusAmt | scheduled-trigger |
| 32 | QAOperatorSafe.js:59 | property-set | QA_ACTIVE_SCENARIO | manual-run |
| 33 | StoryFactory.js:384 | property-set | SF_API_CALLS | scheduled-trigger |
| 34 | StoryFactory.js:387 | property-set | SF_STORY_COUNT | scheduled-trigger |
| 35 | StoryFactory.js:1606 | property-set | SF_BACKOFF | scheduled-trigger |
| 36 | StoryFactory.js:1622 | property-set | SF_BACKOFF | scheduled-trigger |
| 37 | StoryFactory.js:1630 | property-set | SF_BACKOFF | scheduled-trigger |
| 38 | StoryFactory.js:1681 | property-set | SF_CONSECUTIVE_FAILS | scheduled-trigger |
| 39 | StoryFactory.js:1811 | property-set | SF_CONSECUTIVE_FAILS | scheduled-trigger |
| 40 | StoryFactory.js:1819 | property-set | SF_CONSECUTIVE_FAILS | scheduled-trigger |
| 41 | StoryFactory.js:1823 | property-set | SF_PAUSED_UNTIL | scheduled-trigger |

**Trigger setup (14):**
| # | File:line | Mutation | Target | Trigger |
|---|---|---|---|---|
| 42 | Alertenginev1.js:368 | trigger-create | checkPendingApprovals | manual-run |
| 43 | Alertenginev1.js:374 | trigger-create | checkSystemErrors | manual-run |
| 44 | Code.js:1441 | trigger-create | runDailyGateCheck | manual-run |
| 45 | Code.js:1737 | trigger-create | reconcileVeinPulse | manual-run |
| 46 | CascadeEngine.js:686 | trigger-create | refreshCascadeTabs | manual-run |
| 47 | EducationAlerts.js:349 | trigger-create | runDailyEducationAlerts | manual-run |
| 48 | EducationAlerts.js:374 | trigger-create | sendWeeklyDigest_ | manual-run |
| 49 | GASHardening.js:697 | trigger-create | checkTillerSyncHealth | manual-run |
| 50 | GASHardening.js:705 | trigger-create | monthClosePreflight | manual-run |
| 51 | GASHardening.js:713 | trigger-create | writeWeeklySnapshot | manual-run |
| 52 | Kidshub.js:3019 | trigger-create | resetDailyTasksAuto | manual-run |
| 53 | MonitorEngine.js:489 | trigger-create | runMonthlyMERReport_ | manual-run |
| 54 | NotionBridge.js:551 | trigger-create | pushHealthSnapshot | manual-run |
| 55 | StoryFactory.js:1841 | trigger-create | pollForNewStories | manual-run |

**Cache state (8, all regenerable):**
| # | File:line | Mutation | Target | Trigger |
|---|---|---|---|---|
| 56 | Code.js:148 | cache-put | DataEngine payload | library-helper |
| 57 | Code.js:158 | cache-put | DataEngine meta | library-helper |
| 58 | Code.js:225 | cache-remove | DE_CACHE_KEY | library-helper |
| 59 | Code.js:229 | cache-remove | monthKey | library-helper |
| 60 | Code-Finance.gs.js:93 | cache-put | finance registry | library-helper |
| 61 | Dataengine.js:3330 | cache-remove | board_data | parent-action-surface |
| 62 | GASHardening.js:1790 | cache-put | diagnostic testKey (self-cleaning) | manual-run |
| 63 | GASHardening.js:1792 | cache-remove | diagnostic testKey | manual-run |

**External-state / other (17):** (story content, external APIs, library helpers, Drive snapshots)
| # | File:line | Mutation | Target | Trigger |
|---|---|---|---|---|
| 64 | Alertenginev1.js:95 | external-post | api.pushover.net | scheduled-trigger |
| 65 | ContentEngine.js:686 | sheet-write | (appendRow, content cache) | library-helper |
| 66 | CurriculumSeed.js:4509 | sheet-write | Curriculum seed | manual-run |
| 67 | NotionBridge.js:363 | notion-write | api.notion.com (health snapshot) | scheduled-trigger |
| 68 | NotionEngine.js:58 | notion-write | api.notion.com (generic wrapper) | library-helper |
| 69 | StoryFactory.js:130 | notion-write | api.notion.com (Story DB POST) | scheduled-trigger |
| 70 | StoryFactory.js:145 | notion-write | api.notion.com (Story DB PATCH) | scheduled-trigger |
| 71 | StoryFactory.js:486 | external-post | generativelanguage.googleapis.com (Gemini text) | scheduled-trigger |
| 72 | StoryFactory.js:858 | external-post | generativelanguage.googleapis.com (Gemini image) | scheduled-trigger |
| 73 | StoryFactory.js:927 | external-post | googleapis.com/upload/drive | scheduled-trigger |
| 74 | StoryFactory.js:1107 | notion-write | api.notion.com (Story DB final) | scheduled-trigger |
| 75 | StoryFactory.js:1136 | notion-write | api.notion.com (Story DB PATCH final) | scheduled-trigger |
| 76 | CodeSnapshot.js:30 | external-post | googleapis.com/drive (ThompsonLib.snapshotSplit) | manual-run |
| 77 | CodeSnapshot.js:37 | external-post | googleapis.com/drive (ThompsonLib.snapshotCodeToGDrive) | manual-run |
| 78 | CodeSnapshot.js:44 | external-post | googleapis.com/drive (ThompsonLib.snapshotToSingleDoc) | manual-run |

## Deploy freeze contract

When a deploy freeze is active:
- **BLOCK**: every site listed in `freeze-critical` above. Surface the freeze state to any caller; fail-closed with `FROZEN` error.
- **ALLOW**: every site in `freeze-safe`. Observability and retry state must keep flowing during freeze, or we lose visibility into what's happening.
- **LT decides per-run**: items in `freeze-ambiguous`. Zero such items at present.

Freeze gate lives in `Code.js` router OR as a Script Property check inside each `*Safe()` wrapper — implementation deferred to P0 item 22 (deploy freeze build).

## Update rule

Any PR that adds a new mutation call site (sheet write, property set, cache put, Notion write, external POST, trigger create) MUST add a row to this file in the same PR, with severity classification. Enforced by a hygiene check added in P0 item 22.

## Notes and limits

- **Coverage method:** grep sweep of `*.js` on `origin/main` HEAD at 2026-04-16, excluding `.claude/worktrees/`, `tests/`, `.github/`. Cross-verified cache and ErrorLog/PerfLog sites directly to close a gap from the initial automated sweep.
- **ThompsonLib wrappers in this repo:** `CodeSnapshot.js:30,37,44` call `ThompsonLib.snapshotSplit/snapshotCodeToGDrive/snapshotToSingleDoc` — all write to Google Drive only (not production sheets); classified freeze-safe and added as entries 76-78. No other ThompsonLib write paths identified in this repo at 2026-04-16.
- **What this does NOT capture:** mutation paths inside ThompsonLib's own source (not in this repo). If ThompsonLib grows additional write paths, a follow-up pass is required.
- **Reviewed by:** LT 2026-04-16 (all prior `freeze-ambiguous` items resolved to `freeze-safe`).

## Change log

| Date | Version | Change |
|---|---|---|
| 2026-04-16 | 1.0 | Initial inventory. 77 sites. 18 critical, 59 safe, 0 ambiguous. |
| 2026-04-16 | 1.1 | Added CodeSnapshot.js ThompsonLib Drive-write paths (entries 76-78, freeze-safe). Total 80. Codex finding F001 from PR #363. |
