/**
 * add-spelling-audio.js
 *
 * Appends Marco pronunciation clips for all 450 spelling catalog words
 * to phrases.json. Run once, then run generate-audio.js.
 *
 * Usage: node scripts/add-spelling-audio.js
 */

var fs = require('fs');
var path = require('path');

var PHRASES_PATH = path.join(__dirname, '..', 'phrases.json');
var CATALOG_PATH = path.join(__dirname, '..', 'spelling-catalog.json');

var phrases = JSON.parse(fs.readFileSync(PHRASES_PATH, 'utf8'));
var catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

var tiers = ['one_bee', 'two_bee', 'three_bee', 'extras'];
var added = 0;
var skipped = 0;

var existingIds = {};
phrases.clips.forEach(function(c) { existingIds[c.id] = true; });

tiers.forEach(function(tier) {
  var words = catalog[tier];
  if (!words || !words.length) return;

  words.forEach(function(entry) {
    var word = entry.word.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    var id = 'buggsy_spell_word_' + word;

    if (existingIds[id]) {
      skipped++;
      return;
    }

    phrases.clips.push({
      id: id,
      kid: 'buggsy',
      category: 'Spelling',
      text: '[clear] ' + entry.word,
      model: 'v3',
      file: 'buggsy/spelling/' + id + '.mp3'
    });

    existingIds[id] = true;
    added++;
  });
});

fs.writeFileSync(PHRASES_PATH, JSON.stringify(phrases, null, 2));
console.log('Done. Added: ' + added + ', Skipped (already existed): ' + skipped);
console.log('Total clips now: ' + phrases.clips.length);
