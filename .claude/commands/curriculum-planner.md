---
name: curriculum-planner
description: >
  Scope and sequence design for K-12 curriculum planning. Use this skill when
  mapping TEKS standards across weeks, designing spiral review schedules,
  planning spaced repetition, auditing coverage gaps, or building a multi-week
  curriculum progression. Grounded in Bruner's spiral curriculum theory and
  spaced repetition research. Trigger on: scope and sequence, curriculum map,
  TEKS coverage, spiral review, standards alignment, weekly rotation, coverage
  gap, pacing guide, vertical alignment.
---

# Curriculum Planning Skill — Scope, Sequence & Coverage

**Framework:** Jerome Bruner's Spiral Curriculum (1960) + spaced repetition research
**Context:** Thompson family education platform — Buggsy (4th grade, TEKS) and JJ (Pre-K milestones)

---

## Core Principle: Spiral + Spaced

> "A curriculum should revisit basic ideas repeatedly, building upon them until
> the student has grasped the full formal apparatus." — Jerome Bruner

Every concept appears at least 3 times across the school year:
1. **Introduce** — first exposure with scaffolding (Week N)
2. **Reinforce** — practice with less scaffolding (Week N+3 to N+5)
3. **Assess** — test mastery with no scaffolding (Week N+8 to N+12)

The spacing between exposures follows the expanding interval pattern from spaced
repetition research: initial review at 3-5 days, second review at 2-3 weeks,
third review at 6-8 weeks.

---

## Step 1: Standards Inventory

Before generating any content, build a complete inventory of standards:

### Buggsy — 4th Grade TEKS (Math + Science + RLA)

**Math strands (7):**
| Strand | TEKS Codes | STAAR Weight | Questions Needed |
|--------|-----------|-------------|-----------------|
| Place Value & Number Sense | 4.2A-H | Heavy | 3-4/week |
| Fractions | 4.3A-G | Heavy | 3-4/week |
| Computation (+/-/x/div) | 4.4A-H | Heavy | 4-5/week |
| Algebraic Reasoning | 4.5A-D | Medium | 2-3/week |
| Geometry | 4.6A-D | Medium | 2-3/week |
| Measurement | 4.7A-B, 4.8A-C | Medium | 2-3/week |
| Data Analysis | 4.9A-B | Light | 1-2/week |
| Financial Literacy | 4.10A-E | Light | 1-2/week |

**Science strands (5) — aligned to `references/teks-science-grade4.md`:**
| Strand | TEKS Codes | 5th Grade STAAR? | Priority |
|--------|-----------|-----------------|----------|
| Scientific Inquiry | 4.1-4.3 | Yes | High |
| Matter & Properties | 4.6A-C | Yes | High |
| Force, Motion & Energy | 4.7-4.8 | Yes | High |
| Earth & Space | 4.9-4.11 | Yes | Medium |
| Organisms & Environment | 4.12-4.13 | Yes | Medium |

**RLA focus areas (7):**
| Focus | TEKS | STAAR Weight | Frequency |
|-------|------|-------------|-----------|
| Comprehension (key details) | 4.6A | Heavy | Every passage |
| Inference/Analysis | 4.6B-C | Heavy | Every passage |
| Author's Purpose/Viewpoint | 4.10 | Heavy | 1/week minimum |
| Grammar/Editing | 4.11D | Heavy | Thursday sprint |
| Text Structure | 4.9D | Medium | 1/week minimum |
| Vocabulary in Context | 4.2B, 4.3B | Medium | Every passage |
| Poetry/Literary Elements | 4.4 | Light | 2/month |

### JJ — Pre-K Milestones

| Domain | Phase 1 Target | Phase 2 Target | Phase 3 Target | Phase 4 Target |
|--------|---------------|---------------|---------------|---------------|
| Letters | K,I,N,D,L,E,J,B (8) | +A,M,S,T,O,C (14) | All 26 uppercase | Lowercase intro |
| Numbers | 1-5 | 6-10 | 11-15 + skip count | 1-20 + writing |
| Colors | Primary (3) + green | +orange, purple | +pink, brown, black | Color mixing |
| Shapes | 5 basic | +diamond, oval | 3D intro | Sorting/classifying |
| Writing | Letter recognition | Tracing KINDLE | Writing KINDLE | Full name unassisted |
| Phonics | Letter sounds | Beginning sounds | CVC blending | Simple sentences |

---

## Step 2: Coverage Mapping

### The Coverage Matrix

Build a matrix: rows = TEKS codes, columns = week numbers. Fill each cell with the question count hitting that standard.

```
Example (Math, Weeks 1-8):
             W1  W2  W3  W4  W5  W6  W7  W8
TEKS 4.2A     0   0   0   0   3   0   0   2  → 5 total (first at W5)
TEKS 4.3C     1   0   0   1   0   0   0   1  → 3 total
TEKS 4.4B     0   0   0   0   0   3   0   1  → 4 total (first at W6)
TEKS 4.4D     2   0   0   2   0   0   0   1  → 5 total
...
```

### Coverage Rules
1. **Every TEKS code must appear in at least 3 different weeks** across the year
2. **Heavy-weight STAAR standards** must appear in at least 6 weeks
3. **No TEKS code can go more than 8 weeks without appearing** (prevents forgetting)
4. **Week 1 of each 8-week cycle** includes a spiral review of all previously introduced standards
5. **Assessment weeks** (every 8th week) test all standards from that cycle

### Gap Detection
After generating content for a batch of weeks, run this check:
```
For each TEKS code in the standard:
  Count: how many weeks include at least 1 question with this code
  Last seen: which was the most recent week
  If count < 3 and week > 12: FLAG as coverage gap
  If last_seen > current_week - 8: FLAG as review gap
```

---

## Step 3: Weekly Structure Design

### The 8-Week Cycle (Buggsy)

Each 8-week cycle covers all major strands with increasing difficulty:

| Week in Cycle | Math Focus | Science Focus | RLA Focus | Special |
|---------------|-----------|---------------|-----------|---------|
| 1 | Strand A | Strand X | Comprehension | — |
| 2 | Strand B | Strand Y | Author's Purpose | — |
| 3 | Strand C | Strand Z | Text Structure | — |
| 4 | Strand D | Strand X review | Vocabulary | — |
| 5 | Strand E | Strand Y review | Poetry/Literary | — |
| 6 | Strand F | Strand Z review | Informational | — |
| 7 | Strand G | Mixed review | Grammar Heavy | — |
| 8 | **Mixed Review** | **Mixed Review** | **ECR Practice** | **Assessment** |

### Content Type Rotation

| Day | Structure | Minimum Requirements |
|-----|-----------|---------------------|
| Monday | Math module (5Q) + Science module (3Q) + Fact Sprint | 1 error analysis Q, 1 visual/diagram Q |
| Tuesday | Cold passage (4-6Q) + Writing prompt | 1 author's purpose OR text structure Q, passage type rotates (informational/fiction/poetry) |
| Wednesday | Math module (4Q) + Science module (3Q) + Investigation | Investigation includes data analysis + conclusion writing |
| Thursday | Cold passage (4-5Q) + Grammar Sprint (5Q) + Wolfkid Episode | Grammar focus rotates: sentences, agreement, possessives, editing, complex sentences, revision |
| Friday | Review Quiz (4-6Q mixed) + Writing/ECR + Fact Sprint | ECR every other Friday, reflective writing on alternate Fridays |

### Passage Type Rotation (6-week cycle)
```
Week 1: Tuesday informational, Thursday informational
Week 2: Tuesday informational, Thursday fiction
Week 3: Tuesday fiction, Thursday informational
Week 4: Tuesday informational, Thursday fiction
Week 5: Tuesday poetry, Thursday informational
Week 6: Tuesday informational, Thursday fiction (Wolfkid)
```

---

## Step 4: Difficulty Progression

### Within a Module (per session)
```
Q1-Q2: Recall / recognition (DOK 1) — "What is..." "Which is..."
Q3-Q4: Application (DOK 2) — "Calculate..." "Compare..." "What happens when..."
Q5-Q6: Analysis / Synthesis (DOK 3) — "Why..." "Design..." "A student said X, is this correct?"
```

### Across Weeks (per cycle)
```
Weeks 1-2: Standard grade-level (mostly DOK 1-2)
Weeks 3-4: On grade-level with DOK 2-3 questions
Weeks 5-6: Grade-level + 1 challenge question tagged [GRADE 5]
Weeks 7-8: Mixed difficulty + assessment-style formatting (STAAR stems)
```

### Across Cycles (school year progression)
```
Cycle 1 (W1-8):   Grade 4 core, scaffolded, generous hints
Cycle 2 (W9-16):  Grade 4 core, less scaffolding, occasional Grade 5 preview
Cycle 3 (W17-24): Grade 4 + Grade 5 mix, STAAR simulation format
Cycle 4 (W25-32): Grade 5 science heavy (STAAR tests both grades), remediation based on QuestionLog data
Cycle 5 (W33-36): Full STAAR practice tests, gap fill from mastery data
```

---

## Step 5: Spiral Review Schedule

### Review Frequency by Recency
| When Introduced | Review Frequency |
|-----------------|-----------------|
| This week | Daily (within the module) |
| Last week | 2-3 questions in Friday review |
| 2-4 weeks ago | 1-2 questions in Monday warm-up |
| 5-8 weeks ago | 1 question in Friday review quiz |
| 9+ weeks ago | Appears in assessment week only |

### Vocabulary Spiral (5 words/week from SpellingCatalog)
```
Week N: Introduce 5 new words (Mon-Fri exposure)
Week N+1: 2 review words from Week N + 3 new previews
Week N+2: 1 review from Week N, 1 from Week N+1, 3 new
Week N+4: Friday quiz includes 1-2 words from Week N (spaced repetition)
Week N+8: Assessment includes cumulative vocabulary
```

---

## Step 6: Assessment Checkpoints

### Every 4th Week: Progress Check
- 8-question mixed quiz covering all standards from weeks N-1 to N-4
- Results feed into mastery tracking (QuestionLog)
- Parent report generated with per-standard accuracy

### Every 8th Week: Cycle Assessment
- 12-16 questions in STAAR format (MC, multi-select, short answer, griddable)
- ECR writing prompt
- Comprehensive coverage of all strands in the cycle
- Mastery threshold: 70% per standard = mastered, <50% = needs remediation
- Remediation: next cycle adds extra questions on weak standards

### JJ Assessments (Phase-end)
- No timed assessment (age 4)
- Activity-based: "Can JJ tap the correct letter from a 4-letter set with 80% accuracy?"
- Measured over multiple sessions, not one test
- Milestone checklist for parent report

---

## Applying This Skill

When planning curriculum weeks:
1. **Start with the coverage matrix** — what standards have been covered, what's missing?
2. **Check spiral schedule** — are previously introduced concepts being reviewed on schedule?
3. **Verify difficulty progression** — is this week harder than last week in the same strand?
4. **Rotate content types** — fiction/informational/poetry for passages, varied question types for math
5. **Tag every question** — TEKS code, difficulty level, DOK level, question type
6. **Check ADHD compliance** — apply `/adhd-accommodations` rules to question sequencing
7. **Plan assessment** — every 4th and 8th week includes structured assessment

Sources:
- [Spiral Curriculum: How Revisiting Topics Builds Deep Learning — Structural Learning](https://www.structural-learning.com/post/the-spiral-curriculum-a-teachers-guide)
- [Designing Curriculum Scope and Sequence for Success — Learn Wise Daily](https://learnwisedaily.com/designing-curriculum-scope-and-sequence-for-success/)
- [Fostering Rigor through Spiraled Mathematics Education — IJRES](https://ijres.net/index.php/ijres/article/download/1317/2677/3330)
- [K-12 Universal Curriculum Design Principles — CT.gov](https://portal.ct.gov/-/media/sde/ct-learning-hub/k-12-universal-curriculum-design-principles.pdf)
- [Texas ELAR K-12 Vertical Alignment — TEA](https://tea.texas.gov/academics/subject-areas/english-language-arts-and-reading/vertical-alignmentk-12english06-20190.pdf)
