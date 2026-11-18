// =============================================================================
// admin-layout-evidence.mjs — before/after evidence for the admin layout (#409)
// =============================================================================
// slug: 'admin-layout'
//
// #409 (T-041) is a template change — a new header-actions block, grouped
// sidebar markup, a removed <h6> — so the kit's `unfixCss` cannot reproduce
// the BEFORE state on one server. Like settings-evidence.mjs this script
// drives TWO builds:
//
//   BEFORE_URL  a build of main            (default http://127.0.0.1:4012)
//   AFTER_URL   a build of the PR branch   (default $BASE_URL or http://127.0.0.1:4000)
//
// and composes labelled before/after montages with the shared `montage`
// helper from evidence-kit.mjs at 375 / 768 / 1280px, plus a metrics.json of
// what each state exposes (the AFTER side is what features/admin.spec.js
// asserts).
//
// Usage:
//   python3 -m http.server 4012 --directory <main-build>   &
//   docker compose up -d               # PR branch at :4000
//   node test/visual/admin-layout-evidence.mjs
// =============================================================================
import { chromium } from '@playwright/test';
import { montage } from './evidence-kit.mjs';
import fs from 'fs';

const BEFORE = process.env.BEFORE_URL || 'http://127.0.0.1:4012';
const AFTER = process.env.AFTER_URL || process.env.BASE_URL || 'http://127.0.0.1:4000';
const slug = 'admin-layout';
const outDir = `test/visual/evidence/${slug}`;
fs.mkdirSync(outDir, { recursive: true });

// The page with two admin_actions (after) and the sidebar's reference page.
const ACTIONS_URL = '/about/settings/theme-preview/';
const SIDEBAR_URL = '/about/config/';
const WIDTHS = [375, 768, 1280];

// What a state exposes, measured in the page.
const MEASURE = () => {
  const vw = document.documentElement.clientWidth;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const header = document.querySelector('.bg-body-tertiary.border-bottom');
  const actionLinks = header ? [...header.querySelectorAll('a.btn, .dropdown-item')] : [];
  const active = document.querySelector('nav.admin-sidebar .nav-link.active');
  return {
    viewport: vw,
    headerActionsInDom: actionLinks.length,
    headerActionsVisible: actionLinks.filter(visible).length,
    moreActionsToggle: !!(header && header.querySelector('[data-bs-toggle="dropdown"]')),
    headerOverflowPx: header
      ? Math.max(0, Math.round(Math.max(...[...header.querySelectorAll('*')].map((el) => el.getBoundingClientRect().right), 0) - vw))
      : 0,
    administrationHeadings: [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
      .filter((h) => h.textContent.trim() === 'Administration').length,
    sidebarGroupLabels: [...document.querySelectorAll('nav.admin-sidebar .admin-nav-group-label')].map((el) => el.textContent.trim()),
    sidebarBadgePills: document.querySelectorAll('nav.admin-sidebar .badge').length,
    activeAriaCurrent: active ? active.getAttribute('aria-current') : null,
    activeBackground: active ? getComputedStyle(active).backgroundColor : null,
    activeColor: active ? getComputedStyle(active).color : null,
  };
};

// "solid rgb(…)" or "14% tint" for a computed background colour.
function describeFill(bg) {
  if (!bg) return 'none';
  const slash = bg.match(/\/\s*([\d.]+)\s*\)$/);
  const rgba = bg.match(/^rgba\((?:[^,]+,){3}\s*([\d.]+)\)$/);
  const alpha = slash ? Number(slash[1]) : rgba ? Number(rgba[1]) : 1;
  return alpha < 1 ? `${Math.round(alpha * 100)}% tint` : `solid ${bg}`;
}

const browser = await chromium.launch();
const metrics = { slug, before: BEFORE, after: AFTER, header: [], sidebar: {}, offcanvas: {} };
let n = 0;
const next = () => String(++n).padStart(2, '0');

async function open(base, route, width, height = 900) {
  const page = await browser.newPage();
  await page.setViewportSize({ width, height });
  await page.goto(base + route, { waitUntil: 'load' });
  // Bootstrap is deferred; dropdowns and offcanvas need it.
  await page.waitForFunction(() => window.bootstrap);
  await page.evaluate(() => document.getElementById('cookieConsent')?.remove());
  await page.evaluate(() => document.fonts ? document.fonts.ready : true);
  return page;
}

const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

// Viewport clip around one or more elements (union of their boxes).
async function clipAround(page, selectors, pad = 8) {
  return page.evaluate(({ selectors, pad }) => {
    const boxes = selectors.flatMap((s) => [...document.querySelectorAll(s)])
      .map((el) => el.getBoundingClientRect()).filter((r) => r.width && r.height);
    const x = Math.max(0, Math.min(...boxes.map((b) => b.left)) - pad);
    const y = Math.max(0, Math.min(...boxes.map((b) => b.top)) - pad);
    const right = Math.min(innerWidth, Math.max(...boxes.map((b) => b.right)) + pad);
    const bottom = Math.min(innerHeight, Math.max(...boxes.map((b) => b.bottom)) + pad);
    return { x, y, width: right - x, height: bottom - y };
  }, { selectors, pad });
}

// 1. Header actions at each width: BEFORE (main), AFTER, AFTER with the
//    "More actions" menu open. The header sits right under the fixed navbar
//    at scroll 0, so it is shot without scrolling.
for (const w of WIDTHS) {
  const HEADER = '.bg-body-tertiary.border-bottom';
  const before = await open(BEFORE, ACTIONS_URL, w);
  await settle(before);
  const bm = await before.evaluate(MEASURE);
  const bImg = await before.screenshot({ clip: await clipAround(before, [HEADER], 0) });
  await before.close();

  const after = await open(AFTER, ACTIONS_URL, w);
  await settle(after);
  const am = await after.evaluate(MEASURE);
  const aImg = await after.screenshot({ clip: await clipAround(after, [HEADER], 0) });
  await after.click('.admin-actions [data-bs-toggle="dropdown"]');
  await after.waitForSelector('.admin-actions .dropdown-menu.show');
  await settle(after);
  const openM = await after.evaluate(MEASURE);
  const oImg = await after.screenshot({ clip: await clipAround(after, [HEADER, '.admin-actions .dropdown-menu.show'], 0) });
  await after.close();

  metrics.header.push({ width: w, before: bm, after: am, afterMenuOpen: openM });
  console.log(`[header ${w}px] visible actions before=${bm.headerActionsVisible}/${bm.headerActionsInDom} after=${am.headerActionsVisible}/${am.headerActionsInDom} menu-open=${openM.headerActionsVisible}`);
  const panelW = Math.min(w, 900);
  await montage(browser, {
    title: `Admin header actions — ${w}px (${ACTIONS_URL})`,
    note: w < 768
      ? 'BEFORE: the actions sat in a d-none d-md-flex wrapper, so below 768px none rendered. AFTER: the first action is a button at every width and the rest open from "More actions" (⋯); below md they wrap onto their own line under the title, inside the screen.'
      : 'BEFORE: every action was an inline button from md up. AFTER: the first action stays a button and the rest move into "More actions" (⋯), the same control at every width.',
    width: panelW + 80,
    rows: [
      { label: `BEFORE — main · ${bm.headerActionsVisible} of ${bm.headerActionsInDom} actions visible`, img: bImg, w: panelW },
      { label: `AFTER — this PR · button + "More actions" toggle (${am.headerActionsVisible} visible)`, img: aImg, w: panelW },
      { label: `AFTER — "More actions" open · ${openM.headerActionsVisible} of ${openM.headerActionsInDom} actions visible`, img: oImg, w: panelW },
    ],
  }, `${outDir}/${next()}-header-${w}.png`);
}

// 2. Desktop sidebar on /about/config/.
{
  const SIDEBAR = 'nav.admin-sidebar';
  const before = await open(BEFORE, SIDEBAR_URL, 1280, 1000);
  const bm = await before.evaluate(MEASURE);
  const bImg = await before.screenshot({ clip: await clipAround(before, [SIDEBAR]) });
  await before.close();
  const after = await open(AFTER, SIDEBAR_URL, 1280, 1000);
  const am = await after.evaluate(MEASURE);
  const aImg = await after.screenshot({ clip: await clipAround(after, [SIDEBAR]) });
  await after.close();
  metrics.sidebar = { width: 1280, route: SIDEBAR_URL, before: bm, after: am };
  console.log(`[sidebar] groups before=${bm.sidebarGroupLabels.length} after=${am.sidebarGroupLabels.join('/')} headings before=${bm.administrationHeadings} after=${am.administrationHeadings}`);
  await montage(browser, {
    title: `Admin sidebar — 1280px (${SIDEBAR_URL})`,
    note: 'BEFORE: an "Administration" h6 heading over one flat list, counts and statuses as pill badges, the active item a solid primary pill. AFTER: Configure / System / Links list labels (not headings), the count a plain numeral, statuses a dot plus a word, the active item a tint of the skin colour, semibold, with aria-current.',
    width: 760,
    rows: [
      { label: `BEFORE — main · ${bm.sidebarBadgePills} badge pills · active item ${describeFill(bm.activeBackground)}`, img: bImg, w: 320 },
      { label: `AFTER — this PR · groups ${am.sidebarGroupLabels.join(' / ')} · active item ${describeFill(am.activeBackground)}, aria-current="${am.activeAriaCurrent}"`, img: aImg, w: 320 },
    ],
  }, `${outDir}/${next()}-sidebar-1280.png`);
}

// 3. Mobile offcanvas sidebar (the one place "Administration" stays a heading).
{
  async function offcanvas(base) {
    const page = await open(base, SIDEBAR_URL, 375, 812);
    await page.evaluate(() => new Promise((resolve) => {
      const el = document.getElementById('adminSidebar');
      el.addEventListener('shown.bs.offcanvas', () => resolve(), { once: true });
      window.bootstrap.Offcanvas.getOrCreateInstance(el).show();
    }));
    await settle(page);
    const m = await page.evaluate(MEASURE);
    const img = await page.screenshot({ clip: await clipAround(page, ['#adminSidebar'], 0) });
    await page.close();
    return { m, img };
  }
  const before = await offcanvas(BEFORE);
  const after = await offcanvas(AFTER);
  metrics.offcanvas = { width: 375, route: SIDEBAR_URL, before: before.m, after: after.m };
  await montage(browser, {
    title: `Admin offcanvas sidebar — 375px (${SIDEBAR_URL})`,
    note: 'The offcanvas title is now the only "Administration" heading in the DOM (BEFORE, the hidden desktop h6 made two). The grouped list renders here too, with its own label ids.',
    width: 760,
    rows: [
      { label: `BEFORE — main · ${before.m.administrationHeadings} "Administration" headings in the DOM`, img: before.img, w: 320 },
      { label: `AFTER — this PR · ${after.m.administrationHeadings} "Administration" heading in the DOM`, img: after.img, w: 320 },
    ],
  }, `${outDir}/${next()}-offcanvas-375.png`);
}

fs.writeFileSync(`${outDir}/metrics.json`, JSON.stringify(metrics, null, 2));
const phone = metrics.header.find((h) => h.width === 375);
fs.writeFileSync(`${outDir}/CHANGELOG-snippet.txt`,
  `<!-- CHANGELOG snippet — evidence: test/visual/evidence/${slug}/ -->\n` +
  `  (evidence: [\`test/visual/evidence/${slug}/\`](test/visual/evidence/${slug}/README.md)` +
  ` — header actions reachable at 375px ${phone.before.headerActionsVisible} → ${phone.afterMenuOpen.headerActionsVisible},` +
  ` "Administration" headings ${metrics.sidebar.before.administrationHeadings} → ${metrics.sidebar.after.administrationHeadings},` +
  ` sidebar groups 0 → ${metrics.sidebar.after.sidebarGroupLabels.length})`);
console.log(`wrote ${outDir}/metrics.json + CHANGELOG-snippet.txt`);
await browser.close();
