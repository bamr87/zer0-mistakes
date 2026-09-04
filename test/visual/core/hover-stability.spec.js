/**
 * Hover stability — a :hover rule must never move the hovered element's own box.
 *
 * The defect (#404 / T-036): a pointer parked on the edge a hover-lift vacates
 * loses hover, the element drops back under the pointer, hover re-enters — an
 * infinite flicker with no pointer movement at all. Navbar controls are thin
 * enough for a 1-2px lift to do it reliably.
 *
 * Two sources, and the second is why removing the first was not enough:
 *   - `_sass/core/_navbar.scss` put `translateY(-1px)` on the Search/Settings
 *     buttons (and on `.nav-link:hover`).
 *   - `_sass/components/_ui-enhancements.scss` puts `translateY(-2px)` on
 *     `.btn:hover` — every button in the theme. These controls ARE `.btn`s, so
 *     with the navbar's own lift deleted they simply flickered on the inherited
 *     one instead. The fix cancels it with `transform: none`.
 *
 * Measured on the built site before the fix: the Search button lost and regained
 * hover 20 times in 800ms with the pointer completely still.
 *
 * Direction matters. `translateY(-Npx)` moves the element UP, so the row that
 * stops being covered is the BOTTOM one; a probe on the top edge passes without
 * exercising the bug at all.
 *
 * Only a transform on the hovered element's OWN box can flicker — `&:hover i {
 * transform: scale(1.1) }` moves a child and never shrinks the parent hit box.
 * Those were removed for consistency, not as causes.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, UI_ROUTES, waitForJekyll, dismissCookieConsent } = require('../fixtures');

/**
 * `edgeProbe` marks the controls that get the behavioural bottom-edge test.
 *
 * The nav link is deliberately excluded. Its lift lived inside
 * `@media (min-width: 992px) { @container navbar-main (max-width: 75rem) }` and,
 * measured across 1040/1140/1200/1280px on the built site, never actually
 * applied — its computed hover transform is `none` at every desktop width on
 * `main` as well. So it gets the geometric/computed guard (which is a guard
 * against REINTRODUCTION, not a reproduction) but not the edge probe: every
 * visible nav link at these widths is a `.nav-hover-dropdown` parent, and the
 * menu opening under a pointer on the bottom edge drives its own
 * enter/leave oscillation — ~11 cycles in 800ms, identically on `main`. That is
 * a real defect and a separate one; asserting on it here would ship a red test
 * for a bug this change does not touch.
 */
const CONTROLS = [
  { name: 'primary nav link', selector: '#bdNavbar .nav-link', edgeProbe: false },
  { name: 'search button', selector: '.navbar-utility-controls .nav-search-button', edgeProbe: true },
  { name: 'settings button', selector: '.navbar-utility-controls .nav-settings-button', edgeProbe: true },
];

/** Round to 3dp so sub-pixel layout noise never reads as movement. */
const r3 = (n) => Math.round(n * 1000) / 1000;

/**
 * First control that is actually on screen with a real box. `.first()` is not
 * enough: `#bdNavbar` carries a collapsed duplicate that measures 0x0, and a
 * zero-size element can neither be hovered nor flicker — a test that picked one
 * would pass while proving nothing.
 */
async function visibleControl(page, selector) {
  const all = page.locator(selector);
  const n = await all.count();
  for (let i = 0; i < n; i++) {
    const el = all.nth(i);
    const box = await el.boundingBox();
    if (box && box.width > 4 && box.height > 4) return { el, box };
  }
  return null;
}

async function boxOf(el) {
  const b = await el.evaluate((node) => {
    const { x, y, width, height } = node.getBoundingClientRect();
    return { x, y, width, height };
  });
  return { x: r3(b.x), y: r3(b.y), width: r3(b.width), height: r3(b.height) };
}

/**
 * Every :hover rule that MATCHES this element and declares a transform. Only a
 * diagnostic — the verdict is the computed value, because that is what the
 * cascade applies. A theme-wide `.btn:hover { translateY(-2px) }` still matches
 * these controls and always will; it is overridden, not deleted, so failing on
 * "a matching rule exists" would be red forever.
 */
const CANDIDATE_RULES = (node) => {
  const hits = [];
  const inspect = (rule, href) => {
    const sel = rule.selectorText;
    if (!sel || !sel.includes(':hover')) return;
    const t = rule.style && rule.style.getPropertyValue('transform');
    if (!t || !t.trim() || t.trim() === 'none') return;
    for (const part of sel.split(',')) {
      // Drop only the state pseudo-classes; a structural :not()/:is() must
      // survive or the match becomes broader than the real rule.
      const bare = part.replace(/:(hover|focus-visible|focus|active|visited|link)\b/g, '').trim();
      if (!bare) continue;
      let m = false;
      try { m = node.matches(bare); } catch { m = false; }
      if (m) { hits.push(`${sel} { transform: ${t.trim()} }  [${href}]`); return; }
    }
  };
  // A CSSStyleRule also exposes an (empty) `cssRules` list wherever CSS nesting
  // is supported, so `if (rule.cssRules) recurse` skips EVERY style rule and the
  // walk silently finds nothing. Inspect first, recurse only into rules that
  // actually have children.
  const walk = (rules, href) => {
    for (const rule of rules) {
      if (rule.selectorText !== undefined) inspect(rule, href);
      if (rule.cssRules && rule.cssRules.length) walk(rule.cssRules, href);
    }
  };
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; } // cross-origin
    if (rules) walk(rules, sheet.href ? sheet.href.split('/').pop() : 'inline');
  }
  return hits;
};

test.describe('Hover stability — navbar controls do not move under the pointer', { tag: '@critical' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, UI_ROUTES.home);
    await dismissCookieConsent(page);
  });

  for (const { name, selector, edgeProbe } of CONTROLS) {
    test(`${name}: hovering neither moves the box nor applies a transform`, async ({ page }) => {
      const found = await visibleControl(page, selector);
      if (!found) test.skip(true, `No visible ${selector} on this page`);
      const { el, box } = found;

      await page.mouse.move(5, 400);
      await page.waitForTimeout(300);
      const before = await boxOf(el);

      // Hover the CENTRE, not an edge: the centre cannot flicker, so the
      // transition settles on the rule's real target rather than a sample of
      // an oscillation somewhere between 0 and it.
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(700); // > the 0.3s .btn transition

      const during = await boxOf(el);
      const transform = await el.evaluate((node) => getComputedStyle(node).transform);
      const candidates = transform === 'none' ? [] : await el.evaluate(CANDIDATE_RULES);

      expect(transform, `${name} computes a transform while hovered. Candidate rules:\n      ${candidates.join('\n      ')}`)
        .toBe('none');
      expect(during, `${name} moved or resized while hovered`).toEqual(before);
    });

    if (!edgeProbe) continue;

    test(`${name}: pointer parked on the bottom edge keeps hover`, async ({ page }) => {
      const found = await visibleControl(page, selector);
      if (!found) test.skip(true, `No visible ${selector} on this page`);
      const { el, box } = found;

      // mouseenter/mouseleave, not mouseover/mouseout: the latter also fire when
      // the pointer crosses onto a DESCENDANT, which is movement the element
      // never lost hover for.
      await el.evaluate((node) => {
        window.__hoverEvents = { enter: 0, leave: 0 };
        node.addEventListener('mouseenter', () => { window.__hoverEvents.enter += 1; });
        node.addEventListener('mouseleave', () => { window.__hoverEvents.leave += 1; });
      });

      // Half a pixel inside the bottom edge — the row an upward lift vacates.
      await page.mouse.move(box.x + box.width / 2, box.y + box.height - 0.5);
      // Hold still. Any leave from here is the element moving, not the pointer.
      await page.waitForTimeout(800);

      const events = await page.evaluate(() => window.__hoverEvents);
      expect(events.enter, `${name} never received hover — the probe missed it`).toBeGreaterThanOrEqual(1);
      expect(events.leave, `${name} lost hover with the pointer stationary — flicker`).toBe(0);
    });
  }
});
