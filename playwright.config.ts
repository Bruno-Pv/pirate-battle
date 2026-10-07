import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Keeps the single dev-server instance from being overwhelmed by many concurrent browser
  // contexts hammering it with texture/asset requests at once.
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // The game requires landscape on mobile (see RotateDeviceOverlay), same as a player
      // would hold their phone to play — so the mobile project emulates landscape, not the
      // device preset's portrait default.
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 7'],
        hasTouch: true,
        viewport: { width: 839, height: 412 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
