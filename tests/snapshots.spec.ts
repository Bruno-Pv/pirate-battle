import { expect, test } from '@playwright/test'
import { gotoWithSeed, setMatchOptions, startGame, stepUntilEnded } from './helpers'

test('menu screen matches snapshot', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()
  await expect(page).toHaveScreenshot('menu.png')
})

test('arena in-game matches snapshot', async ({ page }) => {
  await gotoWithSeed(page, 3001)
  await startGame(page)
  await page.waitForTimeout(150) // let the first real render frame settle
  await expect(page).toHaveScreenshot('arena.png')
})

test('result screen matches snapshot', async ({ page }) => {
  await gotoWithSeed(page, 3002)
  await setMatchOptions(page, { durationSeconds: 60, spawnIntervalSeconds: 1.5 })
  await startGame(page)
  await stepUntilEnded(page)
  await expect(page.getByRole('button', { name: 'Play Again' })).toBeVisible({ timeout: 5000 })
  await expect(page).toHaveScreenshot('result.png')
})
