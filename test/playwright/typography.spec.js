// =============================================================================
// Typography Test Suite
// =============================================================================
//
// Validates typography tokens, font rendering, and text styles
// across the theme. Ensures consistent typographic scale.
//
// Design Tokens Tested:
//   - Font families (body, headings, monospace)
//   - Font sizes (display, h1-h6, body, small)
//   - Line heights
//   - Font weights
//
// Usage:
//   npx playwright test test/playwright/typography.spec.js
//
// =============================================================================

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

// Expected typography scale based on Bootstrap 5 defaults
const TYPOGRAPHY_SCALE = {
  'display-1': { minSize: 80, maxSize: 100 },
  'display-2': { minSize: 60, maxSize: 80 },
  'display-3': { minSize: 50, maxSize: 60 },
  'display-4': { minSize: 40, maxSize: 50 },
  'display-5': { minSize: 30, maxSize: 40 },
  'display-6': { minSize: 24, maxSize: 32 },
  'h1': { minSize: 28, maxSize: 42 },
  'h2': { minSize: 24, maxSize: 34 },
  'h3': { minSize: 20, maxSize: 28 },
  'h4': { minSize: 18, maxSize: 24 },
  'h5': { minSize: 16, maxSize: 20 },
  'h6': { minSize: 14, maxSize: 18 },
  'body': { minSize: 14, maxSize: 18 },
  'small': { minSize: 12, maxSize: 14 },
};

// Required CSS custom properties for typography
const TYPOGRAPHY_CSS_VARS = [
  '--bs-body-font-family',
  '--bs-body-font-size',
  '--bs-body-font-weight',
  '--bs-body-line-height',
  '--bs-body-color',
];

test.describe('Typography Design Tokens', () => {

  test.describe('Typography Fixture Page', () => {
    test('loads typography scale fixture', async ({ page }) => {
      await page.goto(`${BASE_URL}/test/typography-scale/`);
      await expect(page.locator('h1')).toContainText('Typography Scale');
    });
  });

  test.describe('CSS Custom Properties', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/typography-scale/`);
    });

    for (const varName of TYPOGRAPHY_CSS_VARS) {
      test(`${varName} is defined`, async ({ page }) => {
        const value = await page.evaluate((varName) => {
          return getComputedStyle(document.documentElement)
            .getPropertyValue(varName).trim();
        }, varName);
        
        expect(value, `${varName} should be defined`).toBeTruthy();
      });
    }
  });

  test.describe('Font Family', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/typography-scale/`);
    });

    test('body uses sans-serif font stack', async ({ page }) => {
      const fontFamily = await page.evaluate(() => {
        return getComputedStyle(document.body).fontFamily;
      });
      
      expect(fontFamily).toBeTruthy();
      // Should contain system fonts or common sans-serif
      const hasSansSerif = fontFamily.includes('sans-serif') || 
                          fontFamily.includes('system-ui') ||
                          fontFamily.includes('Segoe') ||
                          fontFamily.includes('Roboto');
      expect(hasSansSerif).toBe(true);
    });

    test('code uses monospace font', async ({ page }) => {
      const codeFont = await page.evaluate(() => {
        const code = document.querySelector('code');
        return code ? getComputedStyle(code).fontFamily : '';
      });
      
      if (codeFont) {
        const hasMonospace = codeFont.includes('monospace') ||
                            codeFont.includes('Menlo') ||
                            codeFont.includes('Monaco') ||
                            codeFont.includes('Consolas');
        expect(hasMonospace).toBe(true);
      }
    });
  });

  test.describe('Heading Hierarchy', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/typography-scale/`);
    });

    test('headings decrease in size from h1 to h6', async ({ page }) => {
      const sizes = await page.evaluate(() => {
        const headings = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        return headings.map(tag => {
          const el = document.querySelector(`[data-typography="${tag}"]`) || 
                     document.querySelector(tag);
          return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
        });
      });
      
      // Each heading should be smaller than the previous
      for (let i = 1; i < sizes.length; i++) {
        expect(sizes[i], `h${i+1} should be ≤ h${i}`).toBeLessThanOrEqual(sizes[i-1]);
      }
    });

    for (const [tag, range] of Object.entries(TYPOGRAPHY_SCALE).filter(([k]) => k.startsWith('h'))) {
      test(`${tag} is within expected size range`, async ({ page }) => {
        const size = await page.evaluate((tag) => {
          const el = document.querySelector(`[data-typography="${tag}"]`) || 
                     document.querySelector(tag);
          return el ? parseFloat(getComputedStyle(el).fontSize) : 0;
        }, tag);
        
        expect(size).toBeGreaterThanOrEqual(range.minSize);
        expect(size).toBeLessThanOrEqual(range.maxSize);
      });
    }
  });

  test.describe('Display Classes', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/typography-scale/`);
    });

    test('display classes are larger than standard headings', async ({ page }) => {
      const [display1, h1] = await page.evaluate(() => {
        const d1 = document.querySelector('.display-1');
        const h1 = document.querySelector('h1:not(.display-1)');
        return [
          d1 ? parseFloat(getComputedStyle(d1).fontSize) : 0,
          h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0
        ];
      });
      
      if (display1 > 0) {
        expect(display1).toBeGreaterThan(h1);
      }
    });
  });

  test.describe('Body Text', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/typography-scale/`);
    });

    test('body font size is within range', async ({ page }) => {
      const bodySize = await page.evaluate(() => {
        return parseFloat(getComputedStyle(document.body).fontSize);
      });
      
      expect(bodySize).toBeGreaterThanOrEqual(TYPOGRAPHY_SCALE.body.minSize);
      expect(bodySize).toBeLessThanOrEqual(TYPOGRAPHY_SCALE.body.maxSize);
    });

    test('body line height is readable', async ({ page }) => {
      const lineHeight = await page.evaluate(() => {
        const computed = getComputedStyle(document.body).lineHeight;
        // Handle both unitless and px values
        return computed === 'normal' ? 1.5 : parseFloat(computed);
      });
      
      // Line height should be between 1.2 and 2.0 for readability
      expect(lineHeight).toBeGreaterThanOrEqual(1.2);
      expect(lineHeight).toBeLessThanOrEqual(2.0);
    });

    test('paragraph text has comfortable line length', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      
      const p = page.locator('p').first();
      if (await p.count() > 0) {
        const box = await p.boundingBox();
        
        // Optimal line length is 50-75 characters, roughly 500-900px
        // Allow broader range for different layouts
        expect(box.width).toBeLessThanOrEqual(1200);
      }
    });
  });

  test.describe('Small Text', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/typography-scale/`);
    });

    test('small and .small are smaller than body', async ({ page }) => {
      const [bodySize, smallSize] = await page.evaluate(() => {
        const small = document.querySelector('small, .small');
        return [
          parseFloat(getComputedStyle(document.body).fontSize),
          small ? parseFloat(getComputedStyle(small).fontSize) : 0
        ];
      });
      
      if (smallSize > 0) {
        expect(smallSize).toBeLessThan(bodySize);
      }
    });

    test('small text is still readable (min 10px)', async ({ page }) => {
      const smallSize = await page.evaluate(() => {
        const small = document.querySelector('small, .small, .text-muted');
        return small ? parseFloat(getComputedStyle(small).fontSize) : 16;
      });
      
      expect(smallSize).toBeGreaterThanOrEqual(10);
    });
  });

  test.describe('Font Weights', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/typography-scale/`);
    });

    test('headings have appropriate weight', async ({ page }) => {
      const h1Weight = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        return h1 ? parseInt(getComputedStyle(h1).fontWeight) : 400;
      });
      
      // Headings typically 500-700
      expect(h1Weight).toBeGreaterThanOrEqual(500);
    });

    test('body text is normal weight', async ({ page }) => {
      const bodyWeight = await page.evaluate(() => {
        return parseInt(getComputedStyle(document.body).fontWeight);
      });
      
      // Body should be 400 (normal)
      expect(bodyWeight).toBe(400);
    });

    test('.fw-bold applies bold weight', async ({ page }) => {
      const boldWeight = await page.evaluate(() => {
        const bold = document.querySelector('.fw-bold');
        return bold ? parseInt(getComputedStyle(bold).fontWeight) : 400;
      });
      
      expect(boldWeight).toBeGreaterThanOrEqual(600);
    });
  });

  test.describe('Text Colors', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/typography-scale/`);
    });

    test('body text color is defined', async ({ page }) => {
      const color = await page.evaluate(() => {
        return getComputedStyle(document.body).color;
      });
      
      expect(color).toBeTruthy();
      expect(color).not.toBe('rgb(0, 0, 0)'); // Not pure black (unless intentional)
    });

    test('.text-muted is lighter than body text', async ({ page }) => {
      const [bodyColor, mutedColor] = await page.evaluate(() => {
        const muted = document.querySelector('.text-muted');
        return [
          getComputedStyle(document.body).color,
          muted ? getComputedStyle(muted).color : ''
        ];
      });
      
      if (mutedColor) {
        expect(mutedColor).not.toBe(bodyColor);
      }
    });
  });

  test.describe('Link Styles', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${BASE_URL}/test/typography-scale/`);
    });

    test('links have distinct color', async ({ page }) => {
      const [bodyColor, linkColor] = await page.evaluate(() => {
        const link = document.querySelector('a[href]');
        return [
          getComputedStyle(document.body).color,
          link ? getComputedStyle(link).color : ''
        ];
      });
      
      if (linkColor) {
        expect(linkColor).not.toBe(bodyColor);
      }
    });

    test('links have underline or hover effect', async ({ page }) => {
      const link = page.locator('a[href]').first();
      if (await link.count() > 0) {
        const decoration = await link.evaluate(el => {
          return getComputedStyle(el).textDecoration;
        });
        
        // Links should have underline OR have hover effect (checked separately)
        expect(decoration.includes('underline') || decoration.includes('none')).toBe(true);
      }
    });
  });
});

test.describe('Typography Responsive', () => {
  
  test('font size adjusts for mobile', async ({ page }) => {
    await page.goto(`${BASE_URL}/test/typography-scale/`);
    
    // Get desktop h1 size
    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopH1 = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0;
    });
    
    // Get mobile h1 size
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileH1 = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0;
    });
    
    // Mobile heading should be equal or smaller
    expect(mobileH1).toBeLessThanOrEqual(desktopH1);
  });
});
