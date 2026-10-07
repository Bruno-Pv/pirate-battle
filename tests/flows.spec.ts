import { expect, test } from '@playwright/test'
import { getSimState, gotoWithSeed, setMatchOptions, startGame, step, stepUntilEnded } from './helpers'

test('menu renders and tabs switch between Play, How to Play, Ranking, History', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()

  await page.getByRole('tab', { name: 'How to Play' }).click()
  await expect(page.getByText('Front cannon: Space')).toBeVisible()

  await page.getByRole('tab', { name: 'Ranking' }).click()
  await expect(page.getByRole('table')).toBeVisible()

  await page.getByRole('tab', { name: 'History' }).click()
  await expect(page.getByText('No matches played yet.')).toBeVisible()
})

test('starting a game shows the canvas and HUD, and the ship moves on thrust', async ({ page }) => {
  await gotoWithSeed(page, 1001)
  await startGame(page)

  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByText(/Score: 0/)).toBeVisible()

  const before = await getSimState(page)
  const startPos = before.player.position

  await page.keyboard.down('KeyW')
  await step(page, 120) // 2s of sim time
  await page.keyboard.up('KeyW')

  const after = await getSimState(page)
  const moved = Math.hypot(after.player.position.x - startPos.x, after.player.position.y - startPos.y)
  expect(moved).toBeGreaterThan(50)
})

test('firing all three weapons spawns 1 front + 3 + 3 side projectiles', async ({ page }) => {
  await gotoWithSeed(page, 1002)
  await startGame(page)

  await page.keyboard.down('Space')
  await step(page, 2)
  await page.keyboard.up('Space')

  await page.keyboard.down('KeyQ')
  await step(page, 2)
  await page.keyboard.up('KeyQ')

  await page.keyboard.down('KeyE')
  await step(page, 2)
  await page.keyboard.up('KeyE')

  const state = await getSimState(page)
  expect(state.projectiles).toHaveLength(7)
})

test('Escape pauses the simulation and Resume continues it', async ({ page }) => {
  await gotoWithSeed(page, 1003)
  await startGame(page)

  await step(page, 60) // 1s
  const beforePause = await getSimState(page)

  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible()

  // The test hook's step() mirrors the real loop and no-ops while paused.
  const whilePaused = await step(page, 120)
  expect(whilePaused.elapsedSeconds).toBeCloseTo(beforePause.elapsedSeconds, 5)

  await page.getByRole('button', { name: 'Resume' }).click()
  await expect(page.getByRole('heading', { name: 'Paused' })).toHaveCount(0)

  const afterResume = await step(page, 60) // 1s more, should now advance
  expect(afterResume.elapsedSeconds).toBeGreaterThan(whilePaused.elapsedSeconds)
})

test('an idle match ends and the Result screen shows matching score, time, and an explicit reason', async ({
  page,
}) => {
  await gotoWithSeed(page, 1004)
  await setMatchOptions(page, { durationSeconds: 60, spawnIntervalSeconds: 1.5 })
  await startGame(page)

  const finalState = await stepUntilEnded(page)
  expect(finalState.status).toBe('ended')

  await expect(page.getByRole('button', { name: 'Play Again' })).toBeVisible({ timeout: 5000 })

  const survived = finalState.player.hp > 0
  await expect(page.getByRole('heading', { name: survived ? 'Match Complete' : 'Ship Sunk' })).toBeVisible()
  await expect(page.getByText(survived ? /Time's up/ : /sunk by the enemy/)).toBeVisible()

  const minutes = Math.floor(finalState.elapsedSeconds / 60)
  const seconds = Math.floor(finalState.elapsedSeconds % 60)
  await expect(page.getByText(`${minutes}:${seconds.toString().padStart(2, '0')}`)).toBeVisible()
  await expect(page.getByText(String(finalState.score), { exact: true })).toBeVisible()
})

test('after a match, History and Ranking include it, and Play Again starts a fresh match', async ({ page }) => {
  await gotoWithSeed(page, 1005)
  await setMatchOptions(page, { durationSeconds: 60, spawnIntervalSeconds: 1.5 })
  await startGame(page)

  await stepUntilEnded(page)
  await expect(page.getByRole('button', { name: 'Play Again' })).toBeVisible({ timeout: 5000 })
  await expect(page.getByText(/Saved to ranking|Pending/)).toBeVisible({ timeout: 5000 })

  await page.getByRole('button', { name: 'Menu' }).click()
  await page.getByRole('tab', { name: 'History' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(1)

  await page.getByRole('tab', { name: 'Ranking' }).click()
  await expect(page.locator('tbody tr').first()).toBeVisible()

  await page.getByRole('tab', { name: 'Play', exact: true }).click()
  await page.getByRole('button', { name: 'Play' }).click()
  await page.waitForFunction(() => typeof window.__game?.step === 'function')

  const freshState = await getSimState(page)
  expect(freshState.score).toBe(0)
  expect(freshState.status).toBe('playing')
})
