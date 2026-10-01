/**
 * Skin ↔ theme_color token precedence (issue #459).
 *
 * The skin palette mixin (_sass/theme/_skins.scss) and the site-level
 * `theme_color` block (_includes/core/tokens-inline.html) both write
 * --zer0-color-primary / -link / -accent. The rule: the active skin wins for
 * every token the mixin sets; `theme_color` still applies where there is no
 * conflict — the tokens the mixin does not set, and skins with no palette
 * (dark, contrast). The Appearance-panel inline style outranks both.
 *
 * Expected values come from this repo's _config.yml `theme_color`.
 */
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, waitForJekyll, setSkin, clearSkinStorage } = require('../fixtures');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CONFIG = { main: '#007bff', blue: '#007bff', purple: '#6f42c1', red: '#a11111' };

const readTokens = (page) =>
  page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    const v = (n) => s.getPropertyValue(n).trim().toLowerCase();
    return {
      zer0Primary: v('--zer0-color-primary'),
      zer0PrimaryRgb: v('--zer0-color-primary-rgb'),
      zer0Link: v('--zer0-color-link'),
      zer0Accent: v('--zer0-color-accent'),
      zer0Danger: v('--zer0-color-danger'),
      bsPrimary: v('--bs-primary'),
      bsLink: v('--bs-link-color'),
    };
  });

const rgbToHex = (rgb) =>
  '#' + rgb.split(',').map((n) => Number(n.trim()).toString(16).padStart(2, '0')).join('');

test.describe('Skin token precedence — source parity', () => {
  test('palette_skins in tokens-inline.html matches the skins _skins.scss gives a palette', () => {
    const scss = fs.readFileSync(path.join(ROOT, '_sass/theme/_skins.scss'), 'utf8');
    const fromScss = [...scss.matchAll(/^\[data-theme-skin="([a-z-]+)"\]\s*\{\s*@include zer0-skin-palette/gm)]
      .map((m) => m[1]).sort();
    const liquid = fs.readFileSync(path.join(ROOT, '_includes/core/tokens-inline.html'), 'utf8');
    const m = liquid.match(/assign palette_skins = "([^"]+)"/);
    expect(m, 'tokens-inline.html must assign palette_skins').not.toBeNull();
    expect(m[1].split(',').sort()).toEqual(fromScss);
  });
});

test.describe('Skin token precedence', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/');
    await clearSkinStorage(page);
  });

  // Two skins with different brands, so a pass cannot be a coincidence.
  for (const skin of ['neon', 'air']) {
    test(`${skin}: every --zer0-color-* the mixin sets follows the skin`, async ({ page }) => {
      await setSkin(page, skin);
      const t = await readTokens(page);
      expect(t.zer0Primary, '--zer0-color-primary must equal --bs-primary').toBe(t.bsPrimary);
      expect(t.zer0Primary).not.toBe(CONFIG.main);
      expect(t.zer0Link, '--zer0-color-link must equal --bs-link-color').toBe(t.bsLink);
      expect(t.zer0Accent, '--zer0-color-accent must come from the skin').not.toBe(CONFIG.purple);
      expect(rgbToHex(t.zer0PrimaryRgb), '-rgb must describe the same color').toBe(t.zer0Primary);
    });
  }

  test('skin switch moves --zer0-color-primary (neon → air)', async ({ page }) => {
    await setSkin(page, 'neon');
    const neon = (await readTokens(page)).zer0Primary;
    await setSkin(page, 'air');
    const air = (await readTokens(page)).zer0Primary;
    expect(neon).not.toBe(air);
  });

  test('tokens the mixin does not set still come from theme_color', async ({ page }) => {
    await setSkin(page, 'neon');
    expect((await readTokens(page)).zer0Danger).toBe(CONFIG.red);
  });

  for (const skin of ['dark', 'contrast']) {
    test(`${skin} (no palette): theme_color still sets primary/link/accent`, async ({ page }) => {
      await setSkin(page, skin);
      const t = await readTokens(page);
      expect(t.zer0Primary).toBe(CONFIG.main);
      expect(t.zer0Link).toBe(CONFIG.blue);
      expect(t.zer0Accent).toBe(CONFIG.purple);
    });
  }

  test('Appearance-panel override outranks both layers', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('zer0-appearance', JSON.stringify({ primary: '#ff5722' })));
    await page.reload({ waitUntil: 'load' });
    try {
      await setSkin(page, 'neon');
      expect((await readTokens(page)).zer0Primary).toBe('#ff5722');
    } finally {
      await page.evaluate(() => localStorage.removeItem('zer0-appearance'));
    }
  });
});
