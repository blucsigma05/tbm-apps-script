// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// EducationAlerts.gs v1 — Education-Specific Pushover Alerts
// WRITES TO: (Pushover API only — no sheet writes)
// READS FROM: 🧹📅 KH_Education (via TAB_MAP)
// DEPENDS ON: AlertEngine (sendPush_, PUSHOVER_PRIORITY), NotionEngine (queryPendingReviews_)
// ════════════════════════════════════════════════════════════════════

function getEducationAlertsVersion() { return 2; }

// ── HELPERS ─────────────────────────────────────────────────────────

/**
 * Returns KH_Education data as 2D array (header + rows).
 * Uses SSID and TAB_MAP from global scope.
 */
function _getEducationData_() {
  const ss = SpreadsheetApp.openById(SSID);
  const tabName = TAB_MAP['KH_Education'] || 'KH_Education';
  const sheet = ss.getSheetByName(tabName);
  if (!sheet || sheet.getLastRow() < 2) return null;
  return sheet.getDataRange().getValues();
}

/**
 * Returns ISO date string (YYYY-MM-DD) for a Date object.
 */
function _eduIsoDate_(d) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
}

/**
 * Returns ISO date string for N days ago from today.
 */
function _daysAgoISO_(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return _eduIsoDate_(d);
}

/**
 * Parses a row's timestamp into ISO date string.
 */
function _rowToISO_(ts) {
  if (ts instanceof Date) return _eduIsoDate_(ts);
  return String(ts || '').slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1: Streak Broken Alert
// ═══════════════════════════════════════════════════════════════

/**
 * Checks if a child's education streak has been broken.
 * Reads KH_Education for the last 3 days. If they had a streak >= 3 days
 * and no activity today, fires a Pushover alert.
 * @param {string} child — 'buggsy' or 'jj'
 */
function checkStreakBroken_(child) {
  const data = _getEducationData_();
  if (!data || data.length < 2) return;

  const headers = data[0].map(String);
  const iChild = headers.indexOf('Child');
  const iTimestamp = headers.indexOf('Timestamp');
  if (iChild < 0 || iTimestamp < 0) return;

  const childLower = String(child).toLowerCase();
  const todayISO = _eduIsoDate_(new Date());

  // Collect unique activity dates for this child in the last 30 days
  const thirtyAgo = _daysAgoISO_(30);
  const activeDates = {};
  let hasToday = false;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][iChild] || '').toLowerCase() !== childLower) continue;
    const dateISO = _rowToISO_(data[i][iTimestamp]);
    if (dateISO < thirtyAgo) continue;
    activeDates[dateISO] = true;
    if (dateISO === todayISO) hasToday = true;
  }

  if (hasToday) return; // Active today — no broken streak

  // Count consecutive days ending yesterday
  let streakCount = 0;
  const checkDate = new Date();
  checkDate.setDate(checkDate.getDate() - 1); // start from yesterday

  for (let d = 0; d < 30; d++) {
    const iso = _eduIsoDate_(checkDate);
    if (activeDates[iso]) {
      streakCount++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  if (streakCount < 3) return; // No meaningful streak to alert about

  const displayName = childLower === 'buggsy' ? 'Buggsy' : 'JJ';
  const title = "Streak Alert: " + displayName + "'s " + streakCount + "-day streak ended";
  const message = displayName + " had a " + streakCount + "-day education streak but hasn't completed any activities today. A quick session would restart the streak!";

  sendPush_(title, message, 'BOTH', PUSHOVER_PRIORITY.CHORE_APPROVAL);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: Pending Review Age Alert
// ═══════════════════════════════════════════════════════════════

/**
 * Checks for homework items pending review for more than 48 hours.
 * Uses queryPendingReviews_() from NotionEngine.
 */
function checkPendingReviewAge_() {
  const items = queryPendingReviews_();
  if (!items || items.length === 0) return;

  const stale = items.filter(item => item.age_hours > 48);
  if (stale.length === 0) return;

  const title = stale.length + " homework item" + (stale.length === 1 ? '' : 's') + " pending review > 48h";
  const lines = stale.map(item =>
    "- " + item.assignment + " (" + item.subject + ") — " + item.age_hours + "h old"
  );
  const message = "The following assignments need parent review:\n" + lines.join("\n");

  sendPush_(title, message, 'BOTH', PUSHOVER_PRIORITY.CHORE_APPROVAL);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: Accuracy Drop Alert
// ═══════════════════════════════════════════════════════════════

/**
 * Checks if a child's accuracy in any subject dropped more than 15%
 * compared to the previous week. Requires at least 5 questions each week
 * per subject to fire.
 * @param {string} child — 'buggsy' or 'jj'
 */
function checkAccuracyDrop_(child) {
  const data = _getEducationData_();
  if (!data || data.length < 2) return;

  const headers = data[0].map(String);
  const iChild = headers.indexOf('Child');
  const iTimestamp = headers.indexOf('Timestamp');
  const iSubject = headers.indexOf('Subject');
  const iScore = headers.indexOf('Score');
  const iAutoGraded = headers.indexOf('AutoGraded');
  if (iChild < 0 || iTimestamp < 0 || iSubject < 0 || iScore < 0) return;

  const childLower = String(child).toLowerCase();
  const today = new Date();

  // This week: last 7 days. Last week: days 8-14 ago.
  const thisWeekStart = _daysAgoISO_(7);
  const lastWeekStart = _daysAgoISO_(14);
  const todayISO = _eduIsoDate_(today);

  // Aggregate scores by subject per week
  // { subjectName: { thisWeek: { sum, count }, lastWeek: { sum, count } } }
  const subjects = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[iChild] || '').toLowerCase() !== childLower) continue;

    // Only count auto-graded rows (objective scores)
    if (iAutoGraded >= 0 && String(row[iAutoGraded]) !== 'true' && row[iAutoGraded] !== true) continue;

    const dateISO = _rowToISO_(row[iTimestamp]);
    const subject = String(row[iSubject] || 'General');
    const score = Number(row[iScore]) || 0;

    if (!subjects[subject]) {
      subjects[subject] = {
        thisWeek: { sum: 0, count: 0 },
        lastWeek: { sum: 0, count: 0 }
      };
    }

    if (dateISO >= thisWeekStart && dateISO <= todayISO) {
      subjects[subject].thisWeek.sum += score;
      subjects[subject].thisWeek.count++;
    } else if (dateISO >= lastWeekStart && dateISO < thisWeekStart) {
      subjects[subject].lastWeek.sum += score;
      subjects[subject].lastWeek.count++;
    }
  }

  // Check each subject for >15% drop with min 5 Qs each week
  const displayName = childLower === 'buggsy' ? 'Buggsy' : 'JJ';

  for (const subject of Object.keys(subjects)) {
    const s = subjects[subject];
    if (s.thisWeek.count < 5 || s.lastWeek.count < 5) continue;

    const thisAvg = s.thisWeek.sum / s.thisWeek.count;
    const lastAvg = s.lastWeek.sum / s.lastWeek.count;

    if (lastAvg === 0) continue; // avoid division by zero
    const dropPct = ((lastAvg - thisAvg) / lastAvg) * 100;

    if (dropPct > 15) {
      const title = "Heads Up: " + displayName + "'s " + subject + " accuracy dropped";
      const message = displayName + "'s " + subject + " accuracy dropped from " +
        Math.round(lastAvg) + "% last week to " + Math.round(thisAvg) + "% this week " +
        "(-" + Math.round(dropPct) + "%). Consider reviewing recent assignments for patterns.";

      sendPush_(title, message, 'BOTH', PUSHOVER_PRIORITY.CHORE_APPROVAL);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: Weekly Digest
// ═══════════════════════════════════════════════════════════════

/**
 * Sends a weekly education digest summarizing both kids' progress.
 * Designed to run Sunday 6pm via GAS time trigger.
 */
function sendWeeklyDigest_() {
  const data = _getEducationData_();
  const weekStart = _daysAgoISO_(7);
  const todayISO = _eduIsoDate_(new Date());

  const kids = ['buggsy', 'jj'];
  const summaries = [];

  for (const child of kids) {
    const displayName = child === 'buggsy' ? 'Buggsy' : 'JJ';
    let sessions = 0;
    let scoreSum = 0;
    let scoreCount = 0;
    let pendingReview = 0;
    const activeDays = {};

    if (data && data.length >= 2) {
      const headers = data[0].map(String);
      const iChild = headers.indexOf('Child');
      const iTimestamp = headers.indexOf('Timestamp');
      const iScore = headers.indexOf('Score');
      const iAutoGraded = headers.indexOf('AutoGraded');
      const iStatus = headers.indexOf('Status');

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (String(row[iChild] || '').toLowerCase() !== child) continue;
        const dateISO = _rowToISO_(row[iTimestamp]);
        if (dateISO < weekStart || dateISO > todayISO) continue;

        sessions++;
        activeDays[dateISO] = true;

        if (iAutoGraded >= 0 && (String(row[iAutoGraded]) === 'true' || row[iAutoGraded] === true)) {
          scoreSum += Number(row[iScore]) || 0;
          scoreCount++;
        }
        if (iStatus >= 0 && String(row[iStatus]) === 'pending_review') {
          pendingReview++;
        }
      }
    }

    const streakDays = Object.keys(activeDays).length;
    const avgScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;

    let line = displayName + ": " + sessions + " sessions, " + streakDays + " active days";
    if (scoreCount > 0) {
      line += ", " + avgScore + "% avg accuracy";
    }
    if (pendingReview > 0) {
      line += ", " + pendingReview + " pending review";
    }
    summaries.push(line);
  }

  // Also include Notion pending reviews count
  let notionPending = 0;
  try {
    const pendingItems = queryPendingReviews_();
    notionPending = pendingItems ? pendingItems.length : 0;
  } catch (e) {
    // Notion query failed — note it but don't block the digest
    summaries.push("(Notion pending review check failed: " + e.message + ")");
  }

  const title = "Weekly Education Digest";
  let message = summaries.join("\n");
  if (notionPending > 0) {
    message += "\n\nNotion: " + notionPending + " homework item" + (notionPending === 1 ? '' : 's') + " still pending review.";
  }

  sendPush_(title, message, 'BOTH', PUSHOVER_PRIORITY.HYGIENE_REPORT_LOW);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5: Milestone Alert
// ═══════════════════════════════════════════════════════════════

/**
 * Fires a Pushover alert for mastery events / achievements.
 * @param {string} child — 'buggsy' or 'jj'
 * @param {string} milestone — description of the achievement
 */
function sendMilestoneAlert_(child, milestone) {
  const displayName = String(child).toLowerCase() === 'buggsy' ? 'Buggsy' : 'JJ';
  const title = displayName + " Achievement!";
  const message = String(milestone);

  sendPush_(title, message, 'BOTH', PUSHOVER_PRIORITY.CHORE_APPROVAL);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 6: Daily Orchestrator
// ═══════════════════════════════════════════════════════════════

/**
 * Runs all daily education alert checks for both children.
 * Install via installDailyEducationAlertTrigger_() to fire automatically.
 * Each check is isolated — one failure does not block the others.
 */
function runDailyEducationAlerts() {
  try { checkStreakBroken_('buggsy'); } catch (e) { Logger.log('EducationAlerts streak buggsy: ' + e.message); }
  try { checkStreakBroken_('jj'); } catch (e) { Logger.log('EducationAlerts streak jj: ' + e.message); }
  try { checkPendingReviewAge_(); } catch (e) { Logger.log('EducationAlerts pending review: ' + e.message); }
  try { checkAccuracyDrop_('buggsy'); } catch (e) { Logger.log('EducationAlerts accuracy buggsy: ' + e.message); }
  try { checkAccuracyDrop_('jj'); } catch (e) { Logger.log('EducationAlerts accuracy jj: ' + e.message); }
}

/**
 * Installs a daily 7pm trigger for runDailyEducationAlerts().
 * Run once from Apps Script editor.
 */
function installDailyEducationAlertTrigger_() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'runDailyEducationAlerts') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  ScriptApp.newTrigger('runDailyEducationAlerts')
    .timeBased()
    .everyDays(1)
    .atHour(19) // 7 PM Central — after homework time, before bedtime
    .create();
  Logger.log('Trigger installed: runDailyEducationAlerts() every day ~7 PM');
}

// ═══════════════════════════════════════════════════════════════
// SECTION 7: Weekly Digest Trigger
// ═══════════════════════════════════════════════════════════════

/**
 * Installs the Sunday 6pm trigger for sendWeeklyDigest_.
 * Run once from Apps Script editor.
 */
function installWeeklyDigestTrigger_() {
  // Remove existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'sendWeeklyDigest_') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  ScriptApp.newTrigger('sendWeeklyDigest_')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(18)
    .create();

  Logger.log('Trigger installed: sendWeeklyDigest_() every Sunday ~6 PM');
}

// EOF — EducationAlerts.gs v1
