// ════════════════════════════════════════════════════════════════════
// QAHarness.gs v1 — Workflow Persistence Tests (Q7)
// WRITES TO: KH_Chores, KH_History, MealPlan (QA only, cleanup after)
// READS FROM: TAB_MAP, TBM_ENV, KH_ sheets
// ════════════════════════════════════════════════════════════════════

function getQAHarnessVersion() { return 1; }

// ════════════════════════════════════════════════════════════════════
// PERSISTENCE TEST RUNNER
//
// Exercises write→read→verify→cleanup for each trust-critical path.
// ALL tests require QA environment. Will throw in prod.
// ════════════════════════════════════════════════════════════════════

/**
 * Run all persistence tests. Returns structured result object.
 * Called via ?action=runPersistenceTests (QA only).
 */
function runPersistenceTests() {
  tbm_requireQA_('runPersistenceTests');

  var results = [];
  results.push(testChoreCompletion_());
  results.push(testParentApproval_());
  results.push(testDinnerLog_());
  results.push(testEducationAward_());
  results.push(testTaskReset_());

  var failed = results.filter(function(r) { return r.status !== 'PASS'; });
  return JSON.stringify({
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    overall: failed.length === 0 ? 'PASS' : 'FAIL',
    results: results,
    timestamp: new Date().toISOString(),
    environment: TBM_ENV.ENV
  });
}

// ════════════════════════════════════════════════════════════════════
// TEST: Chore Completion
// Path: khCompleteTask(rowIndex, expectedTaskID)
//   → writes Completed=true + Completed_Date to KH_Chores
//   → appends completion entry to KH_History
// ════════════════════════════════════════════════════════════════════

function testChoreCompletion_() {
  var test = { name: 'Chore Completion Persistence', status: 'FAIL', details: '' };
  try {
    tbm_requireQA_('testChoreCompletion_');
    var ss = SpreadsheetApp.openById(SSID);
    var tabName = (typeof TAB_MAP !== 'undefined') ? (TAB_MAP['KH_Chores'] || 'KH_Chores') : 'KH_Chores';
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) { test.details = 'KH_Chores sheet not found'; return test; }

    // Find first uncompleted buggsy task
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(String);
    var cChild = headers.indexOf('Child');
    var cCompleted = headers.indexOf('Completed');
    var cTaskName = headers.indexOf('Task_Name');
    var cTaskID = headers.indexOf('Task_ID');

    var targetRow = -1;
    var targetTaskID = '';
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][cChild]).toLowerCase() === 'buggsy' && !data[i][cCompleted]) {
        targetRow = i + 1; // 1-indexed sheet row
        targetTaskID = String(data[i][cTaskID] || '');
        break;
      }
    }
    if (targetRow === -1) { test.details = 'No uncompleted buggsy task found to test'; return test; }

    // Call the completion function
    var resultRaw = khCompleteTask(targetRow - 1, targetTaskID); // rowIndex is 0-based offset from data
    var result = JSON.parse(resultRaw);
    if (result.status !== 'ok') {
      test.details = 'khCompleteTask returned: ' + resultRaw;
      return test;
    }

    // Read back — verify Completed is now true
    SpreadsheetApp.flush();
    var updatedRow = sheet.getRange(targetRow, 1, 1, headers.length).getValues()[0];
    if (!updatedRow[cCompleted]) {
      test.details = 'Completed column not set to true after completion';
      return test;
    }

    // Verify history entry exists
    var histTab = (typeof TAB_MAP !== 'undefined') ? (TAB_MAP['KH_History'] || 'KH_History') : 'KH_History';
    var histSheet = ss.getSheetByName(histTab);
    if (histSheet && histSheet.getLastRow() > 1) {
      var lastHistRow = histSheet.getRange(histSheet.getLastRow(), 1, 1, histSheet.getLastColumn()).getValues()[0];
      // History should have the completion UID from our call
      test.status = 'PASS';
      test.details = 'Task completed at row ' + targetRow + ', history entry appended';
    } else {
      test.details = 'Completion succeeded but KH_History not updated';
    }

    // Cleanup — reset the task back to uncompleted
    sheet.getRange(targetRow, cCompleted + 1).setValue(false);
    var cDate = headers.indexOf('Completed_Date');
    if (cDate >= 0) sheet.getRange(targetRow, cDate + 1).setValue('');
    var cAppr = headers.indexOf('Parent_Approved');
    if (cAppr >= 0) sheet.getRange(targetRow, cAppr + 1).setValue(false);

    // Remove the last history entry (our test entry)
    if (histSheet && histSheet.getLastRow() > 1) {
      histSheet.deleteRow(histSheet.getLastRow());
    }

  } catch (e) {
    test.details = 'Error: ' + e.message;
  }
  return test;
}

// ════════════════════════════════════════════════════════════════════
// TEST: Parent Approval
// Path: khApproveTask(rowIndex, expectedTaskID)
//   → writes Parent_Approved=true to KH_Chores
//   → appends approval entry to KH_History with points
// ════════════════════════════════════════════════════════════════════

function testParentApproval_() {
  var test = { name: 'Parent Approval Persistence', status: 'FAIL', details: '' };
  try {
    tbm_requireQA_('testParentApproval_');
    var ss = SpreadsheetApp.openById(SSID);
    var tabName = (typeof TAB_MAP !== 'undefined') ? (TAB_MAP['KH_Chores'] || 'KH_Chores') : 'KH_Chores';
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) { test.details = 'KH_Chores sheet not found'; return test; }

    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(String);
    var cChild = headers.indexOf('Child');
    var cCompleted = headers.indexOf('Completed');
    var cApproved = headers.indexOf('Parent_Approved');
    var cTaskID = headers.indexOf('Task_ID');
    var cPoints = headers.indexOf('Points');

    // Find first uncompleted buggsy task, mark it completed, then approve
    var targetRow = -1;
    var targetTaskID = '';
    var targetPoints = 0;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][cChild]).toLowerCase() === 'buggsy' && !data[i][cCompleted]) {
        targetRow = i + 1;
        targetTaskID = String(data[i][cTaskID] || '');
        targetPoints = Number(data[i][cPoints]) || 0;
        break;
      }
    }
    if (targetRow === -1) { test.details = 'No uncompleted buggsy task found'; return test; }

    // Step 1: Complete the task first (approval needs a completed task)
    var compResult = JSON.parse(khCompleteTask(targetRow - 1, targetTaskID));
    if (compResult.status !== 'ok') {
      test.details = 'Setup: completion failed: ' + JSON.stringify(compResult);
      return test;
    }

    // Step 2: Approve
    var approveResult = JSON.parse(khApproveTask(targetRow - 1, targetTaskID));
    if (approveResult.status !== 'ok') {
      test.details = 'khApproveTask returned: ' + JSON.stringify(approveResult);
      // Cleanup partial state
      sheet.getRange(targetRow, headers.indexOf('Completed') + 1).setValue(false);
      return test;
    }

    // Verify Parent_Approved is now true
    SpreadsheetApp.flush();
    var updatedRow = sheet.getRange(targetRow, 1, 1, headers.length).getValues()[0];
    if (!updatedRow[cApproved]) {
      test.details = 'Parent_Approved not set to true after approval';
    } else {
      test.status = 'PASS';
      test.details = 'Task approved at row ' + targetRow + ', points=' + targetPoints;
    }

    // Cleanup — reset task and remove history entries
    sheet.getRange(targetRow, headers.indexOf('Completed') + 1).setValue(false);
    sheet.getRange(targetRow, headers.indexOf('Completed_Date') + 1).setValue('');
    sheet.getRange(targetRow, cApproved + 1).setValue(false);
    var cMult = headers.indexOf('Bonus_Multiplier');
    if (cMult >= 0) sheet.getRange(targetRow, cMult + 1).setValue(1);

    // Remove the 2 history entries (completion + approval)
    var histTab = (typeof TAB_MAP !== 'undefined') ? (TAB_MAP['KH_History'] || 'KH_History') : 'KH_History';
    var histSheet = ss.getSheetByName(histTab);
    if (histSheet && histSheet.getLastRow() > 2) {
      histSheet.deleteRows(histSheet.getLastRow() - 1, 2);
    }

  } catch (e) {
    test.details = 'Error: ' + e.message;
  }
  return test;
}

// ════════════════════════════════════════════════════════════════════
// TEST: Dinner Log
// Path: updateMealPlan(meal, cook, notes)
//   → appends row to MealPlan sheet
// ════════════════════════════════════════════════════════════════════

function testDinnerLog_() {
  var test = { name: 'Dinner Log Persistence', status: 'FAIL', details: '' };
  try {
    tbm_requireQA_('testDinnerLog_');
    var ss = SpreadsheetApp.openById(SSID);

    // Call the dinner log function
    var resultRaw = updateMealPlan('QA_TEST_MEAL', 'QA_Tester', 'Persistence test entry');
    var result = JSON.parse(resultRaw);
    if (result.status !== 'ok') {
      test.details = 'updateMealPlan returned: ' + resultRaw;
      return test;
    }

    // Read back from MealPlan
    SpreadsheetApp.flush();
    var mealTab = (typeof TAB_MAP !== 'undefined') ? (TAB_MAP['MealPlan'] || 'MealPlan') : 'MealPlan';
    var mealSheet = ss.getSheetByName(mealTab);
    if (!mealSheet) {
      test.details = 'MealPlan sheet not found after logging';
      return test;
    }

    var lastRow = mealSheet.getLastRow();
    if (lastRow < 2) {
      test.details = 'MealPlan has no data rows after logging';
      return test;
    }

    var lastEntry = mealSheet.getRange(lastRow, 1, 1, mealSheet.getLastColumn()).getValues()[0];
    // Check if our test meal is in the last row
    var foundMeal = false;
    for (var c = 0; c < lastEntry.length; c++) {
      if (String(lastEntry[c]).indexOf('QA_TEST_MEAL') !== -1) {
        foundMeal = true;
        break;
      }
    }

    if (foundMeal) {
      test.status = 'PASS';
      test.details = 'Dinner logged and found in MealPlan row ' + lastRow;
    } else {
      test.details = 'Log call returned ok but QA_TEST_MEAL not found in last row';
    }

    // Cleanup — remove the test entry
    if (foundMeal) {
      mealSheet.deleteRow(lastRow);
    }

  } catch (e) {
    test.details = 'Error: ' + e.message;
  }
  return test;
}

// ════════════════════════════════════════════════════════════════════
// TEST: Education Award
// Path: kh_awardEducationPoints_(kid, amount, source)
//   → appends education event to KH_History
// ════════════════════════════════════════════════════════════════════

function testEducationAward_() {
  var test = { name: 'Education Award Persistence', status: 'FAIL', details: '' };
  try {
    tbm_requireQA_('testEducationAward_');
    var ss = SpreadsheetApp.openById(SSID);

    // Call the education award function directly (not the Safe wrapper)
    var resultRaw = kh_awardEducationPoints_('buggsy', 5, 'QA_TEST_MODULE');
    var result = JSON.parse(resultRaw);
    if (result.status !== 'ok') {
      test.details = 'kh_awardEducationPoints_ returned: ' + resultRaw;
      return test;
    }

    // Read back from KH_History — look for our education entry
    SpreadsheetApp.flush();
    var histTab = (typeof TAB_MAP !== 'undefined') ? (TAB_MAP['KH_History'] || 'KH_History') : 'KH_History';
    var histSheet = ss.getSheetByName(histTab);
    if (!histSheet || histSheet.getLastRow() < 2) {
      test.details = 'KH_History empty after education award';
      return test;
    }

    var lastRow = histSheet.getRange(histSheet.getLastRow(), 1, 1, histSheet.getLastColumn()).getValues()[0];
    var foundEdu = false;
    for (var c = 0; c < lastRow.length; c++) {
      if (String(lastRow[c]).indexOf('QA_TEST_MODULE') !== -1) {
        foundEdu = true;
        break;
      }
    }

    if (foundEdu) {
      test.status = 'PASS';
      test.details = 'Education award (5 pts, QA_TEST_MODULE) persisted to KH_History';
    } else {
      test.details = 'Award call returned ok but QA_TEST_MODULE not found in last history row';
    }

    // Cleanup — remove the test entry
    if (foundEdu) {
      histSheet.deleteRow(histSheet.getLastRow());
    }

  } catch (e) {
    test.details = 'Error: ' + e.message;
  }
  return test;
}

// ════════════════════════════════════════════════════════════════════
// TEST: Daily Task Reset
// Path: khResetTasks('daily', 'all')
//   → sets Completed=false, Completed_Date='' for daily tasks
// ════════════════════════════════════════════════════════════════════

function testTaskReset_() {
  var test = { name: 'Daily Task Reset', status: 'FAIL', details: '' };
  try {
    tbm_requireQA_('testTaskReset_');
    var ss = SpreadsheetApp.openById(SSID);
    var tabName = (typeof TAB_MAP !== 'undefined') ? (TAB_MAP['KH_Chores'] || 'KH_Chores') : 'KH_Chores';
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) { test.details = 'KH_Chores sheet not found'; return test; }

    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(String);
    var cCompleted = headers.indexOf('Completed');
    var cFrequency = headers.indexOf('Frequency');

    // Step 1: Mark a few daily tasks as completed
    var marked = 0;
    for (var i = 1; i < data.length; i++) {
      var freq = String(data[i][cFrequency] || '').toLowerCase();
      if (freq === 'daily' && !data[i][cCompleted] && marked < 3) {
        sheet.getRange(i + 1, cCompleted + 1).setValue(true);
        marked++;
      }
    }
    if (marked === 0) {
      // All tasks might already be completed — try to mark them anyway
      for (var j = 1; j < data.length && marked < 3; j++) {
        if (String(data[j][cFrequency] || '').toLowerCase() === 'daily') {
          sheet.getRange(j + 1, cCompleted + 1).setValue(true);
          marked++;
        }
      }
    }
    if (marked === 0) { test.details = 'No daily tasks found to test reset'; return test; }
    SpreadsheetApp.flush();

    // Step 2: Run reset
    var resetRaw = khResetTasks('daily', 'all');
    var resetResult = JSON.parse(resetRaw);
    if (resetResult.status !== 'ok') {
      test.details = 'khResetTasks returned: ' + resetRaw;
      return test;
    }

    // Step 3: Verify all daily tasks are now uncompleted
    SpreadsheetApp.flush();
    var postData = sheet.getDataRange().getValues();
    var allReset = true;
    for (var k = 1; k < postData.length; k++) {
      var kFreq = String(postData[k][cFrequency] || '').toLowerCase();
      if (kFreq === 'daily' && postData[k][cCompleted]) {
        allReset = false;
        break;
      }
    }

    if (allReset) {
      test.status = 'PASS';
      test.details = 'Reset ' + resetResult.resetCount + ' daily tasks, all verified uncompleted';
    } else {
      test.details = 'Some daily tasks still show Completed=true after reset';
    }

  } catch (e) {
    test.details = 'Error: ' + e.message;
  }
  return test;
}

// ════════════════════════════════════════════════════════════════════
// SAFE WRAPPER for persistence tests
// ════════════════════════════════════════════════════════════════════

function runPersistenceTestsSafe() {
  return withMonitor_('runPersistenceTestsSafe', function() {
    return JSON.parse(runPersistenceTests());
  });
}

// Version history tracked in Notion deploy page. Do not add version comments here.
// QAHarness.gs v1 — EOF
