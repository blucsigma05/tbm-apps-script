---
name: game-design
description: >
  Art direction and visual standards for education game surfaces in the Thompson family platform.
  Use this skill when building, redesigning, or reviewing game graphics for SparkleLearning.html
  (JJ), daily-missions.html, HomeworkModule.html (Buggsy), or any education activity screen.
  Triggers on: game graphics, visual quality, art direction, SVG assets, game animations,
  loading screens, celebration effects, game UI, sparkle games look bad, clip art, ugly games,
  visual overhaul, game design, screen design, activity visuals, theme consistency.
---

# Game Design Skill — Thompson Education Platform
**Loading screens set the bar. Games must meet it.**

## Cardinal Rule
> Every game screen a child sees must match the visual quality of the loading screen
> that preceded it. If the loading screen promises a magical kingdom, the game must
> deliver one. Bare SVG shapes are never acceptable as game assets.

## The Problem This Skill Solves
SparkleLearning loading screen: orbiting sparkles, aurora effects, 40+ twinkling stars,
animated character, pulsing magic. Game screen: four circles in boxes. The loading screen
is the promise. The game is the product. They must match.

---

## Visual Identity — Per Child

### JJ / Sparkle Kingdom
- **Palette**: Purple-pink gradient base (#2D1B69 to #1a0a3e), gold accents (#FFD700),
  sparkle white, soft pastels for interactive elements
- **Mood**: Magical, warm, encouraging. Think Disney Junior meets Montessori.
- **Backgrounds**: Every game type gets a THEMED background — never plain solid color.
  Forest scene for nature activities, starfield for counting, rainbow bridge for patterns,
  cozy room for stories, garden for colors.
- **Interactive elements**: Rounded corners (12px+), soft drop shadows, gentle hover/tap
  animations (scale 1.05 over 200ms), sparkle particle burst on correct answers
- **Characters**: Cartwheel (JJ's avatar) should appear as a guide/companion in games,
  not just loading screens. Small, positioned in corner, reacts to answers.
- **Typography**: Rounded sans-serif (system default: -apple-system, sans-serif),
  large touch targets (min 48px), high contrast on dark backgrounds
- **Wrong answer**: Gentle shake (200ms), brief dim, encouraging audio — never red X
- **Right answer**: Gold burst particles, star earned animation, sparkle sound

### Buggsy / The Wolfdome
- **Palette**: Deep navy (#0a1628) to charcoal (#1a1a2e), neon accents (cyan #00f0ff,
  red #ff4444, green #00ff88), grid lines
- **Mood**: Tech/gaming. Think mission control meets arcade.
- **Backgrounds**: Grid overlays, scan lines, holographic panels, dashboard aesthetic
- **Interactive elements**: Sharp corners or subtle radius (4px), neon glow borders,
  click feedback with flash effect, tech sounds
- **Characters**: Mach Turbo Light (red hedgehog) as mission commander
- **Typography**: Monospace for data, bold sans-serif for headers
- **Wrong answer**: Amber highlight (`#fbbf24` at 6% bg, 15% border — matches `.es-feedback.wrong` in exec-skills-components.html), gentle shake, "RETRY" text, supportive audio — never red (see adhd-accommodations.md)
- **Right answer**: XP burst, ring counter increment, achievement unlock feel

---

## Asset Quality Standards

### Never Do This
- Bare SVG geometric shapes as game pieces (circle = circle = boring)
- Plain solid-color backgrounds
- Emoji as primary game assets (decorative only)
- Static screens with no animation
- Inconsistent themes between loading → game → celebration
- Same visual template for every activity type

### Always Do This
- **Themed SVG assets**: A "circle" in Color Hunt should be a magical orb, a bouncing
  ball, a planet — not a plain `<circle>`. Add gradients, inner shadows, subtle animation.
- **Layered backgrounds**: Base gradient + themed scene layer + interactive foreground.
  Minimum 2 visual layers per game screen.
- **Entry animations**: Every game element should animate in (fade, slide, bounce, grow).
  Stagger element entry by 50-100ms for a cascading reveal effect.
- **Idle animations**: Subtle floating, pulsing, or breathing animations on interactive
  elements so the screen feels alive even when the child pauses.
- **Feedback particles**: Every correct tap/answer triggers a small particle burst
  (3-5 particles, 300ms duration, matching the child's color palette).
- **Progress indicator**: Visual progress through the activity (dots, stars filling,
  path advancing) — always visible, always animated on completion.

### SVG Asset Enhancement Patterns

Transform bare shapes into themed assets:

```
BEFORE (bare SVG):
  <circle cx="50" cy="50" r="40" fill="#ff6b6b"/>

AFTER (themed — Sparkle Kingdom orb):
  <circle cx="50" cy="50" r="40" fill="url(#orbGradient)"/>
  <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,215,0,0.3)" stroke-width="2"/>
  <circle cx="42" cy="42" r="8" fill="rgba(255,255,255,0.4)"/>  <!-- highlight -->
  <animate attributeName="r" values="40;42;40" dur="2s" repeatCount="indefinite"/>
  <defs>
    <radialGradient id="orbGradient">
      <stop offset="0%" stop-color="#ff9a9e"/>
      <stop offset="100%" stop-color="#ff6b6b"/>
    </radialGradient>
  </defs>
```

Apply this pattern to ALL shape rendering. Every shape should have:
1. Gradient fill (not flat color)
2. Highlight spot (simulates 3D/glossy)
3. Subtle idle animation (pulse, float, or glow)
4. Optional: themed overlay (sparkles for JJ, grid lines for Buggsy)

---

## Per-Activity Visual Templates

### Letter/Number Games (Intro, Find, Trace, Sound)
- **Background**: Chalkboard/magical scroll aesthetic — dark but warm
- **Target element**: Large, centered, glowing with the child's accent color
- **Options grid**: Cards with rounded corners, subtle shadow, hover lift effect
- **Tracing canvas**: Faint magical trail guide, sparkle particles follow finger

### Counting / Quantity Games
- **Background**: Starfield (count the stars) or garden (count the flowers)
- **Objects**: Themed to the scene — not abstract shapes. Stars, flowers, gems, butterflies.
- **Tap feedback**: Object lights up and gently floats upward when counted

### Color / Shape Games
- **Background**: Art studio or rainbow meadow
- **Color targets**: Rich, saturated, with texture (not flat fills)
- **Shape targets**: Enhanced SVG with gradients and highlights (see patterns above)
- **Sort bins**: Themed containers (treasure chests, paint buckets, garden pots)

### Pattern Games
- **Background**: Train track / path / bridge being built
- **Pattern items**: On a visual track/rail, moving left to right
- **Missing piece**: Glowing outline with question mark, pulsing

### Story / Audio Games
- **Background**: Cozy reading nook with soft lighting
- **Story text**: Large, high contrast, one sentence at a time
- **Comprehension options**: Picture cards when possible, not just text

### Celebration / Complete
- **Full screen takeover**: Confetti, particle burst, star shower
- **Audio**: Nia voice (ElevenLabs) — NEVER robot/Web Speech API for celebrations
- **Star count**: Animated counter incrementing with sound per star
- **Duration**: Minimum 3 seconds of celebration before showing next action

---

## Animation Standards (ES5 Compatible)

All animations use CSS @keyframes — never JS animation libraries.

### Required Animations Per Game
1. **Element entry**: `fadeSlideIn` — opacity 0→1 + translateY 20px→0, 400ms ease-out
2. **Tap feedback**: `tapPulse` — scale 0.95→1.05→1, 200ms
3. **Correct answer**: `correctBurst` — scale 1→1.2→1 + gold glow, 400ms
4. **Wrong answer**: `gentleShake` — translateX 0→-5→5→-3→3→0, 300ms
5. **Star earned**: `starFloat` — translateY 0→-30px + opacity 1→0, 600ms
6. **Progress advance**: `dotFill` — background-color transition, 300ms
7. **Idle float**: `gentleFloat` — translateY 0→-4px→0, 3s ease-in-out infinite

### Animation Performance Rules
- Max 3 simultaneous CSS animations per screen (Fire Stick limitation)
- Use `transform` and `opacity` only — never animate `width`, `height`, `top`, `left`
- `will-change: transform` on animated elements
- No `backdrop-filter` (Fire TV WebView incompatible)

---

## Audio-Visual Sync

### Voice Priority (JJ)
1. **ElevenLabs Nia** (voice ID: A2YMjtICNQnO93UAZ8l6) — ALL instructions, feedback, celebrations
2. **Web Speech API** — ONLY as fallback when ElevenLabs audio not loaded yet
3. **Never mix**: If Nia starts an activity, Nia finishes it. No mid-activity voice switch.

### Voice Priority (Buggsy)
1. **ElevenLabs Marco** (voice ID: RYPzpPBmugfktRI79EC9) — instructions, feedback
2. **Web Speech API** — fallback only

### Audio-Visual Rules
- Loading indicator visible while audio loads — never silent dead air
- Instruction audio plays AFTER visual elements are rendered (not during)
- Celebration audio starts WITH confetti, not after
- Tap sounds: immediate (<50ms) — preload all tap/click sounds at init

---

## Quality Checklist (Before Shipping Any Game Screen)

- [ ] Background is themed (not plain solid color)
- [ ] All interactive elements have entry animations
- [ ] All shapes use gradient fills with highlights (not flat SVG)
- [ ] Correct answer has particle burst + sound + star animation
- [ ] Wrong answer has gentle feedback (not punishing)
- [ ] Progress indicator visible and updates on each answer
- [ ] Voice is consistent throughout (no Nia→robot→Nia switching)
- [ ] Loading state shown while audio fetches
- [ ] Minimum 48px touch targets on all interactive elements
- [ ] Tested at device viewport (JJ: 1920x1200 S10 FE, Buggsy: 1340x800 A9)
- [ ] Theme matches loading screen aesthetic
- [ ] Idle animations active on interactive elements
- [ ] Celebration screen has confetti + audio + star count animation
