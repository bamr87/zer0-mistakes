/**
 * Evidence generator for the AI chat panel title level (issue #586, T-055).
 *
 * The bug: _includes/components/ai-chat.html titled the chat dialog with a bare
 * `<h6 id="aiChatTitle">` for its small type. The panel renders under <body>,
 * outside <main>, after the footer's h3-level chrome, so on every page that
 * ships the chat a screen-reader user walking by heading met h3 -> h6 (WCAG
 * 1.3.1). The fix is `<h2 id="aiChatTitle" class="h6 ...">`: the tag states
 * the depth (a top-level dialog, one below the page <h1>, like the cookie
 * dialog) and `.h6` keeps the size, so the change is meant to be VISUALLY INERT.
 *
 * Evidence therefore shows, per scenario:
 *   1. the structural change: the heading walk (previous heading in DOM order
 *      -> chat title), before vs after;
 *   2. the visual non-change: the open panel's header band, before vs after,
 *      compared byte for byte. The BEFORE render is reproduced by reverting
 *      exactly the diff in the live DOM (`<h2 class="h6 ...">` -> `<h6 ...>`).
 *
 * Captures run with reduced motion and animations disabled: without that, two
 * screenshots of the same open panel already differ (the panel's transitions
 * and the chat's typing animation), so byte equality would prove nothing.
 *
 * Run against a dev build (_config_dev.yml turns the chat on):
 *   docker compose up                      # serves :4000
 *   BASE_URL=http://localhost:4000 node test/visual/ai-chat-heading-evidence.mjs
 * Optionally also serve a build of the base branch and pass BEFORE_URL: each
 * scenario then compares the header against that real pre-fix render too.
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { montage } from './evidence-kit.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const BEFORE_URL = process.env.BEFORE_URL || '';
const SLUG = 'ai-chat-heading';
const EVIDENCE_DIR = path.join(__dirname, 'evidence', SLUG);
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

// The same three routes test/visual/core/heading-outline.spec.js walks, at a
// desktop and a phone width, plus the dark color mode on the home page.
const SCENARIOS = [
  { url: '/', label: 'home · 1280px · light', viewport: { width: 1280, height: 900 } },
  { url: '/', label: 'home · 1280px · dark', viewport: { width: 1280, height: 900 }, dark: true },
  { url: '/docs/', label: 'docs · 1280px · light', viewport: { width: 1280, height: 900 } },
  { url: '/404.html', label: '404 · 390px · light', viewport: { width: 390, height: 844 } },
];

// Heading walk in DOM order: the heading just before the chat title, and the
// title itself.
const HEADING_PATH = () => {
  const title = document.getElementById('aiChatTitle');
  const all = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  const i = all.indexOf(title);
  const prev = i > 0 ? all[i - 1] : null;
  const cs = getComputedStyle(title);
  const labelledBy = document.getElementById('aiChatPanel').getAttribute('aria-labelledby');
  return {
    prevTag: prev ? prev.tagName.toLowerCase() : '(none: first heading)',
    prevText: prev ? (prev.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) : '',
    titleTag: title.tagName.toLowerCase(),
    titleClass: title.className,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    marginBottom: cs.marginBottom,
    labelResolves: document.getElementById(labelledBy) === title,
    skips: prev
      ? Math.max(0, +title.tagName[1] - +prev.tagName[1] - 1)
      : Math.max(0, +title.tagName[1] - 1),
  };
};

// Revert exactly the diff: <h2 class="h6 mb-0 fw-semibold"> back to the
// pre-fix <h6 class="mb-0 fw-semibold"> (same attributes and children, minus
// the .h6 utility).
const UNFIX = () => {
  const h2 = document.getElementById('aiChatTitle');
  const h6 = document.createElement('h6');
  for (const a of h2.attributes) h6.setAttribute(a.name, a.value);
  h6.classList.remove('h6');
  while (h2.firstChild) h6.appendChild(h2.firstChild);
  h2.replaceWith(h6);
};

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SHOT = { animations: 'disabled', caret: 'hide' };

/** A page on `base` + `s.url` with the chat panel open and nothing focused. */
async function openChat(browser, base, s) {
  const ctx = await browser.newContext({ viewport: s.viewport, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  // Pre-seed consent so the cookie banner is not baked into the crops.
  await page.addInitScript(() => {
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({
      essential: true, analytics: false, marketing: false,
      timestamp: Date.now(), version: '1.0',
    }));
  });
  await page.goto(base + s.url, { waitUntil: 'load' });
  if ((await page.locator('#aiChatPanel').count()) === 0) {
    throw new Error(`#aiChatPanel is not rendered on ${base}${s.url}: build with _config_dev.yml (ai_chat on)`);
  }
  if (s.dark) {
    await page.evaluate(() => document.documentElement.setAttribute('data-bs-theme', 'dark'));
  }
  await page.locator('#aiChatToggle').click();
  await page.waitForFunction(() => document.getElementById('aiChatPanel').classList.contains('ai-chat-panel--open'));
  await page.waitForTimeout(500); // the input's delayed focus
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.waitForTimeout(100);
  return { ctx, page, header: page.locator('#aiChatPanel .ai-chat-header') };
}

const browser = await chromium.launch();
const metrics = { slug: SLUG, issue: 586, beforeUrl: BEFORE_URL || null, scenarios: [] };
const rows = [];

for (const s of SCENARIOS) {
  const { ctx, page, header } = await openChat(browser, BASE_URL, s);
  const after = await page.evaluate(HEADING_PATH);
  const afterShot = await header.screenshot(SHOT);

  await page.evaluate(UNFIX);
  await page.waitForTimeout(100);
  const before = await page.evaluate(HEADING_PATH);
  const beforeShot = await header.screenshot(SHOT);
  await ctx.close();

  const pixelIdentical = beforeShot.equals(afterShot);
  let baseBuildIdentical = null;
  if (BEFORE_URL) {
    const real = await openChat(browser, BEFORE_URL, s);
    baseBuildIdentical = (await real.header.screenshot(SHOT)).equals(afterShot);
    await real.ctx.close();
  }
  metrics.scenarios.push({ ...s, before, after, pixelIdentical, baseBuildIdentical });
  console.log(
    `${s.label.padEnd(26)} before ${before.prevTag} -> ${before.titleTag} (skips ${before.skips})` +
    `   after ${after.prevTag} -> ${after.titleTag} (skips ${after.skips})   pixel-identical=${pixelIdentical}` +
    (BEFORE_URL ? `   base-build-identical=${baseBuildIdentical}` : '')
  );

  const w = Math.min(s.viewport.width, 420);
  rows.push(
    {
      label: `❌ BEFORE: ${esc(s.label)} · ${esc(`<${before.titleTag} class="${before.titleClass}">`)} · ` +
        `heading walk: ${before.prevTag} → ${before.titleTag}` +
        (before.skips ? `, skips ${before.skips} level${before.skips > 1 ? 's' : ''}` : ''),
      img: beforeShot, w,
    },
    {
      label: `✅ AFTER: ${esc(`<${after.titleTag} class="${after.titleClass}">`)} · heading walk: ` +
        `${after.prevTag} → ${after.titleTag} · ${after.fontSize}/${after.fontWeight} · ` +
        `render ${pixelIdentical ? 'byte-identical' : 'NOT identical, inspect!'}` +
        (BEFORE_URL ? ` · vs the base build: ${baseBuildIdentical ? 'byte-identical' : 'NOT identical, inspect!'}` : ''),
      img: afterShot, w,
    },
  );
}

await montage(browser, {
  title: 'AI chat panel title: &lt;h6&gt; → &lt;h2 class="h6"&gt; (visually inert)',
  note: 'Each pair: the open chat panel header rendered with the pre-fix bare &lt;h6&gt; (reproduced by '
    + 'reverting exactly the diff in the live DOM) and with the fixed &lt;h2 class="h6 mb-0 fw-semibold"&gt;. '
    + 'Same pixels; only the heading level a screen reader announces changes.',
  width: 800,
  rows,
}, path.join(EVIDENCE_DIR, '01-chat-header-before-after.png'));

await browser.close();

fs.writeFileSync(path.join(EVIDENCE_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n');

const n = SCENARIOS.length;
const fixed = metrics.scenarios.filter((m) => m.after.titleTag === 'h2'
  && m.after.titleClass.split(/\s+/).includes('h6') && m.after.labelResolves);
const inert = metrics.scenarios.filter((m) => m.pixelIdentical);
const snippet = `  (evidence: [\`test/visual/evidence/${SLUG}/\`](test/visual/evidence/${SLUG}/README.md): `
  + `chat title h6 → <h2 class="h6"> in ${fixed.length}/${n} scenarios, header render byte-identical in ${inert.length}/${n})`;
fs.writeFileSync(path.join(EVIDENCE_DIR, 'CHANGELOG-snippet.txt'), snippet + '\n');

const pass = fixed.length === n && inert.length === n
  && metrics.scenarios.every((m) => m.before.titleTag === 'h6' && m.before.skips > 0 && m.after.skips === 0
    && m.baseBuildIdentical !== false);
console.log(`\nEvidence written to ${EVIDENCE_DIR}`);
console.log(pass
  ? 'PASS: the chat title is an <h2 class="h6"> everywhere, the before-state reproduces the skip, and the header renders identically.'
  : 'FAIL: unexpected structure or render difference; inspect before committing.');
process.exit(pass ? 0 : 1);
