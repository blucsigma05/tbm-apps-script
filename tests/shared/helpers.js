/**
 * Shared test helpers for TBM + MLS Playwright suites
 */

// Device viewport presets matching actual TBM target devices
const DEVICES = {
  S25:        { width: 390, height: 844 },   // Galaxy S25 (JT ThePulse)
  iPadAir:    { width: 800, height: 1280 },  // iPad Air (kid tablets)
  FireStick:  { width: 1920, height: 1080 }, // Fire Stick (Soul/Spine)
  Omnibook:   { width: 1920, height: 1200 }, // HP Omnibook (LT TheVein)
  SurfacePro: { width: 1368, height: 912 },  // Surface Pro 5 (Buggsy homework)
  S10FE:      { width: 400, height: 800 },   // Galaxy S10 FE (JJ SparkleLearn)
};

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
