// ════════════════════════════════════════════════════════════════════
// TBMConfig.gs v1 — Shared Environment Configuration
// WRITES TO: (none — config only)
// READS FROM: Script Properties (TBM_ENV)
// ════════════════════════════════════════════════════════════════════

function getTBMConfigVersion() { return 1; }

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

// Returns true if running in QA environment
function tbm_isQA_() {
  return TBM_ENV.ENV === 'qa';
}

// Throws if NOT in QA — use before destructive test operations
function tbm_requireQA_(caller) {
  if (TBM_ENV.ENV !== 'qa') {
    throw new Error(caller + ' blocked — requires TBM_ENV=qa. Current: ' + TBM_ENV.ENV);
  }
}

// Version history tracked in Notion deploy page. Do not add version comments here.
// TBMConfig.gs v1 — EOF
