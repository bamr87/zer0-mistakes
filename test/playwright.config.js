// =============================================================================
// Playwright Configuration for zer0-mistakes
// =============================================================================
//
// Single source of truth for all Playwright runs. Tiers are exposed as
// Playwright "projects" — pick one with `--project=<name>`:
//
//   smoke       Behavioral DOM/CSS/layout tests across all specs (no
//               pixel screenshots). Runs on every CI code-change.
//   snapshots   Pixel-perfect homepage screenshots for the 9 theme skins
//               in skins.spec.js. Path-filtered in CI; baselines are
//               committed under test/visual/snapshots/.
//   regression  All specs across chromium/firefox/webkit. Manual /
//               workflow_dispatch only.
//
// Usage:
//   npm run test:smoke
//   npm run test:snapshots
//   npm run test:regression
//   npx playwright test --project=smoke
//   BASE_URL=http://127.0.0.1:4011 npx playwright test --project=smoke
//

const { defineConfig, devices } = require('@playwright/test');

const isCI = !!process.env.CI;
const SNAPSHOT_GREP = /homepage visual snapshot/;

module.exports = defineConfig({
  testDir: './visual',
  testMatch: '**/*.spec.js',

  // Commit baselines alongside specs in a single location.
  snapshotDir: './visual/snapshots',

  // Per-test timeout. Snapshots in particular are slower than DOM checks.
  timeout: 45000,
  expect: {
    timeout: 15000,
    toHaveScreenshot: {
      maxDiffPixels: 150,
      threshold: 0.2,
    },
  },

  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // Single worker keeps Jekyll dev-server load predictable and avoids
  // flake from parallel skin transitions.
  workers: 1,
  fullyParallel: false,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './visual-results/html' }],
    ['json', { outputFile: './visual-results/results.json' }],
  ],
  outputDir: './visual-results/output',

  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4011',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
    navigationTimeout: 45000,
    actionTimeout: 10000,
  },

  // Tiers. Each tier picks a subset of specs and/or test names so we never
  // need separate config files. Use `--project=<name>` to select one.
  projects: [
    {
      name: 'smoke',
      // Everything except the pixel-snapshot block in skins.spec.js.
      grepInvert: SNAPSHOT_GREP,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'snapshots',
      testMatch: '**/skins.spec.js',
      grep: SNAPSHOT_GREP,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'regression-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'regression-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'regression-webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
