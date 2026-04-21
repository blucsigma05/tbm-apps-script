// Minimal Notion API client — scoped to the TBM Work Queue data source
// (collection://4f35fdb7-02c4-40fa-a0c5-f7c7d787e29e).
//
// Schema verified via notion-fetch 2026-04-19:
//   state              select (14 options: INTAKE ... BLOCKED, §E.11 matrix)
//   last_event_reason  rich_text (audit trail; reason for last transition)
//   last_event         last_edited_time (auto-managed by Notion — DO NOT WRITE)
//   owner              select (LT / tbm-bot / tbm-runner / external — role, not actor)
//   claimed_by         select (tbm-runner / tbm-bot — Execution Dispatch holder)
//   blocked_reason     rich_text (set when state=BLOCKED; failure payload)
//   exception_owner    select (set when state=BLOCKED; §E.5 category)
//   approved           checkbox (LT-only write gate — DO NOT WRITE from worker)
//   work_id            title (TBM-YYYYMMDD-NNN)
//
// Two operations: read current state, write new state + audit reason.
// Native fetch only — no @notionhq/client dep.
//
// NOTE: pageId here is the Notion page UUID, not the TBM work_id title.
// The DO keys by work_id (hashed to DO ID); callers must send pageId
// separately or upstream lookup must resolve work_id → pageId.

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

const PROP_STATE = 'state';
const PROP_REASON = 'last_event_reason';
const PROP_FAILURE_CATEGORY = 'failure_category';
const PROP_BLOCKED_REASON = 'blocked_reason';
const PROP_EXCEPTION_OWNER = 'exception_owner';

export async function getWorkItem(env, pageId) {
  if (!env.NOTION_TOKEN) {
    throw new Error('notion.getWorkItem: NOTION_TOKEN not set');
  }
  const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`notion.getWorkItem(${pageId}): ${res.status} ${text}`);
  }
  const page = await res.json();
  const stateProp = page.properties?.[PROP_STATE];
  // state is "select" per the verified schema; also tolerate "status"
  // in case the type is later migrated.
  const current = stateProp?.select?.name || stateProp?.status?.name || null;
  return { state: current, raw: page };
}

// updateWorkItem accepts optional BLOCKED-state fields. Pass the value to
// set it; pass null (not undefined) to clear it. undefined = leave alone.
//
//   state              required-ish; one of the 14 §E.11 states
//   reason             last_event_reason text
//   failure_category   one of technical/vendor/policy/admin/merge-conflict/deploy-fail
//   blocked_reason     text — failure payload
//   exception_owner    one of LT/tbm-bot/tbm-runner (external is NOT valid here)
// queryStaleClaimedRows — find rows where state=IN-PROGRESS and
// claim_expires_at has passed. Used by the heartbeat watcher (§E.4).
//
// Returns an array of {page_id, work_id, claim_expires_at, claimed_by}
// for each stale row, ready to be reclaimed.
//
// The limit is defensive — if more than `limit` stale rows exist at
// once, something is systemically wrong and the next tick will get them.
export async function queryStaleClaimedRows(env, databaseId, { limit = 50, nowIso } = {}) {
  if (!env.NOTION_TOKEN) {
    throw new Error('notion.queryStaleClaimedRows: NOTION_TOKEN not set');
  }
  if (!databaseId) {
    throw new Error('notion.queryStaleClaimedRows: databaseId is required');
  }
  const cutoff = nowIso || new Date().toISOString();
  const body = {
    filter: {
      and: [
        { property: PROP_STATE, select: { equals: 'IN-PROGRESS' } },
        { property: 'claim_expires_at', date: { before: cutoff } },
      ],
    },
    page_size: limit,
  };
  const res = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`notion.queryStaleClaimedRows: ${res.status} ${text}`);
  }
  const data = await res.json();
  return (data.results || []).map((page) => ({
    page_id: page.id,
    work_id: page.properties?.work_id?.title?.[0]?.plain_text || null,
    claimed_by: page.properties?.claimed_by?.select?.name || null,
    claim_expires_at: page.properties?.claim_expires_at?.date?.start || null,
  }));
}

// queryBlockedForEscalation — find BLOCKED rows with a specific
// exception_owner whose last_event is older than `ageHours`. Used by
// the escalation watcher to decide what needs paging LT.
export async function queryBlockedForEscalation(env, databaseId, {
  owner = 'LT',
  ageHours = 24,
  limit = 50,
} = {}) {
  if (!env.NOTION_TOKEN) {
    throw new Error('notion.queryBlockedForEscalation: NOTION_TOKEN not set');
  }
  if (!databaseId) {
    throw new Error('notion.queryBlockedForEscalation: databaseId is required');
  }
  const cutoff = new Date(Date.now() - ageHours * 60 * 60 * 1000).toISOString();
  // Query in two phases: first filter for state=BLOCKED + owner match
  // (server-side — cheap), then apply the age cutoff client-side. The
  // Notion filter for last_edited_time against a last_edited_time
  // property returns 0 hits here regardless of envelope (`date` vs
  // `last_edited_time`), which is a known Notion quirk when the column
  // has been renamed. Doing the age check client-side sidesteps it.
  const body = {
    filter: {
      and: [
        { property: PROP_STATE, select: { equals: 'BLOCKED' } },
        { property: PROP_EXCEPTION_OWNER, select: { equals: owner } },
      ],
    },
    page_size: limit,
  };
  const res = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`notion.queryBlockedForEscalation: ${res.status} ${text}`);
  }
  const data = await res.json();
  const now = Date.now();
  const cutoffMs = new Date(cutoff).getTime();
  return (data.results || [])
    .map((page) => {
      const lastEvent = page.properties?.last_event?.last_edited_time || null;
      return {
        page_id: page.id,
        work_id: page.properties?.work_id?.title?.[0]?.plain_text || null,
        url: page.url || null,
        blocked_reason: page.properties?.blocked_reason?.rich_text?.[0]?.plain_text || '',
        failure_category: page.properties?.failure_category?.select?.name || null,
        exception_owner: page.properties?.exception_owner?.select?.name || null,
        last_event: lastEvent,
        age_hours: lastEvent ? (now - new Date(lastEvent).getTime()) / 3_600_000 : null,
      };
    })
    // Client-side age filter — see comment above on the Notion-side quirk.
    // Include rows with no last_event (shouldn't happen, but if it does,
    // safer to surface than silently drop).
    .filter((row) => !row.last_event || new Date(row.last_event).getTime() < cutoffMs);
}

// clearClaim — used by the heartbeat watcher to reclaim a stale row.
// Reverts state to READY-TO-BUILD (the only state claims are acquired
// from per §E.4), clears claimed_by + claimed_at + claim_expires_at.
export async function clearClaim(env, pageId, reason) {
  if (!env.NOTION_TOKEN) {
    throw new Error('notion.clearClaim: NOTION_TOKEN not set');
  }
  const properties = {
    [PROP_STATE]: { select: { name: 'READY-TO-BUILD' } },
    [PROP_REASON]: {
      rich_text: [{ type: 'text', text: { content: reason } }],
    },
    claimed_by: { select: null },
    claimed_at: { date: null },
    claim_expires_at: { date: null },
  };
  const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`notion.clearClaim(${pageId}): ${res.status} ${text}`);
  }
  return await res.json();
}

export async function updateWorkItem(env, pageId, {
  state,
  reason,
  failure_category,
  blocked_reason,
  exception_owner,
}) {
  if (!env.NOTION_TOKEN) {
    throw new Error('notion.updateWorkItem: NOTION_TOKEN not set');
  }
  const properties = {};
  if (state !== undefined) {
    // Verified: the state column is "select" (not "status"). Writing with
    // the wrong type-envelope gets a 400 from Notion.
    properties[PROP_STATE] = { select: { name: state } };
  }
  if (reason !== undefined) {
    properties[PROP_REASON] = {
      rich_text: [{ type: 'text', text: { content: reason } }],
    };
  }
  if (failure_category !== undefined) {
    properties[PROP_FAILURE_CATEGORY] =
      failure_category === null ? { select: null } : { select: { name: failure_category } };
  }
  if (blocked_reason !== undefined) {
    properties[PROP_BLOCKED_REASON] =
      blocked_reason === null
        ? { rich_text: [] }
        : { rich_text: [{ type: 'text', text: { content: blocked_reason } }] };
  }
  if (exception_owner !== undefined) {
    properties[PROP_EXCEPTION_OWNER] =
      exception_owner === null ? { select: null } : { select: { name: exception_owner } };
  }
  // Intentionally NOT writing last_event — it's last_edited_time, auto-managed.
  // Intentionally NOT writing approved — LT-only gate per §E.4.

  const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`notion.updateWorkItem(${pageId}): ${res.status} ${text}`);
  }
  return await res.json();
}
