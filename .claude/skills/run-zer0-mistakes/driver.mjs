#!/usr/bin/env node
// =============================================================================
// run-zer0-mistakes driver — drive the running Jekyll site headlessly.
// =============================================================================
//
// The "app" is a Jekyll static site served by `docker compose up` at
// http://localhost:4000 (or `bundle exec jekyll serve`). This driver points a
// headless Chromium at a *running* server, navigates a route, optionally
// applies a theme skin, screenshots it, and prints a JSON smoke summary
// (HTTP status, <title>, <h1>, navbar present, console errors). Non-zero exit
// when the route 4xx/5xx's or the page never reaches readyState=complete.
//
// It reuses the project's own Playwright install (resolved from the repo's
// node_modules via Node's upward resolution) and the cached Chromium browser.
//
// Usage (paths are relative to the repo/worktree root):
//   node .claude/skills/run-zer0-mistakes/driver.mjs                 # screenshot homepage
//   node .claude/skills/run-zer0-mistakes/driver.mjs --path /about/config/
//   node .claude/skills/run-zer0-mistakes/driver.mjs --skin neon --out /tmp/neon.png
//   node .claude/skills/run-zer0-mistakes/driver.mjs --smoke         # multi-route check
//   node .claude/skills/run-zer0-mistakes/driver.mjs --url http://127.0.0.1:4011 --path /faq/
//
// Options:
//   --url <base>        Base URL of the running server (default http://localhost:4000)
//   --path <path>       Route to visit (default /)
//   --out <file>        Screenshot path (default /tmp/zer0-<slug>.png)
//   --skin <name>       Apply a skin before screenshot: air aqua contrast dark
//                       dirt neon mint plum sunrise (uses window.zer0Bg.setSkin)
//   --viewport <WxH>    Viewport size (default 1280x720)
//   --full-page         Capture the full scrollable page
//   --wait <ms>         Extra settle time after load (default 0)
//   --smoke             Visit a fixed set of key routes, screenshot each, and
//                       fail if any 4xx/5xx or logs a console error
//   --help              Print this help
// =============================================================================

import { chromium } from '@playwright/test';

// --- arg parsing -------------------------------------------------------------
const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : def;
};
const flag = (name) => argv.includes(name);

if (flag('--help')) {
  console.log(
    'Usage: node driver.mjs [--url B] [--path P] [--out F] [--skin S]\n' +
      '                       [--viewport WxH] [--full-page] [--wait MS] [--smoke]\n' +
      'Skins: air aqua contrast dark dirt neon mint plum sunrise',
  );
  process.exit(0);
}

const BASE = (opt('--url', 'http://localhost:4000')).replace(/\/$/, '');
const [vw, vh] = (opt('--viewport', '1280x720')).split('x').map(Number);
const SETTLE = Number(opt('--wait', '0'));
const FULL = flag('--full-page');

const SMOKE_ROUTES = ['/', '/about/config/', '/about/stats/', '/quickstart/', '/faq/'];
const SKINS = ['air', 'aqua', 'contrast', 'dark', 'dirt', 'neon', 'mint', 'plum', 'sunrise'];

const slug = (p) => (p.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home');

// --- visit one route ---------------------------------------------------------
async function visit(context, path, { out, skin } = {}) {
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/favicon/.test(t) || /zer0Bg is not defined/.test(t)) return; // known benign
    errors.push(t);
  });
  page.on('pageerror', (e) => errors.push(String(e)));

  const url = BASE + path;
  let status = 0;
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    status = resp ? resp.status() : 0;
    await page.waitForLoadState('load', { timeout: 45000 });
  } catch (e) {
    errors.push(`navigation: ${e.message}`);
  }

  if (skin) {
    if (!SKINS.includes(skin)) throw new Error(`unknown skin "${skin}" (one of: ${SKINS.join(', ')})`);
    try {
      await page.waitForFunction(() => typeof window.zer0Bg?.setSkin === 'function', { timeout: 10000 });
      await page.evaluate(
        (name) =>
          new Promise((resolve) => {
            document.addEventListener('zer0:skin-change', () => resolve(), { once: true });
            window.zer0Bg.setSkin(name);
          }),
        skin,
      );
      await page.waitForFunction(
        (name) => document.documentElement.getAttribute('data-theme-skin') === name,
        skin,
        { timeout: 10000 },
      );
    } catch (e) {
      errors.push(`skin: ${e.message}`);
    }
  }

  if (SETTLE) await page.waitForTimeout(SETTLE);

  const title = await page.title().catch(() => '');
  const h1 = await page.locator('h1').first().textContent().catch(() => null);
  const navbar = (await page.locator('nav, .navbar, header').count()) > 0;
  const activeSkin = await page
    .evaluate(() => document.documentElement.getAttribute('data-theme-skin'))
    .catch(() => null);

  const file = out || `/tmp/zer0-${slug(path)}${skin ? '-' + skin : ''}.png`;
  await page.screenshot({ path: file, fullPage: FULL }).catch((e) => errors.push(`screenshot: ${e.message}`));

  await page.close();
  return { path, status, title, h1: h1?.trim()?.slice(0, 80) ?? null, navbar, activeSkin, screenshot: file, errors };
}

// --- main --------------------------------------------------------------------
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: vw || 1280, height: vh || 720 } });

let results;
if (flag('--smoke')) {
  results = [];
  for (const p of SMOKE_ROUTES) results.push(await visit(context, p));
} else {
  results = [await visit(context, opt('--path', '/'), { out: opt('--out', undefined), skin: opt('--skin', undefined) })];
}

await browser.close();

// --- report ------------------------------------------------------------------
const ok = results.every((r) => r.status >= 200 && r.status < 400 && r.errors.length === 0);
console.log(JSON.stringify({ base: BASE, ok, results }, null, 2));
for (const r of results) {
  const mark = r.status >= 200 && r.status < 400 && r.errors.length === 0 ? 'PASS' : 'FAIL';
  console.error(`[${mark}] ${r.path} -> ${r.status} | ${r.screenshot}${r.errors.length ? ' | errors: ' + r.errors.length : ''}`);
}
process.exit(ok ? 0 : 1);
