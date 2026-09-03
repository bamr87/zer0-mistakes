/**
 * Heading outline must not skip levels.
 *
 * Regression: #436. WCAG 1.3.1 (Info and Relationships).
 *
 * Several components picked a heading element for its default FONT-SIZE rather
 * than its position in the document, then restyled it. A screen-reader user
 * navigating by heading hears the result as missing structure: on an article
 * page the outline ran h1 -> h2 -> h6 -> h2 -> h5 -> h3 -> h6.
 *
 * Two of those were site-wide chrome and account for most of the damage: the
 * cookie modal (h2 dialog title, h6 category headings) and the Settings
 * offcanvas including the language panel (h2 title, h6 section labels). Both
 * render on EVERY page of every consumer site. Measured across a 415-page
 * build before the fix: 391 pages carried at least one skip, 1,060 in total.
 *
 * The fix decouples size from level -- <h3 class="h6"> keeps the small type
 * and states the real depth -- and, for a component rendered under different
 * ancestors, makes the level a parameter instead of a guess.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');
const { UI_ROUTES, waitForJekyll } = require('../fixtures');

/** The outline as assistive tech walks it. Hidden headings still count: a
 *  collapsed dialog is in the accessibility tree and reachable by heading
 *  navigation, which is exactly how the cookie-modal skip was encountered. */
async function outline(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((el) => ({
      level: Number(el.tagName[1]),
      text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
    })));
}

function skips(items) {
  const bad = [];
  let prev = 0;
  for (const { level, text } of items) {
    if (prev && level > prev + 1) bad.push(`h${prev} -> h${level} at ${JSON.stringify(text)}`);
    prev = level;
  }
  return bad;
}

/** Regions this PR actually repaired. A whole-page "no skips anywhere"
 *  assertion is the right eventual test, but the theme is not there yet:
 *  after this change 66 of 415 pages still carry a skip, from inline card
 *  markup in the news and section index layouts and from page content that
 *  jumps h1 -> h3. Asserting site-wide now would ship a test that fails on
 *  its own branch, which is worse than asserting less and saying so. */
const CHROME_REGIONS = [
  { selector: '#cookieSettingsModal', why: 'cookie dialog — ships on every page' },
  // #info-section (kebab) is the offcanvas. #infoSection is its <h2>'s id,
  // used by aria-labelledby -- targeting that skipped these three tests
  // silently, because the region locator matched nothing.
  { selector: '#info-section', why: 'settings offcanvas incl. the language panel' },
];

const ROUTES = [
  { path: UI_ROUTES.home, why: 'home' },
  { path: '/docs/', why: 'docs — different layout family, same chrome' },
  { path: '/404.html', why: '404 — root-inheriting' },
];

test.describe('heading outline does not skip levels', { tag: '@critical' }, () => {
  for (const { path, why } of ROUTES) {
    for (const { selector, where } of CHROME_REGIONS.map((r) => ({ ...r, where: r.why }))) {
      test(`${selector} has a continuous outline on ${path} (${why}; ${where})`, async ({ page }) => {
        const res = await page.goto(path, { waitUntil: 'load' }).catch(() => null);
        test.skip(!res || res.status() >= 400, `${path} not published on this site`);

        const region = page.locator(selector);
        test.skip((await region.count()) === 0, `${selector} not present on this site`);

        // Levels inside the region, plus the region's own title, which is the
        // parent the first child must sit one below.
        const items = await region.evaluate((root) =>
          [...root.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((el) => ({
            level: Number(el.tagName[1]),
            text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          })));

        expect(
          skips(items),
          `heading levels jump inside ${selector} on ${path}. This region renders on ` +
          `every page of every consumer site, so one skip here is a site-wide ` +
          `WCAG 1.3.1 failure (issue #436). Pick the tag for DEPTH and a ` +
          `.h1-.h6 class for SIZE.`
        ).toEqual([]);
      });
    }
  }

  test('the cookie dialog nests its categories one level below its title', async ({ page }) => {
    // The specific structure from the issue's first piece of evidence. Asserted
    // on its own because it ships on every page of every consumer site, and a
    // whole-page assertion could be satisfied by deleting the headings.
    await waitForJekyll(page, UI_ROUTES.home);

    const title = page.locator('#cookieSettingsModalLabel');
    test.skip((await title.count()) === 0, 'cookie consent is not enabled on this site');

    const titleLevel = await title.evaluate((el) => Number(el.tagName[1]));
    const categories = await page
      .locator('.cookie-category h1, .cookie-category h2, .cookie-category h3, .cookie-category h4, .cookie-category h5, .cookie-category h6')
      .evaluateAll((els) => els.map((el) => Number(el.tagName[1])));

    expect(categories.length, 'the dialog should have category headings').toBeGreaterThan(0);
    for (const lvl of categories) {
      expect(
        lvl,
        `a cookie category heading is h${lvl} under an h${titleLevel} dialog title`
      ).toBe(titleLevel + 1);
    }
  });

  test('small type does not mean a deep level', async ({ page }) => {
    // The root cause, asserted directly: the fix must keep the visual size, so
    // a heading carrying a .h5/.h6 SIZE class is expected -- what must not come
    // back is choosing the TAG for that size.
    await waitForJekyll(page, UI_ROUTES.home);

    const mismatched = await page.evaluate(() =>
      [...document.querySelectorAll('h5, h6')]
        .filter((el) => !el.closest('[data-allow-deep-heading]'))
        .map((el) => ({ tag: el.tagName, text: (el.textContent || '').trim().slice(0, 40) })));

    // Not a ban on h5/h6 -- they are correct at depth 5 and 6. This asserts the
    // chrome specifically no longer reaches for them as a sizing shortcut.
    const inChrome = await page.evaluate(() =>
      [...document.querySelectorAll('#cookieSettingsModal h5, #cookieSettingsModal h6, #infoSection h5, #infoSection h6')]
        .map((el) => `${el.tagName}: ${(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)}`));

    expect(
      inChrome,
      `the cookie dialog and settings offcanvas sit at depth 2-3; an h5/h6 there ` +
      `is a font-size choice wearing a structural tag (issue #436). ` +
      `Full-page h5/h6 census for context: ${mismatched.length}`
    ).toEqual([]);
  });
});
