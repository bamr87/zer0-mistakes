/**
 * Frontend styling smoke tests — bundled Bootstrap (assets/vendor) + Jekyll main.css.
 * Run: ./test/test_styling.sh   or   npm run test:styling
 * Requires a running Jekyll server; BASE_URL overrides the default origin.
 */
const { test, expect } = require('@playwright/test');

function isSameOriginStylesheet(url, baseURL) {
  try {
    const u = new URL(url);
    const b = new URL(baseURL);
    return u.origin === b.origin && u.pathname.endsWith('.css');
  } catch {
    return false;
  }
}

test.describe('Theme stylesheets', () => {
  test('same-origin CSS assets return 200', async ({ page, baseURL }) => {
    const failures = [];
    page.on('response', (res) => {
      const url = res.url();
      if (!isSameOriginStylesheet(url, baseURL)) return;
      if (res.status() !== 200) failures.push(`${res.status()} ${url}`);
    });
    await page.goto('/', { waitUntil: 'networkidle' });
    expect(failures, failures.join('; ')).toEqual([]);
  });

  test('HTML references compiled main stylesheet', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('href') || ''));
    const hasMain = hrefs.some((h) => /\.css(\?|$)/.test(h) && /main/i.test(h));
    expect(hasMain, `Expected a main*.css link, got: ${hrefs.join(', ')}`).toBe(true);
  });

  test('Bootstrap exposes CSS variables on :root (vendor + theme)', async ({ page }) => {
    await page.goto('/');
    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim()
    );
    expect(primary.length).toBeGreaterThan(0);
  });

  test('homepage does not reference common third-party CDNs for core assets', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    const banned = [
      'cdn.jsdelivr.net/npm/bootstrap',
      'cdn.jsdelivr.net/npm/bootstrap-icons',
      'code.jquery.com/jquery',
      'cdnjs.cloudflare.com/ajax/libs/font-awesome',
      'unpkg.com/github-calendar',
    ];
    for (const needle of banned) {
      expect(html.includes(needle), `Unexpected CDN reference: ${needle}`).toBe(false);
    }
  });
});

test.describe('Layout chrome', () => {
  test('desktop header and navbar render', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await expect(page.locator('header#navbar')).toBeVisible();
    // Bootstrap `.navbar` is on the wrapper div; inner element is `nav.navbar-main`
    await expect(page.locator('header#navbar .navbar.navbar-expand-lg')).toBeVisible();
    await expect(page.locator('header#navbar nav.navbar-main')).toBeVisible();
    // Brand link must exist (visibility can vary with grid/overflow; header chrome is what we guard)
    const brand = page.locator('header#navbar a.navbar-brand');
    await expect(brand).toHaveCount(1);
    await expect(brand).toBeAttached();
    await expect(brand.locator('img[alt]')).toHaveCount(1);
  });

  test('mobile main navigation toggle is visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    // Exclude offcanvas close buttons that also reference #bdNavbar
    const toggler = page.locator('.bd-navbar-toggle.d-lg-none button.navbar-toggler[data-bs-target="#bdNavbar"]');
    await expect(toggler).toBeVisible();
  });

  test('default layout page exposes docs-layout regions', async ({ page }) => {
    await page.goto('/faq/');
    await expect(page.locator('main.bd-main')).toBeVisible();
    await expect(page.locator('.bd-content')).toBeVisible();
  });
});
