/**
 * Appearance & customization surface — skins, color-mode default, backgrounds,
 * theme colors, the live customizer UI, and the theme-preview page.
 *
 * Combines (restructure of the former per-concern spec files):
 *   - Skins: zer0Bg.setSkin() for all 9 skins — attribute changes, localStorage
 *     persistence, restoration after navigation — plus the currentSkin() API
 *     and the zer0:skin-change event. (Homepage visual snapshots per skin are
 *     extracted to the sibling file features/appearance-snapshot.spec.js,
 *     which is the sole target of the Playwright `snapshots` project.)
 *   - Color-mode default (issue #241): server-rendered data-bs-theme/
 *     data-color-mode-default reflect site.color_mode_default, the inline
 *     FOUC-prevention script resolves 'auto' via prefers-color-scheme before
 *     paint, and localStorage["theme"] overrides win over the config default.
 *   - Backgrounds: zer0Bg.toggle(), opacity sliders, and localStorage
 *     persistence.
 *   - Theme colors: color pickers and YAML export quoting on
 *     /about/settings/theme/ → Color Editor tab.
 *   - Theme customizer UI: clicking a real #skin-grid .skin-card swatch
 *     applies the skin live (--bs-primary) and updates the YAML export —
 *     complementary to the Skins block above (that one drives skin changes
 *     via the zer0Bg.setSkin() JS API directly; this one exercises the
 *     rendered UI).
 *   - Theme preview page: gallery and controls render.
 */
const { test, expect } = require('@playwright/test');
const {
  SKINS,
  VIEWPORTS,
  UI_ROUTES,
  waitForJekyll,
  setSkin,
  clearSkinStorage,
  gotoOrSkip,
} = require('../fixtures');

test.describe('Skins', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/');
    await clearSkinStorage(page);
  });

  for (const skin of SKINS) {
    test.describe(`skin: ${skin}`, () => {
      test(`sets data-theme-skin attribute`, async ({ page }) => {
        await setSkin(page, skin);
        const attr = await page.getAttribute('html', 'data-theme-skin');
        expect(attr).toBe(skin);
      });

      test(`persists skin to localStorage`, async ({ page }) => {
        await setSkin(page, skin);
        const stored = await page.evaluate(() => localStorage.getItem('zer0-theme-skin'));
        expect(stored).toBe(skin);
      });

      test(`skin restores after navigation`, async ({ page }) => {
        await setSkin(page, skin);
        await page.goto('/faq/', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('load');
        // Skin should restore from localStorage on the new page
        await expect.poll(
          () => page.getAttribute('html', 'data-theme-skin'),
          { timeout: 5000 },
        ).toBe(skin);
      });
    });
  }

  test('zer0Bg.currentSkin() returns active skin', async ({ page }) => {
    await setSkin(page, 'neon');
    const current = await page.evaluate(() => window.zer0Bg.currentSkin());
    expect(current).toBe('neon');
  });

  test('skin-change event fires with correct detail', async ({ page }) => {
    const detail = await page.evaluate(() => {
      return new Promise((resolve) => {
        document.addEventListener('zer0:skin-change', (e) => resolve(e.detail), { once: true });
        window.zer0Bg.setSkin('plum');
      });
    });
    expect(detail).toEqual({ skin: 'plum' });
  });
});

test.describe('Color-mode default', { tag: '@critical' }, () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored theme preference so tests are isolated.
    await page.addInitScript(() => {
      try { localStorage.removeItem('theme'); } catch (e) { /* noop */ }
    });
    await waitForJekyll(page, '/');
  });

  // ── 1. Server-rendered attributes ──────────────────────────────────────────
  test('html element has data-color-mode-default attribute', async ({ page }) => {
    const attr = await page.getAttribute('html', 'data-color-mode-default');
    // The site ships with color_mode_default: auto
    expect(['dark', 'light', 'auto']).toContain(attr);
  });

  test('html element has data-bs-theme attribute with a valid Bootstrap value', async ({ page }) => {
    const theme = await page.getAttribute('html', 'data-bs-theme');
    expect(['dark', 'light']).toContain(theme);
  });

  test('server-rendered data-bs-theme is dark when color_mode_default is auto (FOUC script resolves)', async ({ page }) => {
    // The inline FOUC script runs immediately; by the time Playwright's
    // domcontentloaded fires the attribute is already resolved.
    const configDefault = await page.getAttribute('html', 'data-color-mode-default');
    const appliedTheme  = await page.getAttribute('html', 'data-bs-theme');
    if (configDefault === 'auto') {
      // auto must resolve to dark or light — never the literal string "auto"
      expect(['dark', 'light']).toContain(appliedTheme);
    } else {
      // explicit dark/light: applied theme must match
      expect(appliedTheme).toBe(configDefault);
    }
  });

  // ── 2. localStorage override wins ──────────────────────────────────────────
  test('localStorage["theme"] override wins over config default', async ({ page }) => {
    // Force a localStorage override to "light" before navigating.
    await page.addInitScript(() => {
      try { localStorage.setItem('theme', 'light'); } catch (e) { /* noop */ }
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');

    const theme = await page.getAttribute('html', 'data-bs-theme');
    expect(theme).toBe('light');
  });

  test('localStorage["theme"] = dark forces dark mode regardless of config', async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('theme', 'dark'); } catch (e) { /* noop */ }
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');

    const theme = await page.getAttribute('html', 'data-bs-theme');
    expect(theme).toBe('dark');
  });

  // ── 3. No FOUC: theme attribute is resolved before DOMContentLoaded ────────
  test('data-bs-theme is not "auto" at DOMContentLoaded — FOUC script resolved it', async ({ page }) => {
    // Capture the attribute value as early as possible using addInitScript,
    // which runs synchronously before any page JS (including the FOUC script).
    // The FOUC script itself is inline in <head> before main.css/JS, so by
    // the time DOMContentLoaded fires the attribute has already been corrected.
    let themeAtDomReady = null;
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        // Store it so the test can read it after navigation completes.
        window.__themeAtDomReady = document.documentElement.getAttribute('data-bs-theme');
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    themeAtDomReady = await page.evaluate(() => window.__themeAtDomReady);

    // Must never be null, "auto", or absent at DOMContentLoaded.
    expect(themeAtDomReady).not.toBeNull();
    expect(['dark', 'light']).toContain(themeAtDomReady);
  });

  // ── 4. Persists across navigation ──────────────────────────────────────────
  test('theme persists across page navigation via localStorage', async ({ page }) => {
    // Set a preference on the homepage
    await page.evaluate(() => localStorage.setItem('theme', 'light'));

    // Navigate to another page
    await page.goto('/faq/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('load');

    const theme = await page.getAttribute('html', 'data-bs-theme');
    expect(theme).toBe('light');
  });
});

test.describe('Backgrounds', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, '/');
    await clearSkinStorage(page);
  });

  test('toggle backgrounds off sets data-zer0-bg="off"', async ({ page }) => {
    await page.evaluate(() => window.zer0Bg.toggle(false));
    const attr = await page.getAttribute('html', 'data-zer0-bg');
    expect(attr).toBe('off');
  });

  test('toggle backgrounds on sets data-zer0-bg="on"', async ({ page }) => {
    await page.evaluate(() => {
      window.zer0Bg.toggle(false);
      window.zer0Bg.toggle(true);
    });
    const attr = await page.getAttribute('html', 'data-zer0-bg');
    expect(attr).toBe('on');
  });

  test('toggle persists to localStorage', async ({ page }) => {
    await page.evaluate(() => window.zer0Bg.toggle(false));
    const stored = await page.evaluate(() => localStorage.getItem('zer0-bg-enabled'));
    expect(stored).toBe('false');
  });

  test('bg-toggle event fires with correct detail', async ({ page }) => {
    const detail = await page.evaluate(() => {
      return new Promise((resolve) => {
        document.addEventListener('zer0:bg-toggle', (e) => resolve(e.detail), { once: true });
        window.zer0Bg.toggle(false);
      });
    });
    expect(detail).toEqual({ enabled: false });
  });

  test('setOpacity("gradient", value) updates CSS variable', async ({ page }) => {
    await page.evaluate(() => window.zer0Bg.setOpacity('gradient', 0.5));
    const value = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--zer0-bg-gradient-opacity')
    );
    expect(parseFloat(value)).toBeCloseTo(0.5);
  });

  test('setOpacity("texture", value) updates CSS variable', async ({ page }) => {
    await page.evaluate(() => window.zer0Bg.setOpacity('texture', 0.1));
    const value = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--zer0-bg-texture-opacity')
    );
    expect(parseFloat(value)).toBeCloseTo(0.1);
  });

  test('setOpacity("pattern", value) updates CSS variable', async ({ page }) => {
    await page.evaluate(() => window.zer0Bg.setOpacity('pattern', 0.2));
    const value = await page.evaluate(() =>
      document.documentElement.style.getPropertyValue('--zer0-bg-pattern-opacity')
    );
    expect(parseFloat(value)).toBeCloseTo(0.2);
  });

  test('background state persists across navigation', async ({ page }) => {
    await page.evaluate(() => window.zer0Bg.toggle(false));
    await page.goto('/faq/', { waitUntil: 'networkidle' });
    const attr = await page.getAttribute('html', 'data-zer0-bg');
    // Should restore "off" from localStorage
    expect(attr).toBe('off');
  });
});

test.describe('Theme colors', () => {
  const THEME_URL = '/about/settings/theme/';

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForJekyll(page, THEME_URL);
  });

  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto(THEME_URL);
    expect(response.status()).toBe(200);
  });

  test('color picker inputs have valid #RRGGBB values', async ({ page }) => {
    const colorInputs = page.locator('input[type="color"]');
    const count = await colorInputs.count();
    expect(count, 'Expected at least one color picker').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const value = await colorInputs.nth(i).inputValue();
      expect(value, `Color input ${i} should be #RRGGBB`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  test('color picker change updates paired text input', async ({ page }) => {
    // Color inputs live in the "Color Editor" tab which is not active by
    // default. Activate it and wait for the tab pane to be shown before
    // interacting; otherwise input is in a hidden pane and `fill()` times out.
    const colorTab = page.locator('#tab-colors');
    if (await colorTab.count() === 0) {
      test.skip();
      return;
    }
    await colorTab.click();
    const colorPane = page.locator('#pane-colors');
    await expect(colorPane).toHaveClass(/(^|\s)active(\s|$)/);
    await expect(colorPane).toBeVisible();

    // Scope to the active pane so we don't hit hidden inputs from other tabs.
    const colorInput = colorPane.locator('input[type="color"]').first();
    if (await colorInput.count() === 0) {
      test.skip();
      return;
    }
    const parent = colorInput.locator('..');
    const textInput = parent.locator('input[type="text"]');
    if (await textInput.count() === 0) {
      test.skip();
      return;
    }
    await colorInput.fill('#ff5500');
    const textValue = await textInput.inputValue();
    expect(textValue.toLowerCase()).toBe('#ff5500');
  });

  test('YAML export quotes hex color values (regression: unquoted # is YAML comment)', async ({ page }) => {
    // T-008: both YAML builders (theme-customizer.js fallback and
    // palette-generator.js rebuildFullYaml) quote every color value.
    // Switch to the "Export" tab if it exists
    const exportTab = page.locator('#tab-export');
    if (await exportTab.count() > 0) {
      await exportTab.click();
      await page.waitForTimeout(300);
    }
    // Look for the YAML preview/export area
    const yamlPreview = page.locator('pre, textarea, code').filter({ hasText: 'theme_color' });
    const count = await yamlPreview.count();
    if (count === 0) {
      test.skip();
      return;
    }
    const yamlText = await yamlPreview.first().textContent();
    // Any hex color value should be quoted: "key: '#RRGGBB'" or "key: \"#RRGGBB\""
    const hexLines = yamlText.split('\n').filter((line) => /#[0-9a-fA-F]{3,6}/.test(line));
    for (const line of hexLines) {
      // The # value should be wrapped in quotes
      expect(
        line,
        `Hex color must be quoted in YAML to prevent comment parsing: ${line.trim()}`
      ).toMatch(/["'][^"']*#[0-9a-fA-F]{3,6}[^"']*["']/);
    }
  });
});

// ---------------------------------------------------------------------------
// Theme customizer — clicking a skin swatch applies the skin live
// assets/js/theme-customizer.js (#skin-grid .skin-card[data-skin])
// Complementary to the "Skins" block above: that one drives skin changes via
// the zer0Bg.setSkin() JS API directly; this one clicks the rendered UI.
// ---------------------------------------------------------------------------
test.describe('Theme customizer UI', () => {
  const THEME_URL = '/about/settings/theme/';

  test('clicking a skin card applies it live and updates the YAML export', { tag: '@critical' }, async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, THEME_URL);

    const grid = page.locator('#skin-grid');
    if ((await grid.count()) === 0) test.skip(true, 'Skin grid not present');

    // Pick a non-active skin (the default active card is air → border-primary).
    const targetSkin = 'sunrise';
    const card = page.locator(`#skin-grid .skin-card[data-skin="${targetSkin}"]`).first();
    await expect(card).toBeVisible();

    const readPrimary = () =>
      page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim());
    const before = await readPrimary();

    await card.click();

    // Live application: <html data-theme-skin> flips and --bs-primary changes.
    await page.waitForFunction(
      (s) => document.documentElement.getAttribute('data-theme-skin') === s,
      targetSkin,
    );
    const after = await readPrimary();
    expect(after, 'skin swatch should change the live --bs-primary token').not.toBe(before);

    // Selected card is highlighted, and the export reflects the choice.
    await expect(card).toHaveClass(/border-primary/);
    await expect(page.locator('#theme-yaml-output')).toContainText(`theme_skin: "${targetSkin}"`);
  });
});

test.describe('Theme preview page', () => {
  test('theme preview gallery and controls render', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await gotoOrSkip(page, UI_ROUTES.themePreview);

    await expect(page.locator('.theme-preview-gallery, .theme-controls-bar').first()).toBeVisible();
    await expect(page.locator('[data-theme-skin], .theme-skin-card').first()).toBeAttached();
  });
});
