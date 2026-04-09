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

```
1. Codex reviews a PR, posts findings as inline comments
2. For each blocker finding, Codex also opens Issue with kind:bug + severity:blocker
3. The Issue body references the PR comment URL
4. If the PR merges without fixing, the Issue stays open and blocks downstream work
5. Fix comes as a follow-up PR closing the Issue
```

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

_Last updated: 2026-04-09 — initial version authored by Opus following LT's "stop underutilizing the tools" direction._
