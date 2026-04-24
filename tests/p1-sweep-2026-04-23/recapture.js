// Re-verify suspect routes with longer render time (12 seconds).
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname);
const BASE = 'https://thompsonfams.com';

const ROUTES = [
  { item: 29, route: '/jj',               w: 800,  h: 1340, wait: 12000 },
  { item: 30, route: '/parent',           w: 412,  h: 915,  wait: 12000 },
  { item: 31, route: '/homework',         w: 1368, h: 912,  wait: 12000 },
  { item: 32, route: '/sparkle',          w: 1200, h: 1920, wait: 12000 },
  { item: 40, route: '/daily-adventures', w: 1200, h: 1920, wait: 12000 },
  { item: 44, route: '/sparkle-kingdom',  w: 1200, h: 1920, wait: 12000 },
  { item: 48, route: '/soul',             w: 980,  h: 551,  wait: 12000 },
  { item: 49, route: '/progress',         w: 1368, h: 912,  wait: 12000 }
];

function slug(r) { return r.replace(/^\//, '').replace(/[^a-z0-9-]/gi, '_') || 'root'; }

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const r of ROUTES) {
    const url = BASE + r.route;
    const s = slug(r.route);
    const context = await browser.newContext({
      viewport: { width: r.w, height: r.h },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300)); });
    page.on('pageerror', e => consoleErrors.push('PAGEERR: ' + String(e).slice(0, 300)));
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(r.wait);
      await page.screenshot({ path: path.join(OUT, s + '_recap.png'), fullPage: false });
      const title = await page.title();
      const bodyText = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 6000) : '');
      fs.writeFileSync(
        path.join(OUT, s + '_recap.txt'),
        `route: ${r.route}\nviewport: ${r.w}x${r.h}\nurl: ${url}\ntitle: ${title}\nbodyLen: ${bodyText.length}\nconsoleErrors: ${consoleErrors.length}\n${consoleErrors.slice(0,5).map(e=>'  - '+e).join('\n')}\n---\n${bodyText}\n`
      );
      console.log(`[RECAP] #${r.item} ${r.route} title="${title}" bodyLen=${bodyText.length} errs=${consoleErrors.length}`);
    } catch (e) {
      console.log(`[ERR] #${r.item} ${r.route} err=${e.message}`);
    } finally {
      await context.close();
    }
  }
  await browser.close();
})();
