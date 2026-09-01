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
//   - it marks the source language as current and lists EVERY configured target
//     language as a real link — never a dead entry
//   - the page <html lang> reflects the page language (en on the homepage)
//   - untranslated pages emit no hreflang alternates (no bogus SEO signals)
//   - UI chrome strings resolve through the core/i18n.html fallback chain
//
// T-038 / #406 changed the menu contract, and these tests changed with it:
//   - NO disabled rows. A target without a generated translation used to be a
//     `span.list-group-item.disabled` carrying its own "(Not yet translated)"
//     text. It is now a LINK to the source page, marked `.is-untranslated`,
//     described by ONE footnote. The old assertion accepted "disabled OR link";
//     the replacement requires a link and forbids `.disabled` outright, so it
//     is strictly tighter than what it replaced.
//   - The current row is `.nav-lang-item.is-current` (tint + check icon), not
//     `.list-group-item.active` (primary fill).
//   - Machine-generated translations carry an `.nav-lang-auto` chip; the
//     human-written source language must not.
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

  test('marks the source language current with a tint and check, not a primary fill', async ({ page }) => {
    await openSettings(page);

    // Exactly one current entry, and on an English page it is the source lang.
    const current = page.locator(`${OPTIONS} .nav-lang-item.is-current`);
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute('aria-current', 'true');
    await expect(current).toHaveText(/English/);
    await expect(current.locator('.nav-lang-check')).toBeAttached();

    // T-038: `.active` is Bootstrap's primary fill and read as a selected nav
    // item rather than "you are here". It must not come back.
    await expect(page.locator(`${OPTIONS} .active`)).toHaveCount(0);

    // The source language is human-written — it must never carry the auto chip.
    await expect(current.locator('.nav-lang-auto')).toHaveCount(0);
  });

  test('no row is disabled — every configured target language is a live link', async ({ page }) => {
    // The demo config ships translation.languages: [fr]. Whether or not the
    // translation has been generated, the row is a link: to /fr/… when it
    // exists, and to the source page (marked, footnoted) when it does not.
    await openSettings(page);

    await expect(page.locator(`${OPTIONS} .disabled`)).toHaveCount(0);
    await expect(page.locator(`${OPTIONS} [aria-disabled="true"]`)).toHaveCount(0);

    const fr = page.locator(`${OPTIONS} a.nav-lang-item[data-lang="fr"]`);
    await expect(fr).toHaveCount(1);
    await expect(fr).toHaveAttribute('href', /.+/);

    if (await fr.evaluate((el) => el.classList.contains('is-untranslated'))) {
      // Falls back to the source page, so hreflang must describe the
      // DESTINATION (the source language), not the language that was clicked.
      await expect(fr).toHaveAttribute('hreflang', 'en');
      // The reason lives in one footnote, referenced from the row — not in
      // per-row text, which is what used to make the menu wide.
      const noteId = await fr.getAttribute('aria-describedby');
      expect(noteId).toBeTruthy();
      await expect(page.locator(`#${noteId}`)).toHaveText(/not yet translated/i);
      // …and exactly one footnote, however many languages are missing.
      await expect(page.locator(`${TOGGLE} .nav-lang-note`)).toHaveCount(1);
      await expect(fr.locator('.nav-lang-auto')).toHaveCount(0);
    } else {
      await expect(fr).toHaveAttribute('href', /^\/fr\//);
      await expect(fr).toHaveAttribute('hreflang', 'fr');
      // A generated translation is machine-made and says so.
      await expect(fr.locator('.nav-lang-auto')).toHaveText(/auto/i);
    }
  });

  test('every menu row records the language preference when clicked', async ({ page }) => {
    // The delegated handler in the include only fires on `a[data-lang]`. When
    // untranslated rows were `span.disabled` they could not record anything;
    // now that they are links, the preference must survive the fallback too.
    await openSettings(page);
    const rows = page.locator(`${OPTIONS} a.nav-lang-item`);
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      await expect(rows.nth(i)).toHaveAttribute('data-lang', /.+/);
    }

    await page.evaluate(() => localStorage.removeItem('zer0-lang'));
    const first = rows.first();
    const lang = await first.getAttribute('data-lang');
    // Click without navigating — the handler is what is under test here.
    await first.evaluate((el) => {
      el.addEventListener('click', (e) => e.preventDefault(), { once: true });
      el.click();
    });
    await expect.poll(() => page.evaluate(() => localStorage.getItem('zer0-lang'))).toBe(lang);
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
