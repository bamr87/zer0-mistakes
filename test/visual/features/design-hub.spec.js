/**
 * ============================================================================
 * Design hub spec — /design/ page + published design-system mirror (ZER0-082)
 * ----------------------------------------------------------------------------
 * The design system is published live: _config.yml force-includes
 * _design-system/ so tokens, styles.css, and specimen cards get real URLs,
 * and pages/_about/design.md renders the hub with a live specimen gallery.
 * Guards:
 *   - /design/ renders with the specimen iframe gallery
 *   - /_design-system/styles.css and tokens/*.css are served and contain
 *     --zer0-* declarations (the include: config regressing would 404 these)
 *   - specimen iframes point at published guideline cards
 * ============================================================================
 */
const { test, expect } = require('@playwright/test');
const { UI_ROUTES, gotoOrSkip } = require('../fixtures');

test.describe('Design hub (/design/)', () => {
  test('hub page renders with live specimen gallery', async ({ page }) => {
    await gotoOrSkip(page, UI_ROUTES.designHub);
    await expect(page.locator('h1').first()).toContainText(/design system/i);
    const frames = page.locator('iframe[src*="/_design-system/guidelines/"]');
    expect(await frames.count()).toBeGreaterThanOrEqual(10);
  });

  test('published design-system mirror serves tokens', async ({ request, baseURL }) => {
    for (const path of [
      '/_design-system/styles.css',
      '/_design-system/tokens/colors.css',
      '/_design-system/tokens/radius.css',
    ]) {
      const res = await request.get(new URL(path, baseURL).toString());
      expect(res.status(), `${path} should be published`).toBe(200);
      const body = await res.text();
      expect(
        body.includes('--zer0-') || body.includes('tokens/'),
        `${path} should carry design tokens`
      ).toBe(true);
    }
  });

  test('a published guideline card resolves tokens standalone', async ({ page, baseURL }) => {
    const url = new URL('/_design-system/guidelines/spacing-radii-elevation.card.html', baseURL).toString();
    const res = await page.goto(url);
    test.skip(!res || res.status() === 404, 'mirror not published on this site');
    const radius = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--zer0-radius-xl').trim()
    );
    expect(radius).toBe('0.75rem');
  });
});
