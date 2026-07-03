// =============================================================================
// settings-evidence.mjs — before/after evidence for the settings-panel rebuild
// =============================================================================
// The Settings offcanvas rebuild is a DOM/template change, not a CSS fix, so
// the kit's `unfixCss` before-state cannot reproduce it on one server.
// Like sidebar-modes-evidence.mjs, this script drives TWO builds:
//
//   BEFORE_URL  a build of main            (default http://127.0.0.1:4012)
//   AFTER_URL   a build of the PR branch   (default http://127.0.0.1:4000)
//
// and composes labelled before/after montages with the shared `montage`
// helper from evidence-kit.mjs, plus a metrics.json of structural counts.
//
// Usage:
//   python3 -m http.server 4012 --directory <main-build>   &
//   docker compose up -d               # PR branch at :4000
//   node test/visual/settings-evidence.mjs
// =============================================================================
import { chromium } from '@playwright/test';
import { montage } from './evidence-kit.mjs';
import fs from 'fs';

const BEFORE = process.env.BEFORE_URL || 'http://127.0.0.1:4012';
const AFTER = process.env.AFTER_URL || process.env.BASE_URL || 'http://127.0.0.1:4000';
const slug = 'settings-panel';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

// Structural counts that summarize each state (the numbers behind the
// pictures; the AFTER side is what settings-panel.spec.js asserts).
const MEASURE = () => ({
  tabs: document.querySelectorAll('#infoTabs [data-bs-toggle="tab"]').length,
  deadSearchBox: !!document.querySelector('#info-section #searchbox'),
  // Every color-mode affordance in the panel: halfmoon buttons/items plus the
  // appearance.js [data-mode] copies. One control = 3.
  themeModeControls: document.querySelectorAll(
    '#info-section [data-bs-theme-value], #info-section [data-mode]',
  ).length,
  strayPanelBelowTabs: !!document.querySelector('#info-section .offcanvas-body > .zer0-appearance-panel'),
  adminLinks: document.querySelectorAll('#info-section a[href^="/about/"]').length,
  skinButtons: document.querySelectorAll('#zer0SkinButtons [data-skin]').length,
});

// Per-state tab ids (the rebuild renamed the panes).
const SCENES = [
  {
    key: 'first-tab',
    beforeTab: null, // default-active Settings tab
    afterTab: null, // default-active Appearance tab
    caption: 'Default tab. BEFORE: "Settings" mixes a dead search box (no JS ever bound to it), a theme dropdown, an About collapse — and appearance.js injects a duplicate color-mode panel BELOW the tab content, visible under every tab. AFTER: one "Appearance" tab owns color mode (segmented, one click), theme skin, background layers and the primary-color picker, each control exactly once.',
  },
  {
    key: 'environment-vs-site',
    beforeTab: '#environment-tab',
    afterTab: '#site-tab',
    caption: 'BEFORE: "Environment" repeats build time / Jekyll version already shown under Settings → About, and ends in a dismissible alert. AFTER: "Site" stacks environment (with the same quick links), theme & build info (deduplicated) and the Admin quick links — which never rendered before: the plugin that computed them is disabled by the github-pages gem, so the section was dead on every github-pages build. It is now pure Liquid via include_cached.',
  },
  {
    key: 'developer',
    beforeTab: '#developer-tab',
    afterTab: '#developer-tab',
    caption: 'Developer tab. BEFORE: an empty "Page Location" heading on pages without breadcrumbs (the homepage). AFTER: the section renders only where breadcrumbs do; metadata table and source-code shortcuts are otherwise unchanged (dead never-initialized tooltip attributes removed).',
  },
];

const browser = await chromium.launch();
const metrics = { slug, before: BEFORE, after: AFTER, scenes: [], mobile: {} };
let n = 0;
const next = () => String(++n).padStart(2, '0');

async function grabPanel(base, { tab, viewport } = {}) {
  const page = await browser.newPage();
  await page.setViewportSize(viewport || { width: 1280, height: 900 });
  await page.goto(base + '/', { waitUntil: 'load' });
  // Deterministic readiness instead of fixed sleeps: Bootstrap loaded (it is
  // deferred) and the panel + appearance.js slot content present.
  await page.waitForFunction(() => window.bootstrap && document.getElementById('info-section'));
  // First-visit chrome would cover the panel in both states — drop it so the
  // montage shows the panel, not the consent banner.
  await page.evaluate(() => document.getElementById('cookieConsent')?.remove());
  // shown.bs.offcanvas fires after the slide-in transition completes.
  await page.evaluate(() => new Promise((resolve) => {
    const el = document.getElementById('info-section');
    el.addEventListener('shown.bs.offcanvas', () => resolve(), { once: true });
    window.bootstrap.Offcanvas.getOrCreateInstance(el).show();
  }));
  if (tab) {
    // Wait on Bootstrap's own completion signal for the tab fade.
    const paneSel = await page.getAttribute(tab, 'data-bs-target');
    await page.click(tab);
    await page.waitForSelector(`${paneSel}.active.show`, { state: 'attached' });
  }
  // Fonts + two frames so the screenshot captures a settled paint.
  await page.evaluate(() => document.fonts ? document.fonts.ready : true);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const m = await page.evaluate(MEASURE);
  const clip = await page.evaluate(() => {
    const b = document.getElementById('info-section').getBoundingClientRect();
    const x = Math.max(0, b.x);
    return { x, y: 0, width: Math.min(b.width, innerWidth - x), height: Math.min(b.height, innerHeight) };
  });
  const img = await page.screenshot({ clip });
  await page.close();
  return { m, img };
}

for (const scene of SCENES) {
  const before = await grabPanel(BEFORE, { tab: scene.beforeTab });
  const after = await grabPanel(AFTER, { tab: scene.afterTab });
  metrics.scenes.push({ key: scene.key, before: before.m, after: after.m });
  console.log(`[${scene.key}] before=${JSON.stringify(before.m)}`);
  console.log(`[${scene.key}]  after=${JSON.stringify(after.m)}`);
  await montage(browser, {
    title: `Settings panel — ${scene.key}`,
    note: scene.caption,
    width: 920,
    rows: [
      { label: `BEFORE — main (${scene.beforeTab || 'default tab'})`, img: before.img, w: 420 },
      { label: `AFTER — this PR (${scene.afterTab || 'default tab'})`, img: after.img, w: 420 },
    ],
  }, `${outDir}/${next()}-${scene.key}.png`);
}

// Mobile: compact tabs keep their text labels (the old panel hid them,
// leaving icon-only tabs with no accessible name).
{
  const viewport = { width: 320, height: 700 };
  const before = await grabPanel(BEFORE, { viewport });
  const after = await grabPanel(AFTER, { viewport });
  metrics.mobile = { before: before.m, after: after.m };
  await montage(browser, {
    title: 'Settings panel — 320px phone',
    note: 'BEFORE: four icon-only tabs (labels display:none below 576px — no accessible name). AFTER: three tabs keep their text labels at every width; decorative icons drop out instead. Panel body scrolls vertically only.',
    width: 760,
    rows: [
      { label: 'BEFORE — main @ 320px', img: before.img, w: 300 },
      { label: 'AFTER — this PR @ 320px', img: after.img, w: 300 },
    ],
  }, `${outDir}/${next()}-mobile-320.png`);
}

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
  `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md)` +
  ' — 4 tabs → 3, duplicate color-mode controls 6 → 3, dead search box removed, admin links 0 → 4)');
console.log(`wrote ${outDir}/metrics.json + CHANGELOG-snippet.txt`);
await browser.close();
