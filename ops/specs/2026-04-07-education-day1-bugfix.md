Title: Education Day 1 Bug Fixes — SparkleLearning v8 + daily-missions v7
Notion link: Pending
Repo: blucsigma05/tbm-apps-script
Owner: LT
Current pipeline status: Approved → building

## Problem

Six issues discovered on JJ and Buggsy's first day using the education platform:

1. JJ's letter_intro always showed "Apple, Ant, Alligator" instead of the curriculum word (KINDLE, Ice cream, etc.)
2. name_builder activity could default to wrong name for future activities beyond JJ
3. Nia voice + browser Web Speech spoke simultaneously in sparkle_challenge
4. Any two audio clips could play at the same time (no global active clip tracking)
5. Black screen when tapping Launch on daily-missions (no loading transition)
6. Checkbox appeared alongside Launch button before user had done anything (confusing UX)

## Verified On

- CurriculumSeed.js line 32: uses `word: "KINDLE"` (singular string)
- SparkleLearning.html:1650: reads `activity.words` (plural array) — mismatch confirmed
- SparkleLearning.html:2668-2669: `speak()` + `speakOptions()` called synchronously — no callback chain
- SparkleLearning.html:636-653: no global clip stop before new audio starts
- daily-missions.html:1148-1156: `window.location.href` direct navigation, no overlay; checkbox always visible

## Why it matters

JJ used the system for the first time today. Wrong words on every letter_intro break the core learning loop. Voice overlap makes the session unusable (two voices at once). Black screen on launch + confusing UX undermines confidence for a 4-year-old unsupervised session.

## What changes

**SparkleLearning.html v7→v8**
- `renderLetterIntro`: `activity.words || [activity.word]` — normalizes singular/plural
- `renderNameBuilder`: `activity.target || activity.name` — future-proofed for non-JJ names
- `speak()`: Added `_activeClip` global tracker — pauses current ElevenLabs clip before starting new one
- `sparkle_challenge` renderer: Chains `speakOptions` through `speak()` callback (not synchronous)

**daily-missions.html v6→v7**
- Added `#launch-overlay` fullscreen CSS overlay (🚀 LOADING...)
- Added `launchMission(url, missionId, missionName)` — records launched state in localStorage + shows overlay + navigates after 280ms
- Checkbox (done button) now hidden until `launchedKey` localStorage entry exists for that missionId
- All Launch/Let's Go buttons wired to `launchMission()` instead of direct `window.location.href`

## Unknowns

- Web Speech fallback still fires when audio key is missing from cache (e.g. letter M if jj_letter_name_M.mp3 not generated). Not blocked — `_activeClip` prevents overlap but Web Speech can still play when ElevenLabs cache misses.

## LT decisions needed

- Voice for Buggsy: Half-asleep Chris style (ASMR/calm male). Browse ElevenLabs voice library for "calm", "ASMR", or "soft male". Swap voice ID `RYPzpPBmugfktRI79EC9` in CLAUDE.md when chosen.

## Acceptance test

1. JJ letter_intro for K shows word card "KINDLE" — not "Apple, Ant, Alligator"
2. JJ letter_intro for I shows word card "Ice cream"
3. Tapping Launch on Buggsy's Homework card shows rocket overlay before navigating
4. Checkbox does NOT appear before Launch is tapped; appears after return
5. No two voices speak simultaneously in sparkle_challenge

## Evidence after completion

- Production `?action=runTests` → `overall == "PASS"` AND `smoke.overall == "PASS"`
- Playwright screenshots: /sparkle, /daily-missions?child=buggsy, /daily-missions?child=jj
