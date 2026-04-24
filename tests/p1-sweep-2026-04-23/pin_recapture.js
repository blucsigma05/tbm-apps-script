// Authenticate against /api/verify-pin, then capture /pulse + /vein at device viewports.
// Usage: TBM_PIN=xxxx node tests/p1-sweep-2026-04-23/pin_recapture.js
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname);
const BASE = 'https://thompsonfams.com';
const PIN = process.env.TBM_PIN;
if (!PIN) { console.error('TBM_PIN env var required'); process.exit(1); }

const ROUTES = [
  { item: 45, route: '/pulse', w: 412,  h: 915,  target: 'pulse', wait: 30000 },
  { item: 46, route: '/vein',  w: 1920, h: 1080, target: 'vein',  wait: 30000 }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const r of ROUTES) {
    const verifyResp = await fetch(BASE + '/api/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: PIN, target: r.target })
    });
    const setCookie = verifyResp.headers.get('set-cookie') || '';
    const m = setCookie.match(/tbm_auth=([^;]+)/);
    if (!m) { console.error(`[${r.route}] no tbm_auth in set-cookie`); continue; }
    const authValue = m[1];
    const context = await browser.newContext({
      viewport: { width: r.w, height: r.h },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
    });
    await context.addCookies([{
      name: 'tbm_auth',
      value: authValue,
      domain: 'thompsonfams.com',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax'
    }]);
    const page = await context.newPage();
    const slug = r.route.replace(/^\//, '');
    let httpStatus = null;
    page.on('response', resp => {
      if (resp.url() === BASE + r.route && httpStatus === null) httpStatus = resp.status();
    });
    try {
      const resp = await page.goto(BASE + r.route, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (httpStatus === null && resp) httpStatus = resp.status();
      await page.waitForTimeout(r.wait);
      await page.screenshot({ path: path.join(OUT, slug + '_pinned.png'), fullPage: false });
      const title = await page.title();
      const body = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 8000) : '');
      fs.writeFileSync(
        path.join(OUT, slug + '_pinned.txt'),
        `route: ${r.route}\nviewport: ${r.w}x${r.h}\nhttp: ${httpStatus}\ntitle: ${title}\nbodyLen: ${body.length}\nwaited: ${r.wait}ms\n---\n${body}\n`
      );
      console.log(`[OK] #${r.item} ${r.route} http=${httpStatus} title="${title}" bodyLen=${body.length}`);
    } catch (e) {
      console.log(`[ERR] #${r.item} ${r.route} err=${e.message}`);
    } finally {
      await context.close();
    }
  }
  await browser.close();
})();
