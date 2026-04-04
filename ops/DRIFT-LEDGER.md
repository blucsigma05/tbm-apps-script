# TBM Feature Drift Ledger

Date: April 3, 2026
Anchor: GitHub `main` at `fadf8fd`
Re-anchor note: pass 1 at `5bfc60b`, pass 2 at `3f33771`, pass 3 refreshed after PRs #37, #38, #39.

## Status Key

- `still live`: current code supports it now
- `shipped`: requested and later confirmed landed
- `partially live`: some of the behavior/visual remains, but not the full requested version
- `regressed`: previously documented/live behavior changed away from the earlier contract
- `lost`: previously specified or claimed built, but absent from current runtime truth
- `specified but never shipped`: documented intention without current runtime evidence
- `live but undocumented`: current code has it, but the main architecture docs do not describe it well
- `sunset`: intentionally retired — was prototype, superseded, or consolidated elsewhere
- `consolidated`: functionality absorbed into another surface or system

## Ledger

| Area | Feature / Visual | First source | Landed evidence | Current evidence | Status | Notes |
|---|---|---|---|---|---|---|
| Platform | GitHub + `clasp` as real deployment path | QA Round 1A | QA Round 1A root-cause note | Current `main` commit stream continues past old Notion deploy versions | still live | Runtime truth has already shifted here. |
| Platform | Notion deploy page titles as live version truth | Older deploy-page workflow | Older Notion page titles | Replaced by getDeployedVersions() in GASHardening.gs (programmatic) + Active Versions DB (collection://158238c5-9a78-4fa5-9ef8-203f8e0e00a9, audit trail) | sunset | Intentionally replaced by dual truth system. Notion page titles retain historical value only. |
| Platform | Default finance landing = `pulse` | Dashboard System Architecture | Older route table says pulse default | `Code.js` line 204 uses `servePage(p.page \|\| 'pulse')` — restored to pulse default | still live | Was regressed to `vein`, now restored. Verify on next deploy. |
| Platform | Cloudflare clean-path routing | Education Platform, PM, proxy build pages | `cloudflare-worker.js` introduced public path routing | Current worker routes include 35 paths: `/pulse`, `/vein`, `/daily-missions`, `/daily-adventures`, `/sparkle-free`, `/baseline`, `/power-scan`, `/api`, `/api/verify-pin` | still live | Cloudflare is a first-class runtime layer. 13 routes undocumented in CLAUDE.md. |
| Platform | Front door / foyer | PM child pages (The Foyer) | Worker front door added | Current `cloudflare-worker.js` contains full front-door HTML with family / education / finance sections | still live | Older dashboard architecture page does not capture this. |
| Platform | Vault surface migration | Project Memory open items | Planned only | `/vault` route exists in CF worker but no `Vault.html` in repo | specified but never shipped | Route registered, file not built. |
| Finance | Five-surface finance/family core | Dashboard System Architecture | Original platform core | `ThePulse`, `TheVein`, `TheSpine`, `TheSoul`, `KidsHub` all still present | still live | Core finance skeleton survived the platform expansion. |
| Finance | Playfair + DM Sans finance aesthetic | Dashboard architecture aesthetic notes | Used in original surfaces | Current `ThePulse.html` and `TheVein.html` still import Playfair Display + DM Sans | still live | Visual identity persisted. |
| Finance | ThePulse version meta tag | Session 75 Build Manifest | Manifest required it | Current `ThePulse.html` has `tbm-version` `v60` | still live | |
| Finance | TheVein version meta tag | Session 75 manifest | Manifest required it | Current `TheVein.html` has `tbm-version` `v62` | still live | |
| Finance | ThePulse maroon redesign with crest watermark and rose-gold nav | Round 5 Audit Fixes | Round 5 called for corrected gradient and visual cleanup | Current `ThePulse.html` shows multi-stop maroon gradient, rose-gold nav, crest watermark | still live | |
| Finance | Dinner input on ThePulse | Session 75 manifest | MealPlan feature set | Current `ThePulse.html` has dinner UI and `saveDinnerPulse()` | still live | |
| Finance | Dinner input on TheVein | Session 75 manifest | MealPlan feature set | Current `TheVein.html` has dinner UI and `saveDinner()` | still live | |
| Finance | TheVein blue-forward redesign without legacy Thompson2016 emboss | Round 5 Audit Fixes | Later redesign added blue-forward palette and crest chip | Current `TheVein.html` has newer blue-forward look but still renders `THOMPSON2016` emboss | partially live | TheVein is the main remaining branding holdout. |
| Family / Parent | Dinner log on Parent Dashboard | QA Round 1A | Later build work implied parity push | Current `KidsHub.html` contains `rDinner()` and `_v2LogDinner()` | shipped | Previously missing, now stuck. |
| Family / Parent | Pending approvals at top of parent pending tab | QA Round 1 Findings | Fold 7 QA asked for approvals first | Current `KidsHub.html` renders `Pending approvals` before must-dos | shipped | |
| Family / Parent | Collapsible must-do section | QA Round 1 Findings | Fold 7 QA asked for less visual overload | Current `KidsHub.html` has collapsible must-do with toggle arrow | shipped | |
| Family / Parent | Bank balances visible on parent dashboard | QA Round 1 Findings | Fold 7 QA called out missing bank visibility | Current `KidsHub.html` shows `BUGGSY BANK` and `JJ BANK` cards | shipped | |
| Family / Parent | Add bonus task controls | QA Round 1 Findings | Later KidsHub parent work added task controls | Current `KidsHub.html` contains `rAddTask()` and `_v2AddTask()` | shipped | |
| Family / Parent | Direct-entry screen-time debit controls | QA Round 1 Findings | Fold 7 QA wanted screen-time controls | Current `KidsHub.html` has typed minute inputs plus `_v2DebitScreenCustom()` | shipped | |
| Family / Parent | Parent education review panel | Education Platform | Education review queue part of parent direction | Current `KidsHub.html` renders `v2-education` with approve/return buttons | partially live | UI present, needs E2E runtime check. |
| Family / Parent | Family crest watermark on parent dashboard | QA Round 2B | Later visual cleanup pushed crest into family surfaces | Current `KidsHub.html` includes parent-only crest watermark | still live | |
| Family / Parent | Clear-task modal with full/half/no-points outcomes | PR #36 | Current head exposes three-choice modal | Modal exists but `_v2ClearConfirm(mult)` ignores the choice and `khOverrideTaskSafe` does not pass `expectedTaskID` | partially live | UI promises outcomes the server does not honor. |
| Family / Parent | Story Factory split messaging | QA Round 1 Findings | Pacing improvements requested | Current `_sfMsgs` includes `Polishing the pages`, `Checking the spelling`, etc. | still live | |
| Ambient / Visual | TheSoul crest + countdown + dinner + streak stack | Session 75 manifest | Requested ambient polish | Current `TheSoul.html` contains crest, countdown, dinner, and streak cards | still live | |
| Visual | Family crest replacing Thompson2016 text branding everywhere | Session 75, later redesign pages | TheSoul and front door clearly moved to crest | `ThePulse` comment says Thompson2016 removed, but `TheVein` still has emboss | partially live | Brand unification incomplete. |
| Visual | Kid avatars on finance and family surfaces | Session 75 manifest | Avatar rollout requested | Current `ThePulse`, `TheVein`, `KidsHub`, `TheSoul` all contain `kid-avatar` images | still live | |
| Visual | Inline SVG kid avatars with no external dependency | Session 75 manifest | Desired final direction documented | Current surfaces still use external hosted `<img>` assets | partially live | Functionally present, final implementation direction did not stick. |
| Education | Single `daily-missions` hub | Education Platform | Final entry-point plan | Current route + `daily-missions.html` file present | still live | Education front door. |
| Education | Buggsy Day 1 setup flow | Education page + April 2 plan | Design Dashboard + Baseline + Power Scan | Current `daily-missions.html` shows `Power Scan`, `Baseline Diagnostic`, and gated `THE WOLFDOME BUILDER` | shipped | Evolved after first Monday push. |
| Education | Separate `KindleThemePicker.html` surface | Education page claims built | Notion says existed as prototype | No file in repo. DesignDashboard theme picker is unrelated (Ring Quest, not Sparkle/Kindle). | sunset | Intentionally dropped before GitHub consolidation. No replacement needed — was a prototype that never reached production. |
| Education | Separate `SparkleIntro.html` surface | Education page claims built | Notion says existed as prototype | JJ_SCHEDULE[0] in daily-missions.html routes to sparkle with intro mode. SparkleLearning.html contains letter_intro activity + welcome audio. | consolidated | Functionality absorbed into daily-missions.html + SparkleLearning.html via route consolidation. |
| Education | JJ Day 1 experience | Education page Day 1 plan | Day 1 setup explicitly planned | Current `JJ_SCHEDULE[0]` routes JJ into `page: 'sparkle'` | still live | Route consolidation, not separate file. |
| Education | Monday curriculum alignment | Education page April 2 notes | Commit `6a4cde5` shifted starts to Monday | Current repo and education notes agree on April 6 Monday start | still live | |
| Education | "Back to Missions" completion recovery path | Education page + April 2 audit commit | Commit `6a4cde5` added across modules | Confirmed in current modules | still live | Audit-driven recovery. |
| Education | Sparkle free play mode | PR #33 | Added as explicit feature | Current `SparkleLearning.html` implements free play | still live | |
| Education | Sparkle free-play direct route `/sparkle-free` | PR #33, later worker updates | Route-level free-play entry added | Current CF worker maps `/sparkle-free` | still live | First-class route, not just internal mode. |
| Education | JJ route alias `/daily-adventures` | PR #32 | JJ-specific daily-missions alias | Current CF worker maps `/daily-adventures` | still live | Live but undocumented in CLAUDE.md. |
| Education | JJ ElevenLabs audio wiring | Education page audio section | Claimed complete in Notion | Current `SparkleLearning.html` uses `playAudioCached()`, `getAudioBatchSafe()` | still live | Confirmed in code. |
| Education | Sparkle lazy audio + predictive preload | SparkleLearn v5 commit history | Later work moved to lighter preload | Current `main` includes v5 lazy-audio architecture | still live | |
| Education | Sparkle free-play looping + pattern data fix | PR #35 | PR #35 merged loop + pattern fix | Current `main` includes fix | still live | |
| Education | Buggsy audio across 6 modules | PR #33 + PR #34 | Recent commits added and fixed audio folder IDs | Current `main` includes merged Buggsy audio fixes | still live | |
| Education | Buggsy and JJ custom board loading screens | PR #36 | PR #36 added themed loading screens | Current `KidsHub.html` builds sparkle loading for JJ, HUD/wolf for Buggsy | still live | |
| Education | WOLFDOME naming and homework gate | PR #36 | PR #36 renamed labels and added `getDesignUnlockedSafe` | Current files gate `THE WOLFDOME BUILDER` behind education submission | shipped | Current contract, not older Day 1 board. |
| Education | Parent homework review backend | Education page vision | Server work landed | Current `Code.js` exposes `submitHomeworkSafe`, `getEducationQueueSafe`, `approveHomeworkSafe` | partially live | Beyond backend-only, needs live E2E retest. |
| Governance | Deploy manifest process | Deploy Manifest Process page | Process documented after Session 75 miss | Some manifest-style verification in audits, not yet a single living ledger | partially live | This ledger + ops/ directory closes the gap. |
| Visual | Wolfdome animated background on Buggsy board | PR #37 | PR #37 added 7-layer dark arena background | Current `KidsHub.html` has space gradient, 90 stars, dome SVG, lightning bolts, pulse rings, spotlights, floor grid, 30 sparks, HUD corners, THE WOLFDOME sign (Orbitron 700/900) | shipped | Heavy SVG animation layer. Needs perf guardrails on A9/Fire tablets. |
| Visual | Sparkle Kingdom animated background on JJ board | PR #37 | PR #37 added 13-layer purple galaxy background | Current `KidsHub.html` has aurora bands, 100 stars (6 colors), rainbow arc, orbit rings, Sparkle Sprinkles mascot (220px bobbing), 22 sparkle crosses, 3 shooting stars, 6 burst dots, ground strip, HUD corners, THE SPARKLE KINGDOM sign | shipped | Heavy SVG animation layer. Same perf concern as Wolfdome. |
| Visual | Sparkle Kingdom background in SparkleLearn | PR #38 | PR #38 ported Sparkle Kingdom to SparkleLearn | Current `SparkleLearning.html` v6 has full 13-layer galaxy treatment via `buildSparkleKingdomBackground()` | shipped | Standalone implementation, not shared with KidsHub. |
| Visual | SparkleLearn loading screen | PR #38 | PR #38 added themed loading overlay | Current `SparkleLearning.html` has `#sparkle-loading` with orbiting dots, floating emoji, bouncing text, cascade dots | shipped | Dismisses on curriculum load, fallback, or free play. |
| Education | Nia auto-match audio for all 55 speak() calls | PR #39 | PR #39 added `autoMatchAudio(text)` function | Current `SparkleLearning.html` derives Nia clip keys from text content for letters, numbers, feedback, instructions | shipped | Robot voice is now fallback only. Covers find/trace/sound/name/number/feedback patterns. |
| Platform | Orbitron font added to KidsHub | PR #37 | PR #37 added Google Fonts import | Current `KidsHub.html` imports Orbitron (wght 700/900) for board signage | shipped | New font dependency. |
| Platform | SparkleLearn version v5 to v6 | PR #38 | PR #38 bumped version | Current `SparkleLearning.html` header shows v6 | shipped | |

## Blindspot Rows (new in pass 3)

| Area | Feature / Concern | Source | Current evidence | Status | Notes |
|---|---|---|---|---|---|
| Automation | withFailureHandler() coverage | Codebase audit April 3, 2026 | Deep semantic audit: all 145 chains have handlers. Grep overcounted. | still live | RESOLVED. Automated wiring gate added to audit-source.sh. |
| Documentation | CLAUDE.md route table | CF worker audit April 3, 2026 | CLAUDE.md updated: 22 → 35 paths, organized by category | still live | RESOLVED. Route table now matches CF worker exactly. |
| Automation | audit-source.sh failure handler check | Codebase audit April 3, 2026 | Wiring gate added comparing withSuccessHandler to withFailureHandler counts | still live | RESOLVED. audit-source.sh now has 5 checks (ES5, versions, getActiveSpreadsheet, eval, wiring). |
| Performance | Heavy animated backgrounds on kid tablets | PRs #37/#38 April 3, 2026 | 7-13 layer SVG backgrounds with 100+ animated elements on Galaxy A9 / Fire tablets | live but undocumented | No perf guardrails, no reduced-motion path, no device-tier detection |
| Platform | Duplicate Sparkle Kingdom background implementations | PRs #37/#38 | KidsHub.html and SparkleLearning.html have independent copies | live but undocumented | Two separate 13-layer implementations. Changes must be synced manually. |

## Next Rows To Add In Pass 4

- Clear-task override scoring once the server path is fixed
- WOLFDOME unlock behavior after a real homework submission
- Parent education review flow after a real approve / return cycle
- Finance redesign requests from ThePulse / TheVein build pages
- TheSpine / TheSoul against later display QA pages
- Remaining KidsHub visual requests from QA Rounds 1, 2A, and 2B
- Performance measurements for animated backgrounds on target devices
- .gitignore creation and tracked file audit
