// ════════════════════════════════════════════════════════════════════
// TBMConfig.gs v2 — Shared Environment Configuration
// WRITES TO: (none — config only)
// READS FROM: Script Properties (TBM_ENV)
// ════════════════════════════════════════════════════════════════════

function getTBMConfigVersion() { return 2; }

// ════════════════════════════════════════════════════════════════════
// ENVIRONMENT CONFIGURATION
//
// Controls which workbook the entire system targets.
// Default = production (no Script Property needed).
// Set Script Property TBM_ENV=qa to switch to QA workbook.
//
// All .gs files share global scope — SSID and TBM_ENV are available
// everywhere once this file loads.
// ════════════════════════════════════════════════════════════════════

var TBM_ENV = (function() {
  var props = PropertiesService.getScriptProperties();
  var env = props.getProperty('TBM_ENV') || 'prod';

  var configs = {
    prod: {
      SSID: '1_jn-I4IfsqgnVOFiS38SVVzNJ0MAJtu2645iU5k0U9c',
      ENV_NAME: 'production'
    },
    qa: {
      SSID: props.getProperty('TBM_QA_SSID') || '',
      ENV_NAME: 'qa'
    }
  };

  var cfg = configs[env] || configs.prod;
  cfg.ENV = env;
  return cfg;
})();

// Global SSID — consumed by all .gs files via openById(SSID)
// This replaces the hardcoded constant that was in DataEngine.js
var SSID = TBM_ENV.SSID;

// Canonical workbook accessor — preferred over raw openById(SSID)
// Returns a cached SpreadsheetApp reference for the active environment.
var _tbmSS = null;
function tbm_getWorkbook_() {
  if (!_tbmSS) _tbmSS = SpreadsheetApp.openById(SSID);
  return _tbmSS;
}

// ════════════════════════════════════════════════════════════════════
// ENVIRONMENT GUARDS
// ════════════════════════════════════════════════════════════════════

// Returns true if running in QA environment.
// v2: Also returns true when per-request SSID override targets QA workbook.
function tbm_isQA_() {
  if (TBM_ENV.ENV === 'qa') return true;
  var qaSSID = PropertiesService.getScriptProperties().getProperty('TBM_QA_SSID');
  return !!(qaSSID && SSID === qaSSID);
}

// Throws if NOT in QA — use before destructive test operations.
// v2: Accepts per-request SSID override as QA proof (no global toggle needed).
function tbm_requireQA_(caller) {
  if (tbm_isQA_()) return;
  throw new Error(caller + ' blocked — requires QA context. Current env: ' + TBM_ENV.ENV + ', SSID not QA');
}

// Version history tracked in Notion deploy page. Do not add version comments here.
// TBMConfig.gs v2 — EOF
