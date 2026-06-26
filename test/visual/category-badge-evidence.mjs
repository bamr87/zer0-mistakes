/**
 * Before/after evidence for the category-badge existence-gate (issue #204).
 * ============================================================================
 * _layouts/article.html linked the category badge unconditionally to
 * `{category_base}/{category}/`. On this site /news/development/ exists but
 * /news/security/ does not — so a Security post's badge was a 404 link. The fix
 * links only when the index page exists, else renders a plain <span>.
 *
 * A real before/after needs the pre-fix layout, which is server-rendered (not a
 * runtime asset), so this is a DOUBLE-RENDER: the orchestrator captures the live
 * post-fix state, reverts article.html/post-card.html to the merge-base, captures
 * the pre-fix state, then restores. Modes:
 *
 *   node test/visual/category-badge-evidence.mjs capture-after
 *   node test/visual/category-badge-evidence.mjs capture-before
 *   node test/visual/category-badge-evidence.mjs compose
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const base = process.env.BASE_URL || 'http://localhost:4000';
const TMP = '/tmp/catbadge';
fs.mkdirSync(TMP, { recursive: true });

const CASES = [
  { key: 'security', label: 'Security', article: '/posts/2026/06/16/favicon-ico-unlocked-door-to-collapse/', indexUrl: '/news/security/' },
  { key: 'development', label: 'Development', article: '/posts/2025/01/22/git-workflow-best-practices/', indexUrl: '/news/development/' },
];
const BADGE = '.badge.bg-primary.fs-6';

async function capture(state) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 760, height: 720 });
  const facts = { state, cases: [] };
  for (const c of CASES) {
    const idx = await page.request.get(base + c.indexUrl);
    await page.goto(base + c.article, { waitUntil: 'load' });
    await page.waitForTimeout(150);
    const badge = page.locator(BADGE).first();
    const tag = await badge.evaluate((el) => el.tagName.toLowerCase()).catch(() => null);
    const href = await badge.getAttribute('href').catch(() => null);
    if (state === 'after') {
      await badge.screenshot({ path: `${TMP}/after-${c.key}.png` }).catch(() => {});
    }
    facts.cases.push({ key: c.key, label: c.label, indexUrl: c.indexUrl, indexStatus: idx.status(), badgeTag: tag, badgeHref: href });
  }
  fs.writeFileSync(`${TMP}/${state}.json`, JSON.stringify(facts, null, 2));
  await browser.close();
  console.log(`[category-badges] captured ${state}:`, JSON.stringify(facts.cases));
}

async function compose() {
  const before = JSON.parse(fs.readFileSync(`${TMP}/before.json`));
  const after = JSON.parse(fs.readFileSync(`${TMP}/after.json`));
  const slug = 'category-badges';
  const outDir = `test/visual/evidence/${slug}`;
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();

  const by = (arr, k) => arr.find((c) => c.key === k);
  const fmt = (c) => (c.badgeTag === 'a' ? `links to ${c.badgeHref}` : 'plain badge (no link)');
  const secB = by(before.cases, 'security'), secA = by(after.cases, 'security');
  const devB = by(before.cases, 'development'), devA = by(after.cases, 'development');

  const rows = [];
  if (fs.existsSync(`${TMP}/after-security.png`)) {
    rows.push({ label: `✅ AFTER — Security badge: ${fmt(secA)}  ·  /news/security/ → ${secA.indexStatus} (absent), so it degrades to a plain badge instead of a 404 link`, img: fs.readFileSync(`${TMP}/after-security.png`), w: 240 });
  }
  if (fs.existsSync(`${TMP}/after-development.png`)) {
    rows.push({ label: `✅ AFTER — Development badge: ${fmt(devA)}  ·  /news/development/ → ${devA.indexStatus} (present), so the link is preserved`, img: fs.readFileSync(`${TMP}/after-development.png`), w: 240 });
  }
  await montage(browser, {
    title: 'Category badge — existence-gated link vs span (issue #204)',
    width: 760,
    note: `BEFORE the badge was ALWAYS a link: Security → ${fmt(secB)} to /news/security/ (404 on this site); Development → ${fmt(devB)} to /news/development/ (200). AFTER: the link is kept only when the index exists.`,
    rows,
  }, `${outDir}/01-category-badge-after.png`);

  const metrics = {
    slug, base, issue: 204,
    cases: CASES.map((c) => ({
      label: c.label, article: c.article, indexUrl: c.indexUrl,
      indexStatus: by(after.cases, c.key).indexStatus,
      before: { badgeTag: by(before.cases, c.key).badgeTag, badgeHref: by(before.cases, c.key).badgeHref },
      after: { badgeTag: by(after.cases, c.key).badgeTag, badgeHref: by(after.cases, c.key).badgeHref },
    })),
  };
  fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));

  const snippet =
    `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
    `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
    `category badge for an absent index (/news/security/ → 404): link → plain span; existing index (/news/development/) still links).`;
  fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`, snippet);
  await browser.close();
  console.log(`[category-badges] composed → ${outDir}/`);
  console.log(JSON.stringify(metrics, null, 2));
}

const mode = process.argv[2];
if (mode === 'capture-after') await capture('after');
else if (mode === 'capture-before') await capture('before');
else if (mode === 'compose') await compose();
else { console.error('usage: node category-badge-evidence.mjs capture-after|capture-before|compose'); process.exit(2); }
