// Pushover client — thin wrapper around the Pushover messages API.
//
// Secrets (optional at deploy time):
//   PUSHOVER_APP_TOKEN    Pushover "application" token
//   PUSHOVER_USER_KEY     user/group key for LT
//
// If either is missing, sendPushover logs and returns {skipped: true}
// instead of throwing. That lets the worker run in a degraded "log-only"
// mode while LT hasn't set secrets yet — useful for the escalation
// watcher during initial rollout.
//
// Priority conventions (§ Alert Tiers in CLAUDE.md):
//   -2  DEPLOY_OK                 silent
//   -1  HYGIENE_REPORT_LOW        quiet delivery
//    0  CHORE_APPROVAL, BACKLOG_STALE, CLAUDE_MD_BLOAT   normal
//    1  TILLER_STALE, SYSTEM_ERROR, SECRET_EXPIRING, CLOSE_OVERDUE,
//        EXCEPTION_ESCALATION    vibrate
//    2  PROD_DOWN, DEPLOY_FAIL, GATE_BREACH    emergency + ack required

export async function sendPushover(env, { title, message, priority = 0, url, url_title }) {
  if (!env.PUSHOVER_APP_TOKEN || !env.PUSHOVER_USER_KEY) {
    console.log('pushover skipped — secrets not set', { title });
    return { skipped: true, reason: 'no-secrets' };
  }
  const params = new URLSearchParams({
    token: env.PUSHOVER_APP_TOKEN,
    user: env.PUSHOVER_USER_KEY,
    title,
    message,
    priority: String(priority),
  });
  if (url) params.set('url', url);
  if (url_title) params.set('url_title', url_title);

  // Priority 2 requires retry + expire; wire defaults so callers don't
  // have to remember.
  if (priority === 2) {
    params.set('retry', '60');   // seconds between re-notify
    params.set('expire', '3600'); // give up after 1h
  }

  try {
    const res = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const result = await res.json().catch(() => ({}));
    return { sent: res.ok, status: result.status, request: result.request };
  } catch (err) {
    // Don't let Pushover outage block the caller's workflow — log and swallow.
    console.error('pushover send failed', { title, error: String(err) });
    return { sent: false, error: String(err) };
  }
}
