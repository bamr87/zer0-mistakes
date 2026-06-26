// =============================================================================
// search.spec.js — Smoke coverage for the site-wide search modal (issue #167)
// =============================================================================
// The client-side search (assets/js/search-modal.js + /search.json, feature
// ZER0-032) had no dedicated Playwright spec. These smoke tests verify the
// core behaviors against the real dev-served site (no external index):
//   - the "/" shortcut opens the modal and focuses the input; Escape closes it
//   - typing a query populates results from the /search.json index
//   - opening search closes the Settings offcanvas (no stacked backdrops)
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('./fixtures');

const MODAL = '#siteSearchModal';
const SETTINGS = '#info-section';

test.describe('Site search modal', () => {
  test.beforeEach(async ({ page }) => {
    await waitForJekyll(page, '/');
    // The modal markup is part of the navbar chrome on every page.
    await expect(page.locator(MODAL)).toBeAttached();
  });

  test('opens on "/" shortcut, focuses the input, and closes on Escape', async ({ page }) => {
    const modal = page.locator(MODAL);
    await expect(modal).toBeHidden();

    // Focus is on <body> after load, so the "/" handler is not suppressed.
    await page.keyboard.press('/');

    await expect(modal).toBeVisible();
    await expect(modal.locator('[data-search-input]')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('typing a query populates results from the search index', async ({ page }) => {
    await page.keyboard.press('/');
    const modal = page.locator(MODAL);
    await expect(modal).toBeVisible();

    // "jekyll" is pervasive across the theme's own content index.
    await modal.locator('[data-search-input]').fill('jekyll');

    const results = modal.locator('[data-search-results]');
    await expect(results.locator('.list-group-item').first()).toBeVisible();
    await expect(results.locator('.list-group-item').first()).toContainText(/jekyll/i);
  });

  test('opening search closes the Settings offcanvas (no stacked backdrops)', async ({ page }) => {
    // Open the Settings (#info-section) offcanvas via the Bootstrap API and
    // wait for the show transition to complete — closing it mid-transition
    // (the next step) would otherwise orphan its backdrop.
    await page.evaluate((sel) => new Promise((resolve) => {
      const el = document.querySelector(sel);
      el.addEventListener('shown.bs.offcanvas', () => resolve(), { once: true });
      window.bootstrap.Offcanvas.getOrCreateInstance(el).show();
    }), SETTINGS);
    await expect(page.locator(SETTINGS)).toBeVisible();

    // Requesting search must close the offcanvas first, then show the modal.
    await page.keyboard.press('/');

    const modal = page.locator(MODAL);
    await expect(modal).toBeVisible();
    await expect(page.locator(SETTINGS)).toBeHidden();

    // Exactly one backdrop layer — search and Settings never stack.
    await expect(page.locator('.offcanvas-backdrop')).toHaveCount(0);
    expect(await page.locator('.modal-backdrop').count()).toBeLessThanOrEqual(1);
  });
});
