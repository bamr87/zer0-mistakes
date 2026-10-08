// =============================================================================
// intro-actions-a11y.spec.js — accessible names, target size and badge contrast
// =============================================================================
// Regression guard for three WCAG failures an axe/pa11y scan of two theme
// consumers (it-journey.dev, lifehacker.dev) reported on every page:
//
// 1. Below 576px the intro's Share button and "Edit on GitHub" link show only
//    an icon (their text is `d-none d-sm-inline`), so they had NO accessible
//    name (axe button-name / link-name). They now carry an aria-label that
//    matches the visible text. The edit URL also lost its double slash
//    (`blob/main//pages/tags.md`) for pages outside a collection.
// 2. At lg+ with labels shown, the navbar split-toggle chevron was 20x36px —
//    under the WCAG 2.2 SC 2.5.8 24x24 minimum (axe target-size).
// 3. Skins set `a:not(.btn)…{color: var(--bs-link-color)}`, which also hit
//    `<a class="badge bg-*">` tag/category chips: on neon that was #5e22cc on
//    #8338ec (1.45:1). Badge links now keep --bs-badge-color (#fff).
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll, dismissCookieConsent } = require('../fixtures');

// A page outside any collection (the double-slash case) with the intro block.
const PAGE = '/tags/';

function contrast(fg, bg) {
  const lum = (c) => {
    const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

test.describe('Intro actions, nav toggles and badge links (a11y)', () => {
  test.beforeEach(async ({ page }) => {
    await dismissCookieConsent(page);
  });

  test('Share and Edit on GitHub keep an accessible name at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForJekyll(page, PAGE);

    const share = page.locator('#shareDropdownBottom');
    await expect(share).toHaveAccessibleName(/share/i);
    // The visible label really is hidden at this width — that is the case
    // the aria-label exists for.
    await expect(share.locator('span.d-sm-inline')).toBeHidden();

    const edit = page.locator('a.bd-intro-action-link.btn-dark');
    await expect(edit).toHaveAccessibleName(/edit on github/i);
  });

  test('edit link has no double slash for a page outside a collection', async ({ page }) => {
    await waitForJekyll(page, PAGE);
    const href = await page.locator('a.bd-intro-action-link.btn-dark').getAttribute('href');
    expect(href).toMatch(/\/blob\/[^/]+\/pages\/tags\.md$/);
    expect(href).not.toContain('//pages/');
  });

  test('desktop split-toggle chevrons are at least 24x24px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await waitForJekyll(page, '/');
    const sizes = await page.locator('#bdNavbar .nav-hover-dropdown > .dropdown-toggle-split').evaluateAll((els) =>
      els.filter((el) => el.offsetParent !== null).map((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height };
      }));
    expect(sizes.length).toBeGreaterThan(0);
    for (const s of sizes) {
      expect(s.w).toBeGreaterThanOrEqual(24);
      expect(s.h).toBeGreaterThanOrEqual(24);
    }
  });

  test('badge links keep white text under the neon skin (>= 4.5:1)', async ({ page }) => {
    await waitForJekyll(page, PAGE);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme-skin', 'neon'));
    const badges = await page.locator('a.badge.bg-primary').evaluateAll((els) =>
      els.slice(0, 5).map((el) => {
        const cs = getComputedStyle(el);
        return { fg: cs.color, bg: cs.backgroundColor };
      }));
    expect(badges.length).toBeGreaterThan(0);
    for (const b of badges) {
      expect(contrast(b.fg, b.bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  // Polish from the same walkthrough: on phones the brand shares the bar with
  // the sidebar toggle (docs/post pages), logo, search and the labelled Menu
  // toggle, and lifehacker.dev's "Lifehacker.dev" was cut to "Lifehacker…"
  // at 400px (121px available for 133px of 20px text). The title steps down
  // to 1rem below 576px and the logo drops its doubled margin-end. Measured
  // with that 14-character title swapped in, on a page with the sidebar
  // toggle.
  for (const width of [375, 400]) {
    test(`a 14-character brand title fits beside the sidebar toggle at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await waitForJekyll(page, '/docs/');
      const m = await page.evaluate(() => {
        const t = document.querySelector('#navbar .site-title-text');
        const toggle = document.querySelector('#navbar .navbar-main-start .bd-navbar-toggle');
        t.textContent = 'Lifehacker.dev';
        return {
          sidebarToggle: !!toggle && toggle.getBoundingClientRect().width > 0,
          client: t.clientWidth,
          scroll: t.scrollWidth,
          fontSize: parseFloat(getComputedStyle(t).fontSize),
        };
      });
      expect(m.sidebarToggle, 'page renders the sidebar toggle').toBe(true);
      expect(m.fontSize).toBeGreaterThanOrEqual(15);
      expect(m.scroll, 'brand title is not truncated').toBeLessThanOrEqual(m.client);
    });
  }
});
