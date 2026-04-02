// Version history tracked in Notion deploy page. Do not add version comments here.
// ============================================================
// STORY FACTORY — Google Apps Script Agent
// WRITES TO: (Notion + Google Drive — no sheet writes)
// READS FROM: (Notion DBs for character/story data, Script Properties for stored stories)
// Version: 10.0
// Pipeline: Notion Trigger → Character Fetch → Memory Inject → Gemini Story → Canon Extract → Gemini Images (with ref images) → PDF on Drive → Notion Page
// ============================================================

function getStoryFactoryVersion() { return 10; }

// v30: API cost tracking — returns counts for parent dashboard
function getStoryApiStats() {
  var props = PropertiesService.getScriptProperties();
  return {
    apiCalls: parseInt(props.getProperty('SF_API_CALLS') || '0') || 0,
    storyCount: parseInt(props.getProperty('SF_STORY_COUNT') || '0') || 0
  };
}

var CONFIG = {
_geminiKey: null,
_notionToken: null,
get GEMINI_API_KEY() {
  if (!this._geminiKey) this._geminiKey = PropertiesService.getScriptProperties().getProperty('JJ Stories');
  return this._geminiKey;
},
get NOTION_TOKEN() {
  if (!this._notionToken) this._notionToken = PropertiesService.getScriptProperties().getProperty('NOTION_TOKEN');
  return this._notionToken;
},
STORY_DB_ID:     'a899ee9786024ece8d09ae8432642b2a',
CHARACTERS_DB_ID: '1225d281b4d44a8094d3c817202f3288',
CANON_LOG_DB_ID:  'd29ae2d2ee614ae0b27f8ccf9ac4dd81',
NOTION_VERSION:  '2022-06-28',
STORY_FOLDER_ID: '1bVLu75lSDzE9MfQKJv4au7j7tuv-hvTv',
IMAGE_MAX_RETRIES: 2,
IMAGE_RETRY_DELAY: 10000,
IMAGE_COOLDOWN:    8000,
IMAGE_SCENES: [0, 2, 4, 5],
OFF_PEAK_START: 22,
OFF_PEAK_END:    7,
ENFORCE_OFF_PEAK: false,
IMAGE_MODEL: 'gemini-2.5-flash-image',
STORY_MODEL: 'gemini-2.5-flash',
MEMORY_STORY_COUNT: 5,
MEMORY_CANON_COUNT: 20,
};

function sf_logError_(context, error) {
  if (typeof logError_ === 'function') {
    logError_('StoryFactory.' + context, error);
  }
}

var IMAGE_STYLE = 'Comic book style illustration of a loving Black family. ' +
'Bold clean comic lines, high contrast, vibrant colors, white background. ' +
'Child-friendly, warm, expressive characters.';

// v6: Character description locks — consistent appearance across all books
var STORY_CHARACTERS = {
  buggsy: {
    physical: 'African-American boy, age 8-9, short hair with clean fade, slim build, brown eyes, small lightning bolt temporary tattoo on left side of neck',
    personality: 'Cool and quiet, hands often in pockets, walks with purpose, secretly caring toward JJ, into Wolfkid Universe comics and drawing',
    default_outfit: 'Blue/white plaid button-up shirt (untucked), dark jeans, grey/white sneakers',
    casual_pool: [
      'Blue/white plaid button-up (untucked), dark jeans, grey sneakers',
      'Green hoodie with headphones around neck, black joggers, white high-tops',
      'Red graphic tee with wolf design, cargo shorts, black sneakers',
      'Navy baseball jersey, light jeans, red/white Jordans',
      'Grey henley shirt, khaki joggers, olive green sneakers',
      'Black bomber jacket over white tee, dark jeans, grey Vans'
    ],
    wardrobe: {
      sports: 'Basketball jersey or athletic shorts and t-shirt, basketball shoes',
      beach: 'Swim trunks with a cool pattern, no shirt or a tank top, sandals',
      school: 'Polo shirt, khaki pants, backpack',
      bedtime: 'Pajama pants, superhero t-shirt',
      formal: 'Button-up shirt (tucked), dark pants, dress shoes',
      casual: 'Blue/white plaid button-up (untucked), dark jeans, sneakers'
    }
  },
  jj: {
    physical: 'African-American girl, age 4-5, natural curly/coily hair in two puffs, brown eyes, small for her age but big personality, unicorn headband with horn (ALWAYS present, never removed)',
    personality: 'Bossy in the best way, owns an imaginary restaurant, princess warrior, negotiates everything, falls asleep in the car after every adventure',
    default_outfit: 'Graphic t-shirt (Sonic/superhero), pink tutu skirt with blue trim, pink sneakers',
    casual_pool: [
      'Graphic t-shirt (Sonic/superhero), pink tutu, pink sneakers, unicorn headband',
      'Yellow sunflower dress with sparkle belt, white sneakers, unicorn headband',
      'Purple unicorn hoodie, rainbow leggings, light-up shoes, unicorn headband',
      'Denim overall dress over striped tee, pink boots, unicorn headband',
      'Mint green tee with star pattern, lavender tutu, gold sandals, unicorn headband',
      'Red polka-dot top, jean skirt with tutu underneath, pink high-tops, unicorn headband'
    ],
    wardrobe: {
      sports: 'Pink tutu over athletic leggings, sneakers (she wears the tutu everywhere)',
      beach: 'Pink swimsuit with tutu cover-up, water shoes, unicorn headband stays',
      school: 'Cute dress or overalls, unicorn headband, backpack',
      bedtime: 'Nightgown or pajama set, unicorn headband stays on in sleep',
      formal: 'Princess dress with tutu, sparkly shoes, unicorn headband',
      casual: 'Graphic tee, pink tutu, pink sneakers'
    }
  },
  mom: {
    physical: 'African-American woman, early-mid 30s, natural curly/coily hair (shoulder length, sometimes pulled up), warm brown skin, medium build, warm smile',
    default_outfit: 'Casual but put-together — jeans or slacks, nice top, small hoop earrings'
  },
  dad: {
    physical: 'African-American man, early-mid 30s, short hair with neat fade, trim beard (always present), athletic build, tall, warm expression',
    default_outfit: 'Casual — fitted t-shirt or henley, jeans, clean sneakers'
  }
};

// v6: Banned words — too advanced for target reading levels
var BANNED_WORDS = ['feigned','strategic','assessment','optimal','acumen','schema',
  'rotational','perimeter','procurement','dominion','unwavering','orchestrated',
  'fundamental','embodying','conviction','inventory','executive','oversight',
  'engagement','renegotiation','reconnaissance'];

// ── NOTION HELPERS ───────────────────────────────────────────

function notionPost(endpoint, payload) {
return safeFetch('https://api.notion.com/v1/' + endpoint, {
method: 'POST',
headers: {
'Authorization': 'Bearer ' + CONFIG.NOTION_TOKEN,
'Content-Type': 'application/json',
'Notion-Version': CONFIG.NOTION_VERSION
},
contentType: 'application/json',
payload: JSON.stringify(payload),
muteHttpExceptions: true
});
}

function notionPatch(endpoint, payload) {
var response = UrlFetchApp.fetch('https://api.notion.com/v1/' + endpoint, {
method: 'PATCH',
headers: {
'Authorization': 'Bearer ' + CONFIG.NOTION_TOKEN,
'Content-Type': 'application/json',
'Notion-Version': CONFIG.NOTION_VERSION
},
contentType: 'application/json',
payload: JSON.stringify(payload),
muteHttpExceptions: true
});
var code = response.getResponseCode();
if (code >= 400) {
Logger.log('notionPatch FAILED (' + code + '): ' + endpoint + ' — ' + response.getContentText().substring(0, 300));
}
return code;
}

// ── PHASE 1: CHARACTER TRUTH FROM NOTION ─────────────────────

function sf_getCharacterFromNotion_(characterName) {
// Map story-level character names to Characters DB lookup names
var lookupNames = [];
if (characterName === 'JJ' || characterName === 'Both' || characterName === 'Whole Family') lookupNames.push('JJ');
if (characterName === 'Buggsy' || characterName === 'Both' || characterName === 'Whole Family') lookupNames.push('Buggsy');
if (characterName === 'Whole Family') { lookupNames.push('Mom (LT)'); lookupNames.push('Dad (JT)'); }

var characters = [];
for (var i = 0; i < lookupNames.length; i++) {
var result = notionPost('databases/' + CONFIG.CHARACTERS_DB_ID + '/query', {
filter: {
and: [
{ property: 'Name', title: { equals: lookupNames[i] } },
{ property: 'Active', checkbox: { equals: true } }
]
},
page_size: 1
});

if (result.results && result.results.length > 0) {
  var page = result.results[0];
  var props = page.properties;
  characters.push({
    name: getNotionText(props['Name'], 'title'),
    narrativeTraits: getNotionText(props['Narrative Traits'], 'rich_text'),
    visualTraits: getNotionText(props['Visual Traits'], 'rich_text'),
    signatureBehaviors: getNotionText(props['Signature Behaviors'], 'rich_text'),
    relationshipNotes: getNotionText(props['Relationship Notes'], 'rich_text'),
    mustNeverChange: getNotionText(props['Must Never Change'], 'rich_text'),
    currentEraDetails: getNotionText(props['Current Era Details'], 'rich_text'),
    referenceImageUrl: props['Reference Image URL'] && props['Reference Image URL'].url ? props['Reference Image URL'].url : null
  });
}

}

Logger.log('Fetched ' + characters.length + ' character(s) from Notion for: ' + characterName);
return characters;
}

function getNotionText(prop, type) {
if (!prop) return '';
var arr = prop[type];
if (!arr || arr.length === 0) return '';
var text = '';
for (var i = 0; i < arr.length; i++) {
text += arr[i].plain_text || '';
}
return text;
}

function buildCharacterContext(characters) {
var parts = [];
for (var i = 0; i < characters.length; i++) {
var c = characters[i];
var block = c.name + ':\n';
if (c.narrativeTraits) block += c.narrativeTraits + '\n';
if (c.signatureBehaviors) block += 'Signature behaviors: ' + c.signatureBehaviors + '\n';
if (c.relationshipNotes) block += 'Relationships: ' + c.relationshipNotes + '\n';
if (c.mustNeverChange) block += 'MUST NEVER CHANGE: ' + c.mustNeverChange + '\n';
parts.push(block);
}
return parts.join('\n');
}

function buildCharacterVisuals(characters) {
var parts = [];
for (var i = 0; i < characters.length; i++) {
var c = characters[i];
if (c.visualTraits) {
parts.push('CHARACTER: ' + c.visualTraits);
}
}
return parts.join('\n');
}

// Download character reference images from Notion-stored URLs
var _refImageCache = {};
function sf_getCharacterRefImages_(characters) {
var images = [];
for (var i = 0; i < characters.length; i++) {
var c = characters[i];
var key = c.name;
if (!c.referenceImageUrl) continue;

if (_refImageCache[key]) {
  images.push(_refImageCache[key]);
  continue;
}

try {
  Logger.log('Downloading reference image for ' + key + '...');
  var response = UrlFetchApp.fetch(c.referenceImageUrl, { muteHttpExceptions: true });
  if (response.getResponseCode() === 200) {
    var blob = response.getBlob();
    var b64 = Utilities.base64Encode(blob.getBytes());
    var mimeType = blob.getContentType() || 'image/png';
    var refData = { data: b64, mimeType: mimeType, name: key };
    _refImageCache[key] = refData;
    images.push(refData);
    Logger.log('Reference image for ' + key + ' OK (' + Math.round(b64.length / 1024) + 'KB)');
  } else {
    Logger.log('Could not download ref image for ' + key + ': HTTP ' + response.getResponseCode());
  }
} catch(e) {
  Logger.log('Error downloading ref image for ' + key + ': ' + e.message);
}

}

// Validate: warn if any expected images missing
if (images.length === 0 && characters.length > 0) {
Logger.log('WARNING: No reference images loaded. Images will generate without character consistency.');
}

return images;
}

// ── PHASE 2: STORY MEMORY ────────────────────────────────────

function sf_getRecentStories_(character) {
// Get the last N stories featuring this character (or all stories if Whole Family)
var filter;
if (character === 'Whole Family') {
filter = { property: 'Status', select: { equals: 'Ready' } };
} else if (character === 'Both') {
filter = {
and: [
{ property: 'Status', select: { equals: 'Ready' } },
{ or: [
{ property: 'Character', select: { equals: 'JJ' } },
{ property: 'Character', select: { equals: 'Buggsy' } },
{ property: 'Character', select: { equals: 'Both' } },
{ property: 'Character', select: { equals: 'Whole Family' } }
]}
]
};
} else {
filter = {
and: [
{ property: 'Status', select: { equals: 'Ready' } },
{ or: [
{ property: 'Character', select: { equals: character } },
{ property: 'Character', select: { equals: 'Both' } },
{ property: 'Character', select: { equals: 'Whole Family' } }
]}
]
};
}

var result = notionPost('databases/' + CONFIG.STORY_DB_ID + '/query', {
filter: filter,
sorts: [{ property: 'Book Number', direction: 'descending' }],
page_size: CONFIG.MEMORY_STORY_COUNT
});

var summaries = [];
if (result.results) {
for (var i = 0; i < result.results.length; i++) {
var page = result.results[i];
var props = page.properties;
var title = getNotionText(props['Story Title'], 'title');
var summary = getNotionText(props['Summary'], 'rich_text');
var bookNum = props['Book Number'] && props['Book Number'].number ? props['Book Number'].number : '?';
if (title) {
summaries.push('Book #' + bookNum + ': "' + title + '"' + (summary ? ' — ' + summary : ''));
}
}
}

Logger.log('Fetched ' + summaries.length + ' recent story summaries for: ' + character);
return summaries;
}

function sf_getCanonFacts_(character) {
// Get active canon facts relevant to this character
var charFilters = [];
if (character === 'JJ' || character === 'Both' || character === 'Whole Family') {
charFilters.push({ property: 'Character', select: { equals: 'JJ' } });
}
if (character === 'Buggsy' || character === 'Both' || character === 'Whole Family') {
charFilters.push({ property: 'Character', select: { equals: 'Buggsy' } });
}
if (character === 'Whole Family') {
charFilters.push({ property: 'Character', select: { equals: 'Mom' } });
charFilters.push({ property: 'Character', select: { equals: 'Dad' } });
}
// Always include Family-level canon
charFilters.push({ property: 'Character', select: { equals: 'Family' } });

var result = notionPost('databases/' + CONFIG.CANON_LOG_DB_ID + '/query', {
filter: {
and: [
{ property: 'Active', checkbox: { equals: true } },
{ or: charFilters }
]
},
page_size: CONFIG.MEMORY_CANON_COUNT
});

var facts = [];
if (result.results) {
for (var i = 0; i < result.results.length; i++) {
var fact = getNotionText(result.results[i].properties['Fact'], 'title');
if (fact) facts.push('- ' + fact);
}
}

Logger.log('Fetched ' + facts.length + ' canon facts for: ' + character);
return facts;
}

// ── SAFE API FETCH ───────────────────────────────────────────

function safeFetch(url, options) {
// v30: Track API calls for cost monitoring
try {
  var props = PropertiesService.getScriptProperties();
  var count = parseInt(props.getProperty('SF_API_CALLS') || '0') || 0;
  props.setProperty('SF_API_CALLS', String(count + 1));
  var stories = parseInt(props.getProperty('SF_STORY_COUNT') || '0') || 0;
  if (url.indexOf('generateContent') >= 0) {
    props.setProperty('SF_STORY_COUNT', String(stories + 1));
  }
} catch(e) { /* non-critical */ }
var response = UrlFetchApp.fetch(url, options);
var code = response.getResponseCode();
var text = response.getContentText();

if (code === 429) {
throw new Error('RATE_LIMITED: API returned 429.');
}
if (code >= 500) {
throw new Error('SERVER_ERROR_' + code + ': ' + text.substring(0, 300));
}
if (code >= 400) {
try {
var errObj = JSON.parse(text);
var msg = errObj.error ? errObj.error.message : text.substring(0, 200);
throw new Error('API_ERROR_' + code + ': ' + msg);
} catch(e) {
if (e.message.indexOf('API_ERROR') === 0 || e.message.indexOf('RATE_LIMITED') === 0) throw e;
throw new Error('API_ERROR_' + code + ': ' + text.substring(0, 200));
}
}

try {
return JSON.parse(text);
} catch(e) {
throw new Error('JSON_PARSE_FAILED: ' + text.substring(0, 300));
}
}

// ── STEP 1: GENERATE STORY (with memory injection) ──────────

function generateStory(topic, character, tone, characters, recentStories, canonFacts) {
var charContext = buildCharacterContext(characters);

var toneGuide = '';
if (tone === 'Adventurous') toneGuide = '- Tone: Epic adventure — action, suspense, big moments, but still kid-safe and warm\n';
else if (tone === 'Cozy') toneGuide = '- Tone: Cozy bedtime — gentle, warm, soothing, easy rhythm, perfect for winding down\n';
else if (tone === 'Spooky') toneGuide = '- Tone: Spooky-fun — creepy atmosphere but always safe, more Scooby-Doo than horror\n';
else toneGuide = '- Tone: Diary of a Wimpy Kid style — first person, punchy, funny, self-aware\n';

// Build memory blocks
var memoryBlock = '';

if (recentStories && recentStories.length > 0) {
memoryBlock += '\nRECENT STORIES (for continuity — reference or build on these naturally):\n';
memoryBlock += recentStories.join('\n') + '\n';
}

if (canonFacts && canonFacts.length > 0) {
memoryBlock += '\nESTABLISHED CANON FACTS (weave these in naturally when relevant — do NOT force them all in):\n';
memoryBlock += canonFacts.join('\n') + '\n';
}

var prompt = 'You are a children\'s bedtime story writer for a loving Black family.\n\n' +
'CHARACTER REFERENCE:\n' + charContext + '\n' +
memoryBlock + '\n' +
'WRITING RULES:\n' +
toneGuide +
'READING LEVEL RULES:\n' +
(character === 'JJ' ? '- JJ stories (age 4-5): Maximum Flesch-Kincaid Grade Level 1.5. Use simple sentences (5-10 words average). No words over 3 syllables unless character-specific (restaurant, headband). First-person narration from JJ perspective.\n' :
 character === 'Buggsy' ? '- Buggsy stories (age 8-9): Maximum Flesch-Kincaid Grade Level 3.0. Sentences can be longer but conversational. Vocabulary should match a 3rd grader.\n' :
 '- Both stories: Grade Level 2.0. JJ dialogue stays simple, narration slightly more complex.\n') +
'- BANNED WORDS (never use): ' + BANNED_WORDS.join(', ') + '\n' +
'- Structure: Exactly 6 scenes, each 3-5 sentences\n' +
'- Story MUST end with the main character in bed asleep\n' +
'- Each scene needs a vivid image_prompt for comic book illustration\n' +
'- image_prompt should describe the scene visually WITHOUT naming real characters or IP\n' +
'- image_prompt MUST describe each character\'s SPECIFIC outfit for THIS scene. Be creative — vary colors, patterns, and styles across stories. Never default to the same outfit.\n' +
'- JJ ALWAYS wears her unicorn headband with horn, no matter the outfit.\n' +
'- Outfit ideas: themed graphic tees, different colored tutus for JJ, various button-ups or hoodies for Buggsy, seasonal clothing, activity-specific gear.\n' +
'- Each scene must include a characters_in_scene array listing which characters appear\n' +
'- Keep it warm, funny, and age-appropriate\n' +
'- If referencing a previous story, do it with a quick natural callback — not a recap\n\n' +
'STORY TOPIC: ' + topic + '\n' +
'MAIN CHARACTER(S): ' + character + '\n\n' +
'Return ONLY valid JSON, NO markdown, NO backticks, NO preamble:\n' +
'{\n' +
'  "title": "' + character + ' and the [Something]",\n' +
'  "character": "' + character + '",\n' +
'  "scenes": [\n' +
'    {\n' +
'      "scene_number": 1,\n' +
'      "text": "Story text. 3-5 sentences.",\n' +
'      "image_prompt": "Comic book illustration of [visual scene description]. Bold clean lines, vibrant colors, white background.",\n' +
'      "characters_in_scene": ["JJ"]\n' +
'    }\n' +
'  ]\n' +
'}';

var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + CONFIG.STORY_MODEL + ':generateContent?key=' + CONFIG.GEMINI_API_KEY;

var result = safeFetch(url, {
method: 'POST',
contentType: 'application/json',
payload: JSON.stringify({
contents: [{ parts: [{ text: prompt }] }],
generationConfig: { temperature: 0.8, maxOutputTokens: 4000 }
}),
muteHttpExceptions: true
});

if (result.error) throw new Error('Story API error: ' + result.error.message);
if (!result.candidates || result.candidates.length === 0) {
throw new Error('Story: no candidates returned (possible safety block).');
}

var rawText = result.candidates[0].content.parts[0].text;
var cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
try {
return JSON.parse(cleaned);
} catch(e) {
// Attempt repair via second Gemini call
Logger.log('Story JSON parse failed. Attempting repair...');
return repairStoryJSON(cleaned);
}
}

// ── JSON REPAIR ──────────────────────────────────────────────

function repairStoryJSON(brokenJSON) {
var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + CONFIG.STORY_MODEL + ':generateContent?key=' + CONFIG.GEMINI_API_KEY;

var repairPrompt = 'The following JSON is malformed. Fix it and return ONLY valid JSON. ' +
'Do not add any text before or after the JSON. Do not wrap in markdown.\n\n' + brokenJSON;

var result = safeFetch(url, {
method: 'POST',
contentType: 'application/json',
payload: JSON.stringify({
contents: [{ parts: [{ text: repairPrompt }] }],
generationConfig: { temperature: 0.1, maxOutputTokens: 4000 }
}),
muteHttpExceptions: true
});

if (!result.candidates || result.candidates.length === 0) {
throw new Error('JSON repair failed: no candidates returned.');
}

var repaired = result.candidates[0].content.parts[0].text;
repaired = repaired.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

try {
var parsed = JSON.parse(repaired);
Logger.log('JSON repair succeeded.');
return parsed;
} catch(e) {
Logger.log('JSON repair also failed. Raw: ' + repaired.substring(0, 500));
throw new Error('Story JSON parse failed even after repair: ' + e.message);
}
}

// ── v6: POST-GENERATION AUDIT ─────────────────────────────────

function auditStoryText_(storyData, character) {
  var issues = [];
  var allText = '';
  var scenes = storyData.scenes || [];
  for (var i = 0; i < scenes.length; i++) {
    allText += (scenes[i].text || '') + ' ';
  }
  allText = allText.trim();

  // Banned word check
  var lower = allText.toLowerCase();
  for (var b = 0; b < BANNED_WORDS.length; b++) {
    if (lower.indexOf(BANNED_WORDS[b]) !== -1) {
      issues.push('FLAG: Banned word "' + BANNED_WORDS[b] + '" found');
    }
  }

  // Average sentence length check
  var sentences = allText.split(/[.!?]+/).filter(function(s) { return s.trim().length > 0; });
  var totalWords = 0;
  for (var s = 0; s < sentences.length; s++) {
    totalWords += sentences[s].trim().split(/\s+/).length;
  }
  var avgSentLen = sentences.length > 0 ? Math.round(totalWords / sentences.length) : 0;
  var maxSentLen = character === 'JJ' ? 10 : (character === 'Both' ? 14 : 16);
  if (avgSentLen > maxSentLen) {
    issues.push('WARN: Average sentence length ' + avgSentLen + ' words (target: <' + maxSentLen + ' for ' + character + ')');
  }

  // Canon check — JJ must have headband/unicorn reference
  if (character === 'JJ' || character === 'Both') {
    if (lower.indexOf('headband') === -1 && lower.indexOf('unicorn') === -1) {
      issues.push('WARN: JJ story missing headband/unicorn reference');
    }
  }

  var result = { passed: issues.length === 0, issues: issues, avgSentenceLength: avgSentLen };
  Logger.log('Story audit: ' + (result.passed ? 'PASSED' : issues.length + ' issues') + ' — avg sentence: ' + avgSentLen + ' words');
  for (var j = 0; j < issues.length; j++) {
    Logger.log('  ' + issues[j]);
  }
  return result;
}

// v6: Build image prompt with wardrobe map based on setting
function buildWardrobePrompt_(charNames, setting) {
  var prompt = '';
  for (var i = 0; i < charNames.length; i++) {
    var key = charNames[i].toLowerCase();
    if (key === 'nathan') key = 'buggsy';
    if (key === 'lt') key = 'mom';
    if (key === 'jt') key = 'dad';
    var char = STORY_CHARACTERS[key];
    if (!char) continue;
    var outfit;
    if (setting === 'casual' && char.casual_pool) {
      outfit = char.casual_pool[Math.floor(Math.random() * char.casual_pool.length)];
    } else {
      outfit = (char.wardrobe && char.wardrobe[setting]) || char.default_outfit;
    }
    prompt += 'CHARACTER: ' + charNames[i] + ' — ' + char.physical + '. Wearing: ' + outfit + '.\n';
  }
  return prompt;
}

// ── PHASE 4: EXTRACT CANON AFTER GENERATION ──────────────────

function extractCanonFromStory(storyData) {
var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + CONFIG.STORY_MODEL + ':generateContent?key=' + CONFIG.GEMINI_API_KEY;

var storyText = '';
for (var i = 0; i < storyData.scenes.length; i++) {
storyText += 'Scene ' + (i + 1) + ': ' + storyData.scenes[i].text + '\n';
}

var prompt = 'You just wrote a children\'s bedtime story called "' + storyData.title + '" ' +
'featuring ' + storyData.character + '.\n\n' +
'FULL STORY:\n' + storyText + '\n\n' +
'Extract the following and return ONLY valid JSON, NO markdown, NO backticks:\n' +
'{\n' +
'  "summary": "Short summary UNDER 80 characters",\n' +
'  "proposed_canon": ["fact1", "fact2"]\n' +
'}\n\n' +
'RULES:\n' +
'- summary MUST be under 80 characters. Be brief.\n' +
'- proposed_canon: max 3 atomic, reusable facts for future stories\n' +
'- Only include durable facts (place names, character traits, recurring objects)\n' +
'- Do NOT include one-off scene details\n' +
'- Good: "JJ\'s moonlight snack stand is called Moon Bites"\n' +
'- Bad: "JJ wore pink socks on page 4"';

var result = callCanonApi_(url, prompt);
var canon = parseCanonResponse_(result);
if (canon) { canon._auditStatus = '✅ Extracted'; return canon; }

// Retry once with a simpler prompt if first attempt failed
Logger.log('Canon extraction: retrying with simplified prompt...');
var retryPrompt = 'Story: "' + storyData.title + '" featuring ' + storyData.character + '.\n' +
'Return ONLY this JSON (summary under 60 chars, max 2 facts):\n' +
'{"summary":"...","proposed_canon":["..."]}\n' +
'Story summary: ' + storyText.substring(0, 500);

var retryResult = callCanonApi_(url, retryPrompt);
var retryCanon = parseCanonResponse_(retryResult);
if (retryCanon) { retryCanon._auditStatus = '🔄 Retry success'; return retryCanon; }

Logger.log('Canon extraction: both attempts failed. Skipping.');
return { summary: '', proposed_canon: [], _auditStatus: '❌ Failed' };
}

function callCanonApi_(url, prompt) {
try {
return safeFetch(url, {
  method: 'POST',
  contentType: 'application/json',
  payload: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 500,
      responseMimeType: 'application/json'
    }
  }),
  muteHttpExceptions: true
});
} catch(e) {
Logger.log('Canon API call failed: ' + e.message);
return null;
}
}

function parseCanonResponse_(result) {
if (!result || !result.candidates || result.candidates.length === 0) return null;

var rawText = result.candidates[0].content.parts[0].text;
var cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

try {
var canon = JSON.parse(cleaned);
// Truncate summary if model still went long
if (canon.summary && canon.summary.length > 120) {
  canon.summary = canon.summary.substring(0, 117) + '...';
}
Logger.log('Canon extracted: summary="' + (canon.summary || '') + '", facts=' + (canon.proposed_canon ? canon.proposed_canon.length : 0));
return canon;
} catch(e) {
Logger.log('Canon extraction JSON failed: ' + e.message + '. Raw: ' + rawText.substring(0, 300));
return null;
}
}

// ── STEP 2: GENERATE IMAGES ─────────────────────────────────

function generateSceneImages(scenes, characters) {
var images = [];
for (var i = 0; i < scenes.length; i++) images.push(null);

var scenesToGenerate = [];
for (var j = 0; j < CONFIG.IMAGE_SCENES.length; j++) {
if (CONFIG.IMAGE_SCENES[j] < scenes.length) scenesToGenerate.push(CONFIG.IMAGE_SCENES[j]);
}

Logger.log('Generating ' + scenesToGenerate.length + ' images for scenes: ' +
scenesToGenerate.map(function(i) { return i + 1; }).join(', '));

// Download character reference images (cached per execution)
Logger.log('Fetching character reference images...');
var refImages = sf_getCharacterRefImages_(characters);
Logger.log('Reference images loaded: ' + refImages.length);

// Build character lookup for scene-level filtering
var charVisualMap = {};
var charRefMap = {};
for (var ci = 0; ci < characters.length; ci++) {
var charName = characters[ci].name.split(' ')[0].toUpperCase(); // "JJ", "BUGGSY", "MOM", "DAD"
charVisualMap[charName] = 'CHARACTER: ' + characters[ci].visualTraits;
// Match ref images by name
for (var ri = 0; ri < refImages.length; ri++) {
if (refImages[ri].name.toUpperCase() === charName || refImages[ri].name === characters[ci].name) {
charRefMap[charName] = refImages[ri];
}
}
}

var successCount = 0;
for (var idx = 0; idx < scenesToGenerate.length; idx++) {
var sceneIndex = scenesToGenerate[idx];
Logger.log('Generating image for scene ' + (sceneIndex + 1) + '...');

// Scene-level character filtering
var sceneChars = scenes[sceneIndex].characters_in_scene || [];
var sceneVisuals = '';
var sceneRefImages = [];

if (sceneChars.length > 0) {
  // Use only the characters actually in this scene
  for (var sc = 0; sc < sceneChars.length; sc++) {
    var scKey = sceneChars[sc].toUpperCase().split(' ')[0];
    // Try variations: "JJ", "BUGGSY", "MOM", "DAD"
    if (scKey === 'MOM' || scKey === 'LT') scKey = 'MOM';
    if (scKey === 'DAD' || scKey === 'JT') scKey = 'DAD';
    if (scKey === 'NATHAN') scKey = 'BUGGSY';

    if (charVisualMap[scKey]) sceneVisuals += charVisualMap[scKey] + '\\n';
    if (charRefMap[scKey]) sceneRefImages.push(charRefMap[scKey]);
  }
} else {
  // Fallback: use all characters (old behavior)
  for (var allKey in charVisualMap) {
    sceneVisuals += charVisualMap[allKey] + '\\n';
  }
  sceneRefImages = refImages;
}

var fullPrompt = scenes[sceneIndex].image_prompt;
// v30: Inject local wardrobe data for setting-appropriate outfits
var _scText = (scenes[sceneIndex].text || '').toLowerCase();
var _setting = 'casual';
if (_scText.indexOf('pool') >= 0 || _scText.indexOf('swim') >= 0 || _scText.indexOf('beach') >= 0) _setting = 'beach';
else if (_scText.indexOf('school') >= 0 || _scText.indexOf('class') >= 0) _setting = 'school';
else if (_scText.indexOf('bed') >= 0 || _scText.indexOf('sleep') >= 0 || _scText.indexOf('pajama') >= 0 || _scText.indexOf('pillow') >= 0) _setting = 'bedtime';
else if (_scText.indexOf('formal') >= 0 || _scText.indexOf('church') >= 0 || _scText.indexOf('wedding') >= 0) _setting = 'formal';
else if (_scText.indexOf('sport') >= 0 || _scText.indexOf('basket') >= 0 || _scText.indexOf('soccer') >= 0) _setting = 'sports';
var _wardrobeNames = sceneChars.length > 0 ? sceneChars : ['Buggsy', 'JJ'];
var _wardrobeBlock = buildWardrobePrompt_(_wardrobeNames, _setting);
if (_wardrobeBlock) fullPrompt = _wardrobeBlock + '\\n' + fullPrompt;
if (sceneVisuals) fullPrompt = sceneVisuals + '\\n\\n' + fullPrompt;

// Add framing instructions
fullPrompt += '\\n\\nIMPORTANT: Centered composition. All characters fully visible within the frame. No cropping.';

var blob = generateWithRetry(fullPrompt, sceneIndex + 1, sceneRefImages);
images[sceneIndex] = blob;

if (blob) {
  successCount++;
  Logger.log('Scene ' + (sceneIndex + 1) + ' image OK');
} else {
  Logger.log('Scene ' + (sceneIndex + 1) + ' image failed — PDF will skip it');
}

if (idx < scenesToGenerate.length - 1) {
  Utilities.sleep(CONFIG.IMAGE_COOLDOWN);
}

}

Logger.log('Images: ' + successCount + '/' + scenesToGenerate.length);
return images;
}

function generateWithRetry(prompt, sceneNumber, refImages) {
for (var attempt = 1; attempt <= CONFIG.IMAGE_MAX_RETRIES; attempt++) {
try {
return generateGeminiImage(prompt, sceneNumber, refImages);
} catch(e) {
var msg = e.message;
var isSafetyBlock = msg.indexOf('SAFETY') >= 0 || msg.indexOf('safety') >= 0 || msg.indexOf('blocked') >= 0;

  if (isSafetyBlock) {
    Logger.log('Scene ' + sceneNumber + ' blocked by safety filter. Skipping.');
    return null;
  }

  if (attempt < CONFIG.IMAGE_MAX_RETRIES) {
    var isRateLimit = msg.indexOf('RATE_LIMITED') >= 0 || msg.indexOf('429') >= 0 || msg.indexOf('503') >= 0 || msg.indexOf('RESOURCE_EXHAUSTED') >= 0 || msg.indexOf('UNAVAILABLE') >= 0;
    var wait = isRateLimit ? CONFIG.IMAGE_RETRY_DELAY * attempt : CONFIG.IMAGE_RETRY_DELAY;
    Logger.log('Image ' + sceneNumber + ' attempt ' + attempt + ' failed: ' + msg + '. Retrying in ' + (wait / 1000) + 's...');
    Utilities.sleep(wait);
  } else {
    Logger.log('Image ' + sceneNumber + ' failed after ' + CONFIG.IMAGE_MAX_RETRIES + ' attempts: ' + msg);
  }
}

}
return null;
}

function generateGeminiImage(prompt, sceneNumber, refImages) {
var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + CONFIG.IMAGE_MODEL + ':generateContent?key=' + CONFIG.GEMINI_API_KEY;

// Build content parts: reference images first, then text prompt
var contentParts = [];

if (refImages && refImages.length > 0) {
// Add each reference image
for (var r = 0; r < refImages.length; r++) {
contentParts.push({
inlineData: {
mimeType: refImages[r].mimeType,
data: refImages[r].data
}
});
}
// Instruction to match the reference characters
contentParts.push({
text: 'The images above are CHARACTER REFERENCE sheets. ' +
'Draw these EXACT same characters in the scene below. ' +
'Match their FACES, HAIR, and BODY PROPORTIONS from the reference images. ' +
'CLOTHING should match what is described in the scene prompt — NOT the reference image clothing. ' +
'Each scene has unique outfits appropriate to the setting. ' +
'Keep the same comic book art style.\n\n' +
IMAGE_STYLE + '\n\n' + prompt
});
} else {
contentParts.push({ text: IMAGE_STYLE + '\n\n' + prompt });
}

var result = safeFetch(url, {
method: 'POST',
contentType: 'application/json',
payload: JSON.stringify({
contents: [{ parts: contentParts }],
generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
}),
muteHttpExceptions: true
});

if (result.error) throw new Error('Image error: ' + result.error.message);

if (!result.candidates || result.candidates.length === 0) {
if (result.promptFeedback && result.promptFeedback.blockReason) {
throw new Error('SAFETY blocked: ' + result.promptFeedback.blockReason);
}
throw new Error('No candidates returned');
}

var candidate = result.candidates[0];
if (candidate.finishReason === 'SAFETY') {
throw new Error('SAFETY blocked by finish reason');
}
if (!candidate.content || !candidate.content.parts) {
throw new Error('No content parts in response');
}

var parts = candidate.content.parts;
var imagePart = null;
for (var i = 0; i < parts.length; i++) {
if (parts[i].inlineData && parts[i].inlineData.mimeType && parts[i].inlineData.mimeType.indexOf('image/') === 0) {
imagePart = parts[i];
break;
}
}

if (!imagePart) throw new Error('No image part in response (' + parts.length + ' parts, all text)');

return {
data: imagePart.inlineData.data,
mimeType: imagePart.inlineData.mimeType,
sceneNumber: sceneNumber
};
}

// ── STEP 3: BUILD PDF VIA HTML + DRIVE REST API ──────────────

function buildStoryPDF(storyData, imageBlobs, bookNumber) {
var docName = 'Book ' + bookNumber + ' — ' + storyData.title;

// Build HTML document
var html = buildStoryHTML(storyData, imageBlobs, bookNumber);

var token = ScriptApp.getOAuthToken();
var metadata = JSON.stringify({
name: docName,
mimeType: 'application/vnd.google-apps.document',
parents: [CONFIG.STORY_FOLDER_ID]
});

var boundary = '-------StoryFactoryBoundary';
var requestBody =
'--' + boundary + '\r\n' +
'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
metadata + '\r\n' +
'--' + boundary + '\r\n' +
'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
html + '\r\n' +
'--' + boundary + '--';

var uploadResponse = UrlFetchApp.fetch(
'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
{
method: 'POST',
headers: { 'Authorization': 'Bearer ' + token },
contentType: 'multipart/related; boundary=' + boundary,
payload: requestBody,
muteHttpExceptions: true
}
);

var uploadCode = uploadResponse.getResponseCode();
if (uploadCode >= 400) {
throw new Error('Drive upload failed (' + uploadCode + '): ' + uploadResponse.getContentText().substring(0, 300));
}

var docId = JSON.parse(uploadResponse.getContentText()).id;
Logger.log('Temp Google Doc created: ' + docId);

// Export as PDF
var docFile = DriveApp.getFileById(docId);
var pdfBlob = docFile.getAs('application/pdf');
pdfBlob.setName(docName + '.pdf');

// Save PDF to story folder
var folder = DriveApp.getFolderById(CONFIG.STORY_FOLDER_ID);
var pdfFile = folder.createFile(pdfBlob);
pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

// Trash the temp Google Doc
docFile.setTrashed(true);

var imageCount = 0;
for (var i = 0; i < imageBlobs.length; i++) {
if (imageBlobs[i]) imageCount++;
}

Logger.log('PDF saved: ' + pdfFile.getName() + ' (' + imageCount + ' images)');
return {
fileId: pdfFile.getId(),
url: 'https://drive.google.com/file/d/' + pdfFile.getId() + '/view',
imageCount: imageCount
};
}

function buildStoryHTML(storyData, imageBlobs, bookNumber) {
var parts = [];

parts.push('<!DOCTYPE html>');
parts.push('<html><head><meta charset="utf-8">');
parts.push('<style>');
parts.push('body { font-family: Georgia, serif; max-width: 650px; margin: 0 auto; padding: 40px 30px; color: #1E293B; background: #FFE0EB; }');
parts.push('h1 { color: #7C3AED; text-align: center; font-size: 28px; margin-bottom: 4px; }');
parts.push('.subtitle { text-align: center; color: #94A3B8; font-style: italic; font-size: 15px; margin-bottom: 30px; }');
parts.push('.scene-img { display: block; margin: 20px auto; border-radius: 8px; }');
parts.push('.scene-text { font-size: 20px; line-height: 1.8; margin-bottom: 14px; }');
parts.push('.divider { border: none; border-top: 1px solid #F5C6D0; margin: 28px 0; }');
parts.push('.the-end { text-align: center; font-size: 22px; font-weight: bold; color: #EC4899; margin-top: 40px; }');
parts.push('</style>');
parts.push('</head><body>');

// Cover
parts.push('<h1>' + escapeHtml(storyData.title) + '</h1>');
parts.push('<p class="subtitle">Book #' + bookNumber + '  •  ' + escapeHtml(storyData.character) + '  •  A Bedtime Story</p>');
parts.push('<hr class="divider">');

// Scenes
for (var i = 0; i < storyData.scenes.length; i++) {
var scene = storyData.scenes[i];

if (imageBlobs[i] && imageBlobs[i].data) {
  var dataUri = 'data:' + imageBlobs[i].mimeType + ';base64,' + imageBlobs[i].data;
  parts.push('<img class="scene-img" src="' + dataUri + '" width="380" alt="Scene ' + (i + 1) + '">');
}

parts.push('<p class="scene-text">' + escapeHtml(scene.text) + '</p>');

if (i < storyData.scenes.length - 1) {
  parts.push('<hr class="divider">');
}

}

// The End
parts.push('<hr class="divider">');
parts.push('<p class="the-end">The End</p>');
parts.push('</body></html>');
return parts.join('\n');
}

function escapeHtml(text) {
return text
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;');
}

// ── STEP 4: BUILD NOTION CATALOGUE PAGE ──────────────────────

function buildNotionCataloguePage(storyData, pdfUrl, bookNumber, canonData, tone) {
var blocks = [
{
object: 'block', type: 'heading_1',
heading_1: { rich_text: [{ type: 'text', text: { content: storyData.title } }] }
},
{
object: 'block', type: 'paragraph',
paragraph: { rich_text: [{ type: 'text', text: { content: 'Book #' + bookNumber + ' • ' + storyData.character }, annotations: { italic: true, color: 'gray' } }] }
},
{ object: 'block', type: 'divider', divider: {} },
{
object: 'block', type: 'callout',
callout: {
rich_text: [
{ type: 'text', text: { content: 'Tap to read the full story → ' } },
{ type: 'text', text: { content: 'Open Story PDF', link: { url: pdfUrl } }, annotations: { bold: true, color: 'purple' } }
],
icon: { type: 'emoji', emoji: '📚' },
color: 'purple_background'
}
},
{ object: 'block', type: 'paragraph', paragraph: { rich_text: [] } },
{
object: 'block', type: 'heading_3',
heading_3: { rich_text: [{ type: 'text', text: { content: 'Story Preview' } }] }
},
{
object: 'block', type: 'paragraph',
paragraph: { rich_text: [{ type: 'text', text: { content: storyData.scenes[0].text }, annotations: { italic: true } }] }
},
{
object: 'block', type: 'paragraph',
paragraph: { rich_text: [{ type: 'text', text: { content: '... open the PDF to read the full story!' }, annotations: { italic: true, color: 'gray' } }] }
},
];

// Add proposed canon to the page if we have any
if (canonData && canonData.proposed_canon && canonData.proposed_canon.length > 0) {
blocks.push({ object: 'block', type: 'divider', divider: {} });
blocks.push({
object: 'block', type: 'heading_3',
heading_3: { rich_text: [{ type: 'text', text: { content: '📜 Proposed Canon (review & approve)' } }] }
});
for (var ci = 0; ci < canonData.proposed_canon.length; ci++) {
blocks.push({
object: 'block', type: 'bulleted_list_item',
bulleted_list_item: { rich_text: [{ type: 'text', text: { content: canonData.proposed_canon[ci] } }] }
});
}
}

// Build properties including new memory fields
var properties = {
'Story Title': { title: [{ type: 'text', text: { content: storyData.title } }] },
'Book Number':  { number: bookNumber },
'Character':    { select: { name: storyData.character } },
'Topic':        { rich_text: [{ type: 'text', text: { content: storyData.topic || '' } }] },
'Status':       { select: { name: 'Ready' } },
'Story Link':   { url: pdfUrl }
};

// Add memory fields
if (canonData && canonData.summary) {
properties['Summary'] = { rich_text: [{ type: 'text', text: { content: canonData.summary } }] };
}
if (canonData && canonData.proposed_canon && canonData.proposed_canon.length > 0) {
properties['Proposed Canon'] = { rich_text: [{ type: 'text', text: { content: canonData.proposed_canon.join('\n') } }] };
}
// Canon Approved defaults to unchecked — parent reviews and approves
properties['Canon Approved'] = { checkbox: false };

// Audit stamp — canon extraction result
var auditStatus = (canonData && canonData._auditStatus) ? canonData._auditStatus : '⚠️ Unknown';
properties['Notes'] = { rich_text: [{ type: 'text', text: { content: 'Canon: ' + auditStatus } }] };

if (tone) {
properties['Tone'] = { select: { name: tone } };
}

var result = notionPost('pages', {
parent: { database_id: CONFIG.STORY_DB_ID },
icon: { type: 'emoji', emoji: '📚' },
properties: properties,
children: blocks
});

if (result.object === 'error') throw new Error('Notion error: ' + result.message);
return result.url;
}

// ── UPDATE NOTION ROW ────────────────────────────────────────

function updateNotionRow(pageId, storyLink, status) {
var payload = { properties: { 'Status': { select: { name: status } } } };
if (storyLink) payload.properties['Story Link'] = { url: storyLink };

notionPatch('pages/' + pageId, payload);
}

// ── GET NEXT BOOK NUMBER ─────────────────────────────────────

function getNextBookNumber() {
var result = notionPost('databases/' + CONFIG.STORY_DB_ID + '/query', {
sorts: [{ property: 'Book Number', direction: 'descending' }],
page_size: 1
});

if (result.results && result.results.length > 0) {
var lastNum = result.results[0].properties['Book Number'];
return (lastNum && lastNum.number ? lastNum.number : 0) + 1;
}
return 7;
}

// ── MAIN PIPELINE ────────────────────────────────────────────

function runStoryFactory(topic, character, tone) {
Logger.log('=== Story Factory v8.0 ===');
Logger.log('Topic: ' + topic + ' | Character: ' + character + ' | Tone: ' + (tone || 'Funny'));

try {
// Config validation — fail fast with clear message
if (!CONFIG.GEMINI_API_KEY) {
throw new Error('GEMINI_API_KEY not configured. Set "JJ Stories" in Script Properties.');
}
if (!CONFIG.NOTION_TOKEN) {
throw new Error('NOTION_TOKEN not configured. Set "NOTION_TOKEN" in Script Properties.');
}

// Clear ref image cache from any prior execution on this instance
_refImageCache = {};

// Input validation
if (!topic || String(topic).trim().length === 0) {
throw new Error('Story topic is required.');
}
if (String(topic).length > 500) {
topic = String(topic).substring(0, 500);
Logger.log('Topic trimmed to 500 chars.');
}
topic = String(topic).trim();

// Phase 1: Fetch character truth from Notion
Logger.log('Step 0: Fetching character data from Notion...');
var characters = sf_getCharacterFromNotion_(character);
if (characters.length === 0) {
Logger.log('WARNING: No characters found in Notion DB. Check Characters database.');
throw new Error('No active characters found in Notion for: ' + character);
}

// Phase 2: Fetch story memory
Logger.log('Step 0b: Fetching story memory...');
var recentStories = sf_getRecentStories_(character);
var canonFacts = sf_getCanonFacts_(character);

// Step 1: Generate story with memory
Logger.log('Step 1: Generating story with memory injection...');
var storyData = generateStory(topic, character, tone || 'Funny', characters, recentStories, canonFacts);
storyData.topic = topic;
Logger.log('Story: "' + storyData.title + '" (' + storyData.scenes.length + ' scenes)');

// v6: Post-generation audit
var audit = auditStoryText_(storyData, character);
storyData._audit = audit;

// Phase 4: Extract canon from the generated story
Logger.log('Step 1b: Extracting canon from story...');
var canonData = extractCanonFromStory(storyData);

// Step 2: Generate images with scene-level character filtering
Logger.log('Step 2: Generating images...');
var imageBlobs = generateSceneImages(storyData.scenes, characters);

var bookNumber = getNextBookNumber();
Logger.log('Step 3: Building PDF for Book #' + bookNumber + '...');
var pdf = buildStoryPDF(storyData, imageBlobs, bookNumber);
Logger.log('PDF: ' + pdf.url);

Logger.log('Step 4: Creating Notion page with canon data...');
var notionUrl = buildNotionCataloguePage(storyData, pdf.url, bookNumber, canonData, tone || 'Funny');
Logger.log('Notion: ' + notionUrl);

Logger.log('DONE! Book #' + bookNumber + ': "' + storyData.title + '"');
Logger.log('Summary: ' + (canonData.summary || '(none)'));
Logger.log('Proposed canon: ' + (canonData.proposed_canon ? canonData.proposed_canon.length : 0) + ' facts');
Logger.log('Canon audit: ' + (canonData._auditStatus || 'unknown'));
return { success: true, title: storyData.title, pdfUrl: pdf.url, notionUrl: notionUrl, bookNumber: bookNumber };

} catch(e) {
Logger.log('FAILED: ' + e.message);
Logger.log('Stack: ' + e.stack);
sf_logError_('runStoryFactory', e);
return { success: false, error: e.message };
}
}

// ── POLL NOTION FOR NEW REQUESTS ─────────────────────────────

function pollForNewStories() {
// Circuit breaker — stop hammering if Gemini is down
var props = PropertiesService.getScriptProperties();
var consecutiveFails = parseInt(props.getProperty('SF_CONSECUTIVE_FAILS') || '0');
var pausedUntil = parseInt(props.getProperty('SF_PAUSED_UNTIL') || '0');
if (pausedUntil > 0 && Date.now() < pausedUntil) {
Logger.log('Circuit breaker OPEN — paused until ' + new Date(pausedUntil).toISOString() + '. Skipping poll.');
return;
}
if (pausedUntil > 0 && Date.now() >= pausedUntil) {
props.deleteProperty('SF_PAUSED_UNTIL');
props.setProperty('SF_CONSECUTIVE_FAILS', '0');
consecutiveFails = 0;
Logger.log('Circuit breaker RESET — resuming polls.');
}

if (CONFIG.ENFORCE_OFF_PEAK) {
var now = new Date();
var cstString = Utilities.formatDate(now, 'America/Chicago', 'H');
var hour = parseInt(cstString, 10);
var isOffPeak = CONFIG.OFF_PEAK_START > CONFIG.OFF_PEAK_END
? (hour >= CONFIG.OFF_PEAK_START || hour < CONFIG.OFF_PEAK_END)
: (hour >= CONFIG.OFF_PEAK_START && hour < CONFIG.OFF_PEAK_END);
if (!isOffPeak) {
Logger.log('Skipping — outside off-peak. CST hour: ' + hour);
return;
}
}

Logger.log('Polling for new story requests...');
var result = notionPost('databases/' + CONFIG.STORY_DB_ID + '/query', {
filter: { property: 'Status', select: { equals: 'Idea' } }
});

if (!result.results || result.results.length === 0) {
Logger.log('No new requests.');
return;
}

Logger.log('Found ' + result.results.length + ' request(s)');

var page = result.results[0];
var pageId = page.id;
var topic = getNotionText(page.properties['Topic'], 'rich_text') || 'A new adventure';
var character = (page.properties['Character'] && page.properties['Character'].select)
? page.properties['Character'].select.name
: 'JJ';
var tone = (page.properties['Tone'] && page.properties['Tone'].select)
? page.properties['Tone'].select.name
: 'Funny';

updateNotionRow(pageId, null, 'Generating');
var r = runStoryFactory(topic, character, tone);

if (r.success) {
updateNotionRow(pageId, r.pdfUrl, 'Ready');
props.setProperty('SF_CONSECUTIVE_FAILS', '0');
} else {
updateNotionRow(pageId, null, 'Failed');
Logger.log('Set to Failed. Change to Idea manually to retry.');
consecutiveFails++;
props.setProperty('SF_CONSECUTIVE_FAILS', String(consecutiveFails));
if (consecutiveFails >= 3) {
var pauseDuration = 3600000; // 1 hour
props.setProperty('SF_PAUSED_UNTIL', String(Date.now() + pauseDuration));
Logger.log('Circuit breaker TRIPPED — ' + consecutiveFails + ' consecutive failures. Pausing for 1 hour.');
}
}
}

// ── INSTALL TRIGGER ──────────────────────────────────────────

function installTrigger() {
var triggers = ScriptApp.getProjectTriggers();
for (var i = 0; i < triggers.length; i++) {
if (triggers[i].getHandlerFunction() === 'pollForNewStories') {
ScriptApp.deleteTrigger(triggers[i]);
}
}
ScriptApp.newTrigger('pollForNewStories').timeBased().everyMinutes(5).create();
Logger.log('Trigger installed — polling every 5 minutes.');
}

// ── TEST: Full pipeline ──────────────────────────────────────

function testFactory() {
var result = runStoryFactory(
'JJ goes to the grocery store and ends up running the whole place',
'JJ',
'Funny'
);
Logger.log(JSON.stringify(result, null, 2));
}

// ── TEST: PDF only ───────────────────────────────────────────

function testPDFOnly() {
Logger.log('=== Testing PDF creation only ===');

var fakeStory = {
title: 'JJ and the Test Book',
character: 'JJ',
topic: 'Testing',
scenes: [
{ scene_number: 1, text: 'Scene 1: JJ walked into the kitchen with a plan.', image_prompt: '', characters_in_scene: ['JJ'] },
{ scene_number: 2, text: 'Scene 2: The plan was simple. Take over.', image_prompt: '', characters_in_scene: ['JJ'] },
{ scene_number: 3, text: 'Scene 3: Everyone agreed this was reasonable.', image_prompt: '', characters_in_scene: ['JJ', 'Mom'] },
{ scene_number: 4, text: 'Scene 4: JJ made announcements from the counter.', image_prompt: '', characters_in_scene: ['JJ'] },
{ scene_number: 5, text: 'Scene 5: Dad said VICTORY.', image_prompt: '', characters_in_scene: ['Dad'] },
{ scene_number: 6, text: 'Scene 6: JJ fell asleep before the car left the driveway.', image_prompt: '', characters_in_scene: ['JJ'] }
]
};

try {
var characters = sf_getCharacterFromNotion_('JJ');
Logger.log('Characters loaded: ' + characters.length);
var pdf = buildStoryPDF(fakeStory, [null, null, null, null, null, null], 0);
Logger.log('SUCCESS! PDF: ' + pdf.url);
} catch(e) {
Logger.log('FAILED: ' + e.message);
Logger.log('Stack: ' + e.stack);
}
}

// ── TEST: Memory fetch only ──────────────────────────────────

function testMemoryFetch() {
Logger.log('=== Testing Memory Fetch ===');

Logger.log('--- Characters ---');
var chars = sf_getCharacterFromNotion_('Whole Family');
for (var i = 0; i < chars.length; i++) {
Logger.log(chars[i].name + ': ' + chars[i].narrativeTraits.substring(0, 80) + '...');
}

Logger.log('--- Recent Stories ---');
var stories = sf_getRecentStories_('JJ');
for (var j = 0; j < stories.length; j++) {
Logger.log(stories[j]);
}

Logger.log('--- Canon Facts ---');
var facts = sf_getCanonFacts_('JJ');
for (var k = 0; k < facts.length; k++) {
Logger.log(facts[k]);
}

Logger.log('=== Memory Fetch Complete ===');
}

// ── v8: LIST STORED STORIES FROM SCRIPT PROPERTIES ──────────────
// Stories are stored as JSON in Script Properties with keys like STORY_<key>.
// Each property value is a JSON string: { title, character, scenes: [...], vocab: [...], wordCount, ... }
// Returns an array of story metadata objects for the Story Library UI.

function listStoredStories() {
  var props = PropertiesService.getScriptProperties().getProperties();
  var stories = [];

  var keys = Object.keys(props);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key.indexOf('STORY_') !== 0) continue;

    try {
      var data = JSON.parse(props[key]);
      var sceneCount = (data.scenes && data.scenes.length) ? data.scenes.length : 0;
      var vocabList = data.vocab || data.vocabulary || [];
      var wordCount = data.wordCount || 0;

      // If wordCount not pre-computed, estimate from scene text
      if (!wordCount && data.scenes) {
        for (var s = 0; s < data.scenes.length; s++) {
          var txt = data.scenes[s].text || '';
          wordCount += txt.split(/\s+/).length;
        }
      }

      stories.push({
        storyKey: key,
        title: data.title || 'Untitled Story',
        character: data.character || 'Unknown',
        sceneCount: sceneCount,
        vocabWords: vocabList,
        wordCount: wordCount,
        tone: data.tone || '',
        topic: data.topic || ''
      });
    } catch (e) {
      Logger.log('listStoredStories: skipped malformed property ' + key + ': ' + e.message);
    }
  }

  // Sort by title alphabetically
  stories.sort(function(a, b) {
    return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
  });

  return stories;
}


// ── v8: GET SINGLE STORY FROM SCRIPT PROPERTIES ─────────────────
// Returns the full story JSON for a given key, or null if not found.

function getStoredStory(storyKey) {
  var val = PropertiesService.getScriptProperties().getProperty(storyKey);
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch (e) {
    Logger.log('getStoredStory: malformed JSON for ' + storyKey + ': ' + e.message);
    return null;
  }
}

// ── v8: STORY READER — Serve stories for StoryReader.html ──────

/**
 * v8: Story index — maps story keys to file metadata.
 * Stories live in the stories/ folder (repo) and are loaded via
 * ScriptProperties or Drive. This index is the single source of truth
 * for what the reader can serve.
 */
var STORY_INDEX = {
  'week1-jj-garden-mystery': {
    title: "JJ and GranniePoo's Garden Mystery",
    character: 'JJ',
    type: 'vocabulary_bedtime',
    week: 1,
    propertyKey: 'STORY_week1_jj_garden_mystery'
  }
};

/**
 * v8: Serve a story to StoryReader.html.
 * Loads from ScriptProperties (JSON stored as string).
 * Returns story JSON object or { error: message }.
 */
function getStoryForReader(storyKey) {
  return withMonitor_('getStoryForReader', function() {
    if (!storyKey || !STORY_INDEX[storyKey]) {
      return { error: 'Story not found: ' + storyKey };
    }
    var meta = STORY_INDEX[storyKey];
    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty(meta.propertyKey);
    if (!raw) {
      return { error: 'Story data not loaded. Run loadStoryToProps("' + storyKey + '") first.' };
    }
    return JSON.parse(raw);
  });
}

/**
 * v8: Load a story JSON from the stories/ folder in Drive into ScriptProperties.
 * Run once per story after adding the JSON file to the repo.
 * storyKey must match a key in STORY_INDEX.
 * jsonString: the full JSON content as a string.
 */
function loadStoryToProps(storyKey, jsonString) {
  if (!STORY_INDEX[storyKey]) {
    Logger.log('loadStoryToProps: Unknown story key: ' + storyKey);
    return 'ERROR: Unknown story key';
  }
  var meta = STORY_INDEX[storyKey];
  // Validate JSON
  try {
    JSON.parse(jsonString);
  } catch (e) {
    Logger.log('loadStoryToProps: Invalid JSON — ' + e.message);
    return 'ERROR: Invalid JSON';
  }
  PropertiesService.getScriptProperties().setProperty(meta.propertyKey, jsonString);
  Logger.log('loadStoryToProps: Stored ' + storyKey + ' (' + jsonString.length + ' chars)');
  return 'OK: ' + storyKey + ' loaded (' + jsonString.length + ' chars)';
}

/**
 * v8: List all available stories for the reader.
 * Returns array of { key, title, character, type, week, loaded }.
 */
function listStoriesForReader() {
  var props = PropertiesService.getScriptProperties();
  var keys = Object.keys(STORY_INDEX);
  var result = [];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var meta = STORY_INDEX[k];
    result.push({
      key: k,
      title: meta.title,
      character: meta.character,
      type: meta.type,
      week: meta.week,
      loaded: !!props.getProperty(meta.propertyKey)
    });
  }
  return result;
}

/**
 * v8: Generate scene images for a stored story via Gemini.
 * storyKey: key from STORY_INDEX (story must be loaded in props).
 * Returns { success: true, imageCount: N } or { error: message }.
 */
function generateStoryImages(storyKey) {
  return withMonitor_('generateStoryImages', function() {
    if (!STORY_INDEX[storyKey]) {
      return { error: 'Unknown story key: ' + storyKey };
    }
    var raw = PropertiesService.getScriptProperties().getProperty(STORY_INDEX[storyKey].propertyKey);
    if (!raw) {
      return { error: 'Story not loaded in props' };
    }
    var storyData = JSON.parse(raw);
    var characters = sf_getCharacterFromNotion_(storyData.character);

    Logger.log('generateStoryImages: Generating images for "' + storyData.title + '"');
    var imageBlobs = generateSceneImages(storyData.scenes, characters);

    // Store images in Drive story folder
    var folder = DriveApp.getFolderById(CONFIG.STORY_FOLDER_ID);
    var storyFolder;
    var folders = folder.getFoldersByName(storyKey);
    if (folders.hasNext()) {
      storyFolder = folders.next();
    } else {
      storyFolder = folder.createFolder(storyKey);
    }

    var stored = 0;
    for (var i = 0; i < imageBlobs.length; i++) {
      if (imageBlobs[i] && imageBlobs[i].data) {
        var blob = Utilities.newBlob(
          Utilities.base64Decode(imageBlobs[i].data),
          imageBlobs[i].mimeType,
          'scene-' + (i + 1) + '.png'
        );
        storyFolder.createFile(blob);
        stored++;
      }
    }

    Logger.log('generateStoryImages: Stored ' + stored + ' images in Drive/' + storyKey);
    return { success: true, imageCount: stored, folderId: storyFolder.getId() };
  });
}

/**
 * v8: Get scene images for a story (base64 map).
 * Returns { 'scene-1': base64, 'scene-2': base64, ... } or empty if no images yet.
 */
function getStoryImages(storyKey) {
  return withMonitor_('getStoryImages', function() {
    var folder = DriveApp.getFolderById(CONFIG.STORY_FOLDER_ID);
    var folders = folder.getFoldersByName(storyKey);
    if (!folders.hasNext()) return {};
    var storyFolder = folders.next();
    var files = storyFolder.getFiles();
    var result = {};
    while (files.hasNext()) {
      var f = files.next();
      var name = f.getName().replace('.png', '').replace('.jpg', '');
      try {
        result[name] = Utilities.base64Encode(f.getBlob().getBytes());
      } catch (e) {
        Logger.log('getStoryImages: Failed to read ' + f.getName() + ': ' + e.message);
      }
    }
    return JSON.parse(JSON.stringify(result));
  });
}

// ── AUTHORIZE DRIVE (run once) ──

function authorizeDrive() {
var folder = DriveApp.getFolderById(CONFIG.STORY_FOLDER_ID);
Logger.log('Drive authorized! Folder: ' + folder.getName());
}

// ════════════════════════════════════════════════════════════════════
// END OF FILE — StoryFactory v10
// ════════════════════════════════════════════════════════════════════