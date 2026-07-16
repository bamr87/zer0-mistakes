/**
 * ============================================================================
 * Layout & UI framework spec — landing, default, article, breadcrumbs,
 * section archive, intro hero, welcome, keyboard shortcuts, token wiring
 * ----------------------------------------------------------------------------
 * Structural and accessibility checks for the layouts touched by the v1.8 UI/UX
 * framework refresh (ZER0-019/040/047/062/063/064):
 *
 *   - landing.html       : data-driven hero + features + get-started sections
 *   - default.html       : intro gating, FAB stack, breadcrumbs
 *   - article.html       : single H1, sidebar resolution per post_type
 *   - section archive     : sidebar + posts grid containment (e.g. /news/*)
 *   - welcome.html       : onboarding accordions
 *
 * Also covers the intro hero's meta-footer/actions layout and the global
 * keyboard-shortcuts help modal (bound from default chrome, reachable from
 * any page).
 *
 * Many sites won't have all of these URLs populated, so each test guards
 * with `test.skip()` when the route 404s. This keeps the suite green for
 * minimal fork installations while still exercising what's there.
 * ============================================================================
 */
const { test, expect } = require('@playwright/test');
const {
  VIEWPORTS,
  UI_ROUTES,
  waitForJekyll,
  gotoOrSkip,
  assertStackedVertically,
} = require('../fixtures');

test.describe('Landing layout', { tag: '@critical' }, () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
  });

  test('homepage exposes exactly one accessible h1', async ({ page }) => {
    await waitForJekyll(page, '/');
    // getByRole respects display:none / aria-hidden, so README-as-homepage
    // setups that hide the body's leading <h1> via SCSS pass cleanly.
    const headings = page.getByRole('heading', { level: 1 });
    const count = await headings.count();
    expect(count, 'A page should expose exactly one h1 for assistive tech').toBe(1);
  });

  test('features section renders from _data/landing.yml', async ({ page }) => {
    await waitForJekyll(page, '/');
    const features = page.locator('#features');
    if (await features.count() === 0) {
      test.skip(true, 'Landing layout not in use on /');
      return;
    }
    await expect(features).toBeVisible();
    // Three cards rendered by default (theme ships with three landing.features.items)
    const cards = features.locator('.landing-feature-card');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  test('hero CTA buttons expose accessible names', async ({ page }) => {
    await waitForJekyll(page, '/');
    const ctas = page.locator('.landing-hero a.btn');
    const count = await ctas.count();
    for (let i = 0; i < count; i++) {
      const cta = ctas.nth(i);
      const text = (await cta.textContent() || '').trim();
      const ariaLabel = await cta.getAttribute('aria-label');
      expect(text.length + (ariaLabel?.length ?? 0)).toBeGreaterThan(0);
    }
  });
});

test.describe('Posts archive (/pages/) — pagination', () => {
  test('active page exposes aria-current="page"', async ({ page }) => {
    await gotoOrSkip(page, '/pages/');
    const wrapper = page.locator('[data-posts-archive]');
    if (await wrapper.count() === 0) {
      test.skip(true, 'No posts archive on this site');
      return;
    }
    const active = page.locator('#pagination-controls .page-item.active .page-link');
    if (await active.count() === 0) {
      test.skip(true, 'No pagination rendered (single page of posts)');
      return;
    }
    await expect(active.first()).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('Default layout — chrome', { tag: '@critical' }, () => {
  test('breadcrumbs <nav> exposes aria-label', async ({ page }) => {
    await gotoOrSkip(page, '/about/');
    const nav = page.locator('nav.breadcrumbs[aria-label]');
    if (await nav.count() === 0) {
      test.skip(true, 'Breadcrumbs not rendered on /about/');
      return;
    }
    const label = await nav.first().getAttribute('aria-label');
    expect((label || '').length).toBeGreaterThan(0);
  });

  test('breadcrumbs are <ol> with <li> children (no orphan <i>)', async ({ page }) => {
    await gotoOrSkip(page, '/about/');
    const nav = page.locator('nav.breadcrumbs');
    if (await nav.count() === 0) {
      test.skip(true, 'Breadcrumbs not rendered on /about/');
      return;
    }
    const directIconChild = await page.evaluate(() => {
      const ol = document.querySelector('nav.breadcrumbs ol');
      if (!ol) return false;
      return Array.from(ol.children).some((c) => c.tagName === 'I');
    });
    expect(directIconChild, '<ol> children must be <li>, not <i>').toBe(false);
  });
});

test.describe('Article layout — single H1', { tag: '@critical' }, () => {
  test('article post has exactly one h1', async ({ page }) => {
    const response = await page.goto('/posts/', { waitUntil: 'domcontentloaded' });
    if (!response || response.status() >= 400) {
      test.skip(true, 'No /posts/ archive');
      return;
    }
    await page.waitForLoadState('load');
    // Click the first post link to reach an article page
    const firstPost = page.locator('article a, .post-item a').first();
    if (await firstPost.count() === 0) {
      test.skip(true, 'No posts to follow');
      return;
    }
    await firstPost.click();
    await page.waitForLoadState('load');
    const headings = page.getByRole('heading', { level: 1 });
    const count = await headings.count();
    expect(count, 'Article pages should never duplicate the post title').toBe(1);
  });
});

// =============================================================================
// Article hero — show_hero opt-in (issue #303)
// =============================================================================
// _layouts/article.html renders the page's preview: image as a top-of-article
// hero (figure.featured-hero) automatically for featured/breaking posts.
// show_hero: true opts ANY post_type into that hero without promoting the
// post (sidebar, typography and the post-type badge keep their post_type
// defaults). The flag is nil on every existing post, so default output is
// unchanged — proven by a whole-build before/after diff in
// test/visual/evidence/show-hero/ (only the opted-in post differs).
//
// Fixtures (real demo content):
//   opted-in : 2026-06-17 coffee post — standard + show_hero: true
//   control  : 2026-06-16 favicon post — standard, no flag
//   featured : 2025-01-22 git-workflow post — auto-hero, must keep working
test.describe('Article hero — show_hero opt-in (issue #303)', () => {
  const OPTED_IN = '/posts/2026/06/17/bayesian-modeled-my-coffee-and-wept-with-joy/';
  const STANDARD = '/posts/2026/06/16/favicon-ico-unlocked-door-to-collapse/';
  const FEATURED = '/posts/2025/01/22/git-workflow-best-practices/';

  test('standard post with show_hero: true renders its preview as the hero', async ({ page }) => {
    await waitForJekyll(page, OPTED_IN);
    const hero = page.locator('figure.featured-hero');
    await expect(hero).toHaveCount(1);
    const loaded = await hero.locator('img').first().evaluate((img) => img.complete && img.naturalWidth > 0);
    expect(loaded, 'hero image must actually load').toBe(true);
    // Opt-in must NOT promote the post: standard posts carry no post-type badge.
    await expect(page.locator('#page-title .badge, .post-type-badge')).toHaveCount(0);
  });

  test('standard post without the flag still renders no hero', async ({ page }) => {
    await waitForJekyll(page, STANDARD);
    await expect(page.locator('figure.featured-hero')).toHaveCount(0);
  });

  test('featured posts keep their automatic hero', async ({ page }) => {
    await waitForJekyll(page, FEATURED);
    await expect(page.locator('figure.featured-hero')).toHaveCount(1);
  });
});

test.describe('Keyboard shortcuts help modal', () => {
  test('pressing ? opens the shortcuts modal', async ({ page }) => {
    await waitForJekyll(page, '/');
    const modal = page.locator('#zer0-shortcuts-modal');
    if (await modal.count() === 0) {
      test.skip(true, 'shortcuts-modal not present');
      return;
    }
    // Ensure body is focused so the keydown reaches our document listener,
    // then dispatch a synthetic '?' keydown. Playwright's `keyboard.press`
    // for `Shift+/` does not always yield `event.key === '?'` cross-platform.
    await page.evaluate(() => document.body.focus());
    await page.evaluate(() => {
      const ev = new KeyboardEvent('keydown', {
        key: '?',
        code: 'Slash',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(ev);
    });
    await expect(modal).toHaveClass(/show/, { timeout: 2000 });
  });
});

test.describe('Welcome layout', () => {
  test('welcome page has an h1 when present', async ({ page }) => {
    await gotoOrSkip(page, '/welcome/');
    const headings = page.getByRole('heading', { level: 1 });
    expect(await headings.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Token wiring', () => {
  test('--zer0-color-primary is defined on :root', async ({ page }) => {
    await waitForJekyll(page, '/');
    const value = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--zer0-color-primary').trim()
    );
    expect(value.length, '--zer0-color-primary must resolve to a value').toBeGreaterThan(0);
  });

  test('--zer0-bp-lg is defined on :root', async ({ page }) => {
    await waitForJekyll(page, '/');
    const value = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--zer0-bp-lg').trim()
    );
    expect(value).toMatch(/^\d+px$/);
  });
});

// Dedup: the "Axe smoke — refreshed layouts (advisory)" describe block
// (homepage axe scan, threshold <25) is dropped here — it is a confirmed
// duplicate of core/accessibility.spec.js's "UI refresh smoke" per-viewport
// axe scan (same route, same axe tags), which is already stricter (<20).

test.describe('Intro hero — layout and metadata', { tag: '@critical' }, () => {
  test('meta footer wraps actions and stacks below description', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.quickstart);

    const intro = page.locator('.bd-intro');
    if ((await intro.count()) === 0) {
      test.skip(true, 'No intro on this page');
      return;
    }

    const footer = intro.locator('.bd-intro-meta-footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator('.bd-intro-actions')).toBeVisible();
    await expect(footer.locator('.bd-intro-meta-row[aria-label]')).toBeVisible();

    const description = intro.locator('.bd-intro-description');
    if (await description.count()) {
      await assertStackedVertically(expect, description.first(), footer);
    }

    const actions = footer.locator('.bd-intro-actions button, .bd-intro-actions a.btn');
    expect(await actions.count()).toBeGreaterThanOrEqual(2);
  });

  test('intro action buttons share consistent height', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.quickstartArticle);

    const buttons = page.locator('.bd-intro-actions .btn:not(.dropdown-toggle)');
    const count = await buttons.count();
    if (count < 2) {
      test.skip(true, 'Intro actions not rendered');
      return;
    }

    const heights = [];
    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) heights.push(box.height);
    }
    const maxDelta = Math.max(...heights) - Math.min(...heights);
    expect(maxDelta, 'Action buttons should be similar height').toBeLessThanOrEqual(14);
  });
});

test.describe('Section archive — sidebar and grid', { tag: '@critical' }, () => {
  test('news section page loads with layout containment', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.newsSection);

    await expect(page.locator('.section-layout, #all-posts').first()).toBeVisible();

    const sidebar = page.locator('.section-layout-sidebar, aside.section-layout-sidebar').first();
    const posts = page.locator('#all-posts').first();
    if ((await sidebar.count()) === 0 || (await posts.count()) === 0) {
      test.skip(true, 'Section sidebar or posts grid missing');
      return;
    }

    const sidebarBox = await sidebar.boundingBox();
    const postsBox = await posts.boundingBox();
    if (!sidebarBox || !postsBox) return;
    expect(postsBox.x).toBeGreaterThanOrEqual(sidebarBox.x + sidebarBox.width - 8);
  });
});
