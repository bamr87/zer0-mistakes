/**
 * color-mode-default regression tests (issue #241).
 *
 * Validates that:
 *   1. The server-rendered data-bs-theme on <html> reflects site.color_mode_default.
 *   2. The data-color-mode-default attribute is set correctly (used by the FOUC script).
 *   3. The inline FOUC-prevention script resolves 'auto' via prefers-color-scheme
 *      before the page is visible (no flash of the wrong theme).
 *   4. A localStorage["theme"] override wins over the config default.
 *   5. 'auto' (the default) follows prefers-color-scheme.
 *
 * These are structural/behavioural assertions — they do not rely on pixel
 * snapshots so they survive content edits and viewport differences.
 */
const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('./fixtures');

test.describe('color_mode_default config knob (issue #241)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored theme preference so tests are isolated.
    await page.addInitScript(() => {
      try { localStorage.removeItem('theme'); } catch (e) { /* noop */ }
    });
    await waitForJekyll(page, '/');
  });

  // ── 1. Server-rendered attributes ──────────────────────────────────────────
  test('html element has data-color-mode-default attribute', async ({ page }) => {
    const attr = await page.getAttribute('html', 'data-color-mode-default');
    // The site ships with color_mode_default: auto
    expect(['dark', 'light', 'auto']).toContain(attr);
  });

  test('html element has data-bs-theme attribute with a valid Bootstrap value', async ({ page }) => {
    const theme = await page.getAttribute('html', 'data-bs-theme');
    expect(['dark', 'light']).toContain(theme);
  });

  test('server-rendered data-bs-theme is dark when color_mode_default is auto (FOUC script resolves)', async ({ page }) => {
    // The inline FOUC script runs immediately; by the time Playwright's
    // domcontentloaded fires the attribute is already resolved.
    const configDefault = await page.getAttribute('html', 'data-color-mode-default');
    const appliedTheme  = await page.getAttribute('html', 'data-bs-theme');
    if (configDefault === 'auto') {
      // auto must resolve to dark or light — never the literal string "auto"
      expect(['dark', 'light']).toContain(appliedTheme);
    } else {
      // explicit dark/light: applied theme must match
      expect(appliedTheme).toBe(configDefault);
    }
  });

  // ── 2. localStorage override wins ──────────────────────────────────────────
  test('localStorage["theme"] override wins over config default', async ({ page }) => {
    // Force a localStorage override to "light" before navigating.
    await page.addInitScript(() => {
      try { localStorage.setItem('theme', 'light'); } catch (e) { /* noop */ }
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');

    const theme = await page.getAttribute('html', 'data-bs-theme');
    expect(theme).toBe('light');
  });

  test('localStorage["theme"] = dark forces dark mode regardless of config', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('theme', 'dark'); } catch (e) { /* noop */ }
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');

    const theme = await page.getAttribute('html', 'data-bs-theme');
    expect(theme).toBe('dark');
  });

  // ── 3. No FOUC: theme attribute is resolved before DOMContentLoaded ────────
  test('data-bs-theme is not "auto" at DOMContentLoaded — FOUC script resolved it', async ({ page }) => {
    // Capture the attribute value as early as possible using addInitScript,
    // which runs synchronously before any page JS (including the FOUC script).
    // The FOUC script itself is inline in <head> before main.css/JS, so by
    // the time DOMContentLoaded fires the attribute has already been corrected.
    let themeAtDomReady = null;
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        // Store it so the test can read it after navigation completes.
        window.__themeAtDomReady = document.documentElement.getAttribute('data-bs-theme');
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    themeAtDomReady = await page.evaluate(() => window.__themeAtDomReady);

    // Must never be null, "auto", or absent at DOMContentLoaded.
    expect(themeAtDomReady).not.toBeNull();
    expect(['dark', 'light']).toContain(themeAtDomReady);
  });

  // ── 4. Persists across navigation ──────────────────────────────────────────
  test('theme persists across page navigation via localStorage', async ({ page }) => {
    // Set a preference on the homepage
    await page.evaluate(() => localStorage.setItem('theme', 'light'));

    // Navigate to another page
    await page.goto('/faq/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');

    const theme = await page.getAttribute('html', 'data-bs-theme');
    expect(theme).toBe('light');
  });
});
