// AssetRegistry.gs — v3
// ════════════════════════════════════════════════════════════════════
// Shared asset catalog for SparkleLearning, CurriculumSeed, and validators.
// V8 server-side — modern JS OK here.
// WRITES TO: (none — read-only catalog)
// READS FROM: (in-memory constant — no sheet reads)
// ════════════════════════════════════════════════════════════════════

function getAssetRegistryVersion() { return 3; }

var ASSET_REGISTRY = {
  // ── Letter intro hero images — concepts tied to letters in CurriculumSeed ──
  'fire':      { id: 'fire',      type: 'emoji', value: '\uD83D\uDD25', name: 'fire',       plural: 'fires',       color: 'red',    category: 'concept' },
  'ice_cream': { id: 'ice_cream', type: 'emoji', value: '\uD83C\uDF66', name: 'ice cream',  plural: 'ice creams',  color: 'pink',   category: 'food' },
  'kite':      { id: 'kite',      type: 'emoji', value: '\uD83E\uDEB1', name: 'kite',       plural: 'kites',       color: 'blue',   category: 'object' },
  'bug':       { id: 'bug',       type: 'emoji', value: '\uD83D\uDC1B', name: 'bug',        plural: 'bugs',        color: 'green',  category: 'animal' },
  'dad':       { id: 'dad',       type: 'emoji', value: '\uD83D\uDC68', name: 'Daddy',      plural: 'daddies',     color: 'gray',   category: 'person' },
  'boy':       { id: 'boy',       type: 'emoji', value: '\uD83D\uDC66', name: 'boy',        plural: 'boys',        color: 'gray',   category: 'person' },
  'girl':      { id: 'girl',      type: 'emoji', value: '\uD83D\uDC67', name: 'girl',       plural: 'girls',       color: 'pink',   category: 'person' },
  'star':      { id: 'star',      type: 'svg',   value: 'star',         name: 'star',       plural: 'stars',       color: 'gold',   category: 'shape' },

  // ── color_sort items — Week 3 and Week 4 from CurriculumSeed ──
  'apple':      { id: 'apple',      type: 'emoji', value: '\uD83C\uDF4E', name: 'apple',      plural: 'apples',      color: 'red',    category: 'food' },
  'sky':        { id: 'sky',        type: 'emoji', value: '\uD83C\uDF24\uFE0F', name: 'sky',  plural: 'skies',       color: 'blue',   category: 'nature' },
  'sun':        { id: 'sun',        type: 'svg',   value: 'sun',          name: 'sun',        plural: 'suns',        color: 'gold',   category: 'nature' },
  'banana':     { id: 'banana',     type: 'emoji', value: '\uD83C\uDF4C', name: 'banana',     plural: 'bananas',     color: 'yellow', category: 'food' },
  'truck':      { id: 'truck',      type: 'emoji', value: '\uD83D\uDE9B', name: 'truck',      plural: 'trucks',      color: 'red',    category: 'vehicle' },
  'fire truck': { id: 'fire truck', type: 'emoji', value: '\uD83D\uDE92', name: 'fire truck', plural: 'fire trucks', color: 'red',    category: 'vehicle' },
  'ocean':      { id: 'ocean',      type: 'emoji', value: '\uD83C\uDF0A', name: 'ocean',      plural: 'oceans',      color: 'blue',   category: 'nature' },
  'leaf':       { id: 'leaf',       type: 'emoji', value: '\uD83C\uDF43', name: 'leaf',       plural: 'leaves',      color: 'green',  category: 'nature' },
  'frog':       { id: 'frog',       type: 'emoji', value: '\uD83D\uDC38', name: 'frog',       plural: 'frogs',       color: 'green',  category: 'animal' },

  // ── count_with_me plurals — fixes broken singularization ──
  'butterfly':  { id: 'butterfly',  type: 'svg',   value: 'butterfly',    name: 'butterfly',  plural: 'butterflies', color: 'pink',   category: 'animal' },
  'sparkle':    { id: 'sparkle',    type: 'emoji', value: '\u2728',        name: 'sparkle',    plural: 'sparkles',    color: 'gold',   category: 'effect' },
  'heart':      { id: 'heart',      type: 'svg',   value: 'heart',        name: 'heart',      plural: 'hearts',      color: 'pink',   category: 'shape' },
  'moon':       { id: 'moon',       type: 'svg',   value: 'moon',         name: 'moon',       plural: 'moons',       color: 'purple', category: 'shape' },
  'flowers':    { id: 'flowers',    type: 'emoji', value: '\uD83C\uDF38', name: 'flower',     plural: 'flowers',     color: 'pink',   category: 'nature' },
  'rainbows':   { id: 'rainbows',   type: 'emoji', value: '\uD83C\uDF08', name: 'rainbow',    plural: 'rainbows',    color: 'purple', category: 'nature' },
  'gems':       { id: 'gems',       type: 'emoji', value: '\uD83D\uDC8E', name: 'gem',        plural: 'gems',        color: 'blue',   category: 'object' },

  // ── Phase 2 letter intro images — JJ weeks 5-8 ──
  'tiger':      { id: 'tiger',      type: 'emoji', value: '\uD83D\uDC2F', name: 'tiger',      plural: 'tigers',      color: 'orange', category: 'animal' },
  'orange':     { id: 'orange',     type: 'emoji', value: '\uD83C\uDF4A', name: 'orange',     plural: 'oranges',     color: 'orange', category: 'food' },
  'cat':        { id: 'cat',        type: 'emoji', value: '\uD83D\uDC31', name: 'cat',        plural: 'cats',        color: 'gray',   category: 'animal' },

  // ── Shape assets for color_sort items[].name — validates against registry ──
  'circle':     { id: 'circle',     type: 'svg',   value: 'circle',       name: 'circle',     plural: 'circles',     color: 'blue',   category: 'shape' },
  'square':     { id: 'square',     type: 'svg',   value: 'square',       name: 'square',     plural: 'squares',     color: 'green',  category: 'shape' },
  'triangle':   { id: 'triangle',   type: 'svg',   value: 'triangle',     name: 'triangle',   plural: 'triangles',   color: 'yellow', category: 'shape' }
};

// ── Plural index — O(1) lookup by plural, singular, or display name ──
var ASSET_PLURAL_INDEX = (function() {
  var idx = {};
  for (var key in ASSET_REGISTRY) {
    if (!ASSET_REGISTRY.hasOwnProperty(key)) { continue; }
    var entry = ASSET_REGISTRY[key];
    idx[key] = entry;
    if (entry.plural) { idx[entry.plural.toLowerCase()] = entry; }
    if (entry.name) { idx[entry.name.toLowerCase()] = entry; }
  }
  return idx;
})();

/**
 * Returns the full ASSET_REGISTRY object.
 * Used by getAssetRegistrySafe() in Code.gs.
 */
function getAssetRegistry_() {
  return ASSET_REGISTRY;
}

// END OF FILE — AssetRegistry.gs v2
