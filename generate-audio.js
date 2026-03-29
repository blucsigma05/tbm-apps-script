#!/usr/bin/env node

/**
 * ElevenLabs Audio Generator v2 — Notion-Driven
 * Thompson Education Platform — JJ + Buggsy
 * 
 * Reads clip definitions from phrases.json (source of truth).
 * To add clips: add entries to phrases.json or Notion Audio Clip Queue.
 * Re-run to generate only new/missing clips (existing files skipped).
 * 
 * Usage: node generate-audio.js [--kid jj|buggsy] [--category Letter|Hype|...]
 */

var fs = require('fs');
var path = require('path');
var https = require('https');

// ═══════════════════════════════════════════════
// LOAD CONFIG + PHRASES
// ═══════════════════════════════════════════════

var configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('ERROR: config.json not found in ' + __dirname);
  console.error('Create config.json with: { "apiKey": "...", "jjVoiceId": "...", "bugsyVoiceId": "..." }');
  process.exit(1);
}
var creds = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

if (!creds.apiKey || creds.apiKey.indexOf('YOUR_') === 0) {
  console.error('ERROR: Set your API key in config.json');
  process.exit(1);
}

var phrasesPath = path.join(__dirname, 'phrases.json');
if (!fs.existsSync(phrasesPath)) {
  console.error('ERROR: phrases.json not found in ' + __dirname);
  process.exit(1);
}
var phrases = JSON.parse(fs.readFileSync(phrasesPath, 'utf-8'));

// ═══════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════

var V3_SETTINGS = {
  stability: 0.50,
  similarity_boost: 0.78,
  style: 0.40,
  use_speaker_boost: true
};

var PHONICS_SETTINGS = {
  stability: 0.70,
  similarity_boost: 0.85,
  style: 0.15,
  use_speaker_boost: true
};

var OUTPUT_DIR = './output';
var DELAY = 800; // ms between API calls

// ═══════════════════════════════════════════════
// CLI FILTERS — optional --kid and --category
// ═══════════════════════════════════════════════

var args = process.argv.slice(2);
var filterKid = null;
var filterCategory = null;

for (var a = 0; a < args.length; a++) {
  if (args[a] === '--kid' && args[a + 1]) { filterKid = args[a + 1].toLowerCase(); a++; }
  if (args[a] === '--category' && args[a + 1]) { filterCategory = args[a + 1]; a++; }
}

// ═══════════════════════════════════════════════
// BUILD CLIP LIST from phrases.json
// ═══════════════════════════════════════════════

function buildClipList() {
  var clips = phrases.clips;
  var models = phrases._meta.models;

  // Apply CLI filters
  if (filterKid) { clips = clips.filter(function(c) { return c.kid === filterKid; }); }
  if (filterCategory) { clips = clips.filter(function(c) { return c.category === filterCategory; }); }

  // Resolve model shorthand to full model ID
  return clips.map(function(c) {
    return {
      file: c.file,
      text: c.text,
      voice: c.kid,
      model: models[c.model] || c.model,
      stg: c.model === 'flash' ? 'phonics' : 'v3'
    };
  });
}

// ═══════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════

function generateClip(clip) {
  return new Promise(function(resolve, reject) {
    var voiceId = clip.voice === 'jj'
      ? (creds.jjVoiceId || phrases._meta.voices.jj.voiceId)
      : (creds.bugsyVoiceId || phrases._meta.voices.buggsy.voiceId);
    var settings = clip.stg === 'phonics' ? PHONICS_SETTINGS : V3_SETTINGS;

    var body = JSON.stringify({
      text: clip.text,
      model_id: clip.model,
      voice_settings: settings
    });

    var options = {
      hostname: 'api.elevenlabs.io', port: 443,
      path: '/v1/text-to-speech/' + voiceId,
      method: 'POST',
      headers: {
        'xi-api-key': creds.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    var req = https.request(options, function(res) {
      if (res.statusCode !== 200) {
        var errData = '';
        res.on('data', function(d) { errData += d; });
        res.on('end', function() { reject(new Error('HTTP ' + res.statusCode + ': ' + errData)); });
        return;
      }
      var outPath = path.join(OUTPUT_DIR, clip.file);
      var dir = path.dirname(outPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      var fileStream = fs.createWriteStream(outPath);
      res.pipe(fileStream);
      fileStream.on('finish', function() { fileStream.close(); resolve(outPath); });
      fileStream.on('error', function(err) { reject(err); });
    });

    req.on('error', function(err) { reject(err); });
    req.write(body);
    req.end();
  });
}

// ═══════════════════════════════════════════════
// RUNNER
// ═══════════════════════════════════════════════

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

async function run() {
  var clips = buildClipList();

  if (clips.length === 0) {
    console.log('No clips match filters. Check --kid / --category values.');
    return;
  }

  var jjn = clips.filter(function(c) { return c.voice === 'jj'; }).length;
  var bn = clips.filter(function(c) { return c.voice === 'buggsy'; }).length;

  console.log('\n===========================================');
  console.log('  ElevenLabs Audio Generator v2');
  console.log('  Source: phrases.json (v' + phrases._meta.version + ')');
  if (filterKid) console.log('  Filter kid: ' + filterKid);
  if (filterCategory) console.log('  Filter category: ' + filterCategory);
  console.log('  JJ: ' + jjn + ' | Buggsy: ' + bn + ' | Total: ' + clips.length);
  console.log('  Output: ' + path.resolve(OUTPUT_DIR));
  console.log('  Est: ~' + Math.ceil(clips.length * DELAY / 60000) + ' min');
  console.log('===========================================\n');

  var ok = 0, skip = 0, fail = 0, errs = [];
  for (var i = 0; i < clips.length; i++) {
    var c = clips[i], tag = '[' + (i + 1) + '/' + clips.length + ']';
    var out = path.join(OUTPUT_DIR, c.file);

    if (fs.existsSync(out)) {
      skip++;
      continue;
    }

    try {
      await generateClip(c);
      console.log(tag + ' OK  ' + c.file);
      ok++;
    } catch (e) {
      console.error(tag + ' FAIL ' + c.file + ' -- ' + e.message);
      fail++;
      errs.push({ file: c.file, err: e.message });
    }
    if (i < clips.length - 1) await sleep(DELAY);
  }

  console.log('\n===========================================');
  console.log('  DONE: ' + ok + ' generated, ' + skip + ' skipped, ' + fail + ' failed');
  if (errs.length) {
    console.log('\n  Failed:');
    errs.forEach(function(e) { console.log('    ' + e.file + ': ' + e.err); });
    console.log('\n  Re-run to retry (existing files skipped).');
  }
  console.log('===========================================');
}

run().catch(function(e) { console.error('Fatal:', e); process.exit(1); });
