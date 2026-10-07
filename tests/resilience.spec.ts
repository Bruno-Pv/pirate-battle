import { expect, test, type Page } from '@playwright/test'
import { getSimState, gotoWithSeed, setMatchOptions, startGame, step, stepUntilEnded } from './helpers'

const KEYS = {
  pending: 'pirate-battle:pending-submissions',
  lastResult: 'pirate-battle:last-result',
  myMatchIds: 'pirate-battle:my-match-ids',
}

const queueLength = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]').length as number, KEYS.pending)

async function playQuickMatch(page: Page, url: string) {
  await page.goto(url)
  await setMatchOptions(page, { durationSeconds: 60, spawnIntervalSeconds: 1.5 })
  await startGame(page)
  await stepUntilEnded(page)
}

async function openTab(page: Page, name: 'Ranking' | 'History') {
  await page.getByRole('tab', { name }).click()
}

/** A real window blur, after a real focus (the game ignores a blur it never saw a focus for). */
async function loseFocus(page: Page) {
  await page.evaluate(() => {
    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new Event('blur'))
  })
}

test.describe('asset failure', () => {
  // page.route can't see requests the MSW service worker sits in front of; the game itself
  // doesn't need the mock API, so run without the worker (the app must still render).
  test.use({ serviceWorkers: 'block' })

  test('a real 404 on a texture shows the error and Retry recovers once the file is back', async ({ page }) => {
    let broken = true
    await page.route('**/tilesheet/tiles_sheet.png', (route) =>
      broken ? route.fulfill({ status: 404, body: 'not found' }) : route.continue(),
    )
    await gotoWithSeed(page, 3001)
    await page.getByRole('tab', { name: 'Play', exact: true }).click()
    await page.getByRole('button', { name: 'Play' }).click()

    const retry = page.getByRole('button', { name: 'Retry' })
    await expect(retry).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Failed to load assets')).toBeVisible()
    await expect(page.getByText(/Loading assets/)).toHaveCount(0)

    broken = false
    await retry.click()
    await page.waitForFunction(() => typeof window.__game?.step === 'function', undefined, { timeout: 15_000 })
    await expect(page.locator('canvas')).toBeVisible()
    await expect(retry).toHaveCount(0)
  })
})

test.describe('input reset', () => {
  test('a held W does not keep moving the ship after focus is lost and the game resumes', async ({ page }) => {
    await gotoWithSeed(page, 3002)
    await startGame(page)

    await page.keyboard.down('KeyW')
    const start = (await getSimState(page)).player.position
    const moving = (await step(page, 30)).player.position
    expect(Math.hypot(moving.x - start.x, moving.y - start.y)).toBeGreaterThan(20) // W really moves it

    await loseFocus(page)
    const resume = page.getByRole('button', { name: 'Resume' })
    if (await resume.isVisible()) await resume.click()

    const atResume = (await getSimState(page)).player.position
    const later = (await step(page, 60)).player.position
    expect(Math.hypot(later.x - atResume.x, later.y - atResume.y)).toBeLessThan(0.5)
    await page.keyboard.up('KeyW')
  })
})

test.describe('auto-pause', () => {
  test('losing window focus pauses and the timer does not advance', async ({ page }) => {
    await gotoWithSeed(page, 3003)
    await startGame(page)
    await step(page, 60)

    await loseFocus(page)
    await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible()
    const before = await getSimState(page)
    const after = await step(page, 300)
    expect(after.elapsedSeconds).toBe(before.elapsedSeconds)
    expect(after.spawnCooldown).toBe(before.spawnCooldown)
  })

  test('hiding the tab pauses the game', async ({ page }) => {
    await gotoWithSeed(page, 3004)
    await startGame(page)
    await step(page, 30)

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(page.getByRole('heading', { name: 'Paused' })).toBeVisible()
    const before = await getSimState(page)
    expect((await step(page, 120)).elapsedSeconds).toBe(before.elapsedSeconds)
  })
})

test.describe('abandoning a match', () => {
  test('Quit to Menu records nothing: no result, no queue entry, no History row', async ({ page }) => {
    await gotoWithSeed(page, 3005)
    await startGame(page)
    await step(page, 120)

    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Quit to Menu' }).click()
    await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()

    expect(await queueLength(page)).toBe(0)
    expect(await page.evaluate((k) => localStorage.getItem(k), KEYS.lastResult)).toBeNull()
    expect(await page.evaluate((k) => localStorage.getItem(k), KEYS.myMatchIds)).toBeNull()
    await expect(page.getByText(/Last result/)).toHaveCount(0)
    await openTab(page, 'History')
    await expect(page.getByText('No matches played yet.')).toBeVisible()
  })
})

test.describe('submission without duplicates', () => {
  test('submitError keeps the match Pending and recovery registers it exactly once', async ({ page }) => {
    await playQuickMatch(page, '/?seed=3006&scenario=submitError')
    await expect(page.getByText(/Pending/)).toBeVisible({ timeout: 10_000 })
    expect(await queueLength(page)).toBe(1)

    // Retrying while the endpoint is still failing neither loses nor duplicates it.
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(page.getByText(/Pending/)).toBeVisible({ timeout: 10_000 })
    expect(await queueLength(page)).toBe(1)

    await page.goto('/')
    await expect.poll(() => queueLength(page)).toBe(0)
    await openTab(page, 'History')
    await expect(page.locator('tbody tr')).toHaveCount(1)
  })

  test('timeoutAfterSave: the server already has the match, and the retry does not duplicate it', async ({ page }) => {
    test.setTimeout(60_000)
    await playQuickMatch(page, '/?seed=3007&scenario=timeoutAfterSave')
    // The response never arrives within the client timeout, so the UI still says Pending.
    await expect(page.getByText(/Pending/)).toBeVisible({ timeout: 25_000 })
    expect(await queueLength(page)).toBe(1)

    await page.goto('/')
    await expect.poll(() => queueLength(page)).toBe(0)
    await openTab(page, 'History')
    await expect(page.locator('tbody tr')).toHaveCount(1)
  })
})

test.describe('Ranking and History states', () => {
  // History lists only this browser's own matches, so give it eight fixture ids (two pages of 5).
  async function ownEightFixtures(page: Page) {
    await page.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify(Array.from({ length: 8 }, (_, i) => `fixture-${i + 1}`)))
    }, KEYS.myMatchIds)
  }

  test('Ranking paginates 5 per page', async ({ page }) => {
    await page.goto('/')
    await openTab(page, 'Ranking')
    await expect(page.locator('tbody tr')).toHaveCount(5)
    await expect(page.getByText('Page 1 / 2')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Prev' })).toBeDisabled()

    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('Page 2 / 2')).toBeVisible()
    await expect(page.locator('tbody tr')).toHaveCount(3)
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled()

    await page.getByRole('button', { name: 'Prev' }).click()
    await expect(page.locator('tbody tr')).toHaveCount(5)
  })

  test('History paginates and shows an English date and the configuration for each match', async ({ page }) => {
    await ownEightFixtures(page)
    await page.goto('/')
    await openTab(page, 'History')
    await expect(page.locator('tbody tr')).toHaveCount(5)
    await expect(page.getByRole('columnheader', { name: 'Config' })).toBeVisible()
    await expect(page.locator('tbody tr').first()).toContainText(/session · .*spawn/)
    await expect(page.locator('tbody tr').first()).toContainText(/[A-Z][a-z]{2} \d{1,2}, \d{4}/)
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.locator('tbody tr')).toHaveCount(3)
  })

  test('the date stays in English even when the browser locale is Portuguese', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'pt-BR' })
    const page = await context.newPage()
    await ownEightFixtures(page)
    await page.goto('/')
    await openTab(page, 'History')
    await expect(page.locator('tbody tr').first()).toContainText(/[A-Z][a-z]{2} \d{1,2}, \d{4}/)
    await expect(page.locator('tbody tr').first()).not.toContainText(/ de /)
    await context.close()
  })

  for (const tab of ['Ranking', 'History'] as const) {
    test(`${tab} shows loading, then data`, async ({ page }) => {
      await ownEightFixtures(page)
      await page.goto('/?scenario=slow')
      await openTab(page, tab)
      await expect(page.getByText('Loading…')).toBeVisible()
      await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('Loading…')).toHaveCount(0)
    })

    test(`${tab} shows the empty state`, async ({ page }) => {
      await page.goto('/?scenario=empty')
      await openTab(page, tab)
      await expect(
        page.getByText(tab === 'Ranking' ? /No one has played this configuration yet/ : 'No matches played yet.'),
      ).toBeVisible()
    })

    test(`${tab} shows an error with a working Retry`, async ({ page }) => {
      await ownEightFixtures(page)
      await page.goto(`/?scenario=${tab === 'Ranking' ? 'rankingError' : 'historyError'}`)
      await openTab(page, tab)
      const retry = page.getByRole('button', { name: 'Retry' })
      await expect(retry).toBeVisible({ timeout: 15_000 })
      await expect(page.locator('tbody tr')).toHaveCount(0)
      await retry.click() // still failing: stays in the error state, no crash
      await expect(retry).toBeVisible({ timeout: 15_000 })
    })
  }

  test('the other tab keeps working when only one endpoint fails', async ({ page }) => {
    await ownEightFixtures(page)
    await page.goto('/?scenario=rankingError')
    await openTab(page, 'History')
    await expect(page.locator('tbody tr')).toHaveCount(5)
  })
})
