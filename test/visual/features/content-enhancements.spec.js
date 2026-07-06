/**
 * Content-area enhancements: rouge code blocks, markdown tables, docs ToC/FAB
 * chrome, and the code-copy click interaction.
 *
 * Moved out of the dissolved ui-refresh.spec.js ("Code blocks — enhanced
 * styling", "Content tables — styling and CSV export", "Docs chrome —
 * sidebar, ToC, toggles") and interactions.spec.js ("Code copy button").
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, UI_ROUTES, gotoOrSkip } = require('../fixtures');

test.describe('Code blocks — enhanced styling', () => {
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

test.describe('Content tables — styling and CSV export', () => {
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

test.describe('Docs chrome — sidebar, ToC, toggles', () => {
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
