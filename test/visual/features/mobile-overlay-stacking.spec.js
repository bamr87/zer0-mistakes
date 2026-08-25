/**
 * Mobile overlay stacking regression suite.
 *
 * Guards the `.zer0-bg-body` stacking fix (see _sass/theme/_backgrounds.scss):
 * the old rule elevated every direct body child to `position: relative;
 * z-index: 1`, which made <main> a stacking context and produced three
 * consumer-reported failures on mobile:
 *
 *   1. The docs sidebar offcanvas (#bdSidebar, nested inside <main>) opened
 *      BELOW the fixed header — its close button was covered and a touch
 *      user had no way to dismiss the panel.
 *   2. The main-nav offcanvas (#bdNavbar, nested inside the fixed header)
 *      painted BEHIND Bootstrap's body-level backdrop — the open menu was
 *      dimmed and none of its links were tappable.
 *   3. The rule's specificity (0,5,0) beat FAB class rules'
 *      `position: fixed`, dropping them into flow and adding ~16px of
 *      horizontal page scroll.
 *
 * It also guards the related Settings-behind-the-menu failure: the header lift
 * that fixes (2) used to bury the Settings offcanvas (#info-section) whenever it
 * was opened from inside the nav menu, since both are offcanvas-end panels at
 * the same z-index.
 *
 * Each test drives the real interaction and asserts hit-testability via
 * elementFromPoint — the exact signal the bug reports used.
 *
 * Runs in the platform-independent `smoke` tier (no pixel screenshots).
 */
const { test, expect } = require('@playwright/test');
const { gotoOrSkip, dismissCookieConsent } = require('../fixtures');

const MOBILE = { width: 390, height: 844 };

test.use({ viewport: MOBILE });

// In-page helper: is the element (or a descendant of it) the top-most hit
// target at its own center point?
const HIT_TESTABLE = `(sel) => {
  const el = document.querySelector(sel);
  if (!el) return { found: false };
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
  return {
    found: true,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    hitTag: hit ? hit.tagName.toLowerCase() + '.' + String(hit.className).split(/\\s+/)[0] : null,
    hitInside: !!(hit && (hit === el || el.contains(hit))),
  };
}`;

test.describe('Mobile overlay stacking', { tag: '@critical' }, () => {
  test('docs sidebar offcanvas opens ABOVE the fixed header (close button tappable)', async ({ page }) => {
    await gotoOrSkip(page, '/docs/');

    const toggle = page.locator('.bd-sidebar-toggle:visible, button[aria-controls="bdSidebar"]:visible').first();
    if ((await toggle.count()) === 0) test.skip(true, 'No sidebar toggle on /docs/');
    await toggle.click();

    const offcanvas = page.locator('#bdSidebar');
    await expect(offcanvas).toBeVisible();
    // Bootstrap finishes the slide-in transition before hit-testing.
    await page.waitForTimeout(500);

    const closeBtn = await page.evaluate(eval(HIT_TESTABLE), '#bdSidebar .offcanvas-header .btn-close');
    expect(closeBtn.found, 'sidebar close button exists').toBe(true);
    expect(
      closeBtn.hitInside,
      `close button must be the top hit target at its center (got ${closeBtn.hitTag}) — ` +
        'a header element here means the offcanvas is trapped under the fixed header again'
    ).toBe(true);
  });

  test('main-nav offcanvas paints ABOVE its backdrop (links tappable)', async ({ page }) => {
    await gotoOrSkip(page, '/');

    const toggle = page
      .locator('button[data-bs-target="#bdNavbar"]:visible, button[aria-controls="bdNavbar"]:visible')
      .first();
    if ((await toggle.count()) === 0) test.skip(true, 'No main-nav toggle on /');
    await toggle.click();

    const offcanvas = page.locator('#bdNavbar');
    await expect(offcanvas).toBeVisible();
    await page.waitForTimeout(500);

    const navLink = await page.evaluate(eval(HIT_TESTABLE), '#bdNavbar .offcanvas-body .nav-link');
    expect(navLink.found, 'a nav link exists in the open menu').toBe(true);
    expect(
      navLink.hitInside,
      `first nav link must be the top hit target at its center (got ${navLink.hitTag}) — ` +
        'an offcanvas-backdrop here means the menu is painting behind the dim layer again'
    ).toBe(true);
  });

  test('Settings opened from the nav menu paints ABOVE it (panel is usable)', async ({ page }) => {
    // The nav menu and Settings are BOTH offcanvas-end at $zindex-offcanvas,
    // and _navbar.scss lifts the fixed header above the offcanvas backdrop
    // while the nav menu is open. Tapping the menu's own "Settings" item used
    // to open Settings *behind* the still-open menu — the visitor saw "Main
    // Navigation" and nothing appeared to happen. navbar.js now closes the menu
    // first and the header drops back below the offcanvas layer.
    // The cookie banner outranks the offcanvas layer by design, so dismiss it
    // the way a returning visitor would before tapping lower-screen chrome.
    await dismissCookieConsent(page);
    await gotoOrSkip(page, '/');

    const menuToggle = page
      .locator('button[data-bs-target="#bdNavbar"]:visible, button[aria-controls="bdNavbar"]:visible')
      .first();
    if ((await menuToggle.count()) === 0) test.skip(true, 'No main-nav toggle on /');
    await menuToggle.click();
    await expect(page.locator('#bdNavbar')).toBeVisible();
    await page.waitForTimeout(500);

    const settingsItem = page.locator('#bdNavbar [data-bs-target="#info-section"]').first();
    if ((await settingsItem.count()) === 0) test.skip(true, 'No Settings item in the nav menu');
    await settingsItem.click();
    // Allow the menu's slide-out AND the Settings slide-in to finish.
    await page.waitForTimeout(1200);

    await expect(page.locator('#info-section')).toHaveClass(/\bshow\b/);
    // The nav menu must be gone — two stacked end-panels is the bug.
    await expect(page.locator('#bdNavbar')).not.toHaveClass(/\bshow\b/);

    const panel = await page.evaluate(eval(HIT_TESTABLE), '#info-section .offcanvas-body');
    expect(panel.found, 'settings body exists').toBe(true);
    expect(
      panel.hitInside,
      `settings body must be the top hit target at its center (got ${panel.hitTag}) — ` +
        'a nav link or the header here means Settings is buried under the nav menu again'
    ).toBe(true);

    // And the header lift is released, so nothing paints over the panel.
    const headerZ = await page.evaluate(
      () => getComputedStyle(document.querySelector('header.fixed-top')).zIndex
    );
    expect(Number(headerZ)).toBeLessThan(1045);
  });

  test('no element forces horizontal page scroll (FABs stay position: fixed)', async ({ page }) => {
    for (const route of ['/', '/docs/']) {
      await gotoOrSkip(page, route);
      const metrics = await page.evaluate(() => {
        const fab = document.querySelector('.obsidian-local-graph-fab, .bd-toc-fab');
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          fabPosition: fab ? getComputedStyle(fab).position : null,
        };
      });
      expect(
        metrics.scrollWidth,
        `${route}: page must not scroll sideways (scrollWidth ${metrics.scrollWidth} vs viewport ${metrics.clientWidth})`
      ).toBeLessThanOrEqual(metrics.clientWidth + 1);
      if (metrics.fabPosition) {
        expect(metrics.fabPosition, `${route}: FABs must keep position: fixed`).toBe('fixed');
      }
    }
  });
});
