/**
 * Before/after evidence for the Quick Links Dev-row production gate (#298).
 * ============================================================================
 * `_includes/components/env-switcher.html` builds `dev_url` from a hardcoded
 * `http://localhost:{{ site.port | default: 4000 }}` and — pre-fix — rendered
 * the Quick Links "Dev" row (link + open + copy buttons) UNCONDITIONALLY, so
 * every production build shipped a dead `localhost:4000` row to real
 * visitors. The fix wraps the row in `{% unless is_production %}`, keeping it
 * available in dev context (including Docker serving with
 * JEKYLL_ENV=production on a localhost site.url, per the component's
 * documented behaviour).
 *
 * The include renders server-side, so the production states are REAL
 * production builds (JEKYLL_ENV=production, the theme's canonical
 * `_config.yml` with site.url=https://zer0-mistakes.com): BEFORE with the
 * include reverted to the PR's merge-base, AFTER at the PR head. The third
 * panel is the live dev server, showing the Dev row is still there for
 * development.
 *
 * Reproduce:
 *   # AFTER (PR head), production:
 *   docker compose run -e JEKYLL_ENV=production --rm jekyll sh -c \
 *     "bundle exec jekyll build --config _config.yml --destination /site/_evidence/308-after-prod"
 *   # BEFORE (merge-base include), production:
 *   git show $(git merge-base main HEAD):_includes/components/env-switcher.html \
 *     > _includes/components/env-switcher.html
 *   docker compose run -e JEKYLL_ENV=production --rm jekyll sh -c \
 *     "bundle exec jekyll build --config _config.yml --destination /site/_evidence/308-before-prod"
 *   git checkout -- _includes/components/env-switcher.html
 *   (cd _evidence/308-before-prod && python3 -m http.server 4611) &
 *   (cd _evidence/308-after-prod  && python3 -m http.server 4610) &
 *   docker compose up   # dev server on :4000
 *   BEFORE_URL=http://localhost:4611 AFTER_URL=http://localhost:4610 \
 *     DEV_URL=http://127.0.0.1:4000 node test/visual/env-switcher-prod-evidence.mjs
 *
 * Writes test/visual/evidence/env-switcher-prod/: montages, metrics.json, and
 * a CHANGELOG snippet. See .github/skills/visual-evidence/SKILL.md.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const beforeBase = process.env.BEFORE_URL || 'http://localhost:4611';
const afterBase = process.env.AFTER_URL || 'http://localhost:4610';
const devBase = process.env.DEV_URL || 'http://127.0.0.1:4000';
const slug = 'env-switcher-prod';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

// The env-switcher lives in the site-wide Settings offcanvas (#info-section,
// Site tab) rendered by root.html on EVERY page — the pre-fix leak shipped the
// dead localhost row on every production page, not just an admin screen.
const ROUTE = '/';
const CARD = '#site-pane .card:has(.bi-signpost-2)'; // the Quick Links card

/** Open Settings → Site tab, read the Quick Links rows, screenshot the card. */
async function capture(browser, base) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto(base + ROUTE, { waitUntil: 'load' });
  // House pattern (settings-evidence.mjs): deterministic offcanvas + tab waits.
  await page.waitForFunction(() => window.bootstrap && document.getElementById('info-section'));
  await page.evaluate(() => document.getElementById('cookieConsent')?.remove());
  await page.evaluate(() => new Promise((resolve) => {
    const el = document.getElementById('info-section');
    el.addEventListener('shown.bs.offcanvas', () => resolve(), { once: true });
    window.bootstrap.Offcanvas.getOrCreateInstance(el).show();
  }));
  await page.click('#site-tab');
  await page.waitForSelector('#site-pane.active.show', { state: 'attached' });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const card = page.locator(CARD).first();
  await card.scrollIntoViewIfNeeded();
  const rows = await card.locator('li.list-group-item').evaluateAll((lis) =>
    lis.map((li) => ({
      badge: li.querySelector('.badge')?.textContent.trim() || null,
      link: li.querySelector('a')?.getAttribute('href') || null,
    })),
  );
  // Count leaks inside the Settings offcanvas only — page CONTENT legitimately
  // documents localhost:4000 in setup code samples; the bug is chrome shipping it.
  const localhostLeaks = await page.$eval(
    '#info-section',
    (el) => (el.innerHTML.match(/localhost:4000/g) || []).length,
  );
  const img = await card.screenshot();
  await page.close();
  return { rows, localhostLeaks, img };
}

const browser = await chromium.launch();
console.log(`[${slug}] production before/after + dev`);
const before = await capture(browser, beforeBase);
const after = await capture(browser, afterBase);
const dev = await capture(browser, devBase);

const metrics = {
  slug, issue: 298, route: ROUTE,
  scenarios: [
    { state: 'before', build: 'JEKYLL_ENV=production', rows: before.rows, localhostOccurrencesInSettingsChrome: before.localhostLeaks },
    { state: 'after', build: 'JEKYLL_ENV=production', rows: after.rows, localhostOccurrencesInSettingsChrome: after.localhostLeaks },
    { state: 'after', build: 'development (dev server)', rows: dev.rows, localhostOccurrencesInSettingsChrome: dev.localhostLeaks },
  ],
};
for (const s of metrics.scenarios) {
  console.log(`   ${s.state} (${s.build}): rows=${s.rows.map((r) => r.badge).join("/")} localhost(chrome)×${s.localhostOccurrencesInSettingsChrome}`);
}

await montage(browser, {
  title: 'Quick Links Dev row — production build, before vs after (+ dev unchanged)',
  width: 1040,
  note: 'Real JEKYLL_ENV=production builds of the same config. BEFORE is the merge-base include; AFTER is the PR head. The dev-server panel shows the Dev row is still available in development.',
  rows: [
    {
      label: `❌ BEFORE (production) — rows: ${before.rows.map((r) => r.badge).join(' · ')} — dead localhost:4000 row shipped to real visitors (${before.localhostLeaks} occurrence(s) in the Settings chrome)`,
      img: before.img, w: 900,
    },
    {
      label: `✅ AFTER (production) — rows: ${after.rows.map((r) => r.badge).join(' · ')} — no localhost in the Settings chrome (${after.localhostLeaks} occurrences)`,
      img: after.img, w: 900,
    },
    {
      label: `✅ AFTER (development) — rows: ${dev.rows.map((r) => r.badge).join(' · ')} — Dev row preserved for local work`,
      img: dev.img, w: 900,
    },
  ],
}, `${outDir}/01-quick-links-prod.png`);

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
fs.writeFileSync(
  `${outDir}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
    `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
    `production Settings-chrome localhost:4000 occurrences ${before.localhostLeaks} → ${after.localhostLeaks}; Dev row intact in development)\n`,
);
console.log(`[${slug}] done → ${outDir}/`);
await browser.close();
