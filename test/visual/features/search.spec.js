/**
 * Search modal interactions: open, type, results, close.
 *
 * Moved out of the dissolved interactions.spec.js ("Search modal").
 *
 * Distinct from the existing flat test/visual/search.spec.js, which already
 * covers "/" open + Escape close + typing → results against the live index;
 * this file additionally covers the toggle-button open path and the
 * no-results and close-button flows. Some overlap between the two files is a
 * pre-existing condition, not introduced here — reconciling them is a larger
 * restructuring out of scope for this change.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, waitForJekyll } = require('../fixtures');

test.describe('Search modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/');
  });

  /** Derive a query guaranteed to match by pulling a word from the live index. */
  async function indexedQuery(page) {
    return page.evaluate(async () => {
      try {
        const res = await fetch('/search.json');
        const data = await res.json();
        for (const item of data) {
          const word = (item.title || '').split(/\s+/).find((w) => /^[a-z]{4,}$/i.test(w));
          if (word) return word.toLowerCase();
        }
      } catch (e) { /* fall through */ }
      return 'theme';
    });
  }

  test('opens via "/" shortcut, focuses input, and renders results', async ({ page }) => {
    const modal = page.locator('#siteSearchModal');
    await expect(modal).not.toHaveClass(/show/);

    await page.keyboard.press('/');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/show/);
    await expect(modal.locator('[data-search-input]')).toBeFocused();

    const query = await indexedQuery(page);
    await modal.locator('[data-search-input]').fill(query);

    const results = modal.locator('[data-search-results] .list-group-item');
    await expect(results.first()).toBeVisible({ timeout: 5000 });
    expect(await results.count()).toBeGreaterThan(0);
    // First result is a navigable link.
    await expect(results.first()).toHaveAttribute('href', /.+/);
  });

  test('search toggle button opens the modal', async ({ page }) => {
    const modal = page.locator('#siteSearchModal');
    await page.locator('[data-search-toggle]:visible').first().click();
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/show/);
  });

  test('shows a "no results" message for a non-matching query', async ({ page }) => {
    const modal = page.locator('#siteSearchModal');
    await page.keyboard.press('/');
    await expect(modal).toBeVisible();
    await modal.locator('[data-search-input]').fill('zzzqqqxxxnomatch123');
    await expect(modal.locator('[data-search-results]')).toContainText(/no results/i, { timeout: 5000 });
  });

  test('close button dismisses the modal', async ({ page }) => {
    const modal = page.locator('#siteSearchModal');
    await page.keyboard.press('/');
    await expect(modal).toBeVisible();
    // Wait until the open transition has finished — Bootstrap focuses the input
    // on `shown.bs.modal`, and dismiss clicks issued mid-transition are ignored.
    await expect(modal.locator('[data-search-input]')).toBeFocused();
    await modal.locator('.btn-close[data-bs-dismiss="modal"]').click();
    await expect(modal).not.toBeVisible();
  });
});
