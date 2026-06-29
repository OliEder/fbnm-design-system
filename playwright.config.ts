import { defineConfig, devices } from '@playwright/test'

const BASE_PATH = '/fbnm-design-system'

// Local: use pre-installed Chromium symlink. CI: let Playwright find its own.
const executablePath = process.env.PLAYWRIGHT_BROWSERS_PATH
  ? `${process.env.PLAYWRIGHT_BROWSERS_PATH}/chromium`
  : undefined

// Running as root (remote container) requires --no-sandbox
const browserArgs = ['--no-sandbox', '--disable-setuid-sandbox']

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL: `http://localhost:4322`,
    trace: 'on-first-retry',
    launchOptions: { executablePath, args: browserArgs },
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      },
      testMatch: /wcag-components/,
    },
  ],

  webServer: {
    command: 'pnpm --filter @fbnm/docs build && pnpm --filter @fbnm/docs preview --port 4322',
    url: `http://localhost:4322${BASE_PATH}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
