---
name: codex-audit
description: >
  Run a factual, evidence-bound audit of a plan, spec, research output, or PR produced by
  another model (Codex, GPT, Gemini, another Claude). Packages the methodology LT codified
  across PR #73 (12 rounds) and the 2026-04-22 Codex infra-build pilot into a single
  invocable skill. Every claim in the audit target is verified against source or live state;
  unverified claims are findings, not accepted prose. Output matches the RED / YELLOW /
  GREEN format LT's manual audits use in PR comments. Trigger phrases: "audit Codex PR",
  "audit this research spec", "courier audit", "factual check this plan", "attack audit",
  "fact-check Codex's recommendation", "evidence-bound audit", "run codex-audit on #N",
  "/codex-audit #N", "is this plan actually right", "verify each claim in this".
  Differs from adversarial-defender (defender role, not attacker); adversarial-review (builds
  the prompt for external models); prompt-auditor-pass (audits prompt structure, not plan
  substance).
type: skill
---

# Codex Audit — evidence-bound factual audit of a plan/spec/PR

## Cardinal Rule
**No audit bullet without verification.** A finding is valid only if it cites a command that
produced the evidence — grep output, Read output, API response bytes, live SQL. A claim the
audit says is verified must be checked as deeply as a claim the audit says is broken.
Evidence symmetry: the bar demanded of the auditee is met by the auditor before writing.

Baked in verbatim from `ops/operating-memos/2026-04-22-codex-infra-build-pilot.md` §Rule 1
(no plan item without verification) + §Rule 2 (build artifact is a tested branch or
verified Issue comment with captured command output — not a prose rewrite).

---

## When to Use

- Another model posted a plan, spec, recommendation, or PR, and LT wants a factual check
- LT says "audit PR #N" / "fact-check this" / "attack this plan" / "is this actually right"
- You're performing the Claude half of the Codex-pilot cross-audit (pilot memo §Cross-audit)
- An adversarial-review loop is about to paste a rival's output and needs the baseline audit
  before the attack round
- A research spec claims file paths, YAML config, API behavior, or byte output you can verify

## When NOT to Use

- Single-prompt audit of a prompt's structure → `prompt-auditor-pass`
- You're defending a plan against external attacks → `adversarial-defender`
- You're building a prompt for an external model to run the audit → `adversarial-review`
- Trivial review with no factual surface to audit (code style, naming, docs prose)
- User wants a vibes-check, not an evidence trail

---

## Phase 1 — Freeze the audit surface

Before reading anything substantive:

1. **Record the head SHA** of what you're auditing. PR, commit, or paste — capture the exact
   bytes. A moving target is a broken audit.
2. **Enumerate the closed set** of touched files. For a PR: `gh/gitea` API → list of files.
   For a spec: the spec file itself + any paths it references. For a paste: the blocks it
   contains. Write the list down. You will verify every claim in these files — no more, no
   less.
3. **Name the audit target model.** Codex, GPT, another Opus, a paste from ChatGPT. The
   model shapes the failure modes you check for (see §Failure mode library).

If you skip Phase 1, you will drift — patching the loudest finding instead of scrubbing the
set. PR #73 took 12 rounds because the first 11 were drift-patching.

---

## Phase 2 — Closed-set scrub (mandatory)

For each file in the closed set:

1. **Read the file end-to-end with the Read tool.** Not grep. Not "I remember what this
   says." Read from line 1 to end of file. Context decay is real within a session.
2. **Enumerate every self-claim.** A self-claim is any current-tense assertion the file
   makes about repo reality: "file X exists," "function Y does Z," "YAML step N is
   configured as W," "the runner emits bytes B." Write the list. Aim for completeness over
   brevity.
3. **Verify each self-claim against source or live state.** Per claim:
   - Path existence claim → `ls` / `git ls-tree -r <base> -- <path>`
   - Function/behavior claim → grep + read the surrounding 5 lines
   - YAML/config claim → Read the actual YAML at the claimed line
   - API/command output claim → run the command, capture output (see Phase 4)
   - Historical claim (dates, SHAs, versions) → `git log` / `git show`
4. **Cross-file references.** If file A claims file B § Y says X, open both and verify Y
   still says X. If an Issue body references a path, verify the path resolves on the base
   branch.
5. **Record zero-matches as findings.** If a claim doesn't verify, it's not a nit — it's a
   RED or YELLOW finding depending on severity (see §Output format).
6. **Re-read sections you touched (if the audit led to edits).** Don't trust memory of what
   you just wrote. This catches context-decay drift that Codex will catch otherwise.
7. **Contradiction grep before declaring done.** For every self-claim / cross-file claim
   identified in step 2, run a grep that would detect drift. Pass only if every grep shows
   no residual drift.

Source: `feedback_rule_doc_sweep_checklist.md` (LT codified after PR #73 round 11).

---

## Phase 3 — Correlate claims (mandatory)

Per-claim verification is necessary but **not sufficient**. Two claims about the same
system can each be individually true and still contradict when read together. This phase
catches that.

1. **Same-system cross-check.** Identify claims that describe the same system from
   different angles. Common patterns:
   - "File X does Y" (structural) + "This approach avoids Y-class problems" (recommendation)
     → does the recommendation hold given what X actually does?
   - "Worker W has config C" + "Probe contract is P" → does P fit W given C?
2. **Scope-vs-contract cross-check.** When a spec has a scope boundary ("applies to A, B,
   C") and a contract ("the suite does X, Y, Z"), map every element of the contract onto
   every element of the scope. Any unmapped combination is a finding.
3. **Framing grep.** Search the audit target for absolute-framing words — `without`,
   `never`, `only`, `non-production`, `canonical`, `definitive`. For each hit, verify the
   body supports the absolute form. Relaxed framing ("reduces," "narrows," "closer to")
   is often accurate where absolute framing overstates.
4. **Record the correlation check as a grep.** Same evidence bar as Phase 2 — if you can't
   point to the grep output, the correlation pass didn't happen.

Source: `feedback_audit_correlate_claims.md` — LT named after PR #90 audit round 3 let
through two individually-true but mutually-contradicting claims that a rival caught.

---

## Phase 4 — Byte verification (for tool/API output claims)

For any audit-target claim about what a tool or API emits — especially emoji, non-ASCII,
or bytes that pass through a transcoding step — **do not read the rendered terminal
output; dump the raw bytes**.

Triggers this phase:
- Audit target asserts tool produces specific characters beyond ASCII
- Audit target defines a match/detection contract where a mismatch produces silent
  wrong-answer (review parser, marker matcher, comment filer)

How:
- Python: `body.encode('utf-8')` printed with `%r`, then each char with `ord(c)` and hex
  codepoint
- Shell: `xxd` / `od -c` / `hexdump -C`
- curl: pipe to `| od -c | head` instead of reading rendered stdout

When two observers disagree about what a tool emits, distrust visual agreement — two
terminals can render the same bytes differently. Reconcile at the byte level.

When the audit target documents a match contract, verify the match is byte-stable — anchor
on ASCII text that won't transcode, not on emoji/NBSP/smart quotes that will.

Source: `feedback_verify_bytes_not_render.md` — PR #73 round 7, six rounds of audits
missed a mojibake because everyone was reading glyphs not bytes.

---

## Phase 5 — Build-artifact bar (for implementation claims)

If the audit target proposes an implementation — a YAML change, a regex, a command
pipeline, a config diff — the artifact's evidence bar is **tested branch or captured
command output, not prose rewrite**.

Specifically (pilot memo §Rule 2):
- Regex claim → must have been run against real output; show the match
- "Tool does Y" → must have run the tool and shown real stdout/stderr; general knowledge
  that "tools like this usually behave" does not substitute
- "Change config A → B" → must have read A and confirmed it is A at the audited SHA
- "Workflow on line N does Z" → must have Read the workflow at line N

If the audit target proposes an item without this backing, the finding is: **unverified
plan item — must run before merging**. Not "looks reasonable, accept."

Source: `ops/operating-memos/2026-04-22-codex-infra-build-pilot.md` §Rule 2 +
`feedback_no_unverified_plan_items.md`.

---

## Output format (match LT's manual PR #64 / #73 audit shape)

Post as a PR comment via the Gitea API (or an Issue comment when auditing a spec). Exact
sections, in order:

### `## {Auditor} audit — {VERDICT} {with NOTES/POLISH if partial}`

`{VERDICT}` is one of `PASS` / `PASS with YELLOW polish` / `FAIL` / `INCONCLUSIVE`.
Rubber-stamp-style phrases ("looks good" / no explicit verdict / "could be cleaner") =
`INCONCLUSIVE`, never `PASS`.

### `### Methodology`
One sentence. Reference this skill + the pilot memo. Example:
`Closed-set scrub + correlate-claims + byte-verify per codex-audit skill.`

### `### GREEN — verified correct`
Bullets, one per claim, each with evidence:
- `- Claim X — evidence: grep output / Read line N / API response`

### `### YELLOW — minor, non-blocking`
Numbered. Each finding has: claim, why it's yellow, specific recommended fix, before/after
snippet if the fix is a code change.

### `### RED — blocking`
Numbered. Each finding has: claim, why it fails, what must change, evidence that the fix is
needed (not just "seems wrong").

### `### Infra / scope notes (optional)`
CI failures on the PR that are not caused by the audit target (e.g., pre-existing known
infra issues). Explicitly label them "not caused by this PR."

### `### Verdict`
One-paragraph summary. What the audit concluded, what can be merged as-is, what requires a
follow-up commit.

### Attribution footer
`_Audit by {model} under codex-audit skill. Methodology refs: ops/operating-memos/2026-04-22-codex-infra-build-pilot.md + memory rules feedback_audit_correlate_claims, feedback_no_unverified_plan_items, feedback_rule_doc_sweep_checklist, feedback_verify_bytes_not_render._`

---

## Hard rules (violate any → the audit is invalid)

1. **Never invent file paths, function names, line numbers, or commit SHAs.** If you can't
   resolve it, don't cite it. A fabricated citation is an automatic FAIL of your audit.
2. **Never generalize.** "Consider caching" without pointing to file + cache key + miss
   rate = rejected. Concrete grep/Read/command or nothing.
3. **Never capitulate.** If the audit target is technically right but the recommendation
   overreaches, argue it. Don't silently accept. Don't silently reject.
4. **Never rubber-stamp.** A PASS audit that finds nothing across the entire closed set is
   either trivial (shouldn't use this skill) or an audit that failed. Re-scan before
   declaring PASS with zero findings.
5. **Never scope-creep.** The audit surface is the closed set from Phase 1. Adjacent
   improvements go to separate Issues, not tacked onto the audit output.
6. **Evidence symmetry.** Every claim YOU make in the audit (RED, YELLOW, GREEN) is held to
   the same verification bar as the target's claims. A GREEN finding without cited evidence
   is as invalid as a RED finding without evidence.

---

## Failure mode library (recognize + defend)

Drawn from PR #73 rounds 1–11. Future auditors should pattern-match against these:

1. **Drift-family patching.** Audit names finding family A. Claude patches A, pushes. Next
   audit round surfaces family B (adjacent, untouched, same audit packet). Rounds repeat.
   **Defense:** Phase 2 step 7 (contradiction grep across ALL drift families in the closed
   set, one commit fixes all).
2. **"Out of scope, separate PR" on a rule-doc finding.** Same failure as #1 — Codex will
   re-find whatever remains on the next round because it's the same audit packet. Do not
   defer within a closed-set scrub.
3. **Byte vs render blindness.** Auditor reads rendered terminal output; two terminals
   render same bytes differently; parser contract built on unstable glyph breaks silently.
   **Defense:** Phase 4 when the contract depends on non-ASCII bytes.
4. **Individually-true contradiction.** Claim A verified ✓, Claim B verified ✓, A+B
   together don't work. Round 3 passes; rival catches on round 4. **Defense:** Phase 3.
5. **Unverified plan item laundered as "known fact."** Audit target says "regex X matches Y"
   from memory; Y shape assumed, not tested. **Defense:** Phase 5 + require captured
   command output.
6. **Audit accepts everything to avoid conflict.** An audit that finds nothing is almost
   never a clean artifact; it's usually an audit failing. **Defense:** Hard rule #4.
7. **Audit invents a citation to sound thorough.** "Per the pilot memo §X" where §X doesn't
   exist. **Defense:** Hard rule #1.

---

## Integration with sibling skills

- **`adversarial-defender`** — live defender in a multi-model loop. Use AFTER this skill
  has produced the baseline audit; defender responds to rival attacks with `plan_diff`.
- **`adversarial-review`** — generates the rival's ATTACK prompt for ChatGPT/Gemini. Pair
  with this skill: adversarial-review → external rival produces attack → defender runs this
  skill to run the factual audit, then shifts to adversarial-defender to respond live.
- **`prompt-auditor-pass`** — audits a prompt's structure (does it produce good output).
  This skill audits a PLAN's substance (is what it claims true). Different surfaces.
- **`/hostile-migration-audit`** — domain-specific TBM migration plan audit. Bakes in the
  canonical migration rubric. Use for migration plans specifically; use this skill for
  general plan/spec/PR audits.

---

## Invocation

- `/codex-audit #N` — audit Gitea PR N against this skill's procedure
- `audit this research spec` — audit a pasted or linked spec
- `attack audit on {artifact}` — synonymous

Expected runtime: proportional to closed-set size. A 2-file PR audit: 10–20 minutes. A
rule-doc PR touching CLAUDE.md + AGENTS.md + WORKFLOW.md: 45–90 minutes (every self-claim
across 3 long files enumerated + verified).

---

TACT canon rooted in Global Memory (`notion.so/2c2cea3cd9e8815bae35d37dbb682cee`). This
skill implements the operational form: Truth = verify each claim, Authenticity = match the
shape LT's audits take (not generic review), Clarity = structured output matching the RED
/ YELLOW / GREEN format with attribution.
