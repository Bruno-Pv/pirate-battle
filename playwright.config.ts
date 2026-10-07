import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Limits concurrent browser contexts: the timing-sensitive tests (real rAF + Pixi rendering)
  // get unreliable when too many contexts compete for the same CPU/GPU.
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
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
    // Serves the production build: no dev-server cold start or on-demand dependency
    // optimization, which made first navigations time out.
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
