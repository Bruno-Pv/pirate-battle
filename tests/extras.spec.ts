import { expect, test, type Page } from '@playwright/test'
import { getSimState, gotoWithSeed, setMatchOptions, startGame, step, stepUntilEnded } from './helpers'

const ARENA = { width: 1600, height: 900 }
const PLAYER_RADIUS = 24
const ISLAND = { x: 1050, y: 260, r: 110 }
const PENDING_KEY = 'pirate-battle:pending-submissions'

async function openOptions(page: Page) {
  await page.getByRole('button', { name: 'Options' }).click()
  await expect(page.getByRole('heading', { name: 'Options' })).toBeVisible()
}

test.describe('options validation', () => {
  test('an invalid value shows an error and is not saved', async ({ page }) => {
    await page.goto('/')
    await openOptions(page)
    await page.locator('input[type=number]').first().fill('5')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('alert')).toContainText('between 60 and 180')
    await expect(page.getByRole('heading', { name: 'Options' })).toBeVisible()

    await page.reload()
    await openOptions(page)
    await expect(page.locator('input[type=number]').first()).toHaveValue('120')
  })

  test('a valid value persists after reload', async ({ page }) => {
    await page.goto('/')
    await openOptions(page)
    await page.locator('input[type=number]').first().fill('90')
    await page.locator('input[type=number]').nth(1).fill('2.5')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('heading', { name: 'Pirate Battle' })).toBeVisible()

    await page.reload()
    await openOptions(page)
    await expect(page.locator('input[type=number]').first()).toHaveValue('90')
    await expect(page.locator('input[type=number]').nth(1)).toHaveValue('2.5')
  })
})

test.describe('movement bounds', () => {
  test('the ship cannot cross an island', async ({ page }) => {
    await gotoWithSeed(page, 2001)
    await startGame(page)
    const minDistance = ISLAND.r + PLAYER_RADIUS

    // Turn right ~53 degrees so the bow points at the island center, then sail straight into it.
    await page.keyboard.down('KeyD')
    await step(page, 23)
    await page.keyboard.up('KeyD')

    let closest = Infinity
    await page.keyboard.down('KeyW')
    for (let i = 0; i < 60; i += 1) {
      const { player } = await step(page, 5)
      const distance = Math.hypot(player.position.x - ISLAND.x, player.position.y - ISLAND.y)
      closest = Math.min(closest, distance)
      expect(distance).toBeGreaterThanOrEqual(minDistance - 0.5)
    }
    await page.keyboard.up('KeyW')

    // It actually reached the island (was blocked by it) rather than just never getting there.
    expect(closest).toBeLessThan(minDistance + 5)
  })

  test('the ship cannot leave the arena', async ({ page }) => {
    await gotoWithSeed(page, 2002)
    await startGame(page)

    async function expectInside() {
      const { player } = await getSimState(page)
      expect(player.position.x).toBeGreaterThanOrEqual(0)
      expect(player.position.x).toBeLessThanOrEqual(ARENA.width)
      expect(player.position.y).toBeGreaterThanOrEqual(0)
      expect(player.position.y).toBeLessThanOrEqual(ARENA.height)
      return player.position
    }

    // North edge: far more than the 450px needed to reach it.
    await page.keyboard.down('KeyW')
    await step(page, 300)
    const top = await expectInside()
    expect(top.y).toBeLessThan(PLAYER_RADIUS + 5)

    // Turn east and run into the east edge.
    await page.keyboard.down('KeyD')
    await step(page, 39)
    await page.keyboard.up('KeyD')
    await step(page, 600)
    await page.keyboard.up('KeyW')
    const east = await expectInside()
    expect(east.x).toBeGreaterThan(ARENA.width - PLAYER_RADIUS - 5)
  })
})

test.describe('submission recovery', () => {
  test('?scenario=error leaves the match Pending; reloading without it registers it exactly once', async ({
    page,
  }) => {
    const queueLength = () =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]').length as number, PENDING_KEY)

    await page.goto('/?seed=2003&scenario=error')
    await setMatchOptions(page, { durationSeconds: 60, spawnIntervalSeconds: 1.5 })
    await startGame(page)
    await stepUntilEnded(page)

    await expect(page.getByText(/Pending/)).toBeVisible({ timeout: 10_000 })
    expect(await queueLength()).toBe(1)

    await page.goto('/')
    await page.getByRole('tab', { name: 'History' }).click()
    await expect(page.locator('tbody tr')).toHaveCount(1)
    await expect.poll(queueLength).toBe(0)

    // Another reload must not register it again.
    await page.reload()
    await page.getByRole('tab', { name: 'History' }).click()
    await expect(page.locator('tbody tr')).toHaveCount(1)
  })
})

test.describe('mobile virtual joystick', () => {
  function onlyOnMobile() {
    test.skip(test.info().project.name !== 'chromium-mobile', 'touch layout only exists on the mobile project')
  }

  async function joystickGeometry(page: Page) {
    const box = await page.locator('[data-joystick]').boundingBox()
    if (!box) throw new Error('joystick not rendered')
    const radius = box.width / 2
    return { cx: box.x + radius, cy: box.y + box.height / 2, radius }
  }

  test('dragging the joystick steers the ship and speed follows the distance from center', async ({ page }) => {
    onlyOnMobile()
    await gotoWithSeed(page, 2004)
    await startGame(page)
    await expect(page.getByRole('button', { name: 'turn left' })).toHaveCount(0) // no D-pad anymore

    const { cx, cy, radius } = await joystickGeometry(page)
    const start = (await getSimState(page)).player

    // Full push to the east: the ship turns from north to east, then sails east.
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx + radius, cy, { steps: 4 })
    await step(page, 60)
    const aligned = (await getSimState(page)).player
    // Heading is wrapped into [0, 2π), so "east" may read as ~0 or ~2π.
    expect(Math.abs(Math.sin(aligned.heading))).toBeLessThan(0.1)
    expect(Math.cos(aligned.heading)).toBeGreaterThan(0.9)
    expect(aligned.position.x).toBeGreaterThan(start.position.x)

    const fullBefore = aligned.position.x
    await step(page, 60)
    const fullDx = (await getSimState(page)).player.position.x - fullBefore

    // Partial push (~55% of the radius): clearly slower, but still moving.
    await page.mouse.move(cx + radius * 0.55, cy, { steps: 4 })
    const halfBefore = (await getSimState(page)).player.position.x
    await step(page, 60)
    const halfDx = (await getSimState(page)).player.position.x - halfBefore
    await page.mouse.up()

    expect(halfDx).toBeGreaterThan(fullDx * 0.3)
    expect(halfDx).toBeLessThan(fullDx * 0.7)

    // Releasing stops the ship.
    const stopped = (await getSimState(page)).player.position
    await step(page, 30)
    expect((await getSimState(page)).player.position).toEqual(stopped)
  })

  test('the fire button shoots after the joystick has steered the ship', async ({ page }) => {
    onlyOnMobile()
    await gotoWithSeed(page, 2005)
    await startGame(page)

    const { cx, cy, radius } = await joystickGeometry(page)
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await page.mouse.move(cx - radius, cy, { steps: 4 })
    await step(page, 10)
    await page.mouse.up()

    const fire = await page.locator('[data-touch-action="fire-front"]').boundingBox()
    if (!fire) throw new Error('fire button not rendered')
    await page.mouse.move(fire.x + fire.width / 2, fire.y + fire.height / 2)
    await page.mouse.down()
    await step(page, 2)
    await page.mouse.up()

    expect((await getSimState(page)).projectiles.length).toBeGreaterThanOrEqual(1)
  })
})
