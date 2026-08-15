/**
 * Evidence generator for the cookie-consent dark-mode contrast fix (issue #280).
 *
 * The bug: the "Your Privacy Rights" list in #cookieSettingsModal used
 * Bootstrap's fixed `.text-dark` utility inside a `.bg-body` panel.
 * `--bs-dark-rgb` is never remapped by `[data-bs-theme=dark]`, so in dark
 * mode the text colour equals the panel background (#212529) — a measured
 * 1.00:1 contrast ratio. WCAG 1.4.3 (AA) requires 4.5:1.
 *
 * BEFORE state: the fix is exactly two declarations —
 *   - `<ul class="small text-dark …">`  →  `text-body`
 *   - `.cookie-category { border: 1px solid #dee2e6 }` → `var(--bs-border-color)`
 * so the pre-fix render is reproduced faithfully at runtime by reverting both
 * (classList swap + the original hardcoded border), on the live fixed build.
 *
 * Run against the live dev server:
 *   docker compose up                      # serves :4000
 *   BASE_URL=http://localhost:4000 node test/visual/cookie-consent-contrast-evidence.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { montage } from './evidence-kit.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const SLUG = 'cookie-consent-contrast';
const EVIDENCE_DIR = path.join(__dirname, 'evidence', SLUG);
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

// In-page: WCAG 2.1 contrast ratio of the privacy-rights list items against
// the first opaque ancestor background (same math as the regression test in
// test/visual/core/accessibility.spec.js).
const MEASURE = () => {
  const parse = (c) => {
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((v) => parseFloat(v.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const backdrop = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a === 1) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const el = document.querySelector('#cookieSettingsModal .bg-body li');
  const fg = parse(getComputedStyle(el).color);
  const bg = backdrop(el);
  return {
    fg: `rgb(${fg.r}, ${fg.g}, ${fg.b})`,
    bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
    ratio: Math.round(ratio(fg, bg) * 100) / 100,
  };
};

// Revert exactly the two declarations the fix changed → the pre-fix render.
const UNFIX = () => {
  document
    .querySelectorAll('#cookieSettingsModal .bg-body ul.text-body')
    .forEach((ul) => ul.classList.replace('text-body', 'text-dark'));
  const style = document.createElement('style');
  style.textContent = '.cookie-category { border: 1px solid #dee2e6 !important; }';
  document.head.appendChild(style);
};

async function openSettingsModal(page) {
  await page.waitForFunction(() => typeof window.bootstrap?.Modal === 'function');
  await page.evaluate(() => {
    const el = document.querySelector('#cookieSettingsModal');
    return new Promise((resolve) => {
      el.addEventListener('shown.bs.modal', () => resolve(), { once: true });
      window.bootstrap.Modal.getOrCreateInstance(el).show();
    });
  });
  await page.waitForTimeout(300); // let the fade transition settle
}

async function captureMode(browser, mode) {
  const ctx = await browser.newContext({
    viewport: { width: 900, height: 1000 },
    colorScheme: mode,
  });
  const page = await ctx.newPage();
  // Pin the theme (same override the Appearance panel writes) and suppress the
  // consent banner so it does not cover the dialog.
  await page.addInitScript((m) => {
    localStorage.setItem('theme', m);
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({
      essential: true, analytics: false, marketing: false,
      timestamp: Date.now(), version: '1.0',
    }));
  }, mode);
  await page.goto(BASE_URL + '/', { waitUntil: 'load' });
  await openSettingsModal(page);

  const theme = await page.getAttribute('html', 'data-bs-theme');
  const panel = page.locator('#cookieSettingsModal .bg-body');
  const modal = page.locator('#cookieSettingsModal .modal-content');

  const after = await page.evaluate(MEASURE);
  const afterPanel = await panel.screenshot();
  const afterModal = await modal.screenshot();

  await page.evaluate(UNFIX);
  await page.waitForTimeout(150);
  const before = await page.evaluate(MEASURE);
  const beforePanel = await panel.screenshot();
  const beforeModal = await modal.screenshot();

  await ctx.close();
  return { mode, theme, before, after, beforePanel, afterPanel, beforeModal, afterModal };
}

const browser = await chromium.launch();
const dark = await captureMode(browser, 'dark');
const light = await captureMode(browser, 'light');

const fmt = (m) => `fg ${m.fg} on bg ${m.bg} → ${m.ratio}:1`;
console.log(`dark  before: ${fmt(dark.before)}   after: ${fmt(dark.after)}`);
console.log(`light before: ${fmt(light.before)}  after: ${fmt(light.after)}`);

await montage(browser, {
  title: 'Cookie settings modal — "Your Privacy Rights" in dark mode',
  note: 'The list used the fixed .text-dark utility on the dark .bg-body panel: '
    + `${dark.before.ratio}:1 — the text IS the background colour. The fix (text-body) `
    + `measures ${dark.after.ratio}:1 (WCAG AA minimum is 4.5:1).`,
  width: 960,
  rows: [
    { label: `❌ BEFORE — dark · ${fmt(dark.before)} · the four list items are invisible`, img: dark.beforePanel, w: 860 },
    { label: `✅ AFTER — dark · ${fmt(dark.after)} · readable`, img: dark.afterPanel, w: 860 },
  ],
}, path.join(EVIDENCE_DIR, '01-dark-before-after.png'));

await montage(browser, {
  title: 'Cookie settings modal — light mode unchanged',
  note: 'In light mode .text-dark and .text-body resolve to effectively the same colour; '
    + `the fix is a no-op there (before ${light.before.ratio}:1 → after ${light.after.ratio}:1).`,
  width: 960,
  rows: [
    { label: `BEFORE — light · ${fmt(light.before)}`, img: light.beforePanel, w: 860 },
    { label: `AFTER — light · ${fmt(light.after)}`, img: light.afterPanel, w: 860 },
  ],
}, path.join(EVIDENCE_DIR, '02-light-before-after.png'));

await montage(browser, {
  title: 'Full dialog — dark mode, before vs after',
  note: 'Whole #cookieSettingsModal in dark mode. Also visible: .cookie-category borders '
    + 'now use var(--bs-border-color) instead of the hardcoded light-mode #dee2e6.',
  width: 960,
  rows: [
    { label: '❌ BEFORE — dark', img: dark.beforeModal, w: 860 },
    { label: '✅ AFTER — dark', img: dark.afterModal, w: 860 },
  ],
}, path.join(EVIDENCE_DIR, '03-dark-full-modal.png'));

await browser.close();

const metrics = {
  slug: SLUG,
  route: '/',
  element: '#cookieSettingsModal .bg-body li',
  wcagMinimum: 4.5,
  dark: { theme: dark.theme, before: dark.before, after: dark.after },
  light: { theme: light.theme, before: light.before, after: light.after },
};
fs.writeFileSync(path.join(EVIDENCE_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2));

const snippet = `  (evidence: [\`test/visual/evidence/${SLUG}/\`](test/visual/evidence/${SLUG}/README.md) — `
  + `dark-mode contrast ${dark.before.ratio}:1 → ${dark.after.ratio}:1, light mode unchanged)`;
fs.writeFileSync(path.join(EVIDENCE_DIR, 'CHANGELOG-snippet.txt'), snippet + '\n');

const pass = dark.after.ratio >= 4.5 && dark.before.ratio < 1.5 && light.after.ratio >= 4.5;
console.log(`\nEvidence written to ${EVIDENCE_DIR}`);
console.log(pass ? 'PASS: before reproduces the bug, after meets WCAG AA.' : 'FAIL: unexpected measurements — inspect before committing.');
process.exit(pass ? 0 : 1);
