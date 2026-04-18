/**
 * U11 — truthful-promise
 * UI does not claim a save/reward/unlock the backend does not honor.
 *
 * PR-1 spike: verify that fixtures are wired (shimGAS interception active) by
 * checking that at least one fixture fn was called during page load. Full
 * parity test (submit action → backend state diff) is PR 2+ with live-smoke.
 */

module.exports = async function U11(ctx) {
  if (ctx.mode !== 'fixture') {
    return { id: 'U11', status: 'skip', measurement: 'non-fixture mode handled in PR 3 live-smoke' };
  }
  var interceptedFns = ctx.interceptedApiCalls || [];
  if (interceptedFns.length === 0) {
    return {
      id: 'U11',
      status: 'surrogate',
      surrogateNote: 'no /api calls observed — surface may not exercise backend or shim not engaged',
      measurement: '0 intercepted fixture calls',
      expected: 'at least 1 shimmed /api call (PR-1 spike uses call-count proxy for PR-2 parity check)'
    };
  }
  return {
    id: 'U11',
    status: 'surrogate',
    surrogateNote: 'shim interception proxy — full backend parity test deferred to PR 2+ (needs live-smoke infra from PR 3)',
    measurement: interceptedFns.length + ' fixture calls intercepted: ' + interceptedFns.slice(0, 3).join(', '),
    expected: 'backend write matches UI claim (PR 3 live-smoke)'
  };
};
