// =============================================================================
// Playwright Configuration for zer0-mistakes Visual Testing
// =============================================================================
//
// This configuration defines how Playwright captures screenshots and
// performs visual testing for the Jekyll theme.
//
// Usage:
//   npx playwright test
//   npx playwright test --project=desktop-chrome
//   npx playwright screenshot http://localhost:4000 screenshot.png
//

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory
  testDir: './visual',
  
  // Output directories
  outputDir: './visual-results',
  snapshotDir: './visual/baseline',
  
  // Timeout settings
  timeout: 30000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  
  // Fail fast in CI
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { open: 'never', outputFolder: './visual-results/html-report' }],
    ['json', { outputFile: './visual-results/results.json' }],
    ['list'],
  ],
  
  // Global settings
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:4000',
    
    // Screenshot settings
    screenshot: 'on',
    
    // Trace settings for debugging
    trace: 'on-first-retry',
    
    // Default viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors for local testing
    ignoreHTTPSErrors: true,
    
    // Action timeout
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 30000,
  },
  
  // Project configurations for different viewports/browsers
  projects: [
    // Desktop Chrome
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    
    // Desktop Firefox
    {
      name: 'desktop-firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },
    
    // Desktop Safari
    {
      name: 'desktop-safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },
    
    // Tablet viewport
    {
      name: 'tablet',
      use: {
        ...devices['iPad (gen 7)'],
        viewport: { width: 768, height: 1024 },
      },
    },
    
    // Mobile viewport
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 },
      },
    },
    
    // Mobile landscape
    {
      name: 'mobile-landscape',
      use: {
        ...devices['iPhone 12 landscape'],
        viewport: { width: 667, height: 375 },
      },
    },
  ],
  
  // Web server configuration (start Jekyll before tests)
  webServer: process.env.START_SERVER ? {
    command: 'bundle exec jekyll serve --port 4000',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  } : undefined,
});
