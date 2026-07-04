// =============================================================================
// component-showcase.spec.js — showcase demo links are existence-guarded (issue #219)
// =============================================================================
// The reusable component-showcase include (_includes/components/component-showcase.html)
// is rendered on the internal /about/settings/components/ reference page. Three
// regressions this guards:
//   1. It must RENDER at all — the usage examples in its header comment are now
//      wrapped in {% raw %}; un-wrapped, Liquid executed them and the include
//      recursively included itself ("stack level too deep" build crash).
//   2. Its breadcrumb + list-group DEMO links must be existence-guarded, not
//      inert href="#". When the target page is in the build the link is real;
//      when it is absent the label renders as plain text (no href). This means
//      no 404 is injected on remote-theme consumers, and on a full build the
//      links are live and meaningful.
//   3. No hard-coded href="#" with onclick="return false;" must remain — that
//      was the previous (partial) fix; we now test the guarded behaviour.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const SHOWCASE = '/about/settings/components/';

test.describe('Component showcase (issue #219)', () => {
  test.beforeEach(async ({ page }) => {
    await waitForJekyll(page, SHOWCASE);
  });

  test('renders without recursion — demo sections are present', async ({ page }) => {
    await expect(page.locator('#showcase-breadcrumbs')).toBeAttached();
    await expect(page.locator('#showcase-list-group')).toBeAttached();
    await expect(page.locator('nav[aria-label="breadcrumb example"]')).toBeVisible();
  });

  test('breadcrumb demo links have no inert href="#" — they are real or plain text', async ({ page }) => {
    const links = page.locator('nav[aria-label="breadcrumb example"] a');
    const n = await links.count();
    // Home link always exists and must be a real link
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const href = await links.nth(i).getAttribute('href');
      // No existence-guarded link should still use the old inert href="#"
      expect(href).not.toBe('#');
      // Every rendered link must have a non-empty href
      expect(href).toBeTruthy();
    }
  });

  test('breadcrumb Home link is always real (/ always exists)', async ({ page }) => {
    const homeLink = page.locator('nav[aria-label="breadcrumb example"] a', { hasText: 'Home' });
    await expect(homeLink).toBeVisible();
    const href = await homeLink.getAttribute('href');
    // href is either "/" or the baseurl-prefixed root — never "#"
    expect(href).not.toBe('#');
    expect(href).toBeTruthy();
  });

  test('list-group demo links have no inert href="#" — real links or plain divs', async ({ page }) => {
    const group = page.locator('.list-group', { has: page.getByText('Blog Posts') });
    const links = group.locator('a.list-group-item');
    const n = await links.count();
    // In a full build some links will be present; guard: if any <a> exists it must not be inert
    for (let i = 0; i < n; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toBe('#');
      expect(href).toBeTruthy();
    }
    // The items themselves (link or div) must still all be visible
    const items = group.locator('.list-group-item');
    const total = await items.count();
    expect(total).toBeGreaterThan(0);
  });

  test('no inert onclick="return false;" remains on demo links', async ({ page }) => {
    // Regression: the old workaround used onclick="return false;" to suppress
    // navigation on href="#" links. The existence-guarded approach has no need
    // for onclick handlers on demo anchors.
    const inertLinks = page.locator(
      'nav[aria-label="breadcrumb example"] a[onclick], .list-group a[onclick]'
    );
    await expect(inertLinks).toHaveCount(0);
  });
});
