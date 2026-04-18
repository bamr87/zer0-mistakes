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
  { title: 'Navigation Editor', url: '/about/settings/navigation/', icon: 'bi-signpost-2' },
  { title: 'Collection Manager', url: '/about/settings/collections/', icon: 'bi-collection' },
  { title: 'Analytics Dashboard', url: '/about/settings/analytics/', icon: 'bi-graph-up' },
  { title: 'Environment & Build', pageTitle: 'Environment & Build Info', url: '/about/settings/environment/', icon: 'bi-hdd-network' },
];

/** All nine theme skins defined in _config.yml / backgrounds system. */
const SKINS = ['air', 'aqua', 'contrast', 'dark', 'dirt', 'neon', 'mint', 'plum', 'sunrise'];

/** Standard viewports for responsive testing. */
const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

/**
 * Wait for a Jekyll-served page to be fully ready.
 * Waits for DOMContentLoaded and network idle.
 */
async function waitForJekyll(page, url = '/') {
  await page.goto(url, { waitUntil: 'networkidle' });
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
  await page.goto(url, { waitUntil: 'networkidle' });
}

/**
 * Switch the active skin via the zer0Bg API and wait for the event.
 * @param {import('@playwright/test').Page} page
 * @param {string} skinName - One of SKINS
 */
async function setSkin(page, skinName) {
  await page.evaluate((name) => {
    return new Promise((resolve) => {
      document.addEventListener('zer0:skin-change', () => resolve(), { once: true });
      window.zer0Bg.setSkin(name);
    });
  }, skinName);
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

module.exports = {
  ADMIN_PAGES,
  SKINS,
  VIEWPORTS,
  waitForJekyll,
  gotoBeforeScrollSpy,
  setSkin,
  collectConsoleErrors,
  assertNoConsoleErrors,
  clearSkinStorage,
};
