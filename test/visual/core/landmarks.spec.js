/**
 * Landmark uniqueness — exactly one `main` landmark per page.
 *
 * Regression: issue #484, the same class of defect as #299. The article,
 * notebook and note layouts each rendered `<article id="main" role="main">`
 * INSIDE root.html's `<main id="main-content">`, so every post/notebook/note
 * page exposed two `main` landmarks (WCAG 2.1 SC 1.3.1) and lost the `article`
 * landmark that `role="main"` overrode. #299 removed a nested literal
 * `<main>`; the `role` attribute re-created the identical condition on a
 * different element.
 *
 * Two layers, because neither alone is sufficient here:
 *
 *   1. A source assertion over `_layouts/*.html`, which needs no server and so
 *      covers all three layouts — including `notebook`, whose collection is
 *      `output: false` in `_config_dev.yml`, so no notebook page exists on the
 *      dev server the rest of this suite runs against.
 *   2. Rendered assertions per route, which are what actually prove the
 *      landmark tree a screen reader sees.
 *
 * The page-level axe audits in accessibility.spec.js could not have caught
 * this: they run `wcag2a`/`wcag2aa` only, and landmark uniqueness is an axe
 * *best-practice* rule, so they stayed green through the whole regression.
 *
 * Run: npm run test:smoke  (the source and uniqueness cases also run in the
 * critical tier)
 */
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { VIEWPORTS, gotoOrSkip } = require('../fixtures');

const LAYOUTS_DIR = path.resolve(__dirname, '../../../_layouts');

// One route per affected layout, using the demo content this theme ships.
// `notebook` is expected to skip on the dev server (see the header); layer 1
// is what keeps it covered there.
const LAYOUT_ROUTES = [
  {
    layout: 'article',
    route: '/posts/2025/01/22/git-workflow-best-practices/',
    article: 'article.post.h-entry',
    itemtype: 'https://schema.org/BlogPosting',
  },
  {
    layout: 'notebook',
    route: '/notebooks/test-notebook/',
    article: 'article.notebook-article.h-entry',
    itemtype: 'https://schema.org/TechArticle',
  },
  {
    layout: 'note',
    route: '/notes/git-cheatsheet/',
    article: 'article.note-article.h-entry',
    itemtype: 'https://schema.org/Article',
  },
];

test.describe('Landmarks — one main landmark per page', () => {
  // Layer 1: the source contract. No page fixture, so it runs everywhere and
  // covers every layout regardless of which collections a config emits.
  test('no layout claims the main landmark or the generic #main id', { tag: '@critical' }, () => {
    const offenders = [];
    for (const file of fs.readdirSync(LAYOUTS_DIR).filter((f) => f.endsWith('.html'))) {
      // Liquid comments are stripped first: these layouts explain *why* they
      // no longer carry the attributes, and prose naming one is not markup
      // emitting one.
      const body = fs
        .readFileSync(path.join(LAYOUTS_DIR, file), 'utf8')
        .replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '');
      // root.html owns the one landmark, as `<main id="main-content">`. Nothing
      // else may declare role="main", and no layout may squat on id="main" —
      // the skip link targets #main-content and nothing references #main.
      for (const [attr, re] of [
        ['role="main"', /role="main"/],
        ['id="main"', /id="main"(?!-)/],
      ]) {
        if (re.test(body)) offenders.push(`_layouts/${file}: ${attr}`);
      }
    }
    expect(offenders, 'layouts must not declare a second main landmark').toEqual([]);
  });

  test.describe('rendered', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
    });

    for (const { layout, route, article, itemtype } of LAYOUT_ROUTES) {
      test(`${layout} layout exposes exactly one main landmark`, { tag: '@critical' }, async ({
        page,
      }) => {
        await gotoOrSkip(page, route);
        await expect(
          page.locator(article),
          `${route} did not render the ${layout} layout — fixture moved?`
        ).toBeAttached();

        const mains = await page.$$eval('main, [role="main"]', (els) =>
          els.map((el) => ({
            tag: el.tagName.toLowerCase(),
            id: el.id || null,
            role: el.getAttribute('role'),
          }))
        );

        expect(
          mains,
          `expected one main landmark on ${route}, got ${JSON.stringify(mains)}`
        ).toHaveLength(1);
        // …and it must be root.html's wrapper, not something else that happens
        // to be alone on this route.
        expect(mains[0]).toEqual({ tag: 'main', id: 'main-content', role: null });
      });

      test(`${layout} layout keeps its article landmark and microdata`, async ({ page }) => {
        await gotoOrSkip(page, route);
        const el = page.locator(article);
        await expect(el).toBeAttached();

        // role="main" would override the element's native `article` landmark,
        // so the post would no longer be announced as an article.
        await expect(el).not.toHaveAttribute('role');
        await expect(el).not.toHaveAttribute('id');

        // Removing the two attributes must not disturb the microdata contract.
        await expect(el).toHaveAttribute('itemscope', '');
        await expect(el).toHaveAttribute('itemtype', itemtype);
      });

      test(`${layout} layout passes the axe duplicate-main rule`, async ({ page }) => {
        await gotoOrSkip(page, route);
        const results = await new AxeBuilder({ page })
          .withRules(['landmark-no-duplicate-main'])
          .analyze();
        expect(
          results.violations.map((v) => `${v.id} on ${v.nodes.length} node(s)`),
          `axe landmark violations on ${route}`
        ).toEqual([]);
      });
    }

    // The point of landmark uniqueness: "skip to main content" must stay
    // unambiguous on the layouts that used to carry a second one.
    test('skip link still reaches the one main landmark on a post page', async ({ page }) => {
      await gotoOrSkip(page, LAYOUT_ROUTES[0].route);

      const main = page.locator('#main-content');
      await expect(main).toHaveAttribute('tabindex', '-1');

      const skip = page.locator('a[href="#main-content"].visually-hidden-focusable');
      await skip.focus();
      await skip.press('Enter');
      await expect(main).toBeFocused();
    });
  });
});
