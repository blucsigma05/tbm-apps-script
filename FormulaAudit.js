// ════════════════════════════════════════════════════════════════════
// FORMULA AUDIT v2 — Workbook Formula Forensics
// WRITES TO: 💻 FormulaAudit
// READS FROM: ALL tabs (read-only scan)
// ════════════════════════════════════════════════════════════════════

function getFormulaAuditVersion() { return 2; }

// ════════════════════════════════════════════════════════════════════
//
// WHAT THIS DOES:
//   Scans every formula in the TBM workbook and runs 4 health checks:
//   1. LAMBDA/REDUCE Inventory — modern function usage
//   2. Tab Dependency Map — cross-tab formula references
//   3. Range Cap Health — hardcoded row limits vs actual data
//   4. Formula Complexity — longest/deepest formulas
//
// USAGE:
//   Run runFormulaAudit() from the Apps Script editor.
//   Results written to "💻 FormulaAudit" tab.
//
// ARCHITECTURE:
//   Read-only audit — never modifies existing formulas.
//   Uses SSID from TBMConfig.gs (shared global scope).
//   Output tab IS allowed to use modern formulas (not a client surface).
//
// ════════════════════════════════════════════════════════════════════

/**
 * Main entry point — runs all 4 audit checks and writes results.
 * Call from Apps Script editor Run button.
 */
function runFormulaAudit() {
  return withMonitor_('runFormulaAudit', function() {
    var ss = SpreadsheetApp.openById(SSID);
    var sheets = ss.getSheets();
    var timestamp = Utilities.formatDate(new Date(), 'America/Chicago', 'yyyy-MM-dd HH:mm:ss z');

    Logger.log('Starting Formula Audit on ' + sheets.length + ' tabs...');

    // Collect all formulas across all tabs
    var allFormulas = fa_collectAllFormulas_(ss, sheets);
    Logger.log('Collected formulas from ' + sheets.length + ' tabs. Total: ' + allFormulas.totalCount);

    // Run all 4 checks
    var lambdaResults = fa_auditLambdaReduce_(allFormulas);
    Logger.log('Check 1 (LAMBDA/REDUCE): ' + lambdaResults.length + ' hits');

    var depMap = fa_auditTabDependencies_(allFormulas, sheets);
    Logger.log('Check 2 (Dependencies): ' + Object.keys(depMap.graph).length + ' tabs with outgoing refs');

    var rangeCaps = fa_auditRangeCaps_(allFormulas, ss);
    Logger.log('Check 3 (Range Caps): ' + rangeCaps.length + ' capped ranges');

    var complexity = fa_auditFormulaComplexity_(allFormulas);
    Logger.log('Check 4 (Complexity): Top ' + complexity.length + ' formulas');

    // Write results
    fa_writeAuditResults_(ss, timestamp, allFormulas, lambdaResults, depMap, rangeCaps, complexity);

    Logger.log('Formula Audit complete. Results in 💻 FormulaAudit');
    return {
      totalFormulas: allFormulas.totalCount,
      tabsScanned: sheets.length,
      lambdaCount: lambdaResults.length,
      depTabs: Object.keys(depMap.graph).length,
      rangeCapCount: rangeCaps.length,
      complexFormulas: complexity.length,
      timestamp: timestamp
    };
  });
}

// ════════════════════════════════════════════════════════════════════
// DATA COLLECTION
// ════════════════════════════════════════════════════════════════════

/**
 * Collect all formulas from every sheet into a structured object.
 * Returns { byTab: { tabName: [{ cell, formula }] }, totalCount, perTab: { tabName: N } }
 */
function fa_collectAllFormulas_(ss, sheets) {
  var result = { byTab: {}, totalCount: 0, perTab: {} };

  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var name = sheet.getName();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow < 1 || lastCol < 1) {
      result.perTab[name] = 0;
      continue;
    }

    try {
      var formulas = sheet.getRange(1, 1, lastRow, lastCol).getFormulas();
    } catch (e) {
      Logger.log('WARN: Could not read formulas from "' + name + '": ' + e.message);
      result.perTab[name] = 0;
      continue;
    }

    var tabFormulas = [];
    for (var r = 0; r < formulas.length; r++) {
      for (var c = 0; c < formulas[r].length; c++) {
        if (formulas[r][c]) {
          tabFormulas.push({
            cell: fa_colToA1_(c) + (r + 1),
            formula: formulas[r][c]
          });
        }
      }
    }

    result.byTab[name] = tabFormulas;
    result.perTab[name] = tabFormulas.length;
    result.totalCount += tabFormulas.length;
  }

  return result;
}

/**
 * Convert 0-based column index to A1 column letter(s).
 */
function fa_colToA1_(col) {
  var s = '';
  col++;
  while (col > 0) {
    col--;
    s = String.fromCharCode(65 + (col % 26)) + s;
    col = Math.floor(col / 26);
  }
  return s;
}

// ════════════════════════════════════════════════════════════════════
// CHECK 1: LAMBDA / REDUCE INVENTORY
// Scan for modern Google Sheets functions that indicate advanced usage.
// ════════════════════════════════════════════════════════════════════

var FA_MODERN_FUNCS = ['LAMBDA', 'REDUCE', 'MAP', 'MAKEARRAY', 'SCAN',
  'BYROW', 'BYCOL', 'LET', 'XLOOKUP', 'FILTER', 'SORT', 'UNIQUE',
  'SEQUENCE', 'RANDARRAY', 'CHOOSECOLS', 'CHOOSEROWS', 'HSTACK', 'VSTACK',
  'TOCOL', 'TOROW', 'WRAPCOLS', 'WRAPROWS', 'IFS', 'SWITCH'];

function fa_auditLambdaReduce_(allFormulas) {
  var pattern = new RegExp('\\b(' + FA_MODERN_FUNCS.join('|') + ')\\s*\\(', 'i');
  var results = [];

  var tabNames = Object.keys(allFormulas.byTab);
  for (var t = 0; t < tabNames.length; t++) {
    var tabName = tabNames[t];
    var formulas = allFormulas.byTab[tabName];

    for (var f = 0; f < formulas.length; f++) {
      var entry = formulas[f];
      if (pattern.test(entry.formula)) {
        // Check for hardcoded range caps in this formula
        var hardcoded = fa_findHardcodedRanges_(entry.formula);

        results.push({
          tab: tabName,
          cell: entry.cell,
          snippet: "'" + entry.formula.substring(0, 80),
          functions: fa_extractModernFuncs_(entry.formula),
          hardcodedRanges: hardcoded.length > 0 ? hardcoded.join(', ') : 'none'
        });
      }
    }
  }

  return results;
}

function fa_extractModernFuncs_(formula) {
  var found = [];
  var upper = formula.toUpperCase();
  for (var i = 0; i < FA_MODERN_FUNCS.length; i++) {
    if (upper.indexOf(FA_MODERN_FUNCS[i]) !== -1) found.push(FA_MODERN_FUNCS[i]);
  }
  return found.join(', ');
}

function fa_findHardcodedRanges_(formula) {
  var results = [];
  var rp = new RegExp('([A-Z]+)(\\d+):([A-Z]+)(\\d+)', 'gi');
  var match;
  while ((match = rp.exec(formula)) !== null) {
    var endRow = parseInt(match[4], 10);
    if (endRow > 100) results.push(match[0]);
  }
  return results;
}

// ════════════════════════════════════════════════════════════════════
// CHECK 2: TAB DEPENDENCY MAP
// Parse cross-tab references from formulas to build a directed graph.
// ════════════════════════════════════════════════════════════════════

function fa_auditTabDependencies_(allFormulas, sheets) {
  var sheetNames = [];
  for (var s = 0; s < sheets.length; s++) {
    sheetNames.push(sheets[s].getName());
  }

  var graph = {};       // graph[tabA] = [tabs that tabA references]
  var refCounts = {};   // How many other tabs reference each tab

  var tabNames = Object.keys(allFormulas.byTab);
  for (var t = 0; t < tabNames.length; t++) {
    var tabName = tabNames[t];
    var formulas = allFormulas.byTab[tabName];
    var refs = {};

    for (var f = 0; f < formulas.length; f++) {
      var formula = formulas[f].formula;

      // Quoted references: 'Sheet Name'!
      var qr = new RegExp("'([^']+)'!", 'g');
      var match;
      while ((match = qr.exec(formula)) !== null) {
        var refTab = match[1];
        if (refTab !== tabName) refs[refTab] = true;
      }

      // Unquoted references — only for simple sheet names (no special chars)
      for (var sn = 0; sn < sheetNames.length; sn++) {
        var sName = sheetNames[sn];
        if (sName === tabName) continue;
        if (/^[A-Za-z_]\w*$/.test(sName) && formula.indexOf(sName + '!') !== -1) {
          refs[sName] = true;
        }
      }
    }

    var refList = Object.keys(refs);
    if (refList.length > 0) {
      graph[tabName] = refList;
      for (var r = 0; r < refList.length; r++) {
        refCounts[refList[r]] = (refCounts[refList[r]] || 0) + 1;
      }
    }
  }

  // Classify: orphans, hot tabs, circular deps
  var allReferenced = {};
  var allReferencing = {};
  for (var tab in graph) {
    allReferencing[tab] = true;
    for (var i = 0; i < graph[tab].length; i++) {
      allReferenced[graph[tab][i]] = true;
    }
  }

  var orphans = [];
  for (var s = 0; s < sheetNames.length; s++) {
    var nm = sheetNames[s];
    if (!allReferenced[nm] && !allReferencing[nm]) orphans.push(nm);
  }

  var hotTabs = [];
  for (var tab in refCounts) {
    if (refCounts[tab] >= 5) hotTabs.push({ tab: tab, count: refCounts[tab] });
  }
  hotTabs.sort(function(a, b) { return b.count - a.count; });

  // Circular dependency detection (bidirectional pairs)
  var circulars = [];
  for (var tabA in graph) {
    for (var i = 0; i < graph[tabA].length; i++) {
      var tabB = graph[tabA][i];
      if (graph[tabB] && graph[tabB].indexOf(tabA) !== -1) {
        var pair = [tabA, tabB].sort().join(' \u2194 ');
        if (circulars.indexOf(pair) === -1) circulars.push(pair);
      }
    }
  }

  return { graph: graph, refCounts: refCounts, orphans: orphans, hotTabs: hotTabs, circulars: circulars };
}

// ════════════════════════════════════════════════════════════════════
// CHECK 3: RANGE CAP HEALTH CHECK
// Find hardcoded row limits in formulas, compare to actual data.
// ════════════════════════════════════════════════════════════════════

function fa_auditRangeCaps_(allFormulas, ss) {
  // Cache last row per tab
  var lastRows = {};
  var sheets = ss.getSheets();
  for (var s = 0; s < sheets.length; s++) {
    lastRows[sheets[s].getName()] = sheets[s].getLastRow();
  }

  var results = [];
  var seen = {};

  var tabNames = Object.keys(allFormulas.byTab);
  for (var t = 0; t < tabNames.length; t++) {
    var tabName = tabNames[t];
    var formulas = allFormulas.byTab[tabName];

    for (var f = 0; f < formulas.length; f++) {
      var entry = formulas[f];
      var rp = new RegExp('([A-Z]+)(\\d+):([A-Z]+)(\\d+)', 'gi');
      var match;

      while ((match = rp.exec(entry.formula)) !== null) {
        var startRow = parseInt(match[2], 10);
        var endRow = parseInt(match[4], 10);

        // Only flag data ranges: starts near top, ends at large fixed row
        if (endRow <= 100 || startRow > 10) continue;

        // Determine target tab — check if preceded by a sheet reference
        var targetTab = tabName;
        var preceding = entry.formula.substring(0, match.index);
        var tabRefMatch = preceding.match(/'([^']+)'!\s*$/);
        if (tabRefMatch) targetTab = tabRefMatch[1];
        // Also check unquoted
        if (!tabRefMatch) {
          var unquotedMatch = preceding.match(/([A-Za-z_]\w*)!\s*$/);
          if (unquotedMatch) targetTab = unquotedMatch[1];
        }

        var actualLastRow = lastRows[targetTab] || 0;
        var headroom = endRow - actualLastRow;
        var key = targetTab + '!' + match[1] + match[2] + ':' + match[3] + match[4];

        if (!seen[key]) {
          seen[key] = true;
          results.push({
            sourceTab: tabName,
            sourceCell: entry.cell,
            targetTab: targetTab,
            range: match[0],
            cap: endRow,
            actualLastRow: actualLastRow,
            headroom: headroom,
            critical: headroom < 500
          });
        }
      }
    }
  }

  results.sort(function(a, b) { return a.headroom - b.headroom; });
  return results;
}

// ════════════════════════════════════════════════════════════════════
// CHECK 4: FORMULA COMPLEXITY SCAN
// Find the 10 longest/most deeply nested formulas.
// ════════════════════════════════════════════════════════════════════

function fa_auditFormulaComplexity_(allFormulas) {
  var all = [];

  var tabNames = Object.keys(allFormulas.byTab);
  for (var t = 0; t < tabNames.length; t++) {
    var tabName = tabNames[t];
    var formulas = allFormulas.byTab[tabName];

    for (var f = 0; f < formulas.length; f++) {
      var entry = formulas[f];
      var formula = entry.formula;

      // Max parenthesis nesting depth
      var maxDepth = 0, depth = 0;
      for (var i = 0; i < formula.length; i++) {
        if (formula[i] === '(') { depth++; if (depth > maxDepth) maxDepth = depth; }
        if (formula[i] === ')') depth--;
      }

      // Count function calls
      var funcCalls = (formula.match(/[A-Z_]+\(/gi) || []).length;

      all.push({
        tab: tabName,
        cell: entry.cell,
        length: formula.length,
        depth: maxDepth,
        funcCalls: funcCalls,
        snippet: "'" + formula.substring(0, 120)
      });
    }
  }

  // Sort by length descending, take top 10
  all.sort(function(a, b) { return b.length - a.length; });
  return all.slice(0, 10);
}

// ════════════════════════════════════════════════════════════════════
// OUTPUT WRITER
// ════════════════════════════════════════════════════════════════════

function fa_writeAuditResults_(ss, timestamp, allFormulas, lambdaResults, depMap, rangeCaps, complexity) {
  var OUTPUT_TAB = '\uD83D\uDCBB FormulaAudit';
  var sheet = ss.getSheetByName(OUTPUT_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(OUTPUT_TAB);
  } else {
    sheet.clear();
  }

  var COLS = 8;
  var rows = [];

  function pad(arr) {
    while (arr.length < COLS) arr.push('');
    return arr;
  }

  // ── SUMMARY ──
  rows.push(pad(['\u2550\u2550\u2550 FORMULA AUDIT RESULTS \u2550\u2550\u2550']));
  rows.push(pad(['Run:', timestamp]));
  rows.push(pad(['Total formulas:', allFormulas.totalCount]));
  rows.push(pad(['Tabs scanned:', Object.keys(allFormulas.perTab).length]));
  rows.push(pad(['Modern funcs found:', lambdaResults.length]));
  rows.push(pad(['Capped ranges:', rangeCaps.length]));
  rows.push(pad(['Critical caps (<500 headroom):', rangeCaps.filter(function(r) { return r.critical; }).length]));
  rows.push(pad(['Circular deps:', depMap.circulars.length]));
  rows.push(pad(['']));

  // ── FORMULA COUNTS BY TAB ──
  rows.push(pad(['\u2500\u2500 FORMULA COUNTS BY TAB \u2500\u2500']));
  rows.push(pad(['Tab', 'Count']));
  var sortedTabs = Object.keys(allFormulas.perTab).sort(function(a, b) {
    return (allFormulas.perTab[b] || 0) - (allFormulas.perTab[a] || 0);
  });
  for (var i = 0; i < sortedTabs.length; i++) {
    if (allFormulas.perTab[sortedTabs[i]] > 0) {
      rows.push(pad([sortedTabs[i], allFormulas.perTab[sortedTabs[i]]]));
    }
  }
  rows.push(pad(['']));

  // ── CHECK 1: LAMBDA/REDUCE ──
  rows.push(pad(['\u2550\u2550\u2550 CHECK 1: MODERN FUNCTION INVENTORY \u2550\u2550\u2550']));
  rows.push(pad(['Found:', lambdaResults.length + ' cells']));
  rows.push(pad(['Tab', 'Cell', 'Functions', 'Hardcoded Ranges', 'Formula (80 chars)']));
  for (var i = 0; i < lambdaResults.length; i++) {
    var lr = lambdaResults[i];
    rows.push(pad([lr.tab, lr.cell, lr.functions, lr.hardcodedRanges, lr.snippet]));
  }
  rows.push(pad(['']));

  // ── CHECK 2: TAB DEPENDENCIES ──
  rows.push(pad(['\u2550\u2550\u2550 CHECK 2: TAB DEPENDENCY MAP \u2550\u2550\u2550']));
  rows.push(pad(['']));

  rows.push(pad(['\u2500\u2500 HOT TABS (referenced by 5+ others) \u2500\u2500']));
  rows.push(pad(['Tab', 'Referenced By (count)']));
  for (var i = 0; i < depMap.hotTabs.length; i++) {
    rows.push(pad([depMap.hotTabs[i].tab, depMap.hotTabs[i].count]));
  }
  if (depMap.hotTabs.length === 0) rows.push(pad(['(none)']));
  rows.push(pad(['']));

  rows.push(pad(['\u2500\u2500 CIRCULAR DEPENDENCIES \u2500\u2500']));
  if (depMap.circulars.length > 0) {
    for (var i = 0; i < depMap.circulars.length; i++) {
      rows.push(pad([depMap.circulars[i]]));
    }
  } else {
    rows.push(pad(['(none detected)']));
  }
  rows.push(pad(['']));

  rows.push(pad(['\u2500\u2500 ORPHAN TABS (no formula references) \u2500\u2500']));
  for (var i = 0; i < depMap.orphans.length; i++) {
    rows.push(pad([depMap.orphans[i]]));
  }
  if (depMap.orphans.length === 0) rows.push(pad(['(none)']));
  rows.push(pad(['']));

  rows.push(pad(['\u2500\u2500 FULL DEPENDENCY GRAPH \u2500\u2500']));
  rows.push(pad(['Source Tab', 'References \u2192']));
  var graphTabs = Object.keys(depMap.graph).sort();
  for (var i = 0; i < graphTabs.length; i++) {
    rows.push(pad([graphTabs[i], depMap.graph[graphTabs[i]].join(', ')]));
  }
  rows.push(pad(['']));

  // ── CHECK 3: RANGE CAPS ──
  rows.push(pad(['\u2550\u2550\u2550 CHECK 3: RANGE CAP HEALTH CHECK \u2550\u2550\u2550']));
  rows.push(pad(['Found:', rangeCaps.length + ' capped ranges']));
  rows.push(['Source Tab', 'Cell', 'Target Tab', 'Range', 'Cap', 'Last Row', 'Headroom', 'Critical?']);
  for (var i = 0; i < rangeCaps.length; i++) {
    var rc = rangeCaps[i];
    rows.push([rc.sourceTab, rc.sourceCell, rc.targetTab, rc.range, rc.cap, rc.actualLastRow, rc.headroom, rc.critical ? '\u26A0 YES' : '']);
  }
  rows.push(pad(['']));

  // ── CHECK 4: COMPLEXITY ──
  rows.push(pad(['\u2550\u2550\u2550 CHECK 4: FORMULA COMPLEXITY (Top 10) \u2550\u2550\u2550']));
  rows.push(pad(['Tab', 'Cell', 'Length', 'Nesting', 'Func Calls', 'Formula (120 chars)']));
  for (var i = 0; i < complexity.length; i++) {
    var cx = complexity[i];
    rows.push(pad([cx.tab, cx.cell, cx.length, cx.depth, cx.funcCalls, cx.snippet]));
  }

  // Write all rows
  if (rows.length > 0) {
    sheet.getRange(1, 1, rows.length, COLS).setValues(rows);
  }

  // Light formatting
  sheet.getRange(1, 1, 1, COLS).setFontWeight('bold').setFontSize(12);
  sheet.autoResizeColumns(1, Math.min(COLS, 6));
}

// ════════════════════════════════════════════════════════════════════
// RANGE CAP REPAIR
// Widen hardcoded row caps that are approaching their limit.
// ════════════════════════════════════════════════════════════════════

/**
 * Diagnose and fix the 4 Budget_Data range caps found by the audit.
 * Widens :X1000 → :X50000 in the affected formulas.
 *
 * Run from GAS editor. Logs before/after for each cell.
 * Dry-run mode: call fa_fixBudgetDataCaps(true) to preview without writing.
 */
function fa_fixBudgetDataCaps(dryRun) {
  var ss = SpreadsheetApp.openById(SSID);
  var resolvedTargets = [
    { tab: TAB_MAP['NetWorth'], cell: 'B75' },
    { tab: TAB_MAP['Dashboard_Export'], cell: 'B18' }
  ];

  // Build pattern from the actual emoji tab name used in formulas
  var bdName = TAB_MAP['Budget_Data'];
  var escapedName = bdName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Matches: '💻🧮 Budget_Data'!A2:A1000 — captures everything before "1000"
  var capPattern = new RegExp("('" + escapedName + "'![A-Z]+\\d+:[A-Z]+)1000\\b", 'g');

  var fixed = 0;

  for (var i = 0; i < resolvedTargets.length; i++) {
    var t = resolvedTargets[i];
    var sheet = ss.getSheetByName(t.tab);
    if (!sheet) {
      Logger.log('SKIP: Tab "' + t.tab + '" not found');
      continue;
    }

    var range = sheet.getRange(t.cell);
    var formula = range.getFormula();
    if (!formula) {
      Logger.log('SKIP: ' + t.tab + '!' + t.cell + ' has no formula');
      continue;
    }

    Logger.log('=== ' + t.tab + '!' + t.cell + ' (' + formula.length + ' chars) ===');
    Logger.log('ORIGINAL (first 300):');
    Logger.log(formula.substring(0, 300));

    // Reset regex lastIndex for each formula
    capPattern.lastIndex = 0;
    var matches = formula.match(capPattern);
    if (!matches || matches.length === 0) {
      Logger.log('  No Budget_Data :1000 caps found');
      continue;
    }

    Logger.log('  Found ' + matches.length + ' capped ranges: ' + matches.join(' | '));

    // Replace: capture group $1 has everything before "1000", append "50000"
    capPattern.lastIndex = 0;
    var newFormula = formula.replace(capPattern, '$150000');

    if (newFormula === formula) {
      Logger.log('  WARNING: replace produced no change');
      continue;
    }

    Logger.log('AFTER FIX (first 300):');
    Logger.log(newFormula.substring(0, 300));

    if (dryRun) {
      Logger.log('  DRY RUN — not writing');
    } else {
      range.setFormula(newFormula);
      Logger.log('  WRITTEN to sheet');
      fixed++;
    }
  }

  var mode = dryRun ? 'DRY RUN' : 'LIVE';
  Logger.log('=== ' + mode + ' COMPLETE: ' + fixed + ' formulas updated ===');
  return { fixed: fixed, dryRun: !!dryRun };
}

/**
 * Diagnostic: dump the full formula text from a specific cell.
 * Usage: fa_dumpFormula('NetWorth', 'B75')
 */
function fa_dumpFormula(tabKey, cellRef) {
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = TAB_MAP[tabKey] || tabKey;
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) { Logger.log('Tab not found: ' + tabName); return; }
  var formula = sheet.getRange(cellRef).getFormula();
  Logger.log('═══ ' + tabName + '!' + cellRef + ' (' + formula.length + ' chars) ═══');
  // Log in chunks to avoid truncation
  for (var i = 0; i < formula.length; i += 500) {
    Logger.log(formula.substring(i, i + 500));
  }
  return formula;
}

// FormulaAudit.js v2 — EOF
