/**
 * Before/after evidence for the component-showcase existence-guard fix (issue #219).
 * ============================================================================
 * Phase 1 (prior fix): wrapped header-comment usage examples in {% raw %} and
 *   replaced site-absolute demo links with inert href="#" onclick="return false;".
 * Phase 2 (this fix): replaced the inert href="#" links with EXISTENCE-GUARDED
 *   real links — rendered as <a href="..."> when the target page exists in the
 *   build, or as plain text when it does not. This ensures the showcase works as
 *   a proper demo on full builds while still being safe for remote-theme consumers.
 *
 * BEFORE = state just before this branch (href="#" inert — the phase 1 output).
 * AFTER  = live render after this fix (existence-guarded links).
 *
 * Run against the dev server:
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

// --- BEFORE: parse demo-link hrefs from the pre-fix include on main ----------
const mergeBase = execSync('git merge-base main HEAD').toString().trim();
const beforeFile = execSync(`git show ${mergeBase}:_includes/components/component-showcase.html`).toString();
function hrefsIn(html, blockRe) {
  const block = html.match(blockRe);
  if (!block) return [];
  return [...block[0].matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
}
const beforeBreadcrumb = hrefsIn(beforeFile, /<ol class="breadcrumb">[\s\S]*?<\/ol>/);
const beforeListGroup = hrefsIn(beforeFile, /<div class="list-group">[\s\S]*?<\/div>/);
const beforeInertLinks = [...beforeBreadcrumb, ...beforeListGroup].filter((h) => h === '#').length;
const beforeOnclickCount = (beforeFile.match(/onclick="return false;"/g) || []).length;

// --- AFTER: read the live-rendered existence-guarded demo links + screenshot -
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 900, height: 1100 });
await page.goto(base + route, { waitUntil: 'load' });
await page.waitForTimeout(200);

const afterBreadcrumb = await page.locator('nav[aria-label="breadcrumb example"] a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
const afterListGroupLinks = await page.locator('.list-group:has(.list-group-item:has-text("Blog Posts")) a.list-group-item').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
const afterListGroupDivs = await page.locator('.list-group:has(.list-group-item:has-text("Blog Posts")) div.list-group-item').count();
const afterInertLinks = [...afterBreadcrumb, ...afterListGroupLinks].filter((h) => h === '#').length;
const afterOnclick = await page.locator('nav[aria-label="breadcrumb example"] a[onclick], .list-group a[onclick]').count();

const breadcrumbImg = await page.locator('nav[aria-label="breadcrumb example"]').screenshot();
const listGroupImg = await page.locator('.list-group:has(.list-group-item:has-text("Blog Posts"))').screenshot();

const metrics = {
  slug, base, route, issue: 219, mergeBase,
  before: {
    description: 'Phase 1 output on main: inert href="#" with onclick="return false;"',
    breadcrumbDemoHrefs: beforeBreadcrumb,
    listGroupDemoHrefs: beforeListGroup,
    inertLinks: beforeInertLinks,
    onclickHandlers: beforeOnclickCount,
  },
  after: {
    description: 'Phase 2 (this fix): existence-guarded links — real href when page exists, plain text when not',
    breadcrumbDemoHrefs: afterBreadcrumb,
    listGroupDemoHrefs: afterListGroupLinks,
    listGroupPlainDivs: afterListGroupDivs,
    inertLinks: afterInertLinks,
    onclickHandlers: afterOnclick,
    realLinks: afterBreadcrumb.filter((h) => h && h !== '#').length + afterListGroupLinks.filter((h) => h && h !== '#').length,
  },
};

await montage(browser, {
  title: 'Component showcase — demo links existence-guarded (issue #219 phase 2)',
  width: 900,
  note: `BEFORE (main): ${beforeInertLinks} inert href="#" links with onclick="return false;" — demo but non-functional. AFTER: existence-guarded real links (${metrics.after.realLinks} live, ${afterListGroupDivs} plain-text divs where page absent); 0 onclick handlers.`,
  rows: [
    { label: 'AFTER — Breadcrumbs demo: existence-guarded real links', img: breadcrumbImg, w: 820 },
    { label: 'AFTER — List-group demo: existence-guarded links or plain divs', img: listGroupImg, w: 820 },
  ],
}, `${outDir}/02-existence-guard-after.png`);

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));

const snippet =
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
  `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
  `showcase demo links: ${beforeInertLinks} inert href="#" → ${metrics.after.realLinks} real existence-guarded links + ${afterListGroupDivs} plain-text fallbacks; 0 onclick handlers).`;
fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`, snippet);

await browser.close();
console.log(`[${slug}] done → ${outDir}/`);
console.log(JSON.stringify(metrics, null, 2));
