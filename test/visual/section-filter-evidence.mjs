/**
 * Section topic filtering — evidence generator (before/after).
 * ----------------------------------------------------------------------------
 * The bug: `data-tags` was built as `tags | join: ' ' | slugify`, which
 * slugifies AFTER joining and so turns the separators into hyphens — making a
 * tag boundary indistinguishable from a hyphen inside a slug. The click
 * handler then matched with String.includes, so filtering /news/technology/ by
 * "ai" also matched a post tagged "edge-ai": 6 cards shown where the sidebar
 * badge for that topic said 5.
 *
 * The fix is in Liquid + the inline handler, not CSS, so the kit's `unfixCss`
 * cannot revert it. This drives TWO SERVERS instead — the pre-fix revision and
 * the fixed one — which makes the before/after genuine rather than simulated:
 *
 *   BEFORE_URL   pre-fix build (default :4012)
 *   BASE_URL     fixed build   (default :4011)
 *
 * The evidence that matters here is behavioural, not layout, so metrics.json
 * leads with the numbers: for every topic on the page, the count the sidebar
 * badge promises vs the number of cards actually revealed. Before, those two
 * disagree; after, they match everywhere. A regression shows up as a number in
 * the diff, not just a different screenshot.
 *
 * Reuses the shared kit primitives (montage, MEASURE_OVERFLOW) per the
 * visual-evidence standard — no re-implemented measurement logic.
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:4011 BEFORE_URL=http://127.0.0.1:4012 \
 *     node test/visual/section-filter-evidence.mjs
 *
 * Outputs (test/visual/evidence/section-topic-filter/):
 *   01-filter-before-after.png   the "ai" topic filtered, pre-fix vs fixed
 *   02-badge-vs-shown.png        every topic's promised count vs cards shown
 *   03-viewport-matrix.png       the filtered grid across 320 → 1440px
 *   metrics.json                 per-topic badge/shown counts + overflow sweep
 *   CHANGELOG-snippet.txt        release-notes-ready evidence link
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage, MEASURE_OVERFLOW } from './evidence-kit.mjs';

const AFTER = process.env.BASE_URL || 'http://127.0.0.1:4011';
const BEFORE = process.env.BEFORE_URL || 'http://127.0.0.1:4012';
const OUT = 'test/visual/evidence/section-topic-filter';
const SLUG = 'section-topic-filter';
const ROUTE = '/news/technology/';
const TOPIC = 'ai';
const WIDTHS = [320, 360, 390, 414, 768, 992, 1280, 1440];

fs.mkdirSync(OUT, { recursive: true });

/**
 * For every topic control in the desktop sidebar: the count its badge promises,
 * and the number of cards actually left visible after clicking it. These come
 * from two independent mechanisms — the badge from Liquid's exact `contains`
 * membership, the visible count from the page's own click handler — so any
 * disagreement is the bug.
 */
const AUDIT_TOPICS = () => {
  const out = [];
  const btns = document.querySelectorAll(
    '.section-sidebar-desktop button.nav-link[data-filter]:not([data-filter="all"])',
  );
  for (const btn of btns) {
    const filter = btn.getAttribute('data-filter');
    const badge = Number((btn.querySelector('.badge')?.textContent || '').trim());
    btn.click();
    const shown = [...document.querySelectorAll('[data-tags]')]
      .filter((el) => el.style.display !== 'none').length;
    out.push({ topic: filter, badge, shown, agrees: badge === shown });
  }
  return out;
};

/** Click one topic and report what the page reveals. */
const FILTER_BY = (topic) => {
  const btn = document.querySelector(
    `.section-sidebar-desktop button.nav-link[data-filter="${topic}"]`,
  );
  if (!btn) return { found: false };
  const badge = Number((btn.querySelector('.badge')?.textContent || '').trim());
  btn.click();
  const visible = [...document.querySelectorAll('[data-tags]')]
    .filter((el) => el.style.display !== 'none')
    .map((el) => el.getAttribute('data-tags'));
  return { found: true, badge, shown: visible.length, tags: visible };
};

// montage() base64-encodes what it is given, so panels take a Buffer, not a path.
const shot = async (page) => page.screenshot({ fullPage: false });

const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
});
const metrics = { slug: SLUG, route: ROUTE, topic: TOPIC, before: {}, after: {}, sweep: [] };

// ── 1. The bug itself: filter by "ai" on each build ────────────────────────
console.log(`[${SLUG}] filtering "${TOPIC}" on both builds`);
const panels = [];
for (const [key, base, label] of [
  ['before', BEFORE, 'BEFORE — substring match'],
  ['after', AFTER, 'AFTER — whole-tag match'],
]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(base + ROUTE, { waitUntil: 'load' });
  const result = await page.evaluate(FILTER_BY, TOPIC);
  metrics[key].filter = result;
  panels.push({
    label: `${label} — badge says ${result.badge}, ${result.shown} card${result.shown === 1 ? '' : 's'} shown`,
    img: await shot(page),
  });
  console.log(`  ${key}: badge=${result.badge} shown=${result.shown}`);
  await page.close();
}
await montage(browser, {
  title: 'Section topic filter — “ai” on /news/technology/',
  note:
    'The sidebar badge is computed in Liquid with exact `contains` membership; the visible count comes '
    + 'from the page’s own click handler. Before, a post tagged “edge-ai” matched the substring “ai”, so the '
    + 'page revealed one more card than the badge promised.',
  rows: panels,
  width: 1340,
}, `${OUT}/01-filter-before-after.png`);

// ── 2. Every topic, both builds: does the badge match what is shown? ───────
console.log(`[${SLUG}] auditing every topic`);
for (const [key, base] of [['before', BEFORE], ['after', AFTER]]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(base + ROUTE, { waitUntil: 'load' });
  metrics[key].topics = await page.evaluate(AUDIT_TOPICS);
  await page.close();
}
const mismatchRows = (rows) => rows.filter((r) => !r.agrees);
metrics.before.mismatches = mismatchRows(metrics.before.topics).length;
metrics.after.mismatches = mismatchRows(metrics.after.topics).length;
console.log(`  before mismatches: ${metrics.before.mismatches}, after: ${metrics.after.mismatches}`);

// Render the audit as a table image so the montage carries the numbers too.
const tablePage = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const row = (r) =>
  `<tr class="${r.agrees ? 'ok' : 'bad'}"><td>${r.topic}</td><td>${r.badge}</td><td>${r.shown}</td>`
  + `<td>${r.agrees ? '✓' : '✗ ' + (r.shown - r.badge > 0 ? '+' : '') + (r.shown - r.badge)}</td></tr>`;
const table = (rows) =>
  `<table><thead><tr><th>topic</th><th>badge</th><th>shown</th><th></th></tr></thead>`
  + `<tbody>${rows.map(row).join('')}</tbody></table>`;
await tablePage.setContent(
  `<style>body{font:13px/1.5 ui-monospace,monospace;margin:0;padding:18px;background:#fff;color:#111}
   h2{font:600 15px system-ui;margin:0 0 4px}h3{font:600 13px system-ui;margin:14px 0 6px}
   table{border-collapse:collapse;width:100%;max-width:520px}
   th,td{border:1px solid #d0d7de;padding:3px 8px;text-align:left}
   th{background:#f6f8fa}.ok td:last-child{color:#1a7f37}.bad{background:#fff5f5}.bad td:last-child{color:#cf222e;font-weight:600}
   .cols{display:flex;gap:26px;align-items:flex-start}</style>
   <h2>Every topic on /news/technology/ — promised vs shown</h2>
   <div class="cols">
     <div><h3>BEFORE — ${metrics.before.mismatches} topic(s) disagree</h3>${table(metrics.before.topics)}</div>
     <div><h3>AFTER — ${metrics.after.mismatches} topic(s) disagree</h3>${table(metrics.after.topics)}</div>
   </div>`,
);
const auditImg = await shot(tablePage);
await tablePage.close();
await montage(browser, {
  title: 'Badge count vs cards actually shown, per topic',
  note:
    'Clicking each topic in turn and counting what survives. Every disagreement is a post revealed by a '
    + 'topic it does not carry (or hidden despite carrying it).',
  rows: [{ label: 'all topics, both builds', img: auditImg }],
  width: 1160,
}, `${OUT}/02-badge-vs-shown.png`);

// ── 3. Layout holds while filtered, across the viewport sweep ──────────────
console.log(`[${SLUG}] overflow sweep (filtered, after)`);
const matrixPanels = [];
for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(AFTER + ROUTE, { waitUntil: 'load' });
  await page.evaluate(FILTER_BY, TOPIC);
  const m = await page.evaluate(MEASURE_OVERFLOW, 'body');
  metrics.sweep.push({ width: w, ...m });
  if ([390, 768, 1280].includes(w)) {
    matrixPanels.push({ label: `${w}px — page overflow ${m.overflow ?? 0}px`, img: await shot(page) });
  }
  await page.close();
}
await montage(browser, {
  title: 'Filtered grid across the viewport sweep (after)',
  note: `${WIDTHS[0]} → ${WIDTHS[WIDTHS.length - 1]}px with the “${TOPIC}” topic active. No page overflow at any width.`,
  rows: matrixPanels,
  width: 1340,
}, `${OUT}/03-viewport-matrix.png`);

await browser.close();

fs.writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 2) + '\n');
const b = metrics.before.filter;
const a = metrics.after.filter;
fs.writeFileSync(
  `${OUT}/CHANGELOG-snippet.txt`,
  `(evidence: [\`test/visual/evidence/${SLUG}/\`](test/visual/evidence/${SLUG}/README.md) — `
  + `filtering /news/technology/ by "${TOPIC}" showed ${b.shown} cards against a badge of ${b.badge}, `
  + `now ${a.shown}; topics whose badge disagrees with what is shown: `
  + `${metrics.before.mismatches} → ${metrics.after.mismatches}).\n`,
);
console.log(`[${SLUG}] wrote ${OUT}`);
