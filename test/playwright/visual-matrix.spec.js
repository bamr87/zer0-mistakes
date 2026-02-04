// =============================================================================
// Visual Regression Test Suite
// =============================================================================
//
// Captures and compares screenshots across the configuration matrix.
// Uses Playwright's native toHaveScreenshot() for visual comparisons.
//
// Matrices:
//   - Full: 864 combinations (8 post_types × 9 skins × 2 modes × 6 breakpoints)
//   - Quick: 27 combinations (3 skins × 2 modes × 3 breakpoints × 3 post_types)
//   - Smoke: 6 combinations (1 skin × 2 modes × 3 breakpoints)
//
// Usage:
//   npx playwright test test/playwright/visual-matrix.spec.js
//   npx playwright test test/playwright/visual-matrix.spec.js --update-snapshots
//
// Environment Variables:
//   MATRIX_TYPE: "full" | "quick" | "smoke" (default: "quick")
//
// =============================================================================

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const MATRIX_TYPE = process.env.MATRIX_TYPE || 'quick';

// Configuration matrices
const FULL_MATRIX = {
  skins: ['air', 'aqua', 'contrast', 'dark', 'dirt', 'neon', 'mint', 'plum', 'sunrise'],
  modes: ['light', 'dark'],
  breakpoints: [
    { name: 'mobile-sm', width: 320, height: 568 },
    { name: 'sm', width: 576, height: 768 },
    { name: 'md', width: 768, height: 1024 },
    { name: 'lg', width: 992, height: 768 },
    { name: 'xl', width: 1200, height: 900 },
    { name: 'xxl', width: 1400, height: 900 },
  ],
  postTypes: ['standard', 'featured', 'breaking', 'opinion', 'review', 'tutorial', 'listicle', 'interview']
};

const QUICK_MATRIX = {
  skins: ['dark', 'contrast', 'mint'],
  modes: ['light', 'dark'],
  breakpoints: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ],
  postTypes: ['standard', 'featured', 'review']
};

const SMOKE_MATRIX = {
  skins: ['dark'],
  modes: ['light', 'dark'],
  breakpoints: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ],
  postTypes: ['standard']
};

// Select matrix based on environment
const MATRIX = MATRIX_TYPE === 'full' ? FULL_MATRIX : 
               MATRIX_TYPE === 'smoke' ? SMOKE_MATRIX : QUICK_MATRIX;

// Screenshot options
const SCREENSHOT_OPTIONS = {
  fullPage: false,
  threshold: 0.2, // 0.2% pixel difference allowed
  maxDiffPixelRatio: 0.02, // 2% of pixels can differ
};

test.describe('Visual Regression Matrix', () => {
  
  test.describe(`Skin Showcase (${MATRIX_TYPE} matrix)`, () => {
    for (const skin of MATRIX.skins) {
      for (const mode of MATRIX.modes) {
        for (const breakpoint of MATRIX.breakpoints) {
          test(`${skin}/${mode}/${breakpoint.name}`, async ({ page }) => {
            // Set viewport
            await page.setViewportSize({ 
              width: breakpoint.width, 
              height: breakpoint.height 
            });
            
            await page.goto(`${BASE_URL}/test/skin-showcase/`);
            
            // Apply theme
            await page.evaluate(({ skin, mode }) => {
              document.documentElement.setAttribute('data-bs-theme', skin);
              document.documentElement.setAttribute('data-bs-mode', mode);
            }, { skin, mode });
            
            await page.waitForTimeout(300); // Wait for CSS transitions
            
            // Take screenshot
            await expect(page).toHaveScreenshot(
              `skin-showcase/${skin}/${mode}/${breakpoint.name}.png`,
              SCREENSHOT_OPTIONS
            );
          });
        }
      }
    }
  });

  test.describe(`Typography Scale (${MATRIX_TYPE} matrix)`, () => {
    // Typography tests use a subset of configurations
    const typographySkins = MATRIX.skins.slice(0, 3);
    
    for (const skin of typographySkins) {
      for (const mode of MATRIX.modes) {
        test(`${skin}/${mode}/desktop`, async ({ page }) => {
          await page.setViewportSize({ width: 1280, height: 900 });
          
          await page.goto(`${BASE_URL}/test/typography-scale/`);
          
          await page.evaluate(({ skin, mode }) => {
            document.documentElement.setAttribute('data-bs-theme', skin);
            document.documentElement.setAttribute('data-bs-mode', mode);
          }, { skin, mode });
          
          await page.waitForTimeout(300);
          
          await expect(page).toHaveScreenshot(
            `typography/${skin}/${mode}/desktop.png`,
            SCREENSHOT_OPTIONS
          );
        });
      }
    }
  });

  test.describe(`Contrast Test Page (${MATRIX_TYPE} matrix)`, () => {
    for (const skin of MATRIX.skins) {
      for (const mode of MATRIX.modes) {
        test(`${skin}/${mode}/desktop`, async ({ page }) => {
          await page.setViewportSize({ width: 1280, height: 900 });
          
          await page.goto(`${BASE_URL}/test/contrast-test/`);
          
          await page.evaluate(({ skin, mode }) => {
            document.documentElement.setAttribute('data-bs-theme', skin);
            document.documentElement.setAttribute('data-bs-mode', mode);
          }, { skin, mode });
          
          await page.waitForTimeout(300);
          
          await expect(page).toHaveScreenshot(
            `contrast/${skin}/${mode}/desktop.png`,
            SCREENSHOT_OPTIONS
          );
        });
      }
    }
  });
});

test.describe('Component Visual Tests', () => {
  
  test.describe('Color Swatches', () => {
    test('color swatches render correctly', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      await page.waitForSelector('#color-swatches');
      
      await expect(page.locator('#color-swatches')).toHaveScreenshot(
        'components/color-swatches.png',
        SCREENSHOT_OPTIONS
      );
    });
  });

  test.describe('Button Variants', () => {
    test('buttons render correctly', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      await page.waitForSelector('#buttons-section');
      
      await expect(page.locator('#buttons-section')).toHaveScreenshot(
        'components/buttons.png',
        SCREENSHOT_OPTIONS
      );
    });
  });

  test.describe('Cards', () => {
    test('cards render correctly', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      await page.waitForSelector('#cards-section');
      
      await expect(page.locator('#cards-section')).toHaveScreenshot(
        'components/cards.png',
        SCREENSHOT_OPTIONS
      );
    });
  });

  test.describe('Forms', () => {
    test('form controls render correctly', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      await page.waitForSelector('#forms-section');
      
      await expect(page.locator('#forms-section')).toHaveScreenshot(
        'components/forms.png',
        SCREENSHOT_OPTIONS
      );
    });
  });

  test.describe('Alerts', () => {
    test('alerts render correctly', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      await page.waitForSelector('#alerts-section');
      
      await expect(page.locator('#alerts-section')).toHaveScreenshot(
        'components/alerts.png',
        SCREENSHOT_OPTIONS
      );
    });
  });
});

test.describe('Responsive Layout Tests', () => {
  const responsiveBreakpoints = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
  ];

  for (const bp of responsiveBreakpoints) {
    test(`homepage at ${bp.name} (${bp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(
        `responsive/homepage-${bp.name}.png`,
        { ...SCREENSHOT_OPTIONS, fullPage: true }
      );
    });
  }
});

test.describe('Theme Transition Tests', () => {
  test('mode toggle animation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/test/skin-showcase/`);
    
    // Capture light mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-bs-mode', 'light');
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('transitions/mode-light.png', SCREENSHOT_OPTIONS);
    
    // Toggle to dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-bs-mode', 'dark');
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('transitions/mode-dark.png', SCREENSHOT_OPTIONS);
  });
});
