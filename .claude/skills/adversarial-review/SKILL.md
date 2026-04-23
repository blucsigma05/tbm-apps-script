---
name: adversarial-review
description: >
  Build evidence-bound adversarial review prompts for multi-model evaluation. Use when the user
  wants two (or more) models to stress-test a plan, spec, or artifact against each other — e.g.,
  Opus defender vs GPT rival, or mutual audit loops. Produces paired role-specific prompts that
  share a TACT evidence standard (Truth + Authenticity + Clarity), enforce steelman-before-rebut,
  forbid theater/hedging/invented sources, and bake in a round protocol with plan_diff as the
  real artifact. Trigger phrases: "build prompts for X to attack/defend Y", "adversarial review",
  "feedback review", "feedback review skill", "feedback review loop", "arch-rival prompt",
  "defender and attacker prompts", "two-model review", "multi-model review", "dual review". Do
  NOT use for single-prompt audit (use prompt-auditor-pass), domain-specific audits where a
  repo-local tool already exists, or non-adversarial critique (just one model's opinion).
---

# Adversarial Review

Paired (or N-way) prompt construction for multi-model evaluation loops. The pattern: one model
defends an artifact, one or more rivals attack it, all operate under identical evidence bars.
The skill produces the paired prompts. The user drives the paste loop.

## Cardinal Rule
Evidence symmetry. The bar the lead demands of the rival is the bar the lead must meet itself.
Asymmetric evidence standards turn an audit into a rhetoric contest. If symmetry cannot be
enforced between sides, use `prompt-auditor-pass` for a single audit prompt instead.

---

## When to Use

- User wants paired or N-way adversarial review of a plan, spec, or artifact
- User invokes phrasing like "arch rival," "defender," "attacker," "review loop," "feedback
  review," "two-model audit," "adversarial pair"
- Artifact under review has a claimable standard or floor (paid-platform parity, a rubric, a
  measurable metric) that can anchor the fight
- Stakes justify running the loop more than once; one-shot reviews should use
  `prompt-auditor-pass`

## When NOT to Use

- Single-prompt audit → `prompt-auditor-pass`
- Domain-specific audits where a repo-local tool exists — use that tool instead of this generic pairing pattern
- User wants one model's opinion, not an adversarial loop
- Artifact has no claimable standard — the fight will drift to vibes

---

## The Skill's Two Phases

### Phase 1 — Dialogue (gather inputs)

Before generating any prompts, collect these inputs. Use `AskUserQuestion` when available.

1. **Artifact under review.** Path, paste, or concrete description. Required. "Something about
   the API" is not enough.
2. **Lead / defender role.** Which model (Opus 4.6? Sonnet 4.6? another instance?). What position
   they defend (author of the plan, owner of the architecture). Authority: they own the plan,
   but defend on evidence, not role.
3. **Rival / attacker role(s).** Which model(s). If N-way, each rival gets a DISTINCT angle
   (cost, correctness, scope creep, scalability, UX, security, operability). Duplicated angles
   produce pile-on on the same seam and hide blind spots.
4. **Evidence standard.** The floor the artifact must clear. Acceptable forms:
   - Paid-platform parity — name the platforms explicitly (Mint, YNAB, Monarch, Copilot.money)
   - Canonical rubric — name a rubric file in the repo (e.g., `ops/<your-rubric>.md`); do not cite a rubric that has not been committed to the branch under review
   - Measurable metric — name the number (latency <Xms, accuracy >Y%, cost <$Z)
   - User-defined — user provides the bar in their own words
   Vagueness here = round 1 spent arguing definitions instead of substance.
5. **Environment access per model.** Tools/files available to each: project files,
   `conversation_search` / `recent_chats`, Notion, web search, named artifacts. The "I don't
   have access to X" dodge is only valid AFTER a real search.
6. **Exit condition.** When is the loop done? All CRITICAL attacks resolved for two consecutive
   rounds, user calls it, artifact ships, N rounds elapse.
7. **Optional: bake-in content.** Direct rubric quotes, specific paid platforms, prior-round
   concessions to respect, known weak points scoping the fight.

Gather all required inputs before Phase 2. Missing inputs → ask; do not assume defaults.

### Phase 2 — Generation

Emit one prompt per role. Both (all) prompts share:
- Identical TACT canon (Section A)
- Identical forbidden-moves list (Section B)
- Identical evidence bar (from Phase 1 input)
- Equivalent environment-access clauses

Role-specific content:
- **Lead / defender**: normalize incoming attacks → classify (Valid / Partial / Invalid /
  Needs-More-Info) → respond (ACCEPT / REBUT / PARTIALLY ACCEPT / ESCALATE) → emit `plan_diff`
- **Rival / attacker**: extract claims → classify (Evidenced / Asserted / Assumed) → attack
  (ranked CRITICAL / HIGH / MEDIUM / LOW) → concessions → counter-proposal if structural flaw

---

## Section A — TACT Canon (identical on all sides — bake verbatim)

- **Truth.** Cite specific evidence: line number, file path, logic chain, named artifact, paid-
  platform feature. "In my experience," "obviously," "clearly," "any competent engineer" are
  not evidence.
- **Authenticity.** Operate in the user's actual patterns and voice. No generic best-practices
  LARP. Honor the system as-built.
- **Clarity.** Structured output. Scannable. No preamble. No hedging that fails to name what it
  depends on. "It depends" is theater unless the dependency is named.
- **Steelman before rebut.** State the other side's claim in a form they would accept BEFORE
  engaging it. If you cannot, you have not understood the claim yet.
- **Evidence symmetry.** Your rebuttal meets the evidence bar you demand of the other side. No
  exceptions.
- **A good attack is a gift.** When correct, concede explicitly. Do not thank. Do not gloat. The
  `plan_diff` is the payment.
- **Goal is not to win the round.** The goal is an artifact that survives the audit at the
  specified evidence bar.

## Section B — Forbidden Moves (identical on all sides — bake verbatim)

- Ad hominem or model-bashing ("Opus always...", "GPT tends to...")
- Straw-manning (attacking a weakened version of the claim)
- Appeals to authority without citation
- Unsupported confidence words ("clearly," "obviously," "any competent engineer," "it's well
  known that...")
- Theater ("I will destroy this plan," "this is a disaster," "fantastic challenge")
- Social softening ("great point," "fair challenge," "you raise an interesting...")
- Free-lunch counter-proposals (every proposed change states its cost)
- Inventing file paths, function names, line numbers, benchmarks, or citations
- Lowering the evidence bar to make a claim pass
- Restating the other side's output as preamble instead of engaging it
- Rubber-stamping ("looks good," "no objections") when the audit found nothing — either the
  prompt didn't belong here, or the audit is failing

---

## Prompt Structure

Each generated prompt has five blocks. Fill slots from Phase 1 inputs.

### CONTEXT block
- Role identity. Examples:
  - Lead: "You are the lead architect of [ARTIFACT]. [RIVAL] operates as adversarial auditor in
    a parallel thread. The user will paste [RIVAL]'s output here for your response."
  - Rival: "You are the adversarial auditor of [ARTIFACT]. [LEAD] is the defender in a parallel
    thread. The user will paste [LEAD]'s output here for you to attack."
- Artifact identification — what's under review, where to find it
- Evidence standard — the floor, stated concretely (paid platforms named, rubric path given,
  metric quantified)
- Environment access — tools/files available, PLUS: "'I don't have access to X' is only valid
  AFTER an actual search. Use [listed tools] before asserting missing context."
- Known weak points / priors — scopes the fight, prevents re-opening settled ground
- (For rivals in N-way review) the specific angle assigned to this rival

### TASK block
- Role-specific action:
  - Lead: "Normalize [RIVAL]'s output into discrete attacks regardless of how they were
    formatted. Classify each. Respond with ACCEPT / REBUT / PARTIALLY ACCEPT / ESCALATE. Audit
    any counter-proposal on the same evidence bar."
  - Rival: "Extract every claim [LEAD] made. Classify each as Evidenced / Asserted / Assumed.
    Attack the weakest class first. Rank attacks CRITICAL / HIGH / MEDIUM / LOW. Concede
    explicitly when [LEAD] is correct."
- Per-response requirements — evidence citation, concrete change (not "will consider"), specific
  plan location

### CONSTRAINTS block
- Full forbidden-moves list from Section B, verbatim
- Evidence bar reminder — "Your evidence bar equals or exceeds what you demand of the other
  side."
- Preamble ban — "Do not restate the other side's output as preamble. The ledger is the
  restatement."
- Hedging ban — "'It depends' without naming what it depends on is theater."
- Bar-lowering ban — "Do not lower the evidence bar to escape an attack. Raising the bar is
  allowed if evidence supports it."

### FORMAT block
Required output sections (tag each so rounds can diff):
- Lead: `<attack_ledger>` | `<responses>` | `<plan_diff>` | `<counter_to_rival>` |
  `<open_to_user>` | `<round_status>`
- Rival: `<claim_ledger>` | `<attacks>` | `<concessions>` | `<counter_proposal>` |
  `<open_to_user>` | `<round_status>`

Round status values: `HOLDING` | `REVISED` | `STRUCTURAL REWRITE NEEDED` | `STANDARD RAISED` |
`READY FOR NEXT ROUND` | `PLAN SURVIVES ROUND`.

Exit condition — baked in verbatim from Phase 1 input.

### OPERATING PRINCIPLES block
- TACT canon condensed to 3-5 bullets
- "The `plan_diff` (lead) or `counter_proposal` (rival) is the real artifact. Everything else
  is justification."
- "Ultra-skeptical is not dismissive. Every rebuttal meets the evidence bar."
- Round expectation: "Each paste prefixed by `Round N of loop — prior concessions: [list]`.
  Respect concessions; do not re-attack resolved items."

---

## Round Protocol (encoded IN the prompts, not orchestrated by the skill)

The skill generates prompts. The user drives the paste loop. The protocol lives in the prompts:

1. User prefixes each paste with: `Round N of loop — prior concessions: [list]`
2. Lead's `<plan_diff>` feeds the next round into the rival thread
3. Rival's `<attacks>` or `<counter_proposal>` feeds the next round into the lead thread
4. Each round ends with an explicit `<round_status>` so the user knows whether to continue
5. Loop exits when the Phase 1 exit condition fires

**Known manual-tracking blind spot.** By round 4, prior concessions can be forgotten by either
model. The "prior concessions" header in the prefix is the mitigation. For loops expected to
run more than 4 rounds, recommend the user track concessions in a scratch file or Notion page.

---

## Output — What the Skill Delivers

1. **Each prompt as a distinct copy-paste-ready code block**, clearly labeled:
   ```
   ### Prompt 1 — [MODEL NAME] (Lead / Defender)
   [full prompt text]
   ```
2. **Paste-workflow notes** — inline, brief:
   - The `Round N` prefix convention
   - Which output feeds which thread next round
   - Exit condition reminder
3. **Known blind spots** — called out explicitly:
   - Manual round tracking risk past round 4
   - Same-model N-way rivals → local-optimum risk (flag + suggest rotating angle assignments)
   - Evidence-standard vagueness (if user supplied a vague bar, say so, do not smuggle)
4. **Scoring matrix (optional, on request)** — apply the `prompt-auditor-pass` five-dimension
   matrix to each generated prompt if the user wants to audit the prompts themselves before
   launching the loop

---

## Quality Check — Skill's Self-Audit Before Handoff

Before returning prompts, verify each item. Report gaps inline. If a gap depends on user input,
ask.

- [ ] Evidence bar is identical on all sides (same rubric, same platforms, same metric)
- [ ] Forbidden-moves list is complete and identical on all sides (verbatim match)
- [ ] Environment access is specified for each role — no "I don't have X" dodge without a
      required search clause
- [ ] Exit condition is explicit and measurable, not "until you're tired"
- [ ] For N-way: each attacker has a distinct angle (no duplicates)
- [ ] For N-way same-model: local-optimum risk flagged in output
- [ ] Evidence standard is concrete (named platforms, named file, named metric) — not vague
      ("commercial quality," "best practices")
- [ ] Each prompt contains `plan_diff` / `attack_ledger` / `round_status` output tags
- [ ] No preamble-inducing phrasing ("before responding, consider...", "think step by step...")
      — these produce restating instead of engaging
- [ ] TACT canon present verbatim in every prompt
- [ ] `Round N` prefix convention present in every prompt's OPERATING PRINCIPLES block

A self-audit that finds nothing is a failing audit. If every box checks on first pass without
any tradeoffs noticed, re-scan — something was missed.

---

## Failure Modes to Avoid

### In Phase 1 (dialogue)
- Skipping the evidence-standard question. Without a concrete floor, the whole loop drifts.
- Accepting "Opus and GPT" without naming which Opus / which GPT version. Model capability
  differences matter for what evidence standard is realistic.
- Letting the user assign the same angle to two rivals in N-way → pile-on on one seam.

### In Phase 2 (generation)
- Asymmetric evidence bars (lead cites specifics, rival asserts). Fatal.
- Forgetting to bake in the "search before saying no access" clause — model replies "I don't
  have access to the repo" without checking.
- Letting the forbidden-moves list drift between prompts. Must be verbatim-identical.
- Over-engineering CONSTRAINTS — every constraint line earns its place or gets cut.

### In the output
- Burying the prompts in prose. They should be the biggest blocks on screen, copy-pasteable.
- Presenting the scoring matrix when not asked. It is optional on request, not default.
- Flagging blind spots only at the bottom. Material risks go inline with the relevant section.

---

## Example Triggers

- "I want GPT 5.4 to attack an Opus plan for X and I want evidence-bound rebuttals" → 2-model
  generation (Opus lead, GPT rival)
- "Build me prompts for a defender and attacker pair on this migration" → if a repo-local
  migration-specific audit tool exists, check it first; otherwise generate here
- "Set up an adversarial review loop between Opus and Sonnet on this spec" → 2-model with
  same-family flag (local-optimum risk)
- "I want three models to stress-test this from different angles" → N-way generation with
  distinct angles enforced
- "Arch rival prompt for GPT to ruthlessly attack Opus's plan" → 2-model, strip the persona
  flavor, keep the evidence bar
- "Feedback review skill / feedback review loop" → full skill invocation

## Non-Triggers

- "Audit this prompt I wrote" → `prompt-auditor-pass`
- "Review this migration plan" — if a repo-local migration-specific audit tool exists, use it; otherwise this skill applies only if the plan has a claimable adversarial standard
- "What do you think of this spec?" → single-model critique, not adversarial loop
- "Summarize the review feedback I got" → conversational, not prompt construction

---

## Integration with Existing Skills

- **`prompt-auditor-pass`** — single-prompt adversarial audit. Overlaps on "build a prompt for
  another model" but not on pairing, round protocol, or `plan_diff`. If the user has only one
  model available or wants one review, use that instead.
- **Repo-local migration-audit tools (if any)** — domain-specific tools (skills or slash
  commands) that score migration plans against a repo's own canonical rubric may exist on a
  given project. Prefer those for migration work. This `adversarial-review` skill is the
  generic cross-model pairing pattern and does not embed or require any repo-specific rubric
  files; do not invent a specific command name here — check the repo's `.claude/commands/` and
  `.claude/skills/` before advising a user to invoke one.
- **TACT philosophy (global memory)** — the `Truth + Authenticity + Clarity` root of this skill
  is defined in `notion.so/2c2cea3cd9e8815bae35d37dbb682cee`. This skill operationalizes TACT
  for multi-model review; changes to TACT upstream should propagate here.

For high-stakes deliverables where a single adversarial pass is not enough, chain this skill
with `prompt-auditor-pass` — run the auditor on the generated prompts themselves before
launching the loop.
