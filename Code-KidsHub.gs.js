// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// Code-KidsHub.gs v2 — KidsHub domain Safe wrappers (split from Code.gs #299)
// WRITES TO: (delegates to Kidshub.js — no direct sheet writes)
// READS FROM: (delegates to Kidshub.js — no direct sheet reads)
// DEPENDS ON: Kidshub.js, GASHardening.js (withMonitor_), Code.gs (SSID, TAB_MAP)
// ════════════════════════════════════════════════════════════════════

function getCodeKidsHubVersion() { return 2; }

// ── KidsHub diagnostics helper ────────────────────────────────────
// Appends an error row to KH_History when a task write Safe wrapper throws.
// Extracted from Code.gs to travel with the wrappers that use it.
function _khDiag_(label, args, e) {
  try {
    var ss = SpreadsheetApp.openById(SSID);
    var hn = typeof TAB_MAP !== 'undefined' ? (TAB_MAP['KH_History'] || 'KH_History') : 'KH_History';
    var sh = ss ? ss.getSheetByName(hn) : null;
    if (sh) sh.appendRow(['ERROR_DIAG', label, JSON.stringify(args), e.message, 0, 0, 0, 'error', '',
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss")]);
  } catch(e2) { Logger.log('_khDiag_ failed: ' + e2.message); }
}

// ── Task completion wrappers ──────────────────────────────────────
function khCompleteTaskSafe(rowIndex, expectedTaskID) {
  return withMonitor_('khCompleteTaskSafe', function() {
    assertNotFrozen_('freeze-critical', 'khCompleteTaskSafe');
    try { return JSON.parse(khCompleteTask(rowIndex, expectedTaskID)); }
    catch(e) { _khDiag_('khCompleteTaskSafe', {rowIndex: rowIndex, expectedTaskID: expectedTaskID}, e); throw e; }
  });
}
function khCompleteTaskWithBonusSafe(rowIndex, multiplier, expectedTaskID) {
  return withMonitor_('khCompleteTaskWithBonusSafe', function() {
    assertNotFrozen_('freeze-critical', 'khCompleteTaskWithBonusSafe');
    try { return JSON.parse(khCompleteTaskWithBonus(rowIndex, multiplier, expectedTaskID)); }
    catch(e) { _khDiag_('khCompleteTaskWithBonusSafe', {rowIndex: rowIndex, multiplier: multiplier, expectedTaskID: expectedTaskID}, e); throw e; }
  });
}
function khApproveTaskSafe(rowIndex, expectedTaskID) {
  return withMonitor_('khApproveTaskSafe', function() {
    assertNotFrozen_('freeze-critical', 'khApproveTaskSafe');
    try { return JSON.parse(khApproveTask(rowIndex, expectedTaskID)); }
    catch(e) { _khDiag_('khApproveTaskSafe', {rowIndex: rowIndex, expectedTaskID: expectedTaskID}, e); throw e; }
  });
}
function khUncompleteTaskSafe(rowIndex) {
  return withMonitor_('khUncompleteTaskSafe', function() {
    try { return JSON.parse(khUncompleteTask(rowIndex)); }
    catch(e) { _khDiag_('khUncompleteTaskSafe', {rowIndex: rowIndex}, e); throw e; }
  });
}
function khRejectTaskSafe(rowIndex) {
  return withMonitor_('khRejectTaskSafe', function() {
    try { return JSON.parse(khRejectTask(rowIndex)); }
    catch(e) { _khDiag_('khRejectTaskSafe', {rowIndex: rowIndex}, e); throw e; }
  });
}
function khApproveWithBonusSafe(rowIndex, multiplier, expectedTaskID) {
  return withMonitor_('khApproveWithBonusSafe', function() {
    try { return JSON.parse(khApproveWithBonus(rowIndex, multiplier, expectedTaskID)); }
    catch(e) { _khDiag_('khApproveWithBonusSafe', {rowIndex: rowIndex, multiplier: multiplier, expectedTaskID: expectedTaskID}, e); throw e; }
  });
}
function khOverrideTaskSafe(rowIndex, expectedTaskID, multiplier) {
  return withMonitor_('khOverrideTaskSafe', function() {
    try { return JSON.parse(khOverrideTask(rowIndex, expectedTaskID, multiplier)); }
    catch(e) { _khDiag_('khOverrideTaskSafe', {rowIndex: rowIndex}, e); throw e; }
  });
}

// ── Rewards / bank wrappers ───────────────────────────────────────
function khRedeemRewardSafe(child, rewardID, quantity) {
  return withMonitor_('khRedeemRewardSafe', function() {
    try { return JSON.parse(khRedeemReward(child, rewardID, quantity || 1)); }
    catch(e) { _khDiag_('khRedeemRewardSafe', {child: child, rewardID: rewardID, quantity: quantity}, e); throw e; }
  });
}
function khAddDeductionSafe(child, reason, amount) {
  return withMonitor_('khAddDeductionSafe', function() {
    try { return JSON.parse(khAddDeduction(child, reason, amount)); }
    catch(e) { _khDiag_('khAddDeductionSafe', {child: child, reason: reason, amount: amount}, e); throw e; }
  });
}
function khSetBankOpeningSafe(child, amount) {
  return withMonitor_('khSetBankOpeningSafe', function() {
    try { return JSON.parse(khSetBankOpening(child, amount)); }
    catch(e) { _khDiag_('khSetBankOpeningSafe', {child: child, amount: amount}, e); throw e; }
  });
}
function khDebitScreenTimeSafe(child, screenType, minutes) {
  return withMonitor_('khDebitScreenTimeSafe', function() {
    try { return JSON.parse(khDebitScreenTime(child, screenType, minutes)); }
    catch(e) { _khDiag_('khDebitScreenTimeSafe', {child: child, screenType: screenType, minutes: minutes}, e); throw e; }
  });
}

// ── Reset / bonus / batch wrappers ───────────────────────────────
function khResetTasksSafe(mode, child) {
  return withMonitor_('khResetTasksSafe', function() {
    try { return JSON.parse(khResetTasks(mode, child)); }
    catch(e) { _khDiag_('khResetTasksSafe', {mode: mode, child: child}, e); throw e; }
  });
}
function khAddBonusTaskSafe(child, taskName, points, icon, timeOfDay) {
  return withMonitor_('khAddBonusTaskSafe', function() {
    try { return JSON.parse(khAddBonusTask(child, taskName, points, icon, timeOfDay)); }
    catch(e) { _khDiag_('khAddBonusTaskSafe', {child: child, task: taskName, points: points}, e); throw e; }
  });
}
function khBatchApproveSafe(payload) {
  return withMonitor_('khBatchApproveSafe', function() {
    var lock = LockService.getScriptLock();
    try { lock.waitLock(30000); } catch(e) {
      return { error: true, message: 'System is busy \u2014 please try again' };
    }
    try {
      return kh_batchApprove_(payload.taskIds || payload.rowIndices || [], payload.approver || 'JT');
    } finally {
      lock.releaseLock();
    }
  });
}

// ── PIN / health / URLs ───────────────────────────────────────────
function khVerifyPinSafe(pin) {
  return withMonitor_('khVerifyPinSafe', function() {
    return JSON.parse(JSON.stringify(khVerifyPin(pin)));
  });
}
function getKHAppUrlsSafe() {
  return withMonitor_('getKHAppUrlsSafe', function() {
    return JSON.parse(JSON.stringify(getKHAppUrls()));
  });
}
function khHealthCheckSafe() {
  return withMonitor_('khHealthCheckSafe', function() {
    return JSON.parse(khHealthCheck());
  });
}

// ── Request / Ask System wrappers ────────────────────────────────
function khSubmitRequestSafe(child, type, title, amount, notes) {
  return withMonitor_('khSubmitRequestSafe', function() {
    try { return JSON.parse(khSubmitRequest(child, type, title, amount, notes)); }
    catch(e) { _khDiag_('khSubmitRequestSafe', {child: child, type: type, title: title}, e); throw e; }
  });
}
function khApproveRequestSafe(requestUID) {
  return withMonitor_('khApproveRequestSafe', function() {
    try { return JSON.parse(khApproveRequest(requestUID)); }
    catch(e) { _khDiag_('khApproveRequestSafe', {requestUID: requestUID}, e); throw e; }
  });
}
function khDenyRequestSafe(requestUID, parentNote) {
  return withMonitor_('khDenyRequestSafe', function() {
    try { return JSON.parse(khDenyRequest(requestUID, parentNote)); }
    catch(e) { _khDiag_('khDenyRequestSafe', {requestUID: requestUID}, e); throw e; }
  });
}

// ── Grade / meal wrappers ─────────────────────────────────────────
function khSubmitGradeSafe(params) {
  return withMonitor_('khSubmitGradeSafe', function() {
    assertNotFrozen_('freeze-critical', 'khSubmitGradeSafe');
    try { return JSON.parse(khSubmitGrade(params)); }
    catch(e) { _khDiag_('khSubmitGradeSafe', params, e); throw e; }
  });
}
function khGetGradeHistorySafe(kid) {
  return withMonitor_('khGetGradeHistorySafe', function() {
    return JSON.parse(khGetGradeHistory(kid || 'all'));
  });
}
function updateMealPlanSafe(meal, cook, notes, kidMeal) {
  // v74: Handle object-form calls from ThePulse/TheVein ({meal, cook, notes})
  // while preserving positional calls from KidsHub (meal, cook, notes, kidMeal)
  if (meal && typeof meal === 'object' && meal.meal !== undefined) {
    var obj = meal;
    meal = obj.meal;
    cook = obj.cook;
    notes = obj.notes;
    kidMeal = obj.kidMeal;
  }
  return withMonitor_('updateMealPlanSafe', function() {
    try { return JSON.parse(updateMealPlan(meal, cook, notes, kidMeal)); }
    catch(e) { _khDiag_('updateMealPlanSafe', {meal: meal, cook: cook}, e); throw e; }
  });
}

// END OF FILE — Code-KidsHub.gs v2
// ════════════════════════════════════════════════════════════════════
