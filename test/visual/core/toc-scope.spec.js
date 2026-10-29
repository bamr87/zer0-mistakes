/**
 * The right-sidebar "On this page" TOC lists the article, not the layout.
 *
 * Regression: #552. sidebar-right.html is included from default.html, where
 * `content` is the whole rendered child layout. On an article that is the
 * <h1 id="page-title"> header, the body, and the author-bio aside with its
 * <h2 id="about-the-author">. With h_min=1 the TOC rooted itself at the page
 * title (every section nested under "Title ›") and ended with "About the
 * Author", as if theme chrome were a section of the post.
 *
 * The fix: article.html wraps its body in <!-- zer0:toc-start/end --> and the
 * TOC parses that slice from h2; the author-bio heading also carries no_toc.
 * Layouts without the markers (docs) keep the old behaviour, asserted below.
 *
 * Run: npm run test:smoke
 */
const { test, expect } = require('@playwright/test');

/** A published demo post that has an author bio and body h2s. */
const ARTICLE = '/posts/2026/04/28/customer-onboarding-scorecards/';
const DOCS = '/docs/';

async function tocHrefs(page) {
  return page.locator('#TableOfContents a[href^="#"]').evaluateAll((els) =>
    els.map((el) => el.getAttribute('href')));
}

async function open(page, path) {
  const res = await page.goto(path, { waitUntil: 'load' }).catch(() => null);
  test.skip(!res || res.status() >= 400, `${path} not published on this site`);
}

test.describe('TOC is scoped to the page body', { tag: '@critical' }, () => {
  test('an article TOC starts at the first body h2 and omits theme chrome', async ({ page }) => {
    await open(page, ARTICLE);
    test.skip((await page.locator('#TableOfContents').count()) === 0, 'TOC sidebar not rendered');

    const hrefs = await tocHrefs(page);
    expect(hrefs.length, 'the article has body sections, so the TOC should list them').toBeGreaterThan(0);

    const firstBodyH2 = await page.locator('[itemprop="articleBody"] h2[id]').first().getAttribute('id');
    expect(hrefs[0], 'the first TOC link should be the first body h2, not the page title').toBe(`#${firstBodyH2}`);
    expect(hrefs, 'the post <h1> is the page title, not a section (issue #552)').not.toContain('#page-title');
    expect(hrefs, 'the author bio is theme chrome, not a section (issue #552)').not.toContain('#about-the-author');
  });

  test('the author bio keeps its id for aria-labelledby', async ({ page }) => {
    await open(page, ARTICLE);
    const bio = page.locator('aside[aria-labelledby="about-the-author"]');
    test.skip((await bio.count()) === 0, 'this post renders no author bio');
    await expect(page.locator('#about-the-author')).toHaveCount(1);
  });

  test('every docs TOC link targets a heading on the page', async ({ page }) => {
    // Docs layouts carry no zer0:toc markers, so their TOC is parsed exactly
    // as before. Pin that it still renders and still resolves.
    await open(page, DOCS);
    const hrefs = await tocHrefs(page);
    test.skip(hrefs.length === 0, `${DOCS} has no TOC on this site`);
    for (const href of hrefs) {
      await expect(page.locator(`[id="${href.slice(1)}"]`), `${href} should resolve`).toHaveCount(1);
    }
  });
});
