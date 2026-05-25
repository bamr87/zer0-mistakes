/**
 * UI refresh regression suite — styling, layout, visibility, and a11y smoke.
 *
 * Covers the v1.8+ UI work: navbar tiers, intro hero, code blocks, content
 * tables, footer links, section layouts, toggles, and theme preview.
 *
 * Run: npm run test:smoke  (included in the smoke project via grepInvert)
 */
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const {
  VIEWPORTS,
  UI_ROUTES,
  waitForJekyll,
  gotoOrSkip,
  boxesOverlap,
  assertStackedVertically,
} = require('./fixtures');

/** Format axe violations for readable error output. */
function formatViolations(violations) {
  if (!violations.length) return 'None';
  return violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `  - ${n.html.substring(0, 100)}`).join('\n');
      return `[${v.impact}] ${v.id}: ${v.description}\n${nodes}`;
    })
    .join('\n\n');
}

test.describe('Navbar — labels and brand cluster', () => {
  test('wide desktop shows full nav labels without ellipsis', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.wideDesktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const labels = page.locator('#bdNavbar .nav-link-text');
    const count = await labels.count();
    if (count === 0) {
      test.skip(true, 'Inline menubar hidden at this width');
      return;
    }

    for (let i = 0; i < count; i++) {
      const text = ((await labels.nth(i).textContent()) || '').trim();
      if (!text) continue;
      expect(text, `Nav label "${text}" should not be ellipsized`).not.toMatch(/\.\.\.$/);
    }

    const quickStart = labels.filter({ hasText: 'Quick Start' }).first();
    if (await quickStart.count()) {
      await expect(quickStart).toBeVisible();
      await expect(quickStart).toHaveText(/Quick Start/);
    }
  });

  test('mid desktop brand logo and title do not overlap', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.midDesktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const logo = page.locator('header#navbar .navbar-brand-group img').first();
    const title = page.locator('header#navbar .site-title-text').first();
    if ((await logo.count()) === 0 || (await title.count()) === 0) {
      test.skip(true, 'Brand cluster not rendered');
      return;
    }

    const logoBox = await logo.boundingBox();
    const titleBox = await title.boundingBox();
    expect(logoBox && titleBox, 'Brand elements must have layout boxes').toBeTruthy();
    expect(
      titleBox.x,
      'Site title should sit to the right of the logo'
    ).toBeGreaterThanOrEqual(logoBox.x + logoBox.width - 4);
    expect(boxesOverlap(logoBox, titleBox, 4)).toBe(false);
  });

  test('mobile shows site title and offcanvas toggler', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await waitForJekyll(page, UI_ROUTES.home);

    await expect(page.locator('header#navbar .site-title-text').first()).toBeVisible();
    const toggler = page.locator(
      '.bd-navbar-toggle.d-lg-none button.navbar-toggler[data-bs-target="#bdNavbar"]'
    );
    await expect(toggler).toBeVisible();
  });

  test('tablet shows mobile quicklink chips between md and lg', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await waitForJekyll(page, UI_ROUTES.home);

    const quicklinks = page.locator('.navbar-mobile-quicklinks');
    if ((await quicklinks.count()) === 0) {
      test.skip(true, 'Quicklinks not configured');
      return;
    }
    await expect(quicklinks).toBeVisible();
    await expect(quicklinks.locator('a.navbar-mobile-quicklinks__chip').first()).toBeVisible();
  });
});

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
});

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

test.describe('Footer — powered-by and layout', () => {
  test('powered-by credits are real links', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const links = page.locator('.footer-powered-by-links a[href]');
    expect(await links.count()).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(await links.count(), 5); i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
    }
  });

  test('footer nav columns use equal width at tablet', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await waitForJekyll(page, UI_ROUTES.home);

    const cols = page.locator('.footer-nav-columns > [class*="col-"]');
    if ((await cols.count()) < 2) {
      test.skip(true, 'Footer columns not rendered');
      return;
    }
    const firstBox = await cols.first().boundingBox();
    const secondBox = await cols.nth(1).boundingBox();
    if (!firstBox || !secondBox) return;
    const widthDelta = Math.abs(firstBox.width - secondBox.width);
    expect(widthDelta).toBeLessThanOrEqual(24);
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

test.describe('Features page — linked category badges', () => {
  test('feature category badges link to in-page anchors', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.features);

    const badge = page.locator('.feature-categories a.badge[href^="#"]').first();
    if ((await badge.count()) === 0) {
      test.skip(true, 'Feature categories not on this page');
      return;
    }
    const href = await badge.getAttribute('href');
    expect(href).toMatch(/^#/);
    const targetId = href.slice(1);
    const target = page.locator(`[id="${targetId}"]`);
    expect(await target.count()).toBeGreaterThan(0);
  });
});

test.describe('Theme preview page', () => {
  test('theme preview gallery and controls render', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.themePreview);

    await expect(page.locator('.theme-preview-gallery, .theme-controls-bar').first()).toBeVisible();
    await expect(page.locator('[data-theme-skin], .theme-skin-card').first()).toBeAttached();
  });
});

test.describe('Accessibility — visibility and focus smoke', () => {
  test('skip link is focusable', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const skip = page.locator('a[href="#main-content"].visually-hidden-focusable');
    await expect(skip).toBeAttached();
    await skip.focus();
    await expect(skip).toBeFocused();
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

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`axe advisory scan on homepage at ${name} viewport`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await waitForJekyll(page, UI_ROUTES.home);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast'])
        .analyze();

      expect(
        results.violations.length,
        `High axe violation count at ${name}:\n${formatViolations(results.violations)}`
      ).toBeLessThan(20);
    });
  }
});

test.describe('Responsive visibility — key landmarks', () => {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`main landmarks visible at ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await waitForJekyll(page, UI_ROUTES.home);

      await expect(page.locator('header#navbar')).toBeVisible();
      await expect(page.locator('#main-content, main').first()).toBeVisible();
      await expect(page.locator('footer.bd-footer')).toBeVisible();
    });
  }
});
