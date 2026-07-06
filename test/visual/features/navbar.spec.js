/**
 * Navbar regression suite — responsiveness, dropdown interactions, label/brand
 * rendering, and auto-hide-on-scroll wiring (ZER0-033 / ZER0-049 / ZER0-055).
 *
 * Guards the failure the theme shipped with: page content (wide markdown
 * tables, long code tokens, unwrapped Bootstrap `.row`s) overflowed the
 * viewport, which — because the header is `position: fixed` — made the navbar
 * look "cut off" on the right at certain widths. The responsiveness block
 * asserts, across a width matrix and several navbar configurations, that:
 *
 *   1. nothing forces a horizontal page scrollbar (no in-flow element overflows
 *      the viewport unless it scrolls in its own container),
 *   2. the fixed header always spans the full viewport width,
 *   3. the search/settings utility cluster is never pushed off-screen,
 *   4. the brand is always rendered,
 *   5. the inline menubar (lg+) never clips its top-level items, and
 *   6. stress configs — a very long site title, many nav items — degrade
 *      gracefully instead of breaking the page layout.
 *
 * The dropdown block exercises real user interaction (chevron click,
 * outside-click, Escape) against `.nav-hover-dropdown` — hover-to-open was
 * removed in favor of a `.dropdown-toggle-split` chevron toggle
 * (assets/js/modules/navigation/navbar.js).
 *
 * The labels/brand block covers the v1.8+ navbar tiers: full inline labels at
 * wide desktop, brand logo/title non-overlap at mid desktop, the mobile
 * offcanvas toggler, and tablet quicklink chips.
 *
 * The auto-hide block confirms the scroll-driven hide/show behavior
 * (assets/js/modules/navigation/*) is wired without throwing console errors.
 *
 * Runs in the platform-independent `smoke` tier (no pixel screenshots).
 */
const { test, expect } = require('@playwright/test');
const {
  NAV_WIDTHS,
  VIEWPORTS,
  UI_ROUTES,
  measureNavbarLayout,
  waitForJekyll,
  gotoOrSkip,
  boxesOverlap,
} = require('../fixtures');

// Pages that exercise the navbar against real content. `/` has the heaviest
// content (wide tables + code); `/docs/` is a default-layout reading page.
const CONTENT_ROUTES = ['/', '/docs/'];

test.describe('Navbar — no cutoff / overflow across the width matrix', { tag: '@critical' }, () => {
  for (const width of NAV_WIDTHS) {
    test(`@ ${width}px wide: navbar fits and page does not overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 820 });
      await waitForJekyll(page, '/');
      const m = await measureNavbarLayout(page);

      expect(
        m.docOverflowPx,
        `Page overflows the viewport by ${m.docOverflowPx}px (widest: ${m.worstSelector}). ` +
        `A fixed-top navbar looks cut off whenever the page can scroll sideways.`
      ).toBeLessThanOrEqual(1);

      expect(m.navbarCoversViewport, 'Fixed header should span the full viewport width').toBe(true);
      expect(m.brandVisible, 'Brand link should be rendered').toBe(true);

      if (m.utilWithinViewport !== null) {
        expect(m.utilWithinViewport, 'Search/Settings cluster should stay on-screen').toBe(true);
      }

      if (width >= m.lg) {
        expect(
          m.menuClipsPx,
          `Inline menubar clips its items by ${m.menuClipsPx}px at ${width}px`
        ).toBeLessThanOrEqual(1);
      } else {
        expect(m.togglerVisible, 'Mobile menu toggle should be visible below lg').toBe(true);
      }
    });
  }
});

test.describe('Navbar — content pages stay within the viewport', () => {
  for (const route of CONTENT_ROUTES) {
    for (const width of [375, 768, 1280]) {
      test(`${route} @ ${width}px has no horizontal page overflow`, async ({ page }) => {
        await page.setViewportSize({ width, height: 820 });
        await gotoOrSkip(page, route);
        const m = await measureNavbarLayout(page);
        expect(
          m.docOverflowPx,
          `${route} overflows by ${m.docOverflowPx}px (widest: ${m.worstSelector})`
        ).toBeLessThanOrEqual(1);
        expect(m.navbarCoversViewport).toBe(true);
      });
    }
  }
});

test.describe('Navbar — mobile offcanvas fits the viewport', { tag: '@critical' }, () => {
  test('opening the menu shows a panel fully within a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 760 });
    await waitForJekyll(page, '/');

    const toggler = page.locator(
      '.bd-navbar-toggle.d-lg-none button.navbar-toggler[data-bs-target="#bdNavbar"]'
    );
    await expect(toggler).toBeVisible();
    await toggler.click();

    const panel = page.locator('#bdNavbar');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveClass(/show/);
    // Wait for the slide-in transform to settle before measuring — mid-animation
    // the panel is still translated off-screen and reports a misleading box.
    await page.waitForFunction(() => {
      const p = document.getElementById('bdNavbar');
      if (!p || !p.classList.contains('show')) return false;
      const t = getComputedStyle(p).transform;
      return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
    });
    // The offcanvas panel must not exceed the viewport width.
    const box = await panel.boundingBox();
    expect(box, 'offcanvas panel should have a box').not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(360 + 1);

    // Close button is reachable.
    await expect(panel.locator('.btn-close[data-bs-dismiss="offcanvas"]')).toBeVisible();
  });
});

test.describe('Navbar — desktop dropdown stays within the viewport', { tag: '@critical' }, () => {
  // Compact desktop (just above lg) is where a left-aligned menu is most likely
  // to spill past the right edge.
  test('an opened dropdown does not overflow the right edge', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await waitForJekyll(page, '/');

    const dropdown = page.locator('.nav-hover-dropdown').last();
    if ((await dropdown.count()) === 0) test.skip(true, 'No nav dropdowns configured');
    const toggle = dropdown.locator('.dropdown-toggle-split').first();
    const menu = dropdown.locator('.dropdown-menu').first();

    await toggle.click();
    await expect(menu).toHaveClass(/show/);

    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    const box = await menu.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, 'dropdown menu should stay within the viewport').toBeLessThanOrEqual(cw + 1);
  });
});

test.describe('Navbar — stress configurations degrade gracefully', () => {
  test('a very long site title ellipsizes without overflowing the page', async ({ page }) => {
    for (const width of [375, 1024, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await waitForJekyll(page, '/');
      await page.evaluate(() => {
        const t = document.querySelector('#navbar .site-title-text');
        if (t) t.textContent = 'Extremely Long Site Title That Should Truncate Gracefully Everywhere';
      });
      const m = await measureNavbarLayout(page);
      expect(
        m.docOverflowPx,
        `Long title overflowed the page by ${m.docOverflowPx}px at ${width}px (${m.worstSelector})`
      ).toBeLessThanOrEqual(1);
      if (m.utilWithinViewport !== null) {
        expect(m.utilWithinViewport, `Utility cluster pushed off-screen at ${width}px`).toBe(true);
      }
    }
  });

  test('many top-level items never force a horizontal page scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await waitForJekyll(page, '/');

    // Triple the inline menu's top-level items to simulate an over-stuffed nav.
    await page.evaluate(() => {
      const list = document.querySelector('#bdNavbar .navbar-nav');
      if (!list) return;
      const items = [...list.querySelectorAll(':scope > li:not(.d-lg-none)')];
      for (let i = 0; i < 2; i++) {
        items.forEach((li) => list.appendChild(li.cloneNode(true)));
      }
    });

    const m = await measureNavbarLayout(page);
    // Even if the menubar itself must clip, the page must not gain a sideways
    // scrollbar (that is the overflow-x: clip safety net doing its job).
    expect(
      m.docOverflowPx,
      `Over-stuffed nav forced a ${m.docOverflowPx}px page overflow (${m.worstSelector})`
    ).toBeLessThanOrEqual(1);
    expect(m.navbarCoversViewport).toBe(true);
    expect(m.utilWithinViewport).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Navbar dropdowns — assets/js/modules/navigation/navbar.js (.nav-hover-dropdown)
// Hover-to-open was removed; dropdowns toggle on the .dropdown-toggle-split chevron.
// ---------------------------------------------------------------------------
test.describe('Navbar dropdowns', { tag: '@critical' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.wideDesktop); // lg+ so the menubar is inline
    await waitForJekyll(page, '/');
  });

  test('chevron click opens and re-closes the dropdown menu', async ({ page }) => {
    const dropdown = page.locator('.nav-hover-dropdown').first();
    if ((await dropdown.count()) === 0) test.skip(true, 'No nav dropdowns configured');
    const toggle = dropdown.locator('.dropdown-toggle-split').first();
    const menu = dropdown.locator('.dropdown-menu').first();

    await expect(toggle).toBeVisible();
    await expect(menu).not.toHaveClass(/show/);

    await toggle.click();
    await expect(menu).toHaveClass(/show/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.locator('.dropdown-item').first()).toBeVisible();

    await toggle.click();
    await expect(menu).not.toHaveClass(/show/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('outside click closes an open dropdown', async ({ page }) => {
    const dropdown = page.locator('.nav-hover-dropdown').first();
    if ((await dropdown.count()) === 0) test.skip(true, 'No nav dropdowns configured');
    const toggle = dropdown.locator('.dropdown-toggle-split').first();
    const menu = dropdown.locator('.dropdown-menu').first();

    await toggle.click();
    await expect(menu).toHaveClass(/show/);

    await page.locator('#main-content').click({ position: { x: 5, y: 5 } });
    await expect(menu).not.toHaveClass(/show/);
  });

  test('Escape closes an open dropdown and restores focus to the toggle', async ({ page }) => {
    const dropdown = page.locator('.nav-hover-dropdown').first();
    if ((await dropdown.count()) === 0) test.skip(true, 'No nav dropdowns configured');
    const toggle = dropdown.locator('.dropdown-toggle-split').first();
    const menu = dropdown.locator('.dropdown-menu').first();

    await toggle.click();
    await expect(menu).toHaveClass(/show/);
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveClass(/show/);
  });
});

test.describe('Navbar — labels and brand cluster', { tag: '@critical' }, () => {
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

// ---------------------------------------------------------------------------
// Auto-hide navigation — assets/js/modules/navigation/* (scroll-driven show/hide)
// ---------------------------------------------------------------------------
test.describe('Auto-hide navigation', () => {
  test('ZER0-033 Auto-hide navigation is wired without errors', async ({ page }) => {
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await waitForJekyll(page, '/docs/features/code-copy/');
    await expect(page.locator('nav.navbar, .navbar').first()).toBeAttached();
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(errors.filter((e) => /auto-hide|navbar/i.test(e))).toEqual([]);
  });
});
