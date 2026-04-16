# TBM Surface Map — CP-1
<!-- control-plane v1 — sourced from cloudflare-worker.js, Code.js servePage(), CLAUDE.md File Map, Device Viewport Map -->
<!-- update this file in every PR that adds, removes, or reroutes a surface (Work Doctrine rule 14) -->

| Surface | User | Device | Route | Runtime | Primary Code | Data Source | Shared Deps | Criticality | JT Operable |
|---|---|---|---|---|---|---|---|---|---|
| KidsHub — Buggsy | Buggsy | A9 Tablet 800×1340 | `/buggsy` | Fully Kiosk / Android WebView | KidsHub.html + Kidshub.js | KH_Chores, KH_History, KH_Rewards, KH_Redemptions, KH_Children, Curriculum | KH_CACHE_KEY, KH heartbeat (Helpers Z1), CF worker shim | Critical | No |
| KidsHub — JJ | JJ | A7 Tablet 800×1340 | `/jj` | Fully Kiosk / Android WebView | KidsHub.html + Kidshub.js | KH_Chores, KH_History, KH_Rewards, KH_Children, Curriculum | KH_CACHE_KEY, KH heartbeat (Helpers Z1), CF worker shim | Critical | No |
| KidsHub — Parent | JT (Parent) | Samsung S25 412×915 | `/parent` | Browser / Android | KidsHub.html + Kidshub.js | KH_Chores, KH_History, KH_Requests, KH_Grades, KH_Children | KH_CACHE_KEY, KH heartbeat (Helpers Z1), CF worker shim | Critical | Yes |
| ThePulse | JT + LT | Samsung S25 412×915 | `/pulse` | Browser / Android | ThePulse.html + DataEngine.js | Transactions, Budget_Data, Balance History, Debt_Export, WCM, BankRec | DE_CACHE_KEY, finance cookie (tbm_auth), CF PIN gate, CF worker shim | Critical | Yes |
| TheVein | LT | Desktop 1920×1080 | `/vein` | Browser / Desktop | TheVein.html + DataEngine.js + CascadeEngine.js | All finance tabs + DebtModel + Close History | DE_CACHE_KEY, finance cookie (tbm_auth), CF PIN gate, CF worker shim | Critical | No |
| HomeworkModule | Buggsy | A9 Tablet / Surface Pro | `/homework` | Browser / Android or Chromium | HomeworkModule.html + Kidshub.js | Curriculum, KH_Education, QuestionLog | KH_CACHE_KEY, ContentEngine.js (getTodayContent_), CF worker shim | Critical | No |
| SparkleLearning | JJ | Samsung S10 FE 1200×1920 | `/sparkle` | Browser / Android | SparkleLearning.html + Kidshub.js | Curriculum, KH_Education, KH_LessonRuns, KH_VocabExposures | KH_CACHE_KEY, ActivityStoryPacks.js, AssetRegistry.js, CF worker shim | Critical | No |
| TheSpine | Household | Office Fire Stick 980×551 | `/spine` | Fully Kiosk / FireOS WebView | TheSpine.html + DataEngine.js | Finance tabs (display-only), Helpers (heartbeat) | DE_CACHE_KEY, KH heartbeat, CF worker (60s cache) | High | No (ambient) |
| TheSoul | Household | Kitchen Fire Stick 980×551 | `/soul` | Fully Kiosk / FireOS WebView | TheSoul.html + DataEngine.js | Finance tabs (display-only) | DE_CACHE_KEY, CF worker (60s cache) | High | No (ambient) |
| daily-missions (Buggsy) | Buggsy | Surface Pro 1368×912 | `/daily-missions` | Browser / Chromium | daily-missions.html + Kidshub.js | KH_MissionState, Curriculum | KH_CACHE_KEY, CF worker shim | High | No |
| daily-adventures (JJ alias) | JJ | Samsung S10 FE 1200×1920 | `/daily-adventures` | Browser / Android | daily-missions.html + Kidshub.js | KH_MissionState, Curriculum | KH_CACHE_KEY, CF worker shim | High | No |
| reading-module | Buggsy | A9 Tablet | `/reading` | Browser / Android WebView | reading-module.html + Kidshub.js | Curriculum, KH_Education | KH_CACHE_KEY, CF worker shim | High | No |
| writing-module | Buggsy | A9 Tablet | `/writing` | Browser / Android WebView | writing-module.html + Kidshub.js | Curriculum, KH_Education | KH_CACHE_KEY, CF worker shim | High | No |
| ProgressReport | Parent (LT / JT) | Desktop / S25 | `/progress` | Browser | ProgressReport.html + Kidshub.js | KH_Education, KH_Grades, Curriculum | KH_CACHE_KEY, CF worker shim | High | Yes |
| WolfkidCER | Buggsy | A9 Tablet | `/wolfkid` | Browser / Android WebView | WolfkidCER.html + Kidshub.js | KH_Education, Curriculum | KH_CACHE_KEY, CF worker shim | High | No |
| SparkleLearning Free | JJ | Samsung S10 FE | `/sparkle-free` | Browser / Android | SparkleLearning.html + Kidshub.js (mode=freeplay) | Curriculum | KH_CACHE_KEY, CF worker shim | Medium | No |
| DesignDashboard (Wolfdome) | Buggsy | A9 Tablet | `/wolfdome` `/dashboard` | Browser / Android WebView | DesignDashboard.html + Kidshub.js | KH_Children, KH_Chores, Board_Config | KH_CACHE_KEY, CF worker shim | Medium | No |
| JJHome (Sparkle Kingdom) | JJ | Samsung S10 FE | `/sparkle-kingdom` | Browser / Android | JJHome.html + Kidshub.js | KH_Children, KH_Education | KH_CACHE_KEY, CF worker shim | Medium | No |
| fact-sprint | Buggsy / JJ | A9 / A7 Tablet | `/facts` | Browser / Android WebView | fact-sprint.html + Kidshub.js | Curriculum | KH_CACHE_KEY, CF worker shim | Medium | No |
| investigation-module | Buggsy | A9 Tablet | `/investigation` | Browser / Android WebView | investigation-module.html + Kidshub.js | Curriculum | KH_CACHE_KEY, CF worker shim | Medium | No |
| BaselineDiagnostic | Buggsy / JJ | A9 / A7 Tablet | `/baseline` | Browser / Android WebView | BaselineDiagnostic.html + Kidshub.js | Curriculum | KH_CACHE_KEY, CF worker shim | Medium | No |
| ComicStudio | Buggsy | A9 Tablet | `/comic-studio` | Browser / Android WebView | ComicStudio.html + Kidshub.js | KH_Education, KH_StoryProgress (via StoryFactory) | KH_CACHE_KEY, StoryFactory.js, CF worker shim | Medium | No |
| StoryLibrary | Household | Various | `/story-library` | Browser | StoryLibrary.html + StoryFactory.js | KH_StoryProgress | CF worker shim | Medium | Yes |
| StoryReader | Household | Various | `/story` | Browser | StoryReader.html + StoryFactory.js | KH_StoryProgress | CF worker shim | Medium | Yes |
| wolfkid-power-scan | Buggsy | A9 Tablet | `/power-scan` | Browser / Android WebView | wolfkid-power-scan.html + Kidshub.js | KH_PowerScan | KH_CACHE_KEY, CF worker shim | Medium | No |
| Vault | LT | Desktop | `/vault` | Browser / Desktop | Vault.html + DataEngine.js | LT_Collection, JT_Collection, Kids_Collection, Wishlist, Style Reference | CF worker shim | Medium | No |
| QAOperator | LT | Desktop | `/qa/operator` | Browser / Desktop | QAOperator.html + QAOperatorSafe.js | QA_Snapshots | QA HMAC token (tbm_qa cookie), CF QA shim | Medium | No |
| Front Door | All | All | `/` | Browser | cloudflare-worker.js FRONT_DOOR_HTML | — (static) | CF worker (served directly, no GAS call) | High | Yes |

## Notes
- **ES5 constraint**: All .html surfaces run in Android WebView (Fully Kiosk 4.x+) or FireOS WebView — ES6+ syntax silently breaks them.
- **Finance visibility**: TheSoul + KidsHub surfaces → NO financial data. TheSpine → finance display-only. ThePulse + TheVein → full finance interactive.
- **KH heartbeat**: Stored in Helpers!Z1. Used by KH cache invalidation in Code.js. Any surface reading KH data is implicitly dependent on this cell.
- **sparkle-free**: NOT a separate HTML file — SparkleLearning.html with `mode=freeplay` parameter. Same code path.
- **wolfdome / dashboard**: Same DesignDashboard.html file, two CF routes aliased.
- **QA routes**: Each prod route has a `/qa/*` mirror (except finance surfaces which are explicitly denied). QA mode uses QA workbook via per-request HMAC token.
