## Thompson Education Platform

**Tagline:** TEKS-Aligned. STAAR-Ready. Executive Skills-Driven.

### Skills (read SKILL.md before ANY education work)
- `thompson-teacher/` — Curriculum brain. TEKS standards, daily schedule, content generation rules, spelling catalog (454 words), vocabulary integration, Pre-K milestones, STAAR format specs, executive skills framework (Dawson & Guare). Read this for WHAT to build.
- `thompson-engineer/` — Build brain. ES5 constraints, JSX→HTML conversion, module templates, audio wiring (ElevenLabs + Web Speech API), daily mission system, Notion DB integration, device targets, executive skills code components. Read this for HOW to build.
- `tbm-build/` — GAS architecture (existing). ES5 law, deploy gates, version bumping, tab names. Education modules inherit ALL constraints from this skill.

### Key Constraints
- ALL client-side JS must be ES5 (Fully Kiosk + Android WebView)
- Full file replacements only — never patches or diffs
- Every module must include: Plan Your Attack (30s), time estimate, session timer, constructive feedback, and executive skills completion screen
- Monday modules add Error Journal; Friday modules add Self-Reflection
- JJ/Kindle content MUST have audio on every interaction (she cannot read)
- Wolfkid framing for Buggsy, Sparkle framing for JJ — never break the illusion

### Notion IDs
- Homework Tracker DB: 9164c6a594b448028426366ff62952b5
- Pre-K Prep DB: ac28bcfa-e972-428e-812d-f2281df55af9
- Education Platform page: 331cea3c-d9e8-816a-a07f-eec250328cf8
- QA Test Plan: 32ccea3c-d9e8-818f-9e30-f317dea0fed7

### File Inventory
Existing (need JSX→HTML conversion): design-dashboard, kindle-theme-picker, baseline-diagnostic, wolfkid-cer, sparkle-learn, sparkle-intro, homework-module (7 files)
New builds needed: fact-sprint, reading-module, writing-module, investigation-module, comic-studio, daily-missions, progress-report (7 files)
Shared component: executive-skills-components.html (inline into every module)

### Audio
- ElevenLabs clips: Drive > Kids & Family > Audio Files > output > /jj/ and /buggsy/
- Letters folder ID: 1rXWVBD9QMruWOj6AlNB4mY2E9wzWGctm
- 177 total clips (JJ: Nichalia Schwartz voice, Buggsy: YouTube kid energy)
- Web Speech API = fallback only

### Vocabulary Pipeline
- 454 spelling words in references/spelling-catalog.json
- Words flow into: Story Factory bedtime stories, Wolfkid writing missions, Tuesday warm-ups, Friday review, math/science word problems
- Target: 4-5 exposures per word per week across varied contexts
