# TBM Deploy Freeze — Contract and Policy

<!-- P0 items 21-24: runtime gate + pre-push gate + testing + documentation -->
<!-- consumes P0-103 mutation-path inventory for the 19 freeze-critical sites -->
<!-- consumes P0-105 fallback-policy patterns for user-facing banners -->

## Purpose

A deploy freeze halts production-truth mutations during risky windows: major deploys, data migrations, incident response, end-of-month financial close. P0-103 identified 79 mutation sites; 19 are `freeze-critical` (money, kid truth, household config). The other 60 are `freeze-safe` (observability, retry state, caches) and keep running — freeze means "truth stops," not "system stops."

## LT decisions locked (2026-04-16)

1. **Freeze lift:** Both — LT can pass `expiresAt`; if omitted, defaults to 24h auto-lift.
2. **Emergency bypass:** Signed token, 1h expiry, per-mutation audit trail.
3. **Kid surface UX:** Blue banner + P0-105 `queue` pattern (localStorage buffer, sync on lift).
4. **Ambient surface UX:** Subtle "FROZEN" watermark in corner.

## Architecture — two-layer gate
```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Pre-push gate (audit-source.sh → item 22)      │
│                                                         │
│ clasp push attempts → audit-source.sh checks            │
│   clasp run getFreezeState_()                           │
│   If frozen + no EMERGENCY=1 → FAIL                     │
└─────────────────────────────────────────────────────────┘
                       ↓ (if deploy lands)
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Runtime gate (item 21)                         │
│                                                         │
│ 19 freeze-critical Safe wrappers check                  │
│   assertNotFrozen_('freeze-critical', funcName)         │
│   If frozen + no emergency token → throw FROZEN error   │
│   Error logged to ErrorLog + Pushover to LT (debounced) │
└─────────────────────────────────────────────────────────┘
```

60 freeze-safe wrappers don't check. Observability/heartbeat/cache regeneration keeps flowing.

## State model

Single Script Property `DEPLOY_FREEZE` stores JSON:
```json
{
  "active": true,
  "reason": "mid-migration — wave-8 KH schema",
  "activatedBy": "LT",
  "activatedAt": "2026-04-16T10:30:00Z",
  "expiresAt": "2026-04-17T10:30:00Z",
  "dryRun": false
}
```

When `active: false` or property missing, freeze is not in effect.

Emergency bypass is a separate Script Property `DEPLOY_FREEZE_EMERGENCY`:
```json
{
  "tokenId": "em_7f3a2b1c9d4e",
  "reason": "JJ chore stuck, manual fix",
  "issuedBy": "LT",
  "issuedAt": "2026-04-16T12:00:00Z",
  "expiresAt": "2026-04-16T13:00:00Z"
}
```

Token ID appears in every bypass-mutation log entry.

## API contract (FreezeGate.js)

### `setFreeze_(reason, expiresAt)` — LT-only activation
```javascript
/**
 * Activate freeze. Only callable via clasp run.
 * @param {string} reason — required, surfaces in logs and Pushover
 * @param {string} [expiresAt] — ISO 8601. If omitted, defaults to +24h.
 * @returns {{active: true, expiresAt: string}}
 */
function setFreeze_(reason, expiresAt) { ... }
```
Stores JSON in `DEPLOY_FREEZE`. Fires Pushover: `GATE_BREACH` priority (per AlertEngine tier list — freeze activation is a gate event). Logs to ErrorLog: `{ tag: 'FREEZE_ACTIVATED', reason, activatedBy, expiresAt }`.

### `liftFreeze_()` — LT-only manual lift
```javascript
function liftFreeze_() { ... } // Clears DEPLOY_FREEZE property
```
Pushover: `HYGIENE_REPORT_LOW` priority. Log appended with duration + total mutation attempts blocked.

### `getFreezeState_()` — readable by any caller + audit-source.sh
```javascript
function getFreezeState_() {
  var raw = PropertiesService.getScriptProperties().getProperty('DEPLOY_FREEZE');
  if (!raw) return { active: false };
  var parsed = JSON.parse(raw);
  if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
    liftFreeze_();
    return { active: false, autoExpired: true };
  }
  return parsed;
}
```
Auto-expiry happens lazily on first read after expiresAt. No separate cron needed.

### `assertNotFrozen_(tag, callerName)` — guard at top of every freeze-critical wrapper
```javascript
/**
 * Throw FROZEN error if freeze active and no valid emergency token.
 * Call at top of any freeze-critical Safe wrapper (19 sites per P0-103).
 * @throws {Error} if frozen without bypass
 */
function assertNotFrozen_(tag, callerName) {
  var state = getFreezeState_();
  if (!state.active) return;
  if (state.dryRun) {
    logError_('FROZEN_DRY_RUN', 'Would block ' + callerName + ' (dry-run mode)');
    return; // Dry-run: log but don't block
  }
  var emergency = validateEmergencyToken_();
  if (emergency.valid) {
    logError_('FROZEN_BYPASS', JSON.stringify({
      caller: callerName, tag: tag,
      tokenId: emergency.tokenId, reason: emergency.reason
    }));
    return; // Bypass allowed; logged
  }
  // Blocked path
  incrementBlockCounter_();
  logError_('FROZEN_BLOCK', JSON.stringify({
    caller: callerName, tag: tag, freezeReason: state.reason
  }));
  debouncedPushover_('FROZEN_BLOCK', callerName);
  throw new Error('FROZEN: ' + callerName + ' blocked during freeze (' + state.reason + ')');
}
```

### `generateEmergencyToken_(reason, minutes)` — LT-only
Token is `'em_' + Utilities.getUuid().slice(0,12)`. Stored in `DEPLOY_FREEZE_EMERGENCY` with expiry. Pushover: `GATE_BREACH` priority ("Emergency bypass active, expires at…").

### `validateEmergencyToken_()` — internal
Reads `DEPLOY_FREEZE_EMERGENCY`, checks expiry, returns `{valid: bool, tokenId, reason}`. Expired tokens auto-clear.

### `setFreezeDryRun_(bool)` — testing
Flips `dryRun` flag in DEPLOY_FREEZE state. When true, gate logs "would block" but doesn't throw. Lets us exercise the gate in prod without blocking.

## The 19 freeze-critical wrappers

From `ops/mutation-paths.md` — these get `assertNotFrozen_(tag, funcName)` at top of try block or withMonitor_ callback:

| # | File | Safe wrapper / function | tag |
|---|---|---|---|
| 1-2 | Code-KidsHub.gs.js | `khCompleteTaskSafe` | `freeze-critical` |
| 3 | Code-KidsHub.gs.js | `khCompleteTaskWithBonusSafe` | `freeze-critical` |
| 4-5 | Code-KidsHub.gs.js | `khApproveTaskSafe` (wraps KidsHub.js:1533+1544) | `freeze-critical` |
| 6 | Code-KidsHub.gs.js | `khSubmitGradeSafe` (wraps KidsHub.js:1816) | `freeze-critical` |
| 7 | Code.js | `logHomeworkCompletionSafe` (wraps Code.js:994) | `freeze-critical` |
| 8 | Code.js | `logSparkleProgressSafe` (wraps Code.js:1034) | `freeze-critical` |
| 9 | Code-Finance.gs.js | `updateFamilyNoteSafe` (wraps DataEngine.js:3322) | `freeze-critical` |
| 10 | Utility.js | `fixParentPINColumn` (direct, lines 32+40) | `freeze-critical` |
| 11 | Utility.js | `fixStaleDuplicates` (direct, lines 92-94+102-104) | `freeze-critical` |
| 12 | Utility.js | `seedAmazonOrderHistory` (direct, line 548) | `freeze-critical` |
| 13 | Utility.js | `matchAmazonToTiller` (direct, lines 635-636) | `freeze-critical` |

> **Note on Code.js:1467 (mutation-paths #7):** mutation-paths.md classifies the `notionApi_()` helper at line 1467 as freeze-critical ("parent config"). Review by LT needed — `notionApi_()` is also called by CI pipeline relay (`pipelineRelaySafe`). Addguarding to `notionApi_()` directly would block pipeline events during a freeze. Resolution pending; track in Issue #368.

## audit-source.sh pre-push gate (item 22)

Check 6 added before SUMMARY. Calls `clasp run getFreezeState_()` via jq. Fails fast on `active: true`. Skips if `EMERGENCY=1` is set. Skips gracefully if clasp/jq unavailable.

`EMERGENCY=1` bypass requires the commit message to start with `EMERGENCY: <reason>` (existing hook pattern from CLAUDE.md).

## User-facing banners (per P0-105 fallback-policy alignment)

| Surface class | Banner | Pattern |
|---|---|---|
| `/buggsy`, `/jj` (kid ChoreBoards) | Blue strip top: "System paused — your work is saved. Syncs when ready." | `queue` — P0-105 |
| `/homework`, `/reading`, `/writing`, other Buggsy education | Amber strip: "Paused — ask Mom or Dad." | `refuse-clearly` — matches PR #349 pattern |
| `/sparkle`, `/sparkle-kingdom`, `/daily-adventures` (JJ) | Visual + Nia audio: "We're fixing something — let's try again in a minute!" → auto-redirect to sparkle-kingdom | `redirect-with-notice` — P0-105 |
| `/parent` | Red strip: "System frozen. Contact LT." | `refuse-clearly` |
| `/pulse`, `/vein` (interactive finance) | Red strip: "Frozen — read-only mode. Contact LT to lift." | `refuse-clearly` |
| `/spine`, `/soul` (ambient) | Small "FROZEN" watermark bottom-right corner | Read-only cached continues |

Implementation: each surface checks freeze state on page load via a new `/api?fn=getFreezeState_` call (no auth needed — state is not sensitive). Renders appropriate banner. Polls every 30s; auto-clears banner when lifted.

> **HTML banner status:** Deferred to follow-up PR. Core runtime gate (FreezeGate.js + Safe wrappers) shipped in this PR. The banners are a UX communication layer on top of the working gate. See Issue #368.

## Testing strategy (item 23)

### Unit tests (TBMRegressionsuite.gs.js v7)

| ID | Test | Pass condition |
|---|---|---|
| FREEZE-001 | `setFreeze_` activates; `getFreezeState_` returns `active: true` with reason | `state.active === true && state.reason === expected` |
| FREEZE-002 | `liftFreeze_` clears state; `getFreezeState_` returns `active: false` | `state.active === false` after lift |
| FREEZE-003 | `assertNotFrozen_` throws when freeze active (no bypass) | Error message starts with `FROZEN:` |
| FREEZE-004 | `assertNotFrozen_` does NOT throw with valid emergency token | No throw; bypass log entry present |
| FREEZE-005 | `getFreezeState_` auto-expires past-`expiresAt` freeze | `state.active === false && state.autoExpired === true` |

### Integration test (one-time, scheduled off-hours)

LT or build thread executes once to prove end-to-end:
1. `setFreezeDryRun_(true)` → activate freeze with 5-minute `expiresAt`
2. Attempt a freeze-critical mutation via `/parent` approval → confirm "would block" log entry fires, mutation proceeds
3. `setFreezeDryRun_(false)`, leave freeze active
4. Attempt same mutation → confirm block + Pushover + ErrorLog entry
5. Generate emergency token with 2-minute expiry
6. Attempt mutation → confirm bypass log entry, mutation proceeds
7. Wait 3 minutes (token expires) → attempt mutation → confirm block resumes
8. Wait for freeze auto-expiry at 5-minute mark → attempt → confirm no block

Log the full run as a comment on Issue #370.

## Policy — when to freeze (item 24)

**Set freeze BEFORE:**
- Any migration that touches `KH_Chores`, `KH_History`, `KH_Rewards`, `KH_Children` schema
- Finance model changes that modify `DebtModel` or `Dashboard_Export` structure
- Parent approval flow changes mid-Sunday
- End-of-month close (MER gates) if ambient data could mislead
- Any PR that modifies ≥5 freeze-critical call sites at once

**Do NOT set freeze for:**
- Cosmetic HTML changes
- Server-side logic that only affects freeze-safe sites
- Routine deploys with no state-schema impact
- Documentation-only PRs

**Who can set/lift:**
- LT primary
- Automated triggers (not yet built — P8 scope) can set freeze with `activatedBy: 'automation'` tag

**Who can use emergency bypass:**
- LT only. Token issuance requires clasp run access (LT-only by default — no other account has clasp auth).

## Logging contract

Every freeze-related event lands in ErrorLog with specific tags:

| Tag | When | Pushover priority |
|---|---|---|
| `FREEZE_ACTIVATED` | `setFreeze_` called | `GATE_BREACH` (2) |
| `FREEZE_LIFTED` | `liftFreeze_` called OR auto-expiry triggered | `HYGIENE_REPORT_LOW` (-1) |
| `FROZEN_BLOCK` | `assertNotFrozen_` threw (mutation blocked) | `SYSTEM_ERROR` (1), debounced 10min |
| `FROZEN_BYPASS` | bypass token used | `GATE_BREACH` (2) on first use per token |
| `FROZEN_DRY_RUN` | dry-run mode logged would-block | Silent (log only) |
| `EMERGENCY_TOKEN_ISSUED` | `generateEmergencyToken_` called | `GATE_BREACH` (2) |
| `EMERGENCY_TOKEN_EXPIRED` | validation detected expired token | Silent (log only) |

## Update rule

Any PR that adds a new freeze-critical mutation site (new Safe wrapper writing to money/kid-truth/household-config) MUST add `assertNotFrozen_(tag, funcName)` at the top of the wrapper AND update `ops/mutation-paths.md` inventory. Enforced by `hyg-14-rubric-drift.yml` extension.

## Change log

| Date | Version | Change |
|---|---|---|
| 2026-04-16 | 1.0 | Initial design. 4 LT decisions locked. 19 wrappers instrumented (from updated mutation-paths.md). Two-layer gate (runtime + pre-push). Auto-expiry + signed-token bypass. HTML banners deferred to follow-up PR. |
