// ════════════════════════════════════════════════════════════════════
// OpsTriggers v1 — Consolidated GAS trigger spec + installer + reconciler
// Single source of truth for all recurring TBM triggers.
// WRITES TO: ErrorLog (skips + drift), ScriptApp triggers
// READS FROM: OPS_TRIGGER_SPEC, ScriptApp.getProjectTriggers()
// To add a trigger: add a row to OPS_TRIGGER_SPEC + create the handler function.
// ════════════════════════════════════════════════════════════════════

function getOpsTriggersVersion() { return 1; }

// ── SPEC ─────────────────────────────────────────────────────────────

var OPS_TRIGGER_SPEC = [
  { fn: 'resetDailyTasksAuto',      cadence: 'daily',   hour: 5,  tz: 'America/Chicago', label: 'Daily chore reset' },
  { fn: 'dailyHealthCheck',          cadence: 'daily',   hour: 6,  tz: 'America/Chicago', label: 'Morning health check' },
  { fn: 'runSnapshot',               cadence: 'daily',   hour: 6,  tz: 'America/Chicago', label: 'Code snapshot to Drive' },
  { fn: 'triageFeedback',            cadence: 'daily',   hour: 7,  tz: 'America/Chicago', label: 'Feedback triage' },
  { fn: 'feedbackWeeklyDigest',      cadence: 'weekly',  hour: 8,  day: 'MONDAY',          tz: 'America/Chicago', label: 'Feedback weekly digest' },
  { fn: 'checkPendingApprovals',     cadence: 'hourly',                                                            label: 'Chore approval check' },
  { fn: 'checkSystemErrors',         cadence: 'hourly',                                                            label: 'System error check' },
  { fn: 'runDailyEducationAlerts',   cadence: 'daily',   hour: 6,  tz: 'America/Chicago', label: 'Education alerts' },
  { fn: 'sendWeeklyDigest_',         cadence: 'weekly',  hour: 8,  day: 'SUNDAY',          tz: 'America/Chicago', label: 'Weekly digest' },
  { fn: 'pushHealthSnapshot',        cadence: 'daily',   hour: 8,  tz: 'America/Chicago', label: 'Notion health snapshot' },
  { fn: 'runMonthlyMERReport_',      cadence: 'monthly', hour: 9,  day: 1,                 tz: 'America/Chicago', label: 'Monthly MER report' },
  { fn: 'reconcileVeinPulse',        cadence: 'hourly',                                                            label: 'TheVein/ThePulse reconcile' },
  { fn: 'refreshCascadeTabs',        cadence: 'daily',   hour: 2,  tz: 'America/Chicago', label: 'Cascade tabs refresh' },
  { fn: 'reconcileOpsTriggersSafe',  cadence: 'daily',   hour: 9,  tz: 'America/Chicago', label: 'Trigger drift reconciler' }
];

// ── PRIVATE HELPERS ───────────────────────────────────────────────────

function otFnExists_(fn) {
  try { return typeof this[fn] === 'function'; } catch(e) { return false; }
}

function otTriggerInstalled_(fn) {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === fn) return true;
  }
  return false;
}

function otCreateTrigger_(entry) {
  var b = ScriptApp.newTrigger(entry.fn).timeBased();
  if (entry.cadence === 'daily') {
    b.everyDays(1).atHour(entry.hour).inTimezone(entry.tz).create();
  } else if (entry.cadence === 'hourly') {
    b.everyHours(1).create();
  } else if (entry.cadence === 'weekly') {
    b.onWeekDay(ScriptApp.WeekDay[entry.day]).atHour(entry.hour).inTimezone(entry.tz).create();
  } else if (entry.cadence === 'monthly') {
    b.onMonthDay(entry.day || 1).atHour(entry.hour || 9).inTimezone(entry.tz).create();
  } else {
    throw new Error('Unknown cadence: ' + entry.cadence);
  }
}

function otBuildInstalledIndex_() {
  var triggers = ScriptApp.getProjectTriggers();
  var index = {};
  for (var i = 0; i < triggers.length; i++) {
    var fn = triggers[i].getHandlerFunction();
    index[fn] = (index[fn] || 0) + 1;
  }
  return index;
}

// ── INSTALL ───────────────────────────────────────────────────────────

function installAllOpsTriggersSafe() {
  return withMonitor_('installAllOpsTriggersSafe', function() {
    var installed = [];
    var skipped = [];
    var alreadyPresent = [];
    var i, entry, fn;

    for (i = 0; i < OPS_TRIGGER_SPEC.length; i++) {
      entry = OPS_TRIGGER_SPEC[i];
      fn = entry.fn;

      if (!otFnExists_(fn)) {
        skipped.push(fn);
        logError_(fn + ' [TRIGGER_FN_MISSING]', new Error('Function not found in project — trigger skipped'), 0);
        Logger.log('SKIP (fn missing): ' + fn);
        continue;
      }

      if (otTriggerInstalled_(fn)) {
        alreadyPresent.push(fn);
        Logger.log('SKIP (already installed): ' + fn);
        continue;
      }

      try {
        otCreateTrigger_(entry);
        installed.push(fn);
        Logger.log('INSTALLED: ' + fn + ' (' + entry.cadence + ') — ' + entry.label);
      } catch(e) {
        skipped.push(fn);
        logError_('installAllOpsTriggersSafe:' + fn, e, 0);
        Logger.log('ERROR installing ' + fn + ': ' + e.message);
      }
    }

    Logger.log('installAllOpsTriggersSafe complete — installed: ' + installed.length +
      ', skipped: ' + skipped.length + ', already present: ' + alreadyPresent.length);
    return { ok: true, installed: installed, skipped: skipped, alreadyPresent: alreadyPresent };
  });
}

// ── RECONCILE ─────────────────────────────────────────────────────────

function reconcileOpsTriggersSafe() {
  return withMonitor_('reconcileOpsTriggersSafe', function() {
    var specFns = {};
    var i, fn;

    for (i = 0; i < OPS_TRIGGER_SPEC.length; i++) {
      specFns[OPS_TRIGGER_SPEC[i].fn] = true;
    }

    var installedCount = otBuildInstalledIndex_();
    var missing = [];
    var orphaned = [];
    var duplicate = [];

    for (i = 0; i < OPS_TRIGGER_SPEC.length; i++) {
      fn = OPS_TRIGGER_SPEC[i].fn;
      if (!installedCount[fn]) missing.push(fn);
    }

    for (fn in installedCount) {
      if (!installedCount.hasOwnProperty(fn)) continue;
      if (!specFns[fn]) orphaned.push(fn);
      if (installedCount[fn] > 1) duplicate.push(fn);
    }

    var driftDetected = missing.length > 0 || orphaned.length > 0 || duplicate.length > 0;

    if (driftDetected) {
      var lines = ['Trigger drift detected:'];
      if (missing.length)   lines.push('Missing: ' + missing.join(', '));
      if (orphaned.length)  lines.push('Orphaned: ' + orphaned.join(', '));
      if (duplicate.length) lines.push('Duplicate: ' + duplicate.join(', '));
      var msg = lines.join('\n');
      sendPush_('TBM Trigger Drift', msg, 'LT', PUSHOVER_PRIORITY.GATE_BREACH, '');
      logError_('reconcileOpsTriggersSafe', new Error(msg), 0);
      Logger.log('TRIGGER_DRIFT: ' + msg);
    } else {
      Logger.log('reconcileOpsTriggersSafe: healthy — ' + OPS_TRIGGER_SPEC.length + ' spec entries, all installed');
    }

    return {
      ok: !driftDetected,
      missing: missing,
      orphaned: orphaned,
      duplicate: duplicate,
      healthy: !driftDetected,
      checkedAt: new Date().toISOString()
    };
  });
}

// ── UNINSTALL ─────────────────────────────────────────────────────────

function uninstallOpsTriggerSafe(functionName) {
  return withMonitor_('uninstallOpsTriggerSafe', function() {
    if (!functionName) throw new Error('functionName is required');
    var triggers = ScriptApp.getProjectTriggers();
    var removed = 0;
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === functionName) {
        ScriptApp.deleteTrigger(triggers[i]);
        removed++;
      }
    }
    Logger.log('uninstallOpsTriggerSafe: removed ' + removed + ' trigger(s) for ' + functionName);
    return { ok: true, functionName: functionName, removed: removed };
  });
}

// ── DIAGNOSTIC ───────────────────────────────────────────────────────

function diagOpsTriggersSafe() {
  return withMonitor_('diagOpsTriggersSafe', function() {
    var specFns = {};
    var i, fn;

    for (i = 0; i < OPS_TRIGGER_SPEC.length; i++) {
      specFns[OPS_TRIGGER_SPEC[i].fn] = true;
    }

    var rawTriggers = ScriptApp.getProjectTriggers();
    var installedList = [];
    var installedCount = {};

    for (i = 0; i < rawTriggers.length; i++) {
      fn = rawTriggers[i].getHandlerFunction();
      installedCount[fn] = (installedCount[fn] || 0) + 1;
      installedList.push({
        fn: fn,
        type: String(rawTriggers[i].getEventType()),
        id: rawTriggers[i].getUniqueId()
      });
    }

    var missing = [];
    var orphaned = [];
    var duplicate = [];

    for (i = 0; i < OPS_TRIGGER_SPEC.length; i++) {
      fn = OPS_TRIGGER_SPEC[i].fn;
      if (!installedCount[fn]) missing.push(fn);
    }

    for (fn in installedCount) {
      if (!installedCount.hasOwnProperty(fn)) continue;
      if (!specFns[fn]) orphaned.push(fn);
      if (installedCount[fn] > 1) duplicate.push(fn);
    }

    var healthy = missing.length === 0 && orphaned.length === 0 && duplicate.length === 0;

    return {
      ok: true,
      spec: OPS_TRIGGER_SPEC,
      installed: installedList,
      missing: missing,
      orphaned: orphaned,
      duplicate: duplicate,
      healthy: healthy,
      checkedAt: new Date().toISOString()
    };
  });
}
