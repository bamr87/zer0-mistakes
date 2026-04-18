// Playwright config for frontend styling tests only (single browser, fast CI).
// Usage: BASE_URL=http://127.0.0.1:4000 npx playwright test --config=test/playwright.styling.config.js

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './visual',
  testMatch: '**/*.spec.js',
  timeout: 45000,
  expect: { timeout: 15000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: './visual-results/styling-html' }]],
  outputDir: './visual-results/styling-output',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4000',
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
  ],
});
