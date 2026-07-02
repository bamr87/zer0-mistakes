/**
 * Mobile responsive regression suite.
 *
 * Runs under real phone emulation (Pixel 5 profile: mobile viewport, touch,
 * mobile UA) — unlike the desktop-window specs, this exercises the mobile
 * layout-viewport behaviour where ANY uncontained content overflow widens the
 * initial containing block, so the fixed header renders wider than the visual
 * viewport and the page pans sideways ("navbar looks cut off").
 *
 * Guards the defects found in the 2026-07 mobile audit:
 *
 *   1. Author card ("About the Author"): a long nowrap expertise badge used to
 *      propagate through flexbox min-width:auto and push the page past the
 *      viewport on small phones (≤340px).
 *   2. Cookie consent banner: the .zer0-bg-body elevation rule flattened the
 *      banner (and #tocFab) to z-index 1, so the chat / local-graph FABs
 *      painted over the banner and stole taps from its Reject/Accept buttons.
 *   3. Footer link tap targets: text links ~19px tall and icon-only social
 *      links ~16px wide were under the WCAG 2.5.8 24px minimum.
 *   4. Code-copy buttons: ~22px tall; must be ≥24px (≥32px on coarse/touch
 *      pointers).
 *   5. Navbar chrome (offcanvas menu, search modal) stays within the viewport
 *      and its controls remain tappable at phone sizes.
 *
 * Runs in the platform-independent `smoke` tier (no pixel screenshots).
 */
const { test, expect, devices } = require('@playwright/test');
const { waitForJekyll, gotoOrSkip, dismissCookieConsent } = require('./fixtures');

// Full phone emulation. Chromium-based so it runs in every tier/browser lane
// that includes this spec under the default chromium install.
const PHONE = devices['Pixel 5'];
test.use({ ...PHONE });

/** Post route with a full "About the Author" card (skipped if unavailable). */
const AUTHOR_CARD_ROUTE = '/posts/2026/06/18/trailing-slash-that-could-end-your-company/';

/** In-page: page-level layout state a phone user experiences. */
function measurePage() {
  const icb = document.documentElement.clientWidth;
  const header = document.getElementById('navbar');
  const hb = header ? header.getBoundingClientRect() : null;
  return {
    icb,
    scrollWidth: document.documentElement.scrollWidth,
    headerWidth: hb ? Math.round(hb.width) : null,
  };
}

test.describe('Mobile — author card stays within small-phone viewports', () => {
  for (const width of [320, 360, 393]) {
    test(`stress-filled author card does not widen the page @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await gotoOrSkip(page, AUTHOR_CARD_ROUTE);

      const card = page.locator('.author-card');
      if ((await card.count()) === 0) test.skip(true, 'No .author-card on this route');

      // Stress: inject a very long single-word badge and a long name — the
      // historical failure mode — so the guard survives content edits.
      await page.evaluate(() => {
        const chips = document.querySelector('.author-card .author-expertise');
        if (chips) {
          const b = document.createElement('span');
          b.className = 'badge rounded-pill text-bg-light border';
          b.textContent = 'Extremely-long-unbreakable-expertise-chip-label';
          chips.appendChild(b);
        }
        const title = document.querySelector('.author-card .card-title');
        if (title) title.prepend('UnreasonablyLongAuthorHandleName ');
      });

      const m = await page.evaluate(measurePage);
      expect(m.scrollWidth, 'page must not scroll sideways').toBeLessThanOrEqual(m.icb + 1);
      expect(m.headerWidth, 'fixed header must span exactly the viewport').toBeLessThanOrEqual(m.icb + 2);

      const box = await card.boundingBox();
      expect(box.x + box.width, 'author card must stay within the viewport').toBeLessThanOrEqual(m.icb + 1);
    });
  }
});

test.describe('Mobile — cookie consent banner sits above the FABs', () => {
  test('banner outranks FABs and its buttons receive taps edge-to-edge', async ({ page }) => {
    await waitForJekyll(page, AUTHOR_CARD_ROUTE);

    const banner = page.locator('#cookieConsent');
    if ((await banner.count()) === 0) test.skip(true, 'Cookie consent disabled');
    await expect(banner).toBeVisible({ timeout: 10000 });
    // The banner slides in (translateY(100%) → 0). toBeVisible passes before
    // the transform settles, and hit-testing a mid-transition banner probes
    // stale coordinates — wait for the entrance to finish.
    await page.waitForFunction(() => {
      const b = document.getElementById('cookieConsent');
      if (!b || b.hidden || !b.classList.contains('cookie-banner-visible')) return false;
      const t = getComputedStyle(b).transform;
      return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
    });

    const layers = await page.evaluate(() => {
      const z = (el) => (el ? parseInt(getComputedStyle(el).zIndex, 10) || 0 : null);
      const banner = document.getElementById('cookieConsent');
      const fabs = ['tocFab', 'aiChatToggle', 'obsidianLocalGraphFab', 'backToTopBtn']
        .map((id) => document.getElementById(id))
        .filter(Boolean)
        .filter((el) => getComputedStyle(el).display !== 'none');
      return { bannerZ: z(banner), fabZs: fabs.map(z) };
    });
    for (const fabZ of layers.fabZs) {
      expect(layers.bannerZ, 'banner must stack above every FAB').toBeGreaterThan(fabZ);
    }

    // Sample left/center/right of each consent button: every point must hit
    // the button (an overlapping FAB steals the tap even when the center is fine).
    const blocked = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('#cookieConsent button').forEach((b) => {
        const r = b.getBoundingClientRect();
        if (r.width === 0) return;
        const pts = [
          [r.x + 6, r.y + r.height / 2],
          [r.x + r.width / 2, r.y + r.height / 2],
          [r.x + r.width - 6, r.y + r.height / 2],
        ];
        const misses = pts.filter(([x, y]) => {
          const at = document.elementFromPoint(x, y);
          return !(at === b || b.contains(at));
        }).length;
        if (misses > 0) out.push({ button: b.textContent.trim().slice(0, 20), misses });
      });
      return out;
    });
    expect(blocked, 'no consent button may be covered by another fixed element').toEqual([]);
  });
});

test.describe('Mobile — tap targets meet the 24px minimum (WCAG 2.5.8)', () => {
  test('footer links and social icons are at least 24px', async ({ page }) => {
    await waitForJekyll(page, '/');
    const small = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.footer-dark-block a').forEach((a) => {
        const r = a.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.height < 24 || r.width < 24) {
          out.push({ link: (a.textContent.trim() || a.getAttribute('aria-label') || a.className).slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) });
        }
      });
      return out;
    });
    expect(small, 'every footer link needs a ≥24px tap target').toEqual([]);
  });

  test('code-copy buttons are at least 24px tall (32px on touch)', async ({ page }) => {
    await gotoOrSkip(page, '/docs/features/code-copy/');
    const btn = page.locator('button.copy').first();
    await expect(btn).toBeAttached({ timeout: 10000 });
    const sizes = await page.evaluate(() =>
      [...document.querySelectorAll('button.copy')].slice(0, 5).map((b) => {
        const r = b.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      })
    );
    expect(sizes.length).toBeGreaterThan(0);
    for (const s of sizes) {
      // Pixel emulation reports a coarse pointer → the touch tier applies.
      expect(s.h, `copy button ${JSON.stringify(s)} under touch minimum`).toBeGreaterThanOrEqual(32);
    }
  });

  test('offcanvas menu items are at least 24px tall', async ({ page }) => {
    await dismissCookieConsent(page);
    await waitForJekyll(page, '/');
    const toggler = page.locator('.bd-navbar-toggle.d-lg-none button.navbar-toggler[data-bs-target="#bdNavbar"]');
    await toggler.click();
    await page.waitForFunction(() => document.getElementById('bdNavbar')?.classList.contains('show'));
    const small = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('#bdNavbar .navbar-nav > li > a, #bdNavbar .navbar-nav > li > button').forEach((el) => {
        if (el.offsetParent === null) return;
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.height < 24) out.push({ item: el.textContent.trim().slice(0, 20), h: Math.round(r.height) });
      });
      return out;
    });
    expect(small).toEqual([]);
  });
});

test.describe('Mobile — navbar chrome fits and works at phone size', () => {
  test('search opens from the utility cluster and the dialog fits the viewport', async ({ page }) => {
    await dismissCookieConsent(page);
    await waitForJekyll(page, '/');
    const trigger = page.locator('#navbar .navbar-utility-controls [data-search-toggle]');
    await expect(trigger).toBeVisible();

    const tb = await trigger.boundingBox();
    expect(tb.width, 'search trigger tap target').toBeGreaterThanOrEqual(24);
    expect(tb.height, 'search trigger tap target').toBeGreaterThanOrEqual(24);

    await trigger.click();
    const dialog = page.locator('.modal.show .modal-dialog').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });

    const vw = await page.evaluate(() => document.documentElement.clientWidth);
    const box = await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, 'search dialog must fit the viewport').toBeLessThanOrEqual(vw + 1);
  });

  test('settings panel opens from the offcanvas menu and fits the viewport', async ({ page }) => {
    await dismissCookieConsent(page);
    await waitForJekyll(page, '/');
    const toggler = page.locator('.bd-navbar-toggle.d-lg-none button.navbar-toggler[data-bs-target="#bdNavbar"]');
    await toggler.click();
    await page.waitForFunction(() => {
      const p = document.getElementById('bdNavbar');
      if (!p || !p.classList.contains('show')) return false;
      const t = getComputedStyle(p).transform;
      return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
    });

    const settings = page.locator('#bdNavbar [data-bs-target="#info-section"]');
    if ((await settings.count()) === 0) test.skip(true, 'Settings entry not present in offcanvas');
    await settings.click();

    const panel = page.locator('#info-section');
    await expect(panel).toBeVisible({ timeout: 10000 });
    await page.waitForFunction(() => {
      const p = document.getElementById('info-section');
      if (!p || !p.classList.contains('show')) return false;
      const t = getComputedStyle(p).transform;
      return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
    });

    const vw = await page.evaluate(() => document.documentElement.clientWidth);
    const box = await panel.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width, 'settings panel must fit the viewport').toBeLessThanOrEqual(vw + 1);
  });
});
