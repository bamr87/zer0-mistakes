/**
 * Shared test fixtures and helpers for zer0-mistakes Playwright tests.
 *
 * Usage:
 *   const { ADMIN_PAGES, SKINS, VIEWPORTS, setSkin, waitForJekyll, ... } = require('./fixtures');
 */

/** All admin pages from _data/navigation/admin.yml (internal only).
 *  `title` = nav label in sidebar, `pageTitle` = rendered <h1> on the page. */
const ADMIN_PAGES = [
  { title: 'Configuration', pageTitle: 'Configuration Utility', url: '/about/config/', icon: 'bi-gear' },
  { title: 'Statistics', pageTitle: 'Site Statistics Portal', url: '/about/stats/', icon: 'bi-bar-chart-line' },
  { title: 'Theme Customizer', url: '/about/settings/theme/', icon: 'bi-palette' },
  { title: 'Theme Preview', pageTitle: 'Theme Preview', url: '/about/settings/theme-preview/', icon: 'bi-palette2' },
  { title: 'Navigation Editor', url: '/about/settings/navigation/', icon: 'bi-signpost-2' },
  { title: 'Collection Manager', url: '/about/settings/collections/', icon: 'bi-collection' },
  { title: 'Analytics Dashboard', url: '/about/settings/analytics/', icon: 'bi-graph-up' },
  { title: 'Environment & Build', pageTitle: 'Environment & Build Info', url: '/about/settings/environment/', icon: 'bi-hdd-network' },
];

/** All nine theme skins defined in _config.yml / backgrounds system. */
const SKINS = ['air', 'aqua', 'contrast', 'dark', 'dirt', 'neon', 'mint', 'plum', 'sunrise'];

/** Standard viewports for responsive testing. */
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  /** Mid desktop — navbar container-query tier (~1140px). */
  midDesktop: { width: 1140, height: 720 },
  desktop: { width: 1280, height: 720 },
  /** Wide desktop — full nav labels + four-column footer. */
  wideDesktop: { width: 1320, height: 720 },
};

/**
 * Width matrix for navbar responsiveness — spans the small-phone floor, the
 * tablet band, both sides of the lg (992px) inline/offcanvas switch, the
 * container-query label tiers, and ultra-wide. Each entry is a viewport width
 * the navbar must render without cutting off or overflowing.
 */
const NAV_WIDTHS = [320, 360, 390, 414, 600, 768, 820, 991, 992, 1040, 1140, 1200, 1280, 1320, 1440, 1920];

/**
 * Measure navbar + page layout in the browser at the current viewport.
 * Returns a plain object the spec can assert on:
 *   - docOverflowPx:   worst horizontal overflow of any in-flow element past the
 *                      viewport, EXCLUDING content that scrolls in its own
 *                      container (tables/code) and fixed/off-screen chrome
 *                      (offcanvas). >0 means the page can scroll sideways → the
 *                      fixed navbar looks "cut off". Robust under overflow-x: clip
 *                      (uses getBoundingClientRect, not scrollWidth).
 *   - worstSelector:   tag/id/class of the worst offender (for failure messages)
 *   - navbarCoversViewport: header right edge reaches the viewport right edge
 *   - utilWithinViewport:   the search/settings cluster is fully on-screen
 *   - brandVisible:    the brand logo link is rendered with a non-zero box
 *   - menuClipsPx:     (lg+) how far the inline menubar's items overflow their
 *                      track; >0 means top-level items are clipped
 *   - togglerVisible:  (<lg) the offcanvas hamburger is visible
 * @param {import('@playwright/test').Page} page
 */
async function measureNavbarLayout(page) {
  return page.evaluate(() => {
    const cw = document.documentElement.clientWidth;
    const vw = window.innerWidth;
    const lg = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--zer0-bp-lg'), 10) || 992;

    // Worst non-scrollable, in-flow element overflowing the right edge.
    let worst = null;
    document.querySelectorAll('#main-content *, header#navbar *').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (cs.position === 'fixed') return;
      if (el.closest('.offcanvas, .offcanvas-lg, .modal')) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= cw + 1) return;
      // Skip elements whose overflow is contained by an ancestor clip/scroll
      // box (a table wrapper with overflow-x:auto, a hero with overflow:hidden,
      // etc.) — those never reach the page. The root <html> clip (our safety
      // net) is deliberately EXCLUDED so genuinely-overflowing content it is
      // merely hiding is still reported.
      let contained = false, n = el.parentElement;
      while (n && n !== document.body && n !== document.documentElement) {
        if (getComputedStyle(n).overflowX !== 'visible') { contained = true; break; }
        n = n.parentElement;
      }
      if (contained) return;
      if (!worst || r.right > worst.right) {
        worst = {
          right: r.right,
          sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
               (el.className && typeof el.className === 'string'
                 ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
        };
      }
    });

    const header = document.getElementById('navbar');
    const util = document.querySelector('#navbar .navbar-utility-controls');
    const brand = document.querySelector('#navbar a.navbar-brand');
    const navList = document.querySelector('#bdNavbar .navbar-nav');
    const toggler = document.querySelector(
      '.bd-navbar-toggle.d-lg-none button.navbar-toggler[data-bs-target="#bdNavbar"]'
    );

    const hb = header ? header.getBoundingClientRect() : null;
    const ub = util ? util.getBoundingClientRect() : null;
    const bb = brand ? brand.getBoundingClientRect() : null;
    const tb = toggler ? toggler.getBoundingClientRect() : null;

    return {
      vw, cw, lg,
      docOverflowPx: worst ? Math.round(worst.right - cw) : 0,
      worstSelector: worst ? worst.sel : null,
      navbarCoversViewport: hb ? Math.abs(hb.right - cw) <= 2 && hb.left <= 1 : false,
      utilWithinViewport: ub ? ub.right <= cw + 1 && ub.left >= -1 : null,
      brandVisible: bb ? bb.width > 0 && bb.height > 0 : false,
      menuClipsPx: navList ? Math.max(0, Math.round(navList.scrollWidth - navList.clientWidth)) : 0,
      togglerVisible: tb ? tb.width > 0 && tb.height > 0 : false,
    };
  });
}

/** Canonical routes exercised by ui-refresh.spec.js (skip when 404). */
const UI_ROUTES = {
  home: '/',
  quickstart: '/quickstart/',
  quickstartArticle: '/quickstart/github-setup/',
  notes: '/notes/',
  newsSection: '/news/business/',
  features: '/features/',
  stats: '/about/stats/',
  themePreview: '/about/settings/theme-preview/',
  codeCopy: '/docs/features/code-copy/',
  faq: '/faq/',
};

/**
 * Wait for a Jekyll-served page to be ready.
 *
 * We deliberately avoid `networkidle` here: it's flaky on pages with
 * analytics, mermaid CDNs, or long-running fetches. Instead we wait for
 * `domcontentloaded` and then for `document.readyState === 'complete'`,
 * which is sufficient for the assertions in our specs.
 */
async function waitForJekyll(page, url = '/') {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
}

/**
 * Navigate to a page with Bootstrap ScrollSpy disabled.
 * Uses addInitScript to remove data-bs-spy from <body> before Bootstrap
 * auto-initializes, preventing it from stripping server-rendered .active
 * classes on admin sidebar nav links.
 */
async function gotoBeforeScrollSpy(page, url) {
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.removeAttribute('data-bs-spy');
      document.body.removeAttribute('data-bs-target');
    });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('load');
}

/**
 * Switch the active skin via the zer0Bg API and wait for the event.
 * @param {import('@playwright/test').Page} page
 * @param {string} skinName - One of SKINS
 */
async function setSkin(page, skinName) {
  await page.waitForFunction(() => typeof window.zer0Bg?.setSkin === 'function');
  await page.evaluate((name) => {
    return new Promise((resolve) => {
      document.addEventListener('zer0:skin-change', () => resolve(), { once: true });
      window.zer0Bg.setSkin(name);
    });
  }, skinName);
  // Wait for the html[data-theme-skin] attribute to reflect the new skin
  // before any CSS-variable-dependent assertion or screenshot. This replaces
  // a brittle waitForTimeout(300) that produced flaky snapshots.
  await page.waitForFunction(
    (name) => document.documentElement.getAttribute('data-theme-skin') === name,
    skinName,
  );
}

/**
 * Collect console errors during a test. Call at test start; check at end.
 * @param {import('@playwright/test').Page} page
 * @returns {{ errors: string[] }} - Mutable object; check .errors after navigation.
 */
function collectConsoleErrors(page) {
  const bag = { errors: [] };
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore known benign messages
      if (/zer0Bg is not defined/.test(text)) return;
      if (/favicon/.test(text)) return;
      bag.errors.push(text);
    }
  });
  return bag;
}

/**
 * Assert no unexpected JavaScript console errors were logged.
 * @param {import('@playwright/test').Expect} expect
 * @param {{ errors: string[] }} bag - From collectConsoleErrors()
 */
function assertNoConsoleErrors(expect, bag) {
  expect(bag.errors, `Unexpected console errors:\n${bag.errors.join('\n')}`).toEqual([]);
}

/**
 * Clear localStorage skin/bg preferences to start fresh.
 * Call after page.goto() so the page context exists.
 */
async function clearSkinStorage(page) {
  await page.evaluate(() => {
    localStorage.removeItem('zer0-theme-skin');
    localStorage.removeItem('zer0-bg-enabled');
  });
}

/**
 * Pre-seed the cookie-consent choice so the banner never opens.
 * The banner stacks above offcanvas panels by design (--zer0-layer-cookie-banner
 * 1095 > --zer0-layer-offcanvas 1045), so tests that interact with lower-screen
 * chrome must dismiss it the way a returning visitor would. Call BEFORE goto().
 * @param {import('@playwright/test').Page} page
 */
async function dismissCookieConsent(page) {
  await page.addInitScript(() => {
    localStorage.setItem('zer0-cookie-consent', JSON.stringify({
      essential: true, analytics: false, marketing: false,
      timestamp: Date.now(), version: '1.0',
    }));
  });
}

/**
 * Visit a URL and skip the test when the route is unavailable (404/5xx).
 * @param {import('@playwright/test').Page} page
 * @param {string} url
 */
async function gotoOrSkip(page, url) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (!response || response.status() >= 400) {
    const { test } = require('@playwright/test');
    test.skip(true, `Route ${url} not available (status=${response?.status() ?? 'no response'})`);
  }
  await page.waitForLoadState('load');
}

/**
 * Return true when two bounding boxes overlap by more than `tolerance` px.
 * @param {{ x: number, y: number, width: number, height: number } | null} a
 * @param {{ x: number, y: number, width: number, height: number } | null} b
 * @param {number} [tolerance=2]
 */
function boxesOverlap(a, b, tolerance = 2) {
  if (!a || !b) return false;
  const horizontal = a.x + a.width - tolerance > b.x && b.x + b.width - tolerance > a.x;
  const vertical = a.y + a.height - tolerance > b.y && b.y + b.height - tolerance > a.y;
  return horizontal && vertical;
}

/**
 * Assert element B sits below element A (no vertical overlap).
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} above
 * @param {import('@playwright/test').Locator} below
 * @param {number} [gap=0]
 */
async function assertStackedVertically(expect, above, below, gap = 0) {
  const topBox = await above.boundingBox();
  const bottomBox = await below.boundingBox();
  if (!topBox || !bottomBox) return;
  expect(
    bottomBox.y,
    'Lower element should start at or below the upper element'
  ).toBeGreaterThanOrEqual(topBox.y + topBox.height - gap);
}

module.exports = {
  ADMIN_PAGES,
  SKINS,
  VIEWPORTS,
  NAV_WIDTHS,
  measureNavbarLayout,
  UI_ROUTES,
  waitForJekyll,
  gotoBeforeScrollSpy,
  gotoOrSkip,
  dismissCookieConsent,
  setSkin,
  collectConsoleErrors,
  assertNoConsoleErrors,
  clearSkinStorage,
  boxesOverlap,
  assertStackedVertically,
};
