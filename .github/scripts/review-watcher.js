const fs = require('fs');

const MARKER = '<!-- pipeline-review-summary -->';
const ACTION_MARKER = '<!-- pipeline-action: ';
const USER_AGENT = 'tbm-pipeline-review-watcher';
const PIPELINE_LABEL_PREFIX = 'pipeline:';
const MAX_FIX_CYCLES = 3;
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

function isCodexSignal(login, body) {
  const actor = String(login || '').toLowerCase();
  const text = String(body || '').toLowerCase();
  return actor.indexOf('codex') !== -1 ||
    actor.indexOf('openai') !== -1 ||
    text.indexOf('codex') !== -1;
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

  const threadQuery = `
    query($owner: String!, $repo: String!, $number: Int!, $after: String) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          number
          url
          isDraft
          reviewDecision
          headRefOid
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

  const ciState = formatWorkflowState(latestRunByName(ciWorkflowName));
  const codexState = buildActorReviewState(reviews, isCodexSignal, pr.headRefOid, parseExplicitOutcome);
  const approvalState = pr.reviewDecision || 'REVIEW_REQUIRED';
  const fixCapReached = fixCycle >= MAX_FIX_CYCLES;
  const fixRequired = approvalState === 'CHANGES_REQUESTED' ||
    ciState.failed ||
    codexState.failed ||
    unresolvedThreads > 0;
  const readyToMerge = ciState.pass &&
    codexState.pass &&
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

  const body = [
    MARKER,
    '<!-- pipeline-action: ' + action + ' -->',
    '## Pipeline Review Summary',
    '',
    '- CI: ' + renderState(ciState),
    '- Codex review: ' + renderState(codexState),
    '- Unresolved actionable threads: ' + String(unresolvedThreads),
    '- Approval state: ' + approvalState,
    '- Fix cycle: ' + String(fixCycle) + '/' + String(MAX_FIX_CYCLES),
    '- Action: ' + action,
    '',
    'Last updated: ' + new Date().toISOString()
  ].join('\n');

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
    let relayType = 'fix_needed';
    let relaySummary = 'PR #' + prNumber + ' needs fixes.';

    if (action === 'READY_TO_MERGE') {
      relayType = 'review_ready';
      relaySummary = 'PR #' + prNumber + ' reviews complete. Ready to merge.';
    } else if (action === 'STOPPED') {
      relayType = 'pipeline_stalled';
      relaySummary = 'PR #' + prNumber + ' stalled after review-fix-' + String(fixCycle) + ' hit the cycle cap.';
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
  }

  console.log('Updated pipeline summary for PR #' + prNumber + ' with action ' + action + '.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
