import { Page } from '@playwright/test';

/**
 * Check whether Bootstrap CSS is actually loaded and effective.
 * The <link> element may exist but the CDN could be blocked.
 * We test a known Bootstrap utility class (d-none) to verify.
 */
export async function isBootstrapCSSLoaded(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    // Create a temporary element with a Bootstrap class
    const el = document.createElement('div');
    el.className = 'd-none';
    document.body.appendChild(el);
    const display = window.getComputedStyle(el).display;
    document.body.removeChild(el);
    // If Bootstrap CSS is loaded, d-none sets display: none
    return display === 'none';
  });
}
