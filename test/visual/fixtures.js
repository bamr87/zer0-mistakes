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
  UI_ROUTES,
  waitForJekyll,
  gotoBeforeScrollSpy,
  gotoOrSkip,
  setSkin,
  collectConsoleErrors,
  assertNoConsoleErrors,
  clearSkinStorage,
  boxesOverlap,
  assertStackedVertically,
};
