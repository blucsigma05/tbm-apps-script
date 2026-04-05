#!/usr/bin/env node

function fail(message) {
  console.error(message);
  process.exit(1);
}

function stripCodeFence(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function extractJson(text) {
  const trimmed = stripCodeFence(text);
  if (!trimmed) return '';
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return trimmed;
  return trimmed.slice(start, end + 1);
}

function parsePayload(raw) {
  const candidate = extractJson(raw);
  try {
    return JSON.parse(candidate);
  } catch (error) {
    fail('Gemini response was not valid JSON: ' + error.message + '\nRaw response:\n' + raw);
  }
}

function normalizeEvent(event) {
  const value = String(event || '').trim().toUpperCase();
  if (value === 'APPROVE' || value === 'REQUEST_CHANGES') return value;
  fail('Gemini review event must be APPROVE or REQUEST_CHANGES, got: ' + value);
}

function normalizeBody(body) {
  const value = String(body || '').trim();
  if (!value) fail('Gemini review body was empty.');
  if (!value.startsWith('## Gemini Review Summary')) {
    fail('Gemini review body must start with "## Gemini Review Summary".');
  }
  if (!/Gemini/i.test(value)) {
    fail('Gemini review body must include the word "Gemini".');
  }
  return value;
}

function normalizeComments(comments) {
  if (comments == null) return [];
  if (!Array.isArray(comments)) fail('Gemini review comments must be an array.');

  return comments.map((comment, index) => {
    if (!comment || typeof comment !== 'object') {
      fail('Gemini review comment #' + (index + 1) + ' must be an object.');
    }

    const path = String(comment.path || '').trim();
    const body = String(comment.body || '').trim();
    const line = Number(comment.line);
    const side = String(comment.side || 'RIGHT').trim().toUpperCase();

    if (!path) fail('Gemini review comment #' + (index + 1) + ' is missing path.');
    if (!body) fail('Gemini review comment #' + (index + 1) + ' is missing body.');
    if (!Number.isInteger(line) || line < 1) {
      fail('Gemini review comment #' + (index + 1) + ' must use a positive integer line.');
    }
    if (side !== 'RIGHT' && side !== 'LEFT') {
      fail('Gemini review comment #' + (index + 1) + ' must use side RIGHT or LEFT.');
    }

    return { path, body, line, side };
  });
}

async function request(url, token, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options && options.headers ? options.headers : {})
    }
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      fail('GitHub API returned non-JSON: ' + text);
    }
  }

  if (!response.ok) {
    fail('GitHub API request failed (' + response.status + '): ' + JSON.stringify(data || text));
  }

  return data;
}

async function verifyReview(repository, prNumber, headSha, expectedState, token) {
  const url = 'https://api.github.com/repos/' + repository + '/pulls/' + prNumber + '/reviews';

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reviews = await request(url, token, { method: 'GET' });
    const match = reviews.find((review) => {
      return review &&
        review.user &&
        review.user.login === 'github-actions[bot]' &&
        review.commit_id === headSha &&
        String(review.state || '').toUpperCase() === expectedState &&
        /^## Gemini Review Summary/m.test(String(review.body || ''));
    });

    if (match) return match;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  fail(
    'Gemini review artifact was not visible on current head ' +
    headSha.slice(0, 7) +
    ' with state ' +
    expectedState +
    '.'
  );
}

async function main() {
  const token = process.env.GITHUB_TOKEN || '';
  const repository = process.env.REPOSITORY || '';
  const prNumber = process.env.PR_NUMBER || '';
  const headSha = process.env.HEAD_SHA || '';
  const rawResponse = process.env.GEMINI_RESPONSE || '';
  const dryRun = process.env.DRY_RUN === '1';

  if (!repository) fail('REPOSITORY is required.');
  if (!prNumber) fail('PR_NUMBER is required.');
  if (!headSha) fail('HEAD_SHA is required.');
  if (!rawResponse.trim()) fail('GEMINI_RESPONSE was empty.');

  const parsed = parsePayload(rawResponse);
  const event = normalizeEvent(parsed.event);
  const body = normalizeBody(parsed.body);
  const comments = normalizeComments(parsed.comments);
  const payload = {
    body,
    event,
    commit_id: headSha
  };

  if (comments.length) {
    payload.comments = comments;
  }

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (!token) fail('GITHUB_TOKEN is required.');

  const createUrl = 'https://api.github.com/repos/' + repository + '/pulls/' + prNumber + '/reviews';
  await request(createUrl, token, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const expectedState = event === 'APPROVE' ? 'APPROVED' : 'CHANGES_REQUESTED';
  const review = await verifyReview(repository, prNumber, headSha, expectedState, token);
  console.log('Gemini review submitted: ' + (review.html_url || ''));
}

main().catch((error) => fail(error && error.stack ? error.stack : String(error)));
