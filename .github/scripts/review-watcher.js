const fs = require('fs');

const MARKER = '<!-- pipeline-review-summary -->';
const ACTION_MARKER = '<!-- pipeline-action: ';
const USER_AGENT = 'tbm-pipeline-review-watcher';
const PIPELINE_LABEL_PREFIX = 'pipeline:';
const MAX_FIX_CYCLES = 3;

// Playwright workflow paths-ignore patterns (#464). MUST stay in sync with
// .github/workflows/playwright-regression.yml. If all of a PR's changed
// files match at least one pattern, the Playwright workflow is skipped by
// design and no run record exists. Without this, the watcher would treat
// the missing run as WAITING and the PR would never reach READY_TO_MERGE.
const PLAYWRIGHT_PATHS_IGNORE = [
  '**/*.md',
  'ops/**',
  'specs/**',
  '.github/ISSUE_TEMPLATE/**',
];

function fileMatchesPattern(file, pattern) {
  if (!file || !pattern) return false;
  if (pattern === '**/*.md') return file.endsWith('.md');
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return file.startsWith(prefix + '/');
  }
  return file === pattern;
}

function allFilesMatchIgnore(files, patterns) {
  if (!files || files.length === 0) return false;
  for (const file of files) {
    var matched = false;
    for (var i = 0; i < patterns.length; i++) {
      if (fileMatchesPattern(file, patterns[i])) { matched = true; break; }
    }
    if (!matched) return false;
  }
  return true;
}
const PIPELINE_LABELS = {
  WAITING: {
    name: 'pipeline:waiting',
    color: 'fbca04',
    description: 'Pipeline is waiting on checks or approval.'
  },
  FIX_NEEDED: {
    name: 'pipeline:fix-needed',
    color: 'd93f0b',
    description: 'Pipeline needs changes before merge.'
  },
  READY_TO_MERGE: {
    name: 'pipeline:ready',
    color: '0e8a16',
    description: 'Pipeline checks are green and ready to merge.'
  },
  STOPPED: {
    name: 'pipeline:stalled',
    color: '5319e7',
    description: 'Pipeline stopped after hitting the review-fix cycle cap.'
  }
};

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function getEnv(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function formatWorkflowState(run) {
  if (!run) {
    return { label: 'WAITING', pass: false, failed: false, url: '' };
  }
  if (run.status !== 'completed') {
    return { label: 'RUNNING', pass: false, failed: false, url: run.html_url || '' };
  }
  if (run.conclusion === 'success') {
    return { label: 'PASS', pass: true, failed: false, url: run.html_url || '' };
  }
  const label = String(run.conclusion || run.status || 'UNKNOWN').toUpperCase();
  return { label: label, pass: false, failed: true, url: run.html_url || '' };
}

function renderState(state) {
  if (!state.url) return state.label;
  return state.label + ' ([run](' + state.url + '))';
}

function parsePreviousAction(body) {
  if (!body) return '';
  const start = body.indexOf(ACTION_MARKER);
  if (start === -1) return '';
  const valueStart = start + ACTION_MARKER.length;
  const valueEnd = body.indexOf(' -->', valueStart);
  if (valueEnd === -1) return '';
  return body.substring(valueStart, valueEnd).trim();
}

// ── Aggregate summary for terminal states ──────────────────────────
// Parse all pipeline-review-fixer comments to collect fix history
// across cycles. Returns an array of cycle records.

var FIXER_MARKER = '<!-- pipeline-review-fixer -->';

function parseFixerComments(issueComments) {
  var cycles = [];
  for (var i = 0; i < issueComments.length; i++) {
    var body = String(issueComments[i].body || '');
    if (body.indexOf(FIXER_MARKER) === -1) continue;

    var cycle = { cycle: 0, result: '', supported: 0, unsupported: 0, files: [] };

    // Parse Result line
    var resultMatch = body.match(/- Result:\s*(\S+)/i);
    if (resultMatch) cycle.result = resultMatch[1].toUpperCase();

    // Parse Cycle line (e.g. "- Cycle: 2/3")
    var cycleMatch = body.match(/- Cycle:\s*(\d+)/);
    if (cycleMatch) cycle.cycle = parseInt(cycleMatch[1], 10);

    // Parse Supported mechanical threads count
    var supportedMatch = body.match(/- Supported mechanical threads:\s*(\d+)/i);
    if (supportedMatch) cycle.supported = parseInt(supportedMatch[1], 10);

    // Parse Unsupported threads count
    var unsupportedMatch = body.match(/- Unsupported threads:\s*(\d+)/i);
    if (unsupportedMatch) cycle.unsupported = parseInt(unsupportedMatch[1], 10);

    // Parse Files changed section
    var filesSection = body.indexOf('### Files changed');
    var filesEnd = body.indexOf('###', filesSection + 1);
    if (filesSection !== -1) {
      var filesBlock = filesEnd !== -1
        ? body.substring(filesSection, filesEnd)
        : body.substring(filesSection);
      var fileLines = filesBlock.split('\n');
      for (var f = 0; f < fileLines.length; f++) {
        var fileLine = fileLines[f].trim();
        if (fileLine.indexOf('- ') === 0 && fileLine !== '- none') {
          cycle.files.push(fileLine.substring(2).trim());
        }
      }
    }

    cycles.push(cycle);
  }
  return cycles;
}

function buildAggregateSummary(cycles) {
  var totalSupported = 0;
  var totalUnsupported = 0;
  var allFiles = {};
  var appliedCycles = 0;

  for (var i = 0; i < cycles.length; i++) {
    var c = cycles[i];
    totalSupported += c.supported;
    totalUnsupported += c.unsupported;
    if (c.result === 'APPLIED') appliedCycles++;
    for (var f = 0; f < c.files.length; f++) {
      allFiles[c.files[f]] = true;
    }
  }

  var fileList = Object.keys(allFiles);
  return {
    totalCycles: cycles.length,
    appliedCycles: appliedCycles,
    totalSupported: totalSupported,
    totalUnsupported: totalUnsupported,
    allFiles: fileList,
    cycles: cycles
  };
}

function renderAggregateSummarySection(aggregate) {
  var lines = [
    '',
    '### Aggregate Summary',
    '',
    '- Total fix cycles: ' + String(aggregate.totalCycles),
    '- Cycles with changes: ' + String(aggregate.appliedCycles),
    '- Total auto-fixes applied: ' + String(aggregate.totalSupported),
    '- Total manual (unsupported): ' + String(aggregate.totalUnsupported),
    '- Files touched: ' + (aggregate.allFiles.length ? aggregate.allFiles.join(', ') : 'none')
  ];

  if (aggregate.cycles.length > 0) {
    lines.push('');
    lines.push('**Cycle-by-cycle breakdown:**');
    for (var i = 0; i < aggregate.cycles.length; i++) {
      var c = aggregate.cycles[i];
      lines.push('- Cycle ' + String(c.cycle) + ': ' + c.result +
        ' (auto: ' + String(c.supported) +
        ', manual: ' + String(c.unsupported) +
        ', files: ' + (c.files.length ? c.files.join(', ') : 'none') + ')');
    }
  }

  return lines;
}

function isCodexSignal(login, body) {
  const actor = String(login || '').toLowerCase();
  const text = String(body || '').toLowerCase();
  return actor.indexOf('codex') !== -1 ||
    actor.indexOf('openai') !== -1 ||
    text.indexOf('codex') !== -1;
}

// Extract the automated Codex review verdict from the issue comment.
// The codex-pr-review workflow posts an issue comment (not a PR review),
// so buildActorReviewState() on PR reviews will not find it. This function
// reads the structured JSON report embedded in the comment.
function getAutomatedCodexVerdict(issueComments) {
  var codexComment = null;
  for (var i = 0; i < issueComments.length; i++) {
    var body = String(issueComments[i].body || '');
    if (body.indexOf('<!-- codex-pr-review -->') !== -1) {
      codexComment = issueComments[i];
      break;
    }
  }
  if (!codexComment) return null;

  var commentBody = codexComment.body;
  var startMarker = '<!-- codex-review-report -->';
  var endMarker = '<!-- /codex-review-report -->';
  var startIdx = commentBody.indexOf(startMarker);
  var endIdx = commentBody.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;

  var block = commentBody.substring(startIdx + startMarker.length, endIdx);
  var jsonStart = block.indexOf('{');
  var jsonEnd = block.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) return null;

  try {
    var report = JSON.parse(block.substring(jsonStart, jsonEnd + 1));
    return {
      verdict: String(report.verdict || '').toUpperCase(),
      url: codexComment.html_url || ''
    };
  } catch (e) {
    return null;
  }
}

function matchesSha(expectedSha, candidateSha) {
  const expected = String(expectedSha || '').toLowerCase();
  const candidate = String(candidateSha || '').toLowerCase();
  if (!expected || !candidate) return false;
  return expected === candidate ||
    expected.indexOf(candidate) === 0 ||
    candidate.indexOf(expected) === 0;
}

function parseExplicitOutcome(body) {
  const text = String(body || '').toLowerCase();
  if (text.indexOf('codex fail') !== -1) return 'FAIL';
  if (text.indexOf('codex pass') !== -1) return 'PASS';
  return '';
}

function buildActorReviewState(reviews, matcher, headSha, explicitOutcomeParser) {
  const actorReviews = reviews
    .filter((review) => matcher(review.user && review.user.login, review.body))
    .sort((a, b) => Date.parse(b.submitted_at || 0) - Date.parse(a.submitted_at || 0));

  if (!actorReviews.length) {
    return { label: 'WAITING', pass: false, failed: false, url: '' };
  }

  const currentReview = actorReviews.find((review) => matchesSha(headSha, review.commit_id));
  if (!currentReview) {
    return {
      label: 'STALE',
      pass: false,
      failed: false,
      url: actorReviews[0].html_url || ''
    };
  }

  const explicitOutcome = explicitOutcomeParser ? explicitOutcomeParser(currentReview.body) : '';
  if (explicitOutcome === 'PASS') {
    return { label: 'PASS', pass: true, failed: false, url: currentReview.html_url || '' };
  }
  if (explicitOutcome === 'FAIL') {
    return { label: 'FAIL', pass: false, failed: true, url: currentReview.html_url || '' };
  }

  const reviewState = String(currentReview.state || '').toUpperCase();
  if (reviewState === 'APPROVED') {
    return { label: 'PASS', pass: true, failed: false, url: currentReview.html_url || '' };
  }
  if (reviewState === 'CHANGES_REQUESTED') {
    return { label: 'FAIL', pass: false, failed: true, url: currentReview.html_url || '' };
  }
  if (reviewState === 'COMMENTED') {
    return { label: 'COMMENTED', pass: false, failed: false, url: currentReview.html_url || '' };
  }
  return {
    label: reviewState || 'CURRENT',
    pass: false,
    failed: false,
    url: currentReview.html_url || ''
  };
}

function listLinkHeader(nextUrl) {
  return nextUrl ? nextUrl : '';
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (response.status === 204) return null;
  const text = await response.text();
  if (!response.ok) {
    throw new Error((options.method || 'GET') + ' ' + url + ' failed: ' + response.status + ' ' + text);
  }
  return text ? JSON.parse(text) : null;
}

async function pagedGetJson(url, headers) {
  const items = [];
  let nextUrl = url;
  while (nextUrl) {
    const response = await fetch(nextUrl, { headers: headers });
    const text = await response.text();
    if (!response.ok) {
      throw new Error('GET ' + nextUrl + ' failed: ' + response.status + ' ' + text);
    }
    const pageItems = text ? JSON.parse(text) : [];
    if (Array.isArray(pageItems)) {
      for (const item of pageItems) items.push(item);
    }
    const link = response.headers.get('link') || '';
    const match = link.match(/<([^>]+)>;\s*rel="next"/);
    nextUrl = listLinkHeader(match ? match[1] : '');
  }
  return items;
}

async function graphqlRequest(query, variables, headers) {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ query: query, variables: variables })
  });
  const payload = await response.json();
  if (!response.ok || payload.errors) {
    throw new Error('GraphQL request failed: ' + JSON.stringify(payload.errors || payload));
  }
  return payload.data;
}

async function ensurePipelineLabels(owner, repo, headers) {
  const labelNames = Object.keys(PIPELINE_LABELS);
  for (const labelName of labelNames) {
    const label = PIPELINE_LABELS[labelName];
    const response = await fetch(
      'https://api.github.com/repos/' + owner + '/' + repo + '/labels',
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          name: label.name,
          color: label.color,
          description: label.description
        })
      }
    );
    if (response.status === 201 || response.status === 422) {
      continue;
    }
    const text = await response.text();
    throw new Error('Unable to ensure label ' + label.name + ': ' + response.status + ' ' + text);
  }
}

async function syncPipelineLabels(owner, repo, prNumber, action, headers) {
  const desiredLabel = PIPELINE_LABELS[action] ? PIPELINE_LABELS[action].name : PIPELINE_LABELS.WAITING.name;
  await ensurePipelineLabels(owner, repo, headers);

  const existingLabels = await pagedGetJson(
    'https://api.github.com/repos/' + owner + '/' + repo + '/issues/' + prNumber + '/labels?per_page=100',
    headers
  );
  const nextLabels = existingLabels
    .map((label) => label.name)
    .filter((name) => name.indexOf(PIPELINE_LABEL_PREFIX) !== 0);

  if (nextLabels.indexOf(desiredLabel) === -1) {
    nextLabels.push(desiredLabel);
  }

  await requestJson(
    'https://api.github.com/repos/' + owner + '/' + repo + '/issues/' + prNumber + '/labels',
    {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify({ labels: nextLabels })
    }
  );
}

async function sendPushover(title, message, priority, prUrl) {
  var userKey = getEnv('PUSHOVER_USER_KEY', '');
  var appToken = getEnv('PUSHOVER_APP_TOKEN', '');
  if (!userKey || !appToken) {
    console.log('Pushover secrets not configured; skipping notification.');
    return;
  }

  var params = 'token=' + encodeURIComponent(appToken) +
    '&user=' + encodeURIComponent(userKey) +
    '&title=' + encodeURIComponent(title) +
    '&message=' + encodeURIComponent(message) +
    '&priority=' + String(priority);

  if (prUrl) {
    params += '&url=' + encodeURIComponent(prUrl) +
      '&url_title=' + encodeURIComponent('View PR');
  }

  try {
    var response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    var body = await response.text();
    console.log('Pushover response:', body);
  } catch (err) {
    console.log('Pushover send failed:', err.message || err);
  }
}

async function postRelay(payload) {
  const relayUrl = getEnv('PIPELINE_RELAY_URL', '');
  const relaySecret = getEnv('PIPELINE_SECRET', '');
  if (!relayUrl || !relaySecret) {
    console.log('Pipeline relay secrets not configured; skipping notification.');
    return;
  }

  const response = await fetch(relayUrl, {
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
  const body = await response.text();
  console.log('Relay response:', body);
}

async function main() {
  const token = getEnv('GITHUB_TOKEN', '');
  if (!token) throw new Error('GITHUB_TOKEN is required');

  const event = readJson(process.env.GITHUB_EVENT_PATH);
  const repository = getEnv('GITHUB_REPOSITORY', '');
  const repoParts = repository.split('/');
  const owner = repoParts[0];
  const repo = repoParts[1];
  const eventName = getEnv('GITHUB_EVENT_NAME', '');
  const ciWorkflowName = getEnv('CI_WORKFLOW_NAME', '');
  const headers = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': USER_AGENT
  };

  let prNumber = parseInt(getEnv('TARGET_PR', ''), 10);
  if (isNaN(prNumber) && event.pull_request && event.pull_request.number) {
    prNumber = event.pull_request.number;
  } else if (isNaN(prNumber) && event.workflow_run && event.workflow_run.pull_requests && event.workflow_run.pull_requests.length) {
    prNumber = event.workflow_run.pull_requests[0].number;
  }

  if (isNaN(prNumber) || !prNumber) {
    console.log('No pull request context on this event; exiting.');
    return;
  }

  // All non-draft PRs to main enter the pipeline automatically.
  // No manual label required — the watcher processes every PR.

  const threadQuery = `
    query($owner: String!, $repo: String!, $number: Int!, $after: String) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          number
          url
          isDraft
          reviewDecision
          headRefOid
          files(first: 100) {
            nodes { path }
            pageInfo { hasNextPage }
          }
          reviewThreads(first: 100, after: $after) {
            nodes {
              isResolved
              isOutdated
              comments(first: 20) {
                nodes {
                  body
                  author { login }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
  `;

  let pr = null;
  let after = null;
  const threads = [];

  do {
    const data = await graphqlRequest(threadQuery, {
      owner: owner,
      repo: repo,
      number: prNumber,
      after: after
    }, headers);
    pr = data.repository.pullRequest;
    const threadPage = pr.reviewThreads;
    for (const thread of threadPage.nodes) {
      threads.push(thread);
    }
    after = threadPage.pageInfo.hasNextPage ? threadPage.pageInfo.endCursor : null;
  } while (after);

  const issueComments = await pagedGetJson(
    'https://api.github.com/repos/' + owner + '/' + repo + '/issues/' + prNumber + '/comments?per_page=100',
    headers
  );
  const reviews = await pagedGetJson(
    'https://api.github.com/repos/' + owner + '/' + repo + '/pulls/' + prNumber + '/reviews?per_page=100',
    headers
  );
  const commits = await pagedGetJson(
    'https://api.github.com/repos/' + owner + '/' + repo + '/pulls/' + prNumber + '/commits?per_page=100',
    headers
  );
  const workflowRunsPayload = await requestJson(
    'https://api.github.com/repos/' + owner + '/' + repo + '/actions/runs?head_sha=' + encodeURIComponent(pr.headRefOid) + '&per_page=100',
    { headers: headers }
  );
  const workflowRuns = workflowRunsPayload && workflowRunsPayload.workflow_runs ? workflowRunsPayload.workflow_runs : [];

  let unresolvedThreads = 0;
  for (const thread of threads) {
    if (!thread.isResolved && !thread.isOutdated) {
      unresolvedThreads += 1;
    }
  }

  let fixCycle = 0;
  for (const commit of commits) {
    const message = commit.commit && commit.commit.message ? commit.commit.message : '';
    const matches = message.match(/\[review-fix-(\d+)\]/ig) || [];
    for (const match of matches) {
      const cycle = parseInt(match.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(cycle) && cycle > fixCycle) fixCycle = cycle;
    }
  }

  function latestRunByName(name) {
    const candidates = workflowRuns
      .filter((run) => run.name === name)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    return candidates.length ? candidates[0] : null;
  }

  var ciState = formatWorkflowState(latestRunByName(ciWorkflowName));

  // Playwright E2E must also pass for READY_TO_MERGE
  var playwrightWorkflowName = getEnv('PLAYWRIGHT_WORKFLOW_NAME', '');
  var playwrightState;
  if (!playwrightWorkflowName) {
    playwrightState = { label: 'N/A', pass: true, failed: false, url: '' };
  } else {
    var playwrightRun = latestRunByName(playwrightWorkflowName);
    if (!playwrightRun) {
      // No run exists for this head SHA. Distinguish between (a) the
      // workflow was skipped by design via paths-ignore (#464) and (b)
      // the workflow simply has not started yet. Use the PR's changed
      // file list: if EVERY file matches a paths-ignore pattern AND the
      // file list is complete (not truncated at 100), treat as passing.
      // Otherwise fall through to WAITING. (#465/#477 P1 Codex finding.)
      var prFiles = (pr.files && pr.files.nodes)
        ? pr.files.nodes.map(function (n) { return n.path; })
        : [];
      var filesTruncated = !!(pr.files && pr.files.pageInfo
        && pr.files.pageInfo.hasNextPage);
      if (!filesTruncated
          && allFilesMatchIgnore(prFiles, PLAYWRIGHT_PATHS_IGNORE)) {
        playwrightState = {
          label: 'SKIPPED-PATH',
          pass: true,
          failed: false,
          url: ''
        };
      } else {
        playwrightState = formatWorkflowState(null);
      }
    } else {
      playwrightState = formatWorkflowState(playwrightRun);
    }
  }

  var codexState = buildActorReviewState(reviews, isCodexSignal, pr.headRefOid, parseExplicitOutcome);

  // The automated Codex review posts an issue comment, not a PR review.
  // If PR-review-based codex state is WAITING or STALE, check the issue
  // comment for the structured report verdict.
  if (codexState.label === 'WAITING' || codexState.label === 'STALE') {
    var autoCodex = getAutomatedCodexVerdict(issueComments);
    if (autoCodex) {
      if (autoCodex.verdict === 'PASS') {
        codexState = { label: 'PASS', pass: true, failed: false, url: autoCodex.url };
      } else if (autoCodex.verdict === 'FAIL') {
        codexState = { label: 'FAIL', pass: false, failed: true, url: autoCodex.url };
      } else if (autoCodex.verdict === 'INCONCLUSIVE') {
        codexState = { label: 'INCONCLUSIVE', pass: false, failed: false, url: autoCodex.url };
      }
    }
  }

  var approvalState = pr.reviewDecision || 'REVIEW_REQUIRED';
  var fixCapReached = fixCycle >= MAX_FIX_CYCLES;
  var fixRequired = approvalState === 'CHANGES_REQUESTED' ||
    ciState.failed ||
    codexState.failed ||
    playwrightState.failed ||
    unresolvedThreads > 0;
  var readyToMerge = ciState.pass &&
    codexState.pass &&
    (playwrightState.pass || !playwrightWorkflowName) &&
    approvalState !== 'CHANGES_REQUESTED' &&
    unresolvedThreads === 0;

  let action = 'WAITING';
  if (pr.isDraft) {
    action = 'WAITING';
  } else if (fixCapReached && fixRequired) {
    action = 'STOPPED';
  } else if (fixRequired) {
    action = 'FIX_NEEDED';
  } else if (readyToMerge) {
    action = 'READY_TO_MERGE';
  }

  // Build aggregate summary from fixer comments for terminal states
  var fixerCycles = parseFixerComments(issueComments);
  var aggregate = buildAggregateSummary(fixerCycles);

  var bodyLines = [
    MARKER,
    '<!-- pipeline-action: ' + action + ' -->',
    '## Pipeline Review Summary',
    '',
    '- CI: ' + renderState(ciState),
    '- Playwright: ' + renderState(playwrightState),
    '- Codex review: ' + renderState(codexState),
    '- Unresolved actionable threads: ' + String(unresolvedThreads),
    '- Approval state: ' + approvalState,
    '- Fix cycle: ' + String(fixCycle) + '/' + String(MAX_FIX_CYCLES),
    '- Action: ' + action
  ];

  if ((action === 'STOPPED' || action === 'READY_TO_MERGE') && aggregate.totalCycles > 0) {
    var aggregateLines = renderAggregateSummarySection(aggregate);
    for (var al = 0; al < aggregateLines.length; al++) {
      bodyLines.push(aggregateLines[al]);
    }
    if (action === 'STOPPED' && aggregate.totalUnsupported > 0) {
      bodyLines.push('');
      bodyLines.push('**Escalation needed:** ' + String(aggregate.totalUnsupported) +
        ' unresolved thread(s) require manual review.');
    }
  }

  bodyLines.push('');
  bodyLines.push('Last updated: ' + new Date().toISOString());

  const body = bodyLines.join('\n');

  const existingComment = issueComments.find((comment) => String(comment.body || '').indexOf(MARKER) !== -1);
  const previousAction = existingComment ? parsePreviousAction(existingComment.body) : '';

  await syncPipelineLabels(owner, repo, prNumber, action, headers);

  if (existingComment) {
    await requestJson(
      'https://api.github.com/repos/' + owner + '/' + repo + '/issues/comments/' + existingComment.id,
      {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ body: body })
      }
    );
  } else {
    await requestJson(
      'https://api.github.com/repos/' + owner + '/' + repo + '/issues/' + prNumber + '/comments',
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ body: body })
      }
    );
  }

  if (action !== previousAction && action !== 'WAITING') {
    var relayType = 'fix_needed';
    var relaySummary = 'PR #' + prNumber + ' needs fixes.';

    if (action === 'READY_TO_MERGE') {
      relayType = 'loop_complete';
      relaySummary = 'PR #' + prNumber + ' ready to merge. ' +
        String(aggregate.totalSupported) + ' total fixes applied across ' +
        String(aggregate.totalCycles) + ' cycle(s). All checks green.';
    } else if (action === 'STOPPED') {
      relayType = 'loop_complete';
      var filesStr = aggregate.allFiles.length
        ? aggregate.allFiles.join(', ')
        : 'none';
      relaySummary = 'PR #' + prNumber + ' stalled after ' +
        String(fixCycle) + ' fix cycle(s). Fixed: ' +
        String(aggregate.totalSupported) + ' threads auto. Remaining: ' +
        String(aggregate.totalUnsupported) + ' threads manual. Files touched: ' +
        filesStr + '.';
    } else if (ciState.failed) {
      relaySummary = 'PR #' + prNumber + ' needs fixes. CI is ' + ciState.label + '.';
    } else if (codexState.failed) {
      relaySummary = 'PR #' + prNumber + ' needs fixes. Codex review is ' + codexState.label + '.';
    } else if (unresolvedThreads > 0) {
      relaySummary = 'PR #' + prNumber + ' needs fixes. ' + String(unresolvedThreads) + ' unresolved review thread(s).';
    }

    await postRelay({
      repo: repository,
      type: relayType,
      summary: relaySummary,
      prNumber: prNumber,
      prUrl: pr.url,
      sha: pr.headRefOid,
      runUrl: process.env.GITHUB_SERVER_URL + '/' + repository + '/actions/runs/' + process.env.GITHUB_RUN_ID,
      cycle: fixCycle
    });

    // Pushover on terminal states only — no mid-loop noise
    var prHtmlUrl = 'https://github.com/' + repository + '/pull/' + prNumber;
    if (action === 'READY_TO_MERGE') {
      await sendPushover(
        'PR #' + prNumber + ' Ready',
        'CI: ' + ciState.label + ' | Codex: ' + codexState.label +
        ' | Threads: ' + unresolvedThreads +
        '\nAuto-fixed: ' + String(aggregate.totalSupported) +
        ' across ' + String(aggregate.totalCycles) + ' cycle(s).' +
        '\nReady for your review.',
        -1,
        prHtmlUrl
      );
    } else if (action === 'STOPPED') {
      await sendPushover(
        'PR #' + prNumber + ' Stalled',
        'Fix cycle ' + fixCycle + '/' + MAX_FIX_CYCLES + ' — cap reached.\n' +
        'Auto-fixed: ' + String(aggregate.totalSupported) +
        ' | Manual: ' + String(aggregate.totalUnsupported) +
        ' | Files: ' + (aggregate.allFiles.length ? aggregate.allFiles.join(', ') : 'none') +
        '\nNeeds manual intervention.',
        0,
        prHtmlUrl
      );
    }
  }

  console.log('Updated pipeline summary for PR #' + prNumber + ' with action ' + action + '.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
