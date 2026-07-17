// Feature: ZER0-078
// =============================================================================
// language-toggle.spec.js — Smoke coverage for the multilingual language toggle
// =============================================================================
// The navbar language toggle (_includes/components/language-toggle.html) is the
// visible surface of the AI-generated translation pipeline (ZER0-078,
// scripts/translate.rb). These tests pin the contract in a way that holds BOTH
// before any translations are generated (fresh checkout / CI) and after the
// translate workflow has landed fr/** content:
//   - the toggle renders in the header utility cluster with icon + a11y wiring
//   - the dropdown lists the source language as the active entry and EVERY
//     configured target language as either a real link (translation exists)
//     or a disabled "not yet translated" entry — never a dead link
//   - Bootstrap dropdown interaction works (open/close, aria-expanded)
//   - the page <html lang> reflects the page language (en on the homepage)
//   - untranslated pages emit no hreflang alternates (no bogus SEO signals)
//   - UI chrome strings resolve through the core/i18n.html fallback chain
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const TOGGLE = '#zer0-lang-toggle';
const BUTTON = '#langToggleButton';
const MENU = `${TOGGLE} .dropdown-menu`;

test.describe('Language toggle', { tag: '@critical' }, () => {
  test.beforeEach(async ({ page }) => {
    await waitForJekyll(page, '/');
  });

  test('renders in the header with icon and a11y wiring', async ({ page }) => {
    const button = page.locator(BUTTON);
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('aria-label', /.+/);
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator(`${BUTTON} .bi-translate`)).toBeAttached();
    // Current language code is shown (en on the English homepage).
    await expect(page.locator(`${BUTTON} .nav-link-text`)).toHaveText(/en/i);
  });

  test('dropdown opens and marks the source language active', async ({ page }) => {
    await page.locator(BUTTON).click();
    await expect(page.locator(MENU)).toBeVisible();
    await expect(page.locator(BUTTON)).toHaveAttribute('aria-expanded', 'true');

    // Exactly one active entry, and on an English page it is the source lang.
    const active = page.locator(`${MENU} .dropdown-item.active`);
    await expect(active).toHaveCount(1);
    await expect(active).toHaveAttribute('aria-current', 'true');
    await expect(active).toHaveText(/English/);
  });

  test('every configured target language is listed and never a dead link', async ({ page }) => {
    // The demo config ships translation.languages: [fr]. Each target must be
    // EITHER a real link to the generated translation (href starts with the
    // language prefix) OR a disabled entry — in both cases exactly one item.
    await page.locator(BUTTON).click();
    const frLink = page.locator(`${MENU} a.dropdown-item[data-lang="fr"]`);
    const frDisabled = page.locator(`${MENU} span.dropdown-item.disabled`, { hasText: 'Français' });
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
