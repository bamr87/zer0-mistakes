// =============================================================================
// ai-chat.spec.js — Smoke coverage for the AI chat widget (issue #168)
// =============================================================================
// The AI chat widget (_includes/components/ai-chat.html + assets/js/ai-chat.js,
// feature ZER0-060) has a multi-condition render guard: it renders only when
// ai_chat.enabled AND a usable auth path exists (proxy mode + proxy_ready, or
// direct mode + a non-empty api_key). A past Liquid bug (boolean assign
// returning a truthy string) would have rendered a dead FAB on every page.
//
// The smoke server builds with _config.yml,_config_dev.yml, where
// ai_chat.enabled (prod) + proxy_ready: true (dev) satisfy the guard — so the
// widget DOES render in this environment. These tests assert the guard's
// positive path plus the FAB ⇄ panel toggle, which run fully client-side (no AI
// backend is contacted just to open/close the panel).
// =============================================================================

const { test, expect } = require('@playwright/test');
const { waitForJekyll } = require('./fixtures');

const FAB = '#aiChatToggle';
const PANEL = '#aiChatPanel';

test.describe('AI chat widget', () => {
  test.beforeEach(async ({ page }) => {
    await waitForJekyll(page, '/');
  });

  test('renders the FAB and config when the guard is satisfied', async ({ page }) => {
    // Guard passed → the toggle button and its JSON config block are present.
    await expect(page.locator(FAB)).toBeVisible();
    await expect(page.locator('#aiChatConfig')).toBeAttached();

    // Panel exists but is closed until the FAB is clicked.
    const panel = page.locator(PANEL);
    await expect(panel).toHaveAttribute('aria-hidden', 'true');
    await expect(panel).not.toHaveClass(/ai-chat-panel--open/);
    await expect(panel).toBeHidden();

    // The welcome message is seeded on init (no network needed).
    await expect(page.locator('#aiChatMessages')).not.toBeEmpty();
  });

  test('FAB opens the panel and the close button dismisses it', async ({ page }) => {
    const fab = page.locator(FAB);
    const panel = page.locator(PANEL);

    await fab.click();
    await expect(panel).toHaveClass(/ai-chat-panel--open/);
    await expect(panel).toBeVisible();
    await expect(fab).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveAttribute('aria-hidden', 'false');

    await page.locator('#aiChatClose').click();
    await expect(panel).not.toHaveClass(/ai-chat-panel--open/);
    await expect(panel).toBeHidden();
    await expect(fab).toHaveAttribute('aria-expanded', 'false');
  });

  test('Escape closes the open panel', async ({ page }) => {
    const fab = page.locator(FAB);
    const panel = page.locator(PANEL);

    await fab.click();
    await expect(panel).toHaveClass(/ai-chat-panel--open/);

    await page.keyboard.press('Escape');
    await expect(panel).not.toHaveClass(/ai-chat-panel--open/);
    await expect(fab).toHaveAttribute('aria-expanded', 'false');
  });
});
