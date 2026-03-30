// ════════════════════════════════════════════════════════════════════
// DailyOps.gs v1 — Daily Automation: Chore Reset, Health Check Trigger, Snapshot
// ════════════════════════════════════════════════════════════════════
// WRITES TO: (delegates to KidsHub, AlertEngine, CodeSnapshot)
// READS FROM: (none directly — orchestration only)

function getDailyOpsVersion() { return 1; }

// ──────────────────────────────────────────────────────────────────
// 1. DAILY TASK RESET — 5:00 AM CST trigger
//    Resets daily chores for both kids. Called by time-based trigger.
// ──────────────────────────────────────────────────────────────────
function resetDailyTasksAuto() {
  var results = [];
  var kids = ['buggsy', 'jj'];
  for (var i = 0; i < kids.length; i++) {
    try {
      var raw = khResetTasks('daily', kids[i]);
      var parsed = JSON.parse(raw);
      results.push({ child: kids[i], success: parsed.success !== false, detail: parsed });
    } catch (e) {
      logError_('resetDailyTasksAuto', 'Reset failed for ' + kids[i] + ': ' + e.message);
      results.push({ child: kids[i], success: false, error: e.message });
    }
  }

  // Alert on any failure
  var failures = results.filter(function(r) { return !r.success; });
  if (failures.length > 0) {
    var msg = failures.map(function(f) { return f.child + ': ' + (f.error || 'unknown'); }).join('; ');
    sendPush_('Daily Reset FAIL', msg, 'LT', 0);
  }

  Logger.log('resetDailyTasksAuto complete: ' + JSON.stringify(results));
  return results;
}

// ──────────────────────────────────────────────────────────────────
// 2. TRIGGER INSTALLERS
//    Run installDailyTriggers() once from the GAS editor.
//    Run removeDailyTriggers() to clean up.
// ──────────────────────────────────────────────────────────────────

/**
 * Install all three daily triggers. Safe to re-run — removes old triggers first.
 * Uses replaceDailyTrigger_ from GASHardening.gs.
 */
function installDailyTriggers() {
  var plan = [
    { fn: 'resetDailyTasksAuto', hour: 5,  label: 'Daily chore reset (5 AM CST)' },
    { fn: 'dailyHealthCheck',    hour: 6,  label: 'Morning health check (6 AM CST)' },
    { fn: 'runSnapshot',         hour: 6,  label: 'Code snapshot to Drive (6:30 AM CST)' }
  ];

  var installed = 0;
  for (var i = 0; i < plan.length; i++) {
    var entry = plan[i];
    // Verify function exists in project scope
    if (typeof this[entry.fn] !== 'function') {
      Logger.log('SKIP: ' + entry.fn + ' — function not found');
      continue;
    }
    // runSnapshot gets 6:30 (nearMinute 30), others get :00
    if (entry.fn === 'runSnapshot') {
      // Custom trigger for 6:30 — can't use replaceDailyTrigger_ which hardcodes nearMinute(0)
      var triggers = ScriptApp.getProjectTriggers();
      for (var t = 0; t < triggers.length; t++) {
        if (triggers[t].getHandlerFunction() === 'runSnapshot') {
          ScriptApp.deleteTrigger(triggers[t]);
        }
      }
      ScriptApp.newTrigger('runSnapshot')
        .timeBased()
        .atHour(6)
        .nearMinute(30)
        .everyDays(1)
        .inTimezone('America/Chicago')
        .create();
    } else {
      replaceDailyTrigger_(entry.fn, entry.hour);
    }
    Logger.log('INSTALLED: ' + entry.label);
    installed++;
  }

  Logger.log('installDailyTriggers: ' + installed + '/' + plan.length + ' triggers installed');
  return { installed: installed, total: plan.length };
}

/**
 * Remove all three daily triggers.
 */
function removeDailyTriggers() {
  var targets = ['resetDailyTasksAuto', 'dailyHealthCheck', 'runSnapshot'];
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (targets.indexOf(triggers[i].getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  Logger.log('removeDailyTriggers: removed ' + removed + ' triggers');
  return { removed: removed };
}

// EOF — DailyOps.gs v1
