/**
 * Mobile navigation containing-block regression suite.
 *
 * Guards a theme-wide footgun that silently disables mobile navigation.
 *
 * The main-nav panel (#bdNavbar) is an `.offcanvas-lg`: below the lg
 * breakpoint Bootstrap gives it `position: fixed` with `top: 0; bottom: 0` so
 * it fills the viewport. That only holds while its containing block IS the
 * viewport. Per CSS spec, an ancestor that sets any of
 *
 *     transform · filter · backdrop-filter · perspective · contain · will-change
 *
 * becomes the containing block for its `position: fixed` DESCENDANTS. #bdNavbar
 * lives inside `.navbar`, so a single decorative line on `.navbar` — the very
 * natural `backdrop-filter: blur(8px)` for a frosted sticky header — silently
 * re-anchors the panel to the ~60px navbar instead of the viewport.
 *
 * The panel then opens as a clipped sliver: the header and close button render,
 * every navigation link is cut off, and a backdrop still dims the page. The
 * menu looks broken rather than absent, and nothing errors — no console
 * message, no failing build, no layout overflow. That is exactly how it shipped
 * unnoticed in examples/swerve-of-shore (fixed by moving the filter to a
 * `.navbar::before` pseudo-element, which is not an ancestor of #bdNavbar).
 *
 * Two tests:
 *   1. The invariant — no ancestor of #bdNavbar creates a fixed-position
 *      containing block. This is the cheap check a consumer's own CI can copy.
 *   2. The consequence — with the menu open the panel actually fills the
 *      viewport and its links are reachable. This is what the user experiences,
 *      and it fails for causes beyond the property list above.
 *
 * Runs in the platform-independent `smoke` tier (no pixel screenshots).
 */
const { test, expect } = require('@playwright/test');
const { gotoOrSkip } = require('../fixtures');

const MOBILE = { width: 390, height: 844 };
test.use({ viewport: MOBILE });

// Properties that make an element the containing block for fixed descendants.
// `filter`/`backdrop-filter`/`transform`/`perspective` count only when they are
// not the initial `none`; `contain` counts for layout/paint/strict/content.
//
// NOTE: this is a real function, not a string. `page.evaluate(str)` with no
// argument evaluates the string as an EXPRESSION — a function literal then
// evaluates to a function object, which is not serializable, so the call
// resolves to `undefined` and every assertion against it silently explodes or
// no-ops. (Sibling specs pass a string safely only because they also pass an
// argument, which makes Playwright call it.)
function containingBlockProbe() {
  const el = document.getElementById('bdNavbar');
  if (!el) return { found: false, offenders: [] };
  const offenders = [];
  let p = el.parentElement;
  while (p && p !== document.documentElement) {
    const cs = getComputedStyle(p);
    const hits = [];
    for (const prop of ['transform', 'filter', 'backdropFilter', 'perspective']) {
      const v = cs[prop];
      if (v && v !== 'none') hits.push(`${prop}: ${v}`);
    }
    if (/\b(layout|paint|strict|content)\b/.test(cs.contain || '')) hits.push(`contain: ${cs.contain}`);
    const wc = cs.willChange || '';
    if (/transform|filter|perspective/.test(wc)) hits.push(`will-change: ${wc}`);
    if (hits.length) {
      offenders.push({
        sel:
          p.tagName.toLowerCase() +
          (p.id ? `#${p.id}` : '') +
          (typeof p.className === 'string' && p.className
            ? `.${p.className.trim().split(/\s+/).slice(0, 2).join('.')}`
            : ''),
        props: hits,
      });
    }
    p = p.parentElement;
  }
  return { found: true, offenders };
}

test.describe('mobile nav — containing block', () => {
  test('no ancestor of #bdNavbar creates a fixed-position containing block', async ({ page }) => {
    await gotoOrSkip(page, '/');

    const res = await page.evaluate(containingBlockProbe);
    expect(res.found, '#bdNavbar (main nav offcanvas) should exist').toBe(true);

    // A readable failure: name the ancestor and the exact property to move.
    const detail = res.offenders
      .map((o) => `${o.sel} -> ${o.props.join('; ')}`)
      .join('\n  ');
    expect(
      res.offenders,
      res.offenders.length
        ? `These ancestors of #bdNavbar create a containing block for fixed positioning, ` +
          `which collapses the mobile nav panel to the height of that ancestor:\n  ${detail}\n` +
          `Move the effect to a pseudo-element (e.g. .navbar::before) so it is not an ancestor.`
        : '',
    ).toEqual([]);
  });

  test('the open nav panel fills the viewport and its links are reachable', async ({ page }) => {
    await gotoOrSkip(page, '/');

    const toggler = page.locator('.navbar-toggler[data-bs-target="#bdNavbar"]').first();
    if (!(await toggler.count())) test.skip(true, 'no main-nav toggler at this viewport');
    await toggler.click();
    await page.waitForTimeout(600); // offcanvas slide-in

    const panel = await page.evaluate(() => {
      const el = document.getElementById('bdNavbar');
      const b = el.getBoundingClientRect();
      const links = [...el.querySelectorAll('a[href]')].filter((a) => {
        const cs = getComputedStyle(a);
        return cs.display !== 'none' && cs.visibility !== 'hidden';
      });
      return {
        height: Math.round(b.height),
        viewportHeight: window.innerHeight,
        clipped: el.scrollHeight > el.clientHeight + 2,
        onScreen: b.left < window.innerWidth - 10 && b.right > 10,
        linkCount: links.length,
        minLinkHeight: links.length
          ? Math.min(...links.map((a) => Math.round(a.getBoundingClientRect().height)))
          : 0,
      };
    });

    // The bug produced height ~60 against an 844 viewport.
    expect(panel.onScreen, 'panel should slide into view').toBe(true);
    expect(
      panel.height,
      `panel is ${panel.height}px tall in a ${panel.viewportHeight}px viewport — ` +
        `it should fill the screen, not collapse to the navbar's height`,
    ).toBeGreaterThanOrEqual(panel.viewportHeight - 2);
    expect(panel.clipped, 'panel content should not be cut off').toBe(false);
    expect(panel.linkCount, 'nav links should be present and visible').toBeGreaterThan(0);
    // WCAG 2.5.8 minimum target size; the theme's nav links render at 40px.
    expect(panel.minLinkHeight, 'every nav link should be a usable tap target').toBeGreaterThanOrEqual(24);
  });
});
