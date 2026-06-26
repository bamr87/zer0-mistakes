// =============================================================================
// giscus-comments.spec.js — Comments render (and stay scoped) when enabled
// =============================================================================
// Regression coverage for the Giscus comment system (PR #214, issue #201). The
// article layout gates the comments section on `site.giscus.enabled` (NOT the
// mere presence of the `site.giscus` block — that was the bug: a block with
// `enabled: false` still forced comments on). When enabled, an article renders
// a `#comments` section that wires the Giscus widget from `_config.yml`.
//
// We stub giscus.app/client.js so the test never depends on the external widget
// network — the assertions are on the server-rendered section + <script> the
// include emits, which is what the fix controls. The `enabled: false` branch is
// covered build-time by the `Giscus Comments Configuration` core test and the
// before/after evidence (test/visual/evidence/giscus-comments/).
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('./fixtures');

const COMMENTS = '#comments';
const GISCUS_SCRIPT = 'script[src*="giscus.app/client.js"]';

/** Don't let the external Giscus widget script actually load (network + iframe). */
async function stubGiscusClient(page) {
  await page.route('**/giscus.app/client.js', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stubbed for test */' }),
  );
}

/** Discover a real published post URL from the live search index. */
async function firstPostUrl(page) {
  const index = await page.evaluate(async () => {
    const res = await fetch('/search.json');
    return res.ok ? res.json() : [];
  });
  const post = (Array.isArray(index) ? index : []).find((e) => (e.url || '').startsWith('/posts/'));
  return post ? post.url : null;
}

test.describe('Giscus comments', () => {
  test('an article renders the comments section wired to the configured repo', async ({ page }) => {
    await stubGiscusClient(page);
    await waitForJekyll(page, '/');
    const url = await firstPostUrl(page);
    test.skip(!url, 'no /posts/ entry in the search index to exercise comments on');

    await waitForJekyll(page, url);

    const comments = page.locator(COMMENTS);
    await expect(comments).toBeVisible();
    await expect(comments.locator('h2')).toContainText(/comments/i);

    const giscus = comments.locator(GISCUS_SCRIPT);
    await expect(giscus).toHaveCount(1);
    // The include must pipe the config through, not hardcode placeholders.
    await expect(giscus).toHaveAttribute('data-repo', 'bamr87/zer0-mistakes');
    await expect(giscus).toHaveAttribute('data-repo-id', /^R_/);
    await expect(giscus).toHaveAttribute('data-category-id', /^DIC_/);
    await expect(giscus).toHaveAttribute('data-mapping', 'pathname');
  });

  test('non-article pages do not render a comments section', async ({ page }) => {
    await stubGiscusClient(page);
    // The home page uses the home layout, not article — comments must not leak.
    await waitForJekyll(page, '/');
    await expect(page.locator(COMMENTS)).toHaveCount(0);
    await expect(page.locator(GISCUS_SCRIPT)).toHaveCount(0);
  });
});
