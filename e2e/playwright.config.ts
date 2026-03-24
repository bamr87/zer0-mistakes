// =============================================================================
// Playwright Configuration for zer0-mistakes E2E Testing
// =============================================================================
//
// Migrated from: test/playwright.config.js
// Enhanced with: TypeScript, axe-core accessibility, structured test directory
//
// Usage:
//   npx playwright test                          # Run all E2E tests
//   npx playwright test --project=desktop        # Desktop only
//   npx playwright test tests/navigation.spec.ts # Single spec
//   npx playwright test --update-snapshots       # Update visual baselines

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './results/artifacts',
  snapshotDir: './baselines',

  timeout: 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './results/html-report' }],
    ['json', { outputFile: './results/results.json' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad (gen 7)'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 375, height: 667 },
      },
    },
  ],

  webServer: process.env.SKIP_SERVER
    ? undefined
    : {
        command: 'bundle exec jekyll serve --port 4000 --config _config.yml,_config_dev.yml',
        url: 'http://localhost:4000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
