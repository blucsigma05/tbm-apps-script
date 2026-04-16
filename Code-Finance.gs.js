// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// Code-Finance.gs v2 — Finance + Script utility Safe wrappers (split from Code.gs #299)
// WRITES TO: (delegates to DataEngine.js — no direct sheet writes)
// READS FROM: (delegates to DataEngine.js — no direct sheet reads)
// DEPENDS ON: Dataengine.js, GASHardening.js (withMonitor_), Code.gs (leftPad2_)
// ════════════════════════════════════════════════════════════════════

function getCodeFinanceVersion() { return 2; }

// ── Script URL helpers ────────────────────────────────────────────
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}
function getScriptUrlSafe() {
  return withMonitor_('getScriptUrlSafe', function() {
    return JSON.parse(JSON.stringify({ url: ScriptApp.getService().getUrl() }));
  });
}

// ── DataEngine thin delegates ─────────────────────────────────────
function getMonthsSafe() {
  return withMonitor_('getMonthsSafe', function() {
    return JSON.parse(JSON.stringify(getAvailableMonths()));
  });
}
function getSimulatorDataSafe() {
  return withMonitor_('getSimulatorDataSafe', function() {
    return JSON.parse(JSON.stringify(getSimulatorData()));
  });
}
function getWeeklyTrackerDataSafe() {
  return withMonitor_('getWeeklyTrackerDataSafe', function() {
    return JSON.parse(JSON.stringify(getWeeklyTrackerData()));
  });
}
function getCashFlowForecastSafe() {
  return withMonitor_('getCashFlowForecastSafe', function() {
    return JSON.parse(JSON.stringify(getCashFlowForecast()));
  });
}
function getCategoryTransactionsSafe(cat, start, end) {
  return withMonitor_('getCategoryTransactionsSafe', function() {
    return JSON.parse(JSON.stringify(getCategoryTransactions(cat, start, end)));
  });
}
function getCloseHistoryDataSafe() {
  return withMonitor_('getCloseHistoryDataSafe', function() {
    return JSON.parse(JSON.stringify(getCloseHistoryData()));
  });
}
function getSubscriptionDataSafe(start, end) {
  return withMonitor_('getSubscriptionDataSafe', function() {
    return JSON.parse(JSON.stringify(getSubscriptionData(start, end)));
  });
}

// ── MonitorEngine / MER gate delegates ───────────────────────────
function runMERGatesSafe(monthLabel) {
  return withMonitor_('runMERGatesSafe', function() {
    return JSON.stringify(runMERGates(monthLabel));
  });
}
function stampCloseMonthSafe(monthLabel, closeOpts) {
  return withMonitor_('stampCloseMonthSafe', function() {
    return JSON.stringify(stampCloseMonth(monthLabel, closeOpts));
  });
}
function updateFamilyNoteSafe(noteText) {
  return withMonitor_('updateFamilyNoteSafe', function() {
    assertNotFrozen_('freeze-critical', 'updateFamilyNoteSafe');
    return updateFamilyNote(noteText);
  });
}

// ── Story + Asset thin delegates ──────────────────────────────────
function runStoryFactorySafe(topic, character, tone) {
  return withMonitor_('runStoryFactorySafe', function() {
    return runStoryFactory(topic, character, tone);
  });
}
function getStoredStorySafe(storyKey) {
  return withMonitor_('getStoredStorySafe', function() {
    return getStoredStory(storyKey);
  });
}
function getAssetRegistrySafe() {
  return withMonitor_('getAssetRegistrySafe', function() {
    var cacheKey = 'asset_registry_v' + getAssetRegistryVersion();
    var cache = CacheService.getScriptCache();
    var cached = cache.get(cacheKey);
    if (cached) { return JSON.parse(cached); }
    var reg = getAssetRegistry_();
    try { cache.put(cacheKey, JSON.stringify(reg), 43200); } catch (e) {}
    return JSON.parse(JSON.stringify(reg));
  });
}
function seedWeek1CurriculumSafe() {
  return withMonitor_('seedWeek1CurriculumSafe', function() {
    return seedWeek1Curriculum();
  });
}
function seedStaarRlaSprintSafe(jsonStr) {
  return withMonitor_('seedStaarRlaSprintSafe', function() {
    return seedStaarRlaSprint(jsonStr);
  });
}
function getStoryApiStatsSafe() {
  return withMonitor_('getStoryApiStatsSafe', function() {
    return getStoryApiStats();
  });
}

// END OF FILE — Code-Finance.gs v2
// ════════════════════════════════════════════════════════════════════
