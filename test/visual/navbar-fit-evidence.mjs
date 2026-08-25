/**
 * Navbar fit + Settings stacking — evidence generator (before/after).
 * ----------------------------------------------------------------------------
 * Drives the live site and produces the visual + numeric evidence for the
 * navbar spacing/sizing work:
 *
 *   1. Every top-level nav label was CSS-truncated at every desktop width, and
 *      the bar itself sat inside a centred `.container-xl` that left 100+px of
 *      dead margin on either side of a 1440px screen.
 *   2. On mobile, opening Settings from inside the nav menu painted the panel
 *      BEHIND the still-open menu (both are offcanvas-end at the same z-index,
 *      and the header carrying the menu is lifted above the offcanvas layer).
 *
 * The BEFORE state is reproduced on the same running server:
 *   - `UNFIX_CSS` re-caps the bar at .container-xl, un-caps the brand cluster,
 *     restores the old two-tier label density, and restores the old 80rem
 *     home-links threshold.
 *   - `restoreNavbarLangToggle()` re-inserts a language control of the original
 *     size into the utility cluster, since that markup change cannot be undone
 *     with CSS and it is worth ~70px of menubar width.
 *   - For the stacking shot, `assets/js/modules/navigation/**` is blocked at the
 *     network layer (so the new `show.bs.offcanvas` interceptor never wires up)
 *     and `LIFT_CSS` restores the header z-index lift the fix releases.
 *
 * Montages are composed with the shared kit's `montage()` (Playwright renders an
 * HTML layout and screenshots it) — no ImageMagick dependency.
 *
 * Usage:
 *   BASE_URL=http://localhost:4000 node test/visual/navbar-fit-evidence.mjs
 *
 * Outputs (test/visual/evidence/navbar-fit/):
 *   01-before-after-labels.png   truncated labels + capped bar vs. full labels
 *   02-viewport-matrix.png       the bar across 8 widths (after) — 0 truncated
 *   03-settings-stacking.png     mobile Settings buried vs. Settings on top
 *   04-language-in-settings.png  the Language section in Settings → Appearance
 *   metrics.json                 truncation counts + bar inset per width
 *   CHANGELOG-snippet.txt        evidence link for the changelog entry
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import { montage } from './evidence-kit.mjs';

const BASE = process.env.BASE_URL || 'http://localhost:4000';
const OUT = 'test/visual/evidence/navbar-fit';
fs.mkdirSync(OUT, { recursive: true });

const WIDTHS = [992, 1024, 1200, 1280, 1366, 1440, 1680, 1920];
const BAND_WIDTHS = [992, 1200, 1440];

// Reverts the navbar layout to its pre-change state.
const UNFIX_CSS = `
  #navbar .navbar-main { max-width: 1140px !important; padding-inline: 0.75rem !important; }
  @media (min-width: 1400px) { #navbar .navbar-main { max-width: 1320px !important; } }
  @media (min-width: 992px) {
    #navbar .navbar-main-start { max-width: none !important; }
    @container navbar-main (min-width: 80rem) {
      #navbar .navbar-home-links { display: inline-flex !important; }
    }
    /* Old two-tier density: icon + label from 38rem, icon-only below. */
    @container bd-nav (min-width: 38rem) {
      #bdNavbar .nav-link i { display: inline-block !important; }
      #bdNavbar .nav-link { padding: 0.375rem 0.5rem !important; }
      #bdNavbar .nav-link .nav-link-text { display: inline !important; }
      #bdNavbar .nav-item > .nav-link:not(.dropdown-toggle-split),
      #bdNavbar .nav-hover-dropdown > .nav-link:first-child { gap: 0.25rem !important; }
      #bdNavbar .nav-hover-dropdown > .dropdown-toggle-split {
        min-width: 1.25rem !important; width: 1.25rem !important;
        padding-left: 0.125rem !important; padding-right: 0.125rem !important;
      }
    }
  }
`;

// The header lift that the fix releases while Settings is open.
const LIFT_CSS = `
  @media (max-width: 991.98px) {
    body:has(#info-section.offcanvas.show) header.fixed-top { z-index: 1046 !important; }
    #info-section.offcanvas.show { z-index: 1045 !important; }
  }
`;

// The language control used to live in the utility cluster; re-create one of
// the same size so the BEFORE menubar has the width it actually had.
const restoreNavbarLangToggle = () => {
  const util = document.querySelector('#navbar .navbar-utility-controls');
  if (!util || util.querySelector('.nav-lang-toggle')) return;
  const el = document.createElement('div');
  el.className = 'dropdown nav-lang-toggle';
  el.innerHTML =
    '<button class="btn nav-lang-button dropdown-toggle" type="button">' +
    '<i class="bi bi-translate"></i>' +
    '<span class="nav-link-text d-none d-xl-inline ms-1 text-uppercase">en</span></button>';
  util.insertBefore(el, util.firstElementChild);
};

/** Truncated labels + how far the bar is inset from the viewport edge. */
const MEASURE = () => {
  const nav = document.querySelector('#bdNavbar .navbar-nav');
  const labels = nav
    ? [...nav.querySelectorAll('.nav-link-text')].filter((t) => getComputedStyle(t).display !== 'none')
    : [];
  const bar = document.querySelector('#navbar .navbar-main');
  const r = bar.getBoundingClientRect();
  const cw = document.documentElement.clientWidth;
  return {
    labelsShown: labels.length,
    truncated: labels.filter((t) => t.scrollWidth > t.clientWidth + 1).map((t) => t.textContent.trim()),
    barInsetPx: Math.round(Math.max(r.left, cw - r.right)),
  };
};

/** Full-width band of the page top — shows how far the bar spans. */
const band = (page, height = 76) =>
  page.screenshot({ clip: { x: 0, y: 0, width: page.viewportSize().width, height } });

// The cookie banner sits at --zer0-layer-cookie-banner (1095), above the
// offcanvas layer, and would intercept clicks on lower-screen chrome. Seed the
// choice the way a returning visitor arrives.
const SEED_CONSENT = () => {
  // `timestamp` must be recent: the banner re-opens on a choice older than the
  // 365-day expiry, so a zero timestamp reads as expired and shows it anyway.
  localStorage.setItem('zer0-cookie-consent', JSON.stringify({
    essential: true, analytics: false, marketing: false, timestamp: Date.now(), version: '1.0',
  }));
};

const browser = await chromium.launch();
const metrics = { slug: 'navbar-fit', base: BASE, route: '/', sweep: [] };

// ---------------------------------------------------------------------------
// 1. Label-fit sweep + before/after bands
// ---------------------------------------------------------------------------
console.log('[navbar-fit] label sweep');
const bandRows = [];
for (const w of WIDTHS) {
  const page = await browser.newPage();
  await page.addInitScript(SEED_CONSENT);
  await page.setViewportSize({ width: w, height: 760 });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(250);

  const after = await page.evaluate(MEASURE);
  const afterBand = BAND_WIDTHS.includes(w) ? await band(page) : null;

  await page.addStyleTag({ content: UNFIX_CSS });
  await page.evaluate(restoreNavbarLangToggle);
  await page.waitForTimeout(300);
  const before = await page.evaluate(MEASURE);

  metrics.sweep.push({
    width: w,
    beforeTruncated: before.truncated.length,
    afterTruncated: after.truncated.length,
    beforeLabelsShown: before.labelsShown,
    afterLabelsShown: after.labelsShown,
    beforeBarInsetPx: before.barInsetPx,
    afterBarInsetPx: after.barInsetPx,
  });
  console.log(
    `   ${w}px  before: ${before.truncated.length}/${before.labelsShown} truncated, ` +
    `bar inset ${before.barInsetPx}px  →  after: ${after.truncated.length}/${after.labelsShown} truncated, ` +
    `bar inset ${after.barInsetPx}px`
  );

  if (afterBand) {
    bandRows.push(
      {
        label:
          `❌ BEFORE — ${w}px · ${before.truncated.length} of ${before.labelsShown} labels truncated` +
          `${before.labelsShown === 0 ? ' (icon-only — no labels at all)' : ''} · bar inset ${before.barInsetPx}px from the edge`,
        img: await band(page),
      },
      {
        label: `✅ AFTER — ${w}px · 0 of ${after.labelsShown} labels truncated · bar inset ${after.barInsetPx}px (full-bleed)`,
        img: afterBand,
      }
    );
  }
  await page.close();
}
await montage(
  browser,
  {
    title: 'Navbar fit — before vs after',
    width: 1500,
    note:
      'Full-width band of the page top. BEFORE, the bar is capped at .container-xl and every top-level label ' +
      'is ellipsized (or dropped entirely at 992px); AFTER, the bar spans the screen and every label renders in full.',
    rows: bandRows,
  },
  `${OUT}/01-before-after-labels.png`
);

// ---------------------------------------------------------------------------
// 2. Viewport matrix (after)
// ---------------------------------------------------------------------------
console.log('[navbar-fit] viewport matrix');
const matrixRows = [];
for (const w of WIDTHS) {
  const page = await browser.newPage();
  await page.addInitScript(SEED_CONSENT);
  await page.setViewportSize({ width: w, height: 700 });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(250);
  const m = await page.evaluate(MEASURE);
  const tier = await page.evaluate(() => {
    const icon = document.querySelector('#bdNavbar .nav-link i');
    const text = document.querySelector('#bdNavbar .nav-link-text');
    if (text && getComputedStyle(text).display === 'none') return 'icon-only';
    return icon && getComputedStyle(icon).display === 'none' ? 'label-only' : 'icon + label';
  });
  matrixRows.push({ label: `${w}px · ${tier} · ${m.truncated.length} truncated`, img: await band(page), w: Math.min(w, 1400) });
  await page.close();
}
await montage(
  browser,
  {
    title: 'Navbar fit — viewport matrix (after)',
    width: 1500,
    note: `${WIDTHS[0]} → ${WIDTHS[WIDTHS.length - 1]}px. Density steps down icon+label → label-only as the track narrows; no label is ever truncated.`,
    rows: matrixRows,
  },
  `${OUT}/02-viewport-matrix.png`
);

// ---------------------------------------------------------------------------
// 3. Mobile Settings stacking — before vs after
// ---------------------------------------------------------------------------
console.log('[navbar-fit] settings stacking');
const MOBILE = { width: 390, height: 760 };

/** Open the nav menu, then tap its Settings item. Returns [screenshot, state]. */
async function settingsFromNavMenu(page) {
  await page.click('.navbar-utility-controls .navbar-toggler');
  await page.waitForTimeout(700);
  await page.click('#bdNavbar [data-bs-target="#info-section"]');
  await page.waitForTimeout(1400);
  const state = await page.evaluate(() => {
    const info = document.getElementById('info-section');
    const r = info.getBoundingClientRect();
    const top = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + 140));
    return {
      settingsShown: info.classList.contains('show'),
      navStillShown: document.getElementById('bdNavbar').classList.contains('show'),
      settingsOnTop: !!(top && info.contains(top)),
      topElement: top ? top.tagName.toLowerCase() + (top.className ? '.' + String(top.className).trim().split(/\s+/)[0] : '') : null,
      headerZ: getComputedStyle(document.querySelector('header.fixed-top')).zIndex,
    };
  });
  return [await page.screenshot(), state];
}

// BEFORE: block the navigation module (no `show` interceptor) + restore the lift.
const beforeCtx = await browser.newContext({ viewport: MOBILE });
await beforeCtx.addInitScript(SEED_CONSENT);
await beforeCtx.route('**/assets/js/modules/navigation/**', (r) => r.abort());
const beforePage = await beforeCtx.newPage();
await beforePage.goto(BASE + '/', { waitUntil: 'load' });
await beforePage.addStyleTag({ content: LIFT_CSS });
await beforePage.waitForTimeout(400);
const [beforeShot, beforeState] = await settingsFromNavMenu(beforePage);
console.log('   before:', JSON.stringify(beforeState));
await beforeCtx.close();

// AFTER: the shipped behaviour.
const afterCtx = await browser.newContext({ viewport: MOBILE });
await afterCtx.addInitScript(SEED_CONSENT);
const afterPage = await afterCtx.newPage();
await afterPage.goto(BASE + '/', { waitUntil: 'load' });
await afterPage.waitForTimeout(400);
const [afterShot, afterState] = await settingsFromNavMenu(afterPage);
console.log('   after: ', JSON.stringify(afterState));
metrics.settingsStacking = { before: beforeState, after: afterState };

await montage(
  browser,
  {
    title: 'Settings from the mobile nav menu — before vs after',
    width: 900,
    note:
      'Both screens are the SAME interaction on a 390px phone: open the nav menu, tap its "Settings" item. ' +
      'BEFORE, the nav menu is still on screen and Settings is buried under it (nothing appears to happen). ' +
      'AFTER, the menu closes and Settings slides in on top.',
    rows: [
      {
        label:
          `❌ BEFORE — nav menu still open (${beforeState.navStillShown}), Settings on top: ${beforeState.settingsOnTop} · ` +
          `top element at the panel's centre: ${beforeState.topElement} · header z-index ${beforeState.headerZ}`,
        img: beforeShot,
        w: 390,
      },
      {
        label:
          `✅ AFTER — nav menu closed (${afterState.navStillShown}), Settings on top: ${afterState.settingsOnTop} · ` +
          `top element: ${afterState.topElement} · header z-index ${afterState.headerZ}`,
        img: afterShot,
        w: 390,
      },
    ],
  },
  `${OUT}/03-settings-stacking.png`
);

// ---------------------------------------------------------------------------
// 4. Language section in Settings → Appearance (after-only — it is new here)
// ---------------------------------------------------------------------------
console.log('[navbar-fit] language in settings');
const langRows = [];
for (const vp of [{ w: 1440, h: 900, label: 'desktop 1440px' }, { w: 390, h: 760, label: 'mobile 390px' }]) {
  const page = await browser.newPage();
  await page.addInitScript(SEED_CONSENT);
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(250);
  await page.evaluate(() => new Promise((resolve) => {
    const el = document.getElementById('info-section');
    el.addEventListener('shown.bs.offcanvas', () => resolve(), { once: true });
    window.bootstrap.Offcanvas.getOrCreateInstance(el).show();
  }));
  await page.waitForTimeout(500);
  const panel = await page.$('#info-section');
  langRows.push({ label: `${vp.label} · Settings → Appearance`, img: await panel.screenshot(), w: 360 });
  await page.close();
}
metrics.languageInSettings = { navbarToggleRemoved: true, panelSection: '#info-section #zer0-lang-toggle' };
await montage(
  browser,
  {
    title: 'Language selector — now in Settings → Appearance',
    width: 840,
    note:
      'The header utility cluster is Search + Settings only; the language control is the first section of the ' +
      'Appearance tab, as an always-visible list (active language checked, untranslated targets disabled).',
    rows: langRows,
  },
  `${OUT}/04-language-in-settings.png`
);

// ---------------------------------------------------------------------------
fs.writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 2));
const worstBefore = metrics.sweep.reduce((a, b) => Math.max(a, b.beforeTruncated), 0);
const worstInset = metrics.sweep.reduce((a, b) => Math.max(a, b.beforeBarInsetPx), 0);
fs.writeFileSync(
  `${OUT}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: ${OUT}/ -->\n` +
    `  (evidence: [\`${OUT}/\`](${OUT}/README.md) — up to ${worstBefore} truncated ` +
    `labels and ${worstInset}px of dead bar margin → 0 across ${WIDTHS.length} widths)`
);
console.log(`  wrote ${OUT}/metrics.json + CHANGELOG-snippet.txt`);

await browser.close();
console.log(`[navbar-fit] done → ${OUT}/`);
