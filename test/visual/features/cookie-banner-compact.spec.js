// =============================================================================
// cookie-banner-compact.spec.js — the consent banner is a compact bottom bar
// =============================================================================
// Regression guard for a walkthrough of two theme consumers (it-journey.dev,
// lifehacker.dev): on a first visit the cookie banner covered most of the
// first screen. Below 768px it stacked a heading, a long sentence and three
// full-width buttons — 324px of an 850px-tall 400px-wide viewport (38%) — and
// on desktop it was 94px, sitting over the hero's lower copy.
//
// It is now one row of three equal buttons under a two-line summary on
// phones, and a single row (copy left, actions right) from 768px up.
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

// A fresh context has no `zer0-cookie-consent` in localStorage, so the banner
// shows; wait for the slide-in to finish before measuring.
async function settledBanner(page) {
  const banner = page.locator('#cookieConsent');
  if ((await banner.count()) === 0) test.skip(true, 'Cookie consent disabled');
  await page.waitForFunction(() => {
    const b = document.getElementById('cookieConsent');
    return b && !b.hidden && b.classList.contains('cookie-banner-visible')
      && Math.abs(b.getBoundingClientRect().bottom - window.innerHeight) < 1;
  }, undefined, { timeout: 15000 });
  return page.evaluate(() => {
    const b = document.getElementById('cookieConsent');
    const buttons = [...b.querySelectorAll('button')].map((x) => {
      const r = x.getBoundingClientRect();
      return { top: Math.round(r.top), w: r.width, overflow: x.scrollWidth > x.clientWidth + 1 };
    });
    return {
      height: b.getBoundingClientRect().height,
      vh: window.innerHeight,
      buttons,
      pageOverflowX: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
}

const CASES = [
  // [label, viewport, max banner height in px]
  ['phone 320', { width: 320, height: 640 }, 160],
  ['phone 400', { width: 400, height: 850 }, 150],
  ['tablet 768', { width: 768, height: 1024 }, 80],
  ['desktop 1366', { width: 1366, height: 768 }, 72],
];

test.describe('Cookie consent banner stays compact', () => {
  for (const [label, viewport, maxH] of CASES) {
    test(`${label}: one row of buttons, at most ${maxH}px tall`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await waitForJekyll(page, '/');
      const m = await settledBanner(page);

      expect(m.height, 'banner height').toBeLessThanOrEqual(maxH);
      expect(m.height / m.vh, 'banner share of the viewport').toBeLessThan(0.2);
      expect(m.buttons.length).toBe(3);
      expect(new Set(m.buttons.map((b) => b.top)).size, 'all three buttons on one row').toBe(1);
      expect(m.buttons.filter((b) => b.overflow), 'no clipped button label').toEqual([]);
      expect(m.pageOverflowX, 'no horizontal page overflow').toBe(false);
    });
  }

  test('buttons keep their accessible names on phones', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 850 });
    await waitForJekyll(page, '/');
    await settledBanner(page);
    const banner = page.getByRole('region', { name: 'Cookie consent' });
    await expect(banner.getByRole('button', { name: 'Manage' })).toBeVisible();
    await expect(banner.getByRole('button', { name: 'Reject All' })).toBeVisible();
    await expect(banner.getByRole('button', { name: 'Accept All' })).toBeVisible();
  });
});
