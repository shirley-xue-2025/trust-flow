import { defineConfig, devices } from '@playwright/test';

const WEB = process.env.PLAYWRIGHT_WEB_URL ?? 'http://localhost:5173';
const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? 'http://localhost:8080';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: WEB,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: [
    {
      command: 'npm run dev:backend',
      url: `${BACKEND}/v1/health`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev:web',
      url: WEB,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
