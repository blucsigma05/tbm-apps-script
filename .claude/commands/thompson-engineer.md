---
name: thompson-education-build
description: >
  Architecture rules and build patterns for education modules in the Thompson family platform.
  Use this skill whenever building, editing, converting, or debugging education-related HTML
  modules: homework-module.html, sparkle-learn.html, baseline-diagnostic.html, reading-module.html,
  fact-sprint.html, writing-module.html, investigation-module.html, sparkle-intro.html,
  comic-studio.html, or any new education surface. Also trigger when converting JSX prototypes
  to vanilla HTML for GAS HtmlService or Cloudflare deployment, wiring audio (ElevenLabs or
  Web Speech API), integrating with the Homework Tracker or Pre-K Prep Notion databases, or
  building the daily mission rotation system. Trigger on mentions of: homework module, sparkle,
  education, daily missions, fact sprint, cold reading, CER module, STAAR practice, curriculum
  engine, or content rotation.
---

# Thompson Education Build Skill
**TEKS-Aligned. STAAR-Ready. Executive Skills-Driven.**

## When to Use
- Building or editing ANY education module HTML file
- Converting JSX prototypes to vanilla HTML for GAS or Cloudflare
- Wiring audio (ElevenLabs MP3s, Web Speech API, celebration sounds)
- Building the daily mission rotation / content serving system
- Integrating education modules with Notion databases
- Creating new module templates (Quiz, Sprint, Reading, Writing, Investigation, Sparkle)

## Cardinal Rule
> Inherit ALL constraints from the `tbm-build` skill. Education modules run in the same
> GAS HtmlService / Fully Kiosk Browser / Cloudflare environment. ES5 is the law.
> Full file replacements only. Code conforms to data.

---

## ES5 — The Law (Inherited from tbm-build)

Zero tolerance in ANY `.html` file:
- **NO** `let` or `const` → use `var`
- **NO** arrow functions `=>` → use `function(x) {}`
- **NO** template literals → use `'string ' + var`
- **NO** `??` or `?.` → use ternary or `&&` chains
- **NO** `async/await` → use `google.script.run` callbacks
- **NO** `Array.includes()` → use `indexOf() !== -1`
- **NO** `for...of` → use `for (var i = 0; ...)`
- **NO** destructuring → use index access
- **NO** `URLSearchParams` → use manual string splitting
- **NO** `backdrop-filter` CSS

Why: Fully Kiosk Browser on Fire Stick + Android WebView = ES5 only runtime.

---

## JSX → Vanilla HTML Conversion Rules

All education modules start as JSX design prototypes and must be converted:

1. **No React, no imports, no JSX.** Pure vanilla HTML + JS + CSS in a single file.
2. **State management:** Replace `useState` with plain `var` variables and manual DOM updates.
3. **Event handling:** Replace `onClick={handler}` with `addEventListener` or inline `onclick`.
4. **Rendering:** Replace JSX returns with `innerHTML` template strings or DOM manipulation.
5. **Styling:** All CSS in a single `<style>` block or inline. No CSS modules.
6. **Component structure:** Replace React components with regular functions that return HTML strings or manipulate DOM directly.
7. **Match exactly:** The prototype IS the spec. Same design, same colors, same interactions, same logic.

### Conversion Template
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="tbm-module" content="[module-name]">
  <meta name="tbm-version" content="v1">
  <title>[Module Title]</title>
  <style>
    /* All CSS here */
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    // ES5 ONLY
    var MODULE_VERSION = 'v1';
    var CHILD = 'buggsy'; // or 'jj' — set by URL param or GAS placeholder

    // State
    var currentQuestion = 0;
    var score = 0;
    var answers = [];

    // Initialize
    function init() {
      // Parse URL params for child, day, module
      // Load content
      // Render first screen
    }

    // Render functions
    function render() {
      var app = document.getElementById('app');
      app.innerHTML = buildHTML();
    }

    // Event handlers
    function handleAnswer(index) {
      // Process answer
      // Update state
      // Re-render
    }

    // Start
    init();
  </script>
</body>
</html>
```

---

## Module Template Architecture

### 6 Module Types Required

| Module | File | Used By | Key Features |
|--------|------|---------|--------------|
| **Quiz Module** | `homework-module.html` | Math, Science, Social Studies | MC + short answer, auto-grade MC, flag open-ended, TEKS tagging |
| **Fact Sprint** | `fact-sprint.html` | Math facts, Vocabulary, Grammar | 20 questions, timed, beat-your-best, streak tracking |
| **Reading Module** | `reading-module.html` | RLA cold passages | Passage display, scrollable, comprehension Qs, vocabulary highlights |
| **Writing Module** | `writing-module.html` | CER, persuasive, journal, editing | Prompt display, textarea, sentence starters (optional), word count, timer |
| **Investigation Module** | `investigation-module.html` | Science open-ended | Structured response: hypothesis → procedure → prediction → conclusion |
| **Sparkle Module** | `sparkle-learn.html` | All JJ content | Big tap targets, audio prompts, celebration animations, star rewards |

### Executive Skills Integration (Smart but Scattered Framework)

Every module MUST inline the `ExecSkills` component from `executive-skills-components.html`.
See that file for the full CSS + JS IIFE. Key methods:

| Method | When | Executive Skill |
|--------|------|-----------------|
| `ExecSkills.showPlanYourAttack(opts)` | BEFORE every module starts | Response Inhibition + Planning |
| `ExecSkills.startSessionTimer(isSparkle)` | Auto-called after Plan Your Attack | Sustained Attention + Time Management |
| `ExecSkills.showFeedback(container, isCorrect, opts)` | After EVERY answer | Emotional Control |
| `ExecSkills.showErrorJournal(container, missedQs)` | Monday modules ONLY, after completion | Metacognition + Emotional Control |
| `ExecSkills.showFridayReflection(container)` | Friday modules ONLY, after completion | Metacognition + Goal-Directed Persistence |
| `ExecSkills.showCompletion(container, opts)` | End of EVERY module | All skills summary |

### Wiring Pattern

```javascript
function init() {
  var dayOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  ExecSkills.showPlanYourAttack({
    container: 'app',
    child: CHILD,
    timeEstimate: 12,
    questions: [
      { type: 'Multiple Choice', topic: 'Forces & Friction' },
      { type: 'Short Answer', topic: 'Gravity' }
    ],
    onReady: function() { renderFirstQuestion(); }
  });
}

function checkAnswer(questionIndex, selectedAnswer) {
  var question = questions[questionIndex];
  var isCorrect = (selectedAnswer === question.correctAnswer);
  ExecSkills.showFeedback('feedback-' + questionIndex, isCorrect, {
    answer: question.correctAnswer,
    explanation: question.explanation,
    isSparkle: (CHILD === 'jj')
  });
  if (!isCorrect) {
    missedQuestions.push({
      question: question.text,
      correctAnswer: question.correctAnswerText,
      userAnswer: question.options[selectedAnswer]
    });
  }
}

function onModuleComplete(score, total, baseRings) {
  var dayOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  ExecSkills.showCompletion('app', {
    score: score, total: total, rings: baseRings, child: CHILD, dayOfWeek: dayOfWeek
  });
  if (dayOfWeek === 'Monday' && missedQuestions.length > 0) {
    setTimeout(function() {
      var div = document.createElement('div');
      div.id = 'error-journal';
      document.getElementById('app').appendChild(div);
      ExecSkills.showErrorJournal('error-journal', missedQuestions);
    }, 500);
  }
  if (dayOfWeek === 'Friday') {
    setTimeout(function() {
      var div = document.createElement('div');
      div.id = 'reflection';
      document.getElementById('app').appendChild(div);
      ExecSkills.showFridayReflection('reflection');
    }, 500);
  }
}
```

### Shared Components Across All Modules

```javascript
// === Ring/Star Award System ===
function awardRings(count) {
  google.script.run
    .withSuccessHandler(function(result) { showCelebration(count); })
    .withFailureHandler(function(err) { console.error('Ring award failed:', err); })
    .awardRings(CHILD, count, MODULE_NAME);
}

// === Notion Logging ===
function logToNotion(moduleData) {
  google.script.run
    .withSuccessHandler(function() { console.log('Logged to Notion'); })
    .logHomeworkCompletion(moduleData);
}

// === Audio System ===
var audioSystem = {
  speak: function(text) {
    var utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  },
  playClip: function(filename) {
    var audio = new Audio(getAudioUrl(filename));
    audio.play();
  },
  celebrate: function() {
    var clips = ['celebrate1.mp3', 'celebrate2.mp3', 'celebrate3.mp3'];
    var pick = clips[Math.floor(Math.random() * clips.length)];
    this.playClip(pick);
  }
};
```

---

## Daily Mission System Architecture

### How Content Gets Served

The system uses a **weekly pre-generation model:**

1. **Sunday:** Parent (or automated script) generates the week's content
2. **Content stored in:** Google Sheet tab or Notion DB entries, one row per day
3. **Module checks:** Current day of week → loads that day's content
4. **Fallback:** If no content for today, show "ask Dad to load this week's missions"

### Day-of-Week Detection
```javascript
var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var today = DAYS[new Date().getDay()];

var DAY_SUBJECTS = {
  'Monday': { subject: 'Math', module: 'quiz' },
  'Tuesday': { subject: 'RLA', module: 'reading' },
  'Wednesday': { subject: 'Science', module: 'quiz' },
  'Thursday': { subject: 'RLA-Creative', module: 'writing' },
  'Friday': { subject: 'Review', module: 'quiz' }
};
```

### Content Loading Flow
```
1. Module opens → detect day of week
2. Query content bank for today's entry (GAS backend or Notion API)
3. Load questions/passage/prompt into module template
4. Student completes work
5. Auto-grade MC, flag open-ended for review
6. Log completion + scores to Homework Tracker DB
7. Award Rings/Stars
8. Show completion screen with tomorrow preview
```

---

## Audio Integration Patterns

### Web Speech API (Browser TTS)
- Use for: letter names, full sentences, instructions, feedback
- Works in: Chrome, Android WebView, Fully Kiosk
- Limitations: fails on isolated phonics sounds, no custom voices

```javascript
function speak(text, onEnd) {
  var u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  u.pitch = 1.1;
  if (onEnd) u.onend = onEnd;
  speechSynthesis.speak(u);
}
```

### ElevenLabs MP3s (Pre-generated)
- Use for: letter phrases ("K is for KINDLE!"), celebrations, story narration
- Voice: Nichalia Schwartz (JJ), YouTube kid energy (Buggsy)
- Storage: Google Drive `Kids & Family/Audio Files/output/jj/` and `/buggsy/`
- Drive folder ID (Letters): `1rXWVBD9QMruWOj6AlNB4mY2E9wzWGctm`
- Files: A.mp3 through Z.mp3 + celebration clips

```javascript
function playElevenLabsClip(letter) {
  google.script.run
    .withSuccessHandler(function(audioData) {
      var audio = new Audio('data:audio/mp3;base64,' + audioData);
      audio.play();
    })
    .getAudioClip(letter);
}
```

### Audio Rules
- JJ modules: EVERY interaction needs audio (she cannot read)
- Buggsy modules: audio optional, used for encouragement and celebration
- Never play raw phoneme sounds via Web Speech API — use phrases
- Rotate celebration clips (don't play the same one every time)
- Audio should not block interaction — play async, don't wait for completion

---

## GAS Backend Functions (KidsHub.gs / Code.gs)

### Required Server Functions for Education
```javascript
function awardRings(child, count, source) { ... }

function logHomeworkCompletion(data) {
  // data = { child, subject, assignment, score, teksCode, difficulty, date }
  // POST to Notion Homework Tracker DB
}

function getTodayContent(child, dayOfWeek) {
  // Query content sheet or Notion
  // Return questions/passage/prompt for today
}

function getAudioClip(filename) {
  var file = DriveApp.getFilesByName(filename + '.mp3');
  if (file.hasNext()) {
    return Utilities.base64Encode(file.next().getBlob().getBytes());
  }
  return null;
}

function reviewWithGemini(studentResponse, rubric, teksCode) {
  // Call Gemini API for first-pass grading
  // Return score + feedback
  // Flag for parent final review
}
```

---

## GAS HtmlService Constraints

### Comment Stripping
GAS `createHtmlOutputFromFile()` strips JavaScript comments during serving.
- **NEVER** use comment-based placeholders (`// CHILD_NAME_HERE`)
- **USE** string literal placeholders: `var INIT_CHILD = 'buggsy';`
- **USE** URL parameters: `?child=buggsy&day=monday&module=math`

---

## Device Targets

| Device | User | Screen | Input | Notes |
|--------|------|--------|-------|-------|
| Surface Pro | Buggsy | ~12" | Touch + Pen + Keyboard | Primary homework device |
| Samsung Galaxy Tab S10 | JJ/Kindle | ~11" | Touch + Stylus | SparkleLearn. Big tap targets. |
| 8.7" Samsung Tablet | Both | 8.7" | Touch | Chore tablet only, not homework |
| Fire TV Stick | Display | TV | Remote | Fully Kiosk. Chore dashboard only. |

### Responsive Design Rules
- Minimum tap target: 48px × 48px (Google Material guidelines)
- JJ targets: 64px × 64px minimum (she's 4, fingers are imprecise)
- Font size: 16px minimum body text, 14px minimum for Buggsy, 20px minimum for JJ
- Always test at 768px width (tablet portrait) and 1024px (tablet landscape)

---

## Notion Database Integration

### Homework Tracker (Buggsy)
- DB ID: `9164c6a594b448028426366ff62952b5`
- Fields: Assignment (title), Subject, Due Date, Status, Priority, Difficulty, Time Spent, Needs Help?, Grade, Notes
- Log every completed module with TEKS tags in Notes field
- Status flow: Not Started → In Progress → Done → Turned In

### Pre-K Prep (JJ/Kindle)
- DB ID: `ac28bcfa-e972-428e-812d-f2281df55af9`
- Fields: Skill (title), Category, Status, Phase, Date Introduced, Date Mastered, Practice Count, Fun Rating, Notes
- Update milestone status after each SparkleLearn session
- Status flow: Not Introduced → Practicing → Getting It → Mastered

### Notion Logging — Executive Skills Fields
When logging to Homework Tracker DB, include in Notes:
```
TEKS: 4.7A | Difficulty: Medium | Time: 11min
Exec Skills: Plan Your Attack ✓, Session Timer ✓
Error Journal: "I picked B because I confused friction with gravity" [Monday only]
Reflection: Hard: "fractions" / Proud: "got 100% on science" [Friday only]
```

---

## File Inventory — Education Modules

### Existing (Need JSX → HTML Conversion)
| # | JSX Prototype | Converts to | Priority |
|---|---------------|-------------|----------|
| 1 | `design-dashboard.jsx` | `DesignDashboard.html` | High — first touch |
| 2 | `kindle-theme-picker.jsx` | `KindleThemePicker.html` | High — first touch |
| 3 | `baseline-diagnostic.jsx` | `BaselineDiagnostic.html` | High — establishes baseline |
| 4 | `wolfkid-cer.jsx` | `WolfkidCER.html` | High — proven engagement |
| 5 | `sparkle-learn.jsx` | `SparkleLearning.html` | High — JJ's daily driver |
| 6 | `sparkle-intro.jsx` | `SparkleIntro.html` | High — JJ baseline |
| 7 | `homework-module.jsx` | `HomeworkModule.html` | High — daily missions |

### Needed (New Builds)
| # | Module | Purpose |
|---|--------|---------|
| 8 | `fact-sprint.html` | Timed math fact / vocabulary / grammar drills |
| 9 | `reading-module.html` | Cold passage viewer + comprehension questions |
| 10 | `writing-module.html` | Multi-format writing (CER, persuasive, journal, edit) |
| 11 | `investigation-module.html` | Open-ended science reasoning |
| 12 | `comic-studio.html` | Creative module with drawing prompts and reference images |
| 13 | `daily-missions.html` | Landing page showing today's assignments |
| 14 | `progress-report.html` | Parent-facing weekly summary (for JT) |

### Shared Component
| File | Purpose |
|------|---------|
| `executive-skills-components.html` | CSS + ES5 JS IIFE (`ExecSkills`). Inline into every module. |

---

## Deploy Gate (Inherited from tbm-build)

Both must PASS before any education module deploy:
1. `tbmSmokeTest()` — primary pre-deploy check
2. `tbmRegressionSuite()` — regression coverage
3. **Education-specific checks:**
   - All JS is ES5 compliant (grep for banned patterns)
   - Audio system initializes without errors
   - Ring/Star award function exists and connects to backend
   - Notion logging function exists
   - Day-of-week detection returns valid result
   - Module renders correctly at 768px and 1024px widths

### QA Checklist Per Module
- [ ] Opens on Surface Pro (Buggsy) or S10 (JJ) without errors
- [ ] Auto-grades MC with immediate visual feedback
- [ ] Open-ended responses route to Gemini review
- [ ] Completion logs to Homework Tracker / Pre-K Prep DB
- [ ] Rings/Stars awarded on completion
- [ ] Audio plays correctly (both Web Speech and ElevenLabs)
- [ ] "Done for today" exit screen shows with celebration
- [ ] Responsive at 768px and 1024px
- [ ] All JavaScript is ES5 (zero banned patterns in grep)

### Module-by-Module Wiring Checklist

| Module | Plan Your Attack | Timer | Feedback | Error Journal (Mon) | Reflection (Fri) | Completion |
|--------|:---:|:---:|:---:|:---:|:---:|:---:|
| homework-module | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| wolfkid-cer | ✓ | ✓ | — (rubric) | — | — | ✓ |
| sparkle-learn | ✓ (sparkle) | ✓ (sparkle) | ✓ (sparkle) | — | — | ✓ |
| fact-sprint | ✓ | ✓ (IS module) | end only | — | — | ✓ |
| reading-module | ✓ | ✓ | ✓ | — | — | ✓ |
| writing-module | ✓ | ✓ + writing timer | — (review) | — | — | ✓ |
| investigation-module | ✓ | ✓ | — (review) | — | — | ✓ |
| baseline-diagnostic | ✓ | ✓ | neutral | — | — | results |
