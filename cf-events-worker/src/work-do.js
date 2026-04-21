// WorkQueueStateMachine — Cloudflare Durable Object class.
//
// One DO instance per work_id. Cloudflare guarantees single-threaded execution
// per DO instance, which gives us the serialization primitive Notion lacks.
// Every state transition for a given work_id flows through this object; two
// concurrent webhooks for the same work_id are naturally serialized by the
// platform.
//
// The DO IS the transactional boundary. Notion is the durable projection.
// Plan v4.1 §E.11.

import { isTransitionAllowed } from './state-matrix.js';
import { getWorkItem, updateWorkItem, clearClaim } from './notion.js';

const IDEMPOTENCY_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// §E.5 default exception_owner per failure_category.
// CANONICAL SOURCE: ops/migration/section-E5-exception-ownership.md
// Any change here MUST update that doc in the same commit (and vice
// versa). Two hard invariants: (1) exception_owner ∈ {tbm-bot,
// tbm-runner, LT}; (2) technical failures never default to LT.
const DEFAULT_EXCEPTION_OWNER = {
  technical: 'tbm-bot',       // bugs we own — bot retries / files hygiene issue
  vendor: 'tbm-bot',          // external API broken — bot backs off + retries
  'merge-conflict': 'tbm-bot', // rebase bot can resolve
  'deploy-fail': 'tbm-runner', // deploy runner owns redeploy
  policy: 'LT',               // policy calls escalate to human
  admin: 'LT',                // admin tasks need a human
};

export class WorkQueueStateMachine {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    // Internal-only. Called by the main Worker via env.WORK_STATE_MACHINE.get(id).fetch().
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'transition') {
      return await this.transition(await request.json());
    }
    if (action === 'get') {
      return await this.getCurrentState(url.searchParams.get('work_id'));
    }
    if (action === 'reclaim') {
      return await this.reclaim(await request.json());
    }
    return jsonResp({ error: 'unknown-action' }, 400);
  }

  // reclaim — called by the heartbeat sweeper (§E.4) to return a stale
  // IN-PROGRESS row to READY-TO-BUILD. Routes through the DO to serialize
  // against concurrent agent writes: by the time we run, any in-flight
  // transition has completed. Double-check inside the critical section
  // before writing: if state changed or claim was extended, no-op.
  async reclaim(event) {
    const { work_id, page_id, nowIso } = event;
    let current;
    try {
      current = await getWorkItem(this.env, page_id);
    } catch (err) {
      return jsonResp({ error: 'notion-read-failed', detail: String(err) }, 502);
    }
    if (current.state !== 'IN-PROGRESS') {
      return jsonResp({
        status: 'skipped',
        reason: 'not-in-progress',
        work_id,
        current_state: current.state,
      });
    }
    const claimExpires = current.raw?.properties?.claim_expires_at?.date?.start || null;
    const now = nowIso || new Date().toISOString();
    if (claimExpires && claimExpires > now) {
      return jsonResp({
        status: 'skipped',
        reason: 'claim-extended',
        work_id,
        claim_expires_at: claimExpires,
      });
    }
    try {
      await clearClaim(this.env, page_id, `Heartbeat watcher: claim expired at ${claimExpires || '(unset)'}; reverted to READY-TO-BUILD for redispatch`);
    } catch (err) {
      return jsonResp({ error: 'notion-write-failed', detail: String(err) }, 502);
    }
    return jsonResp({
      status: 'reclaimed',
      work_id,
      from_state: 'IN-PROGRESS',
      to_state: 'READY-TO-BUILD',
      claim_expires_at: claimExpires,
    });
  }

  async transition(event) {
    // work_id = TBM-YYYYMMDD-NNN (human-readable, used for DO routing + audit)
    // page_id = Notion page UUID (used for Notion API calls — different from work_id)
    const {
      work_id, page_id, target_state, idempotency_key, reason,
      failure_category, blocked_reason, exception_owner,
    } = event;

    // 1. Idempotency — if we've processed this key, return the cached result.
    const processed = await this.env.PROCESSED_EVENTS.get(idempotency_key);
    if (processed) {
      return jsonResp({
        status: 'already-processed',
        previous_result: JSON.parse(processed),
      });
    }

    // 2. Fetch current state from Notion.
    let current;
    try {
      current = await getWorkItem(this.env, page_id);
    } catch (err) {
      return jsonResp(
        { error: 'notion-read-failed', detail: String(err) },
        502,
      );
    }

    // 3. Transition validity check against the §E.11 matrix.
    if (!isTransitionAllowed(current.state, target_state)) {
      return jsonResp(
        {
          error: 'invalid-transition',
          from: current.state,
          to: target_state,
          work_id,
        },
        422,
      );
    }

    // 3a. Compute the BLOCKED-field write set. Three cases:
    //   - entering BLOCKED: write the fields (exception_owner defaulted if absent)
    //   - leaving BLOCKED (resolution): clear all three fields (null)
    //   - neither: leave fields alone (undefined = not written)
    const writeFields = { state: target_state, reason };
    if (target_state === 'BLOCKED') {
      if (!failure_category || !blocked_reason) {
        return jsonResp(
          {
            error: 'missing-blocked-fields',
            required: ['failure_category', 'blocked_reason'],
          },
          400,
        );
      }
      writeFields.failure_category = failure_category;
      writeFields.blocked_reason = blocked_reason;
      writeFields.exception_owner =
        exception_owner || DEFAULT_EXCEPTION_OWNER[failure_category] || 'LT';
    } else if (current.state === 'BLOCKED') {
      // Resolution: clear stale exception metadata on active rows.
      writeFields.failure_category = null;
      writeFields.blocked_reason = null;
      writeFields.exception_owner = null;
    }

    // 4. Write new state to Notion. If this fails we have NOT marked the
    //    idempotency key, so a retry of the same event will try again.
    try {
      await updateWorkItem(this.env, page_id, writeFields);
    } catch (err) {
      return jsonResp(
        { error: 'notion-write-failed', detail: String(err) },
        502,
      );
    }

    // 5. Mark idempotency key processed — 7-day TTL.
    const result = {
      work_id,
      page_id,
      from_state: current.state,
      to_state: target_state,
      at: Date.now(),
    };
    if (target_state === 'BLOCKED') {
      result.failure_category = writeFields.failure_category;
      result.exception_owner = writeFields.exception_owner;
    }
    await this.env.PROCESSED_EVENTS.put(
      idempotency_key,
      JSON.stringify(result),
      { expirationTtl: IDEMPOTENCY_TTL_SECONDS },
    );

    return jsonResp({ status: 'transitioned', ...result });
  }

  async getCurrentState(pageId) {
    if (!pageId) return jsonResp({ error: 'missing-page_id' }, 400);
    try {
      const current = await getWorkItem(this.env, pageId);
      return jsonResp({ page_id: pageId, state: current.state });
    } catch (err) {
      return jsonResp(
        { error: 'notion-read-failed', detail: String(err) },
        502,
      );
    }
  }
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
