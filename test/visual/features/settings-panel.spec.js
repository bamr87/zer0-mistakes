// =============================================================================
// settings-panel.spec.js — Smoke coverage for the Settings offcanvas rebuild
// =============================================================================
// The navbar Settings panel (#info-section, feature ZER0-077) was rebuilt from
// four tabs (Settings/Environment/Developer/Background) into three
// (Appearance/Site/Developer). These smoke tests pin the new contract:
//   - three tabs wired to their panes; the retired panes/ids are gone
//   - Appearance owns ALL look-and-feel controls exactly once: one color-mode
//     segmented control (halfmoon), 9 skin buttons, background toggle +
//     opacity sliders, and the appearance.js primary-color picker mounted
//     INSIDE the tab (not appended below the tab content)
//   - clicking a color-mode button flips html[data-bs-theme] and active state
//   - Site tab: environment card, copyable page URL, admin quick links that
//     resolve to real pages (the pure-Liquid admin-links include)
//   - Developer tab: page metadata; Page Location only where breadcrumbs render
//   - the panel body never scrolls horizontally, even at 320px
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const PANEL = '#info-section';

/** Open the settings offcanvas via the Bootstrap API and wait for the
 *  show transition so tab clicks land on a settled panel. */
async function openSettings(page) {
  await page.evaluate((sel) => new Promise((resolve) => {
    const el = document.querySelector(sel);
    el.addEventListener('shown.bs.offcanvas', () => resolve(), { once: true });
    window.bootstrap.Offcanvas.getOrCreateInstance(el).show();
  }), PANEL);
  await expect(page.locator(PANEL)).toBeVisible();
}

test.describe('Settings offcanvas (rebuilt)', () => {
  test.beforeEach(async ({ page }) => {
    await waitForJekyll(page, '/');
    await expect(page.locator(PANEL)).toBeAttached();
  });

  test('exposes exactly three tabs wired to their panes', async ({ page }) => {
    await openSettings(page);

    const tabs = page.locator('#infoTabs [data-bs-toggle="tab"]');
    await expect(tabs).toHaveCount(3);
    await expect(page.locator('#appearance-tab')).toHaveText(/Appearance/);
    await expect(page.locator('#site-tab')).toHaveText(/Site/);
    await expect(page.locator('#developer-tab')).toHaveText(/Developer/);

    // Appearance is the default-active pane.
    await expect(page.locator('#appearance-pane')).toHaveClass(/active/);

    // Retired surfaces must be gone: old pane ids and the dead search box.
    for (const gone of ['#settings-pane', '#environment-pane', '#background-pane', `${PANEL} #searchbox`]) {
      await expect(page.locator(gone)).toHaveCount(0);
    }

    // Tab switching activates the target pane.
    await page.click('#site-tab');
    await expect(page.locator('#site-pane')).toHaveClass(/active/);
    await page.click('#developer-tab');
    await expect(page.locator('#developer-pane')).toHaveClass(/active/);
  });

  test('Appearance tab owns each look-and-feel control exactly once', async ({ page }) => {
    await openSettings(page);
    const pane = page.locator('#appearance-pane');

    // One color-mode segmented control (3 buttons) — inside the pane, and no
    // second copy injected elsewhere in the panel (the old appearance.js
    // fallback appended a duplicate below the tab content).
    await expect(pane.locator('[data-bs-theme-value]')).toHaveCount(3);
    await expect(page.locator(`${PANEL} [data-bs-theme-value]`)).toHaveCount(3);
    await expect(page.locator(`${PANEL} .offcanvas-body > .zer0-appearance-panel`)).toHaveCount(0);

    // Skin buttons, background toggle, three opacity sliders, reset.
    await expect(pane.locator('#zer0SkinButtons [data-skin]')).toHaveCount(9);
    await expect(pane.locator('#zer0BgToggle')).toBeAttached();
    for (const slider of ['#zer0GradientOpacity', '#zer0TextureOpacity', '#zer0PatternOpacity']) {
      await expect(pane.locator(slider)).toBeAttached();
    }
    await expect(pane.locator('#zer0BgReset')).toBeAttached();

    // appearance.js (site.appearance_panel: true on the demo site) mounts the
    // primary-color picker into the slot inside this tab.
    await expect(pane.locator('#zer0AppearanceSlot .zer0-appearance-panel')).toHaveCount(1);
    await expect(pane.locator('#zer0-appearance-primary')).toBeAttached();
  });

  test('color-mode buttons flip html[data-bs-theme] and sync active state', { tag: '@critical' }, async ({ page }) => {
    await openSettings(page);

    const dark = page.locator(`${PANEL} [data-bs-theme-value="dark"]`);
    await dark.click();
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark');
    await expect(dark).toHaveClass(/active/);
    await expect(dark).toHaveAttribute('aria-pressed', 'true');

    const light = page.locator(`${PANEL} [data-bs-theme-value="light"]`);
    await light.click();
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light');
    await expect(light).toHaveClass(/active/);
    await expect(dark).toHaveAttribute('aria-pressed', 'false');
  });

  test('Site tab surfaces environment, copyable URL, and live admin links', async ({ page }) => {
    await openSettings(page);
    await page.click('#site-tab');
    const pane = page.locator('#site-pane');

    // Environment card + copyable current-page URL (delegated copy handler).
    await expect(pane.locator('#currentUrlInput')).toBeAttached();
    await expect(pane.locator('[data-zer0-copy-target="#currentUrlInput"]')).toBeAttached();

    // Prod/Dev quick-link rows with copy buttons.
    await expect(pane.locator('[data-zer0-copy]')).toHaveCount(2);

    // Admin quick links (pure-Liquid admin-links include): every rendered
    // link must resolve to a page that exists in this build.
    const adminHrefs = await pane.locator('a[href^="/about/"]').evaluateAll(
      (as) => as.map((a) => a.getAttribute('href')),
    );
    expect(adminHrefs.length, 'demo site ships the admin pages').toBeGreaterThanOrEqual(4);
    for (const href of adminHrefs) {
      const res = await page.request.get(href);
      expect(res.status(), `${href} must exist`).toBe(200);
    }
  });

  test('Developer tab shows page metadata; Page Location only where breadcrumbs render', async ({ page }) => {
    await openSettings(page);
    await page.click('#developer-tab');
    const pane = page.locator('#developer-pane');

    // Metadata table lists the core rows.
    await expect(pane.locator('table')).toContainText('Layout');
    await expect(pane.locator('table')).toContainText('Path');

    // Homepage renders no breadcrumbs, so the section heading must not
    // render either (no empty "Page Location" header).
    await expect(pane.locator('.breadcrumbs')).toHaveCount(0);
    await expect(pane).not.toContainText('Page Location');

    // A collection page renders breadcrumbs, so the section appears.
    await waitForJekyll(page, '/docs/');
    await openSettings(page);
    await page.click('#developer-tab');
    const docsPane = page.locator('#developer-pane');
    await expect(docsPane).toContainText('Page Location');
    await expect(docsPane.locator('.breadcrumbs')).toHaveCount(1);
  });

  test('panel body never scrolls horizontally at 320px', { tag: '@critical' }, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await waitForJekyll(page, '/');
    await openSettings(page);

    for (const tab of ['#appearance-tab', '#site-tab', '#developer-tab']) {
      await page.click(tab);
      const m = await page.evaluate(() => {
        const body = document.querySelector('#info-section .offcanvas-body');
        return { scrollW: body.scrollWidth, clientW: body.clientWidth };
      });
      expect(m.scrollW, `${tab} pane must not overflow sideways`).toBeLessThanOrEqual(m.clientW + 1);
    }

    // Compact tabs keep their text labels (they are the accessible names).
    for (const label of ['Appearance', 'Site', 'Developer']) {
      await expect(page.locator('#infoTabs')).toContainText(label);
    }
  });
});
