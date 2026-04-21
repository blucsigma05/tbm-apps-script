# TBM Control Plane — Architecture

**Status:** Phase C complete (2026-04-19). Control plane operational;
awaiting host (Hetzner + Gitea) for code-merge side of the pipeline.
**Scope:** the event bus + state machine layer that sits between Notion
(source of truth) and whatever forge hosts the code (Gitea eventually;
currently no forge while GitHub is suspended).

---

## 30-second read

TBM has two data planes:

- **Data plane** — Google Sheets, Tiller, the GAS codebase. Unchanged.
- **Control plane** — Notion Work Queue → Cloudflare Worker event bus →
  Durable Object per work item → Notion write-back. New. This doc.

Agents (builder, auditor, filer, you) don't write to Notion directly.
They POST signed events to the CF Worker. The Worker validates, routes
to the right Durable Object (serialized per `work_id`), checks the
transition against the §E.11 state matrix, and writes to Notion atomically.
Idempotency keys + KV storage make replays safe.

---

## Component map

```
                ┌──────────────────────────────────────────────┐
                │                  NOTION                      │
                │  ┌────────────────────────────────────────┐  │
                │  │  TBM Work Queue (DB)                   │  │
                │  │    data_source:                        │  │
                │  │      4f35fdb7-02c4-40fa-a0c5-f7c7d787… │  │
                │  │    database:                           │  │
                │  │      b1c21d26-91e6-4dba-90e8-1944d2cd… │  │
                │  │    Rows: work_id, state, owner,        │  │
                │  │          exception_owner, …            │  │
                │  └────────────────────────────────────────┘  │
                └────────┬────────────────────────────▲────────┘
                         │                            │
                         │ (read current state)       │ (PATCH new state)
                         │                            │
                ┌────────▼────────────────────────────┴────────┐
                │    CLOUDFLARE WORKER: tbm-cp-events          │
                │    https://tbm-cp-events.lthompson.workers   │
                │       .dev                                    │
                │                                              │
                │    Routes:                                   │
                │      GET  /events/health                     │
                │      POST /events/notion                     │
                │      POST /events/forge/{gitea|github}       │
                │      POST /events/openai/callback            │
                │      GET  /events/heartbeat-tick   (manual)  │
                │      GET  /events/escalation-tick  (manual)  │
                │                                              │
                │    Crons:                                    │
                │      */5 * * * *   heartbeat (§E.4)          │
                │      0 */4 * * *   escalation (§E.5)         │
                │                                              │
                │    Bindings:                                 │
                │      WORK_STATE_MACHINE (Durable Object)     │
                │      PROCESSED_EVENTS   (KV, 7d TTL)         │
                │      NOTION_WORK_QUEUE_DB_ID (var)           │
                │                                              │
                │    Secrets:                                  │
                │      NOTION_TOKEN     ← Notion integration   │
                │      HMAC_SECRET_NOTION ← event signing      │
                │      PUSHOVER_APP_TOKEN  (optional)          │
                │      PUSHOVER_USER_KEY   (optional)          │
                └───▲────────────────────────────────┬─────────┘
                    │                                │
                    │ POST signed event              │ (per-work_id DO call)
                    │                                │
    ┌───────────────┴─────────────┐          ┌──────▼─────────────┐
    │         AGENTS              │          │ WorkQueueState-    │
    │  - builder (Opus/Sonnet)    │          │ Machine (DO)       │
    │  - auditor (Codex)          │          │   one per work_id  │
    │  - filer (GH Action today,  │          │   serialized by CF │
    │    will migrate to Gitea    │          │   checks §E.11     │
    │    Actions)                 │          │   matrix           │
    │  - heartbeat/escalation     │          │   writes Notion    │
    │    (the Worker itself)      │          │   marks KV dedup   │
    └─────────────────────────────┘          └────────────────────┘
```

---

## Event flow — happy path (INTAKE → SPEC-DRAFTING)

1. Some agent decides a work item should advance. Computes:
   - `work_id` (the `TBM-YYYYMMDD-NNN` stable ID)
   - `page_id` (the Notion page UUID — different from work_id)
   - `target_state` (next state per §E.11)
   - `idempotency_key` (UUID; caller generates + retains for retry)
   - `reason` (one-line human-readable)
2. Agent POSTs `{work_id, page_id, target_state, idempotency_key, reason}`
   to `/events/notion` signed with HMAC-SHA256 over the raw body, using
   `HMAC_SECRET_NOTION`.
3. Worker verifies signature (401 on bad), validates required fields
   (400 on missing), looks up the Durable Object for this `work_id`
   via `env.WORK_STATE_MACHINE.idFromName(work_id)`.
4. DO instance handles the transition (Cloudflare guarantees one
   concurrent handler per DO — that's our serialization):
   a. Read idempotency key from KV → if present, return cached result (200).
   b. Read current state from Notion (via `notion.getWorkItem`).
   c. Check `isTransitionAllowed(current.state, target_state)` against
      the §E.11 matrix → 422 with `from`/`to` if not.
   d. Write new state + `last_event_reason` to Notion.
   e. Mark idempotency key in KV with 7-day TTL.
   f. Return `{status: "transitioned", from_state, to_state, at}`.

---

## Event flow — BLOCKED path (§E.5)

When `target_state` is `BLOCKED`, the caller MUST also pass:
- `failure_category` — one of technical / vendor / policy / admin / merge-conflict / deploy-fail
- `blocked_reason` — the actual failure payload

The DO:
1. Applies §E.5 default `exception_owner` from the failure category
   (canonical table: `ops/migration/section-E5-exception-ownership.md`).
   Caller can override with an explicit `exception_owner` field.
2. Writes state=BLOCKED plus all exception fields to Notion.

When the row leaves BLOCKED (resolution path — e.g. BLOCKED → IN-PROGRESS),
the DO CLEARS `failure_category`, `blocked_reason`, `exception_owner`.
Active rows don't carry stale exception metadata.

The escalation watcher (`0 */4 * * *` cron) scans for rows matching
`state=BLOCKED AND exception_owner=LT AND age > 24h`, dedups via KV
(`alert:<page_id>` key, 24h TTL), and fires Pushover if secrets are set
(otherwise log-only — graceful degrade).

---

## Event flow — heartbeat reclaim (§E.4)

Runs every 5 minutes via cron. Purpose: any IN-PROGRESS row with an
expired claim (e.g. the runner that claimed it crashed) gets returned
to READY-TO-BUILD so another runner can pick it up.

1. Cron fires → `runHeartbeatSweep(env)`.
2. Worker queries Notion for rows with `state=IN-PROGRESS AND
   claim_expires_at < now` via `/databases/{id}/query`.
3. For each stale row, dispatches `action=reclaim` to the per-work_id DO.
4. Inside the DO critical section:
   - Re-read state (maybe the runner came back to life in the 5-min window).
   - If not IN-PROGRESS or claim was extended → skip.
   - Else → call `notion.clearClaim(pageId, reason)` which writes
     state=READY-TO-BUILD + clears claimed_by/claimed_at/claim_expires_at
     + writes a `last_event_reason` audit line.

---

## State matrix (§E.11)

```
INTAKE ──► SPEC-DRAFTING ──► READY-TO-BUILD ◄─────────────────┐
                                 │                            │
                                 ▼                            │
                            IN-PROGRESS                       │
                                 │                            │
                                 ▼                            │
                          REVIEW-PENDING ──► REVIEW-PASSED    │
                             │     ▲               │          │
                             ▼     │               ▼          │
                       REVIEW-FAILED │       READY-FOR-APPROVAL
                             │     │               │          │
                             ▼     │               ▼          │
                       REVISION-NEEDED           APPROVED     │
                                                   │          │
                                                   ▼          │
                                                 MERGED       │
                                                   │          │
                                                   ▼          │
                                                DEPLOYED      │
                                                   │          │
                                                   ▼          │
                                                 CLOSED       │
                                                              │
Any state ──► BLOCKED ──► any non-BLOCKED state (resolution)──┘
```

Full matrix + tests in `cf-events-worker/src/state-matrix.js` +
`cf-events-worker/test/state-matrix.test.js` (14/14 passing, covers
matrix integrity, BLOCKED universality, CLOSED terminal, happy-path
walk, review-fail loop, illegal skips/reverses, unknown inputs).

---

## File map

### Worker source (`.claude/worktrees/cp-events/cf-events-worker/`)

| File | Role |
|---|---|
| `src/index.js` | Fetch handler + scheduled() dispatcher + runHeartbeatSweep + runEscalationSweep |
| `src/work-do.js` | WorkQueueStateMachine Durable Object — transition, reclaim, getCurrentState |
| `src/state-matrix.js` | ALLOWED_TRANSITIONS + isTransitionAllowed |
| `src/notion.js` | Notion API client — getWorkItem, updateWorkItem, queryStaleClaimedRows, queryBlockedForEscalation, clearClaim |
| `src/signing.js` | HMAC-SHA256 verify (constant-time via crypto.subtle) |
| `src/pushover.js` | Pushover client with log-only degrade when secrets missing |
| `test/state-matrix.test.js` | 14 unit tests, Node's built-in test runner |
| `test/integration.mjs` | End-to-end suite against live worker (~35 assertions) |
| `wrangler.toml` | Worker config — routes, bindings, crons, vars |

### Control-plane docs (`ops/migration/`)

| File | Role |
|---|---|
| `control-plane-architecture.md` | THIS file |
| `section-E5-exception-ownership.md` | Canonical §E.5 defaults + invariants |
| `hetzner-cx22-order-spec.md` | Provision the VPS (step 1 of host setup) |
| `gitea-install-runbook.md` | Install Gitea on the VPS (step 2) |
| `tbm-apps-script-2026-04-19.bundle` | Git bundle of the repo for offline migration |
| `ref-manifest-2026-04-19.md` | What's in the bundle |

### Forge adapters (`adapters/`)

| File | Role |
|---|---|
| `base.py` | ForgeAdapter abstract contract (§E.12) |
| `gitea.py` | Concrete Gitea v1 API impl (untested against live) |
| `__init__.py` | Package stub |

---

## Running & testing

### Deploy the worker

```bash
cd .claude/worktrees/cp-events/cf-events-worker
npx wrangler deploy
```

Requires `wrangler login` once (OAuth flow). Subsequent deploys reuse
the stored credential at `~/.wrangler/config/default.toml`.

### Run unit tests

```bash
cd .claude/worktrees/cp-events/cf-events-worker
node --test test/state-matrix.test.js
# 14 tests, zero deps
```

### Run integration tests (live)

```bash
NOTION_TOKEN=<secret> \
HMAC_SECRET_NOTION=<secret> \
node test/integration.mjs
```

Creates its own scratch WQ row, runs ~35 assertions, archives on exit.
Script: `cf-events-worker/test/integration.mjs`.

### Manual cron triggers (without waiting)

```bash
# Heartbeat — always safe, no-ops when nothing is stale
curl -sS https://tbm-cp-events.lthompson.workers.dev/events/heartbeat-tick

# Escalation — age_hours override for local testing
curl -sS "https://tbm-cp-events.lthompson.workers.dev/events/escalation-tick?age_hours=0.001"
```

### Sign a POST manually

```javascript
const crypto = require('crypto');
const body = JSON.stringify(payload);
const sig = 'sha256=' + crypto.createHmac('sha256', HMAC_SECRET_NOTION).update(body).digest('hex');
// POST to /events/notion with header: x-notion-signature: <sig>
```

---

## Known quirks

### Notion filter on renamed last_edited_time columns returns 0 hits

Filtering `last_event` (type `last_edited_time`) via either the `date`
or `last_edited_time` envelope returns an empty result set against the
WQ data source, even when matching rows exist. Cause not confirmed —
possibly related to the column having been renamed after creation.

**Workaround in place:** `queryBlockedForEscalation` filters on
`state + exception_owner` server-side (works), then applies the age
cutoff client-side. See `src/notion.js` for the comment.

### Cloudflare free-plan Durable Objects require SQLite backing

On the free plan, `[[migrations]] new_classes` fails with error 10097.
Use `new_sqlite_classes` instead. Already wired in `wrangler.toml`;
flagging so future `new_classes` additions don't repeat the stumble.

### Notion data source ID ≠ database ID

The DS ID (`4f35fdb7-02c4-40fa-a0c5-f7c7d787e29e`) shown in
`notion-fetch` `collection://` tags is NOT the same as the database ID
(`b1c21d26-91e6-4dba-90e8-1944d2cd4862`) used by the legacy
`/databases/{id}/query` endpoint. The worker's `NOTION_WORK_QUEUE_DB_ID`
var stores the DATABASE ID. Wrong one gives 400 `invalid_request_url`.

---

## Next phases (pending Hetzner)

1. **Provision Hetzner CX22** — `ops/migration/hetzner-cx22-order-spec.md`.
2. **Install Gitea + Caddy** — `ops/migration/gitea-install-runbook.md`.
3. **Install Gitea Actions runner** (runbook TBD).
4. **Migrate bundle** — restore repo + Issues via Gitea's import tool.
5. **Wire `HMAC_SECRET_FORGE`** on the worker; point `adapters/gitea.py`
   at the new Gitea; validate signatures from Gitea webhooks.
6. **Sacrificial test PR** — prove CI → Codex review → merge works end-to-end.

At that point `/events/forge/gitea` graduates from stub to live, and
the whole pipeline (Issue → PR → review → merge → DEPLOYED) runs
without GitHub.
