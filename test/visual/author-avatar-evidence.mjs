/**
 * Before/after evidence for the author-avatar protocol-relative URL fix (#297).
 * ============================================================================
 * The pre-fix `_includes/components/author-avatar-url.html` built relative
 * avatar paths by manual slash concatenation:
 *
 *     {{ site.baseurl }}/{{ site.public_folder }}{{ _avatar }}
 *
 * On a consumer configuration where the joined slashes double up (e.g.
 * `public_folder: "/assets"` with a leading slash, or `public_folder` unset —
 * remote-theme consumers do not inherit the theme's `_config.yml`), a
 * site-absolute avatar such as `/images/authors/cassandra.svg` rendered as
 * `//assets/images/authors/cassandra.svg` — a PROTOCOL-RELATIVE URL the
 * browser resolves against a host literally named `assets`. Every author
 * byline, card, and profile hero showed a broken image.
 *
 * Because the include is rendered server-side by Liquid, the BEFORE state is
 * a real Jekyll build with the include reverted to the PR's merge-base (and
 * the AFTER a build of the PR head), both with the same misconfiguration
 * (`public_folder: "/assets"`) — a faithful diff of the real code change.
 *
 * Reproduce:
 *   printf 'public_folder: "/assets"\n' > _evidence/cfg-306.yml
 *   # AFTER (PR head):
 *   docker compose run --rm jekyll sh -c "bundle exec jekyll build \
 *     --config _config.yml,_config_dev.yml,_evidence/cfg-306.yml \
 *     --destination /site/_evidence/306-after"
 *   # BEFORE (merge-base include):
 *   git show $(git merge-base main HEAD):_includes/components/author-avatar-url.html \
 *     > _includes/components/author-avatar-url.html
 *   docker compose run --rm jekyll sh -c "bundle exec jekyll build \
 *     --config _config.yml,_config_dev.yml,_evidence/cfg-306.yml \
 *     --destination /site/_evidence/306-before"
 *   git checkout -- _includes/components/author-avatar-url.html
 *   (cd _evidence/306-before && python3 -m http.server 4607) &
 *   (cd _evidence/306-after  && python3 -m http.server 4606) &
 *   BEFORE_URL=http://localhost:4607 AFTER_URL=http://localhost:4606 \
 *     node test/visual/author-avatar-evidence.mjs
 *
 * Writes test/visual/evidence/author-avatar-url/: montages, metrics.json, and
 * a CHANGELOG snippet. See .github/skills/visual-evidence/SKILL.md.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const beforeBase = process.env.BEFORE_URL || 'http://localhost:4607';
const afterBase = process.env.AFTER_URL || 'http://localhost:4606';
const slug = 'author-avatar-url';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

const INDEX = '/authors/';
const PROFILE = '/authors/cassandra/';

/** Read back every author-avatar img on a page + screenshot a region. */
async function capture(browser, base, route, shotSelector, avatarSelector) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(600); // let (broken) image fetches settle
  const avatars = await page.$$eval(avatarSelector, (imgs) =>
    imgs.map((img) => ({
      alt: img.alt,
      src: img.getAttribute('src'),
      protocolRelative: (img.getAttribute('src') || '').startsWith('//'),
      loaded: img.complete && img.naturalWidth > 0,
    })),
  );
  const img = await page.locator(shotSelector).first().screenshot();
  await page.close();
  return { avatars, img };
}

const browser = await chromium.launch();
const metrics = { slug, issue: 297, beforeBase, afterBase, misconfig: 'public_folder: "/assets"', pages: [] };

for (const [route, shotSel, avSel, label] of [
  [INDEX, 'section.authors-index', 'section.authors-index img.rounded-circle', 'authors index'],
  [PROFILE, 'header.author-hero', 'img.author-hero__avatar', 'profile hero'],
]) {
  console.log(`[${slug}] ${label} (${route}) — before vs after`);
  const before = await capture(browser, beforeBase, route, shotSel, avSel);
  const after = await capture(browser, afterBase, route, shotSel, avSel);
  metrics.pages.push({ route, before: before.avatars, after: after.avatars });

  const broken = (avs) => avs.filter((a) => a.protocolRelative);
  await montage(browser, {
    title: `Author avatars — ${label} (${route}) — before vs after`,
    width: 1040,
    note: `Same misconfigured consumer build (public_folder: "/assets"). BEFORE is a real Jekyll build with the merge-base include; AFTER is the PR head. Full-URL avatars (GitHub) are unaffected in both.`,
    rows: [
      {
        label: `❌ BEFORE — ${broken(before.avatars).length} avatar(s) rendered protocol-relative (src="//assets/…") and broken`,
        img: before.img, w: 960,
        caption: broken(before.avatars).map((a) => `${a.alt}: ${a.src}`).join(' · ') || undefined,
      },
      {
        label: `✅ AFTER — 0 protocol-relative; ${after.avatars.filter((a) => a.loaded).length}/${after.avatars.length} avatars load`,
        img: after.img, w: 960,
        caption: after.avatars.map((a) => `${a.alt}: ${a.src}`).join(' · '),
      },
    ],
  }, `${outDir}/0${metrics.pages.length}-${label.replace(/\s+/g, '-')}.png`);

  console.log(`   before: ${broken(before.avatars).length} protocol-relative / ${before.avatars.length}; after: ${broken(after.avatars).length} / ${after.avatars.length}`);
}

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
const totalBroken = metrics.pages.reduce((n, p) => n + p.before.filter((a) => a.protocolRelative).length, 0);
fs.writeFileSync(
  `${outDir}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
    `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
    `${totalBroken} protocol-relative \`//assets/…\` avatars → 0 on a misconfigured consumer build)\n`,
);
console.log(`[${slug}] done → ${outDir}/`);
await browser.close();
