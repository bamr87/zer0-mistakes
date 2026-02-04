/**
 * Configuration Matrix Tests
 * 
 * Tests the full matrix of configurations:
 * - 9 skins × 2 modes × 6 breakpoints × 8 post_types = 864 combinations (full)
 * - Quick matrix: 27 combinations for CI
 * - Smoke matrix: 6 combinations for pre-commit
 */

const { test, expect } = require('@playwright/test');

// Configuration constants
const SKINS = ['air', 'aqua', 'contrast', 'dark', 'dirt', 'neon', 'mint', 'plum', 'sunrise'];
const MODES = ['light', 'dark'];
const BREAKPOINTS = {
  'xs': 375,
  'sm': 576,
  'md': 768,
  'lg': 992,
  'xl': 1200,
  'xxl': 1400
};
const POST_TYPES = ['standard', 'featured', 'breaking', 'opinion', 'review', 'tutorial', 'listicle', 'interview'];

// Quick matrix subset for CI (27 combinations)
const QUICK_MATRIX = {
  skins: ['dark', 'contrast', 'mint'],
  modes: ['light', 'dark'],
  breakpoints: ['xs', 'md', 'xl'],
  postTypes: ['standard', 'featured', 'review']
};

// Smoke matrix for pre-commit (6 combinations)
const SMOKE_MATRIX = {
  skins: ['dark'],
  modes: ['light', 'dark'],
  breakpoints: ['xs', 'md', 'xl'],
  postTypes: ['standard']
};

// Determine which matrix to use based on environment
function getTestMatrix() {
  const matrixType = process.env.MATRIX_TYPE || 'quick';
  
  switch (matrixType) {
    case 'full':
      return {
        skins: SKINS,
        modes: MODES,
        breakpoints: Object.keys(BREAKPOINTS),
        postTypes: POST_TYPES
      };
    case 'smoke':
      return SMOKE_MATRIX;
    case 'quick':
    default:
      return QUICK_MATRIX;
  }
}

const matrix = getTestMatrix();

// Helper to set theme attributes via JavaScript
async function setTheme(page, skin, mode) {
  await page.evaluate(({ skin, mode }) => {
    document.documentElement.setAttribute('data-bs-theme', skin);
    document.documentElement.setAttribute('data-bs-mode', mode);
  }, { skin, mode });
  
  // Wait for CSS transitions
  await page.waitForTimeout(100);
}

// Helper to verify CSS custom properties are applied
async function verifyCSSProperties(page, skin, mode) {
  const properties = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      bodyBg: styles.getPropertyValue('--bs-body-bg').trim(),
      bodyColor: styles.getPropertyValue('--bs-body-color').trim(),
      primary: styles.getPropertyValue('--bs-primary').trim(),
      theme: document.documentElement.getAttribute('data-bs-theme'),
      mode: document.documentElement.getAttribute('data-bs-mode')
    };
  });
  
  expect(properties.theme).toBe(skin);
  expect(properties.mode).toBe(mode);
  expect(properties.bodyBg).not.toBe('');
  expect(properties.bodyColor).not.toBe('');
  
  return properties;
}

// Test skin rendering at each breakpoint
test.describe('Skin × Mode × Breakpoint Matrix', () => {
  for (const skin of matrix.skins) {
    for (const mode of matrix.modes) {
      for (const bp of matrix.breakpoints) {
        test(`${skin}/${mode} @ ${bp} (${BREAKPOINTS[bp]}px)`, async ({ page }) => {
          // Set viewport
          await page.setViewportSize({ 
            width: BREAKPOINTS[bp], 
            height: 800 
          });
          
          // Navigate to skin showcase fixture
          await page.goto('/test/fixtures/skin-showcase/', { 
            waitUntil: 'networkidle',
            timeout: 30000 
          });
          
          // Set theme
          await setTheme(page, skin, mode);
          
          // Verify CSS properties applied
          const props = await verifyCSSProperties(page, skin, mode);
          
          // Verify key elements are visible
          await expect(page.locator('[data-testid="skin-header"]')).toBeVisible();
          await expect(page.locator('[data-testid="color-swatches"]')).toBeVisible();
          
          // Verify no layout breaks (content not overflowing)
          const body = page.locator('body');
          const bodyBox = await body.boundingBox();
          expect(bodyBox.width).toBeLessThanOrEqual(BREAKPOINTS[bp] + 20); // Allow scrollbar
        });
      }
    }
  }
});

// Test post_type layouts
test.describe('Post Type Layouts', () => {
  for (const postType of matrix.postTypes) {
    test(`Layout: ${postType}`, async ({ page }) => {
      await page.goto('/test/fixtures/layout-variants/', { 
        waitUntil: 'networkidle' 
      });
      
      const section = page.locator(`[data-testid="post-type-${postType}"]`);
      await expect(section).toBeVisible();
      
      // Verify section has content
      const sectionBox = await section.boundingBox();
      expect(sectionBox.height).toBeGreaterThan(100);
    });
  }
});

// Test responsive behavior
test.describe('Responsive Breakpoint Behavior', () => {
  const boundaryTests = [
    { name: 'XS to SM boundary', below: 575, above: 576 },
    { name: 'SM to MD boundary', below: 767, above: 768 },
    { name: 'MD to LG boundary', below: 991, above: 992 },
    { name: 'LG to XL boundary', below: 1199, above: 1200 },
    { name: 'XL to XXL boundary', below: 1399, above: 1400 }
  ];
  
  for (const boundary of boundaryTests) {
    test(`${boundary.name}`, async ({ page }) => {
      await page.goto('/test/fixtures/breakpoint-grid/', { 
        waitUntil: 'networkidle' 
      });
      
      // Test below boundary
      await page.setViewportSize({ width: boundary.below, height: 800 });
      await page.waitForTimeout(100);
      
      const indicatorBelow = await page.locator('[data-testid="breakpoint-indicator"]').textContent();
      
      // Test above boundary
      await page.setViewportSize({ width: boundary.above, height: 800 });
      await page.waitForTimeout(100);
      
      const indicatorAbove = await page.locator('[data-testid="breakpoint-indicator"]').textContent();
      
      // Indicators should be different across boundary
      expect(indicatorBelow).not.toBe(indicatorAbove);
    });
  }
});

// Test sidebar behavior
test.describe('Sidebar Responsive Behavior', () => {
  test('Sidebar visible on desktop, offcanvas on mobile', async ({ page }) => {
    await page.goto('/test/fixtures/breakpoint-grid/', { 
      waitUntil: 'networkidle' 
    });
    
    // Desktop: sidebar visible
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-testid="sidebar-desktop"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-toggle"]')).not.toBeVisible();
    
    // Mobile: sidebar hidden, toggle visible
    await page.setViewportSize({ width: 375, height: 800 });
    await expect(page.locator('[data-testid="sidebar-desktop"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="sidebar-toggle"]')).toBeVisible();
  });
});

// Test navbar collapse
test.describe('Navbar Collapse Behavior', () => {
  test('Navbar expands on desktop, collapses on mobile', async ({ page }) => {
    await page.goto('/test/fixtures/breakpoint-grid/', { 
      waitUntil: 'networkidle' 
    });
    
    // Desktop: navbar expanded
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-testid="navbar-collapse-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-toggler"]')).not.toBeVisible();
    
    // Mobile: navbar collapsed
    await page.setViewportSize({ width: 375, height: 800 });
    await expect(page.locator('[data-testid="navbar-toggler"]')).toBeVisible();
    
    // Navbar content should be in collapsed state
    const navContent = page.locator('[data-testid="navbar-collapse-content"]');
    await expect(navContent).not.toHaveClass(/show/);
  });
});

// Test container widths
test.describe('Container Max Widths', () => {
  const containerTests = [
    { breakpoint: 'sm', width: 576, maxWidth: 540 },
    { breakpoint: 'md', width: 768, maxWidth: 720 },
    { breakpoint: 'lg', width: 992, maxWidth: 960 },
    { breakpoint: 'xl', width: 1200, maxWidth: 1140 },
    { breakpoint: 'xxl', width: 1400, maxWidth: 1320 }
  ];
  
  for (const ct of containerTests) {
    test(`Container max-width at ${ct.breakpoint} (${ct.width}px)`, async ({ page }) => {
      await page.goto('/test/fixtures/breakpoint-grid/', { 
        waitUntil: 'networkidle' 
      });
      
      await page.setViewportSize({ width: ct.width, height: 800 });
      await page.waitForTimeout(100);
      
      const container = page.locator('[data-testid="container-default"]');
      const box = await container.boundingBox();
      
      // Container should not exceed max-width (allow some margin for padding)
      expect(box.width).toBeLessThanOrEqual(ct.maxWidth + 30);
    });
  }
});

// Visual regression tests (uses native Playwright snapshots)
test.describe('Visual Regression', () => {
  // Only run a subset for visual regression to keep it fast
  const visualMatrix = {
    skins: ['dark', 'contrast'],
    modes: ['light', 'dark'],
    breakpoints: ['xs', 'lg']
  };
  
  for (const skin of visualMatrix.skins) {
    for (const mode of visualMatrix.modes) {
      for (const bp of visualMatrix.breakpoints) {
        test(`Screenshot: ${skin}/${mode} @ ${bp}`, async ({ page }) => {
          await page.setViewportSize({ 
            width: BREAKPOINTS[bp], 
            height: 800 
          });
          
          await page.goto('/test/fixtures/skin-showcase/', { 
            waitUntil: 'networkidle' 
          });
          
          await setTheme(page, skin, mode);
          await page.waitForTimeout(200); // Wait for transitions
          
          // Take screenshot with 0.2% threshold
          await expect(page).toHaveScreenshot(
            `${skin}-${mode}-${bp}.png`,
            { 
              maxDiffPixelRatio: 0.002,
              fullPage: false 
            }
          );
        });
      }
    }
  }
});
