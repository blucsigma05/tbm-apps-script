/**
 * Shared test helpers for TBM + MLS Playwright suites
 *
 * DEVICES viewport map is derived from ops/play-gate-profiles.json (canonical source per EPIC #439).
 * The per-device `aliases["tests/shared/helpers.js:DEVICES"]` field names the key used here, so when
 * profiles.json changes the viewport, this map picks it up automatically. CI script
 * .github/scripts/check_profile_sync.py enforces no drift.
 */
const path = require('path');
const PROFILES = require(path.join(__dirname, '..', '..', 'ops', 'play-gate-profiles.json'));

const DEVICES = (function buildDevices() {
  const out = {};
  const deviceKeys = Object.keys(PROFILES.devices);
  for (let i = 0; i < deviceKeys.length; i++) {
    const device = PROFILES.devices[deviceKeys[i]];
    const alias = device.aliases && device.aliases['tests/shared/helpers.js:DEVICES'];
    if (alias) {
      out[alias] = { width: device.viewport.width, height: device.viewport.height };
    }
  }
  return out;
})();

// GAS pages can be slow — use this instead of default waitUntil
const GAS_TIMEOUT = 25000;

/**
 * Collect JS console errors during page load.
 * Returns an array of error strings, filtered for noise.
 */
function collectErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return {
    get fatal() {
      return errors.filter((e) => {
        return e.indexOf('favicon') === -1
          && e.indexOf('404') === -1
          && e.indexOf('net::ERR') === -1;
      });
    },
    get all() { return errors; }
  };
}

module.exports = { DEVICES, GAS_TIMEOUT, collectErrors };
