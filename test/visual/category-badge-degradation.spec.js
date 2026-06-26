// =============================================================================
// category-badge-degradation.spec.js — category badges never 404 (issue #204)
// =============================================================================
// _layouts/article.html (and _includes/components/post-card.html) render a
// category badge. It used to ALWAYS be a link to `{category_base}/{category}/`
// (default /news/<cat>/). On a remote-theme consumer whose category index is
// plugin/page-generated and absent, that link 404s. The fix links the badge only
// when the category index page exists in the build, else renders a plain <span>.
//
// The theme's own content exercises BOTH branches: /news/development/ exists
// (Development posts → link) but /news/security/ does not (Security posts →
// span). These assertions fail against the pre-fix layout, which linked both.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('./fixtures');

// fs-6 is unique to the article-layout category badge (post-card badges omit it),
// so this targets the article's own badge whether it renders as <a> or <span>.
const ARTICLE_BADGE = '.badge.bg-primary.fs-6';

// An article whose primary category (Development) HAS an index page.
const LINKED_ARTICLE = '/posts/2025/01/22/git-workflow-best-practices/';
// An article whose primary category (Security) has NO index page.
const UNLINKED_ARTICLE = '/posts/2026/06/16/favicon-ico-unlocked-door-to-collapse/';

test.describe('Category badge degradation (issue #204)', () => {
  test('existing category index → badge links to it (and the target resolves)', async ({ page }) => {
    await waitForJekyll(page, LINKED_ARTICLE);

    const badge = page.locator(`a${ARTICLE_BADGE}`);
    await expect(badge).toHaveCount(1);
    await expect(badge).toHaveAttribute('href', '/news/development/');
    await expect(page.locator(`span${ARTICLE_BADGE}`)).toHaveCount(0);

    // The link target actually exists — no 404.
    const resp = await page.request.get('/news/development/');
    expect(resp.status()).toBe(200);
  });

  test('absent category index → badge is a plain span, not a 404 link', async ({ page }) => {
    // Precondition: the category index genuinely does not exist on this site.
    const resp = await page.request.get('/news/security/');
    expect(resp.status()).toBe(404);

    await waitForJekyll(page, UNLINKED_ARTICLE);

    await expect(page.locator(`span${ARTICLE_BADGE}`)).toHaveCount(1);
    await expect(page.locator(`a${ARTICLE_BADGE}`)).toHaveCount(0);
  });

  test('no category badge anywhere on the page links to the absent index', async ({ page }) => {
    // Covers the article badge AND any related post-card badges on the page:
    // none may point at the 404-ing /news/security/.
    await waitForJekyll(page, UNLINKED_ARTICLE);
    await expect(page.locator('a[href="/news/security/"]')).toHaveCount(0);
  });
});
