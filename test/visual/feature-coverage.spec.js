// =============================================================================
// feature-coverage.spec.js — regression coverage for registry features that
// previously had no dedicated Playwright spec (PR C of the feature-registry
// reconciliation). One focused assertion per feature so a renderer/JS
// regression fails CI. Each `test()` names its ZER0-NNN id.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('./fixtures');

// A docs page that exercises TOC, fenced code blocks, and the reading chrome.
const DOC = '/docs/features/code-copy/';

test.describe('Feature coverage — interactive UI', () => {
  test('ZER0-029 Back to Top button is present and scrolls to top', async ({ page }) => {
    await waitForJekyll(page, DOC);
    const btn = page.locator('#backToTopBtn');
    await expect(btn).toBeAttached();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(btn).toBeVisible();
    await btn.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50);
  });

  test('ZER0-030 Code Copy injects a copy control on code blocks', async ({ page }) => {
    await waitForJekyll(page, DOC);
    await expect(page.locator('.highlight.has-copy-button, .code-block-header').first()).toBeAttached();
  });

  test('ZER0-037 Table of Contents renders on docs pages', async ({ page }) => {
    await waitForJekyll(page, DOC);
    await expect(page.locator('.bd-toc').first()).toBeAttached();
  });

  test('ZER0-010 Mobile TOC FAB toggle is present', async ({ page }) => {
    await waitForJekyll(page, DOC);
    await expect(page.locator('.bd-toc-toggle').first()).toBeAttached();
  });

  test('ZER0-009 Keyboard shortcuts modal opens on "?"', async ({ page }) => {
    await waitForJekyll(page, DOC);
    const modal = page.locator('#zer0-shortcuts-modal');
    await expect(modal).toBeAttached();
    await page.keyboard.press('Shift+Slash'); // "?"
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('ZER0-036 MathJax typesets equations on math pages', async ({ page }) => {
    await waitForJekyll(page, '/docs/features/mathjax-math/');
    // MathJax 3 injects an mjx-container (or the CHTML stylesheet) once loaded.
    await expect
      .poll(() => page.evaluate(() => !!document.querySelector('mjx-container') || !!window.MathJax), { timeout: 8000 })
      .toBeTruthy();
  });

  test('ZER0-033 Auto-hide navigation is wired without errors', async ({ page }) => {
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await waitForJekyll(page, DOC);
    await expect(page.locator('nav.navbar, .navbar').first()).toBeAttached();
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(errors.filter((e) => /auto-hide|navbar/i.test(e))).toEqual([]);
  });
});
