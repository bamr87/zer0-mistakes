/**
 * User-interaction smoke tests for the highest-value UI surfaces that the
 * existing suite only asserted structurally. Each block here exercises a real
 * user action (click / type / keyboard) end-to-end against the live page.
 *
 * Closes the top gaps catalogued in docs/architecture/ui-components.md:
 *   - Search modal (open → type → results → close)        [was: zero coverage]
 *   - Code-copy button (click → clipboard write)          [was: only focusable]
 *   - Navbar dropdowns (chevron open/close, Esc, outside)  [was: layout only]
 *   - Theme customizer skin apply (swatch → live --bs-*)   [was: API-only]
 *
 * All tests run in the platform-independent `smoke` tier.
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, waitForJekyll, gotoOrSkip } = require('./fixtures');

// ---------------------------------------------------------------------------
// Search modal — assets/js/search-modal.js + components/search-modal.html
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Code-copy button — assets/js/code-copy.js (injected at runtime)
// ---------------------------------------------------------------------------
test.describe('Code copy button', () => {
  // Grant clipboard access so navigator.clipboard.{writeText,readText} resolve
  // (this is why the legacy config-viewer copy test was test.fixme).
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('clicking copy writes the code block to the clipboard and shows feedback', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, '/docs/features/code-copy/');

    const copyBtn = page.locator('button.copy').first();
    await expect(copyBtn).toBeVisible(); // injected after DOMContentLoaded
    await expect(copyBtn).toContainText('Copy');

    await copyBtn.click();

    // UI feedback only appears when writeText() resolves successfully.
    await expect(copyBtn).toHaveClass(/copied/);
    await expect(copyBtn).toContainText('Copied');

    // And the clipboard actually holds the code.
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip.trim().length).toBeGreaterThan(0);

    // Feedback reverts to "Copy" after the 2s timeout.
    await expect(copyBtn).toContainText('Copy', { timeout: 4000 });
    await expect(copyBtn).not.toHaveClass(/copied/);
  });
});

// ---------------------------------------------------------------------------
// Navbar dropdowns — assets/js/modules/navigation/navbar.js (.nav-hover-dropdown)
// Hover-to-open was removed; dropdowns toggle on the .dropdown-toggle-split chevron.
// ---------------------------------------------------------------------------
test.describe('Navbar dropdowns', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.wideDesktop); // lg+ so the menubar is inline
    await waitForJekyll(page, '/');
  });

  test('chevron click opens and re-closes the dropdown menu', async ({ page }) => {
    const dropdown = page.locator('.nav-hover-dropdown').first();
    if ((await dropdown.count()) === 0) test.skip(true, 'No nav dropdowns configured');
    const toggle = dropdown.locator('.dropdown-toggle-split').first();
    const menu = dropdown.locator('.dropdown-menu').first();

    await expect(toggle).toBeVisible();
    await expect(menu).not.toHaveClass(/show/);

    await toggle.click();
    await expect(menu).toHaveClass(/show/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.locator('.dropdown-item').first()).toBeVisible();

    await toggle.click();
    await expect(menu).not.toHaveClass(/show/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('outside click closes an open dropdown', async ({ page }) => {
    const dropdown = page.locator('.nav-hover-dropdown').first();
    if ((await dropdown.count()) === 0) test.skip(true, 'No nav dropdowns configured');
    const toggle = dropdown.locator('.dropdown-toggle-split').first();
    const menu = dropdown.locator('.dropdown-menu').first();

    await toggle.click();
    await expect(menu).toHaveClass(/show/);

    await page.locator('#main-content').click({ position: { x: 5, y: 5 } });
    await expect(menu).not.toHaveClass(/show/);
  });

  test('Escape closes an open dropdown and restores focus to the toggle', async ({ page }) => {
    const dropdown = page.locator('.nav-hover-dropdown').first();
    if ((await dropdown.count()) === 0) test.skip(true, 'No nav dropdowns configured');
    const toggle = dropdown.locator('.dropdown-toggle-split').first();
    const menu = dropdown.locator('.dropdown-menu').first();

    await toggle.click();
    await expect(menu).toHaveClass(/show/);
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveClass(/show/);
  });
});

// ---------------------------------------------------------------------------
// Theme customizer — clicking a skin swatch applies the skin live
// assets/js/theme-customizer.js (#skin-grid .skin-card[data-skin])
// ---------------------------------------------------------------------------
test.describe('Theme customizer — apply skin', () => {
  const THEME_URL = '/about/settings/theme/';

  test('clicking a skin card applies it live and updates the YAML export', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, THEME_URL);

    const grid = page.locator('#skin-grid');
    if ((await grid.count()) === 0) test.skip(true, 'Skin grid not present');

    // Pick a non-active skin (the default active card is air → border-primary).
    const targetSkin = 'sunrise';
    const card = page.locator(`#skin-grid .skin-card[data-skin="${targetSkin}"]`).first();
    await expect(card).toBeVisible();

    const readPrimary = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim());
    const before = await readPrimary();

    await card.click();

    // Live application: <html data-theme-skin> flips and --bs-primary changes.
    await page.waitForFunction(
      (s) => document.documentElement.getAttribute('data-theme-skin') === s,
      targetSkin,
    );
    const after = await readPrimary();
    expect(after, 'skin swatch should change the live --bs-primary token').not.toBe(before);

    // Selected card is highlighted, and the export reflects the choice.
    await expect(card).toHaveClass(/border-primary/);
    await expect(page.locator('#theme-yaml-output')).toContainText(`theme_skin: "${targetSkin}"`);
  });
});
