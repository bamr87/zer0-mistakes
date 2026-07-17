/**
 * Before/after evidence for the obsidian-graph wiki-index URL fix (issue #294).
 * ============================================================================
 * The bug only bites on a PROJECT SITE (non-empty baseurl, e.g. GitHub Pages
 * at /reponame/): the pre-fix renderer ignored the baseurl-aware
 * `window.OBSIDIAN_CONFIG.wikiIndexUrl` that js-cdn.html emits and fell back
 * to a <base>-relative `/assets/data/wiki-index.json`, which 404s under a
 * baseurl — so the graph page rendered a "Failed to load graph data" alert.
 *
 * This script therefore drives a baseurl'd build of the site. The BEFORE
 * state is the *actual* pre-fix assets/js/obsidian-graph.js (read from the
 * PR's merge-base via `git show` and served back through page.route), so the
 * montage is a faithful diff of the real code change, not a hand-mock.
 *
 * Reproduce:
 *   # 1. Build the theme as a project site and serve it statically:
 *   docker compose run --rm jekyll sh -c "bundle exec jekyll build \
 *     --config _config.yml,_config_dev.yml --baseurl /zer0-mistakes \
 *     --destination /site/_evidence/graph-baseurl/zer0-mistakes"
 *   (cd _evidence/graph-baseurl && python3 -m http.server 4605) &
 *   # 2. Generate the evidence:
 *   BASE_URL=http://localhost:4605 BASE_PATH=/zer0-mistakes \
 *     node test/visual/obsidian-graph-index-evidence.mjs
 *
 * Writes test/visual/evidence/obsidian-graph-index/: montage, metrics.json,
 * and a CHANGELOG snippet. See .github/skills/visual-evidence/SKILL.md.
 */
import { chromium } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const base = process.env.BASE_URL || 'http://localhost:4605';
const basePath = process.env.BASE_PATH || '/zer0-mistakes';
const route = `${basePath}/docs/obsidian/graph/`;
const slug = 'obsidian-graph-index';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

const CONTAINER = '#obsidian-graph';
const STATS = '#obsidian-graph-stats';

// Faithful BEFORE: the exact pre-fix renderer from the PR's merge-base.
const mergeBase = execSync('git merge-base main HEAD').toString().trim();
const beforeJs = execSync(`git show ${mergeBase}:assets/js/obsidian-graph.js`).toString();

/** Load the graph page and read back what happened. */
async function captureGraph(browser, { useBeforeJs }) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1100, height: 820 });
  if (useBeforeJs) {
    await page.route('**/obsidian-graph.js*', (r) =>
      r.fulfill({ status: 200, contentType: 'application/javascript', body: beforeJs }),
    );
  }
  const indexResponses = [];
  page.on('response', (resp) => {
    if (resp.url().includes('wiki-index')) {
      indexResponses.push({ path: new URL(resp.url()).pathname, status: resp.status() });
    }
  });
  await page.goto(base + route, { waitUntil: 'load' });
  // Let the fetch resolve and (in the AFTER state) cytoscape settle its layout.
  await page.waitForTimeout(4000);
  const alert = await page.locator(`${CONTAINER} .alert-danger`).count()
    ? (await page.locator(`${CONTAINER} .alert-danger`).innerText()).trim()
    : null;
  const stats = (await page.locator(STATS).innerText()).trim().replace(/\s+/g, ' ');
  const rendered = await page.evaluate(() => !!window.ObsidianGraph);
  const img = await page.locator(CONTAINER).screenshot();
  await page.close();
  return { indexResponses, alert, stats, rendered, img };
}

const browser = await chromium.launch();
const metrics = { slug, base, route, issue: 294, mergeBase, scenarios: [] };

console.log(`[${slug}] BEFORE — pre-fix obsidian-graph.js on a baseurl'd site`);
const before = await captureGraph(browser, { useBeforeJs: true });
console.log(`  index requests: ${JSON.stringify(before.indexResponses)} rendered=${before.rendered}`);

console.log(`[${slug}] AFTER — fixed obsidian-graph.js on the same site`);
const after = await captureGraph(browser, { useBeforeJs: false });
console.log(`  index requests: ${JSON.stringify(after.indexResponses)} rendered=${after.rendered} stats="${after.stats}"`);

metrics.scenarios.push(
  { state: 'before', js: 'pre-fix (merge-base)', indexRequests: before.indexResponses, rendered: before.rendered, alert: before.alert, stats: before.stats || null },
  { state: 'after', js: 'fixed (PR head)', indexRequests: after.indexResponses, rendered: after.rendered, alert: after.alert, stats: after.stats || null },
);

// Unique path → status pairs (the page's OTHER obsidian components — wiki-links,
// local graph — also fetch the index; they already resolved the baseurl-aware URL).
const uniq = (rs) => [...new Set(rs.map((r) => `${r.path} → ${r.status}`))];

await montage(browser, {
  title: `Obsidian graph on a project site (baseurl ${basePath}) — before vs after`,
  width: 1040,
  note: `Same baseurl'd build, same page (${route}). BEFORE is the actual pre-fix obsidian-graph.js served via route interception; AFTER is the fix.`,
  rows: [
    {
      label: `❌ BEFORE — graph fetches ${uniq(before.indexResponses)[0] || 'nothing'} · graph never renders`,
      img: before.img, w: 960,
      caption: (before.alert ? `Rendered alert: “${before.alert}”. ` : '')
        + 'The 404 is the pre-fix <base>-relative fallback; the other components on the page already fetch the baseurl-aware URL and keep working.',
    },
    {
      label: `✅ AFTER — graph fetches ${uniq(after.indexResponses)[0]} · ${after.stats}`,
      img: after.img, w: 960,
      caption: 'The renderer now reads window.OBSIDIAN_CONFIG.wikiIndexUrl (baseurl-aware, emitted by js-cdn.html).',
    },
  ],
}, `${outDir}/01-before-after-baseurl.png`);

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
fs.writeFileSync(
  `${outDir}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
    `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
    `wiki-index fetch ${before.indexResponses[0]?.status ?? 404} → ${after.indexResponses[0]?.status ?? 200} on a baseurl'd build)\n`,
);
console.log(`[${slug}] done → ${outDir}/`);
await browser.close();
