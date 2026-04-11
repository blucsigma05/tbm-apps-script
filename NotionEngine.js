// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// NotionEngine.gs v2 — Notion API Wrapper for Education Modules
// WRITES TO: Notion (Homework Tracker, Pre-K Prep, Story Factory)
// READS FROM: Script Properties (NOTION_TOKEN)
// ════════════════════════════════════════════════════════════════════

function getNotionEngineVersion() { return 2; }

// ── NOTION DB IDs ───────────────────────────────────────────────────
const NOTION_DB = {
  HOMEWORK_TRACKER: '9164c6a594b448028426366ff62952b5',
  PREK_PREP:        'ac28bcfa-e972-428e-812d-f2281df55af9',
  STORY_FACTORY:    'a899ee9786024ece8d09ae8432642b2a'
};

const NOTION_BASE_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// ═══════════════════════════════════════════════════════════════
// SECTION 1: Core API Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Reads NOTION_TOKEN from Script Properties.
 */
function getNotionToken_() {
  const token = PropertiesService.getScriptProperties().getProperty('NOTION_TOKEN');
  if (!token) {
    throw new Error('NOTION_TOKEN not set in Script Properties. Go to Project Settings → Script Properties → Add NOTION_TOKEN.');
  }
  return token;
}

/**
 * Returns standard Notion API headers (auth + version).
 */
function notionHeaders_() {
  return {
    'Authorization': 'Bearer ' + getNotionToken_(),
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json'
  };
}

/**
 * Creates a new page in a Notion database.
 * @param {string} dbId — database UUID
 * @param {object} properties — Notion property schema object
 * @returns {object} parsed API response
 */
function notionCreatePage_(dbId, properties) {
  const payload = {
    parent: { database_id: dbId },
    properties: properties
  };

  const response = UrlFetchApp.fetch(NOTION_BASE_URL + '/pages', {
    method: 'post',
    headers: notionHeaders_(),
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const body = JSON.parse(response.getContentText());

  if (code !== 200 && code !== 201) {
    throw new Error('Notion createPage failed (' + code + '): ' + JSON.stringify(body));
  }
  return body;
}

/**
 * Updates an existing Notion page's properties.
 * @param {string} pageId — page UUID
 * @param {object} properties — Notion property schema object (partial update)
 * @returns {object} parsed API response
 */
function notionUpdatePage_(pageId, properties) {
  const response = UrlFetchApp.fetch(NOTION_BASE_URL + '/pages/' + pageId, {
    method: 'patch',
    headers: notionHeaders_(),
    payload: JSON.stringify({ properties: properties }),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const body = JSON.parse(response.getContentText());

  if (code !== 200) {
    throw new Error('Notion updatePage failed (' + code + '): ' + JSON.stringify(body));
  }
  return body;
}

/**
 * Queries a Notion database with optional filter, sorts, and page size.
 * @param {string} dbId — database UUID
 * @param {object} [filter] — Notion filter object (omit for all rows)
 * @param {Array} [sorts] — array of sort objects
 * @param {number} [pageSize] — results per page (max 100, default 100)
 * @returns {object} parsed API response with .results array
 */
function notionQueryDb_(dbId, filter, sorts, pageSize) {
  const payload = {};
  if (filter) payload.filter = filter;
  if (sorts) payload.sorts = sorts;
  payload.page_size = pageSize || 100;

  const response = UrlFetchApp.fetch(NOTION_BASE_URL + '/databases/' + dbId + '/query', {
    method: 'post',
    headers: notionHeaders_(),
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const body = JSON.parse(response.getContentText());

  if (code !== 200) {
    throw new Error('Notion queryDb failed (' + code + '): ' + JSON.stringify(body));
  }
  return body;
}

/**
 * Gets a single Notion page by ID.
 * @param {string} pageId — page UUID
 * @returns {object} parsed page object
 */
function notionGetPage_(pageId) {
  const response = UrlFetchApp.fetch(NOTION_BASE_URL + '/pages/' + pageId, {
    method: 'get',
    headers: notionHeaders_(),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const body = JSON.parse(response.getContentText());

  if (code !== 200) {
    throw new Error('Notion getPage failed (' + code + '): ' + JSON.stringify(body));
  }
  return body;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: Education Convenience Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Logs a completed homework assignment to the Homework Tracker DB.
 * @param {object} data — { assignment, subject, date, status, score, teks, difficulty, timeSpent, notes }
 * @returns {object} created page
 */
function logHomeworkToNotion_(data) {
  const properties = {
    'Assignment': {
      title: [{ text: { content: String(data.assignment || 'Untitled') } }]
    },
    'Subject': {
      select: { name: String(data.subject || 'General') }
    },
    'Date': {
      date: { start: String(data.date || new Date().toISOString().slice(0, 10)) }
    },
    'Status': {
      select: { name: String(data.status || 'auto-graded') }
    },
    'Score': {
      number: Number(data.score) || 0
    },
    'TEKS': {
      rich_text: [{ text: { content: String(data.teks || '') } }]
    },
    'Difficulty': {
      select: { name: String(data.difficulty || 'medium') }
    },
    'TimeSpent': {
      number: Number(data.timeSpent) || 0
    },
    'Notes': {
      rich_text: [{ text: { content: String(data.notes || '') } }]
    }
  };

  return notionCreatePage_(NOTION_DB.HOMEWORK_TRACKER, properties);
}

/**
 * Updates status, grade, and notes on an existing Homework Tracker page.
 * @param {string} pageId — Notion page UUID
 * @param {string} status — new status value (e.g. 'approved', 'needs_revision')
 * @param {number} grade — updated grade/score
 * @param {string} notes — parent review notes
 * @returns {object} updated page
 */
function updateHomeworkStatus_(pageId, status, grade, notes) {
  const properties = {
    'Status': {
      select: { name: String(status) }
    }
  };
  if (grade !== undefined && grade !== null) {
    properties['Score'] = { number: Number(grade) };
  }
  if (notes) {
    properties['Notes'] = {
      rich_text: [{ text: { content: String(notes) } }]
    };
  }
  return notionUpdatePage_(pageId, properties);
}

/**
 * Creates or updates a skill record in the Pre-K Prep DB.
 * @param {object} data — { skill, category, status, phase, practiceCount, funRating }
 * @returns {object} created page
 */
function logSparkleToNotion_(data) {
  const properties = {
    'Skill': {
      title: [{ text: { content: String(data.skill || 'Unknown Skill') } }]
    },
    'Category': {
      select: { name: String(data.category || 'General') }
    },
    'Status': {
      select: { name: String(data.status || 'practicing') }
    },
    'Phase': {
      select: { name: String(data.phase || 'intro') }
    },
    'PracticeCount': {
      number: Number(data.practiceCount) || 0
    },
    'FunRating': {
      number: Number(data.funRating) || 0
    }
  };

  return notionCreatePage_(NOTION_DB.PREK_PREP, properties);
}

/**
 * Queries Homework Tracker for assignments with Status = 'pending_review'.
 * Returns array of { pageId, assignment, subject, date, age_hours }.
 */
function queryPendingReviews_() {
  const filter = {
    property: 'Status',
    select: { equals: 'pending_review' }
  };
  const sorts = [{ property: 'Date', direction: 'ascending' }];

  const result = notionQueryDb_(NOTION_DB.HOMEWORK_TRACKER, filter, sorts);
  const now = new Date().getTime();
  const items = [];

  for (const page of result.results) {
    const props = page.properties;
    const assignment = (props['Assignment'] && props['Assignment'].title && props['Assignment'].title.length > 0)
      ? props['Assignment'].title[0].plain_text
      : 'Untitled';
    const subject = (props['Subject'] && props['Subject'].select)
      ? props['Subject'].select.name
      : 'Unknown';
    const dateVal = (props['Date'] && props['Date'].date)
      ? props['Date'].date.start
      : null;
    const ageMs = dateVal ? (now - new Date(dateVal).getTime()) : 0;
    const ageHours = Math.round(ageMs / 3600000);

    items.push({
      pageId: page.id,
      assignment: assignment,
      subject: subject,
      date: dateVal,
      age_hours: ageHours
    });
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: Safe Wrappers (public-facing)
// ═══════════════════════════════════════════════════════════════

/**
 * Notion-specific safe wrapper: creates a Homework Tracker page and returns pageId.
 * Named distinctly from logHomeworkCompletionSafe in Code.js (which writes to Sheet).
 * Called by modules that need a Notion page reference for later approval.
 * @param {object} data — homework completion data
 * @returns {string} JSON result with pageId
 */
function notionLogHomeworkSafe(data) {
  try {
    const page = logHomeworkToNotion_(data);
    return JSON.stringify({ status: 'ok', pageId: page.id });
  } catch (e) {
    if (typeof logError_ === 'function') logError_('notionLogHomeworkSafe', e);
    return JSON.stringify({ status: 'error', message: e.message });
  }
}

/**
 * Notion-specific safe wrapper: creates a Pre-K Prep page and returns pageId.
 * Named distinctly from logSparkleProgressSafe in Code.js (which writes to Sheet).
 * @param {object} data — sparkle progress data
 * @returns {string} JSON result with pageId
 */
function notionLogSparkleProgressSafe(data) {
  try {
    const page = logSparkleToNotion_(data);
    return JSON.stringify({ status: 'ok', pageId: page.id });
  } catch (e) {
    if (typeof logError_ === 'function') logError_('notionLogSparkleProgressSafe', e);
    return JSON.stringify({ status: 'error', message: e.message });
  }
}

/**
 * Safe wrapper for queryPendingReviews_.
 * @returns {string} JSON array of pending review items
 */
function getPendingReviewsSafe() {
  try {
    const items = queryPendingReviews_();
    return JSON.stringify({ status: 'ok', items: items, count: items.length });
  } catch (e) {
    if (typeof logError_ === 'function') logError_('getPendingReviewsSafe', e);
    return JSON.stringify({ status: 'error', message: e.message, items: [] });
  }
}

/**
 * Notion-specific approval: updates a Notion page status + awards rings.
 * Named distinctly from approveHomeworkSafe in KidsHub.js (rowIndex/action contract).
 * Use this when the caller has a Notion page UUID (from notionLogHomeworkSafe).
 * @param {string} pageId — Notion page UUID
 * @param {number} grade — final grade
 * @param {string} notes — parent notes
 * @returns {string} JSON result
 */
function notionApproveHomeworkSafe(pageId, grade, notes) {
  try {
    // Update Notion page status to 'approved'
    updateHomeworkStatus_(pageId, 'approved', grade, notes);

    // Award remaining rings if kh_awardEducationPoints_ is available
    if (typeof kh_awardEducationPoints_ === 'function') {
      const ringsForApproval = 5; // standard ring award for parent-approved homework
      kh_awardEducationPoints_('buggsy', ringsForApproval, 'Homework approved by parent');
    }

    return JSON.stringify({ status: 'ok', pageId: pageId, approved: true });
  } catch (e) {
    if (typeof logError_ === 'function') logError_('notionApproveHomeworkSafe', e);
    return JSON.stringify({ status: 'error', message: e.message });
  }
}

// EOF — NotionEngine.gs v2
