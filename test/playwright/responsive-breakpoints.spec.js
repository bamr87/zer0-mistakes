// =============================================================================
// Responsive Breakpoints Test Suite
// =============================================================================
//
// Tests Bootstrap 5 responsive behavior across all standard breakpoints.
// Validates element visibility, layout changes, and navigation behavior.
//
// Bootstrap 5 Breakpoints:
//   - xs: < 576px
//   - sm: ≥ 576px
//   - md: ≥ 768px
//   - lg: ≥ 992px
//   - xl: ≥ 1200px
//   - xxl: ≥ 1400px
//
// Usage:
//   npx playwright test test/playwright/responsive-breakpoints.spec.js
//
// =============================================================================

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

// Bootstrap 5 breakpoints
const BREAKPOINTS = {
  xs: { name: 'xs', width: 375, height: 667, maxWidth: 575 },
  sm: { name: 'sm', width: 576, height: 768, minWidth: 576, maxWidth: 767 },
  md: { name: 'md', width: 768, height: 1024, minWidth: 768, maxWidth: 991 },
  lg: { name: 'lg', width: 992, height: 768, minWidth: 992, maxWidth: 1199 },
  xl: { name: 'xl', width: 1200, height: 900, minWidth: 1200, maxWidth: 1399 },
  xxl: { name: 'xxl', width: 1400, height: 900, minWidth: 1400 },
};

test.describe('Bootstrap 5 Responsive Breakpoints', () => {

  test.describe('Mobile (xs: < 576px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: BREAKPOINTS.xs.width, height: BREAKPOINTS.xs.height });
    });

    test('navigation collapses to hamburger menu', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Hamburger toggle should be visible
      const hamburger = page.locator('.navbar-toggler');
      await expect(hamburger).toBeVisible();
      
      // Full nav should be collapsed/hidden
      const navCollapse = page.locator('.navbar-collapse');
      await expect(navCollapse).not.toBeVisible();
    });

    test('hamburger menu toggles navigation', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const hamburger = page.locator('.navbar-toggler');
      const navCollapse = page.locator('.navbar-collapse');
      
      // Click to open
      await hamburger.click();
      await expect(navCollapse).toBeVisible();
      
      // Click to close
      await hamburger.click();
      await page.waitForTimeout(400); // Wait for collapse animation
      await expect(navCollapse).not.toBeVisible();
    });

    test('sidebar is hidden on mobile', async ({ page }) => {
      await page.goto(`${BASE_URL}/docs/`);
      
      // Sidebar with d-none d-lg-block should be hidden
      const sidebar = page.locator('.sidebar, [class*="sidebar"]');
      if (await sidebar.count() > 0) {
        const sidebarClasses = await sidebar.first().getAttribute('class');
        // Either sidebar is hidden or uses mobile-specific display
        const isHidden = !await sidebar.first().isVisible() || 
                         sidebarClasses?.includes('d-lg-block');
        expect(isHidden).toBe(true);
      }
    });

    test('container uses full width', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const container = page.locator('.container, .container-fluid').first();
      const box = await container.boundingBox();
      
      // Should be close to viewport width (minus padding)
      expect(box.width).toBeGreaterThan(BREAKPOINTS.xs.width - 40);
    });

    test('cards stack vertically', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const cards = page.locator('.card');
      if (await cards.count() >= 2) {
        const card1Box = await cards.nth(0).boundingBox();
        const card2Box = await cards.nth(1).boundingBox();
        
        // Cards should stack (card2 below card1)
        expect(card2Box.y).toBeGreaterThanOrEqual(card1Box.y + card1Box.height);
      }
    });
  });

  test.describe('Small (sm: 576px - 767px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: BREAKPOINTS.sm.width, height: BREAKPOINTS.sm.height });
    });

    test('navbar still collapsed at sm', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const hamburger = page.locator('.navbar-toggler');
      // Navbar should still be collapsed at sm (expands at lg by default)
      await expect(hamburger).toBeVisible();
    });

    test('d-sm-* classes take effect', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      // Elements with d-none d-sm-block should be visible
      const smVisible = page.locator('.d-none.d-sm-block').first();
      if (await smVisible.count() > 0) {
        await expect(smVisible).toBeVisible();
      }
    });
  });

  test.describe('Medium (md: 768px - 991px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: BREAKPOINTS.md.width, height: BREAKPOINTS.md.height });
    });

    test('navbar still collapsed at md', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const hamburger = page.locator('.navbar-toggler');
      // Should still be collapsed (navbar-expand-lg means lg and up)
      await expect(hamburger).toBeVisible();
    });

    test('two-column layouts may appear', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      // col-md-6 elements should be side by side
      const colMd6 = page.locator('.col-md-6');
      if (await colMd6.count() >= 2) {
        const col1Box = await colMd6.nth(0).boundingBox();
        const col2Box = await colMd6.nth(1).boundingBox();
        
        // Should be on same row (similar y position)
        expect(Math.abs(col2Box.y - col1Box.y)).toBeLessThan(10);
      }
    });
  });

  test.describe('Large (lg: 992px - 1199px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: BREAKPOINTS.lg.width, height: BREAKPOINTS.lg.height });
    });

    test('navigation is fully expanded', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Hamburger should be hidden (navbar-expand-lg)
      const hamburger = page.locator('.navbar-toggler');
      await expect(hamburger).not.toBeVisible();
      
      // Nav items should be visible
      const navCollapse = page.locator('.navbar-collapse');
      await expect(navCollapse).toBeVisible();
    });

    test('sidebar visible on lg', async ({ page }) => {
      await page.goto(`${BASE_URL}/docs/`);
      
      // Sidebar with d-lg-block should be visible
      const sidebar = page.locator('.d-lg-block');
      if (await sidebar.count() > 0) {
        await expect(sidebar.first()).toBeVisible();
      }
    });

    test('three-column layouts work', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      // col-lg-4 elements should fit three per row
      const colLg4 = page.locator('.col-lg-4');
      if (await colLg4.count() >= 3) {
        const col1Box = await colLg4.nth(0).boundingBox();
        const col2Box = await colLg4.nth(1).boundingBox();
        const col3Box = await colLg4.nth(2).boundingBox();
        
        // All three should be on same row
        expect(Math.abs(col2Box.y - col1Box.y)).toBeLessThan(10);
        expect(Math.abs(col3Box.y - col1Box.y)).toBeLessThan(10);
      }
    });
  });

  test.describe('Extra Large (xl: 1200px - 1399px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: BREAKPOINTS.xl.width, height: BREAKPOINTS.xl.height });
    });

    test('container has max-width applied', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const container = page.locator('.container').first();
      const box = await container.boundingBox();
      
      // Container should have max-width (not full viewport)
      expect(box.width).toBeLessThan(BREAKPOINTS.xl.width);
    });

    test('d-xl-* classes take effect', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      // Elements with d-xl-block should be visible
      const xlVisible = page.locator('.d-xl-block:not(.d-xxl-none)').first();
      if (await xlVisible.count() > 0) {
        await expect(xlVisible).toBeVisible();
      }
    });
  });

  test.describe('Extra Extra Large (xxl: ≥ 1400px)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: BREAKPOINTS.xxl.width, height: BREAKPOINTS.xxl.height });
    });

    test('content centered with max-width', async ({ page }) => {
      await page.goto(BASE_URL);
      
      const container = page.locator('.container').first();
      const box = await container.boundingBox();
      
      // Container should be centered
      const leftMargin = box.x;
      const rightMargin = BREAKPOINTS.xxl.width - box.x - box.width;
      
      // Margins should be roughly equal (centered)
      expect(Math.abs(leftMargin - rightMargin)).toBeLessThan(50);
    });
  });
});

test.describe('Responsive Utility Classes', () => {
  
  test('d-none hides element', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/test/skin-showcase/`);
    
    const hidden = page.locator('.d-none:not(.d-sm-block):not(.d-md-block):not(.d-lg-block):not(.d-xl-block):not(.d-xxl-block)');
    if (await hidden.count() > 0) {
      await expect(hidden.first()).not.toBeVisible();
    }
  });

  test.describe('Responsive display utilities', () => {
    const testCases = [
      { viewport: 320, expectVisible: false, class: '.d-none.d-sm-block' },
      { viewport: 576, expectVisible: true, class: '.d-none.d-sm-block' },
      { viewport: 600, expectVisible: false, class: '.d-none.d-md-block' },
      { viewport: 768, expectVisible: true, class: '.d-none.d-md-block' },
      { viewport: 900, expectVisible: false, class: '.d-none.d-lg-block' },
      { viewport: 992, expectVisible: true, class: '.d-none.d-lg-block' },
    ];

    for (const tc of testCases) {
      test(`${tc.class} at ${tc.viewport}px is ${tc.expectVisible ? 'visible' : 'hidden'}`, async ({ page }) => {
        await page.setViewportSize({ width: tc.viewport, height: 800 });
        await page.goto(`${BASE_URL}/test/skin-showcase/`);
        
        const el = page.locator(tc.class).first();
        if (await el.count() > 0) {
          if (tc.expectVisible) {
            await expect(el).toBeVisible();
          } else {
            await expect(el).not.toBeVisible();
          }
        }
      });
    }
  });
});

test.describe('Responsive Typography', () => {
  
  test('headings scale appropriately', async ({ page }) => {
    await page.goto(`${BASE_URL}/test/typography-scale/`);
    
    // Get h1 size at mobile
    await page.setViewportSize({ width: 375, height: 667 });
    const h1Mobile = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return parseFloat(getComputedStyle(h1).fontSize);
    });
    
    // Get h1 size at desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    const h1Desktop = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return parseFloat(getComputedStyle(h1).fontSize);
    });
    
    // Desktop h1 should be larger or equal to mobile
    expect(h1Desktop).toBeGreaterThanOrEqual(h1Mobile);
  });
});

test.describe('Responsive Images', () => {
  
  test('images with img-fluid scale to container', async ({ page }) => {
    await page.goto(`${BASE_URL}/test/skin-showcase/`);
    
    const imgFluid = page.locator('img.img-fluid').first();
    if (await imgFluid.count() > 0) {
      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      const mobileWidth = (await imgFluid.boundingBox()).width;
      
      // Desktop
      await page.setViewportSize({ width: 1280, height: 800 });
      const desktopWidth = (await imgFluid.boundingBox()).width;
      
      // Image should scale
      expect(desktopWidth).toBeGreaterThanOrEqual(mobileWidth);
    }
  });
});
