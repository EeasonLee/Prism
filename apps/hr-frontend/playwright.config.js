const { defineConfig, devices } = require('@playwright/test');
const { nxE2EPreset } = require('@nx/playwright/preset');
const { workspaceRoot } = require('@nx/devkit');
const path = require('path');

const filename = __filename ?? path.join(__dirname, 'playwright.config.js');
const baseURL = process.env['BASE_URL'] || 'http://localhost:3093';

module.exports = defineConfig({
  ...nxE2EPreset(filename, { testDir: './e2e' }),
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm nx dev hr-frontend',
    url: 'http://localhost:3093',
    reuseExistingServer: true,
    cwd: workspaceRoot,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
