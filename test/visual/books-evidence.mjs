/**
 * Books collection — evidence generator (ZER0-079, new-feature/after-only).
 * ----------------------------------------------------------------------------
 * Drives the live site and captures the visual evidence for the books
 * collection: the book landing page (cover hero + TOC), the story reading
 * page (storybook measure, drop cap, illustration plates), the prev/next
 * story navigation states, and a phone-width containment check.
 *
 * A brand-new feature has no "before" state, so there is no unfixCss — the
 * montages are after-only (the pre-change state is simply a 404). Page
 * overflow is measured across the standard width sweep for both routes and
 * written to metrics.json (all zeros expected).
 *
 * Reuses the shared kit primitives (montage, MEASURE_OVERFLOW) per the
 * visual-evidence standard — no re-implemented measurement logic.
 *
 * Usage:
 *   BASE_URL=http://localhost:4000 node test/visual/books-evidence.mjs
 *
 * Outputs (test/visual/evidence/books-collection/):
 *   01-book-landing.png    cover hero + TOC at 1280px and 390px
 *   02-book-story.png      reading surface: header, drop cap, plate (1280/390)
 *   03-story-navigation.png ch1 (prev disabled) vs ch2 (next disabled) nav rows
 *   metrics.json           overflow sweep for both routes (expect 0 everywhere)
 *   CHANGELOG-snippet.txt  release-notes-ready evidence link
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage, MEASURE_OVERFLOW } from './evidence-kit.mjs';

const BASE = process.env.BASE_URL || 'http://localhost:4000';
const OUT = 'test/visual/evidence/books-collection';
const SLUG = 'books-collection';
fs.mkdirSync(OUT, { recursive: true });

const LANDING = '/books/zer0-tales/';
const STORY1 = '/books/zer0-tales/01-the-missing-pixel/';
const STORY2 = '/books/zer0-tales/02-the-checkpoint/';
const WIDTHS = [320, 360, 390, 414, 768, 992, 1280, 1440];
const SCOPE = '#main-content, header#navbar';

const browser = await chromium.launch();

async function shot(route, width, height, selector = null, fullPage = false) {
  const page = await browser.newPage();
  await page.setViewportSize({ width, height });
  await page.goto(BASE + route, { waitUntil: 'load' });
  await page.waitForTimeout(250);
  let img;
  if (selector) {
    const el = await page.$(selector);
    img = el ? await el.screenshot() : await page.screenshot();
  } else {
    img = await page.screenshot({ fullPage });
  }
  await page.close();
  return img;
}

// 1. Book landing page — cover hero + table of contents.
console.log(`[${SLUG}] landing montage`);
await montage(browser, {
  title: 'Books collection — book landing page (book.html)',
  note: 'Cover hero (portrait book frame, byline, synopsis, Start reading CTA) and the ordered table of contents. New feature: after-only.',
  width: 1040,
  rows: [
    { label: '1280px — cover hero + TOC', img: await shot(LANDING, 1280, 1500, null, true), w: 980 },
    { label: '390px — phone', img: await shot(LANDING, 390, 1400, null, true), w: 380 },
  ],
}, `${OUT}/01-book-landing.png`);

// 2. Story reading page — header, drop cap, plates.
console.log(`[${SLUG}] story montage`);
await montage(browser, {
  title: 'Books collection — story reading page (book-story.html)',
  note: 'Immersive reading surface: chapter header, storybook serif with drop cap, full-width illustration plates, The End flourish.',
  width: 1040,
  rows: [
    { label: '1280px — story page', img: await shot(STORY1, 1280, 1600, null, true), w: 980 },
    { label: '390px — phone reading view', img: await shot(STORY1, 390, 1500, null, true), w: 380 },
  ],
}, `${OUT}/02-book-story.png`);

// 3. Story navigation states — first vs last chapter.
console.log(`[${SLUG}] navigation montage`);
await montage(browser, {
  title: 'Books collection — prev/next story navigation (chapter order)',
  note: 'Navigation derives from numeric chapter: front matter. Chapter 1 disables Previous; the last chapter disables Next; Contents returns to the book landing page.',
  width: 1040,
  rows: [
    { label: 'Chapter 1 — Previous disabled, Next → The Checkpoint', img: await shot(STORY1, 1100, 800, '.book-story-nav'), w: 980 },
    { label: 'Chapter 2 (last) — Prev → The Missing Pixel, Next disabled', img: await shot(STORY2, 1100, 800, '.book-story-nav'), w: 980 },
  ],
}, `${OUT}/03-story-navigation.png`);

// 4. Overflow sweep for both routes (metrics.json).
console.log(`[${SLUG}] overflow sweep`);
const metrics = { slug: SLUG, base: BASE, routes: {} };
for (const route of [LANDING, STORY1]) {
  metrics.routes[route] = [];
  for (const w of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: w, height: 760 });
    await page.goto(BASE + route, { waitUntil: 'load' });
    await page.waitForTimeout(150);
    const m = await page.evaluate(MEASURE_OVERFLOW, SCOPE);
    metrics.routes[route].push({ width: w, overflowPx: m.overflowPx });
    console.log(`   ${route} @${w}px overflow=${m.overflowPx}px`);
    await page.close();
  }
}
fs.writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 2));

fs.writeFileSync(`${OUT}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${SLUG}/ -->\n` +
  `  (evidence: [\`test/visual/evidence/${SLUG}/\`](test/visual/evidence/${SLUG}/README.md))`);

await browser.close();
console.log(`[${SLUG}] done → ${OUT}/`);
