import { gameConfig } from '../../config/gameConfig'
import { islandPlacements } from '../arenaLayout'
import type { PlayerIntent } from '../input/types'
import type { ShipState, SimState, Vector2 } from './types'

const TWO_PI = Math.PI * 2

export function createInitialState(): SimState {
  return {
    elapsedSeconds: 0,
    player: {
      position: { x: gameConfig.arena.width / 2, y: gameConfig.arena.height / 2 },
      heading: -Math.PI / 2,
      hp: gameConfig.player.maxHp,
    },
  }
}

export function stepSimulation(state: SimState, intent: PlayerIntent, dt: number): SimState {
  return {
    elapsedSeconds: state.elapsedSeconds + dt,
    player: stepShip(state.player, intent, dt),
  }
}

function stepShip(ship: ShipState, intent: PlayerIntent, dt: number): ShipState {
  const heading = wrapAngle(ship.heading + intent.turn * gameConfig.player.turnSpeed * dt)

  if (intent.thrust === 0) {
    return { ...ship, heading }
  }

  const distance = gameConfig.player.moveSpeed * intent.thrust * dt
  const desired: Vector2 = {
    x: ship.position.x + Math.cos(heading) * distance,
    y: ship.position.y + Math.sin(heading) * distance,
  }
  const position = resolvePosition(desired, gameConfig.player.collisionRadius)

  return { ...ship, position, heading }
}

function resolvePosition(desired: Vector2, radius: number): Vector2 {
  return resolveIslandCollisions(clampToArena(desired, radius), radius)
}

function clampToArena(p: Vector2, radius: number): Vector2 {
  return {
    x: clamp(p.x, radius, gameConfig.arena.width - radius),
    y: clamp(p.y, radius, gameConfig.arena.height - radius),
  }
}

function resolveIslandCollisions(p: Vector2, radius: number): Vector2 {
  let result = p
  for (const island of islandPlacements) {
    const dx = result.x - island.x
    const dy = result.y - island.y
    const minDist = radius + island.collisionRadius
    const dist = Math.hypot(dx, dy)
    if (dist >= minDist) continue

    if (dist === 0) {
      result = { x: island.x, y: island.y - minDist }
      continue
    }
    const scale = minDist / dist
    result = { x: island.x + dx * scale, y: island.y + dy * scale }
  }
  return result
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function wrapAngle(angle: number): number {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI
}
