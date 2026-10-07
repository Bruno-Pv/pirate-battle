import type { Page } from '@playwright/test'
import type {} from '../src/game/testHook'

export async function gotoWithSeed(page: Page, seed: number) {
  await page.goto(`/?seed=${seed}`)
}

export async function startGame(page: Page) {
  await page.getByRole('tab', { name: 'Play', exact: true }).click()
  await page.getByRole('button', { name: 'Play' }).click()
  await page.waitForFunction(() => typeof window.__game?.step === 'function')
}

export async function setMatchOptions(
  page: Page,
  options: { durationSeconds?: number; spawnIntervalSeconds?: number },
) {
  await page.getByRole('button', { name: 'Options' }).click()
  if (options.durationSeconds !== undefined) {
    await page.locator('input[type=number]').first().fill(String(options.durationSeconds))
  }
  if (options.spawnIntervalSeconds !== undefined) {
    await page.locator('input[type=number]').nth(1).fill(String(options.spawnIntervalSeconds))
  }
  await page.getByRole('button', { name: 'Save' }).click()
}

/** Advances the deterministic test clock by `frames` fixed steps and returns the resulting
 * simulation state — instant in wall-clock time, regardless of how much game time passes. */
export async function step(page: Page, frames: number) {
  return page.evaluate((n) => window.__game!.step(n), frames)
}

export async function getSimState(page: Page) {
  return page.evaluate(() => window.__game!.getSimState())
}

/** Steps the simulation forward in chunks until it ends (death or time limit) or a chunk
 * budget is exhausted, so "play an idle match to completion" tests stay fast and bounded. */
export async function stepUntilEnded(page: Page, chunkFrames = 300, maxChunks = 40) {
  let state = await getSimState(page)
  for (let i = 0; i < maxChunks && state.status !== 'ended'; i += 1) {
    state = await step(page, chunkFrames)
  }
  return state
}
