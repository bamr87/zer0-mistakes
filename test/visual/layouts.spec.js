/**
 * ============================================================================
 * Layout & UI framework spec — landing, default, article variants, welcome
 * ----------------------------------------------------------------------------
 * These tests extend the existing visual suite with structural and
 * accessibility checks for the layouts touched by the v1.8 UI/UX framework
 * refresh:
 *
 *   - landing.html       : data-driven hero + features + get-started sections
 *   - default.html       : intro gating, FAB stack, breadcrumbs
 *   - article.html       : single H1, sidebar resolution per post_type
 *   - welcome.html       : onboarding accordions
 *
 * Many sites won't have all of these URLs populated, so each test guards
 * with `test.skip()` when the route 404s. This keeps the suite green for
 * minimal fork installations while still exercising what's there.
 * ============================================================================
 */
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { VIEWPORTS, UI_ROUTES, waitForJekyll, gotoOrSkip } = require('./fixtures');

/** Format axe violations for readable error output. */
function formatViolations(violations) {
  if (!violations.length) return 'None';
  return violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `  - ${n.html.substring(0, 100)}`).join('\n');
      return `[${v.impact}] ${v.id}: ${v.description}\n${nodes}`;
    })
    .join('\n\n');
}

test.describe('Landing layout', () => {
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

test.describe('Default layout — chrome', () => {
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

test.describe('Article layout — single H1', () => {
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

test.describe('Axe smoke — refreshed layouts (advisory)', () => {
  // These do not assert zero violations (the legacy navbar still has known
  // issues being tracked separately); they assert axe runs without crashing
  // and surfaces a violation list shorter than a sanity ceiling.
  test('homepage axe scan completes', async ({ page }) => {
    await waitForJekyll(page, '/');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(
      results.violations.length,
      `Unexpectedly high axe violation count:\n${formatViolations(results.violations)}`
    ).toBeLessThan(25);
  });
});
