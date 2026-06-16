/**
 * Accessibility audits using axe-core.
 * Runs WCAG 2.1 AA checks across admin pages, homepage, and key components.
 * Catches specific PR #57 review issues: keyboard support, valid HTML, labels.
 */
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const {
  ADMIN_PAGES,
  VIEWPORTS,
  UI_ROUTES,
  waitForJekyll,
  gotoOrSkip,
} = require('./fixtures');

test.describe('Accessibility — axe-core WCAG audits', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  // T-007 (2026-06-13): the four WCAG 2.1 AA violations below were resolved
  // and verified with a live axe-core run (0 violations on homepage, FAQ, and
  // admin pages). Fixes: dropped the redundant ARIA menubar/menuitem roles
  // (navbar.html), aria-label on the site-subtitle home link (branding.html),
  // listitem-preserving footer/admin separator (admin-nav.html), focusable
  // single-scroll code blocks (code-copy.js + code-copy.scss), and underlined
  // prose links (_docs-layout.scss).
  test('homepage passes WCAG 2.1 AA', async ({ page }) => {
    await waitForJekyll(page, '/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(
      results.violations,
      `Accessibility violations on homepage:\n${formatViolations(results.violations)}`
    ).toEqual([]);
  });

  for (const adminPage of ADMIN_PAGES) {
    test(`${adminPage.title} passes WCAG 2.1 AA`, async ({ page }) => {
      await waitForJekyll(page, adminPage.url);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(
        results.violations,
        `Accessibility violations on ${adminPage.title}:\n${formatViolations(results.violations)}`
      ).toEqual([]);
    });
  }

  test('FAQ page passes WCAG 2.1 AA', async ({ page }) => {
    await waitForJekyll(page, '/faq/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(
      results.violations,
      `Accessibility violations on FAQ:\n${formatViolations(results.violations)}`
    ).toEqual([]);
  });
});

test.describe('Accessibility — specific component checks', () => {
  test('admin sidebar nav uses <nav> with aria-label', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/about/config/');
    const nav = page.locator('nav.admin-sidebar[aria-label]');
    await expect(nav).toBeVisible();
    const label = await nav.getAttribute('aria-label');
    expect(label.length).toBeGreaterThan(0);
  });

  test('color inputs have associated labels (regression)', async ({ page }) => {
    await waitForJekyll(page, '/about/settings/theme/');
    const colorInputs = page.locator('input[type="color"]');
    const count = await colorInputs.count();
    for (let i = 0; i < count; i++) {
      const input = colorInputs.nth(i);
      const id = await input.getAttribute('id');
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        expect(
          await label.count(),
          `Color input #${id} should have an associated <label>`
        ).toBeGreaterThanOrEqual(1);
      } else {
        // Input without id — should be wrapped in a label
        const parentLabel = input.locator('xpath=ancestor::label');
        expect(
          await parentLabel.count(),
          `Color input at index ${i} has no id and no wrapping <label>`
        ).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('tabs use proper ARIA roles', async ({ page }) => {
    await waitForJekyll(page, '/about/config/');
    const tabList = page.locator('[role="tablist"]');
    if (await tabList.count() === 0) {
      test.skip();
      return;
    }
    const tabs = tabList.first().locator('[role="tab"]');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      // Each tab should have aria-controls pointing to a panel
      const controls = await tab.getAttribute('aria-controls');
      expect(controls, `Tab ${i} missing aria-controls`).toBeTruthy();
      // The controlled panel should exist
      const panel = page.locator(`#${controls}`);
      expect(await panel.count(), `Panel #${controls} not found`).toBe(1);
    }
  });

  test('admin nav <hr> is wrapped in <li> (regression: invalid HTML)', async ({ page }) => {
    await waitForJekyll(page, '/about/config/');
    // Check that <hr> inside <ul> is properly wrapped
    const invalidHr = await page.evaluate(() => {
      const uls = document.querySelectorAll('nav.admin-sidebar ul');
      for (const ul of uls) {
        for (const child of ul.children) {
          if (child.tagName === 'HR') return true;
        }
      }
      return false;
    });
    expect(
      invalidHr,
      '<hr> must not be a direct child of <ul> — wrap in <li role="separator">'
    ).toBe(false);
  });
});

test.describe('Accessibility — UI refresh smoke', () => {
  test('skip link is focusable and targets main content', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, UI_ROUTES.home);

    const skip = page.locator('a[href="#main-content"].visually-hidden-focusable');
    await expect(skip).toBeAttached();
    await skip.focus();
    await expect(skip).toBeFocused();
    await expect(page.locator('#main-content, main').first()).toBeAttached();
  });

  test('intro metadata row has aria-label when present', async ({ page }) => {
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

  test('code copy buttons are keyboard focusable', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.codeCopy);

    await page.waitForFunction(() =>
      document.querySelector('.bd-content .code-block-header .copy, .bd-content .copy')
    );
    const copyBtn = page.locator('.bd-content .code-block-header .copy, .bd-content .copy').first();
    if ((await copyBtn.count()) === 0) {
      test.skip(true, 'No copy buttons on page');
      return;
    }
    await copyBtn.focus();
    await expect(copyBtn).toBeFocused();
  });

  test('table CSV export button has accessible name', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.home);

    // table-copy.js injects the button on DOMContentLoaded for any markdown
    // table in the content area. Homepages without a table (e.g. a hero/landing
    // page) never get one — wait briefly, then skip rather than block until the
    // test times out.
    const btn = page.locator('.table-copy-csv').first();
    await btn.waitFor({ state: 'attached', timeout: 3000 }).catch(() => {});
    if ((await btn.count()) === 0) {
      test.skip(true, 'No table copy button on this page');
      return;
    }
    const ariaLabel = await btn.getAttribute('aria-label');
    const title = await btn.getAttribute('title');
    const text = ((await btn.textContent()) || '').trim();
    expect((ariaLabel || title || text).length).toBeGreaterThan(0);
  });

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`axe advisory scan at ${name} viewport`, async ({ page }) => {
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
