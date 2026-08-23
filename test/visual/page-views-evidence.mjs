// =============================================================================
// page-views-evidence.mjs — evidence for the page-view counter (ZER0-083)
// =============================================================================
// The counter is a NEW feature, so there is no "before" rendering to revert to:
// before this change the article meta row simply ended at the reading time.
// This kit captures that BEFORE state honestly (the badge suppressed exactly
// the way a real privacy gate suppresses it) alongside every AFTER state:
// first view, second session, a large count, and the phone layout.
//
// Every number on screen comes from the real code path — counts are produced by
// visiting the page, or by seeding the counter's own localStorage payload and
// reloading so page-views.js reads it the way it would on a returning visit.
// Nothing is typed into the DOM.
//
// Usage (server already up — see the run-zer0-mistakes skill):
//   BASE_URL=http://localhost:4000 node test/visual/page-views-evidence.mjs
// =============================================================================
import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4000';
const outDir = 'test/visual/evidence/page-views';
fs.mkdirSync(outDir, { recursive: true });

const STORE_KEY = 'zer0-page-views';

// Keep the cookie banner out of the frame — presentation only.
const SEED_CONSENT = () => {
  try {
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({
      essential: true, analytics: true, marketing: false,
      timestamp: Date.now(), version: '1.0',
    }));
  } catch (e) { /* ignore */ }
};

const DNT = () => {
  Object.defineProperty(navigator, 'doNotTrack', { get: () => '1', configurable: true });
};

// Crop to the article header so the meta row is legible at review size.
const shotMeta = async (page, name) => {
  const header = page.locator('.post-header').first();
  await header.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await header.screenshot({ path: `${outDir}/${name}` });
};

const readMeta = (page) => page.evaluate(() => {
  const badge = document.querySelector('.page-views');
  const row = document.querySelector('.post-meta');
  return {
    badgeHidden: !badge || badge.hasAttribute('hidden'),
    count: badge?.querySelector('[data-page-views-count]')?.textContent ?? null,
    label: badge?.querySelector('[data-page-views-label]')?.textContent ?? null,
    separatorVisible: badge ? !!badge.querySelector('.page-views__sep')?.offsetParent : false,
    metaRowHeight: row ? Math.round(row.getBoundingClientRect().height) : null,
    pageOverflowPx: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  };
});

const browser = await chromium.launch();
const metrics = { base: BASE, states: {} };

try {
  // Resolve a real article the same way the regression spec does.
  const probe = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const probePage = await probe.newPage();
  await probePage.goto(`${BASE}/`, { waitUntil: 'load' });
  const hrefs = await probePage.locator('a[href*="/posts/"]').evaluateAll((links) =>
    links.map((a) => new URL(a.href).pathname));
  const route = hrefs.find((p) => p.split('/').filter(Boolean).length >= 4);
  if (!route) throw new Error('no article link found on the homepage');
  metrics.route = route;
  await probe.close();

  // --- 01 BEFORE: no count yet ------------------------------------------
  // Do Not Track is on, so nothing is recorded and the badge — with its
  // leading separator inside it — stays hidden. This is pixel-identical to
  // the meta row before this feature existed.
  const beforeCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const before = await beforeCtx.newPage();
  await before.addInitScript(SEED_CONSENT);
  await before.addInitScript(DNT);
  await before.goto(BASE + route, { waitUntil: 'load' });
  await before.waitForTimeout(400);
  metrics.states.before_dnt = await readMeta(before);
  await shotMeta(before, '01-before-no-count.png');
  await beforeCtx.close();

  // --- 02 AFTER: the first view -----------------------------------------
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(SEED_CONSENT);
  await page.goto(BASE + route, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  metrics.states.first_view = await readMeta(page);
  await shotMeta(page, '02-after-first-view.png');

  // A reload inside the same session must NOT inflate the count.
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  metrics.states.after_reload_same_session = await readMeta(page);

  // --- 03 AFTER: a second session → plural label ------------------------
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  metrics.states.second_session = await readMeta(page);
  await shotMeta(page, '03-after-second-session.png');

  // --- 04 AFTER: a large count ------------------------------------------
  // Seed the counter's own store and reload: page-views.js reads it exactly as
  // it would for a visitor returning to a page they have read many times.
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({
      v: 1, paths: { [location.pathname]: { c: 12437, t: 1 } },
    }));
    sessionStorage.clear();
  }, STORE_KEY);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  metrics.states.large_count = await readMeta(page);
  await shotMeta(page, '04-after-large-count.png');
  await ctx.close();

  // --- 05 AFTER: phone --------------------------------------------------
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  await mp.addInitScript(SEED_CONSENT);
  await mp.goto(BASE + route, { waitUntil: 'load' });
  await mp.waitForTimeout(400);
  metrics.states.mobile_390 = await readMeta(mp);
  await shotMeta(mp, '05-after-mobile-390.png');
  await mctx.close();

  fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
  console.log('page-views evidence written to', outDir);
  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
}
