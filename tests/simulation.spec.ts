import { expect, test } from '@playwright/test'
import { gameConfig } from '../src/config/gameConfig'
import { NEUTRAL_INTENT, type PlayerIntent } from '../src/game/input/types'
import { createInitialState, stepSimulation } from '../src/game/sim/simulation'
import { distance } from '../src/game/sim/collision'
import type { Enemy, EnemyKind, SimState, Vector2 } from '../src/game/sim/types'

// Pure simulation rules, exercised directly (no browser): fast and fully deterministic.
test.beforeEach(() => {
  test.skip(test.info().project.name !== 'chromium-desktop', 'pure logic: one project is enough')
})

const DT = 1 / 60
const CENTER: Vector2 = { x: gameConfig.arena.width / 2, y: gameConfig.arena.height / 2 }

function baseState(overrides: Partial<SimState> = {}, spawnIntervalSeconds = 1000): SimState {
  return { ...createInitialState(1, { durationSeconds: 120, spawnIntervalSeconds }), ...overrides }
}

function enemy(kind: EnemyKind, position: Vector2, overrides: Partial<Enemy> = {}): Enemy {
  const hp = kind === 'chaser' ? gameConfig.enemies.chaser.maxHp : gameConfig.enemies.shooter.maxHp
  return { id: 100, kind, position, heading: 0, hp, fireCooldown: 0, contactCooldown: 0, ...overrides }
}

function run(state: SimState, frames: number, intent: PlayerIntent = NEUTRAL_INTENT) {
  let current = state
  const events: ReturnType<typeof stepSimulation>['events'][number][] = []
  for (let i = 0; i < frames; i += 1) {
    const result = stepSimulation(current, intent, DT)
    current = result.state
    events.push(...result.events)
  }
  return { state: current, events }
}

test.describe('spawn interval', () => {
  test('enemies appear once per configured interval, away from the player', () => {
    const interval = 2
    let state = baseState({}, interval)
    const firstSeen = new Map<number, number>()
    for (let frame = 1; frame <= 60 * 7 && state.status === 'playing'; frame += 1) {
      state = stepSimulation(state, NEUTRAL_INTENT, DT).state
      for (const e of state.enemies) {
        if (!firstSeen.has(e.id)) {
          firstSeen.set(e.id, frame * DT)
          expect(distance(e.position, CENTER)).toBeGreaterThanOrEqual(gameConfig.spawn.minDistanceFromPlayerPx - 1)
        }
      }
    }
    const times = [...firstSeen.values()]
    expect(times.length).toBeGreaterThanOrEqual(3)
    expect(times[0]).toBeCloseTo(interval, 1)
    expect(times[1] - times[0]).toBeCloseTo(interval, 1)
    expect(times[2] - times[1]).toBeCloseTo(interval, 1)
  })

  test('no enemy exists before the first interval elapses', () => {
    const { state } = run(baseState({}, 3), 60 * 3 - 5)
    expect(state.enemies).toHaveLength(0)
  })
})

test.describe('Chaser', () => {
  test('moves straight toward the player at its configured speed', () => {
    const start: Vector2 = { x: CENTER.x, y: 150 }
    const before = distance(start, CENTER)
    const { state } = run(baseState({ enemies: [enemy('chaser', start)] }), 60)
    const closed = before - distance(state.enemies[0].position, CENTER)
    expect(closed).toBeGreaterThan(gameConfig.enemies.chaser.moveSpeed - 6)
    expect(closed).toBeLessThanOrEqual(gameConfig.enemies.chaser.moveSpeed + 1)
  })

  test('hits once on contact, then self-destructs without awarding score', () => {
    const touching: Vector2 = { x: CENTER.x + 30, y: CENTER.y }
    const { state, events } = run(baseState({ enemies: [enemy('chaser', touching)] }), 120)
    expect(state.player.hp).toBe(gameConfig.player.maxHp - gameConfig.enemies.chaser.contactDamage)
    expect(state.enemies).toHaveLength(0)
    expect(state.score).toBe(0)
    expect(events.filter((e) => e.type === 'playerHit')).toHaveLength(1)
  })
})

test.describe('Shooter', () => {
  test('approaches until in range, then holds its distance', () => {
    const start: Vector2 = { x: CENTER.x, y: CENTER.y - 400 }
    const { state } = run(baseState({ enemies: [enemy('shooter', start, { fireCooldown: 99 })] }), 60 * 4)
    const d = distance(state.enemies[0].position, CENTER)
    expect(d).toBeLessThanOrEqual(gameConfig.enemies.shooter.attackRangePx + 2)
    expect(d).toBeGreaterThan(gameConfig.enemies.shooter.minDistancePx)
  })

  test('retreats when the player is closer than its minimum distance', () => {
    const start: Vector2 = { x: CENTER.x, y: CENTER.y - 100 }
    const { state } = run(baseState({ enemies: [enemy('shooter', start, { fireCooldown: 99 })] }), 30)
    expect(distance(state.enemies[0].position, CENTER)).toBeGreaterThan(100 + 30)
  })

  test('fires only when in range and no faster than its cooldown', () => {
    const outOfRange: Vector2 = { x: CENTER.x, y: CENTER.y - 420 }
    const first = run(baseState({ enemies: [enemy('shooter', outOfRange)] }), 20)
    expect(first.events.filter((e) => e.type === 'shotFired')).toHaveLength(0)

    const inRange: Vector2 = { x: CENTER.x, y: CENTER.y - 250 }
    const shots = run(baseState({ enemies: [enemy('shooter', inRange)] }), 60 * 3).events.filter(
      (e) => e.type === 'shotFired' && e.faction === 'enemy',
    )
    // Immediately, then every 1.4s: 0s, 1.4s, 2.8s within 3s.
    expect(shots.length).toBe(3)
  })
})

test.describe('damage, cooldown and score', () => {
  test('a Shooter in contact damages the player once per cooldown, not every frame', () => {
    const touching: Vector2 = { x: CENTER.x + 40, y: CENTER.y }
    const cfg = gameConfig.enemies.shooter
    const { state } = run(baseState({ enemies: [enemy('shooter', touching, { fireCooldown: 99 })] }), 30)
    expect(state.player.hp).toBe(gameConfig.player.maxHp - cfg.contactDamage)
    const hitEnemy = state.enemies[0]
    expect(hitEnemy.contactCooldown).toBeGreaterThan(0)
    expect(hitEnemy.contactCooldown).toBeLessThanOrEqual(gameConfig.enemies.contactDamageCooldownSeconds)
  })

  test('a killed enemy scores exactly once, even with overlapping projectiles', () => {
    const target: Vector2 = { x: CENTER.x, y: CENTER.y - 150 }
    const weak = enemy('chaser', target, { hp: 1 })
    const intent: PlayerIntent = { ...NEUTRAL_INTENT, fireFront: true }
    const { state, events } = run(baseState({ enemies: [weak] }), 10, intent)
    expect(state.enemies.filter((e) => e.id === weak.id)).toHaveLength(0)
    expect(state.score).toBe(gameConfig.scoring.pointsPerKill)
    expect(events.filter((e) => e.type === 'enemyDestroyed' && e.cause === 'weapon')).toHaveLength(1)

    // Keep running with no enemy left: the score can't grow.
    expect(run(state, 120).state.score).toBe(gameConfig.scoring.pointsPerKill)
  })

  test('a weapon cannot fire again before its cooldown', () => {
    const intent: PlayerIntent = { ...NEUTRAL_INTENT, fireFront: true }
    const { events } = run(baseState(), 20, intent) // 0.33s < 0.35s cooldown
    expect(events.filter((e) => e.type === 'shotFired')).toHaveLength(1)
  })
})
