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
const { UI_ROUTES, waitForJekyll, gotoOrSkip } = require('../fixtures');

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

/** Regions #436 actually repaired. A whole-page "no skips anywhere"
 *  assertion is the right eventual test, but the theme is not there yet:
 *  after #436, 66 of 415 pages still carried a skip, from inline card markup
 *  in the news and section index layouts and from page content that jumps
 *  h1 -> h3. The section layout's whole <main> is now asserted
 *  (SECTION_ROUTES, #555); the news index layout and page content remain. Asserting site-wide
 *  now would ship a test that fails on its own branch, which is worse than
 *  asserting less and saying so.
 *
 *  Every region here is a dialog or offcanvas rendered directly under <body>,
 *  outside <main>, so its title is one level below the page's <h1>: the
 *  region's outline is walked from an h1 parent, and its first heading must
 *  be an <h2>. Without that seed a region with a single heading (the chat
 *  panel's title) could never fail, whatever tag it used. */
const REGION_PARENT = { level: 1, text: '(page <h1>)' };
const CHROME_REGIONS = [
  { selector: '#cookieSettingsModal', why: 'cookie dialog — ships on every page' },
  // #info-section (kebab) is the offcanvas. #infoSection is its <h2>'s id,
  // used by aria-labelledby -- targeting that skipped these three tests
  // silently, because the region locator matched nothing.
  { selector: '#info-section', why: 'settings offcanvas incl. the language panel' },
  // Regression: #586. The chat panel's title was an <h6> for its small type,
  // so every page that ships the chat jumped to h6 after the h3-level chrome.
  // Rendered only when site.ai_chat is enabled with a usable auth path
  // (_config_dev.yml turns it on); the region check skips where it is off.
  { selector: '#aiChatPanel', why: 'AI chat panel — ships on every page when ai_chat is on' },
];

const ROUTES = [
  { path: UI_ROUTES.home, why: 'home' },
  { path: '/docs/', why: 'docs — different layout family, same chrome' },
  { path: '/404.html', why: '404 — root-inheriting' },
];

/** One published section landing per section_style in the demo content. */
const SECTION_ROUTES = [
  { path: UI_ROUTES.newsSection, style: 'list' },
  { path: '/news/development/', style: 'grid' },
  { path: '/news/tutorial/', style: 'magazine' },
];

test.describe('heading outline does not skip levels', { tag: '@critical' }, () => {
  for (const { path, why } of ROUTES) {
    for (const { selector, where } of CHROME_REGIONS.map((r) => ({ ...r, where: r.why }))) {
      test(`${selector} has a continuous outline on ${path} (${why}; ${where})`, async ({ page }) => {
        const res = await page.goto(path, { waitUntil: 'load' }).catch(() => null);
        test.skip(!res || res.status() >= 400, `${path} not published on this site`);

        const region = page.locator(selector);
        test.skip((await region.count()) === 0, `${selector} not present on this site`);

        // Levels inside the region, walked from the page's <h1> (REGION_PARENT):
        // the region's own title must sit one below it, and each child one
        // below the title.
        const items = await region.evaluate((root) =>
          [...root.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((el) => ({
            level: Number(el.tagName[1]),
            text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          })));

        expect(
          skips([REGION_PARENT, ...items]),
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

  // Regression: #555. The section layout (news section landings) was the
  // remainder the CHROME_REGIONS note above deferred: a sidebar <h5>/<h6>
  // rendered before the page <h1>, then h1 -> h5 card titles. One route per
  // section_style, because each style emits its own card markup.
  for (const { path, style } of SECTION_ROUTES) {
    test(`section layout (${style}) has a continuous outline in #main-content on ${path}`, async ({ page }) => {
      const res = await page.goto(path, { waitUntil: 'load' }).catch(() => null);
      test.skip(!res || res.status() >= 400, `${path} not published on this site`);
      test.skip((await page.locator('.section-layout').count()) === 0, `${path} is not a section layout here`);

      // Everything the layout renders, sidebar included, sits inside root.html's
      // <main id="main-content">. Site chrome outside it is asserted per region
      // (CHROME_REGIONS above).
      const items = await page.locator('#main-content').evaluate((root) =>
        [...root.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((el) => ({
          level: Number(el.tagName[1]),
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
        })));
      expect(
        skips(items),
        `heading levels jump on the ${style} section page ${path} (issue #555). ` +
        `Pick the tag for DEPTH and a .h1-.h6 class for SIZE.`
      ).toEqual([]);

      const h1s = (await outline(page)).filter((h) => h.level === 1);
      expect(h1s.length, `exactly one <h1> on ${path}`).toBe(1);

      // Nothing in the section layout reaches for h5/h6 to get small type.
      const deep = await page.evaluate(() =>
        [...document.querySelectorAll('.section-layout h5, .section-layout h6')]
          .map((el) => `${el.tagName}: ${(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)}`));
      expect(deep, `h5/h6 used as a size inside the section layout on ${path}`).toEqual([]);
    });
  }

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
    // Built from CHROME_REGIONS so a region added there is covered here too
    // (this list once named #infoSection, the offcanvas title, and matched nothing).
    const chromeDeep = CHROME_REGIONS.flatMap(({ selector }) => [`${selector} h5`, `${selector} h6`]).join(', ');
    const inChrome = await page.evaluate((sel) =>
      [...document.querySelectorAll(sel)]
        .map((el) => `${el.tagName}: ${(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)}`), chromeDeep);

    expect(
      inChrome,
      `the cookie dialog, settings offcanvas and chat panel sit at depth 2-3; an h5/h6 there ` +
      `is a font-size choice wearing a structural tag (issue #436). ` +
      `Full-page h5/h6 census for context: ${mismatched.length}`
    ).toEqual([]);
  });
});

// Regression: #593. default.html renders page.title as the intro hero's <h1>,
// and most Markdown pages open with their own `# Title`, so 225 of the 244
// pages that render the intro exposed two <h1>s (the docs index and nearly
// every doc page among them). default.html now rewrites the body's first <h1>:
// dropped (its id kept on an empty span) when it leads the body and repeats
// the title, demoted to <h2> otherwise. The landing layout behind `/` already
// hid its body <h1> in CSS; it is asserted here so it stays that way.
const SINGLE_H1_ROUTES = [
  { path: UI_ROUTES.home, why: 'home: landing layout' },
  { path: '/docs/', why: 'docs index: body heading differs from the title' },
  { path: '/docs/installation/', why: 'doc page: body heading repeats the title' },
];

test.describe('one h1 per page (#593)', { tag: '@critical' }, () => {
  for (const { path, why } of SINGLE_H1_ROUTES) {
    test(`exactly one h1 in the accessibility tree on ${path} (${why})`, async ({ page }) => {
      await gotoOrSkip(page, path);
      // getByRole skips what assistive tech cannot reach (display:none,
      // [hidden]), which is the outline a screen-reader user navigates.
      const h1s = (await page.getByRole('heading', { level: 1 }).allTextContents())
        .map((t) => t.replace(/\s+/g, ' ').trim());
      expect(
        h1s,
        `${path} exposes ${h1s.length} level-1 headings. The page title is the ` +
        `one <h1>; a body heading that repeats it is dropped, any other is an <h2> (issue #593).`
      ).toHaveLength(1);
    });
  }

  test('a leading body h1 that repeats the title is dropped and keeps its anchor', async ({ page }) => {
    await gotoOrSkip(page, '/docs/installation/');
    await expect(page.locator('.bd-intro-title')).toHaveText('Installation');

    const body = page.locator('#page-content');
    await expect(
      body.getByRole('heading', { name: 'Installation', exact: true }),
      'the body repeats the title the intro already shows'
    ).toHaveCount(0);

    // Links to #installation (the TOC entry, old bookmarks) still land.
    const anchor = body.locator('#installation');
    await expect(anchor, 'the dropped heading took its id with it').toHaveCount(1);
    await expect(page.locator('a[href="#installation"]').first()).toBeAttached();
  });

  test('a body h1 with different text stays visible as an h2', async ({ page }) => {
    await gotoOrSkip(page, '/docs/');
    // pages/_docs/index.md opens with `# Zer0-Mistakes Documentation` under the
    // title "Documentation": the author's words stay, one level down.
    const heading = page.locator('#page-content #zer0-mistakes-documentation');
    test.skip((await heading.count()) === 0, 'the docs index no longer opens with its own heading');
    await expect(heading).toBeVisible();
    expect(await heading.evaluate((el) => el.tagName)).toBe('H2');
    await expect(heading).toHaveText('Zer0-Mistakes Documentation');
  });
});
