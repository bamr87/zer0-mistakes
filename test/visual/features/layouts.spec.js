/**
 * Intro hero and section-archive layout regressions.
 *
 * Moved out of the dissolved ui-refresh.spec.js: the "Intro hero — layout and
 * metadata" and "Section archive — sidebar and grid" describe blocks, plus
 * the intro-metadata aria-label check that lived in that file's catch-all
 * "Accessibility — visibility and focus smoke" describe.
 *
 * Distinct from the existing flat test/visual/layouts.spec.js (breadcrumbs,
 * single-h1 checks, pagination, shortcuts modal, etc.) — not touched here.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, UI_ROUTES, gotoOrSkip, assertStackedVertically } = require('../fixtures');

test.describe('Intro hero — layout and metadata', () => {
  test('meta footer wraps actions and stacks below description', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.quickstart);

    const intro = page.locator('.bd-intro');
    if ((await intro.count()) === 0) {
      test.skip(true, 'No intro on this page');
      return;
    }

    const footer = intro.locator('.bd-intro-meta-footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator('.bd-intro-actions')).toBeVisible();
    await expect(footer.locator('.bd-intro-meta-row[aria-label]')).toBeVisible();

    const description = intro.locator('.bd-intro-description');
    if (await description.count()) {
      await assertStackedVertically(expect, description.first(), footer);
    }

    const actions = footer.locator('.bd-intro-actions button, .bd-intro-actions a.btn');
    expect(await actions.count()).toBeGreaterThanOrEqual(2);
  });

  test('intro action buttons share consistent height', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.quickstartArticle);

    const buttons = page.locator('.bd-intro-actions .btn:not(.dropdown-toggle)');
    const count = await buttons.count();
    if (count < 2) {
      test.skip(true, 'Intro actions not rendered');
      return;
    }

    const heights = [];
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) heights.push(box.height);
    }
    const maxDelta = Math.max(...heights) - Math.min(...heights);
    expect(maxDelta, 'Action buttons should be similar height').toBeLessThanOrEqual(14);
  });

  test('intro metadata row exposes aria-label', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.quickstart);

    const meta = page.locator('.bd-intro-meta-row[aria-label]');
    if ((await meta.count()) === 0) {
      test.skip(true, 'Intro metadata not on this page');
      return;
    }
    const label = await meta.getAttribute('aria-label');
    expect((label || '').length).toBeGreaterThan(0);
  });
});

test.describe('Section archive — sidebar and grid', () => {
  test('news section page loads with layout containment', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.newsSection);

    await expect(page.locator('.section-layout, #all-posts').first()).toBeVisible();

    const sidebar = page.locator('.section-layout-sidebar, aside.section-layout-sidebar').first();
    const posts = page.locator('#all-posts').first();
    if ((await sidebar.count()) === 0 || (await posts.count()) === 0) {
      test.skip(true, 'Section sidebar or posts grid missing');
      return;
    }

    const sidebarBox = await sidebar.boundingBox();
    const postsBox = await posts.boundingBox();
    if (!sidebarBox || !postsBox) return;
    expect(postsBox.x).toBeGreaterThanOrEqual(sidebarBox.x + sidebarBox.width - 8);
  });
});
