// @ts-check
import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 4173);

export default defineConfig({
  testDir: './tests',
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure', // open with: npx playwright show-trace <file>
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Start the app before the tests, and stop it afterwards.
  webServer: {
    command: 'node server.mjs',
    url: `http://localhost:${port}`,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
  },
});
