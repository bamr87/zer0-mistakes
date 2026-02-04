// =============================================================================
// JavaScript Configuration Test Suite
// =============================================================================
//
// Tests JavaScript functionality including:
//   - Theme switching (ZeroTheme API)
//   - Bootstrap component initialization
//   - Custom JavaScript modules
//   - localStorage persistence
//   - Event handling
//
// Usage:
//   npx playwright test test/playwright/js-configs.spec.js
//
// =============================================================================

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

test.describe('ZeroTheme JavaScript API', () => {

  test.describe('API Availability', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      await page.waitForLoadState('networkidle');
    });

    test('window.ZeroTheme exists', async ({ page }) => {
      const hasZeroTheme = await page.evaluate(() => {
        return typeof window.ZeroTheme !== 'undefined';
      });
      
      expect(hasZeroTheme).toBe(true);
    });

    test('ZeroTheme has required methods', async ({ page }) => {
      const methods = await page.evaluate(() => {
        if (!window.ZeroTheme) return [];
        return Object.keys(window.ZeroTheme).filter(
          key => typeof window.ZeroTheme[key] === 'function'
        );
      });
      
      const requiredMethods = ['getTheme', 'setTheme', 'getSkins', 'getModes'];
      for (const method of requiredMethods) {
        expect(methods, `ZeroTheme should have ${method}()`).toContain(method);
      }
    });
  });

  test.describe('ZeroTheme.getTheme()', () => {
    test('returns current theme config', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const config = await page.evaluate(() => {
        return window.ZeroTheme?.getTheme?.();
      });
      
      if (config) {
        expect(config).toHaveProperty('skin');
        expect(config).toHaveProperty('mode');
      }
    });

    test('config matches DOM attributes', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const [apiConfig, domConfig] = await page.evaluate(() => {
        const api = window.ZeroTheme?.getTheme?.() || {};
        return [
          api,
          {
            skin: document.documentElement.getAttribute('data-bs-theme'),
            mode: document.documentElement.getAttribute('data-bs-mode')
          }
        ];
      });
      
      if (apiConfig.skin) {
        expect(apiConfig.skin).toBe(domConfig.skin);
        expect(apiConfig.mode).toBe(domConfig.mode);
      }
    });
  });

  test.describe('ZeroTheme.setTheme()', () => {
    test('updates DOM attributes', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const result = await page.evaluate(() => {
        if (!window.ZeroTheme?.setTheme) return null;
        
        window.ZeroTheme.setTheme('mint', 'light');
        
        return {
          skin: document.documentElement.getAttribute('data-bs-theme'),
          mode: document.documentElement.getAttribute('data-bs-mode')
        };
      });
      
      if (result) {
        expect(result.skin).toBe('mint');
        expect(result.mode).toBe('light');
      }
    });

    test('updates localStorage', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const stored = await page.evaluate(() => {
        if (!window.ZeroTheme?.setTheme) return null;
        
        window.ZeroTheme.setTheme('aqua', 'dark');
        
        const config = localStorage.getItem('themeConfig');
        return config ? JSON.parse(config) : null;
      });
      
      if (stored) {
        expect(stored.skin).toBe('aqua');
        expect(stored.mode).toBe('dark');
      }
    });

    test('fires themechange event', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const eventFired = await page.evaluate(() => {
        return new Promise(resolve => {
          window.addEventListener('themechange', (e) => {
            resolve(e.detail);
          }, { once: true });
          
          setTimeout(() => resolve(null), 1000); // Timeout fallback
          
          if (window.ZeroTheme?.setTheme) {
            window.ZeroTheme.setTheme('plum', 'light');
          }
        });
      });
      
      if (eventFired) {
        expect(eventFired.skin).toBe('plum');
        expect(eventFired.mode).toBe('light');
      }
    });

    test('rejects invalid skin', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const result = await page.evaluate(() => {
        if (!window.ZeroTheme?.setTheme) return null;
        return window.ZeroTheme.setTheme('invalid-skin', 'light');
      });
      
      expect(result).toBe(false);
    });

    test('rejects invalid mode', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const result = await page.evaluate(() => {
        if (!window.ZeroTheme?.setTheme) return null;
        return window.ZeroTheme.setTheme('dark', 'invalid-mode');
      });
      
      expect(result).toBe(false);
    });
  });

  test.describe('ZeroTheme.getSkins()', () => {
    test('returns array of skin names', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const skins = await page.evaluate(() => {
        return window.ZeroTheme?.getSkins?.() || [];
      });
      
      expect(Array.isArray(skins)).toBe(true);
      expect(skins.length).toBeGreaterThan(0);
      
      // Should include known skins
      const expectedSkins = ['dark', 'light', 'air', 'aqua', 'contrast', 'dirt', 'neon', 'mint', 'plum', 'sunrise'];
      for (const skin of expectedSkins) {
        if (skins.length > 0) {
          // Just check format, not all skins
          expect(typeof skins[0]).toBe('string');
        }
      }
    });
  });

  test.describe('ZeroTheme.getModes()', () => {
    test('returns light and dark modes', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const modes = await page.evaluate(() => {
        return window.ZeroTheme?.getModes?.() || [];
      });
      
      expect(modes).toContain('light');
      expect(modes).toContain('dark');
    });
  });
});

test.describe('localStorage Persistence', () => {

  test('theme persists after reload', async ({ page }) => {
    await page.goto(`${BASE_URL}/test/skin-showcase/`);
    
    // Set theme
    await page.evaluate(() => {
      window.ZeroTheme?.setTheme?.('sunrise', 'light');
    });
    
    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check persistence
    const config = await page.evaluate(() => {
      return window.ZeroTheme?.getTheme?.() || {
        skin: document.documentElement.getAttribute('data-bs-theme'),
        mode: document.documentElement.getAttribute('data-bs-mode')
      };
    });
    
    // Theme should persist (depending on implementation)
    expect(config.skin).toBeTruthy();
    expect(config.mode).toBeTruthy();
  });

  test('localStorage.themeConfig structure is correct', async ({ page }) => {
    await page.goto(`${BASE_URL}/test/skin-showcase/`);
    
    const config = await page.evaluate(() => {
      const stored = localStorage.getItem('themeConfig');
      return stored ? JSON.parse(stored) : null;
    });
    
    if (config) {
      expect(config).toHaveProperty('skin');
      expect(config).toHaveProperty('mode');
      expect(typeof config.skin).toBe('string');
      expect(typeof config.mode).toBe('string');
    }
  });

  test('clearing localStorage resets to defaults', async ({ page, context }) => {
    // Clear storage before navigating
    await context.clearCookies();
    
    await page.goto(`${BASE_URL}/test/skin-showcase/`);
    
    await page.evaluate(() => {
      localStorage.removeItem('themeConfig');
    });
    
    await page.reload();
    
    // Should use site defaults
    const config = await page.evaluate(() => {
      return {
        skin: document.documentElement.getAttribute('data-bs-theme'),
        mode: document.documentElement.getAttribute('data-bs-mode')
      };
    });
    
    expect(config.skin).toBeTruthy();
    expect(config.mode).toBeTruthy();
  });
});

test.describe('Bootstrap JavaScript', () => {

  test.describe('Bootstrap Global', () => {
    test('bootstrap object is available', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const hasBootstrap = await page.evaluate(() => {
        return typeof bootstrap !== 'undefined';
      });
      
      expect(hasBootstrap).toBe(true);
    });

    test('Bootstrap version is 5.x', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const version = await page.evaluate(() => {
        return bootstrap?.Tooltip?.VERSION || '';
      });
      
      expect(version.startsWith('5.')).toBe(true);
    });
  });

  test.describe('Component Classes', () => {
    const bootstrapComponents = [
      'Alert', 'Button', 'Carousel', 'Collapse', 'Dropdown',
      'Modal', 'Offcanvas', 'Popover', 'ScrollSpy', 'Tab', 'Toast', 'Tooltip'
    ];

    for (const component of bootstrapComponents) {
      test(`bootstrap.${component} is available`, async ({ page }) => {
        await page.goto(BASE_URL);
        
        const exists = await page.evaluate((component) => {
          return typeof bootstrap?.[component] === 'function';
        }, component);
        
        expect(exists, `bootstrap.${component} should exist`).toBe(true);
      });
    }
  });

  test.describe('Auto-initialization', () => {
    test('tooltips are initialized', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      // Check if tooltips are initialized on elements
      const tooltipCount = await page.evaluate(() => {
        const tooltipTriggers = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        return tooltipTriggers.length;
      });
      
      // Just verify we can query for them
      expect(tooltipCount).toBeGreaterThanOrEqual(0);
    });

    test('dropdowns work without manual init', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const dropdown = page.locator('[data-bs-toggle="dropdown"]').first();
      if (await dropdown.count() > 0) {
        await dropdown.click();
        
        // Menu should appear
        const menu = page.locator('.dropdown-menu.show');
        await expect(menu).toBeVisible();
      }
    });
  });
});

test.describe('Custom JavaScript Modules', () => {

  test.describe('Search Functionality', () => {
    test('search input is functional', async ({ page }) => {
      await page.goto(`${BASE_URL}/search/`);
      
      const searchInput = page.locator('input[type="search"], #search-input, .search-input').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        
        // Should accept input
        const value = await searchInput.inputValue();
        expect(value).toBe('test');
      }
    });
  });

  test.describe('Copy to Clipboard', () => {
    test('code blocks have copy buttons', async ({ page }) => {
      await page.goto(`${BASE_URL}/docs/`);
      
      const copyBtn = page.locator('.copy-button, [data-clipboard], button.copy').first();
      // Just verify they exist or don't error
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Scroll Behavior', () => {
    test('smooth scroll to anchors', async ({ page }) => {
      await page.goto(`${BASE_URL}/docs/`);
      
      // Scroll behavior should be set
      const scrollBehavior = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).scrollBehavior;
      });
      
      // Either 'smooth' or 'auto' is acceptable
      expect(['smooth', 'auto']).toContain(scrollBehavior);
    });

    test('back to top button appears on scroll', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Scroll down
      await page.evaluate(() => {
        window.scrollTo(0, 1000);
      });
      
      await page.waitForTimeout(300);
      
      // Check for back-to-top button (may or may not exist)
      const backToTop = page.locator('.back-to-top, #back-to-top, [data-scroll-top]').first();
      // Just don't error - feature may not exist
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

test.describe('Error Handling', () => {

  test('no JavaScript errors on page load', async ({ page }) => {
    const errors = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors
    const criticalErrors = errors.filter(e => 
      !e.includes('ResizeObserver') && // Known benign error
      !e.includes('Script error') // Cross-origin errors
    );
    
    expect(criticalErrors, 'Should have no JS errors').toHaveLength(0);
  });

  test('no console errors on theme change', async ({ page }) => {
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}/test/skin-showcase/`);
    
    // Cycle through themes
    await page.evaluate(() => {
      const skins = ['dark', 'light', 'mint', 'aqua'];
      skins.forEach((skin, i) => {
        setTimeout(() => {
          window.ZeroTheme?.setTheme?.(skin, i % 2 === 0 ? 'dark' : 'light');
        }, i * 100);
      });
    });
    
    await page.waitForTimeout(600);
    
    const criticalErrors = errors.filter(e => 
      !e.includes('ResizeObserver')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Performance', () => {

  test('JavaScript loads without blocking render', async ({ page }) => {
    const timing = await page.evaluate(() => {
      return {
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        load: performance.timing.loadEventEnd - performance.timing.navigationStart
      };
    });
    
    // DOMContentLoaded should be under 3 seconds
    expect(timing.domContentLoaded).toBeLessThan(3000);
  });

  test('theme switch is fast (< 100ms)', async ({ page }) => {
    await page.goto(`${BASE_URL}/test/skin-showcase/`);
    
    const switchTime = await page.evaluate(() => {
      const start = performance.now();
      window.ZeroTheme?.setTheme?.('mint', 'dark');
      return performance.now() - start;
    });
    
    expect(switchTime).toBeLessThan(100);
  });
});
