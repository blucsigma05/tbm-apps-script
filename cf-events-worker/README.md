# cf-events-worker — TBM control-plane event bus

Cloudflare Worker that serves as the **transactional boundary** for TBM's control-plane state machine. Per Migration Plan v4.1 §E.4 + §E.11.

## What this Worker does

One job: receive events from various sources, serialize state transitions on the Notion Work Queue DB, never let two writes race.

```
Notion webhook (state change)   ─┐
Forge webhook (PR/Issue events) ─┤
OpenAI callback (review done)   ─┼─► /events/* route ──► Durable Object ──► Notion Work Queue write
Scheduled cron (heartbeat)      ─┘       (per work_id)      (CAS-gated)
```

## Why a Durable Object for serialization

Notion has no native compare-and-swap. Two concurrent writers can both read the same `last_edited_time` and both write. The fix: every state write for a given `work_id` flows through a Cloudflare Durable Object instance named `work:<work_id>`. Cloudflare guarantees single-threaded execution per DO instance, so writes are naturally serialized. The DO:

1. Reads current Notion row state
2. Checks the event's `idempotency_key` against its local processed-set (KV-backed, 7-day TTL)
3. Verifies the state transition is allowed per the matrix in plan §E.11
4. Writes to Notion
5. Marks the idempotency key processed

This solves the v4.1 rubric-audit finding that "Notion CAS overclaims semantics." CAS lives at the Worker, not at Notion.

## Routes

| Route | Method | Purpose | Status |
|---|---|---|---|
| `/events/health` | GET | Liveness probe; returns Worker version + timestamp | scaffolded |
| `/events/notion` | POST | Notion webhook receiver (row changed in Work Queue) | stubbed |
| `/events/forge/:source` | POST | Forge webhook receiver (Gitea when live, GitHub restored if ever) | stubbed |
| `/events/openai/callback` | POST | Async OpenAI response callback | stubbed |
| `/events/heartbeat-tick` | GET | Invoked by cron every 5min; reclaims stale claims | stubbed |

All POST routes require HMAC signature verification using a per-source secret.

## Files

| File | Purpose |
|---|---|
| `wrangler.toml` | Worker config: routes, KV bindings, Durable Object binding, cron schedule |
| `src/index.js` | Fetch handler + router |
| `src/work-do.js` | `WorkQueueStateMachine` Durable Object class (serialization boundary) |
| `src/signing.js` | HMAC-SHA256 signature verification per source |
| `src/idempotency.js` | KV-backed event dedup (7-day TTL) |
| `src/notion.js` | Notion API client (scoped to Work Queue DB) |
| `src/state-matrix.js` | Allowed-transition matrix from plan §E.11 |

## Deployment

Deploy via `wrangler deploy` from this directory. Requires Cloudflare API token with `Workers Scripts:Edit`, `Workers KV Storage:Edit`, `Workers Durable Objects:Edit`. Scoped to the TBM Cloudflare account.

First deploy creates the KV namespace + DO namespace; subsequent deploys update the Worker script.

## NOT YET IMPLEMENTED (Phase C TODO)

Scaffold-only today. Real implementation queued as Work Queue items after §E.9 Phase C stands up.

- [ ] Actual HMAC verification (stub accepts any signature)
- [ ] Real Notion API client (stub logs payload + returns 200)
- [ ] Real state-matrix enforcement (stub allows anything)
- [ ] Durable Object CAS logic (stub is passthrough)
- [ ] Cron trigger for heartbeat watcher
- [ ] Exception queue write-backs on handler errors
- [ ] Pushover integration for critical failures

Each of these becomes a Work Queue item after Phase C proves the plumbing end-to-end on a sacrificial test event.

## References

- Migration Plan v4.1 §E.4 (Automation Contracts) — `C:/Users/BluCs/.claude/plans/alright-looks-like-github-delightful-blum.md`
- Migration Plan v4.1 §E.11 (Control-plane correctness — Durable Object boundary)
- Migration Plan v4.1 §E.12 (Adapter Layer — keeps forge-specific logic below this Worker)
- Notion Work Queue DB — https://www.notion.so/b1c21d2691e64dba90e81944d2cd4862
- Rubric — `C:/Dev/tbm-apps-script/ops/operating-memos/2026-04-19-migration-approval-rubric.md`
