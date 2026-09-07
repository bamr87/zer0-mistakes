// =============================================================================
// scroll-spy.spec.js — TOC active-heading highlighting follows the reading position
// =============================================================================
// Regression suite for the scroll-spy fix: the bolded entry in the right-hand
// Table of Contents must be the section the reader is actually in, and it must
// move monotonically as the page scrolls.
//
// How these tests fail against the pre-fix theme:
//
//   1. Three implementations fought over `.active` on `#TableOfContents a`:
//      Bootstrap's native ScrollSpy (`data-bs-spy="scroll"` on BOTH <body> in
//      root.html and `.bd-main` in default.html), the theme's own
//      scroll-spy.js, and the catch-all `a[href^="#"]` observer in
//      ui-enhancements.js. Whichever fired last won.
//   2. scroll-spy.js asked IntersectionObserver for the "most visible"
//      heading. Headings are a few pixels tall, so every heading inside the
//      observer band reported the same intersectionRatio; the winner was
//      whichever entry happened to be in that callback batch, and headings
//      leaving the band triggered no re-evaluation at all.
//
//   Measured on /docs/features/toc/ at 1280x820: 19-23 of 25 scroll positions
//   highlighted the wrong entry (the count moves between runs because the
//   pre-fix winner depended on callback timing), the highlight ran several
//   sections ahead of the viewport, and it could jump backwards. See
//   test/visual/evidence/scroll-spy/.
//
// The contract asserted here:
//   - the active entry is the LAST heading whose top has crossed the reading
//     line (`scroll-padding-top` below the viewport top), the last heading
//     once the page is scrolled to the bottom;
//   - exactly one TOC link carries `.active` at any moment;
//   - the active entry never moves backwards while scrolling down;
//   - clicking a TOC entry activates that entry;
//   - nothing else claims `#TableOfContents` as a scroll-spy target.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { gotoOrSkip, dismissCookieConsent } = require('../fixtures');

/** Docs page with a long, multi-level TOC (28 entries at time of writing). */
const ROUTE = '/docs/features/toc/';

/** Number of scroll stops sampled across the page. */
const STOPS = 24;

/**
 * In-page probe: the heading the reader is in (computed independently from the
 * raw DOM) alongside the entries the theme actually marked active.
 */
const READ_SPY = () => {
  const heads = [];
  const seen = new Set();
  document.querySelectorAll('#TableOfContents a[href^="#"]').forEach((link) => {
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    if (!id || seen.has(id)) return;
    const el = document.getElementById(id);
    if (!el) return;
    seen.add(id);
    heads.push({ id, top: el.getBoundingClientRect().top + window.scrollY });
  });
  heads.sort((a, b) => a.top - b.top);

  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 80;
  const line = window.scrollY + pad + 4;
  const atBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

  let expected = heads.length ? heads[0].id : null;
  if (atBottom) {
    expected = heads.length ? heads[heads.length - 1].id : null;
  } else {
    for (const h of heads) {
      if (h.top > line) break;
      expected = h.id;
    }
  }

  const active = Array.from(document.querySelectorAll('#TableOfContents a.active')).map((a) =>
    decodeURIComponent(a.getAttribute('href').slice(1)),
  );

  return {
    y: Math.round(window.scrollY),
    order: heads.map((h) => h.id),
    expected,
    active,
  };
};

/** Scroll to an absolute offset without the CSS smooth-scroll animation. */
async function scrollTo(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, left: 0, behavior: 'instant' }), y);
  // Two frames: one for the scroll listener, one for the rAF-batched update.
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
}

test.describe('TOC scroll spy', () => {
  test.beforeEach(async ({ page }) => {
    await dismissCookieConsent(page);
    await gotoOrSkip(page, ROUTE);
    const toc = page.locator('#TableOfContents a[href^="#"]');
    if ((await toc.count()) < 5) test.skip(true, `${ROUTE} has no multi-entry TOC`);
    // Best-effort wait for the spy to paint its first highlight. Deliberately
    // not an assertion: each test states its own contract, so a regression
    // fails on the property it broke rather than in setup.
    await page
      .waitForFunction(() => !!document.querySelector('#TableOfContents a.active'), null, {
        timeout: 5000,
      })
      .catch(() => {});
  });

  test('exactly one TOC entry is active on load', async ({ page }) => {
    await expect(page.locator('#TableOfContents a.active')).toHaveCount(1);
  });

  test('active TOC entry tracks the section being read', async ({ page }) => {
    const max = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    expect(max, 'test page must be scrollable').toBeGreaterThan(1000);

    const wrong = [];
    for (let i = 0; i <= STOPS; i++) {
      await scrollTo(page, Math.round((max * i) / STOPS));
      const spy = await page.evaluate(READ_SPY);
      if (spy.active.length !== 1 || spy.active[0] !== spy.expected) {
        wrong.push(`y=${spy.y} expected #${spy.expected} got [${spy.active.join(', ') || 'none'}]`);
      }
    }

    expect(wrong, `wrong TOC highlight at ${wrong.length}/${STOPS + 1} scroll positions`).toEqual(
      [],
    );
  });

  test('highlight never jumps backwards while scrolling down', async ({ page }) => {
    const max = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );

    let previousIndex = -1;
    const regressions = [];
    for (let i = 0; i <= STOPS; i++) {
      await scrollTo(page, Math.round((max * i) / STOPS));
      const spy = await page.evaluate(READ_SPY);
      const index = spy.order.indexOf(spy.active[0]);
      if (index < previousIndex) {
        regressions.push(`y=${spy.y} moved back to #${spy.active[0]} (index ${index} < ${previousIndex})`);
      }
      previousIndex = Math.max(previousIndex, index);
    }

    expect(regressions, 'TOC highlight moved backwards while scrolling down').toEqual([]);
  });

  test('bottom of the page activates the last TOC entry', async ({ page }) => {
    await scrollTo(page, await page.evaluate(() => document.documentElement.scrollHeight));
    const spy = await page.evaluate(READ_SPY);
    expect(spy.active).toEqual([spy.order[spy.order.length - 1]]);
  });

  test('clicking a TOC entry activates that entry', async ({ page }) => {
    const links = page.locator('#TableOfContents a[href^="#"]');
    const target = links.nth(Math.min(4, (await links.count()) - 1));
    const href = await target.getAttribute('href');

    await target.click();
    await expect(target).toHaveClass(/\bactive\b/);
    await expect(page.locator('#TableOfContents a.active')).toHaveCount(1);
    await expect(target).toHaveAttribute('aria-current', 'true');

    // Still the active entry once the animated scroll has settled.
    await page.waitForTimeout(1500);
    const active = await page.evaluate(
      () => document.querySelector('#TableOfContents a.active')?.getAttribute('href') ?? null,
    );
    expect(active).toBe(href);
  });

  test('no competing scroll spy claims the TOC', async ({ page }) => {
    // Bootstrap's native ScrollSpy toggles the same `.active` class on the
    // same links; re-adding `data-bs-spy` anywhere brings the jumping back.
    const claims = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-bs-spy="scroll"]')).map(
        (el) =>
          `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} → ${el.getAttribute('data-bs-target')}`,
      ),
    );
    expect(claims.filter((c) => c.includes('#TableOfContents'))).toEqual([]);
  });
});
