/**
 * Before/after evidence for the intro-banner double-baseurl fix (issue #293).
 * ============================================================================
 * `_includes/content/intro.html` resolves the banner image into `preview_path`
 * with `relative_url` applied during assignment — and the pre-fix point of use
 * piped it through `relative_url` AGAIN. Since the filter unconditionally
 * prepends `site.baseurl`, any project site (non-empty baseurl) rendered
 *
 *     url('/reponame/reponame/assets/…')   ← baseurl twice → 404
 *
 * so every intro hero lost its background image (the dark gradient over the
 * page background is all that's left). The fix applies the filter exactly
 * once. At baseurl "" (local dev) both spellings coincide — which is why the
 * bug never showed locally.
 *
 * The include renders server-side, so both states are REAL Jekyll builds at
 * `--baseurl /zer0-mistakes`: BEFORE with intro.html reverted to the PR's
 * merge-base, AFTER at the PR head — a faithful diff of the real code change.
 *
 * Reproduce:
 *   # AFTER (PR head):
 *   docker compose run --rm jekyll sh -c "bundle exec jekyll build \
 *     --config _config.yml,_config_dev.yml --baseurl /zer0-mistakes \
 *     --destination /site/_evidence/307-after/zer0-mistakes"
 *   # BEFORE (merge-base include):
 *   git show $(git merge-base main HEAD):_includes/content/intro.html \
 *     > _includes/content/intro.html
 *   docker compose run --rm jekyll sh -c "bundle exec jekyll build \
 *     --config _config.yml,_config_dev.yml --baseurl /zer0-mistakes \
 *     --destination /site/_evidence/307-before/zer0-mistakes"
 *   git checkout -- _includes/content/intro.html
 *   (cd _evidence/307-before && python3 -m http.server 4609) &
 *   (cd _evidence/307-after  && python3 -m http.server 4608) &
 *   BEFORE_URL=http://localhost:4609 AFTER_URL=http://localhost:4608 \
 *     BASE_PATH=/zer0-mistakes node test/visual/intro-banner-baseurl-evidence.mjs
 *
 * Writes test/visual/evidence/intro-banner-baseurl/: montages, metrics.json,
 * and a CHANGELOG snippet. See .github/skills/visual-evidence/SKILL.md.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const beforeBase = process.env.BEFORE_URL || 'http://localhost:4609';
const afterBase = process.env.AFTER_URL || 'http://localhost:4608';
const basePath = process.env.BASE_PATH || '/zer0-mistakes';
const slug = 'intro-banner-baseurl';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

// One route per preview_path branch that a project site exercises:
//   faq/    → site.info_banner fallback ('/assets/…' → the "contains assets_prefix" branch)
//   graph/  → page.preview without the /assets prefix (the auto-prefix branch)
const ROUTES = [
  { route: `${basePath}/faq/`, label: 'site.info_banner fallback (/faq/)' },
  { route: `${basePath}/docs/obsidian/graph/`, label: 'page.preview auto-prefix (/docs/obsidian/graph/)' },
];

/** Read the intro hero's background-image URL, its HTTP status, and a shot. */
async function capture(browser, base, route) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1100, height: 760 });
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const bg = await page.$eval('.bd-intro', (el) => getComputedStyle(el).backgroundImage);
  const match = /url\("([^"]+)"\)/.exec(bg);
  const bgUrl = match ? match[1] : null;
  const status = bgUrl ? (await page.request.get(bgUrl)).status() : null;
  const img = await page.locator('.bd-intro').screenshot();
  await page.close();
  return { bgUrl: bgUrl && new URL(bgUrl, base).pathname, status, img };
}

const browser = await chromium.launch();
const metrics = { slug, issue: 293, beforeBase, afterBase, basePath, pages: [] };

for (const { route, label } of ROUTES) {
  console.log(`[${slug}] ${label} — before vs after`);
  const before = await capture(browser, beforeBase, route);
  const after = await capture(browser, afterBase, route);
  metrics.pages.push({ route, before: { bgUrl: before.bgUrl, status: before.status }, after: { bgUrl: after.bgUrl, status: after.status } });
  console.log(`   before: ${before.bgUrl} → ${before.status}; after: ${after.bgUrl} → ${after.status}`);

  await montage(browser, {
    title: `Intro hero banner on a project site (baseurl ${basePath}) — ${label}`,
    width: 1040,
    note: 'Same baseurl\'d build. BEFORE is a real Jekyll build with the merge-base include (relative_url applied twice); AFTER is the PR head (applied exactly once).',
    rows: [
      {
        label: `❌ BEFORE — background: ${before.bgUrl} → HTTP ${before.status} · banner image missing (gradient only)`,
        img: before.img, w: 960,
      },
      {
        label: `✅ AFTER — background: ${after.bgUrl} → HTTP ${after.status} · banner image renders`,
        img: after.img, w: 960,
      },
    ],
  }, `${outDir}/0${metrics.pages.length}-${route.split('/').filter(Boolean).pop()}.png`);
}

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
fs.writeFileSync(
  `${outDir}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
    `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
    `intro background \`${basePath}${basePath}/assets/…\` 404 → \`${basePath}/assets/…\` 200 on a baseurl'd build)\n`,
);
console.log(`[${slug}] done → ${outDir}/`);
await browser.close();
