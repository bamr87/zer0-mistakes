/**
 * Feature evidence for the Obsidian graph frontend revamp.
 * ============================================================================
 * New feature surface (after-only evidence, per the visual-evidence skill —
 * there is no "before" state to unfix: the controls simply did not exist).
 *
 * Captures, against the live dev server:
 *   1. Full graph page — default view + the floating "Graph settings" card
 *      (Filters open: generated per-collection toggles with counts/swatches).
 *   2. The Filters in action — largest collection toggled off, stats badge
 *      showing the visible-count drop.
 *   3. Dark color mode — the canvas restyles from the live data-bs-theme.
 *   4. Local graph panel — depth selector + direction switches, depth 1 vs 2.
 *
 * Reproduce:
 *   docker compose up                   # serves :4000
 *   BASE_URL=http://localhost:4000 node test/visual/obsidian-graph-revamp-evidence.mjs
 *
 * Writes test/visual/evidence/obsidian-graph-revamp/: montages, metrics.json,
 * and a CHANGELOG snippet. See .github/skills/visual-evidence/SKILL.md.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const base = process.env.BASE_URL || 'http://localhost:4000';
const slug = 'obsidian-graph-revamp';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

const GRAPH_ROUTE = '/docs/obsidian/graph/';
const LOCAL_ROUTE = '/docs/obsidian/';
const SHELL = '#obsidian-graph-shell';

/** Hide the cookie-consent banner so it doesn't overlap the captures. */
async function hideCookieBanner(page) {
  await page.evaluate(() => {
    const banner = document.getElementById('cookieConsent');
    if (banner) banner.hidden = true;
  });
}

/** Wait until the renderer exposes a live cytoscape instance. */
async function waitForGraph(page) {
  await page.waitForFunction(
    () => !!(window.ObsidianGraph && window.ObsidianGraph.cy), { timeout: 30000 });
  // Let the cose layout settle enough to read as a graph.
  await page.waitForTimeout(2500);
}

async function graphPage(browser, { theme = 'light' } = {}) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  // Pre-seed the theme the way halfmoon.js persists it so it sticks.
  await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
  await page.goto(base + GRAPH_ROUTE, { waitUntil: 'load' });
  await waitForGraph(page);
  await hideCookieBanner(page);
  return page;
}

const visibleCounts = (page) => page.evaluate(() => ({
  visible: window.ObsidianGraph.cy.nodes().not('.obsidian-hidden').length,
  total: window.ObsidianGraph.cy.nodes().length,
  stats: document.getElementById('obsidian-graph-stats').innerText.trim().replace(/\s+/g, ' '),
}));

const browser = await chromium.launch();
const metrics = { slug, base, scenarios: [] };

// --- 1. Default view + settings panel open ----------------------------------
console.log(`[${slug}] full graph — default + settings panel`);
let page = await graphPage(browser);
const defaultCounts = await visibleCounts(page);
const imgDefault = await page.locator(SHELL).screenshot();
await page.locator('#obsidian-graph-controls .obsidian-graph-controls-toggle').click();
await page.waitForTimeout(600);
const imgPanel = await page.locator(SHELL).screenshot();
metrics.scenarios.push({ state: 'default', ...defaultCounts });

// --- 2. Collection filter off -------------------------------------------------
console.log(`[${slug}] full graph — largest collection filtered off`);
await page.locator('#obsidian-graph-collections input').first().click();
await page.waitForTimeout(900);
const filteredCounts = await visibleCounts(page);
const imgFiltered = await page.locator(SHELL).screenshot();
metrics.scenarios.push({ state: 'filtered', ...filteredCounts });
await page.close();

// --- 3. Dark mode -------------------------------------------------------------
console.log(`[${slug}] full graph — dark color mode`);
page = await graphPage(browser, { theme: 'dark' });
const darkCounts = await visibleCounts(page);
const imgDark = await page.locator(SHELL).screenshot();
metrics.scenarios.push({ state: 'dark', ...darkCounts });
await page.close();

// --- 4. Local graph panel: depth 1 vs 2 --------------------------------------
console.log(`[${slug}] local graph panel — depth 1 vs 2`);
page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(base + LOCAL_ROUTE, { waitUntil: 'load' });
await page.waitForFunction(() => {
  const fab = document.getElementById('obsidianLocalGraphFab');
  return fab && !fab.hidden;
}, { timeout: 30000 });
await hideCookieBanner(page);
await page.evaluate(() => {
  const panel = document.getElementById('obsidianLocalGraphPanel');
  window.bootstrap.Offcanvas.getOrCreateInstance(panel).show();
});
await page.waitForTimeout(1500);
const localStatus = (sel) => page.locator('[data-obsidian-local-graph-status]').innerText();
const imgLocal1 = await page.locator('#obsidianLocalGraphPanel').screenshot();
const statusDepth1 = (await localStatus()).trim();
await page.locator('label[for="obsidian-lg-depth-2"]').click();
await page.waitForTimeout(1500);
const imgLocal2 = await page.locator('#obsidianLocalGraphPanel').screenshot();
const statusDepth2 = (await localStatus()).trim();
metrics.scenarios.push(
  { state: 'local-depth-1', status: statusDepth1 },
  { state: 'local-depth-2', status: statusDepth2 },
);
await page.close();

// --- Montages -----------------------------------------------------------------
await montage(browser, {
  title: 'Obsidian graph revamp — settings panel, filters, dark mode',
  width: 1040,
  note: `Full graph page (${GRAPH_ROUTE}). New floating "Graph settings" card with Filters / Display / Forces, a zoom + fullscreen stack, and a live-generated collection legend. Settings persist to localStorage.`,
  rows: [
    {
      label: `Default view — ${defaultCounts.stats}`,
      img: imgDefault, w: 960,
      caption: 'Orphans hidden by default (matches Obsidian). Hub pages keep their labels; zoom reveals the rest.',
    },
    {
      label: 'Graph settings open — Filters section with per-collection toggles (count + swatch = legend)',
      img: imgPanel, w: 960,
      caption: 'Search supports tag:foo and path:docs operators. Display sliders rescale nodes/links live; Forces sliders re-run the layout.',
    },
    {
      label: `Largest collection toggled off — ${filteredCounts.stats}`,
      img: imgFiltered, w: 960,
      caption: `Visible nodes ${defaultCounts.visible} → ${filteredCounts.visible}; edges to hidden nodes disappear with them.`,
    },
    {
      label: 'Dark color mode — canvas restyles from the live data-bs-theme (no reload)',
      img: imgDark, w: 960,
    },
  ],
}, `${outDir}/01-graph-controls.png`);

await montage(browser, {
  title: 'Obsidian local graph — depth + direction controls',
  width: 620,
  note: `Local graph offcanvas panel (any indexed page, here ${LOCAL_ROUTE}). New depth selector (1–3) and outgoing/incoming switches re-render the subgraph in place and persist per-browser.`,
  rows: [
    { label: `Depth 1 — ${statusDepth1}`, img: imgLocal1, w: 460 },
    { label: `Depth 2 — ${statusDepth2}`, img: imgLocal2, w: 460 },
  ],
}, `${outDir}/02-local-graph-depth.png`);

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
  `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md))`);

await browser.close();
console.log(`[${slug}] done → ${outDir}/`);
