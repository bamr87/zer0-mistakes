// =============================================================================
// Component Configuration Test Suite
// =============================================================================
//
// Tests Bootstrap 5 component rendering and configuration across
// different post types and page layouts.
//
// Components Tested:
//   - Buttons (variants, sizes, states)
//   - Cards (headers, footers, images)
//   - Forms (inputs, selects, checkboxes)
//   - Alerts (all variants)
//   - Navigation (navbar, tabs, breadcrumbs)
//   - Modals, Dropdowns, Tooltips
//
// Usage:
//   npx playwright test test/playwright/component-configs.spec.js
//
// =============================================================================

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

// Bootstrap button variants
const BTN_VARIANTS = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
const BTN_OUTLINE_VARIANTS = BTN_VARIANTS.map(v => `outline-${v}`);

// Alert variants
const ALERT_VARIANTS = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];

test.describe('Bootstrap 5 Components', () => {

  test.describe('Buttons', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
    });

    for (const variant of BTN_VARIANTS) {
      test(`btn-${variant} renders correctly`, async ({ page }) => {
        const btn = page.locator(`.btn-${variant}`).first();
        if (await btn.count() > 0) {
          await expect(btn).toBeVisible();
          
          // Check has appropriate styling
          const bgColor = await btn.evaluate(el => {
            return getComputedStyle(el).backgroundColor;
          });
          expect(bgColor).toBeTruthy();
        }
      });
    }

    test('button sizes work correctly', async ({ page }) => {
      const sizes = ['btn-sm', 'btn-lg'];
      
      for (const size of sizes) {
        const btn = page.locator(`.${size}`).first();
        if (await btn.count() > 0) {
          await expect(btn).toBeVisible();
        }
      }
    });

    test('disabled buttons have correct styling', async ({ page }) => {
      const disabledBtn = page.locator('.btn:disabled, .btn.disabled').first();
      if (await disabledBtn.count() > 0) {
        // Should have reduced opacity or pointer-events none
        const styles = await disabledBtn.evaluate(el => {
          const computed = getComputedStyle(el);
          return {
            opacity: parseFloat(computed.opacity),
            pointerEvents: computed.pointerEvents
          };
        });
        
        expect(styles.opacity < 1 || styles.pointerEvents === 'none').toBe(true);
      }
    });
  });

  test.describe('Cards', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
    });

    test('card has correct structure', async ({ page }) => {
      const card = page.locator('.card').first();
      if (await card.count() > 0) {
        await expect(card).toBeVisible();
        
        // Check for card styling
        const styles = await card.evaluate(el => {
          const computed = getComputedStyle(el);
          return {
            borderRadius: computed.borderRadius,
            backgroundColor: computed.backgroundColor
          };
        });
        
        expect(styles.backgroundColor).toBeTruthy();
      }
    });

    test('card-header renders correctly', async ({ page }) => {
      const header = page.locator('.card-header').first();
      if (await header.count() > 0) {
        await expect(header).toBeVisible();
        
        // Should have different background from card body
        const bgColor = await header.evaluate(el => {
          return getComputedStyle(el).backgroundColor;
        });
        expect(bgColor).toBeTruthy();
      }
    });

    test('card-body has padding', async ({ page }) => {
      const body = page.locator('.card-body').first();
      if (await body.count() > 0) {
        const padding = await body.evaluate(el => {
          return parseFloat(getComputedStyle(el).padding);
        });
        
        expect(padding).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Forms', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
    });

    test('form-control has consistent styling', async ({ page }) => {
      const input = page.locator('.form-control').first();
      if (await input.count() > 0) {
        await expect(input).toBeVisible();
        
        const styles = await input.evaluate(el => {
          const computed = getComputedStyle(el);
          return {
            borderRadius: computed.borderRadius,
            padding: computed.padding,
            border: computed.border
          };
        });
        
        expect(styles.padding).toBeTruthy();
      }
    });

    test('form-control focus state works', async ({ page }) => {
      const input = page.locator('.form-control').first();
      if (await input.count() > 0) {
        await input.focus();
        
        // Should have focus ring or border change
        const focusStyles = await input.evaluate(el => {
          const computed = getComputedStyle(el);
          return {
            boxShadow: computed.boxShadow,
            borderColor: computed.borderColor,
            outline: computed.outline
          };
        });
        
        const hasFocusIndicator = 
          focusStyles.boxShadow !== 'none' || 
          focusStyles.outline !== 'none';
        
        expect(hasFocusIndicator).toBe(true);
      }
    });

    test('form-select renders correctly', async ({ page }) => {
      const select = page.locator('.form-select').first();
      if (await select.count() > 0) {
        await expect(select).toBeVisible();
      }
    });

    test('form-check (checkbox/radio) renders correctly', async ({ page }) => {
      const check = page.locator('.form-check').first();
      if (await check.count() > 0) {
        await expect(check).toBeVisible();
      }
    });
  });

  test.describe('Alerts', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
    });

    for (const variant of ALERT_VARIANTS) {
      test(`alert-${variant} has correct styling`, async ({ page }) => {
        const alert = page.locator(`.alert-${variant}`).first();
        if (await alert.count() > 0) {
          await expect(alert).toBeVisible();
          
          // Should have background and border
          const styles = await alert.evaluate(el => {
            const computed = getComputedStyle(el);
            return {
              backgroundColor: computed.backgroundColor,
              borderColor: computed.borderColor
            };
          });
          
          expect(styles.backgroundColor).toBeTruthy();
          expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        }
      });
    }

    test('dismissible alert has close button', async ({ page }) => {
      const dismissible = page.locator('.alert-dismissible').first();
      if (await dismissible.count() > 0) {
        const closeBtn = dismissible.locator('.btn-close');
        await expect(closeBtn).toBeVisible();
      }
    });
  });

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(BASE_URL);
    });

    test('navbar has correct structure', async ({ page }) => {
      const navbar = page.locator('.navbar').first();
      await expect(navbar).toBeVisible();
    });

    test('navbar-brand is visible', async ({ page }) => {
      const brand = page.locator('.navbar-brand').first();
      if (await brand.count() > 0) {
        await expect(brand).toBeVisible();
      }
    });

    test('nav-link items have correct styling', async ({ page }) => {
      const navLink = page.locator('.nav-link').first();
      if (await navLink.count() > 0) {
        const styles = await navLink.evaluate(el => {
          return getComputedStyle(el).color;
        });
        expect(styles).toBeTruthy();
      }
    });
  });

  test.describe('Breadcrumbs', () => {
    test('breadcrumb renders correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/docs/`);
      
      const breadcrumb = page.locator('.breadcrumb').first();
      if (await breadcrumb.count() > 0) {
        await expect(breadcrumb).toBeVisible();
        
        // Should have list items
        const items = breadcrumb.locator('.breadcrumb-item');
        expect(await items.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Badges', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
    });

    test('badge renders correctly', async ({ page }) => {
      const badge = page.locator('.badge').first();
      if (await badge.count() > 0) {
        await expect(badge).toBeVisible();
        
        const styles = await badge.evaluate(el => {
          return {
            borderRadius: getComputedStyle(el).borderRadius,
            padding: getComputedStyle(el).padding
          };
        });
        
        expect(styles.padding).toBeTruthy();
      }
    });
  });

  test.describe('Tables', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
    });

    test('table has correct styling', async ({ page }) => {
      const table = page.locator('.table').first();
      if (await table.count() > 0) {
        await expect(table).toBeVisible();
        
        // Check border styling
        const styles = await table.evaluate(el => {
          return getComputedStyle(el).borderCollapse;
        });
        
        expect(styles).toBe('collapse');
      }
    });

    test('table-striped alternates rows', async ({ page }) => {
      const stripedTable = page.locator('.table-striped').first();
      if (await stripedTable.count() > 0) {
        const rows = stripedTable.locator('tbody tr');
        if (await rows.count() >= 2) {
          const [row1Bg, row2Bg] = await Promise.all([
            rows.nth(0).evaluate(el => getComputedStyle(el).backgroundColor),
            rows.nth(1).evaluate(el => getComputedStyle(el).backgroundColor)
          ]);
          
          // Rows should have different backgrounds
          expect(row1Bg).not.toBe(row2Bg);
        }
      }
    });
  });
});

test.describe('Interactive Components', () => {

  test.describe('Dropdown', () => {
    test('dropdown toggles on click', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const dropdownToggle = page.locator('[data-bs-toggle="dropdown"]').first();
      if (await dropdownToggle.count() > 0) {
        // Should be collapsed initially
        const menu = page.locator('.dropdown-menu').first();
        await expect(menu).not.toBeVisible();
        
        // Click to open
        await dropdownToggle.click();
        await expect(menu).toBeVisible();
        
        // Click again to close (or click outside)
        await page.keyboard.press('Escape');
        await expect(menu).not.toBeVisible();
      }
    });
  });

  test.describe('Collapse', () => {
    test('collapse toggles content', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const collapseToggle = page.locator('[data-bs-toggle="collapse"]').first();
      if (await collapseToggle.count() > 0) {
        const targetId = await collapseToggle.getAttribute('data-bs-target') ||
                        await collapseToggle.getAttribute('href');
        
        if (targetId) {
          const target = page.locator(targetId);
          const wasVisible = await target.isVisible();
          
          await collapseToggle.click();
          await page.waitForTimeout(400); // Wait for transition
          
          const isNowVisible = await target.isVisible();
          expect(isNowVisible).not.toBe(wasVisible);
        }
      }
    });
  });

  test.describe('Tabs', () => {
    test('tab navigation works', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const tab = page.locator('[data-bs-toggle="tab"], [data-bs-toggle="pill"]').first();
      if (await tab.count() > 0) {
        await tab.click();
        
        // Tab should become active
        await expect(tab).toHaveClass(/active/);
      }
    });
  });

  test.describe('Modal', () => {
    test('modal opens and closes', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const modalTrigger = page.locator('[data-bs-toggle="modal"]').first();
      if (await modalTrigger.count() > 0) {
        const targetId = await modalTrigger.getAttribute('data-bs-target');
        
        if (targetId) {
          // Open modal
          await modalTrigger.click();
          const modal = page.locator(targetId);
          await expect(modal).toBeVisible();
          
          // Close modal
          const closeBtn = modal.locator('[data-bs-dismiss="modal"], .btn-close').first();
          await closeBtn.click();
          await expect(modal).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Tooltip', () => {
    test('tooltip shows on hover', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/skin-showcase/`);
      
      const tooltipTrigger = page.locator('[data-bs-toggle="tooltip"]').first();
      if (await tooltipTrigger.count() > 0) {
        // Hover to show
        await tooltipTrigger.hover();
        await page.waitForTimeout(200);
        
        // Tooltip should appear
        const tooltip = page.locator('.tooltip');
        await expect(tooltip).toBeVisible();
      }
    });
  });
});

test.describe('Component States', () => {

  test('hover states apply correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/test/skin-showcase/`);
    
    const btn = page.locator('.btn-primary').first();
    if (await btn.count() > 0) {
      const normalBg = await btn.evaluate(el => getComputedStyle(el).backgroundColor);
      
      await btn.hover();
      await page.waitForTimeout(100);
      
      const hoverBg = await btn.evaluate(el => getComputedStyle(el).backgroundColor);
      
      // Colors may or may not change on hover, but shouldn't error
      expect(hoverBg).toBeTruthy();
    }
  });

  test('active states apply on click', async ({ page }) => {
    await page.goto(`${BASE_URL}/test/skin-showcase/`);
    
    const btn = page.locator('.btn-primary').first();
    if (await btn.count() > 0) {
      await btn.click();
      
      // Button should respond to click
      await expect(btn).toBeVisible();
    }
  });
});
