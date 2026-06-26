/**
 * Before/after evidence for the Giscus comments gate fix (PR #214, issue #201).
 * ============================================================================
 * The article layout gates the comments section on `site.giscus.enabled`. The
 * bug it replaced gated on `site.giscus` — the mere presence of the config
 * block — so a site that set `enabled: false` STILL rendered comments. This
 * script proves the fix on the live dev server by toggling the real config flag
 * and swapping the real pre-fix gate back in (both reverted at the end):
 *
 *   1. enabled:true,  fix gate            → comments render (normal operation)
 *   2. enabled:false, fix gate            → comments hidden  (the fix working)
 *   3. enabled:false, pre-fix `site.giscus` gate → comments shown (the bug)
 *
 * Run against `docker compose up` in this repo checkout:
 *   BASE_URL=http://localhost:4000 node test/visual/giscus-comments-evidence.mjs
 *
 * Writes test/visual/evidence/giscus-comments/. See visual-evidence/SKILL.md.
 */
import { chromium } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const base = process.env.BASE_URL || 'http://localhost:4000';
const slug = 'giscus-comments';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

const sh = (cmd) => execSync(cmd, { stdio: 'pipe' }).toString().trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Clean rebuild: clear Jekyll's caches (dev config sets incremental:true, which
 *  otherwise serves stale pages after a config change) and restart the server. */
function cleanRebuild() {
  try { sh("docker compose exec -T jekyll sh -lc 'rm -rf _site .jekyll-cache .jekyll-metadata'"); } catch { /* ignore */ }
  sh('docker compose restart jekyll');
}

/** Poll the post URL until #comments is present/absent as expected (post rebuild/restart). */
async function waitForState(page, url, wantComments, timeoutMs = 200000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const res = await page.goto(base + url, { waitUntil: 'load' });
      if (res && res.ok()) {
        const has = (await page.locator('#comments').count()) > 0;
        if (has === wantComments) return;
      }
    } catch { /* server mid-restart */ }
    if (Date.now() > deadline) throw new Error(`timed out waiting for #comments=${wantComments} at ${url}`);
    await sleep(3000);
  }
}

async function capture(page, url, label) {
  await page.goto(base + url, { waitUntil: 'load' });
  await page.addStyleTag({ content: '*{scroll-behavior:auto!important}' });
  // Bring the end of the article (comments area, or where it would be) into view.
  await page.evaluate(() => {
    const a = document.querySelector('article') || document.body;
    a.scrollIntoView({ block: 'end' });
    window.scrollBy(0, 400);
  });
  await page.waitForTimeout(300);
  const present = (await page.locator('#comments').count()) > 0;
  const giscus = (await page.locator('script[src*="giscus.app/client.js"]').count()) > 0;
  const img = await page.screenshot({ clip: { x: 0, y: 0, width: 1100, height: 760 } });
  return { label, commentsPresent: present, giscusScript: giscus, img };
}

const CONFIG = '_config_dev.yml';
const LAYOUT = '_layouts/article.html';
const FIX_GATE = 'page.comments != false and site.giscus.enabled';
const BUG_GATE = 'page.comments != false and site.giscus';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1100, height: 760 });

const metrics = { slug, base, issue: 201, pr: 214, states: [] };
let postUrl;

try {
  // Discover a real post URL from the live index.
  await page.goto(base + '/', { waitUntil: 'load' });
  postUrl = await page.evaluate(async () => {
    const r = await fetch('/search.json');
    const a = r.ok ? await r.json() : [];
    const p = (Array.isArray(a) ? a : []).find((e) => (e.url || '').startsWith('/posts/'));
    return p ? p.url : null;
  });
  if (!postUrl) throw new Error('no /posts/ entry in search.json');
  console.log(`[${slug}] post: ${postUrl}`);

  // (1) enabled:true + fix gate (current state) → comments render.
  const capEnabled = await capture(page, postUrl, 'enabled: true · fix gate — comments render');

  // (2) enabled:false + fix gate → comments hidden. Override incremental:false so
  //     the config change actually re-renders (dev config sets incremental:true).
  fs.appendFileSync(CONFIG, '\n# (transient — evidence capture; reverted)\nincremental: false\ngiscus:\n  enabled: false\n');
  cleanRebuild();
  await waitForState(page, postUrl, false);
  const capFixDisabled = await capture(page, postUrl, 'enabled: false · fix gate (site.giscus.enabled) — hidden ✅');

  // (3) enabled:false + pre-fix gate `site.giscus` → comments wrongly shown.
  const layoutSrc = fs.readFileSync(LAYOUT, 'utf8');
  fs.writeFileSync(LAYOUT, layoutSrc.replace(FIX_GATE, BUG_GATE));
  cleanRebuild();
  await waitForState(page, postUrl, true);
  const capBug = await capture(page, postUrl, 'enabled: false · pre-fix gate (site.giscus) — shown ❌ (the bug)');

  metrics.states.push(
    { state: 'enabled-true-fix', ...attrs(capEnabled) },
    { state: 'enabled-false-fix', ...attrs(capFixDisabled) },
    { state: 'enabled-false-prefix', ...attrs(capBug) },
  );

  await montage(browser, {
    title: 'Giscus comments — the gate fix at `enabled: false`',
    width: 1180,
    note: 'Same post, same disabled config. The pre-fix gate keyed off the block’s mere presence; the fix keys off the flag.',
    rows: [
      { label: capBug.label, img: capBug.img, w: 1100 },
      { label: capFixDisabled.label, img: capFixDisabled.img, w: 1100 },
    ],
  }, `${outDir}/01-gate-before-after.png`);

  await montage(browser, {
    title: 'Giscus comments — normal operation (`enabled: true`)',
    width: 1180,
    note: 'With comments enabled, an article renders the #comments section and the Giscus widget wired from _config.yml.',
    rows: [{ label: capEnabled.label, img: capEnabled.img, w: 1100 }],
  }, `${outDir}/02-enabled-render.png`);

  fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
  const snippet =
    `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
    `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md) — ` +
    `at enabled:false the gate now hides comments (pre-fix \`site.giscus\` showed them); enabled:true renders the widget).`;
  fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`, snippet);
  console.log(`[${slug}] done → ${outDir}/`);
  console.log(JSON.stringify(metrics.states, null, 2));
} finally {
  // Always revert the transient edits and restore the running server (clean).
  try { sh(`git checkout -- ${CONFIG} ${LAYOUT}`); } catch (e) { console.error('revert failed:', e.message); }
  try { cleanRebuild(); } catch { /* best effort */ }
  await browser.close();
}

function attrs(c) {
  return { label: c.label, commentsPresent: c.commentsPresent, giscusScript: c.giscusScript };
}
