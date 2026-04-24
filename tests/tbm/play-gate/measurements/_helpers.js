/**
 * _helpers.js — Shared utilities for play-gate measurement files.
 *
 * Centralizes the route → HTML file mapping that PR-1 measurements (PRE-2,
 * U7, U13, U14) inlined narrowly (only /sparkle + /homework). PR-2 expands
 * coverage to every play-gate route so static-grep criteria can run on all
 * surfaces, not just two.
 *
 * ES5-compatible Node.js syntax throughout (matches existing measurement files).
 */

var fs = require('fs');
var path = require('path');

// Route → HTML file at repo root. Source: .claude/skills/play-gate/SKILL.md
// Inputs section + ops/play-gate-profiles.json routeViewports.
//
// Notes:
//   - /daily-adventures is the JJ alias for daily-missions; same source HTML.
//   - /sparkle-free shares SparkleLearning.html; mode is set by query param.
//   - /sparkle-kingdom is JJHome.html (verified: CLAUDE.md File Map shows
//     JJHome.html serves ?page=sparkle-kingdom).
//   - /wolfdome is DesignDashboard.html (verified: CLAUDE.md File Map).
//   - /baseline is BaselineDiagnostic.html.
var ROUTE_TO_HTML = {
  '/sparkle': 'SparkleLearning.html',
  '/sparkle-free': 'SparkleLearning.html',
  '/sparkle-kingdom': 'JJHome.html',
  '/daily-adventures': 'daily-missions.html',
  '/homework': 'HomeworkModule.html',
  '/reading': 'reading-module.html',
  '/writing': 'writing-module.html',
  '/wolfkid': 'WolfkidCER.html',
  '/facts': 'fact-sprint.html',
  '/investigation': 'investigation-module.html',
  '/comic-studio': 'ComicStudio.html',
  '/daily-missions': 'daily-missions.html',
  '/wolfdome': 'DesignDashboard.html',
  '/power-scan': 'wolfkid-power-scan.html',
  '/baseline': 'BaselineDiagnostic.html'
};

// Returns { file, src, abs } for the route, or null if route is unmapped or
// the file does not exist on disk. Measurements use this to short-circuit
// to `skip` cleanly.
function loadSurface(ctx) {
  var file = ROUTE_TO_HTML[ctx.route];
  if (!file) return null;
  var abs = path.join(ctx.repoRoot, file);
  if (!fs.existsSync(abs)) return null;
  return { file: file, abs: abs, src: fs.readFileSync(abs, 'utf8') };
}

// Returns the canonical voice spec for a child from ops/play-gate-profiles.json.
// Used by J2 (audio-consistency) to assert no cross-voice leakage.
function getCanonicalVoice(ctx) {
  if (!ctx.profiles || !ctx.profiles.voices) return null;
  if (ctx.child === 'jj') return ctx.profiles.voices.nia || null;
  if (ctx.child === 'buggsy') return ctx.profiles.voices.marco || null;
  return null;
}

// Counts visible word strings in HTML attribute-aware way:
// strips HTML tags, JS string literals concat noise, normalizes whitespace,
// returns the word count of the largest contiguous instruction-like text.
// Used by J5 (age-fit) and B1-style word-count checks.
function maxInstructionWords(src, markers) {
  var max = 0;
  for (var i = 0; i < markers.length; i++) {
    var re = new RegExp(markers[i], 'gi');
    var m;
    while ((m = re.exec(src)) !== null) {
      var snippet = src.slice(m.index, m.index + 600);
      var stripped = snippet.replace(/<[^>]+>/g, ' ').replace(/[+'"\\]/g, ' ');
      var words = stripped.replace(/\s+/g, ' ').trim().split(' ').filter(function(w) {
        return /^[A-Za-z][A-Za-z\-']*$/.test(w);
      });
      if (words.length > max) max = words.length;
    }
  }
  return max;
}

module.exports = {
  ROUTE_TO_HTML: ROUTE_TO_HTML,
  loadSurface: loadSurface,
  getCanonicalVoice: getCanonicalVoice,
  maxInstructionWords: maxInstructionWords
};
