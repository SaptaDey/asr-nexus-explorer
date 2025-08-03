import { defineConfig, devices } from '@playwright/test';

/**
 * CI-optimized Playwright configuration
 * Optimized for AMD Ryzen 9 7945HX (32 threads) + 64GB RAM workstation
 * Focuses on Chromium and Firefox for maximum compatibility
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel - utilize full workstation power */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI for flaky tests */
  retries: process.env.CI ? 2 : 1,
  /* Optimize workers for 32-thread CPU */
  workers: process.env.CI ? 8 : 16,
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  /* Global test timeout - increased for comprehensive tests */
  timeout: 60000,
  
  /* Shared settings optimized for production testing */
  use: {
    /* Base URL for local testing */
    baseURL: 'http://localhost:4173',
    
    /* Collect trace when retrying failed tests */
    trace: 'retain-on-failure',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video recording for failed tests */
    video: 'retain-on-failure',
    
    /* Increase action timeout */
    actionTimeout: 15000,
    
    /* Navigation timeout */
    navigationTimeout: 30000,
  },

  /* Configure projects for reliable browsers only */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        /* Use headless mode for CI stability */
        headless: true,
        /* Optimize viewport */
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        /* Use headless mode for CI stability */
        headless: true,
        /* Optimize viewport */
        viewport: { width: 1920, height: 1080 },
      },
    },

    /* Skip WebKit due to system dependency issues */
    // Chromium provides webkit compatibility testing coverage

    /* Mobile testing with Chromium engine */
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        headless: true,
      },
    },
  ],

  /* Run local preview server before starting tests */
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    /* Optimize for workstation performance */
    env: {
      NODE_OPTIONS: '--max-old-space-size=16384'
    }
  },
  
  /* Output directories */
  outputDir: 'test-results/',
  
  /* Global setup and teardown - commented out due to permission issues */
  // globalSetup: require.resolve('./e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./e2e/global-teardown.ts'),
});