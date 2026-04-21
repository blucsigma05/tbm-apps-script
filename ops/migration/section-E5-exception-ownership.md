# §E.5 — Exception-Queue Ownership (canonical)

**Status:** canonical as of 2026-04-19.
**Authoring context:** The original Migration Plan v4.1 §E.5 text
could not be located when the Cloudflare-Worker event bus was being
wired on 2026-04-19 — the Notion WQ schema referenced §E.5 but no
complete §E.5 document was indexed in the workspace. LT approved
this table as canonical to unblock the control-plane rollout. If a
prior §E.5 draft surfaces and disagrees, the two must be reconciled
(and this file updated) before the next control-plane deploy that
touches BLOCKED-state handling.

---

## Purpose

When a work item transitions to `state = BLOCKED`, the control plane
must assign a single owner responsible for resolving the block. That
owner is stored on the row as `exception_owner` and governs:

1. Which actor the row shows up for when they query "my queue."
2. Whether the escalation watcher (`runEscalationSweep` in
   `cf-events-worker/src/index.js`) pages LT on the row after the
   age threshold expires.
3. Who the alert routes to (bot lanes retry/resolve autonomously;
   LT-owned blocks surface to Pushover).

Getting this mapping wrong has direct consequences: assigning a
transient technical failure to LT page-spams the human; assigning a
policy call to the bot creates a silent stall because the bot can't
decide.

---

## Canonical rules (two invariants + the table)

These two rules come straight from the Notion WQ schema property
descriptions and are treated as hard invariants. Any future edit to
this table MUST preserve both.

**Invariant 1 — Values.**
`exception_owner ∈ { "tbm-bot", "tbm-runner", "LT" }`.
No other values are accepted by the schema. (The `owner` field —
different column — also allows `"external"`, but `exception_owner`
does not.)

**Invariant 2 — Technical failures never default to LT.**
A technical failure is something a machine can retry, redeploy, or
file a hygiene issue for. The whole point of automating the
exception queue is that LT does NOT get paged on transient bugs in
our own code. Default assignment for `failure_category: technical`
MUST be a bot lane, never LT.

---

## Default table

| `failure_category` | default `exception_owner` | Rationale |
|---|---|---|
| `technical` | `tbm-bot` | Code we own broke. Bot retries; if retry fails, files a `claude:inbox` Issue via the hygiene filer. Never pages LT. (Invariant 2.) |
| `vendor` | `tbm-bot` | Third-party API (Gemini, Tiller, Notion, Cloudflare) is degraded. Bot backs off exponentially and retries — most vendor blips self-resolve. |
| `merge-conflict` | `tbm-bot` | Rebase bot can auto-resolve most conflicts. Escalates to LT only after retries fail on the same conflict — that becomes a `policy`-category re-classification. |
| `deploy-fail` | `tbm-runner` | Deploy runner owns the clasp-push pipeline. It redeploys with backoff; if the deploy keeps failing, the runner flips `failure_category` to `technical` so the bot lane takes it. |
| `policy` | `LT` | Policy calls require a human decision (e.g. "should we expand scope of #NNN to cover adjacent bug?"). No bot automation can resolve these. |
| `admin` | `LT` | Admin tasks need a human (1Password rotation, Cloudflare dashboard UI work, Notion workspace admin). Bots don't have admin access by design. |

---

## Override behavior (already wired in code)

`runEscalationSweep` and `/events/notion`'s BLOCKED handler both
accept an explicit `exception_owner` in the event payload. If the
caller passes one, it wins over the default. The default only
applies when the caller leaves the field out.

This matters for cases like: a `technical` failure that's actually a
vendor-induced crash — the filer can still explicitly set
`exception_owner=tbm-runner` (or whichever lane is appropriate) even
though the category is `technical`. The table is the default, not
the policy.

---

## Resolution (clear-on-exit)

When a row transitions OUT of `BLOCKED` to any other state, the
control plane clears:
- `failure_category` → null
- `blocked_reason` → null
- `exception_owner` → null

This is done inside the DO `transition` flow — the caller doesn't
have to (and shouldn't) pass these fields on a resolution event.
Rationale: active rows shouldn't carry stale exception metadata, and
`last_event_reason` + Notion's page history provide the audit trail.

---

## Where this is enforced

| Concern | File |
|---|---|
| Default table | `.claude/worktrees/cp-events/cf-events-worker/src/work-do.js` — constant `DEFAULT_EXCEPTION_OWNER` |
| Resolution clearing | same file, inside `transition()` step 3a |
| Escalation query | `.claude/worktrees/cp-events/cf-events-worker/src/notion.js` — `queryBlockedForEscalation` |
| Escalation dispatch | `.claude/worktrees/cp-events/cf-events-worker/src/index.js` — `runEscalationSweep` |

Any change to the mapping here MUST be reflected in
`DEFAULT_EXCEPTION_OWNER` in the same commit. Update both or neither.

---

## Change log

| Date | Change | Reason |
|---|---|---|
| 2026-04-19 | Initial canonical draft | LT-approved during Cloudflare Worker rollout when the prior Migration Plan v4.1 §E.5 text could not be located. |
