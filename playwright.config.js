// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  timeout: 30000,

  expect: {
    timeout: 5000,
  },

  reporter: [
    ['list'],
    ['html'],
  ],

  use: {
    baseURL: 'http://127.0.0.1:5500',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: {
      width: 1440,
      height: 900,
    },
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5500',
    reuseExistingServer: true,
    timeout: 120000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});