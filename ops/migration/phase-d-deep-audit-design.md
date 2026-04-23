# Phase D — Deep-Audit Escalation Lane (DESIGN)

**Status:** Design only (2026-04-19). No code, no workflow changes in
this artifact. Issue tracker: Gitea Issue
[#2](https://git.thompsonfams.com/blucsigma05/tbm-apps-script/issues/2).

> ⚠️ **OPEN QUESTIONS BLOCKING RUNNER WIRING** (as of 2026-04-22, confirmed via Wave 0 Item Ψ):
>
> - **Q3** — Gitea branch-protection boolean-OR support for the merge-gate shape `(A success) OR (B success AND A != FAIL)`. Empirical test on Gitea 1.24.6 **NOT DONE**. Blocks Milestone 2 (merge-gate). See § 8 Q3.
> - **Q9** — Codex CLI headless invocation feasibility on `tbm-runner-1` (model name, auth flow, deterministic-output flag, error codes). Empirical check **NOT DONE**. Blocks Milestone 1 (runner) only in the sense that it determines primary vs fallback provider; if Q9 fails the runner ships with Anthropic API as primary. See `ops/migration/phase-d-q9-codex-cli-verification.md` and § 8 Q9.
>
> Do NOT wire the runner or merge-gate against the placeholders (`codex-cli-reasoning`, `DAILY_COUNT_FILE=/var/lib/codex/daily-count.txt`) without resolving the corresponding open question first. Canonical phase-status index: [`ops/PHASES.md`](../PHASES.md).

**Scope:** Auto-escalate `INCONCLUSIVE` verdicts from the shallow
Codex PR review (`gpt-4o`, hunk-context) into a deeper audit lane
backed by a stronger model, fed more context, so LT no longer
manually bypasses the INCONCLUSIVE gate with `audit-pass`.
**Prereq:** Phase C complete — control plane live at
`tbm-cp-events.lthompson.workers.dev`, Gitea live at
`git.thompsonfams.com`, shallow Codex review proven on PR #1.
**Extends:** `ops/migration/control-plane-architecture.md`.

---

## 30-second read

Today: shallow review returns `INCONCLUSIVE` → merge is blocked →
LT manually applies `audit-pass` label to force-green the check.
That's a manual-bypass escape hatch, not a review lane.

Phase D: `INCONCLUSIVE` auto-applies a `deep-audit-needed` label →
worker fans out to a deep-audit job → deep audit either upgrades the
verdict to `PASS` (merge-gate unblocks) or to `FAIL` (blocks for
real, with evidence from a stronger model). The WQ row is the audit
trail; new states `DEEP-AUDIT-PENDING` and `DEEP-AUDIT-RUNNING`
capture the lane so it's not invisible.

LT's only manual path in Phase D is `audit-pass` after a `FAIL` from
deep audit — that's a genuine policy override, not a gap-papering.

---

## 1 — WQ state machine

The shallow review ↔ deep-audit loop lives ENTIRELY inside the
existing `REVIEW-PENDING → REVIEW-PASSED | REVIEW-FAILED` transition.
The new states are a sub-lane that a `REVIEW-PENDING` row can enter
when the shallow reviewer returns `INCONCLUSIVE`, and the exits
dead-end back into the existing matrix at `REVIEW-PASSED` (clean) or
`REVIEW-FAILED` (needs fixes).

### New states

| State | Meaning | Who owns it |
|---|---|---|
| `DEEP-AUDIT-PENDING` | Shallow review returned INCONCLUSIVE; label applied; deep-audit job queued but not yet started. | `tbm-bot` |
| `DEEP-AUDIT-RUNNING` | Deep-audit job picked up and executing (model call in-flight). | `tbm-bot` |

### ASCII transition diagram (additions only)

```
                REVIEW-PENDING
                     │
          shallow review runs
                     │
        ┌────────────┼────────────┐
        │            │            │
       PASS         FAIL      INCONCLUSIVE
        │            │            │
        ▼            ▼            ▼
  REVIEW-PASSED  REVIEW-FAILED  DEEP-AUDIT-PENDING  ◄── NEW
                                     │
                            (deep-audit runner claims)
                                     │
                                     ▼
                              DEEP-AUDIT-RUNNING   ◄── NEW
                                     │
                              (deep-audit returns)
                                     │
                         ┌───────────┼──────────────┐
                         │           │              │
                        PASS        FAIL      INCONCLUSIVE
                         │           │              │
                         ▼           ▼              ▼
                   REVIEW-PASSED  REVIEW-FAILED   BLOCKED
                                               (failure_category=
                                                technical,
                                                exception_owner=
                                                tbm-bot, then
                                                escalates to LT
                                                per §E.5 age
                                                cutoff if
                                                unresolved)
```

### New edges for `state-matrix.js`

```
'REVIEW-PENDING':     [..., 'DEEP-AUDIT-PENDING', ...]   // add DAP
'DEEP-AUDIT-PENDING': ['DEEP-AUDIT-RUNNING', 'BLOCKED']  // NEW row
'DEEP-AUDIT-RUNNING': ['REVIEW-PASSED', 'REVIEW-FAILED',
                       'BLOCKED']                         // NEW row
```

BLOCKED is universally allowed from both new states (consistent
with the `BLOCKED` invariant from §E.11). No other state may
transition directly into the deep-audit lane — for trigger α the
lane opens only on a shallow reviewer `INCONCLUSIVE`; for trigger β
(spec-stage) the lane opens from `READY-TO-BUILD` when the
`deep-audit-spec` Issue label is applied.

### Why not just cycle through REVIEW-PENDING twice?

Because the WQ row then can't answer the question "is a deep audit
actually running on this row right now, or are we waiting for the
shallow reviewer?" Cost, runtime, and concurrency behavior differ
by an order of magnitude between the two. Making the lane
inspectable is the whole reason this is a state-machine change
instead of a workflow-internal loop.

---

## 2 — Notion schema additions

### New `state` select options

Two new options added to the existing `state` select column:

- `DEEP-AUDIT-PENDING`
- `DEEP-AUDIT-RUNNING`

Exact strings. Case-sensitive. Dashes, not underscores (matches the
existing `READY-TO-BUILD` / `REVIEW-PENDING` / `READY-FOR-APPROVAL`
convention).

### New columns

| Column | Type | Purpose | Writer |
|---|---|---|---|
| `deep_audit_verdict` | `select` with options `PASS` / `FAIL` / `INCONCLUSIVE` / `ERROR` | Final deep-audit result. `ERROR` = job crashed / timed out / cost-capped. | worker |
| `deep_audit_model` | `rich_text` | Which model ran the deep audit (e.g. `codex-cli-reasoning`, `claude-opus-4-7`). Captures provider + model over time as choices drift. Exact Codex CLI model string TBD pending Q9. | worker |
| `deep_audit_cost_usd` | `number` | Dollar cost of the deep-audit call. **`0.00` (not null) when `provider=codex`** — flat subscription cost, no per-call dollar amount, but field populated explicitly to avoid null-handling edge cases in cost-cap rollup. | worker |
| `deep_audit_started_at` | `date` | Timestamp of DEEP-AUDIT-PENDING → DEEP-AUDIT-RUNNING transition. Used to detect runaway jobs. | worker |
| `deep_audit_comment_url` | `url` | Direct link to the deep-audit comment — PR comment for trigger α, Gitea Issue comment for trigger β. | worker |

### Reused columns (no schema change)

- `last_event_reason` — audit-trail line on every transition, same
  pattern as today (e.g. `"shallow=INCONCLUSIVE; dispatching deep audit"`,
  `"deep=PASS (codex-cli-reasoning, 52s, $0.00); merge unblocked"`,
  `"deep=PASS (claude-opus-4-7, 47s, $0.18); merge unblocked"`).
- `failure_category` + `blocked_reason` + `exception_owner` — only
  populated on the `BLOCKED` exit from `DEEP-AUDIT-RUNNING` (see §7).
- `claimed_by` + `claim_expires_at` — the deep-audit runner claims
  the row on `DEEP-AUDIT-PENDING → DEEP-AUDIT-RUNNING` with a claim
  horizon generous enough for a slow model call (see §4 runtime
  expectation). Heartbeat watcher (§E.4) reclaims expired claims
  back to `DEEP-AUDIT-PENDING` (not `READY-TO-BUILD`) — implemented
  via `clearClaim(reclaimTarget='DEEP-AUDIT-PENDING')` per Q6
  resolution (§8). Backward-compatible default of `READY-TO-BUILD`
  preserved for all non-deep-audit callers.

### `exception_owner` mapping

Deep-audit `ERROR` outcomes map to `failure_category=technical`,
`exception_owner=tbm-bot` per §E.5 Invariant 2. LT is only paged by
the existing escalation watcher if the bot can't resolve within the
24h cutoff.

---

## 3 — Trigger paths

Phase D v1 supports three trigger paths into the deep-audit lane.
Two are automated (α, β); one is explicitly deferred (γ).

### Trigger α — PR INCONCLUSIVE (original path)

`deep-audit-needed` label applied by the shallow-review workflow on
INCONCLUSIVE. Removed by the deep-audit workflow when it completes
(regardless of verdict). A second label `deep-audit-running` is
applied during the job and removed on completion — makes the
in-flight state visible in the Gitea PR UI even if someone's not
watching the WQ row.

**Who applies the label:** Workflow-side, not worker-side. Reasons:

1. The shallow-review workflow is already the thing that generates
   the verdict and has PR-write permissions via `GITEA_TOKEN`. It
   already applies `severity:*` and `type:*` labels today — adding
   `deep-audit-needed` is a one-line addition to the same step.
2. Doing it worker-side means the worker has to poll or receive a
   webhook for every review completion and then reach BACK into
   Gitea to label the PR — that's three network hops where one
   would do, and introduces a race between the label and the PR
   being merge-gated on the stale check.
3. Shallow-review workflow already runs inside Gitea Actions with
   the runner's network identity. No cross-system auth to arrange.

`pull_request_target` event with `action=labeled` and
`label.name=deep-audit-needed`. The deep-audit workflow listens
for exactly that event. This is the same pattern Gitea already
uses for the `audit-pass` manual-override label today — proven
trigger path.

**Worker involvement:** The worker gets notified by the Gitea
webhook (`pull_request` with `action=labeled`), which already
routes through `/events/forge/gitea` (stub → live as of Phase C,
`8e87f4f5-fc3e-442e-aac8-452137638fdc`). The worker's job on
receiving this specific label-add event:

1. HMAC-verify (already wired).
2. Look up the work_id for this PR via the Notion `pr_url` column,
   reverse-mapped on webhook receipt (see §8, Q2 — RESOLVED).
3. POST a signed `target_state=DEEP-AUDIT-PENDING` event to its own
   `/events/notion` handler. Gives us the audit trail + transition
   validation for free. Idempotency key = `deep-audit-trigger-<pr-sha>`.

Worker does NOT dispatch the deep-audit job itself. Job dispatch
lives in the deep-audit workflow, which is triggered directly by
the Gitea label-add event (step above runs in parallel — worker's
job is WQ bookkeeping, workflow's job is running the audit).

### Trigger β — spec-stage audit (pre-build)

Codex reviews an Issue/spec doc **before** any build begins.
Invoked by the `deep-audit-spec` label on a Gitea Issue (not a
PR). Intended to surface INCONCLUSIVE verdicts on specs where LT
has historically seen ambiguous designs on large files.

- **What gets reviewed:** the Issue body + any linked spec
  documents (fetched via Gitea API by the workflow). No diff
  exists yet — the audit runs against the spec text as written.
- **WQ behavior:** No PR exists, so there is no PR comment to post.
  Instead the workflow posts a comment directly to the Gitea Issue
  and writes the verdict to the WQ row's `deep_audit_verdict` +
  `last_event_reason` columns (keyed by the Issue's linked
  `work_id`). The `deep_audit_comment_url` column points to the
  Issue comment URL.
- **State transitions:** WQ row follows the same
  `DEEP-AUDIT-PENDING → DEEP-AUDIT-RUNNING → [verdict]` path.
  On PASS the row returns to its pre-audit state (typically
  `READY-TO-BUILD`). On FAIL the row transitions to `BLOCKED`
  with `failure_category=policy, exception_owner=LT` — spec must
  be revised before build starts.
- **Trigger endpoint:** `POST /events/audit/spec-start` (NEW — see
  §6). Worker route symmetric to `deep-start` but keyed by
  `issue_number` rather than `pr_number`.

### Trigger γ — pre-PR file audit (during build)

Running `codex_review` against existing files while the work item
is in `BUILDING` state — no diff exists yet, but LT wants early
signal on large or complex files before the first PR lands.

**STATUS: DEFERRED to v2.** Rationale: the α + β paths cover the
historical INCONCLUSIVE pattern. γ introduces scope during the
build lane (no clear event trigger, would require manual invocation
or a cron sweep) and LT wants empirical data from α/β first.

### Trigger γ — manual on-demand

**STATUS: DEFERRED to v2.** Not v1.

---

## 4 — Deep-audit execution

### Model architecture

Phase D uses a **two-provider architecture** controlled by the env
var `DEEP_AUDIT_PROVIDER` (values: `codex` | `anthropic`, default
`codex`). The runner reads this var at workflow start and routes the
model call accordingly. Both providers share the same prompt design
and JSON-schema output contract.

### Model choice — primary (`DEEP_AUDIT_PROVIDER=codex`)

**Codex CLI via LT's ChatGPT subscription, running headless on
`tbm-runner-1`.** Rationale:

1. **Zero incremental API cost** — runs under LT's existing flat
   subscription. Monetary cost cap in §7 only fires on the
   Anthropic path.
2. **Same-vendor, different-tier reasoning.** Shallow review uses
   `gpt-4o` (hunk-context). Codex CLI's reasoning model is a
   different capability tier on the same platform — architectural
   independence without introducing a second vendor dependency for
   the primary path.
3. **Preserves optionality ("setup for tomorrow not just today").**
   The two-provider switch makes future primary/fallback swaps a
   one-var change, not a rewrite.
4. **Headless invocation** on `tbm-runner-1` is pre-established
   runner territory — same host as Gitea, same runner auth model.

**NOTE — Q9 is open (see §8):** exact Codex CLI model name in LT's
subscription tier, auth flow for headless runner invocation,
deterministic output mode, and error codes must be empirically
verified before the first automated deep-audit run. Do not build
the workflow runner integration until Q9 is resolved.

### Model choice — fallback (`DEEP_AUDIT_PROVIDER=anthropic`)

**Claude Opus 4.x (1M context).** Activated when:

a. Codex CLI is unavailable or returning errors (automatic
   failover within the workflow — detect on non-zero exit / timeout).
b. LT explicitly wants a cross-vendor second opinion on a specific
   audit (set `DEEP_AUDIT_PROVIDER=anthropic` manually before
   triggering, or via the `audit-provider` label override — design
   TBD, not v1 scope).
c. A future tool or integration specifically requires Claude (e.g.,
   tool-use features not available in Codex CLI).

Opus rationale (unchanged from original design):

1. 1M-context window removes hunk-context fallback entirely.
2. Tool-use + structured output — drop-in on output side.
3. CTO/governance model per Global Memory — consistent authority
   boundary for cross-vendor second opinions.

The previous fallback model (`o1-preview`) is removed. The Codex
CLI primary IS OpenAI's reasoning tier. Falling back to OpenAI
within OpenAI adds no cross-vendor signal — use Anthropic instead.

### Prompt design

Full-branch diff (not incremental). Re-reviewing the whole PR as
one unit — incremental review is what the shallow reviewer already
did and failed to conclude. Deep audit treats the PR as a single
artifact. The same prompt + context block structure applies to both
providers; the workflow assembles the payload, then routes it to
either Codex CLI or the Anthropic API depending on
`DEEP_AUDIT_PROVIDER`.

**Context blocks, in order:**

1. Architecture primer — copied verbatim from `codex_review.py`
   SYSTEM_PROMPT "ARCHITECTURE" section (TAB_MAP, ES5-in-HTML,
   SSID, google.script.run) + appended block for §E.11 state
   matrix, §E.5 ownership table, and the §E.12 adapter contract.
2. Shallow-review transcript — the `INCONCLUSIVE` verdict JSON, the
   truncation notes, the rubber-stamp-reason if one fired. Tells
   deep auditor WHY shallow punted. (Trigger α only — omitted for
   spec-stage trigger β, where no shallow review ran.)
3. Full PR diff (uncapped). (Trigger α only — trigger β substitutes
   the Issue body + spec doc text.)
4. Full content of every changed file (not hunk context — full
   file, no truncation).
5. Full content of every related file (existing
   `get_related_files()` discovery — callers, consumers, pipeline
   siblings).
6. Full text of any `#N` Issue the PR closes (fetched via Gitea API).
7. Full text of the most recent 3 thread-handoff docs (from
   `ops/thread-handoffs/`) so the auditor has recent
   architectural context.

**Instruction scaffold (prompt skeleton, not production text):**

```
You are the DEEP AUDITOR for a TBM PR whose shallow review (gpt-4o,
hunk-context) returned INCONCLUSIVE. Your job is to produce a final
verdict: PASS, FAIL, or ERROR (if you hit something that genuinely
blocks review — e.g. the PR is binary-only).

You have full context — do NOT return INCONCLUSIVE for truncation
reasons. Truncation is not a valid deep-audit outcome.

Apply the full P1/P2 rule set from the shallow SYSTEM_PROMPT
(TAB_MAP, ES5-in-HTML, waitLock, version bumps, etc.). ALSO
evaluate:

- Architecture fit: does this PR respect the §E.11 state matrix
  and §E.12 adapter contract?
- Cross-file wiring: trace values end-to-end, not just within the
  diff hunks. Shallow reviewer was blind to full-file context; you
  are not.
- Latent regressions: does a change in a .gs file break any HTML
  surface that calls it?
- Spec conformance: does the PR do what the #N Issue actually
  asks for? Flag scope drift.

Return the same JSON schema as the shallow reviewer, plus two new
top-level fields:
  "audit_depth": "deep"
  "shallow_verdict_overturned": true | false
```

### Token budget + runtime

| Axis | Shallow | Deep (Codex CLI) | Deep (Anthropic fallback) |
|---|---|---|---|
| Model | `gpt-4o` | Codex CLI reasoning tier (see Q9) | `claude-opus-4-7` (1M) |
| Context cap | 140k chars | TBD pending Q9 | uncapped |
| Max output | 4k tokens | TBD pending Q9 | 16k tokens |
| Typical runtime | 5-15 s | TBD pending Q9 | 45-90 s |
| Runaway cutoff | 90 s | 300 s (workflow + claim horizon) | 300 s (workflow + claim horizon) |
| Expected cost | $0.02-$0.10 | $0 (flat subscription) | $0.30-$1.50 |
| Monthly cost cap | n/a | 20 runs/day (run-count cap) | 20 runs/day + $50/mo dollar cap |

---

## 5 — Result reporting

### Trigger α (PR INCONCLUSIVE) — separate PR comment

Rationale: the shallow comment is the evidence trail for why the
deep audit was triggered. Overwriting it loses that trail.

- Shallow comment stays put, with its `INCONCLUSIVE` verdict and
  truncation notes intact.
- Deep-audit comment is a NEW comment, marker
  `<!-- codex-deep-audit -->` (distinct from the shallow marker
  `<!-- codex-pr-review -->`), containing:
  - Header: `Deep Audit: PASS | FAIL | ERROR`.
  - Model used + runtime + cost (`$0` if Codex CLI primary path).
  - Link back to shallow comment (`#issuecomment-<id>` on the PR).
  - Full findings list (same JSON schema as shallow, embedded in
    `<!-- codex-deep-audit-report -->` fences for fix-agent
    consumption).
  - Explicit line: "This verdict SUPERSEDES the shallow review."
- Artifact retention: WQ row (`deep_audit_verdict` etc.) is
  permanent. PR comment is subject to 90-day auto-archive under
  Gitea's default retention (see §8 Q8 — RESOLVED).

### Trigger β (spec-stage) — Issue comment, no merge gate

No PR exists for a spec-stage audit, so there is no PR comment and
no merge-gate check-run to write.

- The workflow posts a comment directly to the Gitea **Issue** that
  triggered the audit. Same content structure as the PR comment
  (header, model, runtime, cost, findings), with the shallow-review
  link omitted (no shallow review ran).
- WQ row columns written: `deep_audit_verdict`, `deep_audit_model`,
  `deep_audit_cost_usd`, `deep_audit_started_at`,
  `deep_audit_comment_url` (pointing to the Issue comment URL).
- On **PASS**: WQ row transitions back to its pre-audit state
  (typically `READY-TO-BUILD`). `last_event_reason` logged.
- On **FAIL**: WQ row → `BLOCKED`, `failure_category=policy`,
  `exception_owner=LT`. Spec must be revised before build starts.
  Normal §E.5 escalation applies.
- On **ERROR**: same `BLOCKED/technical/tbm-bot` path as trigger α.
- No merge-gate check-run is written for β — there is no branch to
  gate. The Gitea Issue comment is the artifact.

### Merge-gate re-evaluation (trigger α only)

Gitea's merge gate is based on check-run statuses. The existing
shallow-review check (`Fail check on INCONCLUSIVE verdict`) stays
failed — we do NOT rewrite history by editing it. Instead we add a
SECOND check-run: `Codex Deep Audit`. Gitea's branch-protection
rule is updated so the gate is:

```
REQUIRED: (Codex PR Review == success)
      OR  (Codex Deep Audit == success AND Codex PR Review != FAIL)
```

Translation: a clean deep-audit PASS overrules an INCONCLUSIVE
shallow, but NEVER overrules an outright shallow FAIL. If shallow
said FAIL, deep audit cannot rescue — fix the code first.

**Note:** Gitea's branch-protection rule syntax may not support
boolean OR on required checks. If it doesn't, the fallback is a
single merged check-run `Codex Review (deep or shallow)` that the
deep-audit workflow writes the final status to. **See §8 open
question 3.**

### `audit-pass` label still works

LT's manual override is preserved. On `audit-pass` label add, BOTH
check-runs are marked success via workflow dispatch. Phase D
doesn't remove the escape hatch — it just makes the escape hatch
rare.

---

## 6 — Worker endpoint sketch

The worker does NOT execute the deep audit itself — Cloudflare
Workers have a 30-second CPU cap on the free plan and the bursty
inbound from Codex CLI/Anthropic is ill-suited for the Workers
runtime. The audit runs in the Gitea Actions runner (`tbm-runner-1`),
which is already where heavy jobs live.

The worker's role is limited to state-machine bookkeeping. New
routes:

### `POST /events/forge/gitea` (already exists — extended)

Extension: when payload `action === "labeled"` and
`label.name === "deep-audit-needed"`, the handler also dispatches a
synthetic `target_state=DEEP-AUDIT-PENDING` event to `/events/notion`.
`work_id` resolved via Notion `pr_url` column reverse-mapping (Q2,
RESOLVED).

No new route. Just an extra branch inside the existing Gitea handler.

### `POST /events/audit/deep-start` (NEW — trigger α)

Called by the deep-audit workflow when the runner picks up the job.
Transitions the WQ row from `DEEP-AUDIT-PENDING` to
`DEEP-AUDIT-RUNNING`. Payload:

```json
{
  "work_id": "TBM-YYYYMMDD-NNN",
  "pr_number": 42,
  "model": "codex-cli-reasoning | claude-opus-4-7",
  "provider": "codex | anthropic",
  "claim_horizon_sec": 300,
  "idempotency_key": "<uuid>"
}
```

HMAC-signed with `HMAC_SECRET_FORGE` (same secret the Gitea webhook
uses — consistent trust boundary: the runner lives on
`tbm-primary`, same host as Gitea).

### `POST /events/audit/spec-start` (NEW — trigger β)

Called by the spec-audit workflow when a runner picks up a
spec-stage audit. Transitions the WQ row from `DEEP-AUDIT-PENDING`
to `DEEP-AUDIT-RUNNING`. Payload symmetric to `deep-start` but
keyed by `issue_number` rather than `pr_number`:

```json
{
  "work_id": "TBM-YYYYMMDD-NNN",
  "issue_number": 17,
  "model": "codex-cli-reasoning | claude-opus-4-7",
  "provider": "codex | anthropic",
  "claim_horizon_sec": 300,
  "idempotency_key": "<uuid>"
}
```

HMAC-signed same as above.

### `POST /events/audit/deep-complete` (NEW — triggers α + β)

Called by either workflow (PR deep-audit or spec-stage audit) when
the audit finishes. Transitions DEEP-AUDIT-RUNNING → REVIEW-PASSED |
REVIEW-FAILED | BLOCKED. For trigger β, the REVIEW-PASSED exit
returns the row to its pre-audit state rather than `REVIEW-PASSED`
literally (worker checks the trigger path in the payload and maps
accordingly). Payload:

```json
{
  "work_id": "TBM-YYYYMMDD-NNN",
  "pr_number": 42,
  "issue_number": null,
  "trigger": "pr_inconclusive | spec_stage",
  "verdict": "PASS" | "FAIL" | "ERROR",
  "model": "codex-cli-reasoning | claude-opus-4-7",
  "provider": "codex | anthropic",
  "cost_usd": 0.00,
  "runtime_sec": 52,
  "comment_url": "https://git.thompsonfams.com/.../pulls/42#issuecomment-123",
  "findings_count": 0,
  "idempotency_key": "<uuid>",
  "reason": "deep audit PASS; shallow INCONCLUSIVE overturned"
}
```

`cost_usd` is `0.00` (not null) when `provider=codex` — the run is
flat-cost but tracking the field explicitly avoids null-handling
edge cases in the cost-cap rollup. Worker maps `verdict` → target
state per the rules in §1. HMAC same as above. Idempotency key
scoped to `deep-audit-complete-<pr-sha>` (α) or
`spec-audit-complete-<issue-number>-<timestamp>` (β) so retries
are safe.

### Signature verification story

Same constant-time HMAC-SHA256 approach `signing.js` already uses.
No new secret rotation needed — re-use `HMAC_SECRET_FORGE` set in
Phase C. Runner holds the same secret Gitea does (runner is
local-host to Gitea, so this is a trivial shared config).

---

## 7 — Failure modes + rollback

### F1. Deep-audit model call times out

- Detection: claim horizon (300s) expires without a
  `/events/audit/deep-complete` call.
- Action: heartbeat watcher (§E.4) fires on the stale
  `DEEP-AUDIT-RUNNING` claim. Reclaim target is
  `DEEP-AUDIT-PENDING` (see §2 schema note), NOT
  `READY-TO-BUILD` — another runner retries the deep audit.
- After 3 reclaim cycles (tracked via KV counter
  `deep_audit_retries_<page_id>` — see §8 Q4, RESOLVED): transition to `BLOCKED` with
  `failure_category=technical`, `exception_owner=tbm-bot`.
  Normal §E.5 escalation path takes over from there.

### F2. Deep-audit crashes or returns malformed JSON

- Detection: workflow step exits non-zero, or
  `parse_report()` returns None on the deep-audit response.
- Action: workflow calls `/events/audit/deep-complete` with
  `verdict=ERROR`. Worker maps to `BLOCKED`. Same path as above
  from there.

### F3. Run-count or cost cap hit

Two caps — both checked in KV before every run:

**Primary cap — run-count (applies to ALL providers):**
- Threshold: **20 runs/day**. Prevents runaway loops regardless of
  whether the primary or fallback provider is active.
- Detection: workflow queries KV counter
  `deep_audit_runs_<YYYY-MM-DD>` before each run; if count >= 20,
  workflow skips the model call and posts a comment saying
  "run-count cap reached (20/day) — falling back to manual audit".
- Worker transitions row directly to `BLOCKED` with
  `failure_category=policy`, `exception_owner=LT`.
- Rollback: LT lifts via `wrangler kv:key put
  deep_audit_run_override_<YYYY-MM-DD> true`, worker releases held
  rows back to `DEEP-AUDIT-PENDING`.

**Secondary cap — dollar amount (applies ONLY when
`DEEP_AUDIT_PROVIDER=anthropic`):**
- Threshold: **$50/month**. Not meaningful on the Codex CLI path
  (flat subscription cost). Dollar cap only fires when the
  Anthropic fallback is active.
- Detection: workflow queries KV counter
  `deep_audit_cost_<YYYY-MM>` (accumulated `cost_usd` from
  `deep-complete` payloads); if >= $50 AND `provider=anthropic`,
  workflow skips the model call and posts a "cost-capped" comment.
- Worker → `BLOCKED/policy/LT` same as run-count cap.
- Rollback: `wrangler kv:key put
  deep_audit_cap_override_<YYYY-MM> true`.

The two caps are independent checks — either one is sufficient to
block a run.

### F4. Codex CLI unavailable + Anthropic degraded (both providers down)

- Detection: Codex CLI exits non-zero or times out AND Anthropic
  API returns 5xx or times out.
- Action: workflow posts comment, verdict=ERROR. Worker →
  BLOCKED/technical/tbm-bot. Retry on next cron tick (heartbeat
  reclaim) — vendor blips self-resolve per §E.5.

### F5. Gitea webhook lost (label fires, worker never hears about it)

- Detection: the deep-audit workflow also dispatches a synthetic
  `pull_request.labeled` payload to `/events/forge/gitea` on job
  start as a belt-and-suspenders. Dedup by idempotency key means
  the worker handles one of the two, never both.

### Global rollback — Phase D kill switch

A single Gitea repo variable `PHASE_D_DEEP_AUDIT_ENABLED` (default
`true`) gates the workflow. Set to `false` and the deep-audit
workflow short-circuits: label stays on the PR but no model call
fires; WQ row stays at `DEEP-AUDIT-PENDING` (visibly stuck, LT
sees it in the escalation sweep). This is deliberate — a silent
Phase D disable would leak INCONCLUSIVEs back into manual-bypass
territory.

---

## 8 — Open questions

Listed in descending order of "blocks Phase D build start".
Resolved items are preserved for audit-trail — they show the
decision and rationale.

1. **Primary model confirmation.** ✅ RESOLVED
   **Decision:** Two-provider architecture. Primary = Codex CLI
   (flat-cost, headless on `tbm-runner-1`). Fallback = Anthropic
   Claude Opus 4.x (1M context). Controlled by
   `DEEP_AUDIT_PROVIDER=codex|anthropic`, default `codex`.
   Rationale: zero incremental cost on primary path; architectural
   independence via cross-vendor fallback; preserves optionality.

2. **PR → work_id mapping.** ✅ RESOLVED
   **Decision:** Option α — Notion `pr_url` column, reverse-mapped
   on webhook receipt. Worker queries the WQ for a row where
   `pr_url` matches the incoming PR URL to resolve `work_id`.
   No KV mapping table or PR-body trailer needed.

3. **Gitea branch-protection boolean-OR support.** ⚠️ OPEN
   §5 merge-gate logic needs `(A success) OR (B success AND A != FAIL)`.
   Gitea's branch protection may only support AND of required
   checks. Needs **empirical test on Gitea 1.24.6** — not done in
   this design pass. Fallback is a single merged check
   `Codex Review (final)` written by whichever workflow runs last.
   **Blocks build start for merge-gate implementation only —**
   all other Phase D components can build while this is tested.

4. **Claim-retry counter storage.** ✅ RESOLVED
   **Decision:** KV. Store retry count keyed by `page_id`
   (`deep_audit_retries_<page_id>`). Cheap, ephemeral, aligns
   with idempotency-key storage pattern. Not added to WQ Notion
   schema.

5. **Deep-audit scope beyond PR reviews.** ✅ RESOLVED
   **Decision:** v1 includes:
   - α) PR INCONCLUSIVE (original path)
   - β) Spec-stage audits — Codex reviewing an Issue/spec doc
     before building → INCONCLUSIVE → escalate
   v1 excludes:
   - γ) Pre-PR file audits during BUILDING — deferred to v2
   - Manual on-demand — deferred to v2
   Rationale: LT has historical pattern of INCONCLUSIVEs on big
   files; α+β give coverage before the first real PR lands without
   the trigger-design complexity of γ.

6. **Heartbeat reclaim target / `clearClaim` parameterization.** ✅ RESOLVED
   **Decision:** Parameterize `clearClaim` with a `reclaimTarget`
   argument; backward-compatible default of `READY-TO-BUILD`.
   Deep-audit callers pass `reclaimTarget=DEEP-AUDIT-PENDING`.
   Cleaner than a second function and makes future lane additions
   simpler.

7. **Cost cap calibration.** ✅ RESOLVED
   **Decision:**
   - **Primary cap:** 20 runs/day (run-count, applies to all
     providers). Prevents loops; decoupled from dollar cost.
   - **Secondary cap:** $50/month dollar cap, **only active when
     `DEEP_AUDIT_PROVIDER=anthropic`**. Codex CLI path is
     flat-cost under subscription — dollar cap is meaningless there.
   Both caps tracked in KV; either is sufficient to block a run.

8. **Retention of deep-audit artifacts.** ✅ RESOLVED
   **Decision:**
   - WQ row columns (`deep_audit_verdict`, `deep_audit_model`,
     `deep_audit_cost_usd`, etc.): permanent (forever on WQ).
   - PR comment / Issue comment: 90-day auto-archive under
     Gitea's default retention. No manual retention config needed.

9. **Codex CLI headless invocation spec.** ⚠️ OPEN — NEW
   **Empirical check required before first automated deep-audit.**
   Must verify on `tbm-runner-1`:
   - Exact model name available in LT's ChatGPT subscription tier
     (the model string that goes in `deep_audit_model` and payload
     fields throughout this doc currently reads
     `codex-cli-reasoning` as a placeholder).
   - Auth flow for headless runner invocation — how Codex CLI
     authenticates without a browser session, what credential
     storage looks like on the runner host.
   - Deterministic output mode — flags/env vars that disable
     sampling variance for structured JSON output (equivalent to
     `temperature=0` on the Anthropic path).
   - Error codes — exit codes the workflow uses to detect
     INCONCLUSIVE/timeout/auth-failure so it can route correctly
     to the Anthropic fallback vs. a hard ERROR.
   **This question blocks build of the runner workflow integration
   for trigger α and trigger β.** All worker-side endpoints (§6)
   and WQ schema changes (§2) can be built while this is pending.
