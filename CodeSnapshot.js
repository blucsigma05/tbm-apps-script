// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// CodeSnapshot.gs v3 — Thin wrappers calling ThompsonLib
// ════════════════════════════════════════════════════════════════════

function getCodeSnapshotVersion() { return 3; }

function _snapshotConfig_() {
  var props = PropertiesService.getScriptProperties();
  return {
    scriptId: props.getProperty('SNAPSHOT_SCRIPT_ID') || ScriptApp.getScriptId(),
    folderId: props.getProperty('SNAPSHOT_FOLDER_ID'),
    label: props.getProperty('SNAPSHOT_LABEL') || 'TBM',
    surfaceMap: {
      'ThePulse': 'ThePulse',
      'TheVein':  'TheVein',
      'KidsHub':  'KidsHub_HTML',
      'TheSpine': 'Ambient',
      'TheSoul':  'Ambient'
    }
  };
}

// Split snapshot — Server.txt + one per HTML surface + Manifest (recommended)
function runSnapshotSplit() {
  var cfg = _snapshotConfig_();
  if (!cfg.folderId) throw new Error('Set SNAPSHOT_FOLDER_ID in Script Properties.');
  return ThompsonLib.snapshotSplit(cfg);
}

// Individual files in dated subfolder
function runSnapshot() {
  var cfg = _snapshotConfig_();
  if (!cfg.folderId) throw new Error('Set SNAPSHOT_FOLDER_ID in Script Properties.');
  return ThompsonLib.snapshotCodeToGDrive(cfg);
}

// Single combined file for AI context
function runSnapshotSingle() {
  var cfg = _snapshotConfig_();
  if (!cfg.folderId) throw new Error('Set SNAPSHOT_FOLDER_ID in Script Properties.');
  return ThompsonLib.snapshotToSingleDoc(cfg);
}
