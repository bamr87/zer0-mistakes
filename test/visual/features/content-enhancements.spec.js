/**
 * Content & reading-experience features — small, focused UI affordances that
 * support reading long-form docs/article content.
 *
 * Combines (restructure of several small per-concern spec files):
 *   - ZER0-029 Back to Top: button is present and scrolls to top on click.
 *   - ZER0-030 Code copy: a copy control is injected on code blocks
 *     (presence), the full click → clipboard-write → "Copied" feedback →
 *     revert interaction, and the enhanced styling (header bar + line
 *     gutter, single-line block copy-button placement).
 *   - Content tables: toolbar/CSV export control renders and the header row
 *     is visually distinct from the body.
 *   - ZER0-037 Table of contents / ZER0-010 Mobile TOC FAB: TOC renders on
 *     docs pages, the mobile TOC FAB toggle is present, desktop docs chrome
 *     exposes the ToC and sidebar-visibility toggle, and mobile exposes the
 *     sidebar FAB alongside the ToC FAB.
 *   - ZER0-036 MathJax: equations typeset on math-enabled docs pages.
 */
const { test, expect } = require('@playwright/test');
const { UI_ROUTES, VIEWPORTS, waitForJekyll, gotoOrSkip } = require('../fixtures');

// A docs page that exercises TOC, fenced code blocks, and the reading chrome.
const DOC = '/docs/features/code-copy/';

test.describe('Back to Top', () => {
  test('ZER0-029 Back to Top button is present and scrolls to top', async ({ page }) => {
    await waitForJekyll(page, DOC);
    const btn = page.locator('#backToTopBtn');
    await expect(btn).toBeAttached();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(btn).toBeVisible();
    await btn.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50);
  });
});

test.describe('Code copy button', () => {
  test('ZER0-030 Code Copy injects a copy control on code blocks', async ({ page }) => {
    await waitForJekyll(page, DOC);
    await expect(page.locator('.highlight.has-copy-button, .code-block-header').first()).toBeAttached();
  });

  // Grant clipboard access so navigator.clipboard.{writeText,readText} resolve
  // (this is why the legacy config-viewer copy test was test.fixme).
  test.describe('clipboard interaction', () => {
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

  test('rouge blocks get header bar and line gutter after JS', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.codeCopy);

    const block = page.locator('.bd-content .highlighter-rouge:has(pre.highlight)').first();
    if ((await block.count()) === 0) {
      test.skip(true, 'No rouge code blocks on page');
      return;
    }

    await page.waitForFunction(() =>
      document.querySelector('.bd-content .code-block-header')
    );
    await expect(block.locator('.code-block-header')).toBeVisible();
    await expect(block.locator('.code-line-numbers')).toBeAttached();

    const copyBtn = block.locator('.code-block-header .copy, .code-block-header button');
    await expect(copyBtn.first()).toBeVisible();
  });

  test('single-line rouge blocks place copy button in header bar', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.quickstartArticle);

    await page.waitForFunction(() =>
      document.querySelector('.bd-content .code-block-body--single-line')
    );
    const block = page.locator('.bd-content .highlighter-rouge:has(.code-block-body--single-line)').first();
    if ((await block.count()) === 0) {
      test.skip(true, 'No single-line rouge blocks on page');
      return;
    }

    const header = block.locator('.code-block-header');
    const copy = header.locator('.copy, button.copy');
    await expect(header).toBeVisible();
    await expect(copy.first()).toBeVisible();
  });
});

test.describe('Content tables', () => {
  test('landing comparison table has toolbar and distinct header', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.home);

    const table = page.locator('.landing-content-body table').first();
    if ((await table.count()) === 0) {
      test.skip(true, 'No markdown table on homepage');
      return;
    }

    await page.waitForFunction(() => document.querySelector('.table-copy-csv'));
    await expect(page.locator('.content-table-wrapper .table-copy-csv').first()).toBeVisible();

    const theadBg = await table.locator('thead th').first().evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    const bodyBg = await table.locator('tbody td').first().evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    expect(theadBg).not.toBe(bodyBg);
  });
});

test.describe('Table of contents', () => {
  test('ZER0-037 Table of Contents renders on docs pages', async ({ page }) => {
    await waitForJekyll(page, DOC);
    await expect(page.locator('.bd-toc').first()).toBeAttached();
  });

  test('ZER0-010 Mobile TOC FAB toggle is present', async ({ page }) => {
    await waitForJekyll(page, DOC);
    await expect(page.locator('.bd-toc-toggle').first()).toBeAttached();
  });

  test('docs article exposes ToC on desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.quickstartArticle);

    await expect(page.locator('.bd-toc, #tocContents').first()).toBeAttached();
    const sidebarToggle = page.locator('.bd-sidebar-visibility-toggle').first();
    if ((await sidebarToggle.count()) === 0) {
      test.skip(true, 'No sidebar on this page');
      return;
    }
    // Mobile-only control — present in DOM but hidden at lg+.
    await expect(sidebarToggle).toBeAttached();

    const tocToggle = page.locator('.bd-toc-visibility-toggle').first();
    if (await tocToggle.count()) {
      await expect(tocToggle).toBeAttached();
    }
  });

  test('mobile exposes sidebar FAB and ToC FAB', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await gotoOrSkip(page, UI_ROUTES.quickstartArticle);

    const sidebarFab = page.locator('#sidebarFab, .bd-sidebar-fab').first();
    if ((await sidebarFab.count()) === 0) {
      test.skip(true, 'Sidebar FAB not rendered on this layout');
      return;
    }
    await expect(sidebarFab).toBeVisible();

    const fab = page.locator('#tocFab');
    if ((await fab.count()) === 0) {
      test.skip(true, 'ToC FAB not rendered on this layout');
      return;
    }
    await expect(fab).toBeAttached();
  });
});

test.describe('MathJax', () => {
  test('ZER0-036 MathJax typesets equations on math pages', async ({ page }) => {
    await waitForJekyll(page, '/docs/features/mathjax-math/');
    // MathJax 3 injects an mjx-container (or the CHTML stylesheet) once loaded.
    await expect
      .poll(() => page.evaluate(() => !!document.querySelector('mjx-container') || !!window.MathJax), { timeout: 8000 })
      .toBeTruthy();
  });
});
