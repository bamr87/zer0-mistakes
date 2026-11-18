/**
 * ============================================================================
 * Radius tokens spec — rounded surfaces read --zer0-radius-* (#390, T-035)
 * ----------------------------------------------------------------------------
 * The Sass partials used to spell their corner radii out (`0.375rem`, `50%`,
 * …) even where a --zer0-radius-* token named the same value, so overriding a
 * token re-rounded only the few components that happened to use it. #390 put
 * those literals on the tokens, value for value. Two things must stay true:
 *
 *   1. By default nothing renders differently: each component's computed
 *      corner is still the px value the old literal produced.
 *   2. The component follows the token: set the token on :root and the
 *      computed corner changes with it. A literal would ignore the override,
 *      which is the regression this guards.
 *
 * The cases cover the four routes the sweep touched most, plus the setup
 * wizard's cards, which read the never-declared --zer0-radius-md and so only
 * ever rendered its fallback. scripts/design-system-check.rb is the static
 * half of this guard (no on-scale literal without an `// off-scale:` note).
 * Evidence: test/visual/evidence/radius-tokens/.
 * ============================================================================
 */
const { test, expect } = require('@playwright/test');
const { UI_ROUTES, gotoOrSkip } = require('../fixtures');

// `corner` is a corner the rule rounds (a split-button rule may square one side).
const CASES = [
  { route: UI_ROUTES.home, name: 'navbar dropdown menu', selector: '.nav-hover-dropdown > .dropdown-menu',
    token: '--zer0-radius-lg', px: '8px' },
  { route: UI_ROUTES.home, name: 'navbar split-button caret', selector: '#bdNavbar .nav-hover-dropdown > .dropdown-toggle-split',
    token: '--zer0-radius', px: '6px', corner: 'borderTopRightRadius' },
  { route: UI_ROUTES.home, name: 'search modal', selector: '.search-modal .modal-content',
    token: '--zer0-radius-xl', px: '12px' },
  { route: '/docs/', name: 'content table wrapper (built by table-copy.js)', selector: '.content-table-wrapper',
    token: '--zer0-radius-lg', px: '8px' },
  { route: UI_ROUTES.features, name: 'content table wrapper (built by table-copy.js)', selector: '.content-table-wrapper',
    token: '--zer0-radius-lg', px: '8px' },
  { route: '/setup/', name: 'wizard step marker', selector: '.wizard-step-marker',
    token: '--zer0-radius-circle', px: '50%', sentinel: '37%' },
  { route: '/setup/', name: 'wizard skin card (was the undeclared --zer0-radius-md)', selector: '.skin-card',
    token: '--zer0-radius-lg', px: '8px' },
];

const cornerOf = (locator, corner) =>
  locator.evaluate((el, c) => getComputedStyle(el)[c], corner);

test.describe('Radius tokens (#390)', () => {
  for (const c of CASES) {
    test(`${c.route} ${c.name} rounds from ${c.token}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await gotoOrSkip(page, c.route);
      const el = page.locator(c.selector).first();
      await expect(el, `${c.selector} should exist on ${c.route}`).toBeAttached();
      const corner = c.corner || 'borderTopLeftRadius';

      // 1. Unchanged by default: the value the old literal rendered.
      expect(await cornerOf(el, corner), `${c.selector} default ${corner}`).toBe(c.px);

      // 2. Token-driven: a value no stylesheet uses comes back through the token.
      const sentinel = c.sentinel || '21px';
      await page.evaluate(([t, v]) => document.documentElement.style.setProperty(t, v), [c.token, sentinel]);
      expect(await cornerOf(el, corner), `${c.selector} should follow ${c.token}`).toBe(sentinel);
    });
  }

  // The duplicate max-width:768px hero rule set (2rem / 1rem) was dead code:
  // the later block always won. Removing it must not move the mobile hero.
  test('mobile hero keeps its 1.75rem title and 0.95rem lead', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoOrSkip(page, UI_ROUTES.home);
    const hero = page.locator('.bg-primary .display-4').first();
    await expect(hero).toBeAttached();
    expect(await hero.evaluate((el) => getComputedStyle(el).fontSize)).toBe('28px');
    expect(await page.locator('.bg-primary .lead').first().evaluate((el) => getComputedStyle(el).fontSize))
      .toBe('15.2px');
  });
});
