// =============================================================================
// consumer-404-gates.spec.js — intro badges + favicon never link a missing path
// (issues #536, #537)
// =============================================================================
// _includes/content/intro.html used to link tag/category badges to /tags/#slug
// and _includes/core/favicon.html used to link /favicon.ico unconditionally.
// Remote-theme consumers have neither file, so both 404'd on every page. The
// fix links them only when the target exists in the build.
//
// This site HAS /tags/ and /favicon.ico, so here the gate must keep emitting
// the links — and every one must resolve. The consumer side (no /tags/, no
// favicon.ico → plain <span> badges, no icon link, png/svg fallbacks) cannot
// be served from this repo; test/test_consumer_404_gates.rb builds throwaway
// consumer sites for that and runs from test/test_core.sh.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

// A page rendered with content/intro.html that carries tags and a category.
const TAGGED_PAGE = '/about/';

test.describe('Consumer 404 gates (issues #536, #537)', () => {
  test('intro tag/category badges link only to a tags index that resolves', async ({ page }) => {
    await waitForJekyll(page, TAGGED_PAGE);

    const tagBadges = page.locator('.bd-intro .bd-intro-badge--tag:not(.bd-intro-badge--more)');
    expect(await tagBadges.count()).toBeGreaterThan(0);

    // /tags/ exists here, so the gate keeps the badges as links …
    const links = page.locator('.bd-intro a.bd-intro-badge[href*="#"]');
    expect(await links.count()).toBeGreaterThan(0);
    await expect(page.locator('.bd-intro span.bd-intro-badge--tag:not(.bd-intro-badge--more)')).toHaveCount(0);

    // … and every badge link's page actually resolves (no 404 link).
    const targets = new Set(
      (await links.evaluateAll((els) => els.map((a) => new URL(a.href).pathname)))
    );
    for (const path of targets) {
      const resp = await page.request.get(path);
      expect(resp.status(), `badge target ${path}`).toBe(200);
    }
  });

  test('every rel=icon link points at a file that exists', async ({ page }) => {
    await waitForJekyll(page, TAGGED_PAGE);

    const hrefs = await page
      .locator('head link[rel="icon"]')
      .evaluateAll((els) => els.map((l) => new URL(l.href).pathname));
    // This site ships a root favicon.ico, so the existence-gated default is emitted.
    expect(hrefs).toContain('/favicon.ico');

    for (const path of new Set(hrefs)) {
      const resp = await page.request.get(path);
      expect(resp.status(), `icon ${path}`).toBe(200);
    }
  });
});
