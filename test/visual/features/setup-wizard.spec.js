// Feature: ZER0-067
// =============================================================================
// setup-wizard.spec.js — Regression coverage for the setup wizard (T-040 / #408)
// =============================================================================
// The wizard (_includes/setup/wizard.html + assets/js/setup-wizard.js) builds a
// _config.yml from a five-step form. #408 restructured it into three columns and
// added four behaviours that had no coverage at all. Each gets a test here:
//
//   1. The YAML preview is PERSISTENT — visible at every step, not only step 5 —
//      and regenerates on input. Copy/Download are enabled throughout.
//   2. Back/Next never move vertically between steps (the pane container takes a
//      min-height equal to the tallest pane; the nav row is pinned with mt-auto).
//   3. The draft survives a reload (localStorage `zer0-setup-draft`, debounced
//      300ms) and is cleared on download.
//   4. Email/URL are validated on blur with `is-invalid` + a message, and the
//      Review step lists unfilled recommended fields as warnings.
//
// Note: /setup/ only renders the wizard when jekyll.environment is development
// or site.show_setup_wizard is set. Rather than skip blindly (which would hide a
// genuine breakage), each run asserts the page is EITHER the wizard or the
// explicit "development mode only" notice, and skips only in the latter case.
// =============================================================================

const { test, expect } = require('@playwright/test');

const WIZARD = '#setup-wizard';
const PANES = '#wizardTabContent';
const DRAFT_KEY = 'zer0-setup-draft';

/** Load /setup/, skipping (loudly) when the build gated the wizard off. */
async function openWizard(page) {
  await page.goto('/setup/');
  await page.waitForLoadState('domcontentloaded');
  const present = await page.locator(WIZARD).count();
  if (!present) {
    // Prove the page is the documented dev-only notice and not a 404 or a
    // blank render before deciding this is a skip rather than a failure.
    await expect(page.locator('body')).toContainText(/only available in development mode/i);
    test.skip(true, '/setup/ is gated off in this build (not a development env)');
  }
  await expect(page.locator(WIZARD)).toBeVisible();
}

/** Click through to a step by its stepper button id. */
async function goToStep(page, tabId) {
  await page.locator(`#${tabId}`).click();
  await expect(page.locator(`#${tabId}`)).toHaveClass(/is-active/);
}

test.describe('Setup wizard', { tag: '@critical' }, () => {
  test.beforeEach(async ({ page }) => {
    // Never inherit a draft between tests.
    await page.addInitScript((key) => {
      try { localStorage.removeItem(key); } catch (e) { /* private mode */ }
    }, DRAFT_KEY);
    await openWizard(page);
  });

  test('replaces the nav-pills tabs with a vertical stepper', async ({ page }) => {
    // The old markup was `ul.nav.nav-pills.nav-fill#wizardTabs`.
    await expect(page.locator(`${WIZARD} .nav-pills`)).toHaveCount(0);

    const stepper = page.locator('#wizardTabs');
    await expect(stepper).toHaveClass(/wizard-stepper/);
    await expect(stepper).toHaveAttribute('aria-orientation', 'vertical');
    await expect(stepper.locator('.wizard-step')).toHaveCount(5);

    // Exactly one active step, and it starts on Identity.
    await expect(page.locator('#wizardTabs .wizard-step.is-active')).toHaveCount(1);
    await expect(page.locator('#tab-identity')).toHaveClass(/is-active/);
  });

  test('the YAML preview is live and visible at every step', async ({ page }) => {
    const preview = page.locator('#yaml-preview');
    const copy = page.locator('#btn-copy-full');
    const download = page.locator('#btn-download');

    for (const tab of ['tab-identity', 'tab-urls', 'tab-collections', 'tab-analytics', 'tab-review']) {
      await goToStep(page, tab);
      await expect(preview).toBeVisible();
      // Copy/download are usable throughout — not gated on reaching Review.
      await expect(copy).toBeEnabled();
      await expect(download).toBeEnabled();
    }

    // …and it regenerates on input, from step 1, without visiting Review.
    await goToStep(page, 'tab-identity');
    await page.locator('#cfg-title').fill('Regression Title');
    await expect(preview).toContainText('Regression Title');

    await page.locator('#cfg-subtitle').fill('A subtitle from the test');
    await expect(preview).toContainText('A subtitle from the test');
  });

  test('Back and Next never move vertically between steps', async ({ page }) => {
    // The bug: each step was only as tall as its own content, so the nav row
    // jumped as you advanced. Guard both halves of the fix.
    const minHeight = await page.locator(PANES).evaluate(
      (el) => parseFloat(getComputedStyle(el).minHeight) || 0
    );
    expect(minHeight).toBeGreaterThan(0);

    const offsets = [];
    for (const tab of ['tab-identity', 'tab-urls', 'tab-collections', 'tab-analytics']) {
      await goToStep(page, tab);
      const next = page.locator(`#${tab.replace('tab-', 'step-')} .btn-next`);
      const box = await next.boundingBox();
      expect(box).not.toBeNull();
      offsets.push(Math.round(box.y));
    }

    // Allow a pixel of sub-pixel rounding, nothing more.
    const spread = Math.max(...offsets) - Math.min(...offsets);
    expect(spread, `Next button y offsets across steps: ${offsets.join(', ')}`).toBeLessThanOrEqual(1);
  });

  test('validates email and URL on blur, and clears the error on retype', async ({ page }) => {
    const email = page.locator('#cfg-email');
    await email.fill('not-an-email');
    await email.blur();
    await expect(email).toHaveClass(/is-invalid/);
    await expect(page.locator('#cfg-email-feedback')).toHaveText(/valid email/i);

    // Typing again clears the error rather than nagging mid-entry.
    await email.fill('someone@example.com');
    await expect(email).not.toHaveClass(/is-invalid/);
    await email.blur();
    await expect(email).not.toHaveClass(/is-invalid/);

    // Empty is not an error — nothing in this wizard is required.
    await email.fill('');
    await email.blur();
    await expect(email).not.toHaveClass(/is-invalid/);

    await goToStep(page, 'tab-urls');
    const url = page.locator('#cfg-url');
    await url.fill('example.com');
    await url.blur();
    await expect(url).toHaveClass(/is-invalid/);
    await expect(page.locator('#cfg-url-feedback')).toHaveText(/https:\/\//i);

    await url.fill('https://example.com');
    await url.blur();
    await expect(url).not.toHaveClass(/is-invalid/);
  });

  test('a malformed field locks later steps but never blocks Back', async ({ page }) => {
    const email = page.locator('#cfg-email');
    await email.fill('nope');
    await email.blur();

    await expect(page.locator('#tab-urls')).toBeDisabled();
    await expect(page.locator('#tab-urls')).toHaveClass(/is-locked/);

    await email.fill('someone@example.com');
    await email.blur();
    await expect(page.locator('#tab-urls')).toBeEnabled();

    // Going backwards is always allowed, even from the far end.
    await goToStep(page, 'tab-urls');
    await goToStep(page, 'tab-collections');
    await page.locator('#step-collections .btn-prev').click();
    await expect(page.locator('#tab-urls')).toHaveClass(/is-active/);
  });

  test('lists unfilled recommended fields as warnings on Review', async ({ page }) => {
    await goToStep(page, 'tab-review');
    const warnings = page.locator('#wizard-review-warnings');
    await expect(warnings).toContainText(/recommended fields still empty/i);
    await expect(warnings.locator('li')).not.toHaveCount(0);

    // Fill everything recommended; the warning becomes an all-clear.
    const ids = await page.locator('[data-recommended]').evaluateAll(
      (els) => els.map((el) => el.id)
    );
    for (const id of ids) {
      await goToStep(page, 'tab-identity');
      const field = page.locator(`#${id}`);
      const type = await field.getAttribute('type');
      if (await field.isVisible()) {
        await field.fill(type === 'email' ? 'someone@example.com'
          : type === 'url' ? 'https://example.com' : 'filled');
      } else {
        // The field lives on a later step — reach it through its own pane.
        const pane = await field.evaluate((el) => el.closest('.tab-pane').id);
        await goToStep(page, pane.replace('step-', 'tab-'));
        await field.fill(type === 'email' ? 'someone@example.com'
          : type === 'url' ? 'https://example.com' : 'filled');
      }
    }

    await goToStep(page, 'tab-review');
    await expect(warnings).toContainText(/every recommended field is filled in/i);
  });

  test('persists a draft across reload and clears it on download', async ({ page }) => {
    await page.locator('#cfg-title').fill('Draft Survives Reload');
    await page.locator('#cfg-github-user').fill('octocat');
    await page.locator('#col-notes').check();

    // The write is debounced 300ms — wait for the value, not a fixed sleep.
    await expect.poll(
      () => page.evaluate((k) => localStorage.getItem(k), DRAFT_KEY),
      { message: 'draft should be written to localStorage after the debounce' }
    ).toContain('Draft Survives Reload');

    // The chip acknowledges the save.
    await expect(page.locator('#wizard-draft-chip')).toHaveClass(/is-visible/);

    await page.reload();
    await expect(page.locator(WIZARD)).toBeVisible();
    await expect(page.locator('#cfg-title')).toHaveValue('Draft Survives Reload');
    await expect(page.locator('#cfg-github-user')).toHaveValue('octocat');
    await expect(page.locator('#col-notes')).toBeChecked();
    // The restored values reach the preview too, not just the inputs.
    await expect(page.locator('#yaml-preview')).toContainText('Draft Survives Reload');

    // Downloading means the wizard is finished, so the draft is cleared.
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btn-download').click();
    await downloadPromise;
    await expect.poll(
      () => page.evaluate((k) => localStorage.getItem(k), DRAFT_KEY)
    ).toBeNull();
  });

  test('survives localStorage being unavailable', async ({ page, context }) => {
    // Private-mode browsers throw on setItem. The wizard must still work.
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() { throw new DOMException('denied'); }
      });
    });
    await page.goto('/setup/');
    if (!(await page.locator(WIZARD).count())) test.skip(true, '/setup/ gated off');

    await page.locator('#cfg-title').fill('No Storage Here');
    await expect(page.locator('#yaml-preview')).toContainText('No Storage Here');
    await goToStep(page, 'tab-urls');
    await expect(page.locator('#step-urls')).toBeVisible();
  });
});
