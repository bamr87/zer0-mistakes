// =============================================================================
// preview-path-join.spec.js — preview images resolve, related cards are sized
// =============================================================================
// Regression guard for a scan of it-journey.dev: `preview: images/x.webp`
// (no leading slash) was glued onto assets_prefix as `/assetsimages/x.webp`
// by components/preview-image.html, background-image.html, content/intro.html
// and content/seo.html — a 404 for the card, the hero background and
// og:image. The Liquid contract is pinned in test/test_core.sh ("Preview Path
// Join"); this spec checks the rendered pages.
//
// The article layout's related-post cards also now pass width/height
// (1536x1024, the generator's size), so their lazy images reserve a box
// instead of collapsing to 0px until they load (Lighthouse unsized-images).
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll, dismissCookieConsent } = require('../fixtures');

// A post with related-post cards in the dev build.
const POST = '/posts/2026/04/07/ai-adoption-imperative-mid-market-manufacturers/';

test.describe('Preview image paths', () => {
  test.beforeEach(async ({ page }) => {
    await dismissCookieConsent(page);
  });

  for (const path of ['/', POST, '/news/']) {
    test(`no glued "/assetsimages" URL on ${path}`, async ({ page }) => {
      await waitForJekyll(page, path);
      const html = await page.content();
      expect(html).not.toContain('/assetsimages');
      const og = await page.locator('meta[property="og:image"]').getAttribute('content').catch(() => null);
      if (og) expect(og).not.toContain('assetsimages');
    });
  }

  test('related-post card images reserve a 3:2 box before loading', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await waitForJekyll(page, POST);
    const cards = page.locator('a > img.card-img-top');
    test.skip((await cards.count()) === 0, 'no related posts in this build');
    const boxes = await cards.evaluateAll((imgs) => imgs.map((img) => ({
      w: img.getAttribute('width'),
      h: img.getAttribute('height'),
      box: img.getBoundingClientRect().height,
    })));
    for (const b of boxes) {
      expect(b.w).toBe('1536');
      expect(b.h).toBe('1024');
      expect(b.box, 'box height is reserved even before the image loads').toBeGreaterThan(0);
    }
  });
});
