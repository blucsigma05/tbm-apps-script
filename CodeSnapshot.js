// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// CodeSnapshot.gs v1 — Snapshot code to Google Drive
// ════════════════════════════════════════════════════════════════════

function getCodeSnapshotVersion() { return 1; }

// ════════════════════════════════════════════════════════════════════
// snapshotCodeToGDrive() — Copies all .gs and .html files from this
// Apps Script project into a Google Drive folder as plain text files.
// ════════════════════════════════════════════════════════════════════
//
// Setup:
//   1. Enable "Apps Script API" at https://script.google.com/home/usersettings
//   2. Add scope: https://www.googleapis.com/auth/script.projects.readonly
//      (will be prompted on first run)
//   3. Set SNAPSHOT_FOLDER_ID in Script Properties
//
// Usage:
//   Run manually, or set a daily time-driven trigger.
//   Creates: TBM_Code_Snapshot_2026-03-28/
//            ├── DataEngine.gs.txt
//            ├── KidsHub.html.txt
//            └── ... (all project files)
//
// Works for both TBM and MLS — just set the right SCRIPT_ID.
// ════════════════════════════════════════════════════════════════════

function snapshotCodeToGDrive(options) {
  options = options || {};
  var createDocs = options.createDocs !== false; // default true, set false to skip Google Docs

  // ── Config ─────────────────────────────────────────────────────
  var props = PropertiesService.getScriptProperties();

  var scriptId = props.getProperty('SNAPSHOT_SCRIPT_ID') || ScriptApp.getScriptId();
  var folderId = props.getProperty('SNAPSHOT_FOLDER_ID');

  if (!folderId) {
    throw new Error('Set SNAPSHOT_FOLDER_ID in Script Properties. ' +
      'Create a Google Drive folder, copy the ID from the URL.');
  }

  var projectLabel = props.getProperty('SNAPSHOT_LABEL') || 'TBM';

  // ── Fetch project files via Apps Script API ────────────────────
  var url = 'https://script.googleapis.com/v1/projects/' + scriptId + '/content';
  var token = ScriptApp.getOAuthToken();

  var response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('Apps Script API error (' + response.getResponseCode() + '): ' +
      response.getContentText().substring(0, 200));
  }

  var project = JSON.parse(response.getContentText());
  var files = project.files || [];

  if (files.length === 0) {
    throw new Error('No files returned from Apps Script API. Check SCRIPT_ID and API access.');
  }

  // ── Create dated subfolder ─────────────────────────────────────
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var subfolderName = projectLabel + '_Code_Snapshot_' + today;

  var parentFolder = DriveApp.getFolderById(folderId);

  // Check if today's snapshot already exists (avoid duplicates)
  var existing = parentFolder.getFoldersByName(subfolderName);
  var subfolder;
  if (existing.hasNext()) {
    subfolder = existing.next();
    var oldFiles = subfolder.getFiles();
    while (oldFiles.hasNext()) {
      oldFiles.next().setTrashed(true);
    }
  } else {
    subfolder = parentFolder.createFolder(subfolderName);
  }

  // ── Write each file ────────────────────────────────────────────
  var fileCount = 0;
  var manifest = [];

  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    var name = f.name || 'unknown';
    var type = f.type || 'SERVER_JS';
    var source = f.source || '';

    var ext;
    if (type === 'HTML') {
      ext = '.html';
    } else if (type === 'JSON') {
      ext = '.json';
    } else {
      ext = '.gs';
    }

    // Plain text file (readable by any model, any tool)
    var fileName = name + ext + '.txt';
    subfolder.createFile(fileName, source, 'text/plain');

    // Optional: Google Doc version (searchable, commentable)
    if (createDocs) {
      var doc = DocumentApp.create(projectLabel + ' \u2014 ' + name + ext);
      doc.getBody().setText(source);
      doc.saveAndClose();
      var docFile = DriveApp.getFileById(doc.getId());
      docFile.moveTo(subfolder);
    }

    manifest.push({
      name: name + ext,
      type: type,
      lines: source.split('\n').length,
      chars: source.length
    });

    fileCount++;
  }

  // ── Write manifest ─────────────────────────────────────────────
  var sep = '';
  for (var s = 0; s < 50; s++) sep += '\u2550';

  var manifestText = projectLabel + ' Code Snapshot \u2014 ' + today + '\n';
  manifestText += sep + '\n\n';
  manifestText += 'Files: ' + fileCount + '\n';
  manifestText += 'Script ID: ' + scriptId + '\n\n';

  var totalLines = 0;
  for (var j = 0; j < manifest.length; j++) {
    var m = manifest[j];
    totalLines += m.lines;
    manifestText += m.name + '  (' + m.lines + ' lines, ' + m.chars + ' chars)\n';
  }
  manifestText += '\nTotal: ' + totalLines + ' lines across ' + fileCount + ' files\n';

  subfolder.createFile('_MANIFEST.txt', manifestText, 'text/plain');

  // ── Log results ────────────────────────────────────────────────
  Logger.log('Snapshot complete: ' + fileCount + ' files \u2192 ' + subfolderName);
  Logger.log('Folder: https://drive.google.com/drive/folders/' + subfolder.getId());

  return {
    folder: subfolder.getId(),
    folderUrl: 'https://drive.google.com/drive/folders/' + subfolder.getId(),
    files: fileCount,
    totalLines: totalLines,
    date: today
  };
}


// ════════════════════════════════════════════════════════════════════
// snapshotToSingleDoc() — All code in ONE text file for easy sharing
// ════════════════════════════════════════════════════════════════════
// The "paste into Claude / Gemini" version.
// Creates one big file with all sources separated by headers.

function snapshotToSingleDoc() {
  var props = PropertiesService.getScriptProperties();
  var scriptId = props.getProperty('SNAPSHOT_SCRIPT_ID') || ScriptApp.getScriptId();
  var folderId = props.getProperty('SNAPSHOT_FOLDER_ID');
  var projectLabel = props.getProperty('SNAPSHOT_LABEL') || 'TBM';

  if (!folderId) {
    throw new Error('Set SNAPSHOT_FOLDER_ID in Script Properties.');
  }

  var url = 'https://script.googleapis.com/v1/projects/' + scriptId + '/content';
  var token = ScriptApp.getOAuthToken();

  var response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('API error: ' + response.getContentText().substring(0, 200));
  }

  var project = JSON.parse(response.getContentText());
  var files = project.files || [];

  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  var sep = '';
  for (var s = 0; s < 60; s++) sep += '\u2550';

  var combined = '';
  combined += '# ' + projectLabel + ' \u2014 Full Codebase Snapshot\n';
  combined += '# Date: ' + today + '\n';
  combined += '# Script ID: ' + scriptId + '\n';
  combined += '# Files: ' + files.length + '\n';
  combined += '#' + sep + '\n\n';

  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    var ext = f.type === 'HTML' ? '.html' : f.type === 'JSON' ? '.json' : '.gs';
    var lines = (f.source || '').split('\n').length;

    combined += '\n' + sep + '\n';
    combined += '# FILE: ' + f.name + ext + ' (' + lines + ' lines)\n';
    combined += sep + '\n\n';
    combined += f.source || '';
    combined += '\n';
  }

  var fileName = projectLabel + '_Full_Codebase_' + today + '.txt';
  var parentFolder = DriveApp.getFolderById(folderId);
  var file = parentFolder.createFile(fileName, combined, 'text/plain');

  Logger.log('Single-doc snapshot: ' + fileName);
  Logger.log('URL: ' + file.getUrl());
  Logger.log('Size: ' + combined.length + ' chars');

  return {
    fileId: file.getId(),
    url: file.getUrl(),
    name: fileName,
    chars: combined.length,
    fileCount: files.length
  };
}


// ════════════════════════════════════════════════════════════════════
// Quick-run wrappers (for manual execution from GAS editor)
// ════════════════════════════════════════════════════════════════════

// Full snapshot with Google Docs
function runSnapshot() { return snapshotCodeToGDrive(); }

// Fast snapshot — text files only, no Google Docs (saves ~30s)
function runSnapshotFast() { return snapshotCodeToGDrive({ createDocs: false }); }

// Single combined file for AI context
function runSnapshotSingle() { return snapshotToSingleDoc(); }
