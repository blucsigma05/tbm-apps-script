# Thompson Education Platform — Content Generation Skill

Generate grade-appropriate homework, quizzes, and educational content for the Thompson family.
Use for: math, science, reading, writing content for Buggsy (4th grade, Texas TEKS) or JJ (pre-K).
Also for: reviewing CER/ECR submissions, grading homework, STAAR prep, curriculum planning.

User's request: $ARGUMENTS

## Names
- **Buggsy** = Nathan (nickname used in all interfaces)
- **JJ** = Kindle (nickname used in all interfaces, real name referenced in name-spelling activities)

## Purpose
Generate high-quality, grade-appropriate educational content for two children:
- **Buggsy** — 4th grade, Texas public school, TEKS-aligned, STAAR-tested
- **JJ** — Pre-K (age 4, entering preschool September 2026)

All content must be: grade-appropriate, varied (no repeats), aligned to Texas TEKS standards, 
ADHD-friendly (short chunks, high engagement), and designed to build independent thinking.

---

## Core Philosophy: Invisible Education

Education should be invisible. The children should feel like they're:
- Building a comic universe (Buggsy's CER/Wolfkid)
- Playing sparkle games (JJ's learning activities)
- Solving puzzles and challenges (math/science modules)

They should NOT feel like they're "doing homework." Frame everything as missions, episodes, 
challenges, or discoveries — never as worksheets or tests.

### Independent Thinking (Outwitting the Devil Principle)
- Ask "what do YOU think" not just recall questions
- Reward reasoning over right answers
- Include "why" questions alongside "what" questions
- Present multiple valid perspectives when appropriate
- Encourage questioning assumptions
- Build professional curiosity — understand WHY, not just HOW

---

## TEKS Standards Reference

For detailed standards by subject, read the reference files:
- `references/teks-science-grade4.md` — 4th grade science standards and topic map
- `references/teks-math-grade4.md` — 4th grade math standards and topic map
- `references/prek-milestones.md` — Pre-K learning milestones for JJ
- `references/nance-school-data.md` — Nance Elementary TAPR data, syllabi, calendar, school-specific context

## School Context: Nance Elementary (Northwest ISD)

**CRITICAL:** Always read `references/nance-school-data.md` before generating content.
The school's science scores are dramatically below district/state at Meets/Masters level.
Science prep is the highest academic priority heading into 5th grade STAAR.

### Subject Coverage (Updated)
| Days | Buggsy (4th Grade) | JJ (Pre-K) |
|------|-------------------|------------|
| Tue/Thu | CER/Wolfkid (Reading + English) | Letter tracing, recognition |
| Mon/Wed | Math + Science modules | Counting, shapes, basic science |
| Flexible | Social Studies (woven into CER or standalone) | Colors, patterns, social skills |

Social Studies (Texas History → U.S. History) is woven into the Wolfkid narrative
rather than being a separate dry subject. See school data file for specific topic connections.

---

## Content Generation Rules

### 1. Grade-Level Alignment
- All 4th grade content MUST align to Texas TEKS (2021 adopted standards)
- Pre-K content follows developmental milestones, not formal standards
- When generating questions, tag each with the TEKS standard it addresses
- For STAAR prep, focus on the tested standards (science and math)

### 2. Variety & No-Repeat Rules
**CRITICAL**: Generated content must not repeat topics, question structures, or approaches.

Before generating content, check what has been previously assigned by:
1. Querying the Homework Tracker DB in Notion for recent assignments
2. Checking the topic and TEKS standard of each recent entry
3. Generating content that covers DIFFERENT standards/topics

**Variety rules by subject:**

**Science:**
- Rotate through all 4 TEKS strands: Matter, Force/Energy, Earth/Space, Organisms
- Never repeat the same specific topic within 2 weeks
- Vary question types: multiple choice, short answer, diagram labeling, prediction, experiment design
- Include at least one "why" question per module

**Math:**
- Rotate through computation, fractions, geometry, measurement, data analysis, financial literacy
- Don't just swap numbers — change the CONTEXT and PROBLEM TYPE
- Monday's division with food → Wednesday's division with distance/speed
- Include word problems that require multi-step thinking
- Vary between: computation, word problems, visual/diagram problems, real-world application

**Reading/English (CER):**
- Each Wolfkid episode explores different literary concepts
- Rotate: character analysis, theme, author's purpose, compare/contrast, cause/effect, inference
- CER prompts should require textual evidence, not just opinion

**Pre-K:**
- Rotate through letters (not always A-B-C order — mix it up)
- Alternate between: tracing, identification, matching, counting, patterns, colors, shapes
- Keep sessions under 10 minutes
- Always include a "fun choice" element (pick your favorite, choose the color)

### 3. ADHD-Friendly Design
- Chunk content into 3-5 minute segments
- Clear start/end for each section
- Visual progress indicators
- Choice points (let the child pick what's next)
- Movement breaks between sections when appropriate
- High-interest framing (missions, challenges, discoveries)
- Immediate feedback on completion
- No long blocks of unbroken text

### 4. Difficulty Progression
- Start each module at the student's comfort level
- Include 1-2 stretch questions that push slightly beyond
- Track difficulty in Homework Tracker DB (Easy/Medium/Hard)
- If recent grades show struggle (like Buggsy's ~70 in science), increase practice frequency for that subject but DON'T increase difficulty — build confidence first

---

## CER/ECR Writing Review

When reviewing Buggsy's CER submissions, evaluate on these criteria:

### CER Structure (3-5 sentences)
- **Claim (C):** Clear thesis statement responding to the prompt
- **Evidence (E):** At least 1-2 text references with sentence stems
- **Reasoning (R):** Connects evidence back to claim with explanation

### ECR Structure (4 paragraphs, 3-5 sentences each)
- Introduction with claim
- 2 evidence paragraphs with text references
- Conclusion connecting back to thesis

### Grading Scale
- **A**: Complete CER structure, specific text evidence, clear reasoning, proper mechanics
- **B**: CER structure present but evidence could be more specific, or reasoning is thin
- **C**: Missing one CER element, vague evidence, or minimal reasoning
- **Incomplete**: Missing multiple elements or off-topic

### Writing Quality Notes (for parent review)
Generate brief, constructive notes for the parent covering:
- Spelling errors (list specific words)
- Grammar issues (proper nouns, commas in compound sentences)
- Sentence structure variety
- Use of sentence stems
- Overall improvement from previous submissions

### Feedback Tone
- Frame feedback as "Wolfkid Archive Quality Check" not "grade"
- Celebrate what worked before noting what to improve
- Connect improvements to the story universe ("The Archives require precise documentation")
- Never discourage — he's transitioning from comic-style to structured writing

---

## Math Module Generation

### Format
Each math module should include:
1. **Warm-up** (2-3 questions): Review of previously mastered concepts
2. **Core practice** (5-7 questions): Current topic, mixed difficulty
3. **Challenge** (1-2 questions): Stretch problem requiring deeper thinking
4. **Real-world connection**: One question connecting math to something relevant

### Question Types to Rotate
- Straight computation
- Word problems (varied contexts: money, sports, cooking, gaming, building)
- Visual/diagram problems (number lines, arrays, area models)
- Error analysis ("What did this student do wrong?")
- Multi-step problems
- Estimation and reasonableness checks

---

## Science Module Generation

### Format
Each science module should include:
1. **Quick fact** (1 interesting fact related to the topic)
2. **Reading passage** (3-5 short paragraphs, grade-appropriate)
3. **Questions** (5-8 mixed format):
   - 3-4 multiple choice (auto-gradable)
   - 1-2 short answer (parent review)
   - 1 "why/how" question (builds independent thinking)
4. **Connection** (how this relates to everyday life)

### Science Topic Map (4th Grade TEKS)
Rotate through these strands and sub-topics:

**Strand 1: Matter and Its Properties**
- Physical properties (mass, magnetism, relative density, solubility, conductivity)
- Physical changes vs chemical changes
- Mixtures and solutions
- States of matter

**Strand 2: Force, Motion, and Energy**
- Gravity, friction, magnetism
- Contact vs non-contact forces
- Energy forms (light, heat, sound, electrical, mechanical)
- Energy transfers and transformations
- Circuits (open/closed)

**Strand 3: Earth and Space**
- Natural resources (renewable vs nonrenewable)
- Weathering, erosion, deposition
- Fossils and what they tell us
- Sun, Earth, Moon patterns (rotation, revolution, phases)
- Weather patterns and measurement

**Strand 4: Organisms and Environments**
- Ecosystems (producers, consumers, decomposers)
- Food chains and food webs
- Life cycles
- Adaptations
- Environmental changes and organism responses

---

## Pre-K Content Generation (JJ)

### Format
Interactive, visual, short (5-10 minutes max per activity)

### Content Areas
**Letters:** Recognition, tracing, beginning sounds, name spelling
**Numbers:** Counting 1-20, number recognition, one-to-one correspondence
**Shapes:** Circle, square, triangle, rectangle, oval, diamond, star
**Colors:** Primary + secondary colors, color mixing concepts
**Patterns:** AB, ABC, AABB patterns with shapes, colors, sounds
**Science concepts:** Weather, seasons, plants, animals, 5 senses, day/night
**Social:** Sharing, taking turns, expressing feelings, following directions

### Age-Appropriate Framing
- Use pictures over text
- Audio prompts where possible
- Maximum 2-3 choices per question
- Celebrate every attempt, not just correct answers
- Use her interests (sparkles, stars, colors) as contexts

---

## Integration with Existing Systems

### Homework Tracker DB (Notion)
After generating content, log to the Homework Tracker with:
- Assignment name (descriptive, e.g., "Science: Forces & Friction Module")
- Subject (Math, Science, Reading, Writing)
- Difficulty (Easy, Medium, Hard)
- TEKS standard addressed (in Notes field)
- Status: Not Started

### Kids Hub Economy
- CER completion: 10-13 Rings (per Series Bible episode table)
- Math module completion: 8 Rings
- Science module completion: 8 Rings
- Pre-K activities: 1-2 Stars per activity
- Bonus rings for "A" grade on CER: +3 Rings

### Story Factory
- Approved CERs feed into Story Factory for comic generation
- Canon facts extracted from CER content
- Episode progression gated by CER completion + parent approval

---

## Social Studies Module Generation

### Format
Social Studies is woven INTO the Wolfkid narrative, not taught as a separate subject.

**For 4th Grade (Texas History):**
- Episodes can include Texas history elements (Spanish missions, Texas Revolution, Republic of Texas)
- CER prompts can ask about historical cause-and-effect using Wolfkid scenarios
- Map-reading and geography skills through Wolfkid missions
- Compare/contrast historical figures with character traits from the universe

**For 5th Grade (U.S. History — next year):**
- Constitutional themes through "rights and responsibilities" in the Wolfkid universe
- Westward expansion as a Wolfkid adventure arc
- Immigration themes through new characters entering the school
- Bill of Rights as "The Pack's Code" that Wolfkid and Hex debate

### Question Types for Social Studies
- Timeline ordering (sequence events)
- Map/geography questions (Texas regions, U.S. expansion)
- Cause-and-effect analysis
- Compare/contrast (historical figures, events, perspectives)
- Primary source analysis (adapted for 4th grade)
- "What would YOU have done?" questions (independent thinking)

---

## Homework Unlock & Reward System

### Philosophy: Make Him RUN to the Surface Pro
The goal: Buggsy says "Dad, I'm going to do my homework" without being asked.
Rings are the baseline currency. Unlocks are the EXCITEMENT layer on top.

### Unlock Tiers (Layered)

**Tier 1: Dashboard Skins (earned by module completion)**
- Complete 5 modules → unlock a new dashboard theme/color scheme
- Complete 10 modules → unlock a premium theme (Minecraft, Mario, custom)
- Themes are HIS choice — he designed them in his first assignment

**Tier 2: Wolfkid Universe Unlocks (earned by CER completion)**
- Each approved CER unlocks the next episode
- Every 3 episodes → unlock new character art from Gemini
- Season completion → unlock "Season 2 Architect" mode where he proposes the next arc

**Tier 3: Architect Mode (earned by sustained engagement)**
- After 15+ completed modules → he can suggest dashboard changes
- After a full month of consistency → "Feature Request" form where he proposes new features
- His suggestions get reviewed and built (within reason)
- This teaches him that consistent effort → earned influence

### Design Brief: First Assignment
Before any academic content, Buggsy's FIRST task is to design his dashboard.
This serves multiple purposes:
1. He owns the space from day one — it's HIS, not ours
2. The design process IS a learning exercise (color theory, layout, decision-making)
3. His choices inform all future dashboard styling
4. It builds buy-in before academic content even starts

Same for JJ — show her visual options and let her pick her theme.

