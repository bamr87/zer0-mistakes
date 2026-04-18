// Playwright config for full multi-browser visual regression tests.
// Usage: npm run test:regression
//        BASE_URL=http://localhost:4000 npx playwright test --config=test/playwright.regression.config.js

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './visual',
  testMatch: '**/*.spec.js',
  timeout: 60000,
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './visual-results/regression-html' }],
    ['json', { outputFile: './visual-results/regression-results.json' }],
  ],
  outputDir: './visual-results/regression-output',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4000',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
    navigationTimeout: 45000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
