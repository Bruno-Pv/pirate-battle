import { gameConfig } from '../../config/gameConfig'
import type { PlayerIntent } from '../input/types'
import { circlesOverlap, overlapsAnyIsland, resolvePosition, steerAroundIslands } from './collision'
import { enemyConfig } from './enemyConfig'
import { createRng } from './rng'
import { pickEnemyKind, pickSpawnPosition } from './spawning'
import type { Enemy, GameEvent, MatchSettings, Projectile, ShipState, SimState, Vector2 } from './types'
import { add, addScaled, headingForward, headingRight, length, normalize, scale, subtract } from './vectors'

const TWO_PI = Math.PI * 2

export function createInitialState(seed: number, matchSettings: MatchSettings): SimState {
  return {
    status: 'playing',
    elapsedSeconds: 0,
    score: 0,
    player: {
      position: { x: gameConfig.arena.width / 2, y: gameConfig.arena.height / 2 },
      heading: -Math.PI / 2,
      hp: gameConfig.player.maxHp,
    },
    weaponCooldowns: { front: 0, left: 0, right: 0 },
    enemies: [],
    projectiles: [],
    spawnCooldown: matchSettings.spawnIntervalSeconds,
    nextEntityId: 1,
    rng: createRng(seed),
    matchSettings,
  }
}

export interface StepResult {
  readonly state: SimState
  readonly events: readonly GameEvent[]
}

export function stepSimulation(state: SimState, intent: PlayerIntent, dt: number): StepResult {
  if (state.status === 'ended') {
    return { state, events: [] }
  }

  const events: GameEvent[] = []

  let next = state
  next = stepPlayerMovement(next, intent, dt)
  next = stepPlayerWeapons(next, intent, dt, events)
  next = stepEnemies(next, dt, events)
  next = stepProjectiles(next, dt)
  next = resolveCombat(next, events)
  next = stepSpawning(next, dt)

  const elapsedSeconds = next.elapsedSeconds + dt
  const matchTimedOut = elapsedSeconds >= next.matchSettings.durationSeconds
  const playerDied = next.player.hp <= 0

  return {
    state: {
      ...next,
      elapsedSeconds,
      status: matchTimedOut || playerDied ? 'ended' : 'playing',
    },
    events,
  }
}

function stepPlayerMovement(state: SimState, intent: PlayerIntent, dt: number): SimState {
  const heading = wrapAngle(state.player.heading + intent.turn * gameConfig.player.turnSpeed * dt)

  let position = state.player.position
  if (intent.thrust !== 0) {
    const forward = headingForward(heading)
    const desired = addScaled(position, forward, gameConfig.player.moveSpeed * intent.thrust * dt)
    position = resolvePosition(desired, gameConfig.player.collisionRadius)
  }

  return { ...state, player: { ...state.player, position, heading } }
}

function stepPlayerWeapons(state: SimState, intent: PlayerIntent, dt: number, events: GameEvent[]): SimState {
  let front = Math.max(0, state.weaponCooldowns.front - dt)
  let left = Math.max(0, state.weaponCooldowns.left - dt)
  let right = Math.max(0, state.weaponCooldowns.right - dt)

  let projectiles = state.projectiles
  let nextEntityId = state.nextEntityId
  const forward = headingForward(state.player.heading)
  const rightVector = headingRight(state.player.heading)

  if (intent.fireFront && front <= 0) {
    const origin = addScaled(state.player.position, forward, gameConfig.weapons.front.mountOffset)
    projectiles = [
      ...projectiles,
      makeProjectile(nextEntityId, 'player', origin, scale(forward, gameConfig.projectile.speed), gameConfig.weapons.front.damage),
    ]
    events.push({ type: 'shotFired', position: origin, faction: 'player' })
    nextEntityId += 1
    front = gameConfig.weapons.front.cooldownSeconds
  }

  if (intent.fireLeft && left <= 0) {
    ;({ projectiles, nextEntityId } = fireBroadside(state.player.position, forward, rightVector, -1, projectiles, nextEntityId, events))
    left = gameConfig.weapons.side.cooldownSeconds
  }

  if (intent.fireRight && right <= 0) {
    ;({ projectiles, nextEntityId } = fireBroadside(state.player.position, forward, rightVector, 1, projectiles, nextEntityId, events))
    right = gameConfig.weapons.side.cooldownSeconds
  }

  return { ...state, weaponCooldowns: { front, left, right }, projectiles, nextEntityId }
}

function fireBroadside(
  shipPosition: Vector2,
  forward: Vector2,
  rightVector: Vector2,
  side: -1 | 1,
  projectiles: readonly Projectile[],
  nextEntityId: number,
  events: GameEvent[],
): { projectiles: readonly Projectile[]; nextEntityId: number } {
  let result = projectiles
  let id = nextEntityId
  for (const forwardOffset of gameConfig.weapons.side.mountOffsets) {
    const origin = add(
      addScaled(shipPosition, forward, forwardOffset),
      scale(rightVector, side * gameConfig.weapons.side.lateralOffset),
    )
    const velocity = scale(rightVector, side * gameConfig.projectile.speed)
    result = [...result, makeProjectile(id, 'player', origin, velocity, gameConfig.weapons.side.damage)]
    events.push({ type: 'shotFired', position: origin, faction: 'player' })
    id += 1
  }
  return { projectiles: result, nextEntityId: id }
}

function makeProjectile(
  id: number,
  faction: Projectile['faction'],
  position: Vector2,
  velocity: Vector2,
  damage: number,
): Projectile {
  return { id, faction, position, velocity, damage, remainingRangePx: gameConfig.projectile.rangePx }
}

function stepEnemies(state: SimState, dt: number, events: GameEvent[]): SimState {
  let nextEntityId = state.nextEntityId
  let projectiles = state.projectiles
  const enemies: Enemy[] = []

  for (const enemy of state.enemies) {
    const stepped =
      enemy.kind === 'chaser'
        ? stepChaser(enemy, state.player, dt, nextEntityId)
        : stepShooter(enemy, state.player, dt, nextEntityId)

    nextEntityId = stepped.nextEntityId
    if (stepped.projectile) {
      projectiles = [...projectiles, stepped.projectile]
      events.push({ type: 'shotFired', position: stepped.projectile.position, faction: 'enemy' })
    }
    enemies.push(stepped.enemy)
  }

  return { ...state, enemies, projectiles, nextEntityId }
}

interface EnemyStepResult {
  enemy: Enemy
  nextEntityId: number
  projectile: Projectile | null
}

function stepChaser(enemy: Enemy, player: ShipState, dt: number, nextEntityId: number): EnemyStepResult {
  const cfg = gameConfig.enemies.chaser
  const toPlayer = subtract(player.position, enemy.position)
  const dist = length(toPlayer)
  const heading = dist > 0 ? Math.atan2(toPlayer.y, toPlayer.x) : enemy.heading
  const moveDir = steerAroundIslands(enemy.position, normalize(toPlayer), cfg.collisionRadius)
  const desired = addScaled(enemy.position, moveDir, cfg.moveSpeed * dt)
  const position = resolvePosition(desired, cfg.collisionRadius)

  return {
    enemy: { ...enemy, position, heading, contactCooldown: Math.max(0, enemy.contactCooldown - dt) },
    nextEntityId,
    projectile: null,
  }
}

function stepShooter(enemy: Enemy, player: ShipState, dt: number, nextEntityId: number): EnemyStepResult {
  const cfg = gameConfig.enemies.shooter
  const toPlayer = subtract(player.position, enemy.position)
  const dist = length(toPlayer)
  const heading = dist > 0 ? Math.atan2(toPlayer.y, toPlayer.x) : enemy.heading

  // Approach while out of range, hold position in the attack band, retreat if the player
  // closes inside minDistancePx — always keeping the heading (and thus aim) on the player.
  let position = enemy.position
  if (dist > cfg.attackRangePx) {
    const moveDir = steerAroundIslands(enemy.position, normalize(toPlayer), cfg.collisionRadius)
    const desired = addScaled(enemy.position, moveDir, cfg.moveSpeed * dt)
    position = resolvePosition(desired, cfg.collisionRadius)
  } else if (dist < cfg.minDistancePx) {
    const awayFromPlayer = scale(normalize(toPlayer), -1)
    const moveDir = steerAroundIslands(enemy.position, awayFromPlayer, cfg.collisionRadius)
    const desired = addScaled(enemy.position, moveDir, cfg.moveSpeed * dt)
    position = resolvePosition(desired, cfg.collisionRadius)
  }

  const fireCooldown = Math.max(0, enemy.fireCooldown - dt)
  const contactCooldown = Math.max(0, enemy.contactCooldown - dt)

  const shouldFire = dist <= cfg.attackRangePx && fireCooldown <= 0
  if (!shouldFire) {
    return { enemy: { ...enemy, position, heading, fireCooldown, contactCooldown }, nextEntityId, projectile: null }
  }

  const projectile = makeProjectile(nextEntityId, 'enemy', enemy.position, scale(normalize(toPlayer), gameConfig.projectile.speed), cfg.projectileDamage)
  return {
    enemy: { ...enemy, position, heading, fireCooldown: cfg.fireCooldownSeconds, contactCooldown },
    nextEntityId: nextEntityId + 1,
    projectile,
  }
}

function stepProjectiles(state: SimState, dt: number): SimState {
  const projectiles = state.projectiles
    .map((projectile) => {
      const traveled = length(projectile.velocity) * dt
      return {
        ...projectile,
        position: addScaled(projectile.position, projectile.velocity, dt),
        remainingRangePx: projectile.remainingRangePx - traveled,
      }
    })
    .filter(
      (projectile) =>
        projectile.remainingRangePx > 0 &&
        isInsideArena(projectile.position) &&
        !overlapsAnyIsland(projectile.position, gameConfig.projectile.collisionRadius),
    )

  return { ...state, projectiles }
}

function resolveCombat(state: SimState, events: GameEvent[]): SimState {
  const enemyHits = new Map<number, number>()
  const consumedProjectileIds = new Set<number>()
  let playerDamage = 0

  for (const projectile of state.projectiles) {
    if (projectile.faction !== 'player' || consumedProjectileIds.has(projectile.id)) continue
    for (const enemy of state.enemies) {
      if (circlesOverlap(projectile.position, gameConfig.projectile.collisionRadius, enemy.position, enemyConfig(enemy.kind).collisionRadius)) {
        consumedProjectileIds.add(projectile.id)
        enemyHits.set(enemy.id, (enemyHits.get(enemy.id) ?? 0) + projectile.damage)
        break
      }
    }
  }

  for (const projectile of state.projectiles) {
    if (projectile.faction !== 'enemy' || consumedProjectileIds.has(projectile.id)) continue
    if (circlesOverlap(projectile.position, gameConfig.projectile.collisionRadius, state.player.position, gameConfig.player.collisionRadius)) {
      consumedProjectileIds.add(projectile.id)
      playerDamage += projectile.damage
    }
  }

  let score = state.score
  const afterWeaponDamage: Enemy[] = []
  for (const enemy of state.enemies) {
    const damage = enemyHits.get(enemy.id) ?? 0
    if (damage <= 0) {
      afterWeaponDamage.push(enemy)
      continue
    }
    const hp = enemy.hp - damage
    if (hp <= 0) {
      score += gameConfig.scoring.pointsPerKill
      events.push({ type: 'enemyDestroyed', position: enemy.position, cause: 'weapon' })
      continue
    }
    afterWeaponDamage.push({ ...enemy, hp })
  }

  const enemies: Enemy[] = []
  for (const enemy of afterWeaponDamage) {
    const radius = enemyConfig(enemy.kind).collisionRadius
    const touchingPlayer = circlesOverlap(enemy.position, radius, state.player.position, gameConfig.player.collisionRadius)

    if (!touchingPlayer || enemy.contactCooldown > 0) {
      enemies.push(enemy)
      continue
    }

    playerDamage += enemyConfig(enemy.kind).contactDamage

    if (enemy.kind === 'chaser') {
      events.push({ type: 'enemyDestroyed', position: enemy.position, cause: 'contact' })
      continue // self-destructs on impact, no score awarded
    }

    enemies.push({ ...enemy, contactCooldown: gameConfig.enemies.contactDamageCooldownSeconds })
  }

  const projectiles = state.projectiles.filter((projectile) => !consumedProjectileIds.has(projectile.id))
  const player =
    playerDamage > 0 ? { ...state.player, hp: Math.max(0, state.player.hp - playerDamage) } : state.player

  if (playerDamage > 0) {
    events.push({ type: 'playerHit', position: state.player.position })
  }

  return { ...state, enemies, projectiles, player, score }
}

function stepSpawning(state: SimState, dt: number): SimState {
  const spawnCooldown = state.spawnCooldown - dt
  if (spawnCooldown > 0) {
    return { ...state, spawnCooldown }
  }
  if (state.enemies.length >= gameConfig.spawn.maxAliveEnemies) {
    return { ...state, spawnCooldown: state.matchSettings.spawnIntervalSeconds }
  }

  const [kind, afterKind] = pickEnemyKind(state.rng)
  const [position, afterPosition] = pickSpawnPosition(afterKind, state.player.position, enemyConfig(kind).collisionRadius)

  const enemy: Enemy = {
    id: state.nextEntityId,
    kind,
    position,
    heading: 0,
    hp: enemyConfig(kind).maxHp,
    fireCooldown: gameConfig.enemies.shooter.fireCooldownSeconds,
    contactCooldown: 0,
  }

  return {
    ...state,
    enemies: [...state.enemies, enemy],
    nextEntityId: state.nextEntityId + 1,
    spawnCooldown: state.matchSettings.spawnIntervalSeconds,
    rng: afterPosition,
  }
}

function isInsideArena(p: Vector2): boolean {
  return p.x >= 0 && p.x <= gameConfig.arena.width && p.y >= 0 && p.y <= gameConfig.arena.height
}

function wrapAngle(angle: number): number {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI
}
