#!/usr/bin/env node
// Integration test suite for the cp-events worker.
//
// Runs end-to-end against the deployed Cloudflare Worker. Creates its own
// scratch WQ row, drives every supported behavior, asserts results, then
// archives the row. Zero deps — uses Node's stdlib (fetch, crypto, node:test).
//
// Usage:
//   NOTION_TOKEN=<secret> HMAC_SECRET_NOTION=<secret> node test/integration.mjs
//
// Optional env:
//   WORKER_URL         default: https://tbm-cp-events.lthompson.workers.dev
//   WQ_DB_ID           default: b1c21d2691e64dba90e81944d2cd4862
//   WQ_DATA_SOURCE_ID  default: 4f35fdb7-02c4-40fa-a0c5-f7c7d787e29e
//
// Exits 0 on all-pass, 1 on any failure. Prints a summary table at the end.

import { createHmac } from 'node:crypto';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const HMAC_SECRET = process.env.HMAC_SECRET_NOTION;
const WORKER_URL = process.env.WORKER_URL || 'https://tbm-cp-events.lthompson.workers.dev';
const WQ_DB_ID = process.env.WQ_DB_ID || 'b1c21d2691e64dba90e81944d2cd4862';
const WQ_DATA_SOURCE_ID = process.env.WQ_DATA_SOURCE_ID || '4f35fdb7-02c4-40fa-a0c5-f7c7d787e29e';
const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

if (!NOTION_TOKEN || !HMAC_SECRET) {
  console.error('ERROR: NOTION_TOKEN and HMAC_SECRET_NOTION env vars are required.');
  process.exit(2);
}

// ---------- test runner ----------

const results = [];
let currentSection = 'setup';

function section(name) {
  currentSection = name;
  console.log(`\n=== ${name} ===`);
}

function pass(name, detail = '') {
  results.push({ section: currentSection, name, status: 'PASS', detail });
  console.log(`  ✓ ${name}${detail ? '  — ' + detail : ''}`);
}

function fail(name, detail) {
  results.push({ section: currentSection, name, status: 'FAIL', detail });
  console.log(`  ✗ ${name}  — ${detail}`);
}

function assertEq(name, expected, actual) {
  if (expected === actual) {
    pass(name, `= ${JSON.stringify(actual)}`);
  } else {
    fail(name, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ---------- Notion helpers ----------

async function notionFetch(path, init = {}) {
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const body = await res.text();
  let parsed;
  try { parsed = JSON.parse(body); } catch { parsed = body; }
  if (!res.ok) {
    throw new Error(`Notion ${init.method || 'GET'} ${path}: ${res.status} ${body}`);
  }
  return parsed;
}

async function createTestRow() {
  const workId = `PIPE-TEST-${Date.now()}`;
  const page = await notionFetch('/pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: { database_id: WQ_DB_ID },
      properties: {
        work_id: { title: [{ type: 'text', text: { content: workId } }] },
        state: { select: { name: 'INTAKE' } },
        last_event_reason: {
          rich_text: [{ type: 'text', text: { content: 'integration test setup' } }],
        },
        owner: { select: { name: 'tbm-bot' } },
        area: { multi_select: [{ name: 'infra' }] },
        severity: { select: { name: 'minor' } },
      },
    }),
  });
  return { work_id: workId, page_id: page.id };
}

async function archivePage(pageId) {
  await notionFetch(`/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ archived: true }),
  });
}

async function setStaleClaim(pageId) {
  // Manually put row into IN-PROGRESS with an expired claim. Used by the
  // heartbeat scenario — we can't reach IN-PROGRESS through the worker
  // because claim fields aren't in the /events/notion contract.
  await notionFetch(`/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      properties: {
        state: { select: { name: 'IN-PROGRESS' } },
        claimed_by: { select: { name: 'tbm-runner' } },
        claimed_at: { date: { start: '2026-01-01T00:00:00Z' } },
        claim_expires_at: { date: { start: '2026-01-01T00:30:00Z' } },
      },
    }),
  });
}

async function getPageState(pageId) {
  const page = await notionFetch(`/pages/${pageId}`);
  const p = page.properties || {};
  return {
    state: p.state?.select?.name || null,
    failure_category: p.failure_category?.select?.name || null,
    exception_owner: p.exception_owner?.select?.name || null,
    blocked_reason: p.blocked_reason?.rich_text?.[0]?.plain_text || '',
    claimed_by: p.claimed_by?.select?.name || null,
    claim_expires_at: p.claim_expires_at?.date?.start || null,
  };
}

// ---------- worker helpers ----------

function sign(body) {
  return 'sha256=' + createHmac('sha256', HMAC_SECRET).update(body).digest('hex');
}

async function postEvent(payload, { signature } = {}) {
  const body = JSON.stringify(payload);
  const sig = signature === undefined ? sign(body) : signature;
  const res = await fetch(`${WORKER_URL}/events/notion`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-notion-signature': sig,
    },
    body,
  });
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: res.status, body: parsed };
}

async function getHealth() {
  const res = await fetch(`${WORKER_URL}/events/health`);
  return { status: res.status, body: await res.json() };
}

async function triggerHeartbeat() {
  const res = await fetch(`${WORKER_URL}/events/heartbeat-tick`);
  return { status: res.status, body: await res.json() };
}

// ---------- scenarios ----------

async function run() {
  section('health');
  const h = await getHealth();
  assertEq('GET /events/health returns 200', 200, h.status);
  assertEq('KV binding present', true, h.body?.bindings?.kv_processed);
  assertEq('DO binding present', true, h.body?.bindings?.do_work_state);

  section('setup');
  const row = await createTestRow();
  pass(`created test row ${row.work_id}`, row.page_id);

  const common = { work_id: row.work_id, page_id: row.page_id };

  try {
    section('signature + validation');
    {
      const r = await postEvent({ ...common }, { signature: 'sha256=deadbeef' });
      assertEq('bad signature → 401', 401, r.status);
      assertEq('error body is bad-signature', 'bad-signature', r.body?.error);
    }
    {
      const r = await postEvent({ work_id: 'x' }); // missing most fields
      assertEq('missing fields → 400', 400, r.status);
      assertEq('error is missing-fields', 'missing-fields', r.body?.error);
    }

    section('legal transitions');
    {
      const r = await postEvent({
        ...common,
        target_state: 'SPEC-DRAFTING',
        idempotency_key: 'int-test-1-' + Date.now(),
        reason: 'integration test 1',
      });
      assertEq('INTAKE → SPEC-DRAFTING → 200', 200, r.status);
      assertEq('body.status = transitioned', 'transitioned', r.body?.status);
      assertEq('from_state = INTAKE', 'INTAKE', r.body?.from_state);
      assertEq('to_state = SPEC-DRAFTING', 'SPEC-DRAFTING', r.body?.to_state);
    }
    {
      const notion = await getPageState(row.page_id);
      assertEq('Notion row state = SPEC-DRAFTING', 'SPEC-DRAFTING', notion.state);
    }
    {
      const r = await postEvent({
        ...common,
        target_state: 'READY-TO-BUILD',
        idempotency_key: 'int-test-2-' + Date.now(),
        reason: 'integration test 2',
      });
      assertEq('SPEC-DRAFTING → READY-TO-BUILD → 200', 200, r.status);
    }

    section('idempotency');
    {
      const FIXED_KEY = 'int-test-idempotent-' + Date.now();
      const r1 = await postEvent({
        ...common,
        target_state: 'IN-PROGRESS',
        idempotency_key: FIXED_KEY,
        reason: 'first call with fixed key',
      });
      assertEq('first call → 200', 200, r1.status);
      assertEq('first call status = transitioned', 'transitioned', r1.body?.status);
      const originalAt = r1.body?.at;

      const r2 = await postEvent({
        ...common,
        target_state: 'IN-PROGRESS',
        idempotency_key: FIXED_KEY,
        reason: 'replay — different reason to prove cache wins',
      });
      assertEq('replay → 200', 200, r2.status);
      assertEq('replay status = already-processed', 'already-processed', r2.body?.status);
      assertEq('replay returns original at=', originalAt, r2.body?.previous_result?.at);
    }

    section('invalid transitions');
    {
      const r = await postEvent({
        ...common,
        target_state: 'DEPLOYED',
        idempotency_key: 'int-invalid-' + Date.now(),
        reason: 'IN-PROGRESS → DEPLOYED (illegal skip)',
      });
      assertEq('invalid transition → 422', 422, r.status);
      assertEq('error = invalid-transition', 'invalid-transition', r.body?.error);
      assertEq('from = IN-PROGRESS', 'IN-PROGRESS', r.body?.from);
      assertEq('to = DEPLOYED', 'DEPLOYED', r.body?.to);
    }

    section('BLOCKED state');
    {
      // Missing failure_category
      const r = await postEvent({
        ...common,
        target_state: 'BLOCKED',
        idempotency_key: 'int-blocked-nofields-' + Date.now(),
        reason: 'no failure_category',
      });
      assertEq('BLOCKED without failure_category → 400', 400, r.status);
      assertEq('error = missing-blocked-fields', 'missing-blocked-fields', r.body?.error);
    }
    {
      // Technical failure — default owner = tbm-bot
      const r = await postEvent({
        ...common,
        target_state: 'BLOCKED',
        idempotency_key: 'int-blocked-tech-' + Date.now(),
        reason: 'simulated technical failure',
        failure_category: 'technical',
        blocked_reason: 'Integration test: simulated technical failure payload',
      });
      assertEq('BLOCKED technical → 200', 200, r.status);
      assertEq('failure_category echoed', 'technical', r.body?.failure_category);
      assertEq('exception_owner defaults to tbm-bot', 'tbm-bot', r.body?.exception_owner);
    }
    {
      const notion = await getPageState(row.page_id);
      assertEq('Notion state = BLOCKED', 'BLOCKED', notion.state);
      assertEq('Notion failure_category = technical', 'technical', notion.failure_category);
      assertEq('Notion exception_owner = tbm-bot', 'tbm-bot', notion.exception_owner);
    }
    {
      // Resolution — expect fields cleared
      const r = await postEvent({
        ...common,
        target_state: 'IN-PROGRESS',
        idempotency_key: 'int-blocked-resolve-' + Date.now(),
        reason: 'resolution: bot retried successfully',
      });
      assertEq('BLOCKED → IN-PROGRESS (resolution) → 200', 200, r.status);
    }
    {
      const notion = await getPageState(row.page_id);
      assertEq('Notion state after resolution = IN-PROGRESS', 'IN-PROGRESS', notion.state);
      assertEq('failure_category cleared', null, notion.failure_category);
      assertEq('exception_owner cleared', null, notion.exception_owner);
      assertEq('blocked_reason cleared', '', notion.blocked_reason);
    }
    {
      // Policy failure — default owner = LT
      const r = await postEvent({
        ...common,
        target_state: 'BLOCKED',
        idempotency_key: 'int-blocked-policy-' + Date.now(),
        reason: 'simulated policy escalation',
        failure_category: 'policy',
        blocked_reason: 'Integration test: requires LT decision',
      });
      assertEq('BLOCKED policy → 200', 200, r.status);
      assertEq('exception_owner defaults to LT', 'LT', r.body?.exception_owner);
    }
    {
      // Cleanup: back to IN-PROGRESS for heartbeat scenario
      const r = await postEvent({
        ...common,
        target_state: 'IN-PROGRESS',
        idempotency_key: 'int-blocked-cleanup-' + Date.now(),
        reason: 'cleanup back to IN-PROGRESS',
      });
      assertEq('BLOCKED → IN-PROGRESS (cleanup) → 200', 200, r.status);
    }

    section('heartbeat watcher');
    {
      // Clean state — row is IN-PROGRESS but no claim fields, so not stale.
      const r = await triggerHeartbeat();
      assertEq('clean scan → 200', 200, r.status);
      assertEq('clean scan scanned = 0', 0, r.body?.scanned);
    }
    {
      // Simulate stale claim — set claim fields via direct Notion API.
      await setStaleClaim(row.page_id);
      pass('stale claim set on test row');
      const r = await triggerHeartbeat();
      assertEq('stale scan → 200', 200, r.status);
      assertEq('scanned = 1', 1, r.body?.scanned);
      assertEq('reclaimed = 1', 1, r.body?.reclaimed);
      const result = r.body?.results?.[0];
      assertEq('reclaim status = reclaimed', 'reclaimed', result?.status);
      assertEq('reclaim from_state = IN-PROGRESS', 'IN-PROGRESS', result?.from_state);
      assertEq('reclaim to_state = READY-TO-BUILD', 'READY-TO-BUILD', result?.to_state);
    }
    {
      const notion = await getPageState(row.page_id);
      assertEq('Notion state after reclaim = READY-TO-BUILD', 'READY-TO-BUILD', notion.state);
      assertEq('claimed_by cleared', null, notion.claimed_by);
      assertEq('claim_expires_at cleared', null, notion.claim_expires_at);
    }
  } finally {
    section('teardown');
    try {
      await archivePage(row.page_id);
      pass(`archived test row ${row.work_id}`);
    } catch (err) {
      fail(`archive ${row.work_id}`, String(err));
    }
  }

  // ---------- summary ----------
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log('\n' + '='.repeat(60));
  console.log(`RESULT: ${passed} passed, ${failed} failed (total ${results.length})`);
  console.log('='.repeat(60));
  if (failed > 0) {
    console.log('\nFailures:');
    for (const r of results.filter((x) => x.status === 'FAIL')) {
      console.log(`  [${r.section}] ${r.name}: ${r.detail}`);
    }
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('INTEGRATION TEST RUNNER CRASHED:', err);
  process.exit(2);
});
