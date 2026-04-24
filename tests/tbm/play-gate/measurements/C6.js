/**
 * C6 — multi-comic-library (Comic Studio)
 * Library of past comics persists and each is reopenable.
 *
 * Note: 2026-04-21 source inspection of ComicStudio.html found no
 * listComics / getStoryList / library-list call site. The criterion is a
 * candidate for backlog if the library lives in StoryLibrary.html instead
 * (CLAUDE.md File Map shows StoryLibrary at /story-library, separate route).
 *
 * Source check: presence of any listing/reopening mechanism in either
 * ComicStudio.html itself OR a clearly-linked StoryLibrary route reference.
 *
 * Self-skips on routes other than /comic-studio.
 */

var helpers = require('./_helpers');

var LIBRARY_MARKERS = [
  /listComics/i,
  /listStories/i,
  /getStoryList/i,
  /comicLibrary/i,
  /storyLibrary/i,
  /loadSavedComics/i,
  /openSavedComic/i,
  /\/story-library/  // route reference is acceptable evidence of integration
];

module.exports = async function C6(ctx) {
  if (ctx.route !== '/comic-studio') {
    return { id: 'C6', status: 'skip', measurement: 'not /comic-studio route' };
  }
  var surface = helpers.loadSurface(ctx);
  if (!surface) {
    return { id: 'C6', status: 'fail', measurement: 'ComicStudio.html missing' };
  }
  // Evidence must live IN ComicStudio.html — either a direct listing/reopen
  // call site, or a route reference to /story-library (which proves the
  // surface actually links to the library). A sibling StoryLibrary.html file
  // existing on disk alone does not prove integration and is not accepted.
  var matched = [];
  for (var i = 0; i < LIBRARY_MARKERS.length; i++) {
    if (LIBRARY_MARKERS[i].test(surface.src)) {
      matched.push(LIBRARY_MARKERS[i].toString().slice(0, 40));
    }
  }

  if (matched.length === 0) {
    return {
      id: 'C6',
      status: 'fail',
      measurement: 'no library listing / reopen / route-reference marker in ComicStudio.html',
      expected: 'listComics/loadSavedComics/openSavedComic call site OR /story-library route reference'
    };
  }
  return {
    id: 'C6',
    status: 'surrogate',
    surrogateNote: 'static check — library integration marker present in ComicStudio.html; round-trip save-then-reopen test deferred to PR-3',
    measurement: matched.length + ' library marker(s): ' + matched.slice(0, 2).join(' | '),
    expected: 'saved comic appears in library list and reopens (PR-3 behavioral)'
  };
};
