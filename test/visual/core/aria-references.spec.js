/**
 * ARIA references must resolve to an element that exists.
 *
 * Regression: #373.
 *
 * `aria-controls` names an element by id. If that element is not in the
 * document the attribute is a dangling pointer: assistive tech is told the
 * control operates something, follows the reference, and finds nothing. The
 * control is also inert — clicking does nothing, because Bootstrap's
 * `data-bs-target` misses too.
 *
 * How it happened, and why a grep would not have caught it: `#bdSidebar`
 * (navigation/sidebar-left.html) and `#tocContents` (navigation/sidebar-right.html)
 * are emitted by `_layouts/default.html` alone, while their toggles live in
 * `core/header.html` and `core/footer-fabs.html` — both included from
 * `_layouts/root.html`, so they render on EVERY layout. Every emitter and every
 * id existed in the source; the defect only appears once a page picks a layout
 * that inherits `root` directly (admin, stats, 404, section, home, book-*).
 * Measured before the fix: 37 of 415 built pages.
 *
 * These routes are chosen to span both branches of that split — some inherit
 * `default`, some inherit `root`. Testing only the homepage would pass on the
 * unfixed code.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, UI_ROUTES, waitForJekyll } = require('../fixtures');

/** Routes spanning both layout families. `/404.html` and the about pages are
 *  root-inheriting, which is where the dangling references lived. */
const ROUTES = [
  { path: UI_ROUTES.home, why: 'home — inherits root' },
  { path: '/about/', why: 'about — inherits root (admin family)' },
  { path: '/docs/', why: 'docs — inherits default' },
  { path: '/404.html', why: '404 — inherits root; shipped a TOC FAB controlling nothing' },
  // The two dangling ids had DISJOINT page sets before the fix: tocContents on
  // 18 pages (404, CHANGELOG, _design-system/**) and bdSidebar on 19 (the
  // French /about/** tree, layout: admin). A route list covering only one of
  // them passes on the unfixed build for the other, so both are represented.
  { path: '/fr/about/theme/', why: 'fr about — admin layout; shipped a dead #bdSidebar toggle' },
  { path: '/CHANGELOG/', why: 'CHANGELOG — root-inheriting; shipped a dead #tocContents FAB' },
];

async function danglingRefs(page) {
  return page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('[aria-controls]')) {
      // aria-controls is a space-separated ID list per the ARIA spec.
      for (const id of (el.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean)) {
        if (!document.getElementById(id)) {
          bad.push({
            id,
            control: el.tagName.toLowerCase(),
            label: el.getAttribute('aria-label') || el.textContent.trim().slice(0, 40),
          });
        }
      }
    }
    return bad;
  });
}

test.describe('ARIA references resolve', { tag: '@critical' }, () => {
  for (const { path, why } of ROUTES) {
    test(`no dangling aria-controls on ${path} (${why})`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      const res = await page.goto(path, { waitUntil: 'load' }).catch(() => null);
      // A route the consumer site does not publish is not this test's business.
      test.skip(!res || res.status() >= 400, `${path} not published on this site`);

      const bad = await danglingRefs(page);
      expect(
        bad,
        `aria-controls pointing at ids that are not in the document — the control is ` +
        `inert and assistive tech follows the reference to nothing (issue #373)`
      ).toEqual([]);
    });
  }

  test('the sidebar toggle only renders where the offcanvas does', async ({ page }) => {
    // The positive half: on a layout that DOES render #bdSidebar, the toggle
    // must still be there. A "fix" that simply deleted the toggle everywhere
    // would satisfy the dangling-reference tests above while removing the
    // mobile sidebar entirely.
    await page.setViewportSize(VIEWPORTS.mobile);
    await waitForJekyll(page, '/docs/');

    const target = page.locator('#bdSidebar');
    if ((await target.count()) === 0) {
      test.skip(true, '/docs/ does not render the left sidebar on this site');
      return;
    }
    const toggle = page.locator('[aria-controls="bdSidebar"]');
    expect(
      await toggle.count(),
      'a page that renders #bdSidebar must still ship a control for it'
    ).toBeGreaterThan(0);
  });
});
