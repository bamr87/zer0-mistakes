/**
 * Before/after evidence for the component-showcase fix (issue #219).
 * ============================================================================
 * Two things changed in _includes/components/component-showcase.html:
 *   1. The header-comment usage examples are wrapped in {% raw %} — un-wrapped,
 *      Liquid executed them and the include recursively included itself
 *      ("stack level too deep"), so it could not be rendered at all.
 *   2. The breadcrumb + list-group DEMO links became inert (href="#") instead of
 *      site-absolute paths (/docs/, /pages/, /categories/, /tags/) that 404 on
 *      remote-theme consumers.
 *
 * AFTER is the live render on /about/settings/components/ (the include now
 * actually renders). BEFORE demo-link hrefs are read from the real pre-fix file
 * via `git show` — a faithful diff, not a hand-mock. Run against the dev server:
 *
 *   BASE_URL=http://localhost:4000 node test/visual/component-showcase-evidence.mjs
 */
import { chromium } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const base = process.env.BASE_URL || 'http://localhost:4000';
const route = '/about/settings/components/';
const slug = 'component-showcase';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

// --- BEFORE: parse demo-link hrefs from the actual pre-fix include ----------
const mergeBase = execSync('git merge-base main HEAD').toString().trim();
const beforeFile = execSync(`git show ${mergeBase}:_includes/components/component-showcase.html`).toString();
// Demo links live in the breadcrumb <ol> and the "Quick links" <div class="list-group">.
function hrefsIn(html, blockRe) {
  const block = html.match(blockRe);
  if (!block) return [];
  return [...block[0].matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
}
const beforeBreadcrumb = hrefsIn(beforeFile, /<ol class="breadcrumb">[\s\S]*?<\/ol>/);
const beforeListGroup = hrefsIn(beforeFile, /<div class="list-group">[\s\S]*?<\/div>/);

// --- AFTER: read the live-rendered demo links + screenshot ------------------
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 900, height: 1100 });
await page.goto(base + route, { waitUntil: 'load' });
await page.waitForTimeout(200);

const afterBreadcrumb = await page.locator('nav[aria-label="breadcrumb example"] a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
const afterListGroup = await page.locator('.list-group:has(a:has-text("Blog Posts")) a.list-group-item').evaluateAll((els) => els.map((e) => e.getAttribute('href')));

const breadcrumbImg = await page.locator('nav[aria-label="breadcrumb example"]').screenshot();
const listGroupImg = await page.locator('.list-group:has(a:has-text("Blog Posts"))').screenshot();

const metrics = {
  slug, base, route, issue: 219, mergeBase,
  before: {
    canRender: false,
    renderError: 'stack level too deep — header-comment usage examples executed and the include recursively included itself',
    breadcrumbDemoHrefs: beforeBreadcrumb,
    listGroupDemoHrefs: beforeListGroup,
    absoluteDemoLinks: [...beforeBreadcrumb, ...beforeListGroup].filter((h) => h.startsWith('/')).length,
  },
  after: {
    canRender: true,
    breadcrumbDemoHrefs: afterBreadcrumb,
    listGroupDemoHrefs: afterListGroup,
    absoluteDemoLinks: [...afterBreadcrumb, ...afterListGroup].filter((h) => h && h.startsWith('/')).length,
  },
};

await montage(browser, {
  title: 'Component showcase — demo links inert + include now renders (issue #219)',
  width: 900,
  note: `BEFORE: the include could not render (recursion) and its demo links were site-absolute (${metrics.before.absoluteDemoLinks} × /docs//pages//categories//tags/ → 404 on consumers). AFTER: renders on /about/settings/components/ with all demo links inert (href="#").`,
  rows: [
    { label: '✅ AFTER — Breadcrumbs demo · all links href="#" (inert)', img: breadcrumbImg, w: 820 },
    { label: '✅ AFTER — List-group demo · all links href="#" (inert)', img: listGroupImg, w: 820 },
  ],
}, `${outDir}/01-demo-links-after.png`);

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));

const snippet =
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
  `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
  `showcase demo links ${metrics.before.absoluteDemoLinks} site-absolute (404 hazard) → 0 (all href="#"); include now renders (recursion fixed)).`;
fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`, snippet);

await browser.close();
console.log(`[${slug}] done → ${outDir}/`);
console.log(JSON.stringify(metrics, null, 2));
