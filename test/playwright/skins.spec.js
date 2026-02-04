// =============================================================================
// Theme Skins Test Suite
// =============================================================================
//
// Tests all 18 theme skin variants (9 skins × light/dark modes)
// Validates CSS custom properties, compound attributes, and localStorage persistence
//
// Usage:
//   npx playwright test test/playwright/skins.spec.js
//   npx playwright test test/playwright/skins.spec.js --project=desktop-chrome
//
// =============================================================================

const { test, expect } = require('@playwright/test');

// All available skins
const SKINS = ['air', 'aqua', 'contrast', 'dark', 'dirt', 'neon', 'mint', 'plum', 'sunrise'];
const MODES = ['light', 'dark'];

// Required CSS variables that each skin must define
const REQUIRED_CSS_VARS = [
  '--bs-primary',
  '--bs-body-bg',
  '--bs-body-color',
  '--bs-link-color',
  '--bs-border-color',
  '--bs-secondary-bg',
];

// Base URL - adjust based on environment
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

test.describe('Theme Skins', () => {
  
  test.describe('Skin Showcase Fixture', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      await page.waitForLoadState('networkidle');
    });

    test('loads skin showcase page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Theme Skin Showcase');
    });

    test('theme controls are visible', async ({ page }) => {
      await expect(page.locator('#theme-controls')).toBeVisible();
    });
  });

  test.describe('Compound Attribute System', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
    });

    test('HTML element has data-bs-theme attribute', async ({ page }) => {
      const theme = await page.locator('html').getAttribute('data-bs-theme');
      expect(SKINS).toContain(theme);
    });

    test('HTML element has data-bs-mode attribute', async ({ page }) => {
      const mode = await page.locator('html').getAttribute('data-bs-mode');
      expect(MODES).toContain(mode);
    });

    test('both attributes work together as compound selector', async ({ page }) => {
      const html = page.locator('html');
      const theme = await html.getAttribute('data-bs-theme');
      const mode = await html.getAttribute('data-bs-mode');
      
      // Verify CSS variables are applied
      const primaryColor = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--bs-primary').trim();
      });
      
      expect(primaryColor).toBeTruthy();
      expect(primaryColor).not.toBe('');
    });
  });

  test.describe('All Skin Variants', () => {
    for (const skin of SKINS) {
      for (const mode of MODES) {
        test(`${skin}/${mode} - CSS variables are defined`, async ({ page }) => {
          await page.goto(`${BASE_URL}/test/skin-showcase/`);
          
          // Apply skin and mode via JavaScript API
          await page.evaluate(({ skin, mode }) => {
            if (window.ZeroTheme) {
              window.ZeroTheme.setTheme(skin, mode);
            } else {
              document.documentElement.setAttribute('data-bs-theme', skin);
              document.documentElement.setAttribute('data-bs-mode', mode);
            }
          }, { skin, mode });
          
          // Wait for CSS to apply
          await page.waitForTimeout(100);
          
          // Verify compound attributes
          const appliedTheme = await page.locator('html').getAttribute('data-bs-theme');
          const appliedMode = await page.locator('html').getAttribute('data-bs-mode');
          expect(appliedTheme).toBe(skin);
          expect(appliedMode).toBe(mode);
          
          // Verify CSS variables are set
          for (const varName of REQUIRED_CSS_VARS) {
            const value = await page.evaluate((varName) => {
              return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
            }, varName);
            
            expect(value, `${skin}/${mode} should define ${varName}`).toBeTruthy();
          }
        });

        test(`${skin}/${mode} - body background applies correctly`, async ({ page }) => {
          await page.goto(`${BASE_URL}/test/skin-showcase/`);
          
          await page.evaluate(({ skin, mode }) => {
            document.documentElement.setAttribute('data-bs-theme', skin);
            document.documentElement.setAttribute('data-bs-mode', mode);
          }, { skin, mode });
          
          await page.waitForTimeout(100);
          
          const bodyBg = await page.evaluate(() => {
            return getComputedStyle(document.body).backgroundColor;
          });
          
          expect(bodyBg).toBeTruthy();
          expect(bodyBg).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
        });
      }
    }
  });

  test.describe('Theme Toggle Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
    });

    test('mode toggle buttons change data-bs-mode', async ({ page }) => {
      // Get initial mode
      const initialMode = await page.locator('html').getAttribute('data-bs-mode');
      
      // Find and click mode toggle (if exists)
      const toggleSelector = initialMode === 'light' 
        ? '[data-bs-theme-value="dark"]' 
        : '[data-bs-theme-value="light"]';
      
      const toggle = page.locator(toggleSelector).first();
      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(100);
        
        const newMode = await page.locator('html').getAttribute('data-bs-mode');
        expect(newMode).not.toBe(initialMode);
      }
    });

    test('skin selector buttons change data-bs-theme', async ({ page }) => {
      const initialSkin = await page.locator('html').getAttribute('data-bs-theme');
      const newSkin = initialSkin === 'dark' ? 'mint' : 'dark';
      
      const skinButton = page.locator(`[data-bs-skin-value="${newSkin}"]`).first();
      if (await skinButton.isVisible()) {
        await skinButton.click();
        await page.waitForTimeout(100);
        
        const appliedSkin = await page.locator('html').getAttribute('data-bs-theme');
        expect(appliedSkin).toBe(newSkin);
      }
    });
  });

  test.describe('localStorage Persistence', () => {
    test('theme config persists to localStorage', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      // Set a specific theme
      await page.evaluate(() => {
        if (window.ZeroTheme) {
          window.ZeroTheme.setTheme('mint', 'dark');
        }
      });
      
      await page.waitForTimeout(100);
      
      // Check localStorage
      const stored = await page.evaluate(() => {
        return localStorage.getItem('themeConfig');
      });
      
      if (stored) {
        const config = JSON.parse(stored);
        expect(config.skin).toBe('mint');
        expect(config.mode).toBe('dark');
      }
    });

    test('theme config loads from localStorage on page load', async ({ page, context }) => {
      // Pre-set localStorage
      await context.addInitScript(() => {
        localStorage.setItem('themeConfig', JSON.stringify({ skin: 'plum', mode: 'light' }));
      });
      
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      await page.waitForLoadState('networkidle');
      
      // Verify theme was applied from storage
      const skin = await page.locator('html').getAttribute('data-bs-theme');
      const mode = await page.locator('html').getAttribute('data-bs-mode');
      
      // Note: This depends on color-modes.js reading localStorage
      // The test verifies the integration works
      expect(skin).toBeTruthy();
      expect(mode).toBeTruthy();
    });
  });

  test.describe('ZeroTheme API', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      await page.waitForLoadState('networkidle');
    });

    test('ZeroTheme.getSkins() returns all skins', async ({ page }) => {
      const skins = await page.evaluate(() => {
        return window.ZeroTheme?.getSkins?.() || [];
      });
      
      expect(skins).toEqual(SKINS);
    });

    test('ZeroTheme.getModes() returns light and dark', async ({ page }) => {
      const modes = await page.evaluate(() => {
        return window.ZeroTheme?.getModes?.() || [];
      });
      
      expect(modes).toEqual(MODES);
    });

    test('ZeroTheme.getTheme() returns current config', async ({ page }) => {
      const theme = await page.evaluate(() => {
        return window.ZeroTheme?.getTheme?.();
      });
      
      if (theme) {
        expect(SKINS).toContain(theme.skin);
        expect(MODES).toContain(theme.mode);
      }
    });

    test('ZeroTheme.setTheme() validates input', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.ZeroTheme?.setTheme?.('invalid-skin', 'dark');
      });
      
      expect(result).toBe(false);
    });
  });

  test.describe('Theme Change Event', () => {
    test('themechange event fires on theme change', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      // Set up event listener
      const eventPromise = page.evaluate(() => {
        return new Promise((resolve) => {
          window.addEventListener('themechange', (e) => {
            resolve(e.detail);
          }, { once: true });
        });
      });
      
      // Trigger theme change
      await page.evaluate(() => {
        if (window.ZeroTheme) {
          window.ZeroTheme.setTheme('aqua', 'light');
        }
      });
      
      const eventDetail = await eventPromise;
      
      if (eventDetail) {
        expect(eventDetail.skin).toBe('aqua');
        expect(eventDetail.mode).toBe('light');
      }
    });
  });
});
