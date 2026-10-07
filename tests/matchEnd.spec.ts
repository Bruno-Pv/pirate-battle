import { expect, test, type Page } from '@playwright/test'
import { setMatchOptions, startGame, stepUntilEnded } from './helpers'

const PENDING_KEY = 'pirate-battle:pending-submissions'

/** Behaves like a phone opening the dev server over plain http on the LAN: not a secure
 * context, so `crypto.randomUUID` does not exist. */
async function removeRandomUUID(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined, configurable: true })
  })
}

async function finishAndExpectResult(page: Page, expected: 'sunk' | 'time') {
  if (expected === 'time') {
    // An idle ship is always sunk; spinning with every cannon firing survives this seed.
    for (const key of ['KeyD', 'Space', 'KeyQ', 'KeyE']) await page.keyboard.down(key)
  }
  const state = await stepUntilEnded(page)
  expect(state.status).toBe('ended')
  expect(state.player.hp > 0).toBe(expected === 'time')

  await expect(page.getByRole('button', { name: 'Play Again' })).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('heading', { name: expected === 'time' ? 'Match Complete' : 'Ship Sunk' })).toBeVisible()
  await expect(page.getByText(/Saved to ranking/)).toBeVisible({ timeout: 10_000 })
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '[]').length, PENDING_KEY)).toBe(0)

  await page.getByRole('button', { name: 'Main Menu' }).click()
  await page.getByRole('tab', { name: 'History' }).click()
  await expect(page.locator('tbody tr')).toHaveCount(1)
}

for (const secure of [true, false]) {
  const context = secure ? '' : ' (no crypto.randomUUID, as over plain http)'

  test(`the player dying shows the Result screen and registers the match${context}`, async ({ page }) => {
    if (!secure) await removeRandomUUID(page)
    await page.goto('/?seed=4001')
    // Fastest spawns and a long match: an idle ship is sunk well before the time runs out.
    await setMatchOptions(page, { durationSeconds: 180, spawnIntervalSeconds: 1 })
    await startGame(page)
    await finishAndExpectResult(page, 'sunk')
  })

  test(`the time running out shows the Result screen and registers the match${context}`, async ({ page }) => {
    if (!secure) await removeRandomUUID(page)
    await page.goto('/?seed=4005')
    // Slowest spawns and a short match, with the ship spinning and firing, so the clock ends first.
    await setMatchOptions(page, { durationSeconds: 60, spawnIntervalSeconds: 10 })
    await startGame(page)
    await finishAndExpectResult(page, 'time')
  })
}
