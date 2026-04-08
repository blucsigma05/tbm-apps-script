const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const STATUS_MARKER = '<!-- pipeline-review-fixer -->';
const LABEL_FIX_NEEDED = 'pipeline:fix-needed';
const USER_AGENT = 'tbm-pipeline-review-fixer';
const RESULT_PATH = process.env.RUNNER_TEMP
  ? path.join(process.env.RUNNER_TEMP, 'review-fixer-result.json')
  : path.join(process.cwd(), '.github', 'review-fixer-result.json');

function env(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, name + '=' + String(value) + '\n', 'utf8');
}

function git(cmd) {
  return cp.execSync('git ' + cmd, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

function changedFiles() {
  const text = git('status --short');
  if (!text) return [];
  return text.split(/\r?\n/).map(function(line) {
    return line.slice(3).trim();
  }).filter(Boolean);
}

function replace(filePath, before, after) {
  if (!fs.existsSync(filePath)) return false;
  const current = fs.readFileSync(filePath, 'utf8');
  if (current.indexOf(after) !== -1 || current.indexOf(before) === -1) return false;
  fs.writeFileSync(filePath, current.replace(before, after), 'utf8');
  return true;
}

function replaceRegex(filePath, pattern, replacement) {
  if (!fs.existsSync(filePath)) return false;
  const current = fs.readFileSync(filePath, 'utf8');
  if (!pattern.test(current)) return false;
  const updated = current.replace(pattern, replacement);
  if (updated === current) return false;
  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
}

function applyErrorLogFix(root) {
  return replace(
    path.join(root, 'Code.js'),
    "    var errorSheet = SpreadsheetApp.openById(SSID).getSheetByName(TAB_MAP['ErrorLog'] || 'ErrorLog');\n",
    "    var errorSS = SpreadsheetApp.openById(SSID);\n    var errorSheet = errorSS.getSheetByName(TAB_MAP['ErrorLog'] || '\\uD83D\\uDCBB ErrorLog') || errorSS.getSheetByName('ErrorLog');\n"
  );
}

function applyTillerHoursFix(root) {
  return replaceRegex(
    path.join(root, 'Code.js'),
    /health\.tillerFreshness = \{ thresholdHours: tillerThreshold \};[\s\S]*?health\.tillerFreshness\.status = health\.tillerSync\.staleAccounts\.length === 0 \? 'green' : 'yellow';\n    }\n  } catch\(e5\) \{\}/,
    "health.tillerFreshness = { thresholdHours: tillerThreshold, status: 'unknown', staleAccounts: [] };\n    var txnSheet = SpreadsheetApp.openById(SSID).getSheetByName('Transactions');\n    if (txnSheet) {\n      var txnData = txnSheet.getDataRange().getValues();\n      var headers = txnData.length ? txnData[0] : [];\n      var dateCol = -1;\n      var acctCol = -1;\n      for (var th = 0; th < headers.length; th++) {\n        var hdr = String(headers[th]).toLowerCase().trim();\n        if (hdr === 'date') dateCol = th;\n        if (hdr === 'account') acctCol = th;\n      }\n      if (dateCol !== -1 && acctCol !== -1) {\n        var accountDates = {};\n        for (var tr = 1; tr < txnData.length; tr++) {\n          var acct = String(txnData[tr][acctCol]).trim();\n          var txnDate = txnData[tr][dateCol];\n          if (!acct || !(txnDate instanceof Date)) continue;\n          if (!accountDates[acct] || txnDate > accountDates[acct]) accountDates[acct] = txnDate;\n        }\n        var accounts = Object.keys(accountDates);\n        var stale = [];\n        for (var ta = 0; ta < accounts.length; ta++) {\n          var ageHours = Math.floor((now.getTime() - accountDates[accounts[ta]].getTime()) / (1000 * 60 * 60));\n          if (ageHours > tillerThreshold) stale.push({ name: accounts[ta], ageHours: ageHours });\n        }\n        health.tillerFreshness.staleAccounts = stale;\n        health.tillerFreshness.staleCount = stale.length;\n        health.tillerFreshness.totalAccounts = accounts.length;\n        health.tillerFreshness.status = stale.length === 0 ? 'green' : 'yellow';\n        if (stale.length > 0 && health.overall === 'GREEN') health.overall = 'WATCH';\n      }\n    } else if (health.tillerSync && health.tillerSync.staleAccounts) {\n      health.tillerFreshness.staleAccounts = health.tillerSync.staleAccounts;\n      health.tillerFreshness.staleCount = health.tillerSync.staleAccounts.length;\n      health.tillerFreshness.status = health.tillerSync.staleAccounts.length === 0 ? 'green' : 'yellow';\n    }\n  } catch(e5) {\n    health.tillerFreshness = { status: 'error', error: e5.message, thresholdHours: tillerThreshold };\n  }"
  );
}

function applySoulTickerFix(root) {
  return replace(
    path.join(root, 'TheSoul.html'),
    "    var first = _tickerQueue[0];\n    if (first) showTickerMessage(first.text, first.cls);\n",
    "    if (Date.now() >= _tickerSpecialUntil) {\n      var first = _tickerQueue[0];\n      if (first) showTickerMessage(first.text, first.cls);\n    }\n"
  );
}

const RULES = {
  tbm_ops_errorlog_tab: { needsDeploy: true, apply: applyErrorLogFix },
  tbm_ops_tiller_hours: { needsDeploy: true, apply: applyTillerHoursFix },
  tbm_soul_ticker_special: { needsDeploy: true, apply: applySoulTickerFix }
};

// ── Structured report consumption ───────────────────────────────────
// Extract the machine-readable JSON from the codex-pr-review comment.
// The JSON sits between <!-- codex-review-report --> markers inside a
// fenced code block in the comment body.

function extractStructuredReport(commentBody) {
  if (!commentBody) return null;
  var startMarker = '<!-- codex-review-report -->';
  var endMarker = '<!-- /codex-review-report -->';
  var startIdx = commentBody.indexOf(startMarker);
  var endIdx = commentBody.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;

  var block = commentBody.substring(startIdx + startMarker.length, endIdx);
  // Strip markdown fenced code block markers
  var jsonStart = block.indexOf('{');
  var jsonEnd = block.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) return null;

  try {
    return JSON.parse(block.substring(jsonStart, jsonEnd + 1));
  } catch (e) {
    return null;
  }
}

// Classify a structured finding into a fixer rule ID if one matches.
// Returns '' for findings that need human judgment or have no mechanical fix.
//
// Phase 1 (ORK-03 #110): This intentionally returns '' for all findings.
// The fixer reads and reports structured findings but does not attempt
// automated fixes beyond the 3 hardcoded rules above. Phase 2 will add
// mechanical mappings here (ES6->ES5, missing withFailureHandler, etc.)
// so the end-to-end loop has a proven auto-fix path.
function classifyFinding(finding) {
  if (!finding || finding.requires_human_decision) return '';
  // Phase 2: map finding types to mechanical rule IDs here.
  // Example: if (finding.rule === 'P1.4' && finding.type === 'ui') return 'es6_to_es5';
  return '';
}

function classify(repository, thread) {
  const comments = thread.comments && thread.comments.nodes ? thread.comments.nodes : [];
  const latest = comments.length ? comments[comments.length - 1] : null;
  const body = String(latest && latest.body || '').toLowerCase();
  const filePath = thread.path || '';
  if (repository !== 'blucsigma05/tbm-apps-script') return '';
  if (filePath === 'Code.js' && body.indexOf('errorlog tab') !== -1) return 'tbm_ops_errorlog_tab';
  if (filePath === 'Code.js' && body.indexOf('tiller_stale_hours') !== -1) return 'tbm_ops_tiller_hours';
  if (filePath === 'TheSoul.html' && (body.indexOf('both kids cleared') !== -1 || body.indexOf('ticker') !== -1)) return 'tbm_soul_ticker_special';
  return '';
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error((options && options.method || 'GET') + ' ' + url + ' failed: ' + response.status + ' ' + text);
  }
  return text ? JSON.parse(text) : null;
}

async function graphql(query, variables, headers) {
  const payload = await requestJson('https://api.github.com/graphql', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ query: query, variables: variables })
  });
  if (payload.errors) throw new Error(JSON.stringify(payload.errors));
  return payload.data;
}

async function upsertComment(owner, repo, prNumber, headers, body) {
  const comments = await requestJson(
    'https://api.github.com/repos/' + owner + '/' + repo + '/issues/' + prNumber + '/comments?per_page=100',
    { headers: headers }
  );
  const existing = comments.find(function(comment) {
    return String(comment.body || '').indexOf(STATUS_MARKER) !== -1;
  });
  if (existing) {
    await requestJson(
      'https://api.github.com/repos/' + owner + '/' + repo + '/issues/comments/' + existing.id,
      { method: 'PATCH', headers: headers, body: JSON.stringify({ body: body }) }
    );
    return;
  }
  await requestJson(
    'https://api.github.com/repos/' + owner + '/' + repo + '/issues/' + prNumber + '/comments',
    { method: 'POST', headers: headers, body: JSON.stringify({ body: body }) }
  );
}

async function replyToReviewComment(owner, repo, prNumber, commentId, headers, body) {
  if (!commentId) return;
  await requestJson(
    'https://api.github.com/repos/' + owner + '/' + repo + '/pulls/' + prNumber + '/comments/' + commentId + '/replies',
    { method: 'POST', headers: headers, body: JSON.stringify({ body: body }) }
  );
}

async function resolveThread(threadId, headers) {
  await graphql(
    'mutation($threadId: ID!) { resolveReviewThread(input: { threadId: $threadId }) { thread { id isResolved } } }',
    { threadId: threadId },
    headers
  );
}

async function postRelay(payload) {
  const relayUrl = env('PIPELINE_RELAY_URL', '');
  const relaySecret = env('PIPELINE_SECRET', '');
  if (!relayUrl || !relaySecret) return;
  await fetch(relayUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fn: 'pipelineRelaySafe',
      args: [{
        secret: relaySecret,
        repo: payload.repo,
        type: payload.type,
        summary: payload.summary,
        prNumber: payload.prNumber,
        prUrl: payload.prUrl,
        sha: payload.sha,
        runUrl: payload.runUrl,
        cycle: payload.cycle
      }]
    })
  });
}

function renderBody(result) {
  var changed = result.changedFiles.length ? result.changedFiles.map(function(file) {
    return '- ' + file;
  }) : ['- none'];
  var unsupported = result.unsupported.length ? result.unsupported.map(function(item) {
    return '- ' + item.path + ': ' + item.summary;
  }) : ['- none'];
  var lines = [
    STATUS_MARKER,
    '## Pipeline Fixer',
    '',
    '- Result: ' + result.status.toUpperCase(),
    '- Cycle: ' + String(result.nextCycle) + '/3',
    '- Supported mechanical threads: ' + String(result.supported.length),
    '- Unsupported threads: ' + String(result.unsupported.length),
    '- Structured report: ' + (result.hasStructuredReport ? 'yes' : 'no'),
    '- Needs deploy: ' + (result.needsDeploy ? 'yes' : 'no'),
    '',
    '### Files changed',
    changed.join('\n'),
    '',
    '### Still needs judgment',
    unsupported.join('\n')
  ];

  // Include structured report summary if available
  if (result.reportFindings && result.reportFindings.length > 0) {
    lines.push('');
    lines.push('### Codex structured findings');
    for (var ri = 0; ri < result.reportFindings.length; ri++) {
      var rf = result.reportFindings[ri];
      var sev = rf.severity || 'unknown';
      var autofix = rf.requires_human_decision ? 'needs-human' : 'auto-fixable';
      lines.push('- [' + sev.toUpperCase() + '] ' + (rf.title || 'No title') + ' — `' + (rf.file || '?') + '` (' + autofix + ')');
    }
  }

  lines.push('');
  lines.push('Updated: ' + new Date().toISOString());
  return lines.join('\n');
}

async function prepare() {
  const token = env('GITHUB_TOKEN', '');
  const repository = env('GITHUB_REPOSITORY', '');
  const event = readJson(process.env.GITHUB_EVENT_PATH);
  const headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': USER_AGENT
  };
  let prNumber = parseInt(env('TARGET_PR', ''), 10);
  if (isNaN(prNumber) && event.pull_request && event.pull_request.number) prNumber = event.pull_request.number;
  if (isNaN(prNumber)) {
    writeJson(RESULT_PATH, { status: 'noop', changedFiles: [], supported: [], unsupported: [], nextCycle: 0, needsDeploy: false });
    setOutput('status', 'noop');
    setOutput('should_push', 'false');
    return;
  }

  const parts = repository.split('/');
  const owner = parts[0];
  const repo = parts[1];
  const query = `
    query($owner: String!, $repo: String!, $number: Int!, $after: String) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          number
          url
          headRefName
          headRefOid
          labels(first: 100) { nodes { name } }
          reviewThreads(first: 100, after: $after) {
            nodes {
              id
              path
              isResolved
              isOutdated
              comments(first: 20) { nodes { databaseId body } }
            }
            pageInfo { hasNextPage endCursor }
          }
        }
      }
    }
  `;

  let pr = null;
  let after = null;
  const threads = [];
  do {
    const data = await graphql(query, { owner: owner, repo: repo, number: prNumber, after: after }, headers);
    pr = data.repository.pullRequest;
    for (const thread of pr.reviewThreads.nodes) threads.push(thread);
    after = pr.reviewThreads.pageInfo.hasNextPage ? pr.reviewThreads.pageInfo.endCursor : null;
  } while (after);

  const labels = (pr.labels && pr.labels.nodes ? pr.labels.nodes : []).map(function(label) { return label.name; });
  if (labels.indexOf(LABEL_FIX_NEEDED) === -1) {
    writeJson(RESULT_PATH, { status: 'noop', repo: repository, prNumber: prNumber, prUrl: pr.url, headRefName: pr.headRefName, changedFiles: [], supported: [], unsupported: [], nextCycle: 0, needsDeploy: false });
    setOutput('status', 'noop');
    setOutput('should_push', 'false');
    setOutput('head_ref', pr.headRefName);
    return;
  }

  const commits = await requestJson(
    'https://api.github.com/repos/' + owner + '/' + repo + '/pulls/' + prNumber + '/commits?per_page=100',
    { headers: headers }
  );
  let maxCycle = 0;
  for (const commit of commits) {
    const matches = String(commit.commit && commit.commit.message || '').match(/\[review-fix-(\d+)\]/ig) || [];
    for (const match of matches) {
      const value = parseInt(match.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(value) && value > maxCycle) maxCycle = value;
    }
  }
  const nextCycle = maxCycle + 1;

  var actionable = threads.filter(function(thread) {
    return !thread.isResolved && !thread.isOutdated;
  }).map(function(thread) {
    var threadComments = thread.comments && thread.comments.nodes ? thread.comments.nodes : [];
    var latest = threadComments.length ? threadComments[threadComments.length - 1] : null;
    return {
      threadId: thread.id,
      commentId: latest ? latest.databaseId : null,
      path: thread.path || '',
      summary: latest ? String(latest.body || '').split('\n')[0].replace(/\*\*/g, '').trim() : 'Review thread',
      ruleId: classify(repository, thread)
    };
  });
  var supported = actionable.filter(function(item) { return !!item.ruleId; });
  var unsupported = actionable.filter(function(item) { return !item.ruleId; });

  // ── Read structured report from codex-pr-review comment ───────────
  // This enriches the fixer's understanding of what needs fixing beyond
  // just review thread text matching.
  var structuredReport = null;
  var issueComments = await requestJson(
    'https://api.github.com/repos/' + owner + '/' + repo + '/issues/' + prNumber + '/comments?per_page=100',
    { headers: headers }
  );
  if (Array.isArray(issueComments)) {
    var codexComment = issueComments.find(function(c) {
      return String(c.body || '').indexOf('<!-- codex-pr-review -->') !== -1;
    });
    if (codexComment) {
      structuredReport = extractStructuredReport(codexComment.body);
    }
  }

  // If we have a structured report, add its auto-fixable findings to
  // the unsupported list for reporting (Phase 2 will attempt fixes).
  var reportFindings = [];
  if (structuredReport && Array.isArray(structuredReport.findings)) {
    reportFindings = structuredReport.findings;
    for (var fi = 0; fi < reportFindings.length; fi++) {
      var finding = reportFindings[fi];
      // Check if this finding maps to a mechanical rule
      var fRuleId = classifyFinding(finding);
      if (fRuleId && !supported.some(function(s) { return s.ruleId === fRuleId; })) {
        supported.push({
          threadId: '',
          commentId: null,
          path: finding.file || '',
          summary: '[' + (finding.severity || 'unknown') + '] ' + (finding.title || 'Structured finding'),
          ruleId: fRuleId
        });
      }
    }
  }

  var base = {
    repo: repository,
    prNumber: prNumber,
    prUrl: pr.url,
    headRefName: pr.headRefName,
    headSha: pr.headRefOid,
    nextCycle: nextCycle,
    supported: supported,
    unsupported: unsupported,
    changedFiles: [],
    needsDeploy: false,
    hasStructuredReport: !!structuredReport,
    reportFindings: reportFindings
  };

  if (nextCycle >= 4) {
    writeJson(RESULT_PATH, Object.assign({}, base, { status: 'stopped' }));
    setOutput('status', 'stopped');
    setOutput('should_push', 'false');
    setOutput('next_cycle', String(nextCycle));
    setOutput('head_ref', pr.headRefName);
    return;
  }

  let needsDeploy = false;
  const applied = {};
  for (const item of supported) {
    if (applied[item.ruleId]) continue;
    const rule = RULES[item.ruleId];
    if (!rule) continue;
    rule.apply(process.cwd());
    applied[item.ruleId] = true;
    needsDeploy = needsDeploy || !!rule.needsDeploy;
  }

  const files = changedFiles();
  writeJson(RESULT_PATH, Object.assign({}, base, {
    status: files.length ? 'applied' : 'noop',
    changedFiles: files,
    needsDeploy: needsDeploy
  }));
  setOutput('status', files.length ? 'applied' : 'noop');
  setOutput('should_push', files.length ? 'true' : 'false');
  setOutput('next_cycle', String(nextCycle));
  setOutput('needs_deploy', needsDeploy ? 'true' : 'false');
  setOutput('head_ref', pr.headRefName);
}

async function finalize() {
  const token = env('GITHUB_TOKEN', '');
  const repository = env('GITHUB_REPOSITORY', '');
  const parts = repository.split('/');
  const headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': USER_AGENT
  };
  const result = readJson(RESULT_PATH);
  if (!result.prNumber) return;

  await upsertComment(parts[0], parts[1], result.prNumber, headers, renderBody(result));
  if (result.status === 'applied') {
    const reply = 'Addressed automatically in [review-fix-' + result.nextCycle + ']. Updated files: ' + (result.changedFiles.length ? result.changedFiles.join(', ') : 'none') + '.';
    for (const item of result.supported) {
      await replyToReviewComment(parts[0], parts[1], result.prNumber, item.commentId, headers, reply);
      await resolveThread(item.threadId, headers);
    }
    await postRelay({
      repo: result.repo,
      type: 'fix_pushed',
      summary: 'PR #' + result.prNumber + ' review fixes pushed in cycle ' + result.nextCycle + '.',
      prNumber: result.prNumber,
      prUrl: result.prUrl,
      sha: env('GITHUB_SHA', result.headSha || ''),
      runUrl: env('GITHUB_SERVER_URL', '') + '/' + repository + '/actions/runs/' + env('GITHUB_RUN_ID', ''),
      cycle: result.nextCycle
    });
  }
  if (result.status === 'stopped') {
    await postRelay({
      repo: result.repo,
      type: 'pipeline_stalled',
      summary: 'PR #' + result.prNumber + ' hit review-fix cycle ' + result.nextCycle + ' and requires manual intervention.',
      prNumber: result.prNumber,
      prUrl: result.prUrl,
      sha: result.headSha || '',
      runUrl: env('GITHUB_SERVER_URL', '') + '/' + repository + '/actions/runs/' + env('GITHUB_RUN_ID', ''),
      cycle: result.nextCycle
    });
  }
}

async function main() {
  if (process.argv.indexOf('--finalize') !== -1) return finalize();
  return prepare();
}

main().catch(function(error) {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
