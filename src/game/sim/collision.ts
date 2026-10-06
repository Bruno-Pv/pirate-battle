import { gameConfig } from '../../config/gameConfig'
import { islandPlacements } from '../arenaLayout'
import type { Vector2 } from './types'
import { normalize } from './vectors'

/** Clamps a desired position to the arena bounds and pushes it out of any island it would overlap. */
export function resolvePosition(desired: Vector2, radius: number): Vector2 {
  return resolveIslandCollisions(clampToArena(desired, radius), radius)
}

export function circlesOverlap(a: Vector2, radiusA: number, b: Vector2, radiusB: number): boolean {
  const minDist = radiusA + radiusB
  return distanceSquared(a, b) < minDist * minDist
}

export function overlapsAnyIsland(p: Vector2, radius: number): boolean {
  return islandPlacements.some((island) => circlesOverlap(p, radius, island, island.collisionRadius))
}

const AVOID_LOOKAHEAD_PX = 50

/**
 * Deflects a desired travel direction around the nearest island blocking it, so seeking entities
 * slide along the obstacle's edge instead of pushing straight into it and stalling.
 */
export function steerAroundIslands(position: Vector2, desiredDir: Vector2, radius: number): Vector2 {
  let blocker: { x: number; y: number; distance: number } | null = null

  for (const island of islandPlacements) {
    const toIsland = { x: island.x - position.x, y: island.y - position.y }
    const dist = Math.hypot(toIsland.x, toIsland.y)
    const combined = radius + island.collisionRadius + AVOID_LOOKAHEAD_PX
    if (dist >= combined) continue

    const alignment = (toIsland.x * desiredDir.x + toIsland.y * desiredDir.y) / (dist || 1)
    if (alignment <= 0) continue // island isn't ahead of us

    if (!blocker || dist < blocker.distance) {
      blocker = { x: island.x, y: island.y, distance: dist }
    }
  }

  if (!blocker) return desiredDir

  const toBlocker = { x: blocker.x - position.x, y: blocker.y - position.y }
  const tangentA = normalize({ x: -toBlocker.y, y: toBlocker.x })
  const tangentB = normalize({ x: toBlocker.y, y: -toBlocker.x })
  const dotA = tangentA.x * desiredDir.x + tangentA.y * desiredDir.y
  const dotB = tangentB.x * desiredDir.x + tangentB.y * desiredDir.y
  return dotA >= dotB ? tangentA : tangentB
}

export function distance(a: Vector2, b: Vector2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function distanceSquared(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
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
