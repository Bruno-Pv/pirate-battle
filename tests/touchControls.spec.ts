import { expect, test } from '@playwright/test'
import { gotoWithSeed, startGame } from './helpers'

test('touch controls are shown only on devices with a touch screen', async ({ page }) => {
  const isMobile = test.info().project.name === 'chromium-mobile'
  await gotoWithSeed(page, 5001)
  await startGame(page)

  expect(await page.evaluate(() => matchMedia('(any-pointer: coarse)').matches)).toBe(isMobile)
  const controls = [page.locator('[data-joystick]'), page.locator('[data-touch-action]')]
  for (const control of controls) {
    if (isMobile) await expect(control.first()).toBeVisible()
    else await expect(control).toHaveCount(0)
  }
})

test('the keyboard still plays the game when there are no touch controls', async ({ page }) => {
  test.skip(test.info().project.name !== 'chromium-desktop', 'desktop only')
  await gotoWithSeed(page, 5002)
  await startGame(page)
  const before = await page.evaluate(() => window.__game!.getSimState().player.position)
  await page.keyboard.down('KeyW')
  const after = await page.evaluate(() => window.__game!.step(30).player.position)
  await page.keyboard.up('KeyW')
  expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(20)
})
