// ════════════════════════════════════════════════════════════════════════════
// ContentEngine.gs — Gemini-powered grading + content generation
// READS FROM: 💻 QuestionLog (via SSID + TAB_MAP)
// DEPENDENCIES: SSID, TAB_MAP, logError_, withMonitor_ (GASHardening.gs)
// DO NOT redeclare var TAB_MAP in this file.
// ════════════════════════════════════════════════════════════════════════════

function getContentEngineVersion() { return 1; }

// ════════════════════════════════════════════════════════════════════════════
// SECTION 1: Gemini API Wrapper
// ════════════════════════════════════════════════════════════════════════════

/**
 * Reads GEMINI_API_KEY from Script Properties.
 * @return {string} The API key
 * @private
 */
function getGeminiKey_() {
  var key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_API_KEY not set in Script Properties');
  return key;
}

/**
 * Calls Gemini API with retry logic (1 retry on 429/500 with 2s delay).
 * @param {string} prompt - The prompt text
 * @param {Object} [options] - Optional settings
 * @param {number} [options.temperature=0.3] - Temperature for generation
 * @param {number} [options.maxOutputTokens=2048] - Max output tokens
 * @param {string} [options.systemInstruction] - System instruction text
 * @return {Object} Parsed JSON response from Gemini
 * @private
 */
function callGemini_(prompt, options) {
  var opts = options || {};
  var temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.3;
  var maxOutputTokens = opts.maxOutputTokens || 2048;
  var apiKey = getGeminiKey_();
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;

  var payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: maxOutputTokens
    }
  };

  if (opts.systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: opts.systemInstruction }]
    };
  }

  var fetchOpts = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var maxAttempts = 2;
  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    var resp = UrlFetchApp.fetch(url, fetchOpts);
    var code = resp.getResponseCode();

    if (code === 200) {
      var json = JSON.parse(resp.getContentText());
      if (json.candidates && json.candidates[0] && json.candidates[0].content) {
        return json;
      }
      throw new Error('Gemini returned no candidates: ' + resp.getContentText().substring(0, 300));
    }

    // Retry on 429 (rate limit) or 500 (server error), but only once
    if ((code === 429 || code >= 500) && attempt < maxAttempts - 1) {
      Utilities.sleep(2000);
      continue;
    }

    throw new Error('Gemini API error ' + code + ': ' + resp.getContentText().substring(0, 300));
  }
}

/**
 * Extracts text content from a Gemini response object.
 * @param {Object} geminiResponse - Parsed Gemini API response
 * @return {string} The text content
 * @private
 */
function extractGeminiText_(geminiResponse) {
  return geminiResponse.candidates[0].content.parts[0].text;
}

/**
 * Extracts text from Gemini response and parses as JSON.
 * Strips markdown code fences if present.
 * @param {Object} geminiResponse - Parsed Gemini API response
 * @return {Object} Parsed JSON object
 * @private
 */
function extractGeminiJSON_(geminiResponse) {
  var text = extractGeminiText_(geminiResponse);
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  return JSON.parse(text);
}


// ════════════════════════════════════════════════════════════════════════════
// SECTION 2: Grading (Structured Output)
// ════════════════════════════════════════════════════════════════════════════

var CER_RUBRIC_TEMPLATE = [
  'CER Rubric (Claim / Evidence / Reasoning):',
  '  Claim (1-3): 1 = no claim or off-topic, 2 = partial claim, 3 = clear accurate claim',
  '  Evidence (1-3): 1 = no evidence cited, 2 = partial/vague evidence, 3 = specific relevant evidence',
  '  Reasoning (1-3): 1 = no reasoning connecting evidence to claim, 2 = partial reasoning, 3 = clear logical reasoning'
].join('\n');

var ECR_RUBRIC_TEMPLATE = [
  'ECR Rubric (Extended Constructed Response):',
  '  Introduction (1-4): 1 = missing, 2 = weak, 3 = adequate, 4 = strong thesis',
  '  Evidence 1 (1-4): 1 = missing, 2 = weak/irrelevant, 3 = adequate, 4 = strong text evidence',
  '  Evidence 2 (1-4): 1 = missing, 2 = weak/irrelevant, 3 = adequate, 4 = strong text evidence',
  '  Conclusion (1-4): 1 = missing, 2 = weak, 3 = restates, 4 = synthesizes and extends'
].join('\n');

var GRADING_SYSTEM_PROMPT = [
  'You are Wolfkid, a friendly and encouraging learning coach for Buggsy, a 4th grade student.',
  'Your job is to grade student responses using a structured rubric and provide constructive, growth-oriented feedback.',
  '',
  'CRITICAL RULES:',
  '- NEVER use the words "wrong", "incorrect", "bad", or "failure".',
  '- Frame ALL feedback positively: what was good, what could be even better.',
  '- Use encouraging language: "Great start!", "You\'re on the right track!", "Next time try..."',
  '- If the student clearly misunderstood the question, identify the likely misconception.',
  '- If your confidence in the grade is "low", include a note that this should be reviewed by a parent.',
  '- Keep feedback under 100 words. Be specific, not generic.',
  '',
  'You MUST respond with ONLY valid JSON matching this exact schema (no markdown, no explanation):',
  '{',
  '  "score": <number - total score>,',
  '  "maxScore": <number - maximum possible score>,',
  '  "rubricScores": { "<component>": <number>, ... },',
  '  "feedback": "<string - constructive, never punitive>",',
  '  "confidence": "high|medium|low",',
  '  "suggestedRings": <number - 0 to 5 rings based on quality>,',
  '  "misconception": "<string or null - what the student likely misunderstood>"',
  '}'
].join('\n');

/**
 * Grades a student response using Gemini with structured JSON output.
 * @param {string} studentResponse - The student's written response
 * @param {string} rubric - The rubric text (CER or ECR)
 * @param {string} teksCode - The TEKS standard code
 * @param {string} questionText - The original question
 * @return {Object} Grading result matching the schema
 * @private
 */
function gradeResponseWithGemini_(studentResponse, rubric, teksCode, questionText) {
  var prompt = [
    'Grade the following student response using the rubric provided.',
    '',
    'TEKS Standard: ' + (teksCode || 'N/A'),
    'Question: ' + (questionText || 'N/A'),
    '',
    rubric,
    '',
    'Student Response:',
    '"""',
    studentResponse || '(no response provided)',
    '"""',
    '',
    'Return ONLY the JSON grading object. No other text.'
  ].join('\n');

  var resp = callGemini_(prompt, {
    temperature: 0.2,
    maxOutputTokens: 1024,
    systemInstruction: GRADING_SYSTEM_PROMPT
  });

  var result = extractGeminiJSON_(resp);

  // Validate required fields
  if (typeof result.score !== 'number') throw new Error('Grading result missing score');
  if (typeof result.maxScore !== 'number') throw new Error('Grading result missing maxScore');
  if (!result.feedback) throw new Error('Grading result missing feedback');
  if (!result.confidence) result.confidence = 'medium';
  if (typeof result.suggestedRings !== 'number') result.suggestedRings = 0;
  if (!result.rubricScores) result.rubricScores = {};

  return result;
}

/**
 * Safe wrapper: Grade a CER (Claim/Evidence/Reasoning) response.
 * @param {string} studentResponse - The student's response text
 * @param {string} questionText - The original question
 * @param {string} teksCode - The TEKS standard code
 * @return {Object} Grading result
 */
function gradeCERSafe(studentResponse, questionText, teksCode) {
  return withMonitor_('gradeCERSafe', function() {
    return gradeResponseWithGemini_(studentResponse, CER_RUBRIC_TEMPLATE, teksCode, questionText);
  });
}

/**
 * Safe wrapper: Grade an ECR (Extended Constructed Response).
 * @param {string} studentResponse - The student's response text
 * @param {string} questionText - The original question
 * @param {string} teksCode - The TEKS standard code
 * @return {Object} Grading result
 */
function gradeECRSafe(studentResponse, questionText, teksCode) {
  return withMonitor_('gradeECRSafe', function() {
    return gradeResponseWithGemini_(studentResponse, ECR_RUBRIC_TEMPLATE, teksCode, questionText);
  });
}


// ════════════════════════════════════════════════════════════════════════════
// SECTION 3: Content Generation
// ════════════════════════════════════════════════════════════════════════════

var FACT_SPRINT_SYSTEM_PROMPT = [
  'You are an expert Texas education content creator specializing in TEKS-aligned assessment items.',
  '',
  'RULES:',
  '- Every question MUST align to the specified TEKS standard.',
  '- All 4 answer options must be plausible. No joke answers.',
  '- No trick questions or intentionally misleading wording.',
  '- Distractors should reflect common student misconceptions.',
  '- Use grade-appropriate vocabulary and sentence structure.',
  '- correctIndex is 0-based (0 = first option).',
  '',
  'Return ONLY a valid JSON array. No markdown, no explanation.'
].join('\n');

/**
 * Generates multiple-choice fact sprint questions using Gemini.
 * @param {string} subject - Subject area (e.g., "Math", "Science")
 * @param {string} teksCode - TEKS standard code
 * @param {number} [count=20] - Number of questions to generate
 * @param {string} [difficulty="medium"] - Difficulty level: easy, medium, hard
 * @return {Array<Object>} Array of question objects
 * @private
 */
function generateFactSprintQuestions_(subject, teksCode, count, difficulty) {
  count = count || 20;
  difficulty = difficulty || 'medium';

  var prompt = [
    'Generate exactly ' + count + ' multiple-choice questions for a 4th grade ' + subject + ' fact sprint.',
    '',
    'TEKS Standard: ' + teksCode,
    'Difficulty: ' + difficulty,
    '',
    'Return a JSON array where each element has this exact structure:',
    '{',
    '  "question": "<question text>",',
    '  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],',
    '  "correctIndex": <0-3>,',
    '  "teksCode": "' + teksCode + '",',
    '  "difficulty": "' + difficulty + '",',
    '  "type": "MC"',
    '}',
    '',
    'Return ONLY the JSON array.'
  ].join('\n');

  var resp = callGemini_(prompt, {
    temperature: 0.7,
    maxOutputTokens: 4096,
    systemInstruction: FACT_SPRINT_SYSTEM_PROMPT
  });

  var questions = extractGeminiJSON_(resp);

  if (!Array.isArray(questions)) throw new Error('generateFactSprintQuestions_: expected array, got ' + typeof questions);
  // Validate each question
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctIndex !== 'number') {
      throw new Error('generateFactSprintQuestions_: invalid question at index ' + i);
    }
    q.teksCode = teksCode;
    q.difficulty = difficulty;
    q.type = 'MC';
  }

  return questions;
}

/**
 * Generates comprehension questions from a passage at specified DOK levels.
 * @param {string} passage - The reading passage
 * @param {number} [count=5] - Number of questions to generate
 * @param {Array<number>} [dokLevels=[1,2,3]] - DOK levels to target
 * @return {Array<Object>} Array of question objects
 * @private
 */
function generateComprehensionQuestions_(passage, count, dokLevels) {
  count = count || 5;
  dokLevels = dokLevels || [1, 2, 3];

  var prompt = [
    'Read the following passage and generate exactly ' + count + ' comprehension questions.',
    'Distribute questions across DOK levels: ' + dokLevels.join(', ') + '.',
    '',
    'Passage:',
    '"""',
    passage,
    '"""',
    '',
    'Return a JSON array where each element has this exact structure:',
    '{',
    '  "question": "<question text>",',
    '  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],',
    '  "correctIndex": <0-3>,',
    '  "teksCode": "<inferred TEKS code or empty string>",',
    '  "dok": <DOK level 1-4>,',
    '  "type": "MC"',
    '}',
    '',
    'Return ONLY the JSON array.'
  ].join('\n');

  var systemPrompt = [
    'You are an expert reading comprehension assessment creator for 4th grade students.',
    'DOK 1 = Recall, DOK 2 = Skill/Concept, DOK 3 = Strategic Thinking, DOK 4 = Extended Thinking.',
    'All distractors must be plausible. No trick questions.',
    'Return ONLY valid JSON. No markdown, no explanation.'
  ].join('\n');

  var resp = callGemini_(prompt, {
    temperature: 0.5,
    maxOutputTokens: 4096,
    systemInstruction: systemPrompt
  });

  var questions = extractGeminiJSON_(resp);
  if (!Array.isArray(questions)) throw new Error('generateComprehensionQuestions_: expected array');

  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error('generateComprehensionQuestions_: invalid question at index ' + i);
    }
    q.type = 'MC';
  }

  return questions;
}

/**
 * Generates plausible distractors for a correct answer.
 * @param {string} correctAnswer - The correct answer
 * @param {string} subject - Subject area
 * @param {number} [count=3] - Number of distractors to generate
 * @return {Array<string>} Array of distractor strings
 * @private
 */
function generateDistractors_(correctAnswer, subject, count) {
  count = count || 3;

  var prompt = [
    'The correct answer to a 4th grade ' + subject + ' question is: "' + correctAnswer + '"',
    '',
    'Generate exactly ' + count + ' plausible but incorrect answers (distractors).',
    'Each distractor should reflect a common student misconception or calculation error.',
    'Do NOT include the correct answer.',
    '',
    'Return ONLY a JSON array of strings. No markdown, no explanation.',
    'Example: ["distractor1", "distractor2", "distractor3"]'
  ].join('\n');

  var resp = callGemini_(prompt, {
    temperature: 0.6,
    maxOutputTokens: 512
  });

  var distractors = extractGeminiJSON_(resp);
  if (!Array.isArray(distractors)) throw new Error('generateDistractors_: expected array');
  return distractors;
}

/**
 * Generates grade-appropriate context sentences for vocabulary/spelling words.
 * @param {Array<string>} words - Array of spelling/vocab words
 * @param {number} [gradeLevel=4] - Grade level for age-appropriate sentences
 * @return {Array<Object>} Array of {word, sentence, definition}
 * @private
 */
function generateVocabSentences_(words, gradeLevel) {
  gradeLevel = gradeLevel || 4;

  var prompt = [
    'For each of the following words, provide a grade ' + gradeLevel + '-appropriate context sentence and a short definition.',
    '',
    'Words: ' + JSON.stringify(words),
    '',
    'Return a JSON array where each element has this exact structure:',
    '{',
    '  "word": "<the word>",',
    '  "sentence": "<a context sentence using the word>",',
    '  "definition": "<a grade-appropriate definition>"',
    '}',
    '',
    'Return ONLY the JSON array. No markdown, no explanation.'
  ].join('\n');

  var resp = callGemini_(prompt, {
    temperature: 0.4,
    maxOutputTokens: 2048
  });

  var results = extractGeminiJSON_(resp);
  if (!Array.isArray(results)) throw new Error('generateVocabSentences_: expected array');
  return results;
}


// ════════════════════════════════════════════════════════════════════════════
// SECTION 4: Adaptive Difficulty / Remediation
// ════════════════════════════════════════════════════════════════════════════

/**
 * Reads recent QuestionLog performance for a child on a specific TEKS code.
 * @param {string} child - Child name (e.g., "buggsy")
 * @param {string} teksCode - The weak TEKS code to analyze
 * @param {number} [lookbackRows=200] - How many recent rows to scan
 * @return {Object} Performance summary: {total, correct, pct, recentMisses: string[]}
 * @private
 */
function readQuestionLogPerformance_(child, teksCode, lookbackRows) {
  lookbackRows = lookbackRows || 200;
  var ss = SpreadsheetApp.openById(SSID);
  var tabName = (typeof TAB_MAP !== 'undefined' && TAB_MAP['QuestionLog']) || 'QuestionLog';
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) return { total: 0, correct: 0, pct: 0, recentMisses: [] };

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { total: 0, correct: 0, pct: 0, recentMisses: [] };

  var startRow = Math.max(2, lastRow - lookbackRows + 1);
  var numRows = lastRow - startRow + 1;
  // Columns: A=Question_UID, B=Child, C=Date, D=Day_Of_Week, E=Subject, F=TEKS_Code,
  //          G=Question_Type, H=Distractor_Level, I=Difficulty, J=Correct,
  //          K=Time_Spent_Seconds, L=Session_Module, M=Timestamp
  var data = sheet.getRange(startRow, 1, numRows, 13).getValues();

  var total = 0;
  var correct = 0;
  var recentMisses = [];
  var childLower = String(child).toLowerCase();

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (String(row[1]).toLowerCase() !== childLower) continue;
    if (String(row[5]).trim() !== teksCode) continue;
    total++;
    if (String(row[9]).toLowerCase() === 'true' || row[9] === true || row[9] === 1) {
      correct++;
    } else {
      // Capture the question UID for missed questions
      if (recentMisses.length < 10) recentMisses.push(String(row[0]));
    }
  }

  return {
    total: total,
    correct: correct,
    pct: total > 0 ? Math.round((correct / total) * 100) : 0,
    recentMisses: recentMisses
  };
}

/**
 * Generates targeted remediation questions for a child's weak TEKS code.
 * Analyzes recent QuestionLog performance, then generates DOK 1-2 questions
 * that address likely misconceptions.
 * @param {string} child - Child name (e.g., "buggsy")
 * @param {string} weakTeksCode - The TEKS code to remediate
 * @param {number} [count=10] - Number of questions to generate
 * @return {Array<Object>} Array of question objects (same format as fact sprint)
 * @private
 */
function generateRemediationQuestions_(child, weakTeksCode, count) {
  count = count || 10;

  var perf = readQuestionLogPerformance_(child, weakTeksCode);

  var prompt = [
    'Generate exactly ' + count + ' remediation questions for a 4th grade student.',
    '',
    'TEKS Standard: ' + weakTeksCode,
    'Student Performance on this standard: ' + perf.correct + '/' + perf.total + ' correct (' + perf.pct + '%)',
    perf.total > 0
      ? 'The student has missed ' + (perf.total - perf.correct) + ' questions on this standard recently.'
      : 'No prior data available — generate foundational questions.',
    '',
    'Generate questions at DOK levels 1 and 2 only (recall and skill/concept).',
    'Focus on building confidence and addressing common misconceptions.',
    'Start with easier questions and gradually increase difficulty.',
    '',
    'Return a JSON array where each element has this exact structure:',
    '{',
    '  "question": "<question text>",',
    '  "options": ["<option A>", "<option B>", "<option C>", "<option D>"],',
    '  "correctIndex": <0-3>,',
    '  "teksCode": "' + weakTeksCode + '",',
    '  "difficulty": "easy|medium",',
    '  "type": "MC"',
    '}',
    '',
    'Return ONLY the JSON array.'
  ].join('\n');

  var systemPrompt = [
    'You are a remediation specialist creating targeted practice for a struggling student.',
    'Questions should scaffold from simple recall (DOK 1) to basic application (DOK 2).',
    'All distractors must be plausible and reflect common misconceptions.',
    'Do NOT include trick questions. The goal is to build confidence and fill gaps.',
    'Return ONLY valid JSON. No markdown, no explanation.'
  ].join('\n');

  var resp = callGemini_(prompt, {
    temperature: 0.5,
    maxOutputTokens: 4096,
    systemInstruction: systemPrompt
  });

  var questions = extractGeminiJSON_(resp);
  if (!Array.isArray(questions)) throw new Error('generateRemediationQuestions_: expected array');

  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error('generateRemediationQuestions_: invalid question at index ' + i);
    }
    q.teksCode = weakTeksCode;
    q.type = 'MC';
  }

  return questions;
}


// ════════════════════════════════════════════════════════════════════════════
// SAFE WRAPPERS (for google.script.run)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Safe wrapper: Generate fact sprint questions.
 * @param {string} subject - Subject area
 * @param {string} teksCode - TEKS standard code
 * @param {number} [count=20] - Number of questions
 * @param {string} [difficulty="medium"] - Difficulty level
 * @return {Array<Object>} Array of question objects
 */
function generateFactSprintSafe(subject, teksCode, count, difficulty) {
  return withMonitor_('generateFactSprintSafe', function() {
    return generateFactSprintQuestions_(subject, teksCode, count, difficulty);
  });
}

/**
 * Safe wrapper: Generate comprehension questions from a passage.
 * @param {string} passage - The reading passage
 * @param {number} [count=5] - Number of questions
 * @return {Array<Object>} Array of question objects
 */
function generateComprehensionSafe(passage, count) {
  return withMonitor_('generateComprehensionSafe', function() {
    return generateComprehensionQuestions_(passage, count);
  });
}

/**
 * Safe wrapper: Grade a short answer response.
 * Uses CER rubric for short-form grading.
 * @param {string} studentResponse - The student's response
 * @param {string} correctAnswer - The expected correct answer (included in question context)
 * @param {string} teksCode - The TEKS standard code
 * @return {Object} Grading result
 */
function gradeShortAnswerSafe(studentResponse, correctAnswer, teksCode) {
  return withMonitor_('gradeShortAnswerSafe', function() {
    var questionText = 'Expected answer: ' + (correctAnswer || 'N/A');
    return gradeResponseWithGemini_(studentResponse, CER_RUBRIC_TEMPLATE, teksCode, questionText);
  });
}
