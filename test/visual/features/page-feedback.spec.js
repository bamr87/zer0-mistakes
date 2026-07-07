// =============================================================================
// page-feedback.spec.js — the "Improve this page" capture widget
// =============================================================================
// Widget: _includes/components/page-feedback.html + assets/js/page-feedback.js
// (+ the early log buffer in _includes/core/console-capture.html).
//
// Replaces the old build-time "Copilot Agent" dropdown, which baked the whole
// issue body into <a href>s at build time and could NOT capture runtime logs.
// These smoke tests assert the runtime capture path end-to-end WITHOUT hitting
// GitHub: window.open is intercepted so we can inspect the pre-filled issue URL
// the widget builds. The AI-enrichment path is not exercised here (it needs the
// chat proxy running); the base layer under test works fully client-side.
//
// Regressions this guards against:
//   - a dead/absent FAB (render-guard or mount regression)
//   - labels the repo doesn't have (the old `labels=ai-agent` silent-drop bug)
//   - repo owner/name drifting from site.repository
//   - the issue body losing its page context or the captured console logs
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('../fixtures');

const FAB = '#pageFeedbackFab';
const MODAL = '#pageFeedbackModal';

test.describe('Page-feedback widget', () => {
  test.beforeEach(async ({ page }) => {
    await waitForJekyll(page, '/');
  });

  test('renders the FAB and the injected config / types / context', async ({ page }) => {
    await expect(page.locator(FAB)).toBeVisible();
    await expect(page.locator('#pageFeedbackConfig')).toBeAttached();
    await expect(page.locator('#pageFeedbackTypes')).toBeAttached();
    await expect(page.locator('#pageFeedbackContext')).toBeAttached();

    // Repo comes from a single source (site.repository) — never hardcoded.
    const cfg = JSON.parse(await page.locator('#pageFeedbackConfig').textContent());
    expect(cfg.repository).toBe('bamr87/zer0-mistakes');
    expect(cfg.defaultLabels).toContain('page-feedback');

    // At least one request type is rendered from _data/feedback_types.yml.
    expect(await page.locator('.pf-type').count()).toBeGreaterThan(0);

    // The modal exists but is closed until opened.
    await expect(page.locator(MODAL)).toBeHidden();
  });

  test('FAB opens the modal; Escape closes it', async ({ page }) => {
    await page.locator(FAB).click();
    const modal = page.locator(MODAL);
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/pf-overlay--open/);
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('role', 'dialog');

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('submit is gated on both a type and a description', async ({ page }) => {
    await page.locator(FAB).click();
    const submit = page.locator('#pfSubmit');
    await expect(submit).toBeDisabled();

    await page.locator('.pf-type[data-pf-type-id="fix-page"]').click();
    await expect(page.locator('.pf-type[data-pf-type-id="fix-page"]')).toHaveAttribute('aria-checked', 'true');
    await expect(submit).toBeDisabled(); // type chosen, still no description

    await page.locator('#pfDescription').fill('The code block overflows horizontally on mobile.');
    await expect(submit).toBeEnabled();
  });

  test('builds a correct pre-filled GitHub issue URL with real labels', async ({ page }) => {
    await page.locator(FAB).click();

    // Intercept window.open — page-feedback.js calls it at submit time, so
    // overriding it now (post-load) is enough; nothing navigates.
    await page.evaluate(() => {
      window.__pfOpened = null;
      window.open = (u) => { window.__pfOpened = u; return { opener: null, closed: false, focus() {} }; };
    });

    await page.locator('.pf-type[data-pf-type-id="fix-page"]').click();
    await page.locator('#pfDescription').fill('Broken link in the intro section.');
    await page.locator('#pfSubmit').click();

    const opened = await page.evaluate(() => window.__pfOpened);
    expect(opened).toBeTruthy();
    expect(opened).toContain('https://github.com/bamr87/zer0-mistakes/issues/new');

    const url = new URL(opened);
    const labels = url.searchParams.get('labels') || '';
    expect(labels.split(',')).toContain('page-feedback'); // marker label (exists in repo)
    expect(labels.split(',')).toContain('bug');            // fix-page → bug (exists in repo)

    expect(url.searchParams.get('title')).toContain('Report a problem');

    const body = url.searchParams.get('body') || '';
    expect(body).toContain('Broken link in the intro section.'); // the user's words
    expect(body).toContain('Page context');                      // the auto context table
    expect(body).toContain('Environment');
  });

  test('captures console output and offers it in the preview', async ({ page }) => {
    // Emit a marker BEFORE opening — the head-installed shim buffers it.
    await page.evaluate(() => console.log('PF_TEST_LOG_MARKER 42'));
    await page.locator(FAB).click();

    // Expand "What gets attached" and confirm the captured line is shown.
    await page.locator('#pfContextWrap > summary').click();
    await expect(page.locator('#pfLogsWrap')).toBeVisible();
    await expect(page.locator('#pfLogsPreview')).toContainText('PF_TEST_LOG_MARKER 42');

    // And it's opt-outable.
    await expect(page.locator('#pfIncludeLogs')).toBeChecked();
  });
});
