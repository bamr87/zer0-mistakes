// Screenshot helper for the SCSS refactor — captures key pages at several
// viewports against the running dev server. Usage:
//   node scripts/dev/shot.js <label> [path] [skin]
// Outputs PNGs to /tmp/shots/<label>-<vw>.png. Reused across phases to compare
// before/after for cascade-sensitive or pixel-changing changes.
const { chromium } = require('@playwright/test');
const fs = require('fs');

const label = process.argv[2] || 'shot';
const path = process.argv[3] || '/';
const skin = process.argv[4] || null;
const BASE = process.env.BASE_URL || 'http://localhost:4000';
const VWS = [
  { name: 'lg', width: 1280, height: 800 },
  { name: 'md', width: 820, height: 1100 },
  { name: 'sm', width: 390, height: 850 },
];

(async () => {
  fs.mkdirSync('/tmp/shots', { recursive: true });
  const browser = await chromium.launch();
  for (const vw of VWS) {
    const ctx = await browser.newContext({ viewport: { width: vw.width, height: vw.height } });
    const page = await ctx.newPage();
    if (skin) {
      await page.addInitScript((s) => {
        try { localStorage.setItem('zer0-skin', s); } catch (e) {}
      }, skin);
    }
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const out = `/tmp/shots/${label}-${vw.name}.png`;
    await page.screenshot({ path: out, fullPage: false });
    console.log('wrote', out);
    await ctx.close();
  }
  await browser.close();
})();
