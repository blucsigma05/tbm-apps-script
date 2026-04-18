# TBM Workflow — Issues, PRs, and the Project Board

This is the full reference for how work flows through TBM. CLAUDE.md has the rules; this file has the reasoning and examples.

**TL;DR:** Every tracked unit of work is an Issue. PRs close Issues. Chat is transient. The Project board answers "where are we?" — you should never have to ask.

---

## Why this exists

TBM is run by one human (LT) with 3 AI collaborators (Opus for design, Sonnet for implementation, Codex for review). Without structure, work lived in chat:

- Sonnet got prompts by copy-paste
- Decisions sat in PR comments scattered across 5 PRs
- "Where are we on the audio bug?" had to be reconstructed from conversation
- Blocking Codex findings could vanish when a PR merged

This workflow replaces all of that with GitHub primitives: Issues, PRs, labels, and the Project board.

---

## The three-level hierarchy

```
Epic      → long-running initiative (months to quarters)
  Issue   → one tracked unit of work (spec, bug, decision, task)
    PR    → the code or spec file that closes an Issue
```

**Examples from the repo as of 2026-04-09:**

- `#107 Orchestration Loop` — epic with phases shipped in #113, #114, and #111 (Phase 3 open)
- `#130 Audio race — voice switching Nia/robot` — bug issue, will be closed by a PR from Sonnet
- `#133 Implement JJ Completion Contract Phase 1` — task issue, references `specs/jj-completion-contract.md`
- `#132 INCONCLUSIVE downgrade vs CLAUDE.md` — decision issue blocked on LT

---

## The six label families

### `kind:` — what the work IS

| Label | When to use | Example |
|-------|-------------|---------|
| `kind:spec` | Design doc that needs alignment before code | "JJ Completion Contract data model" |
| `kind:bug` | Something is broken or wrong | "Audio race — voice switching" |
| `kind:task` | Actionable work that isn't a bug or spec | "Wire up QA operator mode backend" |
| `kind:decision` | Question requiring LT input | "Ring dedupe — daily cap or per-run?" |
| `kind:epic` | Multi-issue initiative | "Orchestration Loop" |

### `severity:` — how urgent (existing Codex label scheme, reused)

| Label | When to use |
|-------|-------------|
| `severity:blocker` | Must fix before merge / prod risk |
| `severity:critical` | Should fix before merge |
| `severity:major` | Fix recommended |
| `severity:minor` | Noted, non-blocking |

### `model:` — who is working on it

| Label | Agent responsibility |
|-------|---------------------|
| `model:opus` | Design, architecture, specs, audits |
| `model:sonnet` | Implementation, builds, fixes |
| `model:codex` | PR review, security audit |
| `model:lt` | Only LT can do this (e.g., set Script Properties, approve deploys) |

### `needs:` — what's blocking progress

| Label | Meaning |
|-------|---------|
| `needs:lt-decision` | Blocked on a call from LT |
| `needs:implementation` | Approved, ready to build |
| `needs:review` | Awaiting review |
| `needs:qa` | Built and awaiting device QA |
| `needs:spec` | Work cannot start until a spec is written |

### `area:` — which part of the system

| Label | Scope |
|-------|-------|
| `area:jj` | JJ surfaces — Sparkle Kingdom, JJHome, pre-K education |
| `area:buggsy` | Buggsy surfaces — Wolfdome, homework, Wolfkid |
| `area:finance` | TBM finance — ThePulse, TheVein, debt engine, Tiller |
| `area:infra` | CI/CD, workflows, hot files, deploy pipeline |
| `area:qa` | QA harness, smoke/regression, test infrastructure |
| `area:education` | Cross-cutting education — both kids, curriculum, content |
| `area:shared` | Shared surfaces/components affecting multiple areas |

### `status:` — spec lifecycle only

| Label | Meaning |
|-------|---------|
| `status:draft` | Spec being drafted |
| `status:approved` | Spec approved, ready for implementation |
| `status:implementing` | Currently being built |
| `status:shipped` | Implementation merged and deployed |

---

## The Project board

One board named **TBM Operations** with the following columns:

```
┌────────────┬──────────────────┬───────┬──────────────┬────────────┬──────┐
│  Backlog   │  Needs Decision  │ Ready │ In Progress  │ In Review  │ Done │
└────────────┴──────────────────┴───────┴──────────────┴────────────┴──────┘
```

Cards move based on labels and PR state:

- **Backlog** — Issue opened, not yet triaged or assigned
- **Needs Decision** — has `needs:lt-decision` label
- **Ready** — has `needs:implementation`, waiting for an agent to pick up
- **In Progress** — has an open PR or `status:implementing`
- **In Review** — PR has `needs:review` or is waiting for Codex / CI
- **Done** — Issue closed or PR merged

**Single-glance rule:** opening the board answers "where are we?" for every tracked unit of work. You never ask in chat.

---

## Standard flows

### Flow 1 — New feature or change (non-trivial)

```
1. Open Issue with kind:spec (if design decision needed) OR kind:task (if no design needed)
2. Labels: kind:*, severity:*, area:*, model:opus (for specs) or model:sonnet (for tasks)
3. Claude drafts spec → spec PR → merge → spec Issue closes
4. Implementation Issue opens with kind:task, model:sonnet, needs:implementation
5. Sonnet picks up → branch → code → PR with "Closes #NNN"
6. Codex reviews → CI passes → merge → Issue auto-closes
```

### Flow 2 — Bug report

```
1. Open Issue with kind:bug
2. Body includes: reproduction steps, file paths + line numbers, expected vs actual
3. Labels: kind:bug, severity:*, area:*, model:sonnet (or model:codex if review-pipeline bug)
4. Sonnet fixes → PR → "Closes #NNN" → merge
```

### Flow 3 — Decision needed from LT

```
1. Open Issue with kind:decision, needs:lt-decision
2. Body: the question + my recommendation + trade-offs
3. Card lands in "Needs Decision" column
4. LT comments with the answer
5. Claude closes the Issue with a "Resolution" comment summarizing the decision
6. If the decision changes a spec file, a follow-up PR updates the spec
```

### Flow 4 — Codex PR audit with findings

Two paths, both producing durable Issues. They differ in trust domain and dedup mechanism — do not merge them.

```
1. Codex (auto or manual) reviews a PR, posts findings

2a. AUTO path — bot comment with <!-- codex-review-report --> JSON:
    codex-pr-review.yml posts the review comment, then its INLINE filer step
    (run in the same job) invokes file_codex_review_findings.py
      -> parses the review-report.json produced by codex_review.py
      -> per blocker/critical finding, invokes file_hygiene_issue.py subprocess
      -> claude:inbox Issue filed (signature dedup on rule+file+evidence_hash+pr)
    Inline rather than a separate issue_comment-triggered workflow because
    GITHUB_TOKEN-authored events don't trigger other workflow runs (see #456).
    Kill switches: AUTOMATION_ENABLED, CODEX_REVIEW_FILER_ENABLED,
                   CLAUDE_INBOX_MAJOR_ENABLED.

2b. MANUAL path — whitelisted human posts "Codex finding: FIX/HOLD/BLOCK":
    codex-finding-listener.yml (fires on issue_comment / review / review_comment)
      -> parse_finding_comment.py (authors: blucsigma05, chatgpt-codex-connector)
      -> applies pipeline:* labels, files severity:blocker Issues via _finding_dedup.py
         (comment-ID dedup)
    Kill switches: AUTOMATION_ENABLED, CODEX_BLOCKER_AUTOFILE_ENABLED.

3. Issue body includes exact PR-comment URL and a ## Build Skills section
4. If the PR merges without fixing, the Issue stays open and blocks downstream work
5. Fix comes as a follow-up PR closing the Issue (builder lane = model:sonnet default)
```

**Dedup semantics.** Re-reviews or comment edits on the same PR hitting the same
underlying finding dedup to the same Issue signature. Open matches no-op;
recent closed matches (≤7 days) reopen; no duplicate Issue is ever created.
See `file_hygiene_issue.py:307–342` for the authoritative flow.

**Auto-close semantics (Phase 2, #462).** When a re-review runs through the
AUTO path and a previously-filed finding is no longer in the current findings
list (fix landed, signature gone), the filer closes the corresponding Issue
with `auto-close:resolved` + a closing comment citing the current review URL.
PASS verdict closes ALL filed Issues for the PR (no findings → everything
resolved). INCONCLUSIVE never touches existing Issues (unknown state).
`auto:suppressed` Issues (LT manually dismissed) are never touched by either
reopen or auto-close. If a fix is reverted within 7 days, the next review
will re-open the Issue via the existing recent-closed reopen path — so the
fix-and-regression case is covered.

**INCONCLUSIVE verdicts** (Codex CI truncated or errored) do NOT create
Issues — they stay on the PR-check state surface handled by `review-watcher.js`.
LT resolves them via a manual `audit N` in ChatGPT or an explicit waive.

---

## Forbidden patterns

These are all symptoms of "work drifting back into chat." Don't do them:

1. **"Where are we on X?"** answered with a chat summary. Correct: "Check the Project board" or "Check Issue #NNN."
2. **Opening a PR without a linked Issue.** Every PR closes an Issue. Exception: trivial one-line fixes (typos, comment tweaks).
3. **Handing an AI agent a prompt via copy-paste.** Correct: open an Issue with the prompt in the body, assign via label.
4. **Letting a decision live in PR comments.** Decisions are Issues. PR comments are evidence.
5. **`needs:lt-decision` on a PR.** Decisions live on Issues. Move the decision to an Issue, then the PR can pick up the decided answer.
6. **Asking LT to reply in chat with an answer.** The answer goes in the Issue comment so it's findable later.

---

## Naming rules

- **PR and Issue confusion:** If LT says "PR" but means "Issue" (or "PO" as a common typo), Claude MUST redirect once: "You said PR — did you mean the Issue, or is this actually a code change?" One confirmation, no back-and-forth. If ambiguous, default to Issue.
- **Spec files live at `specs/<kebab-case>.md`.** File name matches the topic (e.g., `jj-completion-contract.md`, not `spec-124.md`).
- **Branch names:** `claude/<short-topic>` for Claude branches, `codex/<short-topic>` for Codex branches, `<feature>/<short-topic>` for general work.
- **Issue titles:** imperative mood when possible ("Implement JJ Completion Contract Phase 1"), descriptive for bugs ("Audio race — voice switching Nia/robot").

---

## Integration with existing systems

- **Pushover notifications:** fire on terminal PR states (ready/stalled) via orchestration loop Phase 1. Issues don't notify by default.
- **Codex PR review:** runs on every PR, posts findings as comments and applies `pipeline:*` labels. Blocker Issues are **not** auto-created — finding comments must be triaged manually and filed as Issues when the PR closes without resolution. (Future: auto-open blocker Issues from `codex-finding-listener.yml`.)
- **Branch hygiene:** `audit-source.sh` staleness gate catches PRs behind `origin/main` before push
- **Pipeline labels:** `pipeline:ready` / `pipeline:fix-needed` / `pipeline:waiting` / `pipeline:stalled` are set by the orchestration loop, not by humans
- **Notion:** project memory + thread handoffs stay in Notion as LT's long-form context. GitHub Issues are the operational layer.

---

## What this replaces

Before: chat-centric work tracking, PR comments as decision records, manual status polling.

After: Issue-centric work tracking, Project board as the single dashboard, PRs close Issues and trigger notifications. Chat is for exploration and questions, not tracked work.

The rule that makes this stick: **if Claude tells LT a thing will happen, the Issue exists in the same breath. No "I'll write a prompt for Sonnet" without also opening the Issue.**

---

## Getting started (first session using this)

1. Make sure all labels exist (they do as of 2026-04-09 — see `gh label list`)
2. Create the Project board manually in GitHub UI: Projects → New project → Table or Board layout → name "TBM Operations"
3. Add the six columns (Backlog, Needs Decision, Ready, In Progress, In Review, Done)
4. Add all open Issues and open PRs as cards
5. Check the board first thing each session. Fix any stale labels or missed routing.

---

## Two-Lane Handoff Rules

**What this is.** TBM runs on one shared repo with two distinct roles. Builders and auditors do NOT share authority — they share filesystem only. This section is the canonical, detailed home for the rules. Short rule mirrors live in `AGENTS.md § Two-Lane Roles` and `CLAUDE.md § Two-Lane Roles`; this is where the nuance, examples, and command contract live.

### Role boundaries

- **Builder lane** — Claude / Opus / Sonnet. Owns scoping, specs, implementation, bug fixes, and the PR.
- **Audit lane** — Codex. Inspects ONE named PR or ONE named current state as an independent reviewer. Does not continue the builder's train of thought; does not silently extend scope.
- **LT (operator)** — names the work in plain English, reviews results, approves or redirects. Does not own git terminology.

### Plain-English command contract

LT speaks in plain English. Agents translate to repo state. The contract:

| LT says | Audit lane reads this as |
|---|---|
| `audit 443` | PR #443 at its current HEAD. Nothing stacked, nothing nearby. |
| `re-audit 443` | PR #443 at its newest HEAD. Treat all prior findings as potentially stale until re-anchored. |
| `audit the latest version of 443` | Same as `re-audit 443`. |
| `audit only this PR` | The PR currently under discussion. Scope = that PR alone. |
| `audit 443 stacked` | PR #443 plus the branches/PRs it explicitly depends on. |
| `audit 443 after 444 lands` | PR #443, but wait until #444 is merged so the base is stable. |
| `ignore the old review and check what it is now` | Drop prior findings; re-anchor to current state. |

If LT's phrasing does not match a row above, ask a single-sentence clarifying question. Do NOT guess stacked scope.

### Audit scope rules (MANDATORY)

- A PR audit is ONE inspection packet for ONE job. Review the named packet, not nearby work.
- Ambient repo clutter (`.claude/`, `.agents/`, scratch files, nearby branches, unrelated worktrees) is context only, not audit scope.
- Separate three things explicitly in any finding: code bug, PR-description drift, environment limitation. Do not collapse them into one.
- If a prior finding may already be fixed, re-anchor to the current named PR state before repeating it.

### Boardroom conversations become operating memos

Not every important conversation is code work. Architecture, process, role boundaries, workflow changes, and team operating decisions are boardroom conversations. Raw chat is NOT the system of record for these.

**Trigger phrases LT uses to promote a conversation to a memo:**

- `make an operating memo`
- `turn this into a boardroom summary`
- `promote this to policy`
- `capture this decision`
- `make this a process rule`

**When any trigger fires, agents must:**

1. Draft a memo in `ops/operating-memos/YYYY-MM-DD-<topic>.md` using `ops/operating-memo-template.md`.
2. Include `## Canonical Rule Location` pointing at where the rule lives (usually this file or `AGENTS.md` / `CLAUDE.md`).
3. Include `## What Stays Flexible` naming the parts that are intentionally not rules (wording, per-PR context, timing).
4. If the memo creates actual work, open the follow-up Issue(s). Do not bury action items in the memo body.
5. If the memo changes repo behavior, mirror the short rule into `AGENTS.md` and `CLAUDE.md` (hard rules only - nuance stays here).

### Thread continuity and auditor's pass

Threads are disposable. Durable work is not.

When LT says any version of:

- `make this permanent`
- `save this for the next thread`
- `make this a template`
- `make this a standard`
- `make this a skill`
- `give me an auditor's pass`

agents must treat that as an instruction to do more than answer in chat.

**Continuity rule:**

- If the next thread will need it, save it in the same thread.
- Name the exact durable file path in the final handoff.
- If the process is reusable, promote it immediately into the right repo artifact instead of leaving it as chat-only know-how.

**Promotion targets:**

- Reusable execution behavior -> repo-local skill in `.claude/skills/`
- Repo workflow or policy rule -> this file, with short mirrors in `AGENTS.md` and `CLAUDE.md`
- Boardroom/process decision -> `ops/operating-memos/YYYY-MM-DD-<topic>.md`
- One-off next-thread prompt or handoff brief -> `ops/thread-handoffs/YYYY-MM-DD-<topic>.md`

**Auditor's pass rule:**

- Before handing off a reusable prompt, plan, template, memo, or handoff artifact, run a real self-audit.
- Define the rubric before giving a score.
- Tie every material criticism to evidence, omission, or a concrete contract gap.
- Revise the artifact after the audit instead of handing over the first draft plus commentary.
- If the user asks for a 10/10, push to the strongest defensible version and state what still prevents 10/10 if anything remains.

**Anti-theater rule:**

- No bare `6.5/10` or `9/10` without visible criteria.
- No "auditor's pass" that is just opinion dressed as rigor.
- If a required source artifact is missing, stop and say so plainly.

### Handoff comments (optional aid)

The Issue and the Project board are the canonical status surface. A handoff comment on a PR is an OPTIONAL aid, not a status layer.

**Use `<!-- tbm-handoff -->` markers when:**

- A PR changes hands mid-flight (builder → builder, or builder ↔ auditor for a specific round trip).
- A PR is paused with a clear next action that the next owner needs named.

**Marker contract:**

- At most ONE active `<!-- tbm-handoff -->` comment per PR.
- Edit in place when state changes. Do NOT append a new comment for each update — that reintroduces the mandatory-status-layer problem.
- The template lives at `.github/PR_COMMENT_TEMPLATES/handoff.md`. Copy-paste into a new PR comment when needed.
- Inline PR review comments remain the evidence. Handoff comments do NOT replace findings.
- Decision records belong on Issues with `kind:decision`, not in transient PR summaries or handoff comments.

### Cross-references

- Short rule mirrors: `AGENTS.md § Two-Lane Roles` and `CLAUDE.md § Two-Lane Roles` (identical ~12-line blocks, hard rules only).
- Visual companion: `ops/diagrams/two-lane-model.md` (Mermaid diagram + house/contractor legend).
- Seed example operating memo: `ops/operating-memos/2026-04-17-agent-roles-and-audit-scope.md`.
- Shared-workspace hygiene baseline (worktree rules, scratch-dir policy, branch-prune cadence): follow-up Issue #446.

---

_Last updated: 2026-04-18 - added thread continuity and auditor's pass rules per operating memo `ops/operating-memos/2026-04-18-auditors-pass-and-thread-continuity.md`._
