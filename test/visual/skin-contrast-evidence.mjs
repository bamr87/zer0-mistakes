/**
 * Evidence generator for the skin-contrast fix (#410 / T-042, and the
 * site-quality scans of the sites that float on this theme).
 *
 * The fix is Sass plus three class swaps, so BEFORE is a real render of the
 * base branch, not a CSS mock: capture each state from a build of that tree,
 * then compose.
 *
 *   docker compose up                                   # serves :4000
 *   node test/visual/skin-contrast-evidence.mjs capture after
 *   git checkout "$(git merge-base origin/main HEAD)" -- _sass _includes _layouts
 *   # wait for the rebuild
 *   node test/visual/skin-contrast-evidence.mjs capture before
 *   git checkout HEAD -- _sass _includes _layouts
 *   node test/visual/skin-contrast-evidence.mjs compose
 *
 * With no arguments it captures the current build as AFTER and composes, so
 * an autogen re-run still produces after-state proof. Raw captures go to
 * test/visual-results/skin-contrast/ (git-ignored); the composed montages,
 * metrics.json and CHANGELOG-snippet.txt go to test/visual/evidence/skin-contrast/.
 *
 * The measurement is the same as test/visual/core/skin-contrast.spec.js:
 * WCAG 2.x ratio against the composited backdrop, per palette skin and mode.
 */
// slug: 'skin-contrast'
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { montage } from './evidence-kit.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const SLUG = 'skin-contrast';
const EVIDENCE_DIR = path.join(__dirname, 'evidence', SLUG);
const RAW_DIR = path.join(__dirname, '..', 'visual-results', SLUG);
const SKINS = ['air', 'aqua', 'dirt', 'neon', 'mint', 'plum', 'sunrise'];
const MODES = ['light', 'dark'];
const AA = 4.5;

// A compact strip of the skin-coloured components the fix touched.
const STRIP = `
<div id="contrast-strip" class="bg-body p-2 d-flex flex-wrap align-items-center gap-2"
     style="position:relative;z-index:1;width:1180px">
  <a href="#s" class="btn btn-primary" data-probe=".btn-primary">Primary</a>
  <span class="btn btn-primary" data-probe=".btn-primary:hover"
        style="color:var(--bs-btn-hover-color);background-color:var(--bs-btn-hover-bg)">Hover</span>
  <span class="btn btn-primary" data-probe=".btn-primary:active"
        style="color:var(--bs-btn-active-color);background-color:var(--bs-btn-active-bg)">Active</span>
  <a href="#s" class="btn btn-outline-primary" data-probe=".btn-outline-primary">Outline</a>
  <span class="badge bg-primary" data-probe=".badge.bg-primary">bg-primary</span>
  <span class="badge text-bg-primary" data-probe=".text-bg-primary">text-bg-primary</span>
  <span class="text-primary fw-semibold" data-probe=".text-primary">text-primary</span>
  <ul class="pagination mb-0">
    <li class="page-item"><a class="page-link" href="#s" data-probe=".page-link">1</a></li>
    <li class="page-item active"><a class="page-link" href="#s" data-probe=".page-item.active .page-link">2</a></li>
  </ul>
  <span class="alert alert-primary py-1 px-2 mb-0" data-probe=".alert-primary">alert-primary</span>
  <ul class="dropdown-menu d-block position-static py-1" style="min-width:0">
    <li><a class="dropdown-item" aria-current="page" href="#s" data-probe=".dropdown-item[aria-current]">Current item</a></li>
  </ul>
  <nav class="nav-tree" style="width:150px"><a class="nav-tree-link active d-block rounded px-2 py-1" aria-current="page" href="#s"
     data-probe=".nav-tree-link.active">Current doc</a></nav>
</div>`;

const NO_TRANSITIONS = '*, *::before, *::after { transition: none !important; animation: none !important; }';

// In-page measurement — kept in step with test/visual/core/skin-contrast.spec.js.
function measureContrast(selector) {
  const parse = (value) => {
    const c = String(value).trim();
    let m = c.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    m = c.match(/^color\(srgb\s+([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s/]+/).filter(Boolean).map(parseFloat);
      return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p.length > 3 ? p[3] : 1 };
    }
    return null;
  };
  const over = (top, under) => ({
    r: top.r * top.a + under.r * (1 - top.a),
    g: top.g * top.a + under.g * (1 - top.a),
    b: top.b * top.a + under.b * (1 - top.a),
    a: 1,
  });
  const backdrop = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
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
  const hex = ({ r, g, b }) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  return [...document.querySelectorAll(selector)].map((el) => {
    const bg = backdrop(el);
    const fg = over(parse(getComputedStyle(el).color), bg);
    return { probe: el.getAttribute('data-probe'), fg: hex(fg), bg: hex(bg), ratio: Math.round(ratio(fg, bg) * 100) / 100 };
  });
}

async function applySkin(page, skin, mode) {
  await page.evaluate(([s, m]) => {
    document.documentElement.setAttribute('data-theme-skin', s);
    document.documentElement.setAttribute('data-bs-theme', m);
  }, [skin, mode]);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function open(page, route) {
  await page.goto(BASE_URL + route, { waitUntil: 'load' });
  await page.addStyleTag({ content: NO_TRANSITIONS });
}

async function capture(state) {
  const out = path.join(RAW_DIR, state);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // Keep the consent banner out of the crops.
  await ctx.addInitScript(() => localStorage.setItem('zer0-cookie-consent', JSON.stringify({
    essential: true, analytics: false, marketing: false, timestamp: Date.now(), version: '1.0',
  })));
  const page = await ctx.newPage();
  const data = { state, base: BASE_URL, strip: {}, navbar: {}, dropdown: {}, toggles: [], grayBadge: null };

  // 1. Component strip, every palette skin x mode.
  await open(page, '/');
  await page.evaluate((html) => document.querySelector('#main-content').insertAdjacentHTML('afterbegin', html), STRIP);
  for (const mode of MODES) {
    for (const skin of SKINS) {
      await applySkin(page, skin, mode);
      data.strip[`${skin}/${mode}`] = await page.evaluate(measureContrast, '#contrast-strip [data-probe]');
      await page.locator('#contrast-strip').screenshot({ path: path.join(out, `strip-${skin}-${mode}.png`) });
    }
  }

  // 2. Navbar current-page link (/quickstart/ marks "Quick Start").
  await open(page, '/quickstart/');
  await page.evaluate(() => {
    const el = document.querySelector('#bdNavbar .nav-link[aria-current="page"] .nav-link-text')
      || document.querySelector('#bdNavbar .nav-link[aria-current="page"]');
    el.setAttribute('data-probe', 'navbar current link');
  });
  const navbar = page.locator('header#navbar .navbar');
  for (const mode of MODES) {
    for (const skin of SKINS) {
      await applySkin(page, skin, mode);
      [data.navbar[`${skin}/${mode}`]] = await page.evaluate(measureContrast, '#bdNavbar [data-probe]');
      const box = await navbar.boundingBox();
      await page.screenshot({ path: path.join(out, `navbar-${skin}-${mode}.png`),
        clip: { x: 0, y: box.y, width: 1280, height: Math.min(box.height, 72) } });
    }
  }

  // 3. Current dropdown item (/quickstart/machine-setup/), opened for the shot.
  await open(page, '/quickstart/machine-setup/');
  await page.evaluate(() => document.querySelector('#bdNavbar .dropdown-item[aria-current="page"]')
    .setAttribute('data-probe', 'current dropdown item'));
  const menu = page.locator('#bdNavbar .dropdown-item[aria-current="page"]').locator('xpath=ancestor::ul[1]');
  await menu.evaluate((ul) => { ul.classList.add('show'); ul.style.display = 'block'; });
  for (const mode of MODES) {
    for (const skin of ['air', 'dirt']) {
      await applySkin(page, skin, mode);
      [data.dropdown[`${skin}/${mode}`]] = await page.evaluate(measureContrast, '#bdNavbar [data-probe]');
      await menu.screenshot({ path: path.join(out, `dropdown-${skin}-${mode}.png`) });
    }
  }
  for (const skin of SKINS) {
    for (const mode of MODES) {
      if (data.dropdown[`${skin}/${mode}`]) continue;
      await applySkin(page, skin, mode);
      [data.dropdown[`${skin}/${mode}`]] = await page.evaluate(measureContrast, '#bdNavbar [data-probe]');
    }
  }

  // 4. Gray month-count badges on the news index archive.
  await open(page, '/news/');
  await applySkin(page, 'air', 'light');
  // The month counts in the news index's Archives card (_layouts/news.html).
  const badge = page.locator('.card:has(.bi-archive) ul.list-unstyled .badge').first();
  if (await badge.count()) {
    await badge.evaluate((el) => el.setAttribute('data-probe', 'gray count badge'));
    [data.grayBadge] = await page.evaluate(measureContrast, '[data-probe="gray count badge"]');
    data.grayBadge.className = await badge.getAttribute('class');
    const card = page.locator('.card:has(.bi-archive)').first();
    await card.scrollIntoViewIfNeeded();
    await card.screenshot({ path: path.join(out, 'gray-badges.png') });
  }

  // 5. Sidebar chevron toggles on a URL-hierarchy page tree.
  await open(page, '/docs/features/sidebar-page-tree/');
  await applySkin(page, 'air', 'light');
  for (const t of await page.locator('aside.bd-sidebar .nav-tree-toggle.p-1').all()) {
    if (!(await t.isVisible())) continue;
    const b = await t.boundingBox();
    data.toggles.push({ width: Math.round(b.width * 10) / 10, height: Math.round(b.height * 10) / 10 });
  }
  const tree = page.locator('aside.bd-sidebar .sidebar-pagetree').first();
  await page.addStyleTag({ content: 'aside.bd-sidebar .nav-tree-toggle.p-1 { outline: 2px dashed #d63384 !important; outline-offset: 0 !important; }' });
  const tb = await tree.boundingBox();
  await page.screenshot({ path: path.join(out, 'toggles.png'),
    clip: { x: tb.x, y: tb.y, width: tb.width, height: Math.min(tb.height, 300) } });

  fs.writeFileSync(path.join(out, 'data.json'), JSON.stringify(data, null, 2));
  await browser.close();
  console.log(`captured ${state} → ${out}`);
}

function load(state) {
  const f = path.join(RAW_DIR, state, 'data.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}
const img = (state, name) => {
  const f = path.join(RAW_DIR, state, name);
  return fs.existsSync(f) ? fs.readFileSync(f) : null;
};
const worst = (rows) => rows.reduce((w, r) => (w && w.ratio <= r.ratio ? w : r), null);
const mark = (r) => (r && r.ratio < AA ? '❌' : '•');

async function compose() {
  const before = load('before');
  const after = load('after');
  if (!after) throw new Error('no AFTER capture — run `capture after` first');
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const browser = await chromium.launch();
  const fmt = (r) => (r ? `${r.ratio}:1 (${r.fg} on ${r.bg})` : 'n/a');

  // 01 — the scans' finding: the current-page navbar link, air light.
  const rows01 = [];
  for (const [skin, mode] of [['air', 'light'], ['air', 'dark'], ['dirt', 'dark'], ['mint', 'light']]) {
    const key = `${skin}/${mode}`;
    if (before) rows01.push({ label: `${mark(before.navbar[key])} BEFORE — ${skin} / ${mode} · current link ${fmt(before.navbar[key])}`, img: img('before', `navbar-${skin}-${mode}.png`), w: 1180 });
    rows01.push({ label: `✅ AFTER — ${skin} / ${mode} · current link ${fmt(after.navbar[key])}`, img: img('after', `navbar-${skin}-${mode}.png`), w: 1180 });
  }
  await montage(browser, {
    title: 'Navbar current-page link ("Quick Start" on /quickstart/)',
    note: 'The site-quality scans flagged span.nav-link-text @ 2.4:1: the current link used the raw brand. It now uses the skin\'s link-hover shade.',
    width: 1220, rows: rows01.filter((r) => r.img),
  }, path.join(EVIDENCE_DIR, '01-navbar-current-link.png'));

  // 02 — the component strip, before/after, light, every skin.
  for (const mode of MODES) {
    const rows = [];
    for (const skin of SKINS) {
      const key = `${skin}/${mode}`;
      if (before) rows.push({ label: `${mark(worst(before.strip[key]))} BEFORE — ${skin} / ${mode} · worst ${fmt(worst(before.strip[key]))} [${worst(before.strip[key]).probe}]`, img: img('before', `strip-${skin}-${mode}.png`), w: 1180 });
      rows.push({ label: `✅ AFTER — ${skin} / ${mode} · worst ${fmt(worst(after.strip[key]))} [${worst(after.strip[key]).probe}]`, img: img('after', `strip-${skin}-${mode}.png`), w: 1180 });
    }
    await montage(browser, {
      title: `Brand-filled and brand-coloured components — ${mode} mode`,
      note: 'Buttons (rest, hover, active), badges, text-primary, pagination, alert, the current dropdown item and the current sidebar link. Each label gives the lowest ratio in the strip.',
      width: 1220, rows: rows.filter((r) => r.img),
    }, path.join(EVIDENCE_DIR, `0${mode === 'light' ? 2 : 3}-components-${mode}.png`));
  }

  // 04 — gray badges and the 24px toggles.
  const rows04 = [];
  if (before?.grayBadge) rows04.push({ label: `${mark(before.grayBadge)} BEFORE — ${before.grayBadge.className} · ${fmt(before.grayBadge)}`, img: img('before', 'gray-badges.png') });
  if (after.grayBadge) rows04.push({ label: `✅ AFTER — ${after.grayBadge.className} · ${fmt(after.grayBadge)}`, img: img('after', 'gray-badges.png') });
  const sizes = (d) => d.toggles.map((t) => `${t.width}x${t.height}`).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  if (before) rows04.push({ label: `❌ BEFORE — chevron .nav-tree-toggle (dashed) ${sizes(before)} px`, img: img('before', 'toggles.png') });
  rows04.push({ label: `✅ AFTER — chevron .nav-tree-toggle (dashed) ${sizes(after)} px`, img: img('after', 'toggles.png') });
  await montage(browser, {
    title: 'Gray count badges (/news/ archive) and sidebar toggle target size',
    note: 'bg-secondary text-body → text-bg-secondary; the chevron-only toggles grow to the 24px WCAG 2.5.8 minimum.',
    width: 900, rows: rows04.filter((r) => r.img),
  }, path.join(EVIDENCE_DIR, '04-badges-and-toggles.png'));
  await browser.close();

  const summarise = (d) => d && {
    stripWorstBySkinMode: Object.fromEntries(Object.entries(d.strip).map(([k, rows]) => [k, worst(rows)])),
    stripFailures: Object.entries(d.strip).flatMap(([k, rows]) => rows.filter((r) => r.ratio < AA).map((r) => ({ skinMode: k, ...r }))),
    navbarCurrentLink: d.navbar,
    currentDropdownItem: d.dropdown,
    grayBadge: d.grayBadge,
    chevronToggles: d.toggles,
  };
  const metrics = {
    slug: SLUG,
    wcagMinimum: AA,
    skins: SKINS,
    modes: MODES,
    routes: ['/', '/quickstart/', '/quickstart/machine-setup/', '/news/', '/docs/features/sidebar-page-tree/'],
    before: summarise(before),
    after: summarise(after),
  };
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n');

  const nb = before && before.navbar['air/light'];
  const na = after.navbar['air/light'];
  const failsAfter = metrics.after.stripFailures.length;
  const snippet = `  (evidence: [\`test/visual/evidence/${SLUG}/\`](test/visual/evidence/${SLUG}/README.md) — `
    + (nb ? `air current nav link ${nb.ratio}:1 → ${na.ratio}:1, ` : '')
    + `${failsAfter} component strip failures across 7 skins × light/dark after the fix)`;
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'CHANGELOG-snippet.txt'), snippet + '\n');

  const ok = failsAfter === 0 && Object.values(after.navbar).every((r) => r.ratio >= AA)
    && Object.values(after.dropdown).every((r) => r.ratio >= AA)
    && after.toggles.every((t) => t.width >= 24 && t.height >= 24);
  console.log(ok ? 'PASS: every AFTER measurement meets the minimum.' : 'FAIL: an AFTER measurement is under the minimum — inspect before committing.');
  return ok;
}

const [cmd, state] = process.argv.slice(2);
if (cmd === 'capture') {
  if (!['before', 'after'].includes(state)) throw new Error('usage: capture before|after');
  await capture(state);
} else if (cmd === 'compose') {
  process.exit((await compose()) ? 0 : 1);
} else {
  await capture('after');
  process.exit((await compose()) ? 0 : 1);
}
