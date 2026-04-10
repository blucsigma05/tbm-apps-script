// Version history tracked in Notion deploy page. Do not add version comments here.
// ════════════════════════════════════════════════════════════════════
// ActivityStoryPacks.gs v1 — Pre-authored story packs for SparkleLearning audio_story
// WRITES TO: (none — read-only module)
// READS FROM: (none — static constant)
// ════════════════════════════════════════════════════════════════════
// PURPOSE: Supply the story/question/answer/options fields for JJ's
//   curriculum audio_story activities. Consumed by Kidshub.js
//   getTodayContent_() which mutates matching activities in place before
//   returning to SparkleLearning.html.
//
// CONSUMER: SparkleLearning.html renderAudioStory() (line 2473)
// DATA FLOW: CurriculumSeed storyId → ACTIVITY_STORY_PACKS[storyId] →
//   activity.{story, question, answer, options} → renderAudioStory
//
// NOT TO BE CONFUSED WITH: StoryFactory.js STORY_INDEX which owns
//   full-scene vocabulary_bedtime stories served by StoryReader.html.
//   Audio-story packs are a different shape for a different renderer.
// ════════════════════════════════════════════════════════════════════

function getActivityStoryPacksVersion() { return 1; }

var ACTIVITY_STORY_PACKS = {
  'jj-kitchen': {
    title: "JJ's Kitchen",
    story: "JJ walks into the kitchen for a snack. Daddy asks if she wants ice cream. JJ smiles and nods and holds up three fingers. Daddy scoops one, two, three big scoops into her bowl. JJ takes a big blue spoon and says thank you, Daddy!",
    question: "How many scoops of ice cream did Daddy give JJ?",
    answer: "Three",
    options: ["Three", "One", "Five"]
  },
  'jj-buggsy-treasure': {
    title: "JJ and Buggsy's Treasure Hunt",
    story: "JJ and Buggsy find a map in the yard. The map shows a treasure hunt! They follow the yellow arrows and look for stars. Under the rectangle rock they find one, two, three, four, five shiny treasures. Buggsy gives JJ a big hug!",
    question: "How many treasures did JJ and Buggsy find?",
    answer: "Five",
    options: ["Five", "Two", "Three"]
  },
  'jj-buggsy-rainy': {
    title: "JJ and Buggsy's Rainy Day",
    story: "It is raining and JJ and Buggsy can not go outside. Buggsy has a big idea to build a blanket fort. They pick a green blanket and drape it over two chairs. JJ puts heart pillows inside and Buggsy brings snacks. The green fort is the best rainy day ever!",
    question: "What color was JJ and Buggsy's blanket fort?",
    answer: "Green",
    options: ["Green", "Red", "Blue"]
  }
};

/**
 * Look up an activity story pack by storyId.
 * Returns the pack object (title + story + question + answer + options)
 * or null if the storyId is unknown.
 */
function getActivityStoryPack_(storyId) {
  if (!storyId || typeof storyId !== 'string') return null;
  var pack = ACTIVITY_STORY_PACKS[storyId];
  if (!pack) return null;
  // Return a shallow copy so callers can't mutate the master constant.
  return {
    title: pack.title,
    story: pack.story,
    question: pack.question,
    answer: pack.answer,
    options: pack.options.slice()
  };
}

/**
 * Safe wrapper — returns a JSON-round-tripped copy.
 * Whitelisted in Code.js serveData API_WHITELIST. Registered in
 * Tbmsmoketest.js CANONICAL_SAFE_FUNCTIONS. Callable from HTML via
 * google.script.run but the typical consumer is server-side
 * getTodayContent_() which calls the underscore variant directly.
 *
 * Returns:
 *   { ok: true,  pack: {title, story, question, answer, options} } — on hit
 *   { ok: false, error: 'unknown_story_id', storyId: '...' }       — on miss
 */
function getActivityStoryPackSafe(storyId) {
  return withMonitor_('getActivityStoryPackSafe', function() {
    var pack = getActivityStoryPack_(storyId);
    if (!pack) {
      return { ok: false, error: 'unknown_story_id', storyId: storyId || null };
    }
    return JSON.parse(JSON.stringify({ ok: true, pack: pack }));
  });
}

// END OF FILE — ActivityStoryPacks.gs v1
