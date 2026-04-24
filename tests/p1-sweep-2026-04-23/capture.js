// P1 binary surface sweep — capture HTTP/DOM/PNG per route.
// Not committed to production code — lives under tests/ as sweep evidence.
// Usage: node tests/p1-sweep-2026-04-23/capture.js

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname);
const BASE = 'https://thompsonfams.com';

const ROUTES = [
  { item: 28, route: '/buggsy',           w: 800,  h: 1340 },
  { item: 29, route: '/jj',               w: 800,  h: 1340 },
  { item: 30, route: '/parent',           w: 412,  h: 915  },
  { item: 31, route: '/homework',         w: 1368, h: 912  },
  { item: 32, route: '/sparkle',          w: 1200, h: 1920 },
  { item: 33, route: '/sparkle-free',     w: 1200, h: 1920 },
  { item: 34, route: '/reading',          w: 1368, h: 912  },
  { item: 35, route: '/writing',          w: 1368, h: 912  },
  { item: 36, route: '/wolfkid',          w: 1368, h: 912  },
  { item: 37, route: '/facts',            w: 1368, h: 912  },
  { item: 38, route: '/investigation',    w: 1368, h: 912  },
  { item: 39, route: '/daily-missions',   w: 1368, h: 912  },
  { item: 40, route: '/daily-adventures', w: 1200, h: 1920 },
  { item: 41, route: '/baseline',         w: 1368, h: 912  },
  { item: 42, route: '/comic-studio',     w: 1368, h: 912  },
  { item: 43, route: '/wolfdome',         w: 1368, h: 912  },
  { item: 44, route: '/sparkle-kingdom',  w: 1200, h: 1920 },
  { item: 45, route: '/pulse',            w: 412,  h: 915  },
  { item: 46, route: '/vein',             w: 1920, h: 1080 },
  { item: 47, route: '/spine',            w: 980,  h: 551  },
  { item: 48, route: '/soul',             w: 980,  h: 551  },
  { item: 49, route: '/progress',         w: 1368, h: 912  }
];

function slug(r) { return r.replace(/^\//, '').replace(/[^a-z0-9-]/gi, '_') || 'root'; }

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const r of ROUTES) {
    const url = BASE + r.route;
    const s = slug(r.route);
    const context = await browser.newContext({
      viewport: { width: r.w, height: r.h },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
    });
    const page = await context.newPage();
    let httpStatus = null;
    page.on('response', resp => {
      if (resp.url() === url && httpStatus === null) httpStatus = resp.status();
    });
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (httpStatus === null && resp) httpStatus = resp.status();
      await page.waitForTimeout(3500); // let JS render
      await page.screenshot({ path: path.join(OUT, s + '.png'), fullPage: false });
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 4000) : '');
      const htmlLen = await page.evaluate(() => document.documentElement.outerHTML.length);
      fs.writeFileSync(
        path.join(OUT, s + '.txt'),
        `route: ${r.route}\nviewport: ${r.w}x${r.h}\nurl: ${url}\nhttp: ${httpStatus}\ntitle: ${title}\nhtmlLen: ${htmlLen}\n---\n${bodyText}\n`
      );
      results.push({ item: r.item, route: r.route, http: httpStatus, title, bodyLen: bodyText.length, error: null });
      console.log(`[OK] #${r.item} ${r.route} http=${httpStatus} title="${title}" body=${bodyText.length}`);
    } catch (e) {
      results.push({ item: r.item, route: r.route, http: httpStatus, title: null, bodyLen: 0, error: String(e).slice(0, 300) });
      console.log(`[ERR] #${r.item} ${r.route} http=${httpStatus} err=${e.message}`);
    } finally {
      await context.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  console.log('\nDone. Results written to tests/p1-sweep-2026-04-23/results.json');
})();
