/**
 * Navbar label tiers, merged chevron, centred grid, retired subtitle (#405).
 *
 * The navbar's label density is driven by `@container bd-nav` queries measured
 * on the grid's middle track. #405 collapsed three tiers to two — icon+label at
 * >= 51rem, icon-only below — and deleted `text-overflow: ellipsis`, so a label
 * is now either whole or absent and never "Quicksta…".
 *
 * The load-bearing test here is `tiers still engage` @critical. The container
 * queries only resolve because the grid's middle track is a `1fr` (a DEFINITE
 * width) that `.bd-navbar-nav-viewport` can take `width: 100%` of. Respelling
 * the grid as `1fr auto 1fr` — the shape #405's summary proposed — makes that
 * track content-sized, size containment hands `bd-nav` a degenerate width, and
 * EVERY tier silently stops firing: the bar collapses to icon-only at all
 * widths and no other assertion in this file would notice, because icon-only is
 * a legal state. That test is the reason this spec exists; do not weaken it.
 *
 * Runs in the platform-independent `smoke` tier (no pixel screenshots).
 */
const { test, expect } = require('@playwright/test');
const { waitForJekyll, gotoOrSkip, dismissCookieConsent } = require('../fixtures');

/** Center-track widths, in px, that sit inside each surviving tier. */
const LABEL_TIER = { width: 1600, height: 800 };   // middle track comfortably > 51rem
const ICON_TIER = { width: 1024, height: 800 };    // middle track < 51rem
const MOBILE = { width: 390, height: 800 };

const DESKTOP_NAV = '#navbar #bdNavbar .navbar-nav';

async function openHome(page, viewport) {
  await page.setViewportSize(viewport);
  if (!(await gotoOrSkip(page, '/'))) return false;
  await waitForJekyll(page);
  await dismissCookieConsent(page);
  return true;
}

/** Top-level nav links, excluding the mobile-only Home item and the chevrons. */
function topLevelLinks(page) {
  return page.locator(
    `${DESKTOP_NAV} > li:not(.d-lg-none) > .nav-link:not(.dropdown-toggle-split)`
  );
}

test.describe('navbar label tiers (#405)', () => {
  test('labels are never truncated at 1024px or 1280px', async ({ page }) => {
    for (const width of [1024, 1280]) {
      if (!(await openHome(page, { width, height: 800 }))) test.skip();

      const labels = page.locator(`${DESKTOP_NAV} .nav-link-text`);
      const count = await labels.count();
      expect(count, `no nav items rendered at ${width}px`).toBeGreaterThan(0);

      // Either every label is whole, or the row is entirely icon-only. Both
      // satisfy #405; what must never happen is a label cut mid-word.
      const measured = await labels.evaluateAll((nodes) =>
        nodes.map((n) => ({
          text: n.textContent.trim(),
          hidden: getComputedStyle(n).display === 'none',
          scrollWidth: n.scrollWidth,
          clientWidth: n.clientWidth,
          textOverflow: getComputedStyle(n).textOverflow,
        }))
      );

      const visible = measured.filter((m) => !m.hidden);
      const allHidden = visible.length === 0;

      if (!allHidden) {
        for (const m of visible) {
          // scrollWidth > clientWidth is the definition of "this text does not
          // fit its box" — i.e. it is being clipped or ellipsized.
          expect(
            m.scrollWidth,
            `"${m.text}" is truncated at ${width}px (${m.scrollWidth} > ${m.clientWidth})`
          ).toBeLessThanOrEqual(m.clientWidth);
          expect(
            m.textOverflow,
            `"${m.text}" still carries text-overflow: ellipsis at ${width}px`
          ).not.toBe('ellipsis');
        }
      }
    }
  });

  test('tiers still engage — the container queries resolve @critical', async ({ page }) => {
    // The regression guard for the grid trap described in this file's header.
    if (!(await openHome(page, LABEL_TIER))) test.skip();
    const wide = await topLevelLinks(page).first().evaluate((el) => ({
      label: getComputedStyle(el.querySelector('.nav-link-text')).display,
      icon: el.querySelector('i') ? getComputedStyle(el.querySelector('i')).display : 'none',
    }));

    if (!(await openHome(page, ICON_TIER))) test.skip();
    const narrow = await topLevelLinks(page).first().evaluate((el) => ({
      label: getComputedStyle(el.querySelector('.nav-link-text')).display,
      icon: el.querySelector('i') ? getComputedStyle(el.querySelector('i')).display : 'none',
    }));

    expect(wide.label, 'labels should render in the wide tier').not.toBe('none');
    expect(narrow.label, 'labels should be dropped in the icon-only tier').toBe('none');
    expect(
      wide.label,
      'both tiers resolved identically — bd-nav has no usable width, so the ' +
        'container queries are not firing (check the .navbar-main grid tracks)'
    ).not.toBe(narrow.label);
  });

  test('icons survive in BOTH tiers — the bare-label middle tier is gone', async ({ page }) => {
    for (const viewport of [LABEL_TIER, ICON_TIER]) {
      if (!(await openHome(page, viewport))) test.skip();

      const withIcons = await topLevelLinks(page).evaluateAll((nodes) =>
        nodes
          .filter((n) => n.querySelector('i'))
          .map((n) => getComputedStyle(n.querySelector('i')).display)
      );

      expect(withIcons.length, `no nav icons at ${viewport.width}px`).toBeGreaterThan(0);
      for (const display of withIcons) {
        expect(display, `an icon is hidden at ${viewport.width}px`).not.toBe('none');
      }
    }
  });
});

test.describe('dropdown chevron is merged into the parent row (#405)', () => {
  test('no dead zone between the label and the chevron', async ({ page }) => {
    if (!(await openHome(page, LABEL_TIER))) test.skip();

    const dropdown = page.locator(`${DESKTOP_NAV} > li.nav-hover-dropdown`).first();
    if ((await dropdown.count()) === 0) test.skip();

    const gap = await dropdown.evaluate((li) => {
      const link = li.querySelector('.nav-link:not(.dropdown-toggle-split)');
      const chevron = li.querySelector('.dropdown-toggle-split');
      const a = link.getBoundingClientRect();
      const b = chevron.getBoundingClientRect();

      // The midpoint of the seam between the two controls.
      const x = (Math.min(a.right, b.left) + Math.max(a.right, b.left)) / 2;
      const y = a.top + a.height / 2;
      const hit = document.elementFromPoint(x, y);

      return {
        ownedByRow: !!hit && li.contains(hit),
        // With the chevron overlaying the link's padding box they must touch or
        // overlap; a positive gap is the dead zone #405 removed.
        separation: b.left - a.right,
      };
    });

    expect(gap.ownedByRow, 'the seam between label and chevron hits nothing in the row').toBe(true);
    expect(gap.separation, 'there is still a gap between the label and the chevron').toBeLessThanOrEqual(0);
  });

  test('the chevron is still a real button with its ARIA intact', async ({ page }) => {
    if (!(await openHome(page, LABEL_TIER))) test.skip();

    const chevron = page.locator(`${DESKTOP_NAV} .dropdown-toggle-split`).first();
    if ((await chevron.count()) === 0) test.skip();

    // Repositioning must not have cost the control its semantics.
    await expect(chevron).toHaveAttribute('aria-expanded', 'false');
    await expect(chevron).toHaveAttribute('aria-haspopup', 'true');
    expect(await chevron.evaluate((el) => el.tagName)).toBe('BUTTON');
    expect(await chevron.evaluate((el) => el.getAttribute('aria-label') || '')).not.toBe('');
  });
});

test.describe('navbar brand and toggles (#405)', () => {
  test('the navbar carries logo + title only — no subtitle', async ({ page }) => {
    if (!(await openHome(page, LABEL_TIER))) test.skip();

    await expect(page.locator('#navbar .navbar-brand.site-subtitle')).toHaveCount(0);
    await expect(page.locator('#navbar .navbar-brand.site-title')).toHaveCount(1);
  });

  test('the subtitle moved to the home hero', async ({ page }) => {
    if (!(await openHome(page, LABEL_TIER))) test.skip();

    // Only meaningful when the site actually configures one.
    const hero = page.locator('.home .home-subtitle');
    if ((await hero.count()) === 0) test.skip();
    await expect(hero.first()).toBeVisible();
  });

  test('exactly two toggles coexist below lg, and the menu one is labelled', async ({ page }) => {
    if (!(await openHome(page, MOBILE))) test.skip();

    const toggles = page.locator('#navbar .navbar-toggler:visible');
    expect(await toggles.count(), 'more than two toggles visible below lg').toBeLessThanOrEqual(2);

    const menu = page.locator('#navbar .navbar-toggler-labeled');
    await expect(menu).toBeVisible();
    expect((await menu.locator('.navbar-toggler-text').textContent()).trim()).not.toBe('');

    // The gear is desktop-only; on mobile its contents are reached via the drawer.
    await expect(page.locator('#navbar .nav-settings-button:visible')).toHaveCount(0);
  });
});
