// =============================================================================
// banner-inset-skip-link.spec.js — fixed chrome must not hide focus or content
// =============================================================================
// Regression guard for a keyboard/consent re-test of it-journey.dev (a theme
// consumer), at 400×800 and 1366×800:
//
//   1. The cookie banner (position: fixed, bottom) covered the bottom of the
//      page while it was up: the Back to top FAB sat fully under it at 1366,
//      and keyboard focus repeatedly landed under it (WCAG 2.4.11). While the
//      banner is visible the page now reserves its height (body padding +
//      scroll-padding-bottom) and the floating buttons are lifted above it.
//   2. "Skip to main content" was `z-3` under the fixed-top navbar (1030), so
//      it was invisible when focused (elementFromPoint hit the navbar).
//   3. On docs-style pages (default.html) the skip target #main-content wraps
//      the docs sidebar and TOC, so a skip still left ~87 Tab stops before the
//      content. default.html now points the link at #page-content.
//   4. #backToTopBtn had `outline: 0` and no other focus indicator.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll, dismissCookieConsent } = require('../fixtures');

const WIDTHS = [400, 1366];
const DOCS_ROUTE = '/docs/features/code-copy/'; // default.html: sidebar + TOC

async function bannerUp(page) {
  const banner = page.locator('#cookieConsent');
  if ((await banner.count()) === 0) test.skip(true, 'Cookie consent disabled');
  await page.waitForFunction(() => {
    const b = document.getElementById('cookieConsent');
    return b && !b.hidden && b.classList.contains('cookie-banner-visible')
      && Math.abs(b.getBoundingClientRect().bottom - window.innerHeight) < 1;
  }, undefined, { timeout: 15000 });
}

test.describe('Cookie banner reserves its space', () => {
  for (const width of WIDTHS) {
    test(`${width}px: body padding + scroll padding match the banner, FABs sit above it`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await waitForJekyll(page, '/');
      await bannerUp(page);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(400);

      const m = await page.evaluate(() => {
        const b = document.getElementById('cookieConsent').getBoundingClientRect();
        const fabs = [...document.querySelectorAll('#backToTopBtn, .pf-fab, .bd-toc-fab, .bd-sidebar-fab, #obsidianLocalGraphFab, #aiChatToggle')]
          .filter((el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 0; })
          .map((el) => ({ id: el.id || el.className, bottom: el.getBoundingClientRect().bottom }));
        return {
          banner: { top: b.top, height: b.height },
          open: document.documentElement.classList.contains('zer0-cookie-banner-open'),
          bodyPad: parseFloat(getComputedStyle(document.body).paddingBottom),
          scrollPad: parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom),
          fabs,
        };
      });
      expect(m.open).toBe(true);
      expect(Math.abs(m.bodyPad - m.banner.height), 'body padding-bottom = banner height').toBeLessThanOrEqual(1);
      expect(Math.abs(m.scrollPad - m.banner.height), 'scroll-padding-bottom = banner height').toBeLessThanOrEqual(1);
      expect(m.fabs.length, 'at least the Back to top FAB is shown').toBeGreaterThan(0);
      for (const f of m.fabs) {
        expect(f.bottom, `${f.id} sits above the banner`).toBeLessThanOrEqual(m.banner.top + 1);
      }
    });
  }

  test('a choice releases the reserved space', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 });
    await waitForJekyll(page, '/');
    await bannerUp(page);
    await page.click('#rejectAllCookies');
    await expect(page.locator('#cookieConsent')).toBeHidden();
    await expect.poll(() => page.evaluate(() => ({
      open: document.documentElement.classList.contains('zer0-cookie-banner-open'),
      pad: getComputedStyle(document.body).paddingBottom,
    }))).toEqual({ open: false, pad: '0px' });
  });

  test('keyboard focus is never left under the banner', async ({ page }) => {
    // No smooth scrolling, so each focus scroll has finished when we measure.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1366, height: 800 });
    await waitForJekyll(page, '/');
    await bannerUp(page);
    const hidden = [];
    for (let i = 0; i < 60; i += 1) {
      await page.keyboard.press('Tab');
      const r = await page.evaluate(() => {
        const el = document.activeElement;
        const banner = document.getElementById('cookieConsent');
        if (!el || el === document.body || banner.contains(el)) return null;
        const b = el.getBoundingClientRect();
        if (!b.height || getComputedStyle(el).position === 'fixed') return null;
        return { label: (el.innerText || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40), bottom: b.bottom, top: b.top, bannerTop: banner.getBoundingClientRect().top, vh: window.innerHeight };
      });
      // Any overlap with the banner counts (WCAG 2.4.11 is about partial cover too).
      if (r && r.bottom > r.bannerTop + 1 && r.top < r.vh) hidden.push(`${r.label} (${Math.round(r.top)}-${Math.round(r.bottom)})`);
    }
    expect(hidden, 'focused elements entirely under the banner').toEqual([]);
  });
});

test.describe('Skip link', () => {
  for (const width of WIDTHS) {
    test(`${width}px: focused skip link is painted above the fixed navbar`, async ({ page }) => {
      await dismissCookieConsent(page);
      await page.setViewportSize({ width, height: 800 });
      await waitForJekyll(page, '/');
      await page.keyboard.press('Tab');
      const r = await page.evaluate(() => {
        const a = document.activeElement;
        const b = a.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return { isSkip: a.classList.contains('zer0-skip-to-content'), hitIsSkip: !!hit && (hit === a || a.contains(hit)), w: b.width, h: b.height };
      });
      expect(r.isSkip, 'first Tab stop is the skip link').toBe(true);
      expect(r.w * r.h).toBeGreaterThan(0);
      expect(r.hitIsSkip, 'the skip link, not the navbar, is on top at its centre').toBe(true);
    });
  }

  test('on default.html pages it skips the docs sidebar and TOC', async ({ page }) => {
    await dismissCookieConsent(page);
    await page.setViewportSize({ width: 1366, height: 800 });
    const res = await page.goto(DOCS_ROUTE, { waitUntil: 'load' });
    test.skip(!res || res.status() >= 400, `${DOCS_ROUTE} not available`);
    const skip = page.locator('a.zer0-skip-to-content');
    await expect(skip).toHaveAttribute('href', '#page-content');
    const target = page.locator('#page-content');
    await expect(target).toHaveAttribute('tabindex', '-1');
    await skip.focus();
    await skip.press('Enter');
    await expect(target).toBeFocused();
    await page.keyboard.press('Tab');
    const where = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        inContent: !!el.closest('#page-content'),
        inChrome: !!el.closest('.bd-sidebar, .bd-toc, #navbar'),
      };
    });
    expect(where).toEqual({ inContent: true, inChrome: false });
  });
});

test.describe('Back to top focus indicator', () => {
  test('keyboard focus paints a visible outline', async ({ page }) => {
    await dismissCookieConsent(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1366, height: 800 });
    await waitForJekyll(page, '/');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const btn = page.locator('#backToTopBtn');
    await expect(btn).toBeVisible(); // shown once the page is scrolled
    // Keyboard modality: focus it, step back one stop and Tab forward again,
    // so :focus-visible matches the way it does for a keyboard user.
    await btn.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(btn, 'Back to top is reachable by Tab').toBeFocused();
    await page.waitForTimeout(250); // past the 120ms transition
    const s = await btn.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), fv: el.matches(':focus-visible') };
    });
    expect(s.fv).toBe(true);
    expect(s.style).not.toBe('none');
    expect(s.width).toBeGreaterThanOrEqual(2);
  });
});
