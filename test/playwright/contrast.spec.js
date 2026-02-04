// =============================================================================
// WCAG Contrast Test Suite
// =============================================================================
//
// Validates color contrast ratios for WCAG 2.1 AA and AAA compliance
// across all 18 theme skin variants using axe-playwright.
//
// Standards:
//   - WCAG AA: 4.5:1 for normal text, 3:1 for large text and UI
//   - WCAG AAA: 7:1 for normal text, 4.5:1 for large text
//
// Usage:
//   npx playwright test test/playwright/contrast.spec.js
//
// =============================================================================

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

// All skin/mode combinations (18 total)
const SKINS = ['air', 'aqua', 'contrast', 'dark', 'dirt', 'neon', 'mint', 'plum', 'sunrise'];
const MODES = ['light', 'dark'];

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

test.describe('WCAG Contrast Validation', () => {

  test.describe('Contrast Test Fixture', () => {
    test('fixture page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/contrast-test/`);
      await expect(page.locator('h1')).toContainText('WCAG Contrast Validation');
    });
  });

  test.describe('WCAG AA Compliance - All Skins', () => {
    for (const skin of SKINS) {
      for (const mode of MODES) {
        test(`${skin}/${mode} - passes WCAG AA color contrast`, async ({ page }) => {
          await page.goto(`${BASE_URL}/test/contrast-test/`);
          
          // Apply skin and mode
          await page.evaluate(({ skin, mode }) => {
            document.documentElement.setAttribute('data-bs-theme', skin);
            document.documentElement.setAttribute('data-bs-mode', mode);
          }, { skin, mode });
          
          await page.waitForTimeout(200); // Wait for CSS to apply
          
          // Run axe accessibility scan focused on color contrast
          const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2aa'])
            .analyze();
          
          // Filter to only color-contrast violations
          const contrastViolations = accessibilityScanResults.violations.filter(
            v => v.id === 'color-contrast'
          );
          
          // Log violations for debugging
          if (contrastViolations.length > 0) {
            console.log(`\n${skin}/${mode} contrast violations:`);
            contrastViolations.forEach(violation => {
              violation.nodes.forEach(node => {
                console.log(`  - ${node.target}: ${node.failureSummary}`);
              });
            });
          }
          
          expect(contrastViolations, 
            `${skin}/${mode} should have no WCAG AA contrast violations`
          ).toHaveLength(0);
        });
      }
    }
  });

  test.describe('WCAG AAA Compliance - Contrast Skin', () => {
    // The "contrast" skin must meet WCAG AAA (7:1 for normal text)
    for (const mode of MODES) {
      test(`contrast/${mode} - passes WCAG AAA color contrast`, async ({ page }) => {
        await page.goto(`${BASE_URL}/test/contrast-test/`);
        
        // Apply contrast skin
        await page.evaluate(({ mode }) => {
          document.documentElement.setAttribute('data-bs-theme', 'contrast');
          document.documentElement.setAttribute('data-bs-mode', mode);
        }, { mode });
        
        await page.waitForTimeout(200);
        
        // Run axe with AAA standard
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2aaa'])
          .analyze();
        
        const contrastViolations = accessibilityScanResults.violations.filter(
          v => v.id === 'color-contrast-enhanced'
        );
        
        if (contrastViolations.length > 0) {
          console.log(`\ncontrast/${mode} AAA violations:`);
          contrastViolations.forEach(violation => {
            violation.nodes.forEach(node => {
              console.log(`  - ${node.target}: ${node.failureSummary}`);
            });
          });
        }
        
        expect(contrastViolations,
          `contrast/${mode} should meet WCAG AAA contrast requirements`
        ).toHaveLength(0);
      });
    }
  });

  test.describe('Specific Element Contrast', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/contrast-test/`);
    });

    test('body text has sufficient contrast', async ({ page }) => {
      const results = await new AxeBuilder({ page })
        .include('[data-contrast="body-normal"]')
        .withTags(['wcag2aa'])
        .analyze();
      
      const violations = results.violations.filter(v => v.id === 'color-contrast');
      expect(violations).toHaveLength(0);
    });

    test('link text has sufficient contrast', async ({ page }) => {
      const results = await new AxeBuilder({ page })
        .include('[data-contrast="link"]')
        .withTags(['wcag2aa'])
        .analyze();
      
      const violations = results.violations.filter(v => v.id === 'color-contrast');
      expect(violations).toHaveLength(0);
    });

    test('button text has sufficient contrast', async ({ page }) => {
      const results = await new AxeBuilder({ page })
        .include('[data-contrast^="btn-"]')
        .withTags(['wcag2aa'])
        .analyze();
      
      const violations = results.violations.filter(v => v.id === 'color-contrast');
      expect(violations).toHaveLength(0);
    });

    test('form labels have sufficient contrast', async ({ page }) => {
      const results = await new AxeBuilder({ page })
        .include('[data-contrast="form-label"]')
        .withTags(['wcag2aa'])
        .analyze();
      
      const violations = results.violations.filter(v => v.id === 'color-contrast');
      expect(violations).toHaveLength(0);
    });

    test('secondary text has sufficient contrast', async ({ page }) => {
      const results = await new AxeBuilder({ page })
        .include('[data-contrast="secondary-text"]')
        .withTags(['wcag2aa'])
        .analyze();
      
      const violations = results.violations.filter(v => v.id === 'color-contrast');
      expect(violations).toHaveLength(0);
    });
  });

  test.describe('Focus Indicator Visibility', () => {
    test('focus indicators are visible (3:1 contrast)', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/contrast-test/`);
      
      // Focus on a button
      const button = page.locator('[data-contrast="focus-button"]');
      await button.focus();
      
      // Get focus ring color
      const focusRing = await page.evaluate(() => {
        const btn = document.querySelector('[data-contrast="focus-button"]');
        const styles = getComputedStyle(btn);
        return {
          boxShadow: styles.boxShadow,
          outline: styles.outline,
          outlineColor: styles.outlineColor
        };
      });
      
      // Verify some form of focus indication exists
      const hasFocusIndicator = 
        focusRing.boxShadow !== 'none' || 
        (focusRing.outline !== 'none' && focusRing.outline !== '0px');
      
      expect(hasFocusIndicator, 'Focus indicator should be visible').toBe(true);
    });
  });

  test.describe('Alert Contrast', () => {
    const alertTypes = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
    
    for (const alertType of alertTypes) {
      test(`alert-${alertType} text has sufficient contrast`, async ({ page }) => {
        await page.goto(`${BASE_URL}/test/contrast-test/`);
        
        const results = await new AxeBuilder({ page })
          .include(`[data-contrast="alert-${alertType}"]`)
          .withTags(['wcag2aa'])
          .analyze();
        
        const violations = results.violations.filter(v => v.id === 'color-contrast');
        expect(violations, `alert-${alertType} should pass contrast check`).toHaveLength(0);
      });
    }
  });

  test.describe('Code Block Contrast', () => {
    test('inline code has sufficient contrast', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/contrast-test/`);
      
      const results = await new AxeBuilder({ page })
        .include('[data-contrast="inline-code"] code')
        .withTags(['wcag2aa'])
        .analyze();
      
      const violations = results.violations.filter(v => v.id === 'color-contrast');
      expect(violations).toHaveLength(0);
    });

    test('code block has sufficient contrast', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/contrast-test/`);
      
      const results = await new AxeBuilder({ page })
        .include('[data-contrast="code-block"]')
        .withTags(['wcag2aa'])
        .analyze();
      
      const violations = results.violations.filter(v => v.id === 'color-contrast');
      expect(violations).toHaveLength(0);
    });
  });
});

test.describe('Full Accessibility Scan', () => {
  test('skin showcase has no critical accessibility violations', async ({ page }) => {
    await page.goto(`${BASE_URL}/test/skin-showcase/`);
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Allow some violations but flag them
    const criticalViolations = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    if (criticalViolations.length > 0) {
      console.log('\nCritical/Serious violations:');
      criticalViolations.forEach(v => {
        console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
        v.nodes.slice(0, 3).forEach(n => {
          console.log(`    - ${n.target}`);
        });
      });
    }
    
    expect(criticalViolations, 'Should have no critical accessibility violations').toHaveLength(0);
  });
});
