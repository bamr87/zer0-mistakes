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
 * Each test drives the real interaction and asserts hit-testability via
 * elementFromPoint — the exact signal the bug reports used.
 *
 * Runs in the platform-independent `smoke` tier (no pixel screenshots).
 */
const { test, expect } = require('@playwright/test');
const { gotoOrSkip } = require('../fixtures');

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
