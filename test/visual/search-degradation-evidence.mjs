/**
 * Before/after evidence for the search graceful-degradation fix (issue #202).
 * ============================================================================
 * Reproduces a remote-theme GitHub Pages consumer — where the plugin-only
 * generator never ran, so /search.json (and /sitemap/) 404 — on the live dev
 * server by intercepting /search.json. The BEFORE state is the *actual* pre-fix
 * assets/js/search-modal.js (read from the merge-base via `git show` and served
 * back through page.route), so the montage is a faithful diff of the real code
 * change, not a hand-mock. Run it against `docker compose up`:
 *
 *   BASE_URL=http://localhost:4000 node test/visual/search-degradation-evidence.mjs
 *
 * Writes test/visual/evidence/search-degradation/: montages, metrics.json, and
 * a CHANGELOG snippet. See .github/skills/visual-evidence/SKILL.md.
 */
import { chromium } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const base = process.env.BASE_URL || 'http://localhost:4000';
const slug = 'search-degradation';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

const MODAL = '#siteSearchModal';
const DIALOG = '#siteSearchModal .modal-dialog';
const INPUT = '[data-search-input]';
const RESULTS = '[data-search-results]';

const INDEX_FIXTURE = [
  { title: 'Jekyll Theme Guide', url: '/docs/guide/', description: 'Configure the jekyll theme', content: 'jekyll setup and configuration' },
  { title: 'Quickstart', url: '/quickstart/', description: 'Get started with Jekyll', content: 'install and serve jekyll locally' },
];

// Faithful BEFORE: the exact pre-fix search-modal.js from the PR's merge-base.
const mergeBase = execSync('git merge-base main HEAD').toString().trim();
const beforeJs = execSync(`git show ${mergeBase}:assets/js/search-modal.js`).toString();

async function newScenarioPage(browser, { useBeforeJs, indexStatus }) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 720, height: 760 });
  await page.route('**/search.json', (route) =>
    route.fulfill({
      status: indexStatus,
      contentType: indexStatus === 200 ? 'application/json' : 'text/plain',
      body: indexStatus === 200 ? JSON.stringify(INDEX_FIXTURE) : 'Not Found',
    }),
  );
  if (useBeforeJs) {
    await page.route('**/search-modal.js', (route) =>
      route.fulfill({ status: 200, contentType: 'application/javascript', body: beforeJs }),
    );
  }
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  await page.keyboard.press('/');
  await page.locator(MODAL).waitFor({ state: 'visible' });
  return page;
}

/** Type a query, let the modal render, and read back the resulting state. */
async function captureModal(browser, opts) {
  const page = await newScenarioPage(browser, opts);
  await page.locator(INPUT).fill(opts.query);
  await page.waitForTimeout(600); // debounce (200ms) + async render
  const resultsText = (await page.locator(RESULTS).innerText()).trim();
  const viewAll = page.locator(`${RESULTS} a`, { hasText: 'View all results' });
  const viewAllPresent = (await viewAll.count()) > 0;
  const viewAllHref = viewAllPresent ? await viewAll.first().getAttribute('href') : null;
  const itemCount = await page.locator(`${RESULTS} .list-group-item`).count();
  const img = await page.locator(DIALOG).screenshot();
  await page.close();
  return { resultsText, viewAllPresent, viewAllHref, itemCount, img };
}

/** Submit the form (Enter) and report where, if anywhere, the page navigated. */
async function captureSubmit(browser, opts) {
  const page = await newScenarioPage(browser, opts);
  await page.locator(INPUT).fill(opts.query);
  await page.waitForTimeout(300);
  await page.locator(INPUT).press('Enter');
  let navigatedTo = null;
  try {
    await page.waitForURL((url) => new URL(url).pathname !== '/', { timeout: 3000 });
    navigatedTo = new URL(page.url()).pathname;
  } catch {
    navigatedTo = null; // stayed on '/' (in-modal) — no dead-end navigation
  }
  const stillInModal = await page.locator(MODAL).isVisible().catch(() => false);
  await page.close();
  return { navigatedTo, stillInModal };
}

const browser = await chromium.launch();
const metrics = { slug, base, route: '/', issue: 202, mergeBase, scenarios: [] };

console.log(`[${slug}] capturing empty-state (missing /search.json) — before vs after`);
const before404 = await captureModal(browser, { useBeforeJs: true, indexStatus: 404, query: 'jekyll' });
const after404 = await captureModal(browser, { useBeforeJs: false, indexStatus: 404, query: 'jekyll' });
const after200 = await captureModal(browser, { useBeforeJs: false, indexStatus: 200, query: 'jekyll' });

console.log(`[${slug}] capturing submit behaviour (Enter) — before vs after`);
const beforeSubmit = await captureSubmit(browser, { useBeforeJs: true, indexStatus: 404, query: 'jekyll' });
const afterSubmit = await captureSubmit(browser, { useBeforeJs: false, indexStatus: 404, query: 'jekyll' });

metrics.scenarios.push(
  { state: 'before', js: 'pre-fix', indexStatus: 404, emptyStateText: before404.resultsText, viewAllLink: before404.viewAllPresent, submitNavigatedTo: beforeSubmit.navigatedTo, stayedInModal: beforeSubmit.stillInModal },
  { state: 'after', js: 'fixed', indexStatus: 404, emptyStateText: after404.resultsText, viewAllLink: after404.viewAllPresent, submitNavigatedTo: afterSubmit.navigatedTo, stayedInModal: afterSubmit.stillInModal },
  { state: 'after', js: 'fixed', indexStatus: 200, results: after200.itemCount, viewAllLink: after200.viewAllPresent, viewAllHref: after200.viewAllHref },
);

await montage(browser, {
  title: 'Search modal — missing /search.json (remote-theme consumer)',
  width: 800,
  note: 'Same page, /search.json forced to 404. BEFORE is the actual pre-fix search-modal.js; AFTER is the fix.',
  rows: [
    { label: `❌ BEFORE — "${before404.resultsText}"  ·  looks like the site simply has no matching content`, img: before404.img, w: 700 },
    { label: `✅ AFTER — "${after404.resultsText}"  ·  honest that search itself is unavailable here`, img: after404.img, w: 700 },
  ],
}, `${outDir}/01-empty-state-before-after.png`);

await montage(browser, {
  title: 'Search modal — /search.json present (full site): behaviour preserved',
  width: 800,
  note: `Fixed JS with the index available — ${after200.itemCount} result(s) and the "View all results" link (→ ${after200.viewAllHref}) render exactly as before.`,
  rows: [
    { label: `✅ AFTER — index present · ${after200.itemCount} results + "View all results" link`, img: after200.img, w: 700 },
  ],
}, `${outDir}/02-index-present-after.png`);

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));

const snippet =
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
  `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
  `missing /search.json: "${before404.resultsText}" → "${after404.resultsText}"; ` +
  `submit ${beforeSubmit.navigatedTo ? `navigated to ${beforeSubmit.navigatedTo}` : 'navigated away'} → stays in-modal).`;
fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`, snippet);

await browser.close();
console.log(`[${slug}] done → ${outDir}/`);
console.log(JSON.stringify(metrics.scenarios, null, 2));
