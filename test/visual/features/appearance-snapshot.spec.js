/**
 * Theme skin homepage visual snapshots.
 *
 * Extracted from test/visual/skins.spec.js's per-skin loop: this file
 * contains ONLY the parametrized `homepage visual snapshot` test (the one
 * `await expect(page).toHaveScreenshot(...)` assertion) for all 9 skins.
 * It exists purely so the Playwright config's `snapshots` project can
 * target it via a simple one-file glob, without pulling in the rest of
 * skins.spec.js's attribute/localStorage/navigation/event tests.
 */
const { test, expect } = require('@playwright/test');
const { SKINS, VIEWPORTS, waitForJekyll, setSkin, clearSkinStorage } = require('../fixtures');

/**
 * Settle every image the screenshot can see before shooting.
 *
 * The homepage badge row (shields.io / GitHub badges) loads at network
 * speed; whether those images have arrived by screenshot time reflows the
 * rows beneath them and was the #1 source of run-to-run snapshot flake
 * (~25k differing pixels when a load raced the shot — see PR #316).
 * Wait for every non-lazy or near-viewport image to be fetched AND
 * decoded; a failed fetch resolves too (rare, renders the same empty slot
 * on retry). Bounded so below-fold lazy images can never hang the test.
 */
async function settleImages(page) {
  await page.evaluate(
    () =>
      Promise.race([
        Promise.all(
          Array.from(document.images)
            .filter(
              (img) =>
                img.complete ||
                img.loading !== 'lazy' ||
                img.getBoundingClientRect().top < window.innerHeight + 200,
            )
            .map((img) =>
              img.complete
                ? img.decode().catch(() => {})
                : new Promise((resolve) => {
                    img.addEventListener('load', resolve, { once: true });
                    img.addEventListener('error', resolve, { once: true });
                  }).then(() => img.decode().catch(() => {})),
            ),
        ),
        new Promise((resolve) => setTimeout(resolve, 7000)),
      ]),
  );
}

test.describe('Theme skins', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/');
    await clearSkinStorage(page);
    await settleImages(page);
  });

  for (const skin of SKINS) {
    test.describe(`skin: ${skin}`, () => {
      test(`homepage visual snapshot`, async ({ page }) => {
        await setSkin(page, skin);
        // setSkin already waits for the html[data-theme-skin] attr to flip
        // and for the zer0:skin-change event. Animations are short; one
        // requestAnimationFrame is enough to let CSS variable changes paint.
        await page.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
        );
        await expect(page).toHaveScreenshot(`homepage-${skin}.png`, {
          fullPage: false,
          maxDiffPixels: 150,
        });
      });
    });
  }
});
