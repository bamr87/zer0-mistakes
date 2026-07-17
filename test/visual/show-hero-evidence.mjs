/**
 * Evidence for the show_hero front-matter opt-in flag (issue #303).
 * ============================================================================
 * `show_hero: true` lets a post of ANY post_type render its `preview:` image
 * as the top-of-article hero without promoting the post to featured/breaking
 * (which also flips layout width, sidebar, typography, and the post-type
 * badge). The flag is a third disjunct inside the existing hero guard in
 * `_layouts/article.html`; it is nil (falsy) on every existing post, so
 * default output is unchanged by construction.
 *
 * This script proves both halves with two REAL builds of the same content
 * (which includes one post opted in via `show_hero: true`):
 *   BEFORE — the merge-base `_layouts/article.html` (pre-feature: the flag is
 *            inert, the opted-in post renders no hero)
 *   AFTER  — the PR head (the flag renders the hero; nothing else changes)
 * plus a whole-build diff: after normalizing non-rendered noise (HTML
 * comments — the layout's doc comment is emitted into every article page —
 * the `?v=<site.time>` cache-buster, and build timestamps), the ONLY page
 * whose rendered output differs is the opted-in post.
 *
 * Reproduce:
 *   # AFTER (PR head):
 *   docker compose run --rm jekyll sh -c "bundle exec jekyll build \
 *     --config _config.yml,_config_dev.yml --destination /site/_evidence/309-after"
 *   # BEFORE (merge-base layout, same content):
 *   git show $(git merge-base main HEAD):_layouts/article.html > _layouts/article.html
 *   docker compose run --rm jekyll sh -c "bundle exec jekyll build \
 *     --config _config.yml,_config_dev.yml --destination /site/_evidence/309-before"
 *   git checkout -- _layouts/article.html
 *   (cd _evidence/309-before && python3 -m http.server 4613) &
 *   (cd _evidence/309-after  && python3 -m http.server 4612) &
 *   BEFORE_URL=http://localhost:4613 AFTER_URL=http://localhost:4612 \
 *     BEFORE_DIR=_evidence/309-before AFTER_DIR=_evidence/309-after \
 *     node test/visual/show-hero-evidence.mjs
 *
 * Writes test/visual/evidence/show-hero/: montages, metrics.json, and a
 * CHANGELOG snippet. See .github/skills/visual-evidence/SKILL.md.
 */
import { chromium } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'fs';
import path from 'node:path';
import { montage } from './evidence-kit.mjs';

const beforeBase = process.env.BEFORE_URL || 'http://localhost:4613';
const afterBase = process.env.AFTER_URL || 'http://localhost:4612';
const beforeDir = process.env.BEFORE_DIR || '_evidence/309-before';
const afterDir = process.env.AFTER_DIR || '_evidence/309-after';
const slug = 'show-hero';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

const OPTED_IN = '/posts/2026/06/17/bayesian-modeled-my-coffee-and-wept-with-joy/'; // show_hero: true (standard post)
const STANDARD = '/posts/2026/06/16/favicon-ico-unlocked-door-to-collapse/'; // standard, no flag
const FEATURED = '/posts/2025/01/22/git-workflow-best-practices/'; // hero'd automatically pre-feature

/** Read hero/sidebar state and screenshot the top of the article. */
async function capture(browser, base, route) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const hero = page.locator('figure.featured-hero');
  const heroPresent = (await hero.count()) > 0;
  const heroLoaded = heroPresent
    ? await hero.locator('img').first().evaluate((img) => img.complete && img.naturalWidth > 0)
    : null;
  const sidebarPresent = (await page.locator('#bdSidebar, .bd-sidebar').count()) > 0;
  const title = page.locator('#page-title');
  const box = await title.boundingBox();
  const img = await page.screenshot({
    clip: { x: 0, y: Math.max(0, box.y - 40), width: 1200, height: 700 },
  });
  await page.close();
  return { heroPresent, heroLoaded, sidebarPresent, img };
}

/** Whole-build rendered-output diff, normalizing non-rendered noise. */
function buildDiff(beforeRoot, afterRoot) {
  const norm = (p) => {
    let s = fs.readFileSync(p, 'utf8')
      .replace(/\?v=\d+/g, '?v=X'); // site.time cache-buster
    // HTML comments are not rendered — strip repeatedly until a fixpoint so
    // removal can never splice together a new `<!--` (CodeQL js/incomplete-
    // multi-character-sanitization).
    let prev;
    do {
      prev = s;
      s = s.replace(/<!--[\s\S]*?-->/g, '');
    } while (s !== prev);
    s = s.replace(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}( UTC)?/g, 'TS'); // build timestamps
    return crypto.createHash('sha256').update(s).digest('hex');
  };
  const differing = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.html')) {
        const after = p.replace(beforeRoot, afterRoot);
        if (!fs.existsSync(after) || norm(p) !== norm(after)) {
          differing.push('/' + path.relative(beforeRoot, p).replace(/index\.html$/, ''));
        }
      }
    }
  };
  walk(beforeRoot);
  return differing;
}

const browser = await chromium.launch();
const metrics = { slug, issue: 303, beforeBase, afterBase, scenarios: [], buildDiff: null };

console.log(`[${slug}] opted-in post — before (flag inert) vs after (hero renders)`);
const optBefore = await capture(browser, beforeBase, OPTED_IN);
const optAfter = await capture(browser, afterBase, OPTED_IN);
console.log(`[${slug}] controls in the AFTER build — standard (no flag) and featured`);
const stdAfter = await capture(browser, afterBase, STANDARD);
const featAfter = await capture(browser, afterBase, FEATURED);
const featBefore = await capture(browser, beforeBase, FEATURED);

metrics.scenarios.push(
  { route: OPTED_IN, frontMatter: 'standard + show_hero: true', state: 'before (merge-base layout)', ...pick(optBefore) },
  { route: OPTED_IN, frontMatter: 'standard + show_hero: true', state: 'after (PR head)', ...pick(optAfter) },
  { route: STANDARD, frontMatter: 'standard, no flag', state: 'after (PR head)', ...pick(stdAfter) },
  { route: FEATURED, frontMatter: 'featured (auto-hero)', state: 'before (merge-base layout)', ...pick(featBefore) },
  { route: FEATURED, frontMatter: 'featured (auto-hero)', state: 'after (PR head)', ...pick(featAfter) },
);
function pick({ heroPresent, heroLoaded, sidebarPresent }) { return { heroPresent, heroLoaded, sidebarPresent }; }

console.log(`[${slug}] whole-build rendered-output diff`);
metrics.buildDiff = {
  normalization: 'strip HTML comments, ?v=<site.time> cache-busters, build timestamps',
  differingPages: buildDiff(beforeDir, afterDir),
};
console.log(`   differing pages: ${JSON.stringify(metrics.buildDiff.differingPages)}`);

await montage(browser, {
  title: 'show_hero opt-in — the flagged post, before vs after',
  width: 1040,
  note: 'Same content (one standard post carries show_hero: true). BEFORE is a real build with the merge-base article.html — the flag is inert; AFTER is the PR head. Sidebar, typography and badges keep their standard post_type defaults in both.',
  rows: [
    { label: `BEFORE — pre-feature layout ignores the flag · hero: ${optBefore.heroPresent} · sidebar: ${optBefore.sidebarPresent}`, img: optBefore.img, w: 960 },
    { label: `✅ AFTER — show_hero: true renders the preview as the hero · hero: ${optAfter.heroPresent} (image loaded: ${optAfter.heroLoaded}) · sidebar: ${optAfter.sidebarPresent}`, img: optAfter.img, w: 960 },
  ],
}, `${outDir}/01-opted-in-before-after.png`);

await montage(browser, {
  title: 'show_hero opt-in — scope guard (AFTER build)',
  width: 1040,
  note: 'The flag changes nothing else: a standard post without the flag still renders no hero, and featured posts keep their automatic hero (identical to the BEFORE build).',
  rows: [
    { label: `✅ standard post, no flag — hero: ${stdAfter.heroPresent} (unchanged default)`, img: stdAfter.img, w: 960 },
    { label: `✅ featured post — hero: ${featAfter.heroPresent} (same as before the feature: ${featBefore.heroPresent})`, img: featAfter.img, w: 960 },
  ],
}, `${outDir}/02-scope-guard.png`);

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
fs.writeFileSync(
  `${outDir}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
    `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
    `hero renders only on the opted-in post; whole-build diff: ${metrics.buildDiff.differingPages.length} page(s) differ)\n`,
);
console.log(`[${slug}] done → ${outDir}/`);
await browser.close();
