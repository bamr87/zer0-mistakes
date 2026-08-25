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

/**
 * Third-party badge images (shields.io, badge.fury.io, GitHub workflow
 * badge.svg) are fetched live at render time. Their load TIMING reflows the
 * badge row (fixed by settleImages), but their AVAILABILITY does too — CI
 * runners get rate-limited and a failed fetch renders a missing badge that
 * no amount of waiting converges (the aqua/plum failures on PR #316).
 * Abort them so every run renders the identical no-badge state; the
 * committed baselines are generated with this same block in place.
 */
const BADGE_URL_RE = /(img\.shields\.io|badge\.fury\.io|github\.com\/.+\/badge\.svg)/;

/**
 * Settle the cookie-consent banner before shooting.
 *
 * The banner is the second run-to-run flake source after the badge row.
 * components/cookie-consent.html un-hides it immediately but CSS parks it at
 * `translateY(100%); opacity: 0`, and only a 1000 ms `setTimeout` adds
 * `.cookie-banner-visible` to slide it in. Every test gets a fresh context, so
 * a first-time visitor ALWAYS sees it — but a fast render shoots the page
 * before it arrives, and the baselines contain it (a ~15k-pixel false diff on
 * whichever skin happened to win the race).
 *
 * Wait for the class, then for the slide to actually finish — bottom edge
 * flush with the viewport — so the shot is taken at rest either way, with or
 * without prefers-reduced-motion.
 */
async function settleConsentBanner(page) {
  const banner = page.locator('#cookieConsent.cookie-banner-visible');
  await banner.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForFunction(
    () => {
      const el = document.getElementById('cookieConsent');
      if (!el) return false;
      return Math.abs(el.getBoundingClientRect().bottom - window.innerHeight) < 1;
    },
    undefined,
    { timeout: 15000 },
  );
}

test.describe('Theme skins', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(BADGE_URL_RE, (route) => route.abort());
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/');
    await clearSkinStorage(page);
    await settleImages(page);
    await settleConsentBanner(page);
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
          // Build-varying content inside the snapshot region. The theme-info
          // "Last Build" stamp renders at minute resolution, so a run that
          // straddles a minute boundary would diff against its own baseline.
          // It measures 0x0 today (collapsed offcanvas), so this masks nothing
          // yet and cannot itself change a baseline — it is here so the tier
          // does not start flaking the day that panel is shown by default.
          // A locator matching no elements is a no-op for `mask` (#417).
          mask: [page.locator('[data-testid="theme-build-stamp"]')],
        });
      });
    });
  }
});
