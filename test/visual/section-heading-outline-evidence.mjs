/**
 * Evidence generator for the section-layout heading outline fix (issue #555).
 *
 * The bug: _layouts/section.html and _includes/navigation/section-sidebar.html
 * chose heading tags for their default font size — a sidebar <h5>/<h6> before
 * the page <h1>, then h1 -> h5 card titles — so heading navigation skipped
 * levels on every news section landing (WCAG 1.3.1). The fix retags by depth
 * and keeps the size with a .h4/.h5/.h6 class, so it is meant to be VISUALLY
 * INERT.
 *
 * For one section page per section_style this shows:
 *   1. the structural change — the skips in #main-content's heading outline,
 *      before vs after;
 *   2. the visual non-change — the section layout renders pixel-identical
 *      (BEFORE is reproduced by reverting exactly the diff in the live DOM).
 *
 * Run against the live dev server:
 *   docker compose up                      # serves :4000
 *   BASE_URL=http://localhost:4000 node test/visual/section-heading-outline-evidence.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { montage } from './evidence-kit.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const SLUG = 'section-heading-outline';
const EVIDENCE_DIR = path.join(__dirname, 'evidence', SLUG);
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

// Same routes as the regression test (test/visual/core/heading-outline.spec.js).
const ROUTES = [
  { url: '/news/business/', style: 'list' },
  { url: '/news/development/', style: 'grid' },
  { url: '/news/tutorial/', style: 'magazine' },
];

const OUTLINE = () => {
  const items = [...document.querySelectorAll('#main-content :is(h1,h2,h3,h4,h5,h6)')]
    .map((el) => Number(el.tagName[1]));
  const skips = [];
  let prev = 0;
  for (const lvl of items) {
    if (prev && lvl > prev + 1) skips.push(`h${prev}->h${lvl}`);
    prev = lvl;
  }
  return { sequence: items.map((l) => `h${l}`).join(' '), skips };
};

// What the eye sees of each heading in the layout: computed type + box in
// page coordinates. The closed mobile offcanvas is position:fixed off-screen
// (its title is untouched by the fix), so it is left out.
const STYLES = () => [...document.querySelectorAll('.section-layout :is(h1,h2,h3,h4,h5,h6):not(.offcanvas *)')].map((el) => {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return [cs.fontSize, cs.fontWeight, cs.lineHeight, cs.marginTop, cs.marginBottom, cs.color,
    Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)].join(' ');
});

// Revert exactly the diff: [selector of the fixed heading, pre-fix tag,
// size class the fix added (removed again), or null when the class was
// already there].
const UNFIX = () => {
  const map = [
    ['.section-sidebar-desktop .card-header > h2.h5', 'h5', 'h5'],
    ['.section-sidebar-desktop .card-body > h3.h6', 'h6', 'h6'],
    ['.section-layout-main h2.h4', 'h3', null],
    ['.subcategory-section h3.card-title.h5, .all-posts-section h3.card-title.h5', 'h5', 'h5'],
    ['.grid-section h2.card-title.h5, .list-section h2.card-title.h5', 'h5', 'h5'],
    ['.related-sections > h2.h5', 'h3', null],
    ['.related-sections h3.card-title.h6', 'h6', 'h6'],
  ];
  let n = 0;
  for (const [sel, tag, drop] of map) {
    for (const el of document.querySelectorAll(sel)) {
      const old = document.createElement(tag);
      for (const a of el.attributes) old.setAttribute(a.name, a.value);
      if (drop) old.classList.remove(drop);
      while (el.firstChild) old.appendChild(el.firstChild);
      el.replaceWith(old);
      n += 1;
    }
  }
  return n;
};

const browser = await chromium.launch();
const metrics = { slug: SLUG, routes: [] };
const rows = [];

for (const r of ROUTES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({
      essential: true, analytics: false, marketing: false,
      timestamp: Date.now(), version: '1.0',
    }));
  });
  await page.goto(BASE_URL + r.url, { waitUntil: 'load' });
  await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });
  // The region is taller than the viewport: load every lazy image up front so
  // neither capture races an image arriving mid-shot.
  await page.evaluate(() => Promise.all([...document.images].map((img) => {
    img.loading = 'eager';
    return img.complete ? null : new Promise((res) => { img.onload = img.onerror = res; });
  })));
  await page.waitForTimeout(300);
  const region = page.locator('.section-layout');

  const after = await page.evaluate(OUTLINE);
  const afterStyles = await page.evaluate(STYLES);
  const afterShot = await region.screenshot();
  // Control: the same state shot again. If this already differs, byte equality
  // says nothing about the fix, and the style/box comparison is the proof.
  const controlIdentical = (await region.screenshot()).equals(afterShot);

  const reverted = await page.evaluate(UNFIX);
  await page.waitForTimeout(150);
  const before = await page.evaluate(OUTLINE);
  const beforeStyles = await page.evaluate(STYLES);
  const beforeShot = await region.screenshot();

  const pixelIdentical = beforeShot.equals(afterShot);
  const styleDiffs = afterStyles.filter((s, i) => s !== beforeStyles[i]);
  metrics.routes.push({ ...r, reverted, before, after, headings: afterStyles.length, styleDiffs,
    pixelIdentical, controlIdentical });
  console.log(`${r.url.padEnd(20)} ${r.style.padEnd(9)} skips before=${before.skips.length} after=${after.skips.length}`
    + `  reverted=${reverted}  style-diffs=${styleDiffs.length}/${afterStyles.length}`
    + `  pixel-identical=${pixelIdentical} (control ${controlIdentical})`);

  rows.push(
    { label: `❌ BEFORE — ${r.url} (${r.style}) · ${before.skips.length} heading-level skips in #main-content`
        + ` (${[...new Set(before.skips)].join(', ')})`, img: beforeShot, w: 640 },
    { label: `✅ AFTER — 0 skips · ${styleDiffs.length}/${afterStyles.length} headings differ in computed type or box · render `
        + (pixelIdentical ? 'byte-identical'
          : controlIdentical ? 'NOT identical — inspect!'
            : 'not byte-comparable (two shots of the same state already differ)'),
      img: afterShot, w: 640 },
  );
  await ctx.close();
}

await montage(browser, {
  title: 'Section layout headings — tag by depth, size by class (visually inert)',
  note: 'Each pair: the section layout at 1280px with the pre-fix tags (reproduced by reverting exactly '
    + 'the diff in the live DOM) and with the fix. Same pixels; only the heading levels a screen reader '
    + 'announces change.',
  width: 1340,
  rows,
}, path.join(EVIDENCE_DIR, '01-section-styles-before-after.png'));

await browser.close();

fs.writeFileSync(path.join(EVIDENCE_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2));

const fixed = metrics.routes.filter((r) => r.after.skips.length === 0 && r.before.skips.length > 0);
const inert = metrics.routes.filter((r) => r.pixelIdentical);
const snippet = `  (evidence: [\`test/visual/evidence/${SLUG}/\`](test/visual/evidence/${SLUG}/README.md) — `
  + `${metrics.routes.reduce((s, r) => s + r.before.skips.length, 0)} heading-level skips → 0 across `
  + `${fixed.length}/${ROUTES.length} section styles; computed type and box unchanged for all `
  + `${metrics.routes.reduce((s, r) => s + r.headings, 0)} headings; render byte-identical for `
  + `${inert.length}/${metrics.routes.filter((r) => r.controlIdentical).length} byte-comparable pages)`;
fs.writeFileSync(path.join(EVIDENCE_DIR, 'CHANGELOG-snippet.txt'), snippet + '\n');

const pass = fixed.length === ROUTES.length && metrics.routes.every((r) => r.styleDiffs.length === 0);
console.log(`\nEvidence written to ${EVIDENCE_DIR}`);
console.log(pass ? 'PASS: every section style had skips before and none after; heading type and boxes unchanged.' : 'FAIL: unexpected structure or a styled difference — inspect before committing.');
process.exit(pass ? 0 : 1);
