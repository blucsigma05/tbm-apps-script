// tbm-cp-events — control-plane event bus.
//
// Single fetch handler routes incoming events to the right processor. Every
// POST route requires HMAC signature verification. State transitions flow
// through the WorkQueueStateMachine Durable Object (see src/work-do.js) which
// provides the serialization Notion can't.
//
// Scaffold only — real handlers are stubbed. Phase C first milestone is getting
// /events/health returning 200 from production + confirming cron invocation.
// See README.md for the full route table and implementation TODO.

import { WorkQueueStateMachine } from './work-do.js';
import { verifyHmac } from './signing.js';
import { queryStaleClaimedRows, queryBlockedForEscalation } from './notion.js';
import { sendPushover } from './pushover.js';

export { WorkQueueStateMachine };

const WORKER_VERSION = 'cp-events-v0.1-scaffold';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/events/health' && request.method === 'GET') {
        return handleHealth(env);
      }
      if (path === '/events/notion' && request.method === 'POST') {
        return await handleNotion(request, env, ctx);
      }
      if (path.startsWith('/events/forge/') && request.method === 'POST') {
        const source = path.slice('/events/forge/'.length);
        return await handleForge(source, request, env, ctx);
      }
      if (path === '/events/openai/callback' && request.method === 'POST') {
        return await handleOpenAICallback(request, env, ctx);
      }
      if (path === '/events/heartbeat-tick' && request.method === 'GET') {
        return await handleHeartbeatManual(request, env, ctx);
      }
      if (path === '/events/escalation-tick' && request.method === 'GET') {
        return await handleEscalationManual(request, env, ctx);
      }
      return new Response('Not found', { status: 404 });
    } catch (err) {
      // Scaffold error behavior — real impl routes to exception queue per §E.5.
      console.error('Worker unhandled error', {
        error: String(err),
        stack: err?.stack,
        path,
      });
      return new Response(
        JSON.stringify({ error: 'internal', detail: String(err) }),
        { status: 500, headers: { 'content-type': 'application/json' } },
      );
    }
  },

  async scheduled(event, env, ctx) {
    // Cron dispatch — multiple crons land here; event.cron identifies
    // which pattern fired.
    console.log('cron tick', { cron: event.cron, ts: Date.now() });
    if (event.cron === '*/5 * * * *') {
      // §E.4 heartbeat watcher — reclaim stale IN-PROGRESS claims.
      const report = await runHeartbeatSweep(env);
      console.log('heartbeat sweep result', report);
      return;
    }
    if (event.cron === '0 */4 * * *') {
      // §E.5 escalation watcher — page LT on stale BLOCKED rows.
      const report = await runEscalationSweep(env);
      console.log('escalation sweep result', report);
      return;
    }
    console.warn('unknown cron pattern — no handler', { cron: event.cron });
  },
};

// ---------- handlers ----------

function handleHealth(env) {
  return json({
    worker: WORKER_VERSION,
    ts: new Date().toISOString(),
    // Don't leak secret presence; just confirm bindings are wired.
    bindings: {
      kv_processed: Boolean(env.PROCESSED_EVENTS),
      do_work_state: Boolean(env.WORK_STATE_MACHINE),
    },
  });
}

async function handleNotion(request, env, ctx) {
  const body = await request.text();
  const sig = request.headers.get('x-notion-signature') || '';

  const verified = await verifyHmac(body, sig, env.HMAC_SECRET_NOTION, env);
  if (!verified) {
    return json({ error: 'bad-signature' }, 401);
  }

  const payload = safeJsonParse(body);
  if (!payload) {
    return json({ error: 'bad-json' }, 400);
  }

  // work_id = TBM-YYYYMMDD-NNN (for DO routing/audit); page_id = Notion UUID.
  const required = ['work_id', 'page_id', 'target_state', 'idempotency_key', 'reason'];
  const missing = required.filter((k) => !payload[k]);
  if (missing.length) {
    return json({ error: 'missing-fields', fields: missing }, 400);
  }

  // Route to the DO for this work_id — single-threaded serialization per item.
  // Cloudflare guarantees one handler at a time per DO instance, which gives
  // us the CAS-like serialization Notion itself lacks.
  const doId = env.WORK_STATE_MACHINE.idFromName(payload.work_id);
  const doStub = env.WORK_STATE_MACHINE.get(doId);
  const doRes = await doStub.fetch('https://do/?action=transition', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'content-type': 'application/json' },
  });
  return new Response(await doRes.text(), {
    status: doRes.status,
    headers: { 'content-type': 'application/json' },
  });
}

async function handleForge(source, request, env, ctx) {
  // source is "gitea" (canonical) or legacy "github" (archive-only).
  // Per-source signature headers + secrets so a compromise of one source's
  // signing key doesn't let the attacker spoof the other.
  //
  // Stub handler — accepts, logs, returns 200. Before this is wired to any
  // side effect, HMAC verification is mandatory (previous revision was
  // unauthenticated; see 2026-04-21 audit F2 on PR #45).
  const body = await request.text();

  const sigHeaderByNormalizedSource = {
    gitea: 'x-gitea-signature',
    github: 'x-hub-signature-256',
  };
  const secretEnvByNormalizedSource = {
    gitea: 'HMAC_SECRET_FORGE_GITEA',
    github: 'HMAC_SECRET_FORGE_GITHUB',
  };
  const normalized = String(source || '').toLowerCase();
  const sigHeader = sigHeaderByNormalizedSource[normalized];
  const secretEnvKey = secretEnvByNormalizedSource[normalized];
  if (!sigHeader || !secretEnvKey) {
    return json({ error: 'unknown-forge-source', source: normalized }, 400);
  }
  const sig = request.headers.get(sigHeader) || '';
  const secret = env[secretEnvKey];
  const verified = await verifyHmac(body, sig, secret, env);
  if (!verified) {
    return json({ error: 'bad-signature', source: normalized }, 401);
  }

  console.log('forge event received', { source: normalized, size: body.length });
  return json({ received: true, source: normalized, scaffold: true });
}

async function handleOpenAICallback(request, env, ctx) {
  // For when Codex review goes async. Today review is sync in the workflow.
  // Stub handler. Same HMAC-required-on-POST contract as /events/notion
  // and /events/forge/* — never return 200 on an unsigned body.
  // (2026-04-21 audit F2 on PR #45.)
  const body = await request.text();
  const sig = request.headers.get('x-openai-signature') || '';
  const verified = await verifyHmac(body, sig, env.HMAC_SECRET_OPENAI, env);
  if (!verified) {
    return json({ error: 'bad-signature' }, 401);
  }

  console.log('openai callback received', { size: body.length });
  return json({ received: true, scaffold: true });
}

// Shared auth gate for the /events/*-tick manual-trigger routes. Production
// state mutates behind these (heartbeat reclaim + escalation Pushover), so
// we require a bearer-style token in the Authorization header matching
// MANUAL_TRIGGER_TOKEN. Earlier revision had no gate, which left the live
// control plane open to unauthorized reclaim / escalation spam (see
// 2026-04-21 audit F5 on PR #45).
//
// Design: a shared env secret rather than HMAC-over-body because these are
// zero-body GETs used for ops / integration testing. The caller is always
// LT or a dev script with access to the env var. HMAC adds no security here
// over a token check and adds real friction for the manual-test use case.
function manualTriggerAuthorized(request, env) {
  const expected = env.MANUAL_TRIGGER_TOKEN;
  if (!expected) {
    // Fail closed if not configured — never silently allow.
    return false;
  }
  const header = request.headers.get('authorization') || '';
  // Accept "Bearer <token>" or just "<token>" for CLI-script convenience.
  const provided = header.startsWith('Bearer ') ? header.slice(7) : header;
  // Constant-time-ish compare via length + char-by-char fold.
  if (provided.length !== expected.length) return false;
  let acc = 0;
  for (let i = 0; i < expected.length; i += 1) {
    acc |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return acc === 0;
}

async function handleHeartbeatManual(request, env, ctx) {
  // Manual trigger — same work as the cron scheduled handler.
  // Useful for integration testing without waiting 5 min for the cron.
  if (!manualTriggerAuthorized(request, env)) {
    return json({ error: 'unauthorized' }, 401);
  }
  const report = await runHeartbeatSweep(env);
  return json({ tick: 'ok', ...report });
}

async function handleEscalationManual(request, env, ctx) {
  // Manual trigger for the escalation watcher. Same work as the
  // 0 */4 * * * cron. ?age_hours=<N> lowers the threshold for local
  // testing so we don't have to wait 24h for a row to qualify.
  if (!manualTriggerAuthorized(request, env)) {
    return json({ error: 'unauthorized' }, 401);
  }
  const url = new URL(request.url);
  const ageOverride = url.searchParams.get('age_hours');
  const override = ageOverride != null ? { ageHours: Number(ageOverride) } : {};
  const report = await runEscalationSweep(env, override);
  return json({ tick: 'ok', ...report });
}

// runEscalationSweep — query BLOCKED rows owned by LT whose last_event
// is older than ESCALATION_AGE_HOURS; Pushover each one that hasn't
// been alerted within ESCALATION_DEDUP_HOURS. Uses KV (PROCESSED_EVENTS)
// for dedup keys — same binding as idempotency, different key prefix
// ("alert:").
//
// Degrades gracefully: if Pushover secrets aren't set, still scans +
// dedups + logs, just doesn't send the push. This lets LT deploy the
// watcher now and add Pushover secrets later with no code change.
async function runEscalationSweep(env, override = {}) {
  if (!env.NOTION_WORK_QUEUE_DB_ID) {
    return { error: 'NOTION_WORK_QUEUE_DB_ID not set', scanned: 0, escalated: 0 };
  }
  const ageHours = override.ageHours != null
    ? Number(override.ageHours)
    : Number(env.ESCALATION_AGE_HOURS) || 24;
  const dedupHours = Number(env.ESCALATION_DEDUP_HOURS) || 24;
  const owner = override.owner || env.ESCALATION_OWNER || 'LT';

  let rows;
  try {
    rows = await queryBlockedForEscalation(env, env.NOTION_WORK_QUEUE_DB_ID, {
      owner, ageHours,
    });
  } catch (err) {
    return { error: 'query-failed', detail: String(err), scanned: 0, escalated: 0 };
  }

  const results = [];
  for (const row of rows) {
    const dedupKey = `alert:${row.page_id}`;
    const already = await env.PROCESSED_EVENTS.get(dedupKey);
    if (already) {
      results.push({ work_id: row.work_id, status: 'deduped', prev: JSON.parse(already) });
      continue;
    }
    const push = await sendPushover(env, {
      title: `TBM BLOCKED → ${row.exception_owner || owner}: ${row.work_id}`,
      message: [
        row.blocked_reason || '(no reason recorded)',
        '',
        `Category: ${row.failure_category || 'unknown'}`,
        `Age: ${row.age_hours != null ? row.age_hours.toFixed(1) + 'h' : 'unknown'}`,
      ].join('\n'),
      priority: 1, // vibrate — EXCEPTION_ESCALATION tier
      url: row.url || undefined,
      url_title: 'Open in Notion',
    });
    // Only burn the dedup key when Pushover actually delivered. Earlier
    // revision wrote the KV row unconditionally, which meant a deploy
    // with missing Pushover secrets or a transient delivery failure
    // suppressed the real alert for the full dedup window and LT was
    // never paged later. (2026-04-21 audit F3 on PR #45.)
    if (push.sent) {
      await env.PROCESSED_EVENTS.put(
        dedupKey,
        JSON.stringify({ at: Date.now(), work_id: row.work_id }),
        { expirationTtl: dedupHours * 60 * 60 },
      );
      results.push({ work_id: row.work_id, status: 'escalated', pushover: push });
    } else {
      // Skipped (secrets absent) OR send-failed. Short retry TTL so the
      // next sweep retries quickly once secrets land / Pushover recovers,
      // without spamming if sweeps run more often than the retry window.
      const retryTtlSec = Number(env.ESCALATION_RETRY_TTL_SECONDS) || 300;
      await env.PROCESSED_EVENTS.put(
        dedupKey,
        JSON.stringify({
          at: Date.now(),
          work_id: row.work_id,
          retry: true,
          reason: push.skipped ? 'secrets-missing' : 'push-failed',
        }),
        { expirationTtl: retryTtlSec },
      );
      results.push({
        work_id: row.work_id,
        status: push.skipped ? 'skipped-no-secrets' : 'push-failed',
        pushover: push,
      });
    }
  }

  return {
    scanned: rows.length,
    escalated: results.filter((r) => r.status === 'escalated').length,
    deduped: results.filter((r) => r.status === 'deduped').length,
    pushover_active: Boolean(env.PUSHOVER_APP_TOKEN && env.PUSHOVER_USER_KEY),
    results,
  };
}

// runHeartbeatSweep — query stale claimed rows, dispatch reclaim to the
// per-work_id DO for each. Returns a summary report suitable for logging.
async function runHeartbeatSweep(env) {
  if (!env.NOTION_WORK_QUEUE_DB_ID) {
    return { error: 'NOTION_WORK_QUEUE_DB_ID not set', scanned: 0, reclaimed: 0 };
  }
  const nowIso = new Date().toISOString();
  let stale;
  try {
    stale = await queryStaleClaimedRows(env, env.NOTION_WORK_QUEUE_DB_ID, { nowIso });
  } catch (err) {
    return { error: 'query-failed', detail: String(err), scanned: 0, reclaimed: 0 };
  }
  const results = [];
  for (const row of stale) {
    if (!row.work_id) {
      results.push({ page_id: row.page_id, status: 'skipped', reason: 'no-work-id' });
      continue;
    }
    const doId = env.WORK_STATE_MACHINE.idFromName(row.work_id);
    const doStub = env.WORK_STATE_MACHINE.get(doId);
    try {
      const doRes = await doStub.fetch('https://do/?action=reclaim', {
        method: 'POST',
        body: JSON.stringify({ work_id: row.work_id, page_id: row.page_id, nowIso }),
        headers: { 'content-type': 'application/json' },
      });
      results.push(await doRes.json());
    } catch (err) {
      results.push({ work_id: row.work_id, status: 'error', detail: String(err) });
    }
  }
  return {
    scanned: stale.length,
    reclaimed: results.filter((r) => r.status === 'reclaimed').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    errors: results.filter((r) => r.status === 'error').length,
    results,
  };
}

// ---------- helpers ----------

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
