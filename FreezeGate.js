// ════════════════════════════════════════════════════════════════════
// FreezeGate.js v1 — Deploy Freeze runtime gate (P0-21)
// WRITES TO: Script Properties (DEPLOY_FREEZE, DEPLOY_FREEZE_EMERGENCY,
//            FREEZE_BLOCK_COUNT, FREEZE_LAST_PUSH)
// READS FROM: Script Properties
// DEPENDS ON: GASHardening.js (logError_), AlertEngine.js (sendPush_, PUSHOVER_PRIORITY)
// CONSUMES: ops/mutation-paths.md freeze-critical list (19 sites)
// ════════════════════════════════════════════════════════════════════
// Version history tracked in Notion deploy page. Do not add version comments here.

function getFreezeGateVersion() { return 1; }

// ── Public API ─────────────────────────────────────────────────────

/**
 * Activate deploy freeze. Only invoke via clasp run.
 * @param {string} reason - Required. Surfaces in logs and Pushover.
 * @param {string} [expiresAt] - ISO 8601. If omitted, defaults to +24h.
 * @returns {{active: boolean, expiresAt: string, reason: string}}
 */
function setFreeze_(reason, expiresAt) {
  if (!reason) throw new Error('setFreeze_: reason is required');
  var now = new Date();
  var expiry = expiresAt ? new Date(expiresAt) : new Date(now.getTime() + 24 * 60 * 60 * 1000);
  var state = {
    active: true,
    reason: String(reason),
    activatedBy: 'LT',
    activatedAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
    dryRun: false
  };
  PropertiesService.getScriptProperties().setProperty('DEPLOY_FREEZE', JSON.stringify(state));
  PropertiesService.getScriptProperties().setProperty('FREEZE_BLOCK_COUNT', '0');
  if (typeof logError_ === 'function') {
    logError_('FREEZE_ACTIVATED', new Error(JSON.stringify({
      reason: reason, activatedBy: 'LT', expiresAt: expiry.toISOString()
    })));
  }
  if (typeof sendPush_ === 'function') {
    try {
      sendPush_('Deploy Freeze ACTIVE', 'Freeze activated: ' + reason + ' | Expires: ' + expiry.toISOString(), 'LT', PUSHOVER_PRIORITY.GATE_BREACH);
    } catch(e) { Logger.log('FreezeGate: sendPush_ failed: ' + e.message); }
  }
  return { active: true, expiresAt: expiry.toISOString(), reason: reason };
}

/**
 * Lift freeze manually. Only invoke via clasp run.
 * @returns {{active: boolean, blockedCount: number, durationMinutes: number}}
 */
function liftFreeze_() {
  var raw = PropertiesService.getScriptProperties().getProperty('DEPLOY_FREEZE');
  var blockedCount = parseInt(PropertiesService.getScriptProperties().getProperty('FREEZE_BLOCK_COUNT') || '0', 10);
  var durationMin = 0;
  if (raw) {
    try {
      var prev = JSON.parse(raw);
      if (prev.activatedAt) {
        durationMin = Math.round((new Date() - new Date(prev.activatedAt)) / 60000);
      }
    } catch(e) {}
  }
  PropertiesService.getScriptProperties().deleteProperty('DEPLOY_FREEZE');
  PropertiesService.getScriptProperties().deleteProperty('FREEZE_BLOCK_COUNT');
  PropertiesService.getScriptProperties().deleteProperty('FREEZE_LAST_PUSH');
  if (typeof logError_ === 'function') {
    logError_('FREEZE_LIFTED', new Error(JSON.stringify({
      liftedBy: 'LT', blockedCount: blockedCount, durationMinutes: durationMin
    })));
  }
  if (typeof sendPush_ === 'function') {
    try {
      sendPush_('Deploy Freeze lifted', 'Duration: ' + durationMin + 'min | Blocked: ' + blockedCount + ' mutations', 'LT', PUSHOVER_PRIORITY.HYGIENE_REPORT_LOW);
    } catch(e) { Logger.log('FreezeGate: sendPush_ failed: ' + e.message); }
  }
  return { active: false, blockedCount: blockedCount, durationMinutes: durationMin };
}

/**
 * Read current freeze state. Auto-expires if expiresAt has passed.
 * Safe to call from any context including audit-source.sh via clasp run.
 * @returns {{active: boolean, [reason]: string, [expiresAt]: string, [autoExpired]: boolean}}
 */
function getFreezeState_() {
  var raw = PropertiesService.getScriptProperties().getProperty('DEPLOY_FREEZE');
  if (!raw) return { active: false };
  var parsed;
  try { parsed = JSON.parse(raw); } catch(e) { return { active: false }; }
  if (!parsed || !parsed.active) return { active: false };
  if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
    liftFreeze_();
    return { active: false, autoExpired: true };
  }
  return parsed;
}

/**
 * Guard call at top of every freeze-critical Safe wrapper.
 * Throws FROZEN error if freeze is active and no valid emergency token.
 * In dry-run mode, logs but does NOT throw.
 * @param {string} tag - 'freeze-critical' for the 19 known sites.
 * @param {string} callerName - The Safe wrapper function name for logging.
 * @throws {Error} if frozen without bypass
 */
function assertNotFrozen_(tag, callerName) {
  var state = getFreezeState_();
  if (!state.active) return;
  if (state.dryRun) {
    if (typeof logError_ === 'function') {
      logError_('FROZEN_DRY_RUN', new Error(JSON.stringify({ caller: callerName, tag: tag, reason: state.reason })));
    }
    return;
  }
  var emergency = validateEmergencyToken_();
  if (emergency.valid) {
    if (typeof logError_ === 'function') {
      logError_('FROZEN_BYPASS', new Error(JSON.stringify({
        caller: callerName, tag: tag, tokenId: emergency.tokenId, reason: emergency.reason
      })));
    }
    return;
  }
  incrementBlockCounter_();
  if (typeof logError_ === 'function') {
    logError_('FROZEN_BLOCK', new Error(JSON.stringify({ caller: callerName, tag: tag, freezeReason: state.reason })));
  }
  debouncedBlockPushover_(callerName);
  throw new Error('FROZEN: ' + callerName + ' blocked during freeze (' + state.reason + ')');
}

/**
 * Generate a time-limited emergency bypass token. Only invoke via clasp run.
 * @param {string} reason - Required. Appears in every bypass log entry.
 * @param {number} [minutes=60] - Token validity. Min 1, max 240.
 * @returns {{tokenId: string, expiresAt: string}}
 */
function generateEmergencyToken_(reason, minutes) {
  if (!reason) throw new Error('generateEmergencyToken_: reason is required');
  var mins = Math.min(240, Math.max(1, parseInt(minutes, 10) || 60));
  var now = new Date();
  var expiry = new Date(now.getTime() + mins * 60 * 1000);
  var tokenId = 'em_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
  var token = {
    tokenId: tokenId,
    reason: String(reason),
    issuedBy: 'LT',
    issuedAt: now.toISOString(),
    expiresAt: expiry.toISOString()
  };
  PropertiesService.getScriptProperties().setProperty('DEPLOY_FREEZE_EMERGENCY', JSON.stringify(token));
  if (typeof logError_ === 'function') {
    logError_('EMERGENCY_TOKEN_ISSUED', new Error(JSON.stringify({ tokenId: tokenId, reason: reason, expiresAt: expiry.toISOString() })));
  }
  if (typeof sendPush_ === 'function') {
    try {
      sendPush_('Emergency bypass ACTIVE', 'Token: ' + tokenId + ' | ' + reason + ' | Expires: ' + expiry.toISOString(), 'LT', PUSHOVER_PRIORITY.GATE_BREACH);
    } catch(e) { Logger.log('FreezeGate: sendPush_ failed: ' + e.message); }
  }
  return { tokenId: tokenId, expiresAt: expiry.toISOString() };
}

/**
 * Flip dryRun flag on active freeze. For integration testing only.
 * @param {boolean} bool - true to enable dry-run (log only, no block), false to disable.
 */
function setFreezeDryRun_(bool) {
  var raw = PropertiesService.getScriptProperties().getProperty('DEPLOY_FREEZE');
  if (!raw) throw new Error('setFreezeDryRun_: no active freeze to modify');
  var parsed;
  try { parsed = JSON.parse(raw); } catch(e) { throw new Error('setFreezeDryRun_: corrupt freeze state'); }
  parsed.dryRun = !!bool;
  PropertiesService.getScriptProperties().setProperty('DEPLOY_FREEZE', JSON.stringify(parsed));
  return { dryRun: parsed.dryRun };
}

// ── Internal helpers ────────────────────────────────────────────────

/**
 * Validate the emergency bypass token. Auto-clears expired tokens.
 * @returns {{valid: boolean, [tokenId]: string, [reason]: string}}
 */
function validateEmergencyToken_() {
  var raw = PropertiesService.getScriptProperties().getProperty('DEPLOY_FREEZE_EMERGENCY');
  if (!raw) return { valid: false };
  var token;
  try { token = JSON.parse(raw); } catch(e) { return { valid: false }; }
  if (!token || !token.tokenId) return { valid: false };
  if (new Date(token.expiresAt) < new Date()) {
    PropertiesService.getScriptProperties().deleteProperty('DEPLOY_FREEZE_EMERGENCY');
    if (typeof logError_ === 'function') {
      logError_('EMERGENCY_TOKEN_EXPIRED', new Error(JSON.stringify({ tokenId: token.tokenId })));
    }
    return { valid: false };
  }
  return { valid: true, tokenId: token.tokenId, reason: token.reason };
}

/**
 * Increment the block counter in Script Properties.
 */
function incrementBlockCounter_() {
  var props = PropertiesService.getScriptProperties();
  var count = parseInt(props.getProperty('FREEZE_BLOCK_COUNT') || '0', 10);
  props.setProperty('FREEZE_BLOCK_COUNT', String(count + 1));
}

/**
 * Fire a SYSTEM_ERROR Pushover for a blocked mutation. Debounced to once per 10 minutes.
 * @param {string} callerName
 */
function debouncedBlockPushover_(callerName) {
  if (typeof sendPush_ !== 'function') return;
  var props = PropertiesService.getScriptProperties();
  var lastPush = props.getProperty('FREEZE_LAST_PUSH');
  if (lastPush && (new Date() - new Date(lastPush)) < 10 * 60 * 1000) return;
  props.setProperty('FREEZE_LAST_PUSH', new Date().toISOString());
  try {
    sendPush_('Freeze blocked mutation', callerName + ' blocked by active freeze', 'LT', PUSHOVER_PRIORITY.SYSTEM_ERROR);
  } catch(e) { Logger.log('FreezeGate: sendPush_ failed: ' + e.message); }
}

// END OF FILE — FreezeGate.js v1
// ════════════════════════════════════════════════════════════════════
