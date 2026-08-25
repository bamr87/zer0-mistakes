// Feature: ZER0-078
// =============================================================================
// language-toggle.spec.js — Smoke coverage for the multilingual language toggle
// =============================================================================
// The language toggle (_includes/components/language-toggle.html) is the
// visible surface of the AI-generated translation pipeline (ZER0-078,
// scripts/translate.rb). It ships as the "panel" variant inside the Settings
// offcanvas (#info-section → Appearance tab) — the navbar is reserved for main
// navigation. These tests pin the contract in a way that holds BOTH before any
// translations are generated (fresh checkout / CI) and after the translate
// workflow has landed fr/** content:
//   - the toggle lives in Settings → Appearance, NOT in the navbar
//   - it lists the source language as the active entry and EVERY configured
//     target language as either a real link (translation exists) or a disabled
//     "not yet translated" entry — never a dead link
//   - the page <html lang> reflects the page language (en on the homepage)
//   - untranslated pages emit no hreflang alternates (no bogus SEO signals)
//   - UI chrome strings resolve through the core/i18n.html fallback chain
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const PANEL = '#info-section';
const TOGGLE = `${PANEL} #zer0-lang-toggle`;
const OPTIONS = `${TOGGLE} .nav-lang-options`;

/** Open the Settings offcanvas via the Bootstrap API and wait for the show
 *  transition, so assertions land on a settled panel. */
async function openSettings(page) {
  await page.evaluate((sel) => new Promise((resolve) => {
    const el = document.querySelector(sel);
    el.addEventListener('shown.bs.offcanvas', () => resolve(), { once: true });
    window.bootstrap.Offcanvas.getOrCreateInstance(el).show();
  }), PANEL);
  await expect(page.locator(PANEL)).toBeVisible();
}

test.describe('Language toggle', { tag: '@critical' }, () => {
  test.beforeEach(async ({ page }) => {
    await waitForJekyll(page, '/');
  });

  test('lives in Settings → Appearance, not in the navbar', async ({ page }) => {
    // The navbar utility cluster must stay free for search + settings; a
    // language control there costs the menubar ~70px of label width.
    await expect(page.locator('header#navbar .nav-lang-toggle')).toHaveCount(0);
    await expect(page.locator('header#navbar #langToggleButton')).toHaveCount(0);

    await openSettings(page);
    // Appearance is the default-active pane, so the section is visible on open.
    await expect(page.locator('#appearance-pane #zer0-lang-toggle')).toBeVisible();
    await expect(page.locator(`${TOGGLE} h6`)).toHaveText(/Language/i);
    await expect(page.locator(`${TOGGLE} .bi-translate`)).toBeAttached();
  });

  test('marks the source language active', async ({ page }) => {
    await openSettings(page);

    // Exactly one active entry, and on an English page it is the source lang.
    const active = page.locator(`${OPTIONS} .list-group-item.active`);
    await expect(active).toHaveCount(1);
    await expect(active).toHaveAttribute('aria-current', 'true');
    await expect(active).toHaveText(/English/);
  });

  test('every configured target language is listed and never a dead link', async ({ page }) => {
    // The demo config ships translation.languages: [fr]. Each target must be
    // EITHER a real link to the generated translation (href starts with the
    // language prefix) OR a disabled entry — in both cases exactly one item.
    await openSettings(page);
    const frLink = page.locator(`${OPTIONS} a.list-group-item[data-lang="fr"]`);
    const frDisabled = page.locator(`${OPTIONS} span.list-group-item.disabled`, { hasText: 'Français' });
    const links = await frLink.count();
    const disabled = await frDisabled.count();
    expect(links + disabled).toBe(1);
    if (links) {
      await expect(frLink).toHaveAttribute('href', /^\/fr\//);
      await expect(frLink).toHaveAttribute('hreflang', 'fr');
    } else {
      // Disabled entries explain themselves and are marked for AT.
      await expect(frDisabled).toHaveAttribute('aria-disabled', 'true');
      await expect(frDisabled).toHaveAttribute('title', /.+/);
    }
  });

  test('homepage declares its language and no phantom alternates', async ({ page }) => {
    // Per-page <html lang> (site.locale en-US → "en" on English pages).
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    // The homepage is not a translation source → it must not emit hreflang
    // alternates (they would be bogus SEO signals).
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
    // And it is not machine-translated → no disclosure banner.
    await expect(page.locator('.translation-notice')).toHaveCount(0);
  });

  test('UI chrome strings resolve through the i18n fallback chain', async ({ page }) => {
    // core/i18n.html supplies `ui` everywhere; on an English site these
    // resolve from _data/ui-text.yml en (not the hard-coded defaults).
    await expect(page.locator('a[href="#main-content"]')).toHaveText(/Skip to main content/);
    await expect(page.locator('header .nav-search-button .nav-link-text')).toHaveText(/Search/);
  });
});
