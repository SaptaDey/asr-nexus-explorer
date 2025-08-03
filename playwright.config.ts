import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduced retries for faster CI
  workers: process.env.CI ? 30 : undefined, // Dramatically increased from 2 to 30 for ultra-fast CI performance
  reporter: process.env.CI ? 'github' : 'html', // Use GitHub reporter for CI, HTML for local
  use: {
    baseURL: 'http://localhost:4173',
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry', // Reduce trace collection in CI
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'retain-on-failure', // Minimize video capture
    // Performance optimizations for CI
    ...(process.env.CI && {
      ignoreHTTPSErrors: true,
      bypassCSP: true,
    }),
  },

  projects: process.env.E2E_SMOKE ? [
    // Smoke mode: Ultra-fast critical path tests only (Chromium, minimal test set)
    {
      name: 'smoke-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Optimize for speed
        headless: true,
        video: 'off',
        screenshot: 'only-on-failure'
      },
      testMatch: '**/smoke/*.spec.ts', // Only run smoke tests
    },
  ] : process.env.E2E_FAST ? [
    // Fast mode: Only Chromium for quick validation
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ] : [
    // Full mode: All browsers for comprehensive testing
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
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 60 * 1000 : 120 * 1000, // Faster timeout for CI
    stdout: process.env.CI ? 'ignore' : 'pipe', // Reduce logging in CI
    stderr: process.env.CI ? 'ignore' : 'pipe',
  },
});